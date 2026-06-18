// Data Layer — localStorage persistence and seed data

const DB_KEY = 'carbonTracker_v1';

const DEFAULT_STATE = {
  user: {
    name: 'Eco Warrior',
    avatar: '🌿',
    joinDate: new Date().toISOString(),
    points: 0,
    level: 1,
    streak: 0,
    lastLogDate: null,
  },
  entries: [],
  goals: [],
  badges: [],
  settings: {
    country: 'UK',
    unit: 'kg',
  },
};

// Emission factors (kg CO₂e per unit)
const EMISSION_FACTORS = {
  transport: {
    car_petrol:   0.21,   // per km
    car_diesel:   0.17,   // per km
    car_electric: 0.05,   // per km
    car_hybrid:   0.11,   // per km
    motorcycle:   0.113,  // per km
    bus:          0.089,  // per km
    train:        0.041,  // per km
    subway:       0.028,  // per km
    cycling:      0.00,
    walking:      0.00,
    taxi:         0.149,  // per km
    rideshare:    0.149,  // per km
  },
  flight: {
    short_haul:  0.255,   // per km (< 1500km)
    medium_haul: 0.195,   // per km (1500–4000km)
    long_haul:   0.150,   // per km (> 4000km)
    multiplier:  1.9,     // radiative forcing
  },
  home: {
    electricity: 0.233,   // per kWh (UK grid)
    natural_gas: 0.203,   // per kWh
    heating_oil: 0.298,   // per kWh
    lpg:         0.214,   // per kWh
    wood_pellets:0.035,   // per kWh
    solar:       0.00,
  },
  food: {
    beef:        27.0,    // per kg
    lamb:        24.5,    // per kg
    pork:         7.6,    // per kg
    chicken:      6.9,    // per kg
    fish:         5.4,    // per kg
    dairy:        3.2,    // per kg (avg dairy)
    eggs:         4.8,    // per kg
    vegetables:   2.0,    // per kg
    fruits:       1.1,    // per kg
    legumes:      0.9,    // per kg
    grains:       2.7,    // per kg
    food_waste:   2.5,    // per kg
  },
  shopping: {
    clothing:     20.0,   // per item (avg)
    electronics:  70.0,   // per item (avg)
    furniture:    100.0,  // per item (avg)
    books:         2.5,   // per item
    online_order:  0.8,   // per package (delivery)
  },
};

// National average benchmarks (kg CO₂e per year)
const BENCHMARKS = {
  global_avg: 4000,
  uk_avg:     5500,
  us_avg:    14900,
  eu_avg:     6400,
  low_carbon: 2300,
};

// Resource articles
const RESOURCES = [
  {
    id: 'r1',
    title: 'The Hidden Carbon Cost of Your Diet',
    category: 'Food',
    emoji: '🥦',
    readTime: '5 min',
    description: 'Switching to a plant-rich diet can cut your food footprint by up to 73%.',
    color: '#10B981',
  },
  {
    id: 'r2',
    title: 'EV vs Hybrid: Which Is Greener?',
    category: 'Transport',
    emoji: '⚡',
    readTime: '7 min',
    description: 'A lifecycle analysis comparing EVs, hybrids, and conventional cars.',
    color: '#14B8A6',
  },
  {
    id: 'r3',
    title: 'Home Energy Audit: 10 Quick Wins',
    category: 'Home Energy',
    emoji: '🏠',
    readTime: '4 min',
    description: 'Simple changes that can reduce your home energy use by 30%.',
    color: '#84CC16',
  },
  {
    id: 'r4',
    title: 'The True Cost of Fast Fashion',
    category: 'Shopping',
    emoji: '👗',
    readTime: '6 min',
    description: 'Fashion accounts for 10% of global emissions. Here is what you can do.',
    color: '#F59E0B',
  },
  {
    id: 'r5',
    title: 'Carbon Offsetting: Does It Actually Work?',
    category: 'Climate',
    emoji: '🌳',
    readTime: '8 min',
    description: 'An honest look at carbon offset programs and which ones deliver real impact.',
    color: '#6366F1',
  },
  {
    id: 'r6',
    title: 'Renewable Energy 101',
    category: 'Energy',
    emoji: '☀️',
    readTime: '5 min',
    description: 'Solar, wind, hydro — understanding your clean energy options at home.',
    color: '#EC4899',
  },
];

// Community tips feed
const COMMUNITY_POSTS = [
  { id: 'c1', user: 'GreenCommuter', avatar: '🚲', points: 2340, tip: 'Switched to cycling for my 8km commute — saving 1.7kg CO₂ every day!', likes: 42, time: '2h ago', badge: '🏅' },
  { id: 'c2', user: 'SolarSarah', avatar: '☀️', points: 5120, tip: 'Got solar panels installed last month. My electricity footprint dropped to near zero!', likes: 87, time: '4h ago', badge: '🥇' },
  { id: 'c3', user: 'PlantEater99', avatar: '🥗', points: 1870, tip: 'Going vegetarian 4 days a week saves about 400kg CO₂ per year — tried it for 3 months!', likes: 61, time: '6h ago', badge: '🥈' },
  { id: 'c4', user: 'TrainTraveler', avatar: '🚆', points: 3450, tip: 'Replaced one long-haul flight with a train journey across Europe. Beautiful and 90% fewer emissions!', likes: 55, time: '1d ago', badge: '🏅' },
  { id: 'c5', user: 'ZeroWasteZoe', avatar: '♻️', points: 4200, tip: 'Meal planning cut my food waste by 80%. The composting bin handles the rest!', likes: 73, time: '1d ago', badge: '🥇' },
];

// Badge definitions
const BADGE_DEFINITIONS = [
  { id: 'first_entry',   name: 'First Step',      emoji: '🌱', description: 'Logged your first activity',     condition: (s) => s.entries.length >= 1 },
  { id: 'streak_3',      name: '3-Day Streak',    emoji: '🔥', description: 'Logged activities 3 days in a row', condition: (s) => s.user.streak >= 3 },
  { id: 'streak_7',      name: 'Week Warrior',    emoji: '⚡', description: '7-day logging streak',            condition: (s) => s.user.streak >= 7 },
  { id: 'streak_30',     name: 'Monthly Master',  emoji: '🌟', description: '30-day logging streak',           condition: (s) => s.user.streak >= 30 },
  { id: 'low_transport', name: 'Clean Commuter',  emoji: '🚲', description: 'Transport < 2kg CO₂ in a day',   condition: (s) => checkLowCategory(s, 'transport', 2) },
  { id: 'no_meat',       name: 'Green Plate',     emoji: '🥗', description: 'Log a fully plant-based day',    condition: (s) => checkPlantBasedDay(s) },
  { id: 'goal_set',      name: 'Goal Setter',     emoji: '🎯', description: 'Created your first goal',        condition: (s) => s.goals.length >= 1 },
  { id: 'points_100',    name: 'Century Club',    emoji: '💯', description: 'Earned 100 points',              condition: (s) => s.user.points >= 100 },
  { id: 'points_500',    name: 'Impact Maker',    emoji: '🏅', description: 'Earned 500 points',              condition: (s) => s.user.points >= 500 },
  { id: 'points_1000',   name: 'Eco Champion',    emoji: '🥇', description: 'Earned 1000 points',             condition: (s) => s.user.points >= 1000 },
];

function checkLowCategory(state, category, threshold) {
  const today = new Date().toDateString();
  const todayEntries = state.entries.filter(e => new Date(e.date).toDateString() === today);
  const total = todayEntries.filter(e => e.category === category).reduce((sum, e) => sum + e.co2, 0);
  return todayEntries.length > 0 && total < threshold;
}

function checkPlantBasedDay(state) {
  const today = new Date().toDateString();
  const meatItems = ['beef', 'lamb', 'pork', 'chicken', 'fish'];
  const todayFood = state.entries.filter(e => new Date(e.date).toDateString() === today && e.category === 'food');
  return todayFood.length > 0 && !todayFood.some(e => meatItems.includes(e.subtype));
}

// Simulated leaderboard
const LEADERBOARD = [
  { rank: 1,  name: 'SolarSarah',     avatar: '☀️', points: 5120, co2Saved: 234, badge: '🥇' },
  { rank: 2,  name: 'ZeroWasteZoe',   avatar: '♻️', points: 4200, co2Saved: 198, badge: '🥇' },
  { rank: 3,  name: 'TrainTraveler',  avatar: '🚆', points: 3450, co2Saved: 167, badge: '🥈' },
  { rank: 4,  name: 'GreenCommuter',  avatar: '🚲', points: 2340, co2Saved: 112, badge: '🏅' },
  { rank: 5,  name: 'PlantEater99',   avatar: '🥗', points: 1870, co2Saved: 89,  badge: '🏅' },
  { rank: 6,  name: 'You',            avatar: '🌿', points: 0,    co2Saved: 0,   badge: '', isUser: true },
  { rank: 7,  name: 'EcoNewbie',      avatar: '🌱', points: 0,    co2Saved: 0,   badge: '' },
];

// ─── Data Access Functions ───────────────────────────────────────────────────

function loadState() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return seedDemoData();
    const parsed = JSON.parse(raw);
    const validated = window.Security.validateState(parsed);
    if (!validated) return seedDemoData();
    return validated;
  } catch (e) {
    return seedDemoData();
  }
}

function saveState(state) {
  const validated = window.Security.validateState(state);
  if (validated) {
    localStorage.setItem(DB_KEY, JSON.stringify(validated));
  }
}

function seedDemoData() {
  const state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  state.user.name = 'Eco Warrior';
  state.user.points = 240;
  state.user.streak = 5;
  state.user.level = 3;

  // Seed 30 days of sample entries
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const dayEntries = generateDayEntries(date);
    state.entries.push(...dayEntries);
  }

  // Seed a goal
  state.goals.push({
    id: 'g1',
    title: 'Reduce Transport Emissions',
    target: 20,
    unit: '%',
    category: 'transport',
    deadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    milestones: [
      { week: 1, action: 'Use public transit twice a week', done: true },
      { week: 2, action: 'Cycle to work on Fridays', done: true },
      { week: 3, action: 'Plan one car-free weekend', done: false },
      { week: 4, action: 'Reduce driving by 20%', done: false },
    ],
    createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  });

  state.badges = ['first_entry', 'streak_3', 'goal_set', 'points_100'];

  saveState(state);
  return state;
}

function generateDayEntries(date) {
  const entries = [];
  const rand = (min, max) => Math.random() * (max - min) + min;

  // Transport
  if (Math.random() > 0.3) {
    const km = rand(5, 30);
    entries.push({
      id: `e_${date.getTime()}_t`,
      date: date.toISOString(),
      category: 'transport',
      subtype: Math.random() > 0.4 ? 'car_petrol' : 'train',
      value: km,
      unit: 'km',
      co2: km * (Math.random() > 0.4 ? EMISSION_FACTORS.transport.car_petrol : EMISSION_FACTORS.transport.train),
      label: Math.random() > 0.4 ? `Drove ${Math.round(km)}km` : `Train ${Math.round(km)}km`,
    });
  }

  // Home energy
  const kwh = rand(5, 20);
  entries.push({
    id: `e_${date.getTime()}_h`,
    date: date.toISOString(),
    category: 'home',
    subtype: 'electricity',
    value: kwh,
    unit: 'kWh',
    co2: kwh * EMISSION_FACTORS.home.electricity,
    label: `Electricity ${kwh.toFixed(1)}kWh`,
  });

  // Food
  const mealTypes = ['beef', 'chicken', 'vegetables', 'legumes'];
  const meal = mealTypes[Math.floor(Math.random() * mealTypes.length)];
  const qty = rand(0.2, 0.5);
  entries.push({
    id: `e_${date.getTime()}_f`,
    date: date.toISOString(),
    category: 'food',
    subtype: meal,
    value: qty,
    unit: 'kg',
    co2: qty * EMISSION_FACTORS.food[meal],
    label: `${meal.charAt(0).toUpperCase() + meal.slice(1)} meal`,
  });

  return entries;
}

Object.freeze(EMISSION_FACTORS);
Object.freeze(BENCHMARKS);

window.AppData = {
  loadState,
  saveState,
  EMISSION_FACTORS,
  BENCHMARKS,
  RESOURCES,
  COMMUNITY_POSTS,
  BADGE_DEFINITIONS,
  LEADERBOARD,
};
