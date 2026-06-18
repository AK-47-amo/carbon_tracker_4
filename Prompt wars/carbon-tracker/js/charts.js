// Chart.js Configuration and Rendering

const CHART_COLORS = {
  transport: '#14B8A6',
  flight:    '#6366F1',
  home:      '#F59E0B',
  food:      '#10B981',
  shopping:  '#EC4899',
  grid:      'rgba(255,255,255,0.06)',
  text:      '#94A3B8',
};

const chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

const Charts = {
  /**
   * Donut chart for category breakdown
   */
  renderDonut(canvasId, byCat) {
    destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const labels = Object.keys(byCat).map(k => k.charAt(0).toUpperCase() + k.slice(1));
    const data = Object.values(byCat);
    const colors = Object.keys(byCat).map(k => CHART_COLORS[k]);

    chartInstances[canvasId] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderColor: '#0A0F0D',
          borderWidth: 3,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: CHART_COLORS.text,
              padding: 16,
              font: { family: 'Inter', size: 12 },
              usePointStyle: true,
              pointStyleWidth: 10,
            },
          },
          tooltip: {
            backgroundColor: '#1A2820',
            titleColor: '#E2E8F0',
            bodyColor: '#94A3B8',
            borderColor: 'rgba(16,185,129,0.3)',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => ` ${window.Calc.format(ctx.parsed)} CO₂e`,
            },
          },
        },
        animation: { animateRotate: true, duration: 800, easing: 'easeInOutQuart' },
      },
    });
  },

  /**
   * Line chart for daily trend
   */
  renderTrendLine(canvasId, entries, days = 30, goalLine = null) {
    destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const { labels, data } = window.Calc.byDay(entries, days);

    const datasets = [{
      label: 'Daily CO₂e (kg)',
      data,
      borderColor: '#10B981',
      backgroundColor: 'rgba(16,185,129,0.08)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#10B981',
      pointBorderColor: '#0A0F0D',
      pointBorderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 6,
    }];

    if (goalLine) {
      datasets.push({
        label: 'Your Goal',
        data: Array(labels.length).fill(goalLine),
        borderColor: '#F59E0B',
        borderDash: [6, 4],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      });
    }

    // 7-day moving average
    const ma7 = data.map((_, i) => {
      if (i < 6) return null;
      const slice = data.slice(i - 6, i + 1);
      return Math.round(slice.reduce((s, v) => s + v, 0) / 7 * 10) / 10;
    });

    datasets.push({
      label: '7-Day Avg',
      data: ma7,
      borderColor: 'rgba(132,204,22,0.7)',
      borderDash: [3, 3],
      borderWidth: 1.5,
      pointRadius: 0,
      fill: false,
      tension: 0.4,
    });

    chartInstances[canvasId] = new Chart(canvas, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: CHART_COLORS.grid },
            ticks: {
              color: CHART_COLORS.text,
              font: { family: 'Inter', size: 11 },
              maxTicksLimit: days <= 7 ? 7 : 8,
            },
          },
          y: {
            grid: { color: CHART_COLORS.grid },
            ticks: {
              color: CHART_COLORS.text,
              font: { family: 'Inter', size: 11 },
              callback: (v) => `${v}kg`,
            },
            beginAtZero: true,
          },
        },
        plugins: {
          legend: {
            labels: {
              color: CHART_COLORS.text,
              font: { family: 'Inter', size: 12 },
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: '#1A2820',
            titleColor: '#E2E8F0',
            bodyColor: '#94A3B8',
            borderColor: 'rgba(16,185,129,0.3)',
            borderWidth: 1,
          },
        },
        interaction: { mode: 'index', intersect: false },
        animation: { duration: 800, easing: 'easeInOutQuart' },
      },
    });
  },

  /**
   * Stacked bar chart for category breakdown over time
   */
  renderStackedBar(canvasId, entries, days = 30) {
    destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const { labels, datasets } = window.Calc.byDayAndCategory(entries, days);
    const categoryNames = { transport: 'Transport', flight: 'Flight', home: 'Home Energy', food: 'Food', shopping: 'Shopping' };

    const chartDatasets = Object.entries(datasets).map(([cat, data]) => ({
      label: categoryNames[cat],
      data,
      backgroundColor: CHART_COLORS[cat],
      stack: 'stack',
      borderRadius: 2,
    }));

    chartInstances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: { labels, datasets: chartDatasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: { color: CHART_COLORS.grid },
            ticks: {
              color: CHART_COLORS.text,
              font: { family: 'Inter', size: 11 },
              maxTicksLimit: 8,
            },
          },
          y: {
            stacked: true,
            grid: { color: CHART_COLORS.grid },
            ticks: {
              color: CHART_COLORS.text,
              font: { family: 'Inter', size: 11 },
              callback: (v) => `${v}kg`,
            },
            beginAtZero: true,
          },
        },
        plugins: {
          legend: {
            labels: {
              color: CHART_COLORS.text,
              font: { family: 'Inter', size: 12 },
              usePointStyle: true,
            },
          },
          tooltip: {
            backgroundColor: '#1A2820',
            titleColor: '#E2E8F0',
            bodyColor: '#94A3B8',
            borderColor: 'rgba(16,185,129,0.3)',
            borderWidth: 1,
          },
        },
        animation: { duration: 800, easing: 'easeInOutQuart' },
      },
    });
  },

  /**
   * Radial gauge for eco score
   */
  renderGauge(canvasId, score) {
    destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    chartInstances[canvasId] = new Chart(canvas, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [score, 100 - score],
          backgroundColor: [score.color || '#10B981', 'rgba(255,255,255,0.05)'],
          borderColor: 'transparent',
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        circumference: 240,
        rotation: -120,
        cutout: '80%',
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        animation: { duration: 1200, easing: 'easeInOutQuart' },
      },
    });
  },

  /**
   * Bar chart for monthly comparison
   */
  renderMonthlyComparison(canvasId, entries) {
    destroyChart(canvasId);
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const months = [];
    const data = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthEntries = entries.filter(e => {
        const ed = new Date(e.date);
        return ed >= d && ed <= end;
      });
      months.push(d.toLocaleDateString('en-US', { month: 'short' }));
      data.push(Math.round(window.Calc.totalFromEntries(monthEntries)));
    }

    chartInstances[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Monthly CO₂e (kg)',
          data,
          backgroundColor: data.map((v, i) =>
            i === data.length - 1 ? '#10B981' : 'rgba(16,185,129,0.35)'
          ),
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: CHART_COLORS.text, font: { family: 'Inter', size: 12 } },
          },
          y: {
            grid: { color: CHART_COLORS.grid },
            ticks: {
              color: CHART_COLORS.text,
              font: { family: 'Inter', size: 11 },
              callback: (v) => `${v}kg`,
            },
            beginAtZero: true,
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1A2820',
            titleColor: '#E2E8F0',
            bodyColor: '#94A3B8',
          },
        },
        animation: { duration: 800, easing: 'easeInOutQuart' },
      },
    });
  },
};

window.Charts = Charts;
window.chartInstances = chartInstances;
