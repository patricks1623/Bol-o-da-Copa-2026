import { initializeApp } from 'firebase/app';
import { getFirestore, query, collection, getDocs, deleteDoc, writeBatch, doc } from 'firebase/firestore';
import { INITIAL_MATCHES } from './src/mockData';
import fs from 'fs';

const raw = fs.readFileSync('./firebase-applet-config.json', 'utf8');
const config = JSON.parse(raw);

const app = initializeApp(config);
const db = getFirestore(app);

async function check() {
  const q = query(collection(db, 'matches'));
  const snap = await getDocs(q);
  console.log("Current matches in DB:", snap.size);
  
  if (snap.size < 100) {
     console.log("Re-seeding db...");
     const batch = writeBatch(db);
     snap.forEach(d => batch.delete(d.ref));
     await batch.commit();

     const batch2 = writeBatch(db);
     INITIAL_MATCHES.forEach(m => batch2.set(doc(db, 'matches', m.id), m));
     await batch2.commit();
     console.log("Re-seeded with", INITIAL_MATCHES.length, "matches");
  } else {
     let groups = new Set();
     snap.forEach(d => groups.add(d.data().groupName));
     console.log("Groups in DB:", Array.from(groups));
  }
}
check();
