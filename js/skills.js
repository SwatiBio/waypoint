/* === Skills Plugin System === */
const Skills = {
  skills: {},
  pluginData: {},

  init() {
    this.registerSkills();
    this.loadPluginDataAsync();
  },

  getSkillsConfig() {
    return [
      {
        id: 'email-generator',
        name: 'Email Template Generator',
        desc: 'Creates personalized application emails, follow-up emails, and thank you emails based on job details and user profile.',
        icon: 'mail',
      },
      {
        id: 'cover-letter',
        name: 'Cover Letter Generator',
        desc: 'Creates tailored cover letters in multiple versions - formal, casual, creative.',
        icon: 'file-text',
      },
      {
        id: 'resume-optimizer',
        name: 'Resume Keyword Optimizer',
        desc: 'Analyzes job descriptions, suggests keywords to add, provides match score and gap analysis.',
        icon: 'search',
      },
      {
        id: 'interview-prep',
        name: 'Interview Prep Assistant',
        desc: 'Generates role-specific interview questions, sample answers, and research checklist.',
        icon: 'target',
      },
      {
        id: 'career-summary',
        name: 'Career Summary Generator',
        desc: 'Creates professional resume summaries in multiple versions based on experience and target role.',
        icon: 'star',
      },
    ];
  },

  registerSkills() {
    this.getSkillsConfig().forEach(config => {
      this.skills[config.id] = { config, generate: null };
      this.tryLoadSkill(config.id);
    });
  },

  tryLoadSkill(skillId) {
    const generator = this.getBuiltInGenerator(skillId);
    if (generator) {
      this.skills[skillId].generate = generator;
    }
  },

  async loadPluginDataAsync() {
    for (const config of this.getSkillsConfig()) {
      try {
        const resp = await fetch(`js/skills/${config.id}/data.js`);
        const text = await resp.text();
        const data = JSON.parse(text);
        this.pluginData[config.id] = data;
      } catch (e) {
        this.pluginData[config.id] = null;
      }
    }
  },

  getPluginData(skillId) {
    return this.pluginData[skillId] || null;
  },

  getQuestions(skillId) {
    const plugin = this.pluginData[skillId];
    if (plugin && plugin.questions) return plugin.questions;
    return this.getDefaultQuestions(skillId);
  },

  getDefaultQuestions(skillId) {
    const defaults = {
      'email-generator': [
        { key: 'tone', label: 'Email Tone', type: 'select', options: ['Formal', 'Casual', 'Creative'], default: 'Formal' },
        { key: 'includeSalary', label: 'Include salary expectations?', type: 'checkbox', default: false },
        { key: 'focusArea', label: 'Primary focus', type: 'select', options: ['Skills', 'Experience', 'Mixed'], default: 'Mixed' },
      ],
      'cover-letter': [
        { key: 'tone', label: 'Cover Letter Tone', type: 'select', options: ['Formal', 'Casual', 'Creative'], default: 'Formal' },
        { key: 'length', label: 'Length', type: 'select', options: ['Short', 'Medium', 'Detailed'], default: 'Medium' },
        { key: 'highlightSkill', label: 'Skill to emphasize (optional)', type: 'text', default: '' },
      ],
      'resume-optimizer': [
        { key: 'focusArea', label: 'Focus area', type: 'select', options: ['Technical', 'Soft Skills', 'Both'], default: 'Both' },
        { key: 'minScore', label: 'Minimum match score (%)', type: 'range', min: 0, max: 100, step: 10, default: 50 },
      ],
      'interview-prep': [
        { key: 'interviewType', label: 'Interview type', type: 'select', options: ['Phone Screen', 'Technical', 'Behavioral', 'Full Prep'], default: 'Full Prep' },
        { key: 'difficulty', label: 'Difficulty', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },
        { key: 'numQuestions', label: 'Number of questions', type: 'select', options: ['5', '8', '10'], default: '10' },
      ],
      'career-summary': [
        { key: 'style', label: 'Style', type: 'select', options: ['Standard', 'Impact-Focused', 'Technical', 'Executive'], default: 'Standard' },
        { key: 'focus', label: 'Emphasize', type: 'select', options: ['Skills', 'Experience', 'Achievements', 'Balanced'], default: 'Balanced' },
        { key: 'length', label: 'Length', type: 'select', options: ['Brief', 'Short', 'Detailed'], default: 'Short' },
      ],
    };
    return defaults[skillId] || [];
  },

  renderList() {
    const container = document.getElementById('skills-container');
    const configs = this.getSkillsConfig();
    const settings = DB.getSettings();

    container.innerHTML = `
      <div class="flex justify-between items-center" style="margin-bottom:16px">
        <div>
          <p class="text-muted text-sm">Select a job and configure each skill to generate personalized content.</p>
        </div>
        <button class="btn btn-secondary" id="skills-ai-btn">${icon('zap', 16)} ${settings.aiEnabled && settings.geminiKey ? 'AI Active' : 'Add AI Integration'}</button>
      </div>
      ${configs.map(s => `
      <div class="skill-card" data-skill-id="${s.id}">
        <div class="skill-card-header">
          <h3>${icon(s.icon, 18)} ${s.name}</h3>
        </div>
        <p>${s.desc}</p>
        <div class="skill-meta">Choose a job to generate content</div>
        <div class="flex gap-8" style="margin-bottom:8px">
          <select class="skill-job-select" style="flex:1">
            <option value="">-- Select a job --</option>
            ${DB.getJobs().map(j => `<option value="${j.id}">${UI.escapeHtml(j.company)} - ${UI.escapeHtml(j.position)}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary skill-generate-btn" data-skill-id="${s.id}">${icon('zap', 16)} Generate</button>
        <div class="skill-output" style="display:none;margin-top:12px"></div>
      </div>
  `).join('')}
`;

    container.querySelectorAll('.skill-generate-btn').forEach(btn => {
      btn.addEventListener('click', () => this.handleGenerate(btn.dataset.skillId));
    });

    document.getElementById('skills-ai-btn').addEventListener('click', () => {
      App.switchView('settings');
      setTimeout(() => {
        const aiSection = document.querySelector('#settings-container .settings-section:last-child');
        if (aiSection) aiSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    });

    document.getElementById('view-title').textContent = 'Skills';
  },

  async handleGenerate(skillId) {
    const card = document.querySelector(`.skill-card[data-skill-id="${skillId}"]`);
    const select = card.querySelector('.skill-job-select');
    const jobId = select.value;
    const outputEl = card.querySelector('.skill-output');

    if (!jobId) {
      outputEl.style.display = 'block';
      outputEl.innerHTML = '<p style="color:var(--danger)">Please select a job first.</p>';
      return;
    }

    const job = DB.getJob(jobId);
    if (!job) {
      outputEl.style.display = 'block';
      outputEl.innerHTML = '<p style="color:var(--danger)">Job not found.</p>';
      return;
    }

    const profile = DB.getProfile();
    const config = await this.showWizard(skillId);
    if (!config) return;

    outputEl.style.display = 'block';
    outputEl.innerHTML = '<p style="color:var(--text-muted);padding:12px">Generating...</p>';

    const skill = this.skills[skillId];
    if (!skill || !skill.generate) {
      outputEl.innerHTML = '<p style="color:var(--danger)">Skill generator not available.</p>';
      return;
    }

    try {
      const result = await skill.generate(job, profile, config);
      this.displayOutput(outputEl, skillId, job, result);
    } catch (e) {
      outputEl.innerHTML = `<p style="color:var(--danger)">Error: ${e.message}</p>`;
    }
  },

  showWizard(skillId) {
    return new Promise((resolve) => {
      const questions = this.getQuestions(skillId);
      if (!questions || !questions.length) {
        resolve({});
        return;
      }

      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay active';

      const fieldsHtml = questions.map(q => {
        if (q.type === 'select') {
          const options = q.options.map(o =>
            `<option value="${o}" ${o === q.default ? 'selected' : ''}>${o}</option>`
          ).join('');
          return `<div class="form-group"><label>${q.label}</label><select class="wizard-field" data-key="${q.key}">${options}</select></div>`;
        } else if (q.type === 'checkbox') {
          return `<div class="form-group"><label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" class="wizard-field" data-key="${q.key}" ${q.default ? 'checked' : ''} /> ${q.label}</label></div>`;
        } else if (q.type === 'text') {
          return `<div class="form-group"><label>${q.label}</label><input type="text" class="wizard-field" data-key="${q.key}" value="${q.default || ''}" placeholder="${q.label}" /></div>`;
        } else if (q.type === 'range') {
          return `<div class="form-group"><label>${q.label}: <strong class="range-val" data-key="${q.key}">${q.default}</strong></label><input type="range" class="wizard-field" data-key="${q.key}" min="${q.min}" max="${q.max}" step="${q.step}" value="${q.default}" /></div>`;
        }
        return '';
      }).join('');

      overlay.innerHTML = `
        <div class="modal">
          <div class="modal-header">
            <h3>${icon('zap', 18)} Configure ${this.getSkillsConfig().find(s => s.id === skillId)?.name || 'Skill'}</h3>
          </div>
          <div class="modal-body">
            <p style="margin-bottom:12px;color:var(--text-muted)">Customize the output before generating:</p>
            ${fieldsHtml}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="wizard-cancel">Cancel</button>
            <button class="btn btn-primary" id="wizard-generate">${icon('zap', 16)} Generate</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      overlay.querySelectorAll('input[type="range"]').forEach(slider => {
        slider.addEventListener('input', () => {
          const val = overlay.querySelector(`.range-val[data-key="${slider.dataset.key}"]`);
          if (val) val.textContent = slider.value;
        });
      });

      overlay.querySelector('#wizard-generate').onclick = () => {
        const config = {};
        overlay.querySelectorAll('.wizard-field').forEach(f => {
          if (f.type === 'checkbox') config[f.dataset.key] = f.checked;
          else if (f.type === 'range') config[f.dataset.key] = parseInt(f.value);
          else config[f.dataset.key] = f.value;
        });
        overlay.remove();
        resolve(config);
      };

      overlay.querySelector('#wizard-cancel').onclick = () => {
        overlay.remove();
        resolve(null);
      };
    });
  },

  displayOutput(outputEl, skillId, job, result) {
    outputEl.style.display = 'block';

    const versions = Array.isArray(result) ? result : [result];
    const hash = btoa(unescape(encodeURIComponent(versions[0].content))).slice(0, 20);
    const feedback = DB.getSkillFeedback();
    const existingFeedback = feedback[skillId] || {};

    outputEl.innerHTML = versions.map((v, i) => `
      <div style="margin-bottom:12px;padding:12px;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:var(--radius-md)">
        <div class="flex justify-between items-center" style="margin-bottom:6px">
          <strong style="font-size:13px">${icon('zap', 14)} ${stripEmoji(v.title) || `Version ${i + 1}`}</strong>
          <button class="btn btn-sm btn-secondary copy-content-btn" data-content="${UI.escapeHtml(v.content)}">${icon('copy', 14)} Copy</button>
        </div>
        <div style="font-size:13px;white-space:pre-wrap;background:var(--bg-tertiary);padding:12px;border-radius:var(--radius-sm);max-height:300px;overflow-y:auto">${UI.escapeHtml(v.content)}</div>
        <div class="flex justify-between items-center mt-8">
          <div class="feedback-btns">
            <button class="feedback-btn ${existingFeedback[hash] === 'up' ? 'active' : ''}" data-rating="up" title="Helpful">${icon('thumb-up', 16)}</button>
            <button class="feedback-btn ${existingFeedback[hash] === 'down' ? 'active' : ''}" data-rating="down" title="Not helpful">${icon('thumb-down', 16)}</button>
          </div>
        </div>
      </div>
    `).join('');

    versions.forEach(v => {
      DB.addGeneratedContent({
        skillId,
        skillName: this.getSkillsConfig().find(s => s.id === skillId)?.name || skillId,
        jobId: job.id,
        jobCompany: job.company,
        jobPosition: job.position,
        title: v.title || '',
        content: v.content,
      });
    });

    outputEl.querySelectorAll('.copy-content-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.content).then(() => {
          UI.showToast('Copied to clipboard!', 'success');
        }).catch(() => {
          const ta = document.createElement('textarea');
          ta.value = btn.dataset.content;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
          UI.showToast('Copied to clipboard!', 'success');
        });
      });
    });

    outputEl.querySelectorAll('.feedback-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const rating = btn.dataset.rating;
        const parent = btn.closest('.feedback-btns');
        parent.querySelectorAll('.feedback-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        DB.addSkillFeedback(skillId, hash, rating);
        UI.showToast('Thanks for your feedback!', 'success');
      });
    });
  },

  // === AI Integration ===

  async callGemini(prompt) {
    const settings = DB.getSettings();
    if (!settings.aiEnabled || !settings.geminiKey) return null;
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.geminiModel || 'gemini-1.5-flash'}:generateContent?key=${settings.geminiKey}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch {
      return null;
    }
  },

  getBuiltInGenerator(skillId) {
    const generators = {
      'email-generator': async (job, profile, config) => this.generateWithFallback(
        'email-generator', () => this.generateEmail(job, profile, config || {}), job, profile, config
      ),
      'cover-letter': async (job, profile, config) => this.generateWithFallback(
        'cover-letter', () => this.generateCoverLetter(job, profile, config || {}), job, profile, config
      ),
      'resume-optimizer': async (job, profile, config) => this.generateWithFallback(
        'resume-optimizer', () => this.generateResumeOptimizer(job, profile, config || {}), job, profile, config
      ),
      'interview-prep': async (job, profile, config) => this.generateWithFallback(
        'interview-prep', () => this.generateInterviewPrep(job, profile, config || {}), job, profile, config
      ),
      'career-summary': async (job, profile, config) => this.generateWithFallback(
        'career-summary', () => this.generateCareerSummary(job, profile, config || {}), job, profile, config
      ),
    };
    return generators[skillId] || null;
  },

  async generateWithFallback(skillId, fallbackFn, job, profile, config) {
    const prompt = this.buildPrompt(skillId, job, profile, config);
    const aiResult = await this.callGemini(prompt);
    if (aiResult) {
      DB.addGeneratedContent({
        skillId,
        skillName: this.getSkillsConfig().find(s => s.id === skillId)?.name || skillId,
        jobId: job.id,
        jobCompany: job.company,
        jobPosition: job.position,
        title: `AI-Generated (Gemini)`,
        content: aiResult,
      });
      return [{ title: `AI-Generated Content`, content: aiResult }];
    }
    return await fallbackFn();
  },

  buildPrompt(skillId, job, profile, config) {
    const configStr = Object.entries(config || {}).map(([k, v]) => `  ${k}: ${v}`).join('\n');
    const prompts = {
      'email-generator': `You are a professional job application email writer. Generate 3 emails for the job application:
1. Application Email (submission)
2. Follow-Up Email (after submitting)
3. Thank You Email (after interview)

Job: ${job.position} at ${job.company}
Company: ${job.company}
Position: ${job.position}
Date applied: ${job.date}

Candidate Profile:
  Name: ${profile.name || 'N/A'}
  Title: ${profile.title || 'N/A'}
  Skills: ${(profile.skills || []).join(', ') || 'N/A'}
  Experience: ${(profile.experience || []).join('; ') || 'N/A'}
  Greeting style: ${profile.greetingStyle || 'formal'}
  Sign-off: ${profile.signOff || 'Best regards'}

Configuration:
${configStr}

Write in a professional tone. Use real placeholders like the candidate's name. Format each email with a clear subject line and body. Separate each email with "---".`,

      'cover-letter': `Write a ${config.tone || 'professional'} cover letter for:

Position: ${job.position}
Company: ${job.company}
Length: ${config.length || 'medium'}
${config.highlightSkill ? `Emphasize skill: ${config.highlightSkill}` : ''}

Candidate: ${profile.name || 'N/A'}
Title: ${profile.title || 'N/A'}
Skills: ${(profile.skills || []).join(', ') || 'N/A'}
Experience: ${(profile.experience || []).join('; ') || 'N/A'}
Education: ${(profile.education || []).join(', ') || 'N/A'}
${config.includeEducation !== false && profile.education?.length ? 'Include education.' : 'Do not include education.'}

Write a complete, ready-to-use cover letter. Use the candidate's real name and details. Format with proper letter structure.`,

      'resume-optimizer': `You are a resume optimization expert. Analyze the following job match:

Job: ${job.position} at ${job.company}
Job details: ${job.notes || 'N/A'}
Candidate Title: ${profile.title || 'N/A'}
Candidate Skills: ${(profile.skills || []).join(', ') || 'N/A'}
Candidate Experience: ${(profile.experience || []).join('; ') || 'N/A'}

Focus area: ${config.focusArea || 'Both'}
Minimum match score target: ${config.minScore || 50}%

Provide:
1. Keyword Match Analysis — which keywords from the job description match the resume, which are missing, match score %
2. Skills Gap Analysis — categorize skills as technical/soft/domain, show match rates
3. Recommendations — specific suggestions to improve the resume for this job
4. Quick Wins — 3-5 immediate actions
5. Action verbs to use

Be specific and actionable.`,

      'interview-prep': `You are an interview preparation coach. Prepare an interview prep guide for:

Position: ${job.position} at ${job.company}
Job level: ${this.detectJobLevel(job)}
Job type: ${this.detectJobType(job)}
Interview type: ${config.interviewType || 'Full Prep'}
Difficulty: ${config.difficulty || 'Intermediate'}
Number of questions: ${config.numQuestions || 10}

Candidate: ${profile.name || 'N/A'}
Title: ${profile.title || 'N/A'}
Skills: ${(profile.skills || []).join(', ') || 'N/A'}
Experience: ${(profile.experience || []).join('; ') || 'N/A'}

Provide:
1. Interview questions grouped by category (general, technical, behavioral, role-specific)
2. Sample answers and talking points
3. Research checklist
4. Questions for the candidate to ask the interviewer

Tailor to the job level (${this.detectJobLevel(job)}), type (${this.detectJobType(job)}), and difficulty.`,

      'career-summary': `Write a career summary for a job application. 

Target role: ${job.position}
Target company: ${job.company}
Style: ${config.style || 'Standard'}
Focus: ${config.focus || 'Balanced'}
Length: ${config.length || 'Short'}

Candidate: ${profile.name || 'N/A'}
Current title: ${profile.title || 'N/A'}
Skills: ${(profile.skills || []).join(', ') || 'N/A'}
Experience: ${(profile.experience || []).join('; ') || 'N/A'}
Education: ${(profile.education || []).join(', ') || 'N/A'}

Write a compelling professional summary that highlights the candidate's fit for the target role. Use their real details. Keep it concise and impactful.`,
    };
    return prompts[skillId] || `Generate content for ${skillId} using this context:\nJob: ${job.position} at ${job.company}\nCandidate: ${profile.name || 'N/A'}\n${configStr}`;
  },

  // === Email Generator ===

  async generateEmail(job, profile, config) {
    const tone = config.tone || 'Formal';
    const includeSalary = config.includeSalary || false;
    const focusArea = config.focusArea || 'Mixed';
    const greeting = profile.greetingStyle === 'casual' ? 'Hi' :
      profile.greetingStyle === 'creative' ? 'Hello' : 'Dear';
    const signOff = profile.signOff || 'Best regards';
    const name = profile.name || '[Your Name]';
    const email = profile.email || '[Your Email]';
    const phone = profile.phone || '[Your Phone]';
    const company = job.company;
    const position = job.position;

    const focusLine = focusArea === 'Skills'
      ? `With my background in ${(profile.skills || []).slice(0, 4).join(', ')}, I am confident that my expertise aligns well with what your team is looking for.`
      : focusArea === 'Experience'
        ? `Having spent ${(profile.experience || []).length || 1} years building a track record of success, I am eager to bring my experience to ${company}.`
        : `With my background in ${(profile.skills || []).slice(0, 3).join(', ')}, combined with ${(profile.experience || []).length || 'relevant'} years of professional experience, I am confident in my ability to contribute to ${company}'s success.`;

    const salaryLine = includeSalary ? `\n\nSalary expectation: Competitive and negotiable based on role responsibilities.` : '';

    const applicationEmail = {
      title: `Application Email (${tone})`,
      content: `${greeting} Hiring Team at ${company},

I am writing to express my strong interest in the ${position} position at ${company}.

${focusLine}
${salaryLine}

I have attached my resume and would welcome the opportunity to discuss how my experience can contribute to ${company}'s success.

Thank you for your time and consideration.

${signOff},
${name}
${email} | ${phone}`
    };

    const followUpEmail = {
      title: `Follow-Up Email (${tone})`,
      content: `${greeting} Hiring Team at ${company},

I hope this message finds you well. I wanted to follow up on my application for the ${position} position, submitted on ${UI.formatDate(job.date)}.

I remain very enthusiastic about the opportunity to join ${company} and would love to hear if there are any updates on the hiring process.

Please let me know if you need any additional information from my end.

${signOff},
${name}
${email} | ${phone}`
    };

    const thanksName = job.contact || profile.name || '[Interviewer Name]';
    const thankYouEmail = {
      title: `Thank You Email (${tone})`,
      content: `${greeting} ${thanksName},

Thank you so much for taking the time to speak with me today about the ${position} position at ${company}.

I really enjoyed learning more about the team's work and I am even more excited about the opportunity to contribute to ${company}'s goals.

Please feel free to reach out if you need any additional information.

${signOff},
${name}
${email} | ${phone}`
    };

    return [applicationEmail, followUpEmail, thankYouEmail];
  },

  // === Cover Letter Generator ===

  async generateCoverLetter(job, profile, config) {
    const tone = config.tone || 'Formal';
    const length = config.length || 'Medium';
    const highlightSkill = config.highlightSkill || '';
    const includeEducation = config.includeEducation !== false;
    const name = profile.name || '[Your Name]';
    const title = profile.title || '[Your Title]';
    const skills = (profile.skills || []).join(', ');
    const experience = (profile.experience || []).join('\n- ');
    const company = job.company;
    const position = job.position;
    const edu = (profile.education || []).join(', ');
    const email = profile.email || '[Your Email]';
    const phone = profile.phone || '[Your Phone]';
    const hasSkills = (profile.skills || []).length > 0;

    const skillEmphasis = highlightSkill
      ? `, particularly ${highlightSkill}`
      : '';

    const eduSection = includeEducation && edu
      ? `\nMy educational background in ${edu} has provided me with a solid foundation to excel in this role.`
      : '';

    const bodyLength = length === 'Short'
      ? `${hasSkills ? `With expertise in ${skills}${skillEmphasis}` : `With ${(profile.experience || []).length || 1} years of professional experience`}, I am well-prepared to contribute to ${company} as a ${position}. I would welcome the opportunity to discuss how I can help your team succeed.`
      : length === 'Detailed'
        ? `${hasSkills ? `My expertise spans ${skills}${skillEmphasis}, allowing me to hit the ground running.` : `Throughout my career, I have delivered measurable results across ${(profile.experience || []).length || 'multiple'} roles.`}\n\n${experience ? `Key highlights include:\n- ${experience}` : ''}${eduSection}\n\nI am confident that my combination of skills, experience, and drive makes me an ideal candidate for this role.`
        : `${hasSkills ? `With a strong foundation in ${skills}${skillEmphasis}` : `With a proven track record across ${(profile.experience || []).length || 'multiple'} roles`}, I am excited about the opportunity to contribute to ${company} as a ${position}.${experience ? `\n\nHighlights:\n- ${experience}` : ''}${eduSection}`;

    const formal = {
      title: 'Formal Cover Letter',
      content: `Dear Hiring Manager,

RE: Application for ${position} Position

I am writing to formally apply for the ${position} position at ${company}. With a proven track record in ${title} and expertise in ${skills}${skillEmphasis}, I am confident in my ability to contribute effectively to your organization.

${bodyLength}

I would welcome the opportunity to discuss how my skills and experience align with ${company}'s goals. Thank you for your consideration.

Yours sincerely,
${name}
${email || profile.email || '[Email]'} | ${phone || profile.phone || '[Phone]'}`
    };

    const casual = {
      title: 'Casual Cover Letter',
      content: `Hi there,

I came across the ${position} opening at ${company} and I couldn't be more excited to throw my hat in the ring!

I've been working as a ${title} and have built up skills in ${skills}${skillEmphasis} that I think would be a great match for what you're building at ${company}.

${experience ? `A few things I've done recently:\n- ${experience}` : ''}${eduSection}

I'd love to chat about how I can help the team at ${company} grow and succeed. Let me know if you'd like to connect!

Cheers,
${name}
[Email] | [Phone]`
    };

    const creative = {
      title: 'Creative Cover Letter',
      content: `To the ${company} Team,

Some opportunities feel like they were made for you. The ${position} role at ${company} is one of them.

I've spent my career as a ${title}, mastering ${skills}${skillEmphasis} and pushing boundaries. I don't just fill a role — I bring energy, ideas, and a commitment to excellence.

${experience ? `Here's what I've been up to:\n* ${experience.replace(/\n- /g, '\n* ')}` : ''}${eduSection ? `\n\nI studied ${edu}, but my real education has been on the job, solving real problems for real users.` : ''}

I'd love to show you what I can bring to ${company}. Let's talk!

Onwards and upwards,
${name}
[Email] | [Phone]`
    };

    const versions = [formal];
    if (tone === 'Formal' || tone === 'Executive') {
      if (tone === 'Executive') {
        versions[0] = {
          title: 'Executive Cover Letter',
          content: `Dear ${company} Leadership Team,

RE: ${position} — Strategic Contribution

I am writing to express my strong interest in the ${position} opportunity at ${company}. With ${(profile.experience || []).length || 1}+ years of strategic leadership and a deep focus on ${skills}${skillEmphasis}, I am eager to drive impact at ${company}.

${bodyLength}

I look forward to discussing how my leadership approach and track record can support ${company}'s strategic objectives.

Respectfully,
${name}
${email || profile.email || '[Email]'} | ${phone || profile.phone || '[Phone]'}`
        };
      }
    } else {
      versions.push(casual);
      if (tone === 'Creative') versions.push(creative);
    }

    return versions;
  },

  // === Resume Optimizer ===

  async generateResumeOptimizer(job, profile, config) {
    const focusArea = config.focusArea || 'Both';
    const minScore = config.minScore || 50;
    const jobSkills = this.extractJobSkills(job);
    const userSkills = (profile.skills || []).map(s => s.toLowerCase().trim());
    const company = job.company;
    const position = job.position;

    let filteredSkills = jobSkills;
    if (focusArea === 'Technical') {
      const tech = ['JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'AWS', 'Docker', 'API', 'Kubernetes', 'Git', 'Microservices'];
      filteredSkills = jobSkills.filter(s => tech.some(t => s.toLowerCase().includes(t.toLowerCase())));
    } else if (focusArea === 'Soft Skills') {
      const soft = ['Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Agile', 'Scrum', 'Mentoring'];
      filteredSkills = jobSkills.filter(s => soft.some(t => s.toLowerCase().includes(t.toLowerCase())));
    }

    const matched = [];
    const missing = [];
    filteredSkills.forEach(s => {
      if (userSkills.some(us => us.includes(s.toLowerCase()) || s.toLowerCase().includes(us))) {
        matched.push(s);
      } else {
        missing.push(s);
      }
    });

    const matchScore = filteredSkills.length ? Math.round((matched.length / filteredSkills.length) * 100) : 0;

    const actionVerbs = ['Achieved', 'Built', 'Delivered', 'Designed', 'Developed', 'Improved', 'Implemented', 'Launched', 'Led', 'Optimized', 'Scaled', 'Spearheaded', 'Streamlined', 'Transformed'];
    const actionVerbLines = missing.length > 0 && matchScore < minScore
      ? `\nACTION VERBS TO USE WITH MISSING KEYWORDS:\n${missing.slice(0, 5).map(s => `  • ${actionVerbs[Math.floor(Math.random() * actionVerbs.length)]} — demonstrated through ${s.toLowerCase()}`).join('\n')}`
      : '';

    const analysis = {
      title: `Keyword Match Analysis for ${position} at ${company}`,
      content: `MATCH SCORE: ${matchScore}% (${matched.length}/${filteredSkills.length} keywords matched)
THRESHOLD: ${minScore}% | ${matchScore >= minScore ? '✓ PASS' : '✗ NEEDS IMPROVEMENT'}

FOCUS AREA: ${focusArea}

✓ MATCHED KEYWORDS (${matched.length}):
${matched.map(s => `  ${s}`).join('\n') || '  None'}

✗ MISSING KEYWORDS — Consider Adding (${missing.length}):
${missing.map(s => `  ${s}`).join('\n') || '  None'}${actionVerbLines}

▸ RECOMMENDATIONS:
${missing.length > 0
    ? `Add the following keywords to your resume to improve your match score:
  - ${missing.slice(0, Math.min(missing.length, 8)).join('\n  - ')}
  ${missing.length > 8 ? `  - ... and ${missing.length - 8} more` : ''}
  Incorporate these terms naturally into your experience descriptions.`
    : 'Your resume keywords are well-aligned with this position!'}

▸ QUICK WINS:
1. Tailor your resume summary to include: ${position}
2. Highlight experience with: ${matched.slice(0, 3).join(', ') || 'relevant technologies'}
3. Add quantifiable achievements related to these keywords
4. Mirror the job description's language in your bullet points`
    };

    const gapAnalysis = {
      title: 'Skills Gap Analysis',
      content: `Position: ${position}
Company: ${company}
Your Role: ${profile.title || 'Not specified'}
Focus Area: ${focusArea}

SKILLS BREAKDOWN:
  Technical Skills: ${this.categorizeSkills(jobSkills, 'technical', userSkills)}
  Soft Skills: ${this.categorizeSkills(jobSkills, 'soft', userSkills)}
  Domain Knowledge: ${this.categorizeSkills(jobSkills, 'domain', userSkills)}

MATCH QUALITY: ${matchScore >= 80 ? '◎ Strong Match' : matchScore >= minScore ? '◉ Partial Match' : '⊗ Weak Match'}

RESUME OPTIMIZATION TIPS:
1. Use action verbs relevant to ${position}
2. Quantify achievements with metrics (%, \$, time saved)
3. ${matchScore < minScore ? `Focus on acquiring/featuring: ${missing.slice(0, 4).join(', ')}` : 'Your profile aligns well — highlight specific accomplishments'}
4. Remove outdated or irrelevant skills to keep focus sharp
5. Add a "Technical Skills" section if not present`
    };

    return [analysis, gapAnalysis];
  },

  extractJobSkills(job) {
    const commonSkills = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'Ruby', 'PHP', 'C#', 'Kotlin', 'Swift', 'Scala',
      'React', 'Angular', 'Vue', 'Svelte', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'FastAPI', 'Rails',
      'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Cassandra', 'DynamoDB', 'Firebase', 'Supabase',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'GitHub Actions', 'Terraform', 'Ansible', 'Jenkins',
      'REST API', 'GraphQL', 'gRPC', 'Microservices', 'Event-Driven', 'Kafka', 'RabbitMQ',
      'Agile', 'Scrum', 'Kanban', 'Jira',
      'Machine Learning', 'AI', 'Data Science', 'Deep Learning', 'NLP', 'Computer Vision', 'TensorFlow', 'PyTorch',
      'Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Mentoring', 'Cross-functional',
      'Unit Testing', 'Integration Testing', 'E2E Testing', 'Jest', 'Cypress', 'Playwright',
      'System Design', 'Architecture', 'Performance Optimization', 'Security', 'Accessibility', 'SEO',
    ];

    const text = `${job.position} ${job.company} ${job.notes || ''} ${job.salary || ''}`.toLowerCase();
    return commonSkills.filter(s => text.includes(s.toLowerCase()));
  },

  categorizeSkills(skills, type, userSkills) {
    const technical = ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'React', 'Node.js', 'SQL', 'AWS', 'Docker', 'API', 'Kubernetes', 'Git', 'MongoDB', 'GraphQL'];
    const soft = ['Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Agile', 'Scrum', 'Mentoring', 'Cross-functional'];
    const filtered = skills.filter(s => {
      if (type === 'technical') return technical.some(t => s.toLowerCase().includes(t.toLowerCase()));
      if (type === 'soft') return soft.some(t => s.toLowerCase().includes(t.toLowerCase()));
      return !technical.some(t => s.toLowerCase().includes(t.toLowerCase())) && !soft.some(t => s.toLowerCase().includes(t.toLowerCase()));
    });
    const matched = filtered.filter(s => userSkills.some(us => us.includes(s.toLowerCase())));
    const total = filtered.length || 1;
    return `${matched.length}/${total} matched (${Math.round(matched.length / total * 100)}%)`;
  },

  // === Interview Prep ===

  async generateInterviewPrep(job, profile, config) {
    const interviewType = config.interviewType || 'Full Prep';
    const difficulty = config.difficulty || 'Intermediate';
    const numQuestions = parseInt(config.numQuestions) || 10;
    const includeAnswers = config.includeAnswers !== false;
    const level = this.detectJobLevel(job);
    const type = this.detectJobType(job);
    const company = job.company;
    const position = job.position;

    const isDifficult = difficulty === 'Advanced';
    const easyQualifier = isDifficult ? 'complex, real-world' : 'core';
    const technicalDepth = isDifficult ? 'deep system design and architecture tradeoffs' : 'fundamental concepts and practical application';

    const genCount = { general: 2, technical: Math.min(Math.ceil(numQuestions * 0.35), 5), behavioral: Math.min(Math.ceil(numQuestions * 0.25), 4), role: Math.min(Math.ceil(numQuestions * 0.2), 3) };
    genCount.general = Math.max(1, numQuestions - genCount.technical - genCount.behavioral - genCount.role);

    const difficultyLabel = isDifficult ? 'Advanced' : difficulty === 'Beginner' ? 'Entry-Level' : 'Intermediate';

    const typeLabel = interviewType === 'Full Prep'
      ? `${difficultyLabel} ${level} ${type} Interview`
      : `${difficultyLabel} ${level} ${type} ${interviewType}`;

    const questionsDoc = {
      title: `${typeLabel} Questions for ${position}`,
      content: `ROLE: ${position} at ${company}
LEVEL: ${level} | TYPE: ${type} | DIFFICULTY: ${difficultyLabel} | FOCUS: ${interviewType}

─────────────────────
GENERAL QUESTIONS (${genCount.general})
─────────────────────
1. Tell me about yourself and your experience with ${type} development.
2. Why are you interested in working at ${company}?
3. Describe a challenging project you worked on and how you overcame obstacles.
${genCount.general > 3 ? `4. What do you know about our product/service and how would you improve it?\n5. Where do you see yourself in 3-5 years and how does this role fit into that path?` : ''}

─────────────────────
${interviewType === 'Behavioral' ? 'BEHAVIORAL' : interviewType === 'Technical' ? 'TECHNICAL' : 'TECHNICAL'} QUESTIONS (${genCount.technical})
─────────────────────
${level === 'Junior'
    ? `${genCount.technical >= 1 ? `4. Explain the difference between key ${easyQualifier} concepts in ${type}.\n` : ''}${genCount.technical >= 2 ? `5. Walk me through how you would approach building a ${easyQualifier} feature for ${type}.\n` : ''}${genCount.technical >= 3 ? `6. What version control workflows are you familiar with?\n` : ''}${genCount.technical >= 4 ? `7. How do you ensure code quality and what tools do you use?\n` : ''}${genCount.technical >= 5 ? `8. Explain ${technicalDepth} as it relates to ${type}.\n` : ''}`
    : `${genCount.technical >= 1 ? `4. Design a system for a scalable ${type} feature — what tradeoffs would you consider?\n` : ''}${genCount.technical >= 2 ? `5. How would you optimize ${type} performance at scale?\n` : ''}${genCount.technical >= 3 ? `6. Describe a time you led a technical initiative or mentored other developers.\n` : ''}${genCount.technical >= 4 ? `7. How do you approach technical debt and refactoring decisions?\n` : ''}${genCount.technical >= 5 ? `8. Walk through your approach to ${technicalDepth} for a ${type} system.\n` : ''}`}

─────────────────────
${interviewType === 'Technical' ? 'ADDITIONAL TECHNICAL' : interviewType === 'System Design' ? 'SYSTEM DESIGN' : 'BEHAVIORAL'} QUESTIONS (${genCount.behavioral})
─────────────────────
${genCount.behavioral >= 1 ? `9. Tell me about a time you had a disagreement with a teammate. How was it resolved?\n` : ''}${genCount.behavioral >= 2 ? `10. Describe a situation where you had to learn a new technology quickly.\n` : ''}${genCount.behavioral >= 3 ? `11. Give an example of a goal you achieved and the steps you took to reach it.\n` : ''}${genCount.behavioral >= 4 ? `12. How do you handle feedback and criticism in a professional setting?\n` : ''}

─────────────────────
${company.toLowerCase().includes('startup') || interviewType === 'Phone Screen'
    ? `COMPANY-SPECIFIC (Startup Environment)\n13. How do you handle ambiguity and changing priorities?\n14. What experience do you have wearing multiple hats?\n15. How do you balance speed vs quality in a fast-paced environment?`
    : `COMPANY-SPECIFIC (Enterprise Environment)\n13. How do you navigate cross-team collaboration and stakeholders?\n14. Describe your experience with compliance or regulatory requirements.\n15. How do you drive initiatives across multiple teams or departments?`}

─────────────────────
RESEARCH CHECKLIST
─────────────────────
□ Review ${company}'s product/service and recent news
□ Research the interviewers on LinkedIn
□ Prepare 3 thoughtful questions about the role and team
□ Review ${type} fundamentals and best practices
□ Prepare examples of your impact with metrics
□ Practice your pitch tailored to ${position}`
    };

    const outputs = [questionsDoc];

    if (includeAnswers) {
      const talkingDoc = {
        title: 'Sample Answers & Talking Points',
        content: `TALKING POINTS FOR ${position} AT ${company}
INTERVIEW TYPE: ${interviewType} | DIFFICULTY: ${difficultyLabel}

─────────────────────
YOUR INTRODUCTION (30-60 seconds)
─────────────────────
"Hi, I'm ${profile.name || '[Your Name]'}. I'm a ${profile.title || '[Your Title]'} with experience in ${(profile.skills || []).slice(0, 3).join(', ')}. I'm particularly excited about ${company} because [reason related to company mission/product]. I believe my background in [key strength] makes me a great fit for this ${position} role."

─────────────────────
YOUR EXPERIENCE PITCH (STAR Method)
─────────────────────
Focus on: Situation → Task → Action → Result
${(profile.experience || []).map((e, i) => `
Example ${i + 1}:
• Situation: [Context — project, team, timeline]
• Task: [Your specific responsibility]
• Action: [What you did — be specific about ${type} tools and methods]
• Result: [Quantifiable outcome — e.g., "Improved performance by 30%, saving 100h/month"]
`).join('\n') || '\n[Add your key accomplishments here with measurable results]'}

─────────────────────
${profile.skills?.length ? `SKILLS TO HIGHLIGHT\n${(profile.skills || []).slice(0, 6).map(s => `• ${s}: Prepare a specific example or metric`).join('\n')}` : ''}

─────────────────────
QUESTIONS TO ASK THEM (prepare 3-5)
─────────────────────
1. "What does success look like for this role in the first 90 days?"
2. "What are the biggest challenges the team is facing right now?"
3. "How does the team approach [relevant methodology]?"
4. "What opportunities for growth and learning does the company offer?"
5. "Can you describe the team culture and how decisions are made?"

─────────────────────
NEXT STEPS
─────────────────────
□ Send thank-you email within 24 hours
□ Connect with interviewers on LinkedIn
□ Note any follow-up topics or questions for next round
□ Add interview notes to ${company} job tracker entry`
      };
      outputs.push(talkingDoc);
    }

    return outputs;
  },

  detectJobLevel(job) {
    const text = `${job.position} ${job.notes || ''}`.toLowerCase();
    if (text.includes('junior') || text.includes('jr') || text.includes('entry') || text.includes('associate')) return 'Junior';
    if (text.includes('senior') || text.includes('sr') || text.includes('lead') || text.includes('principal') || text.includes('staff')) return 'Senior';
    if (text.includes('mid') || text.includes('intermediate')) return 'Mid-Level';
    return 'Mid-Level';
  },

  detectJobType(job) {
    const text = `${job.position} ${job.notes || ''}`.toLowerCase();
    if (text.includes('frontend') || text.includes('front-end') || text.includes('ui') || text.includes('react') || text.includes('angular') || text.includes('vue')) return 'Frontend';
    if (text.includes('backend') || text.includes('back-end') || text.includes('api') || text.includes('server') || text.includes('database')) return 'Backend';
    if (text.includes('fullstack') || text.includes('full-stack') || text.includes('full stack')) return 'Fullstack';
    if (text.includes('data') || text.includes('machine learning') || text.includes('ml') || text.includes('ai')) return 'Data/ML';
    if (text.includes('devops') || text.includes('infrastructure') || text.includes('sre')) return 'DevOps';
    if (text.includes('design') || text.includes('ux') || text.includes('product')) return 'Design/Product';
    if (text.includes('manager') || text.includes('management')) return 'Management';
    if (text.includes('finance') || text.includes('accounting') || text.includes('analyst')) return 'Finance';
    return 'General';
  },

  // === Career Summary ===

  async generateCareerSummary(job, profile, config) {
    const style = config.style || 'Standard';
    const focus = config.focus || 'Balanced';
    const length = config.length || 'Short';
    const includeContact = config.includeContact || false;
    const name = profile.name || '[Your Name]';
    const title = profile.title || '[Your Title]';
    const skills = (profile.skills || []).join(', ');
    const experienceList = profile.experience || [];
    const years = experienceList.length || 3;
    const targetTitle = job.position;
    const company = job.company;

    const allExperience = experienceList.map((e, i) => `${i + 1}. ${e}`).join('\n');

    const skillFocus = focus === 'Skills' || focus === 'Balanced'
      ? `Deep expertise in ${(profile.skills || []).slice(0, 5).join(', ')}`
      : '';

    const expFocus = focus === 'Experience' || focus === 'Balanced'
      ? `${years}+ years delivering measurable results`
      : '';

    const achievementFocus = focus === 'Achievements'
      ? `Proven track record of driving impact and delivering quantifiable outcomes`
      : '';

    const space = length === 'Brief' ? 100 : length === 'Short' ? 250 : 400;

    const summarize = (text, maxLen) => text.length > maxLen ? text.slice(0, maxLen - 3) + '...' : text;

    const contactBlock = includeContact ? `\n${name} | ${profile.email || ''} | ${profile.phone || ''}` : '';

    const outputs = [];

    if (style === 'Standard' || style === 'Executive' || style === 'Impact-Focused') {
      outputs.push({
        title: `${style} Summary`,
        content: summarize(`${skillFocus ? skillFocus + '. ' : ''}${expFocus ? expFocus + '. ' : ''}${achievementFocus ? achievementFocus + '. ' : ''}Seeking a ${targetTitle} role at ${company} to drive impact through proven methodologies and collaborative leadership. ${(profile.skills || []).length > 0 ? 'Core competencies include ' + (profile.skills || []).slice(0, 6).join(', ') + '.' : ''}`, space) + contactBlock
      });
    }

    if (style === 'Standard' || style === 'Technical') {
      outputs.push({
        title: 'Technical Summary',
        content: `${name} | ${title}
Target: ${targetTitle} at ${company}

CORE COMPETENCIES:
${(profile.skills || []).map(s => `  • ${s}`).join('\n')}

EXPERIENCE:
${allExperience || '  No experience listed yet'}

PROFESSIONAL PROFILE:
A ${title.toLowerCase()} with expertise in ${(profile.skills || []).slice(0, 3).join(', ')} and a track record of delivering ${targetTitle}-related projects. Combines technical proficiency with strong problem-solving skills.

VALUE PROPOSITION:
Ready to apply ${Math.max(years, 1)}+ years across ${experienceList.length || 1} key role(s) to drive impact as a ${targetTitle}.${contactBlock}`
      });
    }

    if (style === 'Impact-Focused' || style === 'Standard') {
      outputs.push({
        title: 'Impact-Focused Summary',
        content: summarize(`Results-driven ${title.toLowerCase()} with a focus on measurable impact across ${Math.max(years, 1)}+ years.
${experienceList.map(e => `✓ ${e.slice(0, 120)}`).join('\n')}

Skilled in ${(profile.skills || []).slice(0, 4).join(', ') || 'core competencies'}. Bringing a track record of excellence and a collaborative mindset to the ${targetTitle} position at ${company}.${contactBlock}`, space)
      });
    }

    if (style === 'Executive') {
      outputs.push({
        title: 'Executive Summary',
        content: `Visionary ${title.toLowerCase()} with ${Math.max(years, 1)}+ years of strategic leadership and organizational impact.

LEADERSHIP PHILOSOPHY:
Building high-performing teams, driving innovation, and delivering sustainable growth through data-informed decisions and cross-functional collaboration.

STRATEGIC IMPACT:
${experienceList.map((e, i) => `• ${e.slice(0, 100)}`).join('\n') || '• Driving organizational transformation and team scaling'}

TARGET ROLE:
Seeking a ${targetTitle} position at ${company} where I can apply my strategic vision and leadership to drive business outcomes.${contactBlock}`
      });
    }

    if (style === 'Entry-Level') {
      outputs.push({
        title: 'Entry-Level / Early Career Summary',
        content: `Motivated and ambitious professional with ${Math.max(years, 1)} year(s) of relevant experience, seeking to launch a career as a ${targetTitle} at ${company}.

${(profile.education || []).length > 0 ? 'EDUCATION:\n' + (profile.education || []).map(e => `  • ${e}`).join('\n') : ''}

SKILLS:
${(profile.skills || []).map(s => `  • ${s}`).join('\n') || '  Eager to learn and contribute'}

DEMONSTRATED POTENTIAL:
• Quick learner with strong adaptability
• Passion for ${company}'s mission and industry
• Strong foundation in ${(profile.skills || []).slice(0, 3).join(', ') || 'relevant disciplines'}
• Excellent collaboration and communication skills

Ready to bring energy, fresh perspective, and dedication to the ${targetTitle} role.${contactBlock}`
      });
    }

    return outputs.slice(0, 3);
  },
};
