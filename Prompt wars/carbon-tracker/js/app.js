// ═══════════════════════════════════════════════════════════════════════════
// Carbon Tracker — Main Application Controller
// ═══════════════════════════════════════════════════════════════════════════

let state;
const esc = (v) => Security.escapeHtml(v);

// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  state = window.AppData.loadState();
  updateUserInSidebar();
  navigateTo('dashboard');
  setupEventListeners();
});

// ─── Navigation ──────────────────────────────────────────────────────────────
function navigateTo(page) {
  // Whitelist page names
  if (!Security.isValidPage(page)) return;

  // Hide all pages
  document.querySelectorAll('.page-view').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Show selected page
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');

  const navEl = document.querySelector(`[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');

  // Update header
  const titles = {
    dashboard:       { title: 'Dashboard',        subtitle: 'Your carbon journey at a glance' },
    tracker:         { title: 'Activity Tracker',  subtitle: 'Log your daily activities' },
    insights:        { title: 'Insights & Tips',   subtitle: 'AI-powered personalized recommendations' },
    'action-plan':   { title: 'Action Plan',       subtitle: 'Set goals and track milestones' },
    progress:        { title: 'Progress & Analytics', subtitle: 'Visualize your impact over time' },
    gamification:    { title: 'Achievements',      subtitle: 'Badges, points, and leaderboard' },
    community:       { title: 'Community',         subtitle: 'Share and learn with others' },
    education:       { title: 'Learn',             subtitle: 'Resources for sustainable living' },
  };

  const info = titles[page] || { title: page, subtitle: '' };
  document.getElementById('page-title').textContent = info.title;
  document.getElementById('page-subtitle').textContent = info.subtitle;

  // Render page content
  switch (page) {
    case 'dashboard':    renderDashboard(); break;
    case 'tracker':      renderTracker(); break;
    case 'insights':     renderInsights(); break;
    case 'action-plan':  renderActionPlan(); break;
    case 'progress':     renderProgress(); break;
    case 'gamification': renderGamification(); break;
    case 'community':    renderCommunity(); break;
    case 'education':    renderEducation(); break;
  }

  // Close mobile nav
  closeMobileNav();

  window.currentPage = page;
}

// ─── Event Listeners ─────────────────────────────────────────────────────────
function setupEventListeners() {
  // Navigation clicks
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.page));
  });

  // Mobile nav toggle
  document.getElementById('mobile-menu-btn')?.addEventListener('click', toggleMobileNav);
  document.getElementById('mobile-nav-backdrop')?.addEventListener('click', closeMobileNav);

  // FAB - quick log
  document.getElementById('fab-log')?.addEventListener('click', () => navigateTo('tracker'));

  // Theme / settings (placeholder)
  document.getElementById('settings-btn')?.addEventListener('click', () => showToast('Settings', 'Coming soon!', '⚙️'));
}

// ─── Mobile Nav ───────────────────────────────────────────────────────────────
function toggleMobileNav() {
  document.querySelector('.sidebar').classList.toggle('mobile-open');
  document.getElementById('mobile-nav-backdrop').classList.toggle('visible');
}

function closeMobileNav() {
  document.querySelector('.sidebar').classList.remove('mobile-open');
  document.getElementById('mobile-nav-backdrop').classList.remove('visible');
}

// ─── Update Sidebar User ──────────────────────────────────────────────────────
function updateUserInSidebar() {
  const lvlInfo = window.Gamification.getLevelInfo(state.user.level);
  document.getElementById('sidebar-user-name').textContent = state.user.name;
  document.getElementById('sidebar-user-level').textContent = `${lvlInfo.emoji} ${lvlInfo.name} · Lv.${state.user.level}`;
  document.getElementById('sidebar-user-avatar').textContent = state.user.avatar;

  // Update leaderboard user row
  window.AppData.LEADERBOARD[5].points = state.user.points;
  window.AppData.LEADERBOARD[5].name   = state.user.name;
  // Sort and re-rank
  const lb = window.AppData.LEADERBOARD.filter(r => !r.isUser);
  const user = window.AppData.LEADERBOARD.find(r => r.isUser);
  lb.sort((a, b) => b.points - a.points);
  const userRank = lb.findIndex(r => r.points < user.points);
  user.rank = userRank === -1 ? lb.length + 1 : userRank + 1;
}

// ─── Toast Notifications ──────────────────────────────────────────────────────
function showToast(title, body, icon = '✅', duration = 3500) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span class="toast-icon">${esc(icon)}</span>
    <div>
      <div class="toast-title">${esc(title)}</div>
      ${body ? `<div class="toast-body">${esc(body)}</div>` : ''}
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('exiting');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function showPointsPopup(points, el) {
  const popup = document.createElement('div');
  popup.className = 'points-popup';
  popup.textContent = `+${points} pts`;
  const rect = el ? el.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2 };
  popup.style.left = `${rect.left}px`;
  popup.style.top  = `${rect.top - 10}px`;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 2000);
}

// ─── Counter Animation ────────────────────────────────────────────────────────
function animateCounter(el, from, to, duration = 800, decimals = 1) {
  const start = performance.now();
  const update = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    const val = from + (to - from) * ease;
    el.textContent = decimals === 0 ? Math.round(val) : val.toFixed(decimals);
    if (t < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function renderDashboard() {
  const today = window.Calc.todayEntries(state.entries);
  const last7 = window.Calc.lastNDays(state.entries, 7);
  const last30 = window.Calc.lastNDays(state.entries, 30);

  const todayCO2  = window.Calc.totalFromEntries(today);
  const weekCO2   = window.Calc.totalFromEntries(last7);
  const monthCO2  = window.Calc.totalFromEntries(last30);
  const streak    = window.Calc.calculateStreak(state.entries);
  const byCat     = window.Calc.byCategory(last30);
  const analysis  = window.RecommendationEngine.analyze(state);
  const score     = analysis.summary.score;
  const lvlInfo   = window.Gamification.getLevelInfo(state.user.level);
  const lvlPct    = window.Gamification.getLevelProgress(state.user.points, state.user.level);

  const container = document.getElementById('page-dashboard');
  container.innerHTML = `
    <!-- Hero -->
    <div class="dashboard-hero flex items-center justify-between gap-6 mb-6" style="flex-wrap: wrap;">
      <div>
        <div class="hero-greeting">Good ${getTimeOfDay()}, ${esc(state.user.name.split(' ')[0])}!</div>
        <h1 class="hero-title">
          Your Carbon<br><span class="glow-text">Footprint Dashboard</span>
        </h1>
        <p class="hero-subtitle">Track, understand, and reduce your environmental impact every day.</p>
        <div class="flex gap-3 mt-4" style="flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="navigateTo('tracker')">
            ➕ Log Activity
          </button>
          <button class="btn btn-secondary" onclick="navigateTo('insights')">
            🔍 View Insights
          </button>
        </div>
      </div>
      <div class="eco-score-ring">
        <canvas id="gauge-chart" width="120" height="120"></canvas>
        <div class="eco-score-label">
          <span class="eco-score-value" style="color:${score.color}" id="gauge-val">0</span>
          <span class="eco-score-text">${score.label}</span>
        </div>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid-4 mb-6">
      <div class="stat-card cat-transport">
        <div class="stat-icon" style="background: rgba(20,184,166,0.15);">📅</div>
        <div>
          <div class="stat-label">Today</div>
          <div class="stat-value" id="stat-today">0</div>
          <div class="stat-delta neutral">kg CO₂e logged</div>
        </div>
      </div>
      <div class="stat-card cat-food">
        <div class="stat-icon" style="background: rgba(16,185,129,0.15);">📊</div>
        <div>
          <div class="stat-label">This Week</div>
          <div class="stat-value" id="stat-week">0</div>
          <div class="stat-delta ${weekCO2 < 35 ? 'positive' : 'negative'}">
            ${weekCO2 < 35 ? '↓ Below average' : '↑ Above average'}
          </div>
        </div>
      </div>
      <div class="stat-card cat-home">
        <div class="stat-icon" style="background: rgba(245,158,11,0.15);">📈</div>
        <div>
          <div class="stat-label">This Month</div>
          <div class="stat-value" id="stat-month">0</div>
          <div class="stat-delta neutral">kg CO₂e total</div>
        </div>
      </div>
      <div class="stat-card cat-flight">
        <div class="stat-icon" style="background: rgba(99,102,241,0.15);">🔥</div>
        <div>
          <div class="stat-label">Streak</div>
          <div class="stat-value" id="stat-streak">0</div>
          <div class="stat-delta positive">days logging</div>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid-2 mb-6" style="grid-template-columns: 1fr 1.6fr;">
      <!-- Donut -->
      <div class="card">
        <div class="section-title">By Category</div>
        <div class="chart-container" style="height: 260px;">
          <canvas id="donut-chart"></canvas>
        </div>
      </div>
      <!-- Trend Line -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <div class="section-title" style="margin-bottom:0;">30-Day Trend</div>
          <div class="flex gap-2">
            <span class="badge badge-success">↓ ${Math.abs(score.value)}% eco score</span>
          </div>
        </div>
        <div class="chart-container" style="height: 240px;">
          <canvas id="trend-chart"></canvas>
        </div>
      </div>
    </div>

    <!-- Bottom Row -->
    <div class="grid-2">
      <!-- Recent Activity -->
      <div class="card">
        <div class="section-title">Recent Activity</div>
        <div id="recent-activity">
          ${renderRecentActivity(state.entries)}
        </div>
        ${state.entries.length === 0 ? `
          <div class="empty-state" style="padding: 32px;">
            <div class="empty-state-icon">📝</div>
            <div class="empty-state-title">No entries yet</div>
            <div class="empty-state-desc">Start logging your daily activities!</div>
          </div>
        ` : ''}
      </div>

      <!-- Level & Quick Stats -->
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Level Card -->
        <div class="level-card">
          <div class="level-header">
            <div class="level-badge-big">${lvlInfo.emoji}</div>
            <div>
              <div class="level-name">${esc(lvlInfo.name)}</div>
              <div class="level-number">Level ${Number(state.user.level)} · ${Number(state.user.points)} points</div>
            </div>
          </div>
          <div class="flex items-center justify-between mb-2">
            <span style="font-size:12px; color: var(--text-muted);">Progress to next level</span>
            <span style="font-size:12px; color: var(--clr-primary); font-weight: 600;">${lvlPct}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${lvlPct}%"></div>
          </div>
        </div>

        <!-- Top Insight Card -->
        ${renderTopInsightCard(analysis)}

        <!-- Quick Benchmark -->
        <div class="card" style="padding: 16px;">
          <div style="font-size: 13px; font-weight: 700; margin-bottom: 12px;">vs. Global Benchmarks</div>
          <div class="comparison-bar-wrapper">
            ${renderBenchmarkBars(analysis.summary.yearlyProjection)}
          </div>
        </div>
      </div>
    </div>
  `;

  // Animate counters
  setTimeout(() => {
    const todayEl  = document.getElementById('stat-today');
    const weekEl   = document.getElementById('stat-week');
    const monthEl  = document.getElementById('stat-month');
    const streakEl = document.getElementById('stat-streak');
    if (todayEl)  animateCounter(todayEl,  0, todayCO2, 800);
    if (weekEl)   animateCounter(weekEl,   0, weekCO2,  900);
    if (monthEl)  animateCounter(monthEl,  0, monthCO2, 1000);
    if (streakEl) animateCounter(streakEl, 0, streak,   700, 0);
    const gaugeEl = document.getElementById('gauge-val');
    if (gaugeEl)  animateCounter(gaugeEl,  0, score.value, 1200, 0);
  }, 50);

  // Render charts
  setTimeout(() => {
    window.Charts.renderGauge('gauge-chart', { value: score.value, color: score.color });
    window.Charts.renderDonut('donut-chart', byCat);
    window.Charts.renderTrendLine('trend-chart', state.entries, 30);
  }, 100);
}

function renderRecentActivity(entries) {
  const recent = [...entries].reverse().slice(0, 6);
  if (!recent.length) return '';
  const catIcons = { transport: '🚗', flight: '✈️', home: '🏠', food: '🥗', shopping: '🛍️' };
  const catColors = { transport: 'rgba(20,184,166,0.15)', flight: 'rgba(99,102,241,0.15)', home: 'rgba(245,158,11,0.15)', food: 'rgba(16,185,129,0.15)', shopping: 'rgba(236,72,153,0.15)' };
  const catTextColors = { transport: '#2DD4BF', flight: '#818CF8', home: '#FCD34D', food: '#34D399', shopping: '#F472B6' };

  return recent.map(e => `
    <div class="activity-item">
      <div class="activity-icon" style="background: ${catColors[e.category] || 'rgba(255,255,255,0.05)'};">
        ${catIcons[e.category] || '📊'}
      </div>
      <div class="activity-meta">
        <div class="activity-label">${esc(e.label || e.subtype)}</div>
        <div class="activity-time">${formatTimeAgo(e.date)}</div>
      </div>
      <div class="activity-co2" style="color: ${catTextColors[e.category] || 'var(--text-primary)'};">
        ${window.Calc.format(e.co2)}
      </div>
    </div>
  `).join('');
}

function renderTopInsightCard(analysis) {
  const top = analysis.recommendations[0];
  if (!top) return '';
  return `
    <div class="card" style="padding: 16px; border-color: rgba(16,185,129,0.2); background: rgba(16,185,129,0.04);">
      <div style="font-size: 12px; font-weight: 700; color: var(--clr-primary); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">
        💡 Top Tip
      </div>
      <div style="font-size: 13px; font-weight: 700; margin-bottom: 6px;">${esc(top.title)}</div>
      <div style="font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-bottom: 10px;">
        ${esc(top.description.substring(0, 120))}...
      </div>
      <button class="btn btn-secondary btn-sm" onclick="navigateTo('insights')">View All Tips →</button>
    </div>
  `;
}

function renderBenchmarkBars(userYearly) {
  const bmarks = [
    { label: 'You',        value: userYearly, color: '#10B981' },
    { label: 'UK Avg',     value: 5500,       color: '#F59E0B' },
    { label: 'Global Avg', value: 4000,       color: '#6366F1' },
    { label: 'US Avg',     value: 14900,      color: '#EF4444' },
  ];
  const max = Math.max(...bmarks.map(b => b.value));
  return bmarks.map(b => `
    <div class="comparison-bar-item">
      <div class="comparison-bar-label">${b.label}</div>
      <div class="comparison-bar-track">
        <div class="comparison-bar-fill" style="width: ${Math.round((b.value / max) * 100)}%; background: ${b.color};"></div>
      </div>
      <div class="comparison-bar-value" style="color: ${b.color};">${Math.round(b.value / 1000 * 10) / 10}t</div>
    </div>
  `).join('');
}

// ─── TRACKER ─────────────────────────────────────────────────────────────────
let trackerState = {
  category: 'transport',
  subtype: 'car_petrol',
  value: 0,
  unit: 'km',
};

const TRACKER_OPTIONS = {
  transport: [
    { id: 'car_petrol',   label: 'Petrol Car',    icon: '🚗', unit: 'km' },
    { id: 'car_diesel',   label: 'Diesel Car',    icon: '🚙', unit: 'km' },
    { id: 'car_electric', label: 'Electric Car',  icon: '⚡', unit: 'km' },
    { id: 'car_hybrid',   label: 'Hybrid Car',    icon: '🔋', unit: 'km' },
    { id: 'motorcycle',   label: 'Motorcycle',    icon: '🏍️', unit: 'km' },
    { id: 'bus',          label: 'Bus',           icon: '🚌', unit: 'km' },
    { id: 'train',        label: 'Train',         icon: '🚆', unit: 'km' },
    { id: 'subway',       label: 'Subway/Metro',  icon: '🚇', unit: 'km' },
    { id: 'taxi',         label: 'Taxi',          icon: '🚕', unit: 'km' },
    { id: 'cycling',      label: 'Cycling',       icon: '🚲', unit: 'km' },
    { id: 'walking',      label: 'Walking',       icon: '🚶', unit: 'km' },
  ],
  home: [
    { id: 'electricity',  label: 'Electricity',   icon: '💡', unit: 'kWh' },
    { id: 'natural_gas',  label: 'Natural Gas',   icon: '🔥', unit: 'kWh' },
    { id: 'heating_oil',  label: 'Heating Oil',   icon: '🛢️', unit: 'kWh' },
    { id: 'lpg',          label: 'LPG',           icon: '⛽', unit: 'kWh' },
    { id: 'wood_pellets', label: 'Wood Pellets',  icon: '🪵', unit: 'kWh' },
    { id: 'solar',        label: 'Solar',         icon: '☀️', unit: 'kWh' },
  ],
  food: [
    { id: 'beef',         label: 'Beef',          icon: '🥩', unit: 'kg' },
    { id: 'lamb',         label: 'Lamb',          icon: '🐑', unit: 'kg' },
    { id: 'pork',         label: 'Pork',          icon: '🐷', unit: 'kg' },
    { id: 'chicken',      label: 'Chicken',       icon: '🍗', unit: 'kg' },
    { id: 'fish',         label: 'Fish/Seafood',  icon: '🐟', unit: 'kg' },
    { id: 'dairy',        label: 'Dairy',         icon: '🥛', unit: 'kg' },
    { id: 'eggs',         label: 'Eggs',          icon: '🥚', unit: 'kg' },
    { id: 'vegetables',   label: 'Vegetables',    icon: '🥦', unit: 'kg' },
    { id: 'fruits',       label: 'Fruits',        icon: '🍎', unit: 'kg' },
    { id: 'legumes',      label: 'Legumes',       icon: '🫘', unit: 'kg' },
    { id: 'food_waste',   label: 'Food Waste',    icon: '🗑️', unit: 'kg' },
  ],
  flight: [
    { id: 'flight',       label: 'Flight',        icon: '✈️', unit: 'km' },
  ],
  shopping: [
    { id: 'clothing',     label: 'Clothing',      icon: '👕', unit: 'item' },
    { id: 'electronics',  label: 'Electronics',   icon: '📱', unit: 'item' },
    { id: 'furniture',    label: 'Furniture',     icon: '🛋️', unit: 'item' },
    { id: 'books',        label: 'Books',         icon: '📚', unit: 'item' },
    { id: 'online_order', label: 'Online Order',  icon: '📦', unit: 'package' },
  ],
};

function renderTracker() {
  const page = document.getElementById('page-tracker');
  page.innerHTML = `
    <div class="flex gap-6" style="align-items: flex-start; flex-wrap: wrap;">
      <!-- Left: Form -->
      <div style="flex: 2; min-width: 300px;">
        <div class="section-title mb-4">What did you do today?</div>

        <!-- Category Tabs -->
        <div class="tracker-tabs mb-5">
          ${[
            { id: 'transport', label: 'Transport', icon: '🚗' },
            { id: 'home',      label: 'Home Energy', icon: '🏠' },
            { id: 'food',      label: 'Food',     icon: '🥗' },
            { id: 'flight',    label: 'Flight',   icon: '✈️' },
            { id: 'shopping',  label: 'Shopping', icon: '🛍️' },
          ].map(t => `
            <button class="tracker-tab cat-${t.id} ${trackerState.category === t.id ? 'active' : ''}"
              onclick="switchTrackerCategory('${t.id}')">
              ${t.icon} ${t.label}
            </button>
          `).join('')}
        </div>

        <!-- Options Grid -->
        <div class="tracker-form" id="tracker-form-wrapper">
          ${renderTrackerForm()}
        </div>
      </div>

      <!-- Right: Recent Log -->
      <div style="flex: 1; min-width: 260px;">
        <div class="section-title">Today's Log</div>
        <div id="today-log" class="card" style="max-height: 600px; overflow-y: auto;">
          ${renderTodayLog()}
        </div>
        <div class="mt-4">
          ${renderWeeklyTotals()}
        </div>
      </div>
    </div>
  `;
}

function renderTrackerForm() {
  const cat = trackerState.category;
  const options = TRACKER_OPTIONS[cat] || [];

  return `
    <div>
      <div style="font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.06em;">
        Select Type
      </div>
      <div class="tracker-option-grid">
        ${options.map(opt => `
          <div class="tracker-option ${trackerState.subtype === opt.id ? 'selected' : ''}"
            onclick="selectTrackerSubtype('${opt.id}', '${opt.unit}')">
            <span class="tracker-option-icon">${opt.icon}</span>
            <span>${opt.label}</span>
          </div>
        `).join('')}
      </div>

      <!-- Amount Input -->
      <div class="flex gap-4 mt-5" style="flex-wrap: wrap;">
        <div class="form-group" style="flex: 1; min-width: 160px;">
          <label class="form-label">Amount</label>
          <input class="form-input" type="number" id="tracker-value" min="0" step="0.1"
            value="${trackerState.value || ''}" placeholder="0"
            oninput="updateCO2Preview(this.value)"
            style="font-size: 18px; font-weight: 700;">
        </div>
        <div class="form-group" style="width: 100px; flex-shrink: 0;">
          <label class="form-label">Unit</label>
          <input class="form-input" id="tracker-unit" value="${trackerState.unit}" readonly
            style="color: var(--text-muted); cursor: not-allowed;">
        </div>
        <div class="form-group" style="flex: 1; min-width: 160px;">
          <label class="form-label">Date</label>
          <input class="form-input" type="date" id="tracker-date"
            value="${new Date().toISOString().split('T')[0]}" max="${new Date().toISOString().split('T')[0]}">
        </div>
      </div>

      <div class="form-group mt-4">
        <label class="form-label">Note (optional)</label>
        <input class="form-input" type="text" id="tracker-note" maxlength="200" placeholder="e.g. Commute to work, dinner with family...">
      </div>

      <!-- CO2 Preview -->
      <div class="co2-preview mt-4" id="co2-preview">
        <span class="co2-preview-label">Estimated CO₂e:</span>
        <span class="co2-preview-value" id="co2-preview-value">0.0</span>
        <span class="co2-preview-unit">kg</span>
        <span id="co2-equivalence" style="margin-left: auto; font-size: 12px; color: var(--text-muted);"></span>
      </div>

      <div class="flex gap-3 mt-5">
        <button class="btn btn-primary btn-lg" onclick="submitTrackerEntry()" style="flex: 1;">
          ➕ Log Activity
        </button>
        <button class="btn btn-ghost" onclick="resetTrackerForm()">Reset</button>
      </div>
    </div>
  `;
}

function switchTrackerCategory(cat) {
  if (!Security.isValidCategory(cat)) return;
  trackerState.category = cat;
  const firstOption = TRACKER_OPTIONS[cat]?.[0];
  if (firstOption) {
    trackerState.subtype = firstOption.id;
    trackerState.unit    = firstOption.unit;
  }
  trackerState.value = 0;
  renderTracker();
}

function selectTrackerSubtype(subtype, unit) {
  // Validate subtype against current category whitelist
  if (!Security.isValidSubtype(trackerState.category, subtype)) return;
  trackerState.subtype = subtype;
  trackerState.unit    = Security.validateStringInput(unit, 20, 'unit');
  document.querySelectorAll('.tracker-option').forEach(el => el.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  const unitEl = document.getElementById('tracker-unit');
  if (unitEl) unitEl.value = unit;
  updateCO2Preview(document.getElementById('tracker-value')?.value || 0);
}

function updateCO2Preview(value) {
  trackerState.value = parseFloat(value) || 0;
  const cat     = trackerState.category;
  const subtype = trackerState.subtype;
  const v       = trackerState.value;

  let co2;
  if (cat === 'flight') {
    co2 = window.Calc.calculate('flight', 'flight', v);
  } else {
    co2 = window.Calc.calculate(cat, subtype, v);
  }

  const previewEl = document.getElementById('co2-preview-value');
  if (previewEl) previewEl.textContent = co2.toFixed(2);

  // Equivalence
  const eqEl = document.getElementById('co2-equivalence');
  if (eqEl) {
    if (co2 > 0) {
      const trees = Math.round(co2 / 21 * 10) / 10;
      const km    = Math.round(co2 / 0.21);
      eqEl.textContent = co2 > 5 ? `≈ ${trees} tree-days to absorb` : `≈ ${km}km petrol car equiv.`;
    } else {
      eqEl.textContent = '';
    }
  }
}

function submitTrackerEntry() {
  const rawVal = document.getElementById('tracker-value')?.value;
  const v     = Security.validateNumericInput(parseFloat(rawVal), 0.01, 100000, 0);
  const date  = document.getElementById('tracker-date')?.value;
  const rawNote = document.getElementById('tracker-note')?.value;
  const note  = Security.validateStringInput(rawNote, 200, '');
  const cat   = trackerState.category;
  const sub   = trackerState.subtype;

  // Validate amount
  if (v <= 0) {
    showToast('Oops!', 'Please enter an amount greater than 0.', '⚠️');
    return;
  }

  // Validate category and subtype
  if (!Security.isValidCategory(cat)) {
    showToast('Error', 'Invalid category selected.', '⚠️');
    return;
  }
  if (cat !== 'flight' && !Security.isValidSubtype(cat, sub)) {
    showToast('Error', 'Invalid activity type selected.', '⚠️');
    return;
  }

  // Validate date
  if (date) {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      showToast('Error', 'Invalid date entered.', '⚠️');
      return;
    }
  }

  const co2 = cat === 'flight'
    ? window.Calc.calculate('flight', 'flight', v)
    : window.Calc.calculate(cat, sub, v);

  const opt  = TRACKER_OPTIONS[cat]?.find(o => o.id === sub);
  const label = note || (opt ? `${opt.icon} ${opt.label} \u00b7 ${v}${trackerState.unit}` : sub);

  const entry = {
    id:       `e_${Date.now()}`,
    date:     date ? new Date(date).toISOString() : new Date().toISOString(),
    category: cat,
    subtype:  sub,
    value:    v,
    unit:     trackerState.unit,
    co2,
    label,
  };

  // Update state
  const result = window.Store.addEntry(state, entry);
  state = result.state;
  window.AppData.saveState(state);
  updateUserInSidebar();

  // Show feedback
  showToast('Logged!', `${window.Calc.format(co2)} CO\u2082e recorded`, '✅');
  showPointsPopup(result.pointsEarned, document.querySelector('.btn-primary'));

  if (result.newBadges.length > 0) {
    setTimeout(() => {
      showToast(`Badge Earned: ${result.newBadges[0].name}!`, result.newBadges[0].description, result.newBadges[0].emoji, 5000);
    }, 1000);
  }

  // Update today log and reset
  resetTrackerForm();
  const todayLogEl = document.getElementById('today-log');
  if (todayLogEl) todayLogEl.innerHTML = renderTodayLog();
}

function resetTrackerForm() {
  trackerState.value = 0;
  const form = document.getElementById('tracker-form-wrapper');
  if (form) form.innerHTML = renderTrackerForm();
}

function renderTodayLog() {
  const today = window.Calc.todayEntries(state.entries);
  if (!today.length) {
    return `
      <div class="empty-state" style="padding: 32px 16px;">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-title">Nothing logged today</div>
        <div class="empty-state-desc">Add your first activity using the form!</div>
      </div>
    `;
  }

  const total = window.Calc.totalFromEntries(today);
  const catIcons = { transport: '🚗', flight: '✈️', home: '🏠', food: '🥗', shopping: '🛍️' };

  return `
    <div style="padding: 16px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 13px; font-weight: 600; color: var(--text-muted);">${today.length} entries</span>
      <span style="font-family: var(--font-display); font-size: 18px; font-weight: 800; color: var(--clr-primary);">
        ${window.Calc.format(total)} total
      </span>
    </div>
    ${today.reverse().map(e => `
      <div class="activity-item" style="padding: 12px 16px;">
        <div style="font-size: 20px;">${catIcons[e.category] || '📊'}</div>
        <div class="activity-meta">
          <div class="activity-label" style="font-size: 13px;">${esc(e.label)}</div>
          <span class="cat-pill cat-pill-${e.category}">${e.category}</span>
        </div>
        <div style="text-align: right;">
          <div style="font-family: var(--font-display); font-size: 14px; font-weight: 700; color: var(--text-primary);">
            ${window.Calc.format(e.co2)}
          </div>
          <button onclick="deleteEntry('${Security.isValidId(e.id) ? e.id : ''}')" style="font-size: 11px; color: var(--text-muted); background: none; border: none; cursor: pointer; margin-top: 2px;">
            ✕ delete
          </button>
        </div>
      </div>
    `).join('')}
  `;
}

function renderWeeklyTotals() {
  const last7  = window.Calc.lastNDays(state.entries, 7);
  const byCat  = window.Calc.byCategory(last7);
  const total  = window.Calc.totalFromEntries(last7);
  const catColors = { transport: '#2DD4BF', flight: '#818CF8', home: '#FCD34D', food: '#34D399', shopping: '#F472B6' };
  const catIcons  = { transport: '🚗', flight: '✈️', home: '🏠', food: '🥗', shopping: '🛍️' };

  return `
    <div class="card" style="padding: 16px;">
      <div style="font-size: 13px; font-weight: 700; margin-bottom: 12px;">This Week's Breakdown</div>
      ${Object.entries(byCat).map(([cat, val]) => `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span>${catIcons[cat]}</span>
          <span style="font-size: 12px; flex: 1;">${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
          <div style="width: 80px; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
            <div style="width: ${total > 0 ? Math.round((val / total) * 100) : 0}%; height: 100%; background: ${catColors[cat]}; border-radius: 3px;"></div>
          </div>
          <span style="font-size: 12px; font-weight: 700; color: ${catColors[cat]}; width: 50px; text-align: right;">
            ${window.Calc.format(val)}
          </span>
        </div>
      `).join('')}
      <div style="border-top: 1px solid var(--border-subtle); margin-top: 8px; padding-top: 8px; display: flex; justify-content: space-between;">
        <span style="font-size: 12px; color: var(--text-muted);">Total this week</span>
        <span style="font-family: var(--font-display); font-size: 16px; font-weight: 800; color: var(--clr-primary);">
          ${window.Calc.format(total)}
        </span>
      </div>
    </div>
  `;
}

function deleteEntry(id) {
  if (!Security.isValidId(id)) return;
  const result = window.Store.deleteEntry(state, id);
  state = result.state;
  window.AppData.saveState(state);
  const todayLogEl = document.getElementById('today-log');
  if (todayLogEl) todayLogEl.innerHTML = renderTodayLog();
  showToast('Deleted', 'Entry removed from your log.', '🗑️', 2500);
}

// ─── INSIGHTS ────────────────────────────────────────────────────────────────
function renderInsights() {
  const analysis = window.RecommendationEngine.analyze(state);
  const { recommendations, summary } = analysis;
  const score = summary.score;

  const page = document.getElementById('page-insights');
  page.innerHTML = `
    <!-- Score Summary -->
    <div class="score-summary-card mb-6">
      <div style="width: 100px; height: 100px; flex-shrink: 0; position: relative;">
        <canvas id="insights-gauge" width="100" height="100"></canvas>
        <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <span style="font-family: var(--font-display); font-size: 24px; font-weight: 800; color: ${score.color};">${score.value}</span>
          <span style="font-size: 9px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em;">ECO SCORE</span>
        </div>
      </div>
      <div class="score-divider"></div>
      <div class="score-stat">
        <div class="score-stat-value">${window.Calc.format(summary.avgDaily)}</div>
        <div class="score-stat-label">Daily Avg</div>
      </div>
      <div class="score-divider"></div>
      <div class="score-stat">
        <div class="score-stat-value">${window.Calc.format(summary.yearlyProjection)}</div>
        <div class="score-stat-label">Yearly Projection</div>
      </div>
      <div class="score-divider"></div>
      <div class="score-stat">
        <div class="score-stat-value" style="color: ${summary.vsAvg > 0 ? '#EF4444' : '#10B981'};">
          ${summary.vsAvg > 0 ? '+' : ''}${summary.vsAvg}%
        </div>
        <div class="score-stat-label">vs UK Average</div>
      </div>
      <div class="score-divider"></div>
      <div class="score-stat">
        <div class="score-stat-value">${score.label}</div>
        <div class="score-stat-label">Rating</div>
      </div>
    </div>

    <div class="section-title mb-6">Personalized Recommendations</div>

    ${recommendations.length === 0 ? `
      <div class="empty-state">
        <div class="empty-state-icon">🌟</div>
        <div class="empty-state-title">Amazing work!</div>
        <div class="empty-state-desc">You're already performing excellently. Keep logging to get personalized tips.</div>
      </div>
    ` : `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        ${recommendations.map(rec => `
          <div class="recommendation-card" style="--rec-color: ${rec.color};">
            <div class="rec-header">
              <div class="rec-icon">${rec.icon}</div>
              <div style="flex: 1;">
                <div class="flex items-center gap-3 mb-2" style="flex-wrap: wrap;">
                  <h3 class="rec-title">${rec.title}</h3>
                  <span class="rec-impact">${rec.impactLabel}</span>
                  <span class="badge badge-${rec.priority === 'high' ? 'danger' : rec.priority === 'medium' ? 'warning' : 'success'}">
                    ${rec.priority} priority
                  </span>
                </div>
                <div class="cat-pill cat-pill-${rec.category}" style="margin-bottom: 8px;">
                  ${rec.category}
                </div>
              </div>
            </div>
            <p class="rec-description">${rec.description}</p>
            <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px;">
              Action Steps:
            </div>
            <div class="rec-actions">
              ${rec.actions.map(a => `
                <div class="rec-action-item">${a}</div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `}

    <!-- Benchmarks Section -->
    <div class="section-title mt-8 mb-4">How You Compare</div>
    <div class="card">
      <div class="comparison-bar-wrapper" style="gap: 16px;">
        ${[
          { label: 'You (projected)', value: summary.yearlyProjection, color: '#10B981' },
          { label: 'Low Carbon',     value: 2300,  color: '#84CC16' },
          { label: 'Global Avg',     value: 4000,  color: '#6366F1' },
          { label: 'UK Avg',         value: 5500,  color: '#F59E0B' },
          { label: 'EU Avg',         value: 6400,  color: '#F97316' },
          { label: 'US Avg',         value: 14900, color: '#EF4444' },
        ].map(b => {
          const max = 15000;
          return `
            <div class="comparison-bar-item">
              <div class="comparison-bar-label" style="font-size: 13px;">${b.label}</div>
              <div class="comparison-bar-track" style="height: 12px;">
                <div class="comparison-bar-fill" style="width: ${Math.min(100, Math.round((b.value / max) * 100))}%; background: ${b.color};"></div>
              </div>
              <div class="comparison-bar-value" style="color: ${b.color}; font-size: 14px; font-weight: 800;">
                ${(b.value / 1000).toFixed(1)}t
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  setTimeout(() => {
    window.Charts.renderGauge('insights-gauge', { value: score.value, color: score.color });
  }, 100);
}

// ─── ACTION PLAN ──────────────────────────────────────────────────────────────
function renderActionPlan() {
  const page = document.getElementById('page-action-plan');
  const goals = state.goals;

  page.innerHTML = `
    <div class="flex items-center justify-between mb-6" style="flex-wrap: wrap; gap: 16px;">
      <div>
        <div class="section-title" style="margin-bottom: 4px;">Your Goals</div>
        <p style="font-size: 14px; color: var(--text-secondary);">Break down your climate goals into achievable weekly actions.</p>
      </div>
      <button class="btn btn-primary" onclick="openAddGoalModal()">
        ➕ New Goal
      </button>
    </div>

    <div class="grid-2 mb-8">
      ${goals.length === 0
        ? `<div class="card" style="grid-column: 1/-1;">
            <div class="empty-state">
              <div class="empty-state-icon">🎯</div>
              <div class="empty-state-title">No goals yet</div>
              <div class="empty-state-desc">Set your first goal to start building a personal action plan!</div>
              <button class="btn btn-primary" onclick="openAddGoalModal()">Create First Goal</button>
            </div>
          </div>`
        : goals.map(g => renderGoalCard(g)).join('')
      }
    </div>

    <!-- Calendar -->
    <div class="section-title mb-4">Activity Calendar</div>
    <div class="mini-calendar">
      ${renderMiniCalendar()}
    </div>

    <!-- Suggested Goals -->
    <div class="section-title mt-8 mb-4">Suggested Goals</div>
    <div class="grid-3">
      ${renderSuggestedGoals()}
    </div>
  `;

  // Add goal modal
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="add-goal-modal">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">🎯 Create New Goal</h2>
          <button class="modal-close" onclick="closeModal('add-goal-modal')">✕</button>
        </div>
        <div class="flex flex-col gap-4">
          <div class="form-group">
            <label class="form-label">Goal Title</label>
            <input class="form-input" id="goal-title" placeholder="e.g. Reduce transport emissions by 30%">
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-select" id="goal-category">
                <option value="transport">🚗 Transport</option>
                <option value="home">🏠 Home Energy</option>
                <option value="food">🥗 Food</option>
                <option value="flight">✈️ Flight</option>
                <option value="shopping">🛍️ Shopping</option>
                <option value="overall">🌍 Overall</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Target Reduction (%)</label>
              <input class="form-input" id="goal-target" type="number" min="1" max="100" placeholder="20">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Deadline</label>
            <input class="form-input" id="goal-deadline" type="date"
              min="${new Date().toISOString().split('T')[0]}">
          </div>
          <div style="display: flex; gap: 12px; margin-top: 8px;">
            <button class="btn btn-primary" style="flex:1;" onclick="saveNewGoal()">Create Goal</button>
            <button class="btn btn-ghost" onclick="closeModal('add-goal-modal')">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `);
}

function renderGoalCard(goal) {
  const done     = goal.milestones?.filter(m => m.done).length || 0;
  const total    = goal.milestones?.length || 4;
  const pct      = Math.round((done / total) * 100);
  const deadline = new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return `
    <div class="goal-card">
      <div class="goal-header">
        <div>
          <div class="cat-pill cat-pill-${esc(goal.category)}" style="margin-bottom: 8px;">${esc(goal.category)}</div>
          <h3 class="goal-title">${esc(goal.title)}</h3>
        </div>
        <button onclick="deleteGoal('${Security.isValidId(goal.id) ? goal.id : ''}')" class="btn btn-ghost btn-sm" style="color: var(--clr-danger);">✕</button>
      </div>
      <div class="goal-deadline mb-4">📅 Deadline: ${deadline}</div>
      <div class="goal-progress">
        <div class="goal-progress-header">
          <span style="font-size: 13px; color: var(--text-secondary);">${done}/${total} milestones</span>
          <span class="goal-progress-pct">${pct}%</span>
        </div>
        <div class="progress-bar" style="height: 10px;">
          <div class="progress-fill" style="width: ${pct}%;"></div>
        </div>
      </div>
      <div class="goal-milestones">
        ${(goal.milestones || []).map((m, i) => `
          <div class="milestone-item">
            <div class="milestone-check ${m.done ? 'done' : ''}"
              onclick="toggleMilestone('${Security.isValidId(goal.id) ? goal.id : ''}', ${i})"></div>
            <span class="milestone-text ${m.done ? 'done' : ''}">${esc(m.action)}</span>
            <span style="margin-left: auto; font-size: 11px; color: var(--text-muted);">Wk ${m.week}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderMiniCalendar() {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Get days with entries
  const daysWithEntries = new Set();
  state.entries.forEach(e => {
    const d = new Date(e.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      daysWithEntries.add(d.getDate());
    }
  });

  // Get milestone dates
  const milestoneDays = new Set();
  state.goals.forEach(g => {
    if (g.milestones) {
      g.milestones.forEach((m, i) => {
        // Spread milestones across the month
        const d = new Date(g.createdAt);
        d.setDate(d.getDate() + (i + 1) * 7);
        if (d.getFullYear() === year && d.getMonth() === month) {
          milestoneDays.add(d.getDate());
        }
      });
    }
  });

  const dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  let html = `
    <div class="calendar-header">
      <span class="calendar-title">${monthName}</span>
      <div class="flex gap-2">
        <button class="calendar-nav-btn">‹</button>
        <button class="calendar-nav-btn">›</button>
      </div>
    </div>
    <div class="calendar-grid">
      ${dayHeaders.map(d => `<div class="calendar-day-header">${d}</div>`).join('')}
      ${Array(firstDay).fill(0).map(() => '<div class="calendar-day other-month"></div>').join('')}
      ${Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
        const classes = [
          'calendar-day',
          d === today ? 'today' : '',
          daysWithEntries.has(d) && d !== today ? 'has-entry' : '',
          milestoneDays.has(d) && d !== today ? 'has-milestone' : '',
        ].filter(Boolean).join(' ');
        return `<div class="${classes}">${d}</div>`;
      }).join('')}
    </div>
    <div style="margin-top: 12px; display: flex; gap: 16px; font-size: 11px; color: var(--text-muted);">
      <span>🟢 Logged activity</span>
      <span>🟡 Milestone</span>
    </div>
  `;
  return html;
}

function renderSuggestedGoals() {
  const suggestions = [
    { icon: '🚲', title: 'Go Car-Free on Weekends', category: 'transport', target: 40, duration: '30 days', desc: 'Eliminate car use on Saturdays and Sundays to cut transport emissions.' },
    { icon: '🥗', title: 'Plant-Based Mondays', category: 'food', target: 15, duration: '8 weeks', desc: 'Eat plant-based every Monday. Small change, big impact.' },
    { icon: '💡', title: 'Reduce Home Energy 20%', category: 'home', target: 20, duration: '60 days', desc: 'Smart thermostat, LED bulbs, and unplugging devices.' },
    { icon: '✈️', title: 'No Short-Haul Flights', category: 'flight', target: 100, duration: '1 year', desc: 'Take trains instead of flying for routes under 600km.' },
    { icon: '♻️', title: 'Zero Food Waste Month', category: 'food', target: 30, duration: '30 days', desc: 'Meal plan and compost to eliminate food waste.' },
    { icon: '🌍', title: 'Cut Carbon by 25%', category: 'overall', target: 25, duration: '90 days', desc: 'Comprehensive target across all lifestyle categories.' },
  ];

  return suggestions.map(s => `
    <div class="card" style="cursor: pointer; transition: all 0.2s ease;" onmouseenter="this.style.borderColor='var(--border-default)'" onmouseleave="this.style.borderColor=''">
      <div style="font-size: 28px; margin-bottom: 12px;">${s.icon}</div>
      <div class="cat-pill cat-pill-${s.category}" style="margin-bottom: 8px;">${s.category}</div>
      <h4 style="font-size: 14px; font-weight: 700; margin-bottom: 6px;">${s.title}</h4>
      <p style="font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-bottom: 12px;">${s.desc}</p>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 11px; color: var(--text-muted);">⏱️ ${s.duration}</span>
        <button class="btn btn-secondary btn-sm" onclick="addSuggestedGoal(${JSON.stringify(s).replace(/"/g, '&quot;')})">
          + Add Goal
        </button>
      </div>
    </div>
  `).join('');
}

function openAddGoalModal() {
  document.getElementById('add-goal-modal')?.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('open'); setTimeout(() => el.remove(), 300); }
}

function saveNewGoal() {
  const rawTitle = document.getElementById('goal-title')?.value;
  const title    = Security.validateStringInput(rawTitle, 100, '');
  const rawCat   = document.getElementById('goal-category')?.value;
  const category = Security.isValidCategory(rawCat) ? rawCat : 'overall';
  const target   = Security.validateNumericInput(document.getElementById('goal-target')?.value, 1, 100, 20);
  const deadline = document.getElementById('goal-deadline')?.value;

  if (!title) { showToast('Error', 'Please enter a goal title.', '⚠️'); return; }

  const goal = {
    id: `g_${Date.now()}`,
    title, category, target,
    deadline: deadline ? new Date(deadline).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    milestones: [
      { week: 1, action: 'Research and plan your approach', done: false },
      { week: 2, action: 'Implement first changes', done: false },
      { week: 3, action: 'Track and evaluate progress', done: false },
      { week: 4, action: 'Achieve your target', done: false },
    ],
  };

  const result = window.Store.addGoal(state, goal);
  state = result.state;
  window.AppData.saveState(state);
  
  closeModal('add-goal-modal');
  showToast('Goal Created!', title, '🎯');
  if (result.pointsEarned > 0) showPointsPopup(result.pointsEarned, document.querySelector('.btn-primary'));
  if (result.newBadges && result.newBadges.length > 0) {
    setTimeout(() => {
      showToast(`Badge Earned: ${result.newBadges[0].name}!`, result.newBadges[0].description, result.newBadges[0].emoji, 5000);
    }, 1000);
  }
  renderActionPlan();
}

function addSuggestedGoal(s) {
  const goal = {
    id: `g_${Date.now()}`,
    title: s.title,
    category: s.category,
    target: s.target,
    deadline: new Date(Date.now() + parseInt(s.duration) * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    milestones: [
      { week: 1, action: 'Research and plan your approach', done: false },
      { week: 2, action: `Start: ${s.title}`, done: false },
      { week: 3, action: 'Track and evaluate progress', done: false },
      { week: 4, action: 'Achieve your target', done: false },
    ],
  };
  
  const result = window.Store.addGoal(state, goal);
  state = result.state;
  window.AppData.saveState(state);

  showToast('Goal Added!', goal.title, '🎯');
  if (result.pointsEarned > 0) showPointsPopup(result.pointsEarned, document.getElementById('page-action-plan'));
  if (result.newBadges && result.newBadges.length > 0) {
    setTimeout(() => {
      showToast(`Badge Earned: ${result.newBadges[0].name}!`, result.newBadges[0].description, result.newBadges[0].emoji, 5000);
    }, 1000);
  }
  renderActionPlan();
}

function deleteGoal(id) {
  if (!Security.isValidId(id)) return;
  const result = window.Store.deleteGoal(state, id);
  state = result.state;
  window.AppData.saveState(state);
  showToast('Goal Removed', '', '🗑️', 2000);
  renderActionPlan();
}

function toggleMilestone(goalId, idx) {
  if (!Security.isValidId(goalId)) return;
  const result = window.Store.toggleMilestone(state, goalId, idx);
  state = result.state;

  if (result.pointsEarned > 0) {
    showToast('Milestone Done! 🎉', '', '✅');
  }

  if (result.goalCompleted) {
    setTimeout(() => {
      showToast('Goal Completed!', 'Amazing work!', '🏆', 4000);
    }, 1000);
  }

  if (result.newBadges && result.newBadges.length > 0) {
    setTimeout(() => {
       showToast(`Badge Earned: ${result.newBadges[0].name}!`, result.newBadges[0].description, result.newBadges[0].emoji, 5000);
    }, 1500);
  }

  window.AppData.saveState(state);
  renderActionPlan();
  renderGamification();
}

// ─── PROGRESS ────────────────────────────────────────────────────────────────
let progressPeriod = 30;

function renderProgress() {
  const page = document.getElementById('page-progress');
  const entries = state.entries;

  page.innerHTML = `
    <div class="flex items-center justify-between mb-6" style="flex-wrap: wrap; gap: 16px;">
      <div class="section-title" style="margin-bottom: 0;">Your Progress Over Time</div>
      <div class="period-selector">
        <button class="period-btn ${progressPeriod === 7 ? 'active' : ''}"   onclick="setProgressPeriod(7)">7D</button>
        <button class="period-btn ${progressPeriod === 14 ? 'active' : ''}"  onclick="setProgressPeriod(14)">14D</button>
        <button class="period-btn ${progressPeriod === 30 ? 'active' : ''}"  onclick="setProgressPeriod(30)">30D</button>
        <button class="period-btn ${progressPeriod === 90 ? 'active' : ''}"  onclick="setProgressPeriod(90)">90D</button>
      </div>
    </div>

    <!-- Trend Chart -->
    <div class="card mb-6">
      <div class="section-title">CO₂e Emissions Trend</div>
      <div class="chart-container" style="height: 280px;">
        <canvas id="progress-trend-chart"></canvas>
      </div>
    </div>

    <!-- Stacked Bar Chart -->
    <div class="card mb-6">
      <div class="section-title">Category Breakdown</div>
      <div class="chart-container" style="height: 280px;">
        <canvas id="progress-stacked-chart"></canvas>
      </div>
    </div>

    <!-- Monthly Comparison + Category Stats -->
    <div class="grid-2">
      <div class="card">
        <div class="section-title">Monthly Comparison</div>
        <div class="chart-container" style="height: 220px;">
          <canvas id="monthly-chart"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="section-title">Category Stats</div>
        ${renderCategoryStats(entries, progressPeriod)}
      </div>
    </div>
  `;

  setTimeout(() => {
    window.Charts.renderTrendLine('progress-trend-chart', entries, progressPeriod);
    window.Charts.renderStackedBar('progress-stacked-chart', entries, progressPeriod);
    window.Charts.renderMonthlyComparison('monthly-chart', entries);
  }, 100);
}

function setProgressPeriod(days) {
  progressPeriod = days;
  renderProgress();
}

function renderCategoryStats(entries, days) {
  const recent = window.Calc.lastNDays(entries, days);
  const byCat  = window.Calc.byCategory(recent);
  const total  = window.Calc.totalFromEntries(recent);
  const catIcons   = { transport: '🚗', flight: '✈️', home: '🏠', food: '🥗', shopping: '🛍️' };
  const catColors  = { transport: '#2DD4BF', flight: '#818CF8', home: '#FCD34D', food: '#34D399', shopping: '#F472B6' };

  return Object.entries(byCat).map(([cat, val]) => {
    const pct = total > 0 ? Math.round((val / total) * 100) : 0;
    return `
      <div style="margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span>${catIcons[cat]}</span>
          <span style="font-size: 13px; font-weight: 600;">${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
          <span style="margin-left: auto; font-size: 12px; color: var(--text-muted);">${pct}%</span>
          <span style="font-family: var(--font-display); font-size: 14px; font-weight: 700; color: ${catColors[cat]};">
            ${window.Calc.format(val)}
          </span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${pct}%; background: linear-gradient(90deg, ${catColors[cat]}, ${catColors[cat]}aa);"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ─── GAMIFICATION ────────────────────────────────────────────────────────────
function renderGamification() {
  const page   = document.getElementById('page-gamification');
  const lvl    = window.Gamification.getLevelInfo(state.user.level);
  const nextLvl = window.Gamification.getNextLevel(state.user.level);
  const lvlPct  = window.Gamification.getLevelProgress(state.user.points, state.user.level);
  const badges  = window.Gamification.getAllBadges(state);

  // Update leaderboard user
  const lb = [...window.AppData.LEADERBOARD];
  lb.find(r => r.isUser && (r.points = state.user.points, r.name = state.user.name, r.avatar = state.user.avatar));
  lb.sort((a, b) => b.points - a.points);
  lb.forEach((r, i) => r.rank = i + 1);

  page.innerHTML = `
    <!-- Level Card -->
    <div class="level-card mb-6">
      <div class="level-header">
        <div class="level-badge-big pulse-ring">${lvl.emoji}</div>
        <div style="flex: 1;">
          <div class="level-name">${lvl.name}</div>
          <div class="level-number">Level ${state.user.level} · ${state.user.points.toLocaleString()} points</div>
          ${nextLvl ? `<div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
            Next: ${nextLvl.emoji} ${nextLvl.name} at ${nextLvl.minPoints} pts
          </div>` : '<div style="font-size: 12px; color: var(--clr-primary);">🏆 Max level reached!</div>'}
        </div>
        <div style="text-align: center; flex-shrink: 0;">
          <div style="font-family: var(--font-display); font-size: 40px; font-weight: 900; color: var(--clr-primary);">
            ${state.user.streak}
          </div>
          <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em;">day streak 🔥</div>
        </div>
      </div>
      <div class="flex items-center justify-between mb-2">
        <span style="font-size: 12px; color: var(--text-muted);">Level Progress</span>
        <span style="font-size: 12px; color: var(--clr-primary); font-weight: 700;">${lvlPct}%</span>
      </div>
      <div class="progress-bar" style="height: 12px;">
        <div class="progress-fill" style="width: ${lvlPct}%;"></div>
      </div>
    </div>

    <!-- Badges -->
    <div class="section-title mb-4">
      Badges
      <span class="badge badge-success" style="margin-left: 8px;">${badges.filter(b => b.earned).length}/${badges.length}</span>
    </div>
    <div class="badge-grid mb-8">
      ${badges.map(b => `
        <div class="badge-card ${b.earned ? 'earned' : ''}">
          ${b.earned ? '<div class="badge-earned-checkmark">✓</div>' : ''}
          <div class="badge-emoji">${b.emoji}</div>
          <div class="badge-name">${b.name}</div>
          <div class="badge-desc">${b.description}</div>
        </div>
      `).join('')}
    </div>

    <!-- Leaderboard -->
    <div class="section-title mb-4">Leaderboard</div>
    <div>
      ${lb.map(r => {
        const rankClass = r.rank === 1 ? 'gold' : r.rank === 2 ? 'silver' : r.rank === 3 ? 'bronze' : '';
        const rankText  = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `#${r.rank}`;
        return `
          <div class="leaderboard-item ${r.isUser ? 'is-user' : ''}">
            <div class="leaderboard-rank ${rankClass}">${rankText}</div>
            <div class="leaderboard-avatar">${esc(r.avatar) || '👤'}</div>
            <div style="flex: 1;">
              <div class="leaderboard-name">${esc(r.name)}${r.isUser ? ' (You)' : ''}</div>
              <div class="leaderboard-stat">${Number(r.co2Saved)}kg CO\u2082 saved this month</div>
            </div>
            ${r.badge ? `<span style="font-size: 20px;">${esc(r.badge)}</span>` : ''}
            <div class="leaderboard-points">${Number(r.points).toLocaleString()} pts</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ─── COMMUNITY ────────────────────────────────────────────────────────────────
const likedPosts = new Set();

function renderCommunity() {
  const page = document.getElementById('page-community');
  const posts = window.AppData.COMMUNITY_POSTS;

  page.innerHTML = `
    <div class="grid-2" style="align-items: start;">
      <!-- Feed -->
      <div>
        <div class="flex items-center justify-between mb-5">
          <div class="section-title" style="margin-bottom: 0;">Community Feed</div>
          <button class="btn btn-primary btn-sm" onclick="shareProgress()">📣 Share Progress</button>
        </div>

        ${posts.map(p => `
          <div class="community-post">
            <div class="post-header">
              <div class="post-avatar">${esc(p.avatar)}</div>
              <div style="flex: 1;">
                <div class="flex items-center gap-2">
                  <span class="post-user-name">${esc(p.user)}</span>
                  ${p.badge ? `<span style="font-size: 14px;">${esc(p.badge)}</span>` : ''}
                </div>
                <div class="post-user-meta">${esc(p.time)} \u00b7 ${Number(p.points).toLocaleString()} points</div>
              </div>
            </div>
            <p class="post-content">${esc(p.tip)}</p>
            <div class="post-actions">
              <button class="post-like-btn ${likedPosts.has(p.id) ? 'liked' : ''}"
                id="like-btn-${Security.isValidId(p.id) ? p.id : ''}"
                onclick="toggleLike('${Security.isValidId(p.id) ? p.id : ''}', ${Number(p.likes)})">
                ${likedPosts.has(p.id) ? '❤️' : '🤍'} <span id="like-count-${p.id}">${p.likes + (likedPosts.has(p.id) ? 1 : 0)}</span>
              </button>
              <button class="post-like-btn" onclick="showToast('Copied!', 'Tip copied to clipboard.', '📋', 2000)">
                🔗 Share
              </button>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Sidebar -->
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Your Share Card -->
        <div class="card" id="share-card" style="background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(20,184,166,0.05)); border-color: var(--border-default);">
          <div style="font-size: 13px; font-weight: 700; color: var(--clr-primary); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px;">
            📊 Your Progress Card
          </div>
          <div style="text-align: center; padding: 20px 0;">
            <div style="font-size: 48px; margin-bottom: 8px;">${window.Gamification.getLevelInfo(state.user.level).emoji}</div>
            <div style="font-family: var(--font-display); font-size: 20px; font-weight: 800;">${esc(state.user.name)}</div>
            <div style="color: var(--clr-primary); font-weight: 600; margin: 4px 0;">${esc(window.Gamification.getLevelInfo(state.user.level).name)} \u00b7 Lv.${Number(state.user.level)}</div>
            <div style="font-size: 13px; color: var(--text-muted); margin-top: 8px;">🔥 ${Number(state.user.streak)} day streak \u00b7 ${Number(state.user.points)} pts</div>
            <div style="font-size: 13px; color: var(--text-muted);">♻️ ${state.badges.length} badges earned</div>
          </div>
          <button class="btn btn-primary w-full" onclick="shareProgress()">Share My Progress 🚀</button>
        </div>

        <!-- Stats -->
        <div class="card">
          <div style="font-size: 13px; font-weight: 700; margin-bottom: 12px;">Community Stats</div>
          ${[
            { label: 'Active Members', value: '12,847', icon: '👥' },
            { label: 'CO₂ Saved Total', value: '184.2t', icon: '🌍' },
            { label: 'Tips Shared', value: '3,429', icon: '💡' },
            { label: 'Goals Completed', value: '8,912', icon: '🎯' },
          ].map(s => `
            <div style="display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border-subtle);">
              <span style="font-size: 20px;">${s.icon}</span>
              <span style="font-size: 13px; flex: 1;">${s.label}</span>
              <span style="font-family: var(--font-display); font-size: 16px; font-weight: 800; color: var(--clr-primary);">${s.value}</span>
            </div>
          `).join('')}
        </div>

        <!-- Top Tips -->
        <div class="card">
          <div style="font-size: 13px; font-weight: 700; margin-bottom: 12px;">🏆 Top Tips This Week</div>
          ${['Cycling to work', 'Meal prepping to reduce waste', 'Switching to a green energy tariff', 'Train travel over flying'].map((tip, i) => `
            <div style="display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border-subtle);">
              <span style="font-family: var(--font-display); font-size: 18px; font-weight: 900; color: var(--clr-primary); width: 24px; text-align: center;">${i+1}</span>
              <span style="font-size: 13px; color: var(--text-secondary);">${tip}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function toggleLike(postId, baseLikes) {
  if (likedPosts.has(postId)) {
    likedPosts.delete(postId);
  } else {
    likedPosts.add(postId);
  }
  const btn   = document.getElementById(`like-btn-${postId}`);
  const count = document.getElementById(`like-count-${postId}`);
  if (btn)   btn.classList.toggle('liked', likedPosts.has(postId));
  if (count) count.textContent = baseLikes + (likedPosts.has(postId) ? 1 : 0);
  const heart = btn?.querySelector('span') || btn;
  if (btn) btn.childNodes[0].textContent = likedPosts.has(postId) ? '❤️ ' : '🤍 ';
}

function shareProgress() {
  const lvl = window.Gamification.getLevelInfo(state.user.level);
  const text = `🌱 I'm a ${lvl.name} on Carbon Tracker! ${state.user.streak} day streak and ${state.user.points} points earned. Join me in reducing your carbon footprint!`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => showToast('Copied!', 'Progress card copied to clipboard.', '📋'));
  } else {
    showToast('Share', text.substring(0, 60) + '...', '📣');
  }
}

// ─── EDUCATION ───────────────────────────────────────────────────────────────
function renderEducation() {
  const page = document.getElementById('page-education');
  const resources = window.AppData.RESOURCES;

  page.innerHTML = `
    <div class="section-title mb-6">Learn & Grow</div>

    <!-- Featured -->
    <div class="card mb-6" style="background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(20,184,166,0.05)); border-color: var(--border-default);">
      <div class="flex gap-6 items-center" style="flex-wrap: wrap;">
        <div style="font-size: 56px;">🌍</div>
        <div style="flex: 1; min-width: 200px;">
          <div class="badge badge-success mb-3">Featured Article</div>
          <h2 style="font-size: 22px; font-weight: 800; margin-bottom: 8px;">The Science of Carbon Footprints</h2>
          <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px;">
            Understanding your carbon footprint is the first step to reducing it. Learn how scientists measure emissions 
            and why every kilogram of CO₂ matters for the planet's future.
          </p>
          <div class="flex gap-3 items-center" style="flex-wrap: wrap;">
            <button class="btn btn-primary btn-sm" onclick="showToast('Article', 'Opening article...', '📖')">Read Article →</button>
            <span style="font-size: 12px; color: var(--text-muted);">⏱️ 10 min read</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Resource Grid -->
    <div class="grid-3 mb-8">
      ${resources.map(r => `
        <div class="resource-card" onclick="showToast('${esc(r.title)}', 'Opening resource...', '${esc(r.emoji)}')">
          <div class="resource-card-top" style="background: ${r.color}22;">
            <span style="font-size: 40px;">${r.emoji}</span>
          </div>
          <div class="resource-card-body">
            <div class="resource-category" style="color: ${r.color};">${esc(r.category)}</div>
            <div class="resource-title">${esc(r.title)}</div>
            <div class="resource-desc">${esc(r.description)}</div>
          </div>
          <div class="resource-footer">
            <span class="resource-read-time">⏱️ ${r.readTime}</span>
            <span class="btn btn-secondary btn-sm">Read →</span>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Quick Facts -->
    <div class="section-title mb-4">Did You Know?</div>
    <div class="grid-3">
      ${[
        { fact: 'A single transatlantic flight generates more CO₂ than many people produce in a whole year of driving.', icon: '✈️', color: '#6366F1' },
        { fact: 'Producing 1kg of beef emits 27kg of CO₂e — switching to chicken has 75% less impact.', icon: '🥩', color: '#10B981' },
        { fact: 'If everyone shifted to a plant-based diet, food emissions could drop by 70%.', icon: '🌱', color: '#84CC16' },
        { fact: 'Homes account for ~14% of global greenhouse gas emissions — simple changes make a huge difference.', icon: '🏠', color: '#F59E0B' },
        { fact: 'The fashion industry produces 10% of all humanity\'s carbon emissions annually.', icon: '👗', color: '#EC4899' },
        { fact: 'Cycling instead of driving for just one trip per day saves 200g of CO₂ on average.', icon: '🚲', color: '#14B8A6' },
      ].map(f => `
        <div class="card" style="border-left: 3px solid ${f.color}20; position: relative; overflow: hidden;">
          <div style="font-size: 28px; margin-bottom: 12px;">${f.icon}</div>
          <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">${f.fact}</p>
        </div>
      `).join('')}
    </div>
  `;
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function formatTimeAgo(dateStr) {
  const d    = new Date(dateStr);
  const now  = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Make navigateTo available globally
window.navigateTo       = navigateTo;
window.switchTrackerCategory = switchTrackerCategory;
window.selectTrackerSubtype  = selectTrackerSubtype;
window.updateCO2Preview      = updateCO2Preview;
window.submitTrackerEntry    = submitTrackerEntry;
window.resetTrackerForm      = resetTrackerForm;
window.deleteEntry           = deleteEntry;
window.openAddGoalModal      = openAddGoalModal;
window.closeModal            = closeModal;
window.saveNewGoal           = saveNewGoal;
window.addSuggestedGoal      = addSuggestedGoal;
window.deleteGoal            = deleteGoal;
window.toggleMilestone       = toggleMilestone;
window.setProgressPeriod     = setProgressPeriod;
window.toggleLike            = toggleLike;
window.shareProgress         = shareProgress;
window.showToast             = showToast;
