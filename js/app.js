/* === Main Application === */
const App = {
  currentView: 'dashboard',
  currentCategory: 'all',
  searchQuery: '',
  advancedFilters: null,
  tableCategoryFilter: null,

  init() {
    // Load theme from settings
    const settings = DB.getSettings();
    document.documentElement.dataset.theme = settings.theme || 'light';
    document.getElementById('theme-toggle').innerHTML = icon(settings.theme === 'dark' ? 'sun' : 'moon', 18);

    // Init all modules
    UI.renderCategories();
    UI.init();
    Skills.init();
    Notes.initPreview();
    Notifications.requestPermission();
    Notifications.checkAllReminders();

    // Switch to default view
    this.switchView(settings.defaultView || 'dashboard');

    // Job form save handler
    document.getElementById('job-save-btn').addEventListener('click', () => this.saveJobForm());

    // Reminder checkbox toggle
    document.getElementById('job-reminder').addEventListener('change', (e) => {
      document.getElementById('job-reminder-date').style.display = e.target.checked ? 'block' : 'none';
    });
  },

  switchView(view) {
    this.currentView = view;

    // Update view panes
    document.querySelectorAll('.view-pane').forEach(p => p.classList.remove('active'));
    const pane = document.getElementById('view-' + view);
    if (pane) pane.classList.add('active');

    // Update nav items
    document.querySelectorAll('.nav-item[data-view]').forEach(n => n.classList.remove('active'));
    document.querySelectorAll(`.nav-item[data-view="${view}"]`).forEach(n => n.classList.add('active'));

    // Update view toggles
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll(`.view-btn[data-view="${view}"]`).forEach(b => b.classList.add('active'));

    // Show/hide view toggles based on view
    const toggles = document.getElementById('view-toggles');
    toggles.style.display = (view === 'dashboard' || view === 'kanban' || view === 'table' || view === 'timeline') ? 'flex' : 'none';

    // Clear advanced filters when switching views
    if (view !== 'kanban' && view !== 'table' && view !== 'timeline') {
      this.advancedFilters = null;
    }

    // Render the view
    this.renderCurrentView();
  },

  renderCurrentView() {
    switch (this.currentView) {
      case 'dashboard': Dashboard.render(); break;
      case 'kanban': Kanban.render(); break;
      case 'table': TableView.render(); break;
      case 'timeline': Timeline.render(); break;
      case 'skills': Skills.renderList(); break;
      case 'generated': GeneratedContentView.render(); break;
      case 'settings': Settings.render(); break;
    }
  },

  filterJobs() {
    const input = document.getElementById('search-input');
    this.searchQuery = input.value;
    this.renderCurrentView();
  },

  updateCounts() {
    // Update category counts if needed
    UI.renderCategories();
  },

  openJobForm(jobId) {
    const modal = document.getElementById('job-modal');
    const title = document.getElementById('job-modal-title');
    const form = document.getElementById('job-form');
    form.reset();
    document.getElementById('job-reminder-date').style.display = 'none';

    const cats = DB.getCategories();
    const catSelect = document.getElementById('job-category');
    catSelect.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');

    if (jobId) {
      const job = DB.getJob(jobId);
      if (!job) return;
      title.textContent = 'Edit Job';
      document.getElementById('job-id').value = job.id;
      document.getElementById('job-company').value = job.company || '';
      document.getElementById('job-position').value = job.position || '';
      document.getElementById('job-date').value = job.date || '';
      document.getElementById('job-status').value = job.status || 'Applied';
      document.getElementById('job-category').value = job.category || 'General';
      document.getElementById('job-salary').value = job.salary || '';
      document.getElementById('job-location').value = job.location || '';
      document.getElementById('job-contact').value = job.contact || '';
      document.getElementById('job-url').value = job.url || '';
      document.getElementById('job-notes').value = job.notes || '';
      Notes.renderPreview(job.notes, 'notes-preview');
      if (job.reminderDate) {
        document.getElementById('job-reminder').checked = true;
        document.getElementById('job-reminder-date').style.display = 'block';
        document.getElementById('job-reminder-date').value = job.reminderDate;
      }
    } else {
      title.textContent = 'New Job';
      document.getElementById('job-id').value = '';
      document.getElementById('job-date').value = new Date().toISOString().split('T')[0];
    }

    modal.classList.add('active');
  },

  saveJobForm() {
    const id = document.getElementById('job-id').value;
    const data = {
      company: document.getElementById('job-company').value.trim(),
      position: document.getElementById('job-position').value.trim(),
      date: document.getElementById('job-date').value,
      status: document.getElementById('job-status').value,
      category: document.getElementById('job-category').value,
      salary: document.getElementById('job-salary').value.trim(),
      location: document.getElementById('job-location').value.trim(),
      contact: document.getElementById('job-contact').value.trim(),
      url: document.getElementById('job-url').value.trim(),
      notes: document.getElementById('job-notes').value,
      reminderDate: document.getElementById('job-reminder').checked ? document.getElementById('job-reminder-date').value : null,
    };

    if (!data.company || !data.position) {
      UI.showToast('Company and Position are required', 'error');
      return;
    }

    if (id) {
      DB.updateJob(id, data);
      UI.showToast('Job updated!', 'success');
    } else {
      DB.addJob(data);
      UI.showToast('Job added!', 'success');
      // Schedule reminder if set
      if (data.reminderDate) {
        notif: {
          const newJobs = DB.getJobs();
          const newJob = newJobs.find(j => j.company === data.company && j.position === data.position);
          if (newJob) Notifications.scheduleReminder(newJob);
        }
      }
    }

    document.getElementById('job-modal').classList.remove('active');
    this.renderCurrentView();
    UI.renderCategories();
  },

  showJobDetail(jobId) {
    const job = DB.getJob(jobId);
    if (!job) return;

    const modal = document.getElementById('detail-modal');
    document.getElementById('detail-title').textContent = `${job.company} - ${job.position}`;

    const body = document.getElementById('detail-body');
    const history = DB.getJobHistory(jobId);

    body.innerHTML = `
      <div class="detail-field">
        <div class="detail-label">Company</div>
        <div class="detail-value">${UI.escapeHtml(job.company)}</div>
      </div>
      <div class="detail-field">
        <div class="detail-label">Position</div>
        <div class="detail-value">${UI.escapeHtml(job.position)}</div>
      </div>
      <div class="detail-field">
        <div class="detail-label">Status</div>
        <div class="detail-value">${UI.statusBadge(job.status)}</div>
      </div>
      <div class="detail-field">
        <div class="detail-label">Category</div>
        <div class="detail-value">${UI.escapeHtml(job.category || 'General')}</div>
      </div>
      <div class="flex gap-8" style="flex-wrap:wrap">
        <div class="detail-field" style="flex:1">
          <div class="detail-label">Date Applied</div>
          <div class="detail-value">${UI.formatDate(job.date)}</div>
        </div>
        <div class="detail-field" style="flex:1">
          <div class="detail-label">Salary</div>
          <div class="detail-value">${UI.formatCurrency(job.salary)}</div>
        </div>
      </div>
      <div class="flex gap-8" style="flex-wrap:wrap">
        <div class="detail-field" style="flex:1">
          <div class="detail-label">Location</div>
          <div class="detail-value">${UI.escapeHtml(job.location || '-')}</div>
        </div>
        <div class="detail-field" style="flex:1">
          <div class="detail-label">Contact</div>
          <div class="detail-value">${UI.escapeHtml(job.contact || '-')}</div>
        </div>
      </div>
      ${job.url ? `<div class="detail-field"><div class="detail-label">Job URL</div><div class="detail-value"><a href="${UI.escapeHtml(job.url)}" target="_blank">${UI.escapeHtml(job.url)}</a></div></div>` : ''}
      ${job.notes ? `<div class="detail-field"><div class="detail-label">Notes</div><div class="detail-value">${UI.renderMarkdown(job.notes)}</div></div>` : ''}
      <div class="detail-history">
        <h4>Activity History</h4>
        ${history.length === 0 ? '<p class="text-muted text-sm">No history recorded yet.</p>' :
          history.map(h => `
            <div class="history-item">
              <div class="history-time">${UI.formatDateTime(h.timestamp)}</div>
              <div class="history-change">
                ${h.action === 'Created' ? `${icon('plus', 14)} Job created` :
                  h.action === 'Status' ? `${icon('pin', 14)} Status: <span class="history-from">${UI.escapeHtml(h.from)}</span> → <span class="history-to">${UI.escapeHtml(h.to)}</span>` :
                  h.action === 'Deleted' ? `${icon('trash', 14)} Deleted` :
                  `${icon('edit', 14)} Updated`}
              </div>
            </div>
          `).join('')}
      </div>
    `;

    document.getElementById('detail-edit-btn').onclick = () => {
      modal.classList.remove('active');
      this.openJobForm(jobId);
    };

    document.getElementById('detail-delete-btn').onclick = async () => {
      const confirmed = await UI.confirmDialog(`Delete job at ${job.company}?`);
      if (confirmed) {
        DB.deleteJob(jobId);
        modal.classList.remove('active');
        this.renderCurrentView();
        UI.renderCategories();
        UI.showToast('Job deleted', 'success');
      }
    };

    modal.classList.add('active');
  },
};

// Boot the app
document.addEventListener('DOMContentLoaded', () => App.init());
