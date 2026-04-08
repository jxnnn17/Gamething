
(() => {
const W = 50;
const H = 20;
const CELL = 24;
const LEVELS = 20;
const GOAL_TIME = 5;
const EPS = 0.0001;
const BUILD_SIZE = 9;
const LEVEL_BUILD_POS = { x: 2, y: 5 };
const SCORE_BUILD_POS = { x: Math.floor((W - BUILD_SIZE) / 2), y: Math.floor((H - BUILD_SIZE) / 2) };
const BUILD_ZOOM = 1.18;
const UPDATE_VERSION = "1.1.00-meta";
const BUILD = { x: LEVEL_BUILD_POS.x, y: LEVEL_BUILD_POS.y, w: BUILD_SIZE, h: BUILD_SIZE };
const SIDES = ["up", "right", "down", "left"];
const DIRS = ["left", "right", "up", "down"];
const MAX_GUN_ATTACHMENTS = 4;
const BULLET_RANGE_TILES = 10;
const MAX_YELLOW_MINI = 96;
const MAX_RED_MINI = 56;
const GREEN_CUBE_SPAWN_CHANCE = 0.1;
const SCORE_100_COUNTS = { blue: 4, white: 4, yellow: 3 };
const WORKSTATION_SIZE = 21;
const WORKSTATION_HALF = Math.floor(WORKSTATION_SIZE / 2);
const WORKSTATION_GAP = 200;
const WORKSTATION_TTL = 20;
const DEV_PASSWORD = "nignig-dev";
const META_SAVE_KEY = "redCubeMetaProgress";
const META_DEFAULT = {
  shards: 0,
  upgrades: {
    dropBoost: 0,
    gunCap: 0,
    workstation: 0
  }
};

const TOOLS = [
  ["place-player", "Place Cube"],
  ["move-left", "Move Left"],
  ["move-right", "Move Right"],
  ["move-up", "Move Up"],
  ["move-down", "Move Down"],
  ["gun", "Gun"],
  ["upgrade", "Upgrade"],
  ["bomb", "Bomb"],
  ["stabilizer", "Stabilizer"],
  ["erase", "Erase Side"]
];

const TOOL_ICONS = {
  "place-player": "\u25A0",
  "move-left": "\u2190",
  "move-right": "\u2192",
  "move-up": "\u2191",
  "move-down": "\u2193",
  "gun": "\u25A3",
  "upgrade": "\u2736",
  "bomb": "\u25CF",
  "stabilizer": "\u25C9",
  "erase": "\u2715"
};

const HELP = {
  "place-player": "Place the red cube only inside the 9x9 setup grid.",
  "move-left": "Place a LEFT movement cube in a neighboring setup cell.",
  "move-right": "Place a RIGHT movement cube in a neighboring setup cell.",
  "move-up": "Place an UP movement cube in a neighboring setup cell.",
  "move-down": "Place a DOWN movement cube in a neighboring setup cell.",
  "gun": "Gun shoots only in the side direction where it is attached (press G).",
  "upgrade": "Only one upgrade module allowed. It boosts attachment damage by +0.04 each kill in Score Mode.",
  "bomb": "Bomb can be triggered with B and has a 15s cooldown. Enemies trigger the explosion.",
  "stabilizer": "Stabilizers can only be added onto a side that already has movement cubes.",
  "erase": "Remove all modules on a touched side."
};

const MCOL = {
  move: "#d17b49",
  gun: "#22c55e",
  upgrade: "#374151",
  bomb: "#6b7280",
  "ai-gun": "#166534",
  "rapid-gun": "#eab308",
  "purple-gun": "#9333ea",
  burst: "#c9a26b",
  factory: "#ef4444",
  stabilizer: "#64748b"
};

const ui = {
  menu: document.getElementById("menuOverlay"),
  menuHome: document.getElementById("menuHomeView"),
  menuModes: document.getElementById("menuModeView"),
  menuUpgrades: document.getElementById("menuUpgradesView"),
  menuPlay: document.getElementById("menuPlayBtn"),
  menuUpgradesBtn: document.getElementById("menuUpgradesBtn"),
  menuSettings: document.getElementById("menuSettingsBtn"),
  menuBack: document.getElementById("menuBackBtn"),
  menuUpgradesBack: document.getElementById("menuUpgradesBackBtn"),
  menuSettingsPanel: document.getElementById("menuSettingsPanel"),
  menuUpgradesPanel: document.getElementById("menuUpgradesPanel"),
  wsExit: document.getElementById("workstationExitBtn"),
  startGame: document.getElementById("startGameBtn"),
  startScore: document.getElementById("startScoreBtn"),
  title: document.getElementById("gameTitle"),
  c: document.getElementById("gameCanvas"),
  phase: document.getElementById("phaseText"),
  level: document.getElementById("levelText"),
  goal: document.getElementById("goalText"),
  speed: document.getElementById("speedText"),
  update: document.getElementById("updateText"),
  tools: document.getElementById("toolGrid"),
  status: document.getElementById("toolStatus"),
  readout: document.getElementById("attachmentReadout"),
  start: document.getElementById("startRunBtn"),
  build: document.getElementById("backToBuildBtn"),
  restart: document.getElementById("restartBtn"),
  pause: document.getElementById("pauseBtn"),
  openMenu: document.getElementById("openMenuBtn"),
  devCard: document.getElementById("devCard"),
  devUnlock: document.getElementById("devUnlockBtn"),
  devScore: document.getElementById("devScoreBtn"),
  devBoss: document.getElementById("devBossBtn"),
  devKill: document.getElementById("devKillBtn"),
  devDrops: document.getElementById("devDropsBtn"),
  devAuto: document.getElementById("devAutoBtn"),
  devAddAIGun: document.getElementById("devAddAIGunBtn"),
  devAddRapid: document.getElementById("devAddRapidBtn"),
  devAddPurple: document.getElementById("devAddPurpleBtn"),
  devAddBurst: document.getElementById("devAddBurstBtn"),
  devAddFactory: document.getElementById("devAddFactoryBtn"),
  devAddSword: document.getElementById("devAddSwordBtn"),
  devHint: document.getElementById("devHint"),
  next: document.getElementById("nextLevelBtn"),
  levels: document.getElementById("levelButtons"),
  events: document.getElementById("eventLog"),
  darkTheme: document.getElementById("darkThemeToggle"),
  themeState: document.getElementById("themeState")
};

const ctx = ui.c.getContext("2d");

const S = {
  mode: "levels",
  levels: [],
  i: 0,
  unlock: 1,
  done: new Set(),
  arena: null,
  score: 0,
  bestScore: 0,
  nextBossScore: 30,
  scoreSeed: 1,
  scoreWallsRemoved: false,
  scoreWallCache: new Map(),
  scoreWallCacheMode: "",
  scoreEnemySpawnCd: 0,
  boss: null,
  enemyBullets: [],
  buildZoneGone: false,
  phase: "menu",
  tool: "place-player",
  msg: "",
  events: [],
  keys: {},
  hold: 0,
  levelTime: 0,
  pistonCd: 0,
  sidePistonCd: 0,
  gunCd: 0,
  bombCd: 0,
  pistonBounce: 0,
  stabilizerPulse: 0,
  stabilizerCd: 0,
  burstCd: 0,
  sideBreakCd: { up: 0, right: 0, down: 0, left: 0 },
  snap: null,
  uiNext: 0,
  last: performance.now(),
  mouse: { x: 0, y: 0, down: false },
  p: { placed: false, x: BUILD.x + 2.5, y: BUILD.y + 2.5, vx: 0, vy: 0, size: 0.72 },
  origin: null,
  enemy: [],
  spawners: [],
  emitters: [],
  bullets: [],
  gunBullets: [],
  bombs: [],
  drops: [],
  dropSpawnCd: 30,
  dropTelegraphs: [],
  yellow: [],
  white: [],
  yellowMini: [],
  yellowSpawnCd: 4.5,
  whiteSpawnCd: 0.8,
  scoreLaserWalls: [],
  scoreLaserCd: 2.8,
  redMini: [],
  redMiniSpawnTick: 0,
  greenCube: null,
  darkTheme: false,
  swordCount: 0,
  swordAngle: 0,
  aiGunCd: 0,
  upgradeKills: 0,
  bossFightCount: 0,
  pickupFx: [],
  bossFx: [],
  enemyFx: [],
  modeFlash: null,
  workstation: null,
  workRefX: 0,
  workRefY: 0,
  drag: null,
  menuView: "home",
  paused: false,
  pausedByMenu: false,
  runStats: { kills: 0, modulesBroken: 0, perfectPlays: 0, runTime: 0, noDropKills: 0 },
  dropPity: 0,
  lastDangerAt: -99,
  lastRunSummary: "",
  devUnlocked: false,
  devAutoPilot: false,
  devAiActionCd: 0,
  meta: META_DEFAULT,
  metaPanel: null,
  collectedDrops: emptyCollectedDrops(),
  previewSpawns: [],
  a: blankA()
};

function blankA() {
  return { up: [], right: [], down: [], left: [] };
}

function cloneA(a) {
  return {
    up: a.up.map((x) => ({ ...x })),
    right: a.right.map((x) => ({ ...x })),
    down: a.down.map((x) => ({ ...x })),
    left: a.left.map((x) => ({ ...x }))
  };
}

function emptyCollectedDrops() {
  return { gun: 0, "ai-gun": 0, "rapid-gun": 0, sword: 0, factory: 0, "purple-gun": 0, burst: 0 };
}

function cloneMetaDefault() {
  return {
    shards: META_DEFAULT.shards,
    upgrades: { ...META_DEFAULT.upgrades }
  };
}

function normalizeMeta(raw) {
  const next = cloneMetaDefault();
  if (!raw || typeof raw !== "object") return next;
  const shards = Number(raw.shards);
  if (Number.isFinite(shards) && shards >= 0) next.shards = Math.floor(shards);
  const up = raw.upgrades || {};
  const dropBoost = Number(up.dropBoost);
  const gunCap = Number(up.gunCap);
  const workstation = Number(up.workstation);
  if (Number.isFinite(dropBoost) && dropBoost >= 0) next.upgrades.dropBoost = Math.min(5, Math.floor(dropBoost));
  if (Number.isFinite(gunCap) && gunCap >= 0) next.upgrades.gunCap = Math.min(3, Math.floor(gunCap));
  if (Number.isFinite(workstation) && workstation >= 0) next.upgrades.workstation = Math.min(4, Math.floor(workstation));
  return next;
}

function saveMetaProgress() {
  localStorage.setItem(META_SAVE_KEY, JSON.stringify(S.meta));
}

function loadMetaProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(META_SAVE_KEY) || "null");
    S.meta = normalizeMeta(raw);
  } catch (_) {
    S.meta = cloneMetaDefault();
  }
}

function metaMaxGunAttachments() {
  return MAX_GUN_ATTACHMENTS + (S.meta?.upgrades?.gunCap || 0);
}

function metaWorkstationTtl() {
  return WORKSTATION_TTL + (S.meta?.upgrades?.workstation || 0) * 3;
}

function metaDropBonus() {
  return (S.meta?.upgrades?.dropBoost || 0) * 0.05;
}

function awardShards(amount, reason) {
  if (!Number.isFinite(amount) || amount <= 0) return;
  S.meta.shards += Math.floor(amount);
  saveMetaProgress();
  pushEv("+" + Math.floor(amount) + " Core Shards (" + reason + ").");
}

function metaUpgradeCost(key) {
  if (key === "dropBoost") return 4 + S.meta.upgrades.dropBoost * 4;
  if (key === "gunCap") return 7 + S.meta.upgrades.gunCap * 6;
  if (key === "workstation") return 6 + S.meta.upgrades.workstation * 5;
  return 9999;
}

function tryBuyMetaUpgrade(key) {
  const limits = { dropBoost: 5, gunCap: 3, workstation: 4 };
  if (!(key in limits)) return;
  const cur = S.meta.upgrades[key];
  if (cur >= limits[key]) {
    setMsg("This meta upgrade is already maxed.");
    return;
  }
  const cost = metaUpgradeCost(key);
  if (S.meta.shards < cost) {
    setMsg("Not enough Core Shards for this upgrade.");
    return;
  }
  S.meta.shards -= cost;
  S.meta.upgrades[key] = cur + 1;
  enforceGunAttachmentCap();
  saveMetaProgress();
  refreshMetaPanel();
  pushEv("Meta upgrade purchased: " + key + " -> Lv." + S.meta.upgrades[key]);
}

function buildMetaPanel() {
  const host = ui.menuUpgradesPanel || document.body;
  const box = document.createElement("div");
  box.id = "metaProgressPanel";
  box.style.marginTop = "8px";
  box.style.padding = "8px";
  box.style.border = "1px solid rgba(148,163,184,0.35)";
  box.style.borderRadius = "8px";
  box.style.background = "rgba(15,23,42,0.08)";
  box.innerHTML = ""
    + "<div style='font-weight:600;margin-bottom:6px'>Meta Progression</div>"
    + "<div id='metaShardText' style='font-size:12px;margin-bottom:6px'></div>"
    + "<button id='metaUpDrop' style='margin-right:4px;margin-bottom:4px'>Upgrade Drop Rate</button>"
    + "<button id='metaUpGun' style='margin-right:4px;margin-bottom:4px'>Upgrade Gun Cap</button>"
    + "<button id='metaUpWs' style='margin-bottom:4px'>Upgrade Workstation</button>"
    + "<div id='metaUpgradeText' style='font-size:12px;white-space:pre-line'></div>";
  host.appendChild(box);
  S.metaPanel = {
    root: box,
    shardText: box.querySelector("#metaShardText"),
    upgradeText: box.querySelector("#metaUpgradeText"),
    upDrop: box.querySelector("#metaUpDrop"),
    upGun: box.querySelector("#metaUpGun"),
    upWs: box.querySelector("#metaUpWs")
  };
  S.metaPanel.upDrop.addEventListener("click", () => tryBuyMetaUpgrade("dropBoost"));
  S.metaPanel.upGun.addEventListener("click", () => tryBuyMetaUpgrade("gunCap"));
  S.metaPanel.upWs.addEventListener("click", () => tryBuyMetaUpgrade("workstation"));
  refreshMetaPanel();
}

function refreshMetaPanel() {
  if (!S.metaPanel) return;
  const d = S.meta.upgrades.dropBoost;
  const g = S.meta.upgrades.gunCap;
  const w = S.meta.upgrades.workstation;
  const dropCost = metaUpgradeCost("dropBoost");
  const gunCost = metaUpgradeCost("gunCap");
  const wsCost = metaUpgradeCost("workstation");
  S.metaPanel.shardText.textContent = "Core Shards: " + S.meta.shards;
  S.metaPanel.upgradeText.textContent =
    "Drop Boost Lv." + d + "/5 (+" + Math.round(metaDropBonus() * 100) + "% drop chance), Cost: " + dropCost + "\n"
    + "Gun Cap Lv." + g + "/3 (Max guns " + metaMaxGunAttachments() + "), Cost: " + gunCost + "\n"
    + "Workstation Lv." + w + "/4 (TTL " + metaWorkstationTtl().toFixed(0) + "s), Cost: " + wsCost;
  S.metaPanel.upDrop.disabled = d >= 5 || S.meta.shards < dropCost;
  S.metaPanel.upGun.disabled = g >= 3 || S.meta.shards < gunCost;
  S.metaPanel.upWs.disabled = w >= 4 || S.meta.shards < wsCost;
}

function pushEv(t) {
  S.events.unshift(t);
  if (S.events.length > 8) S.events.length = 8;
}

function setMsg(t) {
  S.msg = t;
}

function buildGridLabel() {
  return BUILD.w + "x" + BUILD.h;
}

function setBuildZoneForMode(mode) {
  const src = mode === "score" ? SCORE_BUILD_POS : LEVEL_BUILD_POS;
  BUILD.w = BUILD_SIZE;
  BUILD.h = BUILD_SIZE;
  BUILD.x = src.x;
  BUILD.y = src.y;
}

function buildZoom() {
  return S.phase === "build" ? BUILD_ZOOM : 1;
}

function applyTheme() {
  const app = document.querySelector(".app");
  if (app) app.classList.toggle("theme-dark", S.darkTheme);
  if (ui.darkTheme) ui.darkTheme.checked = !!S.darkTheme;
  if (ui.themeState) ui.themeState.textContent = S.darkTheme ? "Dark theme ON" : "Dark theme OFF";
}

function showMenuView(view) {
  S.menuView = view;
  if (ui.menuHome) ui.menuHome.classList.toggle("hidden", view !== "home");
  if (ui.menuModes) ui.menuModes.classList.toggle("hidden", view !== "modes");
  if (ui.menuUpgrades) ui.menuUpgrades.classList.toggle("hidden", view !== "upgrades");
}

function sideForOffset(ox, oy) {
  if (Math.abs(ox) >= Math.abs(oy)) return ox >= 0 ? "right" : "left";
  return oy >= 0 ? "down" : "up";
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function rint(r, min, max) {
  return Math.floor(r() * (max - min + 1)) + min;
}

function insideRect(x, y, r) {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

function overlapRect(x, y, w, h, r, m = 0) {
  const ax1 = x + w - 1;
  const ay1 = y + h - 1;
  const bx0 = r.x - m;
  const by0 = r.y - m;
  const bx1 = r.x + r.w - 1 + m;
  const by1 = r.y + r.h - 1 + m;
  return !(ax1 < bx0 || bx1 < x || ay1 < by0 || by1 < y);
}

function pointSegmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 <= 0.000001) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + dx * t;
  const cy = ay + dy * t;
  return Math.hypot(px - cx, py - cy);
}

function inBuild(x, y) {
  return insideRect(x, y, BUILD);
}

function isScoreMode() {
  return S.mode === "score";
}

function level() {
  return isScoreMode() ? S.arena : S.levels[S.i];
}

function workstationRect(ws = S.workstation) {
  if (!ws) return null;
  return { x: ws.x - WORKSTATION_HALF, y: ws.y - WORKSTATION_HALF, w: WORKSTATION_SIZE, h: WORKSTATION_SIZE };
}

function workstationContains(x, y, ws = S.workstation) {
  const r = workstationRect(ws);
  if (!r) return false;
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

function workstationActive() {
  return isScoreMode() && S.phase === "run" && S.workstation && S.workstation.entered && S.workstation.ttl > 0;
}

function scoreNoise(x, y) {
  let n = (x * 374761393 + y * 668265263 + S.scoreSeed * 982451653) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  n = n ^ (n >>> 16);
  return ((n >>> 0) % 1000) / 1000;
}

function scoreWallAt(x, y) {
  if (inBuild(x, y)) return false;
  if (workstationContains(x + 0.5, y + 0.5)) return false;
  if (S.scoreWallsRemoved) return false;
  const density = isScoreMode() ? (S.score >= 100 ? 0.03 : S.score >= 20 ? 0.06 : 0.1) : 0.1;
  const mode = S.scoreSeed + ":" + density;
  if (S.scoreWallCacheMode !== mode) {
    S.scoreWallCacheMode = mode;
    S.scoreWallCache.clear();
  }
  const key = x + "," + y;
  if (S.scoreWallCache.has(key)) return S.scoreWallCache.get(key);
  const out = scoreNoise(x, y) < density;
  S.scoreWallCache.set(key, out);
  if (S.scoreWallCache.size > 20000) S.scoreWallCache.clear();
  return out;
}

function whiteCubeBaseHp() {
  return S.score >= 200 ? 20 : 15;
}

function yellowFactoryBaseHp() {
  return S.score >= 200 ? 40 : 15;
}

function scoreBossBaseHp() {
  if (S.score >= 200) return 800;
  if (S.score >= 100) return 500;
  return 100;
}

function applyLateScoreTierStats() {
  const whiteHp = whiteCubeBaseHp();
  const yellowHp = yellowFactoryBaseHp();
  for (const w of S.white) {
    if (w.maxHp < whiteHp) {
      w.maxHp = whiteHp;
      w.hp = Math.min(w.maxHp, Math.max(w.hp, whiteHp));
    }
  }
  for (const y of S.yellow) {
    if (y.maxHp < yellowHp) {
      y.maxHp = yellowHp;
      y.hp = Math.min(y.maxHp, Math.max(y.hp, yellowHp));
    }
  }
}

function cellOpen(l, x, y) {
  if (x < 0 || x >= W || y < 0 || y >= H) return false;
  return !l.w[y][x];
}

function goalRect(n, r) {
  const options = [
    { x: W - 7, y: 2, w: 4, h: 4 },
    { x: W - 7, y: H - 7, w: 4, h: 4 },
    { x: W - 13, y: 2, w: 4, h: 4 },
    { x: W - 13, y: H - 7, w: 4, h: 4 },
    { x: W - 9, y: 8, w: 4, h: 4 },
    { x: W - 16, y: 8, w: 4, h: 4 }
  ];
  const g = { ...options[(n - 1 + rint(r, 0, options.length - 1)) % options.length] };
  g.x = Math.max(1, Math.min(W - g.w - 1, g.x + rint(r, -1, 1)));
  g.y = Math.max(1, Math.min(H - g.h - 1, g.y + rint(r, -1, 1)));
  if (overlapRect(g.x, g.y, g.w, g.h, BUILD, 1)) {
    g.x = W - 7;
    g.y = 2;
  }
  return g;
}

function carveGap(l, x, y, len, t, hz, r) {
  const gs = rint(r, 1, Math.max(1, len - 2));
  const gl = r() < 0.5 ? 1 : 2;
  for (let i = 0; i < t; i++) {
    for (let g = 0; g < gl; g++) {
      const gx = hz ? x + gs + g : x + i;
      const gy = hz ? y + i : y + gs + g;
      if (gx > 0 && gx < W - 1 && gy > 0 && gy < H - 1 && !inBuild(gx, gy)) {
        l.w[gy][gx] = false;
      }
    }
  }
}

function distMap(l) {
  const d = Array.from({ length: H }, () => Array(W).fill(-1));
  const q = [];
  const g = l.g;
  for (let y = g.y; y < g.y + g.h; y++) {
    for (let x = g.x; x < g.x + g.w; x++) {
      if (!l.w[y][x]) {
        d[y][x] = 0;
        q.push([x, y]);
      }
    }
  }

  let h = 0;
  while (h < q.length) {
    const [x, y] = q[h++];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 1 || nx > W - 2 || ny < 1 || ny > H - 2) continue;
      if (l.w[ny][nx] || d[ny][nx] !== -1) continue;
      d[ny][nx] = d[y][x] + 1;
      q.push([nx, ny]);
    }
  }
  return d;
}

function playable(l) {
  const d = distMap(l);
  let reachableBuild = 0;
  for (let y = BUILD.y; y < BUILD.y + BUILD.h; y++) {
    for (let x = BUILD.x; x < BUILD.x + BUILD.w; x++) {
      if (!l.w[y][x] && d[y][x] !== -1) reachableBuild++;
    }
  }
  return reachableBuild > 35;
}

function generateLasers(l, n, r) {
  const out = [];
  const want = 2 + Math.floor((n - 1) / 4);

  for (let at = 0; at < 380 && out.length < want; at++) {
    const hz = r() < 0.5;
    const x = rint(r, 2, W - 3);
    const y = rint(r, 2, H - 3);
    if (!cellOpen(l, x, y) || inBuild(x, y) || insideRect(x, y, l.g)) continue;

    if (hz) {
      let lx = x;
      while (lx > 0 && !l.w[y][lx]) lx--;
      let rx = x;
      while (rx < W - 1 && !l.w[y][rx]) rx++;
      const sx = lx + 1;
      const ex = rx - 1;
      if (ex - sx < 3) continue;
      if (y >= BUILD.y && y < BUILD.y + BUILD.h && !(ex < BUILD.x || sx >= BUILD.x + BUILD.w)) continue;
      if (y >= l.g.y && y < l.g.y + l.g.h && !(ex < l.g.x || sx >= l.g.x + l.g.w)) continue;
      const id = "h:" + y + ":" + sx + ":" + ex;
      if (out.some((ls) => ls.id === id)) continue;
      const dir = r() < 0.5 ? 1 : -1;
      out.push({
        id,
        o: "h",
        y,
        sx,
        ex,
        dir,
        speed: 3.4 + r() * 1.1,
        fireEvery: 0.9 + r() * 0.9,
        activeFor: 2.6 + r() * 2.2,
        pauseFor: 1.2 + r() * 2.0,
        phase: r() * 5
      });
    } else {
      let uy = y;
      while (uy > 0 && !l.w[uy][x]) uy--;
      let dy = y;
      while (dy < H - 1 && !l.w[dy][x]) dy++;
      const sy = uy + 1;
      const ey = dy - 1;
      if (ey - sy < 3) continue;
      if (x >= BUILD.x && x < BUILD.x + BUILD.w && !(ey < BUILD.y || sy >= BUILD.y + BUILD.h)) continue;
      if (x >= l.g.x && x < l.g.x + l.g.w && !(ey < l.g.y || sy >= l.g.y + l.g.h)) continue;
      const id = "v:" + x + ":" + sy + ":" + ey;
      if (out.some((ls) => ls.id === id)) continue;
      const dir = r() < 0.5 ? 1 : -1;
      out.push({
        id,
        o: "v",
        x,
        sy,
        ey,
        dir,
        speed: 3.2 + r() * 1.2,
        fireEvery: 0.95 + r() * 0.95,
        activeFor: 2.4 + r() * 2.4,
        pauseFor: 1.2 + r() * 2.1,
        phase: r() * 5
      });
    }
  }
  return out;
}

function pickEnemySpawns(l, n, r) {
  const out = [];
  const count = 1 + Math.floor((n - 1) / 8);

  for (let i = 0; i < count; i++) {
    for (let at = 0; at < 180; at++) {
      const x = rint(r, 2, W - 3);
      const y = rint(r, 2, H - 3);
      if (!cellOpen(l, x, y)) continue;
      if (inBuild(x, y)) continue;
      if (insideRect(x, y, l.g)) continue;
      if (out.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) < 6)) continue;
      const md = Math.abs((BUILD.x + BUILD.w / 2) - x) + Math.abs((BUILD.y + BUILD.h / 2) - y);
      if (md < 12) continue;
      out.push({ x: x + 0.5, y: y + 0.5, vx: 0, vy: 0, size: 0.72, hitCd: 0 });
      break;
    }
  }

  return out;
}
function genLevel(n, seedSalt = 0) {
  for (let at = 0; at < 140; at++) {
    const r = rng(n * 10007 + at * 31337 + 99 + seedSalt);
    const l = { w: Array.from({ length: H }, () => Array(W).fill(false)), g: goalRect(n, r), n, lasers: [], enemyCount: 1 + Math.floor((n - 1) / 8) };

    for (let x = 0; x < W; x++) {
      l.w[0][x] = true;
      l.w[H - 1][x] = true;
    }
    for (let y = 0; y < H; y++) {
      l.w[y][0] = true;
      l.w[y][W - 1] = true;
    }

    const bars = 10 + n * 2;
    for (let i = 0; i < bars; i++) {
      const hz = r() < 0.5;
      const t = r() < 0.18 + n * 0.01 ? 2 : 1;
      const len = hz ? rint(r, 6, Math.min(18, 8 + n)) : rint(r, 5, Math.min(12, 6 + Math.floor(n * 0.8)));
      let x = 0;
      let y = 0;
      let w = 0;
      let h = 0;

      if (hz) {
        x = rint(r, 1, W - len - 2);
        y = rint(r, 1, H - t - 2);
        w = len;
        h = t;
      } else {
        x = rint(r, 1, W - t - 2);
        y = rint(r, 1, H - len - 2);
        w = t;
        h = len;
      }

      if (overlapRect(x, y, w, h, l.g, 1) || overlapRect(x, y, w, h, BUILD, 1)) continue;

      for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++) {
          l.w[yy][xx] = true;
        }
      }
      carveGap(l, x, y, len, t, hz, r);
    }

    const blocks = 4 + Math.floor(n * 0.75);
    for (let i = 0; i < blocks; i++) {
      const bw = rint(r, 2, 3);
      const bh = rint(r, 2, 3);
      const bx = rint(r, 2, W - bw - 3);
      const by = rint(r, 2, H - bh - 3);
      if (overlapRect(bx, by, bw, bh, l.g, 1) || overlapRect(bx, by, bw, bh, BUILD, 1)) continue;
      for (let y = by; y < by + bh; y++) {
        for (let x = bx; x < bx + bw; x++) {
          l.w[y][x] = true;
        }
      }
    }

    for (let y = BUILD.y; y < BUILD.y + BUILD.h; y++) {
      for (let x = BUILD.x; x < BUILD.x + BUILD.w; x++) l.w[y][x] = false;
    }

    for (let y = BUILD.y - 1; y <= BUILD.y + BUILD.h; y++) {
      for (let x = BUILD.x - 1; x <= BUILD.x + BUILD.w; x++) {
        if (x > 0 && x < W - 1 && y > 0 && y < H - 1) l.w[y][x] = false;
      }
    }

    for (let y = l.g.y - 1; y < l.g.y + l.g.h + 1; y++) {
      for (let x = l.g.x - 1; x < l.g.x + l.g.w + 1; x++) {
        if (x > 0 && x < W - 1 && y > 0 && y < H - 1) l.w[y][x] = false;
      }
    }

    if (!playable(l)) continue;

    l.lasers = generateLasers(l, n, r);
    return l;
  }

  const fb = {
    w: Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => x === 0 || y === 0 || x === W - 1 || y === H - 1)),
    g: { x: W - 7, y: 2, w: 4, h: 4 },
    n,
    lasers: [],
    enemyCount: 1
  };
  for (let y = BUILD.y; y < BUILD.y + BUILD.h; y++) {
    for (let x = BUILD.x; x < BUILD.x + BUILD.w; x++) fb.w[y][x] = false;
  }
  return fb;
}

function initLevels() {
  S.levels = Array.from({ length: LEVELS }, (_, i) => genLevel(i + 1));
}

function generateScoreArena() {
  return {
    w: Array.from({ length: H }, () => Array(W).fill(false)),
    g: { x: W + 1000, y: H + 1000, w: 1, h: 1 },
    n: 1,
    lasers: [],
    enemyCount: 5
  };
}

function startLevelMode() {
  S.mode = "levels";
  setBuildZoneForMode("levels");
  ui.menu.classList.add("hidden");
  if (ui.wsExit) ui.wsExit.style.display = "none";
  loadLevel(0);
  S.phase = "build";
  setMsg("Build phase: place your red smiley cube in the " + buildGridLabel() + " setup grid.");
}

function startScoreMode() {
  S.mode = "score";
  setBuildZoneForMode("score");
  S.score = 0;
  S.nextBossScore = 30;
  S.bossFightCount = 0;
  S.scoreSeed = Math.floor(Math.random() * 1000000) + 1;
  S.scoreWallsRemoved = false;
  S.scoreWallCache.clear();
  S.scoreWallCacheMode = "";
  S.scoreEnemySpawnCd = 0;
  S.boss = null;
  S.enemyBullets = [];
  S.yellow = [];
  S.white = [];
  S.yellowMini = [];
  S.redMini = [];
  S.redMiniSpawnTick = 0;
  S.greenCube = null;
  S.scoreLaserWalls = [];
  S.scoreLaserCd = 2.8;
  S.yellowSpawnCd = 4.5;
  S.whiteSpawnCd = 0.8;
  S.workstation = null;
  S.workRefX = 0;
  S.workRefY = 0;
  S.drag = null;
  S.devAutoPilot = false;
  S.collectedDrops = emptyCollectedDrops();
  S.arena = generateScoreArena();
  ui.menu.classList.add("hidden");
  if (ui.wsExit) ui.wsExit.style.display = "none";
  resetBuild();
  S.previewSpawns = [];
  S.phase = "build";
  setMsg("Score Mode: build your cube, then survive and destroy blue cubes to gain score.");
}

function pCell() {
  return { x: Math.floor(S.p.x), y: Math.floor(S.p.y) };
}

function playerInBuildZone() {
  return S.p.x >= BUILD.x && S.p.x < BUILD.x + BUILD.w && S.p.y >= BUILD.y && S.p.y < BUILD.y + BUILD.h;
}

function buildZoneBlocksRun() {
  return !S.buildZoneGone;
}

function playerInBlockedBuildZone() {
  return S.phase === "run" && buildZoneBlocksRun() && playerInBuildZone();
}

function clampToBuild(pos) {
  return {
    x: Math.min(BUILD.x + BUILD.w - 0.5, Math.max(BUILD.x + 0.5, pos.x)),
    y: Math.min(BUILD.y + BUILD.h - 0.5, Math.max(BUILD.y + 0.5, pos.y))
  };
}

function restoreCubeToOrigin() {
  let target = null;
  if (S.origin) target = clampToBuild(S.origin);
  else if (S.snap) target = clampToBuild({ x: S.snap.x, y: S.snap.y });
  if (!target) return false;
  S.p.placed = true;
  S.p.x = target.x;
  S.p.y = target.y;
  return true;
}

function attCell(side, p, depth = 1) {
  if (side === "left") return { x: p.x - depth, y: p.y };
  if (side === "right") return { x: p.x + depth, y: p.y };
  if (side === "up") return { x: p.x, y: p.y - depth };
  return { x: p.x, y: p.y + depth };
}

function sideFrom(dx, dy) {
  if (dx === -1 && dy === 0) return "left";
  if (dx === 1 && dy === 0) return "right";
  if (dx === 0 && dy === -1) return "up";
  if (dx === 0 && dy === 1) return "down";
  return null;
}

function sideDepthFrom(dx, dy) {
  if (dy === 0 && dx < 0) return { side: "left", depth: -dx };
  if (dy === 0 && dx > 0) return { side: "right", depth: dx };
  if (dx === 0 && dy < 0) return { side: "up", depth: -dy };
  if (dx === 0 && dy > 0) return { side: "down", depth: dy };
  return null;
}

function defaultOffsetForSideIndex(side, idx) {
  const depth = idx + 1;
  if (side === "left") return { ox: -depth, oy: 0 };
  if (side === "right") return { ox: depth, oy: 0 };
  if (side === "up") return { ox: 0, oy: -depth };
  return { ox: 0, oy: depth };
}

function moduleOffset(side, idx) {
  const m = S.a[side][idx];
  if (m && Number.isInteger(m.ox) && Number.isInteger(m.oy)) return { ox: m.ox, oy: m.oy };
  return defaultOffsetForSideIndex(side, idx);
}

function moduleAtOffset(ox, oy) {
  for (const side of SIDES) {
    for (let i = 0; i < S.a[side].length; i++) {
      const off = moduleOffset(side, i);
      if (off.ox === ox && off.oy === oy) return { side, index: i, mod: S.a[side][i] };
    }
  }
  return null;
}

function addModuleAtOffset(side, m, ox, oy) {
  if (moduleAtOffset(ox, oy)) return false;
  S.a[side].push({ ...m, ox, oy, pop: 1 });
  return true;
}

function dedupeAttachmentOffsets() {
  const seen = new Set();
  for (const side of SIDES) {
    const next = [];
    for (let i = 0; i < S.a[side].length; i++) {
      const m = S.a[side][i];
      const off = moduleOffset(side, i);
      const key = off.ox + "," + off.oy;
      if (seen.has(key)) continue;
      seen.add(key);
      next.push({ ...m, ox: off.ox, oy: off.oy });
    }
    S.a[side] = next;
  }
}

function purgeDeprecatedModules() {
  for (const side of SIDES) {
    S.a[side] = S.a[side].filter((m) => m.type !== "rocket" && m.type !== "piston");
  }
}

function nearestSideModuleNeighbor(ox, oy) {
  const neighbors = [
    { ox: ox - 1, oy },
    { ox: ox + 1, oy },
    { ox, oy: oy - 1 },
    { ox, oy: oy + 1 }
  ];
  for (const n of neighbors) {
    const hit = moduleAtOffset(n.ox, n.oy);
    if (hit) return hit;
  }
  return null;
}

function firstFreeAdjacentOffsetForSide(side, restrictToBuild = true) {
  const p = pCell();
  const seen = new Set();
  for (let i = 0; i < S.a[side].length; i++) {
    const off = moduleOffset(side, i);
    const candidates = [
      { ox: off.ox - 1, oy: off.oy },
      { ox: off.ox + 1, oy: off.oy },
      { ox: off.ox, oy: off.oy - 1 },
      { ox: off.ox, oy: off.oy + 1 }
    ];
    for (const c of candidates) {
      const k = c.ox + "," + c.oy;
      if (seen.has(k)) continue;
      seen.add(k);
      if (moduleAtOffset(c.ox, c.oy)) continue;
      const gx = p.x + c.ox;
      const gy = p.y + c.oy;
      if (restrictToBuild && !inBuild(gx, gy)) continue;
      return c;
    }
  }
  return null;
}

function dirFromSide(s) {
  if (s === "left") return "right";
  if (s === "right") return "left";
  if (s === "up") return "down";
  return "up";
}

function validPlace(x, y) {
  const l = level();
  if (!inBuild(x, y)) return false;
  if (l.w[y][x]) return false;
  return true;
}

function clearMotion() {
  S.p.vx = 0;
  S.p.vy = 0;
  S.hold = 0;
  S.levelTime = 0;
  S.pistonCd = 0;
  S.sidePistonCd = 0;
  S.gunCd = 0;
  S.bombCd = 0;
  S.burstCd = 0;
  S.pistonBounce = 0;
  S.stabilizerPulse = 0;
  S.stabilizerCd = 0;
  S.sideBreakCd = { up: 0, right: 0, down: 0, left: 0 };
  S.bullets = [];
  S.emitters = [];
  S.gunBullets = [];
  S.bombs = [];
  S.enemyBullets = [];
  S.aiGunCd = 0;
  S.upgradeKills = 0;
  S.pickupFx = [];
  S.bossFx = [];
  S.enemyFx = [];
  S.modeFlash = null;
  S.drag = null;
  S.swordAngle = 0;
  S.scoreLaserCd = 2.8;
  S.yellowSpawnCd = 4.5;
  S.whiteSpawnCd = 0.8;
  S.dropSpawnCd = 30;
  S.dropTelegraphs = [];
  S.scoreLaserWalls = [];
  S.yellow = [];
  S.white = [];
  S.yellowMini = [];
  S.redMini = [];
  S.redMiniSpawnTick = 0;
  S.greenCube = null;
  S.scoreWallCache.clear();
  S.scoreWallCacheMode = "";
}

function resetBuild() {
  S.phase = "build";
  S.buildZoneGone = false;
  S.scoreWallsRemoved = false;
  S.p.placed = false;
  S.p.x = BUILD.x + 2.5;
  S.p.y = BUILD.y + 2.5;
  S.origin = null;
  S.a = blankA();
  clearMotion();
  S.snap = null;
  S.enemy = [];
  S.white = [];
  S.spawners = [];
  S.boss = null;
  S.drops = [];
  S.dropSpawnCd = 30;
  S.dropTelegraphs = [];
  S.scoreLaserWalls = [];
  S.scoreLaserCd = 2.8;
  S.yellow = [];
  S.white = [];
  S.yellowMini = [];
  S.redMini = [];
  S.redMiniSpawnTick = 0;
  S.greenCube = null;
  S.yellowSpawnCd = 4.5;
  S.whiteSpawnCd = 0.8;
  S.workstation = null;
  S.workRefX = S.p.x;
  S.workRefY = S.p.y;
  S.drag = null;
  S.swordCount = 0;
  S.collectedDrops = emptyCollectedDrops();
  S.previewSpawns = [];
  if (ui.wsExit) ui.wsExit.style.display = "none";
  setMsg("Build in the " + buildGridLabel() + " setup grid. Movement modules must be adjacent to the red cube.");
}

function loadLevel(i) {
  S.i = Math.max(0, Math.min(LEVELS - 1, i));
  resetBuild();
  rollSpawnPreview();
  pushEv("Loaded Level " + (S.i + 1));
}

function randomSpawnCells(count) {
  const out = [];
  const l = level();
  const edge = [];

  for (let x = 1; x < W - 1; x++) {
    edge.push({ x, y: 1 });
    edge.push({ x, y: H - 2 });
  }
  for (let y = 2; y < H - 2; y++) {
    edge.push({ x: 1, y });
    edge.push({ x: W - 2, y });
  }

  for (let at = 0; at < 600 && out.length < count; at++) {
    const c = edge[Math.floor(Math.random() * edge.length)];
    if (!c) break;
    if (!cellOpen(l, c.x, c.y)) continue;
    if (inBuild(c.x, c.y)) continue;
    if (insideRect(c.x, c.y, l.g)) continue;
    if (out.some((e) => Math.abs(e.x - c.x) + Math.abs(e.y - c.y) < 6)) continue;
    const md = Math.abs((BUILD.x + BUILD.w / 2) - c.x) + Math.abs((BUILD.y + BUILD.h / 2) - c.y);
    if (md < 11) continue;
    out.push({ x: c.x, y: c.y });
  }

  return out;
}

function rollSpawnPreview() {
  const count = level().enemyCount || 1;
  S.previewSpawns = randomSpawnCells(count);
}

function setupRunHazardsAndEnemies() {
  if (isScoreMode()) {
    S.spawners = [];
    S.previewSpawns = [];
    S.enemy = [];
    S.white = [];
    S.yellow = [];
    S.yellowMini = [];
    S.redMini = [];
    S.redMiniSpawnTick = 0;
    S.greenCube = null;
    S.boss = null;
    S.emitters = [];
    S.bullets = [];
    S.enemyBullets = [];
    S.scoreLaserWalls = [];
    S.scoreLaserCd = 2.8;
    S.yellowSpawnCd = 4.5;
    S.whiteSpawnCd = 0.8;
    S.scoreEnemySpawnCd = 0;
    S.workstation = null;
    S.workRefX = S.p.x;
    S.workRefY = S.p.y;
    S.drag = null;
    if (Math.random() < GREEN_CUBE_SPAWN_CHANCE) spawnGreenCubeRandom();
    return;
  }

  if (!S.previewSpawns.length) rollSpawnPreview();
  S.spawners = S.previewSpawns.map((s, idx) => ({ id: idx, x: s.x, y: s.y, cooldown: 0 }));
  S.enemy = S.spawners.map((sp) => spawnEnemyFromSpawner(sp));
  for (const e of S.enemy) emitEnemySpawnFx(e.x, e.y, "#93c5fd");
  S.boss = null;
  S.emitters = level().lasers.map((ls) => ({ ...ls, shotClock: 0.2 + Math.random() * ls.fireEvery }));
  S.bullets = [];
  S.enemyBullets = [];
}

function spawnEnemyFromSpawner(sp) {
  return {
    x: sp.x + 0.5,
    y: sp.y + 0.5,
    vx: 0,
    vy: 0,
    size: 0.72,
    hp: 5,
    maxHp: 5,
    hitCd: 0,
    shootCd: 0.8 + Math.random() * 1.2,
    swordHitCd: 0,
    lastX: sp.x + 0.5,
    lastY: sp.y + 0.5,
    stuckTime: 0,
    repath: 0,
    path: [],
    targetKey: "",
    spawnerId: sp.id,
    pickGun: 0,
    pickRapid: 0,
    pickAIGun: 0,
    pickPurple: 0,
    pickBurst: 0,
    pickFactory: 0,
    pickSword: 0,
    factoryCd: 1.2,
    burstCd: 1.1
  };
}

function updateSpawners(dt) {
  if (isScoreMode() || S.boss) return;
  for (const sp of S.spawners) {
    const exists = S.enemy.some((e) => e.spawnerId === sp.id);
    if (exists) continue;
    if (sp.cooldown > 0) {
      sp.cooldown -= dt;
      continue;
    }
    const e = spawnEnemyFromSpawner(sp);
    S.enemy.push(e);
    emitEnemySpawnFx(e.x, e.y, "#93c5fd");
    sp.cooldown = 0;
    pushEv("Blue cube respawned from spawner.");
  }
}

function spawnScoreEnemyRandom() {
  for (let at = 0; at < 140; at++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 8 + Math.random() * 11;
    const x = Math.floor(S.p.x + Math.cos(ang) * dist);
    const y = Math.floor(S.p.y + Math.sin(ang) * dist);
    if (solid(x, y) || (buildZoneBlocksRun() && inBuild(x, y))) continue;
    if (S.enemy.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) < 4)) continue;
    if (S.white.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) < 4)) continue;
    if (S.yellow.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) < 4)) continue;
    if (S.yellowMini.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) < 3)) continue;
    S.enemy.push({
      x: x + 0.5,
      y: y + 0.5,
      vx: 0,
      vy: 0,
      size: 0.72,
      hp: 5,
      maxHp: 5,
      hitCd: 0,
      shootCd: 0.8 + Math.random() * 1.2,
      swordHitCd: 0,
      lastX: x + 0.5,
      lastY: y + 0.5,
      stuckTime: 0,
      repath: 0,
      path: [],
      targetKey: "",
      spawnerId: -1,
      pickGun: 0,
      pickRapid: 0,
      pickAIGun: 0,
      pickPurple: 0,
      pickBurst: 0,
      pickFactory: 0,
      pickSword: 0,
      factoryCd: 1.2,
      burstCd: 1.1
    });
    emitEnemySpawnFx(x + 0.5, y + 0.5, "#93c5fd");
    return;
  }
}

function spawnWhiteCubeRandom() {
  for (let at = 0; at < 170; at++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 8 + Math.random() * 12;
    const x = Math.floor(S.p.x + Math.cos(ang) * dist);
    const y = Math.floor(S.p.y + Math.sin(ang) * dist);
    if (solid(x, y) || (buildZoneBlocksRun() && inBuild(x, y))) continue;
    if (Math.hypot(x + 0.5 - S.p.x, y + 0.5 - S.p.y) < 6.4) continue;
    if (S.enemy.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) < 4)) continue;
    if (S.white.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) < 4)) continue;
    if (S.yellow.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) < 5)) continue;
    if (S.yellowMini.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) < 3)) continue;

    const hp = whiteCubeBaseHp();
    S.white.push({
      x: x + 0.5,
      y: y + 0.5,
      vx: 0,
      vy: 0,
      size: 0.76,
      hp,
      maxHp: hp,
      hitCd: 0,
      shootCd: 0.24 + Math.random() * 0.24,
      swordHitCd: 0,
      lastX: x + 0.5,
      lastY: y + 0.5,
      stuckTime: 0,
      repath: 0,
      path: [],
      targetKey: ""
    });
    emitEnemySpawnFx(x + 0.5, y + 0.5, "#f8fafc");
    pushEv("White blaster cube entered the map.");
    return true;
  }
  return false;
}

function spawnYellowFactoryRandom() {
  for (let at = 0; at < 170; at++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 9 + Math.random() * 13;
    const x = Math.floor(S.p.x + Math.cos(ang) * dist);
    const y = Math.floor(S.p.y + Math.sin(ang) * dist);
    if (solid(x, y) || (buildZoneBlocksRun() && inBuild(x, y))) continue;
    if (Math.hypot(x + 0.5 - S.p.x, y + 0.5 - S.p.y) < 7.5) continue;
    if (S.enemy.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) < 4)) continue;
    if (S.white.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) < 4)) continue;
    if (S.yellow.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) < 5)) continue;
    if (S.yellowMini.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) < 3)) continue;

    const hp = yellowFactoryBaseHp();
    S.yellow.push({
      x: x + 0.5,
      y: y + 0.5,
      vx: 0,
      vy: 0,
      size: 0.9,
      hp,
      maxHp: hp,
      hitCd: 0,
      swordHitCd: 0,
      spawnCd: 4,
      lastX: x + 0.5,
      lastY: y + 0.5,
      stuckTime: 0,
      repath: 0,
      path: [],
      targetKey: ""
    });
    emitEnemySpawnFx(x + 0.5, y + 0.5, "#facc15");
    pushEv("Yellow factory cube entered the map.");
    return true;
  }
  return false;
}

function spawnGreenCubeRandom() {
  for (let at = 0; at < 220; at++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 11 + Math.random() * 18;
    const x = Math.floor(S.p.x + Math.cos(ang) * dist);
    const y = Math.floor(S.p.y + Math.sin(ang) * dist);
    if (solid(x, y) || (buildZoneBlocksRun() && inBuild(x, y))) continue;
    if (Math.hypot(x + 0.5 - S.p.x, y + 0.5 - S.p.y) < 8) continue;
    if (S.enemy.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) < 5)) continue;
    if (S.white.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) < 5)) continue;
    if (S.yellow.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) < 6)) continue;

    S.greenCube = {
      x: x + 0.5,
      y: y + 0.5,
      size: 1.5,
      hp: 15,
      maxHp: 15,
      shootCd: 1.15 + Math.random() * 0.9
    };
    pushEv("Green heavy cube spawned.");
    return true;
  }
  return false;
}

function spawnYellowMiniFromFactory(fy) {
  if (!fy) return false;
  if (S.yellowMini.length >= MAX_YELLOW_MINI) return false;
  for (let at = 0; at < 60; at++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 1.2 + Math.random() * 1.8;
    const x = Math.floor(fy.x + Math.cos(ang) * dist);
    const y = Math.floor(fy.y + Math.sin(ang) * dist);
    if (solid(x, y) || (buildZoneBlocksRun() && inBuild(x, y))) continue;
    if (S.white.some((m) => Math.abs(m.x - x) + Math.abs(m.y - y) < 2)) continue;
    if (S.yellowMini.some((m) => Math.abs(m.x - x) + Math.abs(m.y - y) < 2)) continue;

    S.yellowMini.push({
      x: x + 0.5,
      y: y + 0.5,
      vx: 0,
      vy: 0,
      size: 0.58,
      hp: 2,
      maxHp: 2,
      hitCd: 0,
      swordHitCd: 0,
      lastX: x + 0.5,
      lastY: y + 0.5,
      stuckTime: 0,
      repath: 0,
      path: [],
      targetKey: ""
    });
    emitEnemySpawnFx(x + 0.5, y + 0.5, "#fde047");
    return true;
  }
  return false;
}

function relocateEnemyNearPlayer(e, minDist = 8, maxDist = 14) {
  for (let at = 0; at < 160; at++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = minDist + Math.random() * (maxDist - minDist);
    const x = Math.floor(S.p.x + Math.cos(ang) * dist);
    const y = Math.floor(S.p.y + Math.sin(ang) * dist);
    if (solid(x, y) || (buildZoneBlocksRun() && inBuild(x, y))) continue;
    e.x = x + 0.5;
    e.y = y + 0.5;
    e.vx = 0;
    e.vy = 0;
    e.repath = 0;
    e.path = [];
    e.targetKey = "";
    e.lastX = e.x;
    e.lastY = e.y;
    e.stuckTime = 0;
    return true;
  }
  return false;
}

function updateScoreEnemyPopulation(dt) {
  if (!isScoreMode()) return;
  if (S.boss) return;
  const t20 = Math.max(0, Math.min(1, S.score / 20));
  const t100 = Math.max(0, Math.min(1, (S.score - 20) / 80));
  const t200 = Math.max(0, Math.min(1, (S.score - 100) / 100));
  const blueTarget = Math.max(3, Math.min(6, Math.round(3 + t100 * 2 + t200)));
  const whiteTarget = S.score < 30 ? 0 : Math.min(4, Math.round((S.score - 30) / 35));
  const yellowTarget = S.score < 20 ? 0 : Math.min(3, Math.round(1 + (S.score - 20) / 55));
  while (S.enemy.length > blueTarget) S.enemy.pop();
  while (S.white.length > whiteTarget) S.white.pop();
  while (S.yellow.length > yellowTarget) S.yellow.pop();
  S.scoreEnemySpawnCd -= dt;
  S.whiteSpawnCd -= dt;
  S.yellowSpawnCd -= dt;
  const blueCdBase = Math.max(0.45, 0.95 - t20 * 0.18 - t100 * 0.2 - t200 * 0.15);
  if (S.enemy.length < blueTarget && S.scoreEnemySpawnCd <= 0) {
    if (spawnScoreEnemyRandom()) S.scoreEnemySpawnCd = blueCdBase + Math.random() * (blueCdBase * 0.75);
    else S.scoreEnemySpawnCd = 0.25;
  }
  if (S.score >= 30 && S.white.length < whiteTarget && S.whiteSpawnCd <= 0) {
    if (spawnWhiteCubeRandom()) S.whiteSpawnCd = 0.65 + Math.random() * 0.5;
    else S.whiteSpawnCd = 0.2;
  }
  if (S.score >= 20 && S.yellow.length < yellowTarget && S.yellowSpawnCd <= 0) {
    if (spawnYellowFactoryRandom()) S.yellowSpawnCd = 2.8 - t100 * 0.8 + Math.random() * 0.95;
    else S.yellowSpawnCd = 0.3;
  }
  if (S.score >= 100) applyLateScoreTierStats();
}

function addScore(points) {
  if (!isScoreMode()) return;
  const prev = S.score;
  S.score += points;
  if (prev < 20 && S.score >= 20) {
    S.scoreEnemySpawnCd = Math.min(S.scoreEnemySpawnCd, 0.45);
    S.yellowSpawnCd = Math.min(S.yellowSpawnCd, 1.4);
    pushEv("Tier shift: yellow factories are starting to appear.");
  }
  if (prev < 100 && S.score >= 100) {
    S.scoreEnemySpawnCd = Math.min(S.scoreEnemySpawnCd, 0.4);
    S.whiteSpawnCd = Math.min(S.whiteSpawnCd, 1.2);
    S.yellowSpawnCd = Math.min(S.yellowSpawnCd, 1.1);
    pushEv("Tier up: white blaster cubes joined the fight.");
  }
  if (prev < 200 && S.score >= 200) {
    applyLateScoreTierStats();
    S.whiteSpawnCd = 0;
    if (S.boss && S.boss.maxHp < 800) {
      S.boss.maxHp = 800;
      S.boss.hp = Math.max(S.boss.hp, 800);
    }
    pushEv("Tier up: enemy attachment loadouts fully activated.");
  }
  if (S.score > S.bestScore) {
    S.bestScore = S.score;
    localStorage.setItem("redCubeBestScore", String(S.bestScore));
  }
  if (!S.boss && S.score >= S.nextBossScore) {
    spawnBoss();
  }
}

function spawnBoss() {
  if (isScoreMode()) {
    S.scoreWallsRemoved = true;
    S.scoreLaserWalls = [];
    let sx = Math.floor(S.p.x + 10);
    let sy = Math.floor(S.p.y);
    for (let at = 0; at < 220; at++) {
      const ang = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 8;
      const x = Math.floor(S.p.x + Math.cos(ang) * dist);
      const y = Math.floor(S.p.y + Math.sin(ang) * dist);
      if (solid(x, y) || inBuild(x, y)) continue;
      sx = x;
      sy = y;
      break;
    }
    S.enemy = [];
    S.white = [];
    S.yellow = [];
    S.yellowMini = [];
    const hp = scoreBossBaseHp();
    const fightIndex = Math.max(0, Math.floor((S.nextBossScore - 30) / 30));
    const moveMul = fightIndex === 0 ? 1 : 1.15 * Math.pow(1.04, Math.max(0, fightIndex - 1));
    const bulletRange = fightIndex >= 1 ? 25 : BULLET_RANGE_TILES;
    S.boss = {
      x: sx + 0.5,
      y: sy + 0.5,
      vx: 0,
      vy: 0,
      size: 2.2,
      hp,
      maxHp: hp,
      shootCd: 0.22,
      laserCd: 0.9,
      moveMul,
      bulletRange,
      swordHitCd: 0,
      repath: 0,
      path: []
    };
    S.bossFightCount = fightIndex + 1;
    pushEv("Boss arrived at score " + S.nextBossScore + ".");
    setMsg("Boss fight active. Defeat the dark blue cube.");
    return;
  }

  const cands = randomSpawnCells(1);
  const s = cands[0] || { x: W - 3, y: Math.floor(H / 2) };
  S.enemy = [];
  S.boss = {
    x: s.x + 0.5,
    y: s.y + 0.5,
    vx: 0,
    vy: 0,
    size: 2.2,
    hp: 85 + Math.floor(S.nextBossScore * 0.25),
    maxHp: 85 + Math.floor(S.nextBossScore * 0.25),
    shootCd: 0.7,
    laserCd: 1.35,
    swordHitCd: 0,
    repath: 0,
    path: []
  };
  pushEv("Boss arrived at score " + S.nextBossScore + ".");
  setMsg("Boss fight active. Defeat the dark blue cube.");
}

function despawnBoss() {
  if (S.boss) emitBossDeathFx(S.boss.x, S.boss.y);
  S.boss = null;
  if (isScoreMode()) {
    S.scoreWallsRemoved = false;
    S.scoreLaserCd = 1.1;
    S.scoreEnemySpawnCd = 0;
    S.yellowSpawnCd = 1.2;
    S.whiteSpawnCd = 0.8;
  }
  S.nextBossScore += 30;
  awardShards(6, "boss defeat");
  pushEv("Boss defeated.");
  setMsg("Boss defeated. Continue scoring.");
}

function canPlaceSpecial(side) {
  return S.a[side].some((m) => m.type === "move");
}

function placeAt(x, y) {
  if (S.phase !== "build") {
    setMsg("Switch to Build mode to edit placement.");
    return;
  }

  if (S.tool === "place-player") {
    if (!validPlace(x, y)) {
      setMsg("Player can only be placed inside open cells of the " + buildGridLabel() + " setup grid.");
      return;
    }
    S.p.placed = true;
    S.p.x = x + 0.5;
    S.p.y = y + 0.5;
    S.origin = { x: S.p.x, y: S.p.y };
    S.a = blankA();
    clearMotion();
    setMsg("Red cube placed. Add movement cubes on neighboring setup cells.");
    return;
  }

  if (!S.p.placed) {
    setMsg("Place the red cube first.");
    return;
  }

  const p = pCell();
  const ox = x - p.x;
  const oy = y - p.y;
  if (ox === 0 && oy === 0) {
    setMsg("That cell is occupied by the red cube.");
    return;
  }
  if (!inBuild(x, y)) {
    setMsg("Attachments must stay inside the " + buildGridLabel() + " setup grid.");
    return;
  }

  if (S.tool === "erase") {
    const hit = moduleAtOffset(ox, oy);
    if (hit) {
      S.a[hit.side].splice(hit.index, 1);
      setMsg("Removed module on " + hit.side + " side.");
    } else {
      setMsg("No module in that cell.");
    }
    return;
  }

  const placingMove = S.tool.startsWith("move-");
  const existing = moduleAtOffset(ox, oy);
  if (placingMove) {
    const side = sideFrom(ox, oy);
    if (!side) {
      setMsg("Movement modules must be in the grid cell directly next to the red cube.");
      return;
    }
    if (S.a[side].length >= 12 && !existing) {
      setMsg("That side has reached the module limit.");
      return;
    }
    const moveDir = S.tool.replace("move-", "");
    if (existing) {
      if (existing.side !== side || existing.mod.type !== "move") {
        setMsg("That grid cell is occupied.");
        return;
      }
      S.a[side][existing.index] = { ...S.a[side][existing.index], type: "move", dir: moveDir, ox, oy };
    } else {
      if (!addModuleAtOffset(side, { type: "move", dir: moveDir }, ox, oy)) {
        setMsg("That grid cell is occupied.");
        return;
      }
    }
    setMsg("Attached move on " + side + " side.");
    return;
  }

  if (existing) {
    setMsg("Only one module per grid cell.");
    return;
  }

  const neighbor = nearestSideModuleNeighbor(ox, oy);
  if (!neighbor) {
    setMsg("Place special modules next to any existing attachment.");
    return;
  }

  const side = neighbor.side;
  if (!canPlaceSpecial(side)) {
    setMsg("Special modules require a movement module on that side.");
    return;
  }
  if (S.a[side].length >= 12) {
    setMsg("That side has reached the module limit.");
    return;
  }
  if (S.tool === "upgrade" && hasUpgradeAttachment()) {
    setMsg("Only one upgrade attachment is allowed.");
    return;
  }
  if (S.tool === "bomb" && !S.devUnlocked && countType("bomb") >= 2) {
    setMsg("Only 2 bomb attachments allowed in the setup grid.");
    return;
  }
  if (S.tool === "gun" && gunAttachmentCount() >= metaMaxGunAttachments()) {
    setMsg("Gun module cap reached (max " + metaMaxGunAttachments() + ").");
    return;
  }

  let m = null;
  if (S.tool === "gun") m = { type: "gun", dir: side };
  if (S.tool === "upgrade") m = { type: "upgrade" };
  if (S.tool === "bomb") m = { type: "bomb" };
  if (S.tool === "stabilizer") m = { type: "stabilizer" };
  if (m) {
    if (!addModuleAtOffset(side, m, ox, oy)) {
      setMsg("Only one module per grid cell.");
      return;
    }
    setMsg("Attached " + m.type + " on " + side + " side.");
  } else {
    setMsg("Unknown module type.");
  }
}

function countType(type, side = null) {
  if (side) return S.a[side].filter((m) => m.type === type).length;
  return SIDES.reduce((sum, sd) => sum + S.a[sd].filter((m) => m.type === type).length, 0);
}

function hasUpgradeAttachment() {
  return countType("upgrade") > 0;
}

function attachmentDamageBonus() {
  if (!isScoreMode()) return 0;
  if (!hasUpgradeAttachment()) return 0;
  return S.upgradeKills * 0.04;
}

function registerAttachmentKill() {
  if (!isScoreMode()) return;
  if (!hasUpgradeAttachment()) return;
  S.upgradeKills += 1;
}

function gunAttachmentCount() {
  return countType("gun") + countType("ai-gun") + countType("rapid-gun");
}

function isGunAttachmentType(type) {
  return type === "gun" || type === "ai-gun" || type === "rapid-gun" || type === "purple-gun";
}

function enforceGunAttachmentCap() {
  let kept = 0;
  for (const side of SIDES) {
    const next = [];
    for (const m of S.a[side]) {
      if (!isGunAttachmentType(m.type)) {
        next.push(m);
        continue;
      }
      if (kept < metaMaxGunAttachments()) {
        next.push(m);
        kept++;
      }
    }
    S.a[side] = next;
  }
}

function countMove(dir) {
  return SIDES.reduce((sum, sd) => sum + S.a[sd].filter((m) => m.type === "move" && m.dir === dir).length, 0);
}

function countRocket(dir) {
  return SIDES.reduce((sum, sd) => sum + S.a[sd].filter((m) => m.type === "rocket" && m.dir === dir).length, 0);
}

function moveModuleTotal() {
  return DIRS.reduce((sum, d) => sum + countMove(d), 0);
}

function hasPistonDir(dir) {
  return SIDES.some((sd) => S.a[sd].some((m) => m.type === "piston" && m.dir === dir));
}

function gunModules() {
  const out = [];
  for (const side of SIDES) {
    for (let i = 0; i < S.a[side].length; i++) {
      const m = S.a[side][i];
      if (m.type === "gun" || m.type === "rapid-gun") out.push({ side, index: i, mod: m });
    }
  }
  return out;
}

function aiGunModules() {
  const out = [];
  for (const side of SIDES) {
    for (let i = 0; i < S.a[side].length; i++) {
      const m = S.a[side][i];
      if (m.type === "ai-gun") out.push({ side, index: i, mod: m });
    }
  }
  return out;
}

function factoryModules() {
  const out = [];
  for (const side of SIDES) {
    for (let i = 0; i < S.a[side].length; i++) {
      const m = S.a[side][i];
      if (m.type === "factory") out.push({ side, index: i, mod: m });
    }
  }
  return out;
}

function purpleGunModules() {
  const out = [];
  for (const side of SIDES) {
    for (let i = 0; i < S.a[side].length; i++) {
      const m = S.a[side][i];
      if (m.type === "purple-gun") out.push({ side, index: i, mod: m });
    }
  }
  return out;
}

function burstModules() {
  const out = [];
  for (const side of SIDES) {
    for (let i = 0; i < S.a[side].length; i++) {
      const m = S.a[side][i];
      if (m.type === "burst") out.push({ side, index: i, mod: m });
    }
  }
  return out;
}

function bombModules() {
  const out = [];
  for (const side of SIDES) {
    for (let i = 0; i < S.a[side].length; i++) {
      const m = S.a[side][i];
      if (m.type === "bomb") out.push({ side, index: i, mod: m });
    }
  }
  return out;
}

function rollDropType(allowNone = true) {
  const r = Math.random();
  const b = metaDropBonus();
  const tGun = 0.25 + b * 0.5;
  const tAi = 0.35 + b * 0.45;
  const tSword = 0.45 + b * 0.4;
  const tRapid = Math.min(0.8, 0.55 + b * 0.35);
  if (r < tGun) return "gun";
  if (r < tAi) return "ai-gun";
  if (r < tSword) return "sword";
  if (r < tRapid) return "rapid-gun";
  if (allowNone) return null;
  const rr = Math.random() * tRapid;
  if (rr < tGun) return "gun";
  if (rr < tAi) return "ai-gun";
  if (rr < tSword) return "sword";
  return "rapid-gun";
}

function rollBlueKillDropType() {
  if (S.dropPity >= 6) {
    S.dropPity = 0;
    return Math.random() < 0.4 ? "rapid-gun" : "gun";
  }
  const r = Math.random();
  if (r < 0.05) return "purple-gun";
  if (r < 0.15) return "burst";
  return rollDropType(true);
}

function spawnScoreDrop(x, y) {
  if (!isScoreMode()) return;
  const type = rollDropType();
  if (!type) return;
  S.drops.push({ x, y, type });
  if (S.drops.length > 18) S.drops.shift();
}

function spawnSpecificDrop(x, y, type) {
  if (!isScoreMode()) return;
  if (!type) return;
  S.drops.push({ x, y, type });
  if (S.drops.length > 24) S.drops.shift();
}

function spawnDropBurst(x, y, type, count) {
  for (let i = 0; i < count; i++) {
    let dx = (Math.random() * 2 - 1) * 1.2;
    let dy = (Math.random() * 2 - 1) * 1.2;
    let tx = x + dx;
    let ty = y + dy;
    const cx = Math.floor(tx);
    const cy = Math.floor(ty);
    if (solid(cx, cy) || (buildZoneBlocksRun() && inBuild(cx, cy))) {
      tx = x;
      ty = y;
    }
    spawnSpecificDrop(tx, ty, type);
  }
}

function dropColor(type) {
  if (type === "ai-gun") return "#166534";
  if (type === "sword") return "#dc2626";
  if (type === "rapid-gun") return "#eab308";
  if (type === "factory") return "#ef4444";
  if (type === "purple-gun") return "#9333ea";
  if (type === "burst") return "#c9a26b";
  return "#22c55e";
}

function emitPickupFx(x, y, type) {
  const color = dropColor(type);
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI * 2 * i) / 10 + Math.random() * 0.15;
    const speed = 0.6 + Math.random() * 1.2;
    S.pickupFx.push({
      x,
      y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      ttl: 0.42 + Math.random() * 0.2,
      maxTtl: 0.62,
      color,
      size: 2 + Math.random() * 2.8
    });
  }
}

function emitBossDeathFx(x, y) {
  for (let i = 0; i < 96; i++) {
    const ang = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 5.8;
    S.bossFx.push({
      x,
      y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      ttl: 0.7 + Math.random() * 0.9,
      maxTtl: 1.6,
      color: i % 3 === 0 ? "#f97316" : i % 3 === 1 ? "#ef4444" : "#fbbf24",
      size: 3 + Math.random() * 4.5
    });
  }
}

function emitEnemyBurstFx(x, y, baseColor = "#93c5fd", count = 22, ttl = 0.25, speedLo = 1.3, speedHi = 4.2) {
  for (let i = 0; i < count; i++) {
    const ang = (Math.PI * 2 * i) / count + Math.random() * 0.24;
    const speed = speedLo + Math.random() * (speedHi - speedLo);
    S.enemyFx.push({
      x,
      y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      ttl,
      maxTtl: ttl,
      color: baseColor,
      size: 2 + Math.random() * 2.8
    });
  }
}

function emitEnemySpawnFx(x, y, color = "#93c5fd") {
  emitEnemyBurstFx(x, y, color, 18, 0.25, 0.8, 2.6);
}

function emitEnemyDeathFx(x, y, color = "#60a5fa") {
  emitEnemyBurstFx(x, y, color, 26, 0.25, 1.4, 4.4);
}

function emitBombExplosionFx(x, y, radius = 5) {
  const parts = Math.max(36, Math.floor(radius * 10));
  for (let i = 0; i < parts; i++) {
    const ang = Math.random() * Math.PI * 2;
    const ring = Math.random() * radius;
    const speed = 4.2 + Math.random() * 5.4;
    const color = i % 3 === 0 ? "#fbbf24" : i % 3 === 1 ? "#f97316" : "#ef4444";
    S.enemyFx.push({
      x: x + Math.cos(ang) * ring * 0.15,
      y: y + Math.sin(ang) * ring * 0.15,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      ttl: 0.25,
      maxTtl: 0.25,
      color,
      size: 2.8 + Math.random() * 3.4
    });
  }
}

function randomDropSpawnPoint() {
  const halfW = Math.floor(ui.c.width / CELL / 2);
  const halfH = Math.floor(ui.c.height / CELL / 2);
  for (let at = 0; at < 180; at++) {
    const x = Math.floor(S.p.x + (Math.random() * 2 - 1) * Math.max(8, halfW - 2));
    const y = Math.floor(S.p.y + (Math.random() * 2 - 1) * Math.max(5, halfH - 2));
    if (solid(x, y)) continue;
    if (buildZoneBlocksRun() && inBuild(x, y)) continue;
    if (Math.hypot(x + 0.5 - S.p.x, y + 0.5 - S.p.y) < 3.5) continue;
    if (S.dropTelegraphs.some((t) => Math.hypot(t.x - (x + 0.5), t.y - (y + 0.5)) < 2.5)) continue;
    return { x: x + 0.5, y: y + 0.5 };
  }
  return null;
}

function randomRiskyDropSpawnPoint() {
  for (let at = 0; at < 120; at++) {
    const p = randomDropSpawnPoint();
    if (!p) return null;
    if (enemyClusterCountNear(p.x, p.y, 8) >= 3) return p;
  }
  return null;
}

function enemyClusterCountNear(x, y, radius = 9) {
  let c = 0;
  const rs = radius * radius;
  const adds = [S.enemy, S.white, S.yellow, S.yellowMini];
  for (const list of adds) {
    for (const e of list) {
      const dx = e.x - x;
      const dy = e.y - y;
      if (dx * dx + dy * dy <= rs) c++;
    }
  }
  return c;
}

function spawnWorkstation() {
  for (let at = 0; at < 120; at++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 22 + Math.random() * 34;
    const cx = Math.floor(S.p.x + Math.cos(ang) * dist) + 0.5;
    const cy = Math.floor(S.p.y + Math.sin(ang) * dist) + 0.5;
    if (Math.hypot(cx - S.p.x, cy - S.p.y) < 12) continue;
    if (solid(Math.floor(cx), Math.floor(cy))) continue;
    if (buildZoneBlocksRun() && inBuild(Math.floor(cx), Math.floor(cy))) continue;
    if (S.boss && Math.hypot(S.boss.x - cx, S.boss.y - cy) < 15) continue;
    if (enemyClusterCountNear(cx, cy, 10) >= 6) continue;
    const r = workstationRect({ x: cx, y: cy });
    if (!r) continue;
    S.workstation = {
      x: cx,
      y: cy,
      ttl: metaWorkstationTtl(),
      entered: false,
      drag: null
    };
    S.workRefX = cx;
    S.workRefY = cy;
    pushEv("Workstation appeared nearby.");
    return true;
  }
  return false;
}

function startWorkstationEdit() {
  if (!S.workstation || S.workstation.entered) return;
  S.workstation.entered = true;
  S.p.x = S.workstation.x;
  S.p.y = S.workstation.y;
  S.p.vx = 0;
  S.p.vy = 0;
  if (ui.wsExit) ui.wsExit.style.display = "inline-flex";
  pushEv("Workstation engaged: drag attachments to rearrange.");
}

function endWorkstation(reason = "Workstation expired.") {
  if (!S.workstation) return;
  if (S.drag) {
    const d = S.drag;
    addModuleAtOffset(d.fallbackSide, d.mod, d.fallbackOx, d.fallbackOy);
    S.drag = null;
  }
  S.workstation = null;
  if (ui.wsExit) ui.wsExit.style.display = "none";
  pushEv(reason);
}

function updateWorkstation(dt) {
  if (!isScoreMode() || S.phase !== "run") return;
  if (!S.workstation) {
    const moved = Math.hypot(S.p.x - S.workRefX, S.p.y - S.workRefY);
    if (moved >= WORKSTATION_GAP) spawnWorkstation();
    return;
  }

  S.workstation.ttl -= dt;
  if (S.workstation.ttl <= 0) {
    endWorkstation();
    return;
  }

  if (!S.workstation.entered) {
    if (workstationContains(S.p.x, S.p.y, S.workstation)) {
      startWorkstationEdit();
    }
    return;
  }

  S.p.x = S.workstation.x;
  S.p.y = S.workstation.y;
  S.p.vx = 0;
  S.p.vy = 0;
}

function queueTimedDrops() {
  if (!isScoreMode() || S.phase !== "run") return;
  const count = 2;
  let queued = 0;
  for (let i = 0; i < count; i++) {
    const risky = Math.random() < 0.45;
    const p = risky ? (randomRiskyDropSpawnPoint() || randomDropSpawnPoint()) : randomDropSpawnPoint();
    if (!p) continue;
    let t = rollDropType(false);
    if (risky && Math.random() < 0.42) t = Math.random() < 0.5 ? "purple-gun" : "burst";
    S.dropTelegraphs.push({
      x: p.x,
      y: p.y,
      ttl: 2.2,
      full: 2.2,
      type: t
    });
    queued++;
  }
  if (queued > 0) pushEv("Incoming drops marked on the map.");
}

function destroyEnemyAt(index, reason = "Blue cube destroyed.") {
  const e = S.enemy[index];
  if (!e) return;
  emitEnemyDeathFx(e.x, e.y, "#60a5fa");
  pushEv(reason);
  const sp = S.spawners.find((s) => s.id === e.spawnerId);
  if (sp) sp.cooldown = 2.4;
  const type = rollBlueKillDropType();
  if (type) {
    spawnSpecificDrop(e.x, e.y, type);
    S.dropPity = 0;
  } else {
    S.dropPity += 1;
  }
  S.enemy.splice(index, 1);
  S.runStats.kills += 1;
  registerAttachmentKill();
  addScore(1);
}

function destroyWhiteAt(index, reason = "White cube destroyed.") {
  const e = S.white[index];
  if (!e) return;
  emitEnemyDeathFx(e.x, e.y, "#f8fafc");
  pushEv(reason);
  spawnScoreDrop(e.x, e.y);
  S.white.splice(index, 1);
  S.runStats.kills += 1;
  registerAttachmentKill();
  addScore(1);
}

function destroyYellowAt(index, reason = "Yellow cube destroyed.") {
  const e = S.yellow[index];
  if (!e) return;
  emitEnemyDeathFx(e.x, e.y, "#facc15");
  pushEv(reason);
  if (Math.random() < 0.2) {
    spawnSpecificDrop(e.x, e.y, "factory");
    pushEv("Factory attachment dropped.");
  } else {
    spawnScoreDrop(e.x, e.y);
  }
  S.yellow.splice(index, 1);
  S.runStats.kills += 1;
  registerAttachmentKill();
}

function destroyYellowMiniAt(index, reason = "Small yellow cube destroyed.") {
  const e = S.yellowMini[index];
  if (!e) return;
  emitEnemyDeathFx(e.x, e.y, "#fde047");
  if (Math.random() < 0.02) {
    spawnSpecificDrop(e.x, e.y, "factory");
    pushEv("Factory attachment dropped.");
  }
  pushEv(reason);
  S.yellowMini.splice(index, 1);
  S.runStats.kills += 1;
  registerAttachmentKill();
}

function destroyGreenCube(reason = "Green heavy cube destroyed.") {
  if (!S.greenCube) return;
  const g = S.greenCube;
  emitEnemyDeathFx(g.x, g.y, "#22c55e");
  pushEv(reason);
  spawnDropBurst(g.x, g.y, "gun", 5);
  spawnDropBurst(g.x, g.y, "factory", 1);
  spawnDropBurst(g.x, g.y, "ai-gun", 2);
  S.greenCube = null;
  S.runStats.kills += 1;
  registerAttachmentKill();
}

function ensureEnemyInventory(e) {
  if (!e) return;
  if (!Number.isFinite(e.pickGun)) e.pickGun = 0;
  if (!Number.isFinite(e.pickRapid)) e.pickRapid = 0;
  if (!Number.isFinite(e.pickAIGun)) e.pickAIGun = 0;
  if (!Number.isFinite(e.pickPurple)) e.pickPurple = 0;
  if (!Number.isFinite(e.pickBurst)) e.pickBurst = 0;
  if (!Number.isFinite(e.pickFactory)) e.pickFactory = 0;
  if (!Number.isFinite(e.pickSword)) e.pickSword = 0;
  if (!Number.isFinite(e.factoryCd)) e.factoryCd = 1.2;
  if (!Number.isFinite(e.burstCd)) e.burstCd = 1.1;
}

function enemyPickupDrop(e, type) {
  if (!e) return false;
  ensureEnemyInventory(e);
  if (type === "gun") e.pickGun++;
  else if (type === "rapid-gun") e.pickRapid++;
  else if (type === "ai-gun") e.pickAIGun++;
  else if (type === "purple-gun") e.pickPurple++;
  else if (type === "burst") e.pickBurst++;
  else if (type === "factory") {
    e.pickFactory++;
    e.maxHp = Math.min(12, e.maxHp + 1);
    e.hp = Math.min(e.maxHp, e.hp + 1);
  } else if (type === "sword") e.pickSword++;
  else return false;
  pushEv("Blue cube picked up " + type + " block.");
  return true;
}

function attachPickupBlock(type, fromDrop = false) {
  const runDrop = fromDrop && S.phase === "run";
  if (!runDrop && isGunAttachmentType(type) && gunAttachmentCount() >= metaMaxGunAttachments()) return false;

  const candidates = SIDES
    .filter((side) => (runDrop || S.a[side].length < 12) && S.a[side].some((m) => m.type === "move"))
    .sort((a, b) => S.a[a].length - S.a[b].length);
  let side = null;
  let spot = null;
  for (const sd of candidates) {
    const s = firstFreeAdjacentOffsetForSide(sd, !runDrop);
    if (s) {
      side = sd;
      spot = s;
      break;
    }
  }
  if (!side || !spot) return false;

  let ok = false;
  if (type === "gun") ok = addModuleAtOffset(side, { type: "gun", dir: side }, spot.ox, spot.oy);
  else if (type === "ai-gun") ok = addModuleAtOffset(side, { type: "ai-gun", dir: side }, spot.ox, spot.oy);
  else if (type === "rapid-gun") ok = addModuleAtOffset(side, { type: "rapid-gun", dir: side }, spot.ox, spot.oy);
  else if (type === "purple-gun") ok = addModuleAtOffset(side, { type: "purple-gun" }, spot.ox, spot.oy);
  else if (type === "burst") ok = addModuleAtOffset(side, { type: "burst" }, spot.ox, spot.oy);
  else if (type === "factory") ok = addModuleAtOffset(side, { type: "factory" }, spot.ox, spot.oy);
  else return false;
  if (!ok) return false;
  dedupeAttachmentOffsets();
  return true;
}

function fireGuns() {
  if (S.phase !== "run") return;
  if (workstationActive()) return;
  if (playerInBlockedBuildZone()) return;
  if (S.gunCd > 0) return;
  const guns = gunModules();
  if (!guns.length) return;
  let rapidFound = false;
  const dmg = 1 + attachmentDamageBonus();

  for (const g of guns) {
    const a = sideAttachmentAnchor(g.side, g.index + 1);
    const o = 0.38;
    const speed = 10.2;
    let x = a.x;
    let y = a.y;
    let vx = 0;
    let vy = 0;
    if (g.mod.dir === "left") { x -= o; vx = -speed; }
    if (g.mod.dir === "right") { x += o; vx = speed; }
    if (g.mod.dir === "up") { y -= o; vy = -speed; }
    if (g.mod.dir === "down") { y += o; vy = speed; }
    if (g.mod.type === "rapid-gun") rapidFound = true;
    S.gunBullets.push({ x, y, vx, vy, ttl: 4.8, dmg, dist: 0, maxDist: BULLET_RANGE_TILES, canBounce: false, bounces: 0, kind: "gun" });
  }
  S.gunCd = rapidFound ? 0.125 : 0.25;
}

function firePurpleGunsAt(tx, ty) {
  if (S.phase !== "run") return false;
  if (workstationActive()) return false;
  if (playerInBlockedBuildZone()) return false;
  const guns = purpleGunModules();
  if (!guns.length) return false;
  const dmg = 1 + attachmentDamageBonus();
  for (const g of guns) {
    const a = sideAttachmentAnchor(g.side, g.index + 1);
    const dx = tx - a.x;
    const dy = ty - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const speed = 10.6;
    S.gunBullets.push({
      x: a.x,
      y: a.y,
      vx: (dx / d) * speed,
      vy: (dy / d) * speed,
      ttl: 6.8,
      dmg,
      dist: 0,
      maxDist: 30,
      canBounce: true,
      bounces: 30,
      kind: "purple"
    });
  }
  return true;
}

function fireBurstAttachments() {
  if (S.phase !== "run") return false;
  if (workstationActive()) return false;
  if (playerInBlockedBuildZone()) return false;
  if (S.burstCd > 0) return false;
  const mods = burstModules();
  if (!mods.length) return false;
  const dmg = 1 + attachmentDamageBonus();
  const speed = 8.9;
  for (const m of mods) {
    const a = sideAttachmentAnchor(m.side, m.index + 1);
    for (let i = 0; i < 30; i++) {
      const ang = (Math.PI * 2 * i) / 30;
      S.gunBullets.push({
        x: a.x,
        y: a.y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        ttl: 5.2,
        dmg,
        dist: 0,
        maxDist: BULLET_RANGE_TILES,
        canBounce: false,
        bounces: 0,
        kind: "burst"
      });
    }
  }
  S.burstCd = 4;
  pushEv("Burst attachment fired.");
  return true;
}

function fireBombAttachment() {
  if (S.phase !== "run") return false;
  if (workstationActive()) return false;
  if (playerInBlockedBuildZone()) return false;
  if (S.bombCd > 0) return false;
  const mods = bombModules();
  if (!mods.length) return false;
  let pressure = 0;
  for (const m of mods) {
    const a = sideAttachmentAnchor(m.side, m.index + 1);
    const nearby = S.enemy.filter((e) => Math.hypot(e.x - a.x, e.y - a.y) < 6).length
      + S.white.filter((e) => Math.hypot(e.x - a.x, e.y - a.y) < 6).length
      + S.yellow.filter((e) => Math.hypot(e.x - a.x, e.y - a.y) < 6).length;
    pressure = Math.max(pressure, nearby);
    S.bombs.push({
      x: a.x,
      y: a.y,
      ttl: 15,
      arm: 0.22,
      radius: 5,
      dmg: 12
    });
  }
  S.bombCd = pressure >= 3 ? 12.5 : 15;
  if (pressure >= 3) {
    S.runStats.perfectPlays += 1;
    pushEv("Perfect bomb deploy: cooldown reduced.");
  }
  pushEv("Bomb deployed.");
  return true;
}

function applyBombDamageAt(x, y, radius, dmg) {
  const applyList = (arr, onDeath) => {
    for (let i = arr.length - 1; i >= 0; i--) {
      const e = arr[i];
      if (Math.hypot(e.x - x, e.y - y) > radius + e.size / 2) continue;
      e.hp -= dmg;
      if (e.hp <= 0) onDeath(i);
    }
  };
  applyList(S.enemy, (i) => destroyEnemyAt(i, "Blue cube destroyed by bomb."));
  applyList(S.white, (i) => destroyWhiteAt(i, "White cube destroyed by bomb."));
  applyList(S.yellow, (i) => destroyYellowAt(i, "Yellow cube destroyed by bomb."));
  applyList(S.yellowMini, (i) => destroyYellowMiniAt(i, "Small yellow cube destroyed by bomb."));
  if (S.greenCube && Math.hypot(S.greenCube.x - x, S.greenCube.y - y) <= radius + S.greenCube.size / 2) {
    S.greenCube.hp -= dmg;
    if (S.greenCube.hp <= 0) destroyGreenCube("Green heavy cube destroyed by bomb.");
  }
  if (S.boss && Math.hypot(S.boss.x - x, S.boss.y - y) <= radius + S.boss.size / 2) {
    S.boss.hp -= dmg;
    if (S.boss.hp <= 0) despawnBoss();
  }
}

function updateBombs(dt) {
  if (S.phase !== "run") return;
  for (let i = S.bombs.length - 1; i >= 0; i--) {
    const b = S.bombs[i];
    b.ttl -= dt;
    b.arm = Math.max(0, b.arm - dt);
    if (b.ttl <= 0) {
      S.bombs.splice(i, 1);
      continue;
    }
    if (b.arm > 0) continue;

    let triggered = false;
    const triggerList = [S.enemy, S.white, S.yellow, S.yellowMini];
    for (const list of triggerList) {
      for (const e of list) {
        if (Math.hypot(e.x - b.x, e.y - b.y) <= 0.62 + e.size / 2) {
          triggered = true;
          break;
        }
      }
      if (triggered) break;
    }
    if (!triggered && S.greenCube && Math.hypot(S.greenCube.x - b.x, S.greenCube.y - b.y) <= 0.62 + S.greenCube.size / 2) {
      triggered = true;
    }
    if (!triggered && S.boss && Math.hypot(S.boss.x - b.x, S.boss.y - b.y) <= 0.62 + S.boss.size / 2) {
      triggered = true;
    }
    if (!triggered) continue;

    applyBombDamageAt(b.x, b.y, b.radius, b.dmg);
    emitBombExplosionFx(b.x, b.y, b.radius);
    pushEv("Bomb exploded.");
    S.bombs.splice(i, 1);
  }
}

function updateAIGuns(dt) {
  if (S.phase !== "run") return;
  if (!isScoreMode()) return;
  if (workstationActive()) return;
  if (playerInBlockedBuildZone()) return;
  const guns = aiGunModules();
  if (!guns.length) return;
  S.aiGunCd -= dt;
  if (S.aiGunCd > 0) return;
  const dmg = 1 + attachmentDamageBonus();

  for (const g of guns) {
    const a = sideAttachmentAnchor(g.side, g.index + 1);
    let target = null;
    let best = Infinity;
    for (const e of S.enemy) {
      const d = Math.hypot(e.x - a.x, e.y - a.y);
      if (d < best) {
        best = d;
        target = { x: e.x, y: e.y };
      }
    }
    for (const w of S.white) {
      const d = Math.hypot(w.x - a.x, w.y - a.y);
      if (d < best) {
        best = d;
        target = { x: w.x, y: w.y };
      }
    }
    for (const y of S.yellow) {
      const d = Math.hypot(y.x - a.x, y.y - a.y);
      if (d < best) {
        best = d;
        target = { x: y.x, y: y.y };
      }
    }
    for (const y of S.yellowMini) {
      const d = Math.hypot(y.x - a.x, y.y - a.y);
      if (d < best) {
        best = d;
        target = { x: y.x, y: y.y };
      }
    }
    if (S.greenCube) {
      const dg = Math.hypot(S.greenCube.x - a.x, S.greenCube.y - a.y);
      if (dg < best) target = { x: S.greenCube.x, y: S.greenCube.y };
    }
    if (S.boss) {
      const dBoss = Math.hypot(S.boss.x - a.x, S.boss.y - a.y);
      if (dBoss < best) target = { x: S.boss.x, y: S.boss.y };
    }
    if (!target) continue;
    const dx = target.x - a.x;
    const dy = target.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const speed = 10.4;
    S.gunBullets.push({
      x: a.x,
      y: a.y,
      vx: (dx / d) * speed,
      vy: (dy / d) * speed,
      ttl: 4.8,
      dmg,
      dist: 0,
      maxDist: BULLET_RANGE_TILES,
      canBounce: false,
      bounces: 0,
      kind: "ai"
    });
  }
  S.aiGunCd = 0.45;
}

function swordSizeBonusSquares() {
  return Math.max(0, S.swordCount) * 0.5;
}

function swordPos() {
  const orbit = 1.05 + swordSizeBonusSquares() * 0.3;
  return {
    x: S.p.x + Math.cos(S.swordAngle) * orbit,
    y: S.p.y + Math.sin(S.swordAngle) * orbit
  };
}

function swordLengthWorld() {
  return S.p.size * 1.45 + swordSizeBonusSquares();
}

function swordGeom() {
  const s = swordPos();
  const len = swordLengthWorld();
  const ca = Math.cos(S.swordAngle);
  const sa = Math.sin(S.swordAngle);
  const ax = s.x - ca * (len / 2);
  const ay = s.y - sa * (len / 2);
  const bx = s.x + ca * (len / 2);
  const by = s.y + sa * (len / 2);
  const halfThickness = 2 / CELL;
  const tipRadius = 4 / CELL;
  return { s, len, ax, ay, bx, by, halfThickness, tipRadius };
}

function swordHitsEntity(x, y, radius, geom) {
  const g = geom || swordGeom();
  const shaftDist = pointSegmentDistance(x, y, g.ax, g.ay, g.bx, g.by);
  if (shaftDist <= radius + g.halfThickness) return true;
  return Math.hypot(x - g.bx, y - g.by) <= radius + g.tipRadius;
}

function updateDropsAndSword(dt, prevX = S.p.x, prevY = S.p.y) {
  if (!isScoreMode() || S.phase !== "run") return;
  S.dropSpawnCd -= dt;
  while (S.dropSpawnCd <= 0) {
    queueTimedDrops();
    S.dropSpawnCd += 30;
  }

  let spawned = 0;
  for (let i = S.dropTelegraphs.length - 1; i >= 0; i--) {
    const t = S.dropTelegraphs[i];
    t.ttl -= dt;
    if (t.ttl > 0) continue;
    const cx = Math.floor(t.x);
    const cy = Math.floor(t.y);
    if (!solid(cx, cy) && !(buildZoneBlocksRun() && inBuild(cx, cy))) {
      S.drops.push({ x: t.x, y: t.y, type: t.type });
      if (S.drops.length > 24) S.drops.shift();
      spawned++;
    }
    S.dropTelegraphs.splice(i, 1);
  }
  if (spawned > 0) pushEv("Drop spawned.");

  for (let i = S.drops.length - 1; i >= 0; i--) {
    const d = S.drops[i];
    const pickupDist = pointSegmentDistance(d.x, d.y, prevX, prevY, S.p.x, S.p.y);
    if (pickupDist <= 1.02) {
      if (d.type === "sword") {
        S.swordCount += 1;
        S.collectedDrops.sword += 1;
        pushEv("Picked up Sword.");
      } else if (attachPickupBlock(d.type, true)) {
        if (Number.isFinite(S.collectedDrops[d.type])) S.collectedDrops[d.type] += 1;
        pushEv("Picked up " + d.type + " block.");
      } else {
        continue;
      }
      emitPickupFx(S.p.x, S.p.y, d.type);
      S.drops.splice(i, 1);
    }
  }

  for (let i = S.drops.length - 1; i >= 0; i--) {
    const d = S.drops[i];
    let picked = false;
    for (const e of S.enemy) {
      if (Math.hypot(d.x - e.x, d.y - e.y) <= 0.76) {
        picked = enemyPickupDrop(e, d.type);
        break;
      }
    }
    if (picked) S.drops.splice(i, 1);
  }

  if (S.swordCount <= 0 || playerInBlockedBuildZone()) return;
  S.swordAngle += dt * 4.4;
  const sword = swordGeom();

  for (let i = S.enemy.length - 1; i >= 0; i--) {
    const e = S.enemy[i];
    e.swordHitCd = Math.max(0, (e.swordHitCd || 0) - dt);
    if (e.swordHitCd > 0) continue;
    if (swordHitsEntity(e.x, e.y, e.size / 2, sword)) {
      e.hp -= 2;
      e.swordHitCd = 0.24;
      if (e.hp <= 0) destroyEnemyAt(i, "Blue cube sliced.");
    }
  }

  for (let i = S.white.length - 1; i >= 0; i--) {
    const e = S.white[i];
    e.swordHitCd = Math.max(0, (e.swordHitCd || 0) - dt);
    if (e.swordHitCd > 0) continue;
    if (swordHitsEntity(e.x, e.y, e.size / 2, sword)) {
      e.hp -= 2;
      e.swordHitCd = 0.24;
      if (e.hp <= 0) destroyWhiteAt(i, "White cube sliced.");
    }
  }

  for (let i = S.yellow.length - 1; i >= 0; i--) {
    const e = S.yellow[i];
    e.swordHitCd = Math.max(0, (e.swordHitCd || 0) - dt);
    if (e.swordHitCd > 0) continue;
    if (swordHitsEntity(e.x, e.y, e.size / 2, sword)) {
      e.hp -= 2;
      e.swordHitCd = 0.24;
      if (e.hp <= 0) destroyYellowAt(i, "Yellow cube sliced.");
    }
  }

  for (let i = S.yellowMini.length - 1; i >= 0; i--) {
    const e = S.yellowMini[i];
    e.swordHitCd = Math.max(0, (e.swordHitCd || 0) - dt);
    if (e.swordHitCd > 0) continue;
    if (swordHitsEntity(e.x, e.y, e.size / 2, sword)) {
      e.hp -= 2;
      e.swordHitCd = 0.24;
      if (e.hp <= 0) destroyYellowMiniAt(i, "Small yellow cube sliced.");
    }
  }

  if (S.greenCube) {
    const g = S.greenCube;
    g.swordHitCd = Math.max(0, (g.swordHitCd || 0) - dt);
    if (g.swordHitCd <= 0 && swordHitsEntity(g.x, g.y, g.size / 2, sword)) {
      g.hp -= 2;
      g.swordHitCd = 0.24;
      if (g.hp <= 0) destroyGreenCube("Green heavy cube sliced.");
    }
  }

  if (S.boss) {
    S.boss.swordHitCd = Math.max(0, (S.boss.swordHitCd || 0) - dt);
    if (S.boss.swordHitCd <= 0) {
      if (swordHitsEntity(S.boss.x, S.boss.y, S.boss.size / 2, sword)) {
        S.boss.hp -= 2;
        S.boss.swordHitCd = 0.24;
        if (S.boss.hp <= 0) despawnBoss();
      }
    }
  }
}

function updateGunBullets(dt) {
  for (let i = S.gunBullets.length - 1; i >= 0; i--) {
    const b = S.gunBullets[i];
    const ox = b.x;
    const oy = b.y;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.ttl -= dt;
    b.dist = (b.dist || 0) + Math.hypot(b.x - ox, b.y - oy);

    if (
      b.ttl <= 0 ||
      b.dist >= (b.maxDist || BULLET_RANGE_TILES) ||
      (!isScoreMode() && (b.x < 1 || b.x > W - 1 || b.y < 1 || b.y > H - 1))
    ) {
      S.gunBullets.splice(i, 1);
      continue;
    }
    if (solid(Math.floor(b.x), Math.floor(b.y))) {
      if (b.canBounce && (b.bounces || 0) > 0) {
        const hitX = solid(Math.floor(b.x), Math.floor(oy));
        const hitY = solid(Math.floor(ox), Math.floor(b.y));
        b.x = ox;
        b.y = oy;
        if (hitX) b.vx = -b.vx;
        if (hitY) b.vy = -b.vy;
        if (!hitX && !hitY) {
          b.vx = -b.vx;
          b.vy = -b.vy;
        }
        b.bounces = Math.max(0, (b.bounces || 0) - 1);
      } else {
        S.gunBullets.splice(i, 1);
        continue;
      }
    }

    let hitEnemy = false;
    for (let ei = S.enemy.length - 1; ei >= 0; ei--) {
      const e = S.enemy[ei];
      const h = e.size / 2;
      if (b.x >= e.x - h && b.x <= e.x + h && b.y >= e.y - h && b.y <= e.y + h) {
        e.hp -= b.dmg;
        if (e.hp <= 0) {
          destroyEnemyAt(ei, "Blue cube destroyed.");
        }
        hitEnemy = true;
        break;
      }
    }

    if (!hitEnemy) {
      for (let wi = S.white.length - 1; wi >= 0; wi--) {
        const e = S.white[wi];
        const h = e.size / 2;
        if (b.x >= e.x - h && b.x <= e.x + h && b.y >= e.y - h && b.y <= e.y + h) {
          e.hp -= b.dmg;
          if (e.hp <= 0) destroyWhiteAt(wi, "White cube destroyed.");
          hitEnemy = true;
          break;
        }
      }
    }

    if (!hitEnemy) {
      for (let yi = S.yellow.length - 1; yi >= 0; yi--) {
        const e = S.yellow[yi];
        const h = e.size / 2;
        if (b.x >= e.x - h && b.x <= e.x + h && b.y >= e.y - h && b.y <= e.y + h) {
          e.hp -= b.dmg;
          if (e.hp <= 0) destroyYellowAt(yi, "Yellow cube destroyed.");
          hitEnemy = true;
          break;
        }
      }
    }

    if (!hitEnemy) {
      for (let yi = S.yellowMini.length - 1; yi >= 0; yi--) {
        const e = S.yellowMini[yi];
        const h = e.size / 2;
        if (b.x >= e.x - h && b.x <= e.x + h && b.y >= e.y - h && b.y <= e.y + h) {
          e.hp -= b.dmg;
          if (e.hp <= 0) destroyYellowMiniAt(yi, "Small yellow cube destroyed.");
          hitEnemy = true;
          break;
        }
      }
    }

    if (!hitEnemy && S.greenCube) {
      const g = S.greenCube;
      const h = g.size / 2;
      if (b.x >= g.x - h && b.x <= g.x + h && b.y >= g.y - h && b.y <= g.y + h) {
        g.hp -= b.dmg;
        if (g.hp <= 0) destroyGreenCube();
        hitEnemy = true;
      }
    }

    if (!hitEnemy && S.boss) {
      const h = S.boss.size / 2;
      if (b.x >= S.boss.x - h && b.x <= S.boss.x + h && b.y >= S.boss.y - h && b.y <= S.boss.y + h) {
        S.boss.hp -= b.dmg;
        if (S.boss.hp <= 0) despawnBoss();
        hitEnemy = true;
      }
    }
    if (hitEnemy) S.gunBullets.splice(i, 1);
  }
}

function startRun() {
  if (!S.p.placed) {
    setMsg("Place the red cube first.");
    return;
  }

  purgeDeprecatedModules();
  dedupeAttachmentOffsets();
  enforceGunAttachmentCap();

  const moves = DIRS.reduce((sum, d) => sum + countMove(d), 0);
  if (!moves) {
    setMsg("Attach at least one movement cube.");
    return;
  }

  S.phase = "run";
  S.buildZoneGone = false;
  if (isScoreMode()) S.scoreWallsRemoved = false;
  S.drops = [];
  S.swordCount = 0;
  if (isScoreMode()) S.collectedDrops = emptyCollectedDrops();
  S.swordAngle = 0;
  S.aiGunCd = 0;
  if (!S.origin) S.origin = { x: S.p.x, y: S.p.y };
  S.snap = { x: S.p.x, y: S.p.y, a: cloneA(S.a) };
  S.workstation = null;
  S.workRefX = S.p.x;
  S.workRefY = S.p.y;
  S.drag = null;
  clearMotion();
  S.paused = false;
  S.pausedByMenu = false;
  S.runStats = { kills: 0, modulesBroken: 0, perfectPlays: 0, runTime: 0, noDropKills: 0 };
  S.dropPity = 0;
  S.lastDangerAt = -99;
  setupRunHazardsAndEnemies();
  if (isScoreMode()) setMsg("Score Mode started. Destroy blue cubes and survive.");
  else setMsg("Run started. Reach the transparent goal cube and hold for 5 seconds.");
  pushEv(isScoreMode() ? "Score run started." : "Run started on Level " + (S.i + 1));
}

function backBuild() {
  S.phase = "build";
  S.buildZoneGone = false;
  S.scoreWallsRemoved = false;
  S.drops = [];
  S.swordCount = 0;
  if (S.snap) {
    S.p.placed = true;
    restoreCubeToOrigin();
    S.a = cloneA(S.snap.a);
    purgeDeprecatedModules();
    dedupeAttachmentOffsets();
    enforceGunAttachmentCap();
  } else {
    restoreCubeToOrigin();
  }
  clearMotion();
  S.enemy = [];
  S.white = [];
  S.yellow = [];
  S.yellowMini = [];
  S.redMini = [];
  S.redMiniSpawnTick = 0;
  S.greenCube = null;
  S.spawners = [];
  S.bullets = [];
  S.emitters = [];
  S.enemyBullets = [];
  S.scoreLaserWalls = [];
  S.scoreLaserCd = 2.8;
  S.yellowSpawnCd = 4.5;
  S.whiteSpawnCd = 0.8;
  S.workstation = null;
  S.drag = null;
  S.boss = null;
  if (ui.wsExit) ui.wsExit.style.display = "none";
  setMsg("Back in Build mode.");
}

function restart() {
  if (isScoreMode()) {
    S.score = 0;
    S.nextBossScore = 30;
    S.bossFightCount = 0;
    S.scoreSeed = Math.floor(Math.random() * 1000000) + 1;
    S.scoreWallsRemoved = false;
    S.scoreEnemySpawnCd = 0;
    S.boss = null;
    S.enemyBullets = [];
    S.arena = generateScoreArena();
    S.phase = "build";
    S.buildZoneGone = false;
    S.drops = [];
    S.swordCount = 0;
    S.scoreLaserWalls = [];
    S.scoreLaserCd = 2.8;
    S.yellow = [];
    S.white = [];
    S.yellowMini = [];
    S.redMini = [];
    S.redMiniSpawnTick = 0;
    S.greenCube = null;
    S.yellowSpawnCd = 4.5;
    S.whiteSpawnCd = 0.8;
    S.workstation = null;
    S.drag = null;
    S.collectedDrops = emptyCollectedDrops();
    if (S.snap) {
      S.p.placed = true;
      restoreCubeToOrigin();
      S.a = cloneA(S.snap.a);
      purgeDeprecatedModules();
      dedupeAttachmentOffsets();
      enforceGunAttachmentCap();
    } else if (!restoreCubeToOrigin()) {
      resetBuild();
      S.previewSpawns = [];
      setMsg("Score Mode restarted with a new randomized map.");
      pushEv("Score run restarted.");
      return;
    }
    clearMotion();
    S.enemy = [];
    S.white = [];
    S.yellow = [];
    S.yellowMini = [];
    S.redMini = [];
    S.redMiniSpawnTick = 0;
    S.greenCube = null;
    S.spawners = [];
    S.bullets = [];
    S.emitters = [];
    S.previewSpawns = [];
    S.gunBullets = [];
    S.workstation = null;
    S.drag = null;
    S.phase = "build";
    setMsg("Score Mode restarted with your previous build setup.");
    pushEv("Score run restarted.");
    return;
  }

  if (!S.snap) {
    if (!restoreCubeToOrigin()) resetBuild();
    clearMotion();
    S.phase = "build";
    S.buildZoneGone = false;
    S.drops = [];
    S.swordCount = 0;
    return;
  }
  S.phase = "build";
  S.buildZoneGone = false;
  S.drops = [];
  S.swordCount = 0;
  S.p.placed = true;
  restoreCubeToOrigin();
  S.a = cloneA(S.snap.a);
  purgeDeprecatedModules();
  dedupeAttachmentOffsets();
  enforceGunAttachmentCap();
  clearMotion();
  S.enemy = [];
  S.white = [];
  S.yellow = [];
  S.yellowMini = [];
  S.redMini = [];
  S.redMiniSpawnTick = 0;
  S.greenCube = null;
  S.spawners = [];
  S.bullets = [];
  S.emitters = [];
  S.enemyBullets = [];
  S.scoreLaserWalls = [];
  S.scoreLaserCd = 2.8;
  S.yellowSpawnCd = 4.5;
  S.whiteSpawnCd = 0.8;
  S.workstation = null;
  S.drag = null;
  S.boss = null;
  rollSpawnPreview();
  pushEv("Run restarted in build mode.");
  setMsg("Restarted in Build mode with your previous setup.");
}

function complete() {
  const n = S.i + 1;
  S.phase = "complete";
  S.p.vx = 0;
  S.p.vy = 0;
  S.done.add(n);
  if (n < LEVELS) {
    S.unlock = Math.max(S.unlock, n + 1);
    setMsg("Level " + n + " complete.");
  } else {
    S.unlock = LEVELS;
    setMsg("All 20 levels complete.");
  }
  localStorage.setItem("redCubeUnlock", String(S.unlock));
  localStorage.setItem("redCubeDone", JSON.stringify(Array.from(S.done)));
  awardShards(2, "level clear");
  S.lastRunSummary = "Run Recap | Time: " + S.runStats.runTime.toFixed(1) + "s | Kills: " + S.runStats.kills + " | Modules Lost: " + S.runStats.modulesBroken + " | Perfect Plays: " + S.runStats.perfectPlays;
  pushEv("Level " + n + " completed.");
}

function gameOver(reason) {
  if (S.phase !== "run") return;
  S.phase = "gameover";
  S.p.vx = 0;
  S.p.vy = 0;
  S.lastRunSummary = "Run Recap | Time: " + S.runStats.runTime.toFixed(1) + "s | Kills: " + S.runStats.kills + " | Modules Lost: " + S.runStats.modulesBroken + " | Perfect Plays: " + S.runStats.perfectPlays;
  setMsg(reason + " Press Restart to try again. " + S.lastRunSummary);
  pushEv("Game over: " + reason);
}

function togglePause(force = null) {
  if (S.phase !== "run") return;
  S.paused = force == null ? !S.paused : !!force;
  if (!S.paused) {
    if (S.pausedByMenu && ui.menu) ui.menu.classList.add("hidden");
    S.pausedByMenu = false;
  }
  setMsg(S.paused ? "Paused. Press P to resume." : "Resumed.");
}

function openMenuFromRun() {
  if (S.phase !== "run") return;
  S.paused = true;
  S.pausedByMenu = true;
  showMenuView("home");
  if (ui.menu) ui.menu.classList.remove("hidden");
  setMsg("Opened menu. Resume with P or close menu.");
}

function requestDeveloperUnlock() {
  if (!isScoreMode()) {
    setMsg("Developer mode is only available in Score Mode.");
    return;
  }
  const pass = window.prompt("Enter developer password:");
  if (pass == null) return;
  if (pass.trim() !== DEV_PASSWORD) {
    setMsg("Invalid developer password.");
    pushEv("Developer unlock failed.");
    return;
  }
  S.devUnlocked = true;
  pushEv("Developer mode unlocked.");
  setMsg("Developer mode unlocked for this session.");
  updUI();
}

function setScoreAbsolute(targetScore) {
  const tgt = Math.max(0, Math.floor(targetScore));
  S.score = tgt;
  if (S.score >= 200) applyLateScoreTierStats();
  if (S.score > S.bestScore) {
    S.bestScore = S.score;
    localStorage.setItem("redCubeBestScore", String(S.bestScore));
  }
  S.nextBossScore = Math.max(30, (Math.floor(S.score / 30) + 1) * 30);
  S.scoreEnemySpawnCd = 0;
  S.whiteSpawnCd = 0;
  S.yellowSpawnCd = 0;
}

function devSetScorePrompt() {
  if (!S.devUnlocked || !isScoreMode()) return;
  const cur = String(S.score);
  const raw = window.prompt("Set score value:", cur);
  if (raw == null) return;
  const next = Number(raw);
  if (!Number.isFinite(next)) {
    setMsg("Score value must be a valid number.");
    return;
  }
  setScoreAbsolute(next);
  pushEv("Developer set score to " + S.score + ".");
}

function devSummonBossNow() {
  if (!S.devUnlocked || !isScoreMode()) return;
  if (S.phase !== "run") {
    setMsg("Start a Score run first, then summon boss.");
    return;
  }
  if (S.boss) despawnBoss();
  S.nextBossScore = S.score;
  spawnBoss();
  pushEv("Developer summoned boss.");
}

function devToggleAutoPilot() {
  if (!S.devUnlocked || !isScoreMode()) return;
  S.devAutoPilot = !S.devAutoPilot;
  S.devAiActionCd = 0;
  setMsg(S.devAutoPilot ? "Developer AI pilot enabled." : "Developer AI pilot disabled.");
  updUI();
}

function devNearestEnemy() {
  let nearest = null;
  let best = Infinity;
  const groups = [S.enemy, S.white, S.yellow, S.yellowMini, S.redMini];
  for (const g of groups) {
    for (const e of g) {
      const d = Math.hypot(e.x - S.p.x, e.y - S.p.y);
      if (d < best) {
        best = d;
        nearest = e;
      }
    }
  }
  if (S.boss) {
    const d = Math.hypot(S.boss.x - S.p.x, S.boss.y - S.p.y);
    if (d < best) return { entity: S.boss, dist: d };
  }
  return { entity: nearest, dist: best };
}

function devAiInput() {
  const dirs = [
    { key: "left", vx: -1, vy: 0 },
    { key: "right", vx: 1, vy: 0 },
    { key: "up", vx: 0, vy: -1 },
    { key: "down", vx: 0, vy: 1 }
  ];
  const enemyInfo = devNearestEnemy();
  const nearest = enemyInfo.entity;
  const nearestDist = enemyInfo.dist;
  let nearestDrop = null;
  let dropD = Infinity;
  for (const d of S.drops) {
    const dd = Math.hypot(d.x - S.p.x, d.y - S.p.y);
    if (dd < dropD) {
      dropD = dd;
      nearestDrop = d;
    }
  }

  let targetX = S.p.x;
  let targetY = S.p.y;
  if (S.boss) {
    const ang = Math.atan2(S.p.y - S.boss.y, S.p.x - S.boss.x) + Math.PI * 0.5;
    const desiredR = 6.3;
    targetX = S.boss.x + Math.cos(ang) * desiredR;
    targetY = S.boss.y + Math.sin(ang) * desiredR;
    if (nearestDist < 4.2) {
      targetX = S.p.x + (S.p.x - S.boss.x) * 1.3;
      targetY = S.p.y + (S.p.y - S.boss.y) * 1.3;
    }
  } else if (nearest && nearestDist < 4.8) {
    targetX = S.p.x + (S.p.x - nearest.x);
    targetY = S.p.y + (S.p.y - nearest.y);
  } else if (nearestDrop && dropD < 12.5) {
    targetX = nearestDrop.x;
    targetY = nearestDrop.y;
  } else if (nearest) {
    targetX = nearest.x;
    targetY = nearest.y;
  }

  let bestDir = null;
  let bestScore = -1e9;
  for (const d of dirs) {
    const tx = S.p.x + d.vx * 1.45;
    const ty = S.p.y + d.vy * 1.45;
    const cx = Math.floor(tx);
    const cy = Math.floor(ty);
    if (solid(cx, cy) || solid(Math.floor(S.p.x + d.vx * 0.85), Math.floor(S.p.y + d.vy * 0.85))) continue;
    let score = -Math.hypot(targetX - tx, targetY - ty) * 1.4;
    if (nearest) {
      const dn = Math.hypot(nearest.x - tx, nearest.y - ty);
      if (nearestDist < 4.8) score += dn * 1.6;
      else score -= dn * 0.35;
    }
    score += (Math.random() - 0.5) * 0.08;
    if (score > bestScore) {
      bestScore = score;
      bestDir = d.key;
    }
  }
  const out = { left: false, right: false, up: false, down: false };
  if (bestDir) out[bestDir] = true;
  return out;
}

function devKillAllEnemies() {
  if (!S.devUnlocked || !isScoreMode() || S.phase !== "run") return;
  for (let i = S.enemy.length - 1; i >= 0; i--) destroyEnemyAt(i, "Developer wiped blue cube.");
  for (let i = S.white.length - 1; i >= 0; i--) destroyWhiteAt(i, "Developer wiped white cube.");
  for (let i = S.yellow.length - 1; i >= 0; i--) destroyYellowAt(i, "Developer wiped yellow cube.");
  for (let i = S.yellowMini.length - 1; i >= 0; i--) destroyYellowMiniAt(i, "Developer wiped mini yellow cube.");
  if (S.greenCube) destroyGreenCube("Developer wiped green heavy cube.");
  if (S.boss) despawnBoss();
  pushEv("Developer removed all enemies.");
}

function devGiveDropsPack() {
  if (!S.devUnlocked || !isScoreMode() || S.phase !== "run") return;
  const types = ["gun", "ai-gun", "rapid-gun", "purple-gun", "burst", "factory", "sword"];
  const r = 2.2;
  for (let i = 0; i < types.length; i++) {
    const ang = (Math.PI * 2 * i) / types.length;
    spawnSpecificDrop(S.p.x + Math.cos(ang) * r, S.p.y + Math.sin(ang) * r, types[i]);
  }
  pushEv("Developer drop pack spawned.");
}

function devAddAttachment(type) {
  if (!S.devUnlocked || !isScoreMode()) return;
  if (type === "sword") {
    S.swordCount += 1;
    S.collectedDrops.sword += 1;
    pushEv("Developer added sword.");
    return;
  }
  const runDrop = S.phase === "run";
  const candidates = SIDES
    .filter((side) => S.a[side].some((m) => m.type === "move"))
    .sort((a, b) => S.a[a].length - S.a[b].length);
  let ok = false;
  for (const side of candidates) {
    const spot = firstFreeAdjacentOffsetForSide(side, !runDrop);
    if (!spot) continue;
    let mod = null;
    if (type === "ai-gun") mod = { type: "ai-gun", dir: side };
    else if (type === "rapid-gun") mod = { type: "rapid-gun", dir: side };
    else if (type === "purple-gun") mod = { type: "purple-gun" };
    else if (type === "burst") mod = { type: "burst" };
    else if (type === "factory") mod = { type: "factory" };
    if (!mod) break;
    ok = addModuleAtOffset(side, mod, spot.ox, spot.oy);
    if (ok) break;
  }
  if (!ok) ok = attachPickupBlock(type, true);
  if (!ok) {
    setMsg("No valid slot to add " + type + ". Add movement modules or free space.");
    return;
  }
  dedupeAttachmentOffsets();
  pushEv("Developer added " + type + ".");
}
function firePistons(filterDir = null) {
  if (S.phase !== "run") return;
  if (workstationActive()) return;
  if (playerInBlockedBuildZone()) return;
  const cooldown = filterDir ? S.sidePistonCd : S.pistonCd;
  if (cooldown > 0) return;

  const pistons = [];
  for (const sd of SIDES) {
    for (const m of S.a[sd]) {
      if (m.type === "piston" && (!filterDir || m.dir === filterDir)) pistons.push(m);
    }
  }
  if (!pistons.length) return;

  for (const p of pistons) {
    const imp = filterDir ? 4.6 : 5.2;
    if (p.dir === "left") S.p.vx -= imp;
    if (p.dir === "right") S.p.vx += imp;
    if (p.dir === "up") S.p.vy -= imp;
    if (p.dir === "down") S.p.vy += imp;
  }

  if (filterDir) S.sidePistonCd = 0.28;
  else S.pistonCd = 0.55;
  S.pistonBounce = 0.4;
  pushEv(filterDir ? "Directional piston fired (" + filterDir + ")." : "Piston burst fired.");
}

function triggerStabilizerPulse() {
  if (S.phase !== "run") return;
  if (workstationActive()) return;
  if (playerInBlockedBuildZone()) return;
  if (S.stabilizerCd > 0) return;
  if (countType("stabilizer") === 0) return;

  const perfect = S.levelTime - S.lastDangerAt <= 1.2;
  S.stabilizerPulse = perfect ? 2.4 : 1.6;
  S.stabilizerCd = perfect ? 3.2 : 4.5;
  if (perfect) {
    S.runStats.perfectPlays += 1;
    pushEv("Perfect stabilizer timing! Stronger pulse.");
  } else {
    pushEv("Stabilizer pulse active.");
  }
}

function solid(x, y) {
  if (isScoreMode()) return scoreWallAt(x, y);
  if (x < 0 || x >= W || y < 0 || y >= H) return true;
  return level().w[y][x];
}

function enemyProjectileBlockedAt(x, y) {
  if (inBuild(Math.floor(x), Math.floor(y))) return true;
  return solid(Math.floor(x), Math.floor(y));
}

function collectOverlaps(x, y, size, blockBuild = false) {
  const h = size / 2;
  const minX = Math.floor(x - h);
  const maxX = Math.floor(x + h);
  const minY = Math.floor(y - h);
  const maxY = Math.floor(y + h);
  const out = [];
  for (let cy = minY; cy <= maxY; cy++) {
    for (let cx = minX; cx <= maxX; cx++) {
      if (solid(cx, cy) || (blockBuild && inBuild(cx, cy))) out.push({ x: cx, y: cy });
    }
  }
  return out;
}

function breakSide(side, impact, reason) {
  if (S.sideBreakCd[side] > 0) return false;
  const stab = countType("stabilizer");
  const pulseBoost = S.stabilizerPulse > 0 ? 5.2 : 0;
  const threshold = 10.5 + stab * 3.5 + pulseBoost;
  if (impact >= threshold * 0.82) {
    S.lastDangerAt = S.levelTime;
    if (impact < threshold) setMsg("Warning: " + side + " side almost broke. Stabilizer pulse can save it.");
  }
  if (impact < threshold) return false;

  const broke = S.a[side].length;
  if (!broke) return false;

  S.a[side] = [];
  S.sideBreakCd[side] = 0.24;
  S.runStats.modulesBroken += broke;
  pushEv(reason + " broke " + broke + " module(s) on " + side + " side.");
  setMsg(reason + " broke modules on " + side + " side.");
  return true;
}

function breakSideForced(side, reason) {
  if (S.sideBreakCd[side] > 0) return false;
  const broke = S.a[side].length;
  if (!broke) return false;
  S.a[side] = [];
  S.sideBreakCd[side] = 0.22;
  S.runStats.modulesBroken += broke;
  pushEv(reason + " removed " + broke + " module(s) on " + side + " side.");
  return true;
}

function breakSingleAttachment(side, index, reason) {
  if (!side) return false;
  if (S.sideBreakCd[side] > 0) return false;
  if (!S.a[side].length) return false;
  const idx = Number.isInteger(index) ? Math.max(0, Math.min(S.a[side].length - 1, index)) : S.a[side].length - 1;
  S.a[side].splice(idx, 1);
  S.sideBreakCd[side] = 0.2;
  S.runStats.modulesBroken += 1;
  pushEv(reason + " removed 1 module on " + side + " side.");
  return true;
}

function resolveAxis(entity, axis, dt, isPlayer) {
  const rest = isPlayer ? (S.pistonBounce > 0 ? 0.82 : 0.28) : 0.22;
  const blockBuild = !isPlayer && buildZoneBlocksRun();

  if (axis === "x") {
    entity.x += entity.vx * dt;
    const o = collectOverlaps(entity.x, entity.y, entity.size, blockBuild);
    if (!o.length) return;
    const impact = Math.abs(entity.vx);
    if (entity.vx > 0) {
      const minX = o.reduce((m, c) => Math.min(m, c.x), Infinity);
      entity.x = minX - entity.size / 2 - EPS;
      entity.vx = -entity.vx * rest;
      if (isPlayer) breakSide("right", impact, "Wall impact");
    } else if (entity.vx < 0) {
      const maxX = o.reduce((m, c) => Math.max(m, c.x), -Infinity);
      entity.x = maxX + 1 + entity.size / 2 + EPS;
      entity.vx = -entity.vx * rest;
      if (isPlayer) breakSide("left", impact, "Wall impact");
    }
  } else {
    entity.y += entity.vy * dt;
    const o = collectOverlaps(entity.x, entity.y, entity.size, blockBuild);
    if (!o.length) return;
    const impact = Math.abs(entity.vy);
    if (entity.vy > 0) {
      const minY = o.reduce((m, c) => Math.min(m, c.y), Infinity);
      entity.y = minY - entity.size / 2 - EPS;
      entity.vy = -entity.vy * rest;
      if (isPlayer) breakSide("down", impact, "Wall impact");
    } else if (entity.vy < 0) {
      const maxY = o.reduce((m, c) => Math.max(m, c.y), -Infinity);
      entity.y = maxY + 1 + entity.size / 2 + EPS;
      entity.vy = -entity.vy * rest;
      if (isPlayer) breakSide("up", impact, "Wall impact");
    }
  }
}

function emitterActive(em) {
  const cycle = em.activeFor + em.pauseFor;
  const t = (S.levelTime + em.phase) % cycle;
  return t < em.activeFor;
}

function sideAttachmentAnchor(side, depth = 1) {
  const p = { x: S.p.x, y: S.p.y };
  const idx = Math.max(0, depth - 1);
  const off = moduleOffset(side, idx);
  const step = S.phase === "build" ? 1 : S.p.size;
  return { x: p.x + off.ox * step, y: p.y + off.oy * step };
}

function sideAttachmentAnchors(side) {
  const out = [];
  for (let i = 0; i < S.a[side].length; i++) {
    out.push(sideAttachmentAnchor(side, i + 1));
  }
  return out;
}

function attachmentAtWorld(wx, wy, radius = 0.45) {
  let best = null;
  let bestD = Infinity;
  for (const side of SIDES) {
    for (let i = 0; i < S.a[side].length; i++) {
      const a = sideAttachmentAnchor(side, i + 1);
      const d = Math.hypot(a.x - wx, a.y - wy);
      if (d <= radius && d < bestD) {
        bestD = d;
        const off = moduleOffset(side, i);
        best = { side, index: i, ox: off.ox, oy: off.oy };
      }
    }
  }
  return best;
}

function beginAttachmentDrag(wx, wy) {
  if (!workstationActive()) return false;
  const hit = attachmentAtWorld(wx, wy);
  if (!hit) return false;
  const mod = S.a[hit.side][hit.index];
  if (!mod) return false;
  S.a[hit.side].splice(hit.index, 1);
  S.drag = {
    mod: { ...mod, pop: 1 },
    fallbackSide: hit.side,
    fallbackOx: hit.ox,
    fallbackOy: hit.oy
  };
  return true;
}

function endAttachmentDrag(wx, wy) {
  if (!S.drag) return false;
  const d = S.drag;
  const step = S.p.size;
  const ox = Math.round((wx - S.p.x) / step);
  const oy = Math.round((wy - S.p.y) / step);
  let placed = false;
  if (!(ox === 0 && oy === 0) && !moduleAtOffset(ox, oy)) {
    const side = sideForOffset(ox, oy);
    placed = addModuleAtOffset(side, d.mod, ox, oy);
  }
  if (!placed) addModuleAtOffset(d.fallbackSide, d.mod, d.fallbackOx, d.fallbackOy);
  S.drag = null;
  return true;
}

function bulletHitsPlayer(b) {
  const h = S.p.size / 2;
  return b.x >= S.p.x - h && b.x <= S.p.x + h && b.y >= S.p.y - h && b.y <= S.p.y + h;
}

function bulletBreakAttachments(b) {
  for (const side of SIDES) {
    if (!S.a[side].length) continue;
    for (const a of sideAttachmentAnchors(side)) {
      if (Math.hypot(a.x - b.x, a.y - b.y) <= 0.36) {
        breakSideForced(side, "Laser bullet");
        return true;
      }
    }
  }
  return false;
}

function scoreLaserDistance(lw, x, y) {
  if (lw.o === "h") return pointSegmentDistance(x, y, lw.sx, lw.y + 0.5, lw.ex + 1, lw.y + 0.5);
  return pointSegmentDistance(x, y, lw.x + 0.5, lw.sy, lw.x + 0.5, lw.ey + 1);
}

function spawnScoreLaserWall() {
  if (!isScoreMode() || S.phase !== "run" || S.boss) return false;
  const halfW = Math.max(10, Math.floor(ui.c.width / CELL / 2) - 2);
  const halfH = Math.max(7, Math.floor(ui.c.height / CELL / 2) - 2);

  for (let at = 0; at < 220; at++) {
    const o = Math.random() < 0.5 ? "h" : "v";
    const len = 2 + Math.floor(Math.random() * 3);
    const cx = Math.floor(S.p.x + (Math.random() * 2 - 1) * halfW);
    const cy = Math.floor(S.p.y + (Math.random() * 2 - 1) * halfH);

    if (o === "h") {
      const sx = cx - Math.floor(len / 2);
      const ex = sx + len - 1;
      const y = cy;
      if (!solid(sx - 1, y) || !solid(ex + 1, y)) continue;
      let blocked = false;
      for (let x = sx; x <= ex; x++) {
        if (solid(x, y) || (buildZoneBlocksRun() && inBuild(x, y))) {
          blocked = true;
          break;
        }
      }
      if (blocked) continue;
      if (Math.hypot((sx + ex + 1) / 2 - S.p.x, y + 0.5 - S.p.y) < 3.2) continue;
      if (S.scoreLaserWalls.some((w) => w.o === "h" && w.y === y && !(w.ex < sx - 1 || ex < w.sx - 1))) continue;
      S.scoreLaserWalls.push({ o: "h", sx, ex, y, ttl: 5.8, hitCd: 0 });
      if (S.scoreLaserWalls.length > 16) S.scoreLaserWalls.shift();
      return true;
    }

    const sy = cy - Math.floor(len / 2);
    const ey = sy + len - 1;
    const x = cx;
    if (!solid(x, sy - 1) || !solid(x, ey + 1)) continue;
    let blocked = false;
    for (let y = sy; y <= ey; y++) {
      if (solid(x, y) || (buildZoneBlocksRun() && inBuild(x, y))) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;
    if (Math.hypot(x + 0.5 - S.p.x, (sy + ey + 1) / 2 - S.p.y) < 3.2) continue;
    if (S.scoreLaserWalls.some((w) => w.o === "v" && w.x === x && !(w.ey < sy - 1 || ey < w.sy - 1))) continue;
    S.scoreLaserWalls.push({ o: "v", x, sy, ey, ttl: 5.8, hitCd: 0 });
    if (S.scoreLaserWalls.length > 16) S.scoreLaserWalls.shift();
    return true;
  }
  return false;
}

function scoreLaserBreakAttachment(lw) {
  for (const side of SIDES) {
    if (!S.a[side].length) continue;
    const anchors = sideAttachmentAnchors(side);
    for (let i = 0; i < anchors.length; i++) {
      const a = anchors[i];
      if (scoreLaserDistance(lw, a.x, a.y) <= 0.36) return breakSingleAttachment(side, i, "Laser wall");
    }
  }
  return false;
}

function scoreLaserHitsPlayer(lw) {
  return scoreLaserDistance(lw, S.p.x, S.p.y) <= S.p.size / 2 + 0.06;
}

function updateScoreLaserWalls(dt) {
  if (!isScoreMode() || S.phase !== "run") return;
  if (S.boss) {
    S.scoreLaserWalls = [];
    return;
  }

  S.scoreLaserCd -= dt;
  if (S.scoreLaserCd <= 0) {
    if (spawnScoreLaserWall()) S.scoreLaserCd = 2.4 + Math.random() * 1.8;
    else S.scoreLaserCd = 1.1;
  }

  for (let i = S.scoreLaserWalls.length - 1; i >= 0; i--) {
    const lw = S.scoreLaserWalls[i];
    lw.ttl -= dt;
    lw.hitCd = Math.max(0, (lw.hitCd || 0) - dt);
    if (lw.ttl <= 0) {
      S.scoreLaserWalls.splice(i, 1);
      continue;
    }
    if (scoreLaserHitsPlayer(lw)) {
      gameOver("Laser wall hit the red cube");
      return;
    }
    if (lw.hitCd <= 0 && scoreLaserBreakAttachment(lw)) lw.hitCd = 0.18;
  }
}

function spawnBullet(em) {
  if (em.o === "h") {
    const x = em.dir > 0 ? em.sx + 0.5 : em.ex + 0.5;
    return { x, y: em.y + 0.5, vx: em.dir * em.speed, vy: 0, ttl: 7 };
  }
  const y = em.dir > 0 ? em.sy + 0.5 : em.ey + 0.5;
  return { x: em.x + 0.5, y, vx: 0, vy: em.dir * em.speed, ttl: 7 };
}

function bulletInsideEmitterLane(b, em) {
  if (em.o === "h") {
    return b.x >= em.sx - 0.6 && b.x <= em.ex + 1.6 && Math.abs(b.y - (em.y + 0.5)) <= 0.4;
  }
  return b.y >= em.sy - 0.6 && b.y <= em.ey + 1.6 && Math.abs(b.x - (em.x + 0.5)) <= 0.4;
}

function updateLaserBullets(dt) {
  for (const em of S.emitters) {
    if (!emitterActive(em)) continue;
    em.shotClock -= dt;
    while (em.shotClock <= 0) {
      S.bullets.push(spawnBullet(em));
      em.shotClock += em.fireEvery;
    }
  }

  for (let i = S.bullets.length - 1; i >= 0; i--) {
    const b = S.bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.ttl -= dt;

    if (b.ttl <= 0) {
      S.bullets.splice(i, 1);
      continue;
    }

    let laneOk = false;
    for (const em of S.emitters) {
      if (bulletInsideEmitterLane(b, em)) {
        laneOk = true;
        break;
      }
    }
    if (!laneOk) {
      S.bullets.splice(i, 1);
      continue;
    }

    if (bulletBreakAttachments(b)) {
      S.bullets.splice(i, 1);
      continue;
    }

    if (bulletHitsPlayer(b)) {
      S.bullets.splice(i, 1);
      gameOver("Laser bullet hit the red cube");
      return;
    }
  }
}

function fireEnemyBullet(x, y, vx, vy, ttl = 6, isLaser = false, kind = "blue", maxDist = BULLET_RANGE_TILES) {
  S.enemyBullets.push({ x, y, vx, vy, ttl, isLaser, kind, dist: 0, maxDist });
}

function enemyBulletBreakAttachments(b) {
  for (const side of SIDES) {
    if (!S.a[side].length) continue;
    const anchors = sideAttachmentAnchors(side);
    for (let i = 0; i < anchors.length; i++) {
      const a = anchors[i];
      if (Math.hypot(a.x - b.x, a.y - b.y) <= 0.36) {
        return breakSingleAttachment(side, i, b.isLaser ? "Boss laser" : "Enemy shot");
      }
    }
  }
  return false;
}

function cancelEnemyBulletWithGunBullet(b) {
  for (let i = S.gunBullets.length - 1; i >= 0; i--) {
    const g = S.gunBullets[i];
    const hitRadius = b.isLaser ? 0.36 : 0.28;
    if (Math.hypot(g.x - b.x, g.y - b.y) <= hitRadius) {
      S.gunBullets.splice(i, 1);
      return true;
    }
  }
  return false;
}

function updateEnemyBullets(dt) {
  const swordActive = isScoreMode() && S.phase === "run" && S.swordCount > 0 && !playerInBlockedBuildZone();
  const sword = swordActive ? swordGeom() : null;
  for (let i = S.enemyBullets.length - 1; i >= 0; i--) {
    const b = S.enemyBullets[i];
    const ox = b.x;
    const oy = b.y;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.ttl -= dt;
    b.dist = (b.dist || 0) + Math.hypot(b.x - ox, b.y - oy);
    if (
      b.ttl <= 0 ||
      b.dist >= (b.maxDist || BULLET_RANGE_TILES) ||
      (!isScoreMode() && (b.x < 1 || b.x > W - 1 || b.y < 1 || b.y > H - 1))
    ) {
      S.enemyBullets.splice(i, 1);
      continue;
    }
    if (enemyProjectileBlockedAt(b.x, b.y)) {
      S.enemyBullets.splice(i, 1);
      continue;
    }
    if (enemyBulletBreakAttachments(b)) {
      S.enemyBullets.splice(i, 1);
      continue;
    }
    if (cancelEnemyBulletWithGunBullet(b)) {
      S.enemyBullets.splice(i, 1);
      continue;
    }
    let hitRedMini = false;
    for (let ri = S.redMini.length - 1; ri >= 0; ri--) {
      const r = S.redMini[ri];
      const h = r.size / 2;
      if (b.x >= r.x - h && b.x <= r.x + h && b.y >= r.y - h && b.y <= r.y + h) {
        damageRedMini(ri, b.isLaser ? 2 : 1, "Red mini cube destroyed by enemy fire.");
        hitRedMini = true;
        break;
      }
    }
    if (hitRedMini) {
      S.enemyBullets.splice(i, 1);
      continue;
    }
    if (sword && b.kind === "blue") {
      const br = (b.isLaser ? 4.6 : 3.4) / CELL;
      if (swordHitsEntity(b.x, b.y, br, sword)) {
        S.enemyBullets.splice(i, 1);
        continue;
      }
    }
    if (bulletHitsPlayer(b)) {
      S.enemyBullets.splice(i, 1);
      const src = b.kind === "white" ? "White cube shot" : b.kind === "green" ? "Green cube shot" : "Blue cube shot";
      gameOver(b.isLaser ? "Boss laser hit the red cube" : src + " hit the red cube");
      return;
    }
  }
}

function updateEnemyGuns(dt) {
  if (!isScoreMode()) return;
  if (S.score < 10) return;
  const empowered = S.score >= 50;
  const attachedMode = S.score >= 200;
  for (const e of S.enemy) {
    ensureEnemyInventory(e);
    e.shootCd -= dt;
    e.factoryCd -= dt;

    const gunBoost = empowered ? e.pickGun : 0;
    const rapidBoost = empowered ? e.pickRapid : 0;
    const aiBoost = empowered ? e.pickAIGun : 0;
    const purpleBoost = empowered ? e.pickPurple : 0;
    const burstBoost = empowered ? e.pickBurst : 0;
    const facBoost = empowered ? e.pickFactory : 0;
    const swordBoost = empowered ? e.pickSword : 0;
    const totalBoost = gunBoost + rapidBoost + aiBoost + purpleBoost + burstBoost + facBoost + swordBoost;

    if (e.shootCd <= 0) {
      const rateMul = 1 + gunBoost * 0.16 + rapidBoost * 0.38 + aiBoost * 0.17 + purpleBoost * 0.22 + facBoost * 0.12;
      const baseCd = attachedMode ? Math.max(0.11, 0.7 / rateMul) : Math.max(0.28, 1.35 / rateMul);
      e.shootCd = baseCd + Math.random() * (attachedMode ? 0.28 : 0.95);

      let tx = S.p.x;
      let ty = S.p.y;
      if (aiBoost > 0) {
        const lead = attachedMode ? Math.min(0.72, 0.28 + aiBoost * 0.09) : Math.min(0.45, 0.2 + aiBoost * 0.05);
        tx += S.p.vx * lead;
        ty += S.p.vy * lead;
      }
      const adx = tx - e.x;
      const ady = ty - e.y;
      const ad = Math.hypot(adx, ady) || 1;
      const nx = adx / ad;
      const ny = ady / ad;

      const speed = attachedMode
        ? 8.2 + gunBoost * 0.45 + rapidBoost * 0.38 + aiBoost * 0.56 + purpleBoost * 0.52 + facBoost * 0.28
        : 7.2 + gunBoost * 0.35 + rapidBoost * 0.25 + aiBoost * 0.42 + purpleBoost * 0.36 + facBoost * 0.2;

      if (attachedMode && totalBoost > 0) {
        const totalShots = Math.min(10, 1 + gunBoost + rapidBoost + Math.ceil(aiBoost * 0.8) + Math.ceil(purpleBoost * 0.7));
        const spread = 0.05 + Math.min(0.2, totalShots * 0.012);
        const mid = (totalShots - 1) / 2;
        for (let i = 0; i < totalShots; i++) {
          const off = (i - mid) * spread;
          const sx = nx - ny * off;
          const sy = ny + nx * off;
          const sd = Math.hypot(sx, sy) || 1;
          fireEnemyBullet(e.x, e.y, (sx / sd) * speed, (sy / sd) * speed, 6, false, "blue");
        }
      } else {
        fireEnemyBullet(e.x, e.y, nx * speed, ny * speed, 6, false, "blue");
        if (totalBoost > 0) {
          const spread = 0.14 + Math.min(0.14, totalBoost * 0.01);
          fireEnemyBullet(e.x, e.y, (nx - ny * spread) * speed, (ny + nx * spread) * speed, 6, false, "blue");
          if (totalBoost >= 3) fireEnemyBullet(e.x, e.y, (nx + ny * spread) * speed, (ny - nx * spread) * speed, 6, false, "blue");
        }
      }
    }

    if (attachedMode && facBoost > 0 && e.factoryCd <= 0) {
      e.factoryCd = Math.max(0.55, 1.7 / (1 + facBoost * 0.35));
      const ringShots = Math.min(8, 3 + facBoost);
      const burstSpeed = 7.4 + facBoost * 0.42;
      for (let i = 0; i < ringShots; i++) {
        const a = (Math.PI * 2 * i) / ringShots;
        fireEnemyBullet(e.x, e.y, Math.cos(a) * burstSpeed, Math.sin(a) * burstSpeed, 5.2, false, "blue");
      }
    }

    if (empowered && burstBoost > 0) {
      e.burstCd -= dt;
      if (e.burstCd <= 0) {
        e.burstCd = Math.max(0.75, 2.4 / (1 + burstBoost * 0.42));
        const ringShots = Math.min(30, 8 + burstBoost * 3);
        const burstSpeed = 7 + burstBoost * 0.32;
        for (let i = 0; i < ringShots; i++) {
          const a = (Math.PI * 2 * i) / ringShots;
          fireEnemyBullet(e.x, e.y, Math.cos(a) * burstSpeed, Math.sin(a) * burstSpeed, 4.9, false, "blue");
        }
      }
    }
  }
}

function updateGreenCube(dt) {
  if (!isScoreMode() || S.phase !== "run") return;
  const g = S.greenCube;
  if (!g) return;
  g.shootCd -= dt;
  if (g.shootCd > 0) return;

  g.shootCd = 0.8 + Math.random() * 0.45;
  const dx = S.p.x - g.x;
  const dy = S.p.y - g.y;
  const d = Math.hypot(dx, dy) || 1;
  const nx = dx / d;
  const ny = dy / d;
  const speed = 8.2;
  fireEnemyBullet(g.x, g.y, nx * speed, ny * speed, 7.2, false, "green");
  fireEnemyBullet(g.x, g.y, (nx - ny * 0.14) * speed, (ny + nx * 0.14) * speed, 7.2, false, "green");
  fireEnemyBullet(g.x, g.y, (nx + ny * 0.14) * speed, (ny - nx * 0.14) * speed, 7.2, false, "green");
}

function updateBoss(dt) {
  if (!S.boss) return;
  const b = S.boss;
  if (isScoreMode()) {
    const tx = S.p.x;
    const ty = S.p.y;
    const dx = tx - b.x;
    const dy = ty - b.y;
    const d = Math.hypot(dx, dy) || 1;
    const moveMul = b.moveMul || 1;
    b.vx += (dx / d) * 5.2 * moveMul * dt;
    b.vy += (dy / d) * 5.2 * moveMul * dt;
    const fScore = Math.exp(-2.25 * dt);
    b.vx *= fScore;
    b.vy *= fScore;
    const maxScoreSp = 4.4 * moveMul;
    const scoreSp = Math.hypot(b.vx, b.vy);
    if (scoreSp > maxScoreSp) {
      const k = maxScoreSp / scoreSp;
      b.vx *= k;
      b.vy *= k;
    }

    const scoreSteps = Math.max(1, Math.ceil((Math.abs(b.vx) + Math.abs(b.vy)) * dt / 0.35));
    const scoreSd = dt / scoreSteps;
    for (let i = 0; i < scoreSteps; i++) {
      resolveAxis(b, "x", scoreSd, false);
      resolveAxis(b, "y", scoreSd, false);
    }

    b.shootCd -= dt;
    if (b.shootCd <= 0) {
      b.shootCd = 0.22;
      const stx = S.p.x - b.x;
      const sty = S.p.y - b.y;
      const std = Math.hypot(stx, sty) || 1;
      const snx = stx / std;
      const sny = sty / std;
      const speed = 11.8 * moveMul;
      const range = b.bulletRange || BULLET_RANGE_TILES;
      fireEnemyBullet(b.x, b.y, snx * speed, sny * speed, 6.5, false, "blue", range);
      fireEnemyBullet(b.x, b.y, (snx - sny * 0.18) * speed, (sny + snx * 0.18) * speed, 6.5, false, "blue", range);
      fireEnemyBullet(b.x, b.y, (snx + sny * 0.18) * speed, (sny - snx * 0.18) * speed, 6.5, false, "blue", range);
    }

    b.laserCd -= dt;
    if (b.laserCd <= 0) {
      b.laserCd = 0.9;
      const ls = 10.5 * moveMul;
      const lrange = b.bulletRange || BULLET_RANGE_TILES;
      fireEnemyBullet(b.x, b.y, ls, 0, 3.2, true, "blue", lrange);
      fireEnemyBullet(b.x, b.y, -ls, 0, 3.2, true, "blue", lrange);
      fireEnemyBullet(b.x, b.y, 0, ls, 3.2, true, "blue", lrange);
      fireEnemyBullet(b.x, b.y, 0, -ls, 3.2, true, "blue", lrange);
    }
    return;
  }

  const sx = Math.max(1, Math.min(W - 2, Math.floor(b.x)));
  const sy = Math.max(1, Math.min(H - 2, Math.floor(b.y)));
  const px = Math.max(1, Math.min(W - 2, Math.floor(S.p.x)));
  const py = Math.max(1, Math.min(H - 2, Math.floor(S.p.y)));
  const target = buildZoneBlocksRun() && inBuild(px, py)
    ? (nearestOutsideBuildCell(px, py, sx, sy) || { x: sx, y: sy })
    : { x: px, y: py };

  b.repath -= dt;
  if (b.repath <= 0 || !b.path.length) {
    const path = findGridPath(sx, sy, target.x, target.y);
    b.path = path && path.length ? path : [];
    b.repath = 0.28;
  }

  let aimX = target.x + 0.5;
  let aimY = target.y + 0.5;
  if (b.path.length > 1) {
    aimX = b.path[1].x + 0.5;
    aimY = b.path[1].y + 0.5;
    if (Math.hypot(aimX - b.x, aimY - b.y) < 0.24) b.path.shift();
  }

  const dx = aimX - b.x;
  const dy = aimY - b.y;
  const d = Math.hypot(dx, dy) || 1;
  b.vx += (dx / d) * 4.8 * dt;
  b.vy += (dy / d) * 4.8 * dt;
  const f = Math.exp(-2.2 * dt);
  b.vx *= f;
  b.vy *= f;
  const maxSp = 4.1;
  const sp = Math.hypot(b.vx, b.vy);
  if (sp > maxSp) {
    const k = maxSp / sp;
    b.vx *= k;
    b.vy *= k;
  }

  const steps = Math.max(1, Math.ceil((Math.abs(b.vx) + Math.abs(b.vy)) * dt / 0.35));
  const sd = dt / steps;
  for (let i = 0; i < steps; i++) {
    resolveAxis(b, "x", sd, false);
    resolveAxis(b, "y", sd, false);
  }

  b.shootCd -= dt;
  if (b.shootCd <= 0) {
    b.shootCd = 0.65;
    const tx = S.p.x - b.x;
    const ty = S.p.y - b.y;
    const td = Math.hypot(tx, ty) || 1;
    const nx = tx / td;
    const ny = ty / td;
    const speed = 8.6;
    fireEnemyBullet(b.x, b.y, nx * speed, ny * speed, 6.5, false);
    fireEnemyBullet(b.x, b.y, (nx - ny * 0.18) * speed, (ny + nx * 0.18) * speed, 6.5, false);
    fireEnemyBullet(b.x, b.y, (nx + ny * 0.18) * speed, (ny - nx * 0.18) * speed, 6.5, false);
  }

  b.laserCd -= dt;
  if (b.laserCd <= 0) {
    b.laserCd = 1.35;
    const ls = 10.5;
    fireEnemyBullet(b.x, b.y, ls, 0, 3.2, true);
    fireEnemyBullet(b.x, b.y, -ls, 0, 3.2, true);
    fireEnemyBullet(b.x, b.y, 0, ls, 3.2, true);
    fireEnemyBullet(b.x, b.y, 0, -ls, 3.2, true);
  }
}

function enemyTouchSide(e) {
  const dx = e.x - S.p.x;
  const dy = e.y - S.p.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}

function nearestAttachmentSideToEnemy(e) {
  let bestSide = null;
  let bestIndex = -1;
  let bestAnchor = null;
  let bestD = Infinity;
  for (const side of SIDES) {
    if (!S.a[side].length) continue;
    const anchors = sideAttachmentAnchors(side);
    for (let i = 0; i < anchors.length; i++) {
      const a = anchors[i];
      const d = Math.hypot(a.x - e.x, a.y - e.y);
      if (d < bestD) {
        bestD = d;
        bestSide = side;
        bestIndex = i;
        bestAnchor = a;
      }
    }
  }
  return { side: bestSide, index: bestIndex, anchor: bestAnchor, dist: bestD };
}

function nearestRedMiniFrom(x, y) {
  let best = null;
  let bestD = Infinity;
  for (let i = 0; i < S.redMini.length; i++) {
    const r = S.redMini[i];
    const d = Math.hypot(r.x - x, r.y - y);
    if (d < bestD) {
      bestD = d;
      best = { index: i, x: r.x, y: r.y, size: r.size, dist: d };
    }
  }
  return best;
}

function damageRedMini(index, dmg, reason = "Red mini cube destroyed.") {
  const r = S.redMini[index];
  if (!r) return false;
  r.hp -= dmg;
  if (r.hp > 0) return false;
  S.redMini.splice(index, 1);
  pushEv(reason);
  return true;
}

function enemyAttachmentRamHit(e) {
  const eh = e.size / 2;
  const ah = 0.34;
  let best = null;
  let bestD = Infinity;

  for (const side of SIDES) {
    if (!S.a[side].length) continue;
    const anchors = sideAttachmentAnchors(side);
    for (let i = 0; i < anchors.length; i++) {
      const a = anchors[i];
      const dx = Math.abs(e.x - a.x);
      const dy = Math.abs(e.y - a.y);
      if (dx <= eh + ah && dy <= eh + ah) {
        const d = Math.hypot(e.x - a.x, e.y - a.y);
        if (d < bestD) {
          bestD = d;
          best = { side, index: i, anchor: a };
        }
      }
    }
  }
  return best;
}

function enemyAttachmentTargets() {
  const out = [];
  for (const side of SIDES) {
    if (!S.a[side].length) continue;
    for (let i = 0; i < S.a[side].length; i++) {
      const a = sideAttachmentAnchor(side, i + 1);
      out.push({ side, index: i, x: a.x, y: a.y, key: side + ":" + i });
    }
  }
  if (!out.length) {
    out.push({ side: null, x: S.p.x, y: S.p.y, key: "player:" + Math.floor(S.p.x) + ":" + Math.floor(S.p.y) });
  }
  return out;
}

function findGridPath(sx, sy, tx, ty) {
  if (sx === tx && sy === ty) return [{ x: sx, y: sy }];
  const pass = (x, y) => x > 0 && x < W - 1 && y > 0 && y < H - 1 && !solid(x, y) && (!buildZoneBlocksRun() || !inBuild(x, y));
  if (!pass(sx, sy) || !pass(tx, ty)) return null;

  const q = [[sx, sy]];
  const seen = Array.from({ length: H }, () => Array(W).fill(false));
  const parent = Array.from({ length: H }, () => Array(W).fill(null));
  seen[sy][sx] = true;

  let head = 0;
  while (head < q.length) {
    const [x, y] = q[head++];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (!pass(nx, ny) || seen[ny][nx]) continue;
      seen[ny][nx] = true;
      parent[ny][nx] = [x, y];
      if (nx === tx && ny === ty) {
        const path = [{ x: tx, y: ty }];
        let cx = tx;
        let cy = ty;
        while (!(cx === sx && cy === sy)) {
          const p = parent[cy][cx];
          if (!p) break;
          cx = p[0];
          cy = p[1];
          path.push({ x: cx, y: cy });
        }
        path.reverse();
        return path;
      }
      q.push([nx, ny]);
    }
  }
  return null;
}

function nearestOutsideBuildCell(tx, ty, sx, sy) {
  const candidates = [];
  const leftX = BUILD.x - 1;
  const rightX = BUILD.x + BUILD.w;
  const topY = BUILD.y - 1;
  const bottomY = BUILD.y + BUILD.h;

  for (let y = BUILD.y; y < BUILD.y + BUILD.h; y++) {
    candidates.push({ x: leftX, y });
    candidates.push({ x: rightX, y });
  }
  for (let x = BUILD.x; x < BUILD.x + BUILD.w; x++) {
    candidates.push({ x, y: topY });
    candidates.push({ x, y: bottomY });
  }

  let best = null;
  let bestScore = Infinity;
  for (const c of candidates) {
    if (c.x <= 0 || c.x >= W - 1 || c.y <= 0 || c.y >= H - 1) continue;
    if (solid(c.x, c.y) || inBuild(c.x, c.y)) continue;
    const score = Math.abs(c.x - tx) + Math.abs(c.y - ty) + 0.25 * (Math.abs(c.x - sx) + Math.abs(c.y - sy));
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

function nearestOutsideBuildCellWorld(tx, ty, sx, sy) {
  const candidates = [];
  const leftX = BUILD.x - 1;
  const rightX = BUILD.x + BUILD.w;
  const topY = BUILD.y - 1;
  const bottomY = BUILD.y + BUILD.h;

  for (let y = BUILD.y; y < BUILD.y + BUILD.h; y++) {
    candidates.push({ x: leftX, y });
    candidates.push({ x: rightX, y });
  }
  for (let x = BUILD.x; x < BUILD.x + BUILD.w; x++) {
    candidates.push({ x, y: topY });
    candidates.push({ x, y: bottomY });
  }

  let best = null;
  let bestScore = Infinity;
  for (const c of candidates) {
    if (solid(c.x, c.y) || inBuild(c.x, c.y)) continue;
    const score = Math.abs(c.x - tx) + Math.abs(c.y - ty) + 0.25 * (Math.abs(c.x - sx) + Math.abs(c.y - sy));
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

function findScorePath(sx, sy, tx, ty, range = 18) {
  const pass = (x, y) => !solid(x, y) && (!buildZoneBlocksRun() || !inBuild(x, y));
  if (!pass(sx, sy)) return null;

  if (!pass(tx, ty)) {
    const outside = nearestOutsideBuildCellWorld(tx, ty, sx, sy);
    if (!outside) return null;
    tx = outside.x;
    ty = outside.y;
  }

  const minX = sx - range;
  const maxX = sx + range;
  const minY = sy - range;
  const maxY = sy + range;
  const inBounds = (x, y) => x >= minX && x <= maxX && y >= minY && y <= maxY;
  if (!inBounds(tx, ty)) {
    tx = Math.max(minX, Math.min(maxX, tx));
    ty = Math.max(minY, Math.min(maxY, ty));
  }

  const q = [[sx, sy]];
  const seen = new Set([sx + "," + sy]);
  const parent = new Map();
  let head = 0;
  let foundKey = null;
  let bestKey = sx + "," + sy;
  let bestScore = Math.abs(tx - sx) + Math.abs(ty - sy);

  while (head < q.length) {
    const [x, y] = q[head++];
    const key = x + "," + y;
    const score = Math.abs(tx - x) + Math.abs(ty - y);
    if (score < bestScore) {
      bestScore = score;
      bestKey = key;
    }
    if (x === tx && y === ty) {
      foundKey = key;
      break;
    }

    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      const nk = nx + "," + ny;
      if (!inBounds(nx, ny) || !pass(nx, ny) || seen.has(nk)) continue;
      seen.add(nk);
      parent.set(nk, key);
      q.push([nx, ny]);
    }
  }

  const endKey = foundKey || bestKey;
  if (!endKey) return null;
  const path = [];
  let cur = endKey;
  while (cur) {
    const [x, y] = cur.split(",").map(Number);
    path.push({ x, y });
    if (x === sx && y === sy) break;
    cur = parent.get(cur);
  }
  path.reverse();
  return path.length ? path : null;
}

function worldRayBlocked(ax, ay, bx, by) {
  const d = Math.hypot(bx - ax, by - ay);
  const steps = Math.max(1, Math.ceil(d / 0.34));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    const cx = Math.floor(x);
    const cy = Math.floor(y);
    if (solid(cx, cy) || (buildZoneBlocksRun() && inBuild(cx, cy))) return true;
  }
  return false;
}

function nearestScoreTargetForEnemy(e, targets) {
  if (!targets.length) return { side: null, index: -1, x: S.p.x, y: S.p.y, key: "player:fallback" };
  let best = null;
  let bestScore = Infinity;
  for (const t of targets) {
    const d = Math.hypot(t.x - e.x, t.y - e.y);
    const score = d + (t.side ? 0 : 0.45);
    if (score < bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return best || { side: null, index: -1, x: S.p.x, y: S.p.y, key: "player:fallback" };
}

function updateEnemies(dt) {
  const scoreMode = isScoreMode();
  const scoreTargetsBase = scoreMode ? enemyAttachmentTargets() : [];
  for (const e of S.enemy) {
    if (scoreMode) {
      ensureEnemyInventory(e);
      const sx = Math.floor(e.x);
      const sy = Math.floor(e.y);
      const distToPlayer = Math.hypot(S.p.x - e.x, S.p.y - e.y);
      if (distToPlayer > 56) {
        if (relocateEnemyNearPlayer(e, 8, 14)) continue;
      }

      const powered = S.score >= 50;
      const powerLevel = powered ? (e.pickGun + e.pickRapid + e.pickAIGun + e.pickFactory + e.pickSword) : 0;
      const targets = scoreTargetsBase.map((t) => ({ ...t, targetType: "attachment", redMiniIndex: -1 }));
      for (let i = 0; i < S.redMini.length; i++) {
        const r = S.redMini[i];
        targets.push({
          side: null,
          index: -1,
          x: r.x,
          y: r.y,
          key: "redmini:" + i,
          targetType: "redmini",
          redMiniIndex: i
        });
      }
      const nearest = nearestScoreTargetForEnemy(e, targets);
      const ramTarget = {
        side: null,
        index: -1,
        x: S.p.x,
        y: S.p.y,
        key: "ram:" + Math.floor(S.p.x) + ":" + Math.floor(S.p.y),
        targetType: "player",
        redMiniIndex: -1
      };
      let best = nearest;
      const redNear = nearestRedMiniFrom(e.x, e.y);
      if (redNear && (redNear.dist < 8 || (powered && powerLevel > 0))) {
        const forced = targets.find((t) => t.targetType === "redmini" && t.redMiniIndex === redNear.index);
        if (forced) best = forced;
      }

      if (best.targetType !== "redmini") {
        const nearestDist = Math.hypot(nearest.x - e.x, nearest.y - e.y);
        const ramDist = Math.hypot(ramTarget.x - e.x, ramTarget.y - e.y);
        const noAttachmentTarget = !nearest.side || !S.a[nearest.side].length;
        if (noAttachmentTarget || ramDist < nearestDist * 0.82) best = ramTarget;
      }

      let tx = Math.floor(best.x);
      let ty = Math.floor(best.y);
      if (buildZoneBlocksRun() && inBuild(tx, ty)) {
        const outside = nearestOutsideBuildCellWorld(tx, ty, sx, sy);
        if (outside) {
          tx = outside.x;
          ty = outside.y;
        }
      }

      const newKey = best.key + ":" + tx + ":" + ty;
      e.repath -= dt;
      if (e.repath <= 0 || e.targetKey !== newKey) {
        let nextPath = [];
        if (worldRayBlocked(e.x, e.y, best.x, best.y)) {
          const pathRange = Math.max(18, Math.min(52, Math.floor(distToPlayer * 0.8) + 12));
          nextPath = findScorePath(sx, sy, tx, ty, pathRange) || [];
        }
        e.path = nextPath;
        e.targetKey = newKey;
        e.repath = nextPath.length ? 0.3 : 0.4;
      }

      let aimX = best.x;
      let aimY = best.y;
      if (e.path.length > 1) {
        const step = e.path[1];
        aimX = step.x + 0.5;
        aimY = step.y + 0.5;
        if (Math.hypot(aimX - e.x, aimY - e.y) < 0.22) e.path.shift();
      }

      const dxs = aimX - e.x;
      const dys = aimY - e.y;
      const ds = Math.hypot(dxs, dys) || 1;
      const accelS = 7.8 + Math.min(7.6, S.score / 22) + (powered ? e.pickSword * 1.1 : 0);
      e.vx += (dxs / ds) * accelS * dt;
      e.vy += (dys / ds) * accelS * dt;
      const fS = Math.exp(-2.35 * dt);
      e.vx *= fS;
      e.vy *= fS;
      const maxS = 8.2 + Math.min(3.4, S.score / 55) + (powered ? e.pickSword * 0.7 : 0);
      const spS = Math.hypot(e.vx, e.vy);
      if (spS > maxS) {
        const kS = maxS / spS;
        e.vx *= kS;
        e.vy *= kS;
      }
      const stepsS = Math.max(1, Math.ceil((Math.abs(e.vx) + Math.abs(e.vy)) * dt / 0.35));
      const sdS = dt / stepsS;
      for (let s = 0; s < stepsS; s++) {
        resolveAxis(e, "x", sdS, false);
        resolveAxis(e, "y", sdS, false);
      }

      const movedS = Math.hypot(e.x - (e.lastX ?? e.x), e.y - (e.lastY ?? e.y));
      if (movedS < 0.035) e.stuckTime = (e.stuckTime || 0) + dt;
      else e.stuckTime = Math.max(0, (e.stuckTime || 0) - dt * 1.8);
      e.lastX = e.x;
      e.lastY = e.y;
      if ((e.stuckTime || 0) > 1.1) {
        e.stuckTime = 0;
        if (relocateEnemyNearPlayer(e, 6, 12)) continue;
      }

      if (e.hitCd > 0) e.hitCd -= dt;

      if (e.hitCd <= 0 && best.targetType === "redmini" && Number.isInteger(best.redMiniIndex)) {
        const rm = S.redMini[best.redMiniIndex];
        if (rm && Math.hypot(e.x - rm.x, e.y - rm.y) <= (e.size + rm.size) / 2 + 0.08) {
          damageRedMini(best.redMiniIndex, 1, "Blue cube destroyed a red mini.");
          e.hitCd = powered && powerLevel > 0 ? 0.34 : 0.46;
          e.repath = 0;
          const kxR = e.x - rm.x;
          const kyR = e.y - rm.y;
          const kdR = Math.hypot(kxR, kyR) || 1;
          e.vx = (kxR / kdR) * 2.9;
          e.vy = (kyR / kdR) * 2.9;
          continue;
        }
      }

      if (e.hitCd <= 0) {
        const ramHit = enemyAttachmentRamHit(e);
        if (ramHit) {
          const didBreak = breakSingleAttachment(ramHit.side, ramHit.index, "Blue cube ram hit");
          if (moveModuleTotal() === 0) {
            gameOver("Blue cube removed all movement modules");
            return;
          }
          if (didBreak) {
            e.hitCd = 0.54;
            e.repath = 0;
            const kxS = e.x - ramHit.anchor.x;
            const kyS = e.y - ramHit.anchor.y;
            const kdS = Math.hypot(kxS, kyS) || 1;
            const kickS = 3.4;
            e.vx = (kxS / kdS) * kickS;
            e.vy = (kyS / kdS) * kickS;
            continue;
          }
        }
      }

      if (e.hitCd <= 0 && best.side && S.a[best.side].length) {
        const aS = { x: best.x, y: best.y };
        if (Math.hypot(e.x - aS.x, e.y - aS.y) <= 0.68) {
          const didBreak = breakSingleAttachment(best.side, best.index, "Blue cube attack");
          if (moveModuleTotal() === 0) {
            gameOver("Blue cube removed all movement modules");
            return;
          }
          if (didBreak) {
            e.hitCd = 0.5;
            const kxS = e.x - aS.x;
            const kyS = e.y - aS.y;
            const kdS = Math.hypot(kxS, kyS) || 1;
            const kickS = 3.2;
            e.vx = (kxS / kdS) * kickS;
            e.vy = (kyS / kdS) * kickS;
            continue;
          }
        }
      }

      const overlapX = Math.abs(e.x - S.p.x) <= (e.size + S.p.size) / 2;
      const overlapY = Math.abs(e.y - S.p.y) <= (e.size + S.p.size) / 2;
      if (overlapX && overlapY && e.hitCd <= 0) {
        const near = nearestAttachmentSideToEnemy(e);
        const side = near.side || enemyTouchSide(e);
        const didBreak = breakSingleAttachment(side, near.index, "Blue cube ram");
        if (moveModuleTotal() === 0) {
          gameOver("Blue cube removed all movement modules");
          return;
        }
        e.hitCd = 0.56;
        if (didBreak) e.repath = 0;
        const bounce = 3.35;
        if (side === "left") e.vx = -bounce;
        if (side === "right") e.vx = bounce;
        if (side === "up") e.vy = -bounce;
        if (side === "down") e.vy = bounce;
      }
      continue;
    }

    const targets = enemyAttachmentTargets();
    const sx = Math.max(1, Math.min(W - 2, Math.floor(e.x)));
    const sy = Math.max(1, Math.min(H - 2, Math.floor(e.y)));
    let best = targets[0];
    let bestPath = [];
    let bestTx = Math.max(1, Math.min(W - 2, Math.floor(best.x)));
    let bestTy = Math.max(1, Math.min(H - 2, Math.floor(best.y)));
    let bestScore = Infinity;

    for (const t of targets) {
      let tx = Math.max(1, Math.min(W - 2, Math.floor(t.x)));
      let ty = Math.max(1, Math.min(H - 2, Math.floor(t.y)));
      if (buildZoneBlocksRun() && inBuild(tx, ty)) {
        const outside = nearestOutsideBuildCell(tx, ty, sx, sy);
        if (outside) {
          tx = outside.x;
          ty = outside.y;
        }
      }
      const path = findGridPath(sx, sy, tx, ty);
      if (!path || !path.length) continue;
      const score = path.length + Math.hypot(t.x - e.x, t.y - e.y) * 0.15;
      if (score < bestScore) {
        bestScore = score;
        best = t;
        bestPath = path;
        bestTx = tx;
        bestTy = ty;
      }
    }

    const newKey = best.key + ":" + bestTx + ":" + bestTy;

    e.repath -= dt;
    if (e.repath <= 0 || !e.path.length || e.targetKey !== newKey) {
      e.path = bestPath && bestPath.length ? bestPath : [];
      e.targetKey = newKey;
      e.repath = 0.26;
    }

    let aimX = best.x;
    let aimY = best.y;
    if (e.path.length > 1) {
      const step = e.path[1];
      aimX = step.x + 0.5;
      aimY = step.y + 0.5;
      if (Math.hypot(aimX - e.x, aimY - e.y) < 0.2) e.path.shift();
    }

    const dx = aimX - e.x;
    const dy = aimY - e.y;
    const d = Math.hypot(dx, dy) || 1;
    const accel = 6.6 + level().n * 0.24;
    e.vx += (dx / d) * accel * dt;
    e.vy += (dy / d) * accel * dt;

    const drag = 1.9;
    const f = Math.exp(-drag * dt);
    e.vx *= f;
    e.vy *= f;

    const maxSp = 7.2 + level().n * 0.16;
    const sp = Math.hypot(e.vx, e.vy);
    if (sp > maxSp) {
      const k = maxSp / sp;
      e.vx *= k;
      e.vy *= k;
    }

    const steps = Math.max(1, Math.ceil((Math.abs(e.vx) + Math.abs(e.vy)) * dt / 0.35));
    const sd = dt / steps;
    for (let s = 0; s < steps; s++) {
      resolveAxis(e, "x", sd, false);
      resolveAxis(e, "y", sd, false);
    }

    if (e.hitCd > 0) e.hitCd -= dt;

    if (e.hitCd <= 0) {
      const ramHit = enemyAttachmentRamHit(e);
      if (ramHit) {
        const didBreak = breakSingleAttachment(ramHit.side, ramHit.index, "Blue cube ram hit");
        const totalMove = DIRS.reduce((sum, d) => sum + countMove(d), 0);
        if (totalMove === 0) {
          gameOver("Blue cube removed all movement modules");
          return;
        }
        if (didBreak) {
          e.hitCd = 0.54;
          e.repath = 0;
          const kx = e.x - ramHit.anchor.x;
          const ky = e.y - ramHit.anchor.y;
          const kd = Math.hypot(kx, ky) || 1;
          const kick = 3.4;
          e.vx = (kx / kd) * kick;
          e.vy = (ky / kd) * kick;
          continue;
        }
      }
    }

    if (e.hitCd <= 0 && best.side && S.a[best.side].length) {
      const a = { x: best.x, y: best.y };
      const dToAttachment = Math.hypot(e.x - a.x, e.y - a.y);
      if (dToAttachment <= 0.68) {
        const didBreak = breakSingleAttachment(best.side, best.index, "Blue cube attack");
        const totalMove = DIRS.reduce((sum, d) => sum + countMove(d), 0);
        if (totalMove === 0) {
          gameOver("Blue cube removed all movement modules");
          return;
        }
        if (didBreak) {
          e.hitCd = 0.5;
          e.repath = 0;
          const kx = e.x - a.x;
          const ky = e.y - a.y;
          const kd = Math.hypot(kx, ky) || 1;
          const kick = 3.2;
          e.vx = (kx / kd) * kick;
          e.vy = (ky / kd) * kick;
          continue;
        }
      }
    }

    const overlapX = Math.abs(e.x - S.p.x) <= (e.size + S.p.size) / 2;
    const overlapY = Math.abs(e.y - S.p.y) <= (e.size + S.p.size) / 2;
    if (overlapX && overlapY && e.hitCd <= 0) {
      const near = nearestAttachmentSideToEnemy(e);
      const side = near.side || enemyTouchSide(e);
      const didBreak = breakSingleAttachment(side, near.index, "Blue cube hit");
      const totalMove = DIRS.reduce((sum, d) => sum + countMove(d), 0);
      if (totalMove === 0) {
        gameOver("Blue cube removed all movement modules");
        return;
      }
      e.hitCd = 0.62;
      if (didBreak) e.repath = 0;
      const bounce = 3.1;
      if (side === "left") e.vx = -bounce;
      if (side === "right") e.vx = bounce;
      if (side === "up") e.vy = -bounce;
      if (side === "down") e.vy = bounce;
    }
  }
}

function updateWhiteCubes(dt) {
  if (!isScoreMode() || S.phase !== "run" || S.boss) return;
  const scoreTargetsBase = enemyAttachmentTargets();
  for (const w of S.white) {
    const sx = Math.floor(w.x);
    const sy = Math.floor(w.y);
    const distToPlayer = Math.hypot(S.p.x - w.x, S.p.y - w.y);
    if (distToPlayer > 56) {
      if (relocateEnemyNearPlayer(w, 8, 14)) continue;
    }

    const targets = scoreTargetsBase.map((t) => ({ ...t, targetType: "attachment", redMiniIndex: -1 }));
    for (let i = 0; i < S.redMini.length; i++) {
      const r = S.redMini[i];
      targets.push({
        side: null,
        index: -1,
        x: r.x,
        y: r.y,
        key: "redmini:" + i,
        targetType: "redmini",
        redMiniIndex: i
      });
    }
    let best = nearestScoreTargetForEnemy(w, targets);
    const redNear = nearestRedMiniFrom(w.x, w.y);
    if (redNear && redNear.dist < 7.2) {
      const forced = targets.find((t) => t.targetType === "redmini" && t.redMiniIndex === redNear.index);
      if (forced) best = forced;
    }

    if (best.targetType !== "redmini") {
      const noAttachmentTarget = !best.side || !S.a[best.side].length;
      if (noAttachmentTarget) {
        best = {
          side: null,
          index: -1,
          x: S.p.x,
          y: S.p.y,
          key: "player:" + Math.floor(S.p.x) + ":" + Math.floor(S.p.y),
          targetType: "player",
          redMiniIndex: -1
        };
      }
    }

    let tx = Math.floor(best.x);
    let ty = Math.floor(best.y);
    if (buildZoneBlocksRun() && inBuild(tx, ty)) {
      const outside = nearestOutsideBuildCellWorld(tx, ty, sx, sy);
      if (outside) {
        tx = outside.x;
        ty = outside.y;
      }
    }

    const newKey = best.key + ":" + tx + ":" + ty;
    w.repath -= dt;
    if (w.repath <= 0 || w.targetKey !== newKey) {
      w.path = worldRayBlocked(w.x, w.y, best.x, best.y) ? (findScorePath(sx, sy, tx, ty, 36) || []) : [];
      w.targetKey = newKey;
      w.repath = w.path.length ? 0.28 : 0.4;
    }

    let aimX = best.x;
    let aimY = best.y;
    if (w.path.length > 1) {
      const step = w.path[1];
      aimX = step.x + 0.5;
      aimY = step.y + 0.5;
      if (Math.hypot(aimX - w.x, aimY - w.y) < 0.22) w.path.shift();
    }

    const dx = aimX - w.x;
    const dy = aimY - w.y;
    const d = Math.hypot(dx, dy) || 1;
    w.vx += (dx / d) * 8.2 * dt;
    w.vy += (dy / d) * 8.2 * dt;
    const f = Math.exp(-2.6 * dt);
    w.vx *= f;
    w.vy *= f;
    const maxSp = 6.2 + (S.score >= 200 ? 0.8 : 0);
    const sp = Math.hypot(w.vx, w.vy);
    if (sp > maxSp) {
      const k = maxSp / sp;
      w.vx *= k;
      w.vy *= k;
    }

    const steps = Math.max(1, Math.ceil((Math.abs(w.vx) + Math.abs(w.vy)) * dt / 0.35));
    const sd = dt / steps;
    for (let s = 0; s < steps; s++) {
      resolveAxis(w, "x", sd, false);
      resolveAxis(w, "y", sd, false);
    }

    const moved = Math.hypot(w.x - (w.lastX ?? w.x), w.y - (w.lastY ?? w.y));
    if (moved < 0.03) w.stuckTime = (w.stuckTime || 0) + dt;
    else w.stuckTime = Math.max(0, (w.stuckTime || 0) - dt * 1.8);
    w.lastX = w.x;
    w.lastY = w.y;
    if ((w.stuckTime || 0) > 1.2) {
      w.stuckTime = 0;
      if (relocateEnemyNearPlayer(w, 6, 12)) continue;
    }

    w.shootCd -= dt;
    if (w.shootCd <= 0) {
      const txp = S.p.x + S.p.vx * (S.score >= 200 ? 0.32 : 0.2);
      const typ = S.p.y + S.p.vy * (S.score >= 200 ? 0.32 : 0.2);
      const qx = txp - w.x;
      const qy = typ - w.y;
      const qd = Math.hypot(qx, qy) || 1;
      const nx = qx / qd;
      const ny = qy / qd;
      const speed = S.score >= 200 ? 11.2 : 10.3;
      fireEnemyBullet(w.x, w.y, nx * speed, ny * speed, 6, false, "white");
      if (S.score >= 200) {
        const spread = 0.12;
        fireEnemyBullet(w.x, w.y, (nx - ny * spread) * speed, (ny + nx * spread) * speed, 6, false, "white");
      }
      w.shootCd = (S.score >= 200 ? 0.11 : 0.16) + Math.random() * 0.16;
    }

    if (w.hitCd > 0) w.hitCd -= dt;
    if (w.hitCd > 0) continue;

    if (best.targetType === "redmini" && Number.isInteger(best.redMiniIndex)) {
      const rm = S.redMini[best.redMiniIndex];
      if (rm && Math.hypot(w.x - rm.x, w.y - rm.y) <= (w.size + rm.size) / 2 + 0.08) {
        damageRedMini(best.redMiniIndex, 1, "White cube destroyed a red mini.");
        w.hitCd = 0.38;
        continue;
      }
    }

    const ramHit = enemyAttachmentRamHit(w);
    if (ramHit) {
      const didBreak = breakSingleAttachment(ramHit.side, ramHit.index, "White cube ram");
      if (moveModuleTotal() === 0) {
        gameOver("All movement modules were removed");
        return;
      }
      if (didBreak) {
        w.hitCd = 0.44;
        const kx = w.x - ramHit.anchor.x;
        const ky = w.y - ramHit.anchor.y;
        const kd = Math.hypot(kx, ky) || 1;
        w.vx = (kx / kd) * 3.1;
        w.vy = (ky / kd) * 3.1;
        continue;
      }
    }

    const overlapX = Math.abs(w.x - S.p.x) <= (w.size + S.p.size) / 2;
    const overlapY = Math.abs(w.y - S.p.y) <= (w.size + S.p.size) / 2;
    if (!overlapX || !overlapY) continue;
    const near = nearestAttachmentSideToEnemy(w);
    const side = near.side || enemyTouchSide(w);
    const didBreak = breakSingleAttachment(side, near.index, "White cube hit");
    if (moveModuleTotal() === 0) {
      gameOver("All movement modules were removed");
      return;
    }
    w.hitCd = 0.46;
    if (didBreak) w.repath = 0;
  }
}

function updateYellowFactories(dt) {
  if (!isScoreMode() || S.phase !== "run" || S.boss) return;
  for (const y of S.yellow) {
    y.spawnCd -= dt;
    if (y.spawnCd <= 0) {
      for (let i = 0; i < 6; i++) {
        if (!spawnYellowMiniFromFactory(y)) break;
      }
      y.spawnCd = 4;
    }

    const near = nearestAttachmentSideToEnemy(y);
    const redNear = nearestRedMiniFrom(y.x, y.y);
    let target = near.anchor
      ? { x: near.anchor.x, y: near.anchor.y, side: near.side, index: near.index, redMiniIndex: -1 }
      : { x: S.p.x, y: S.p.y, side: null, index: -1, redMiniIndex: -1 };
    if (redNear && (!near.anchor || redNear.dist < near.dist + 0.9)) {
      target = { x: redNear.x, y: redNear.y, side: null, index: -1, redMiniIndex: redNear.index };
    }
    const sx = Math.floor(y.x);
    const sy = Math.floor(y.y);
    let tx = Math.floor(target.x);
    let ty = Math.floor(target.y);
    if (buildZoneBlocksRun() && inBuild(tx, ty)) {
      const outside = nearestOutsideBuildCellWorld(tx, ty, sx, sy);
      if (outside) {
        tx = outside.x;
        ty = outside.y;
      }
    }
    y.repath -= dt;
    if (y.repath <= 0 || y.targetKey !== tx + ":" + ty) {
      y.path = worldRayBlocked(y.x, y.y, target.x, target.y) ? (findScorePath(sx, sy, tx, ty, 30) || []) : [];
      y.targetKey = tx + ":" + ty;
      y.repath = y.path.length ? 0.38 : 0.52;
    }

    let aimX = target.x;
    let aimY = target.y;
    if (y.path.length > 1) {
      const step = y.path[1];
      aimX = step.x + 0.5;
      aimY = step.y + 0.5;
      if (Math.hypot(aimX - y.x, aimY - y.y) < 0.22) y.path.shift();
    }

    const dx = aimX - y.x;
    const dy = aimY - y.y;
    const d = Math.hypot(dx, dy) || 1;
    y.vx += (dx / d) * 4.4 * dt;
    y.vy += (dy / d) * 4.4 * dt;
    const f = Math.exp(-2.6 * dt);
    y.vx *= f;
    y.vy *= f;
    const maxSp = 3.3;
    const sp = Math.hypot(y.vx, y.vy);
    if (sp > maxSp) {
      const k = maxSp / sp;
      y.vx *= k;
      y.vy *= k;
    }

    const steps = Math.max(1, Math.ceil((Math.abs(y.vx) + Math.abs(y.vy)) * dt / 0.35));
    const sd = dt / steps;
    for (let s = 0; s < steps; s++) {
      resolveAxis(y, "x", sd, false);
      resolveAxis(y, "y", sd, false);
    }

    const moved = Math.hypot(y.x - (y.lastX ?? y.x), y.y - (y.lastY ?? y.y));
    if (moved < 0.03) y.stuckTime = (y.stuckTime || 0) + dt;
    else y.stuckTime = Math.max(0, (y.stuckTime || 0) - dt * 1.4);
    y.lastX = y.x;
    y.lastY = y.y;
    if ((y.stuckTime || 0) > 1.2) {
      y.stuckTime = 0;
      y.repath = 0;
      y.vx += (Math.random() * 2 - 1) * 2.1;
      y.vy += (Math.random() * 2 - 1) * 2.1;
    }

    if (y.hitCd > 0) y.hitCd -= dt;
    if (y.hitCd > 0) continue;

    if (Number.isInteger(target.redMiniIndex) && target.redMiniIndex >= 0) {
      const rm = S.redMini[target.redMiniIndex];
      if (rm && Math.hypot(y.x - rm.x, y.y - rm.y) <= (y.size + rm.size) / 2 + 0.08) {
        damageRedMini(target.redMiniIndex, 2, "Yellow cube destroyed a red mini.");
        y.hitCd = 0.62;
        y.repath = 0;
        continue;
      }
    }

    const ramHit = enemyAttachmentRamHit(y);
    if (ramHit) {
      const didBreak = breakSingleAttachment(ramHit.side, ramHit.index, "Yellow cube ram");
      if (moveModuleTotal() === 0) {
        gameOver("All movement modules were removed");
        return;
      }
      if (didBreak) {
        y.hitCd = 0.72;
        const kx = y.x - ramHit.anchor.x;
        const ky = y.y - ramHit.anchor.y;
        const kd = Math.hypot(kx, ky) || 1;
        y.vx = (kx / kd) * 2.5;
        y.vy = (ky / kd) * 2.5;
        continue;
      }
    }

    const overlapX = Math.abs(y.x - S.p.x) <= (y.size + S.p.size) / 2;
    const overlapY = Math.abs(y.y - S.p.y) <= (y.size + S.p.size) / 2;
    if (!overlapX || !overlapY) continue;
    const nearHit = nearestAttachmentSideToEnemy(y);
    const side = nearHit.side || enemyTouchSide(y);
    const didBreak = breakSingleAttachment(side, nearHit.index, "Yellow cube hit");
    if (moveModuleTotal() === 0) {
      gameOver("All movement modules were removed");
      return;
    }
    y.hitCd = 0.72;
    if (didBreak) y.repath = 0;
  }
}

function updateYellowMini(dt) {
  if (!isScoreMode() || S.phase !== "run" || S.boss) return;
  for (const y of S.yellowMini) {
    const near = nearestAttachmentSideToEnemy(y);
    const redNear = nearestRedMiniFrom(y.x, y.y);
    let target = near.anchor
      ? { x: near.anchor.x, y: near.anchor.y, side: near.side, index: near.index, redMiniIndex: -1 }
      : { x: S.p.x, y: S.p.y, side: null, index: -1, redMiniIndex: -1 };
    if (redNear && (!near.anchor || redNear.dist < near.dist + 0.6)) {
      target = { x: redNear.x, y: redNear.y, side: null, index: -1, redMiniIndex: redNear.index };
    }
    const sx = Math.floor(y.x);
    const sy = Math.floor(y.y);
    let tx = Math.floor(target.x);
    let ty = Math.floor(target.y);
    if (buildZoneBlocksRun() && inBuild(tx, ty)) {
      const outside = nearestOutsideBuildCellWorld(tx, ty, sx, sy);
      if (outside) {
        tx = outside.x;
        ty = outside.y;
      }
    }
    y.repath -= dt;
    if (y.repath <= 0 || y.targetKey !== tx + ":" + ty) {
      y.path = worldRayBlocked(y.x, y.y, target.x, target.y) ? (findScorePath(sx, sy, tx, ty, 24) || []) : [];
      y.targetKey = tx + ":" + ty;
      y.repath = y.path.length ? 0.36 : 0.5;
    }

    let aimX = target.x;
    let aimY = target.y;
    if (y.path.length > 1) {
      const step = y.path[1];
      aimX = step.x + 0.5;
      aimY = step.y + 0.5;
      if (Math.hypot(aimX - y.x, aimY - y.y) < 0.2) y.path.shift();
    }

    const dx = aimX - y.x;
    const dy = aimY - y.y;
    const d = Math.hypot(dx, dy) || 1;
    y.vx += (dx / d) * 10.4 * dt;
    y.vy += (dy / d) * 10.4 * dt;
    const f = Math.exp(-2.8 * dt);
    y.vx *= f;
    y.vy *= f;
    const maxSp = 6.9;
    const sp = Math.hypot(y.vx, y.vy);
    if (sp > maxSp) {
      const k = maxSp / sp;
      y.vx *= k;
      y.vy *= k;
    }

    const steps = Math.max(1, Math.ceil((Math.abs(y.vx) + Math.abs(y.vy)) * dt / 0.35));
    const sd = dt / steps;
    for (let s = 0; s < steps; s++) {
      resolveAxis(y, "x", sd, false);
      resolveAxis(y, "y", sd, false);
    }

    const moved = Math.hypot(y.x - (y.lastX ?? y.x), y.y - (y.lastY ?? y.y));
    if (moved < 0.025) y.stuckTime = (y.stuckTime || 0) + dt;
    else y.stuckTime = Math.max(0, (y.stuckTime || 0) - dt * 1.5);
    y.lastX = y.x;
    y.lastY = y.y;
    if ((y.stuckTime || 0) > 1.0) {
      y.stuckTime = 0;
      y.repath = 0;
      y.vx += (Math.random() * 2 - 1) * 2.8;
      y.vy += (Math.random() * 2 - 1) * 2.8;
    }

    if (y.hitCd > 0) y.hitCd -= dt;
    if (y.hitCd > 0) continue;

    if (Number.isInteger(target.redMiniIndex) && target.redMiniIndex >= 0) {
      const rm = S.redMini[target.redMiniIndex];
      if (rm && Math.hypot(y.x - rm.x, y.y - rm.y) <= (y.size + rm.size) / 2 + 0.06) {
        damageRedMini(target.redMiniIndex, 1, "Small yellow cube destroyed a red mini.");
        y.hitCd = 0.42;
        y.repath = 0;
        continue;
      }
    }

    const ramHit = enemyAttachmentRamHit(y);
    if (ramHit) {
      const didBreak = breakSingleAttachment(ramHit.side, ramHit.index, "Small yellow cube");
      if (moveModuleTotal() === 0) {
        gameOver("All movement modules were removed");
        return;
      }
      if (didBreak) {
        y.hitCd = 0.46;
        const kx = y.x - ramHit.anchor.x;
        const ky = y.y - ramHit.anchor.y;
        const kd = Math.hypot(kx, ky) || 1;
        y.vx = (kx / kd) * 3.2;
        y.vy = (ky / kd) * 3.2;
        continue;
      }
    }

    const overlapX = Math.abs(y.x - S.p.x) <= (y.size + S.p.size) / 2;
    const overlapY = Math.abs(y.y - S.p.y) <= (y.size + S.p.size) / 2;
    if (!overlapX || !overlapY) continue;
    const nearHit = nearestAttachmentSideToEnemy(y);
    const side = nearHit.side || enemyTouchSide(y);
    const didBreak = breakSingleAttachment(side, nearHit.index, "Small yellow cube hit");
    if (moveModuleTotal() === 0) {
      gameOver("All movement modules were removed");
      return;
    }
    y.hitCd = 0.46;
    if (didBreak) y.repath = 0;
  }
}

function spawnRedMiniAt(x, y) {
  if (S.redMini.length >= MAX_RED_MINI) return false;
  for (let at = 0; at < 28; at++) {
    const ang = Math.random() * Math.PI * 2;
    const d = 0.45 + Math.random() * 0.8;
    const sx = x + Math.cos(ang) * d;
    const sy = y + Math.sin(ang) * d;
    const cx = Math.floor(sx);
    const cy = Math.floor(sy);
    if (solid(cx, cy) || (buildZoneBlocksRun() && inBuild(cx, cy))) continue;
    S.redMini.push({
      x: sx,
      y: sy,
      vx: 0,
      vy: 0,
      size: 0.56,
      hp: 3,
      maxHp: 3,
      atkCd: 0,
      repath: 0,
      path: [],
      targetKey: "",
      lastX: sx,
      lastY: sy,
      stuckTime: 0
    });
    return true;
  }
  return false;
}

function findNearestRedMiniTarget(r) {
  let best = null;
  let bestScore = Infinity;

  const consider = (t, basePriority = 1) => {
    if (!t) return;
    const d = Math.hypot(t.x - r.x, t.y - r.y);
    const score = d * basePriority;
    const sticky = r.focusKey && r.focusKey === t.key ? -1.2 : 0;
    const finalScore = score + sticky;
    if (finalScore < bestScore) {
      bestScore = finalScore;
      best = t;
    }
  };

  for (let i = 0; i < S.enemy.length; i++) {
    const e = S.enemy[i];
    consider({ type: "blue", index: i, x: e.x, y: e.y, vx: e.vx || 0, vy: e.vy || 0, size: e.size, key: "b:" + i }, 1);
  }
  for (let i = 0; i < S.white.length; i++) {
    const e = S.white[i];
    consider({ type: "white", index: i, x: e.x, y: e.y, vx: e.vx || 0, vy: e.vy || 0, size: e.size, key: "w:" + i }, 0.96);
  }
  for (let i = 0; i < S.yellow.length; i++) {
    const e = S.yellow[i];
    consider({ type: "yellow", index: i, x: e.x, y: e.y, vx: e.vx || 0, vy: e.vy || 0, size: e.size, key: "y:" + i }, 1.04);
  }
  for (let i = 0; i < S.yellowMini.length; i++) {
    const e = S.yellowMini[i];
    consider({ type: "yellow-mini", index: i, x: e.x, y: e.y, vx: e.vx || 0, vy: e.vy || 0, size: e.size, key: "ym:" + i }, 0.94);
  }
  if (S.greenCube) {
    consider({ type: "green", index: 0, x: S.greenCube.x, y: S.greenCube.y, vx: 0, vy: 0, size: S.greenCube.size, key: "g:0" }, 1.02);
  }
  if (S.boss) {
    consider({ type: "boss", index: 0, x: S.boss.x, y: S.boss.y, vx: S.boss.vx || 0, vy: S.boss.vy || 0, size: S.boss.size, key: "boss" }, 1.1);
  }
  return best;
}

function applyRedMiniDamage(target, dmg = 2) {
  if (!target) return;
  const tdmg = dmg + attachmentDamageBonus();
  if (target.type === "blue") {
    const e = S.enemy[target.index];
    if (!e) return;
    e.hp -= tdmg;
    if (e.hp <= 0) destroyEnemyAt(target.index, "Blue cube destroyed by red mini.");
    return;
  }
  if (target.type === "yellow") {
    const e = S.yellow[target.index];
    if (!e) return;
    e.hp -= tdmg;
    if (e.hp <= 0) destroyYellowAt(target.index, "Yellow cube destroyed by red mini.");
    return;
  }
  if (target.type === "yellow-mini") {
    const e = S.yellowMini[target.index];
    if (!e) return;
    e.hp -= tdmg;
    if (e.hp <= 0) destroyYellowMiniAt(target.index, "Small yellow cube destroyed by red mini.");
    return;
  }
  if (target.type === "white") {
    const e = S.white[target.index];
    if (!e) return;
    e.hp -= tdmg;
    if (e.hp <= 0) destroyWhiteAt(target.index, "White cube destroyed by red mini.");
    return;
  }
  if (target.type === "green" && S.greenCube) {
    S.greenCube.hp -= tdmg;
    if (S.greenCube.hp <= 0) destroyGreenCube("Green heavy cube destroyed by red mini.");
    return;
  }
  if (target.type === "boss" && S.boss) {
    S.boss.hp -= tdmg;
    if (S.boss.hp <= 0) despawnBoss();
  }
}

function updateRedFactoryAttachmentSpawn(dt) {
  if (!isScoreMode() || S.phase !== "run") return;
  if (playerInBlockedBuildZone()) return;
  const mods = factoryModules();
  if (!mods.length) {
    S.redMiniSpawnTick = 0;
    return;
  }
  S.redMiniSpawnTick += dt * mods.length;
  while (S.redMiniSpawnTick >= 2) {
    S.redMiniSpawnTick -= 2;
    if (S.redMini.length >= MAX_RED_MINI) break;
    let spawned = false;
    for (const m of mods) {
      const a = sideAttachmentAnchor(m.side, m.index + 1);
      if (spawnRedMiniAt(a.x, a.y)) {
        spawned = true;
        break;
      }
    }
    if (!spawned) break;
  }
}

function updateRedMini(dt) {
  if (!isScoreMode() || S.phase !== "run") return;
  if (!S.redMini.length) return;
  for (const r of S.redMini) {
    const target = findNearestRedMiniTarget(r);
    if (r.atkCd > 0) r.atkCd -= dt;

    if (!target) {
      const dxIdle = S.p.x - r.x;
      const dyIdle = S.p.y - r.y;
      const dIdle = Math.hypot(dxIdle, dyIdle) || 1;
      r.vx += (dxIdle / dIdle) * 3.2 * dt;
      r.vy += (dyIdle / dIdle) * 3.2 * dt;
      r.vx *= Math.exp(-3.2 * dt);
      r.vy *= Math.exp(-3.2 * dt);
      continue;
    }
    r.focusKey = target.key;

    const sx = Math.floor(r.x);
    const sy = Math.floor(r.y);
    const tx = Math.floor(target.x);
    const ty = Math.floor(target.y);
    const targetSig = target.key + ":" + tx + ":" + ty;

    r.repath -= dt;
    if (r.repath <= 0 || r.targetKey !== targetSig) {
      r.targetKey = targetSig;
      r.path = worldRayBlocked(r.x, r.y, target.x, target.y) ? (findScorePath(sx, sy, tx, ty, 26) || []) : [];
      r.repath = r.path.length ? 0.17 : 0.24;
    }

    let aimX = target.x + (target.vx || 0) * 0.22;
    let aimY = target.y + (target.vy || 0) * 0.22;
    if (r.path.length > 1) {
      const step = r.path[1];
      aimX = step.x + 0.5;
      aimY = step.y + 0.5;
      if (Math.hypot(aimX - r.x, aimY - r.y) < 0.2) r.path.shift();
    }

    const dx = aimX - r.x;
    const dy = aimY - r.y;
    const d = Math.hypot(dx, dy) || 1;
    r.vx += (dx / d) * 11.2 * dt;
    r.vy += (dy / d) * 11.2 * dt;
    const f = Math.exp(-2.45 * dt);
    r.vx *= f;
    r.vy *= f;
    const maxSp = 8.1;
    const sp = Math.hypot(r.vx, r.vy);
    if (sp > maxSp) {
      const k = maxSp / sp;
      r.vx *= k;
      r.vy *= k;
    }

    const steps = Math.max(1, Math.ceil((Math.abs(r.vx) + Math.abs(r.vy)) * dt / 0.35));
    const sd = dt / steps;
    for (let s = 0; s < steps; s++) {
      resolveAxis(r, "x", sd, false);
      resolveAxis(r, "y", sd, false);
    }

    const moved = Math.hypot(r.x - (r.lastX ?? r.x), r.y - (r.lastY ?? r.y));
    if (moved < 0.02) r.stuckTime = (r.stuckTime || 0) + dt;
    else r.stuckTime = Math.max(0, (r.stuckTime || 0) - dt * 1.9);
    r.lastX = r.x;
    r.lastY = r.y;
    if ((r.stuckTime || 0) > 0.9) {
      r.stuckTime = 0;
      r.repath = 0;
      r.vx += (Math.random() * 2 - 1) * 3.4;
      r.vy += (Math.random() * 2 - 1) * 3.4;
    }

    const hitDist = target.size / 2 + r.size / 2 + 0.24;
    if (r.atkCd <= 0 && Math.hypot(target.x - r.x, target.y - r.y) <= hitDist) {
      applyRedMiniDamage(target, 2);
      r.atkCd = 0.24;
    }
  }
}

function updateRun(dt) {
  if (S.paused) return;
  S.runStats.runTime += dt;
  const prevPlayerX = S.p.x;
  const prevPlayerY = S.p.y;
  updateWorkstation(dt);
  const wsActive = workstationActive();

  if (wsActive) {
    if (S.gunCd > 0) S.gunCd -= dt;
    if (S.bombCd > 0) S.bombCd -= dt;
    if (S.aiGunCd > 0) S.aiGunCd -= dt;
    if (S.burstCd > 0) S.burstCd -= dt;
    return;
  }

  let i = {
    left: !!(S.keys.ArrowLeft || S.keys.KeyA),
    right: !!(S.keys.ArrowRight || S.keys.KeyD),
    up: !!(S.keys.ArrowUp || S.keys.KeyW),
    down: !!(S.keys.ArrowDown || S.keys.KeyS)
  };
  if (isScoreMode() && S.devUnlocked && S.devAutoPilot) {
    i = devAiInput();
    S.devAiActionCd -= dt;
    const enemyInfo = devNearestEnemy();
    if (enemyInfo.entity && S.devAiActionCd <= 0) {
      fireGuns();
      firePurpleGunsAt(enemyInfo.entity.x, enemyInfo.entity.y);
      if (S.burstCd <= 0) fireBurstAttachments();
      if (S.boss) {
        if (S.bombCd <= 0 && enemyInfo.dist < 5.8) fireBombAttachment();
        if (S.stabilizerCd <= 0 && enemyInfo.dist < 4.4) triggerStabilizerPulse();
      } else {
        if (S.bombCd <= 0 && enemyInfo.dist < 4.6) fireBombAttachment();
        if (S.stabilizerCd <= 0 && enemyInfo.dist < 3.4) triggerStabilizerPulse();
      }
      S.devAiActionCd = 0.1;
    }
  }

  const inBuildNow = buildZoneBlocksRun() && playerInBuildZone();
  const stab = countType("stabilizer");
  const pulse = !inBuildNow && S.stabilizerPulse > 0 ? 1.5 : 1;
  const base = (14.8 + stab * 1.6) * pulse;
  let ax = 0;
  let ay = 0;

  if (i.left && countMove("left")) ax -= base;
  if (i.right && countMove("right")) ax += base;
  if (i.up && countMove("up")) ay -= base;
  if (i.down && countMove("down")) ay += base;

  S.p.vx += ax * dt;
  S.p.vy += ay * dt;

  const drag = Math.max(1.1, 2.9 - stab * 0.32 - (!inBuildNow && S.stabilizerPulse > 0 ? 0.55 : 0));
  const f = Math.exp(-drag * dt);
  S.p.vx *= f;
  S.p.vy *= f;

  const maxSp = 12 + (!inBuildNow && S.stabilizerPulse > 0 ? 3 : 0);
  const sp = Math.hypot(S.p.vx, S.p.vy);
  if (sp > maxSp && sp > 0) {
    const k = maxSp / sp;
    S.p.vx *= k;
    S.p.vy *= k;
  }

  const steps = Math.max(1, Math.ceil((Math.abs(S.p.vx) + Math.abs(S.p.vy)) * dt / 0.35));
  const sd = dt / steps;
  for (let s = 0; s < steps; s++) {
    resolveAxis(S.p, "x", sd, true);
    resolveAxis(S.p, "y", sd, true);
  }
  if (buildZoneBlocksRun() && !playerInBuildZone()) {
    S.buildZoneGone = true;
    pushEv("Build zone opened. Blue cubes can enter it now.");
  }

  if (S.pistonCd > 0) S.pistonCd -= dt;
  if (S.sidePistonCd > 0) S.sidePistonCd -= dt;
  if (S.gunCd > 0) S.gunCd -= dt;
  if (S.bombCd > 0) S.bombCd -= dt;
  if (S.burstCd > 0) S.burstCd -= dt;
  if (S.pistonBounce > 0) S.pistonBounce -= dt;
  if (S.stabilizerPulse > 0) S.stabilizerPulse -= dt;
  if (S.stabilizerCd > 0) S.stabilizerCd -= dt;
  for (const side of SIDES) if (S.sideBreakCd[side] > 0) S.sideBreakCd[side] -= dt;

  S.levelTime += dt;
  updateBombs(dt);
  updateGunBullets(dt);
  updateAIGuns(dt);
  updateLaserBullets(dt);
  if (S.phase !== "run") return;
  updateScoreLaserWalls(dt);
  if (S.phase !== "run") return;
  updateDropsAndSword(dt, prevPlayerX, prevPlayerY);
  updateEnemyGuns(dt);
  updateGreenCube(dt);
  updateBoss(dt);
  updateEnemyBullets(dt);
  if (S.phase !== "run") return;
  updateScoreEnemyPopulation(dt);
  updateRedFactoryAttachmentSpawn(dt);
  updateEnemies(dt);
  if (S.phase !== "run") return;
  updateWhiteCubes(dt);
  if (S.phase !== "run") return;
  updateYellowFactories(dt);
  if (S.phase !== "run") return;
  updateYellowMini(dt);
  if (S.phase !== "run") return;
  updateRedMini(dt);
  if (S.phase !== "run") return;
  updateSpawners(dt);
  if (moveModuleTotal() === 0) {
    gameOver("No movement modules left");
    return;
  }

  if (isScoreMode()) {
    if (!S.boss && S.score >= S.nextBossScore) spawnBoss();
    return;
  }

  const g = level().g;
  const inGoal = S.p.x >= g.x && S.p.x <= g.x + g.w && S.p.y >= g.y && S.p.y <= g.y + g.h;
  if (inGoal) {
    S.hold += dt;
    if (S.hold >= GOAL_TIME) complete();
  } else {
    S.hold = 0;
  }
}

function update(dt) {
  if (S.phase === "run") updateRun(dt);
  for (const side of SIDES) {
    for (const m of S.a[side]) {
      if (!Number.isFinite(m.pop)) continue;
      m.pop = Math.max(0, m.pop - dt * 3.6);
    }
  }
  for (let i = S.pickupFx.length - 1; i >= 0; i--) {
    const fx = S.pickupFx[i];
    fx.ttl -= dt;
    fx.x += fx.vx * dt;
    fx.y += fx.vy * dt;
    fx.vx *= Math.exp(-3.2 * dt);
    fx.vy *= Math.exp(-3.2 * dt);
    if (fx.ttl <= 0) S.pickupFx.splice(i, 1);
  }
  for (let i = S.bossFx.length - 1; i >= 0; i--) {
    const fx = S.bossFx[i];
    fx.ttl -= dt;
    fx.x += fx.vx * dt;
    fx.y += fx.vy * dt;
    fx.vx *= Math.exp(-1.7 * dt);
    fx.vy *= Math.exp(-1.7 * dt);
    if (fx.ttl <= 0) S.bossFx.splice(i, 1);
  }
  for (let i = S.enemyFx.length - 1; i >= 0; i--) {
    const fx = S.enemyFx[i];
    fx.ttl -= dt;
    fx.x += fx.vx * dt;
    fx.y += fx.vy * dt;
    fx.vx *= Math.exp(-2.1 * dt);
    fx.vy *= Math.exp(-2.1 * dt);
    if (fx.ttl <= 0) S.enemyFx.splice(i, 1);
  }
  if (S.modeFlash) {
    S.modeFlash.ttl -= dt;
    if (S.modeFlash.ttl <= 0) S.modeFlash = null;
  }
}

function cameraOffset() {
  if (S.phase === "build") {
    return {
      x: ui.c.width / 2 - (BUILD.x + BUILD.w / 2) * CELL,
      y: ui.c.height / 2 - (BUILD.y + BUILD.h / 2) * CELL
    };
  }
  if (S.p.placed && S.phase !== "menu") {
    return {
      x: ui.c.width / 2 - S.p.x * CELL,
      y: ui.c.height / 2 - S.p.y * CELL
    };
  }
  return { x: 0, y: 0 };
}

function drawBackground() {
  ctx.fillStyle = S.darkTheme ? "#11100f" : "#d9cda3";
  ctx.fillRect(0, 0, ui.c.width, ui.c.height);
}

function visibleScoreWallRange(cam) {
  return {
    minX: Math.floor((-cam.x) / CELL) - 1,
    maxX: Math.ceil((ui.c.width - cam.x) / CELL) + 1,
    minY: Math.floor((-cam.y) / CELL) - 1,
    maxY: Math.ceil((ui.c.height - cam.y) / CELL) + 1
  };
}

function drawGrid() {
  if (S.phase !== "build" && S.buildZoneGone) return;
  ctx.fillStyle = S.darkTheme ? "#3a2f24" : "#d8c98a";
  ctx.fillRect(BUILD.x * CELL, BUILD.y * CELL, BUILD.w * CELL, BUILD.h * CELL);
  ctx.strokeStyle = S.darkTheme ? "rgba(235, 211, 170, 0.92)" : "rgba(47, 32, 20, 0.95)";
  ctx.lineWidth = 2;
  ctx.strokeRect(BUILD.x * CELL + 1, BUILD.y * CELL + 1, BUILD.w * CELL - 2, BUILD.h * CELL - 2);

  ctx.strokeStyle = S.darkTheme ? "rgba(199, 164, 115, .38)" : "rgba(120, 85, 54, .45)";
  ctx.lineWidth = 1;
  for (let x = BUILD.x; x <= BUILD.x + BUILD.w; x++) {
    const sx = x * CELL + 0.5;
    ctx.beginPath();
    ctx.moveTo(sx, BUILD.y * CELL);
    ctx.lineTo(sx, (BUILD.y + BUILD.h) * CELL);
    ctx.stroke();
  }
  for (let y = BUILD.y; y <= BUILD.y + BUILD.h; y++) {
    const sy = y * CELL + 0.5;
    ctx.beginPath();
    ctx.moveTo(BUILD.x * CELL, sy);
    ctx.lineTo((BUILD.x + BUILD.w) * CELL, sy);
    ctx.stroke();
  }
}

function drawHints() {
  if (S.phase !== "build") return;
  ctx.fillStyle = "rgba(255,255,255,.09)";
  for (let y = BUILD.y; y < BUILD.y + BUILD.h; y++) {
    for (let x = BUILD.x; x < BUILD.x + BUILD.w; x++) {
      if (validPlace(x, y)) ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
    }
  }
}

function drawSpawnPreview() {
  if (S.phase !== "build") return;
  for (const s of S.previewSpawns) {
    const x = s.x * CELL;
    const y = s.y * CELL;
    ctx.fillStyle = "rgba(251, 191, 156, 0.24)";
    ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4);
    ctx.strokeStyle = "rgba(120, 71, 46, 0.95)";
    ctx.lineWidth = 1.4;
    ctx.strokeRect(x + 2, y + 2, CELL - 4, CELL - 4);
  }
}

function drawSpawners() {
  if (S.phase !== "run") return;
  if (!S.spawners.length) return;
  for (const sp of S.spawners) {
    const x = sp.x * CELL;
    const y = sp.y * CELL;
    const active = sp.cooldown <= 0;
    ctx.fillStyle = active ? "rgba(56, 189, 248, 0.26)" : "rgba(14, 116, 144, 0.20)";
    ctx.fillRect(x + 3, y + 3, CELL - 6, CELL - 6);
    ctx.strokeStyle = active ? "rgba(125, 211, 252, 0.95)" : "rgba(103, 232, 249, 0.55)";
    ctx.lineWidth = 1.6;
    ctx.strokeRect(x + 3, y + 3, CELL - 6, CELL - 6);
    ctx.beginPath();
    ctx.arc(x + CELL / 2, y + CELL / 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = active ? "rgba(191, 219, 254, 0.95)" : "rgba(125, 211, 252, 0.45)";
    ctx.fill();
  }
}

function drawGoal() {
  const g = level().g;
  const x = g.x * CELL;
  const y = g.y * CELL;
  const w = g.w * CELL;
  const h = g.h * CELL;
  ctx.fillStyle = "rgba(255,255,255,.2)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(255,255,255,.9)";
  ctx.lineWidth = 3;
  ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
}

function drawWalls() {
  const wallBase = S.darkTheme ? "#6b7280" : "#4b5563";
  const wallInset = S.darkTheme ? "rgba(15,23,42,.28)" : "rgba(255,255,255,.08)";
  if (isScoreMode()) {
    if (S.phase === "build" || S.phase === "menu") return;
    const cam = cameraOffset();
    const vr = visibleScoreWallRange(cam);
    for (let y = vr.minY; y <= vr.maxY; y++) {
      for (let x = vr.minX; x <= vr.maxX; x++) {
        if (!scoreWallAt(x, y)) continue;
        ctx.fillStyle = wallBase;
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        ctx.fillStyle = wallInset;
        ctx.fillRect(x * CELL + 2, y * CELL + 2, CELL - 4, CELL - 4);
      }
    }
    return;
  }

  const w = level().w;
  const cam = cameraOffset();
  const minX = Math.max(0, Math.floor((-cam.x) / CELL) - 1);
  const maxX = Math.min(W - 1, Math.ceil((ui.c.width - cam.x) / CELL) + 1);
  const minY = Math.max(0, Math.floor((-cam.y) / CELL) - 1);
  const maxY = Math.min(H - 1, Math.ceil((ui.c.height - cam.y) / CELL) + 1);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (!w[y][x]) continue;
      ctx.fillStyle = wallBase;
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      ctx.fillStyle = wallInset;
      ctx.fillRect(x * CELL + 2, y * CELL + 2, CELL - 4, CELL - 4);
    }
  }
}

function drawLasers() {
  for (const em of S.emitters) {
    if (!emitterActive(em)) continue;
    ctx.strokeStyle = "rgba(255, 95, 95, 0.35)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    if (em.o === "h") {
      ctx.moveTo(em.sx * CELL, (em.y + 0.5) * CELL);
      ctx.lineTo((em.ex + 1) * CELL, (em.y + 0.5) * CELL);
    } else {
      ctx.moveTo((em.x + 0.5) * CELL, em.sy * CELL);
      ctx.lineTo((em.x + 0.5) * CELL, (em.ey + 1) * CELL);
    }
    ctx.stroke();
  }

  for (const b of S.bullets) {
    ctx.save();
    ctx.fillStyle = "rgba(255, 35, 35, 0.95)";
    ctx.shadowColor = "rgba(255, 0, 0, 0.6)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(b.x * CELL, b.y * CELL, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (const lw of S.scoreLaserWalls) {
    const p = Math.max(0, Math.min(1, lw.ttl / 5.8));
    ctx.save();
    ctx.strokeStyle = "rgba(251, 191, 36, " + (0.35 + (1 - p) * 0.4).toFixed(3) + ")";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    if (lw.o === "h") {
      ctx.moveTo(lw.sx * CELL, (lw.y + 0.5) * CELL);
      ctx.lineTo((lw.ex + 1) * CELL, (lw.y + 0.5) * CELL);
    } else {
      ctx.moveTo((lw.x + 0.5) * CELL, lw.sy * CELL);
      ctx.lineTo((lw.x + 0.5) * CELL, (lw.ey + 1) * CELL);
    }
    ctx.stroke();
    ctx.restore();
  }
}

function drawGunBullets() {
  for (const b of S.gunBullets) {
    const purple = b.kind === "purple";
    const burst = b.kind === "burst";
    const fill = purple ? "rgba(168, 85, 247, 0.95)" : burst ? "rgba(201, 162, 107, 0.95)" : "rgba(80, 250, 140, 0.95)";
    const glow = purple ? "rgba(147, 51, 234, 0.6)" : burst ? "rgba(146, 114, 73, 0.55)" : "rgba(34, 197, 94, 0.55)";
    ctx.save();
    ctx.fillStyle = fill;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(b.x * CELL, b.y * CELL, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawEnemyBullets() {
  for (const b of S.enemyBullets) {
    const greenShot = b.kind === "green";
    const whiteShot = b.kind === "white";
    const fill = b.isLaser
      ? "rgba(251, 113, 133, 0.95)"
      : greenShot
        ? "rgba(34, 197, 94, 0.95)"
        : whiteShot
          ? "rgba(248, 250, 252, 0.95)"
          : "rgba(59, 130, 246, 0.95)";
    const glow = b.isLaser
      ? "rgba(244, 63, 94, 0.6)"
      : greenShot
        ? "rgba(21, 128, 61, 0.6)"
        : whiteShot
          ? "rgba(226, 232, 240, 0.6)"
          : "rgba(59, 130, 246, 0.6)";
    ctx.save();
    ctx.fillStyle = fill;
    ctx.shadowColor = glow;
    ctx.shadowBlur = b.isLaser ? 9 : 6;
    ctx.beginPath();
    ctx.arc(b.x * CELL, b.y * CELL, b.isLaser ? 4.6 : 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawMini(m, x, y, s) {
  ctx.fillStyle = MCOL[m.type] || "#6b7280";
  ctx.fillRect(x, y, s, s);
  ctx.fillStyle = "rgba(255,255,255,.92)";
  ctx.font = Math.max(8, Math.floor(s * 0.6)) + "px Rockwell, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let t = "";
  if (m.type === "move") {
    if (m.dir === "left") t = "L";
    if (m.dir === "right") t = "R";
    if (m.dir === "up") t = "U";
    if (m.dir === "down") t = "D";
  } else if (m.type === "gun") t = "G";
  else if (m.type === "upgrade") t = "U";
  else if (m.type === "bomb") t = "B";
  else if (m.type === "ai-gun") t = "A";
  else if (m.type === "rapid-gun") t = "2";
  else if (m.type === "purple-gun") t = "P";
  else if (m.type === "burst") t = "B";
  else if (m.type === "factory") t = "F";
  else t = "S";
  ctx.fillText(t, x + s / 2, y + s / 2 + 0.5);
}

function drawDrops() {
  if (!isScoreMode() || S.phase !== "run") return;
  for (const d of S.drops) {
    let color = "#22c55e";
    if (d.type === "ai-gun") color = "#166534";
    if (d.type === "sword") color = "#dc2626";
    if (d.type === "rapid-gun") color = "#eab308";
    if (d.type === "factory") color = "#ef4444";
    if (d.type === "purple-gun") color = "#9333ea";
    if (d.type === "burst") color = "#c9a26b";
    const x = d.x * CELL - 7;
    const y = d.y * CELL - 7;
    ctx.fillStyle = color;
    if (d.type === "sword") {
      ctx.fillRect(x + 6, y - 2, 4, 14);
      ctx.fillRect(x + 2, y + 9, 12, 3);
    } else {
      ctx.fillRect(x, y, 14, 14);
      ctx.strokeStyle = "rgba(15,23,42,.65)";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x + 0.5, y + 0.5, 13, 13);
      if (d.type === "factory") {
        ctx.fillStyle = "rgba(15,23,42,.78)";
        ctx.font = "700 9px Rockwell, serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("F", x + 7, y + 7.5);
      }
    }
  }
}

function drawBombs() {
  if (S.phase !== "run") return;
  for (const b of S.bombs) {
    const x = b.x * CELL;
    const y = b.y * CELL;
    const armed = b.arm <= 0;
    ctx.save();
    ctx.fillStyle = armed ? "rgba(239, 68, 68, 0.95)" : "rgba(107, 114, 128, 0.95)";
    ctx.strokeStyle = "rgba(15, 23, 42, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 6.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (!armed) {
      ctx.strokeStyle = "rgba(251, 191, 36, 0.8)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(x, y, 8.8, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawDropTelegraphs() {
  if (!isScoreMode() || S.phase !== "run") return;
  for (const t of S.dropTelegraphs) {
    const p = Math.max(0, Math.min(1, t.ttl / t.full));
    const r = 8 + (1 - p) * 10;
    const x = t.x * CELL;
    const y = t.y * CELL;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255," + (0.35 + (1 - p) * 0.5).toFixed(3) + ")";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(248,250,252,0.28)";
    ctx.beginPath();
    ctx.arc(x, y, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawSword() {
  if (!isScoreMode() || S.phase !== "run" || S.swordCount <= 0 || playerInBlockedBuildZone()) return;
  const s = swordPos();
  const len = swordLengthWorld() * CELL;
  ctx.save();
  ctx.translate(s.x * CELL, s.y * CELL);
  ctx.rotate(S.swordAngle);
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(-len / 2, -2, len, 4);
  ctx.fillRect(len / 2 - 4, -4, 8, 8);
  ctx.restore();
}

function drawAttach() {
  if (!S.p.placed) return;
  for (const side of SIDES) {
    const mods = S.a[side];
    if (!mods.length) continue;
    for (let i = 0; i < mods.length; i++) {
      const a = sideAttachmentAnchor(side, i + 1);
      const s = S.p.size * CELL;
      const pop = Math.max(0, mods[i].pop || 0);
      const scale = 1 + pop * 0.24;
      const cs = s * scale;
      const cx = a.x * CELL - cs / 2;
      const cy = a.y * CELL - cs / 2;
      drawMini(mods[i], cx, cy, cs);
      if (S.phase === "build") {
        ctx.strokeStyle = "rgba(120, 71, 46, 0.95)";
        ctx.lineWidth = 1.4;
        ctx.strokeRect(cx + 1, cy + 1, cs - 2, cs - 2);
      }
    }
  }

  if (S.drag) {
    const s = S.p.size * CELL;
    const cx = S.mouse.x * CELL - s / 2;
    const cy = S.mouse.y * CELL - s / 2;
    ctx.globalAlpha = 0.78;
    drawMini(S.drag.mod, cx, cy, s);
    ctx.globalAlpha = 1;
  }
}

function drawWorkstation() {
  if (!S.workstation || S.phase !== "run" || !isScoreMode()) return;
  const r = workstationRect(S.workstation);
  if (!r) return;
  const fill = S.darkTheme ? "rgba(161, 98, 7, 0.26)" : "rgba(253, 224, 71, 0.26)";
  const line = S.darkTheme ? "rgba(245, 158, 11, 0.55)" : "rgba(202, 138, 4, 0.55)";
  ctx.fillStyle = fill;
  ctx.fillRect(r.x * CELL, r.y * CELL, r.w * CELL, r.h * CELL);
  ctx.strokeStyle = line;
  ctx.lineWidth = 2;
  ctx.strokeRect(r.x * CELL + 1, r.y * CELL + 1, r.w * CELL - 2, r.h * CELL - 2);
  ctx.lineWidth = 1;
  for (let x = r.x; x <= r.x + r.w; x++) {
    const sx = x * CELL + 0.5;
    ctx.beginPath();
    ctx.moveTo(sx, r.y * CELL);
    ctx.lineTo(sx, (r.y + r.h) * CELL);
    ctx.stroke();
  }
  for (let y = r.y; y <= r.y + r.h; y++) {
    const sy = y * CELL + 0.5;
    ctx.beginPath();
    ctx.moveTo(r.x * CELL, sy);
    ctx.lineTo((r.x + r.w) * CELL, sy);
    ctx.stroke();
  }

  if (S.workstation.entered) {
    ctx.fillStyle = S.darkTheme ? "#fbbf24" : "#92400e";
    ctx.font = "700 14px Rockwell, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("Workstation: Drag attachments (" + Math.max(0, S.workstation.ttl).toFixed(1) + "s)  Exit: E", S.workstation.x * CELL, (r.y - 0.2) * CELL);
  }
}

function drawFxParticles() {
  for (const fx of S.pickupFx) {
    const p = Math.max(0, fx.ttl / (fx.maxTtl || 0.62));
    ctx.globalAlpha = p;
    ctx.fillStyle = fx.color;
    const s = fx.size * (0.7 + (1 - p) * 0.65);
    ctx.fillRect(fx.x * CELL - s / 2, fx.y * CELL - s / 2, s, s);
  }
  for (const fx of S.bossFx) {
    const p = Math.max(0, fx.ttl / (fx.maxTtl || 1));
    ctx.globalAlpha = p;
    ctx.fillStyle = fx.color;
    const s = fx.size * (0.8 + (1 - p) * 0.8);
    ctx.fillRect(fx.x * CELL - s / 2, fx.y * CELL - s / 2, s, s);
  }
  for (const fx of S.enemyFx) {
    const p = Math.max(0, fx.ttl / (fx.maxTtl || 0.25));
    ctx.globalAlpha = p;
    ctx.fillStyle = fx.color;
    const s = fx.size * (0.86 + (1 - p) * 0.5);
    ctx.fillRect(fx.x * CELL - s / 2, fx.y * CELL - s / 2, s, s);
  }
  ctx.globalAlpha = 1;
}

function drawRedCube() {
  if (!S.p.placed) return;
  const h = (S.p.size * CELL) / 2;
  const px = S.p.x * CELL - h;
  const py = S.p.y * CELL - h;
  const s = h * 2;

  ctx.fillStyle = "#ef4444";
  ctx.fillRect(px, py, s, s);
  ctx.strokeStyle = "#7f1d1d";
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 1, py + 1, s - 2, s - 2);

  ctx.fillStyle = "#111827";
  const ey = py + s * 0.34;
  const eo = s * 0.2;
  const er = Math.max(2, s * 0.06);
  ctx.beginPath();
  ctx.arc(px + s / 2 - eo, ey, er, 0, Math.PI * 2);
  ctx.arc(px + s / 2 + eo, ey, er, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px + s / 2, py + s * 0.58, s * 0.18, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

function drawEnemy() {
  for (const e of S.enemy) {
    const h = (e.size * CELL) / 2;
    const px = e.x * CELL - h;
    const py = e.y * CELL - h;
    const s = h * 2;

    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(px, py, s, s);
    ctx.strokeStyle = "#1d4ed8";
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1, py + 1, s - 2, s - 2);

    ctx.fillStyle = "#111827";
    const ey = py + s * 0.34;
    const eo = s * 0.2;
    const er = Math.max(2, s * 0.06);
    ctx.beginPath();
    ctx.arc(px + s / 2 - eo, ey, er, 0, Math.PI * 2);
    ctx.arc(px + s / 2 + eo, ey, er, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + s * 0.32, py + s * 0.67);
    ctx.lineTo(px + s * 0.68, py + s * 0.67);
    ctx.stroke();

    const bw = s;
    const bh = 4;
    const bx = px;
    const by = py - 8;
    const ratio = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(bx + 0.5, by + 0.5, (bw - 1) * ratio, bh - 1);

    if (isScoreMode() && S.score >= 200) {
      const mods = [];
      for (let i = 0; i < (e.pickGun || 0); i++) mods.push("gun");
      for (let i = 0; i < (e.pickAIGun || 0); i++) mods.push("ai-gun");
      for (let i = 0; i < (e.pickRapid || 0); i++) mods.push("rapid-gun");
      for (let i = 0; i < (e.pickPurple || 0); i++) mods.push("purple-gun");
      for (let i = 0; i < (e.pickBurst || 0); i++) mods.push("burst");
      for (let i = 0; i < (e.pickFactory || 0); i++) mods.push("factory");
      const slots = [
        [0, -1], [1, 0], [0, 1], [-1, 0],
        [-1, -1], [1, -1], [1, 1], [-1, 1]
      ];
      const ms = Math.max(4, s * 0.18);
      for (let i = 0; i < mods.length && i < slots.length; i++) {
        const sd = slots[i];
        const mx = px + s / 2 + sd[0] * (s / 2 + ms * 0.5) - ms / 2;
        const my = py + s / 2 + sd[1] * (s / 2 + ms * 0.5) - ms / 2;
        let c = "#22c55e";
        if (mods[i] === "ai-gun") c = "#166534";
        else if (mods[i] === "rapid-gun") c = "#eab308";
        else if (mods[i] === "purple-gun") c = "#9333ea";
        else if (mods[i] === "burst") c = "#c9a26b";
        else if (mods[i] === "factory") c = "#ef4444";
        ctx.fillStyle = c;
        ctx.fillRect(mx, my, ms, ms);
        ctx.strokeStyle = "rgba(15,23,42,.7)";
        ctx.lineWidth = 1;
        ctx.strokeRect(mx + 0.5, my + 0.5, ms - 1, ms - 1);
      }
    }
  }
}

function drawWhiteCubes() {
  for (const e of S.white) {
    const h = (e.size * CELL) / 2;
    const px = e.x * CELL - h;
    const py = e.y * CELL - h;
    const s = h * 2;

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(px, py, s, s);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1, py + 1, s - 2, s - 2);

    ctx.fillStyle = "#0f172a";
    const ey = py + s * 0.34;
    const eo = s * 0.2;
    const er = Math.max(2, s * 0.06);
    ctx.beginPath();
    ctx.arc(px + s / 2 - eo, ey, er, 0, Math.PI * 2);
    ctx.arc(px + s / 2 + eo, ey, er, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + s * 0.3, py + s * 0.66);
    ctx.lineTo(px + s * 0.7, py + s * 0.66);
    ctx.stroke();

    const ratio = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
    ctx.fillRect(px, py - 8, s, 4);
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(px + 0.5, py - 7.5, (s - 1) * ratio, 3);
  }
}

function drawYellowFactories() {
  for (const e of S.yellow) {
    const h = (e.size * CELL) / 2;
    const px = e.x * CELL - h;
    const py = e.y * CELL - h;
    const s = h * 2;

    ctx.fillStyle = "#facc15";
    ctx.fillRect(px, py, s, s);
    ctx.strokeStyle = "#a16207";
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1, py + 1, s - 2, s - 2);

    ctx.fillStyle = "#111827";
    const ey = py + s * 0.34;
    const eo = s * 0.2;
    const er = Math.max(2, s * 0.055);
    ctx.beginPath();
    ctx.arc(px + s / 2 - eo, ey, er, 0, Math.PI * 2);
    ctx.arc(px + s / 2 + eo, ey, er, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + s * 0.3, py + s * 0.7);
    ctx.lineTo(px + s * 0.7, py + s * 0.7);
    ctx.stroke();

    const bw = s;
    const bh = 4;
    const ratio = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
    ctx.fillRect(px, py - 8, bw, bh);
    ctx.fillStyle = "#84cc16";
    ctx.fillRect(px + 0.5, py - 7.5, (bw - 1) * ratio, bh - 1);
  }
}

function drawYellowMiniCubes() {
  for (const e of S.yellowMini) {
    const h = (e.size * CELL) / 2;
    const px = e.x * CELL - h;
    const py = e.y * CELL - h;
    const s = h * 2;

    ctx.fillStyle = "#fde047";
    ctx.fillRect(px, py, s, s);
    ctx.strokeStyle = "#ca8a04";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 0.8, py + 0.8, s - 1.6, s - 1.6);
  }
}

function drawGreenCube() {
  const g = S.greenCube;
  if (!g) return;
  const h = (g.size * CELL) / 2;
  const px = g.x * CELL - h;
  const py = g.y * CELL - h;
  const s = h * 2;

  ctx.fillStyle = "#22c55e";
  ctx.fillRect(px, py, s, s);
  ctx.strokeStyle = "#166534";
  ctx.lineWidth = 2.3;
  ctx.strokeRect(px + 1, py + 1, s - 2, s - 2);

  const ratio = Math.max(0, g.hp / g.maxHp);
  ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
  ctx.fillRect(px, py - 9, s, 5);
  ctx.fillStyle = "#86efac";
  ctx.fillRect(px + 0.5, py - 8.5, (s - 1) * ratio, 4);
}

function drawRedMiniCubes() {
  for (const e of S.redMini) {
    const h = (e.size * CELL) / 2;
    const px = e.x * CELL - h;
    const py = e.y * CELL - h;
    const s = h * 2;

    ctx.fillStyle = "#ef4444";
    ctx.fillRect(px, py, s, s);
    ctx.strokeStyle = "#7f1d1d";
    ctx.lineWidth = 1.4;
    ctx.strokeRect(px + 0.6, py + 0.6, s - 1.2, s - 1.2);
  }
}

function drawBoss() {
  if (!S.boss) return;
  const b = S.boss;
  const h = (b.size * CELL) / 2;
  const px = b.x * CELL - h;
  const py = b.y * CELL - h;
  const s = h * 2;

  ctx.fillStyle = "#1e3a8a";
  ctx.fillRect(px, py, s, s);
  ctx.strokeStyle = "#0b173f";
  ctx.lineWidth = 3;
  ctx.strokeRect(px + 1.5, py + 1.5, s - 3, s - 3);

  ctx.fillStyle = "#0f172a";
  const ey = py + s * 0.34;
  const eo = s * 0.2;
  const er = Math.max(3, s * 0.055);
  ctx.beginPath();
  ctx.arc(px + s / 2 - eo, ey, er, 0, Math.PI * 2);
  ctx.arc(px + s / 2 + eo, ey, er, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px + s * 0.26, py + s * 0.72);
  ctx.lineTo(px + s * 0.74, py + s * 0.72);
  ctx.stroke();

  const bw = s;
  const bh = 7;
  const ratio = Math.max(0, b.hp / b.maxHp);
  ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
  ctx.fillRect(px, py - 12, bw, bh);
  ctx.fillStyle = "#f43f5e";
  ctx.fillRect(px + 0.5, py - 11.5, (bw - 1) * ratio, bh - 1);
}

function workstationStatusText() {
  if (!isScoreMode()) return "";
  if (S.workstation) {
    if (S.workstation.entered) return "WS: Editing (" + Math.max(0, S.workstation.ttl).toFixed(1) + "s)";
    const d = Math.hypot(S.workstation.x - S.p.x, S.workstation.y - S.p.y);
    return "WS: " + d.toFixed(1) + " tiles";
  }
  const moved = Math.hypot(S.p.x - S.workRefX, S.p.y - S.workRefY);
  const remain = Math.max(0, WORKSTATION_GAP - moved);
  return "WS In: " + remain.toFixed(0) + " tiles";
}

function drawScoreAttachmentHud() {
  if (!isScoreMode() || S.phase !== "run") return;
  const entries = [];
  if (gunModules().length) entries.push({ type: "gun", label: "Gun (G)", ready: S.gunCd <= 0, cd: S.gunCd });
  if (purpleGunModules().length) entries.push({ type: "purple-gun", label: "Purple (Click)", ready: true, cd: 0 });
  if (burstModules().length) entries.push({ type: "burst", label: "Burst (F)", ready: S.burstCd <= 0, cd: S.burstCd });
  if (bombModules().length) entries.push({ type: "bomb", label: "Bomb (B)", ready: S.bombCd <= 0, cd: S.bombCd });
  if (hasUpgradeAttachment()) entries.push({ type: "upgrade", label: "Upgrade", ready: true, cd: 0 });
  if (S.swordCount > 0) entries.push({ type: "factory", label: "Sword x" + S.swordCount, ready: true, cd: 0 });
  if (factoryModules().length) entries.push({ type: "factory", label: "Factory", ready: true, cd: 0 });
  if (!entries.length) return;

  const y = ui.c.height - 64;
  const w = Math.min(ui.c.width - 20, entries.length * 120 + 12);
  const x = ui.c.width / 2 - w / 2;
  ctx.fillStyle = "rgba(15,23,42,0.52)";
  ctx.fillRect(x, y, w, 54);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 53);

  let ox = x + 8;
  for (const e of entries) {
    const color = MCOL[e.type] || "#94a3b8";
    const active = e.ready;
    ctx.globalAlpha = active ? 1 : 0.4;
    ctx.fillStyle = color;
    ctx.fillRect(ox, y + 8, 18, 18);
    ctx.strokeStyle = "rgba(15,23,42,0.75)";
    ctx.strokeRect(ox + 0.5, y + 8.5, 17, 17);
    ctx.globalAlpha = 1;
    ctx.fillStyle = S.darkTheme ? "#f8fafc" : "#111827";
    ctx.font = "700 11px Rockwell, serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(e.label, ox + 24, y + 8);
    const cdTxt = e.cd > 0 ? e.cd.toFixed(1) + "s" : "Ready";
    ctx.fillStyle = active ? "#d1fae5" : "#fecaca";
    ctx.font = "700 10px Rockwell, serif";
    ctx.fillText(cdTxt, ox + 24, y + 24);
    ox += 118;
  }

  const collected = [
    ["gun", S.collectedDrops.gun || 0],
    ["ai-gun", S.collectedDrops["ai-gun"] || 0],
    ["rapid-gun", S.collectedDrops["rapid-gun"] || 0],
    ["purple-gun", S.collectedDrops["purple-gun"] || 0],
    ["burst", S.collectedDrops.burst || 0],
    ["factory", S.collectedDrops.factory || 0],
    ["sword", S.collectedDrops.sword || 0]
  ];
  const by = y + 56;
  let bx = 14;
  ctx.fillStyle = S.darkTheme ? "#cbd5e1" : "#111827";
  ctx.font = "700 11px Rockwell, serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("Picked:", bx, by);
  bx += 50;
  for (const [type, val] of collected) {
    if (!val) continue;
    ctx.fillStyle = dropColor(type);
    ctx.fillRect(bx, by - 7, 12, 12);
    ctx.strokeStyle = "rgba(15,23,42,0.7)";
    ctx.strokeRect(bx + 0.5, by - 6.5, 11, 11);
    ctx.fillStyle = S.darkTheme ? "#f8fafc" : "#111827";
    ctx.fillText(String(val), bx + 16, by);
    bx += 42;
  }
}

function drawMeter() {
  if (isScoreMode()) {
    const nextDrop = Math.max(0, S.dropSpawnCd).toFixed(1) + "s";
    const incoming = S.dropTelegraphs.length ? " (Incoming)" : "";
    const upg = hasUpgradeAttachment() ? "  |  Upgrade +" + attachmentDamageBonus().toFixed(2) : "";
    const ws = "  |  " + workstationStatusText();
    const txt = "Score: " + S.score + "  |  Best: " + S.bestScore + "  |  Next Boss: " + S.nextBossScore + "  |  Next Drop: " + nextDrop + incoming + upg + ws;
    ctx.fillStyle = "rgba(17,24,39,.55)";
    ctx.fillRect(10, 8, Math.min(ui.c.width - 20, 980), 24);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "700 13px Rockwell, serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(txt, 16, 20);
    drawScoreAttachmentHud();
    return;
  }
  const r = Math.min(1, S.hold / GOAL_TIME);
  const x = 12;
  const y = 10;
  const w = 220;
  const h = 14;
  ctx.fillStyle = "rgba(17,24,39,.5)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(255,255,255,.9)";
  ctx.fillRect(x + 1, y + 1, (w - 2) * r, h - 2);
  ctx.fillStyle = "#111827";
  ctx.font = "12px Rockwell, serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("Goal hold: " + S.hold.toFixed(1) + " / 5.0s", x, y + h + 4);
}

function drawOverlay(text1, text2, color = "rgba(17,24,39,.78)") {
  const w = 640;
  const h = 128;
  const x = ui.c.width / 2 - w / 2;
  const y = ui.c.height / 2 - h / 2;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(255,255,255,.8)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = "#f9fafb";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 28px Rockwell, serif";
  ctx.fillText(text1, ui.c.width / 2, y + 45);
  ctx.font = "600 16px Rockwell, serif";
  ctx.fillText(text2, ui.c.width / 2, y + 85);
}

function drawModeFlash() {
  if (!S.modeFlash) return;
  const p = Math.max(0, Math.min(1, S.modeFlash.ttl / S.modeFlash.maxTtl));
  const t = 1 - p;
  const size = Math.max(ui.c.width, ui.c.height) * (1.35 - t * 1.05);
  const alpha = (0.55 * p).toFixed(3);
  ctx.save();
  ctx.translate(ui.c.width / 2, ui.c.height / 2);
  ctx.fillStyle = "rgba(251, 191, 156, " + alpha + ")";
  ctx.strokeStyle = "rgba(0, 0, 0, " + alpha + ")";
  ctx.lineWidth = 6;
  ctx.fillRect(-size / 2, -size / 2, size, size);
  ctx.strokeRect(-size / 2, -size / 2, size, size);
  ctx.restore();
}

function render() {
  drawBackground();
  const cam = cameraOffset();
  const zoom = buildZoom();
  ctx.save();
  if (zoom !== 1) {
    const cx = ui.c.width / 2;
    const cy = ui.c.height / 2;
    ctx.translate(cx, cy);
    ctx.scale(zoom, zoom);
    ctx.translate(-cx, -cy);
  }
  ctx.translate(cam.x, cam.y);
  drawGrid();
  drawHints();
  if (!isScoreMode()) drawGoal();
  drawWalls();
  drawWorkstation();
  drawDropTelegraphs();
  drawDrops();
  drawBombs();
  drawSpawnPreview();
  drawSpawners();
  drawLasers();
  drawGunBullets();
  drawEnemyBullets();
  drawSword();
  drawAttach();
  drawEnemy();
  drawWhiteCubes();
  drawYellowFactories();
  drawYellowMiniCubes();
  drawGreenCube();
  drawRedMiniCubes();
  drawBoss();
  drawFxParticles();
  drawRedCube();
  ctx.restore();
  drawMeter();
  drawModeFlash();

  if (!isScoreMode() && S.phase === "complete") {
    drawOverlay("Level " + (S.i + 1) + " Complete", S.lastRunSummary || (S.i + 1 < LEVELS ? "Press Next Level to continue." : "All levels complete."));
  } else if (S.phase === "run" && S.paused) {
    drawOverlay("Paused", "Press P to resume. " + (S.pausedByMenu ? "Menu opened." : ""));
  } else if (S.phase === "gameover") {
    const sub = isScoreMode()
      ? "Final Score: " + S.score + " | Best: " + S.bestScore + ". " + (S.lastRunSummary || "Press Restart.")
      : "Laser or hazards stopped your run. Press Restart.";
    drawOverlay("Game Over", sub, "rgba(127, 29, 29, .82)");
  }
}

function drawLevelButtons() {
  if (isScoreMode()) {
    ui.levels.innerHTML = "";
    return;
  }
  ui.levels.innerHTML = "";
  for (let i = 0; i < LEVELS; i++) {
    const n = i + 1;
    const b = document.createElement("button");
    b.className = "lv";
    b.textContent = String(n);
    if (n > S.unlock) {
      b.classList.add("locked");
      b.disabled = true;
    }
    if (n === S.i + 1) b.classList.add("current");
    if (S.done.has(n)) b.classList.add("cleared");
    b.addEventListener("click", () => {
      if (n <= S.unlock) loadLevel(n - 1);
    });
    ui.levels.appendChild(b);
  }
}

function updUI() {
  const n = S.i + 1;
  ui.title.textContent = isScoreMode() ? "nignig (Score Mode)" : "nignig (20 Levels)";
  ui.phase.textContent = "Phase: " + S.phase[0].toUpperCase() + S.phase.slice(1);
  if (isScoreMode()) {
    ui.level.textContent = "Mode: Score Arena";
    const nextDrop = Math.max(0, S.dropSpawnCd).toFixed(1) + "s";
    const incoming = S.dropTelegraphs.length ? " (Incoming)" : "";
    ui.goal.textContent = "Score: " + S.score + " | Next Boss: " + S.nextBossScore + " | Next Drop: " + nextDrop + incoming + " | " + workstationStatusText();
  } else {
    ui.level.textContent = "Level: " + n + " / " + LEVELS;
    ui.goal.textContent = "Goal Hold: " + S.hold.toFixed(1) + " / 5.0s";
  }
  ui.speed.textContent = "Speed: " + Math.hypot(S.p.vx, S.p.vy).toFixed(2);
  if (ui.update) ui.update.textContent = "Update: " + UPDATE_VERSION + " | Shards: " + S.meta.shards;
  if (ui.wsExit) ui.wsExit.style.display = workstationActive() ? "inline-flex" : "none";

  ui.status.textContent = HELP[S.tool] + (S.msg ? " " + S.msg : "");

  if (!S.p.placed) {
    ui.readout.textContent = "No cube placed yet.";
  } else {
    const lines = [];
    for (const sd of SIDES) {
      const txt = S.a[sd]
        .map((m) => (
          m.type === "move" ? "move:" + m.dir
            : m.type === "gun" ? "gun:" + m.dir
              : m.type === "ai-gun" ? "ai-gun"
                : m.type === "rapid-gun" ? "rapid-gun:" + m.dir
                  : m.type === "purple-gun" ? "purple-gun"
                  : m.type === "burst" ? "burst"
                      : m.type === "upgrade" ? "upgrade"
                        : m.type === "factory" ? "factory"
                          : m.type === "bomb" ? "bomb"
                            : "stabilizer"
        ))
        .join(", ");
      lines.push(sd.toUpperCase() + " -> " + (txt || "none"));
    }
    lines.push("Controls: G guns | Left Click purple-gun aim | F burst | B bomb | C stabilizer pulse | E exit workstation");
    ui.readout.textContent = lines.join("\n");
  }

  ui.events.innerHTML = S.events.map((e) => "<li>" + e + "</li>").join("");

  ui.next.disabled = isScoreMode() || S.i + 1 >= LEVELS || S.unlock <= S.i + 1;
  ui.start.disabled = S.phase === "run" || S.phase === "menu";
  ui.build.disabled = S.phase === "build" || S.phase === "menu";
  if (ui.pause) {
    ui.pause.textContent = S.paused ? "Resume (P)" : "Pause (P)";
    ui.pause.disabled = S.phase !== "run";
  }
  if (ui.openMenu) ui.openMenu.disabled = S.phase !== "run";
  if (ui.devCard) ui.devCard.style.display = isScoreMode() ? "grid" : "none";
  if (ui.devUnlock) ui.devUnlock.textContent = S.devUnlocked ? "Dev Mode Unlocked" : "Unlock Dev Mode";
  if (ui.devUnlock) ui.devUnlock.disabled = !isScoreMode() || S.devUnlocked;
  if (ui.devScore) ui.devScore.disabled = !isScoreMode() || !S.devUnlocked;
  if (ui.devBoss) ui.devBoss.disabled = !isScoreMode() || !S.devUnlocked;
  if (ui.devKill) ui.devKill.disabled = !isScoreMode() || !S.devUnlocked || S.phase !== "run";
  if (ui.devDrops) ui.devDrops.disabled = !isScoreMode() || !S.devUnlocked || S.phase !== "run";
  if (ui.devAddAIGun) ui.devAddAIGun.disabled = !isScoreMode() || !S.devUnlocked;
  if (ui.devAddRapid) ui.devAddRapid.disabled = !isScoreMode() || !S.devUnlocked;
  if (ui.devAddPurple) ui.devAddPurple.disabled = !isScoreMode() || !S.devUnlocked;
  if (ui.devAddBurst) ui.devAddBurst.disabled = !isScoreMode() || !S.devUnlocked;
  if (ui.devAddFactory) ui.devAddFactory.disabled = !isScoreMode() || !S.devUnlocked;
  if (ui.devAddSword) ui.devAddSword.disabled = !isScoreMode() || !S.devUnlocked;
  if (ui.devAuto) {
    ui.devAuto.disabled = !isScoreMode() || !S.devUnlocked;
    ui.devAuto.textContent = "AI: " + (S.devAutoPilot ? "ON" : "OFF");
  }
  if (ui.devHint) {
    ui.devHint.textContent = S.devUnlocked
      ? "Developer mode active. Use tools for testing in Score Mode."
      : "Password required. Dev tools only work in Score Mode.";
  }
  refreshMetaPanel();

  drawLevelButtons();
}

function toolButtons() {
  ui.tools.innerHTML = "";
  for (const [id, label] of TOOLS) {
    const b = document.createElement("button");
    b.className = "btn tool-btn" + (id === S.tool ? " active" : "");
    const icon = TOOL_ICONS[id] || "[+]";
    b.innerHTML = '<span class="tool-icon" aria-hidden="true">' + icon + "</span><span>" + label + "</span>";
    b.addEventListener("click", () => {
      S.tool = id;
      toolButtons();
      updUI();
    });
    ui.tools.appendChild(b);
  }
}

function clickCanvas(e) {
  if (S.phase !== "build") return;
  const r = ui.c.getBoundingClientRect();
  const sx = ui.c.width / r.width;
  const sy = ui.c.height / r.height;
  const cam = cameraOffset();
  const zoom = buildZoom();
  const px = (e.clientX - r.left) * sx;
  const py = (e.clientY - r.top) * sy;
  const cx = ui.c.width / 2;
  const cy = ui.c.height / 2;
  const worldX = (((px - cx) / zoom) + cx - cam.x) / CELL;
  const worldY = (((py - cy) / zoom) + cy - cam.y) / CELL;
  const x = Math.floor(worldX);
  const y = Math.floor(worldY);
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  placeAt(x, y);
  updUI();
}

function pointerWorld(e) {
  const r = ui.c.getBoundingClientRect();
  const sx = ui.c.width / r.width;
  const sy = ui.c.height / r.height;
  const cam = cameraOffset();
  const zoom = buildZoom();
  const px = (e.clientX - r.left) * sx;
  const py = (e.clientY - r.top) * sy;
  const cx = ui.c.width / 2;
  const cy = ui.c.height / 2;
  const worldX = (((px - cx) / zoom) + cx - cam.x) / CELL;
  const worldY = (((py - cy) / zoom) + cy - cam.y) / CELL;
  return { x: worldX, y: worldY };
}

function onMouseMove(e) {
  const w = pointerWorld(e);
  S.mouse.x = w.x;
  S.mouse.y = w.y;
}

function onMouseDown(e) {
  if (e.button !== 0) return;
  const w = pointerWorld(e);
  S.mouse.x = w.x;
  S.mouse.y = w.y;
  S.mouse.down = true;
  if (workstationActive()) {
    beginAttachmentDrag(w.x, w.y);
    return;
  }
  if (S.phase === "run") {
    firePurpleGunsAt(w.x, w.y);
  }
}

function onMouseUp(e) {
  if (e.button !== 0) return;
  const w = pointerWorld(e);
  S.mouse.x = w.x;
  S.mouse.y = w.y;
  S.mouse.down = false;
  if (workstationActive()) endAttachmentDrag(w.x, w.y);
}

function onDown(e) {
  const tracked = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyA", "KeyD", "KeyW", "KeyS", "KeyR", "KeyE", "KeyF", "KeyC", "KeyG", "KeyB", "KeyP", "Enter"];
  if (tracked.includes(e.code)) e.preventDefault();
  S.keys[e.code] = true;

  if (e.code === "KeyE" && workstationActive()) {
    endWorkstation("Workstation exited by player.");
    return;
  }
  if (e.code === "KeyF") fireBurstAttachments();
  if (e.code === "KeyC") triggerStabilizerPulse();
  if (e.code === "KeyB") fireBombAttachment();
  if (e.code === "KeyG" && !e.repeat) fireGuns();
  if (e.code === "KeyP" && !e.repeat) togglePause();
  if (e.code === "KeyR") restart();
  if (e.code === "Enter" && S.phase === "build") startRun();
}

function onUp(e) {
  S.keys[e.code] = false;
}

function frame(now) {
  const dt = Math.min(0.033, (now - S.last) / 1000);
  S.last = now;
  if (!(S.phase === "run" && S.paused)) update(dt);
  render();
  if (now >= S.uiNext) {
    updUI();
    S.uiNext = now + 120;
  }
  requestAnimationFrame(frame);
}

function loadSave() {
  const u = Number(localStorage.getItem("redCubeUnlock"));
  if (Number.isFinite(u) && u >= 1 && u <= LEVELS) S.unlock = u;
  const best = Number(localStorage.getItem("redCubeBestScore"));
  if (Number.isFinite(best) && best >= 0) S.bestScore = Math.floor(best);
  try {
    const arr = JSON.parse(localStorage.getItem("redCubeDone") || "[]");
    if (Array.isArray(arr)) {
      for (const n of arr) {
        if (Number.isInteger(n) && n >= 1 && n <= LEVELS) S.done.add(n);
      }
    }
  } catch (_) {
    // ignore bad storage
  }
  const dark = localStorage.getItem("redCubeDarkTheme");
  if (dark === "1" || dark === "0") S.darkTheme = dark === "1";
  loadMetaProgress();
}

function bind() {
  ui.c.addEventListener("click", clickCanvas);
  ui.c.addEventListener("mousemove", onMouseMove);
  ui.c.addEventListener("mousedown", onMouseDown);
  ui.c.addEventListener("mouseup", onMouseUp);
  ui.c.addEventListener("mouseleave", () => {
    S.mouse.down = false;
    if (S.drag && workstationActive()) endAttachmentDrag(S.mouse.x, S.mouse.y);
  });
  ui.start.addEventListener("click", startRun);
  ui.build.addEventListener("click", backBuild);
  ui.restart.addEventListener("click", restart);
  if (ui.wsExit) {
    ui.wsExit.addEventListener("click", () => {
      if (workstationActive()) endWorkstation("Workstation exited by player.");
    });
  }
  ui.next.addEventListener("click", () => {
    if (S.i + 1 < LEVELS && S.unlock > S.i + 1) loadLevel(S.i + 1);
  });
  if (ui.menuPlay) ui.menuPlay.addEventListener("click", () => {
    showMenuView("modes");
    if (ui.menuSettingsPanel) ui.menuSettingsPanel.classList.add("hidden");
  });
  if (ui.menuUpgradesBtn) ui.menuUpgradesBtn.addEventListener("click", () => showMenuView("upgrades"));
  if (ui.menuBack) ui.menuBack.addEventListener("click", () => showMenuView("home"));
  if (ui.menuUpgradesBack) ui.menuUpgradesBack.addEventListener("click", () => showMenuView("home"));
  if (ui.menuSettings && ui.menuSettingsPanel) {
    ui.menuSettings.addEventListener("click", () => {
      ui.menuSettingsPanel.classList.toggle("hidden");
    });
  }
  ui.startGame.addEventListener("click", () => {
    S.modeFlash = { ttl: 0.25, maxTtl: 0.25 };
    startLevelMode();
  });
  ui.startScore.addEventListener("click", () => {
    S.modeFlash = { ttl: 0.25, maxTtl: 0.25 };
    startScoreMode();
  });
  if (ui.darkTheme) {
    ui.darkTheme.addEventListener("change", () => {
      S.darkTheme = !!ui.darkTheme.checked;
      localStorage.setItem("redCubeDarkTheme", S.darkTheme ? "1" : "0");
      applyTheme();
      updUI();
    });
  }
  if (ui.devUnlock) ui.devUnlock.addEventListener("click", requestDeveloperUnlock);
  if (ui.devScore) ui.devScore.addEventListener("click", devSetScorePrompt);
  if (ui.devBoss) ui.devBoss.addEventListener("click", devSummonBossNow);
  if (ui.devKill) ui.devKill.addEventListener("click", devKillAllEnemies);
  if (ui.devDrops) ui.devDrops.addEventListener("click", devGiveDropsPack);
  if (ui.devAddAIGun) ui.devAddAIGun.addEventListener("click", () => devAddAttachment("ai-gun"));
  if (ui.devAddRapid) ui.devAddRapid.addEventListener("click", () => devAddAttachment("rapid-gun"));
  if (ui.devAddPurple) ui.devAddPurple.addEventListener("click", () => devAddAttachment("purple-gun"));
  if (ui.devAddBurst) ui.devAddBurst.addEventListener("click", () => devAddAttachment("burst"));
  if (ui.devAddFactory) ui.devAddFactory.addEventListener("click", () => devAddAttachment("factory"));
  if (ui.devAddSword) ui.devAddSword.addEventListener("click", () => devAddAttachment("sword"));
  if (ui.devAuto) ui.devAuto.addEventListener("click", devToggleAutoPilot);
  if (ui.pause) ui.pause.addEventListener("click", () => togglePause());
  if (ui.openMenu) ui.openMenu.addEventListener("click", () => openMenuFromRun());
  window.addEventListener("keydown", onDown, { passive: false });
  window.addEventListener("keyup", onUp);
}

function boot() {
  loadSave();
  applyTheme();
  showMenuView("home");
  setBuildZoneForMode("levels");
  initLevels();
  toolButtons();
  bind();
  buildMetaPanel();
  setMsg("Choose Level Mode or Score Mode from the menu.");
  requestAnimationFrame((ts) => {
    S.last = ts;
    frame(ts);
  });
}

boot();
})();

