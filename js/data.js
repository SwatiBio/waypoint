/* === Data Layer === */
const DB = {
  keys: {
    jobs: 'jobTracker_jobs',
    categories: 'jobTracker_categories',
    history: 'jobTracker_history',
    profile: 'jobTracker_profile',
    settings: 'jobTracker_settings',
    generatedContent: 'jobTracker_generatedContent',
    skillFeedback: 'jobTracker_skillFeedback',
  },

  _get(key, def) {
    try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : def; }
    catch { return def; }
  },
  _set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },

  // Jobs
  getJobs() { return this._get(this.keys.jobs, []); },
  saveJobs(jobs) { this._set(this.keys.jobs, jobs); },
  addJob(job) {
    const jobs = this.getJobs();
    job.id = 'j_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    if (!job.date) job.date = new Date().toISOString().split('T')[0];
    if (!job.status) job.status = 'Applied';
    if (!job.category) job.category = 'General';
    if (!job.createdAt) job.createdAt = new Date().toISOString();
    job.updatedAt = new Date().toISOString();
    jobs.unshift(job);
    this.saveJobs(jobs);
    this.addHistory(job.id, 'Created', '', job.status);
    return job;
  },
  updateJob(id, updates) {
    const jobs = this.getJobs();
    const idx = jobs.findIndex(j => j.id === id);
    if (idx === -1) return null;
    const old = { ...jobs[idx] };
    Object.assign(jobs[idx], updates, { id, updatedAt: new Date().toISOString() });
    this.saveJobs(jobs);
    const changedFields = [];
    if (old.status !== jobs[idx].status) {
      this.addHistory(id, 'Status', old.status, jobs[idx].status);
      changedFields.push('status');
    }
    if (old.company !== jobs[idx].company) changedFields.push('company');
    if (old.position !== jobs[idx].position) changedFields.push('position');
    if (changedFields.length && old.status === jobs[idx].status) {
      this.addHistory(id, 'Updated', '', '');
    }
    return jobs[idx];
  },
  deleteJob(id) {
    let jobs = this.getJobs();
    jobs = jobs.filter(j => j.id !== id);
    this.saveJobs(jobs);
    this.addHistory(id, 'Deleted', '', '');
    return true;
  },
  getJob(id) {
    return this.getJobs().find(j => j.id === id) || null;
  },

  // Categories
  getCategories() {
    return this._get(this.keys.categories, ['General', 'Tech', 'Finance', 'Healthcare']);
  },
  saveCategories(cats) { this._set(this.keys.categories, cats); },
  addCategory(name) {
    const cats = this.getCategories();
    if (cats.includes(name)) return false;
    cats.push(name);
    this.saveCategories(cats);
    return true;
  },
  deleteCategory(name) {
    let cats = this.getCategories();
    cats = cats.filter(c => c !== name);
    this.saveCategories(cats);
    const jobs = this.getJobs();
    jobs.forEach(j => { if (j.category === name) j.category = 'General'; });
    this.saveJobs(jobs);
  },

  // History
  getHistory() { return this._get(this.keys.history, []); },
  saveHistory(h) { this._set(this.keys.history, h); },
  addHistory(jobId, action, from, to) {
    const history = this.getHistory();
    history.unshift({
      id: 'h_' + Date.now(),
      jobId,
      action,
      from,
      to,
      timestamp: new Date().toISOString()
    });
    this.saveHistory(history);
  },
  getJobHistory(jobId) {
    return this.getHistory().filter(h => h.jobId === jobId);
  },

  // Profile
  getProfile() {
    return this._get(this.keys.profile, {
      name: '',
      email: '',
      phone: '',
      title: '',
      skills: [],
      experience: [],
      education: [],
      industry: '',
      greetingStyle: 'formal',
      signOff: 'Best regards',
    });
  },
  saveProfile(p) { this._set(this.keys.profile, p); },

  // Settings
  getSettings() {
    return this._get(this.keys.settings, {
      theme: 'light',
      remindersEnabled: true,
      defaultView: 'dashboard',
      itemsPerPage: 25,
      geminiKey: '',
      geminiModel: 'gemini-1.5-flash',
      aiEnabled: false,
    });
  },
  saveSettings(s) { this._set(this.keys.settings, s); },

  // Generated Content
  getGeneratedContent() { return this._get(this.keys.generatedContent, []); },
  saveGeneratedContent(items) { this._set(this.keys.generatedContent, items); },
  addGeneratedContent(item) {
    const items = this.getGeneratedContent();
    item.id = 'gc_' + Date.now();
    item.createdAt = new Date().toISOString();
    items.unshift(item);
    this.saveGeneratedContent(items);
    return item;
  },
  deleteGeneratedContent(id) {
    let items = this.getGeneratedContent();
    items = items.filter(i => i.id !== id);
    this.saveGeneratedContent(items);
  },

  // Skill Feedback
  getSkillFeedback() { return this._get(this.keys.skillFeedback, {}); },
  saveSkillFeedback(fb) { this._set(this.keys.skillFeedback, fb); },
  addSkillFeedback(skillName, contentHash, rating) {
    const fb = this.getSkillFeedback();
    if (!fb[skillName]) fb[skillName] = {};
    fb[skillName][contentHash] = rating;
    this.saveSkillFeedback(fb);
  },
};
