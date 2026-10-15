(function () {
  'use strict';

  const DATA = window.DIAG_DATA;
  const RULES = window.DIAG_RULES;
  const main = document.getElementById('main');
  const headerStatus = document.getElementById('header-status');
  const liveRegion = document.getElementById('live-region');
  const params = new URLSearchParams(window.location.search);
  const allowedSources = ['chairman_ip','qixiao_official','school_visit','conference','direct'];

  function freshState() {
    const sourceParam = params.get('source');
    return {
      version: DATA.version, view: 'home', step: 0, info: {}, answers: {}, reportId: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), completedAt: null,
      meta: { source: allowedSources.includes(sourceParam) ? sourceParam : 'direct', cloudSynced: false }
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(DATA.storageKey);
      if (!raw) return freshState();
      const saved = JSON.parse(raw);
      if (saved.version !== DATA.version) return freshState();
      const base = freshState();
      return { ...base, ...saved, info: { ...base.info, ...(saved.info || {}) }, answers: saved.answers || {}, meta: { ...base.meta, ...(saved.meta || {}) } };
    } catch (error) {
      return freshState();
    }
  }

  let state = loadState();

  function saveState(announce) {
    state.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(DATA.storageKey, JSON.stringify(state));
      if (announce) say('已保存到当前设备');
      updateHeaderStatus();
    } catch (error) {
      headerStatus.textContent = '当前浏览器无法保存进度';
    }
  }

  function say(message) {
    liveRegion.textContent = '';
    window.setTimeout(() => { liveRegion.textContent = message; }, 20);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function answeredCount() {
    return DATA.dimensions.flatMap(d => d.questions).filter(q => {
      const value = state.answers[q.id];
      return q.type === 'multi' ? Array.isArray(value) && value.length > 0 : Boolean(value);
    }).length;
  }

  function updateHeaderStatus() {
    if (state.view === 'assessment') headerStatus.textContent = `已完成 ${answeredCount()} / 30 · 进度自动保存于当前设备`;
    else if (state.view === 'report') headerStatus.textContent = '本地诊断报告';
    else headerStatus.textContent = '';
  }

  function setView(view, step) {
    state.view = view;
    if (typeof step === 'number') state.step = step;
    saveState(false);
    render();
    window.scrollTo({ top: 0, behavior: 'instant' });
    main.focus({ preventScroll: true });
  }

  function formatDate(value) {
    const date = value ? new Date(value) : new Date();
    return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;
  }

  function createReportId() {
    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    let suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    if (window.crypto && crypto.getRandomValues) {
      const bytes = new Uint8Array(3); crypto.getRandomValues(bytes);
      suffix = Array.from(bytes, n => (n % 36).toString(36)).join('').toUpperCase().padEnd(4, 'X').slice(0, 4);
    }
    return `XZ-${ymd}-${suffix}`;
  }

  function renderHome() {
    const count = answeredCount();
    const hasProgress = count > 0 || state.completedAt;
    main.innerHTML = `
      <section class="home shell">
        <div class="home-kicker">学校管理自评工具 · V1.0</div>
        <h1>县域高中升学增长机会诊断</h1>
        <p class="home-subtitle">基于学生结构、培养路径与教学资源的六维自评分析</p>
        <p class="home-intro">本工具通过30道自评题，帮助学校梳理学生分层培养、外语学习、拔尖人才培养、升学指导、教学资源及数据管理等方面的现状，识别值得进一步研究的改进方向。</p>
        <dl class="home-facts" aria-label="测评信息">
          <div><dt>题目数量</dt><dd>30道自评题</dd></div>
          <div><dt>分析框架</dt><dd>六大分析维度</dd></div>
          <div><dt>预计用时</dt><dd>约8—10分钟</dd></div>
        </dl>
        ${hasProgress ? `
          <div class="resume-box">
            <div><strong>${state.completedAt ? '当前设备已保存一份诊断报告' : `当前设备已保存 ${count} 道题的进度`}</strong><span>数据仅保存在本设备浏览器中，未上传云端。</span></div>
            <button class="button button-primary" id="resume">${state.completedAt ? '查看已生成报告' : '继续诊断'}</button>
          </div>
          <button class="button button-secondary" id="start-new">重新开始</button>
        ` : '<button class="button button-primary button-large" id="start">开始诊断</button>'}
        <p class="home-note">本工具为学校管理自评与改进参考，不用于学校排名、高考结果预测或升学率评估。</p>
      </section>`;
    document.getElementById('start')?.addEventListener('click', () => setView('info'));
    document.getElementById('resume')?.addEventListener('click', () => setView(state.completedAt ? 'report' : (state.view === 'info' ? 'info' : 'assessment'), state.step));
    document.getElementById('start-new')?.addEventListener('click', resetAssessment);
  }

  function renderInfo() {
    const info = state.info || {};
    main.innerHTML = `
      <section class="form-page shell-narrow">
        <div class="section-index">诊断准备</div>
        <h1>基本信息</h1>
        <p class="section-lead">以下信息均为选填，用于报告呈现。你可以直接进入测评。本工具不收集学生个人信息。</p>
        <form id="info-form" class="info-form" novalidate>
          <label class="field"><span>学校名称 <em>选填</em></span><input name="schoolName" maxlength="60" value="${escapeHtml(info.schoolName)}" placeholder="例如：××县第一中学"></label>
          <label class="field"><span>学校所在省份 <em>选填</em></span><select name="province"><option value="">请选择</option>${DATA.provinces.map(p => `<option ${info.province === p ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
          <fieldset class="compact-fieldset"><legend>填写人职务 <em>选填</em></legend><div class="choice-grid">${DATA.roles.map(role => `<label class="compact-choice"><input type="radio" name="role" value="${role}" ${info.role === role ? 'checked' : ''}><span>${role}</span></label>`).join('')}</div></fieldset>
          <fieldset class="compact-fieldset"><legend>本次填写方式 <em>选填</em></legend><div class="choice-grid two"><label class="compact-choice"><input type="radio" name="mode" value="individual" ${info.mode === 'individual' ? 'checked' : ''}><span>学校管理者个人自评</span></label><label class="compact-choice"><input type="radio" name="mode" value="team" ${info.mode === 'team' ? 'checked' : ''}><span>学校管理团队共同填写</span></label></div></fieldset>
          <div class="privacy-note"><strong>数据说明</strong><p>V1.0仅将进度保存在当前设备浏览器中，不进行跨设备同步，也不会自动上传学校信息。</p></div>
          <div class="form-actions"><button class="button button-secondary" type="button" id="info-back">返回</button><button class="button button-primary" type="submit">进入测评</button></div>
        </form>
      </section>`;
    const form = document.getElementById('info-form');
    form.addEventListener('input', () => {
      const data = new FormData(form);
      state.info = { schoolName: data.get('schoolName')?.trim() || '', province: data.get('province') || '', role: data.get('role') || '', mode: data.get('mode') || '' };
      saveState(false);
    });
    form.addEventListener('submit', event => { event.preventDefault(); setView('assessment', Math.min(state.step || 0, 5)); });
    document.getElementById('info-back').addEventListener('click', () => setView('home'));
  }

  function renderQuestion(question, number) {
    const current = state.answers[question.id];
    const inputType = question.type === 'multi' ? 'checkbox' : 'radio';
    return `
      <fieldset class="question" data-question="${question.id}">
        <legend><span class="question-number">${String(number).padStart(2, '0')}</span><span>${escapeHtml(question.prompt)} ${question.help ? `<small>${question.help}</small>` : ''}</span></legend>
        <div class="options">
          ${question.options.map((opt, index) => {
            const checked = question.type === 'multi' ? (Array.isArray(current) && current.includes(opt.value)) : current === opt.value;
            return `<label class="option"><input type="${inputType}" name="${question.id}" value="${opt.value}" data-exclusive="${opt.exclusive ? 'true' : 'false'}" ${checked ? 'checked' : ''}><span><b>${String.fromCharCode(65 + index)}.</b>${escapeHtml(opt.label)}</span></label>`;
          }).join('')}
        </div>
        <p class="question-error" hidden>请完成本题后继续，也可以选择“不清楚”。</p>
      </fieldset>`;
  }

  function renderAssessment() {
    const dimension = DATA.dimensions[state.step];
    const startNumber = state.step * 5 + 1;
    const overall = answeredCount();
    main.innerHTML = `
      <section class="assessment-page shell-narrow">
        <div class="assessment-heading">
          <div class="dimension-count">维度 ${state.step + 1} / 6</div>
          <h1>${escapeHtml(dimension.name)}</h1>
          <p>${escapeHtml(dimension.description)}</p>
          <div class="progress-meta"><span>整体进度</span><strong>${overall} / 30</strong></div>
          <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="30" aria-valuenow="${overall}"><span style="width:${overall / 30 * 100}%"></span></div>
        </div>
        <form id="assessment-form" novalidate>
          ${dimension.questions.map((q, i) => renderQuestion(q, startNumber + i)).join('')}
          <div class="assessment-actions">
            <button type="button" class="button button-secondary" id="assessment-back">上一步</button>
            <div class="save-status">选择后自动保存</div>
            <button type="submit" class="button button-primary">${state.step === 5 ? '完成并生成报告' : '保存并继续'}</button>
          </div>
        </form>
      </section>`;
    const form = document.getElementById('assessment-form');
    form.addEventListener('change', handleAnswerChange);
    form.addEventListener('submit', handlePageSubmit);
    document.getElementById('assessment-back').addEventListener('click', () => state.step === 0 ? setView('info') : setView('assessment', state.step - 1));
  }

  function handleAnswerChange(event) {
    const input = event.target;
    const questionId = input.name;
    const question = DATA.dimensions[state.step].questions.find(q => q.id === questionId);
    if (!question) return;
    if (question.type === 'multi') {
      const group = [...document.querySelectorAll(`input[name="${questionId}"]`)];
      if (input.checked && input.dataset.exclusive === 'true') group.forEach(item => { if (item !== input) item.checked = false; });
      if (input.checked && input.dataset.exclusive !== 'true') group.forEach(item => { if (item.dataset.exclusive === 'true') item.checked = false; });
      state.answers[questionId] = group.filter(item => item.checked).map(item => item.value);
    } else state.answers[questionId] = input.value;
    const fieldset = input.closest('.question');
    fieldset.classList.remove('has-error');
    fieldset.querySelector('.question-error').hidden = true;
    saveState(true);
  }

  function handlePageSubmit(event) {
    event.preventDefault();
    const dimension = DATA.dimensions[state.step];
    const missing = dimension.questions.filter(q => q.type === 'multi' ? !Array.isArray(state.answers[q.id]) || !state.answers[q.id].length : !state.answers[q.id]);
    document.querySelectorAll('.question').forEach(node => {
      const isMissing = missing.some(q => q.id === node.dataset.question);
      node.classList.toggle('has-error', isMissing);
      node.querySelector('.question-error').hidden = !isMissing;
    });
    if (missing.length) {
      say(`本页还有 ${missing.length} 道题未完成`);
      document.querySelector(`[data-question="${missing[0].id}"]`).scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (state.step < 5) setView('assessment', state.step + 1);
    else {
      state.completedAt = new Date().toISOString();
      state.reportId = state.reportId || createReportId();
      setView('report');
    }
  }

  function statusClass(status) { return `status-${status}`; }
  function statusWidth(status) { return { priority: 100, optimize: 72, foundation: 48, insufficient: 26 }[status] || 0; }

  function renderIndexChart(dimensions) {
    return `<div class="chart index-chart" role="img" aria-label="六维机制建设自评指数横向条形图">
      ${dimensions.map(d => `<div class="chart-row"><div class="chart-label"><span>${d.name}</span><small>信息完整度 ${d.completeness}%</small></div><div class="bar-line">${d.index === null ? '<div class="bar insufficient-bar"><span>信息不足</span></div>' : `<div class="bar index-bar" style="width:${d.index}%"><span></span></div>`}</div><strong class="chart-value">${d.index === null ? '—' : `${d.index}%`}</strong></div>`).join('')}
      <p class="chart-note">指数仅统计已明确回答的机制题；每维度有效回答少于3题时不形成明确判断。</p>
    </div>`;
  }

  function renderPriorityChart(issues, focus) {
    const focusIds = new Set(focus.map(item => item.id));
    return `<div class="priority-legend" aria-label="优先级图例"><span><i class="legend-mark status-priority"></i>优先核实</span><span><i class="legend-mark status-optimize"></i>持续优化</span><span><i class="legend-mark status-foundation"></i>已有基础</span><span><i class="legend-mark status-insufficient"></i>信息不足</span></div>
      <div class="chart priority-chart" role="img" aria-label="六类改进方向定性优先级图">
        ${issues.map(issue => `<div class="priority-row ${focusIds.has(issue.id) ? 'is-focus' : ''}"><div class="priority-label">${issue.shortTitle}${focusIds.has(issue.id) ? '<small>重点方向</small>' : ''}</div><div class="priority-track"><div class="priority-fill ${statusClass(issue.status)}" style="width:${statusWidth(issue.status)}%"><span>${issue.label}</span></div></div></div>`).join('')}
      </div>
      <p class="chart-note">本图为基于固定规则的定性排序，不是“机会得分”，条形长度仅表示四类判断层级。</p>`;
  }

  function renderCompletenessChart(dimensions) {
    return `<div class="completeness-legend"><span><i class="known-key"></i>已明确回答</span><span><i class="unknown-key"></i>不清楚</span></div>
      <div class="chart completeness-chart" role="img" aria-label="六维信息完整度分段条形图">
        ${dimensions.map(d => `<div class="complete-row"><div class="complete-label">${d.name}</div><div class="segment-bar" aria-label="已明确${d.known}项，不清楚${d.unknown}项">${Array.from({length: 4}, (_, i) => `<span class="${i < d.known ? 'known' : 'unknown'}">${i < d.known ? '明确' : '不清楚'}</span>`).join('')}</div><strong>${d.known}/4</strong></div>`).join('')}
      </div>
      <p class="chart-note">该图反映信息掌握程度，不代表学校问题严重程度。</p>`;
  }

  function renderIssueAnalysis(issue, index) {
    return `<article class="analysis-card">
      <div class="analysis-card-head"><span class="analysis-order">重点方向 ${index + 1}</span><span class="status-chip ${statusClass(issue.status)}">${issue.label}</span></div>
      <h3>${issue.title}</h3>
      <dl class="analysis-grid">
        <div><dt>本次诊断发现</dt><dd>${issue.finding}</dd></div>
        <div><dt>判断依据</dt><dd><ul>${issue.evidence.map(text => `<li>${text}</li>`).join('')}</ul></dd></div>
        <div><dt>可能存在的管理影响</dt><dd>${issue.impact}</dd></div>
        <div><dt>建议核实的数据</dt><dd><ul>${issue.verify.map(text => `<li>${text}</li>`).join('')}</ul></dd></div>
        <div><dt>建议采取的第一项行动</dt><dd>${issue.firstAction}</dd></div>
        <div><dt>后续优化方向</dt><dd>${issue.later}</dd></div>
      </dl>
    </article>`;
  }

  function renderReport() {
    const result = RULES.analyze(state.answers);
    const schoolName = state.info.schoolName || '学校升学增长机会自评报告';
    const role = state.info.role || '未填写';
    main.innerHTML = `
      <div class="report-tools shell print-hidden">
        <button class="button button-secondary" id="modify">返回修改答案</button>
        <div class="tool-spacer"></div>
        <button class="button button-secondary" id="print">打印报告</button>
        <button class="button button-primary" id="pdf">保存为PDF</button>
        <button class="button button-quiet" id="restart">重新测评</button>
      </div>
      <article class="report shell" id="report-document">
        <header class="report-cover">
          <div class="report-brand">七校纵横·县中联盟</div>
          <div class="report-eyebrow">学校管理自评报告 · V1.0</div>
          <h1>县域高中升学增长机会诊断报告</h1>
          <div class="report-meta"><div><span>学校名称</span><strong>${escapeHtml(schoolName)}</strong></div><div><span>诊断日期</span><strong>${formatDate(state.completedAt)}</strong></div><div><span>填写人职务</span><strong>${escapeHtml(role)}</strong></div><div><span>本地报告编号</span><strong>${escapeHtml(state.reportId || '未生成')}</strong></div></div>
          <p class="report-id-note">报告编号仅用于区分本设备生成的本次报告，不代表官方认证或外部审核。</p>
        </header>

        <section class="report-section">
          <div class="report-section-title"><span>01</span><div><h2>综合诊断概览</h2><p>六维机制建设自评指数</p></div></div>
          ${renderIndexChart(result.dimensions)}
          <div class="summary-box"><p>${result.summary.strongText}</p><p>${result.summary.studyText}</p><p>${result.summary.limitationText}</p></div>
          <div class="method-note"><strong>指标说明</strong><p>机制建设自评指数仅反映本次回答所呈现的机制建设情况，并非经过外部核验的学校质量评价结果。A=100、B=50、C=0；“不清楚”不计入平均值。</p></div>
        </section>

        <section class="report-section page-break-safe">
          <div class="report-section-title"><span>02</span><div><h2>值得优先研究的培养改进方向</h2><p>定性优先级识别</p></div></div>
          ${renderPriorityChart(result.issues, result.focus)}
          <div class="focus-list">${result.focus.map((issue, index) => `<div><span>${index + 1}</span><p><strong>${issue.title}</strong><em>${issue.label}</em></p></div>`).join('')}</div>
        </section>

        <section class="report-section page-break-safe">
          <div class="report-section-title"><span>03</span><div><h2>信息完整度分析</h2><p>已明确回答与“不清楚”分布</p></div></div>
          ${renderCompletenessChart(result.dimensions)}
        </section>

        <section class="report-section">
          <div class="report-section-title"><span>04</span><div><h2>重点问题深度分析</h2><p>结论、依据与建议行动</p></div></div>
          <div class="analysis-list">${result.focus.map(renderIssueAnalysis).join('')}</div>
        </section>

        <section class="report-section page-break-safe">
          <div class="report-section-title"><span>05</span><div><h2>学校30天改进建议表</h2><p>基于本次重点方向动态生成</p></div></div>
          <div class="table-wrap"><table><thead><tr><th>时间</th><th>对应方向</th><th>建议行动</th><th>建议责任岗位</th><th>预期交付成果</th></tr></thead><tbody>${result.plan.map(row => `<tr><td data-label="时间">${row.time}</td><td data-label="对应方向">${row.focus}</td><td data-label="建议行动">${row.action}</td><td data-label="建议责任岗位">${row.owner}</td><td data-label="预期交付成果">${row.output}</td></tr>`).join('')}</tbody></table></div>
        </section>

        <section class="report-section conclusion-section page-break-safe">
          <div class="report-section-title"><span>06</span><div><h2>结论与说明</h2><p>综合建议</p></div></div>
          <p class="conclusion">${result.conclusion}</p>
          <div class="disclaimer"><strong>使用说明</strong><p>本报告基于填写者提供的自评信息生成，用于学校内部管理研讨和改进方向识别。</p><p>报告不构成学校质量评价、升学结果预测或具体招生政策认定。相关建议需结合学校真实数据、当地教育政策、学校实际条件进一步核实。</p></div>
        </section>
        <footer class="report-footer"><span>七校纵横·县中联盟</span><span>${escapeHtml(state.reportId || '')}</span></footer>
      </article>
      <div class="pdf-help shell print-hidden">“保存为PDF”将打开浏览器打印窗口，请在目标打印机中选择“保存为PDF”。</div>`;
    document.getElementById('modify').addEventListener('click', () => setView('assessment', 0));
    document.getElementById('print').addEventListener('click', () => window.print());
    document.getElementById('pdf').addEventListener('click', () => window.print());
    document.getElementById('restart').addEventListener('click', resetAssessment);
  }

  function resetAssessment() {
    if (!window.confirm('重新测评将清除当前设备中已保存的答案和报告，确定继续吗？')) return;
    try { localStorage.removeItem(DATA.storageKey); } catch (error) { /* no-op */ }
    state = freshState();
    render();
    window.scrollTo(0, 0);
  }

  function render() {
    updateHeaderStatus();
    if (state.view === 'info') renderInfo();
    else if (state.view === 'assessment') renderAssessment();
    else if (state.view === 'report' && answeredCount() === 30) renderReport();
    else renderHome();
  }

  document.getElementById('brand-home').addEventListener('click', () => setView('home'));
  window.addEventListener('beforeprint', () => document.documentElement.classList.add('printing'));
  window.addEventListener('afterprint', () => document.documentElement.classList.remove('printing'));
  window.DiagnosisAPI = {
    version: DATA.version,
    isCloudEnabled: false,
    exportLocalData: () => JSON.parse(JSON.stringify(state)),
    analyzeCurrentAnswers: () => RULES.analyze(state.answers)
  };
  render();
})();
