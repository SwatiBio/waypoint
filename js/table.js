/* === Table View === */
const TableView = {
  sortField: 'date',
  sortDir: -1,

  render() {
    const thead = document.getElementById('table-head');
    const tbody = document.getElementById('table-body');
    const filtersEl = document.getElementById('table-filters');

    const columns = [
      { field: 'company', label: 'Company' },
      { field: 'position', label: 'Position' },
      { field: 'status', label: 'Status' },
      { field: 'category', label: 'Category' },
      { field: 'date', label: 'Date' },
      { field: 'salary', label: 'Salary' },
      { field: 'location', label: 'Location' },
    ];

    thead.innerHTML = '<tr>' + columns.map(c =>
      `<th data-field="${c.field}">${c.label} <span class="sort-arrow">${this.sortField === c.field ? (this.sortDir === 1 ? '▲' : '▼') : ''}</span></th>`
    ).join('') + '</tr>';

    thead.querySelectorAll('th').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.field;
        if (this.sortField === field) this.sortDir *= -1;
        else { this.sortField = field; this.sortDir = -1; }
        this.render();
      });
    });

    let jobs = this.getFilteredJobs();
    jobs.sort((a, b) => {
      let va = (a[this.sortField] || '').toString().toLowerCase();
      let vb = (b[this.sortField] || '').toString().toLowerCase();
      if (this.sortField === 'date') { va = a.date || ''; vb = b.date || ''; }
      if (this.sortField === 'salary') { va = a.salary || ''; vb = b.salary || ''; }
      return va < vb ? -this.sortDir : va > vb ? this.sortDir : 0;
    });

    if (jobs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:48px;color:var(--text-muted)">No jobs found</td></tr>';
    } else {
      tbody.innerHTML = jobs.map(j => `
        <tr data-job-id="${j.id}" style="cursor:pointer">
          <td>${UI.escapeHtml(j.company)}</td>
          <td>${UI.escapeHtml(j.position)}</td>
          <td>${UI.statusBadge(j.status)}</td>
          <td>${UI.escapeHtml(j.category || 'General')}</td>
          <td>${UI.formatDate(j.date)}</td>
          <td>${UI.formatCurrency(j.salary)}</td>
          <td>${UI.escapeHtml(j.location || '-')}</td>
        </tr>
      `).join('');
      tbody.querySelectorAll('tr').forEach(tr => {
        tr.addEventListener('click', () => App.showJobDetail(tr.dataset.jobId));
      });
    }

    // Category filter chips
    const cats = DB.getCategories();
    filtersEl.innerHTML = `<button class="btn btn-sm ${!App.tableCategoryFilter ? 'btn-primary' : 'btn-secondary'}" data-filter-cat="">All</button>`;
    cats.forEach(c => {
      filtersEl.innerHTML += `<button class="btn btn-sm ${App.tableCategoryFilter === c ? 'btn-primary' : 'btn-secondary'}" data-filter-cat="${c}">${c}</button>`;
    });
    filtersEl.querySelectorAll('[data-filter-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        App.tableCategoryFilter = btn.dataset.filterCat || null;
        this.render();
      });
    });

    document.getElementById('view-title').textContent = 'Table View';
  },

  getFilteredJobs() {
    let jobs = DB.getJobs();
    if (App.tableCategoryFilter) {
      jobs = jobs.filter(j => j.category === App.tableCategoryFilter);
    } else if (App.currentCategory && App.currentCategory !== 'all') {
      jobs = jobs.filter(j => j.category === App.currentCategory);
    }
    if (App.searchQuery) {
      const q = App.searchQuery.toLowerCase();
      jobs = jobs.filter(j =>
        j.company.toLowerCase().includes(q) ||
        j.position.toLowerCase().includes(q) ||
        (j.notes && j.notes.toLowerCase().includes(q)) ||
        (j.location && j.location.toLowerCase().includes(q))
      );
    }
    if (App.advancedFilters) {
      const f = App.advancedFilters;
      if (f.company) jobs = jobs.filter(j => j.company.toLowerCase().includes(f.company));
      if (f.position) jobs = jobs.filter(j => j.position.toLowerCase().includes(f.position));
      if (f.category) jobs = jobs.filter(j => j.category === f.category);
      if (f.status) jobs = jobs.filter(j => j.status === f.status);
      if (f.dateFrom) jobs = jobs.filter(j => j.date >= f.dateFrom);
      if (f.dateTo) jobs = jobs.filter(j => j.date <= f.dateTo);
      if (f.notes) jobs = jobs.filter(j => j.notes && j.notes.toLowerCase().includes(f.notes));
    }
    return jobs;
  },
};
