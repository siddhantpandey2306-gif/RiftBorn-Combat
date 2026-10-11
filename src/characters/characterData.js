// RIFTBORN Character Database
// 6 Original Characters with unique silhouettes, lore, frame data, combat styles, and progression

export const CHARACTERS = {
  vex: {
    id: 'vex',
    name: 'VEX',
    title: 'The Rift Vanguard',
    core: 'Crimson',
    coreColor: '#D93636',
    coreColorSecondary: '#E55A5A',
    coreColorDark: '#7A1818',
    role: 'Balanced',
    weapon: 'Energy Katana ("Calamity Edge")',
    weaponType: 'katana',
    personality: 'Fearless leader',
    lore: 'Former commander of the Vanguard Coalition. When the First Rift tore open the stratosphere, Vex fused his cybernetic chassis with raw Crimson Plasma. He leads the resistance against Void incursions with unmatched discipline and blazing blade strikes.',
    quote: '"The Rift will bend to our blade, not break our spirit."',
    
    // Base Stats (Level 1)
    baseStats: {
      hp: 1000,
      atk: 100,
      def: 80,
      speed: 7.2,
      coreRate: 1.0,
      critChance: 0.12,
      jumpForce: 14.5
    },

    // Combat Identity & Ratings
    difficulty: 'Moderate (★★☆☆☆)',
    difficultyStars: 2,
    ratings: {
      power: 76,
      speed: 74,
      defense: 72,
      technique: 72
    },
    strengths: [
      'Versatile combo branching & cancel trees',
      'Fast forward thrust gap-closer (Crimson Dash)',
      'Balanced frame data with solid defensive recovery'
    ],
    weaknesses: [
      'Lacks super armor or full-screen projectile tools',
      'Requires clean close-range fundamentals to open opponents'
    ],

    // Silhouette & Visual Properties
    visual: {
      height: 110,
      width: 44,
      bodyType: 'athletic',
      hairColor: '#FFFFFF',
      armorColor: '#1E2337',
      trimColor: '#FF3366',
      scarfColor: '#E60049',
      stance: 'iaido',
      stanceName: 'Iaido Crimson Stance',
      stanceDesc: 'Low-center draw posture with Calamity Edge katana sheathed at the hip. Calculates frame advantages before exploding into supersonic iai-slashes and dimensional thrusts.',
      coreElement: 'Crimson Plasma Core'
    },

    // Special moves
    abilities: [
      {
        id: 'crimson_dash',
        name: 'Crimson Dash',
        key: 'U / E (Special 1)',
        type: 'Gap Closer / Piercing Thrust',
        cost: 25,
        cooldown: 3.5,
        damage: 130,
        description: 'Vex surges forward at supersonic speed, piercing through enemy defenses with a plasma-infused thrust that staggers.'
      },
      {
        id: 'rift_slash',
        name: 'Rift Slash',
        key: 'I / Q (Special 2)',
        type: 'Rising Launcher / Anti-Air',
        cost: 30,
        cooldown: 5.0,
        damage: 155,
        description: 'A soaring dimensional energy slash that vaults Vex into the air and launches the target for juggle combos.'
      },
      {
        id: 'rift_breaker',
        name: 'Rift Breaker Ultimate',
        key: 'O / R (Ultimate)',
        type: 'Cinematic Ultimate',
        cost: 100,
        cooldown: 0,
        damage: 420,
        description: 'Vex unleashes maximum Crimson Core output, rending the fabric of reality with a screen-cleaving multi-hit dimensional execution.'
      }
    ],

    passive: {
      name: 'Unyielding Will',
      description: 'When HP falls below 35%, Core Energy gain increases by 40% and light attacks gain stagger resistance.'
    },

    skins: [
      { id: 'default', name: 'Vanguard Prime', rarity: 'Common', unlocked: true, color: '#FF3366' },
      { id: 'cyber_ronin', name: 'Cyber Ronin', rarity: 'Rare', unlocked: false, cost: 800, color: '#FF5E00' },
      { id: 'crimson_eclipse', name: 'Crimson Eclipse', rarity: 'Epic', unlocked: false, cost: 1800, color: '#D90429' },
      { id: 'obsidian_warlord', name: 'Obsidian Warlord', rarity: 'Legendary', unlocked: false, cost: 3500, color: '#9D0208' }
    ],

    masteryChallenges: [
      { id: 'vex_m1', title: 'Blade Initiate', desc: 'Land 30 Light Combo finishers with Vex', target: 30, current: 0, reward: '100 Shards' },
      { id: 'vex_m2', title: 'Crimson Surge', desc: 'Perform 15 Crimson Piercers', target: 15, current: 0, reward: 'Vanguard Badge' },
      { id: 'vex_m3', title: 'Aerial Dominance', desc: 'Land 10 air juggle hits', target: 10, current: 0, reward: 'Title: "Edge of Dawn"' },
      { id: 'vex_m4', title: 'Nova Overdrive', desc: 'Execute 5 Crimson Nova Blade Ultimates', target: 5, current: 0, reward: 'Cyber Ronin Skin' },
      { id: 'vex_m5', title: 'Flawless Vanguard', desc: 'Win 3 matches without losing a round', target: 3, current: 0, reward: 'Golden Edge Effect' }
    ]
  },

  solaris: {
    id: 'solaris',
    name: 'SOLARIS',
    title: 'The Radiant Juggernaut',
    core: 'Gold',
    coreColor: '#C89428',
    coreColorSecondary: '#D9A741',
    coreColorDark: '#6B4F12',
    role: 'Heavy',
    weapon: 'Energy Gauntlets ("Aethel Fists")',
    weaponType: 'gauntlets',
    personality: 'Confident powerhouse',
    lore: 'Hailing from the high-orbit solar forges of Helios Zenith, Solaris wears the heaviest kinetic exoclad armor ever forged. Powered by the Golden Core, he treats every battle as an arena spectacle, laughing in the face of incoming artillery.',
    quote: '"Stand firm or be incinerated. Your choice."',

    baseStats: {
      hp: 1250,
      atk: 125,
      def: 110,
      speed: 5.6,
      coreRate: 0.9,
      critChance: 0.08,
      jumpForce: 13.0
    },

    // Combat Identity & Ratings
    difficulty: 'Accessible (★☆☆☆☆)',
    difficultyStars: 1,
    ratings: {
      power: 96,
      speed: 42,
      defense: 95,
      technique: 52
    },
    strengths: [
      'Unstoppable Super Armor absorbs hits on heavy attacks without flinching',
      'Highest single-hit damage and maximum vitality pool (1,250 HP)',
      'Devastating ground pound shockwaves and armored rush tackle'
    ],
    weaknesses: [
      'Slow movement and sluggish recovery on whiffed heavies',
      'Large physical hurtbox vulnerable to ranged zoning and chip pokes'
    ],

    visual: {
      height: 122,
      width: 54,
      bodyType: 'bulky',
      hairColor: '#F59E0B',
      armorColor: '#282218',
      trimColor: '#FFB800',
      scarfColor: '#FBBF24',
      stance: 'brawler',
      stanceName: 'Solar Brawler Stance',
      stanceDesc: 'Unshakable heavyweight boxing guard with smoldering Aethel Gauntlets raised. Kinetic shock absorbers channel super armor on heavy impact.',
      coreElement: 'Radiant Gold Kinetic Core'
    },

    abilities: [
      {
        id: 'solar_shockwave',
        name: 'Solar Shockwave',
        key: 'E (Special 1)',
        type: 'Ground Pound / Area Denial',
        cost: 25,
        cooldown: 5.5,
        damage: 145,
        description: 'Solaris smashes both fists into the ground, erupting a golden kinetic shockwave that sweeps across the arena floor.'
      },
      {
        id: 'meteor_charge',
        name: 'Meteor Charge',
        key: 'Q (Special 2)',
        type: 'Super Armor Rush',
        cost: 35,
        cooldown: 7.0,
        damage: 170,
        description: 'An unstoppable armored charge that ignores light attacks, slamming the target against the arena boundary.'
      },
      {
        id: 'solar_cataclysm',
        name: 'SOLAR CATACLYSM',
        key: 'R (Ultimate)',
        type: 'Cinematic Ultimate',
        cost: 100,
        cooldown: 0,
        damage: 460,
        description: 'Solaris gathers the fury of a miniature star within his gauntlets, vaulting into the stratosphere before crashing down with world-shattering force.'
      }
    ],

    passive: {
      name: 'Aegis Plating',
      description: 'Heavy attacks possess super armor during active frames, absorbing one incoming hit without staggering.'
    },

    skins: [
      { id: 'default', name: 'Helios Guard', rarity: 'Common', unlocked: true, color: '#FFB800' },
      { id: 'sun_god', name: 'Sun Deity', rarity: 'Rare', unlocked: false, cost: 800, color: '#FCD34D' },
      { id: 'obsidian_titan', name: 'Obsidian Titan', rarity: 'Epic', unlocked: false, cost: 1800, color: '#451A03' },
      { id: 'deep_core_forge', name: 'Deep Core Molten', rarity: 'Legendary', unlocked: false, cost: 3500, color: '#EA580C' }
    ],

    masteryChallenges: [
      { id: 'solaris_m1', title: 'Fist of Gold', desc: 'Land 25 Heavy Attack smashes with Solaris', target: 25, current: 0, reward: '100 Shards' },
      { id: 'solaris_m2', title: 'Solar Eruption', desc: 'Hit 15 enemies with Solar Shockwave', target: 15, current: 0, reward: 'Solar Crest Badge' },
      { id: 'solaris_m3', title: 'Unstoppable Force', desc: 'Absorb 20 hits using Super Armor', target: 20, current: 0, reward: 'Title: "The Sunforged"' },
      { id: 'solaris_m4', title: 'Cataclysmic Crash', desc: 'Finish 5 rounds with Solar Cataclysm', target: 5, current: 0, reward: 'Sun Deity Skin' },
      { id: 'solaris_m5', title: 'Radiant Dominance', desc: 'Win 5 Ranked matches as Solaris', target: 5, current: 0, reward: 'Solar Halo Aura' }
    ]
  },

  lyra: {
    id: 'lyra',
    name: 'LYRA',
    title: 'The Phantom Rose',
    core: 'Rose',
    coreColor: '#D85C86',
    coreColorSecondary: '#E3789D',
    coreColorDark: '#752A44',
    role: 'Assassin',
    weapon: 'Dual Energy Blades ("Petal Shards")',
    weaponType: 'dual_daggers',
    personality: 'Fast and clever',
    lore: 'An elite operative from the Neon Undercity, Lyra was genetically augmented with Rose Temporal Quartz. She weaves between dimensions at sub-millisecond speeds, carving through opponents before they even register her presence.',
    quote: '"Blink and you miss the finale."',

    baseStats: {
      hp: 880,
      atk: 118,
      def: 65,
      speed: 8.8,
      coreRate: 1.15,
      critChance: 0.22,
      jumpForce: 15.2
    },

    // Combat Identity & Ratings
    difficulty: 'Expert (★★★★☆)',
    difficultyStars: 4,
    ratings: {
      power: 78,
      speed: 98,
      defense: 44,
      technique: 86
    },
    strengths: [
      'Blistering movement speed (8.8) and instant frame-2 light attacks',
      'Extended Perfect Dodge window with guaranteed follow-up Critical Strike',
      'Instant backstab teleportation (Shadowstep) and multi-hit blade tempest'
    ],
    weaknesses: [
      'Lowest health pool (880 HP) and fragile kinetic defense',
      'Easily countered if multi-hit strings are anticipated and blocked'
    ],

    visual: {
      height: 104,
      width: 38,
      bodyType: 'agile',
      hairColor: '#FF2E93',
      armorColor: '#1A1528',
      trimColor: '#FF2E93',
      scarfColor: '#FF6EB4',
      stance: 'reverse_grip',
      stanceName: 'Phantom Reverse-Grip Stance',
      stanceDesc: 'Low-profile agile crouch with dual Petal Shards held reverse-grip. Uses temporal quartz micro-vibrations to phase-dodge behind targets.',
      coreElement: 'Rose Temporal Quartz Core'
    },

    abilities: [
      {
        id: 'shadowstep',
        name: 'Shadowstep',
        key: 'E (Special 1)',
        type: 'Teleport Strike',
        cost: 25,
        cooldown: 4.5,
        damage: 120,
        description: 'Lyra dissolves into rose particles, instantly reappearing behind the enemy with a precision kidney strike.'
      },
      {
        id: 'petal_tempest',
        name: 'Petal Tempest',
        key: 'Q (Special 2)',
        type: 'Multi-Hit Flurry',
        cost: 30,
        cooldown: 6.0,
        damage: 165,
        description: 'A 6-hit spinning blade dance that shreds through enemy guard and stacks bleed lacerations.'
      },
      {
        id: 'rose_frenzy',
        name: 'ROSE PHANTOM FRENZY',
        key: 'R (Ultimate)',
        type: 'Cinematic Ultimate',
        cost: 100,
        cooldown: 0,
        damage: 440,
        description: 'Lyra creates 4 holographic phantom echoes of herself, executing an impossible 16-hit omni-directional execution matrix.'
      }
    ],

    passive: {
      name: 'Phase Agility',
      description: 'Perfect Dodge window is increased by 30%. Successfully dodging an attack grants a guaranteed Critical Hit on the next strike.'
    },

    skins: [
      { id: 'default', name: 'Rose Spectre', rarity: 'Common', unlocked: true, color: '#FF2E93' },
      { id: 'neon_phantom', name: 'Neon Phantom', rarity: 'Rare', unlocked: false, cost: 800, color: '#EC4899' },
      { id: 'sakura_blade', name: 'Sakura Cyber', rarity: 'Epic', unlocked: false, cost: 1800, color: '#F472B6' },
      { id: 'midnight_mirage', name: 'Midnight Mirage', rarity: 'Legendary', unlocked: false, cost: 3500, color: '#BE185D' }
    ],

    masteryChallenges: [
      { id: 'lyra_m1', title: 'Graceful Flurry', desc: 'Reach a 10-hit combo counter with Lyra', target: 10, current: 0, reward: '100 Shards' },
      { id: 'lyra_m2', title: 'Ghost Behind You', desc: 'Perform 20 successful Shadowsteps', target: 20, current: 0, reward: 'Phantom Ribbon Badge' },
      { id: 'lyra_m3', title: 'Temporal Mastery', desc: 'Perform 12 Perfect Dodges', target: 12, current: 0, reward: 'Title: "The Untouchable"' },
      { id: 'lyra_m4', title: 'Bloom of Death', desc: 'Execute 5 Rose Phantom Frenzy Ultimates', target: 5, current: 0, reward: 'Neon Phantom Skin' },
      { id: 'lyra_m5', title: 'Lethal Precision', desc: 'Win 4 matches with over 50% HP remaining', target: 4, current: 0, reward: 'Rose Petal Trail' }
    ]
  },

  aeron: {
    id: 'aeron',
    name: 'AERON',
    title: 'The Azure Warden',
    core: 'Azure',
    coreColor: '#3978C9',
    coreColorSecondary: '#5A94DC',
    coreColorDark: '#1C4070',
    role: 'Technical Fighter',
    weapon: 'Energy Staff ("Aegis Pole")',
    weaponType: 'staff',
    personality: 'Calm and disciplined',
    lore: 'Guardian of the Sub-Atmospheric Spire. Aeron studied ancient martial forms combined with Azure Kinetic Resonance. He controls the geometry of the battlefield with fluid staff maneuvers, reflecting projectiles and punishing overextensions.',
    quote: '"Control the mind, and the space between us belongs to me."',

    baseStats: {
      hp: 980,
      atk: 105,
      def: 90,
      speed: 7.0,
      coreRate: 1.05,
      critChance: 0.14,
      jumpForce: 14.8
    },

    // Combat Identity & Ratings
    difficulty: 'Technical (★★★☆☆)',
    difficultyStars: 3,
    ratings: {
      power: 72,
      speed: 68,
      defense: 82,
      technique: 94
    },
    strengths: [
      'Exceptional staff attack range (95-100px) that keeps foes at bay',
      'Zero chip damage on block & builds Core energy 35% faster on guard',
      'Defensive kinetic sphere projectile and pole-vault counter attacks'
    ],
    weaknesses: [
      'Moderate burst damage compared to heavy fighters',
      'Demands strict spacing discipline and patient defensive reads'
    ],

    visual: {
      height: 114,
      width: 42,
      bodyType: 'tall_disciplined',
      hairColor: '#E0F2FE',
      armorColor: '#102A43',
      trimColor: '#00D2FF',
      scarfColor: '#38BDF8',
      stance: 'monk_guard',
      stanceName: 'Azure Monk Guard Stance',
      stanceDesc: 'Two-handed staff guard with the Aegis Pole angled across the center line. Maintains spatial zoning and deflects incoming projectiles with kinetic fields.',
      coreElement: 'Azure Kinetic Resonance Core'
    },

    abilities: [
      {
        id: 'kinetic_sphere',
        name: 'Kinetic Sphere',
        key: 'E (Special 1)',
        type: 'Zoning / Displace',
        cost: 25,
        cooldown: 5.0,
        damage: 125,
        description: 'Aeron discharges a pulsating azure kinetic orb that glides forward, pushing the enemy back and deflecting incoming attacks.'
      },
      {
        id: 'vaulting_tempest',
        name: 'Vaulting Tempest',
        key: 'Q (Special 2)',
        type: 'Anti-Air / Pole Kick',
        cost: 30,
        cooldown: 6.0,
        damage: 150,
        description: 'Aeron plants his staff into the earth and vaults high, delivering an aerial twin-kick followed by a descending staff smash.'
      },
      {
        id: 'azure_sky_warden',
        name: 'AZURE SKY WARDEN',
        key: 'R (Ultimate)',
        type: 'Cinematic Ultimate',
        cost: 100,
        cooldown: 0,
        damage: 430,
        description: 'Aeron levitates into a kinetic array, calling down three azure orbital laser columns before delivering a colossal staff strike.'
      }
    ],

    passive: {
      name: 'Resonance Guard',
      description: 'Blocking attacks builds Core Energy 35% faster and reduces all incoming chip damage to 0.'
    },

    skins: [
      { id: 'default', name: 'Spire Sentinel', rarity: 'Common', unlocked: true, color: '#00D2FF' },
      { id: 'storm_weaver', name: 'Storm Weaver', rarity: 'Rare', unlocked: false, cost: 800, color: '#0284C7' },
      { id: 'void_ascendant', name: 'Void Ascendant', rarity: 'Epic', unlocked: false, cost: 1800, color: '#0369A1' },
      { id: 'cyber_monk', name: 'Cybernetic Monk', rarity: 'Legendary', unlocked: false, cost: 3500, color: '#0C4A6E' }
    ],

    masteryChallenges: [
      { id: 'aeron_m1', title: 'Staff Disciple', desc: 'Perform 30 successful Blocks with Aeron', target: 30, current: 0, reward: '100 Shards' },
      { id: 'aeron_m2', title: 'Orbital Control', desc: 'Hit 15 enemies with Kinetic Sphere', target: 15, current: 0, reward: 'Azure Sigil Badge' },
      { id: 'aeron_m3', title: 'Sky Vault', desc: 'Connect 10 Vaulting Tempest strikes', target: 10, current: 0, reward: 'Title: "Warden of the Spire"' },
      { id: 'aeron_m4', title: 'Orbital Retribution', desc: 'Execute 5 Azure Sky Warden Ultimates', target: 5, current: 0, reward: 'Storm Weaver Skin' },
      { id: 'aeron_m5', title: 'Impenetrable Wall', desc: 'Perform 10 Counter-Parries', target: 10, current: 0, reward: 'Azure Vortex Aura' }
    ]
  },

  kairo: {
    id: 'kairo',
    name: 'KAIRO',
    title: 'The Emerald Scourge',
    core: 'Emerald',
    coreColor: '#318A62',
    coreColorSecondary: '#47A87C',
    coreColorDark: '#174731',
    role: 'Aggressive Fighter',
    weapon: 'Energy Chain ("Venom Spire")',
    weaponType: 'chain_whip',
    personality: 'Unpredictable',
    lore: 'A rogue pit fighter from the subterranean toxic refineries. Kairo binds emerald bio-plasma into a segmented razor chain that writhes like a living serpent. He fights with wild feral momentum, pulling foes in for ruthless close-quarters punishment.',
    quote: '"Run all you want. The chain always finds flesh."',

    baseStats: {
      hp: 1050,
      atk: 112,
      def: 75,
      speed: 7.5,
      coreRate: 1.0,
      critChance: 0.16,
      jumpForce: 14.2
    },

    // Combat Identity & Ratings
    difficulty: 'Aggressive (★★★☆☆)',
    difficultyStars: 3,
    ratings: {
      power: 86,
      speed: 76,
      defense: 68,
      technique: 82
    },
    strengths: [
      'Long-range chain whip strikes that outreach conventional melee',
      'Chain Harpoon reels opponents directly to Kairo for brutal point-blank strikes',
      '360-degree knockdown sweeps and +20% bonus damage on airborne/downed foes'
    ],
    weaknesses: [
      'High commitment recovery on missed chain whips',
      'Lower kinetic defense than heavy brawlers'
    ],

    visual: {
      height: 108,
      width: 44,
      bodyType: 'feral_spiked',
      hairColor: '#00FF88',
      armorColor: '#12261B',
      trimColor: '#00FF88',
      scarfColor: '#10B981',
      stance: 'hunched_stalker',
      stanceName: 'Hunched Stalker Stance',
      stanceDesc: 'Predatory feral stance with the segmented Venom Spire bio-chain coiling around his shoulder. Ready to whip out and reel opponents into brutal sweeps.',
      coreElement: 'Emerald Bio-Plasma Core'
    },

    abilities: [
      {
        id: 'chain_harpoon',
        name: 'Chain Harpoon',
        key: 'E (Special 1)',
        type: 'Hook / Pull',
        cost: 25,
        cooldown: 5.5,
        damage: 135,
        description: 'Kairo lashes his emerald chain across the screen, latching onto the opponent and violently reeling them into a knee strike.'
      },
      {
        id: 'venom_whirl',
        name: 'Venom Whirl',
        key: 'Q (Special 2)',
        type: 'Low Sweep / Knockdown',
        cost: 30,
        cooldown: 6.0,
        damage: 145,
        description: 'A vicious 360-degree whipping sweep along the floor that trips the opponent into hard knockdown.'
      },
      {
        id: 'hellbound_chain',
        name: 'EMERALD HELLBOUND CHAIN',
        key: 'R (Ultimate)',
        type: 'Cinematic Ultimate',
        cost: 100,
        cooldown: 0,
        damage: 450,
        description: 'Kairo summons emerald chains erupting from the earth to pin the enemy, whips them into the ceiling, and triggers a venomous core detonation.'
      }
    ],

    passive: {
      name: 'Ruthless Hunter',
      description: 'Attacks against airborne or knocked-down opponents deal 20% increased damage.'
    },

    skins: [
      { id: 'default', name: 'Scourge Pit', rarity: 'Common', unlocked: true, color: '#00FF88' },
      { id: 'toxic_viper', name: 'Toxic Viper', rarity: 'Rare', unlocked: false, cost: 800, color: '#059669' },
      { id: 'rift_hunter', name: 'Rift Stalker', rarity: 'Epic', unlocked: false, cost: 1800, color: '#047857' },
      { id: 'emerald_dragon', name: 'Emerald Drake', rarity: 'Legendary', unlocked: false, cost: 3500, color: '#065F46' }
    ],

    masteryChallenges: [
      { id: 'kairo_m1', title: 'Chain Snag', desc: 'Pull 20 opponents with Chain Harpoon', target: 20, current: 0, reward: '100 Shards' },
      { id: 'kairo_m2', title: 'Ground Sweeper', desc: 'Trip 15 opponents with Venom Whirl', target: 15, current: 0, reward: 'Emerald Fang Badge' },
      { id: 'kairo_m3', title: 'Merciless Combo', desc: 'Perform a combo dealing 300+ damage', target: 1, current: 0, reward: 'Title: "Chainbound Fury"' },
      { id: 'kairo_m4', title: 'Hellbound Reckoning', desc: 'Execute 5 Emerald Hellbound Chain Ultimates', target: 5, current: 0, reward: 'Toxic Viper Skin' },
      { id: 'kairo_m5', title: 'Pit Apex', desc: 'Win 3 matches in Survival Mode', target: 3, current: 0, reward: 'Emerald Spark Trail' }
    ]
  },

  nox: {
    id: 'nox',
    name: 'NOX',
    title: 'The Void Harbinger',
    core: 'Violet',
    coreColor: '#7050A8',
    coreColorSecondary: '#8B6CC2',
    coreColorDark: '#3E2A61',
    role: 'Shadow Fighter',
    weapon: 'Void Blades ("Eclipse Reapers")',
    weaponType: 'scythe_daggers',
    personality: 'Mysterious',
    lore: 'An enigmatic wanderer who stepped out of the heart of the Zero Rift. Nox commands the gravitational pull of dead stars, creating dimensional tears that swallow light itself. His motives remain an ominous riddle to both factions.',
    quote: '"Darkness is not the absence of light. It is what swallows it."',

    baseStats: {
      hp: 940,
      atk: 120,
      def: 72,
      speed: 7.8,
      coreRate: 1.1,
      critChance: 0.18,
      jumpForce: 15.0
    },

    // Combat Identity & Ratings
    difficulty: 'Master (★★★★★)',
    difficultyStars: 5,
    ratings: {
      power: 92,
      speed: 80,
      defense: 52,
      technique: 98
    },
    strengths: [
      'Ethereal teleport blink dodge bypassing physical obstacles',
      'Homing void crescent projectiles and black hole gravity traps',
      'Shadow Siphon steals 5% of opponent\'s Core energy on special hits'
    ],
    weaknesses: [
      'Low base health (940 HP) and vulnerable if traps are mispositioned',
      'Steep skill ceiling requiring advanced positioning and timing'
    ],

    visual: {
      height: 112,
      width: 40,
      bodyType: 'hooded_levitating',
      hairColor: '#C084FC',
      armorColor: '#170E28',
      trimColor: '#A855F7',
      scarfColor: '#9333EA',
      stance: 'levitate_float',
      stanceName: 'Void Singularity Levitation',
      stanceDesc: 'Hovering weightlessly above the arena with gravity distortions underneath. Twin Eclipse Reapers orbit silently, manipulating gravitational singularities.',
      coreElement: 'Violet Singularity Core'
    },

    abilities: [
      {
        id: 'void_crescent',
        name: 'Void Crescent',
        key: 'E (Special 1)',
        type: 'Homing Projectile',
        cost: 25,
        cooldown: 4.8,
        damage: 130,
        description: 'Nox slashes empty space, launching a curved gravity crescent that homes slightly toward the opponent.'
      },
      {
        id: 'rift_anchor',
        name: 'Dark Rift Trap',
        key: 'Q (Special 2)',
        type: 'Trap / Gravity Well',
        cost: 30,
        cooldown: 6.5,
        damage: 160,
        description: 'Places a swirling miniature void tear on the floor that detonates when stepped on, pulling the enemy inward.'
      },
      {
        id: 'event_horizon',
        name: 'VOID APOCALYPSE: EVENT HORIZON',
        key: 'R (Ultimate)',
        type: 'Cinematic Ultimate',
        cost: 100,
        cooldown: 0,
        damage: 470,
        description: 'Nox opens a true singularity on screen. Gravity distorts, the arena darkens into cosmic violet, and void blades slice the enemy through reality.'
      }
    ],

    passive: {
      name: 'Shadow Siphon',
      description: 'Landing special abilities drains 5% of the enemy\'s Core Energy and adds it directly to Nox\'s Core Meter.'
    },

    skins: [
      { id: 'default', name: 'Zero Harbinger', rarity: 'Common', unlocked: true, color: '#A855F7' },
      { id: 'abyssal_specter', name: 'Abyssal Specter', rarity: 'Rare', unlocked: false, cost: 800, color: '#7E22CE' },
      { id: 'chrono_shadow', name: 'Chrono Shadow', rarity: 'Epic', unlocked: false, cost: 1800, color: '#6B21A8' },
      { id: 'cosmic_singularity', name: 'Cosmic Singularity', rarity: 'Legendary', unlocked: false, cost: 3500, color: '#581C87' }
    ],

    masteryChallenges: [
      { id: 'nox_m1', title: 'Void Slicer', desc: 'Land 20 Void Crescent projectiles', target: 20, current: 0, reward: '100 Shards' },
      { id: 'nox_m2', title: 'Gravitational Trap', desc: 'Catch 15 enemies in Dark Rift Traps', target: 15, current: 0, reward: 'Eclipse Badge' },
      { id: 'nox_m3', title: 'Core Siphon', desc: 'Drain 100 total Core Energy with Shadow Siphon', target: 100, current: 0, reward: 'Title: "Eye of the Singularity"' },
      { id: 'nox_m4', title: 'Collapse of Reality', desc: 'Execute 5 Event Horizon Ultimates', target: 5, current: 0, reward: 'Abyssal Specter Skin' },
      { id: 'nox_m5', title: 'Harbinger of Doom', desc: 'Defeat a Boss without taking more than 300 damage', target: 1, current: 0, reward: 'Singularity Void Aura' }
    ]
  }
};

// Original Arenas
export const ARENAS = {
  neon_metro: {
    id: 'neon_metro',
    name: 'Neon Metro',
    subtitle: 'Cyberpunk Transit Highway • Sector 9',
    description: 'High-speed skyway suspended over a sprawling neon metropolis under cyberpunk drizzle.',
    bgMusicTheme: 'cyberpunk_pulse',
    ambientColor: 'rgba(255, 0, 128, 0.15)',
    particles: 'rain',
    groundY: 480
  },
  ancient_rift: {
    id: 'ancient_rift',
    name: 'Ancient Rift',
    subtitle: 'Cosmic Ruin Platform • Dimensional Tear',
    description: 'Ancient monolithic ruins floating inside a cosmic tear between dimensions with gravity anomalies.',
    bgMusicTheme: 'cosmic_synth',
    ambientColor: 'rgba(0, 210, 255, 0.15)',
    particles: 'floating_runes',
    groundY: 480
  },
  solar_temple: {
    id: 'solar_temple',
    name: 'Solar Temple',
    subtitle: 'Zenith Citadel • Orbit Horizon',
    description: 'Radiant golden temple floating in the upper atmosphere bathed in blinding sunlight and radiant heat.',
    bgMusicTheme: 'solar_heroic',
    ambientColor: 'rgba(255, 184, 0, 0.15)',
    particles: 'solar_embers',
    groundY: 480
  },
  frozen_core: {
    id: 'frozen_core',
    name: 'Frozen Core',
    subtitle: 'Glacial Cavern • Sub-Zero Zero',
    description: 'Crystalline subterranean ice sanctum beneath an otherworldly aurora borealis.',
    bgMusicTheme: 'glacial_ambient',
    ambientColor: 'rgba(56, 189, 248, 0.15)',
    particles: 'snow_frost',
    groundY: 480
  },
  void_arena: {
    id: 'void_arena',
    name: 'Void Arena',
    subtitle: 'The Event Horizon • Core Singularity',
    description: 'An obsidian platform floating at the edge of an all-consuming black hole in deep space.',
    bgMusicTheme: 'void_ominous',
    ambientColor: 'rgba(168, 85, 247, 0.18)',
    particles: 'void_dust',
    groundY: 480
  },
  rooftop_city: {
    id: 'rooftop_city',
    name: 'Rooftop City',
    subtitle: 'Apex Tower Helipad • Twilight Hour',
    description: 'Rooftop helipad of a hundred-story skyscraper overlooking the shimmering city twilight lights.',
    bgMusicTheme: 'synthwave_drive',
    ambientColor: 'rgba(99, 102, 241, 0.15)',
    particles: 'city_fog',
    groundY: 480
  }
};
