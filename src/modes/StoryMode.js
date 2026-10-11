// RIFTBORN Original Story Campaign Database
// 5 Original Narrative Chapters with Multi-Stage Fights, Dialogue Beats, Boss Confrontations, Rewards, and Deep Lore Mysteries

export const STORY_CHAPTERS = [
  {
    id: 1,
    title: 'Chapter 1 — Awakening',
    subtitle: 'Vanguard Bio-Synthesis Complex // Sector 9',
    coreFocus: 'Crimson Core // Kinetic Stabilization',
    synopsis: 'Centuries after the catastrophic Genesis Disjunction fractured planetary reality, former commander Vex awakens from experimental surgery. In order to survive fatal organ cellular collapse, Vanguard Coalition bio-engineers bonded an ancient petrified crystalline relic directly into his thoracic cavity—the prototype Crimson Core. But the moment the Core ignites, anomalous harmonic tremors reverberate through the city, and the Vanguard defense perimeter trips into emergency lockdown.',
    loreReveal: 'During calibration, Vex learns that his Crimson Core was not synthesized in a coalition laboratory—it was excavated from a miles-deep subterranean monolith of unknown non-human origin.',
    stages: [
      {
        stageIndex: 1,
        name: 'Trial 1: Neural Calibration',
        hero: 'vex',
        opponent: 'aeron',
        arena: 'neon_metro',
        aiDifficulty: 'RECRUIT',
        isBoss: false,
        objective: 'Calibrate the Crimson Core neural link by landing basic combo strings against Warden Aeron.',
        dialogue: [
          { speaker: 'Aeron', text: 'Steady your breathing, Commander. The harmonic frequency inside your chest is vibrating at 400 hertz. If you lose focus, your heart will boil your own bloodstream.', mood: 'calm' },
          { speaker: 'Vex', text: 'I feel like a walking fusion reactor, Aeron. Every joint in my chassis is humming. How long was I under?' },
          { speaker: 'Aeron', text: 'Three weeks. The Coalition thought you had flatlined. Raise your sword, Vex. We need to verify that your motor cortex hasn\'t desynchronized from your blade.', mood: 'serious' },
          { speaker: 'Vex', text: 'Let\'s see if that Azure staff of yours can still keep up with Vanguard steel.', mood: 'confident' }
        ],
        postDialogue: [
          { speaker: 'Aeron', text: 'Your reflexes are intact... but your core rate is climbing faster than the safety protocols allow. Look at the telemetry screens.', mood: 'concerned' },
          { speaker: 'Vex', text: 'What is that frequency spike? It\'s echoing from outside the laboratory perimeter.', mood: 'alert' }
        ]
      },
      {
        stageIndex: 2,
        name: 'Trial 2: Breach at the Transit Gate',
        hero: 'vex',
        opponent: 'solaris',
        arena: 'neon_metro',
        aiDifficulty: 'WARRIOR',
        isBoss: false,
        objective: 'Defeat the Vanguard Security Vanguard to investigate the seismic tremor.',
        dialogue: [
          { speaker: 'Solaris', text: 'Halt! Sector 9 is under full quarantine protocol by order of High Zenith command! Nobody leaves this ward!', mood: 'commanding' },
          { speaker: 'Vex', text: 'Solaris, stand down. Something is broadcasting an inverted harmonic wave beneath our feet. The entire power grid is faltering.', mood: 'urgent' },
          { speaker: 'Solaris', text: 'I don\'t take orders from experimental cyborgs with unverified cores, Vex. Back into your isolation chamber, or my fists will put you back on life support!', mood: 'aggressive' },
          { speaker: 'Vex', text: 'You never learned how to listen, Solaris. Let\'s clear the path.', mood: 'focused' }
        ],
        postDialogue: [
          { speaker: 'Solaris', text: 'Grrah... where did you get that kind of kinetic acceleration?! That isn\'t standard military cyberware...', mood: 'stunned' },
          { speaker: 'Vex', text: 'The core responded to the tremor. It recognized the signal.', mood: 'mysterious' }
        ]
      },
      {
        stageIndex: 3,
        name: 'BOSS: Overclocked Defense Dreadnought',
        hero: 'vex',
        opponent: 'aeron',
        arena: 'ancient_rift',
        aiDifficulty: 'MASTER',
        isBoss: true,
        bossTitle: 'AERON // OVERCLOCKED VANGUARD TESTER',
        bossTraits: 'Heightened Parry Window • Continuous Azure Projectiles • Increased Kinetic Shielding',
        objective: 'Survive Aeron\'s maximum harmonic surge and unleash your first Crimson Core Overdrive!',
        dialogue: [
          { speaker: 'Aeron', text: 'The perimeter monitors just decrypted the subterranean telemetry, Vex. The signal isn\'t artificial. It\'s an ancient resonant echo matching the crystalline structure inside your chest.', mood: 'intense' },
          { speaker: 'Vex', text: 'You knew all along, didn\'t you? The Coalition didn\'t invent these Cores. What did they dig up down there?', mood: 'demanding' },
          { speaker: 'Aeron', text: 'If you want the clearance ciphers to the Lower Vaults, you must prove you can master the Crimson Surge without burning your mind away. No holding back, Vex! Strike with everything you have!', mood: 'determined' }
        ],
        postDialogue: [
          { speaker: 'Aeron', text: 'Remarkable... the core stabilized under maximum combat load. Your neural matrix did not fracture.', mood: 'impressed' },
          { speaker: 'Vex', text: 'Now give me the truth, Aeron. Where did this core come from?', mood: 'stern' },
          { speaker: 'Aeron', text: 'Deep beneath Sector 4. A petrified monolithic complex that pre-dates human history by millennia. The Coalition calls them the First Architects. And right now... something in Sector 4 is waking up.', mood: 'ominous' }
        ]
      }
    ],
    rewards: {
      shards: 500,
      prisms: 15,
      charXp: 600,
      masteryXp: 250,
      title: 'Awakened Vanguard',
      badge: 'Crest of Awakening'
    },
    codexLog: {
      id: 'log_1',
      title: 'ARCHON CIPHER 01: The Sub-Nullfolds',
      classification: 'VANGUARD BLACK ARCHIVE // LEVEL 1 CLEARANCE',
      author: 'Dr. Evelyn Vance, Lead Biomechanical Architect',
      date: 'Cycle 342 Post-Disjunction',
      content: `Preliminary spectral scans of the fossilized crystalline nodes recovered from Sub-Sector 4 confirm our worst hypotheses: these are not mineral deposits, nor are they radioactive isotopes.

They are localized spacetime anchors.

When the Genesis Disjunction fractured the planetary crust four centuries ago, it did not merely crack geological tectonic plates—it ruptured the quantum fabric separating our 4-dimensional reality from the Sub-Nullfolds: primordial pockets of uncompressed kinetic potential left over from the formation of the cosmos.

Human physiology cannot naturally channel this force. The neural synapses instantly burn into carbon ash. However, by fusing the crystalline nodes with carbon-composite cybernetic chassis—such as the experimental operation performed on Commander Vex—a human nervous system can act as a living harmonic dampener.

The terrifying question remains: who built the stabilizing anchors in the first place? And why did they leave them buried in the dark?`
    }
  },

  {
    id: 2,
    title: 'Chapter 2 — Crimson Conflict',
    subtitle: 'The Subterranean Siphons // Sector 4 Slums',
    coreFocus: 'Emerald Core & Rose Core // The Siphon War',
    synopsis: 'Following the resonant coordinates provided by Aeron, Vex descends into the toxic industrial bowels of Sector 4. The subterranean refineries, built atop ancient stone ruins, are in flames. The Outcast Syndicate, led by the chain-wielding brawler Kairo, has tapped directly into an underground Rift vent, siphoning unrefined emerald harmonic fluid to power their subterranean settlement. Meanwhile, Zenith Corporation has dispatched their deadliest phantom assassin—Lyra—to exterminate the scavengers and seize the vent.',
    loreReveal: 'The ancient stone pillars buried beneath the refineries bear petrified inscriptions detailing a tragic civilizational catastrophe: the original builders attempted to tap infinite energy, but the resulting frequency consumed their physical forms.',
    stages: [
      {
        stageIndex: 1,
        name: 'Trial 1: Ambush in the Steam Ducts',
        hero: 'vex',
        opponent: 'lyra',
        arena: 'frozen_core',
        aiDifficulty: 'WARRIOR',
        isBoss: false,
        objective: 'Intercept the phase-shifting assassin Lyra before she eliminates the refinery engineers.',
        dialogue: [
          { speaker: 'Lyra', text: 'Vanguard scouts this deep in the slag district? You\'re trespassing on a Zenith reclamation zone, swordsman.', mood: 'cold' },
          { speaker: 'Vex', text: 'You\'re butchering miners who are just trying to keep their filtration systems running, Lyra. Since when does the Rose Blade do dirty corporate cleanup?', mood: 'angry' },
          { speaker: 'Lyra', text: 'I don\'t care about Zenith\'s boardroom politics. I care about the Phase Drive they promised me. Stand aside, or I\'ll slice through that shiny new core before you can blink.', mood: 'threatening' },
          { speaker: 'Vex', text: 'Try it. You\'ll find Crimson plasma cuts faster than your shadowstep.', mood: 'confident' }
        ],
        postDialogue: [
          { speaker: 'Lyra', text: 'Tch... your blade speed doubled midway through that sequence. What kind of kinetic feedback is that chassis generating?', mood: 'surprised' },
          { speaker: 'Vex', text: 'Tell me who contracted you to purge this pipeline, Lyra.', mood: 'stern' },
          { speaker: 'Lyra', text: 'Head deeper into the siphon chamber. Your answer is wrapped in chains.', mood: 'elusive' }
        ]
      },
      {
        stageIndex: 2,
        name: 'Trial 2: Slag Line Skirmish',
        hero: 'vex',
        opponent: 'solaris',
        arena: 'rooftop_city',
        aiDifficulty: 'WARRIOR',
        isBoss: false,
        objective: 'Overcome Zenith heavy enforcers attempting to overload the geothermal valves.',
        dialogue: [
          { speaker: 'Solaris', text: 'You followed the trace all the way down here, Vex? You really don\'t know when to abandon a doomed district.', mood: 'haughty' },
          { speaker: 'Vex', text: 'Zenith is trying to seal the siphon chamber by triggering a catastrophic thermal blowout! You\'ll vaporize ten thousand civilians!', mood: 'furious' },
          { speaker: 'Solaris', text: 'Sacrifices must be made to preserve planetary grid integrity. The Emerald resonance Kairo is pulling up is destabilizing the continental fault line! Stand down!', mood: 'stubborn' },
          { speaker: 'Vex', text: 'I will find another way. But first, I am knocking you off this platform.', mood: 'resolute' }
        ],
        postDialogue: [
          { speaker: 'Solaris', text: 'You\'re a fool, Vex... Kairo isn\'t just harvesting power... he\'s tearing open the seal!', mood: 'warning' }
        ]
      },
      {
        stageIndex: 3,
        name: 'BOSS: KAIRO // The Unbound Viper',
        hero: 'vex',
        opponent: 'kairo',
        arena: 'ancient_rift',
        aiDifficulty: 'MASTER',
        isBoss: true,
        bossTitle: 'KAIRO // THE UNBOUND VIPER',
        bossTraits: 'Super Armor on Heavy Chain Sweeps • Venom Chip Damage • Extended Grapple Range',
        objective: 'Subdue Kairo and halt the catastrophic Rift Siphon before the crust fractures!',
        dialogue: [
          { speaker: 'Kairo', text: 'Look who finally dragged his polished boots into the mud! Commander Vex, herald of the pristine upper cities!', mood: 'mocking' },
          { speaker: 'Vex', text: 'Kairo, look at the seismographs! The siphon pump is cracking the ancient foundation pillars! If this chamber collapses, the entire sector falls into the abyss!', mood: 'urgent' },
          { speaker: 'Kairo', text: 'For fifty years the upper citadels drank our sweat while we breathed toxic coolant fumes! Down here, this Emerald Core gave us heat, light, and power! I don\'t care if the whole world burns, we\'re never turning it off!', mood: 'berserk' },
          { speaker: 'Vex', text: 'Then I will dismantle your chains by force!', mood: 'intense' }
        ],
        postDialogue: [
          { speaker: 'Kairo', text: 'Pant... pant... you broke the master link... but look... look at the bedrock behind the drill...', mood: 'weakened' },
          { speaker: 'Vex', text: 'By the stars... what are those carvings? Those aren\'t mining ducts.', mood: 'awe' },
          { speaker: 'Kairo', text: 'They\'re tombs, Commander. Thousands of them. The ancient ones... they tried to build an infinite energy engine just like we did. And whatever came out of the Rift... erased their minds in an instant.', mood: 'haunted' }
        ]
      }
    ],
    rewards: {
      shards: 750,
      prisms: 25,
      charXp: 900,
      masteryXp: 350,
      title: 'Pipeline Breaker',
      badge: 'Emerald Siphon Insignia'
    },
    codexLog: {
      id: 'log_2',
      title: 'ARCHON CIPHER 02: The Fall of the First Architects',
      classification: 'SUB-SECTOR 4 EXCAVATION LOG #89',
      author: 'Foreman J. Kairo & Underground Guild Archives',
      date: 'Cycle 342 Post-Disjunction',
      content: `The glyphs uncovered beneath the third geothermal vent do not tell a story of war, conquest, or technological hubris as our religious texts claim.

They tell a story of desperation.

The First Architects were a spacefaring species who realized their solar system was drifting toward a cosmic compression anomaly—an inevitable thermodynamic death zone they called the 'Null Horizon'.

To preserve their species, they constructed six planetary harmonic anchors—the primal archetypes of our modern Cores: Crimson, Gold, Rose, Azure, Emerald, and Violet. They intended to create a localized reality bubble that could resist cosmic entropy.

But during the calibration of the Sixth Core, an anomaly occurred. The resonance attracted the attention of the Null Horizon itself. In a single stellar cycle, their civilization did not die of sickness or war—their physical forms were dissolved into ethereal null matter, leaving only their petrified suits and empty monolithic spires behind.

We are walking in the exact footsteps of ghosts who thought they were gods.`
    }
  },

  {
    id: 3,
    title: 'Chapter 3 — The Golden Core',
    subtitle: 'High Orbital Citadel // Helios Zenith Spire',
    coreFocus: 'Golden Core // The Solar Archon Protocol',
    synopsis: 'With Sector 4 temporarily stabilized, Vex and Aeron discover that the underground runes point upward—to the high-orbit citadel of Helios Zenith. Tethered to the upper stratosphere by massive kinetic space elevators, the citadel harnesses the Golden Core: a colossal orbital battery that beams clean microwave energy down to the surface cities. But high-altitude radiation telemetry reveals a horrifying truth: the Golden Core is not generating power. It is vibrating in reverse, projecting a colossal targeting beacon into deep interstellar space.',
    loreReveal: 'The high-orbit derelict containing the Golden Core was recovered from the moon\'s orbit. It carried a warning plaque: "The Cores are not power generators. They are lighthouses for the Devourer."',
    stages: [
      {
        stageIndex: 1,
        name: 'Trial 1: Ascent of the Orbital Elevator',
        hero: 'vex',
        opponent: 'lyra',
        arena: 'rooftop_city',
        aiDifficulty: 'WARRIOR',
        isBoss: false,
        objective: 'Fend off Zenith corporate security as the elevator pod ascends into the stratosphere.',
        dialogue: [
          { speaker: 'Lyra', text: 'You\'re persistent, Vex. You survived the Sector 4 collapse and now you\'re riding the sky tether directly into the lion\'s den.', mood: 'impressed' },
          { speaker: 'Vex', text: 'You swapped sides quickly, Lyra. Why are you shadowing us instead of collecting your bounty?', mood: 'probing' },
          { speaker: 'Lyra', text: 'Because what Kairo found shook me. My Phase Blade... its frequency didn\'t come from Zenith R&D. It was cloned from the same petrified ruins. If Helios Zenith activates the master beacon, all our Cores might invert.', mood: 'serious' },
          { speaker: 'Vex', text: 'Then spar with me. Let\'s see if our combined frequencies can pierce the citadel\'s orbital defense grid.', mood: 'ready' }
        ],
        postDialogue: [
          { speaker: 'Lyra', text: 'Your blade resonance... it harmonized with my phase shifts. We actually bypassed their kinetic shield sensors!', mood: 'amazed' },
          { speaker: 'Vex', text: 'Next stop: the Golden Throne.', mood: 'determined' }
        ]
      },
      {
        stageIndex: 2,
        name: 'Trial 2: The Temple of the Sun',
        hero: 'vex',
        opponent: 'aeron',
        arena: 'solar_temple',
        aiDifficulty: 'MASTER',
        isBoss: false,
        objective: 'Harmonize your kinetic barrier with Aeron\'s staff to withstand the blinding solar radiation.',
        dialogue: [
          { speaker: 'Aeron', text: 'The thermal radiation inside this temple is exceeding 3,000 degrees Kelvin, Vex. Only the kinetic dampening of our Cores is keeping our lungs from scorching.', mood: 'strained' },
          { speaker: 'Vex', text: 'Where is Solaris? The reactor diagnostics show him drawing 100% of the citadel\'s core reserves into his armor!', mood: 'concerned' },
          { speaker: 'Aeron', text: 'He believes he can burn away the corruption. He thinks raw solar heat can purge whatever is listening in the dark. We have to defeat his delusions before he overloads the orbital array!', mood: 'urgent' }
        ],
        postDialogue: [
          { speaker: 'Aeron', text: 'He is at the apex dais. Brace yourself, Vex... he has fully bonded with the Golden Core!', mood: 'alert' }
        ]
      },
      {
        stageIndex: 3,
        name: 'BOSS: SOLARIS // Radiant Sun Lord',
        hero: 'vex',
        opponent: 'solaris',
        arena: 'solar_temple',
        aiDifficulty: 'BOSS',
        isBoss: true,
        bossTitle: 'SOLARIS // RADIANT SUN LORD',
        bossTraits: 'Super Armor During Gauntlet Strikes • High Solar Chip Damage • Blinding Thermal Flares',
        objective: 'Defeat the empowered Solar Archon Solaris and disable the orbital beacon before transmission completes!',
        dialogue: [
          { speaker: 'Solaris', text: 'BEHOLD THE RADIANCE OF HELIOS! For centuries humanity has crawled in the dirt like blind worms! With the Golden Core, I will burn away the cold and light the dark forever!', mood: 'zealous' },
          { speaker: 'Vex', text: 'Solaris, shut down the transmission array! The beacon isn\'t calling allies—it\'s broadcasting our coordinates to the Void!', mood: 'shouting' },
          { speaker: 'Solaris', text: 'Lies whispered by cowards afraid of true power! If the darkness answers my call, I WILL BURN IT TO ASH! FACE THE MIGHT OF THE SUN!', mood: 'roaring' },
          { speaker: 'Vex', text: 'Forgive me, Solaris. But I am shutting you down!', mood: 'intense' }
        ],
        postDialogue: [
          { speaker: 'Solaris', text: 'My gauntlets... the gold... is dimming... how could mortal blade cut through solar steel...?', mood: 'collapsed' },
          { speaker: 'Vex', text: 'Look at the telemetry dish on the ceiling, Solaris. Look at what your transmission answered.', mood: 'somber' },
          { speaker: 'Solaris', text: 'Stars above... the sky... the stars are blinking out. What have I done...?', mood: 'horrified' },
          { speaker: 'Aeron', text: 'It answered. The deep trench in the southern ocean... the Ancient Rift has opened.', mood: 'dread' }
        ]
      }
    ],
    rewards: {
      shards: 1000,
      prisms: 40,
      charXp: 1200,
      masteryXp: 500,
      title: 'Zenith Victor',
      badge: 'Golden Solar Medallion'
    },
    codexLog: {
      id: 'log_3',
      title: 'ARCHON CIPHER 03: The Lighthouse Fallacy',
      classification: 'HIGH ORBIT CITADEL BLACK BOX TRANSMISSION',
      author: 'Archon Solaris & Coalition Orbital Observatories',
      date: 'Cycle 342 Post-Disjunction',
      content: `The recovered flight recorder from the lunar derelict has finally yielded its central navigational ciphers.

The ancient translation was completely misinterpreted by the Coalition founders.

We believed the glyph 'OR-THAL' meant 'Generator' or 'Forge'. The correct grammatical declension is 'Lighthouse'.

The First Architects did not construct the six Cores to create energy. They constructed them as a containment perimeter—an array of harmonic frequencies designed to camouflage our solar system from a roaming super-mass in dark space: the Void Singularity.

By supercharging the Golden Core, Solaris did not protect humanity. He turned on a lighthouse in an ocean of predatory darkness.

The Void is no longer searching. It has found us.`
    }
  },

  {
    id: 4,
    title: 'Chapter 4 — Rise of the Void',
    subtitle: 'The Abyssal Trench // Ancient Rift Monolith',
    coreFocus: 'Violet Core // The Echo of Kaelen Nox',
    synopsis: 'The sky over Terra-Nova turns into an eerie bruised violet as atmospheric anomalies manifest worldwide. An abyssal rift tears open at the bottom of the southern ocean trench, projecting a localized singularity that defies the laws of physics. Vex, Aeron, and Lyra dive into the submerged crystalline ruins of the primary Architect Monolith. There, standing amid floating shards of reality, is a phantom figure wielding dual obsidian void blades—Agent Kaelen Nox, the vanguard scout who vanished into the Event Horizon five years ago.',
    loreReveal: 'Nox is not an alien or an evil overlord. He was human—the first scout to cross the Event Horizon. He discovered that the Void is not evil, but the universe\'s natural entropic immune system trying to heal the "cancer" of conscious existence.',
    stages: [
      {
        stageIndex: 1,
        name: 'Trial 1: Incursion into the Null Horizon',
        hero: 'vex',
        opponent: 'kairo',
        arena: 'ancient_rift',
        aiDifficulty: 'MASTER',
        isBoss: false,
        objective: 'Rescue Kairo whose mind is being distorted by the Void\'s resonant frequency.',
        dialogue: [
          { speaker: 'Kairo', text: 'The whispers... they won\'t stop, Vex! They\'re singing in the green core! They\'re telling me to let go of the chains!', mood: 'panicked' },
          { speaker: 'Vex', text: 'Snap out of it, Kairo! Anchor your mind to your heartbeat! Don\'t let the void frequency overwrite your neural link!', mood: 'shouting' },
          { speaker: 'Kairo', text: 'I can\'t hold it... the chains are moving on their own! Defend yourself!', mood: 'desperate' }
        ],
        postDialogue: [
          { speaker: 'Kairo', text: 'Hah... thanks, Commander. The impact snapped the feedback loop. But look ahead... that silhouette standing on the water...', mood: 'recovering' },
          { speaker: 'Vex', text: 'I know that combat stance. It can\'t be...', mood: 'shocked' }
        ]
      },
      {
        stageIndex: 2,
        name: 'Trial 2: The Hall of Echoes',
        hero: 'vex',
        opponent: 'lyra',
        arena: 'frozen_core',
        aiDifficulty: 'MASTER',
        isBoss: false,
        objective: 'Fight through the phase-distorted reflections manifested by the Void anomaly.',
        dialogue: [
          { speaker: 'Lyra', text: 'Vex, the spacetime density here is negative! My phase dashes are leaving permanent physical tears in the air!', mood: 'alarmed' },
          { speaker: 'Vex', text: 'Nox is manipulating the Planck constant around us. He\'s pulling this entire trench into a micro-singularity!', mood: 'focused' },
          { speaker: 'Lyra', text: 'Then let\'s strike him before the horizon collapses on our heads!', mood: 'determined' }
        ],
        postDialogue: [
          { speaker: 'Lyra', text: 'The path is clear to the central chamber. Vex... be careful. He isn\'t the man you remember from the Academy.', mood: 'solemn' }
        ]
      },
      {
        stageIndex: 3,
        name: 'BOSS: NOX // The Void Inquisitor',
        hero: 'vex',
        opponent: 'nox',
        arena: 'void_arena',
        aiDifficulty: 'BOSS',
        isBoss: true,
        bossTitle: 'NOX // THE VOID INQUISITOR',
        bossTraits: 'Instant Spatial Teleportation • Void Crescent Projectile Barrage • Gravity Pull Traps',
        objective: 'Confront Void Inquisitor Nox and discover the truth of the Event Horizon!',
        dialogue: [
          { speaker: 'Nox', text: 'Five years in the absolute silence between dimensions, Vex. And yet you still cling to this noisy, agonizing illusion called existence.', mood: 'whispering' },
          { speaker: 'Vex', text: 'Kaelen... we searched for your ship for months. We thought your pod was pulverized when the rift collapsed!', mood: 'emotional' },
          { speaker: 'Nox', text: 'My vessel died. But I did not. The Void did not murder me, Vex. It healed me. It showed me what reality truly is: a fractured wound in nothingness. Every time your cores oscillate, you reopen that wound. You prolong the suffering of the cosmos.', mood: 'calm' },
          { speaker: 'Vex', text: 'Life isn\'t a wound, Kaelen! It\'s our home! We have fought too hard to let you dissolve everything we love into silence!', mood: 'passionate' },
          { speaker: 'Nox', text: 'Then let us measure your resolve against the gravity of the inevitable. Dance with the Void, old friend.', mood: 'cold' }
        ],
        postDialogue: [
          { speaker: 'Nox', text: 'You fight well... as you always did in the sparring rings. But you are too late, Vex.', mood: 'fading' },
          { speaker: 'Vex', text: 'What did you do, Nox?!', mood: 'demanding' },
          { speaker: 'Nox', text: 'The compression sequence is primed. The five satellite spires are locked into resonance. The final protocol begins: Riftfall. I will see you at Ground Zero... at the Genesis Singularity.', mood: 'chilling' }
        ]
      }
    ],
    rewards: {
      shards: 1500,
      prisms: 60,
      charXp: 1600,
      masteryXp: 750,
      title: 'Void Strider',
      badge: 'Eye of the Event Horizon'
    },
    codexLog: {
      id: 'log_4',
      title: 'ARCHON CIPHER 04: The Lost Expedition to Sector 0',
      classification: 'INCIDENT REPORT // CLASSIFIED EYES ONLY',
      author: 'Fleet Admiral Vance, Vanguard Coalition Command',
      date: 'Cycle 337 Post-Disjunction',
      content: `Official Coalition Record: Five years ago, Vanguard Deep Reconnaissance Shuttle 'Apex-3' piloted by Commander Kaelen Nox suffered catastrophic drive failure in Sector 0. Vessel and pilot declared lost with all hands.

Unredacted Reality: The telemetry received from Nox's shuttle did not terminate upon entering the rift. It continued broadcasting for 1,400 hours from beyond the Event Horizon.

The voice recordings recovered in the final days did not contain screams of pain or panic. They contained mathematical equations. Millions of lines of harmonic calculus calculating the total mass-energy deficit of our universe.

Nox discovered that our universe is slowly losing kinetic coherence due to the six artificial Cores. By locking energy inside human bio-chassis, humanity is preventing the universe from completing its natural cosmic lifecycle.

Nox did not go insane. He simply stopped thinking like a human, and started thinking like the cosmos itself.`
    }
  },

  {
    id: 5,
    title: 'Chapter 5 — Riftfall',
    subtitle: 'The Genesis Singularity // Ground Zero',
    coreFocus: 'All Six Cores Harmonized // The Final Battle',
    synopsis: 'The climax of the Riftborn saga. Reality itself begins to buckle as the skies shatter into kaleidoscopic crystalline fractures. Nox stands at the epicenter of the Genesis Singularity, initiating "Riftfall"—a total dimensional collapse protocol that will compress Terra-Nova into a zero-entropy ground state. To stop the catastrophe, all five surviving warriors—Vex, Solaris, Lyra, Aeron, and Kairo—unite their disparate Cores into a single synchronized resonance. Vex must step into the heart of the Event Horizon to face the Ascended Sovereign in an epic final duel for the future of existence.',
    loreReveal: 'Defeating Nox and synchronizing the six Cores does not close the Rifts forever. Instead, it transforms humanity into the true successors of the First Architects—and awakens ancient slumbering megastructures across the outer rim of the galaxy, opening the gateway for future galactic expansions.',
    stages: [
      {
        stageIndex: 1,
        name: 'Trial 1: Breach of the Singularity Gate',
        hero: 'vex',
        opponent: 'solaris',
        arena: 'void_arena',
        aiDifficulty: 'MASTER',
        isBoss: false,
        objective: 'Coordinate with Solaris to smash through the gravitational perimeter barrier.',
        dialogue: [
          { speaker: 'Solaris', text: 'Vex! The gravity shear here is peeling the armor off my gauntlets! Are you sure this synchronization frequency will hold?!', mood: 'strained' },
          { speaker: 'Vex', text: 'Gold and Crimson together, Solaris! Your thermal density provides the mass; my blade provides the frequency! On my mark... STRIKE!', mood: 'roaring' },
          { speaker: 'Solaris', text: 'FOR TERRA-NOVA! FOR THE RIFTBORN!', mood: 'battlecry' }
        ],
        postDialogue: [
          { speaker: 'Solaris', text: 'THE PERIMETER IS SHATTERED! GO, VEX! The central singularity is waiting for you!', mood: 'triumphant' }
        ]
      },
      {
        stageIndex: 2,
        name: 'Trial 2: The Gauntlet of Realities',
        hero: 'vex',
        opponent: 'aeron',
        arena: 'ancient_rift',
        aiDifficulty: 'MASTER',
        isBoss: false,
        objective: 'Harmonize the Azure and Emerald frequencies to pierce the temporal distortion field.',
        dialogue: [
          { speaker: 'Aeron', text: 'Vex, our cores are reaching 99% harmonic threshold. If you fall in there, there will be no medical pods, no Coalition to pull you out.', mood: 'solemn' },
          { speaker: 'Lyra', text: 'He won\'t fall. We didn\'t crawl out of the slums and the laboratories just to watch the sky collapse. Cut him down, Commander.', mood: 'fierce' },
          { speaker: 'Kairo', text: 'Make that void ghost pay for every chain he rattled!', mood: 'grinning' },
          { speaker: 'Vex', text: 'We end this together.', mood: 'resolute' }
        ],
        postDialogue: [
          { speaker: 'Aeron', text: 'The path to the Event Horizon is open. May the First Architects guide your blade.', mood: 'sacred' }
        ]
      },
      {
        stageIndex: 3,
        name: 'BOSS: ASCENDED NOX // The Null Sovereign',
        hero: 'vex',
        opponent: 'nox',
        arena: 'void_arena',
        aiDifficulty: 'GODLIKE',
        isBoss: true,
        bossTitle: 'ASCENDED NOX // THE NULL SOVEREIGN',
        bossTraits: 'Event Horizon Gravity Surge • Transcendent Null Blades • Full Core Invulnerability Phases • Unblockable Spatial Tear',
        objective: 'Defeat the Ascended Null Sovereign, synchronize all six Cores, and prevent the annihilation of Terra-Nova!',
        dialogue: [
          { speaker: 'Nox', text: 'Look around you, Vex. Time has ceased to flow. The stars have stopped burning. In this quiet place, there is no pain, no fear, no grief.', mood: 'transcendent' },
          { speaker: 'Vex', text: 'And no joy. No laughter. No sunrise over Neon Metro. No pride in fighting alongside comrades who believe in tomorrow.', mood: 'unshakable' },
          { speaker: 'Nox', text: 'Tomorrow is an illusion created by dying stars. Submit to the peace of the Null Horizon, Rift Vanguard!', mood: 'apocalyptic' },
          { speaker: 'Vex', text: 'WE WILL NEVER SURRENDER OUR SPARK! THIS IS OUR REALITY! AND WE WILL DEFEND IT TO OUR LAST BREATH!', mood: 'climax' }
        ],
        postDialogue: [
          { speaker: 'Nox', text: 'How... how does your frequency overpower the singularity...?', mood: 'unraveling' },
          { speaker: 'Vex', text: 'Because a single Core was never meant to rule alone, Kaelen. Crimson, Gold, Rose, Azure, Emerald... when human hearts synchronize their resonance, we don\'t fracture reality. We heal it.', mood: 'compassionate' },
          { speaker: 'Nox', text: 'Heh... perhaps... you are right. The compression... has reversed. But listen to me, Vex... the First Architects were not gods. They were wardens. The barrier they built was keeping something else out. And now... the Outer Rifts have felt our pulse...', mood: 'dissolving' },
          { speaker: 'Vex', text: 'Then let them come. We are Riftborn. And we will be ready.', mood: 'legendary' }
        ]
      }
    ],
    rewards: {
      shards: 2500,
      prisms: 100,
      charXp: 3000,
      masteryXp: 1200,
      title: 'Champion of the Genesis Rift',
      badge: 'Crown of the First Archon'
    },
    codexLog: {
      id: 'log_5',
      title: 'ARCHON CIPHER 05: Telemetry from the Outer Rifts',
      classification: 'FOUNDATION ARCHIVE // OMEGA CLEARANCE',
      author: 'Commander Vex & United Rift Coalition',
      date: 'Cycle 343 Post-Disjunction // Dawn of the New Age',
      content: `The Event Horizon has stabilized into a harmonic equilibrium. The sky over Neon Metro is clear, and for the first time in four hundred years, the tectonic tremors beneath Sector 4 have subsided.

The six Cores are no longer volatile weapons threatening to incinerate their bearers. Synchronized during the final duel with Nox, they have formed a self-sustaining harmonic matrix across our planet.

Yet as Nox disintegrated into the rift ether, deep-space telemetry arrays on the Helios Zenith orbital spire picked up three distinct spatial pulses origin-dating from beyond the Oort Cloud.

Three colossal, dormant Archon megastructures—each larger than our moon—have powered on in deep interstellar space.

They were not awakened by catastrophe. They were awakened by our victory.

The story of the Riftborn has not ended. It has only crossed the threshold of the cradle.

[END OF SEASON 1: GENESIS SAGA]
[PREPARE FOR EXPANSION 1: ARCHITECTS OF THE VOID]
`
    }
  }
];
