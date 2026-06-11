import { Match } from './types';

export const INITIAL_MATCHES: Match[] = [];

const TEAMS: Record<string, string> = {
  "México": "mx", "África do Sul": "za", "Coreia do Sul": "kr", "Tchéquia": "cz",
  "Canadá": "ca", "Suíça": "ch", "Qatar": "qa", "Bósnia": "ba",
  "Brasil": "br", "Marrocos": "ma", "Haiti": "ht", "Escócia": "gb-sct",
  "EUA": "us", "Paraguai": "py", "Austrália": "au", "Turquia": "tr",
  "Alemanha": "de", "Curaçao": "cw", "Costa do Marfim": "ci", "Equador": "ec",
  "Holanda": "nl", "Japão": "jp", "Suécia": "se", "Tunísia": "tn",
  "Bélgica": "be", "Egito": "eg", "Irã": "ir", "Nova Zelândia": "nz",
  "Espanha": "es", "Cabo Verde": "cv", "Arábia Saudita": "sa", "Uruguai": "uy",
  "França": "fr", "Senegal": "sn", "Iraque": "iq", "Noruega": "no",
  "Argentina": "ar", "Argélia": "dz", "Áustria": "at", "Jordânia": "jo",
  "Portugal": "pt", "Colômbia": "co", "Uzbequistão": "uz", "Congo DR": "cd",
  "Inglaterra": "gb-eng", "Croácia": "hr", "Gana": "gh", "Panamá": "pa"
};

const GROUPS_DEF = [
  { group: "A", matches: [
    ["México", "África do Sul"], ["Coreia do Sul", "Tchéquia"],
    ["Tchéquia", "África do Sul"], ["México", "Coreia do Sul"],
    ["Tchéquia", "México"], ["África do Sul", "Coreia do Sul"]
  ]},
  { group: "B", matches: [
    ["Canadá", "Bósnia"], ["Qatar", "Suíça"],
    ["Suíça", "Bósnia"], ["Canadá", "Qatar"],
    ["Suíça", "Canadá"], ["Bósnia", "Qatar"]
  ]},
  { group: "C", matches: [
    ["Brasil", "Marrocos"], ["Haiti", "Escócia"],
    ["Escócia", "Marrocos"], ["Brasil", "Haiti"],
    ["Escócia", "Brasil"], ["Marrocos", "Haiti"]
  ]},
  { group: "D", matches: [
    ["EUA", "Paraguai"], ["Austrália", "Turquia"],
    ["EUA", "Austrália"], ["Turquia", "Paraguai"],
    ["Turquia", "EUA"], ["Paraguai", "Austrália"]
  ]},
  { group: "E", matches: [
    ["Alemanha", "Curaçao"], ["Costa do Marfim", "Equador"],
    ["Alemanha", "Costa do Marfim"], ["Equador", "Curaçao"],
    ["Curaçao", "Costa do Marfim"], ["Equador", "Alemanha"]
  ]},
  { group: "F", matches: [
    ["Holanda", "Japão"], ["Suécia", "Tunísia"],
    ["Holanda", "Suécia"], ["Tunísia", "Japão"],
    ["Japão", "Suécia"], ["Tunísia", "Holanda"]
  ]},
  { group: "G", matches: [
    ["Bélgica", "Egito"], ["Irã", "Nova Zelândia"],
    ["Bélgica", "Irã"], ["Nova Zelândia", "Egito"],
    ["Egito", "Irã"], ["Nova Zelândia", "Bélgica"]
  ]},
  { group: "H", matches: [
    ["Espanha", "Cabo Verde"], ["Arábia Saudita", "Uruguai"],
    ["Espanha", "Arábia Saudita"], ["Uruguai", "Cabo Verde"],
    ["Cabo Verde", "Arábia Saudita"], ["Uruguai", "Espanha"]
  ]},
  { group: "I", matches: [
    ["França", "Senegal"], ["Iraque", "Noruega"],
    ["França", "Iraque"], ["Noruega", "Senegal"],
    ["Noruega", "França"], ["Senegal", "Iraque"]
  ]},
  { group: "J", matches: [
    ["Argentina", "Argélia"], ["Áustria", "Jordânia"],
    ["Argentina", "Áustria"], ["Jordânia", "Argélia"],
    ["Argélia", "Áustria"], ["Jordânia", "Argentina"]
  ]},
  { group: "K", matches: [
    ["Portugal", "Congo DR"], ["Uzbequistão", "Colômbia"],
    ["Portugal", "Uzbequistão"], ["Colômbia", "Congo DR"],
    ["Colômbia", "Portugal"], ["Congo DR", "Uzbequistão"]
  ]},
  { group: "L", matches: [
    ["Inglaterra", "Croácia"], ["Gana", "Panamá"],
    ["Inglaterra", "Gana"], ["Panamá", "Croácia"],
    ["Panamá", "Inglaterra"], ["Croácia", "Gana"]
  ]}
];

let matchIdCounter = 1;

GROUPS_DEF.forEach((g, gIndex) => {
  g.matches.forEach((m, mIndex) => {
    let rodada = 1;
    if (mIndex >= 2 && mIndex <= 3) rodada = 2;
    if (mIndex >= 4) rodada = 3;

    const startDate = new Date('2026-06-11T12:00:00-03:00');
    const extraDays = (gIndex) + (rodada - 1) * 6;
    const matchDate = new Date(startDate.getTime() + (extraDays * 24 * 60 * 60 * 1000));
    
    if (mIndex % 2 !== 0) {
       matchDate.setTime(matchDate.getTime() + (4 * 60 * 60 * 1000));
    }

    INITIAL_MATCHES.push({
      id: `m_${matchIdCounter++}_r${rodada}`,
      phase: `Fase de Grupos - Rodada ${rodada}`,
      groupName: `Grupo ${g.group}`,
      teamA: m[0],
      teamAFlagCode: TEAMS[m[0]] || 'xx',
      teamB: m[1],
      teamBFlagCode: TEAMS[m[1]] || 'xx',
      date: matchDate.toISOString(),
      status: 'pending'
    });
  });
});

const START_DATE = new Date('2026-06-11T12:00:00-03:00');
const KNOCKOUT_START_DATE = new Date(START_DATE.getTime() + (18 * 24 * 60 * 60 * 1000));

function addKnockout(phaseTracker: string, phaseName: string, teamA: string, teamB: string, extraDays: number) {
  INITIAL_MATCHES.push({
    id: phaseTracker,
    phase: phaseName,
    groupName: '',
    teamA,
    teamAFlagCode: '',
    teamB,
    teamBFlagCode: '',
    date: new Date(KNOCKOUT_START_DATE.getTime() + (extraDays * 24 * 60 * 60 * 1000)).toISOString(),
    status: 'pending'
  });
}

let d = 0;
for(let i = 1; i <= 16; i++) {
  addKnockout(`16avos_${i}`, '16-Avos de Final', `1º ou 2º Colocado`, `2º ou 3º Colocado`, d);
  if (i % 4 === 0) d++;
}
for(let i = 1; i <= 8; i++) {
  addKnockout(`oitavas_${i}`, 'Oitavas de Final', `Vencedor 16-Avos`, `Vencedor 16-Avos`, d);
  if (i % 2 === 0) d++;
}
for(let i = 1; i <= 4; i++) {
  addKnockout(`quartas_${i}`, 'Quartas de Final', `Vencedor Oitavas`, `Vencedor Oitavas`, d);
  if (i % 2 === 0) d++;
}
addKnockout('semi_1', 'Semifinal', 'Vencedor Quartas', 'Vencedor Quartas', d);
addKnockout('semi_2', 'Semifinal', 'Vencedor Quartas', 'Vencedor Quartas', d + 1);
d += 2;
addKnockout('terceiro', 'Disputa 3º Lugar', 'Perdedor Semifinal', 'Perdedor Semifinal', d);
addKnockout('final', 'Final', 'Vencedor Semifinal', 'Vencedor Semifinal', d + 1);
