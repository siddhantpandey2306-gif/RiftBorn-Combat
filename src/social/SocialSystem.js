// RIFTBORN Social System: Global Leaderboards, Friends, Replay Telemetry, and Clan Guilds

export const GLOBAL_LEADERBOARD = [
  { rank: 1, name: 'Vanguard_Kuro', tier: 'Rift Champion', rp: 2450, mainChar: 'vex', wins: 342, winRate: '78%' },
  { rank: 2, name: 'Aethel_Breaker', tier: 'Rift Champion', rp: 2380, mainChar: 'solaris', wins: 310, winRate: '75%' },
  { rank: 3, name: 'Phantom_Lily', tier: 'Rift Champion', rp: 2310, mainChar: 'lyra', wins: 295, winRate: '73%' },
  { rank: 4, name: 'Zenith_Staff', tier: 'Master', rp: 2190, mainChar: 'aeron', wins: 270, winRate: '71%' },
  { rank: 5, name: 'Toxic_Fang', tier: 'Master', rp: 2140, mainChar: 'kairo', wins: 258, winRate: '69%' },
  { rank: 6, name: 'VoidWalker_X', tier: 'Master', rp: 2090, mainChar: 'nox', wins: 244, winRate: '68%' },
  { rank: 7, name: 'Solaris_Prime', tier: 'Diamond I', rp: 1980, mainChar: 'solaris', wins: 220, winRate: '66%' },
  { rank: 8, name: 'Crimson_Edge', tier: 'Diamond I', rp: 1920, mainChar: 'vex', wins: 208, winRate: '64%' },
  { rank: 9, name: 'ShadowDancer', tier: 'Diamond II', rp: 1860, mainChar: 'lyra', wins: 195, winRate: '63%' },
  { rank: 10, name: 'Kyoto_Azure', tier: 'Diamond III', rp: 1790, mainChar: 'aeron', wins: 182, winRate: '61%' }
];

export const MOCK_FRIENDS = [
  { id: 'f1', name: 'CyberSamurai', status: 'In Ranked Match', mainChar: 'vex', rank: 'Gold I', level: 18 },
  { id: 'f2', name: 'SolarQueen', status: 'Online (In Lobby)', mainChar: 'solaris', rank: 'Platinum III', level: 24 },
  { id: 'f3', name: 'VoidReaper', status: 'Training Arena', mainChar: 'nox', rank: 'Diamond II', level: 31 },
  { id: 'f4', name: 'EmeraldWhip', status: 'Offline (2h ago)', mainChar: 'kairo', rank: 'Silver I', level: 12 }
];

export const MOCK_CLANS = [
  { id: 'c1', name: 'Rift Wardens', tag: 'RIFT', members: 48, maxMembers: 50, rank: 1, motd: 'Defenders of the Core. Push for Champion this season!' },
  { id: 'c2', name: 'Helios Vanguard', tag: 'HELIOS', members: 42, maxMembers: 50, rank: 2, motd: 'Solar heavy specialists. Iron will and blazing fists.' },
  { id: 'c3', name: 'Void Singularity', tag: 'VOID', members: 39, maxMembers: 50, rank: 3, motd: 'Masters of the dark rift. Step into the event horizon.' }
];

export class ReplayRecorder {
  constructor() {
    this.isRecording = false;
    this.recordedTicks = [];
    this.matchMeta = null;
  }

  startRecording(meta) {
    this.isRecording = true;
    this.matchMeta = meta;
    this.recordedTicks = [];
  }

  recordTick(tick, p1Input, p2Input, p1Hp, p2Hp) {
    if (!this.isRecording) return;
    this.recordedTicks.push({
      t: tick,
      i1: p1Input,
      i2: p2Input,
      h1: Math.round(p1Hp),
      h2: Math.round(p2Hp)
    });
  }

  stopRecording(winner) {
    this.isRecording = false;
    return {
      meta: { ...this.matchMeta, winner, timestamp: Date.now() },
      totalTicks: this.recordedTicks.length,
      ticks: this.recordedTicks
    };
  }

  exportReplayJson(replay) {
    return JSON.stringify(replay, null, 2);
  }
}
