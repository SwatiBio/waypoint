/* === Dashboard View === */
const Dashboard = {
  charts: {},

  render() {
    const container = document.getElementById('view-dashboard');
    const jobs = DB.getJobs();
    const allHistory = DB.getHistory();

    const statusCounts = {};
    const catCounts = {};
    const monthlyCounts = {};
    const today = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    jobs.forEach(j => {
      statusCounts[j.status] = (statusCounts[j.status] || 0) + 1;
      catCounts[j.category] = (catCounts[j.category] || 0) + 1;
      if (j.date) {
        const d = new Date(j.date);
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
      }
    });

    const applied = statusCounts['Applied'] || 0;
    const phoneScreen = statusCounts['Phone Screen'] || 0;
    const technical = statusCounts['Technical'] || 0;
    const final = statusCounts['Final'] || 0;
    const offers = statusCounts['Offer'] || 0;
    const rejected = statusCounts['Rejected'] || 0;
    const activePipeline = applied + phoneScreen + technical + final;
    const responseRate = jobs.length ? Math.round((phoneScreen + technical + final + offers) / jobs.length * 100) : 0;

    container.innerHTML = `
      <div class="dashboard-stats">
        <div class="stat-card"><div class="stat-value">${jobs.length}</div><div class="stat-label">Total Applications</div></div>
        <div class="stat-card"><div class="stat-value">${activePipeline}</div><div class="stat-label">Active Pipeline</div></div>
        <div class="stat-card"><div class="stat-value">${offers}</div><div class="stat-label">Offers Received</div></div>
        <div class="stat-card"><div class="stat-value">${responseRate}%</div><div class="stat-label">Response Rate</div></div>
        <div class="stat-card"><div class="stat-value">${rejected}</div><div class="stat-label">Rejected</div></div>
      </div>
      <div class="dashboard-charts">
        <div class="chart-card"><h4>Status Breakdown</h4><canvas id="chart-status"></canvas></div>
        <div class="chart-card"><h4>By Category</h4><canvas id="chart-category"></canvas></div>
        <div class="chart-card" style="grid-column:1/-1"><h4>Monthly Applications</h4><canvas id="chart-monthly"></canvas></div>
      </div>
      <div class="dashboard-recent">
        <h4>Recent Activity</h4>
        <div id="recent-activity"></div>
      </div>
    `;

    // Recent activity
    const recentEl = document.getElementById('recent-activity');
    const jobMap = {};
    jobs.forEach(j => jobMap[j.id] = j);
    const recent = allHistory.slice(0, 10);
    if (recent.length === 0) {
      recentEl.innerHTML = '<div class="text-muted text-sm">No activity yet. Start by adding a job!</div>';
    } else {
      recentEl.innerHTML = recent.map(h => {
        const j = jobMap[h.jobId];
        if (!j) return '';
        return `<div class="recent-item">
          <span>${h.action === 'Created' ? icon('plus', 14) : h.action === 'Status' ? icon('pin', 14) : h.action === 'Deleted' ? icon('trash', 14) : icon('edit', 14)} <strong>${UI.escapeHtml(j.company)}</strong> - ${h.action}${h.to ? ' to ' + h.to : ''}</span>
          <span class="text-muted">${UI.formatDateTime(h.timestamp)}</span>
        </div>`;
      }).join('');
    }

    document.getElementById('view-title').textContent = 'Dashboard';

    // Render charts after DOM update
    setTimeout(() => this.renderCharts(statusCounts, catCounts, monthlyCounts), 100);
  },

  renderCharts(statusCounts, catCounts, monthlyCounts) {
    // Destroy existing charts
    Object.values(this.charts).forEach(c => { try { c.destroy(); } catch {} });
    this.charts = {};

    const statusCtx = document.getElementById('chart-status');
    const catCtx = document.getElementById('chart-category');
    const monthlyCtx = document.getElementById('chart-monthly');

    if (!statusCtx || !catCtx || !monthlyCtx) return;

    const statusOrder = ['Applied', 'Phone Screen', 'Technical', 'Final', 'Offer', 'Rejected', 'Withdrawn'];
    const statusColors = ['#3b82f6', '#6366f1', '#f59e0b', '#ec4899', '#10b981', '#ef4444', '#6b7280'];

    if (typeof Chart !== 'undefined') {
      this.charts.status = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: statusOrder.filter(s => statusCounts[s]),
          datasets: [{
            data: statusOrder.filter(s => statusCounts[s]).map(s => statusCounts[s]),
            backgroundColor: statusOrder.filter(s => statusCounts[s]).map(s => statusColors[statusOrder.indexOf(s)])
          }]
        },
        options: { plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12 } } }, maintainAspectRatio: true }
      });

      this.charts.category = new Chart(catCtx, {
        type: 'bar',
        data: {
          labels: Object.keys(catCounts),
          datasets: [{
            label: 'Applications',
            data: Object.values(catCounts),
            backgroundColor: '#3b82f6'
          }]
        },
        options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, maintainAspectRatio: true }
      });

      const months = Object.keys(monthlyCounts).sort((a, b) => {
        const [mA, yA] = a.split(' '); const [mB, yB] = b.split(' ');
        return yA !== yB ? yA - yB : monthNames.indexOf(mA) - monthNames.indexOf(mB);
      });

      this.charts.monthly = new Chart(monthlyCtx, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Applications',
            data: months.map(m => monthlyCounts[m]),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,0.1)',
            fill: true,
            tension: 0.3
          }]
        },
        options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, maintainAspectRatio: true }
      });
    }
  },
};
