// RIFTBORN Master Application Controller
// Handles UI routing, Roster carousel, Character customization, Story dialogue, Matchmaking, and HUD updates

import { CHARACTERS, ARENAS } from './characters/characterData.js';
import { GameEngine } from './engine/GameEngine.js';
import { Fighter, FIGHTER_STATES } from './engine/Fighter.js';
import { ParticleSystem } from './engine/ParticleSystem.js';
import { characterRenderer } from './engine/CharacterRenderer.js';
import { soundEngine } from './engine/SoundEngine.js';
import { progressionManager, COSMETIC_REWARDS_CATALOG } from './progression/ProgressionManager.js';
import { STORY_CHAPTERS } from './modes/StoryMode.js';
import { GLOBAL_LEADERBOARD } from './social/SocialSystem.js';
import { RANK_TIERS, SEASON_CONFIG, CompetitiveRankEngine, competitiveNetworkCoordinator } from './competitive/CompetitiveSystem.js';

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

class RiftbornApp {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.engine = new GameEngine(this.canvas);

    this.selectedCharId = 'vex';
    this.selectedSelectCharId = 'vex';
    this.previewParticleSystem = new ParticleSystem();
    this.selectedCustomCharId = 'vex';
    this.selectedProgCharId = 'vex';
    this.selectedDifficulty = 'NORMAL';
    this.currentChapter = null;
    this.currentStage = null;
    this.dialogueStep = 0;
    this.selectedCodexLogId = 'log_1';
    this.queueTimer = null;
    this.matchHistoryFilter = 'ALL';
    this.rankHistoryFilter = 'ALL';
    this.leaderboardTab = 'GLOBAL';
    this.currentMatchMode = 'casual';
    try {
      this.currentMatchMode = localStorage.getItem('riftborn_selected_mode') || 'casual';
    } catch (_) {}

    // Live preview stage state
    this.previewFighter = null;
    this.previewAnimFrame = null;
    this.previewAction = 'IDLE';
    this.previewLastTime = performance.now();
    this.previewProjectiles = [];

    // Home showcase hero state
    this.homeRoster = ['vex', 'solaris', 'lyra', 'aeron', 'kairo', 'nox'];
    this.homeShowcaseCharIndex = 0;
    this.homeFighter = null;
    this.homeAnimFrame = null;
    this.homeLastTime = performance.now();

    this.init();
  }

  init() {
    window.showToast = (msg, type, dur) => this.showToast(msg, type, dur);
    window.showConfirmation = (title, msg, onConfirm, isDestructive) => this.showConfirmation(title, msg, onConfirm, isDestructive);
    this.setupNavigation();
    this.setupLobbyModeSelector();
    this.setupAudioSettings();
    this.setupModeSelector();
    this.setupCharacterSelect();
    this.setupProgressionScreen();
    this.setupCasualSetup();
    this.setupRankedSetup();
    this.setupProfileScreen();
    this.setupStoryMode();
    this.setupRoster();
    this.setupRewardsPass();
    this.setupInventory();
    this.setupChallengesHub();
    this.setupLeaderboards();
    this.setupEngineCallbacks();
    this.setupFullscreenController();
    this.setupOrientationHandler();
    this.setupMoveListGuide();
    this.setupTutorialAndTraining();
    this.captureUtmCampaign();
    this.setupThemeSystem();
    this.setupMobileDrawer();
    this.setupStickyHeader();
    this.setupScrollProgressAndBackToTop();
    this.setupSiteSearch();
    this.setupCopyButtons();
    this.setupCookieConsent();
    this.setupFooterAndLegal();
    this.updateUserDisplay();
    this.renderHomeHero();

    // Start on Home Screen
    this.showScreen('screen-home');
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn, .nav-icon-btn').forEach(b => b.classList.remove('active'));

    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
    }

    const navBtn = document.querySelector(`.nav-btn[data-screen="${screenId}"], .nav-icon-btn[data-screen="${screenId}"]`);
    if (navBtn) {
      navBtn.classList.add('active');
    }

    document.querySelectorAll('.mobile-nav-btn').forEach(btn => btn.classList.remove('active'));
    const mobileBtn = document.querySelector(`.mobile-nav-btn[data-screen="${screenId}"]`);
    if (mobileBtn) {
      mobileBtn.classList.add('active');
    }

    document.querySelectorAll('.drawer-nav-btn[data-screen]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-screen') === screenId);
    });

    this.updateScreenMetadata(screenId);

    // Hide fight view when browsing menus
    document.getElementById('game-view').style.display = 'none';
    document.body.classList.remove('in-combat');
    const fb = document.getElementById('btn-floating-contact');
    if (fb) fb.style.display = '';

    // Clear combat-only overlays when navigating menus
    const tutOverlay = document.getElementById('tutorial-overlay');
    if (tutOverlay) tutOverlay.style.display = 'none';
    const trainOverlay = document.getElementById('training-telemetry-overlay');
    if (trainOverlay) trainOverlay.style.display = 'none';

    // Maintain orientation checks for mobile landscape
    this.checkOrientation();

    // Manage preview animation loop
    if (screenId === 'screen-character-select') {
      this.selectCharacterForSelect(this.selectedSelectCharId || 'vex');
      this.startPreviewLoop();
    } else {
      this.stopPreviewLoop();
    }

    // Manage home hero showcase animation loop
    if (screenId === 'screen-home') {
      this.renderHomeHero();
      this.startHomeHeroLoop();
    } else {
      this.stopHomeHeroLoop();
    }

    // Dynamic screen rendering refreshes
    if (screenId === 'screen-progression') {
      this.renderProgression(this.selectedProgCharId);
    } else if (screenId === 'screen-story') {
      this.setupStoryMode();
    } else if (screenId === 'screen-profile') {
      this.renderProfile();
    } else if (screenId === 'screen-ranked-setup') {
      this.renderRankedSetup();
    } else if (screenId === 'screen-leaderboard') {
      this.renderLeaderboards(this.leaderboardTab);
    }

    soundEngine.playUiHover();
  }

  setupThemeSystem() {
    const savedTheme = localStorage.getItem('riftborn_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme ? savedTheme : (prefersDark ? 'dark' : 'light');
    this.applyTheme(initialTheme);

    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    if (btnThemeToggle) {
      btnThemeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(nextTheme);
        localStorage.setItem('riftborn_theme', nextTheme);
        soundEngine.playUiClick();
      });
    }

    const drawerBtnTheme = document.getElementById('drawer-btn-theme');
    if (drawerBtnTheme) {
      drawerBtnTheme.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(nextTheme);
        localStorage.setItem('riftborn_theme', nextTheme);
        soundEngine.playUiClick();
      });
    }

    // System theme change listener (when user has not set explicit manual override)
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('riftborn_theme')) {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#0B0E14' : '#F4F6F8');
    }

    // Update navbar theme button
    const themeGlyph = document.getElementById('theme-icon-glyph');
    const themeLabel = document.getElementById('theme-icon-label');
    if (themeGlyph) {
      themeGlyph.textContent = theme === 'dark' ? '☀' : '🌙';
    }
    if (themeLabel) {
      themeLabel.textContent = theme === 'dark' ? 'LIGHT' : 'DARK';
    }

    // Update drawer theme button
    const drawerThemeIcon = document.getElementById('drawer-theme-icon');
    const drawerThemeText = document.getElementById('drawer-theme-text');
    if (drawerThemeIcon) {
      drawerThemeIcon.textContent = theme === 'dark' ? '☀' : '🌙';
    }
    if (drawerThemeText) {
      drawerThemeText.textContent = theme === 'dark' ? 'LIGHT MODE' : 'DARK MODE';
    }
  }

  setupMobileDrawer() {
    const btnMenu = document.getElementById('btn-mobile-menu');
    const drawer = document.getElementById('mobile-nav-drawer');
    const backdrop = document.getElementById('mobile-nav-drawer-backdrop');
    const btnClose = document.getElementById('btn-close-mobile-drawer');

    const openDrawer = () => {
      if (drawer && backdrop) {
        drawer.classList.add('active');
        backdrop.style.display = 'block';
        void backdrop.offsetWidth; // Force reflow
        backdrop.classList.add('active');
        document.body.classList.add('drawer-open');
        drawer.setAttribute('aria-hidden', 'false');
        if (btnMenu) btnMenu.setAttribute('aria-expanded', 'true');
        if (btnClose) btnClose.focus();
        soundEngine.playUiClick();
      }
    };

    const closeDrawer = () => {
      if (drawer && backdrop) {
        drawer.classList.remove('active');
        backdrop.classList.remove('active');
        document.body.classList.remove('drawer-open');
        drawer.setAttribute('aria-hidden', 'true');
        if (btnMenu) {
          btnMenu.setAttribute('aria-expanded', 'false');
          btnMenu.focus();
        }
        setTimeout(() => {
          if (!drawer.classList.contains('active')) {
            backdrop.style.display = 'none';
          }
        }, 280);
      }
    };

    if (btnMenu) {
      btnMenu.addEventListener('click', openDrawer);
    }
    if (btnClose) {
      btnClose.addEventListener('click', closeDrawer);
    }
    if (backdrop) {
      backdrop.addEventListener('click', closeDrawer);
    }

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer && drawer.classList.contains('active')) {
        closeDrawer();
      }
    });

    // Drawer navigation buttons
    document.querySelectorAll('.drawer-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const screenId = btn.getAttribute('data-screen');
        if (screenId) {
          this.showScreen(screenId);
          closeDrawer();
          soundEngine.playUiClick();
        }
      });
    });

    const drawerSearch = document.getElementById('drawer-btn-search');
    if (drawerSearch) {
      drawerSearch.addEventListener('click', () => {
        closeDrawer();
        const searchTrigger = document.getElementById('btn-search-trigger');
        if (searchTrigger) searchTrigger.click();
      });
    }

    const drawerGuide = document.getElementById('drawer-btn-guide');
    if (drawerGuide) {
      drawerGuide.addEventListener('click', () => {
        closeDrawer();
        const guideBtn = document.getElementById('nav-guide-btn');
        if (guideBtn) guideBtn.click();
      });
    }

    const drawerChallenges = document.getElementById('drawer-btn-challenges');
    if (drawerChallenges) {
      drawerChallenges.addEventListener('click', () => {
        closeDrawer();
        const challengesBtn = document.getElementById('nav-challenges');
        if (challengesBtn) challengesBtn.click();
      });
    }

    const drawerFullscreen = document.getElementById('drawer-btn-fullscreen');
    if (drawerFullscreen) {
      drawerFullscreen.addEventListener('click', () => {
        closeDrawer();
        const fullBtn = document.getElementById('btn-toggle-fullscreen');
        if (fullBtn) fullBtn.click();
      });
    }
  }

  setupStickyHeader() {
    const screenContainer = document.getElementById('screen-container');
    const navbar = document.getElementById('navbar');
    if (screenContainer && navbar) {
      screenContainer.addEventListener('scroll', () => {
        if (screenContainer.scrollTop > 10) {
          navbar.classList.add('is-scrolled');
        } else {
          navbar.classList.remove('is-scrolled');
        }
      }, { passive: true });
    }
  }

  captureUtmCampaign() {
    try {
      const params = new URLSearchParams(window.location.search);
      const utmSource = params.get('utm_source');
      const utmMedium = params.get('utm_medium');
      const utmCampaign = params.get('utm_campaign');

      if (utmSource || utmMedium || utmCampaign) {
        const utmData = {
          source: utmSource ? utmSource.substring(0, 50) : null,
          medium: utmMedium ? utmMedium.substring(0, 50) : null,
          campaign: utmCampaign ? utmCampaign.substring(0, 50) : null,
          timestamp: Date.now()
        };
        sessionStorage.setItem('riftborn_utm', JSON.stringify(utmData));

        const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch (_) {}
  }

  updateScreenMetadata(screenId) {
    const metaMap = {
      'screen-home': {
        title: 'RIFTBORN - Original Competitive Fighting Game',
        desc: 'Master fast-paced 2D combat with unique energy cores. Spar vs AI, climb ranked tiers, and unlock fighter masteries.'
      },
      'screen-character-select': {
        title: 'Fighters Roster & Moves | RIFTBORN',
        desc: 'Explore the 6 Riftborn fighters: Vex, Solaris, Lyra, Aeron, Kairo, and Nox. Review ratings, specials, and ultimates.'
      },
      'screen-play': {
        title: 'Select Combat Mode | RIFTBORN',
        desc: 'Choose your arena challenge: Casual Sparring, Ranked 1v1 Season 1, Dojo Training, or Story Chronicles.'
      },
      'screen-ranked-setup': {
        title: 'Competitive Ranked 1v1 Ladder | RIFTBORN',
        desc: 'Review seasonal ladder standings, RP tier progression from Bronze to Diamond, and battleground telemetries.'
      },
      'screen-profile': {
        title: 'Operative Profile & Telemetry | RIFTBORN',
        desc: 'Review combat account level, win rates, character mastery breakdown, and seasonal performance graphs.'
      },
      'screen-story': {
        title: 'Story Mode: Chronicles of the Genesis Breach | RIFTBORN',
        desc: 'Embark on the narrative campaign across Sector 9, face Warden Aeron, and investigate the Crimson Core anomaly.'
      },
      'screen-settings': {
        title: 'System Preferences & Controls | RIFTBORN',
        desc: 'Configure screen shake feedback, SFX and arena music volume, keyboard mappings, and mobile touch HUD.'
      },
      'screen-privacy': {
        title: 'Privacy Policy | RIFTBORN',
        desc: 'Our client-first privacy architecture: zero third-party telemetry, client-side localStorage, and complete user data sovereignty.'
      },
      'screen-terms': {
        title: 'Terms of Service | RIFTBORN',
        desc: 'Terms of use, open-source licensing, fair play standards, and intellectual property attribution for RIFTBORN.'
      },
      'screen-cookies': {
        title: 'Cookie & Storage Notice | RIFTBORN',
        desc: 'Transparency notice regarding browser localStorage usage for offline save progression and preferences.'
      }
    };

    const info = metaMap[screenId] || {
      title: 'RIFTBORN - Original 2D Competitive Combat',
      desc: 'Channel your core in fast-paced futuristic martial combat.'
    };

    document.title = info.title;
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) descMeta.setAttribute('content', info.desc);
  }

  setupScrollProgressAndBackToTop() {
    const screenContainer = document.getElementById('screen-container');
    const progressBar = document.getElementById('scroll-progress-bar');
    const progressContainer = document.getElementById('scroll-progress-container');
    const btnBackToTop = document.getElementById('btn-back-to-top');

    if (!screenContainer) return;

    screenContainer.addEventListener('scroll', () => {
      const scrollTop = screenContainer.scrollTop;
      const maxScroll = screenContainer.scrollHeight - screenContainer.clientHeight;

      if (progressBar && progressContainer) {
        if (maxScroll > 20) {
          progressContainer.style.display = 'block';
          const pct = Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100));
          progressBar.style.width = `${pct}%`;
        } else {
          progressContainer.style.display = 'none';
        }
      }

      if (btnBackToTop) {
        if (scrollTop > 280) {
          btnBackToTop.classList.add('visible');
        } else {
          btnBackToTop.classList.remove('visible');
        }
      }
    }, { passive: true });

    if (btnBackToTop) {
      btnBackToTop.addEventListener('click', () => {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        screenContainer.scrollTo({
          top: 0,
          behavior: prefersReduced ? 'auto' : 'smooth'
        });
        soundEngine.playUiClick();
      });
    }
  }

  showConfirmation({ title, message, onConfirm }) {
    const modal = document.getElementById('modal-confirm-dialog');
    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-modal-message');
    const btnCancel = document.getElementById('btn-confirm-cancel');
    const btnProceed = document.getElementById('btn-confirm-proceed');

    if (!modal) {
      if (confirm(message)) onConfirm();
      return;
    }

    if (titleEl) titleEl.textContent = title || 'CONFIRM ACTION';
    if (msgEl) msgEl.textContent = message || 'Are you sure you want to proceed?';

    modal.style.display = 'flex';
    modal.classList.add('active');

    const cleanup = () => {
      modal.style.display = 'none';
      modal.classList.remove('active');
      btnProceed.onclick = null;
      btnCancel.onclick = null;
    };

    btnCancel.onclick = () => {
      cleanup();
      soundEngine.playUiClick();
    };

    btnProceed.onclick = () => {
      cleanup();
      soundEngine.playUiClick();
      if (typeof onConfirm === 'function') onConfirm();
    };
  }

  showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ';
    const iconSpan = document.createElement('span');
    iconSpan.setAttribute('aria-hidden', 'true');
    iconSpan.style.fontWeight = '700';
    iconSpan.textContent = icon;
    const msgSpan = document.createElement('span');
    msgSpan.textContent = String(message);
    toast.appendChild(iconSpan);
    toast.appendChild(msgSpan);
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 200);
    }, duration);
  }

  setupSiteSearch() {
    const modal = document.getElementById('modal-site-search');
    const input = document.getElementById('site-search-input');
    const resultsContainer = document.getElementById('site-search-results');
    const btnClose = document.getElementById('btn-close-search');
    const trigger = document.getElementById('btn-search-trigger');

    if (!modal || !input) return;

    const searchIndex = [
      { id: 'f_vex', title: 'Vex — The Rift Vanguard', category: 'Fighter', desc: 'Balanced fighter channeling Crimson Core. Abilities: Crimson Dash, Rift Slash, Rift Breaker.', screen: 'screen-character-select', charId: 'vex' },
      { id: 'f_solaris', title: 'Solaris — Radiant Juggernaut', category: 'Fighter', desc: 'Heavy brawler with Gold Core. High armor, Solar Nova, Radiant Pillar, Supernova Ignition.', screen: 'screen-character-select', charId: 'solaris' },
      { id: 'f_lyra', title: 'Lyra — Phantom Weave', category: 'Fighter', desc: 'Speed assassin wielding Rose Core. High mobility, Phantom Blink, Rose Mirage, Dimensional Execution.', screen: 'screen-character-select', charId: 'lyra' },
      { id: 'f_aeron', title: 'Aeron — Warden of the Deep', category: 'Fighter', desc: 'Azure Core zoning master. Projectile pressure with Azure Lance, Deep Tide, and Absolute Deluge.', screen: 'screen-character-select', charId: 'aeron' },
      { id: 'f_kairo', title: 'Kairo — Verdant Chronomancer', category: 'Fighter', desc: 'Emerald Core tactician. Manipulates flow of combat with Verdant Snare and Chrono Rift.', screen: 'screen-character-select', charId: 'kairo' },
      { id: 'f_nox', title: 'Nox — Shadow Reaver', category: 'Fighter', desc: 'Violet Core shadow counter-brawler. High burst counters with Umbral Strike and Oblivion Void.', screen: 'screen-character-select', charId: 'nox' },
      { id: 'm_casual', title: 'Casual 1v1 Sparring', category: 'Game Mode', desc: 'Offline skirmishes against configurable Easy, Normal, or Hard AI bots.', screen: 'screen-casual-setup' },
      { id: 'm_ranked', title: 'Ranked 1v1 Season Ladder', category: 'Game Mode', desc: 'Competitive matchmaking ladder with Bronze to Diamond Elo RP divisions.', screen: 'screen-ranked-setup' },
      { id: 'm_dojo', title: 'Dojo Training Mode', category: 'Game Mode', desc: 'Practice combos with telemetry, damage meters, and position reset.', screen: 'screen-character-select' },
      { id: 'm_story', title: 'Story Mode Chronicles', category: 'Game Mode', desc: 'Narrative campaign through Sector 9, Boss Aeron, and Genesis Rift breach.', screen: 'screen-story' },
      { id: 'g_parry', title: 'Kinetic Block & Perfect Parry', category: 'Combat Mechanics', desc: 'Mitigate 85% damage or tap H right before impact for a frame-advantage stun counter.', action: () => this.openMoveListGuide('controls') },
      { id: 'g_combos', title: 'Signature Combo Routes', category: 'Combat Mechanics', desc: 'Learn cancel chains from Light attack into Heavy Launcher and Air Juggle.', action: () => this.openMoveListGuide('combos') },
      { id: 'g_touch', title: 'Mobile Touch Controls Customizer', category: 'Settings', desc: 'Configure joystick placement, button scaling, and opacity for mobile screens.', action: () => { const m = document.getElementById('modal-touch-customizer'); if (m) m.classList.add('active'); } },
      { id: 'g_faq', title: 'Gameplay FAQ', category: 'Guide', desc: 'Frequently asked questions regarding combat mechanics, local storage, and controls.', action: () => this.openMoveListGuide('faq') },
      { id: 's_audio', title: 'Audio & Music Settings', category: 'Settings', desc: 'Adjust volume sliders for synthesized SFX strikes and arena background themes.', screen: 'screen-settings' },
      { id: 's_keys', title: 'Keyboard Controls Protocol', category: 'Settings', desc: 'View keyboard bindings: WASD movement, J Light, K Heavy, L Special, I Ultimate, Space Dodge.', screen: 'screen-settings' },
      { id: 's_profile', title: 'Operative Profile & Telemetry', category: 'Dossier', desc: 'Account level, win rate, character mastery breakdown, and rank milestones.', screen: 'screen-profile' },
      { id: 's_challenges', title: 'Bounties & Challenges Hub', category: 'Progression', desc: 'Daily and weekly combat missions to earn Rift Shards and cosmetic XP.', action: () => { const m = document.getElementById('modal-challenges-hub'); if (m) m.classList.add('active'); } },
      { id: 'l_privacy', title: 'Privacy Policy', category: 'Legal', desc: 'Detailed data governance disclosure. Zero external tracking; client-side localStorage only.', screen: 'screen-privacy' },
      { id: 'l_terms', title: 'Terms of Service', category: 'Legal', desc: 'Fair play agreement, acceptable use, intellectual property, and warranty disclaimers.', screen: 'screen-terms' },
      { id: 'l_cookies', title: 'Cookie & Storage Notice', category: 'Legal', desc: 'Technical explanation of localStorage usage and one-click data purge tool.', screen: 'screen-cookies' }
    ];

    const openSearch = () => {
      modal.style.display = 'flex';
      modal.classList.add('active');
      input.value = '';
      renderResults(searchIndex);
      input.focus();
      soundEngine.playUiClick();
    };

    const closeSearch = () => {
      modal.style.display = 'none';
      modal.classList.remove('active');
    };

    let selectedIdx = 0;
    let currentResults = searchIndex;

    const renderResults = (items) => {
      currentResults = items;
      selectedIdx = 0;
      resultsContainer.innerHTML = '';

      if (items.length === 0) {
        resultsContainer.innerHTML = `<div class="search-empty-notice">No tactical records matching query.</div>`;
        return;
      }

      items.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = `search-result-item ${idx === 0 ? 'selected' : ''}`;
        row.setAttribute('role', 'option');
        row.innerHTML = `
          <div class="search-res-info">
            <span class="search-res-title">${item.title}</span>
            <span class="search-res-desc">${item.desc}</span>
          </div>
          <span class="search-res-badge">${item.category}</span>
        `;
        row.onclick = () => selectItem(item);
        resultsContainer.appendChild(row);
      });
    };

    const selectItem = (item) => {
      closeSearch();
      if (item.action) {
        item.action();
      } else if (item.screen) {
        this.showScreen(item.screen);
        if (item.charId) {
          this.selectCharacterForSelect(item.charId);
        }
      }
      soundEngine.playUiClick();
    };

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (!q) {
        renderResults(searchIndex);
        return;
      }
      const filtered = searchIndex.filter(i => 
        i.title.toLowerCase().includes(q) || 
        i.desc.toLowerCase().includes(q) || 
        i.category.toLowerCase().includes(q)
      );
      renderResults(filtered);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentResults.length > 0) {
          selectedIdx = (selectedIdx + 1) % currentResults.length;
          updateSelected();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentResults.length > 0) {
          selectedIdx = (selectedIdx - 1 + currentResults.length) % currentResults.length;
          updateSelected();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentResults[selectedIdx]) {
          selectItem(currentResults[selectedIdx]);
        }
      } else if (e.key === 'Escape') {
        closeSearch();
      }
    });

    const updateSelected = () => {
      const rows = resultsContainer.querySelectorAll('.search-result-item');
      rows.forEach((r, idx) => {
        r.classList.toggle('selected', idx === selectedIdx);
        if (idx === selectedIdx) r.scrollIntoView({ block: 'nearest' });
      });
    };

    if (trigger) trigger.addEventListener('click', openSearch);
    if (btnClose) btnClose.addEventListener('click', closeSearch);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeSearch();
    });

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (modal.classList.contains('active')) {
          closeSearch();
        } else {
          openSearch();
        }
      }
    });
  }

  setupCopyButtons() {
    const btnCopy = document.getElementById('btn-copy-player-id');
    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const username = document.getElementById('profile-username-big')?.textContent || 'RiftOperative';
        const tag = `${username}#7701`;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(tag);
          } else {
            const input = document.createElement('input');
            input.value = tag;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
          }

          const icon = document.getElementById('copy-btn-icon');
          const text = document.getElementById('copy-btn-text');
          if (icon) icon.textContent = '✓';
          if (text) text.textContent = 'COPIED!';
          this.showToast(`Operative Tag "${tag}" copied to clipboard!`, 'success');
          soundEngine.playUiClick();

          setTimeout(() => {
            if (icon) icon.textContent = '📋';
            if (text) text.textContent = 'COPY TAG';
          }, 2000);
        } catch (e) {
          this.showToast('Could not access clipboard: ' + e.message, 'error');
        }
      });
    }
  }

  setupCookieConsent() {
    const banner = document.getElementById('cookie-consent-banner');
    const btnAccept = document.getElementById('btn-cookie-accept');
    const btnManage = document.getElementById('btn-cookie-manage');

    if (!banner) return;

    const consent = localStorage.getItem('riftborn_consent');
    if (!consent) {
      banner.style.display = 'block';
    }

    if (btnAccept) {
      btnAccept.addEventListener('click', () => {
        localStorage.setItem('riftborn_consent', 'acknowledged');
        banner.style.display = 'none';
        this.showToast('Privacy & storage preferences recorded.', 'success');
        soundEngine.playUiClick();
      });
    }

    if (btnManage) {
      btnManage.addEventListener('click', () => {
        banner.style.display = 'none';
        this.showScreen('screen-cookies');
        soundEngine.playUiClick();
      });
    }
  }

  setupFooterAndLegal() {
    document.querySelectorAll('.footer-nav-btn[data-screen]').forEach(btn => {
      btn.addEventListener('click', () => {
        const sId = btn.getAttribute('data-screen');
        if (sId) {
          this.showScreen(sId);
          soundEngine.playUiClick();
        }
      });
    });

    const fGuide = document.getElementById('footer-btn-guide');
    if (fGuide) {
      fGuide.addEventListener('click', () => this.openMoveListGuide('controls'));
    }

    const fFaq = document.getElementById('footer-btn-faq');
    if (fFaq) {
      fFaq.addEventListener('click', () => this.openMoveListGuide('faq'));
    }

    const fManage = document.getElementById('footer-btn-manage-storage');
    if (fManage) {
      fManage.addEventListener('click', () => {
        this.showScreen('screen-cookies');
        soundEngine.playUiClick();
      });
    }

    const btnExport = document.getElementById('btn-privacy-export-data');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        try {
          const raw = localStorage.getItem('riftborn_save_data') || '{}';
          const blob = new Blob([raw], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `riftborn_backup_${Date.now()}.json`;
          a.click();
          URL.revokeObjectURL(url);
          this.showToast('Save data exported successfully.', 'success');
        } catch (e) {
          this.showToast('Export failed: ' + e.message, 'error');
        }
      });
    }

    const handleResetData = () => {
      this.showConfirmation({
        title: 'PURGE ALL LOCAL GAME DATA?',
        message: 'This will reset your character unlocks, operative level, cosmetic Shards, and custom touch controls back to initial state. This action cannot be undone.',
        onConfirm: () => {
          localStorage.removeItem('riftborn_save_data');
          localStorage.removeItem('riftborn_touch_config');
          localStorage.removeItem('riftborn_tutorial_completed');
          this.showToast('Local data purged. Reloading fresh state...', 'info');
          setTimeout(() => window.location.reload(), 1000);
        }
      });
    };

    const btnPrivReset = document.getElementById('btn-privacy-reset-data');
    if (btnPrivReset) btnPrivReset.addEventListener('click', handleResetData);

    const btnCookiesClear = document.getElementById('btn-cookies-clear-storage');
    if (btnCookiesClear) btnCookiesClear.addEventListener('click', handleResetData);

    const yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  setupNavigation() {
    // Nav bar buttons (Desktop)
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const screenId = btn.getAttribute('data-screen');
        if (screenId) {
          this.showScreen(screenId);
          soundEngine.playUiClick();
        }
      });
    });

    // Mobile Bottom Nav buttons
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const screenId = btn.getAttribute('data-screen');
        if (screenId) {
          this.showScreen(screenId);
          soundEngine.playUiClick();
        }
      });
    });

    document.getElementById('btn-nav-brand').addEventListener('click', () => {
      this.showScreen('screen-home');
    });

    document.getElementById('nav-profile-pill').addEventListener('click', () => {
      this.showScreen('screen-profile');
      this.renderProfile();
    });

    // Top Navigation Settings button (Gear Icon)
    const navSettings = document.getElementById('nav-settings');
    if (navSettings) {
      navSettings.addEventListener('click', () => {
        this.showScreen('screen-settings');
        soundEngine.playUiClick();
      });
    }

    // Settings Screen Back Button
    const btnSettingsBack = document.getElementById('btn-settings-back');
    if (btnSettingsBack) {
      btnSettingsBack.addEventListener('click', () => {
        this.showScreen('screen-home');
        soundEngine.playUiClick();
      });
    }

    // Pause Modal Settings Button
    const btnPauseSettings = document.getElementById('btn-pause-settings');
    if (btnPauseSettings) {
      btnPauseSettings.addEventListener('click', () => {
        const pauseModal = document.getElementById('modal-combat-pause');
        if (pauseModal) pauseModal.style.display = 'none';
        document.getElementById('game-view').style.display = 'none';
        this.showScreen('screen-settings');
        soundEngine.playUiClick();
      });
    }

    // Home Screen PLAY NOW: Instant Match with Current Featured Fighter vs Random Rival
    const quickStartBtn = document.getElementById('btn-quick-start-fight');
    if (quickStartBtn) {
      quickStartBtn.addEventListener('click', () => {
        const p1Id = progressionManager.getMainCharacter() || this.homeRoster[this.homeShowcaseCharIndex] || 'vex';
        const p2Id = this.getRandomOpponent(p1Id);
        soundEngine.playUiClick();

        if (this.currentMatchMode === 'ranked') {
          const currentRank = progressionManager.getCurrentRankInfo();
          const diff = competitiveNetworkCoordinator?.localProvider?.getRankCalibratedBotDifficulty?.(currentRank.tier) || 'WARRIOR';
          this.launchMatchWithTransition(p1Id, p2Id, 'neon_metro', diff, 'Ranked');
        } else {
          this.launchMatchWithTransition(p1Id, p2Id, 'neon_metro', 'WARRIOR', 'Casual');
        }
      });
    }

    // AI Difficulty Selectors
    const diffDescEl = document.getElementById('diff-desc-text');
    const diffButtons = document.querySelectorAll('.btn-diff-select');
    diffButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        diffButtons.forEach(b => {
          b.classList.remove('active');
          b.style.borderColor = '';
          b.style.color = '';
        });
        btn.classList.add('active');
        btn.style.borderColor = 'var(--accent-cyan)';
        btn.style.color = 'var(--accent-cyan)';
        this.selectedDifficulty = btn.getAttribute('data-diff');

        if (diffDescEl) {
          if (this.selectedDifficulty === 'EASY') {
            diffDescEl.textContent = 'Relaxed sparring: makes spacing mistakes, drops guard, slow reactions (~400ms).';
          } else if (this.selectedDifficulty === 'HARD') {
            diffDescEl.textContent = 'High skill: whiff punisher, fast reactions (~100ms), counter parries & air juggles.';
          } else {
            diffDescEl.textContent = 'Balanced challenge: uses combos, spaces katana strikes, reacts with defense (~215ms).';
          }
        }
        soundEngine.playUiClick();
      });
    });

    // Home CTA buttons (fallback if present)
    const homeBtnPlay = document.getElementById('home-btn-play');
    if (homeBtnPlay) {
      homeBtnPlay.addEventListener('click', () => {
        this.showScreen('screen-character-select');
        soundEngine.playUiClick();
      });
    }

    // Mode Card Casual -> Lead to Casual Match Setup
    const casualModeCard = document.getElementById('mode-card-casual');
    if (casualModeCard) {
      casualModeCard.addEventListener('click', () => {
        this.showScreen('screen-casual-setup');
        soundEngine.playUiClick();
      });
    }

    // Mode Card Ranked -> Lead to Ranked 1v1 Competitive Setup
    const rankedModeCard = document.getElementById('mode-card-ranked');
    if (rankedModeCard) {
      rankedModeCard.addEventListener('click', () => {
        this.showScreen('screen-ranked-setup');
        soundEngine.playUiClick();
      });
    }

    // Home Screen Fighter Switcher & Intel Navigators
    const btnHomePrev = document.getElementById('btn-home-prev-fighter');
    if (btnHomePrev) {
      btnHomePrev.addEventListener('click', () => {
        this.cycleHomeHero(-1);
        soundEngine.playUiClick();
      });
    }

    const btnHomeNext = document.getElementById('btn-home-next-fighter');
    if (btnHomeNext) {
      btnHomeNext.addEventListener('click', () => {
        this.cycleHomeHero(1);
        soundEngine.playUiClick();
      });
    }

    const btnHomeView = document.getElementById('btn-home-view-fighter');
    if (btnHomeView) {
      btnHomeView.addEventListener('click', () => {
        const charId = this.homeRoster[this.homeShowcaseCharIndex] || 'vex';
        this.selectedSelectCharId = charId;
        this.showScreen('screen-character-select');
        soundEngine.playUiClick();
      });
    }

    const btnHomeChal = document.getElementById('btn-home-open-challenges');
    if (btnHomeChal) {
      btnHomeChal.addEventListener('click', () => {
        const hubModal = document.getElementById('modal-challenges-hub');
        if (hubModal) {
          hubModal.classList.add('active');
          this.renderChallengesHub('daily');
          soundEngine.playUiClick();
        }
      });
    }

    const btnHomeRank = document.getElementById('btn-home-open-ranked');
    if (btnHomeRank) {
      btnHomeRank.addEventListener('click', () => {
        this.showScreen('screen-ranked-setup');
        soundEngine.playUiClick();
      });
    }

    const btnHomeProf = document.getElementById('btn-home-open-profile');
    if (btnHomeProf) {
      btnHomeProf.addEventListener('click', () => {
        this.showScreen('screen-profile');
        this.renderProfile();
        soundEngine.playUiClick();
      });
    }

    // Quick Mode Sparring Buttons
    const qmRanked = document.getElementById('btn-quick-mode-ranked');
    if (qmRanked) {
      qmRanked.addEventListener('click', () => {
        this.showScreen('screen-ranked-setup');
        soundEngine.playUiClick();
      });
    }

    const qmCasual = document.getElementById('btn-quick-mode-casual');
    if (qmCasual) {
      qmCasual.addEventListener('click', () => {
        this.showScreen('screen-casual-setup');
        soundEngine.playUiClick();
      });
    }

    const qmDojo = document.getElementById('btn-quick-mode-dojo');
    if (qmDojo) {
      qmDojo.addEventListener('click', () => {
        this.showScreen('screen-character-select');
        soundEngine.playUiClick();
      });
    }

    const qmStory = document.getElementById('btn-quick-mode-story');
    if (qmStory) {
      qmStory.addEventListener('click', () => {
        this.showScreen('screen-story');
        soundEngine.playUiClick();
      });
    }


    // In-game Pause & Exit buttons
    const btnHudPause = document.getElementById('btn-hud-pause');
    if (btnHudPause) {
      btnHudPause.addEventListener('click', () => {
        this.togglePause();
        soundEngine.playUiClick();
      });
    }

    const btnPauseResume = document.getElementById('btn-pause-resume');
    if (btnPauseResume) {
      btnPauseResume.addEventListener('click', () => {
        this.togglePause();
        soundEngine.playUiClick();
      });
    }

    const btnPauseRestart = document.getElementById('btn-pause-restart');
    if (btnPauseRestart) {
      btnPauseRestart.addEventListener('click', () => {
        if (this.engine) this.engine.isPaused = false;
        const pauseModal = document.getElementById('modal-combat-pause');
        if (pauseModal) pauseModal.style.display = 'none';
        const p1Id = this.engine.p1 ? this.engine.p1.charId : 'vex';
        const p2Id = this.getRandomOpponent(p1Id);
        const arena = this.engine.arenaConfig ? this.engine.arenaConfig.id : 'neon_metro';
        this.launchMatch(p1Id, p2Id, arena, this.selectedDifficulty);
        soundEngine.playUiClick();
      });
    }

    const btnPauseQuit = document.getElementById('btn-pause-quit');
    if (btnPauseQuit) {
      btnPauseQuit.addEventListener('click', () => {
        if (this.engine) {
          this.engine.isPaused = false;
          this.engine.stopLoop();
        }
        const pauseModal = document.getElementById('modal-combat-pause');
        if (pauseModal) pauseModal.style.display = 'none';
        document.getElementById('game-view').style.display = 'none';
        this.showScreen('screen-home');
        soundEngine.playUiClick();
      });
    }

    const btnQuitMatch = document.getElementById('btn-quit-match');
    if (btnQuitMatch) {
      btnQuitMatch.addEventListener('click', () => {
        if (this.engine) {
          this.engine.isPaused = false;
          this.engine.stopLoop();
        }
        document.getElementById('game-view').style.display = 'none';
        this.showScreen('screen-home');
        soundEngine.playUiClick();
      });
    }

    // Results Modal Buttons
    const btnResultsMenu = document.getElementById('btn-results-menu');
    if (btnResultsMenu) {
      btnResultsMenu.addEventListener('click', () => {
        document.getElementById('modal-match-results').classList.remove('active');
        document.getElementById('game-view').style.display = 'none';
        this.showScreen('screen-home');
        soundEngine.playUiClick();
      });
    }

    const btnProgResults = document.getElementById('btn-results-progression');
    if (btnProgResults) {
      btnProgResults.addEventListener('click', () => {
        document.getElementById('modal-match-results').classList.remove('active');
        document.getElementById('game-view').style.display = 'none';
        const p1Id = this.engine.p1 ? this.engine.p1.charId : 'vex';
        this.selectedProgCharId = p1Id;
        this.renderProgression(p1Id);
        this.showScreen('screen-progression');
        soundEngine.playUiClick();
      });
    }

    const btnResultsRematch = document.getElementById('btn-results-rematch');
    if (btnResultsRematch) {
      btnResultsRematch.addEventListener('click', () => {
        document.getElementById('modal-match-results').classList.remove('active');
        const p1Id = this.engine.p1 ? this.engine.p1.charId : 'vex';
        const p2Id = this.getRandomOpponent(p1Id);
        const arena = this.engine.arenaConfig ? this.engine.arenaConfig.id : 'neon_metro';
        this.launchMatch(p1Id, p2Id, arena, this.selectedDifficulty);
        soundEngine.playUiClick();
      });
    }

    const btnResultsChal = document.getElementById('btn-results-challenges-btn');
    if (btnResultsChal) {
      btnResultsChal.addEventListener('click', () => {
        const hubModal = document.getElementById('modal-challenges-hub');
        if (hubModal) {
          hubModal.classList.add('active');
          this.renderChallengesHub('daily');
          soundEngine.playUiClick();
        }
      });
    }

    const btnResultsOpenChal = document.getElementById('btn-results-open-challenges');
    if (btnResultsOpenChal) {
      btnResultsOpenChal.addEventListener('click', () => {
        const hubModal = document.getElementById('modal-challenges-hub');
        if (hubModal) {
          hubModal.classList.add('active');
          this.renderChallengesHub('daily');
          soundEngine.playUiClick();
        }
      });
    }

    const navChalBtn = document.getElementById('nav-challenges');
    if (navChalBtn) {
      navChalBtn.addEventListener('click', () => {
        const hubModal = document.getElementById('modal-challenges-hub');
        if (hubModal) {
          hubModal.classList.add('active');
          this.renderChallengesHub('daily');
          soundEngine.playUiClick();
        }
      });
    }

    const btnCloseHub = document.getElementById('btn-close-challenges-hub');
    if (btnCloseHub) {
      btnCloseHub.addEventListener('click', () => {
        const hubModal = document.getElementById('modal-challenges-hub');
        if (hubModal) {
          hubModal.classList.remove('active');
          soundEngine.playUiClick();
        }
      });
    }
  }

  // --- LOBBY MODE SELECTOR & SHORTCUTS (FREE FIRE / BGMI STYLE) ---
  setupLobbyModeSelector() {
    const btnCasual = document.getElementById('btn-lobby-mode-casual');
    const btnRanked = document.getElementById('btn-lobby-mode-ranked');

    if (btnCasual) {
      btnCasual.addEventListener('click', () => {
        this.currentMatchMode = 'casual';
        try { localStorage.setItem('riftborn_selected_mode', 'casual'); } catch (_) {}
        this.updateLobbyModeUI();
        soundEngine.playUiClick();
      });
    }

    if (btnRanked) {
      btnRanked.addEventListener('click', () => {
        this.currentMatchMode = 'ranked';
        try { localStorage.setItem('riftborn_selected_mode', 'ranked'); } catch (_) {}
        this.updateLobbyModeUI();
        soundEngine.playUiClick();
      });
    }

    // Missions hub shortcuts (desktop nav button, mobile bottom bar, home lobby widget)
    const openMissions = () => {
      const hubModal = document.getElementById('modal-challenges-hub');
      if (hubModal) {
        hubModal.classList.add('active');
        this.renderChallengesHub('daily');
        soundEngine.playUiClick();
      }
    };

    const navMissionsBtn = document.getElementById('nav-missions-btn');
    if (navMissionsBtn) navMissionsBtn.addEventListener('click', openMissions);

    const mobileNavMissions = document.getElementById('mobile-nav-missions');
    if (mobileNavMissions) mobileNavMissions.addEventListener('click', openMissions);

    const homeModuleChal = document.getElementById('home-module-challenge');
    if (homeModuleChal) homeModuleChal.addEventListener('click', openMissions);

    // Rank screen shortcuts
    const homeModuleRank = document.getElementById('home-module-rank');
    if (homeModuleRank) {
      homeModuleRank.addEventListener('click', () => {
        this.showScreen('screen-ranked-setup');
        soundEngine.playUiClick();
      });
    }

    this.updateLobbyModeUI();
  }

  updateLobbyModeUI() {
    const btnCasual = document.getElementById('btn-lobby-mode-casual');
    const btnRanked = document.getElementById('btn-lobby-mode-ranked');
    const caption = document.getElementById('lobby-play-mode-caption');

    if (this.currentMatchMode === 'ranked') {
      if (btnCasual) btnCasual.classList.remove('active');
      if (btnRanked) btnRanked.classList.add('active');
      if (caption) caption.textContent = 'RANKED 1V1 COMPETITIVE';
    } else {
      if (btnCasual) btnCasual.classList.add('active');
      if (btnRanked) btnRanked.classList.remove('active');
      if (caption) caption.textContent = 'CASUAL 1V1 MATCH';
    }
  }

  // --- BATTLE MODES SELECTOR (2-COLUMN) ---
  setupModeSelector() {
    const modesData = {
      casual: {
        badge: 'SPARRING PROTOCOL',
        diff: 'DIFFICULTY: FLEXIBLE',
        diffVal: 'Recruit to Godlike',
        title: 'CASUAL 1V1',
        desc: 'Select any warrior and arena. Battle against adaptive combat AI or challenge a rival on local split keyboard.',
        format: 'Best of 3 Rounds',
        reward: '+150 XP • +100 COINS',
        btnSub: 'CASUAL SPARRING [ENTER]',
        action: () => this.showScreen('screen-casual-setup')
      },
      ranked: {
        badge: 'COMPETITIVE LADDER',
        diff: 'DIFFICULTY: COMPETITIVE',
        diffVal: 'MMR Matched',
        title: 'RANKED 1V1',
        desc: 'Fight for glory across 7 competitive ranks from Bronze to Rift Champion. Win streaks earn promotion bonuses.',
        format: 'Best of 3 Rounds • MMR Bot',
        reward: '+250 XP • RP RATING',
        btnSub: 'ENTER RANKED DUEL [ENTER]',
        action: () => this.showScreen('screen-ranked-setup')
      },
      story: {
        badge: 'CINEMATIC CAMPAIGN',
        diff: 'DIFFICULTY: NARRATIVE',
        diffVal: 'Episode Progression',
        title: 'STORY CAMPAIGN',
        desc: '6 cinematic narrative chapters. Unravel the mystery of the Genesis Rift and stop the rogue singularity Aethel.',
        format: '5 Story Chapters & Codex',
        reward: '+500 XP • LORE LOGS',
        btnSub: 'CHRONICLES CAMPAIGN [ENTER]',
        action: () => this.showScreen('screen-story')
      },
      survival: {
        badge: 'ENDURANCE PROTOCOL',
        diff: 'DIFFICULTY: HARD',
        diffVal: 'Endless Wave Escalation',
        title: 'SURVIVAL MODE',
        desc: 'Endure continuous waves of Void entities with persistent vitality. Draft kinetic buffs and health perks between waves.',
        format: 'Endless Void Waves',
        reward: '+350 XP • VOID SHARDS',
        btnSub: 'DEFY THE VOID [ENTER]',
        action: () => this.showScreen('screen-character-select')
      },
      bossrush: {
        badge: 'TITAN ENCOUNTER',
        diff: 'DIFFICULTY: EXTREME',
        diffVal: 'Multi-Phase Megabosses',
        title: 'BOSS RUSH',
        desc: 'Face empowered Rift Titans with multiple combat phases, enrage timers, and high-frequency energy barrages.',
        format: 'Consecutive Titans',
        reward: '+600 XP • TITAN CORE',
        btnSub: 'CONFRONT TITANS [ENTER]',
        action: () => this.showScreen('screen-character-select')
      },
      training: {
        badge: 'COMBAT LAB',
        diff: 'DIFFICULTY: PRACTICE',
        diffVal: 'Configurable Dummy AI',
        title: 'TRAINING ARENA',
        desc: 'Refine your combo strings, study frame advantage, inspect real-time hitboxes/hurtboxes, and configure dummy AI actions.',
        format: 'Infinite Health & Frame Data',
        reward: 'PRACTICE PROTOCOL',
        btnSub: 'ENTER LAB [ENTER]',
        action: () => this.showScreen('screen-character-select')
      }
    };

    let selectedMode = 'casual';

    const modeItems = document.querySelectorAll('.mode-nav-item');
    modeItems.forEach(item => {
      item.addEventListener('click', () => {
        const mode = item.getAttribute('data-mode') || 'casual';
        selectedMode = mode;
        modeItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        const info = modesData[mode];
        if (info) {
          const badgeEl = document.getElementById('play-briefing-badge');
          const diffEl = document.getElementById('play-briefing-diff');
          const diffValEl = document.getElementById('play-briefing-diff-val');
          const titleEl = document.getElementById('play-briefing-title');
          const descEl = document.getElementById('play-briefing-desc');
          const formatEl = document.getElementById('play-briefing-format');
          const rewardEl = document.getElementById('play-briefing-reward');
          const btnSubEl = document.getElementById('play-briefing-btn-sub');

          if (badgeEl) badgeEl.textContent = info.badge;
          if (diffEl) diffEl.textContent = info.diff;
          if (diffValEl) diffValEl.textContent = info.diffVal;
          if (titleEl) titleEl.textContent = info.title;
          if (descEl) descEl.textContent = info.desc;
          if (formatEl) formatEl.textContent = info.format;
          if (rewardEl) rewardEl.textContent = info.reward;
          if (btnSubEl) btnSubEl.textContent = info.btnSub;
        }
        soundEngine.playUiClick();
      });
    });

    const btnStartSelected = document.getElementById('btn-play-start-selected-mode');
    if (btnStartSelected) {
      btnStartSelected.addEventListener('click', () => {
        const info = modesData[selectedMode];
        if (info && info.action) {
          info.action();
        } else {
          this.showScreen('screen-character-select');
        }
        soundEngine.playUiClick();
      });
    }
  }

  // --- GENERAL MATCH LAUNCHER ---
  launchMatch(p1Id, p2Id, arenaId, diff, mode = 'Casual') {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    this.stopPreviewLoop();
    this.engine.isLocal2Player = (diff === 'LOCAL_2P');
    this.selectedDifficulty = diff;
    this.showGameView();
    this.engine.initMatch(p1Id, p2Id, arenaId, mode, diff === 'LOCAL_2P' ? 'WARRIOR' : diff);

    // Dynamic HUD Controls Bar Labels
    const p1Data = CHARACTERS[p1Id] || CHARACTERS.vex;
    const p2Data = CHARACTERS[p2Id] || CHARACTERS.vex;

    const sp1El = document.getElementById('hud-ctrl-sp1');
    const sp2El = document.getElementById('hud-ctrl-sp2');
    const ultEl = document.getElementById('hud-ctrl-ult');
    if (sp1El && p1Data.abilities[0]) sp1El.textContent = p1Data.abilities[0].name;
    if (sp2El && p1Data.abilities[1]) sp2El.textContent = p1Data.abilities[1].name;
    if (ultEl && p1Data.abilities[2]) ultEl.textContent = p1Data.abilities[2].name;

    // Dynamic HUD Avatars
    const p1Av = document.querySelector('.hud-avatar-icon.p1');
    if (p1Av) {
      p1Av.textContent = p1Data.name.charAt(0);
      p1Av.style.borderColor = p1Data.coreColor;
      p1Av.style.color = p1Data.coreColor;
      p1Av.style.background = `${p1Data.coreColor}22`;
    }
    const p2Av = document.querySelector('.hud-avatar-icon.p2');
    if (p2Av) {
      p2Av.textContent = p2Data.name.charAt(0);
      p2Av.style.borderColor = p2Data.coreColor;
      p2Av.style.color = p2Data.coreColor;
      p2Av.style.background = `${p2Data.coreColor}22`;
    }

    this.engine.startLoop();
  }

  updateUserDisplay() {
    const prof = progressionManager.data.profile;
    const ranked = progressionManager.data.ranked;
    const rankInfo = CompetitiveRankEngine.getRankFromRp(ranked.rp);

    document.getElementById('nav-shards-display').textContent = prof.shards.toLocaleString();
    document.getElementById('nav-prisms-display').textContent = prof.corePrisms.toLocaleString();
    document.getElementById('nav-username').textContent = prof.username;
    
    const navBadge = document.getElementById('nav-rank-badge');
    if (navBadge) {
      navBadge.textContent = rankInfo.formattedName;
      navBadge.style.color = rankInfo.color;
    }

    const curMain = progressionManager.getMainCharacter();
    document.getElementById('nav-avatar').textContent = curMain.charAt(0).toUpperCase();

    // Check claimable challenges notification badge
    const chData = progressionManager.getChallenges();
    const allCh = [...(chData.daily || []), ...(chData.weekly || [])];
    const hasClaimable = allCh.some(c => c.completed && !c.claimed);
    const chalBadge = document.getElementById('nav-challenges-badge');
    if (chalBadge) chalBadge.style.display = hasClaimable ? 'inline-block' : 'none';

    // Home widgets
    const widgetRankTitle = document.getElementById('widget-rank-title');
    if (widgetRankTitle) widgetRankTitle.textContent = `${rankInfo.tier} Division ${rankInfo.division}`;
    const widgetRpText = document.getElementById('widget-rp-text');
    if (widgetRpText) widgetRpText.textContent = `${rankInfo.divisionRp} / 100 RP in Season ${ranked.season}`;
  }

  // --- HOME SCREEN HERO RENDERING & INTERACTIVE STAGE ---
  renderHomeHero() {
    // If not set yet, sync with current main character
    const mainId = progressionManager.getMainCharacter() || 'vex';
    const mainIdx = this.homeRoster.indexOf(mainId);
    if (this.homeShowcaseCharIndex === undefined || this.homeShowcaseCharIndex === null) {
      this.homeShowcaseCharIndex = mainIdx >= 0 ? mainIdx : 0;
    }
    this.updateHomeHeroDisplay();
    this.updateHomeIntelTelemetry();
  }

  cycleHomeHero(delta) {
    const len = this.homeRoster.length;
    this.homeShowcaseCharIndex = (this.homeShowcaseCharIndex + delta + len) % len;
    this.updateHomeHeroDisplay();
  }

  updateHomeHeroDisplay() {
    const charId = this.homeRoster[this.homeShowcaseCharIndex] || 'vex';
    const c = CHARACTERS[charId] || CHARACTERS.vex;
    const pData = progressionManager.getCharacterProgression(charId);

    const titleEl = document.getElementById('home-hero-title');
    if (titleEl) {
      titleEl.textContent = c.name;
      titleEl.style.color = c.coreColor;
    }

    const subEl = document.getElementById('home-hero-sub');
    if (subEl) subEl.textContent = `${c.title.toUpperCase()} • ${c.role.toUpperCase()}`;

    const corePill = document.getElementById('home-hero-core-pill');
    if (corePill) {
      corePill.textContent = `${c.core.toUpperCase()} CORE`;
      corePill.style.color = c.coreColor;
      corePill.style.borderColor = c.coreColor;
      corePill.style.background = `${c.coreColor}18`;
    }

    const quoteEl = document.getElementById('home-hero-quote');
    if (quoteEl) quoteEl.textContent = c.quote;

    const lvlEl = document.getElementById('home-hero-level');
    if (lvlEl) lvlEl.textContent = `LEVEL ${pData.level || 1}`;

    const xpFill = document.getElementById('home-hero-xp-fill');
    if (xpFill) {
      const pct = Math.min(100, Math.round(((pData.xp || 0) % 1000) / 10));
      xpFill.style.width = `${pct}%`;
      xpFill.style.background = c.coreColor;
    }

    const xpText = document.getElementById('home-hero-xp-text');
    if (xpText) {
      const curXp = pData.xp || 0;
      const nextXp = (pData.level || 1) * 1000;
      xpText.textContent = `${curXp.toLocaleString()} / ${nextXp.toLocaleString()} XP`;
    }

    const indexEl = document.getElementById('home-fighter-index');
    if (indexEl) {
      indexEl.textContent = `${this.homeShowcaseCharIndex + 1} / ${this.homeRoster.length}`;
    }

    const traitsEl = document.getElementById('home-hero-traits');
    if (traitsEl) {
      const traitsMap = {
        vex: ['⚔ Versatile Offense', '🛡 Reliable Defense', '⚡ Fast Counters'],
        solaris: ['🛡 Radiant Armor', '🔥 Solar Cleave', '💥 Ground Pound'],
        lyra: ['⚡ Supersonic Dash', '🗡 Gale Shards', '🌪 Whirlwind Vortex'],
        aeron: ['🏹 Piercing Lance', '💨 Evasive Leap', '🎯 Precision Strike'],
        kairo: ['🦾 Graviton Pull', '💥 Seismic Slam', '🛡 Kinetic Shield'],
        nox: ['🌌 Dimensional Void', '🗡 Shadow Daggers', '⚡ Reality Cleave']
      };
      const traits = traitsMap[charId] || traitsMap.vex;
      traitsEl.innerHTML = traits.map(t => {
        const parts = t.split(' ');
        const icon = parts[0];
        const label = parts.slice(1).join(' ');
        return `<span class="fighter-trait-pill"><span class="trait-icon">${icon}</span> ${label}</span>`;
      }).join('');
    }

    // Instantiate or refresh home fighter for canvas
    this.homeFighter = new Fighter({
      id: 'home_hero',
      name: c.name,
      charId: charId,
      x: 240,
      y: 260,
      groundY: 260,
      facing: 1,
      color: c.coreColor,
      isAi: false
    });
    this.homeFighter.currentCore = 100;
  }

  updateHomeIntelTelemetry() {
    // 1. Daily Bounty Module
    const chData = progressionManager.getChallenges();
    const dailies = chData.daily || [];
    if (dailies.length > 0) {
      const d = dailies[0];
      const dTitle = document.getElementById('home-daily-title');
      if (dTitle) dTitle.textContent = d.title;
      const dDesc = document.getElementById('home-daily-desc');
      if (dDesc) dDesc.textContent = d.desc;
      const dProgress = document.getElementById('home-daily-progress-text');
      if (dProgress) dProgress.textContent = `${d.current} / ${d.target}`;
      const dFill = document.getElementById('home-daily-bar-fill');
      if (dFill) {
        const pct = Math.min(100, Math.round((d.current / d.target) * 100));
        dFill.style.width = `${pct}%`;
      }
    }

    // 2. Current Rank Module
    const ranked = progressionManager.data.ranked;
    const rankInfo = CompetitiveRankEngine.getRankFromRp(ranked.rp);
    const crestEl = document.getElementById('home-rank-crest');
    if (crestEl) crestEl.textContent = rankInfo.icon || '🥈';
    const rankTitle = document.getElementById('home-rank-title');
    if (rankTitle) {
      rankTitle.textContent = rankInfo.formattedName.toUpperCase();
      rankTitle.style.color = rankInfo.color;
    }
    const rankRp = document.getElementById('home-rank-rp');
    if (rankRp) {
      rankRp.textContent = `${ranked.rp} TOTAL RP • ${rankInfo.divisionRp}/100 RP TO NEXT DIVISION`;
    }
    const streakEl = document.getElementById('home-rank-streak');
    if (streakEl) streakEl.textContent = `🔥 ${ranked.streak || 0}`;
    const winRateEl = document.getElementById('home-rank-winrate');
    if (winRateEl) {
      const total = (ranked.wins || 0) + (ranked.losses || 0);
      const wr = total > 0 ? Math.round((ranked.wins / total) * 100) : 100;
      winRateEl.textContent = `${wr}%`;
    }

    // 3. Recent Match Module
    const history = progressionManager.data.matchHistory || [];
    if (history.length > 0) {
      const last = history[0];
      const outcomeEl = document.getElementById('home-recent-outcome');
      if (outcomeEl) {
        outcomeEl.textContent = last.result;
        outcomeEl.className = `intel-outcome-badge ${last.result === 'VICTORY' ? 'victory' : 'defeat'}`;
      }
      const gradeEl = document.getElementById('home-recent-grade');
      if (gradeEl) gradeEl.textContent = `GRADE ${last.grade || 'A'}`;
      const scoreEl = document.getElementById('home-recent-score');
      if (scoreEl) scoreEl.textContent = last.roundScore || '2 - 0';
      const detailEl = document.getElementById('home-recent-detail');
      if (detailEl) {
        const heroName = (CHARACTERS[last.hero]?.name || last.hero || 'VEX').toUpperCase();
        const oppName = (CHARACTERS[last.opponent]?.name || last.opponent || 'SOLARIS').toUpperCase();
        detailEl.textContent = `${heroName} vs ${oppName} • ${last.mode || 'Casual 1v1'} • Max Combo: ${last.maxCombo || 6} Hits`;
      }
    }
  }

  startHomeHeroLoop() {
    if (this.homeAnimFrame) return;
    this.homeLastTime = performance.now();

    const loop = (time) => {
      const dt = Math.min((time - this.homeLastTime) / 1000, 0.05);
      this.homeLastTime = time;
      this.renderHomeHeroCanvas(dt);
      this.homeAnimFrame = requestAnimationFrame(loop);
    };

    this.homeAnimFrame = requestAnimationFrame(loop);
  }

  stopHomeHeroLoop() {
    if (this.homeAnimFrame) {
      cancelAnimationFrame(this.homeAnimFrame);
      this.homeAnimFrame = null;
    }
  }

  renderHomeHeroCanvas(dt) {
    const canvas = document.getElementById('home-hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Clean neutral surface backdrop
    ctx.clearRect(0, 0, w, h);

    const floorX = w / 2;
    const floorY = h - 60;
    const charId = this.homeRoster[this.homeShowcaseCharIndex] || 'vex';
    const c = CHARACTERS[charId] || CHARACTERS.vex;
    const now = performance.now() * 0.002;

    // 1. Subtle, athletic combat mat / ring floor in light tones
    ctx.save();
    // Sparring ground shadow
    const shadowGrad = ctx.createRadialGradient(floorX, floorY, 10, floorX, floorY, 150);
    shadowGrad.addColorStop(0, 'rgba(32, 37, 43, 0.16)');
    shadowGrad.addColorStop(1, 'rgba(32, 37, 43, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(floorX, floorY + 4, 150, 32, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sparring ring circle
    ctx.fillStyle = '#E9EDF1';
    ctx.beginPath();
    ctx.ellipse(floorX, floorY, 140, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D9DEE4';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Subtle core ring
    ctx.strokeStyle = `${c.coreColor}55`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(floorX, floorY, 100, 20, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating micro energy ticks
    for (let i = 0; i < 4; i++) {
      const angle = now + (i * Math.PI / 2);
      const px = floorX + Math.cos(angle) * 120;
      const py = floorY + Math.sin(angle) * 24;
      ctx.fillStyle = c.coreColor;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. Update and draw fighter
    if (this.homeFighter) {
      this.homeFighter.groundY = floorY;
      this.homeFighter.x = floorX;
      this.homeFighter.y = floorY;
      this.homeFighter.vx = 0;
      this.homeFighter.vy = 0;
      this.homeFighter.isGrounded = true;

      try {
        this.homeFighter.update(dt || 0.016, 2000, null, null);
      } catch (e) {
        // Safe guard
      }

      ctx.save();
      ctx.translate(floorX, floorY);
      const scale = 1.25;
      ctx.scale(scale, scale);
      ctx.translate(-floorX, -floorY);

      try {
        characterRenderer.drawFighter(ctx, this.homeFighter);
      } catch (err) {
        console.error('Home character render error:', err);
      }
      ctx.restore();
    }
  }

  // --- CHARACTER SELECTION & LIVE PREVIEW SYSTEM ---
  setupCharacterSelect() {
    const list = document.getElementById('char-select-cards-list');
    if (!list) return;
    list.innerHTML = '';

    const charOrder = ['vex', 'solaris', 'lyra', 'aeron', 'kairo', 'nox'];

    charOrder.forEach(charId => {
      const c = CHARACTERS[charId];
      if (!c) return;

      const pData = progressionManager.getCharacterProgression(charId);

      const card = document.createElement('button');
      card.className = `cs-roster-card ${charId === this.selectedSelectCharId ? 'active' : ''}`;
      card.id = `select-card-${charId}`;
      card.style.setProperty('--card-core-color', c.coreColor);
      card.style.setProperty('--card-glow-color', `${c.coreColor}44`);

      const pwr = c.ratings ? c.ratings.power : 75;
      const spd = c.ratings ? c.ratings.speed : 75;
      const def = c.ratings ? c.ratings.defense : 75;
      const tch = c.ratings ? c.ratings.technique : 75;

      card.innerHTML = `
        <div class="cs-rc-top">
          <div class="cs-rc-avatar" style="border-color: ${c.coreColor}; background: ${c.coreColor}22; color: ${c.coreColor}; box-shadow: 0 0 10px ${c.coreColor}44;">
            ${c.name.charAt(0)}
          </div>
          <div class="cs-rc-meta">
            <div class="cs-rc-name">${c.name}</div>
            <div class="cs-rc-mastery">M-LVL ${pData.level || 1}</div>
          </div>
        </div>

        <div class="cs-rc-core-pill" style="background: ${c.coreColor}1A; color: ${c.coreColor}; border: 1px solid ${c.coreColor}44;">
          ${c.core.toUpperCase()} CORE // ${c.role.toUpperCase()}
        </div>

        <div class="cs-rc-role-diff">
          <span class="cs-rc-stars">${c.difficultyStars}</span>
          <span>${c.difficulty ? c.difficulty.split(' ')[0] : ''}</span>
        </div>

        <div class="cs-rc-stats-grid">
          <div class="cs-rc-stat-item">
            <span class="cs-rc-stat-lbl">PWR ${pwr}</span>
            <div class="cs-rc-stat-bar"><div class="cs-rc-stat-fill" style="width: ${pwr}%; background: #FF5E7E;"></div></div>
          </div>
          <div class="cs-rc-stat-item">
            <span class="cs-rc-stat-lbl">SPD ${spd}</span>
            <div class="cs-rc-stat-bar"><div class="cs-rc-stat-fill" style="width: ${spd}%; background: #00D2FF;"></div></div>
          </div>
          <div class="cs-rc-stat-item">
            <span class="cs-rc-stat-lbl">DEF ${def}</span>
            <div class="cs-rc-stat-bar"><div class="cs-rc-stat-fill" style="width: ${def}%; background: #10B981;"></div></div>
          </div>
          <div class="cs-rc-stat-item">
            <span class="cs-rc-stat-lbl">TCH ${tch}</span>
            <div class="cs-rc-stat-bar"><div class="cs-rc-stat-fill" style="width: ${tch}%; background: #A855F7;"></div></div>
          </div>
        </div>
      `;

      card.addEventListener('mouseenter', () => {
        soundEngine.playUiHover();
      });

      card.addEventListener('click', () => {
        this.selectCharacterForSelect(charId);
        soundEngine.playUiClick();
      });

      list.appendChild(card);
    });

    // Populate Opponent dropdown
    const oppSelect = document.getElementById('select-select-opponent');
    if (oppSelect) {
      oppSelect.innerHTML = '<option value="random">⚡ RANDOM RIVAL (Surprise Opponent)</option>';
      charOrder.forEach(cid => {
        const ch = CHARACTERS[cid];
        if (ch) {
          oppSelect.innerHTML += `<option value="${cid}" ${cid === 'solaris' ? 'selected' : ''}>${ch.name} (${ch.role} • ${ch.core} Core)</option>`;
        }
      });
    }

    // Populate Arena dropdown
    const arenaSelect = document.getElementById('select-select-arena');
    if (arenaSelect) {
      arenaSelect.innerHTML = '';
      for (const aid in ARENAS) {
        const ar = ARENAS[aid];
        arenaSelect.innerHTML += `<option value="${aid}" ${aid === 'neon_metro' ? 'selected' : ''}>${ar.name} — ${ar.subtitle}</option>`;
      }
    }

    // Action Preview buttons
    const previewButtons = document.querySelectorAll('.preview-act-btn');
    previewButtons.forEach(b => {
      b.addEventListener('click', () => {
        const action = b.getAttribute('data-action');
        this.triggerPreviewAction(action);
      });
    });

    // Launch match button (fallback / direct)
    const launchBtn = document.getElementById('btn-select-launch-match');
    if (launchBtn) {
      launchBtn.addEventListener('click', () => {
        this.handleLockInMatch();
      });
    }

    // Single-click Equip Active Fighter action
    const btnConfirmSelect = document.getElementById('btn-confirm-select-fighter');
    if (btnConfirmSelect) {
      btnConfirmSelect.addEventListener('click', () => {
        const charId = this.selectedSelectCharId || 'vex';
        progressionManager.setMainCharacter(charId);
        const idx = this.homeRoster.indexOf(charId);
        if (idx !== -1) this.homeShowcaseCharIndex = idx;
        this.updateHomeHeroDisplay();
        this.selectCharacterForSelect(charId);
        this.showToast(`${CHARACTERS[charId]?.name || 'Fighter'} is now your Active Fighter!`, 'success');
        soundEngine.playParry();
      });
    }

    // Return to Lobby action
    const btnCsReturnHome = document.getElementById('btn-cs-return-home');
    if (btnCsReturnHome) {
      btnCsReturnHome.addEventListener('click', () => {
        this.showScreen('screen-home');
        soundEngine.playUiClick();
      });
    }

    // Keyboard navigation on Character Select screen
    if (!this.csKeyboardBound) {
      this.csKeyboardBound = true;
      window.addEventListener('keydown', (e) => {
        // STRICT SAFETY GUARD: Never process character-select shortcuts during active combat or arena transitions
        const gv = document.getElementById('game-view');
        if (gv && (gv.style.display === 'block' || this.isTransitioningToArena)) return;
        if (this.engine && (this.engine.roundState === 'FIGHTING' || this.engine.roundState === 'INTRO_READY')) return;

        const screenEl = document.getElementById('screen-character-select');
        if (!screenEl || !screenEl.classList.contains('active')) return;

        // Ignore if typing inside input, textarea, or select
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;

        if (e.key === 'Escape') {
          e.preventDefault();
          this.showScreen('screen-home');
          soundEngine.playUiClick();
          return;
        }

        const roster = ['vex', 'solaris', 'lyra', 'aeron', 'kairo', 'nox'];
        const currentIdx = roster.indexOf(this.selectedSelectCharId);

        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          const nextIdx = (currentIdx - 1 + roster.length) % roster.length;
          this.selectCharacterForSelect(roster[nextIdx]);
          soundEngine.playUiClick();
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          const nextIdx = (currentIdx + 1) % roster.length;
          this.selectCharacterForSelect(roster[nextIdx]);
          soundEngine.playUiClick();
        } else if (e.key === '1') {
          this.triggerPreviewAction('IDLE');
        } else if (e.key === '2') {
          this.triggerPreviewAction('LIGHT');
        } else if (e.key === '3') {
          this.triggerPreviewAction('HEAVY');
        } else if (e.key === '4') {
          this.triggerPreviewAction('SPECIAL_1');
        } else if (e.key === '5') {
          this.triggerPreviewAction('SPECIAL_2');
        } else if (e.key === '6') {
          this.triggerPreviewAction('ULTIMATE');
        } else if (e.key === 'Enter' || e.key === ' ') {
          if (e.target && e.target.tagName === 'BUTTON' && e.target.id !== 'btn-confirm-select-fighter') {
            return;
          }
          e.preventDefault();
          const charId = this.selectedSelectCharId || 'vex';
          progressionManager.setMainCharacter(charId);
          const idx = this.homeRoster.indexOf(charId);
          if (idx !== -1) this.homeShowcaseCharIndex = idx;
          this.updateHomeHeroDisplay();
          this.selectCharacterForSelect(charId);
          this.showToast(`${CHARACTERS[charId]?.name || 'Fighter'} is now your Active Fighter!`, 'success');
          soundEngine.playParry();
        }
      });
    }

    // Initialize with first selection
    this.selectCharacterForSelect(this.selectedSelectCharId || 'vex');
  }

  // --- AUTOMATIC RANDOM OPPONENT SELECTION ---
  getRandomOpponent(playerCharId) {
    const allChars = Object.keys(CHARACTERS); // ['vex', 'solaris', 'lyra', 'aeron', 'kairo', 'nox']
    const validPool = allChars.filter(id => id !== playerCharId);
    if (validPool.length === 0) return 'solaris';
    return validPool[Math.floor(Math.random() * validPool.length)];
  }

  handleLockInMatch() {
    if (this.isTransitioningToArena) return;

    const p1Id = this.selectedSelectCharId || 'vex';
    // Automatically select a valid opponent at random from the roster (excluding player character)
    const p2Id = this.getRandomOpponent(p1Id);
    const arenaId = document.getElementById('select-select-arena')?.value || 'neon_metro';
    const diff = document.getElementById('select-select-diff')?.value || 'WARRIOR';

    this.launchMatchWithTransition(p1Id, p2Id, arenaId, diff);
  }

  launchMatchWithTransition(p1Id, p2Id, arenaId, diff, mode = 'Casual') {
    if (this.isTransitioningToArena) return;
    this.isTransitioningToArena = true;

    const p1Char = CHARACTERS[p1Id] || CHARACTERS.vex;
    const p2Char = CHARACTERS[p2Id] || CHARACTERS.solaris;
    const arenaData = ARENAS[arenaId] || ARENAS.neon_metro;

    // 1. Lock-in Impact SFX & Character flourish
    soundEngine.playParry();
    soundEngine.playSlash(true);
    this.triggerPreviewAction('ULTIMATE');

    const lockinBtn = document.getElementById('btn-select-launch-match');
    if (lockinBtn) {
      lockinBtn.style.filter = 'brightness(1.5)';
      const titleEl = lockinBtn.querySelector('.cs-lockin-title');
      if (titleEl) titleEl.textContent = 'FIGHTER LOCKED IN!';
    }

    // 2. Populate Fullscreen Arena Transition Overlay
    const overlay = document.getElementById('arena-transition-overlay');
    if (overlay) {
      // P1
      const p1Card = document.getElementById('ato-p1-card');
      if (p1Card) {
        p1Card.style.setProperty('--ato-p1-color', p1Char.coreColor);
        p1Card.style.setProperty('--ato-p1-glow', `${p1Char.coreColor}55`);
      }
      const p1Av = document.getElementById('ato-p1-avatar');
      if (p1Av) {
        p1Av.textContent = p1Char.name.charAt(0);
        p1Av.style.borderColor = p1Char.coreColor;
        p1Av.style.color = p1Char.coreColor;
        p1Av.style.background = `${p1Char.coreColor}22`;
      }
      const p1Name = document.getElementById('ato-p1-name');
      if (p1Name) p1Name.textContent = p1Char.name;
      const p1Role = document.getElementById('ato-p1-role');
      if (p1Role) p1Role.textContent = `${p1Char.core.toUpperCase()} CORE // ${p1Char.role.toUpperCase()}`;
      const p1Quote = document.getElementById('ato-p1-quote');
      if (p1Quote) p1Quote.textContent = p1Char.quote;

      // P2
      const p2Card = document.getElementById('ato-p2-card');
      if (p2Card) {
        p2Card.style.setProperty('--ato-p2-color', p2Char.coreColor);
        p2Card.style.setProperty('--ato-p2-glow', `${p2Char.coreColor}55`);
      }
      const p2Av = document.getElementById('ato-p2-avatar');
      if (p2Av) {
        p2Av.textContent = p2Char.name.charAt(0);
        p2Av.style.borderColor = p2Char.coreColor;
        p2Av.style.color = p2Char.coreColor;
        p2Av.style.background = `${p2Char.coreColor}22`;
      }
      const p2Name = document.getElementById('ato-p2-name');
      if (p2Name) p2Name.textContent = p2Char.name;
      const p2Role = document.getElementById('ato-p2-role');
      if (p2Role) p2Role.textContent = `${p2Char.core.toUpperCase()} CORE // ${p2Char.role.toUpperCase()}`;
      const p2Quote = document.getElementById('ato-p2-quote');
      if (p2Quote) p2Quote.textContent = p2Char.quote;
      const p2Label = document.getElementById('ato-p2-label');
      if (p2Label) p2Label.textContent = (diff === 'LOCAL_2P') ? 'PLAYER 2' : `OPPONENT (${diff} AI)`;

      // Arena
      const arenaNameEl = document.getElementById('ato-arena-name');
      if (arenaNameEl) arenaNameEl.textContent = arenaData.name.toUpperCase();
      const arenaSubEl = document.getElementById('ato-arena-sub');
      if (arenaSubEl) arenaSubEl.textContent = `${arenaData.subtitle} • ${diff === 'LOCAL_2P' ? 'LOCAL 2-PLAYER' : diff + ' AI'}`;

      // Show overlay
      overlay.classList.remove('hidden', 'fading-out');
      overlay.classList.add('active');

      const fill = document.getElementById('ato-loading-fill');
      if (fill) {
        fill.style.width = '0%';
        setTimeout(() => { fill.style.width = '100%'; }, 20);
      }
    }

    // 3. Smooth handoff to match arena after cinematic presentation
    setTimeout(() => {
      this.launchMatch(p1Id, p2Id, arenaId, diff, mode);

      if (overlay) {
        overlay.classList.add('fading-out');
        setTimeout(() => {
          overlay.classList.remove('active', 'fading-out');
          overlay.classList.add('hidden');
          this.isTransitioningToArena = false;
          if (lockinBtn) {
            lockinBtn.style.filter = '';
            const titleEl = lockinBtn.querySelector('.cs-lockin-title');
            if (titleEl) titleEl.textContent = 'LOCK IN & FIGHT';
          }
        }, 450);
      } else {
        this.isTransitioningToArena = false;
      }
    }, 650);
  }

  selectCharacterForSelect(charId) {
    const c = CHARACTERS[charId];
    if (!c) return;
    this.selectedSelectCharId = charId;

    // Update active button states in roster cards
    document.querySelectorAll('.cs-roster-card').forEach(b => {
      b.classList.toggle('active', b.id === `select-card-${charId}`);
    });

    // Update container theme variables
    const csContainer = document.querySelector('.cs-premium-container');
    if (csContainer) {
      csContainer.style.setProperty('--selected-core-color', c.coreColor);
      csContainer.style.setProperty('--selected-core-glow', `${c.coreColor}44`);
      csContainer.style.setProperty('--selected-core-bg', `${c.coreColor}22`);
    }

    // Trigger visual selection burst & scale bounce
    const wave = document.getElementById('cs-selection-shockwave');
    if (wave) {
      wave.classList.remove('animate-burst');
      void wave.offsetWidth; // Force CSS reflow
      wave.classList.add('animate-burst');
    }
    this.selectionBurstTimer = 0.55;

    // Subtle audio chime on character swap
    soundEngine.playSlash(false, 1);

    // Update Stage Meta & Watermark
    const watermark = document.getElementById('cs-stage-watermark');
    if (watermark) watermark.textContent = c.name;

    const corePill = document.getElementById('stage-core-pill');
    if (corePill) {
      corePill.textContent = `${c.core.toUpperCase()} CORE // ${c.role.toUpperCase()}`;
      corePill.style.color = c.coreColor;
      corePill.style.borderColor = c.coreColor;
      corePill.style.background = `${c.coreColor}22`;
    }

    const nameEl = document.getElementById('stage-fighter-name');
    if (nameEl) {
      nameEl.textContent = c.name;
      nameEl.style.color = 'var(--text-primary)';
      nameEl.style.textShadow = 'none';
    }

    const roleEl = document.getElementById('stage-fighter-role');
    if (roleEl) roleEl.textContent = `${c.title.toUpperCase()} • ${c.role.toUpperCase()}`;

    const quoteEl = document.getElementById('cs-fighter-quote');
    if (quoteEl) quoteEl.textContent = c.quote;

    const loreEl = document.getElementById('dossier-lore-snippet');
    if (loreEl) {
      const conciseLore = {
        vex: 'Crimson Plasma specialist with supersonic iaido blade strikes and versatile counter-punishes.',
        solaris: 'Unstoppable gold juggernaut commanding radiant kinetic blasts and super-armor absorption.',
        lyra: 'Supersonic rose-core assassin with lightning dash strings and high-speed multi-hit juggles.',
        aeron: 'Aerial combatant commanding gale-force vortex kicks and dominant mid-air aerial loops.',
        kairo: 'Tactical emerald sniper zoning foes with barrier shields and precision kinetic arrows.',
        nox: 'Shadow void stalker phasing through reality to execute lethal armor-piercing ambush strikes.'
      };
      loreEl.textContent = conciseLore[charId] || c.lore;
    }

    // Update Combat Stance Details
    const stanceNameEl = document.getElementById('cs-stance-name');
    if (stanceNameEl) stanceNameEl.textContent = (c.visual && c.visual.stanceName) ? c.visual.stanceName.toUpperCase() : `${c.name} STANCE`;

    const stanceWeaponEl = document.getElementById('cs-stance-weapon');
    if (stanceWeaponEl) stanceWeaponEl.textContent = c.weapon;

    const stanceDescEl = document.getElementById('cs-stance-desc');
    if (stanceDescEl) stanceDescEl.textContent = (c.visual && c.visual.stanceDesc) ? c.visual.stanceDesc : 'Signature fighting-game posture and combat weapon stance.';

    // Update Core Energy Reactor
    const coreReactorName = document.getElementById('cs-reactor-type-name');
    if (coreReactorName) coreReactorName.textContent = (c.visual && c.visual.coreElement) ? c.visual.coreElement.toUpperCase() : `${c.core.toUpperCase()} CORE`;

    const passiveNameEl = document.getElementById('cs-passive-name');
    if (passiveNameEl) passiveNameEl.textContent = c.passive ? c.passive.name : 'Core Resonance';

    const passiveDescEl = document.getElementById('cs-passive-desc');
    if (passiveDescEl) passiveDescEl.textContent = c.passive ? c.passive.description : 'Generates Core Energy continuously during combat.';

    // Update Character Mastery & Progression
    const pChar = progressionManager.getCharacterProgression(charId);
    const diffEl = document.getElementById('stage-difficulty-val');
    if (diffEl) diffEl.textContent = `${c.difficultyStars} ${c.difficulty ? c.difficulty.split(' ')[0] : ''}`;

    const stageMasteryBadge = document.getElementById('cs-stage-mastery-badge');
    if (stageMasteryBadge) stageMasteryBadge.textContent = `LVL ${pChar.level} • RANK ${pChar.masteryLevel}`;

    const masteryLvlNum = document.getElementById('cs-mastery-lvl-num');
    if (masteryLvlNum) masteryLvlNum.textContent = `LVL ${pChar.level}`;

    const masteryRankNum = document.getElementById('cs-mastery-rank-num');
    if (masteryRankNum) masteryRankNum.textContent = `RANK ${pChar.masteryLevel}`;

    const masteryXpText = document.getElementById('cs-mastery-xp-text');
    if (masteryXpText) masteryXpText.textContent = `${pChar.xp.toLocaleString()} / ${(pChar.xp + 750).toLocaleString()} XP`;

    const masteryFill = document.getElementById('cs-mastery-bar-fill');
    if (masteryFill) masteryFill.style.width = `${Math.min(100, Math.round((pChar.xp % 1000) / 10))}%`;

    const tierPill = document.getElementById('cs-mastery-tier-pill');
    if (tierPill) {
      if (pChar.evolutionTier === 2) {
        tierPill.textContent = 'TIER 2: ASCENDED';
        tierPill.style.color = 'var(--accent-gold)';
        tierPill.style.borderColor = 'var(--accent-gold)';
      } else if (pChar.evolutionTier === 1) {
        tierPill.textContent = 'TIER 1: AWAKENED';
        tierPill.style.color = 'var(--accent-cyan)';
        tierPill.style.borderColor = 'var(--accent-cyan)';
      } else {
        tierPill.textContent = 'TIER 0: STANDARD';
        tierPill.style.color = 'var(--text-muted)';
        tierPill.style.borderColor = 'var(--border-subtle)';
      }
    }

    // Update Stat Ratings (Power, Speed, Defense, Technique)
    const pVal = c.ratings ? c.ratings.power : 75;
    const sVal = c.ratings ? c.ratings.speed : 75;
    const dVal = c.ratings ? c.ratings.defense : 75;
    const tVal = c.ratings ? c.ratings.technique : 75;

    const pValEl = document.getElementById('dossier-val-power');
    if (pValEl) pValEl.textContent = pVal;
    const pBarEl = document.getElementById('dossier-bar-power');
    if (pBarEl) pBarEl.style.width = `${pVal}%`;

    const sValEl = document.getElementById('dossier-val-speed');
    if (sValEl) sValEl.textContent = sVal;
    const sBarEl = document.getElementById('dossier-bar-speed');
    if (sBarEl) sBarEl.style.width = `${sVal}%`;

    const dValEl = document.getElementById('dossier-val-def');
    if (dValEl) dValEl.textContent = dVal;
    const dBarEl = document.getElementById('dossier-bar-def');
    if (dBarEl) dBarEl.style.width = `${dVal}%`;

    const tValEl = document.getElementById('dossier-val-tech');
    if (tValEl) tValEl.textContent = tVal;
    const tBarEl = document.getElementById('dossier-bar-tech');
    if (tBarEl) tBarEl.style.width = `${tVal}%`;

    // Update Tactical Strengths
    const strList = document.getElementById('dossier-strengths-list');
    if (strList) {
      strList.innerHTML = '';
      (c.strengths || []).forEach(st => {
        const item = document.createElement('div');
        item.className = 'sw-item';
        item.innerHTML = `<span class="sw-bullet strength">▲</span><span>${st}</span>`;
        strList.appendChild(item);
      });
    }

    // Update Tactical Weaknesses
    const weakList = document.getElementById('dossier-weaknesses-list');
    if (weakList) {
      weakList.innerHTML = '';
      (c.weaknesses || []).forEach(wk => {
        const item = document.createElement('div');
        item.className = 'sw-item';
        item.innerHTML = `<span class="sw-bullet weakness">▼</span><span>${wk}</span>`;
        weakList.appendChild(item);
      });
    }

    // Update Abilities Cards & Action Button Labels
    const sp1 = c.abilities && c.abilities[0];
    if (sp1) {
      const sp1Key = document.getElementById('cs-ab-sp1-key');
      const cleanKey = (sp1.key || 'U / E').replace(/\s*\(.*?\)/, '').trim();
      if (sp1Key) sp1Key.textContent = cleanKey;
      const sp1Cost = document.getElementById('cs-ab-sp1-cost');
      if (sp1Cost) sp1Cost.textContent = `${sp1.cost || 25} CORE`;
      const sp1Name = document.getElementById('cs-ab-sp1-name');
      if (sp1Name) sp1Name.textContent = sp1.name;
      const sp1Type = document.getElementById('cs-ab-sp1-type');
      if (sp1Type) sp1Type.textContent = `${sp1.type || ''} • ${sp1.damage || 130} DMG`;
      const sp1Desc = document.getElementById('cs-ab-sp1-desc');
      if (sp1Desc) sp1Desc.textContent = sp1.description;

      const lblSp1 = document.getElementById('lbl-preview-sp1');
      if (lblSp1) lblSp1.textContent = sp1.name.toUpperCase();
    }

    const sp2 = c.abilities && c.abilities[1];
    if (sp2) {
      const sp2Key = document.getElementById('cs-ab-sp2-key');
      const cleanKey = (sp2.key || 'I / Q').replace(/\s*\(.*?\)/, '').trim();
      if (sp2Key) sp2Key.textContent = cleanKey;
      const sp2Cost = document.getElementById('cs-ab-sp2-cost');
      if (sp2Cost) sp2Cost.textContent = `${sp2.cost || 30} CORE`;
      const sp2Name = document.getElementById('cs-ab-sp2-name');
      if (sp2Name) sp2Name.textContent = sp2.name;
      const sp2Type = document.getElementById('cs-ab-sp2-type');
      if (sp2Type) sp2Type.textContent = `${sp2.type || ''} • ${sp2.damage || 155} DMG`;
      const sp2Desc = document.getElementById('cs-ab-sp2-desc');
      if (sp2Desc) sp2Desc.textContent = sp2.description;

      const lblSp2 = document.getElementById('lbl-preview-sp2');
      if (lblSp2) lblSp2.textContent = sp2.name.toUpperCase();
    }

    // Cinematic Ultimate Card
    const ult = c.abilities && c.abilities[2];
    if (ult) {
      const ultName = document.getElementById('cs-ult-name');
      if (ultName) ultName.textContent = ult.name.toUpperCase();
      const ultKey = document.getElementById('cs-ult-key');
      const cleanKey = (ult.key || 'O / R').replace(/\s*\(.*?\)/, '').trim();
      if (ultKey) ultKey.textContent = cleanKey;
      const ultDmg = document.getElementById('cs-ult-dmg');
      if (ultDmg) ultDmg.textContent = `${ult.damage || 420} DMG`;
      const ultDesc = document.getElementById('cs-ult-desc');
      if (ultDesc) ultDesc.textContent = ult.description;

      const lblUlt = document.getElementById('lbl-preview-ult');
      if (lblUlt) lblUlt.textContent = ult.name.toUpperCase();
    }

    // Reset preview fighter and FX on stage
    this.previewProjectiles = [];
    if (!this.previewParticleSystem) {
      this.previewParticleSystem = new ParticleSystem();
    } else {
      this.previewParticleSystem.reset();
    }

    this.previewFighter = new Fighter({
      id: 'preview',
      name: c.name,
      charId: charId,
      x: 300,
      y: 360,
      groundY: 360,
      facing: 1,
      color: c.coreColor,
      isAi: false
    });
    this.previewFighter.groundY = 360;
    this.previewFighter.currentCore = 100;
    this.previewAction = 'IDLE';

    document.querySelectorAll('.preview-act-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-action') === 'IDLE');
    });

    // Update active state on the equip action button
    const isCurrentMain = (progressionManager.getMainCharacter() === charId);
    const btnConfirm = document.getElementById('btn-confirm-select-fighter');
    const lblConfirm = document.getElementById('lbl-select-fighter-action');
    if (btnConfirm && lblConfirm) {
      if (isCurrentMain) {
        btnConfirm.classList.add('equipped');
        lblConfirm.textContent = '✓ ACTIVE FIGHTER';
      } else {
        btnConfirm.classList.remove('equipped');
        lblConfirm.textContent = 'SELECT AS ACTIVE FIGHTER';
      }
    }

    if (!this.previewAnimFrame) {
      this.startPreviewLoop();
    }
  }

  triggerPreviewAction(action) {
    if (!this.previewFighter) return;
    this.previewAction = action;

    document.querySelectorAll('.preview-act-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-action') === action);
    });

    if (!this.previewParticleSystem) {
      this.previewParticleSystem = new ParticleSystem();
    }

    try {
      const charId = this.previewFighter.charId || 'vex';

      switch (action) {
        case 'IDLE':
          this.previewFighter.state = FIGHTER_STATES.IDLE;
          this.previewFighter.animFrame = 0;
          this.previewFighter.animTimer = 0;
          this.previewFighter.vx = 0;
          this.previewFighter.vy = 0;
          this.previewFighter.x = 300;
          this.previewFighter.y = 360;
          break;
        case 'LIGHT':
          this.previewFighter.executeAction('LIGHT_ATTACK', null, this.previewParticleSystem);
          if (typeof soundEngine.playAttackLight === 'function') {
            soundEngine.playAttackLight(charId);
          } else {
            soundEngine.playSlash(false);
          }
          break;
        case 'HEAVY':
          this.previewFighter.executeAction('HEAVY_ATTACK', null, this.previewParticleSystem);
          if (typeof soundEngine.playAttackHeavy === 'function') {
            soundEngine.playAttackHeavy(charId);
          } else {
            soundEngine.playSlash(true);
          }
          break;
        case 'SPECIAL_1':
          this.previewFighter.executeAction('SPECIAL_1', null, this.previewParticleSystem);
          soundEngine.playSpecial(charId, 0);
          break;
        case 'SPECIAL_2':
          this.previewFighter.executeAction('SPECIAL_2', null, this.previewParticleSystem);
          soundEngine.playSpecial(charId, 1);
          break;
        case 'ULTIMATE':
          this.previewFighter.executeAction('ULTIMATE', null, this.previewParticleSystem);
          soundEngine.playUltimate(charId);
          break;
      }
    } catch (actErr) {
      console.warn('Preview action error safely handled:', actErr);
    }
  }

  startPreviewLoop() {
    this.stopPreviewLoop();
    this.previewLastTime = performance.now();

    const loop = (timestamp) => {
      try {
        const dt = Math.min((timestamp - this.previewLastTime) / 1000, 0.05);
        this.previewLastTime = timestamp;
        this.renderPreviewFrame(dt);
      } catch (loopErr) {
        console.error('Safe preview frame recovery:', loopErr);
      }
      this.previewAnimFrame = requestAnimationFrame(loop);
    };

    this.previewAnimFrame = requestAnimationFrame(loop);
  }

  stopPreviewLoop() {
    if (this.previewAnimFrame) {
      cancelAnimationFrame(this.previewAnimFrame);
      this.previewAnimFrame = null;
    }
  }

  renderPreviewFrame(dt) {
    const canvas = document.getElementById('select-preview-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (!this.previewFighter) return;
    const cData = this.previewFighter.charData;
    const coreColor = cData ? cData.coreColor : '#00D2FF';

    if (this.selectionBurstTimer > 0) {
      this.selectionBurstTimer -= dt || 0.016;
    }

    const floorX = w / 2;
    const floorY = h - 52;

    // 1. Draw Holo-Pedestal Stage
    ctx.save();

    // Outer stage glow
    const grad = ctx.createRadialGradient(floorX, floorY, 10, floorX, floorY, 130);
    grad.addColorStop(0, `${coreColor}3D`);
    grad.addColorStop(0.5, `${coreColor}15`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(floorX, floorY, 130, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Concentric Runic Pedestal Rings
    const now = performance.now() * 0.0015;
    ctx.strokeStyle = `${coreColor}77`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(floorX, floorY, 102, 22, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `${coreColor}CC`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(floorX, floorY, 65, 14, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating orbital energy ticks
    for (let i = 0; i < 6; i++) {
      const angle = now + (i * Math.PI / 3);
      const px = floorX + Math.cos(angle) * 78;
      const py = floorY + Math.sin(angle) * 16;
      ctx.fillStyle = coreColor;
      ctx.shadowColor = coreColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rising ambient core embers
    for (let i = 0; i < 5; i++) {
      const emberTime = (now * 2 + i * 1.3) % 2; // 0 to 2
      const ex = floorX - 45 + (i * 22) + Math.sin(now * 3 + i) * 8;
      const ey = floorY - (emberTime * 80);
      const alpha = Math.max(0, 1 - (emberTime / 2));
      ctx.fillStyle = coreColor;
      ctx.globalAlpha = alpha * 0.7;
      ctx.beginPath();
      ctx.arc(ex, ey, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. Selection Burst Expanding Shockwave Ring
    if (this.selectionBurstTimer > 0) {
      ctx.save();
      const progress = Math.max(0, Math.min(1, 1 - (this.selectionBurstTimer / 0.55))); // 0 to 1
      const burstRadius = Math.max(1, 25 + (progress * 135));
      const burstAlpha = Math.max(0, 1 - progress);
      ctx.strokeStyle = coreColor;
      ctx.lineWidth = 3.5 * burstAlpha;
      ctx.shadowColor = coreColor;
      ctx.shadowBlur = 24;
      ctx.globalAlpha = burstAlpha;
      ctx.beginPath();
      ctx.ellipse(floorX, floorY, burstRadius, Math.max(0.5, burstRadius * 0.28), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Safe Preview Physics & Combat FX Update
    if (!this.previewParticleSystem) {
      this.previewParticleSystem = new ParticleSystem();
    }

    this.previewFighter.currentCore = 100;
    this.previewFighter.groundY = floorY;

    try {
      this.previewFighter.update(dt || 0.016, 2000, null, this.previewParticleSystem);
    } catch (err) {
      console.warn('Preview update error safely prevented:', err);
    }

    // Keep fighter securely anchored to center pedestal
    this.previewFighter.x = floorX;
    this.previewFighter.y = floorY;
    this.previewFighter.vx = 0;
    this.previewFighter.vy = 0;
    this.previewFighter.isGrounded = true;

    // Reset action state to IDLE when attack finishes
    if (this.previewFighter.state === FIGHTER_STATES.IDLE && this.previewAction !== 'IDLE') {
      this.previewAction = 'IDLE';
      document.querySelectorAll('.preview-act-btn').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-action') === 'IDLE');
      });
    }

    // 4. Update and Render Projectiles
    if (this.previewFighter.pendingProjectiles && this.previewFighter.pendingProjectiles.length > 0) {
      if (!this.previewProjectiles) this.previewProjectiles = [];
      this.previewProjectiles.push(...this.previewFighter.pendingProjectiles);
      this.previewFighter.pendingProjectiles = [];
    }

    if (this.previewProjectiles && this.previewProjectiles.length > 0) {
      for (let i = this.previewProjectiles.length - 1; i >= 0; i--) {
        const p = this.previewProjectiles[i];
        try {
          p.update(dt || 0.016);
          if (typeof p.draw === 'function') {
            p.draw(ctx);
          } else if (typeof p.render === 'function') {
            p.render(ctx);
          }
        } catch (pErr) {
          console.warn('Projectile render safely handled:', pErr);
        }
        if (!p.active || p.x > w + 50 || p.x < -50) {
          this.previewProjectiles.splice(i, 1);
        }
      }
    }

    // 5. Update and Draw Combat Particle FX on Preview Stage
    if (this.previewParticleSystem) {
      this.previewParticleSystem.update(dt || 0.016);
    }

    // 6. Render Fighter Scaled For Balanced Heroic Visual Presence!
    ctx.save();
    ctx.translate(floorX, floorY);
    const burstScale = this.selectionBurstTimer > 0 ? Math.sin((this.selectionBurstTimer / 0.55) * Math.PI) * 0.08 : 0;
    const finalScale = 1.18 + burstScale;
    ctx.scale(finalScale, finalScale);
    ctx.translate(-floorX, -floorY);

    try {
      characterRenderer.drawFighter(ctx, this.previewFighter);
    } catch (err) {
      console.error('Character render error:', err);
    }

    // Draw active attack slash arcs, bursts, and sparks right on stage
    if (this.previewParticleSystem) {
      this.previewParticleSystem.draw(ctx);
    }

    ctx.restore();
  }

  // --- CHARACTER PROGRESSION SYSTEM ---
  setupProgressionScreen() {
    const tabsContainer = document.getElementById('prog-char-tabs-container');
    if (!tabsContainer) return;
    tabsContainer.innerHTML = '';

    const charOrder = ['vex', 'solaris', 'lyra', 'aeron', 'kairo', 'nox'];

    charOrder.forEach(charId => {
      const c = CHARACTERS[charId];
      if (!c) return;

      const btn = document.createElement('button');
      btn.className = `prog-tab-btn ${charId === this.selectedProgCharId ? 'active' : ''}`;
      btn.id = `prog-tab-${charId}`;
      btn.style.setProperty('--tab-core-color', c.coreColor);

      const pData = progressionManager.getCharacterProgression(charId);

      btn.innerHTML = `
        <div class="prog-tab-avatar" style="border-color: ${c.coreColor}; background: ${c.coreColor}22; color: ${c.coreColor};">
          ${c.name.charAt(0)}
        </div>
        <div class="prog-tab-meta">
          <div class="prog-tab-name">${c.name}</div>
          <div class="prog-tab-level" id="prog-tab-level-${charId}">LVL ${pData.level} • ${c.role}</div>
        </div>
      `;

      btn.addEventListener('click', () => {
        this.selectedProgCharId = charId;
        document.querySelectorAll('.prog-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.renderProgression(charId);
        soundEngine.playUiClick();
      });

      tabsContainer.appendChild(btn);
    });

    // Spar Now button in Progression banner
    const sparBtn = document.getElementById('btn-prog-play-match');
    if (sparBtn) {
      sparBtn.addEventListener('click', () => {
        const p1 = this.selectedProgCharId || 'vex';
        const p2Roster = ['solaris', 'lyra', 'aeron', 'kairo', 'nox', 'vex'].filter(id => id !== p1);
        const p2 = p2Roster[Math.floor(Math.random() * p2Roster.length)];
        this.launchMatch(p1, p2, 'neon_metro', 'WARRIOR');
        soundEngine.playParry();
      });
    }

    this.renderProgression(this.selectedProgCharId);
  }

  renderProgression(charId) {
    const c = CHARACTERS[charId] || CHARACTERS.vex;
    const pChar = progressionManager.getCharacterProgression(charId);
    const ratings = progressionManager.getCalculatedRatings(charId);

    // Update active tab selection and level badge
    document.querySelectorAll('.prog-tab-btn').forEach(b => {
      b.classList.toggle('active', b.id === `prog-tab-${charId}`);
    });
    const tabLvlEl = document.getElementById(`prog-tab-level-${charId}`);
    if (tabLvlEl) tabLvlEl.textContent = `LVL ${pChar.level} • ${c.role}`;

    // Update Hero Banner Styling
    const bannerBox = document.getElementById('prog-hero-banner-box');
    if (bannerBox) {
      bannerBox.style.setProperty('--banner-core-color', `${c.coreColor}44`);
      bannerBox.style.borderColor = `${c.coreColor}66`;
    }

    // Core Pill
    const corePill = document.getElementById('prog-core-pill');
    if (corePill) {
      corePill.textContent = `${c.core.toUpperCase()} CORE // ${c.role.toUpperCase()}`;
      corePill.style.color = c.coreColor;
      corePill.style.borderColor = c.coreColor;
      corePill.style.background = `${c.coreColor}22`;
    }

    // Evolution Badge
    const evoBadge = document.getElementById('prog-evo-badge');
    if (evoBadge) {
      if (pChar.evolutionTier === 2) {
        evoBadge.textContent = 'TIER 2: ASCENDED';
        evoBadge.style.color = 'var(--accent-gold)';
        evoBadge.style.borderColor = 'var(--accent-gold)';
        evoBadge.style.background = 'rgba(255, 215, 0, 0.15)';
      } else if (pChar.evolutionTier === 1) {
        evoBadge.textContent = 'TIER 1: AWAKENED';
        evoBadge.style.color = 'var(--accent-cyan)';
        evoBadge.style.borderColor = 'var(--accent-cyan)';
        evoBadge.style.background = 'rgba(0, 210, 255, 0.15)';
      } else {
        evoBadge.textContent = 'TIER 0: STANDARD';
        evoBadge.style.color = 'var(--text-muted)';
        evoBadge.style.borderColor = 'var(--border-subtle)';
        evoBadge.style.background = 'rgba(255, 255, 255, 0.05)';
      }
    }

    // Character Name & Title
    const nameEl = document.getElementById('prog-char-name');
    if (nameEl) {
      nameEl.textContent = c.name;
      nameEl.style.color = c.coreColor;
      nameEl.style.textShadow = `0 0 24px ${c.coreColor}`;
    }
    const titleEl = document.getElementById('prog-char-title');
    if (titleEl) titleEl.textContent = `${c.title.toUpperCase()} • ${c.weapon.toUpperCase()}`;

    // Level & XP Bar
    const lvlEl = document.getElementById('prog-char-level');
    if (lvlEl) lvlEl.textContent = `LEVEL ${pChar.level}`;

    const xpTextEl = document.getElementById('prog-xp-text');
    if (xpTextEl) xpTextEl.textContent = `XP ${pChar.currentXp.toLocaleString()} / ${pChar.xpNeeded.toLocaleString()}`;

    const xpFillEl = document.getElementById('prog-xp-bar-fill');
    if (xpFillEl) {
      const pct = Math.min(100, Math.round((pChar.currentXp / pChar.xpNeeded) * 100));
      xpFillEl.style.width = `${pct}%`;
      xpFillEl.style.background = `linear-gradient(90deg, ${c.coreColor}, ${c.coreColorSecondary || '#FFF'})`;
    }

    // Mastery Rank & Bar
    const masteryRankTitle = progressionManager.getMasteryRankTitle(charId, pChar.masteryRank);
    const mastTextEl = document.getElementById('prog-mastery-text');
    if (mastTextEl) mastTextEl.textContent = `MASTERY RANK ${pChar.masteryRank} • ${masteryRankTitle.toUpperCase()}`;

    const mastXpEl = document.getElementById('prog-mastery-xp-text');
    if (mastXpEl) mastXpEl.textContent = `${pChar.masteryXp.toLocaleString()} / ${pChar.masteryXpNeeded.toLocaleString()} Mastery XP`;

    const mastFillEl = document.getElementById('prog-mastery-bar-fill');
    if (mastFillEl) {
      const mastPct = Math.min(100, Math.round((pChar.masteryXp / pChar.masteryXpNeeded) * 100));
      mastFillEl.style.width = `${mastPct}%`;
    }

    // Banner Right: Visual Evolution Box
    const tierIndEl = document.getElementById('prog-tier-indicator');
    if (tierIndEl) {
      tierIndEl.textContent = pChar.evolutionTier === 2 ? 'TIER 2 ACTIVE' : pChar.evolutionTier === 1 ? 'TIER 1 ACTIVE' : 'DORMANT';
      tierIndEl.style.color = pChar.evolutionTier >= 1 ? c.coreColor : 'var(--text-muted)';
    }

    const avBigEl = document.getElementById('prog-avatar-big');
    if (avBigEl) {
      avBigEl.textContent = c.name.charAt(0);
      avBigEl.style.color = c.coreColor;
      avBigEl.style.borderColor = c.coreColor;
      avBigEl.style.background = `${c.coreColor}22`;
      avBigEl.style.boxShadow = `0 0 28px ${c.coreColor}66`;
    }

    const evoTitleEl = document.getElementById('prog-evolution-title');
    if (evoTitleEl) {
      if (pChar.evolutionTier === 2) {
        evoTitleEl.textContent = `Ascended ${c.name} (Radiant Corona)`;
        evoTitleEl.style.color = 'var(--accent-gold)';
      } else if (pChar.evolutionTier === 1) {
        evoTitleEl.textContent = `Awakened Core (Orbital Flares)`;
        evoTitleEl.style.color = c.coreColor;
      } else {
        evoTitleEl.textContent = 'Dormant Aura (Unlock at Lvl 10)';
        evoTitleEl.style.color = 'var(--text-muted)';
      }
    }

    const suitNameEl = document.getElementById('prog-suit-name');
    if (suitNameEl) {
      const equippedSkinObj = (c.skins || []).find(s => s.id === pChar.equippedSkin);
      suitNameEl.textContent = `Equipped: ${equippedSkinObj ? equippedSkinObj.name : 'Default Suit'}`;
    }

    // Column 1: Balanced Ratings
    const pValEl = document.getElementById('prog-val-power');
    if (pValEl) pValEl.textContent = ratings.power;
    const pBarEl = document.getElementById('prog-bar-power');
    if (pBarEl) pBarEl.style.width = `${ratings.power}%`;

    const sValEl = document.getElementById('prog-val-speed');
    if (sValEl) sValEl.textContent = ratings.speed;
    const sBarEl = document.getElementById('prog-bar-speed');
    if (sBarEl) sBarEl.style.width = `${ratings.speed}%`;

    const dValEl = document.getElementById('prog-val-def');
    if (dValEl) dValEl.textContent = ratings.defense;
    const dBarEl = document.getElementById('prog-bar-def');
    if (dBarEl) dBarEl.style.width = `${ratings.defense}%`;

    const tValEl = document.getElementById('prog-val-tech');
    if (tValEl) tValEl.textContent = ratings.technique;
    const tBarEl = document.getElementById('prog-bar-tech');
    if (tBarEl) tBarEl.style.width = `${ratings.technique}%`;

    // Column 2: Unlocked Abilities
    const unlockedContainer = document.getElementById('prog-unlocked-abilities-list');
    if (unlockedContainer) {
      unlockedContainer.innerHTML = '';
      const unlockedAbilities = progressionManager.getUnlockedAbilities(charId);

      unlockedAbilities.forEach(ab => {
        const item = document.createElement('div');
        item.className = 'prog-unlock-item unlocked';
        item.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="prog-unlock-check">✓</span>
              <span style="font-family: var(--font-display); font-size: 13px; font-weight: 800; color: var(--text-primary);">${ab.name}</span>
            </div>
            <span class="prog-unlock-badge unlocked">LEVEL ${ab.level}</span>
          </div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-left: 24px;">${ab.desc}</div>
        `;
        unlockedContainer.appendChild(item);
      });
    }

    // Column 2: Locked Milestones (formatted as "Level X — [Name]")
    const lockedContainer = document.getElementById('prog-locked-abilities-list');
    if (lockedContainer) {
      lockedContainer.innerHTML = '';
      const lockedMilestones = progressionManager.getLockedMilestones(charId);

      lockedMilestones.forEach(m => {
        const item = document.createElement('div');
        item.className = 'prog-unlock-item locked';
        item.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="prog-lock-icon">🔒</span>
              <span style="font-family: 'Oswald', 'Bebas Neue', sans-serif; font-size: 13px; font-weight: 800; color: var(--text-muted);">Level ${m.level} — ${m.name}</span>
            </div>
            <span class="prog-unlock-badge locked">REQUIRES LVL ${m.level}</span>
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-left: 24px;">${m.desc}</div>
        `;
        lockedContainer.appendChild(item);
      });
    }

    // Column 3: Cosmetics & Evolution Track
    const cosmeticsContainer = document.getElementById('prog-cosmetics-track-list');
    if (cosmeticsContainer) {
      cosmeticsContainer.innerHTML = '';
      const cosTrack = progressionManager.getCosmeticsTrack(charId);

      cosTrack.forEach(item => {
        const isUnlocked = pChar.level >= item.level;
        const div = document.createElement('div');
        div.className = `prog-unlock-item ${isUnlocked ? 'unlocked' : 'locked'}`;
        div.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span>${item.icon || '✦'}</span>
              <span style="font-family: 'Oswald', 'Bebas Neue', sans-serif; font-size: 12px; font-weight: 800; color: ${isUnlocked ? 'var(--accent-gold)' : 'var(--text-muted)'};">${item.name}</span>
            </div>
            <span class="prog-unlock-badge ${isUnlocked ? 'unlocked' : 'locked'}">${isUnlocked ? 'ACQUIRED' : `LVL ${item.level}`}</span>
          </div>
          <div style="font-size: 11px; color: ${isUnlocked ? 'var(--text-secondary)' : 'var(--text-muted)'}; margin-left: 24px;">${item.desc}</div>
        `;
        cosmeticsContainer.appendChild(div);
      });
    }

    // Column 3: Active Mastery Challenges
    const challengesContainer = document.getElementById('prog-challenges-list');
    if (challengesContainer) {
      challengesContainer.innerHTML = '';
      const challenges = progressionManager.getCharacterChallenges(charId);

      challenges.forEach(ch => {
        const isDone = ch.current >= ch.target;
        const card = document.createElement('div');
        card.className = `prog-challenge-card ${isDone ? 'completed' : ''}`;

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
            <div>
              <div style="font-family: var(--font-display); font-size: 13px; font-weight: 800; color: ${isDone ? 'var(--accent-green)' : 'var(--text-primary)'};">${ch.title}</div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">${ch.desc}</div>
            </div>
            <div style="font-family: 'Oswald', 'Bebas Neue', sans-serif; font-size: 10px; font-weight: 800; color: var(--accent-gold); white-space: nowrap; margin-left: 8px;">+350 XP</div>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: var(--text-muted); margin-top: 6px;">
            <span>PROGRESS: ${ch.current} / ${ch.target}</span>
            ${isDone 
              ? `<button class="btn-primary-glow btn-claim-challenge" data-challenge="${ch.id}" style="padding: 3px 10px; font-size: 10px; border-radius: 4px;">CLAIM</button>`
              : `<span>${Math.round((ch.current / ch.target) * 100)}%</span>`
            }
          </div>
          <div style="height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; margin-top: 4px;">
            <div style="width: ${Math.min(100, (ch.current / ch.target) * 100)}%; height: 100%; background: ${isDone ? 'var(--accent-green)' : c.coreColor};"></div>
          </div>
        `;

        challengesContainer.appendChild(card);
      });

      // Claim challenge button handlers
      challengesContainer.querySelectorAll('.btn-claim-challenge').forEach(btn => {
        btn.addEventListener('click', () => {
          const chId = btn.getAttribute('data-challenge');
          const claimResult = progressionManager.completeChallenge(charId, chId);
          if (claimResult) {
            soundEngine.playParry();
            this.updateUserDisplay();
            this.renderProgression(charId);
          }
        });
      });
    }
  }

  // --- ROSTER SCREEN ---
  setupRoster() {
    const list = document.getElementById('roster-list-container');
    list.innerHTML = '';

    for (const charId in CHARACTERS) {
      const c = CHARACTERS[charId];
      const item = document.createElement('div');
      item.className = `roster-item ${charId === this.selectedCharId ? 'active' : ''}`;
      item.id = `roster-item-${charId}`;

      item.innerHTML = `
        <div class="roster-avatar" style="border-color: ${c.coreColor}; background: ${c.coreColor}22; color: ${c.coreColor};">
          ${c.name.charAt(0)}
        </div>
        <div class="roster-info">
          <div class="roster-name">${c.name}</div>
          <div class="roster-role">${c.role} • ${c.core} Core</div>
        </div>
      `;

      item.addEventListener('click', () => {
        document.querySelectorAll('.roster-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        this.selectedCharId = charId;
        this.renderCharacterDetails(charId);
        soundEngine.playUiClick();
      });

      list.appendChild(item);
    }

    this.renderCharacterDetails(this.selectedCharId);

    // Set Main Button
    document.getElementById('btn-char-select-main').addEventListener('click', () => {
      progressionManager.data.profile.mainCharacter = this.selectedCharId;
      progressionManager.saveData();
      this.updateUserDisplay();
      this.renderHomeHero();
      soundEngine.playParry();
      this.showToast(`${CHARACTERS[this.selectedCharId].name} is now your Main Warrior!`, 'success');
    });

    // Customize Button
    document.getElementById('btn-char-customize').addEventListener('click', () => {
      this.selectedCustomCharId = this.selectedCharId;
      this.renderCustomizationScreen(this.selectedCustomCharId);
      this.showScreen('screen-character-details');
    });
  }

  renderCharacterDetails(charId) {
    const c = CHARACTERS[charId];
    if (!c) return;

    document.getElementById('detail-core-tag').textContent = `${c.core.toUpperCase()} CORE // ${c.role.toUpperCase()}`;
    document.getElementById('detail-core-tag').style.color = c.coreColor;
    document.getElementById('detail-core-tag').style.borderColor = c.coreColor;
    document.getElementById('detail-core-tag').style.background = `${c.coreColor}18`;

    document.getElementById('detail-char-name').textContent = c.name;
    document.getElementById('detail-char-name').style.color = c.coreColor;
    document.getElementById('detail-char-title').textContent = `${c.title} • Weapon: ${c.weapon}`;
    document.getElementById('detail-char-lore').textContent = c.lore;

    // Base Stats
    document.getElementById('stat-val-hp').textContent = c.baseStats.hp.toLocaleString();
    document.getElementById('stat-val-atk').textContent = c.baseStats.atk;
    document.getElementById('stat-val-def').textContent = c.baseStats.def;
    document.getElementById('stat-val-spd').textContent = c.baseStats.speed;
    document.getElementById('stat-val-crit').textContent = `${Math.round(c.baseStats.critChance * 100)}%`;
    document.getElementById('stat-val-core').textContent = `${c.baseStats.coreRate}x`;

    // Abilities Grid
    const grid = document.getElementById('detail-abilities-grid');
    grid.innerHTML = '';

    c.abilities.forEach(ab => {
      const card = document.createElement('div');
      card.className = 'ability-card';
      card.innerHTML = `
        <div class="ability-key">${ab.key}</div>
        <div class="ability-name">${ab.name}</div>
        <div style="font-size: 11px; color: ${c.coreColor}; font-weight: 700; margin-bottom: 4px;">${ab.type} • DMG: ${ab.damage}</div>
        <div class="ability-desc">${ab.description}</div>
      `;
      grid.appendChild(card);
    });
  }

  // --- CHARACTER CUSTOMIZATION (SKINS & MASTERY) ---
  renderCustomizationScreen(charId) {
    const c = CHARACTERS[charId];
    const pChar = progressionManager.data.characters[charId];
    document.getElementById('custom-char-name').textContent = `${c.name} PROTOCOLS & SUITS`;
    document.getElementById('custom-char-name').style.color = c.coreColor;
    document.getElementById('custom-shards-display').textContent = progressionManager.data.profile.shards.toLocaleString();

    // Skins List
    const skinsContainer = document.getElementById('skins-list-container');
    skinsContainer.innerHTML = '';

    c.skins.forEach(skin => {
      const isUnlocked = pChar.unlockedSkins.includes(skin.id);
      const isEquipped = pChar.equippedSkin === skin.id;

      const item = document.createElement('div');
      item.style.cssText = `
        background: var(--surface-white);
        border: 1px solid ${isEquipped ? c.coreColor : 'var(--border-neutral)'};
        border-radius: 8px;
        padding: 14px 18px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      `;

      item.innerHTML = `
        <div>
          <div style="font-family: var(--font-display); font-weight: 800; font-size: 15px; color: ${skin.color};">${skin.name}</div>
          <div style="font-size: 12px; color: var(--text-muted);">${skin.rarity} Skin ${isEquipped ? '• <strong style="color: var(--primary-action);">EQUIPPED</strong>' : ''}</div>
        </div>
        <div>
          ${isEquipped 
            ? '<button class="btn-secondary" disabled style="padding: 6px 14px; font-size: 11px;">EQUIPPED</button>'
            : isUnlocked
              ? `<button class="btn-secondary btn-equip-skin" data-skin="${skin.id}" style="padding: 6px 14px; font-size: 11px;">EQUIP</button>`
              : `<button class="btn-primary-glow btn-buy-skin" data-skin="${skin.id}" data-cost="${skin.cost}" style="padding: 6px 14px; font-size: 11px;">UNLOCK [${skin.cost} ✦]</button>`
          }
        </div>
      `;

      skinsContainer.appendChild(item);
    });

    // Equip skin click handlers
    skinsContainer.querySelectorAll('.btn-equip-skin').forEach(b => {
      b.addEventListener('click', (e) => {
        const skinId = b.getAttribute('data-skin');
        progressionManager.equipSkin(charId, skinId);
        soundEngine.playUiClick();
        this.renderCustomizationScreen(charId);
      });
    });

    // Buy skin click handlers (Zero Pay-to-Win: In-Game Shards Only)
    skinsContainer.querySelectorAll('.btn-buy-skin').forEach(b => {
      b.addEventListener('click', (e) => {
        const skinId = b.getAttribute('data-skin');
        const cost = parseInt(b.getAttribute('data-cost'));
        if (progressionManager.purchaseSkin(charId, skinId, cost)) {
          progressionManager.equipSkin(charId, skinId);
          soundEngine.playParry();
          this.updateUserDisplay();
          this.renderCustomizationScreen(charId);
        } else {
          soundEngine.playBlock();
          this.showToast('Not enough Rift Shards! Earn more shards by winning matches and completing story chapters.', 'error');
        }
      });
    });

    // Mastery Challenges List
    const masteryContainer = document.getElementById('mastery-list-container');
    masteryContainer.innerHTML = '';

    pChar.challenges.forEach(ch => {
      const isDone = ch.current >= ch.target;
      const card = document.createElement('div');
      card.style.cssText = `
        background: var(--surface-white);
        border: 1px solid ${isDone ? 'var(--accent-green)' : 'var(--border-neutral)'};
        border-radius: 8px;
        padding: 14px 18px;
      `;

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <div style="font-family: var(--font-display); font-weight: 800; font-size: 14px; color: ${isDone ? 'var(--accent-green)' : 'var(--text-primary)'};">${ch.title}</div>
          <div style="font-size: 12px; color: var(--accent-gold); font-weight: 700;">REWARD: ${ch.reward}</div>
        </div>
        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">${ch.desc}</div>
        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: var(--text-muted);">
          <span>PROGRESS</span>
          <span>${ch.current} / ${ch.target}</span>
        </div>
        <div style="height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; overflow: hidden; margin-top: 4px;">
          <div style="width: ${Math.min(100, (ch.current / ch.target) * 100)}%; height: 100%; background: ${isDone ? 'var(--accent-green)' : 'var(--accent-cyan)'};"></div>
        </div>
      `;

      masteryContainer.appendChild(card);
    });
  }

  // --- CASUAL MATCH SETUP ---
  setupCasualSetup() {
    const p1Select = document.getElementById('select-p1-char');
    const p2Select = document.getElementById('select-p2-char');
    const arenaSelect = document.getElementById('select-arena');

    p1Select.innerHTML = '';
    p2Select.innerHTML = '';
    arenaSelect.innerHTML = '';

    for (const charId in CHARACTERS) {
      const c = CHARACTERS[charId];
      p1Select.innerHTML += `<option value="${charId}">${c.name} (${c.role})</option>`;
      p2Select.innerHTML += `<option value="${charId}" ${charId === 'solaris' ? 'selected' : ''}>${c.name} (${c.role})</option>`;
    }

    for (const arenaId in ARENAS) {
      const a = ARENAS[arenaId];
      arenaSelect.innerHTML += `<option value="${arenaId}">${a.name} - ${a.subtitle}</option>`;
    }

    const backCasualBtn = document.getElementById('btn-back-to-play-from-casual');
    if (backCasualBtn) {
      backCasualBtn.addEventListener('click', () => {
        this.showScreen('screen-play');
        soundEngine.playUiClick();
      });
    }

    const startCasualBtn = document.getElementById('btn-start-casual-match');
    if (startCasualBtn) {
      startCasualBtn.addEventListener('click', () => {
        const p1 = p1Select.value;
        const p2 = p2Select.value;
        const arena = arenaSelect.value;
        const diffMode = document.getElementById('select-ai-diff').value;

        this.engine.isLocal2Player = (diffMode === 'LOCAL_2P');
        this.showGameView();
        this.engine.initMatch(p1, p2, arena, 'Casual', diffMode === 'LOCAL_2P' ? 'WARRIOR' : diffMode);
        this.engine.startLoop();
      });
    }
  }

  // --- RANKED SCREEN CONTROLLER (SECTION A: RANK, SECTION B: MATCHES, SECTION C: HISTORY) ---
  setupRankedSetup() {
    this.rankHistoryFilter = 'ALL';
    const filterAll = document.getElementById('filter-rank-all');
    const filterRanked = document.getElementById('filter-rank-ranked');
    const filterCasual = document.getElementById('filter-rank-casual');

    const setRankFilter = (f) => {
      this.rankHistoryFilter = f;
      [filterAll, filterRanked, filterCasual].forEach(b => {
        if (b) b.classList.remove('active');
      });
      if (f === 'ALL' && filterAll) filterAll.classList.add('active');
      if (f === 'Ranked' && filterRanked) filterRanked.classList.add('active');
      if (f === 'Casual' && filterCasual) filterCasual.classList.add('active');
      this.renderRankMatchHistoryList();
      soundEngine.playUiClick();
    };

    if (filterAll) filterAll.onclick = () => setRankFilter('ALL');
    if (filterRanked) filterRanked.onclick = () => setRankFilter('Ranked');
    if (filterCasual) filterCasual.onclick = () => setRankFilter('Casual');

    // Return to home
    const backBtn = document.getElementById('btn-rank-return-home');
    if (backBtn) {
      backBtn.onclick = () => {
        this.showScreen('screen-home');
        soundEngine.playUiClick();
      };
    }

    // Launch Ranked Match CTA button
    const startRankedBtn = document.getElementById('btn-rank-start-match');
    if (startRankedBtn) {
      startRankedBtn.onclick = () => {
        const p1Id = progressionManager.getMainCharacter() || this.selectedSelectCharId || 'vex';
        const p2Id = this.getRandomOpponent(p1Id);
        const currentRank = progressionManager.getCurrentRankInfo();
        const diff = competitiveNetworkCoordinator?.localProvider?.getRankCalibratedBotDifficulty?.(currentRank.tier) || 'WARRIOR';
        soundEngine.playUiClick();
        this.launchMatchWithTransition(p1Id, p2Id, 'neon_metro', diff, 'Ranked');
      };
    }

    // Legacy fallback button
    const legacyBackBtn = document.getElementById('btn-back-to-play-from-ranked');
    if (legacyBackBtn) {
      legacyBackBtn.onclick = () => {
        this.showScreen('screen-home');
        soundEngine.playUiClick();
      };
    }
  }

  renderRankedSetup() {
    const rankInfo = progressionManager.getCurrentRankInfo();
    const prof = progressionManager.data.profile || {};
    const ranked = progressionManager.data.ranked || {};

    const crestEl = document.getElementById('ranked-setup-crest');
    if (crestEl) crestEl.textContent = rankInfo.icon || '🥈';

    const titleEl = document.getElementById('ranked-setup-rank-title');
    if (titleEl) {
      titleEl.textContent = rankInfo.formattedName.toUpperCase();
      titleEl.style.color = rankInfo.color;
    }

    const rpTextEl = document.getElementById('ranked-setup-rp-text');
    if (rpTextEl) {
      rpTextEl.textContent = `${rankInfo.totalRp} Total RP • ${rankInfo.divisionRp} / 100 RP towards ${rankInfo.nextTierName} Promotion`;
    }

    const rpBarFill = document.getElementById('ranked-setup-bar-fill');
    if (rpBarFill) {
      rpBarFill.style.width = `${Math.min(100, Math.max(0, rankInfo.divisionRp))}%`;
    }

    const streakEl = document.getElementById('ranked-setup-streak');
    if (streakEl) streakEl.textContent = `🔥 ${prof.winStreak || ranked.streak || 0}`;

    const peakEl = document.getElementById('ranked-setup-peak');
    if (peakEl) peakEl.textContent = ranked.peakTier || rankInfo.formattedName;

    const history = progressionManager.data.matchHistory || [];
    const totalMatches = history.length || ((ranked.seasonWins || 0) + (ranked.seasonLosses || 0));
    const totalWins = history.filter(m => m.result === 'VICTORY').length || (ranked.seasonWins || 0);
    const totalLosses = history.filter(m => m.result === 'DEFEAT').length || (ranked.seasonLosses || 0);

    const totalEl = document.getElementById('ranked-stat-total-matches');
    if (totalEl) totalEl.textContent = totalMatches;

    const winsEl = document.getElementById('ranked-stat-wins');
    if (winsEl) winsEl.textContent = totalWins;

    const lossesEl = document.getElementById('ranked-stat-losses');
    if (lossesEl) lossesEl.textContent = totalLosses;

    const winrateEl = document.getElementById('ranked-setup-winrate');
    if (winrateEl) winrateEl.textContent = progressionManager.getOverallWinRate();

    this.renderRankMatchHistoryList();
  }

  renderRankMatchHistoryList() {
    const listEl = document.getElementById('ranked-history-list');
    const emptyEl = document.getElementById('ranked-empty-state');
    if (!listEl) return;
    listEl.innerHTML = '';

    const filter = this.rankHistoryFilter || 'ALL';
    const matches = (progressionManager.data.matchHistory || []).filter(m => {
      if (filter === 'ALL') return true;
      return m.mode === filter;
    });

    if (matches.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';

    matches.slice(0, 20).forEach(m => {
      const row = document.createElement('div');
      row.className = 'rank-match-row';
      const isWin = (m.result === 'VICTORY');
      const heroChar = CHARACTERS[m.hero] || { name: m.hero || 'Warrior', coreColor: '#00D2FF' };
      const oppChar = CHARACTERS[m.opponent] || { name: m.opponent || 'Rival', coreColor: '#FF5E7E' };
      const timeStr = m.timestamp ? new Date(m.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent';

      row.innerHTML = `
        <div class="rank-match-left">
          <span class="rank-outcome-tag ${isWin ? 'win' : 'loss'}">${isWin ? 'WIN' : 'LOSS'}</span>
          <div class="rank-match-fighters">
            <span class="fighter-p1" style="color: ${heroChar.coreColor}">● ${escapeHtml(heroChar.name)}</span>
            <span class="vs-divider">VS</span>
            <span class="fighter-p2" style="color: ${oppChar.coreColor}">● ${escapeHtml(oppChar.name)}</span>
          </div>
        </div>
        <div class="rank-match-right">
          <span class="rank-match-mode">${escapeHtml(m.mode || 'Casual')}</span>
          <span class="rank-match-score">${escapeHtml(m.roundScore || '2 - 0')}</span>
          <span class="rank-match-rp" style="color: ${m.rpChange && m.rpChange.startsWith('+') ? 'var(--accent-green)' : (m.rpChange && m.rpChange.startsWith('-') ? 'var(--accent-red)' : 'var(--text-muted)')}">${escapeHtml(m.rpChange || '0 RP')}</span>
          <span class="rank-match-time">${escapeHtml(timeStr)}</span>
        </div>
      `;
      listEl.appendChild(row);
    });
  }

  // --- PROFILE SCREEN CONTROLLER & TELEMETRY ---
  setupProfileScreen() {
    // Match History Filter Tabs
    const filterAll = document.getElementById('filter-match-all');
    const filterRanked = document.getElementById('filter-match-ranked');
    const filterCasual = document.getElementById('filter-match-casual');

    const setFilter = (filter) => {
      this.matchHistoryFilter = filter;
      [filterAll, filterRanked, filterCasual].forEach(b => {
        if (b) b.classList.remove('active');
      });
      if (filter === 'ALL' && filterAll) filterAll.classList.add('active');
      if (filter === 'Ranked' && filterRanked) filterRanked.classList.add('active');
      if (filter === 'Casual' && filterCasual) filterCasual.classList.add('active');
      this.renderMatchHistory();
      soundEngine.playUiClick();
    };

    if (filterAll) filterAll.onclick = () => setFilter('ALL');
    if (filterRanked) filterRanked.onclick = () => setFilter('Ranked');
    if (filterCasual) filterCasual.onclick = () => setFilter('Casual');

    // Season Reset Modal Handlers
    const resetBtn = document.getElementById('btn-simulate-season-reset');
    const resetModal = document.getElementById('modal-season-reset');
    const closeResetBtn = document.getElementById('btn-close-season-modal');
    const cancelResetBtn = document.getElementById('btn-cancel-season-reset');
    const confirmResetBtn = document.getElementById('btn-confirm-season-reset');

    if (resetBtn && resetModal) {
      resetBtn.onclick = () => {
        const currentRank = progressionManager.getCurrentRankInfo();
        const peakRank = progressionManager.data.ranked.peakTier || currentRank.formattedName;
        const preview = CompetitiveRankEngine.performSeasonReset(progressionManager.data.ranked);

        const oldRankEl = document.getElementById('reset-modal-old-rank');
        if (oldRankEl) oldRankEl.textContent = `${peakRank} (${currentRank.totalRp} RP)`;

        const newRankEl = document.getElementById('reset-modal-new-rank');
        if (newRankEl) newRankEl.textContent = `${preview.newRank.formattedName} (${preview.newRp} RP)`;

        const rewardsEl = document.getElementById('reset-modal-rewards-list');
        if (rewardsEl) {
          const rewardNames = preview.earnedRewards.map(r => `• ${r.title}: ${r.rewardItem}`).join(' ');
          rewardsEl.textContent = `${rewardNames} • +${preview.shardsBonus} Shards`;
        }

        resetModal.classList.add('active');
        soundEngine.playUiClick();
      };
    }

    const closeReset = () => {
      if (resetModal) resetModal.classList.remove('active');
      soundEngine.playUiClick();
    };

    if (closeResetBtn) closeResetBtn.onclick = closeReset;
    if (cancelResetBtn) cancelResetBtn.onclick = closeReset;

    if (confirmResetBtn) {
      confirmResetBtn.onclick = () => {
        this.showConfirmation(
          'Finalize Season 1?',
          'Are you sure you want to finalize Season 1? Your competitive rating will be soft-reset and seasonal rewards will be deposited into your account.',
          () => {
            const resetResult = progressionManager.performSeasonReset();
            if (resetModal) resetModal.classList.remove('active');
            this.updateUserDisplay();
            this.renderProfile();
            soundEngine.playParry();
            this.showToast(`🏆 Season 1 Finalized! Disbursed +${resetResult.shardsBonus} Rift Shards and seasonal rewards. Welcome to Season ${resetResult.newSeason}!`, 'success');
          },
          true
        );
      };
    }
  }

  // --- STORY MODE CONTROLLER ---
  setupStoryMode() {
    // 1. Tab switching between Chapters and Codex
    const tabChaptersBtn = document.getElementById('btn-story-tab-chapters');
    const tabCodexBtn = document.getElementById('btn-story-tab-codex');
    const chaptersView = document.getElementById('story-chapters-view');
    const codexView = document.getElementById('story-codex-view');

    if (tabChaptersBtn && tabCodexBtn) {
      tabChaptersBtn.onclick = () => {
        tabChaptersBtn.classList.add('active');
        tabCodexBtn.classList.remove('active');
        chaptersView.style.display = 'block';
        codexView.style.display = 'none';
        soundEngine.playUiClick();
      };

      tabCodexBtn.onclick = () => {
        tabCodexBtn.classList.add('active');
        tabChaptersBtn.classList.remove('active');
        chaptersView.style.display = 'none';
        codexView.style.display = 'block';
        this.renderCodexView();
        soundEngine.playUiClick();
      };
    }

    // 2. Update overall campaign progress
    const unlockedCount = [1, 2, 3, 4, 5].filter(id => progressionManager.isChapterUnlocked(id)).length;
    const completedCount = [1, 2, 3, 4, 5].filter(id => progressionManager.isChapterCompleted(id)).length;
    const progressEl = document.getElementById('story-overall-progress');
    if (progressEl) {
      progressEl.textContent = `Campaign Progress: ${completedCount} / 5 Chapters Cleared • Chapter ${unlockedCount} / 5 Unlocked (${Math.round((completedCount / 5) * 100)}%)`;
    }

    // 3. Populate Chapter Cards
    const grid = document.getElementById('story-chapters-grid');
    if (!grid) return;
    grid.innerHTML = '';

    STORY_CHAPTERS.forEach(ch => {
      const isUnlocked = progressionManager.isChapterUnlocked(ch.id);
      const isCompleted = progressionManager.isChapterCompleted(ch.id);
      const curStage = progressionManager.getChapterStage(ch.id);
      const stars = progressionManager.getChapterStars(ch.id);

      const card = document.createElement('div');
      card.className = `story-chapter-card ${!isUnlocked ? 'locked' : ''} ${isCompleted ? 'completed' : ''}`;
      
      // Determine accent color
      let accentColor = '#00D2FF';
      if (ch.id === 1) accentColor = '#FF3366'; // Crimson
      else if (ch.id === 2) accentColor = '#00FF88'; // Emerald
      else if (ch.id === 3) accentColor = '#FFB800'; // Gold
      else if (ch.id === 4) accentColor = '#A855F7'; // Violet
      else if (ch.id === 5) accentColor = '#00D2FF'; // Genesis cyan
      card.style.setProperty('--card-core-accent', accentColor);

      const bossStage = ch.stages[ch.stages.length - 1];
      const starString = isCompleted ? '★★★'.slice(0, Math.max(1, stars)) : '';

      card.innerHTML = `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div class="mode-badge" style="color: ${accentColor}; border: 1px solid ${accentColor}; margin: 0;">
              ${!isUnlocked ? '🔒 LOCKED' : isCompleted ? `✓ CLEARED ${starString}` : `CHAPTER ${ch.id} // ACTIVE`}
            </div>
            <div style="font-family: 'Oswald', 'Bebas Neue', sans-serif; font-size: 10px; font-weight: 800; color: var(--text-muted);">${ch.coreFocus}</div>
          </div>

          <div style="font-family: var(--font-display); font-size: 18px; font-weight: 700; margin: 8px 0 2px; color: ${isUnlocked ? 'var(--text-primary)' : 'var(--text-muted)'};">${ch.title}</div>
          <div style="font-size: 11px; color: var(--accent-cyan); font-weight: 700; margin-bottom: 8px;">${ch.subtitle}</div>
          
          <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px;">
            ${ch.synopsis.slice(0, 150)}...
          </div>

          <!-- Stage Progress Pills (Stage 1, Stage 2, Boss) -->
          <div style="font-family: 'Oswald', 'Bebas Neue', sans-serif; font-size: 10px; color: var(--text-muted); font-weight: 800;">ENCOUNTER PROGRESSION:</div>
          <div class="story-stage-indicator">
            <div class="stage-pill ${isCompleted || curStage > 1 ? 'done' : curStage === 1 ? 'current' : ''}"></div>
            <div class="stage-pill ${isCompleted || curStage > 2 ? 'done' : curStage === 2 ? 'current' : ''}"></div>
            <div class="stage-pill ${isCompleted ? 'done' : curStage >= 3 ? 'current' : ''}"></div>
          </div>

          <!-- Boss Tag -->
          <div class="story-boss-preview-badge" style="margin-top: 10px;">
            <span>⚔</span>
            <span>${bossStage ? bossStage.bossTitle : 'BOSS ENCOUNTER'}</span>
          </div>
        </div>

        <div style="margin-top: 16px; border-top: 1px solid var(--border-subtle); padding-top: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 11px;">
            <span style="color: var(--accent-gold); font-weight: 700;">+${ch.rewards.shards} ✦ • +${ch.rewards.charXp} XP</span>
            <span style="color: var(--text-muted);">Title: "${ch.rewards.title}"</span>
          </div>

          ${isUnlocked
            ? `<button class="btn-primary-glow btn-play-chapter" data-chapter="${ch.id}" style="width: 100%; padding: 10px; font-size: 12px;">
                ${isCompleted ? 'REPLAY CHAPTER ➔' : `CONTINUE STAGE ${curStage} ➔`}
               </button>`
            : `<button class="btn-secondary" disabled style="width: 100%; padding: 10px; font-size: 11px; opacity: 0.5;">
                🔒 COMPLETE CHAPTER ${ch.id - 1} TO UNLOCK
               </button>`
          }
        </div>
      `;

      grid.appendChild(card);
    });

    // Wire up chapter play buttons
    grid.querySelectorAll('.btn-play-chapter').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-chapter'));
        this.openStoryDialogue(id);
      });
    });

    // Advance story dialogue clicks
    const contentBox = document.getElementById('story-dialogue-content');
    if (contentBox) {
      contentBox.onclick = () => this.advanceStoryDialogue();
    }

    const nextBtn = document.getElementById('btn-advance-story-dialogue');
    if (nextBtn) {
      nextBtn.onclick = () => this.advanceStoryDialogue();
    }

    const startBattleBtn = document.getElementById('btn-start-story-battle');
    if (startBattleBtn) {
      startBattleBtn.onclick = () => {
        document.getElementById('modal-story-dialogue').classList.remove('active');
        if (this.currentChapter && this.currentStage) {
          this.launchStoryStage(this.currentChapter, this.currentStage);
        }
      };
    }
  }

  // --- ARCHITECT CODEX LOGS VIEWER ---
  renderCodexView() {
    const listContainer = document.getElementById('codex-logs-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    STORY_CHAPTERS.forEach(ch => {
      const log = ch.codexLog;
      if (!log) return;

      const isUnlocked = progressionManager.isCodexLogUnlocked(log.id);
      const isSelected = this.selectedCodexLogId === log.id;

      const itemBtn = document.createElement('div');
      itemBtn.className = `codex-item-btn ${isSelected ? 'active' : ''}`;
      itemBtn.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-family: 'Oswald', 'Bebas Neue', sans-serif; font-size: 10px; font-weight: 800; color: ${isUnlocked ? 'var(--accent-cyan)' : 'var(--text-muted)'};">
            ${isUnlocked ? 'DECRYPTED ARCHIVE' : '🔒 ENCRYPTED CIPHER'}
          </span>
          <span style="font-size: 10px; color: var(--text-muted);">CH ${ch.id}</span>
        </div>
        <div style="font-family: 'Oswald', 'Bebas Neue', sans-serif; font-size: 12px; font-weight: 700; color: ${isUnlocked ? '#FFF' : 'var(--text-muted)'};">
          ${isUnlocked ? log.title : `Archon Cipher 0${ch.id} (Locked)`}
        </div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
          ${isUnlocked ? log.classification : `Complete Chapter ${ch.id} to Decrypt`}
        </div>
      `;

      if (isUnlocked) {
        itemBtn.addEventListener('click', () => {
          this.selectedCodexLogId = log.id;
          document.querySelectorAll('.codex-item-btn').forEach(b => b.classList.remove('active'));
          itemBtn.classList.add('active');
          this.displayCodexLog(log);
          soundEngine.playUiClick();
        });
      }

      listContainer.appendChild(itemBtn);
    });

    // Display initially selected log or first unlocked log
    const initialLog = STORY_CHAPTERS.find(c => c.codexLog && c.codexLog.id === this.selectedCodexLogId)?.codexLog 
      || STORY_CHAPTERS[0].codexLog;
    if (initialLog) this.displayCodexLog(initialLog);
  }

  displayCodexLog(log) {
    const stampEl = document.getElementById('codex-reader-stamp');
    if (stampEl) stampEl.textContent = log.classification || 'CLASSIFIED EYES ONLY';

    const dateEl = document.getElementById('codex-reader-date');
    if (dateEl) dateEl.textContent = log.date || 'CYCLE 342 POST-DISJUNCTION';

    const titleEl = document.getElementById('codex-reader-title');
    if (titleEl) titleEl.textContent = log.title;

    const authEl = document.getElementById('codex-reader-author');
    if (authEl) authEl.textContent = `Author: ${log.author}`;

    const bodyEl = document.getElementById('codex-reader-body');
    if (bodyEl) bodyEl.textContent = log.content;
  }

  openStoryDialogue(chapterId) {
    const ch = STORY_CHAPTERS.find(c => c.id === chapterId);
    if (!ch) return;
    this.currentChapter = ch;

    // Determine which stage within the chapter to engage
    let stageIdx = progressionManager.getChapterStage(chapterId);
    if (stageIdx > ch.stages.length) stageIdx = ch.stages.length;
    this.currentStage = ch.stages[stageIdx - 1] || ch.stages[0];
    this.dialogueStep = 0;

    // Modal elements
    document.getElementById('story-dialogue-title').textContent = ch.title.toUpperCase();
    document.getElementById('story-dialogue-sub').textContent = `${ch.subtitle} • ${this.currentStage.name}`;

    const stageBadge = document.getElementById('story-dialogue-stage-badge');
    if (stageBadge) {
      if (this.currentStage.isBoss) {
        stageBadge.textContent = '🔥 CLIMACTIC BOSS';
        stageBadge.style.color = '#FF0055';
        stageBadge.style.borderColor = '#FF0055';
        stageBadge.style.background = 'rgba(255, 0, 85, 0.2)';
      } else {
        stageBadge.textContent = `STAGE ${this.currentStage.stageIndex} / ${ch.stages.length}`;
        stageBadge.style.color = 'var(--accent-cyan)';
        stageBadge.style.borderColor = 'var(--accent-cyan)';
        stageBadge.style.background = 'rgba(0, 210, 255, 0.15)';
      }
    }

    // Boss traits box
    const bossBox = document.getElementById('story-boss-traits-box');
    if (bossBox) {
      if (this.currentStage.isBoss) {
        bossBox.style.display = 'block';
        document.getElementById('story-boss-title-banner').textContent = `BOSS ENCOUNTER: ${this.currentStage.bossTitle}`;
        document.getElementById('story-boss-traits-desc').textContent = this.currentStage.bossTraits || 'Enhanced Combat Capabilities';
      } else {
        bossBox.style.display = 'none';
      }
    }

    // Objective text
    const objEl = document.getElementById('story-objective-text');
    if (objEl) objEl.textContent = this.currentStage.objective;

    document.getElementById('modal-story-dialogue').classList.add('active');
    this.renderCurrentDialogueLine();
  }

  advanceStoryDialogue() {
    if (!this.currentStage || !this.currentStage.dialogue) return;
    this.dialogueStep++;
    if (this.dialogueStep >= this.currentStage.dialogue.length) {
      this.dialogueStep = this.currentStage.dialogue.length - 1;
    }
    this.renderCurrentDialogueLine();
    soundEngine.playUiHover();
  }

  renderCurrentDialogueLine() {
    if (!this.currentStage || !this.currentStage.dialogue) return;
    const line = this.currentStage.dialogue[this.dialogueStep];
    if (!line) return;

    const speakerEl = document.getElementById('story-speaker-name');
    if (speakerEl) speakerEl.textContent = line.speaker.toUpperCase();

    const textEl = document.getElementById('story-speech-text');
    if (textEl) textEl.textContent = line.text;

    const stepEl = document.getElementById('story-dialogue-step');
    if (stepEl) stepEl.textContent = `${this.dialogueStep + 1} / ${this.currentStage.dialogue.length}`;

    // Update Speaker Avatar
    const avEl = document.getElementById('story-speaker-avatar');
    if (avEl) {
      avEl.textContent = line.speaker.charAt(0);
      const speakerLower = line.speaker.toLowerCase();
      const speakerChar = CHARACTERS[speakerLower];
      const color = speakerChar ? speakerChar.coreColor : '#00D2FF';
      avEl.style.borderColor = color;
      avEl.style.color = color;
      avEl.style.background = `${color}22`;
      avEl.style.boxShadow = `0 0 16px ${color}66`;
    }
  }

  launchStoryStage(chapter, stage) {
    this.engine.isLocal2Player = false;
    this.showGameView();
    this.engine.initMatch(stage.hero, stage.opponent, stage.arena, 'Story', stage.aiDifficulty);
    this.engine.startLoop();
  }

  // --- RANKED 1V1 COMPETITIVE SETUP NAVIGATION ---
  openRankedSetup() {
    this.showScreen('screen-ranked-setup');
    this.renderRankedSetup();
    soundEngine.playUiClick();
  }

  // --- SURVIVAL & BOSS RUSH & TRAINING ---
  startSurvivalMatch() {
    const mainChar = progressionManager.data.profile.mainCharacter;
    this.engine.isLocal2Player = false;
    this.showGameView();
    this.engine.initMatch(mainChar, 'nox', 'frozen_core', 'Survival', 'MASTER');
    this.engine.startLoop();
  }

  startBossRushMatch() {
    const mainChar = progressionManager.data.profile.mainCharacter;
    this.engine.isLocal2Player = false;
    this.showGameView();
    this.engine.initMatch(mainChar, 'solaris', 'void_arena', 'BossRush', 'BOSS');
    this.engine.startLoop();
  }

  startTrainingArena() {
    const mainChar = progressionManager.data.profile.mainCharacter;
    this.engine.isLocal2Player = false;
    this.engine.showHitboxes = true; // Show hitboxes in Training Lab!
    this.engine.initMatch(mainChar, 'aeron', 'neon_metro', 'Training', 'RECRUIT');
    this.showGameView();
    this.engine.startLoop();
  }

  showGameView() {
    this.stopHomeHeroLoop();
    this.stopPreviewLoop();

    document.body.classList.add('in-combat');
    const fb = document.getElementById('btn-floating-contact');
    if (fb) fb.style.display = 'none';

    // Blur active focused element so Space doesn't re-trigger buttons during gameplay
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }

    // Deactivate all screens behind game-view so their keyboard handlers do not fire
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    document.getElementById('game-view').style.display = 'block';

    try {
      const docEl = document.documentElement;
      const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
      if (req && (this.isTouchDevice() || window.innerWidth <= 1024)) {
        req.call(docEl).catch(() => {});
      }
      if (window.screen?.orientation?.lock) {
        window.screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (_) {}

    this.checkOrientation();

    const isTraining = (this.engine.gameMode === 'Training');
    const trainOverlay = document.getElementById('training-telemetry-overlay');
    if (trainOverlay) {
      trainOverlay.style.display = isTraining ? 'block' : 'none';
      if (isTraining) {
        const lastIn = document.getElementById('train-last-input');
        if (lastIn) lastIn.textContent = 'NEUTRAL';
        const chain = document.getElementById('train-combo-chain');
        if (chain) chain.textContent = 'READY';
        const dmg = document.getElementById('train-total-dmg');
        if (dmg) dmg.textContent = '0 DMG';
      }
    }

    if (this.engine.touchControls) {
      this.engine.touchControls.updateVisibility();
    }

    const tutCompleted = localStorage.getItem('riftborn_tutorial_completed');
    if (!tutCompleted && isTraining) {
      this.startTutorial();
    }
  }

  // --- COMBAT PAUSE CONTROLLER ---
  togglePause() {
    if (!this.engine) return;
    const pauseModal = document.getElementById('modal-combat-pause');
    if (!pauseModal) return;

    if (this.engine.isPaused) {
      // Resume
      this.engine.isPaused = false;
      pauseModal.style.display = 'none';
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    } else {
      // Pause whenever match arena is open and active
      const isGameView = document.getElementById('game-view')?.style.display === 'block';
      if (isGameView || this.engine.roundState === 'FIGHTING') {
        this.engine.isPaused = true;
        pauseModal.style.display = 'flex';
      }
    }
  }

  // --- FULLSCREEN & ORIENTATION CONTROLLER ---
  isTouchDevice() {
    return ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0) || 
           (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  }

  enterFullscreenLandscape(forceOnDesktop = false) {
    // On desktop, keep normal browser window experience unless explicitly toggled by player
    if (!this.isTouchDevice() && !forceOnDesktop) {
      return Promise.resolve(false);
    }

    const doc = document;
    const docEl = document.documentElement;
    const isFullscreen = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);

    const lockLandscape = () => {
      try {
        if (window.screen?.orientation?.lock) {
          window.screen.orientation.lock('landscape').catch(() => {});
        } else if (window.screen?.lockOrientation) {
          window.screen.lockOrientation('landscape');
        } else if (window.screen?.webkitLockOrientation) {
          window.screen.webkitLockOrientation('landscape');
        } else if (window.screen?.mozLockOrientation) {
          window.screen.mozLockOrientation('landscape');
        }
      } catch (_) {}
    };

    if (!isFullscreen) {
      const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
      if (req) {
        return req.call(docEl).then(() => {
          lockLandscape();
          this.updateFullscreenUI(true);
          return true;
        }).catch((err) => {
          // Gracefully fallback: unsupported APIs or rejected promise (e.g. iOS Safari) must not break gameplay
          lockLandscape();
          return false;
        });
      } else {
        lockLandscape();
        return Promise.resolve(false);
      }
    } else {
      lockLandscape();
      return Promise.resolve(true);
    }
  }

  exitFullscreen() {
    const doc = document;
    const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
    if (exit && (doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement)) {
      return exit.call(doc).then(() => {
        this.updateFullscreenUI(false);
      }).catch(() => {});
    }
  }

  toggleFullscreen() {
    const doc = document;
    const isFullscreen = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);

    if (!isFullscreen) {
      this.enterFullscreenLandscape(true); // Explicit button tap allows desktop fullscreen
    } else {
      this.exitFullscreen();
    }
  }

  updateFullscreenUI(isFullscreen) {
    const btnNavFs = document.getElementById('btn-toggle-fullscreen');
    if (btnNavFs) {
      const lbl = btnNavFs.querySelector('.nav-icon-label');
      if (lbl) lbl.textContent = isFullscreen ? 'EXIT' : 'FULLSCREEN';
      btnNavFs.title = isFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen';
    }

    const btnHudFs = document.getElementById('btn-hud-fullscreen');
    if (btnHudFs) {
      btnHudFs.textContent = isFullscreen ? '⛶ EXIT' : '⛶ FULL';
    }

    const btnPauseFs = document.getElementById('btn-pause-fullscreen');
    if (btnPauseFs) {
      btnPauseFs.textContent = isFullscreen ? '⛶ EXIT FULLSCREEN' : '⛶ TOGGLE FULLSCREEN';
    }
  }

  setupFullscreenController() {
    // 1. Listen for standard and vendor fullscreen change events to sync UI without loops
    ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
      document.addEventListener(evt, () => {
        const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
        this.updateFullscreenUI(isFs);
        this.checkOrientation();
      });
    });

    // 2. Play gesture triggers: When the player taps main Play buttons, attempt fullscreen landscape
    const playButtonIds = [
      'btn-quick-start-fight',    // Home screen main PLAY NOW button
      'btn-play-hero',            // Home screen secondary play button
      'btn-select-launch-match',  // Fighter select LOCK IN & FIGHT
      'btn-casual-launch-match',  // Casual setup DEPLOY
      'btn-ranked-launch-match',  // Ranked setup MATCH
      'btn-start-story-battle',   // Story battle ENGAGE
      'btn-enter-landscape-prompt'// Rotate overlay button
    ];

    playButtonIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', () => {
          if (this.isTouchDevice()) {
            this.enterFullscreenLandscape();
          }
        }, { passive: true });
      }
    });

    // 3. Fullscreen toggle buttons
    const btnNavFs = document.getElementById('btn-toggle-fullscreen');
    if (btnNavFs) {
      btnNavFs.addEventListener('click', () => {
        this.toggleFullscreen();
        soundEngine.playUiClick();
      });
    }

    const btnHudFs = document.getElementById('btn-hud-fullscreen');
    if (btnHudFs) {
      btnHudFs.addEventListener('click', () => {
        this.toggleFullscreen();
        soundEngine.playUiClick();
      });
    }

    const btnPauseFs = document.getElementById('btn-pause-fullscreen');
    if (btnPauseFs) {
      btnPauseFs.addEventListener('click', () => {
        this.toggleFullscreen();
        soundEngine.playUiClick();
      });
    }
  }

  // --- ENGINE CALLBACKS (HUD & MATCH FINISH) ---
  setupEngineCallbacks() {
    // Player Action Telemetry & Tutorial Progress Handler
    this.engine.onPlayerAction = (action) => {
      const lastInputEl = document.getElementById('train-last-input');
      if (lastInputEl) {
        const labels = {
          'LIGHT': 'LIGHT [J]',
          'HEAVY': 'HEAVY [K]',
          'SPECIAL': 'SPECIAL [L]',
          'SPECIAL_1': 'SPECIAL [L]',
          'SPECIAL_2': 'SPECIAL [U]',
          'ULTIMATE': 'ULTIMATE [I]',
          'BLOCK': 'BLOCK [SHIFT]',
          'DODGE': 'DODGE [SPACE]',
          'COUNTER': 'PARRY [H]',
          'MOVE': 'MOVE [WASD]'
        };
        lastInputEl.textContent = labels[action] || action;
      }

      if (this.isTutorialActive) {
        this.checkTutorialAction(action);
      }
    };

    // Cached HUD DOM references for zero per-frame querySelector overhead
    const domHud = {
      p1HpFill: document.getElementById('hud-p1-hp-fill'),
      p1HpDelay: document.getElementById('hud-p1-hp-delay'),
      p1CoreFill: document.getElementById('hud-p1-core-fill'),
      p1UltBadge: document.getElementById('hud-p1-ult-badge'),
      p1Gem1: document.getElementById('p1-gem-1'),
      p1Gem2: document.getElementById('p1-gem-2'),
      p2HpFill: document.getElementById('hud-p2-hp-fill'),
      p2HpDelay: document.getElementById('hud-p2-hp-delay'),
      p2CoreFill: document.getElementById('hud-p2-core-fill'),
      p2UltBadge: document.getElementById('hud-p2-ult-badge'),
      p2Gem1: document.getElementById('p2-gem-1'),
      p2Gem2: document.getElementById('p2-gem-2'),
      p1Name: document.getElementById('hud-p1-name'),
      p2Name: document.getElementById('hud-p2-name'),
      timerDigits: document.getElementById('hud-timer-digits'),
      roundLabel: document.getElementById('hud-round-label'),
      comboBox: document.getElementById('hud-combo-box'),
      comboText: document.getElementById('hud-combo-text'),
      comboDmg: document.getElementById('hud-combo-damage'),
      comboTier: document.getElementById('hud-combo-tier'),
      trainComboChain: document.getElementById('train-combo-chain'),
      trainTotalDmg: document.getElementById('train-total-dmg')
    };

    let lastP1Hp = -1;
    let lastP2Hp = -1;
    let lastP1Core = -1;
    let lastP2Core = -1;
    let lastP1Rounds = -1;
    let lastP2Rounds = -1;
    let lastRoundTime = -1;
    let lastRoundNum = -1;
    let lastP1Combo = -1;
    let lastP1Damage = -1;
    let p1DelayTimer = null;
    let p2DelayTimer = null;

    // Live In-Game Combat HUD Updates with smart diffing
    this.engine.onHudUpdate = (data) => {
      // 1. P1 Health
      if (data.p1Hp !== lastP1Hp) {
        lastP1Hp = data.p1Hp;
        const p1Pct = Math.max(0, (data.p1Hp / data.p1MaxHp) * 100);
        if (domHud.p1HpFill) domHud.p1HpFill.style.width = `${p1Pct}%`;
        if (p1DelayTimer) clearTimeout(p1DelayTimer);
        p1DelayTimer = setTimeout(() => {
          if (domHud.p1HpDelay) domHud.p1HpDelay.style.width = `${p1Pct}%`;
        }, 250);
      }

      // 2. P1 Core Meter & Ultimate Glow
      if (data.p1Core !== lastP1Core) {
        lastP1Core = data.p1Core;
        if (domHud.p1CoreFill) {
          domHud.p1CoreFill.style.width = `${data.p1Core}%`;
          const isP1UltReady = (data.p1Core >= 100);
          domHud.p1CoreFill.classList.toggle('ready', isP1UltReady);
          if (domHud.p1UltBadge) domHud.p1UltBadge.classList.toggle('active', isP1UltReady);
        }
      }

      // 3. P1 Round Gems
      if (data.p1Rounds !== lastP1Rounds) {
        lastP1Rounds = data.p1Rounds;
        if (domHud.p1Gem1) domHud.p1Gem1.classList.toggle('won', data.p1Rounds >= 1);
        if (domHud.p1Gem2) domHud.p1Gem2.classList.toggle('won', data.p1Rounds >= 2);
      }

      // 4. P2 Health
      if (data.p2Hp !== lastP2Hp) {
        lastP2Hp = data.p2Hp;
        const p2Pct = Math.max(0, (data.p2Hp / data.p2MaxHp) * 100);
        if (domHud.p2HpFill) domHud.p2HpFill.style.width = `${p2Pct}%`;
        if (p2DelayTimer) clearTimeout(p2DelayTimer);
        p2DelayTimer = setTimeout(() => {
          if (domHud.p2HpDelay) domHud.p2HpDelay.style.width = `${p2Pct}%`;
        }, 250);
      }

      // 5. P2 Core Meter & Ultimate Glow
      if (data.p2Core !== lastP2Core) {
        lastP2Core = data.p2Core;
        if (domHud.p2CoreFill) {
          domHud.p2CoreFill.style.width = `${data.p2Core}%`;
          const isP2UltReady = (data.p2Core >= 100);
          domHud.p2CoreFill.classList.toggle('ready', isP2UltReady);
          if (domHud.p2UltBadge) domHud.p2UltBadge.classList.toggle('active', isP2UltReady);
        }
      }

      // 6. P2 Round Gems
      if (data.p2Rounds !== lastP2Rounds) {
        lastP2Rounds = data.p2Rounds;
        if (domHud.p2Gem1) domHud.p2Gem1.classList.toggle('won', data.p2Rounds >= 1);
        if (domHud.p2Gem2) domHud.p2Gem2.classList.toggle('won', data.p2Rounds >= 2);
      }

      // 7. Round Timer
      if (data.roundTime !== lastRoundTime) {
        lastRoundTime = data.roundTime;
        if (domHud.timerDigits) domHud.timerDigits.textContent = data.roundTime;
      }

      // 8. Round Label
      if (data.roundNumber !== lastRoundNum || data.p1Rounds !== lastP1Rounds || data.p2Rounds !== lastP2Rounds) {
        lastRoundNum = data.roundNumber;
        const roundLabel = (data.p1Rounds === 1 && data.p2Rounds === 1) ? 'FINAL ROUND' : `ROUND ${data.roundNumber}`;
        if (domHud.roundLabel) domHud.roundLabel.textContent = roundLabel;
      }

      // 9. Combo Display
      if (data.p1Combo !== lastP1Combo || data.p1Damage !== lastP1Damage) {
        lastP1Combo = data.p1Combo;
        lastP1Damage = data.p1Damage;
        if (domHud.comboBox) {
          if (data.p1Combo >= 2) {
            domHud.comboBox.classList.add('active');
            if (domHud.comboText) domHud.comboText.textContent = `${data.p1Combo} HITS`;
            if (domHud.comboDmg) domHud.comboDmg.textContent = `${data.p1Damage || 0} DMG`;
            let tier = 'NICE!';
            if (data.p1Combo >= 8) tier = 'UNSTOPPABLE!';
            else if (data.p1Combo >= 5) tier = 'RIFT BREAKER!';
            else if (data.p1Combo >= 3) tier = 'SUPER!';
            if (domHud.comboTier) domHud.comboTier.textContent = tier;
          } else {
            domHud.comboBox.classList.remove('active');
          }
        }

        if (this.engine.gameMode === 'Training') {
          if (domHud.trainComboChain) domHud.trainComboChain.textContent = data.p1Combo >= 2 ? `${data.p1Combo} HITS` : 'READY';
          if (domHud.trainTotalDmg) domHud.trainTotalDmg.textContent = `${data.p1Damage || 0} DMG`;
        }
      }

      if (this.isTutorialActive && this.tutorialCurrentStep === 7 && data.p1Combo >= 2) {
        this.advanceTutorialStep();
      }
    };

    // Match End Callback & Polished RIFTBORN Reward Loop Presentation
    this.engine.onMatchEnd = (result) => {
      this.engine.stopLoop();

      const modal = document.getElementById('modal-match-results');
      const box = document.getElementById('results-modal-box');
      const p1CharId = result.p1CharId || (this.engine.p1 ? this.engine.p1.charId : 'vex');
      const p2CharId = result.p2CharId || (this.engine.p2 ? this.engine.p2.charId : 'solaris');
      const mode = result.mode || this.engine.gameMode || 'Casual';
      const roundScore = `${result.p1Score} - ${result.p2Score}`;
      const duration = result.duration || 45;

      // 1. Calculate and persist match rewards, grade, and challenge progression
      const matchProg = progressionManager.addMatchResult(
        p1CharId,
        p2CharId,
        result.isP1Winner,
        mode,
        result.maxCombo,
        duration,
        roundScore,
        result.telemetry || {}
      );

      // 2. Set Header: VICTORY / DEFEAT & Match Grade
      const titleEl = document.getElementById('results-title');
      if (titleEl) {
        titleEl.textContent = result.isP1Winner ? 'VICTORY' : 'DEFEAT';
        titleEl.style.color = result.isP1Winner ? 'var(--accent-cyan)' : 'var(--core-crimson)';
      }

      const subEl = document.getElementById('results-subtitle');
      if (subEl) {
        subEl.textContent = result.isP1Winner 
          ? 'DOMINANT VICTORY • REWARD LOOP ACTIVE' 
          : 'COMBAT SPARRING • EXPERIENCE AWARDED';
      }

      // Grade Stamp
      const gradeLetterEl = document.getElementById('results-grade-letter');
      const gradeBadge = document.getElementById('results-grade-badge');
      if (gradeLetterEl && gradeBadge) {
        gradeLetterEl.textContent = matchProg.grade;
        if (matchProg.grade === 'S') {
          gradeLetterEl.style.color = 'var(--accent-gold)';
          gradeBadge.style.borderColor = 'var(--accent-gold)';
          gradeBadge.style.boxShadow = '0 0 24px rgba(255, 184, 0, 0.5)';
        } else if (matchProg.grade === 'A') {
          gradeLetterEl.style.color = 'var(--accent-cyan)';
          gradeBadge.style.borderColor = 'var(--accent-cyan)';
          gradeBadge.style.boxShadow = '0 0 20px rgba(0, 210, 255, 0.4)';
        } else if (matchProg.grade === 'B') {
          gradeLetterEl.style.color = '#A855F7';
          gradeBadge.style.borderColor = '#A855F7';
          gradeBadge.style.boxShadow = '0 0 16px rgba(168, 85, 247, 0.3)';
        } else {
          gradeLetterEl.style.color = 'var(--text-muted)';
          gradeBadge.style.borderColor = 'var(--border-subtle)';
          gradeBadge.style.boxShadow = 'none';
        }
      }

      // Metadata Summary
      const outcomeEl = document.getElementById('results-outcome');
      if (outcomeEl) outcomeEl.textContent = roundScore;
      const maxComboEl = document.getElementById('results-max-combo');
      if (maxComboEl) maxComboEl.textContent = `${result.maxCombo} HITS`;
      const durEl = document.getElementById('results-duration');
      if (durEl) durEl.textContent = `${duration}s`;
      const modeEl = document.getElementById('results-mode');
      if (modeEl) modeEl.textContent = mode.toUpperCase();

      // 3. Populate Character & Mastery Info
      const p1Char = CHARACTERS[p1CharId] || CHARACTERS.vex;
      const cProg = progressionManager.getCharacterProgression(p1CharId);

      const charNameEl = document.getElementById('results-char-name');
      if (charNameEl) {
        charNameEl.textContent = p1Char.name;
        charNameEl.style.color = p1Char.coreColor;
      }
      const charLvlEl = document.getElementById('results-char-level');
      if (charLvlEl) charLvlEl.textContent = `LEVEL ${cProg.level}`;

      const charXpText = document.getElementById('results-char-xp-text');
      if (charXpText) charXpText.textContent = `${cProg.currentXp.toLocaleString()} / ${cProg.xpNeeded.toLocaleString()} XP`;

      const masteryRankEl = document.getElementById('results-mastery-rank');
      if (masteryRankEl) {
        const titleStr = (cProg.title || 'Combatant').toUpperCase();
        masteryRankEl.textContent = `RANK ${cProg.masteryRank || 1} • ${titleStr}`;
      }

      const masteryXpText = document.getElementById('results-mastery-xp-text');
      if (masteryXpText) masteryXpText.textContent = `${cProg.masteryXp.toLocaleString()} / ${cProg.masteryXpNeeded.toLocaleString()} XP`;

      // Initial bar widths (from before this match)
      const prevCharPct = Math.min(100, Math.round(((matchProg.prevCharXp || 0) / cProg.xpNeeded) * 100));
      const targetCharPct = Math.min(100, Math.round((cProg.currentXp / cProg.xpNeeded) * 100));
      const charBarFill = document.getElementById('results-char-bar-fill');
      if (charBarFill) charBarFill.style.width = `${prevCharPct}%`;

      const prevMasteryPct = Math.min(100, Math.round(((matchProg.prevMasteryXp || 0) / cProg.masteryXpNeeded) * 100));
      const targetMasteryPct = Math.min(100, Math.round((cProg.masteryXp / cProg.masteryXpNeeded) * 100));
      const masteryBarFill = document.getElementById('results-mastery-bar-fill');
      if (masteryBarFill) masteryBarFill.style.width = `${prevMasteryPct}%`;

      // 4. Level Up Banner
      const lvlBanner = document.getElementById('results-levelup-banner');
      if (lvlBanner) {
        if (matchProg.charResult && matchProg.charResult.leveledUp) {
          lvlBanner.style.display = 'block';
          const title = document.getElementById('results-levelup-title');
          if (title) title.textContent = `⚡ LEVEL UP! REACHED LEVEL ${cProg.level} ⚡`;
          const desc = document.getElementById('results-levelup-reward');
          const unlockCount = (matchProg.charResult.unlockedMilestones || []).length;
          const unlockText = unlockCount > 0 
            ? `Unlocked: ${matchProg.charResult.unlockedMilestones.map(m => m.name).join(', ')}`
            : `Unlocked: Core Attribute Growth & +${150 + cProg.level * 25} Coins!`;
          if (desc) desc.textContent = unlockText;
        } else if (matchProg.masteryResult && matchProg.masteryResult.rankUp) {
          lvlBanner.style.display = 'block';
          const title = document.getElementById('results-levelup-title');
          if (title) title.textContent = `👑 HERO MASTERY PROMOTION: ${cProg.title.toUpperCase()} 👑`;
          const desc = document.getElementById('results-levelup-reward');
          if (desc) desc.textContent = `Prestige Rank ${cProg.masteryRank} Reached • +250 Bonus Coins Granted!`;
        } else {
          lvlBanner.style.display = 'none';
        }
      }

      // 5. Ranked RP Banner
      const rpBanner = document.getElementById('results-rp-banner');
      if (rpBanner) {
        if (mode === 'Ranked' && matchProg.rankedOutcome) {
          rpBanner.style.display = 'block';
          const rOutcome = matchProg.rankedOutcome;
          const crestEl = document.getElementById('results-rp-crest');
          if (crestEl) crestEl.textContent = rOutcome.newRank.icon;
          const rankLbl = document.getElementById('results-rp-rank-label');
          if (rankLbl) {
            rankLbl.textContent = rOutcome.newRank.formattedName.toUpperCase();
            rankLbl.style.color = rOutcome.newRank.color;
          }
          const expLbl = document.getElementById('results-rp-explanation');
          if (expLbl) expLbl.textContent = rOutcome.deltaCalc.explanation;
          const deltaEl = document.getElementById('results-rp-delta-text');
          if (deltaEl) {
            deltaEl.textContent = matchProg.rpChangeText;
            deltaEl.style.color = (rOutcome.deltaCalc.delta >= 0) ? 'var(--accent-green)' : 'var(--core-crimson)';
          }
          const promoEl = document.getElementById('results-promotion-alert');
          if (promoEl) promoEl.style.display = rOutcome.isPromotion ? 'block' : 'none';
        } else {
          rpBanner.style.display = 'none';
        }
      }

      // 6. Cosmetic Loot Drop Showcase (Titles, Badges, Emotes, Victory Effects)
      const lootContainer = document.getElementById('results-loot-drop-container');
      if (lootContainer) {
        if (matchProg.cosmeticDrops && matchProg.cosmeticDrops.length > 0) {
          const drop = matchProg.cosmeticDrops[0];
          lootContainer.style.display = 'block';
          const lIcon = document.getElementById('results-loot-icon');
          if (lIcon) lIcon.textContent = drop.icon || '🎁';
          const lRarity = document.getElementById('results-loot-rarity');
          if (lRarity) lRarity.textContent = `${(drop.rarity || 'RARE').toUpperCase()} ${(drop.itemType || 'COSMETIC').toUpperCase()}`;
          const lName = document.getElementById('results-loot-name');
          if (lName) lName.textContent = drop.name;
          const lDesc = document.getElementById('results-loot-desc');
          if (lDesc) lDesc.textContent = drop.desc || 'Cosmetic item unlocked through battle performance!';
          const equipBtn = document.getElementById('btn-results-loot-equip');
          if (equipBtn) {
            equipBtn.textContent = 'EQUIP';
            equipBtn.disabled = false;
            equipBtn.onclick = () => {
              progressionManager.equipCosmetic(drop.itemType, drop.id);
              equipBtn.textContent = 'EQUIPPED ✓';
              equipBtn.disabled = true;
              soundEngine.playParry();
              this.updateUserDisplay();
            };
          }
        } else {
          lootContainer.style.display = 'none';
        }
      }

      // 7. Challenge Objectives Progress Strip
      const miniListEl = document.getElementById('results-challenges-mini-list');
      if (miniListEl) {
        miniListEl.innerHTML = '';
        const chUpdates = matchProg.challengeUpdates || [];
        const itemsToShow = chUpdates.length > 0 
          ? chUpdates.slice(0, 3) 
          : (progressionManager.getChallenges().daily || []).slice(0, 2);

        itemsToShow.forEach(ch => {
          this.renderMiniChallengeItem(miniListEl, ch);
        });
      }

      // 8. Reward Counter Rollup Animation & Fast-Forward Skip
      const xpValEl = document.getElementById('results-xp-earned');
      const coinsValEl = document.getElementById('results-coins-earned');
      const charXpValEl = document.getElementById('results-char-xp-earned');
      const masteryXpValEl = document.getElementById('results-mastery-xp-earned');
      const skipHintEl = document.getElementById('results-skip-hint');

      const targetXp = matchProg.earnedAccountXp;
      const targetCoins = matchProg.earnedCoins;
      const targetCharXp = matchProg.earnedCharXp;
      const targetMasteryXp = matchProg.earnedMasteryXp;

      let isFinished = false;
      const snapToFinal = () => {
        if (isFinished) return;
        isFinished = true;
        if (animInterval) clearInterval(animInterval);
        if (xpValEl) xpValEl.textContent = `+${targetXp}`;
        if (coinsValEl) coinsValEl.textContent = `+${targetCoins}`;
        if (charXpValEl) charXpValEl.textContent = `+${targetCharXp}`;
        if (masteryXpValEl) masteryXpValEl.textContent = `+${targetMasteryXp}`;
        if (charBarFill) charBarFill.style.width = `${targetCharPct}%`;
        if (masteryBarFill) masteryBarFill.style.width = `${targetMasteryPct}%`;
        if (skipHintEl) skipHintEl.style.opacity = '0';
      };

      let currentFrame = 0;
      const totalFrames = 48; // ~800ms - fast, satisfying, and punchy!
      const animInterval = setInterval(() => {
        if (isFinished) return;
        currentFrame++;
        const progress = Math.min(1, currentFrame / totalFrames);
        const ease = 1 - Math.pow(1 - progress, 3);

        if (xpValEl) xpValEl.textContent = `+${Math.round(targetXp * ease)}`;
        if (coinsValEl) coinsValEl.textContent = `+${Math.round(targetCoins * ease)}`;
        if (charXpValEl) charXpValEl.textContent = `+${Math.round(targetCharXp * ease)}`;
        if (masteryXpValEl) masteryXpValEl.textContent = `+${Math.round(targetMasteryXp * ease)}`;

        const curCharPct = prevCharPct + (targetCharPct - prevCharPct) * ease;
        if (charBarFill) charBarFill.style.width = `${curCharPct}%`;

        const curMasteryPct = prevMasteryPct + (targetMasteryPct - prevMasteryPct) * ease;
        if (masteryBarFill) masteryBarFill.style.width = `${curMasteryPct}%`;

        if (currentFrame % 8 === 0 && progress < 1) {
          if (typeof soundEngine.playComboHit === 'function') {
            soundEngine.playComboHit(1);
          }
        }

        if (progress >= 1) {
          snapToFinal();
          soundEngine.playParry();
        }
      }, 16);

      // Fast skip on click or Space / Enter
      if (box) {
        box.onclick = (e) => {
          if (e.target.tagName !== 'BUTTON') {
            snapToFinal();
          }
        };
      }

      const keyHandler = (e) => {
        if (!modal.classList.contains('active')) return;
        if (e.code === 'Space') {
          snapToFinal();
          e.preventDefault();
        } else if (e.code === 'Enter') {
          if (!isFinished) {
            snapToFinal();
          } else {
            const btnRematch = document.getElementById('btn-results-rematch');
            if (btnRematch) btnRematch.click();
          }
          e.preventDefault();
        }
      };
      window.addEventListener('keydown', keyHandler, { once: true });

      this.updateUserDisplay();
      this.setupStoryMode();
      modal.classList.add('active');
    };
  }

  // --- REWARD LOOP HELPERS & MINI-CHALLENGE STRIP ---
  renderMiniChallengeItem(parentEl, ch) {
    const item = document.createElement('div');
    item.className = 'mini-ch-item';
    const isCompleted = ch.completed || ch.justCompleted || ch.current >= ch.target;
    const isClaimed = ch.claimed;
    const pct = Math.min(100, Math.round((ch.current / ch.target) * 100));

    let actionHtml = '';
    if (isCompleted && !isClaimed) {
      actionHtml = `<button class="mini-ch-claim-btn" data-id="${ch.id}">CLAIM</button>`;
    } else if (isClaimed) {
      actionHtml = `<span style="font-size: 9px; color: var(--accent-green); font-weight: 800;">✓ CLAIMED</span>`;
    } else {
      actionHtml = `<span class="mini-ch-progress-text">${ch.current} / ${ch.target}</span>`;
    }

    item.innerHTML = `
      <div class="mini-ch-left">
        <div class="mini-ch-title">${ch.title}</div>
        <div class="mini-ch-bar-bg">
          <div class="mini-ch-bar-fill" style="width: ${pct}%;"></div>
        </div>
      </div>
      <div class="mini-ch-right">
        ${actionHtml}
      </div>
    `;

    const btnClaim = item.querySelector('.mini-ch-claim-btn');
    if (btnClaim) {
      btnClaim.addEventListener('click', (e) => {
        e.stopPropagation();
        const res = progressionManager.claimChallenge(ch.id);
        if (res) {
          soundEngine.playParry();
          btnClaim.parentElement.innerHTML = `<span style="font-size: 9px; color: var(--accent-green); font-weight: 800;">✓ CLAIMED</span>`;
          this.updateUserDisplay();
        }
      });
    }

    parentEl.appendChild(item);
  }

  // --- CHALLENGES & BOUNTIES HUB CONTROLLER ---
  setupChallengesHub() {
    const modal = document.getElementById('modal-challenges-hub');
    const tabDaily = document.getElementById('tab-challenges-daily');
    const tabWeekly = document.getElementById('tab-challenges-weekly');
    const tabCatalog = document.getElementById('tab-challenges-catalog');
    const btnClaimAll = document.getElementById('btn-hub-claim-all');

    let currentTab = 'daily';

    if (tabDaily) {
      tabDaily.onclick = () => {
        currentTab = 'daily';
        [tabDaily, tabWeekly, tabCatalog].forEach(t => t && t.classList.remove('active'));
        tabDaily.classList.add('active');
        this.renderChallengesHub('daily');
        soundEngine.playUiClick();
      };
    }

    if (tabWeekly) {
      tabWeekly.onclick = () => {
        currentTab = 'weekly';
        [tabDaily, tabWeekly, tabCatalog].forEach(t => t && t.classList.remove('active'));
        tabWeekly.classList.add('active');
        this.renderChallengesHub('weekly');
        soundEngine.playUiClick();
      };
    }

    if (tabCatalog) {
      tabCatalog.onclick = () => {
        currentTab = 'catalog';
        [tabDaily, tabWeekly, tabCatalog].forEach(t => t && t.classList.remove('active'));
        tabCatalog.classList.add('active');
        this.renderChallengesHub('catalog');
        soundEngine.playUiClick();
      };
    }

    if (btnClaimAll) {
      btnClaimAll.onclick = () => {
        const cData = progressionManager.getChallenges();
        const all = [...(cData.daily || []), ...(cData.weekly || [])];
        const claimable = all.filter(c => c.completed && !c.claimed);
        if (claimable.length === 0) {
          this.showToast('No completed challenges ready to claim yet. Complete more combat objectives!', 'info');
          return;
        }

        let totalCoins = 0;
        let totalXp = 0;
        claimable.forEach(c => {
          const res = progressionManager.claimChallenge(c.id);
          if (res) {
            totalCoins += (res.coins || 0);
            totalXp += (res.accountXp || 0);
          }
        });

        soundEngine.playParry();
        this.updateUserDisplay();
        this.renderChallengesHub(currentTab);
        this.showToast(`Claimed all completed bounties! Received +${totalCoins} Rift Coins and +${totalXp} XP!`, 'success');
      };
    }
  }

  renderChallengesHub(tab = 'daily') {
    const listContainer = document.getElementById('hub-challenges-list');
    const timerText = document.getElementById('hub-timer-text');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    const chMgr = progressionManager.challengeManager;
    if (timerText && chMgr) {
      timerText.textContent = (tab === 'weekly') 
        ? `Resets in ${chMgr.getTimeUntilWeeklyReset()}` 
        : `Resets in ${chMgr.getTimeUntilDailyReset()}`;
    }

    // Update claimable badges on tabs
    const cData = progressionManager.getChallenges();
    const dailyClaimable = (cData.daily || []).filter(c => c.completed && !c.claimed).length;
    const weeklyClaimable = (cData.weekly || []).filter(c => c.completed && !c.claimed).length;
    const dBadge = document.getElementById('daily-claimable-badge');
    const wBadge = document.getElementById('weekly-claimable-badge');
    if (dBadge) dBadge.style.display = dailyClaimable > 0 ? 'inline-flex' : 'none';
    if (wBadge) wBadge.style.display = weeklyClaimable > 0 ? 'inline-flex' : 'none';

    if (tab === 'catalog') {
      // Render cosmetic rewards catalog
      const grid = document.createElement('div');
      grid.className = 'hub-catalog-grid';

      const allCategories = [
        { key: 'titles', name: 'TITLE' },
        { key: 'badges', name: 'BADGE' },
        { key: 'emotes', name: 'EMOTE' },
        { key: 'victoryEffects', name: 'VICTORY FX' }
      ];

      allCategories.forEach(cat => {
        const items = COSMETIC_REWARDS_CATALOG[cat.key] || [];
        const owned = progressionManager.data.inventory[cat.key] || [];
        const equippedId = progressionManager.data.equipped ? progressionManager.data.equipped[cat.key === 'victoryEffects' ? 'victoryEffect' : cat.key.slice(0, -1)] : null;

        items.forEach(it => {
          const isOwned = owned.includes(it.id);
          const isEquipped = isOwned && (equippedId === it.id);

          const card = document.createElement('div');
          card.className = 'hub-catalog-card';
          const rarityColor = it.rarity === 'legendary' ? '#FFB800' : (it.rarity === 'epic' ? '#A855F7' : (it.rarity === 'rare' ? '#00D2FF' : '#94A3B8'));

          let btnHtml = '';
          if (isEquipped) {
            btnHtml = `<button class="btn-secondary" style="font-size: 10px; padding: 4px 10px; border-color: var(--accent-green); color: var(--accent-green); cursor: default;">EQUIPPED ✓</button>`;
          } else if (isOwned) {
            btnHtml = `<button class="btn-primary-glow btn-equip-catalog" data-type="${cat.key === 'victoryEffects' ? 'victoryEffect' : cat.key.slice(0, -1)}" data-id="${it.id}" style="font-size: 10px; padding: 4px 12px;">EQUIP</button>`;
          } else {
            btnHtml = `<span style="font-size: 9px; color: var(--text-muted); font-family: 'Oswald', 'Bebas Neue', sans-serif; font-weight: 800;">LOCKED</span>`;
          }

          card.innerHTML = `
            <div class="hub-catalog-icon" style="color: ${rarityColor}; border-color: ${rarityColor}; background: ${rarityColor}22;">
              ${it.icon || '✦'}
            </div>
            <div class="hub-catalog-info">
              <div class="hub-catalog-type" style="color: ${rarityColor};">${(it.rarity || 'RARE').toUpperCase()} ${cat.name}</div>
              <div class="hub-catalog-name">${it.name}</div>
              <div class="hub-catalog-desc">${it.desc || ''}</div>
            </div>
            <div>
              ${btnHtml}
            </div>
          `;

          const equipBtn = card.querySelector('.btn-equip-catalog');
          if (equipBtn) {
            equipBtn.addEventListener('click', () => {
              const itemType = equipBtn.getAttribute('data-type');
              const itemId = equipBtn.getAttribute('data-id');
              progressionManager.equipCosmetic(itemType, itemId);
              soundEngine.playParry();
              this.updateUserDisplay();
              this.renderChallengesHub('catalog');
            });
          }

          grid.appendChild(card);
        });
      });

      listContainer.appendChild(grid);
      return;
    }

    // Render Daily or Weekly challenges
    const list = tab === 'daily' ? (cData.daily || []) : (cData.weekly || []);
    list.forEach(ch => {
      const card = document.createElement('div');
      card.className = `hub-challenge-card ${ch.completed ? 'completed' : ''}`;
      const pct = Math.min(100, Math.round((ch.current / ch.target) * 100));

      let actionHtml = '';
      if (ch.claimed) {
        actionHtml = `<div class="hub-ch-btn-claimed">CLAIMED ✓</div>`;
      } else if (ch.completed) {
        actionHtml = `<button class="hub-ch-btn-claim" data-id="${ch.id}">CLAIM REWARD</button>`;
      } else {
        actionHtml = `
          <div class="hub-ch-meter-block">
            <div class="hub-ch-progress-label">
              <span>PROGRESS</span>
              <span>${ch.current} / ${ch.target}</span>
            </div>
            <div class="prog-xp-bar-bg" style="height: 6px; margin: 0;">
              <div class="prog-xp-bar-fill" style="width: ${pct}%; background: var(--grad-primary);"></div>
            </div>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="hub-ch-info">
          <div class="hub-ch-top">
            <span class="hub-ch-style-tag">${ch.style}</span>
            <span class="hub-ch-title">${ch.title}</span>
          </div>
          <div class="hub-ch-desc">${ch.desc}</div>
          <div class="hub-ch-rewards-strip">
            <span class="hub-reward-pill coins">🪙 +${ch.rewards.coins} Coins</span>
            <span class="hub-reward-pill xp">✦ +${ch.rewards.accountXp} XP</span>
            ${ch.rewards.item ? `<span class="hub-reward-pill item">🎁 ${ch.rewards.item.name}</span>` : ''}
          </div>
        </div>
        <div class="hub-ch-action-block">
          ${actionHtml}
        </div>
      `;

      const claimBtn = card.querySelector('.hub-ch-btn-claim');
      if (claimBtn) {
        claimBtn.addEventListener('click', () => {
          const res = progressionManager.claimChallenge(ch.id);
          if (res) {
            soundEngine.playParry();
            this.updateUserDisplay();
            this.renderChallengesHub(tab);
          }
        });
      }

      listContainer.appendChild(card);
    });
  }

  // --- REWARDS / RIFT PASS SCREEN ---
  setupRewardsPass() {
    const container = document.getElementById('pass-tiers-container');
    container.innerHTML = '';

    for (let tier = 1; tier <= 30; tier++) {
      const card = document.createElement('div');
      card.style.cssText = `
        min-width: 140px;
        background: var(--surface-white);
        border: 1px solid var(--border-neutral);
        border-radius: var(--radius-md);
        padding: 16px;
        text-align: center;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        box-shadow: var(--shadow-sm);
      `;

      let rewardName = `${tier * 100} Shards`;
      if (tier % 5 === 0) rewardName = 'Epic Skin';
      if (tier % 10 === 0) rewardName = 'Legendary Suit';

      card.innerHTML = `
        <div style="font-family: 'Oswald', 'Bebas Neue', sans-serif; font-weight: 800; font-size: 13px; color: var(--accent-cyan); margin-bottom: 8px;">TIER ${tier}</div>
        <div style="width: 44px; height: 44px; margin: 0 auto; background: rgba(0, 210, 255, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;">✦</div>
        <div style="font-size: 13px; font-weight: 700; margin-top: 8px;">${rewardName}</div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Free Track</div>
      `;

      container.appendChild(card);
    }

    document.getElementById('btn-claim-pass-rewards').addEventListener('click', () => {
      progressionManager.data.profile.shards += 400;
      progressionManager.saveData();
      this.updateUserDisplay();
      soundEngine.playParry();
      this.showToast('Claimed 400 Rift Shards from Season 1 Pass tiers!', 'success');
    });
  }

  // --- INVENTORY SCREEN ---
  setupInventory() {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';

    const items = [
      { name: 'Vanguard Calamity Edge', type: 'Weapon Skin', rarity: 'Rare', icon: '⚔' },
      { name: 'Kinetic Capacitor v1', type: 'Core Module', rarity: 'Common', icon: '⬢' },
      { name: 'Phase Mesh Lining', type: 'Armor Module', rarity: 'Common', icon: '🛡' },
      { name: 'Plasma Spark Trail', type: 'Victory Aura', rarity: 'Epic', icon: '✨' },
      { name: 'Crest of Genesis', type: 'Badge', rarity: 'Common', icon: '🎖' },
      { name: 'Title: "Rift Vanguard"', type: 'Player Title', rarity: 'Rare', icon: '📜' },
      { name: 'Solar God Helmet', type: 'Hero Cosmetic', rarity: 'Epic', icon: '👑' },
      { name: 'Dark Singularity Orb', type: 'Emote Effect', rarity: 'Legendary', icon: '🔮' }
    ];

    items.forEach(it => {
      const card = document.createElement('div');
      card.className = 'widget-card';
      card.innerHTML = `
        <div style="font-size: 28px; margin-bottom: 8px;">${it.icon}</div>
        <div style="font-family: 'Oswald', 'Bebas Neue', sans-serif; font-size: 15px; font-weight: 800; margin-bottom: 4px;">${it.name}</div>
        <div style="font-size: 12px; color: var(--accent-cyan);">${it.type} • ${it.rarity}</div>
        <button class="btn-secondary" style="margin-top: 12px; padding: 6px 14px; font-size: 11px; width: 100%;">EQUIPPED</button>
      `;
      grid.appendChild(card);
    });
  }

  // --- PROFILE SCREEN: COMPETITIVE TELEMETRY & MASTERY ---
  renderProfile() {
    const prof = progressionManager.data.profile;
    const ranked = progressionManager.data.ranked;
    const rankInfo = progressionManager.getCurrentRankInfo();
    const curMainId = progressionManager.getMainCharacter();
    const curMain = CHARACTERS[curMainId] || CHARACTERS.vex;

    // Header banner
    const avEl = document.getElementById('profile-avatar-big');
    if (avEl) {
      avEl.textContent = curMain.name.charAt(0);
      avEl.style.borderColor = curMain.coreColor;
      avEl.style.color = curMain.coreColor;
      avEl.style.background = `${curMain.coreColor}22`;
    }

    const clanEl = document.getElementById('profile-clan-tag');
    if (clanEl) clanEl.textContent = `[${prof.clanTag || 'RIFT'}]`;

    const userEl = document.getElementById('profile-username-big');
    if (userEl) userEl.textContent = prof.username;

    const titleEl = document.getElementById('profile-title-big');
    if (titleEl) titleEl.textContent = `${prof.title} • Initiate of the Singularity`;

    const lvlEl = document.getElementById('profile-level-big');
    if (lvlEl) lvlEl.textContent = `Account Level ${prof.accountLevel} • ${prof.accountXp} / ${prof.accountLevel * 500} XP`;

    const rankPill = document.getElementById('profile-rank-big');
    if (rankPill) {
      rankPill.textContent = rankInfo.formattedName;
      rankPill.style.color = rankInfo.color;
    }

    const shardsEl = document.getElementById('profile-shards-display');
    if (shardsEl) shardsEl.textContent = prof.shards.toLocaleString();

    const prismsEl = document.getElementById('profile-prisms-display');
    if (prismsEl) prismsEl.textContent = prof.corePrisms.toLocaleString();

    // Rank Showcase Card
    const crestEl = document.getElementById('profile-crest-icon');
    if (crestEl) crestEl.textContent = rankInfo.icon;

    const tierDivEl = document.getElementById('profile-tier-division');
    if (tierDivEl) {
      tierDivEl.textContent = rankInfo.formattedName.toUpperCase();
      tierDivEl.style.color = rankInfo.color;
    }

    const rankDescEl = document.getElementById('profile-rank-desc');
    if (rankDescEl) rankDescEl.textContent = rankInfo.description;

    const currentRpEl = document.getElementById('profile-current-rp');
    if (currentRpEl) currentRpEl.textContent = `${rankInfo.totalRp} Total RP (${rankInfo.divisionRp} RP in Division ${rankInfo.division})`;

    const rpNeededEl = document.getElementById('profile-rp-needed');
    if (rpNeededEl) rpNeededEl.textContent = `${rankInfo.rpToNextRank} RP to ${rankInfo.nextTierName} Promotion`;

    const rankBarFill = document.getElementById('profile-rank-bar-fill');
    if (rankBarFill) {
      rankBarFill.style.width = `${rankInfo.tierProgressPct}%`;
      rankBarFill.style.background = `linear-gradient(90deg, ${rankInfo.color}, #FFF)`;
      rankBarFill.style.boxShadow = `0 0 14px ${rankInfo.glow}`;
    }

    const peakRankEl = document.getElementById('profile-peak-rank');
    if (peakRankEl) peakRankEl.textContent = ranked.peakTier || rankInfo.formattedName;

    const winStreakEl = document.getElementById('profile-win-streak');
    if (winStreakEl) winStreakEl.textContent = `🔥 ${prof.winStreak || 0} Wins`;

    // 8 Core Tracked Metrics
    const totMatEl = document.getElementById('profile-total-matches');
    if (totMatEl) totMatEl.textContent = prof.totalMatches;

    const winsEl = document.getElementById('profile-wins');
    if (winsEl) winsEl.textContent = prof.wins;

    const lossesEl = document.getElementById('profile-losses');
    if (lossesEl) lossesEl.textContent = prof.losses;

    const winrateEl = document.getElementById('profile-winrate');
    if (winrateEl) winrateEl.textContent = progressionManager.getOverallWinRate();

    const curRankStatEl = document.getElementById('profile-stat-current-rank');
    if (curRankStatEl) {
      curRankStatEl.textContent = rankInfo.formattedName;
      curRankStatEl.style.color = rankInfo.color;
    }

    const peakRankStatEl = document.getElementById('profile-stat-highest-rank');
    if (peakRankStatEl) peakRankStatEl.textContent = ranked.peakTier || rankInfo.formattedName;

    const mainCharStatEl = document.getElementById('profile-stat-main-char');
    if (mainCharStatEl) {
      mainCharStatEl.textContent = curMain.name.toUpperCase();
      mainCharStatEl.style.color = curMain.coreColor;
    }

    const streakStatEl = document.getElementById('profile-stat-streak');
    if (streakStatEl) streakStatEl.textContent = `${prof.highestWinStreak || 5} Wins`;

    // Seasonal Rewards Track
    this.renderSeasonRewardsLadder();

    // Character Mastery Matrix
    this.renderCharacterMasteryMatrix();

    // Match History
    this.renderMatchHistory();
  }

  renderSeasonRewardsLadder() {
    const ladderContainer = document.getElementById('profile-season-ladder');
    if (!ladderContainer) return;
    ladderContainer.innerHTML = '';

    const currentRank = progressionManager.getCurrentRankInfo();
    const currentTierIdx = CompetitiveRankEngine.getTierIndex(currentRank.tier);

    SEASON_CONFIG.rewards.forEach((r, idx) => {
      const stepTier = RANK_TIERS[idx];
      const isAchieved = (idx <= currentTierIdx);
      const isCurrent = (idx === currentTierIdx);

      const card = document.createElement('div');
      card.className = `season-step-card ${isAchieved ? 'unlocked' : ''} ${isCurrent ? 'current' : ''}`;
      card.style.setProperty('--step-accent', stepTier.color);

      card.innerHTML = `
        <div style="font-size: 20px;">${stepTier.icon}</div>
        <div style="font-family: 'Oswald', 'Bebas Neue', sans-serif; font-size: 11px; font-weight: 900; color: ${stepTier.color};">${r.tier.toUpperCase()}</div>
        <div style="font-size: 10px; color: var(--accent-gold); font-weight: 700;">+${r.shards} ✦</div>
        <div style="font-size: 9px; color: var(--text-secondary); line-height: 1.2;">${r.rewardItem}</div>
        <div class="season-step-badge ${isAchieved ? 'claimable' : ''}">${isAchieved ? 'UNLOCKED' : 'LOCKED'}</div>
      `;

      ladderContainer.appendChild(card);
    });
  }

  renderCharacterMasteryMatrix() {
    const container = document.getElementById('profile-mastery-cards-container');
    if (!container) return;
    container.innerHTML = '';

    const masteries = progressionManager.getAllCharacterMasteries();

    masteries.forEach(m => {
      const card = document.createElement('div');
      card.className = `mastery-card ${m.isMain ? 'is-main' : ''}`;
      card.style.setProperty('--card-core-accent', m.coreColor);

      const xpPct = Math.min(100, Math.round((m.masteryXp / m.masteryXpNeeded) * 100));

      card.innerHTML = `
        <div class="mastery-card-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="mastery-avatar" style="border-color: ${m.coreColor}; background: ${m.coreColor}22; color: ${m.coreColor};">
              ${m.name.charAt(0)}
            </div>
            <div>
              <div style="font-family: var(--font-display); font-size: 15px; font-weight: 700; color: var(--text-primary);">${m.name}</div>
              <div style="font-size: 11px; color: ${m.coreColor}; font-weight: 700;">${m.core.toUpperCase()} CORE • ${m.role.toUpperCase()}</div>
            </div>
          </div>
          ${m.isMain ? '<span style="font-family: var(--font-display); font-size: 10px; font-weight: 700; color: var(--accent-gold); background: rgba(217,164,65,0.12); border: 1px solid var(--accent-gold); padding: 2px 6px; border-radius: 4px;">★ MAIN</span>' : ''}
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; font-family: 'Oswald', 'Bebas Neue', sans-serif; font-size: 11px; font-weight: 800; margin-bottom: 4px;">
            <span style="color: var(--accent-gold);">MASTERY RANK ${m.masteryLevel}</span>
            <span style="color: var(--accent-cyan); font-size: 10px;">${m.title}</span>
          </div>
          <div style="height: 6px; background: rgba(0,0,0,0.4); border-radius: 3px; overflow: hidden;">
            <div style="width: ${xpPct}%; height: 100%; background: linear-gradient(90deg, ${m.coreColor}, #FFF);"></div>
          </div>
          <div style="font-size: 10px; color: var(--text-muted); text-align: right; margin-top: 2px;">${m.masteryXp} / ${m.masteryXpNeeded} XP</div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; background: var(--surface-secondary); border: 1px solid var(--border-neutral); border-radius: 6px; padding: 6px 10px; text-align: center;">
          <div><div style="font-size: 9px; color: var(--text-muted);">MATCHES</div><div style="font-family: var(--font-display); font-size: 13px; font-weight: 700; color: var(--text-primary);">${m.matchesPlayed}</div></div>
          <div><div style="font-size: 9px; color: var(--text-muted);">WINS</div><div style="font-family: var(--font-display); font-size: 13px; font-weight: 700; color: var(--accent-green);">${m.wins}</div></div>
          <div><div style="font-size: 9px; color: var(--text-muted);">WIN RATE</div><div style="font-family: var(--font-display); font-size: 13px; font-weight: 700; color: var(--energy-blue);">${m.winRate}</div></div>
        </div>

        <div style="margin-top: auto; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 11px; color: var(--text-secondary); font-family: 'Oswald', 'Bebas Neue', sans-serif;">LVL ${m.level} WARRIOR</span>
          ${!m.isMain ? `<button class="btn-secondary btn-set-main" data-char="${m.charId}" style="padding: 4px 10px; font-size: 10px;">SET MAIN</button>` : '<span style="font-size: 11px; color: var(--accent-gold);">ACTIVE MAIN</span>'}
        </div>
      `;

      container.appendChild(card);
    });

    // Wire up "SET MAIN" buttons
    container.querySelectorAll('.btn-set-main').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const charId = e.currentTarget.getAttribute('data-char');
        progressionManager.setMainCharacter(charId);
        soundEngine.playParry();
        this.updateUserDisplay();
        this.renderProfile();
      });
    });
  }

  renderMatchHistory() {
    const tbody = document.getElementById('profile-match-history-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filter = this.matchHistoryFilter || 'ALL';
    const matches = (progressionManager.data.matchHistory || []).filter(m => {
      if (filter === 'ALL') return true;
      return m.mode === filter;
    });

    if (matches.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 20px;">No matches found in this category.</td></tr>`;
      return;
    }

    matches.forEach(m => {
      const tr = document.createElement('tr');
      const isWin = m.result === 'VICTORY';
      const isRanked = m.mode === 'Ranked';
      const heroChar = CHARACTERS[m.hero] || { name: m.hero, coreColor: '#00D2FF' };
      const oppChar = CHARACTERS[m.opponent] || { name: m.opponent, coreColor: '#FF0055' };
      const timeStr = m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently';

      tr.innerHTML = `
        <td>
          <span style="font-family: 'Oswald', 'Bebas Neue', sans-serif; font-weight: 900; font-size: 11px; padding: 2px 8px; border-radius: 4px; background: ${isWin ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; border: 1px solid ${isWin ? 'var(--accent-green)' : 'var(--accent-red)'}; color: ${isWin ? 'var(--accent-green)' : 'var(--accent-red)'};">
            ${escapeHtml(m.result)}
          </span>
        </td>
        <td style="font-weight: 700;">
          <span style="color: ${heroChar.coreColor};">● </span>${escapeHtml(heroChar.name)}
        </td>
        <td style="color: var(--text-secondary);">
          <span style="color: ${oppChar.coreColor};">● </span>${escapeHtml(oppChar.name)}
        </td>
        <td>
          <span style="font-family: 'Oswald', 'Bebas Neue', sans-serif; font-size: 10px; font-weight: 800; color: ${isRanked ? 'var(--accent-gold)' : 'var(--accent-cyan)'};">
            ${escapeHtml(m.mode.toUpperCase())}
          </span>
        </td>
        <td style="font-family: var(--font-display); font-size: 12px; font-weight: 600; color: var(--text-primary);">${escapeHtml(m.roundScore || '2 - 0')}</td>
        <td style="color: var(--text-muted); font-size: 12px;">${escapeHtml(m.duration)}</td>
        <td style="font-family: 'Oswald', 'Bebas Neue', sans-serif; font-weight: 800; color: ${m.rpChange.startsWith('+') ? 'var(--accent-green)' : (m.rpChange.startsWith('-') ? 'var(--core-crimson)' : 'var(--text-muted)')};">
          ${escapeHtml(m.rpChange)}
        </td>
        <td style="color: var(--text-muted); font-size: 11px;">${escapeHtml(timeStr)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --- LEADERBOARD CONTROLLER ---
  setupLeaderboards() {
    const btnGlobal = document.getElementById('btn-lead-global');
    const btnDivision = document.getElementById('btn-lead-division');
    const btnFriends = document.getElementById('btn-lead-friends');

    const setTab = (tab) => {
      this.leaderboardTab = tab;
      [btnGlobal, btnDivision, btnFriends].forEach(b => {
        if (b) b.classList.remove('active');
      });
      if (tab === 'GLOBAL' && btnGlobal) btnGlobal.classList.add('active');
      if (tab === 'DIVISION' && btnDivision) btnDivision.classList.add('active');
      if (tab === 'FRIENDS' && btnFriends) btnFriends.classList.add('active');
      this.renderLeaderboards(tab);
      soundEngine.playUiClick();
    };

    if (btnGlobal) btnGlobal.onclick = () => setTab('GLOBAL');
    if (btnDivision) btnDivision.onclick = () => setTab('DIVISION');
    if (btnFriends) btnFriends.onclick = () => setTab('FRIENDS');

    this.renderLeaderboards('GLOBAL');
  }

  renderLeaderboards(tab = 'GLOBAL') {
    const tbody = document.getElementById('leaderboard-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const prof = progressionManager.data.profile;
    const ranked = progressionManager.data.ranked;
    const rankInfo = progressionManager.getCurrentRankInfo();
    const userRp = ranked.rp;
    const userWinRate = progressionManager.getOverallWinRate();
    const userMain = progressionManager.getMainCharacter();

    let entries = [];

    if (tab === 'GLOBAL') {
      // Merge live player into global top 100 ranking by real RP
      entries = GLOBAL_LEADERBOARD.map(e => ({ ...e, isUser: false }));
      const userEntry = {
        name: prof.username,
        tier: rankInfo.formattedName,
        rp: userRp,
        mainChar: userMain,
        wins: prof.wins,
        winRate: userWinRate,
        isUser: true
      };
      entries.push(userEntry);
      entries.sort((a, b) => b.rp - a.rp);
      entries.forEach((e, i) => e.rank = i + 1);
    } else if (tab === 'DIVISION') {
      // Division peer rivals around current RP
      const peers = [
        { name: 'Vanguard_Ghost', rp: userRp + 45, mainChar: 'vex', wins: 28, winRate: '72%' },
        { name: 'Aethel_Striker', rp: userRp + 22, mainChar: 'solaris', wins: 24, winRate: '68%' },
        { name: prof.username, rp: userRp, mainChar: userMain, wins: prof.wins, winRate: userWinRate, isUser: true },
        { name: 'CyberBlade_99', rp: Math.max(0, userRp - 18), mainChar: 'lyra', wins: 19, winRate: '65%' },
        { name: 'Null_Void_Runner', rp: Math.max(0, userRp - 35), mainChar: 'nox', wins: 15, winRate: '61%' },
        { name: 'StaffMaster_Zen', rp: Math.max(0, userRp - 52), mainChar: 'aeron', wins: 14, winRate: '58%' },
        { name: 'Chain_Whiplash', rp: Math.max(0, userRp - 70), mainChar: 'kairo', wins: 11, winRate: '54%' }
      ];
      peers.sort((a, b) => b.rp - a.rp);
      peers.forEach((e, i) => {
        const pRank = CompetitiveRankEngine.getRankFromRp(e.rp);
        entries.push({
          rank: i + 1,
          name: e.name,
          tier: pRank.formattedName,
          rp: e.rp,
          mainChar: e.mainChar,
          wins: e.wins,
          winRate: e.winRate,
          isUser: !!e.isUser
        });
      });
    } else if (tab === 'FRIENDS') {
      const friends = [
        { name: 'VoidReaper', tier: 'Diamond II', rp: 1380, mainChar: 'nox', wins: 64, winRate: '70%' },
        { name: 'SolarQueen', tier: 'Platinum III', rp: 940, mainChar: 'solaris', wins: 48, winRate: '66%' },
        { name: 'CyberSamurai', tier: 'Gold I', rp: 820, mainChar: 'vex', wins: 36, winRate: '62%' },
        { name: prof.username, tier: rankInfo.formattedName, rp: userRp, mainChar: userMain, wins: prof.wins, winRate: userWinRate, isUser: true },
        { name: 'EmeraldWhip', tier: 'Silver I', rp: 510, mainChar: 'kairo', wins: 18, winRate: '56%' }
      ];
      friends.sort((a, b) => b.rp - a.rp);
      friends.forEach((e, i) => {
        entries.push({
          rank: i + 1,
          ...e,
          isUser: e.name === prof.username
        });
      });
    }

    entries.forEach(entry => {
      const tr = document.createElement('tr');
      if (entry.isUser) {
        tr.style.background = 'rgba(217, 54, 54, 0.08)';
        tr.style.outline = '1px solid var(--primary-action)';
      }
      const charData = CHARACTERS[entry.mainChar] || { name: entry.mainChar, coreColor: '#00D2FF' };
      const rankColor = entry.tier.includes('Champion') ? '#D93636' : (entry.tier.includes('Master') ? '#7050A8' : (entry.tier.includes('Diamond') ? '#3978C9' : (entry.tier.includes('Platinum') ? '#318A62' : (entry.tier.includes('Gold') ? '#C89428' : '#68717D'))));

      tr.innerHTML = `
        <td style="font-family: var(--font-display); font-weight: 700; color: ${entry.rank <= 3 ? 'var(--accent-gold)' : 'var(--text-muted)'};">#${entry.rank}</td>
        <td style="font-weight: 700; color: ${entry.isUser ? 'var(--primary-action)' : 'var(--text-primary)'};">
          ${escapeHtml(entry.name)} ${entry.isUser ? '<span style="font-size: 10px; color: var(--accent-gold); font-family: var(--font-display);">★ YOU</span>' : ''}
        </td>
        <td style="color: ${rankColor}; font-family: 'Oswald', 'Bebas Neue', sans-serif; font-size: 12px; font-weight: 800;">${escapeHtml(entry.tier)}</td>
        <td style="font-family: 'Oswald', 'Bebas Neue', sans-serif; font-weight: 800; color: var(--accent-gold);">${entry.rp} RP</td>
        <td><span style="color: ${charData.coreColor};">● </span>${escapeHtml(charData.name)}</td>
        <td>${entry.wins}</td>
        <td style="color: var(--accent-green); font-weight: 700;">${escapeHtml(entry.winRate)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --- SETTINGS (AUDIO & SHAKE) ---
  setupAudioSettings() {
    const sfxSlider = document.getElementById('slider-sfx-vol');
    const musicSlider = document.getElementById('slider-music-vol');
    const shakeSlider = document.getElementById('slider-shake-vol');

    if (sfxSlider) {
      sfxSlider.addEventListener('input', (e) => {
        const v = e.target.value / 100;
        soundEngine.setSfxVolume(v);
        const lbl = document.getElementById('label-sfx-vol');
        if (lbl) lbl.textContent = `${e.target.value}%`;
      });
    }

    if (musicSlider) {
      musicSlider.addEventListener('input', (e) => {
        const v = e.target.value / 100;
        soundEngine.setMusicVolume(v);
        const lbl = document.getElementById('label-music-vol');
        if (lbl) lbl.textContent = `${e.target.value}%`;
      });
    }

    if (shakeSlider) {
      shakeSlider.addEventListener('input', (e) => {
        const lbl = document.getElementById('label-shake-vol');
        if (lbl) lbl.textContent = `${e.target.value}%`;
      });
    }

    // --- SETTINGS CATEGORY TABS (2-COLUMN) ---
    const settingsTabs = document.querySelectorAll('.settings-nav-tab');
    settingsTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');
        settingsTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        document.querySelectorAll('.settings-tab-panel').forEach(panel => {
          panel.style.display = 'none';
          panel.classList.remove('active');
        });

        const activePanel = document.getElementById(`settings-panel-${targetTab}`);
        if (activePanel) {
          activePanel.style.display = 'flex';
          activePanel.classList.add('active');
        }
        soundEngine.playUiClick();
      });
    });

    // --- MOBILE & TOUCH CONTROLS SETTINGS ---
    const btnEditTouch = document.getElementById('btn-settings-edit-touch');
    const btnToggleTouch = document.getElementById('btn-settings-toggle-touch');
    const btnResetTouch = document.getElementById('btn-settings-reset-touch');

    if (btnEditTouch) {
      btnEditTouch.addEventListener('click', () => {
        const gameView = document.getElementById('game-view');
        if (gameView) gameView.style.display = 'block';
        if (this.engine && this.engine.touchControls) {
          this.engine.touchControls.openCustomizer();
        }
        soundEngine.playUiClick();
      });
    }

    if (btnToggleTouch) {
      btnToggleTouch.addEventListener('click', () => {
        if (this.engine && this.engine.touchControls) {
          const tc = this.engine.touchControls;
          if (tc.config.enabled === 'always') tc.config.enabled = 'never';
          else if (tc.config.enabled === 'never') tc.config.enabled = 'always';
          else tc.config.enabled = tc.isTouchDevice ? 'never' : 'always';
          tc.saveConfig();
          tc.updateVisibility();
          this.showToast(`On-Screen Touch Controls: ${tc.config.enabled.toUpperCase()}`, 'info');
        }
        soundEngine.playUiClick();
      });
    }

    if (btnResetTouch) {
      btnResetTouch.addEventListener('click', () => {
        if (this.engine && this.engine.touchControls) {
          const tc = this.engine.touchControls;
          tc.config = { ...tc.defaultConfig };
          tc.saveConfig();
          tc.applyLayoutStyles();
          tc.updateVisibility();
          this.showToast('Touch Controls reset to default ergonomic positions.', 'success');
        }
        soundEngine.playUiClick();
      });
    }
  }

  // --- RESPONSIVE MOBILE ORIENTATION CONTROLLER ---
  setupOrientationHandler() {
    this.portraitBrowsingAllowed = true;

    // Proactively lock to landscape mode on any touch or click without asking
    const autoLockLandscape = () => {
      try {
        if (window.screen?.orientation?.lock) {
          window.screen.orientation.lock('landscape').catch(() => {});
        } else if (window.screen?.lockOrientation) {
          window.screen.lockOrientation('landscape');
        } else if (window.screen?.webkitLockOrientation) {
          window.screen.webkitLockOrientation('landscape');
        } else if (window.screen?.mozLockOrientation) {
          window.screen.mozLockOrientation('landscape');
        }
      } catch (_) {}
    };

    window.addEventListener('touchstart', autoLockLandscape, { passive: true });
    window.addEventListener('click', autoLockLandscape, { passive: true });

    this.checkOrientation();
    window.addEventListener('resize', () => this.checkOrientation());
    window.addEventListener('orientationchange', () => {
      this.checkOrientation();
      setTimeout(() => this.checkOrientation(), 100);
      setTimeout(() => this.checkOrientation(), 250);
      setTimeout(() => this.checkOrientation(), 500);
    });
  }

  checkOrientation() {
    // Proactively lock orientation on mobile/touch devices
    if (window.screen?.orientation?.lock && (this.isTouchDevice() || window.innerWidth <= 1024)) {
      window.screen.orientation.lock('landscape').catch(() => {});
    }

    // Never block the user with an orientation prompt overlay - landscape is enforced automatically
    const overlay = document.getElementById('orientation-prompt-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  // --- MOVE LIST & HOW TO PLAY GUIDE SYSTEM ---
  setupMoveListGuide() {
    const modal = document.getElementById('modal-movelist-guide');
    const btnClose = document.getElementById('btn-close-movelist');
    const navBtn = document.getElementById('nav-guide-btn');
    const csBtn = document.getElementById('btn-cs-movelist');
    const hudBtn = document.getElementById('btn-hud-movelist');

    if (btnClose) {
      btnClose.addEventListener('click', () => this.closeMoveListGuide());
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeMoveListGuide();
      });
    }

    if (navBtn) {
      navBtn.addEventListener('click', () => {
        this.openMoveListGuide('controls');
      });
    }

    if (csBtn) {
      csBtn.addEventListener('click', () => {
        this.openMoveListGuide('fighters', this.selectedSelectCharId || 'vex');
      });
    }

    if (hudBtn) {
      hudBtn.addEventListener('click', () => {
        const charId = (this.engine && this.engine.p1) ? this.engine.p1.charId : 'vex';
        this.openMoveListGuide('fighters', charId);
      });
    }

    // Tab buttons switching
    const tabControls = document.getElementById('tab-guide-controls');
    const tabCombos = document.getElementById('tab-guide-combos');
    const tabFighters = document.getElementById('tab-guide-fighters');
    const tabFaq = document.getElementById('tab-guide-faq');

    if (tabControls) {
      tabControls.addEventListener('click', () => this.switchGuideTab('controls'));
    }
    if (tabCombos) {
      tabCombos.addEventListener('click', () => this.switchGuideTab('combos'));
    }
    if (tabFighters) {
      tabFighters.addEventListener('click', () => {
        const charId = (this.engine && this.engine.p1) ? this.engine.p1.charId : (this.selectedSelectCharId || 'vex');
        this.switchGuideTab('fighters', charId);
      });
    }
    if (tabFaq) {
      tabFaq.addEventListener('click', () => this.switchGuideTab('faq'));
    }
  }

  openMoveListGuide(initialTab = 'controls', charId = 'vex') {
    const modal = document.getElementById('modal-movelist-guide');
    if (!modal) return;
    modal.classList.add('active');
    this.switchGuideTab(initialTab, charId);
    soundEngine.playUiClick();
  }

  closeMoveListGuide() {
    const modal = document.getElementById('modal-movelist-guide');
    if (modal) modal.classList.remove('active');
    soundEngine.playUiClick();
  }

  switchGuideTab(tabName, charId = 'vex') {
    const tabs = {
      controls: { btn: document.getElementById('tab-guide-controls'), content: document.getElementById('content-guide-controls') },
      combos: { btn: document.getElementById('tab-guide-combos'), content: document.getElementById('content-guide-combos') },
      fighters: { btn: document.getElementById('tab-guide-fighters'), content: document.getElementById('content-guide-fighters') },
      faq: { btn: document.getElementById('tab-guide-faq'), content: document.getElementById('content-guide-faq') }
    };

    Object.keys(tabs).forEach(k => {
      const t = tabs[k];
      if (t.btn) t.btn.classList.toggle('active', k === tabName);
      if (t.content) {
        t.content.style.display = (k === tabName) ? 'block' : 'none';
        t.content.classList.toggle('active', k === tabName);
      }
    });

    if (tabName === 'fighters') {
      this.renderGuideFighter(charId || 'vex');
    }
  }

  renderGuideFighter(charId) {
    const tabsContainer = document.getElementById('guide-fighter-tabs');
    const detailsContainer = document.getElementById('guide-fighter-details');
    if (!tabsContainer || !detailsContainer) return;

    tabsContainer.innerHTML = '';
    const roster = ['vex', 'solaris', 'lyra', 'aeron', 'kairo', 'nox'];

    roster.forEach(id => {
      const c = CHARACTERS[id];
      if (!c) return;
      const btn = document.createElement('button');
      btn.className = `guide-fighter-btn ${id === charId ? 'active' : ''}`;
      btn.textContent = c.name;
      btn.style.setProperty('--btn-core-color', c.coreColor);
      btn.addEventListener('click', () => {
        this.renderGuideFighter(id);
        soundEngine.playUiClick();
      });
      tabsContainer.appendChild(btn);
    });

    const c = CHARACTERS[charId] || CHARACTERS.vex;
    const sp1 = c.abilities[0];
    const sp2 = c.abilities[1];
    const ult = c.abilities[2];

    const signatureCombos = {
      vex: '[LIGHT] ➔ [LIGHT] ➔ [CRIMSON DASH] (Fast poke into piercing launcher)',
      solaris: '[HEAVY] ➔ [SOLAR FLARE] ➔ [SUPERNOVA IMPACT] (Kinetic armor burst)',
      lyra: '[LIGHT] ➔ [LIGHT] ➔ [PHANTOM FLURRY] (Supersonic multi-hit juggles)',
      aeron: '[LIGHT] ➔ [TEMPEST DIVE] ➔ [CYCLONE HURRICANE] (Aerial vortex loops)',
      kairo: '[LIGHT] ➔ [PRISM ARROW] ➔ [EMERALD APEX] (Sniper spacing & zoning)',
      nox: '[DODGE] ➔ [VOID STEP] ➔ [EVENT HORIZON] (Phase ambush execution)'
    };

    detailsContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px; margin-bottom: 10px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-family: var(--font-display); font-size: 20px; font-weight: 800; color: ${c.coreColor};">${c.name}</span>
            <span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: ${c.coreColor}22; color: ${c.coreColor}; font-weight: 800; border: 1px solid ${c.coreColor}55;">${c.core.toUpperCase()} CORE</span>
            <span style="font-size: 11px; color: var(--text-muted); font-weight: 700;">${c.role.toUpperCase()}</span>
          </div>
          <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">"${c.quote}"</div>
        </div>
        <div style="text-align: right; font-size: 11px; color: var(--text-muted);">
          <div>DIFFICULTY: <strong style="color: var(--text-primary);">${c.difficultyStars} / 5</strong></div>
          <div>WEAPON: <strong style="color: var(--text-primary);">${c.weapon}</strong></div>
        </div>
      </div>

      <div style="padding: 8px 12px; background: rgba(0,0,0,0.03); border-radius: 4px; border-left: 3px solid ${c.coreColor}; margin-bottom: 10px;">
        <div style="font-size: 10px; font-weight: 800; color: ${c.coreColor};">PASSIVE RESONANCE // ${c.passive.name.toUpperCase()}</div>
        <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">${c.passive.description}</div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; margin-bottom: 10px;">
        <div class="ability-guide-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="font-size: 12px; color: var(--text-primary);">${sp1.name}</strong>
            <span style="font-size: 9px; font-weight: 800; color: var(--action-primary); background: rgba(217,54,54,0.1); padding: 2px 6px; border-radius: 3px;">${sp1.cost} ENERGY</span>
          </div>
          <div style="font-size: 10px; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">INPUT: [SPECIAL] / L / U</div>
          <p style="font-size: 11px; color: var(--text-secondary); line-height: 1.35; margin: 0;">${sp1.description}</p>
        </div>

        <div class="ability-guide-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="font-size: 12px; color: var(--text-primary);">${sp2.name}</strong>
            <span style="font-size: 9px; font-weight: 800; color: var(--action-primary); background: rgba(217,54,54,0.1); padding: 2px 6px; border-radius: 3px;">${sp2.cost} ENERGY</span>
          </div>
          <div style="font-size: 10px; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">INPUT: [SPECIAL 2] / I / Q</div>
          <p style="font-size: 11px; color: var(--text-secondary); line-height: 1.35; margin: 0;">${sp2.description}</p>
        </div>

        <div class="ability-guide-card" style="border-color: ${c.coreColor}66; grid-column: 1 / -1;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="font-size: 13px; color: ${c.coreColor};">🌌 ${ult.name}</strong>
            <span style="font-size: 9px; font-weight: 800; color: var(--accent-gold); background: rgba(200,148,40,0.15); padding: 2px 6px; border-radius: 3px;">100% CORE</span>
          </div>
          <div style="font-size: 10px; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">INPUT: [ULTIMATE] / I / O</div>
          <p style="font-size: 11px; color: var(--text-secondary); line-height: 1.35; margin: 0;">${ult.description}</p>
        </div>
      </div>

      <div style="padding: 8px 12px; background: rgba(0,0,0,0.03); border-radius: 4px; border: 1px solid var(--border-subtle);">
        <div style="font-size: 10px; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">SIGNATURE COMBO SEQUENCE:</div>
        <div style="font-size: 11px; font-family: var(--font-display); font-weight: 700; color: ${c.coreColor};">${signatureCombos[charId] || '[LIGHT] ➔ [LIGHT] ➔ [HEAVY]'}</div>
      </div>
    `;
  }

  // --- INTERACTIVE BEGINNER TUTORIAL & PRACTICE TELEMETRY ---
  setupTutorialAndTraining() {
    this.tutorialCurrentStep = 1;
    this.isTutorialActive = false;

    this.tutorialSteps = [
      { step: 1, title: 'COMBAT MOVEMENT', instruction: 'Move left and right using the virtual joystick or A/D keys.', cue: 'JOYSTICK / A D', action: 'MOVE' },
      { step: 2, title: 'LIGHT ATTACK', instruction: 'Tap the Light Attack button or press [J] for fast combo strikes.', cue: '[LIGHT] / J', action: 'LIGHT' },
      { step: 3, title: 'HEAVY ATTACK', instruction: 'Tap Heavy Attack or press [K] for high-damage launcher strikes.', cue: '[HEAVY] / K', action: 'HEAVY' },
      { step: 4, title: 'BLOCK DEFENSE', instruction: 'Hold Block or press [SHIFT] to absorb incoming attacks with kinetic shield.', cue: '[BLOCK] / SHIFT', action: 'BLOCK' },
      { step: 5, title: 'DODGE ROLL', instruction: 'Tap Dodge or press [SPACE] to roll through strikes with invulnerability frames.', cue: '[DODGE] / SPACE', action: 'DODGE' },
      { step: 6, title: 'SPECIAL ABILITY', instruction: 'Execute your signature special move by tapping [SPECIAL] or [L].', cue: '[SPECIAL] / L', action: 'SPECIAL' },
      { step: 7, title: 'COMBO BRANCHING', instruction: 'Chain [LIGHT] ➔ [LIGHT] ➔ [HEAVY] for a crushing knockdown finisher.', cue: 'LIGHT ➔ LIGHT ➔ HEAVY', action: 'COMBO' },
      { step: 8, title: 'CINEMATIC ULTIMATE', instruction: 'When your Core meter reaches 100%, unleash your Ultimate with [ULTIMATE] or [I].', cue: '[ULTIMATE] / I', action: 'ULTIMATE' },
      { step: 9, title: 'COMBAT READINESS', instruction: 'You have mastered tactical protocols. Step into the arena and claim victory!', cue: 'READY FOR COMBAT', action: 'READY' }
    ];

    const btnSkip = document.getElementById('btn-skip-tutorial');
    if (btnSkip) {
      btnSkip.addEventListener('click', () => this.completeTutorial());
    }

    // Training Telemetry Buttons
    const btnResetPos = document.getElementById('btn-reset-pos');
    if (btnResetPos) {
      btnResetPos.addEventListener('click', () => this.resetTrainingPosition());
    }

    const btnTrainMovelist = document.getElementById('btn-training-movelist');
    if (btnTrainMovelist) {
      btnTrainMovelist.addEventListener('click', () => {
        const charId = (this.engine && this.engine.p1) ? this.engine.p1.charId : 'vex';
        this.openMoveListGuide('fighters', charId);
      });
    }
  }

  startTutorial() {
    this.isTutorialActive = true;
    this.tutorialCurrentStep = 1;
    this.renderTutorialStep();
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) overlay.style.display = 'flex';
  }

  renderTutorialStep() {
    const stepData = this.tutorialSteps[this.tutorialCurrentStep - 1];
    if (!stepData) {
      this.completeTutorial();
      return;
    }

    const tagEl = document.getElementById('tut-step-tag');
    if (tagEl) tagEl.textContent = `STEP ${stepData.step} OF 9`;

    const titleEl = document.getElementById('tut-title');
    if (titleEl) titleEl.textContent = stepData.title;

    const instEl = document.getElementById('tut-instruction');
    if (instEl) instEl.textContent = stepData.instruction;

    const cueEl = document.getElementById('tut-visual-cue');
    if (cueEl) {
      if (stepData.step === 9) {
        cueEl.innerHTML = `<button class="btn-primary-action" id="tut-btn-finish" style="padding: 8px 24px; font-size: 13px;">START FIGHT</button>`;
        const finishBtn = document.getElementById('tut-btn-finish');
        if (finishBtn) finishBtn.onclick = () => this.completeTutorial();
      } else {
        cueEl.innerHTML = `<span class="cue-key">${stepData.cue}</span>`;
      }
    }

    const fillEl = document.getElementById('tut-progress-fill');
    if (fillEl) {
      fillEl.style.width = `${Math.round((stepData.step / 9) * 100)}%`;
    }
  }

  checkTutorialAction(action) {
    if (!this.isTutorialActive) return;
    const current = this.tutorialSteps[this.tutorialCurrentStep - 1];
    if (!current) return;

    if (current.action === 'MOVE' && action === 'MOVE') {
      setTimeout(() => this.advanceTutorialStep(), 400);
    } else if (current.action === 'LIGHT' && action === 'LIGHT') {
      this.advanceTutorialStep();
    } else if (current.action === 'HEAVY' && action === 'HEAVY') {
      this.advanceTutorialStep();
    } else if (current.action === 'BLOCK' && action === 'BLOCK') {
      this.advanceTutorialStep();
    } else if (current.action === 'DODGE' && action === 'DODGE') {
      this.advanceTutorialStep();
    } else if (current.action === 'SPECIAL' && (action === 'SPECIAL' || action === 'SPECIAL_1')) {
      this.advanceTutorialStep();
    } else if (current.action === 'ULTIMATE' && action === 'ULTIMATE') {
      this.advanceTutorialStep();
    }
  }

  advanceTutorialStep() {
    this.tutorialCurrentStep++;
    if (typeof soundEngine.playComboHit === 'function') {
      soundEngine.playComboHit(this.tutorialCurrentStep);
    }
    if (this.tutorialCurrentStep > 9) {
      this.completeTutorial();
    } else {
      this.renderTutorialStep();
    }
  }

  completeTutorial() {
    this.isTutorialActive = false;
    localStorage.setItem('riftborn_tutorial_completed', 'true');
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) overlay.style.display = 'none';
    soundEngine.playParry();
  }

  resetTrainingPosition() {
    if (!this.engine || !this.engine.p1) return;
    this.engine.p1.x = 220;
    this.engine.p1.y = 500;
    this.engine.p1.vx = 0;
    this.engine.p1.vy = 0;
    this.engine.p1.hp = this.engine.p1.maxHp;
    this.engine.p1.currentCore = 100;
    this.engine.p1.state = FIGHTER_STATES.IDLE;

    if (this.engine.p2) {
      this.engine.p2.x = 650;
      this.engine.p2.y = 500;
      this.engine.p2.vx = 0;
      this.engine.p2.vy = 0;
      this.engine.p2.hp = this.engine.p2.maxHp;
      this.engine.p2.state = FIGHTER_STATES.IDLE;
    }

    this.engine.roundTime = 99;
    const lastInputEl = document.getElementById('train-last-input');
    if (lastInputEl) lastInputEl.textContent = 'POSITION RESET';
    const comboEl = document.getElementById('train-combo-chain');
    if (comboEl) comboEl.textContent = 'READY';
    const dmgEl = document.getElementById('train-total-dmg');
    if (dmgEl) dmgEl.textContent = '0 DMG';

    soundEngine.playParry();
  }
}

// Instantiate on DOM load or immediately if ready
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    window.riftbornApp = new RiftbornApp();
  });
} else {
  window.riftbornApp = new RiftbornApp();
}
