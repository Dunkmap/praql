/**
 * SQL Playground - Free-form SQL execution
 */
let queryHistory = [];

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await sqlEngine.init();
    await sqlEngine.loadAllDatasets();
    setupEventListeners();
    
    // Default show employees schema on load
    loadSchemaHint('employees');
  } catch (e) {
    console.error('SQL Engine init failed:', e);
    const resultDiv = document.getElementById('playground-result');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div class="feedback feedback-error">
          <span class="feedback-icon">❌</span>
          <span>Failed to initialize SQL engine: ${e.message}</span>
        </div>`;
    }
  }
});

function setupEventListeners() {
  const runBtn = document.getElementById('run-btn');
  const clearEditorBtn = document.getElementById('clear-editor-btn');
  const resetDbBtn = document.getElementById('reset-db-btn');
  const schemaBtn = document.getElementById('schema-btn');
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  const closeSchemaBtn = document.getElementById('close-schema-btn');

  if (runBtn) runBtn.addEventListener('click', runPlayground);
  if (clearEditorBtn) clearEditorBtn.addEventListener('click', clearEditor);
  if (resetDbBtn) resetDbBtn.addEventListener('click', resetDatabase);
  if (schemaBtn) schemaBtn.addEventListener('click', showSchemaModal);
  if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearHistory);
  if (closeSchemaBtn) closeSchemaBtn.addEventListener('click', closeSchemaModal);

  // Delegate history clicks
  const historyContainer = document.getElementById('query-history');
  if (historyContainer) {
    historyContainer.addEventListener('click', (e) => {
      const item = e.target.closest('.history-item');
      if (item) {
        loadFromHistory(parseInt(item.dataset.index));
      }
    });
  }

  // Dataset chips
  document.querySelectorAll('.dataset-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      // Remove active from all, add to clicked
      document.querySelectorAll('.dataset-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      
      const datasetName = chip.dataset.ds;
      loadSchemaHint(datasetName);
      
      // Flash animation on schema hint
      const hint = document.getElementById('schema-hint');
      if (hint) {
        hint.style.animation = 'none';
        hint.offsetHeight; /* trigger reflow */
        hint.style.animation = 'slideUp 0.3s ease';
      }
    });
  });
}

function loadSchemaHint(tableName) {
  const schemaHint = document.getElementById('schema-hint');
  if (!schemaHint) return;
  
  try {
    const result = sqlEngine.exec(`SELECT * FROM ${tableName} LIMIT 1`);
    if (result.success && result.results && result.results.length > 0) {
      const cols = result.results[0].columns;
      schemaHint.innerHTML = `<span style="color:var(--text-muted);">Columns in ${tableName}:</span> ` + 
        cols.map(c => `<span style="background:rgba(45,212,191,0.1); color:var(--accent-cyan); padding:2px 8px; border-radius:4px; font-weight:700;">${c}</span>`).join('');
    } else {
      schemaHint.innerHTML = `<span style="color:var(--text-muted);">Table ${tableName} is empty or not found.</span>`;
    }
  } catch (e) {
    schemaHint.innerHTML = '';
  }
}

function runPlayground() {
  const editor = document.getElementById('playground-editor');
  const resultDiv = document.getElementById('playground-result');
  const execTime = document.getElementById('exec-time');
  const query = editor.value.trim();

  if (!query) {
    resultDiv.innerHTML = '<div class="feedback feedback-info"><span class="feedback-icon">ℹ️</span><span>Enter a query and click Run.</span></div>';
    return;
  }

  const startTime = performance.now();
  const result = sqlEngine.exec(query);
  const elapsed = (performance.now() - startTime).toFixed(1);

  const execTimeEl = document.getElementById('exec-time');
  if (execTimeEl) execTimeEl.textContent = `⏱ ${elapsed}ms`;

  if (result.success) {
    resultDiv.innerHTML = sqlEngine.renderResults(result.results);
    addToHistory(query, true);
  } else {
    resultDiv.innerHTML = `<div class="feedback feedback-error"><span class="feedback-icon">❌</span><div><strong>Wrong!</strong><br><span style="font-size:0.85em; opacity:0.7;">Check your syntax and try again.</span></div></div>`;
    addToHistory(query, false);
  }
}

function clearEditor() {
  const editor = document.getElementById('playground-editor');
  if (editor) editor.value = '';
  
  const resultDiv = document.getElementById('playground-result');
  if (resultDiv) {
    resultDiv.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🚀</div>
        <div class="empty-state-title">Ready for Takeoff</div>
        <div class="empty-state-description">Compose your SQL query in the editor above and launch it to explore the data.</div>
      </div>`;
  }
  
  const execTimeEl = document.getElementById('exec-time');
  if (execTimeEl) execTimeEl.textContent = '';
}

async function resetDatabase() {
  try {
    await sqlEngine.resetAndReload();
    document.getElementById('playground-result').innerHTML = `
      <div class="feedback feedback-success">
        <span class="feedback-icon">✅</span>
        <span>Database reset successfully! All datasets reloaded.</span>
      </div>`;
  } catch (e) {
    document.getElementById('playground-result').innerHTML = `
      <div class="feedback feedback-error">
        <span class="feedback-icon">❌</span>
        <span>Failed to reset database: ${e.message}</span>
      </div>`;
  }
}

function addToHistory(query, success) {
  queryHistory.unshift({ query, success, time: new Date().toLocaleTimeString() });
  if (queryHistory.length > 20) queryHistory.pop();
  renderHistory();
}

function renderHistory() {
  const container = document.getElementById('query-history');
  if (queryHistory.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:16px;">
        <div class="empty-state-icon" style="font-size: 2rem; margin-bottom: 8px;">⌨️</div>
        <div class="empty-state-title" style="font-size: 1rem;">No History</div>
        <div class="empty-state-description" style="font-size: 0.8rem;">Queries you run will appear here.</div>
      </div>`;
    return;
  }

  container.innerHTML = queryHistory.map((h, i) => `
    <div class="history-item" data-index="${i}">
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
        <span style="color:${h.success ? 'var(--accent-green)' : 'var(--accent-red)'}">${h.success ? '✓' : '✕'}</span>
        <span style="font-size:0.7rem; color:var(--text-muted);">${h.time}</span>
      </div>
      <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:100%;">${escapeHtml(h.query.substring(0, 60))}${h.query.length > 60 ? '...' : ''}</div>
    </div>
  `).join('');
}

function loadFromHistory(index) {
  const h = queryHistory[index];
  if (h) {
    const editor = document.getElementById('playground-editor');
    if (editor) editor.value = h.query;
  }
}

function clearHistory() {
  queryHistory = [];
  renderHistory();
}

// Schema Modal
function showSchemaModal() {
  const modal = document.getElementById('schema-modal');
  modal.style.display = 'flex';
  
  const schemas = {
    employees: {
      columns: [
        { name: 'id', type: 'INTEGER', constraint: 'PRIMARY KEY' },
        { name: 'name', type: 'TEXT', constraint: 'NOT NULL' },
        { name: 'department', type: 'TEXT', constraint: 'NOT NULL' },
        { name: 'salary', type: 'INTEGER', constraint: 'NOT NULL' },
        { name: 'hire_date', type: 'TEXT', constraint: '' },
        { name: 'manager_id', type: 'INTEGER', constraint: '' },
        { name: 'age', type: 'INTEGER', constraint: '' },
        { name: 'city', type: 'TEXT', constraint: '' },
        { name: 'email', type: 'TEXT', constraint: '' }
      ]
    },
    customers: {
      columns: [
        { name: 'id', type: 'INTEGER', constraint: 'PRIMARY KEY' },
        { name: 'name', type: 'TEXT', constraint: 'NOT NULL' },
        { name: 'email', type: 'TEXT', constraint: '' },
        { name: 'city', type: 'TEXT', constraint: '' },
        { name: 'country', type: 'TEXT', constraint: '' },
        { name: 'signup_date', type: 'TEXT', constraint: '' },
        { name: 'loyalty_tier', type: 'TEXT', constraint: '' }
      ]
    },
    products: {
      columns: [
        { name: 'id', type: 'INTEGER', constraint: 'PRIMARY KEY' },
        { name: 'name', type: 'TEXT', constraint: 'NOT NULL' },
        { name: 'category', type: 'TEXT', constraint: 'NOT NULL' },
        { name: 'price', type: 'REAL', constraint: 'NOT NULL' },
        { name: 'stock', type: 'INTEGER', constraint: 'NOT NULL' },
        { name: 'supplier', type: 'TEXT', constraint: '' },
        { name: 'rating', type: 'REAL', constraint: '' }
      ]
    },
    orders: {
      columns: [
        { name: 'id', type: 'INTEGER', constraint: 'PRIMARY KEY' },
        { name: 'customer_id', type: 'INTEGER', constraint: 'FK → customers' },
        { name: 'product_id', type: 'INTEGER', constraint: 'FK → products' },
        { name: 'quantity', type: 'INTEGER', constraint: 'NOT NULL' },
        { name: 'order_date', type: 'TEXT', constraint: 'NOT NULL' },
        { name: 'total_amount', type: 'REAL', constraint: 'NOT NULL' },
        { name: 'status', type: 'TEXT', constraint: 'NOT NULL' }
      ]
    },
    sales: {
      columns: [
        { name: 'id', type: 'INTEGER', constraint: 'PRIMARY KEY' },
        { name: 'employee_id', type: 'INTEGER', constraint: 'FK → employees' },
        { name: 'product_id', type: 'INTEGER', constraint: 'FK → products' },
        { name: 'sale_date', type: 'TEXT', constraint: 'NOT NULL' },
        { name: 'quantity', type: 'INTEGER', constraint: 'NOT NULL' },
        { name: 'revenue', type: 'REAL', constraint: 'NOT NULL' },
        { name: 'region', type: 'TEXT', constraint: 'NOT NULL' },
        { name: 'quarter', type: 'TEXT', constraint: '' }
      ]
    }
  };

  const content = document.getElementById('schema-content');
  content.innerHTML = Object.entries(schemas).map(([table, schema]) => `
    <div style="margin-bottom:20px;">
      <h3 style="font-size:1rem; margin-bottom:8px; color:var(--accent-blue-light);">📋 ${table}</h3>
      <table class="schema-table">
        <thead>
          <tr><th>Column</th><th>Type</th><th>Constraint</th></tr>
        </thead>
        <tbody>
          ${schema.columns.map(c => `
            <tr>
              <td>${c.name}</td>
              <td style="color:var(--accent-orange)">${c.type}</td>
              <td style="color:var(--accent-green)">${c.constraint}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('');
}

function closeSchemaModal() {
  const modal = document.getElementById('schema-modal');
  if (modal) modal.style.display = 'none';
}

// Close modal on outside click
document.getElementById('schema-modal')?.addEventListener('click', (e) => {
  if (e.target.id === 'schema-modal') closeSchemaModal();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    runPlayground();
  }
  if (e.key === 'Escape') {
    closeSchemaModal();
  }
});
