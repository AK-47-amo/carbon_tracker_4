// ═══════════════════════════════════════════════════════════════════════════
// Carbon Tracker — Security Utilities Module
// ═══════════════════════════════════════════════════════════════════════════

const Security = (() => {
  'use strict';

  // ─── Whitelists ──────────────────────────────────────────────────────────
  const VALID_CATEGORIES = ['transport', 'flight', 'home', 'food', 'shopping'];

  const VALID_SUBTYPES = {
    transport: ['car_petrol', 'car_diesel', 'car_electric', 'car_hybrid',
                'motorcycle', 'bus', 'train', 'subway', 'cycling', 'walking',
                'taxi', 'rideshare'],
    flight:    ['flight'],
    home:      ['electricity', 'natural_gas', 'heating_oil', 'lpg',
                'wood_pellets', 'solar'],
    food:      ['beef', 'lamb', 'pork', 'chicken', 'fish', 'dairy', 'eggs',
                'vegetables', 'fruits', 'legumes', 'grains', 'food_waste'],
    shopping:  ['clothing', 'electronics', 'furniture', 'books', 'online_order'],
  };

  const VALID_PAGES = [
    'dashboard', 'tracker', 'insights', 'action-plan',
    'progress', 'gamification', 'community', 'education',
  ];

  // ─── HTML Escaping ───────────────────────────────────────────────────────
  const ESCAPE_MAP = {
    '&':  '&amp;',
    '<':  '&lt;',
    '>':  '&gt;',
    '"':  '&quot;',
    "'":  '&#x27;',
    '`':  '&#x60;',
    '/':  '&#x2F;',
  };

  const ESCAPE_RE = /[&<>"'`/]/g;

  /**
   * Escape a string for safe insertion into HTML.
   * Handles null, undefined, numbers, and non-string types gracefully.
   * @param {*} str — value to escape
   * @returns {string} — escaped string safe for innerHTML
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    if (typeof str === 'number' || typeof str === 'boolean') return String(str);
    if (typeof str !== 'string') return '';
    return str.replace(ESCAPE_RE, (char) => ESCAPE_MAP[char] || char);
  }

  // ─── Input Validation ───────────────────────────────────────────────────

  /**
   * Validate and clamp a numeric value.
   * @param {*} value — raw input
   * @param {number} min — minimum allowed value
   * @param {number} max — maximum allowed value
   * @param {number} fallback — value to return if invalid
   * @returns {number}
   */
  function validateNumericInput(value, min, max, fallback = 0) {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.max(min, Math.min(max, num));
  }

  /**
   * Validate and sanitize a string input.
   * Strips HTML tags and truncates to maxLength.
   * @param {*} value — raw input
   * @param {number} maxLength — maximum character length
   * @param {string} fallback — value to return if empty/invalid
   * @returns {string}
   */
  function validateStringInput(value, maxLength = 200, fallback = '') {
    if (value === null || value === undefined) return fallback;
    if (typeof value !== 'string') return fallback;
    // Strip HTML tags
    let cleaned = value.replace(/<[^>]*>/g, '');
    // Truncate
    if (cleaned.length > maxLength) cleaned = cleaned.substring(0, maxLength);
    return cleaned.trim() || fallback;
  }

  /**
   * Validate a date string. Returns ISO string or null.
   * @param {string} dateStr — raw date input
   * @param {object} opts — { allowFuture: bool, allowPast: bool }
   * @returns {string|null}
   */
  function validateDate(dateStr, opts = {}) {
    const { allowFuture = false, allowPast = true } = opts;
    if (!dateStr || typeof dateStr !== 'string') return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;

    const now = new Date();
    if (!allowFuture && d > now) return null;
    if (!allowPast && d < now) return null;

    return d.toISOString();
  }

  /**
   * Validate a category against whitelist.
   */
  function isValidCategory(cat) {
    return VALID_CATEGORIES.includes(cat);
  }

  /**
   * Validate a subtype against its category whitelist.
   */
  function isValidSubtype(category, subtype) {
    return VALID_SUBTYPES[category]?.includes(subtype) === true;
  }

  /**
   * Validate a page name against whitelist.
   */
  function isValidPage(page) {
    return VALID_PAGES.includes(page);
  }

  /**
   * Validate an ID string — alphanumeric, underscore, hyphen only.
   */
  function isValidId(id) {
    if (typeof id !== 'string') return false;
    return /^[a-zA-Z0-9_-]+$/.test(id) && id.length <= 100;
  }

  // ─── Entry Sanitization ─────────────────────────────────────────────────

  /**
   * Sanitize a single activity entry. Returns a clean entry or null if invalid.
   */
  function sanitizeEntry(entry) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;

    const id = typeof entry.id === 'string' ? entry.id.substring(0, 100) : null;
    if (!id) return null;

    const date = validateDate(entry.date, { allowFuture: true, allowPast: true });
    if (!date) return null;

    const category = entry.category;
    if (!isValidCategory(category)) return null;

    const subtype = entry.subtype;
    if (!isValidSubtype(category, subtype)) return null;

    const value = validateNumericInput(entry.value, 0, 1000000, 0);
    const co2   = validateNumericInput(entry.co2,   0, 1000000, 0);
    const unit  = validateStringInput(entry.unit, 20, 'unit');
    const label = validateStringInput(entry.label, 200, `${category}: ${subtype}`);

    return { id, date, category, subtype, value, unit, co2, label };
  }

  /**
   * Sanitize a goal object. Returns a clean goal or null if invalid.
   */
  function sanitizeGoal(goal) {
    if (!goal || typeof goal !== 'object' || Array.isArray(goal)) return null;

    const id = typeof goal.id === 'string' ? goal.id.substring(0, 100) : null;
    if (!id) return null;

    const title    = validateStringInput(goal.title, 100);
    if (!title) return null;

    const category = isValidCategory(goal.category) ? goal.category : 'overall';
    const target   = validateNumericInput(goal.target, 1, 100, 20);
    const deadline = validateDate(goal.deadline, { allowFuture: true, allowPast: true }) || new Date(Date.now() + 30 * 86400000).toISOString();
    const createdAt = validateDate(goal.createdAt, { allowFuture: true, allowPast: true }) || new Date().toISOString();

    // Sanitize milestones
    let milestones = [];
    if (Array.isArray(goal.milestones)) {
      milestones = goal.milestones
        .slice(0, 20)  // max 20 milestones
        .filter(m => m && typeof m === 'object')
        .map(m => ({
          week:   validateNumericInput(m.week, 1, 52, 1),
          action: validateStringInput(m.action, 200, 'Complete milestone'),
          done:   m.done === true,
        }));
    }

    return { id, title, category, target, unit: '%', deadline, createdAt, milestones };
  }

  // ─── Full State Validation ──────────────────────────────────────────────

  /**
   * Validate the entire application state from localStorage.
   * Returns a sanitized state, or null if state is unrecoverable.
   */
  function validateState(rawState) {
    if (!rawState || typeof rawState !== 'object' || Array.isArray(rawState)) {
      return null;
    }

    const state = {};

    // ── User ──
    const u = rawState.user;
    state.user = {
      name:       validateStringInput(u?.name, 50, 'Eco Warrior'),
      avatar:     validateStringInput(u?.avatar, 10, '🌿'),
      joinDate:   validateDate(u?.joinDate, { allowFuture: true, allowPast: true }) || new Date().toISOString(),
      points:     validateNumericInput(u?.points, 0, 1000000, 0),
      level:      validateNumericInput(u?.level, 1, 10, 1),
      streak:     validateNumericInput(u?.streak, 0, 3650, 0),
      lastLogDate: u?.lastLogDate ? (validateDate(u.lastLogDate, { allowFuture: true, allowPast: true }) || null) : null,
    };

    // ── Entries ──
    if (Array.isArray(rawState.entries)) {
      state.entries = rawState.entries
        .slice(0, 50000)  // cap at 50k entries
        .map(sanitizeEntry)
        .filter(Boolean);
    } else {
      state.entries = [];
    }

    // ── Goals ──
    if (Array.isArray(rawState.goals)) {
      state.goals = rawState.goals
        .slice(0, 100)
        .map(sanitizeGoal)
        .filter(Boolean);
    } else {
      state.goals = [];
    }

    // ── Badges ──
    if (Array.isArray(rawState.badges)) {
      state.badges = rawState.badges
        .filter(b => typeof b === 'string' && b.length <= 50)
        .slice(0, 100);
    } else {
      state.badges = [];
    }

    // ── Settings ──
    const s = rawState.settings;
    state.settings = {
      country: validateStringInput(s?.country, 10, 'UK'),
      unit:    validateStringInput(s?.unit, 10, 'kg'),
    };

    return state;
  }

  // ─── Deep Freeze Utility ────────────────────────────────────────────────

  /**
   * Recursively freeze an object to prevent mutation.
   */
  function deepFreeze(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach(name => {
      const val = obj[name];
      if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) {
        deepFreeze(val);
      }
    });
    return obj;
  }

  // ─── Public API ─────────────────────────────────────────────────────────
  return {
    escapeHtml,
    validateNumericInput,
    validateStringInput,
    validateDate,
    isValidCategory,
    isValidSubtype,
    isValidPage,
    isValidId,
    sanitizeEntry,
    sanitizeGoal,
    validateState,
    deepFreeze,
    VALID_CATEGORIES,
    VALID_SUBTYPES,
    VALID_PAGES,
  };
})();

window.Security = Security;
