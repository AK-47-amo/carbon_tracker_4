// Carbon Calculation Engine

const calc = {
  /**
   * Calculate CO2e for a given entry type
   */
  calculate(category, subtype, value) {
    if (!Security.isValidCategory(category) && category !== 'flight') return 0;
    const v = Security.validateNumericInput(value, 0, 1000000, 0);
    if (v === 0) return 0;

    const EF = window.AppData.EMISSION_FACTORS;
    let co2 = 0;

    switch (category) {
      case 'transport':
        co2 = Object.prototype.hasOwnProperty.call(EF.transport, subtype) ? v * EF.transport[subtype] : 0;
        break;

      case 'flight': {
        let factor;
        if (v < 1500)       factor = EF.flight.short_haul;
        else if (v < 4000)  factor = EF.flight.medium_haul;
        else                    factor = EF.flight.long_haul;
        co2 = v * factor * EF.flight.multiplier;
        break;
      }

      case 'home':
        co2 = Object.prototype.hasOwnProperty.call(EF.home, subtype) ? v * EF.home[subtype] : 0;
        break;

      case 'food':
        co2 = Object.prototype.hasOwnProperty.call(EF.food, subtype) ? v * EF.food[subtype] : 0;
        break;

      case 'shopping':
        co2 = Object.prototype.hasOwnProperty.call(EF.shopping, subtype) ? v * EF.shopping[subtype] : 0;
        break;

      default:
        co2 = 0;
    }

    return Math.max(0, Math.min(1000000, Math.round(co2 * 100) / 100));
  },

  /**
   * Get total CO₂ from entries array (optionally filtered)
   */
  totalFromEntries(entries) {
    return entries.reduce((sum, e) => sum + (e.co2 || 0), 0);
  },

  /**
   * Get entries for a specific date range
   */
  entriesInRange(entries, startDate, endDate) {
    return entries.filter(e => {
      const d = new Date(e.date);
      return d >= startDate && d <= endDate;
    });
  },

  /**
   * Get entries for today
   */
  todayEntries(entries) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.entriesInRange(entries, today, tomorrow);
  },

  /**
   * Get entries for the last N days
   */
  lastNDays(entries, n) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - n);
    start.setHours(0, 0, 0, 0);
    return this.entriesInRange(entries, start, end);
  },

  /**
   * Group entries by category and sum CO2
   */
  byCategory(entries) {
    const result = Object.create(null);
    result.transport = 0; result.flight = 0; result.home = 0; result.food = 0; result.shopping = 0;
    entries.forEach(e => {
      if (Security.isValidCategory(e.category) && Object.prototype.hasOwnProperty.call(result, e.category)) {
        result[e.category] += Security.validateNumericInput(e.co2, 0, 1000000, 0);
      }
    });
    return result;
  },

  /**
   * Group entries by day for chart data
   */
  byDay(entries, days = 30) {
    const labels = [];
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const dayEntries = entries.filter(e => {
        const ed = new Date(e.date);
        return ed >= d && ed < nextD;
      });

      labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      data.push(Math.round(this.totalFromEntries(dayEntries) * 10) / 10);
    }

    return { labels, data };
  },

  /**
   * Group entries by day and category for stacked charts
   */
  byDayAndCategory(entries, days = 30) {
    const categories = ['transport', 'flight', 'home', 'food', 'shopping'];
    const labels = [];
    const datasets = {};
    categories.forEach(c => { datasets[c] = []; });

    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

      const dayEntries = entries.filter(e => {
        const ed = new Date(e.date);
        return ed >= d && ed < nextD;
      });

      categories.forEach(cat => {
        const catTotal = dayEntries.filter(e => e.category === cat).reduce((s, e) => s + e.co2, 0);
        datasets[cat].push(Math.round(catTotal * 10) / 10);
      });
    }

    return { labels, datasets };
  },

  /**
   * Calculate streak from entries
   */
  calculateStreak(entries) {
    if (!entries.length) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const hasEntry = entries.some(e => {
        const ed = new Date(e.date);
        return ed >= d && ed < nextD;
      });

      if (hasEntry) streak++;
      else if (i > 0) break; // gap found
    }

    return streak;
  },

  /**
   * Format CO₂ value for display
   */
  format(kg, decimals = 1) {
    if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
    return `${kg.toFixed(decimals)}kg`;
  },

  /**
   * Calculate percentage vs benchmark
   */
  vsAverage(userKgPerYear, benchmark = 5500) {
    return Math.round(((userKgPerYear - benchmark) / benchmark) * 100);
  },
};

window.Calc = calc;
