// RIFTBORN In-Game Feedback & Bug Reporting Service
// Direct lightweight integration with Supabase PostgREST API
// Zero additional dependencies, zero secret leakage, strictly uses publishable anon key with RLS

export const FEEDBACK_CATEGORIES = [
  { id: 'bug', label: 'Bug Report', icon: '🐞' },
  { id: 'gameplay', label: 'Gameplay Issue', icon: '⚔️' },
  { id: 'performance', label: 'Performance Issue', icon: '⚡' },
  { id: 'suggestion', label: 'Suggestion', icon: '💡' },
  { id: 'other', label: 'Other Feedback', icon: '💬' }
];

export const FEEDBACK_PRIORITIES = [
  { id: 'low', label: 'Low' },
  { id: 'normal', label: 'Normal' },
  { id: 'high', label: 'High' },
  { id: 'urgent', label: 'Urgent' }
];

export class FeedbackService {
  constructor() {
    this.gameVersion = 'v1.2.0';
    this.rateLimitSeconds = 30; // 30s cooldown between submissions
    this._memoryStorage = {}; // Fallback storage for Node / test environments
  }

  _getStorage(key) {
    try {
      if (typeof sessionStorage !== 'undefined') {
        return sessionStorage.getItem(key);
      }
    } catch (_) {}
    return this._memoryStorage[key] || null;
  }

  _setStorage(key, val) {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(key, val);
        return;
      }
    } catch (_) {}
    this._memoryStorage[key] = val;
  }

  clearRateLimitCooldown() {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('riftborn_last_feedback_time');
        sessionStorage.removeItem('riftborn_last_feedback_hash');
      }
    } catch (_) {}
    delete this._memoryStorage['riftborn_last_feedback_time'];
    delete this._memoryStorage['riftborn_last_feedback_hash'];
  }

  clearRateLimitCooldownOnly() {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('riftborn_last_feedback_time');
      }
    } catch (_) {}
    delete this._memoryStorage['riftborn_last_feedback_time'];
  }

  getSupabaseConfig() {
    let url = null;
    let anonKey = null;

    if (typeof import.meta !== 'undefined' && import.meta.env) {
      url = import.meta.env.VITE_SUPABASE_URL || null;
      anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || null;
    }

    if (!url && typeof process !== 'undefined' && process.env) {
      url = process.env.VITE_SUPABASE_URL || null;
      anonKey = process.env.VITE_SUPABASE_ANON_KEY || null;
    }

    const isConfigured = Boolean(
      url &&
      anonKey &&
      !url.includes('your-project-id') &&
      !anonKey.includes('your-anon-public-key')
    );

    return { url, anonKey, isConfigured };
  }

  getDeviceInfo() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return 'Generic Browser (Automated/Server Environment)';
    }

    const ua = navigator.userAgent || '';
    let os = 'Unknown OS';
    if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Macintosh|Mac OS/i.test(ua)) os = 'macOS';
    else if (/Android/i.test(ua)) os = 'Android';
    else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
    else if (/Linux/i.test(ua)) os = 'Linux';

    let browser = 'Browser';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg/')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';

    const width = window.innerWidth || 0;
    const height = window.innerHeight || 0;
    const isTouch = 'ontouchstart' in window || (navigator.maxTouchPoints > 0);

    return `${os} • ${browser} • ${width}x${height} • ${isTouch ? 'Touch' : 'Desktop'}`.slice(0, 200);
  }

  getDeviceSummary() {
    return this.getDeviceInfo();
  }

  validateSubmission(data) {
    const errors = [];

    // 1. Honeypot check (anti-bot trap)
    if (data.honeypot && data.honeypot.trim().length > 0) {
      return {
        isValid: false,
        isBotSpam: true,
        errors: ['Spam trap triggered.']
      };
    }

    // 2. Category validation
    const validCats = ['bug', 'gameplay', 'performance', 'suggestion', 'other'];
    if (!data.category || !validCats.includes(data.category)) {
      errors.push('Please select a valid feedback category.');
    }

    // 3. Title validation (3 - 120 chars)
    const title = (data.title || '').trim();
    if (!title || title.length < 3) {
      errors.push('Title must be at least 3 characters long.');
    } else if (title.length > 120) {
      errors.push('Title cannot exceed 120 characters.');
    }

    // 4. Description validation (10 - 2000 chars)
    const description = (data.description || '').trim();
    if (!description || description.length < 10) {
      errors.push('Description must be at least 10 characters long.');
    } else if (description.length > 2000) {
      errors.push('Description cannot exceed 2000 characters.');
    }

    // 5. Priority validation (optional, default normal)
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    const priority = data.priority || 'normal';
    if (priority && !validPriorities.includes(priority)) {
      errors.push('Invalid priority selected.');
    }

    // 6. Email validation (optional)
    const email = (data.playerEmail || data.email || '').trim();
    if (email) {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(email)) {
        errors.push('Please enter a valid email address, or leave it blank.');
      } else if (email.length > 150) {
        errors.push('Email address is too long.');
      }
    }

    // 7. Rate limiting check (cooldown window)
    const lastSubmitTime = parseInt(this._getStorage('riftborn_last_feedback_time') || '0', 10);
    const elapsed = Math.floor((Date.now() - lastSubmitTime) / 1000);
    if (lastSubmitTime > 0 && elapsed < this.rateLimitSeconds) {
      errors.push(`Please wait ${this.rateLimitSeconds - elapsed} seconds before sending another report.`);
    }

    // 8. Duplicate submission check (tracks its own 5-minute window)
    const lastFingerprint = this._getStorage('riftborn_last_feedback_hash');
    const lastHashTime = parseInt(this._getStorage('riftborn_last_feedback_hash_time') || '0', 10);
    const hashElapsed = Math.floor((Date.now() - lastHashTime) / 1000);
    const currentFingerprint = `${title}__${description}`;
    if (lastFingerprint === currentFingerprint && lastHashTime > 0 && hashElapsed < 300) {
      errors.push('Duplicate submission: you have already submitted this report recently.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: {
        category: data.category,
        title,
        description,
        priority: priority || 'normal',
        player_email: email || null,
        game_version: this.gameVersion,
        page_name: (data.pageName || 'Game').slice(0, 64),
        device_info: this.getDeviceInfo()
      }
    };
  }

  // Alias for test clarity
  validateInput(data) {
    const res = this.validateSubmission(data);
    return {
      valid: res.isValid,
      error: res.errors[0] || null,
      errors: res.errors,
      sanitized: res.sanitized
    };
  }

  async submitFeedback(data) {
    // 1. Client-side validation & rate-limiting
    const validation = this.validateSubmission(data);
    
    // Honeypot trap: if a bot filled the honeypot, silently pretend success
    if (validation.isBotSpam) {
      return {
        success: true,
        isBotSpam: true,
        message: 'Thank you! Your feedback has been submitted.'
      };
    }

    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors[0],
        allErrors: validation.errors
      };
    }

    const payload = validation.sanitized;
    const config = this.getSupabaseConfig();

    if (!config.isConfigured) {
      // Supabase credentials not provided yet in environment
      return {
        success: false,
        error: 'Feedback server is not configured yet. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Supabase project settings.',
        unconfigured: true
      };
    }

    let baseUrl = (config.url || '').trim().replace(/\/+$/, '');
    baseUrl = baseUrl.replace(/\/rest\/v1\/?$/, '');
    const endpoint = `${baseUrl}/rest/v1/game_feedback`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'apikey': config.anonKey,
          'Authorization': `Bearer ${config.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errDetails = 'Submission failed';
        try {
          const errJson = await response.json();
          errDetails = errJson.message || errJson.details || errJson.hint || response.statusText;
        } catch (_) {
          errDetails = response.statusText || `HTTP ${response.status}`;
        }
        return {
          success: false,
          error: `Could not submit feedback: ${errDetails}`
        };
      }

      // Record rate limit timestamp and duplicate prevention hash on success
      this._setStorage('riftborn_last_feedback_time', Date.now().toString());
      this._setStorage('riftborn_last_feedback_hash', `${payload.title}__${payload.description}`);
      this._setStorage('riftborn_last_feedback_hash_time', Date.now().toString());

      return {
        success: true,
        message: 'Thank you! Your feedback has been submitted.'
      };

    } catch (err) {
      return {
        success: false,
        error: `Network error: ${err.message || 'Unable to connect to feedback database'}`
      };
    }
  }
}

export const feedbackService = new FeedbackService();
