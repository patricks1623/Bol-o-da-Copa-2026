import { Group, Match, Prediction, User } from '../types';
import { calculatePoints, generateGroupCode, generateId } from '../utils';
import { INITIAL_MATCHES } from '../mockData';
import { db, auth } from './firebase';
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, query, where, writeBatch, onSnapshot } from 'firebase/firestore';

class FirebaseDBService {
  private async getMatchesOnce(): Promise<Match[]> {
    const q = query(collection(db, 'matches'));
    const snap = await getDocs(q);
    if (snap.empty || snap.size !== 104) {
      // Initialize or upgrade to 48-team format (104 matches total) - format v4
      const batch1 = writeBatch(db);
      snap.forEach(d => batch1.delete(d.ref));
      await batch1.commit();

      const batch2 = writeBatch(db);
      INITIAL_MATCHES.forEach(m => {
        batch2.set(doc(db, 'matches', m.id), m);
      });
      await batch2.commit();
      
      const newSnap = await getDocs(q);
      if(!newSnap.empty) {
         const returned: Match[] = [];
         newSnap.forEach(d => returned.push(d.data() as Match));
         return returned;
      }
      return INITIAL_MATCHES;
    }
    const matches: Match[] = [];
    snap.forEach(d => matches.push(d.data() as Match));
    return matches;
  }

  async getMatches(): Promise<Match[]> {
    return this.getMatchesOnce();
  }

  async createGroup(adminUser: User, groupName: string): Promise<Group> {
    const newGroup: Group = {
      id: generateId(),
      code: generateGroupCode(),
      name: groupName,
      adminId: adminUser.id,
      members: [adminUser]
    };
    await setDoc(doc(db, 'groups', newGroup.id), newGroup);
    return newGroup;
  }

  async joinGroup(user: User, code: string): Promise<Group> {
    const q = query(collection(db, 'groups'), where('code', '==', code.toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Grupo não encontrado. Verifique o código.');
    
    const groupDoc = snap.docs[0];
    const group = groupDoc.data() as Group;
    
    const existingMember = group.members.find(
      m => m.name.trim().toLowerCase() === user.name.trim().toLowerCase()
    );

    if (existingMember) {
      user.id = existingMember.id;
    } else {
      if (!group.members.find(m => m.id === user.id)) {
        group.members.push(user);
        await updateDoc(groupDoc.ref, { members: group.members });
      }
    }
    return group;
  }

  async updateUserProfile(groupId: string, user: User): Promise<void> {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (!groupDoc.exists()) throw new Error('Group not found');
    
    const group = groupDoc.data() as Group;
    const memberIndex = group.members.findIndex(m => m.id === user.id);
    if (memberIndex !== -1) {
      group.members[memberIndex] = user;
      await updateDoc(groupDoc.ref, { members: group.members });
    }
  }

  async updateGroupName(groupId: string, newName: string): Promise<void> {
    await updateDoc(doc(db, 'groups', groupId), { name: newName });
  }

  async getUserGroups(user: User): Promise<Group[]> {
    const q = query(collection(db, 'groups'));
    const snap = await getDocs(q);
    const groups: Group[] = [];
    snap.forEach(d => {
      const g = d.data() as Group;
      if (g.members.some(m => m.id === user.id)) {
        groups.push(g);
      }
    });
    return groups;
  }

  async getGroupPredictions(groupId: string): Promise<Prediction[]> {
    const q = query(collection(db, 'predictions'), where('groupId', '==', groupId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Prediction);
  }

  async getMyPredictions(userId: string, groupId: string): Promise<Prediction[]> {
    const q = query(collection(db, 'predictions'), where('groupId', '==', groupId), where('userId', '==', userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Prediction);
  }

  async savePrediction(pred: Omit<Prediction, 'id' | 'points'>): Promise<Prediction> {
    const q = query(collection(db, 'predictions'), where('groupId', '==', pred.groupId), where('userId', '==', pred.userId), where('matchId', '==', pred.matchId));
    const snap = await getDocs(q);
    
    let savedPred: Prediction;
    
    if (!snap.empty) {
      savedPred = { ...snap.docs[0].data(), scoreA: pred.scoreA, scoreB: pred.scoreB } as Prediction;
      await updateDoc(snap.docs[0].ref, { scoreA: pred.scoreA, scoreB: pred.scoreB });
    } else {
      savedPred = { ...pred, id: generateId() };
      await setDoc(doc(db, 'predictions', savedPred.id), savedPred);
    }
    
    return savedPred;
  }

  async getBonusPrediction(userId: string, groupId: string): Promise<any> {
    const docRef = doc(db, 'bonusPredictions', `${groupId}_${userId}`);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
    return { userId, groupId, champion: '', topScorer: '' };
  }

  async saveBonusPrediction(userId: string, groupId: string, data: any): Promise<void> {
    const docRef = doc(db, 'bonusPredictions', `${groupId}_${userId}`);
    await setDoc(docRef, { ...data, userId, groupId }, { merge: true });
  }

  async finishMatch(matchId: string, realScoreA: number, realScoreB: number, groupId: string): Promise<void> {
    // 1. Atualizar o Match
    await updateDoc(doc(db, 'matches', matchId), { realScoreA, realScoreB, status: 'finished' });

    // 2. Localmente atualizar pontos para não precisar de Cloud Functions por agora
    const predsQuery = query(collection(db, 'predictions'), where('matchId', '==', matchId));
    const predsSnap = await getDocs(predsQuery);
    
    const batch = writeBatch(db);
    predsSnap.forEach(snap => {
      const p = snap.data() as Prediction;
      const points = calculatePoints(p.scoreA, p.scoreB, realScoreA, realScoreB);
      batch.update(snap.ref, { points });
    });
    await batch.commit();
  }
  async getGroup(groupId: string): Promise<Group | null> {
    const d = await getDoc(doc(db, 'groups', groupId));
    return d.exists() ? d.data() as Group : null;
  }

  listenGroup(groupId: string, callback: (group: Group) => void): () => void {
    return onSnapshot(doc(db, 'groups', groupId), (snap) => {
      if (snap.exists()) {
        callback(snap.data() as Group);
      }
    });
  }

  listenMatches(callback: (matches: Match[]) => void): () => void {
    return onSnapshot(collection(db, 'matches'), (snap) => {
      const matches: Match[] = [];
      snap.forEach(d => matches.push(d.data() as Match));
      if (matches.length > 0) {
        callback(matches);
      }
    });
  }
}

export const dbId = generateId;
export const dbService = new FirebaseDBService();
