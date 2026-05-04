import { sqlEngine, escapeHtml, setupSyntaxHighlighting } from '../engine/sql-engine.js';
import { ProgressManager } from '../engine/progress.js';

let currentCategory = null;
let currentLessonIndex = 0;
let currentLesson = null;
let categories = [];
let expandedCategoryId = null;

export function renderLearn() {
  return `
  <div class="page-header">
    <h1 class="page-title">Learning Path</h1>
    <p class="page-subtitle">Master SQL step-by-step with interactive modules.</p>
  </div>

  <div class="learn-layout">
    <!-- Sidebar -->
    <div id="learn-sidebar" class="learn-sidebar">
      <div class="card learn-sidebar-card">
        <div class="card-title" style="margin-bottom:14px;">📚 CURRICULUM</div>
        <div id="category-list" class="category-accordion"></div>
      </div>
    </div>

    <!-- Content area -->
    <div class="learn-content-area">
      <div id="learn-content">
        <div class="learn-empty-state">
          <div style="font-size:2.5rem;margin-bottom:16px;">📚</div>
          <h3 style="margin-bottom:8px;color:var(--text-primary);">Pick a topic to start</h3>
          <p style="font-size:0.88rem;">Select any category on the left, then choose a topic to begin learning.</p>
        </div>
      </div>
    </div>
  </div>`;
}

export async function initLearn() {
  if (window.LESSONS_DATA && LESSONS_DATA.categories) {
    categories = LESSONS_DATA.categories;
    await renderSidebar();
  }
}

async function renderSidebar() {
  const container = document.getElementById('category-list');
  if (!container) return;
  const progress = await ProgressManager.getProgress();

  container.innerHTML = categories.map((cat, catIdx) => {
    const topics = cat.topics;
    const completed = topics.filter(t => progress.topicsCompleted.includes(t.id)).length;
    const pct = Math.round((completed / topics.length) * 100);
    const isExpanded = expandedCategoryId === cat.id;
    const isActiveCat = currentCategory && currentCategory.id === cat.id;

    // Subcategory topic list
    const topicListHtml = topics.map((topic, topicIdx) => {
      const isDone = progress.topicsCompleted.includes(topic.id);
      const isActiveTopic = currentCategory?.id === cat.id && currentLessonIndex === topicIdx;
      return `
      <button class="topic-item ${isActiveTopic ? 'active' : ''} ${isDone ? 'done' : ''}"
              data-cat="${catIdx}" data-topic="${topicIdx}">
        <span class="topic-status">${isDone ? '✅' : isActiveTopic ? '▶' : '○'}</span>
        <span class="topic-name">${escapeHtml(topic.title)}</span>
      </button>`;
    }).join('');

    return `
    <div class="cat-accordion-item ${isActiveCat ? 'active-cat' : ''}">
      <button class="cat-accordion-header" data-cat="${catIdx}">
        <div class="cat-header-left">
          <span class="cat-icon">${cat.icon || '📁'}</span>
          <div class="cat-header-info">
            <span class="cat-name">${escapeHtml(cat.name)}</span>
            <span class="cat-desc">${escapeHtml(cat.description || '')}</span>
          </div>
        </div>
        <div class="cat-header-right">
          <span class="cat-progress-text">${completed}/${topics.length}</span>
          <div class="cat-progress-bar">
            <div class="cat-progress-fill" style="width:${pct}%"></div>
          </div>
          <span class="cat-chevron ${isExpanded ? 'open' : ''}">▾</span>
        </div>
      </button>
      <div class="cat-accordion-body ${isExpanded ? 'expanded' : ''}">
        ${topicListHtml}
      </div>
    </div>`;
  }).join('');

  // Category header click → toggle expand
  container.querySelectorAll('.cat-accordion-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const catIdx = parseInt(btn.dataset.cat);
      const cat = categories[catIdx];
      if (expandedCategoryId === cat.id) {
        expandedCategoryId = null;
      } else {
        expandedCategoryId = cat.id;
      }
      renderSidebar();
    });
  });

  // Topic click → load lesson
  container.querySelectorAll('.topic-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const catIdx = parseInt(btn.dataset.cat);
      const topicIdx = parseInt(btn.dataset.topic);
      currentCategory = categories[catIdx];
      currentLessonIndex = topicIdx;
      expandedCategoryId = currentCategory.id;
      renderSidebar();
      renderLesson();
    });
  });
}

function renderLesson() {
  const content = document.getElementById('learn-content');
  if (!content || !currentCategory) return;

  const lessons = currentCategory.topics;
  currentLesson = lessons[currentLessonIndex];
  if (!currentLesson) return;

  const exampleQueries = currentLesson.example_query ? [currentLesson.example_query] : [];

  // Build common mistakes HTML
  const mistakesHtml = currentLesson.common_mistakes && currentLesson.common_mistakes.length > 0
    ? `<div class="lesson-section">
        <div class="lesson-section-label">⚠️ COMMON MISTAKES</div>
        <ul class="mistakes-list">
          ${currentLesson.common_mistakes.map(m => `<li>${escapeHtml(m)}</li>`).join('')}
        </ul>
      </div>` : '';

  // Build "why" section
  const whyHtml = currentLesson.why
    ? `<div class="lesson-why-box">
        <div class="lesson-section-label">💡 WHY THIS MATTERS</div>
        <p>${escapeHtml(currentLesson.why)}</p>
      </div>` : '';

  content.innerHTML = `
  <div class="lesson-card" style="animation:fadeIn 0.3s ease;">
    <!-- Breadcrumb -->
    <div class="lesson-breadcrumb">
      <span>${currentCategory.icon || ''} ${escapeHtml(currentCategory.name)}</span>
      <span class="breadcrumb-sep">›</span>
      <span class="breadcrumb-current">${escapeHtml(currentLesson.title)}</span>
      <span class="lesson-counter">${currentLessonIndex + 1} / ${lessons.length}</span>
    </div>

    <h2 class="lesson-title">${escapeHtml(currentLesson.title)}</h2>

    <div class="lesson-explanation">${currentLesson.explanation || ''}</div>

    ${whyHtml}

    ${currentLesson.syntax ? `
    <div class="lesson-section">
      <div class="lesson-section-label">📝 SYNTAX</div>
      <div class="syntax-block"><code>${escapeHtml(currentLesson.syntax)}</code></div>
    </div>` : ''}

    ${exampleQueries.length > 0 ? `
    <div class="lesson-section">
      <div class="lesson-section-label">🧪 EXAMPLE — CLICK TO LOAD</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${exampleQueries.map((ex, i) => `
        <button class="example-query-btn" data-idx="${i}">
          <span class="example-prefix">▶</span>
          <code>${escapeHtml(typeof ex === 'string' ? ex : ex.query || ex)}</code>
        </button>`).join('')}
      </div>
    </div>` : ''}

    ${mistakesHtml}

    <!-- Editor -->
    <div class="lesson-section">
      <div class="lesson-section-label">>_ TRY IT YOURSELF</div>
      <div class="editor-chrome">
        <div class="editor-chrome-bar">
          <span class="editor-chrome-label">sql_editor · ${escapeHtml(currentLesson.dataset || 'employees')}</span>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-sm btn-secondary" id="learn-clear-btn">Clear</button>
            <button class="btn btn-sm btn-accent" id="learn-run-btn">▶ Run</button>
          </div>
        </div>
        <textarea class="sql-editor" id="learn-editor" placeholder="Write your SQL here and hit Run..."></textarea>
      </div>
    </div>

    <div id="learn-result" style="margin-top:16px;"></div>

    <!-- Navigation -->
    <div class="lesson-nav">
      <button class="btn btn-secondary btn-sm" id="learn-prev-btn" ${currentLessonIndex === 0 ? 'disabled' : ''}>← Previous</button>
      <button class="btn btn-primary" id="learn-complete-btn">✓ Mark Complete</button>
      <button class="btn btn-secondary btn-sm" id="learn-next-btn" ${currentLessonIndex === lessons.length - 1 ? 'disabled' : ''}>Next →</button>
    </div>
  </div>`;

  // Event listeners
  document.getElementById('learn-run-btn')?.addEventListener('click', () => {
    const query = document.getElementById('learn-editor')?.value.trim();
    const resDiv = document.getElementById('learn-result');
    if (!query || !resDiv) return;
    const result = sqlEngine.exec(query);
    resDiv.innerHTML = result.success
      ? sqlEngine.renderResults(result.results)
      : `<div class="feedback feedback-error"><span class="feedback-icon">❌</span><span>${escapeHtml(result.error)}</span></div>`;
  });

  document.getElementById('learn-clear-btn')?.addEventListener('click', () => {
    const ed = document.getElementById('learn-editor');
    if (ed) ed.value = '';
    const res = document.getElementById('learn-result');
    if (res) res.innerHTML = '';
  });

  document.querySelectorAll('.example-query-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const ex = exampleQueries[parseInt(btn.dataset.idx)];
      const query = typeof ex === 'string' ? ex : ex.query || ex;
      const editor = document.getElementById('learn-editor');
      if (editor) editor.value = query;
    });
  });

  document.getElementById('learn-prev-btn')?.addEventListener('click', () => {
    if (currentLessonIndex > 0) { currentLessonIndex--; renderSidebar(); renderLesson(); }
  });
  document.getElementById('learn-next-btn')?.addEventListener('click', () => {
    if (currentLessonIndex < lessons.length - 1) { currentLessonIndex++; renderSidebar(); renderLesson(); }
  });
  document.getElementById('learn-complete-btn')?.addEventListener('click', async () => {
    await ProgressManager.saveTopic(currentLesson.id);
    await renderSidebar();
    const btn = document.getElementById('learn-complete-btn');
    if (btn) { btn.textContent = '✅ Completed!'; btn.disabled = true; btn.style.background = 'var(--accent-green-light)'; btn.style.color = 'var(--accent-green-dark)'; }
    // Auto-advance to next topic after a brief moment
    if (currentLessonIndex < lessons.length - 1) {
      setTimeout(() => { currentLessonIndex++; renderSidebar(); renderLesson(); }, 800);
    }
  });

  setTimeout(setupSyntaxHighlighting, 100);
}
