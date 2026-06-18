// Gamification System — Points, Badges, Levels

const LEVELS = [
  { level: 1,  name: 'Seedling',      emoji: '🌱', minPoints: 0 },
  { level: 2,  name: 'Sprout',        emoji: '🌿', minPoints: 50 },
  { level: 3,  name: 'Sapling',       emoji: '🌳', minPoints: 150 },
  { level: 4,  name: 'Eco Aware',     emoji: '♻️', minPoints: 300 },
  { level: 5,  name: 'Green Citizen', emoji: '🌍', minPoints: 500 },
  { level: 6,  name: 'Eco Warrior',   emoji: '⚡', minPoints: 750 },
  { level: 7,  name: 'Climate Hero',  emoji: '🦸', minPoints: 1100 },
  { level: 8,  name: 'Earth Guardian',emoji: '🌏', minPoints: 1600 },
  { level: 9,  name: 'Eco Legend',    emoji: '🏆', minPoints: 2200 },
  { level: 10, name: 'Planet Saver',  emoji: '🌟', minPoints: 3000 },
];

const POINT_REWARDS = {
  log_entry:        5,    // points per log entry
  daily_streak:     10,   // bonus for streak continuation
  weekly_streak:    50,   // bonus for 7-day streak
  monthly_streak:  200,   // bonus for 30-day streak
  set_goal:         20,
  complete_milestone: 30,
  below_avg:         15,  // daily emissions below average
  low_transport:     10,
  plant_based_day:   20,
  share_achievement: 10,
};

const Gamification = {
  /**
   * Award points for an action and return updated state
   */
  awardPoints(state, action, count = 1) {
    const points = (POINT_REWARDS[action] || 0) * count;
    state.user.points += points;
    state.user.level = this.calculateLevel(state.user.points);
    return { state, pointsEarned: points };
  },

  /**
   * Calculate level from points
   */
  calculateLevel(points) {
    let level = 1;
    for (const l of LEVELS) {
      if (points >= l.minPoints) level = l.level;
    }
    return level;
  },

  /**
   * Get level info
   */
  getLevelInfo(level) {
    return LEVELS.find(l => l.level === level) || LEVELS[0];
  },

  /**
   * Get next level info
   */
  getNextLevel(currentLevel) {
    return LEVELS.find(l => l.level === currentLevel + 1);
  },

  /**
   * Calculate progress to next level
   */
  getLevelProgress(points, currentLevel) {
    const current = LEVELS.find(l => l.level === currentLevel);
    const next = LEVELS.find(l => l.level === currentLevel + 1);
    if (!next) return 100;
    const range = next.minPoints - current.minPoints;
    const progress = points - current.minPoints;
    return Math.min(100, Math.round((progress / range) * 100));
  },

  /**
   * Check and award badges
   */
  checkBadges(state) {
    const newBadges = [];
    for (const badge of window.AppData.BADGE_DEFINITIONS) {
      if (!state.badges.includes(badge.id) && badge.condition(state)) {
        state.badges.push(badge.id);
        newBadges.push(badge);
      }
    }
    return { state, newBadges };
  },

  /**
   * Update streak
   */
  updateStreak(state) {
    const today = new Date().toDateString();
    const lastLog = state.user.lastLogDate ? new Date(state.user.lastLogDate).toDateString() : null;

    if (lastLog === today) return state; // Already logged today

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (lastLog === yesterdayStr) {
      state.user.streak += 1;
    } else if (lastLog !== today) {
      state.user.streak = 1;
    }

    state.user.lastLogDate = new Date().toISOString();
    return state;
  },

  /**
   * Get all badge definitions with earned status
   */
  getAllBadges(state) {
    return window.AppData.BADGE_DEFINITIONS.map(b => ({
      ...b,
      earned: state.badges.includes(b.id),
    }));
  },

  LEVELS,
  POINT_REWARDS,
};

window.Gamification = Gamification;
