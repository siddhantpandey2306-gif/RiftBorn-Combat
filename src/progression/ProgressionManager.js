// RIFTBORN Progression & Inventory Management Engine
// Independent Character Progression, Leveling, Mastery, Ability & Cosmetic Unlocks, and Non-Pay-to-Win Mechanics

import { CHARACTERS } from '../characters/characterData.js';
import { CHARACTER_PROGRESSION_TRACKS, calculateXpNeeded, calculateMasteryXpNeeded } from './progressionTracks.js';
import { STORY_CHAPTERS } from '../modes/StoryMode.js';

import { RANK_TIERS, SEASON_CONFIG, CompetitiveRankEngine } from '../competitive/CompetitiveSystem.js';
import { ChallengeManager, COSMETIC_REWARDS_CATALOG } from './ChallengeManager.js';
export { RANK_TIERS, SEASON_CONFIG, CompetitiveRankEngine, COSMETIC_REWARDS_CATALOG };

const STORAGE_KEY = 'riftborn_save_v3'; // Bumped key to load fresh competitive ranking architecture

export class ProgressionManager {
  constructor() {
    this.data = this.loadData();
    this.ensureCharacterProgressionIntegrity();
    this.challengeManager = new ChallengeManager(this);
  }

  getDefaultData() {
    // Initial starting progression states for all 6 characters
    // Vex starts at Level 12 (matching user request demo: XP 4,250 / 5,000, Power 82, Speed 76, Def 74, Tech 89)
    const charProgress = {
      vex: {
        level: 12,
        xp: 4250,
        masteryLevel: 4,
        masteryXp: 1850,
        matchesPlayed: 10,
        wins: 8,
        losses: 2,
        evolutionTier: 1, // 0 = Standard, 1 = Awakened (lvl 10+), 2 = Ascended (lvl 20+)
        unlockedAbilities: ['crimson_dash', 'rift_slash', 'counter_strike', 'resonance_thrust'],
        unlockedCosmetics: ['title_rift_vanguard', 'aura_crimson_wisps'],
        unlockedSkins: ['default'],
        equippedSkin: 'default',
        equippedAura: 'aura_crimson_wisps',
        challenges: CHARACTERS.vex.masteryChallenges.map(c => ({ ...c }))
      },
      solaris: {
        level: 8,
        xp: 2400,
        masteryLevel: 3,
        masteryXp: 950,
        matchesPlayed: 2,
        wins: 1,
        losses: 1,
        evolutionTier: 0,
        unlockedAbilities: ['solar_shockwave', 'meteor_charge', 'titans_aegis'],
        unlockedCosmetics: ['title_radiant_juggernaut'],
        unlockedSkins: ['default'],
        equippedSkin: 'default',
        equippedAura: 'default',
        challenges: CHARACTERS.solaris.masteryChallenges.map(c => ({ ...c }))
      },
      lyra: {
        level: 7,
        xp: 1950,
        masteryLevel: 2,
        masteryXp: 820,
        matchesPlayed: 3,
        wins: 2,
        losses: 1,
        evolutionTier: 0,
        unlockedAbilities: ['shadowstep', 'petal_tempest', 'mirage_flash'],
        unlockedCosmetics: ['title_phase_phantom'],
        unlockedSkins: ['default'],
        equippedSkin: 'default',
        equippedAura: 'default',
        challenges: CHARACTERS.lyra.masteryChallenges.map(c => ({ ...c }))
      },
      aeron: {
        level: 6,
        xp: 1350,
        masteryLevel: 2,
        masteryXp: 540,
        matchesPlayed: 1,
        wins: 1,
        losses: 0,
        evolutionTier: 0,
        unlockedAbilities: ['kinetic_sphere', 'vaulting_tempest'],
        unlockedCosmetics: ['title_sky_sentinel'],
        unlockedSkins: ['default'],
        equippedSkin: 'default',
        equippedAura: 'default',
        challenges: CHARACTERS.aeron.masteryChallenges.map(c => ({ ...c }))
      },
      kairo: {
        level: 5,
        xp: 980,
        masteryLevel: 2,
        masteryXp: 410,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        evolutionTier: 0,
        unlockedAbilities: ['chain_harpoon', 'venom_whirl'],
        unlockedCosmetics: ['title_emerald_scourge'],
        unlockedSkins: ['default'],
        equippedSkin: 'default',
        equippedAura: 'default',
        challenges: CHARACTERS.kairo.masteryChallenges.map(c => ({ ...c }))
      },
      nox: {
        level: 4,
        xp: 750,
        masteryLevel: 1,
        masteryXp: 290,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        evolutionTier: 0,
        unlockedAbilities: ['void_crescent', 'dark_rift_trap'],
        unlockedCosmetics: [],
        unlockedSkins: ['default'],
        equippedSkin: 'default',
        equippedAura: 'default',
        challenges: CHARACTERS.nox.masteryChallenges.map(c => ({ ...c }))
      }
    };

    return {
      profile: {
        username: 'RiftOperative',
        title: 'The Rift Vanguard',
        badge: 'Crest of Genesis',
        clanTag: 'RIFT',
        mainCharacter: 'vex',
        accountLevel: 3,
        accountXp: 450,
        shards: 1400,
        corePrisms: 60,
        storyChapterUnlocked: 1,
        wins: 12,
        losses: 4,
        totalMatches: 16,
        winStreak: 3,
        highestWinStreak: 5,
        highestCombo: 8
      },
      ranked: {
        tier: 'Silver',
        division: 'I',
        rp: 585, // 585 RP = Silver I (85/100 RP towards Gold III promotion)
        season: 1,
        seasonWins: 10,
        seasonLosses: 3,
        peakTier: 'Silver I',
        peakRp: 585
      },
      characters: charProgress,
      inventory: {
        skins: ['vex_default', 'solaris_default', 'lyra_default', 'aeron_default', 'kairo_default', 'nox_default'],
        auras: ['aura_crimson_wisps'],
        titles: ['The Rift Vanguard', 'The Radiant Juggernaut', 'The Phase Phantom', 'The Sky Sentinel', 'The Emerald Scourge'],
        badges: ['Crest of Genesis', 'First Blood']
      },
      riftPass: {
        season: 'Season 1: Genesis',
        tier: 5,
        xp: 320,
        isPremium: false,
        claimedRewards: [1, 2, 3, 4]
      },
      matchHistory: [
        { id: 'm1', hero: 'vex', opponent: 'solaris', result: 'VICTORY', mode: 'Ranked', rpChange: '+24 RP', roundScore: '2-0', duration: '58s', timestamp: Date.now() - 3600000 },
        { id: 'm2', hero: 'lyra', opponent: 'kairo', result: 'VICTORY', mode: 'Casual', rpChange: '0 RP (Casual)', roundScore: '2-1', duration: '44s', timestamp: Date.now() - 7200000 },
        { id: 'm3', hero: 'vex', opponent: 'nox', result: 'DEFEAT', mode: 'Ranked', rpChange: '-14 RP', roundScore: '1-2', duration: '72s', timestamp: Date.now() - 10800000 },
        { id: 'm4', hero: 'solaris', opponent: 'aeron', result: 'VICTORY', mode: 'Ranked', rpChange: '+26 RP', roundScore: '2-0', duration: '52s', timestamp: Date.now() - 14400000 }
      ],
      story: {
        unlockedChapter: 1,
        activeChapter: 1,
        activeStage: 1,
        chapterProgress: {
          1: { completed: false, currentStage: 1, stars: 0, highCombo: 0 },
          2: { completed: false, currentStage: 1, stars: 0, highCombo: 0 },
          3: { completed: false, currentStage: 1, stars: 0, highCombo: 0 },
          4: { completed: false, currentStage: 1, stars: 0, highCombo: 0 },
          5: { completed: false, currentStage: 1, stars: 0, highCombo: 0 }
        },
        unlockedCodexLogs: ['log_1']
      }
    };
  }

  loadData() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          return JSON.parse(raw);
        }
      }
    } catch (e) {
      console.warn('Failed to load save data, resetting:', e);
    }
    const def = this.getDefaultData();
    this.saveData(def);
    return def;
  }

  saveData(data = this.data) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  ensureCharacterProgressionIntegrity() {
    if (!this.data.profile) this.data.profile = this.getDefaultData().profile;
    if (this.data.profile.winStreak === undefined) this.data.profile.winStreak = 3;
    if (this.data.profile.highestWinStreak === undefined) this.data.profile.highestWinStreak = 5;
    if (!this.data.profile.clanTag) this.data.profile.clanTag = 'RIFT';
    if (!this.data.profile.mainCharacter) this.data.profile.mainCharacter = 'vex';

    if (!this.data.ranked) this.data.ranked = this.getDefaultData().ranked;
    if (this.data.ranked.rp === undefined) this.data.ranked.rp = 585;
    if (this.data.ranked.seasonWins === undefined) this.data.ranked.seasonWins = 10;
    if (this.data.ranked.seasonLosses === undefined) this.data.ranked.seasonLosses = 3;
    if (!this.data.ranked.peakTier) this.data.ranked.peakTier = 'Silver I';
    if (!this.data.ranked.peakRp) this.data.ranked.peakRp = 585;

    // Refresh rank tier / division to match current rp
    const currentRank = CompetitiveRankEngine.getRankFromRp(this.data.ranked.rp);
    this.data.ranked.tier = currentRank.tier;
    this.data.ranked.division = currentRank.division;

    if (!this.data.characters) this.data.characters = {};
    const def = this.getDefaultData().characters;
    for (const charId in CHARACTERS) {
      if (!this.data.characters[charId]) {
        this.data.characters[charId] = def[charId] || {
          level: 1,
          xp: 0,
          masteryLevel: 1,
          masteryXp: 0,
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          evolutionTier: 0,
          unlockedAbilities: [],
          unlockedCosmetics: [],
          unlockedSkins: ['default'],
          equippedSkin: 'default',
          equippedAura: 'default',
          challenges: (CHARACTERS[charId].masteryChallenges || []).map(c => ({ ...c }))
        };
      }
      // Ensure arrays, match counts and challenges are intact
      const c = this.data.characters[charId];
      if (c.matchesPlayed === undefined) c.matchesPlayed = def[charId]?.matchesPlayed || 0;
      if (c.wins === undefined) c.wins = def[charId]?.wins || 0;
      if (c.losses === undefined) c.losses = def[charId]?.losses || 0;
      if (!c.unlockedAbilities) c.unlockedAbilities = [];
      if (!c.unlockedCosmetics) c.unlockedCosmetics = [];
      if (!c.challenges || c.challenges.length === 0) {
        c.challenges = (CHARACTERS[charId].masteryChallenges || []).map(ch => ({ ...ch }));
      }
    }

    // Ensure story mode state integrity
    if (!this.data.story) {
      this.data.story = this.getDefaultData().story;
    }
    if (!this.data.story.chapterProgress) {
      this.data.story.chapterProgress = this.getDefaultData().story.chapterProgress;
    }
    if (!this.data.story.unlockedCodexLogs) {
      this.data.story.unlockedCodexLogs = ['log_1'];
    }

    this.saveData();
  }

  // --- STAT RATINGS CALCULATION (CONTROLLED, BALANCED & NON-PAY-TO-WIN) ---
  getCalculatedRatings(charId) {
    const char = CHARACTERS[charId] || CHARACTERS.vex;
    const prog = this.data.characters[charId] || { level: 1 };
    const level = prog.level || 1;
    const lvlDelta = Math.max(0, level - 1);

    const baseRatings = char.ratings || { power: 75, speed: 75, defense: 75, technique: 75 };

    if (charId === 'vex') {
      // Vex at level 12 matches user example: Power 82, Speed 76, Defense 74, Technique 89
      return {
        power: Math.round(baseRatings.power + lvlDelta * 0.55),     // 76 + 6 = 82
        speed: Math.round(baseRatings.speed + lvlDelta * 0.18),     // 74 + 2 = 76
        defense: Math.round(baseRatings.defense + lvlDelta * 0.18), // 72 + 2 = 74
        technique: Math.round(baseRatings.technique + lvlDelta * 1.55) // 72 + 17 = 89
      };
    }

    if (charId === 'solaris') {
      return {
        power: Math.round(baseRatings.power + lvlDelta * 0.45),
        speed: Math.round(baseRatings.speed + lvlDelta * 0.10),
        defense: Math.round(baseRatings.defense + lvlDelta * 0.50),
        technique: Math.round(baseRatings.technique + lvlDelta * 0.35)
      };
    }

    if (charId === 'lyra') {
      return {
        power: Math.round(baseRatings.power + lvlDelta * 0.35),
        speed: Math.round(baseRatings.speed + lvlDelta * 0.55),
        defense: Math.round(baseRatings.defense + lvlDelta * 0.12),
        technique: Math.round(baseRatings.technique + lvlDelta * 0.45)
      };
    }

    if (charId === 'aeron') {
      return {
        power: Math.round(baseRatings.power + lvlDelta * 0.30),
        speed: Math.round(baseRatings.speed + lvlDelta * 0.25),
        defense: Math.round(baseRatings.defense + lvlDelta * 0.40),
        technique: Math.round(baseRatings.technique + lvlDelta * 0.60)
      };
    }

    if (charId === 'kairo') {
      return {
        power: Math.round(baseRatings.power + lvlDelta * 0.45),
        speed: Math.round(baseRatings.speed + lvlDelta * 0.30),
        defense: Math.round(baseRatings.defense + lvlDelta * 0.30),
        technique: Math.round(baseRatings.technique + lvlDelta * 0.45)
      };
    }

    // Nox
    return {
      power: Math.round(baseRatings.power + lvlDelta * 0.50),
      speed: Math.round(baseRatings.speed + lvlDelta * 0.35),
      defense: Math.round(baseRatings.defense + lvlDelta * 0.20),
      technique: Math.round(baseRatings.technique + lvlDelta * 0.65)
    };
  }

  // --- XP & LEVELING ENGINE ---
  addCharacterXp(charId, amount, source = '') {
    const c = this.data.characters[charId];
    if (!c) return { leveledUp: false };

    c.xp += amount;
    let leveledUp = false;
    const unlockedMilestones = [];

    // Level up loop
    while (c.level < 25) {
      const needed = calculateXpNeeded(c.level);
      if (c.xp >= needed) {
        c.xp -= needed;
        c.level++;
        leveledUp = true;

        // Visual evolution milestones
        if (c.level >= 20) c.evolutionTier = 2;
        else if (c.level >= 10) c.evolutionTier = 1;

        // Level up rewards
        this.data.profile.shards += 150 + c.level * 25;

        // Check unlocked milestones from track
        const track = CHARACTER_PROGRESSION_TRACKS[charId] || [];
        const reached = track.filter(m => m.level === c.level);
        reached.forEach(m => {
          unlockedMilestones.push(m);
          if (m.type === 'ability' && !c.unlockedAbilities.includes(m.id)) {
            c.unlockedAbilities.push(m.id);
          } else if ((m.type === 'cosmetic' || m.type === 'evolution') && !c.unlockedCosmetics.includes(m.id)) {
            c.unlockedCosmetics.push(m.id);
          }
        });
      } else {
        break;
      }
    }

    this.saveData();

    return {
      charId,
      leveledUp,
      newLevel: c.level,
      currentXp: c.xp,
      xpNeeded: calculateXpNeeded(c.level),
      evolutionTier: c.evolutionTier,
      unlockedMilestones,
      source
    };
  }

  addMasteryXp(charId, amount) {
    const c = this.data.characters[charId];
    if (!c) return { rankUp: false };

    if (!c.masteryXp) c.masteryXp = 0;
    if (!c.masteryLevel) c.masteryLevel = 1;

    c.masteryXp += amount;
    let rankUp = false;

    while (c.masteryLevel < 10) {
      const needed = calculateMasteryXpNeeded(c.masteryLevel);
      if (c.masteryXp >= needed) {
        c.masteryXp -= needed;
        c.masteryLevel++;
        rankUp = true;
        this.data.profile.shards += 250;
      } else {
        break;
      }
    }

    this.saveData();

    return {
      rankUp,
      masteryLevel: c.masteryLevel,
      masteryXp: c.masteryXp,
      masteryXpNeeded: calculateMasteryXpNeeded(c.masteryLevel)
    };
  }

  // --- MATCH FINISH & REWARD LOOP ENGINE ---
  addMatchResult(heroId, opponentId, isWin, mode = 'Casual', maxCombo = 0, durationSec = 60, roundScore = '2-0', telemetry = {}) {
    const p = this.data.profile;
    p.totalMatches++;
    if (isWin) {
      p.wins++;
      p.winStreak = (p.winStreak || 0) + 1;
      p.highestWinStreak = Math.max(p.highestWinStreak || 0, p.winStreak);
    } else {
      p.losses++;
      p.winStreak = 0;
    }

    p.highestCombo = Math.max(p.highestCombo, maxCombo);

    // Track character-specific matches and win counters
    const charData = this.data.characters[heroId];
    const prevCharXp = charData ? charData.xp : 0;
    const prevCharLevel = charData ? charData.level : 1;
    const prevMasteryXp = charData ? charData.masteryXp : 0;
    const prevMasteryLevel = charData ? charData.masteryLevel : 1;

    if (charData) {
      charData.matchesPlayed = (charData.matchesPlayed || 0) + 1;
      if (isWin) charData.wins = (charData.wins || 0) + 1;
      else charData.losses = (charData.losses || 0) + 1;
    }

    this.evaluateMainCharacter();

    // 1. PERFORMANCE GRADE EVALUATION (S / A / B / C)
    let grade = 'B';
    const isCleanSweep = roundScore.includes('2 - 0') || roundScore.includes('2-0');
    if (isWin) {
      if (isCleanSweep && (maxCombo >= 6 || (telemetry && telemetry.p1Dodges >= 2))) {
        grade = 'S';
      } else {
        grade = 'A';
      }
    } else {
      if (roundScore.includes('1')) {
        grade = 'B';
      } else {
        grade = 'C';
      }
    }

    // 2. REWARD COMPUTATIONS (Satisfying, fair, non-pay-to-win)
    // Coins (Shards)
    const baseCoins = isWin ? 150 : 60;
    const gradeCoinsBonus = (grade === 'S') ? 60 : (grade === 'A') ? 30 : 0;
    const comboCoinsBonus = Math.min(40, Math.floor((maxCombo || 0) * 5));
    const earnedCoins = baseCoins + gradeCoinsBonus + comboCoinsBonus;

    // Account XP
    const baseAccountXp = isWin ? 320 : 130;
    const gradeXpBonus = (grade === 'S') ? 100 : (grade === 'A') ? 50 : 0;
    const comboXpBonus = Math.min(80, Math.floor((maxCombo || 0) * 10));
    const earnedAccountXp = baseAccountXp + gradeXpBonus + comboXpBonus;

    // Character XP
    const baseCharXp = isWin ? 380 : 150;
    const comboCharBonus = Math.min(100, Math.floor((maxCombo || 0) * 12));
    const earnedCharXp = baseCharXp + comboCharBonus;

    // Mastery XP
    const earnedMasteryXp = isWin ? 160 : 65;

    // Commit balances to profile
    p.accountXp += earnedAccountXp;
    p.shards += earnedCoins;

    // Account Level Up
    const acctXpNeeded = p.accountLevel * 500;
    if (p.accountXp >= acctXpNeeded) {
      p.accountLevel++;
      p.accountXp -= acctXpNeeded;
      p.shards += 200;
    }

    // Award Character and Mastery XP
    const charResult = this.addCharacterXp(heroId, earnedCharXp, isWin ? 'Match Victory' : 'Combat Sparring');
    charResult.prevXp = prevCharXp;
    charResult.prevLevel = prevCharLevel;

    const masteryResult = this.addMasteryXp(heroId, earnedMasteryXp);
    masteryResult.prevMasteryXp = prevMasteryXp;
    masteryResult.prevMasteryLevel = prevMasteryLevel;

    // 3. TRACK CHALLENGES TELEMETRY
    const fullTelemetry = {
      isWin,
      p1CharId: heroId,
      p2CharId: opponentId,
      maxCombo,
      p1Dodges: (telemetry && telemetry.p1Dodges) || 0,
      p1Specials: (telemetry && telemetry.p1Specials) || 0,
      p1Ultimates: (telemetry && telemetry.p1Ultimates) || 0,
      p1Parries: (telemetry && telemetry.p1Parries) || 0,
      p1Blocks: (telemetry && telemetry.p1Blocks) || 0,
      usedUltInMatch: (telemetry && telemetry.usedUltInMatch) || false,
      finishedWithUlt: (telemetry && telemetry.finishedWithUlt) || false
    };

    const challengeUpdates = this.challengeManager.trackMatch(fullTelemetry);

    // Update Hero Mastery specifics
    this.updateMastery(heroId, `${heroId}_m1`, 3);
    if (maxCombo >= 6) this.updateMastery(heroId, `${heroId}_m3`, 1);
    if (isWin) this.updateMastery(heroId, `${heroId}_m5`, 1);

    // 4. NON-PAY-TO-WIN COSMETIC ITEM DROPS (Titles, Badges, Emotes, Victory Effects)
    const cosmeticDrops = [];
    const droppedItem = this.rollCosmeticDrop(isWin, grade);
    if (droppedItem) {
      cosmeticDrops.push(droppedItem);
    }

    // 5. COMPETITIVE RANKED RP CALCULATION
    let rpChangeText = '0 RP (Casual)';
    let rankedOutcome = null;

    if (mode === 'Ranked') {
      const r = this.data.ranked;
      const oldRank = CompetitiveRankEngine.getRankFromRp(r.rp);
      const deltaCalc = CompetitiveRankEngine.calculateRpDelta(isWin, r.rp, p.winStreak, maxCombo, roundScore);

      r.rp = Math.max(0, r.rp + deltaCalc.delta);
      const newRank = CompetitiveRankEngine.getRankFromRp(r.rp);
      r.tier = newRank.tier;
      r.division = newRank.division;

      if (isWin) r.seasonWins = (r.seasonWins || 0) + 1;
      else r.seasonLosses = (r.seasonLosses || 0) + 1;

      if (CompetitiveRankEngine.isHigherRank(newRank.formattedName, r.peakTier)) {
        r.peakTier = newRank.formattedName;
        r.peakRp = r.rp;
      }

      const isPromotion = CompetitiveRankEngine.isHigherRank(newRank.formattedName, oldRank.formattedName) && (newRank.formattedName !== oldRank.formattedName);
      const isDemotion = !isWin && (newRank.formattedName !== oldRank.formattedName);

      rpChangeText = (deltaCalc.delta >= 0 ? `+${deltaCalc.delta}` : `${deltaCalc.delta}`) + ' RP';

      rankedOutcome = {
        oldRank,
        newRank,
        deltaCalc,
        isPromotion,
        isDemotion
      };
    }

    // Rift Pass Progression
    this.data.riftPass.xp += Math.round(earnedCharXp * 0.75);
    if (this.data.riftPass.xp >= 500 && this.data.riftPass.tier < 30) {
      this.data.riftPass.tier++;
      this.data.riftPass.xp -= 500;
    }

    // Match history
    this.data.matchHistory.unshift({
      id: 'm_' + Date.now(),
      hero: heroId,
      opponent: opponentId,
      result: isWin ? 'VICTORY' : 'DEFEAT',
      grade,
      mode,
      rpChange: rpChangeText,
      roundScore,
      duration: `${durationSec}s`,
      timestamp: Date.now()
    });
    if (this.data.matchHistory.length > 25) this.data.matchHistory.pop();

    this.saveData();

    return {
      isWin,
      grade,
      earnedCoins,
      earnedAccountXp,
      earnedCharXp,
      earnedMasteryXp,
      earnedXp: earnedCharXp, // backward compatibility
      earnedShards: earnedCoins, // backward compatibility
      rpChangeText,
      charResult,
      masteryResult,
      cosmeticDrops,
      challengeUpdates,
      rankedOutcome,
      prevCharXp,
      prevMasteryXp
    };
  }

  // Roll cosmetic item reward drop
  rollCosmeticDrop(isWin, grade) {
    if (!this.challengeManager) return null;
    const inv = this.data.inventory;
    const allCategories = [
      { key: 'titles', type: 'title' },
      { key: 'badges', type: 'badge' },
      { key: 'emotes', type: 'emote' },
      { key: 'victoryEffects', type: 'victoryEffect' }
    ];

    const unowned = [];
    allCategories.forEach(cat => {
      const catalog = COSMETIC_REWARDS_CATALOG[cat.key] || [];
      const owned = inv[cat.key] || [];
      catalog.forEach(item => {
        if (!owned.includes(item.id)) {
          unowned.push({ ...item, itemType: cat.type });
        }
      });
    });

    if (unowned.length === 0) return null;

    // Drop chance: 100% on S-grade win, 50% on A-grade win, 20% on any win
    const roll = Math.random();
    const threshold = (grade === 'S') ? 0.90 : (grade === 'A') ? 0.50 : (isWin ? 0.25 : 0.05);

    if (roll <= threshold) {
      const picked = unowned[Math.floor(Math.random() * unowned.length)];
      this.challengeManager.grantCosmeticItem(picked.id, picked.itemType);
      return picked;
    }
    return null;
  }

  getChallenges() {
    return this.challengeManager ? this.data.challenges : { daily: [], weekly: [] };
  }

  claimChallenge(challengeId) {
    return this.challengeManager ? this.challengeManager.claimChallenge(challengeId) : null;
  }

  equipCosmetic(type, itemId) {
    return this.challengeManager ? this.challengeManager.equipCosmetic(type, itemId) : false;
  }

  // --- STORY MODE STAGE & CHAPTER PROGRESSION ---
  completeStoryStage(chapterId, stageIndex, heroId = 'vex', isVictory = true, maxCombo = 0) {
    if (!this.data.story) {
      this.data.story = this.getDefaultData().story;
    }
    const story = this.data.story;
    if (!story.chapterProgress[chapterId]) {
      story.chapterProgress[chapterId] = { completed: false, currentStage: 1, stars: 0, highCombo: 0 };
    }
    const cProg = story.chapterProgress[chapterId];
    cProg.highCombo = Math.max(cProg.highCombo || 0, maxCombo);

    const chapter = STORY_CHAPTERS.find(c => c.id === chapterId);
    if (!chapter) return null;

    const stage = chapter.stages ? chapter.stages.find(s => s.stageIndex === stageIndex) : null;
    const isBoss = stage ? stage.isBoss : (stageIndex === 3);

    // Compute stage rewards
    const stageXp = isBoss ? chapter.rewards.charXp : Math.round(chapter.rewards.charXp * 0.4);
    const stageMastery = isBoss ? chapter.rewards.masteryXp : Math.round(chapter.rewards.masteryXp * 0.4);
    const stageShards = isBoss ? chapter.rewards.shards : Math.round(chapter.rewards.shards * 0.35);

    let chapterCompletedNow = false;
    let unlockedNewChapter = false;

    if (isVictory) {
      this.data.profile.shards += stageShards;

      // Advance stage
      if (stageIndex >= (chapter.stages ? chapter.stages.length : 3)) {
        // Boss defeated! Chapter completed!
        cProg.completed = true;
        cProg.currentStage = (chapter.stages ? chapter.stages.length : 3);
        cProg.stars = Math.max(cProg.stars || 0, maxCombo >= 6 ? 3 : maxCombo >= 3 ? 2 : 1);
        chapterCompletedNow = true;

        // Core prisms
        this.data.profile.corePrisms += (chapter.rewards.prisms || 20);

        // Unlock next chapter
        if (chapterId < 5 && story.unlockedChapter <= chapterId) {
          story.unlockedChapter = chapterId + 1;
          unlockedNewChapter = true;
        }

        // Unlock codex log
        if (chapter.codexLog && !story.unlockedCodexLogs.includes(chapter.codexLog.id)) {
          story.unlockedCodexLogs.push(chapter.codexLog.id);
        }

        // Award title to inventory
        if (chapter.rewards.title && !this.data.inventory.titles.includes(chapter.rewards.title)) {
          this.data.inventory.titles.push(chapter.rewards.title);
        }

        // Award badge
        if (chapter.rewards.badge && !this.data.inventory.badges.includes(chapter.rewards.badge)) {
          this.data.inventory.badges.push(chapter.rewards.badge);
        }
      } else {
        // Advance to next stage in chapter
        cProg.currentStage = Math.max(cProg.currentStage, stageIndex + 1);
      }
    }

    const charResult = this.addCharacterXp(heroId, stageXp, `Story: Chapter ${chapterId} Stage ${stageIndex}`);
    const masteryResult = this.addMasteryXp(heroId, stageMastery);

    this.saveData();

    return {
      chapterId,
      stageIndex,
      isBoss,
      isVictory,
      earnedXp: stageXp,
      earnedMasteryXp: stageMastery,
      earnedShards: stageShards,
      earnedPrisms: (isVictory && isBoss) ? (chapter.rewards.prisms || 20) : 0,
      chapterCompletedNow,
      unlockedNewChapter,
      unlockedNextChapterId: story.unlockedChapter,
      chapterTitle: chapter.title,
      rewardTitle: chapter.rewards.title,
      charResult,
      masteryResult
    };
  }

  isChapterUnlocked(chapterId) {
    if (!this.data.story) return chapterId === 1;
    return chapterId <= (this.data.story.unlockedChapter || 1);
  }

  isChapterCompleted(chapterId) {
    if (!this.data.story || !this.data.story.chapterProgress) return false;
    return !!(this.data.story.chapterProgress[chapterId] && this.data.story.chapterProgress[chapterId].completed);
  }

  getChapterStage(chapterId) {
    if (!this.data.story || !this.data.story.chapterProgress) return 1;
    const cp = this.data.story.chapterProgress[chapterId];
    return cp ? (cp.currentStage || 1) : 1;
  }

  getChapterStars(chapterId) {
    if (!this.data.story || !this.data.story.chapterProgress) return 0;
    const cp = this.data.story.chapterProgress[chapterId];
    return cp ? (cp.stars || 0) : 0;
  }

  isCodexLogUnlocked(logId) {
    if (!this.data.story || !this.data.story.unlockedCodexLogs) return logId === 'log_1';
    return this.data.story.unlockedCodexLogs.includes(logId);
  }

  // --- STORY FIGHT REWARD HOOK (COMPATIBILITY) ---
  addStoryFightReward(heroId, chapterId) {
    return this.completeStoryStage(chapterId, 3, heroId, true, 5);
  }

  // --- BOSS FIGHT DEFEAT REWARD HOOK ---
  addBossDefeatReward(heroId, bossId) {
    const earnedXp = 800;
    const earnedMastery = 400;
    const earnedShards = 300;

    this.data.profile.shards += earnedShards;
    const charResult = this.addCharacterXp(heroId, earnedXp, `Boss Slain: ${bossId.toUpperCase()}`);
    const masteryResult = this.addMasteryXp(heroId, earnedMastery);

    return { earnedXp, earnedMastery, earnedShards, charResult, masteryResult };
  }

  // --- CHALLENGE COMPLETION HOOK ---
  completeChallenge(charId, challengeId) {
    const charProg = this.data.characters[charId];
    if (!charProg) return null;

    const ch = (charProg.challenges || []).find(c => c.id === challengeId);
    if (!ch) return null;

    ch.current = ch.target;
    const earnedXp = 350;
    const earnedMastery = 200;
    const earnedShards = 150;

    this.data.profile.shards += earnedShards;
    const charResult = this.addCharacterXp(charId, earnedXp, `Challenge: ${ch.title}`);
    const masteryResult = this.addMasteryXp(charId, earnedMastery);

    this.saveData();
    return { ch, earnedXp, earnedMastery, earnedShards, charResult, masteryResult };
  }

  promoteRank() {
    const r = this.data.ranked;
    const curRank = CompetitiveRankEngine.getRankFromRp(r.rp);
    r.rp = Math.min(2500, r.rp + 100);
    const newRank = CompetitiveRankEngine.getRankFromRp(r.rp);
    r.tier = newRank.tier;
    r.division = newRank.division;
    if (CompetitiveRankEngine.isHigherRank(newRank.formattedName, r.peakTier)) {
      r.peakTier = newRank.formattedName;
      r.peakRp = r.rp;
    }
    this.saveData();
    return newRank;
  }

  evaluateMainCharacter() {
    let bestHero = this.data.profile.mainCharacter || 'vex';
    let maxMatches = -1;
    for (const charId in this.data.characters) {
      const c = this.data.characters[charId];
      if (c && (c.matchesPlayed || 0) > maxMatches) {
        maxMatches = c.matchesPlayed;
        bestHero = charId;
      }
    }
    this.data.profile.mainCharacter = bestHero;
  }

  setMainCharacter(charId) {
    if (CHARACTERS[charId]) {
      this.data.profile.mainCharacter = charId;
      this.saveData();
      return true;
    }
    return false;
  }

  getMainCharacter() {
    return this.data.profile.mainCharacter || 'vex';
  }

  getOverallWinRate() {
    const total = this.data.profile.totalMatches || 0;
    if (total === 0) return '0%';
    const pct = ((this.data.profile.wins || 0) / total) * 100;
    return `${pct.toFixed(1)}%`;
  }

  getCurrentRankInfo() {
    return CompetitiveRankEngine.getRankFromRp(this.data.ranked?.rp || 0);
  }

  getCharacterMasterySummary(charId) {
    const c = CHARACTERS[charId] || CHARACTERS.vex;
    const prog = this.data.characters[charId] || { level: 1, masteryLevel: 1, masteryXp: 0, matchesPlayed: 0, wins: 0, losses: 0 };
    const xpNeeded = calculateXpNeeded(prog.level || 1);
    const masteryXpNeeded = calculateMasteryXpNeeded(prog.masteryLevel || 1);
    const matches = prog.matchesPlayed || 0;
    const wins = prog.wins || 0;
    const losses = prog.losses || 0;
    const winRate = matches > 0 ? `${((wins / matches) * 100).toFixed(1)}%` : '0%';

    return {
      charId,
      name: c.name,
      role: c.role,
      core: c.core,
      coreColor: c.coreColor,
      level: prog.level || 1,
      xp: prog.xp || 0,
      xpNeeded,
      masteryLevel: prog.masteryLevel || 1,
      masteryXp: prog.masteryXp || 0,
      masteryXpNeeded,
      matchesPlayed: matches,
      wins,
      losses,
      winRate,
      evolutionTier: prog.evolutionTier || 0,
      title: this.getMasteryRankTitle(charId, prog.masteryLevel || 1),
      isMain: (this.data.profile.mainCharacter === charId)
    };
  }

  getAllCharacterMasteries() {
    const order = ['vex', 'solaris', 'lyra', 'aeron', 'kairo', 'nox'];
    return order.map(id => this.getCharacterMasterySummary(id));
  }

  performSeasonReset() {
    const result = CompetitiveRankEngine.performSeasonReset(this.data.ranked);
    this.data.ranked.season = result.newSeason;
    this.data.ranked.rp = result.newRp;
    this.data.ranked.tier = result.newRank.tier;
    this.data.ranked.division = result.newRank.division;
    this.data.ranked.seasonWins = 0;
    this.data.ranked.seasonLosses = 0;
    this.data.profile.shards += result.shardsBonus;
    this.saveData();
    return result;
  }

  updateMastery(charId, challengeId, increment = 1) {
    const charProg = this.data.characters[charId];
    if (!charProg || !charProg.challenges) return;

    const ch = charProg.challenges.find(c => c.id === challengeId);
    if (ch && ch.current < ch.target) {
      ch.current = Math.min(ch.target, ch.current + increment);
      if (ch.current >= ch.target) {
        this.data.profile.shards += 150;
        this.addCharacterXp(charId, 250, `Challenge Completed: ${ch.title}`);
        this.addMasteryXp(charId, 150);
      }
      this.saveData();
    }
  }

  equipSkin(charId, skinId) {
    const charProg = this.data.characters[charId];
    if (charProg && (charProg.unlockedSkins || []).includes(skinId)) {
      charProg.equippedSkin = skinId;
      this.saveData();
      return true;
    }
    return false;
  }

  equipAura(charId, auraId) {
    const charProg = this.data.characters[charId];
    if (charProg) {
      charProg.equippedAura = auraId;
      this.saveData();
      return true;
    }
    return false;
  }

  purchaseSkin(charId, skinId, cost) {
    if (this.data.profile.shards >= cost) {
      this.data.profile.shards -= cost;
      const charProg = this.data.characters[charId];
      if (charProg && !(charProg.unlockedSkins || []).includes(skinId)) {
        if (!charProg.unlockedSkins) charProg.unlockedSkins = [];
        charProg.unlockedSkins.push(skinId);
      }
      this.saveData();
      return true;
    }
    return false;
  }

  // --- QUERY & GETTER HELPERS ---
  getCharacterProgression(charId) {
    const c = this.data.characters[charId] || {
      level: 1,
      xp: 0,
      masteryLevel: 1,
      masteryXp: 0,
      evolutionTier: 0,
      unlockedAbilities: [],
      unlockedCosmetics: [],
      unlockedSkins: ['default'],
      equippedSkin: 'default',
      equippedAura: 'default',
      challenges: []
    };
    return {
      ...c,
      currentXp: c.xp,
      xpNeeded: calculateXpNeeded(c.level),
      masteryRank: c.masteryLevel || 1,
      masteryXpNeeded: calculateMasteryXpNeeded(c.masteryLevel || 1),
      title: this.getMasteryRankTitle(charId, c.masteryLevel || 1)
    };
  }

  getMasteryRankTitle(charId, rank) {
    const titles = [
      'Initiate',
      'Adept',
      'Vanguard',
      'Combatant',
      'Master',
      'Grandmaster',
      'Paragon',
      'Sovereign',
      'Transcendent',
      'Apex Legend'
    ];
    return titles[Math.min(titles.length - 1, Math.max(0, (rank || 1) - 1))];
  }

  getTrack(charId) {
    return CHARACTER_PROGRESSION_TRACKS[charId] || [];
  }

  getUnlockedAbilities(charId) {
    const lvl = this.data.characters[charId]?.level || 1;
    const track = this.getTrack(charId);
    return track.filter(m => m.type === 'ability' && m.level <= lvl);
  }

  getLockedMilestones(charId) {
    const lvl = this.data.characters[charId]?.level || 1;
    const track = this.getTrack(charId);
    return track.filter(m => m.level > lvl);
  }

  getCosmeticsTrack(charId) {
    const lvl = this.data.characters[charId]?.level || 1;
    const track = this.getTrack(charId);
    return track.filter(m => m.type === 'cosmetic' || m.type === 'evolution' || m.type === 'mastery');
  }

  getCharacterChallenges(charId) {
    return this.data.characters[charId]?.challenges || [];
  }
}

export const progressionManager = new ProgressionManager();
