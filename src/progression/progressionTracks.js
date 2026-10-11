// RIFTBORN Character Progression Tracks
// 25-Level Milestone Tracks for all 6 characters with Ability Unlocks, Visual Evolutions, Cosmetics & Titles
// Purely non-pay-to-win, skill-focused progression

export const CHARACTER_PROGRESSION_TRACKS = {
  vex: [
    { level: 1, type: 'ability', id: 'crimson_dash', name: 'Crimson Dash', desc: 'Supersonic gap-closing forward thrust that staggers', icon: '⚔' },
    { level: 3, type: 'ability', id: 'rift_slash', name: 'Rift Slash', desc: 'Rising anti-air dimensional slash launching targets', icon: '⚡' },
    { level: 5, type: 'cosmetic', id: 'title_rift_vanguard', name: 'Title: "Rift Vanguard"', desc: 'Player title for veteran swordsmen', icon: '📜' },
    { level: 7, type: 'ability', id: 'counter_strike', name: 'Counter Strike', desc: 'Precision deflection stance countering enemy aggression', icon: '🛡' },
    { level: 10, type: 'evolution', id: 'aura_crimson_wisps', name: 'Awakened: Crimson Wisps Aura', desc: 'Visual Evolution Tier 1: Pulsing crimson energy particles around chassis', icon: '✨' },
    { level: 12, type: 'ability', id: 'resonance_thrust', name: 'Resonance Thrust', desc: 'Low-startup frame variant of Crimson Dash with reduced recovery', icon: '✦' },
    { level: 15, type: 'ability', id: 'crimson_overdrive', name: 'Crimson Overdrive', desc: 'Core Surge: +15% sprint velocity & flaming crimson plasma blade trail', icon: '🔥' },
    { level: 18, type: 'cosmetic', id: 'skin_cyber_ronin', name: 'Cyber Ronin Suit', desc: 'Rare neon-cybernetic samurai combat armor', icon: '👘' },
    { level: 20, type: 'evolution', id: 'ascended_vex', name: 'Ascended VEX', desc: 'Visual Evolution Tier 2: Transcendent golden-crimson crest & radiating plasma halo', icon: '👑' },
    { level: 25, type: 'mastery', id: 'title_grand_vanguard', name: 'Title: "Grand Vanguard Champion"', desc: 'Apex warrior mastery accolade', icon: '🎖' }
  ],

  solaris: [
    { level: 1, type: 'ability', id: 'solar_shockwave', name: 'Solar Shockwave', desc: 'Gauntlet ground pound area-denial shockwave', icon: '💥' },
    { level: 3, type: 'ability', id: 'meteor_charge', name: 'Meteor Charge', desc: 'Armored rush tackle absorbing incoming hits', icon: '☄' },
    { level: 5, type: 'cosmetic', id: 'title_radiant_juggernaut', name: 'Title: "Radiant Juggernaut"', desc: 'Player title for titan brawlers', icon: '📜' },
    { level: 7, type: 'ability', id: 'titans_aegis', name: 'Titan\'s Aegis', desc: 'Deflection barrier halting projectile momentum with super armor', icon: '🛡' },
    { level: 10, type: 'evolution', id: 'aura_molten_flares', name: 'Awakened: Molten Solar Flares', desc: 'Visual Evolution Tier 1: Radiant golden thermal sparks rising from armor', icon: '✨' },
    { level: 12, type: 'ability', id: 'helios_tremor', name: 'Helios Tremor', desc: 'Seismic ground quake variant tripping adjacent foes', icon: '✦' },
    { level: 15, type: 'ability', id: 'supernova_blast', name: 'Supernova Blast', desc: 'Point-blank thermal detonation cleaving block guard', icon: '🌟' },
    { level: 18, type: 'cosmetic', id: 'skin_gilded_warmachine', name: 'Gilded Warmachine Suit', desc: 'Heavy armored solar titan chassis with molten gold hydraulics', icon: '🦾' },
    { level: 20, type: 'evolution', id: 'ascended_solaris', name: 'Ascended SOLARIS', desc: 'Visual Evolution Tier 2: Solar deity sun-halo and blazing corona crest', icon: '👑' },
    { level: 25, type: 'mastery', id: 'title_sun_lord', name: 'Title: "Sun Lord of Helios Zenith"', desc: 'Apex titan mastery accolade', icon: '🎖' }
  ],

  lyra: [
    { level: 1, type: 'ability', id: 'shadowstep', name: 'Shadowstep', desc: 'Instant dimensional backstab teleportation', icon: '🗡' },
    { level: 3, type: 'ability', id: 'petal_tempest', name: 'Petal Tempest', desc: 'Rapid multi-hit advancing dual-blade cyclone', icon: '🌀' },
    { level: 5, type: 'cosmetic', id: 'title_phase_phantom', name: 'Title: "Phase Phantom"', desc: 'Player title for speed assassins', icon: '📜' },
    { level: 7, type: 'ability', id: 'mirage_flash', name: 'Mirage Flash', desc: 'Post-dodge afterimage decoy confusing opponent tracking', icon: '💨' },
    { level: 10, type: 'evolution', id: 'aura_rose_blossom', name: 'Awakened: Rose Petal Trails', desc: 'Visual Evolution Tier 1: Hyperspeed pink phase blossom afterimages', icon: '✨' },
    { level: 12, type: 'ability', id: 'phantom_cascade', name: 'Phantom Cascade', desc: 'Delayed double aerial strike with critical follow-up', icon: '✦' },
    { level: 15, type: 'ability', id: 'thousand_petals', name: 'Thousand Petals', desc: 'Blistering 7-cut blade flourish rending defenses', icon: '🌸' },
    { level: 18, type: 'cosmetic', id: 'skin_neon_infiltrator', name: 'Neon Blossom Suit', desc: 'Aerodynamic stealth assassin suit with rose neon accents', icon: '🥷' },
    { level: 20, type: 'evolution', id: 'ascended_lyra', name: 'Ascended LYRA', desc: 'Visual Evolution Tier 2: Rose void plasma wings and phantom crown', icon: '👑' },
    { level: 25, type: 'mastery', id: 'title_phase_queen', name: 'Title: "Queen of the Phase Rift"', desc: 'Apex assassin mastery accolade', icon: '🎖' }
  ],

  aeron: [
    { level: 1, type: 'ability', id: 'kinetic_sphere', name: 'Kinetic Sphere', desc: 'Long-range displace orb projectile', icon: '🔮' },
    { level: 3, type: 'ability', id: 'vaulting_tempest', name: 'Vaulting Tempest', desc: 'Staff pole-vault rising spin kick and launcher', icon: '🌀' },
    { level: 5, type: 'cosmetic', id: 'title_sky_sentinel', name: 'Title: "Sky Sentinel"', desc: 'Player title for technical guardians', icon: '📜' },
    { level: 7, type: 'ability', id: 'resonance_barrier', name: 'Resonance Barrier', desc: 'Zero-chip guard pulse that neutralizes incoming projectiles', icon: '🛡' },
    { level: 10, type: 'evolution', id: 'aura_azure_current', name: 'Awakened: Azure Lightning Halo', desc: 'Visual Evolution Tier 1: Blue electric current humming along staff', icon: '✨' },
    { level: 12, type: 'ability', id: 'sky_vault_launcher', name: 'Sky Vault Launcher', desc: 'High-arc aerial juggle vault with safe landing recovery', icon: '✦' },
    { level: 15, type: 'ability', id: 'ion_storm_strike', name: 'Ion Storm Strike', desc: 'Overhead lightning staff strike disabling enemy dash', icon: '⚡' },
    { level: 18, type: 'cosmetic', id: 'skin_cyber_monastic', name: 'Cyber Monastic Robes', desc: 'High-tech spiritual sentinel garb with azure sash trails', icon: '🥋' },
    { level: 20, type: 'evolution', id: 'ascended_aeron', name: 'Ascended AERON', desc: 'Visual Evolution Tier 2: Floating azure energy glyphs and radiant sentinel halo', icon: '👑' },
    { level: 25, type: 'mastery', id: 'title_grand_sentinel', name: 'Title: "Grand Master of Azure Spire"', desc: 'Apex sentinel mastery accolade', icon: '🎖' }
  ],

  kairo: [
    { level: 1, type: 'ability', id: 'chain_harpoon', name: 'Chain Harpoon', desc: 'Long-range snag pulling opponent to point-blank range', icon: '⛓' },
    { level: 3, type: 'ability', id: 'venom_whirl', name: 'Venom Whirl', desc: '360-degree ground sweep dealing heavy knockdown', icon: '🌪' },
    { level: 5, type: 'cosmetic', id: 'title_emerald_scourge', name: 'Title: "Emerald Scourge"', desc: 'Player title for chain masters', icon: '📜' },
    { level: 7, type: 'ability', id: 'grapple_vault', name: 'Grapple Vault', desc: 'Air grapple pulling Kairo forward across neutral space', icon: '🔗' },
    { level: 10, type: 'evolution', id: 'aura_emerald_viper', name: 'Awakened: Emerald Viper Pulse', desc: 'Visual Evolution Tier 1: Glowing green venom pulses along whip links', icon: '✨' },
    { level: 12, type: 'ability', id: 'spiked_chain_lash', name: 'Spiked Chain Lash', desc: 'Barbed chain strike dealing heavy chip damage through block', icon: '✦' },
    { level: 15, type: 'ability', id: 'hellbound_bind', name: 'Hellbound Bind', desc: 'Chain entrapment temporarily restricting opponent dash', icon: '🐍' },
    { level: 18, type: 'cosmetic', id: 'skin_toxic_bioarmor', name: 'Toxic Outcast Bio-Armor', desc: 'Hazardous waste scavenger suit with emerald fluid tubes', icon: '☣' },
    { level: 20, type: 'evolution', id: 'ascended_kairo', name: 'Ascended KAIRO', desc: 'Visual Evolution Tier 2: Emerald dragon whip and glowing serpent crest', icon: '👑' },
    { level: 25, type: 'mastery', id: 'title_apex_scourge', name: 'Title: "Apex Scourge of Sector 4"', desc: 'Apex disruptor mastery accolade', icon: '🎖' }
  ],

  nox: [
    { level: 1, type: 'ability', id: 'void_crescent', name: 'Void Crescent', desc: 'Curved homing void blade projectile', icon: '🌙' },
    { level: 3, type: 'ability', id: 'dark_rift_trap', name: 'Dark Rift Trap', desc: 'Ground singularity trap that pulls and drains energy', icon: '🕳' },
    { level: 5, type: 'cosmetic', id: 'title_shadow_architect', name: 'Title: "Shadow Architect"', desc: 'Player title for void tricksters', icon: '📜' },
    { level: 7, type: 'ability', id: 'phase_ambush', name: 'Phase Ambush', desc: 'Ethereal teleport plunge attack cutting from above', icon: '👁' },
    { level: 10, type: 'evolution', id: 'aura_event_horizon', name: 'Awakened: Void Horizon Distortion', desc: 'Visual Evolution Tier 1: Space-warping violet ripples surrounding scythes', icon: '✨' },
    { level: 12, type: 'ability', id: 'twin_singularity', name: 'Twin Singularity', desc: 'Dual mini gravity pull vortexes disrupting spacing', icon: '✦' },
    { level: 15, type: 'ability', id: 'event_horizon', name: 'Event Horizon', desc: 'Expansive gravity field stealing 5% Core gauge per second', icon: '🌌' },
    { level: 18, type: 'cosmetic', id: 'skin_void_sovereign', name: 'Void Sovereign Robes', desc: 'Dark matter imperial shroud with floating obsidian scythes', icon: '👘' },
    { level: 20, type: 'evolution', id: 'ascended_nox', name: 'Ascended NOX', desc: 'Visual Evolution Tier 2: Cosmic singularity halo and floating void wings', icon: '👑' },
    { level: 25, type: 'mastery', id: 'title_harbinger_void', name: 'Title: "Harbinger of Event Horizon"', desc: 'Apex shadow mastery accolade', icon: '🎖' }
  ]
};

// Normalized XP needed curve per level
export function calculateXpNeeded(level) {
  if (level === 12) return 5000; // Level 12 precisely requires 5,000 XP
  if (level <= 1) return 500;
  if (level <= 5) return 500 + (level - 1) * 350;
  if (level < 12) return 2000 + (level - 5) * 425;
  if (level <= 20) return 5000 + (level - 12) * 875; // Level 20 reaches 12,000 XP
  return 12000 + (level - 20) * 1200; // Level 25 reaches 18,000 XP
}

// Mastery XP needed curve per rank
export function calculateMasteryXpNeeded(rank) {
  return 800 + (rank - 1) * 400; // Rank 1: 800, Rank 4: 2,000, Rank 10: 4,400
}
