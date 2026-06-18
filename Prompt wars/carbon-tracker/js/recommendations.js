// ML-style Recommendation Engine

const RecommendationEngine = {
  /**
   * Analyze user data and generate personalized recommendations
   */
  analyze(state) {
    const entries = state.entries;
    const last30 = window.Calc.lastNDays(entries, 30);
    const byCat = window.Calc.byCategory(last30);
    const total = window.Calc.totalFromEntries(last30);
    const avgDaily = total / 30;

    const recommendations = [];

    // ─── Transport Analysis ───────────────────────────────────────────────
    const transportEntries = last30.filter(e => e.category === 'transport');
    const carEntries = transportEntries.filter(e => e.subtype?.includes('car'));
    const carKm = carEntries.reduce((s, e) => s + e.value, 0);
    const trainEntries = transportEntries.filter(e => e.subtype === 'train');
    const cycleEntries = transportEntries.filter(e => e.subtype === 'cycling');

    if (byCat.transport > 60 && carKm > 200) {
      const savings = byCat.transport * 0.35;
      recommendations.push({
        id: 'r_transport_shift',
        category: 'transport',
        priority: 'high',
        title: 'Switch to Public Transit',
        description: `You drove ${Math.round(carKm)}km this month. Replacing just 3 car trips per week with public transit could save approximately ${window.Calc.format(savings)} CO₂ per month.`,
        impact: savings,
        impactLabel: `−${window.Calc.format(savings)}/month`,
        actions: [
          'Take the bus or train for commutes under 15km',
          'Park at the nearest station and ride-share the rest',
          'Use a journey planner app to find the greenest route',
        ],
        icon: '🚌',
        color: '#14B8A6',
      });
    }

    if (carKm > 100 && cycleEntries.length === 0) {
      recommendations.push({
        id: 'r_cycling',
        category: 'transport',
        priority: 'medium',
        title: 'Start Cycling',
        description: 'Your data shows no cycling activity this month. Even cycling 2 days a week for short trips can save ~8kg CO₂ and improve your health.',
        impact: 8,
        impactLabel: '−8kg/month',
        actions: [
          'Cycle for trips under 5km instead of driving',
          'Rent a city bike for exploring on weekends',
          'Join a cycling commuter group for motivation',
        ],
        icon: '🚲',
        color: '#84CC16',
      });
    }

    // ─── Food Analysis ────────────────────────────────────────────────────
    const foodEntries = last30.filter(e => e.category === 'food');
    const meatEntries = foodEntries.filter(e => ['beef', 'lamb'].includes(e.subtype));
    const meatCO2 = meatEntries.reduce((s, e) => s + e.co2, 0);

    if (meatCO2 > 20) {
      const savings = meatCO2 * 0.6;
      recommendations.push({
        id: 'r_diet',
        category: 'food',
        priority: 'high',
        title: 'Reduce Red Meat Consumption',
        description: `Red meat accounts for ${window.Calc.format(meatCO2)} of your food emissions this month. Swapping beef for chicken or plant-based proteins 3x/week could save ${window.Calc.format(savings)}.`,
        impact: savings,
        impactLabel: `−${window.Calc.format(savings)}/month`,
        actions: [
          'Try "Meatless Monday" — skip meat once a week',
          'Replace beef with chicken (4× lower emissions)',
          'Explore plant-based protein alternatives like lentils and tofu',
          'Reduce portion sizes of meat-heavy meals',
        ],
        icon: '🥗',
        color: '#10B981',
      });
    }

    // ─── Home Energy Analysis ─────────────────────────────────────────────
    const homeEntries = last30.filter(e => e.category === 'home');
    const electricityKwh = homeEntries.filter(e => e.subtype === 'electricity').reduce((s, e) => s + e.value, 0);

    if (byCat.home > 40) {
      const savings = byCat.home * 0.25;
      recommendations.push({
        id: 'r_home_energy',
        category: 'home',
        priority: 'medium',
        title: 'Optimize Home Energy Usage',
        description: `Your home energy use is ${window.Calc.format(byCat.home)} this month (${Math.round(electricityKwh)}kWh electricity). Smart thermostat and LED upgrades could cut this by 25%.`,
        impact: savings,
        impactLabel: `−${window.Calc.format(savings)}/month`,
        actions: [
          'Install a smart thermostat to optimize heating schedules',
          'Switch to LED bulbs throughout your home',
          'Unplug devices and chargers when not in use',
          'Wash clothes at 30°C instead of 60°C',
          'Consider a renewable energy tariff from your supplier',
        ],
        icon: '💡',
        color: '#F59E0B',
      });
    }

    // ─── Flight Analysis ──────────────────────────────────────────────────
    const flightEntries = last30.filter(e => e.category === 'flight');
    const flightCO2 = flightEntries.reduce((s, e) => s + e.co2, 0);

    if (flightCO2 > 100) {
      recommendations.push({
        id: 'r_flights',
        category: 'flight',
        priority: 'high',
        title: 'Reduce Air Travel',
        description: `Air travel is your biggest single-event emitter at ${window.Calc.format(flightCO2)}. Consider trains for shorter routes and video conferencing for business travel.`,
        impact: flightCO2 * 0.5,
        impactLabel: `−${window.Calc.format(flightCO2 * 0.5)}/trip`,
        actions: [
          'Take the train instead of flying for routes under 500km',
          'Choose direct flights to avoid extra landing/takeoff emissions',
          'Replace one holiday flight with a local staycation',
          'Use video calls for business meetings when possible',
        ],
        icon: '✈️',
        color: '#6366F1',
      });
    }

    // ─── Positive Reinforcement ───────────────────────────────────────────
    if (trainEntries.length > 5) {
      recommendations.push({
        id: 'r_positive_train',
        category: 'transport',
        priority: 'low',
        title: 'Great Work on Public Transit! 🎉',
        description: `You used public transit ${trainEntries.length} times this month — excellent habit! Keep it up and consider transitioning your remaining car journeys too.`,
        impact: 0,
        impactLabel: 'Keep it up!',
        actions: [
          'Challenge a friend to also switch to public transit',
          'Track your cumulative savings in the Progress tab',
          'Share your achievement in the Community tab',
        ],
        icon: '🌟',
        color: '#10B981',
        positive: true,
      });
    }

    // ─── Overall Carbon Score ─────────────────────────────────────────────
    const yearlyProjection = avgDaily * 365;
    const benchmark = window.AppData.BENCHMARKS.uk_avg;
    const vsAvg = window.Calc.vsAverage(yearlyProjection, benchmark);

    return {
      recommendations: recommendations.sort((a, b) => {
        const priority = { high: 0, medium: 1, low: 2 };
        return priority[a.priority] - priority[b.priority];
      }),
      summary: {
        totalLast30: total,
        avgDaily,
        yearlyProjection,
        benchmark,
        vsAvg,
        score: calculateScore(avgDaily),
        topCategory: Object.entries(byCat).sort((a, b) => b[1] - a[1])[0],
      },
    };
  },
};

function calculateScore(avgDailyKg) {
  // Score 0-100 based on daily emissions
  // 0 = 20+ kg/day, 100 = 0 kg/day
  const maxKg = 20;
  const score = Math.max(0, Math.min(100, Math.round((1 - avgDailyKg / maxKg) * 100)));
  let label, color;
  if (score >= 80) { label = 'Excellent'; color = '#10B981'; }
  else if (score >= 60) { label = 'Good'; color = '#84CC16'; }
  else if (score >= 40) { label = 'Average'; color = '#F59E0B'; }
  else if (score >= 20) { label = 'Below Avg'; color = '#EF4444'; }
  else { label = 'High Impact'; color = '#DC2626'; }
  return { value: score, label, color };
}

window.RecommendationEngine = RecommendationEngine;
