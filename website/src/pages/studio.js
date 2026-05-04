import { sqlEngine, escapeHtml, setupSyntaxHighlighting } from '../engine/sql-engine.js';

let uploadedTables = [];

export function renderStudio() {
  return `
  <div class="page-header">
    <h1 class="page-title">📊 Data Studio</h1>
    <p class="page-subtitle">Upload CSV or Excel files and query them with SQL.</p>
  </div>

  <div class="upload-zone" id="upload-zone">
    <div style="font-size:2.5rem;margin-bottom:12px;">☁️</div>
    <div style="font-weight:800;font-size:1.1rem;color:var(--text-primary);margin-bottom:4px;">Click or drag files here</div>
    <div style="font-size:0.8rem;color:var(--text-muted);font-weight:600;">Supports .CSV, .XLS, .XLSX (max 10MB)</div>
    <input type="file" id="file-input" accept=".csv,.xls,.xlsx" multiple style="display:none;">
  </div>

  <div id="loaded-tables" style="display:none;margin-bottom:24px;">
    <div style="font-size:0.75rem;color:var(--text-muted);font-weight:800;margin-bottom:8px;letter-spacing:1px;">ACTIVE TABLES</div>
    <div id="table-chips" style="display:flex;gap:8px;flex-wrap:wrap;"></div>
  </div>

  <div class="card">
    <div class="editor-chrome">
      <div class="editor-chrome-bar">
        <span class="editor-chrome-label">>_ ANALYSIS_INPUT</span>
        <button class="btn btn-sm btn-accent" id="studio-run-btn">▶ Run</button>
      </div>
      <textarea class="sql-editor" id="studio-editor" placeholder="Write SQL to query your uploaded data..."></textarea>
    </div>

    <div id="exec-time" style="text-align:right;font-size:0.72rem;color:var(--text-muted);font-weight:700;margin-top:8px;"></div>

    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:20px;margin-bottom:12px;">
      <div style="font-weight:800;color:var(--accent-primary);font-size:0.85rem;">OUTPUT_RESULTS</div>
      <div id="export-actions" style="display:none;gap:8px;">
        <button class="btn btn-sm btn-primary" id="export-csv-btn">CSV Export</button>
      </div>
    </div>
    <div id="studio-result">
      <div style="padding:48px;text-align:center;border:1.5px dashed var(--border-color);border-radius:var(--radius-lg);color:var(--text-muted);">
        <div style="font-size:2rem;margin-bottom:12px;">📊</div>
        <div style="font-weight:800;color:var(--text-primary);margin-bottom:4px;">Awaiting Query...</div>
        <div style="font-size:0.82rem;">Upload sheets and write a query.</div>
      </div>
    </div>
  </div>`;
}

export function initStudio() {
  const zone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');

  zone?.addEventListener('click', () => fileInput?.click());
  zone?.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
  zone?.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone?.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
  fileInput?.addEventListener('change', e => handleFiles(e.target.files));

  document.getElementById('studio-run-btn')?.addEventListener('click', runStudio);
  document.getElementById('export-csv-btn')?.addEventListener('click', exportCSV);

  document.addEventListener('keydown', e => { if (e.ctrlKey && e.key === 'Enter') runStudio(); });
  setTimeout(setupSyntaxHighlighting, 100);
}

async function handleFiles(files) {
  for (const file of files) {
    const ext = file.name.split('.').pop().toLowerCase();
    let data;
    if (ext === 'csv') {
      const text = await file.text();
      if (typeof Papa !== 'undefined') {
        data = Papa.parse(text, { header: true, skipEmptyLines: true }).data;
      } else {
        // Simple CSV parse fallback
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        data = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row = {};
          headers.forEach((h, i) => row[h] = vals[i] || '');
          return row;
        });
      }
    } else if (ext === 'xls' || ext === 'xlsx') {
      if (typeof XLSX === 'undefined') { alert('Excel parser not loaded'); continue; }
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      data = XLSX.utils.sheet_to_json(sheet);
    }

    if (data && data.length > 0) {
      const tableName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      const columns = Object.keys(data[0]);
      const colDefs = columns.map(c => `"${c}" TEXT`).join(', ');

      try {
        sqlEngine.exec(`DROP TABLE IF EXISTS ${tableName}`);
        sqlEngine.exec(`CREATE TABLE ${tableName} (${colDefs})`);
        for (const row of data) {
          const vals = columns.map(c => `'${String(row[c] || '').replace(/'/g, "''")}'`).join(', ');
          sqlEngine.exec(`INSERT INTO ${tableName} VALUES (${vals})`);
        }
        uploadedTables.push({ name: tableName, columns, rowCount: data.length });
        renderTableChips();
      } catch (e) { console.error('Import error:', e); }
    }
  }
}

function renderTableChips() {
  const container = document.getElementById('table-chips');
  const wrapper = document.getElementById('loaded-tables');
  if (!container || !wrapper) return;
  wrapper.style.display = uploadedTables.length > 0 ? 'block' : 'none';
  container.innerHTML = uploadedTables.map((t, i) => `
    <span style="display:inline-flex;align-items:center;gap:8px;padding:8px 14px;background:var(--bg-card);border:1.5px solid var(--border-color);border-radius:var(--radius-sm);font-size:0.8rem;font-weight:800;">
      📊 ${t.name} <span style="opacity:0.5">(${t.rowCount} rows)</span>
      <span style="color:var(--accent-red);cursor:pointer;" data-idx="${i}" class="remove-table">✕</span>
    </span>
  `).join('');
  container.querySelectorAll('.remove-table').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      sqlEngine.exec(`DROP TABLE IF EXISTS ${uploadedTables[idx].name}`);
      uploadedTables.splice(idx, 1);
      renderTableChips();
    });
  });
}

let lastResults = null;
function runStudio() {
  const query = document.getElementById('studio-editor')?.value.trim();
  const resDiv = document.getElementById('studio-result');
  const timeDiv = document.getElementById('exec-time');
  if (!query) return;
  const start = performance.now();
  const result = sqlEngine.exec(query);
  const elapsed = (performance.now() - start).toFixed(1);
  timeDiv.textContent = `⏱ ${elapsed}ms`;
  if (result.success) {
    lastResults = result.results;
    resDiv.innerHTML = sqlEngine.renderResults(result.results);
    document.getElementById('export-actions').style.display = result.results?.length > 0 ? 'flex' : 'none';
  } else {
    resDiv.innerHTML = `<div class="feedback feedback-error"><span class="feedback-icon">❌</span><span>${escapeHtml(result.error)}</span></div>`;
  }
}

function exportCSV() {
  if (!lastResults || lastResults.length === 0) return;
  const r = lastResults[0];
  let csv = r.columns.join(',') + '\n';
  r.values.forEach(row => { csv += row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',') + '\n'; });
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'query_result.csv';
  a.click();
}
