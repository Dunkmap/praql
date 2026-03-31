/**
 * Learn Page - Interactive SQL Learning
 */
let currentCategory = null;
let currentTopic = null;
let currentCategoryTopics = [];
let currentPracticeQuestion = null;

document.addEventListener('DOMContentLoaded', async () => {
  await initLearnPage();
});

async function initLearnPage() {
  // Initialize SQL engine
  try {
    await sqlEngine.init();
    await sqlEngine.loadAllDatasets();
  } catch (e) {
    console.error('Failed to init SQL engine:', e);
  }

  displayWelcome();
  renderCategories();
  setupEventListeners();
}

async function displayWelcome() {
  const p = await ProgressManager.getProgress();
  const welcomeEl = document.getElementById('welcome-user');
  const nameEl = document.getElementById('display-name');
  if (p.userName && welcomeEl) {
    if (nameEl) nameEl.textContent = `Welcome, ${p.userName}!`;
    welcomeEl.textContent = "Master the language of data through immersive, hands-on modules designed for all skill levels.";
  } else if (welcomeEl) {
    if (nameEl) nameEl.textContent = "Welcome, Learner!";
    welcomeEl.textContent = "Start your journey into the world of data with our beginner-friendly SQL modules.";
  }
}

function toggleNameEdit() {
  const display = document.getElementById('username-display-area');
  const input = document.getElementById('name-input-area');
  const nameInput = document.getElementById('user-name-input');
  const currentName = document.getElementById('display-name').textContent.replace('Welcome, ', '').replace('!', '');

  if (display.style.display === 'none') {
    display.style.display = 'flex';
    input.style.display = 'none';
  } else {
    display.style.display = 'none';
    input.style.display = 'flex';
    nameInput.value = currentName === 'Learner' ? '' : currentName;
    nameInput.focus();
  }
}

async function saveName() {
  const nameInput = document.getElementById('user-name-input');
  const newName = nameInput.value.trim();
  if (newName) {
    await ProgressManager.saveUserName(newName);
    displayWelcome();
    toggleNameEdit();
  }
}

async function resetProgress() {
  if (confirm('Are you sure you want to reset all your progress? This cannot be undone.')) {
    await ProgressManager.resetProgress();
    location.reload();
  }
}

function setupEventListeners() {
  // Header/Profile functionality
  const editBtn = document.getElementById('edit-name-btn');
  const saveBtn = document.getElementById('save-name-btn');
  const cancelBtn = document.getElementById('cancel-name-btn');
  const resetBtn = document.getElementById('reset-btn');

  if (editBtn) editBtn.addEventListener('click', toggleNameEdit);
  if (saveBtn) saveBtn.addEventListener('click', saveName);
  if (cancelBtn) cancelBtn.addEventListener('click', toggleNameEdit);
  if (resetBtn) resetBtn.addEventListener('click', resetProgress);

  const backBtn = document.getElementById('back-to-categories');
  if (backBtn) backBtn.addEventListener('click', showCategories);

  // Sidebar toggles
  const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
  if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener('click', () => {
      const container = document.querySelector('.lesson-container');
      container.classList.toggle('topics-collapsed');
    });
  }

  // Sidebar Toggle - Data
  const toggleDataSidebarBtn = document.getElementById('toggle-data-sidebar-btn');
  if (toggleDataSidebarBtn) {
    toggleDataSidebarBtn.addEventListener('click', () => {
      const container = document.querySelector('.lesson-container');
      container.classList.toggle('data-collapsed');
    });
  }

  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.addEventListener('change', (e) => {
      if (e.target.id === 'dataset-selector-sidebar') {
        renderDatasetPreviewToSidebar(e.target.value);
        updateLessonSchemaHint(e.target.value);
      }
    });

    mainContent.addEventListener('click', (e) => {
    // Category Card Click
    const categoryCard = e.target.closest('.category-card');
    if (categoryCard) {
      const categoryId = categoryCard.dataset.category;
      openCategory(categoryId);
      return;
    }

    // Topic Item Click
    const topicItem = e.target.closest('.topic-item');
    if (topicItem) {
      const topicId = topicItem.dataset.topic;
      openLesson(topicId);
      return;
    }

    // Action Buttons (Run, Reset, Hint, Mark Complete)
    const btn = e.target.closest('button');
    if (btn) {
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      
      if (action === 'run-lesson') runLessonQuery();
      if (action === 'reset-lesson') resetLessonQuery();
      if (action === 'mark-complete') markTopicComplete(id);
      if (action === 'show-hint') showLessonHint(id);
      if (action === 'toggle-data-aside') runSelectionToSidebar(id);
      if (action === 'run-practice') runLessonPractice(id);
      if (action === 'check-practice') checkLessonPractice(id);
      if (action === 'open-lesson') openLesson(id);
      if (action === 'open-category') openCategory(id);
    }
  });
 }
}

function showView(viewId) {
  const sections = document.querySelectorAll('.page-section');
  sections.forEach(s => {
    s.classList.remove('active');
    s.style.opacity = '0';
    s.style.transform = 'translateY(10px)';
  });
  
  const view = document.getElementById(viewId);
  if (view) {
    view.classList.add('active');
    // Rapid fade-in for "separate screen" feel
    setTimeout(() => {
      view.style.transition = 'all 0.3s ease-out';
      view.style.opacity = '1';
      view.style.transform = 'translateY(0)';
    }, 10);
  }
  
  const main = document.getElementById('main-content');
  if (main) {
    main.style.overflowY = (viewId === 'categories-view') ? 'hidden' : 'auto';
    main.scrollTop = 0;
  }
}

// ===== CATEGORIES ===// ===== CATEGORIES =====
async function renderCategories() {
  const grid = document.getElementById('category-grid');
  if (!grid) return;
  const progress = await ProgressManager.getProgress();
  
  const categoryIcons = {
    'db-creation': `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a0a8ba" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.121 2.121 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z"></path></svg>`,
    'db-basics': `<svg width="40" height="40" viewBox="0 0 60 60"><path d="M10,40 Q30,50 50,40 L50,48 Q30,58 10,48 Z" fill="#b9e7fa" stroke="#2d3748" stroke-width="1.5"/><path d="M10,30 Q30,40 50,30 L50,38 Q30,48 10,38 Z" fill="#fbdcd9" stroke="#2d3748" stroke-width="1.5"/><path d="M10,20 Q30,30 50,20 L50,28 Q30,38 10,28 Z" fill="#d0f0fd" stroke="#2d3748" stroke-width="1.5"/><path d="M10,20 Q30,10 50,20 Q30,30 10,20 Z" fill="#e7f6fe" stroke="#2d3748" stroke-width="1.5"/></svg>`,
    'filtering': `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#718096" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
    'sorting': `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9bb6a7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="4" height="10" rx="1"></rect><rect x="10" y="7" width="4" height="14" rx="1"></rect><rect x="17" y="3" width="4" height="18" rx="1"></rect></svg>`,
    'aggregation': `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c4a5a5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="4" height="10" rx="1"></rect><rect x="10" y="7" width="4" height="14" rx="1"></rect><rect x="17" y="3" width="4" height="18" rx="1"></rect></svg>`,
    'joins': `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a0c4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
    'subqueries': `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#b86a7c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>`,
    'set-ops': `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#b86a7c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="12" r="6" stroke="#b86a7c" style="mix-blend-mode: multiply; opacity: 0.6;"/><circle cx="14" cy="12" r="6" stroke="#b86a7c" style="mix-blend-mode: multiply; opacity: 0.6;"/></svg>`
  };

  const decorations = [
    `<div style="position: absolute; top: 10px; right: 10px; color: #dcd1c6;">✦</div><div style="position: absolute; bottom: 10px; left: 10px; color: #dcd1c6;">•</div>`,
    `<div style="position: absolute; bottom: 8px; left: 8px; color: #dcd1c6;">✦</div>`,
    `<div style="position: absolute; top: 8px; right: 8px; color: #dcd1c6;">•</div>`,
    `<div style="position: absolute; top: 12px; right: 15px; color: #dcd1c6; font-size: 1.2rem;">🌙</div>`,
    `<div style="position: absolute; top: 10px; right: 10px; color: #dcd1c6;">✦</div><div style="position: absolute; bottom: 10px; left: 10px; color: #dcd1c6;">•</div>`,
    ``,
    `<div style="position: absolute; top: 12px; left: 12px; color: #dcd1c6;">✦</div>`,
    `<div style="position: absolute; bottom: 12px; right: 12px; color: #f2e7de; font-size: 1.5rem;">✦</div>`
  ];

  grid.innerHTML = LESSONS_DATA.categories.map((cat, i) => {
    const completedCount = cat.topics.filter(t => progress.topicsCompleted.includes(t.id)).length;
    const totalCount = cat.topics.length;
    const icon = categoryIcons[cat.id] || cat.icon;
    const deco = decorations[i % decorations.length];

    return `
      <div class="category-card" data-category="${cat.id}" style="background-color: #fffdf9; border: 1.5px solid #eae1d7; border-radius: 16px; padding: 15px 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; position: relative; min-height: 150px; box-shadow: 0 4px 10px rgba(0,0,0,0.02);">
        ${deco}
        <div class="category-icon" style="margin-bottom: 10px;">
          ${icon}
        </div>
        <div class="category-name" style="font-size: 0.95rem; font-weight: 700; color: #b86a7c; margin-bottom: 4px; text-align: center;">${cat.name}</div>
        <div class="category-count" style="font-size: 0.65rem; font-weight: 600; color: #2d3748; opacity: 0.7; letter-spacing: 0.5px;">
          ${totalCount} MODS • ${completedCount} DONE
        </div>
      </div>
    `;
  }).join('');
}

// ===== TOPICS =====
async function openCategory(categoryId) {
  currentCategory = LESSONS_DATA.categories.find(c => c.id === categoryId);
  if (!currentCategory) return;

  currentCategoryTopics = currentCategory.topics;
  const progress = await ProgressManager.getProgress();

  const titleEl = document.getElementById('category-title');
  if (titleEl) titleEl.textContent = currentCategory.name.toUpperCase();

  const descEl = document.getElementById('category-description');
  if (descEl) descEl.textContent = currentCategory.description;

  const topicList = document.getElementById('topic-list');
  topicList.innerHTML = currentCategoryTopics.map((topic, i) => {
    const isCompleted = progress.topicsCompleted.includes(topic.id);
    return `
      <div class="topic-item ${isCompleted ? 'completed' : ''}" data-topic="${topic.id}" style="padding: 20px 30px; border-radius: 20px; margin-bottom: 12px; border: 1.5px solid #eae1d7; background: #fffdf9; display: flex; align-items: center; gap: 20px; cursor: pointer; transition: transform 0.15s ease;">
        <div class="topic-status" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: ${isCompleted ? '#c0ebd0' : '#f2e7de'}; color: ${isCompleted ? '#437653' : '#a0a8ba'}; font-weight: 800; font-size: 0.9rem; border: none;">
          ${isCompleted ? '✓' : (i + 1)}
        </div>
        <div style="flex: 1;">
          <div class="topic-name" style="font-size: 1.2rem; font-weight: 700; color: #32475b;">${topic.title}</div>
          <div style="font-size: 0.8rem; color: #718096; margin-top: 2px;">MODULE_${topic.id.toUpperCase()} • LVL_ESSENTIAL</div>
        </div>
        ${isCompleted ? '<span style="background: #c0ebd0; color: #437653; padding: 6px 14px; border-radius: 20px; font-weight: 800; font-size: 0.75rem; letter-spacing: 0.5px;">MASTERED</span>' : '<span style="color: #b86a7c; font-size: 1.2rem; font-weight: 800;">→</span>'}
      </div>
    `;
  }).join('');

  showView('topics-view');
}

function showCategories() {
  showView('categories-view');
  renderCategories();
}

// ===== LESSON VIEW =====
async function openLesson(topicId) {
  const topic = findTopic(topicId);
  if (!topic) return;

  currentTopic = topic;
  
  // Find which category this topic belongs to
  const cat = LESSONS_DATA.categories.find(c => c.topics.some(t => t.id === topicId));
  if (cat) {
    currentCategory = cat;
    currentCategoryTopics = cat.topics;
  }

  const progress = await ProgressManager.getProgress();
  
  // Render sidebar
  renderLessonSidebar(progress);
  
  // Render lesson content
  await renderLessonContent(topic, progress);
  
  showView('lesson-view');
}

async function renderLessonSidebar(progress) {
  const sidebar = document.getElementById('lesson-sidebar-topics');
  sidebar.innerHTML = currentCategoryTopics.map((t, i) => {
    const isCompleted = progress.topicsCompleted.includes(t.id);
    const isActive = t.id === currentTopic.id;
    return `
      <div class="topic-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}" data-topic="${t.id}" style="padding: 12px 15px; border-radius: 12px; margin-bottom: 8px; border: 1.5px solid ${isActive ? '#b86a7c' : '#f2e7de'}; background: ${isActive ? '#fffbfc' : '#fffdf9'}; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.2s;">
        <div class="topic-status" style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: ${isCompleted ? '#c0ebd0' : isActive ? '#fbe6dd' : '#f2e7de'}; color: ${isCompleted ? '#437653' : isActive ? '#b86a7c' : '#a0a8ba'}; font-weight: 800; font-size: 0.7rem;">${isCompleted ? '✓' : (i + 1)}</div>
        <div class="topic-name" style="font-size: 0.85rem; font-weight: ${isActive ? '800' : '600'}; color: ${isActive ? '#b86a7c' : '#32475b'};">${t.title}</div>
      </div>
    `;
  }).join('');
}

async function renderLessonContent(topic, progress) {
  const container = document.getElementById('lesson-content');
  const isCompleted = progress.topicsCompleted.includes(topic.id);
  
  // GetRelated practice questions
  const relatedQuestions = getRelatedQuestions(topic.title, topic.id);
  const practiceHtml = renderPracticeQuestions(relatedQuestions);
  
  container.innerHTML = `
    <button style="background: none; border: none; color: #b86a7c; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; padding: 0; margin-bottom: 25px; font-family: 'JetBrains Mono', monospace;" data-action="open-category" data-id="${currentCategory.id}">
      « BACK TO ${currentCategory.name.toUpperCase()}
    </button>
    
    <div style="margin-bottom:35px;">
      <h1 style="font-family:'JetBrains Mono', monospace; font-size: 2.2rem; font-weight:800; margin:0; color:#b86a7c; letter-spacing:-1px;">${topic.title}</h1>
      <div style="font-size: 0.8rem; color: #718096; margin-top: 5px; font-weight: 700;">MODULE_${topic.id.toUpperCase()} • COMPLETED: ${isCompleted ? 'YES' : 'NO'}</div>
    </div>
    
    <!-- Explanation -->
    <div style="margin-bottom:30px; background: #fffdf9; border-radius: 16px; padding: 25px; border: 1.5px solid #eae1d7;">
      <div style="color:#32475b; font-size:1.1rem; font-weight: 800; margin-bottom:12px; display:flex; align-items:center; gap:10px;">
        <span style="background:#cfe6f5; color:#2d3748; width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center;">?</span> OVERVIEW_EXPLORER
      </div>
      <div style="font-size:0.95rem; line-height:1.6; color:#2c3e50;">${topic.explanation}</div>
    </div>
    
    <!-- Why -->
    <div style="margin-bottom:30px; padding: 0 10px;">
      <div style="color:#b86a7c; font-size:0.9rem; font-weight: 800; margin-bottom:10px;">> WHY_MATTER</div>
      <div style="font-size:0.95rem; line-height:1.6; color:#4a5568; font-style: italic; border-left: 3px solid #fbe6dd; padding-left: 20px;">${topic.why}</div>
    </div>
    
    <!-- Laboratory -->
    <div style="background-color: #d8edfa; border-radius: 20px; padding: 25px; border: 1px solid #c8e0f0; margin-bottom: 30px;">
      <div style="background-color: #fffcfa; border-radius: 16px; padding: 30px; border: 1.5px solid #dcdbe3; position: relative;">
        <div style="color:#32475b; font-size:1rem; font-weight: 800; margin-bottom:20px; display:flex; align-items:center; gap:10px; font-family: 'JetBrains Mono', monospace;">
          LAB // SQL_EDITOR <span style="font-size:0.7rem; opacity:0.6; font-weight:400; background:#f2e7de; padding:2px 8px; border-radius:4px; margin-left:10px;">CTRL+ENTER TO EXEC</span>
        </div>

        <div style="background-color: #373e47; border-radius: 12px; overflow: hidden; border: 1.5px solid #2d323a;">
          <div style="padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div style="color: #92a4bd; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; font-weight: 600;">>_ QUERY_INPUT</div>
            <div style="display: flex; gap: 8px;">
              <button style="background-color: rgba(178, 173, 213, 0.2); border: 1px solid #b2add5; border-radius: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: #b2add5; font-weight: 700; cursor: pointer;" data-action="reset-lesson">↺</button>
              <button style="background-color: #fae0cd; border: none; border-radius: 6px; padding: 0 12px; height: 28px; display: flex; align-items: center; justify-content: center; gap: 6px; color: #322b2b; font-weight: 700; cursor: pointer; box-shadow: 0 2px 0 #d9c0af;" data-action="run-lesson">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                run
              </button>
            </div>
          </div>
          
          <textarea class="sql-editor" id="lesson-editor" 
            style="width: 100%; background: transparent; border: none; color: #a0c4ff; font-family: 'JetBrains Mono', monospace; font-size: 1rem; height: 120px; padding: 15px 20px; box-sizing: border-box; resize: none; outline: none; caret-color: #ffffff; display: block;"
            placeholder="Enter your SQL query here...">${topic.example_query}</textarea>
        </div>

        <div id="lesson-result" style="margin-top:20px;"></div>
      </div>
    </div>

    <!-- Practice Section -->
    ${practiceHtml ? `
      <div style="margin-top:40px;">
        <div style="color:#b86a7c; font-size:1.1rem; font-weight: 800; margin-bottom:20px;">// HANDS_ON_PRACTICE</div>
        ${practiceHtml}
      </div>
    ` : ''}

    <!-- Mark Complete Button -->
    <div style="display:flex; justify-content:center; margin-top:50px;">
       <button style="background-color: ${isCompleted ? '#f2e7de' : '#c0ebd0'}; border: 1.5px solid ${isCompleted ? '#dcd1c6' : '#9dcdae'}; border-radius: 12px; padding: 15px 40px; font-family: 'JetBrains Mono', monospace; font-size: 1rem; font-weight: 700; color: ${isCompleted ? '#a0a8ba' : '#437653'}; cursor: ${isCompleted ? 'default' : 'pointer'}; box-shadow: 0 4px 0 ${isCompleted ? '#dcd1c6' : '#9dcdae'};" 
         data-action="mark-complete" data-id="${topic.id}">
         ${isCompleted ? 'MODULE_MASTERED ✓' : 'MARK MODULE AS COMPLETE'}
       </button>
    </div>
  `;
  // Init Sidebar Data
  renderDatasetPreviewToSidebar(topic.dataset);
  
  // Auto-run the example
  setTimeout(runLessonQuery, 300);
  
  // Scroll to top of lesson content
  container.scrollTop = 0;
  
  updateLessonSchemaHint(topic.dataset);
}

function renderDatasetPreviewToSidebar(datasetName) {
  const container = document.getElementById('dataset-preview-sidebar');
  const selector = document.getElementById('dataset-selector-sidebar');
  if (selector) selector.value = datasetName;
  if (container) container.innerHTML = renderDatasetPreview(datasetName);
}

function runSelectionToSidebar(qId) {
  const allQ = [...QUESTIONS_DATA.easy, ...QUESTIONS_DATA.medium, ...QUESTIONS_DATA.hard];
  const q = allQ.find(qq => qq.id === qId);
  if (q) {
    renderDatasetPreviewToSidebar(q.dataset);
  }
}

function updateLessonSchemaHint(tableName) {
  const schemaHint = document.getElementById('lesson-schema-hint');
  if (!schemaHint) return;
  try {
    const result = sqlEngine.exec(`SELECT * FROM ${tableName} LIMIT 1`);
    if (result.success && result.results && result.results.length > 0) {
      const cols = result.results[0].columns;
      schemaHint.innerHTML = `<span style="color:#718096; font-size:0.7rem;">COLS:</span> ` + 
        cols.map(c => `<span style="background:#f2e7de; color:#32475b; padding:2px 6px; border-radius:4px; font-weight:700; font-size:0.7rem; margin-right:4px;">${c}</span>`).join('');
    }
  } catch(e) { }
}

function runLessonQuery() {
  const editor = document.getElementById('lesson-editor');
  const resultDiv = document.getElementById('lesson-result');
  
  if (!editor || !resultDiv) return;
  
  const query = editor.value.trim();
  if (!query) {
    resultDiv.innerHTML = '<div style="color:#718096; font-size:0.9rem; margin-top:10px;">ℹ️ Enter a query and click check.</div>';
    return;
  }

  const result = sqlEngine.exec(query);
  if (result.success) {
    resultDiv.innerHTML = sqlEngine.renderResults(result.results);
  } else {
    resultDiv.innerHTML = `<div style="background:#fff5f5; border:1px solid #feb2b2; padding:15px; border-radius:10px; margin-top:10px; color:#c53030;">❌ ${escapeHtml(result.error)}</div>`;
  }
}

function resetLessonQuery() {
  if (currentTopic) {
    const editor = document.getElementById('lesson-editor');
    if (editor) {
      editor.value = currentTopic.example_query;
      runLessonQuery();
    }
  }
}

async function markTopicComplete(topicId) {
  await ProgressManager.saveTopic(topicId);
  const btns = document.querySelectorAll(`[data-action="mark-complete"][data-id="${topicId}"]`);
  btns.forEach(btn => {
    btn.innerHTML = 'MODULE_MASTERED ✓';
    btn.style.backgroundColor = '#f2e7de';
    btn.style.borderColor = '#dcd1c6';
    btn.style.color = '#a0a8ba';
    btn.disabled = true;
    btn.style.boxShadow = '0 4px 0 #dcd1c6';
  });

  // Update sidebar
  const progress = await ProgressManager.getProgress();
  renderLessonSidebar(progress);
}

// ===== DATASET PREVIEW =====
function renderDatasetPreview(datasetName) {
  if (!datasetName) return '<div style="color:#718096; padding:20px;">No dataset for this topic.</div>';
  
  const result = sqlEngine.exec(`SELECT * FROM ${datasetName} LIMIT 10`);
  if (!result.success) {
    return `<div style="color:#c53030; padding:20px;">Could not load dataset.</div>`;
  }
  
  if (!result.results || result.results.length === 0) {
    return '<div style="color:#718096; padding:20px;">Dataset is empty.</div>';
  }
  
  const r = result.results[0];
  const countResult = sqlEngine.exec(`SELECT COUNT(*) FROM ${datasetName}`);
  const totalRows = countResult.success && countResult.results.length > 0 ? countResult.results[0].values[0][0] : '?';
  
  let html = `<div style="background:#ffffff; border-radius:12px; overflow:hidden; border:1.5px solid #eae1d7;">
    <div style="background:#fcf6f0; padding:10px 15px; border-bottom:1.5px solid #eae1d7; display:flex; justify-content:space-between; align-items:center;">
      <span style="font-weight:700; color:#b86a7c; font-size:0.8rem;">${datasetName.toUpperCase()}</span>
      <span style="font-size:0.65rem; color:#718096;">${totalRows} ROWS</span>
    </div>
    <div style="overflow-x:auto;">
      <table style="width:100%; border-collapse:collapse; font-size:0.75rem;">
        <thead><tr style="background:#fffdf9;">`;
  
  for (const col of r.columns) {
    html += `<th style="padding:10px; border-bottom:1.5px solid #f2e7de; text-align:left; color:#32475b;">${col}</th>`;
  }
  
  html += `</tr></thead><tbody>`;
  
  for (const row of r.values) {
    html += '<tr style="border-bottom:1px solid #f2e7de;">';
    for (const val of row) {
      html += `<td style="padding:8px 10px; color:#4a5568;">${val === null ? '<em style="opacity:0.5">NULL</em>' : escapeHtml(String(val))}</td>`;
    }
    html += '</tr>';
  }
  
  html += `</tbody></table></div></div>`;
  return html;
}

// ===== RELATED PRACTICE QUESTIONS =====
function getRelatedQuestions(topicTitle, topicId) {
  const allQuestions = [...QUESTIONS_DATA.easy, ...QUESTIONS_DATA.medium, ...QUESTIONS_DATA.hard];
  const titleUpper = topicTitle.toUpperCase();
  const matched = allQuestions.filter(q => {
    const qTopic = q.topic.toUpperCase();
    if (qTopic === titleUpper) return true;
    if (titleUpper.includes(qTopic) || qTopic.includes(titleUpper)) return true;
    if (topicId === 'and_or_not' && (qTopic === 'AND' || qTopic === 'OR' || qTopic === 'NOT')) return true;
    if (topicId === 'null' && (qTopic === 'IS NULL' || qTopic === 'IS NOT NULL')) return true;
    if (topicId === 'sum_avg' && (qTopic === 'SUM' || qTopic === 'AVG')) return true;
    if (topicId === 'min_max' && (qTopic === 'MIN' || qTopic === 'MAX')) return true;
    if (topicId === 'limit_offset' && qTopic === 'LIMIT') return true;
    return false;
  });
  
  const easy = matched.filter(q => q.difficulty === 'easy').sort(() => 0.5 - Math.random());
  const medium = matched.filter(q => q.difficulty === 'medium').sort(() => 0.5 - Math.random());
  const hard = matched.filter(q => q.difficulty === 'hard').sort(() => 0.5 - Math.random());

  return [...easy.slice(0, 1), ...medium.slice(0, 1), ...hard.slice(0, 1)];
}

function renderPracticeQuestions(questions) {
  if (questions.length === 0) return '';
  
  return `
    <div style="margin-top:40px; padding-top:40px; border-top:1.5px dashed #f2e7de;">
      <div style="color:#b86a7c; font-size:1.1rem; font-weight: 800; margin-bottom:20px; display:flex; align-items:center; gap:10px;">
        <span style="background:#fae0cd; color:#322b2b; width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center;">🎯</span> PRACTICE_LAB
      </div>
      <p style="margin-bottom:24px; color:#4a5568; opacity:0.8; font-size:0.9rem;">Apply what you've learned by solving these scenario-based problems.</p>
      
      <div id="practice-in-lesson">
        ${questions.map((q, i) => `
          <div id="lesson-q-${q.id}" style="border: 1.5px solid #eae1d7; padding: 30px; border-radius: 20px; background: #ffffff; margin-bottom: 25px; position: relative;">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:15px;">
              <span style="font-weight:700; font-size:1rem; color:#b86a7c;">QUESTION [${i + 1}]</span>
              <span style="background:#fbe6dd; color:#b86a7c; padding:4px 12px; border-radius:20px; font-weight:700; font-size:0.7rem;">LVL_${q.difficulty.toUpperCase()}</span>
            </div>
            <div style="margin-bottom:15px; font-size:0.95rem; line-height:1.6; color:#1a202c; font-weight:500;">${q.question}</div>
            
            <div style="background-color: #373e47; border-radius: 12px; overflow: hidden; margin-top: 15px; border: 1.5px solid #2d323a;">
              <div style="padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <div style="color: #92a4bd; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; font-weight: 600;">>_ PRACTICE_INPUT</div>
                <div style="display: flex; gap: 8px;">
                  <button style="background-color: rgba(178, 173, 213, 0.2); border: 1px solid #b2add5; border-radius: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: #b2add5; font-weight: 700; cursor: pointer;" data-action="show-hint" data-id="${q.id}">?</button>
                  <button style="background-color: #fae0cd; border: none; border-radius: 6px; padding: 0 12px; height: 28px; display: flex; align-items: center; justify-content: center; gap: 6px; color: #322b2b; font-weight: 700; cursor: pointer; box-shadow: 0 2px 0 #d9c0af;" data-action="run-practice" data-id="${q.id}">run</button>
                </div>
              </div>
              <textarea class="sql-editor" id="lesson-practice-editor-${q.id}" style="width:100%; height:90px; background:transparent; border:none; color:#a0c4ff; font-family:'JetBrains Mono', monospace; padding:15px 20px; outline:none; font-size:0.95rem; caret-color:#ffffff; display:block; resize:none;" placeholder="Enter your answer query..."></textarea>
            </div>
            
            <div class="hint-box" id="lesson-hint-${q.id}" style="margin-top:20px; border-radius:12px; border:1px dashed #ebcdc0; background:#fffbfc; color:#6a4c41; font-size:0.85rem; padding:15px; display:none;">💡 <b>Hint:</b> ${q.hint}</div>
            <div id="lesson-practice-result-${q.id}" style="margin-top:15px;"></div>
            <div id="lesson-practice-feedback-${q.id}" style="margin-top:10px;"></div>

            <button style="margin-top:20px; width:100%; background:#c0ebd0; border:1.5px solid #9dcdae; border-radius:10px; padding:12px; color:#437653; font-weight:800; font-family:'JetBrains Mono', monospace; cursor:pointer; box-shadow: 0 4px 0 #9dcdae;" data-action="check-practice" data-id="${q.id}">SUBMIT ANSWER</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function showLessonHint(qId) {
  const hintBox = document.getElementById(`lesson-hint-${qId}`);
  if (hintBox) hintBox.classList.add('visible');
}

function runLessonPractice(qId) {
  const editor = document.getElementById(`lesson-practice-editor-${qId}`);
  const resultDiv = document.getElementById(`lesson-practice-result-${qId}`);
  if (!editor || !resultDiv) return;
  
  const query = editor.value.trim();
  if (!query) {
    resultDiv.innerHTML = '<div class="feedback feedback-info"><span class="feedback-icon">ℹ️</span><span>Write a query and click Run.</span></div>';
    return;
  }
  
  const result = sqlEngine.exec(query);
  if (result.success) {
    resultDiv.innerHTML = sqlEngine.renderResults(result.results);
  } else {
    resultDiv.innerHTML = `<div class="feedback feedback-error"><span class="feedback-icon">❌</span><span>${escapeHtml(result.error)}</span></div>`;
  }
}

async function checkLessonPractice(qId) {
  // Find the question from all questions
  const allQ = [...QUESTIONS_DATA.easy, ...QUESTIONS_DATA.medium, ...QUESTIONS_DATA.hard];
  const q = allQ.find(qq => qq.id == qId);
  if (!q) return;
  
  const editor = document.getElementById(`lesson-practice-editor-${qId}`);
  const feedbackDiv = document.getElementById(`lesson-practice-feedback-${qId}`);
  const resultDiv = document.getElementById(`lesson-practice-result-${qId}`);
  if (!editor || !feedbackDiv) return;
  
  const userQuery = editor.value.trim();
  if (!userQuery) {
    feedbackDiv.innerHTML = '<div class="feedback feedback-info"><span class="feedback-icon">ℹ️</span><span>Please write a query first.</span></div>';
    return;
  }
  
  // Reset and run user query
  try { await sqlEngine.resetAndReload(); } catch(e) {}
  const userResult = sqlEngine.exec(userQuery);
  if (!userResult.success) {
    feedbackDiv.innerHTML = `<div class="feedback feedback-error"><span class="feedback-icon">❌</span><span>Query error: ${escapeHtml(userResult.error)}</span></div>`;
    resultDiv.innerHTML = '';
    return;
  }
  
  // Reset and run expected query
  try { await sqlEngine.resetAndReload(); } catch(e) {}
  const expectedResult = sqlEngine.exec(q.expected_query);
  
  // Show user results
  resultDiv.innerHTML = sqlEngine.renderResults(userResult.results);
  
  // Compare
  const isCorrect = compareResultSets(userResult.results, expectedResult.results);
  
  if (isCorrect) {
    feedbackDiv.innerHTML = `<div class="feedback feedback-success"><span class="feedback-icon">🎉</span><div><strong>Correct!</strong> Great job!</div></div>`;
    await ProgressManager.saveQuestion(q.id, true);
    // Visual indicator on the question card
    const card = document.getElementById(`lesson-q-${qId}`);
    if (card) card.style.borderColor = 'rgba(16, 185, 129, 0.4)';
  } else {
    feedbackDiv.innerHTML = `<div class="feedback feedback-error"><span class="feedback-icon">❌</span><div>
      <strong>Not quite right.</strong> Your results don't match.
      <div style="margin-top:8px; font-size:0.85rem; color:var(--text-muted);"><strong>Expected query:</strong><br>
        <code style="font-family:var(--font-mono); color:var(--accent-cyan);">${escapeHtml(q.expected_query)}</code>
      </div>
    </div></div>`;
    await ProgressManager.saveQuestion(q.id, false);
  }
}

function compareResultSets(userResults, expectedResults) {
  if (!userResults && !expectedResults) return true;
  if (!userResults || !expectedResults) return false;
  if (userResults.length !== expectedResults.length) return false;
  for (let i = 0; i < userResults.length; i++) {
    const ur = userResults[i], er = expectedResults[i];
    if (ur.columns.length !== er.columns.length) return false;
    if (ur.values.length !== er.values.length) return false;
    const uSorted = [...ur.values].map(r => r.map(String).join('|')).sort();
    const eSorted = [...er.values].map(r => r.map(String).join('|')).sort();
    for (let j = 0; j < uSorted.length; j++) {
      if (uSorted[j] !== eSorted[j]) return false;
    }
  }
  return true;
}

// ===== HELPERS =====
function findTopic(topicId) {
  for (const cat of LESSONS_DATA.categories) {
    const topic = cat.topics.find(t => t.id === topicId);
    if (topic) return topic;
  }
  return null;
}

function getPrevTopic(topicId) {
  const idx = currentCategoryTopics.findIndex(t => t.id === topicId);
  return idx > 0 ? currentCategoryTopics[idx - 1].id : null;
}

function getNextTopic(topicId) {
  const idx = currentCategoryTopics.findIndex(t => t.id === topicId);
  return idx < currentCategoryTopics.length - 1 ? currentCategoryTopics[idx + 1].id : null;
}

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    const activeEditor = document.querySelector('.sql-editor:focus');
    if (activeEditor) {
      // Determine which editor is focused
      if (activeEditor.id === 'lesson-editor') {
        runLessonQuery();
      } else if (activeEditor.id.startsWith('lesson-practice-editor-')) {
        const qId = parseInt(activeEditor.id.replace('lesson-practice-editor-', ''));
        runLessonPractice(qId);
      }
    }
  }
});
