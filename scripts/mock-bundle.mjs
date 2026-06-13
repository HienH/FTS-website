// Generates a realistic mock public/bundle.json conforming to src/lib/bundle-types.ts.
// Replaced by the real pipeline output via `npm run sync:data`.
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const LEAGUES = [
  { id: "GB1", key: "premier-league", name: "Premier League", country: "England" },
  { id: "ES1", key: "la-liga", name: "La Liga", country: "Spain" },
  { id: "L1", key: "bundesliga", name: "Bundesliga", country: "Germany" },
  { id: "IT1", key: "serie-a", name: "Serie A", country: "Italy" },
  { id: "FR1", key: "ligue-1", name: "Ligue 1", country: "France" },
];

// [name, tmId, squadValue M€, revenue M€, tier] — values eyeballed, mock only
const CLUBS = {
  GB1: [
    ["Manchester City", "281", 1250, 840, 1],
    ["Arsenal", "11", 1150, 700, 1],
    ["Liverpool", "31", 1050, 720, 1],
    ["Brighton & Hove Albion", "1237", 520, 250, 2],
  ],
  ES1: [
    ["Real Madrid", "418", 1300, 870, 1],
    ["FC Barcelona", "131", 1000, 800, 1],
    ["Atlético de Madrid", "13", 600, 400, 2],
    ["Real Sociedad", "681", 420, 180, 2],
  ],
  L1: [
    ["Bayern Munich", "27", 950, 750, 1],
    ["Bayer 04 Leverkusen", "15", 700, 300, 2],
    ["Borussia Dortmund", "16", 650, 420, 2],
    ["VfB Stuttgart", "79", 380, 200, 3],
  ],
  IT1: [
    ["Inter Milan", "46", 700, 400, 1],
    ["Juventus", "506", 650, 430, 1],
    ["AC Milan", "5", 600, 400, 2],
    ["Atalanta", "800", 450, 200, 2],
  ],
  FR1: [
    ["Paris Saint-Germain", "583", 1100, 800, 1],
    ["AS Monaco", "162", 450, 250, 2],
    ["Olympique Marseille", "244", 400, 250, 2],
    ["LOSC Lille", "1082", 300, 150, 3],
  ],
};

const FIRST = ["Marco", "Luca", "James", "Kai", "Bruno", "Pedro", "Youssef", "Jan", "Nico", "Theo", "Rafael", "Emil", "Sergi", "Tom", "Moussa", "Andrés", "Felix", "Ibrahim", "Dani", "Hugo", "Lorenzo", "Mats", "Oscar", "Pavel", "Quentin"];
const LAST = ["Silva", "Müller", "Rossi", "García", "Dubois", "Smith", "Keita", "Janssen", "Costa", "Moretti", "Fernández", "Weber", "Laurent", "Brown", "Diallo", "Ricci", "Navarro", "Schmidt", "Mendes", "Traoré", "Bianchi", "Hoffmann", "Vidal", "Lemaire", "Okafor"];
const NATIONS = { GB1: "England", ES1: "Spain", L1: "Germany", IT1: "Italy", FR1: "France" };
const POSITIONS = [
  ["Goalkeeper", 3], ["Centre-Back", 4], ["Left-Back", 2], ["Right-Back", 2],
  ["Defensive Midfield", 3], ["Central Midfield", 3], ["Attacking Midfield", 2],
  ["Left Winger", 2], ["Right Winger", 2], ["Centre-Forward", 2],
];

// deterministic PRNG so refreshes are stable
let seed = 42;
function rnd() {
  seed = (seed * 1103515245 + 12345) % 2 ** 31;
  return seed / 2 ** 31;
}
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const M = 1_000_000;
const clubs = [];
const players = [];
let playerId = 100000;

for (const league of LEAGUES) {
  for (const [name, tmId, sqM, revM, tier] of CLUBS[league.id]) {
    const squadValue = sqM * M;
    const revenue = revM * M;
    const wageBill = Math.round(revenue * (0.5 + rnd() * 0.2));
    const budget = Math.round(Math.max(revenue * 0.25 - Math.max(0, wageBill - revenue * 0.6), 10 * M));
    const revEstimated = rnd() < 0.3;
    clubs.push({
      id: tmId,
      leagueId: league.id,
      name,
      crest: `https://tmssl.akamaized.net/images/wappen/head/${tmId}.png`,
      squadValue,
      wageBillAnnual: wageBill,
      wageBillCoverage: 0.85 + rnd() * 0.15,
      revenue: { value: revenue, estimated: revEstimated },
      budget: { value: budget, estimated: true, overridden: false },
    });

    let positions = POSITIONS.flatMap(([pos, n]) => Array(n).fill(pos));
    for (const pos of positions) {
      const isStar = rnd() < 0.15 * (4 - tier) * 0.5;
      const mv = Math.round(squadValue / 25 * (isStar ? 2.5 : 0.3 + rnd() * 1.2));
      const wage = Math.round(wageBill / 25 * (isStar ? 2.2 : 0.4 + rnd() * 1.2));
      const age = 18 + Math.floor(rnd() * 17);
      const contractYears = 1 + Math.floor(rnd() * 5);
      players.push({
        id: String(playerId++),
        clubId: tmId,
        name: `${pick(FIRST)} ${pick(LAST)}`,
        position: pos,
        age,
        nationality: [rnd() < 0.6 ? NATIONS[league.id] : pick(Object.values(NATIONS))],
        contractEnd: rnd() < 0.05 ? null : `${2026 + contractYears}-06-30`,
        marketValue: rnd() < 0.03 ? 0 : mv,
        wageAnnual: { value: wage, estimated: rnd() < 0.25 },
      });
    }
  }
}

const bundle = {
  version: 1,
  generatedAt: new Date().toISOString(),
  season: "2026/27",
  currency: "EUR",
  sources: { values: "Transfermarkt (mock)", wages: "Capology via FBref (mock)" },
  leagues: LEAGUES,
  clubs,
  players,
};

mkdirSync(join(root, "public"), { recursive: true });
writeFileSync(join(root, "public", "bundle.json"), JSON.stringify(bundle));
console.log(`mock bundle: ${clubs.length} clubs, ${players.length} players -> public/bundle.json`);
