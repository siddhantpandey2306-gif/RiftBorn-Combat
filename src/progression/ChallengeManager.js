// RIFTBORN Daily and Weekly Challenges Engine
// Non-pay-to-win gameplay reward loop encouraging diverse combat styles

export const COSMETIC_REWARDS_CATALOG = {
  titles: [
    { id: 'title_rift_vanguard', name: 'The Rift Vanguard', category: 'title', rarity: 'rare', icon: '⚔️', desc: 'Commanding warrior of the dimensional breach.' },
    { id: 'title_fundamentalist', name: 'The Fundamentalist', category: 'title', rarity: 'epic', icon: '🥋', desc: 'Master of neutral spacing, footsies, and clean fundamentals.' },
    { id: 'title_ghost_rift', name: 'Ghost in the Rift', category: 'title', rarity: 'epic', icon: '💨', desc: 'Untouchable evasive combatant who dances through enemy strikes.' },
    { id: 'title_apex_champion', name: 'Apex Champion', category: 'title', rarity: 'legendary', icon: '👑', desc: 'Unstoppable tournament victor who conquered the weekly gauntlet.' },
    { id: 'title_combo_virtuoso', name: 'Combo Virtuoso', category: 'title', rarity: 'epic', icon: '⚡', desc: 'Artist of relentless juggles and branching combo routes.' },
    { id: 'title_iron_bastion', name: 'Iron Bastion', category: 'title', rarity: 'rare', icon: '🛡️', desc: 'Impenetrable defensive guardian with rock-solid blocking.' }
  ],
  badges: [
    { id: 'badge_crest_genesis', name: 'Crest of Genesis', category: 'badge', rarity: 'common', icon: '✦', desc: 'Foundational emblem of the First Disjunction.' },
    { id: 'badge_first_blood', name: 'First Blood', category: 'badge', rarity: 'common', icon: '🩸', desc: 'Struck the decisive first blow in tournament combat.' },
    { id: 'badge_combo_artisan', name: 'Combo Artisan', category: 'badge', rarity: 'rare', icon: '🌪️', desc: 'Consistently executes 6+ hit multi-chain strings.' },
    { id: 'badge_versatile_duelist', name: 'Versatile Duelist', category: 'badge', rarity: 'epic', icon: '🎭', desc: 'Has vanquished opponents across multiple character archetypes.' },
    { id: 'badge_flawless_parry', name: 'Flawless Aegis', category: 'badge', rarity: 'legendary', icon: '💎', desc: 'Turned the tide of combat with microsecond parry windows.' }
  ],
  emotes: [
    { id: 'emote_katana_sheath', name: 'Katana Sheath', category: 'emote', rarity: 'rare', icon: '🗡️', motion: 'Iaido click into saya sheath with plasma spark', desc: 'Smooth, respectful weapon sheath post-duel.' },
    { id: 'emote_shield_salute', name: 'Shield Salute', category: 'emote', rarity: 'epic', icon: '🛡️', motion: 'Clashes gauntlets together releasing golden shockwave', desc: 'Honorary fighter salute acknowledging a tough match.' },
    { id: 'emote_phase_bow', name: 'Phase Bow', category: 'emote', rarity: 'rare', icon: '🌸', motion: 'Graceful phantom bow that dissipates into pink petals', desc: 'Elegant and swift bow of respect.' },
    { id: 'emote_knuckle_crack', name: 'Knuckle Crack', category: 'emote', rarity: 'rare', icon: '👊', motion: 'Heavy gauntlet crack accompanied by kinetic hum', desc: 'Intimidating pre/post fight knuckle crack.' },
    { id: 'emote_void_smirk', name: 'Void Flourish', category: 'emote', rarity: 'epic', icon: '👁️', motion: 'Levitates scythes in floating orbit with void ripple', desc: 'Mysterious, otherworldly victory flourish.' }
  ],
  victoryEffects: [
    { id: 'vfx_crimson_shockwave', name: 'Crimson Shockwave', category: 'victoryEffect', rarity: 'rare', color: '#FF3366', icon: '💥', desc: 'A colossal ground-cleaving ring of Crimson Plasma erupts on match win.' },
    { id: 'vfx_supernova_burst', name: 'Supernova Burst', category: 'victoryEffect', rarity: 'legendary', color: '#FFB800', icon: '🌟', desc: 'Blinding golden solar flares and cosmic stardust rain down upon victory.' },
    { id: 'vfx_cherry_blossom', name: 'Phantom Petal Drift', category: 'victoryEffect', rarity: 'rare', color: '#FF2E93', icon: '🌸', desc: 'A swirling vortex of ethereal neon petals envelops the winning fighter.' },
    { id: 'vfx_azure_tempest', name: 'Azure Tempest', category: 'victoryEffect', rarity: 'epic', color: '#00D2FF', icon: '⚡', desc: 'Cracking electric bolts and glowing kinetic arcs strike the arena pedestal.' },
    { id: 'vfx_crimson_singularity', name: 'Crimson Singularity', category: 'victoryEffect', rarity: 'legendary', color: '#E11D48', icon: '🕳️', desc: 'Dimensional reality tears open behind the victor, pulsing with void gravitational pull.' }
  ]
};

export class ChallengeManager {
  constructor(progressionManager) {
    this.prog = progressionManager;
    this.initChallenges();
  }

  initChallenges() {
    if (!this.prog.data.challenges) {
      this.prog.data.challenges = {
        dailyLastReset: this.getTodayDateString(),
        weeklyLastReset: this.getWeekString(),
        daily: [],
        weekly: [],
        history: []
      };
    }

    const cData = this.prog.data.challenges;
    const today = this.getTodayDateString();
    const thisWeek = this.getWeekString();

    if (cData.dailyLastReset !== today || !cData.daily || cData.daily.length === 0) {
      cData.daily = this.generateDailyChallenges();
      cData.dailyLastReset = today;
    }

    if (cData.weeklyLastReset !== thisWeek || !cData.weekly || cData.weekly.length === 0) {
      cData.weekly = this.generateWeeklyChallenges();
      cData.weeklyLastReset = thisWeek;
    }

    // Ensure inventory structures exist
    if (!this.prog.data.inventory.titles) this.prog.data.inventory.titles = ['The Rift Vanguard'];
    if (!this.prog.data.inventory.badges) this.prog.data.inventory.badges = ['badge_crest_genesis', 'badge_first_blood'];
    if (!this.prog.data.inventory.emotes) this.prog.data.inventory.emotes = ['emote_katana_sheath'];
    if (!this.prog.data.inventory.victoryEffects) this.prog.data.inventory.victoryEffects = ['vfx_crimson_shockwave'];

    if (!this.prog.data.equipped) {
      this.prog.data.equipped = {
        title: 'The Rift Vanguard',
        badge: 'badge_crest_genesis',
        emote: 'emote_katana_sheath',
        victoryEffect: 'vfx_crimson_shockwave'
      };
    }

    this.prog.saveData();
  }

  getTodayDateString() {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  }

  getWeekString() {
    const d = new Date();
    const onejan = new Date(d.getUTCFullYear(), 0, 1);
    const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7);
    return `${d.getUTCFullYear()}-W${week}`;
  }

  generateDailyChallenges() {
    return [
      {
        id: 'daily_win_2',
        type: 'match_win',
        title: 'Ascendant Victory',
        desc: 'Win 2 matches across any combat mode.',
        style: 'Victory & Execution',
        current: 0,
        target: 2,
        completed: false,
        claimed: false,
        rewards: {
          coins: 200,
          accountXp: 300,
          item: null
        }
      },
      {
        id: 'daily_dodges_10',
        type: 'perfect_dodge',
        title: 'Ghost in the Rift',
        desc: 'Perform 10 Perfect Dodges to evade incoming strikes.',
        style: 'Defensive Evasion',
        current: 0,
        target: 10,
        completed: false,
        claimed: false,
        rewards: {
          coins: 250,
          accountXp: 350,
          item: { id: 'title_ghost_rift', type: 'title', name: 'Title: "Ghost in the Rift"' }
        }
      },
      {
        id: 'daily_specials_15',
        type: 'use_special',
        title: 'Core Overclock',
        desc: 'Unleash Special Abilities 15 times during combat.',
        style: 'Core Energy Routing',
        current: 0,
        target: 15,
        completed: false,
        claimed: false,
        rewards: {
          coins: 220,
          accountXp: 300,
          item: null
        }
      },
      {
        id: 'daily_combo_6',
        type: 'high_combo',
        title: 'Combo Virtuoso',
        desc: 'Land a multi-hit combo of 6 or more hits.',
        style: 'Aggressive Pressure',
        current: 0,
        target: 1,
        completed: false,
        claimed: false,
        rewards: {
          coins: 180,
          accountXp: 250,
          item: { id: 'badge_combo_artisan', type: 'badge', name: 'Badge: "Combo Artisan"' }
        }
      },
      {
        id: 'daily_no_ult_win',
        type: 'no_ult_win',
        title: 'Pure Fundamentals',
        desc: 'Win a match without activating your Ultimate.',
        style: 'Fundamental Neutral Spacing',
        current: 0,
        target: 1,
        completed: false,
        claimed: false,
        rewards: {
          coins: 260,
          accountXp: 400,
          item: { id: 'title_fundamentalist', type: 'title', name: 'Title: "The Fundamentalist"' }
        }
      }
    ];
  }

  generateWeeklyChallenges() {
    return [
      {
        id: 'weekly_win_10',
        type: 'match_win',
        title: 'Champion\'s Gauntlet',
        desc: 'Win 10 matches in Casual or Ranked combat.',
        style: 'Dedication & Competitive Prowess',
        current: 0,
        target: 10,
        completed: false,
        claimed: false,
        rewards: {
          coins: 1000,
          accountXp: 1200,
          item: { id: 'title_apex_champion', type: 'title', name: 'Title: "Apex Champion"' }
        }
      },
      {
        id: 'weekly_defeat_archetypes',
        type: 'defeat_unique_char',
        title: 'Dimensional Chameleon',
        desc: 'Defeat 3 different character archetypes in sparring.',
        style: 'Matchup Versatility',
        current: 0,
        target: 3,
        defeatedCharIds: [],
        completed: false,
        claimed: false,
        rewards: {
          coins: 850,
          accountXp: 900,
          item: { id: 'badge_versatile_duelist', type: 'badge', name: 'Badge: "Versatile Duelist"' }
        }
      },
      {
        id: 'weekly_runs_5',
        type: 'complete_run',
        title: 'Trial by Combat',
        desc: 'Complete 5 combat runs across Story or Arcade sparring.',
        style: 'Endurance & Tenacity',
        current: 0,
        target: 5,
        completed: false,
        claimed: false,
        rewards: {
          coins: 1200,
          accountXp: 1500,
          item: { id: 'vfx_supernova_burst', type: 'victoryEffect', name: 'Victory FX: "Supernova Burst"' }
        }
      },
      {
        id: 'weekly_parries_25',
        type: 'block_parry',
        title: 'Impenetrable Bastion',
        desc: 'Execute 25 Parries or defensive blocks against opponent strikes.',
        style: 'Patient Defense & Guard Discipline',
        current: 0,
        target: 25,
        completed: false,
        claimed: false,
        rewards: {
          coins: 750,
          accountXp: 800,
          item: { id: 'emote_shield_salute', type: 'emote', name: 'Emote: "Shield Salute"' }
        }
      },
      {
        id: 'weekly_ult_finishes',
        type: 'finish_with_ult',
        title: 'Executioner\'s Zenith',
        desc: 'Deliver the final match-winning KO blow using an Ultimate 3 times.',
        style: 'Meter Economy & Clutch Execution',
        current: 0,
        target: 3,
        completed: false,
        claimed: false,
        rewards: {
          coins: 950,
          accountXp: 1100,
          item: { id: 'vfx_crimson_singularity', type: 'victoryEffect', name: 'Victory FX: "Crimson Singularity"' }
        }
      }
    ];
  }

  // Hook called after every completed match
  trackMatch(matchTelemetry) {
    const cData = this.prog.data.challenges;
    if (!cData) return [];

    const updated = [];
    const allChallenges = [...(cData.daily || []), ...(cData.weekly || [])];

    const {
      isWin,
      p1CharId,
      p2CharId,
      maxCombo,
      p1Dodges,
      p1Specials,
      p1Ultimates,
      p1Parries,
      p1Blocks,
      usedUltInMatch,
      finishedWithUlt
    } = matchTelemetry;

    allChallenges.forEach(ch => {
      if (ch.completed) return;
      let prevVal = ch.current;
      let delta = 0;

      switch (ch.type) {
        case 'match_win':
          if (isWin) delta = 1;
          break;
        case 'perfect_dodge':
          delta = p1Dodges || 0;
          break;
        case 'use_special':
          delta = p1Specials || 0;
          break;
        case 'high_combo':
          if ((maxCombo || 0) >= 6) delta = 1;
          break;
        case 'no_ult_win':
          if (isWin && !usedUltInMatch) delta = 1;
          break;
        case 'defeat_unique_char':
          if (isWin && p2CharId) {
            ch.defeatedCharIds = ch.defeatedCharIds || [];
            if (!ch.defeatedCharIds.includes(p2CharId)) {
              ch.defeatedCharIds.push(p2CharId);
              delta = 1;
            }
          }
          break;
        case 'complete_run':
          delta = 1;
          break;
        case 'block_parry':
          delta = (p1Blocks || 0) + (p1Parries || 0);
          break;
        case 'finish_with_ult':
          if (isWin && finishedWithUlt) delta = 1;
          break;
      }

      if (delta > 0) {
        ch.current = Math.min(ch.target, ch.current + delta);
        const justCompleted = (ch.current >= ch.target && !ch.completed);
        if (justCompleted) {
          ch.completed = true;
        }

        updated.push({
          id: ch.id,
          title: ch.title,
          type: ch.type,
          current: ch.current,
          target: ch.target,
          delta,
          justCompleted,
          rewards: ch.rewards
        });
      }
    });

    this.prog.saveData();
    return updated;
  }

  claimChallenge(challengeId) {
    const cData = this.prog.data.challenges;
    const all = [...(cData.daily || []), ...(cData.weekly || [])];
    const ch = all.find(c => c.id === challengeId);

    if (!ch || !ch.completed || ch.claimed) return null;

    ch.claimed = true;
    const r = ch.rewards;

    // Grant coins & XP
    this.prog.data.profile.shards += (r.coins || 0);
    this.prog.data.profile.accountXp += (r.accountXp || 0);

    // Grant item if present
    let grantedItem = null;
    if (r.item) {
      grantedItem = this.grantCosmeticItem(r.item.id, r.item.type);
    }

    this.prog.saveData();

    return {
      challengeId,
      title: ch.title,
      coins: r.coins,
      accountXp: r.accountXp,
      item: grantedItem || r.item
    };
  }

  grantCosmeticItem(itemId, itemType) {
    const inv = this.prog.data.inventory;
    let catalogList = [];

    switch (itemType) {
      case 'title':
        inv.titles = inv.titles || [];
        if (!inv.titles.includes(itemId)) inv.titles.push(itemId);
        catalogList = COSMETIC_REWARDS_CATALOG.titles;
        break;
      case 'badge':
        inv.badges = inv.badges || [];
        if (!inv.badges.includes(itemId)) inv.badges.push(itemId);
        catalogList = COSMETIC_REWARDS_CATALOG.badges;
        break;
      case 'emote':
        inv.emotes = inv.emotes || [];
        if (!inv.emotes.includes(itemId)) inv.emotes.push(itemId);
        catalogList = COSMETIC_REWARDS_CATALOG.emotes;
        break;
      case 'victoryEffect':
        inv.victoryEffects = inv.victoryEffects || [];
        if (!inv.victoryEffects.includes(itemId)) inv.victoryEffects.push(itemId);
        catalogList = COSMETIC_REWARDS_CATALOG.victoryEffects;
        break;
    }

    this.prog.saveData();
    return catalogList.find(c => c.id === itemId) || { id: itemId, type: itemType, name: itemId };
  }

  equipCosmetic(type, itemId) {
    if (!this.prog.data.equipped) {
      this.prog.data.equipped = {};
    }
    this.prog.data.equipped[type] = itemId;
    if (type === 'title') {
      this.prog.data.profile.title = itemId;
    }
    if (type === 'badge') {
      const bObj = COSMETIC_REWARDS_CATALOG.badges.find(b => b.id === itemId);
      if (bObj) this.prog.data.profile.badge = bObj.name;
    }
    this.prog.saveData();
    return true;
  }

  getTimeUntilDailyReset() {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
    const diffMs = tomorrow - now;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  }

  getTimeUntilWeeklyReset() {
    const now = new Date();
    const day = now.getUTCDay(); // 0 is Sunday
    const daysUntilNextMonday = ((7 - day + 1) % 7) || 7;
    const nextMonday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilNextMonday, 0, 0, 0));
    const diffMs = nextMonday - now;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h`;
  }
}
