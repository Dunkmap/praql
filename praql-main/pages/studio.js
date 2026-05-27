let currentSchema = {}; // To store the schema of uploaded tables
let lastQueryResults = null; // Store for exporting

document.addEventListener('DOMContentLoaded', async () => {
    // Make sure db is initialized but empty or with standard datasets
    try {
        await sqlEngine.init();
    } catch(e) {
        console.error("Failed to init db locally", e);
    }
    
    setupUploadZone();
    setupEditor();
});

function setupUploadZone() {
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    
    uploadZone.addEventListener('click', () => fileInput.click());
    
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });
    
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFiles(e.dataTransfer.files);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFiles(e.target.files);
        }
    });
}

async function handleFiles(files) {
    for (const file of files) {
        const ext = file.name.split('.').pop().toLowerCase();
        let tableName = file.name.split('.')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
        if (/^\d/.test(tableName)) tableName = 't_' + tableName; // Ensure valid sqlite table name
        
        if (ext === 'csv') {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => loadDataIntoDB(tableName, results.data)
            });
        } else if (ext === 'xls' || ext === 'xlsx') {
            const reader = new FileReader();
            reader.onload = function(e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                // Take the first sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                loadDataIntoDB(tableName, json);
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert(`Unsupported file type: ${ext}. Please upload .csv or .xlsx.`);
        }
    }
}

function loadDataIntoDB(tableName, data) {
    if (!data || data.length === 0) {
        alert("The uploaded file seems empty.");
        return;
    }
    
    // Get headers
    const headers = Object.keys(data[0]);
    
    // Create Table Statement
    const colsDefs = headers.map(h => `"${h}" TEXT`).join(', ');
    const createStmt = `DROP TABLE IF EXISTS ${tableName}; CREATE TABLE ${tableName} (${colsDefs});`;
    sqlEngine.exec(createStmt);
    
    // Prepare Data insertion
    // Since SQL.js doesn't support massive parameter lists natively in one swoop via exec easily,
    // we compile an insert statement and run it line by line to prevent query blocking
    try {
        const bindingsArr = headers.map(() => '?').join(',');
        const insertStmt = `INSERT INTO ${tableName} VALUES (${bindingsArr})`;
        const stmt = sqlEngine.db.prepare(insertStmt);
        
        data.forEach(row => {
            const values = headers.map(h => {
                let val = row[h];
                if (val === undefined || val === null) return '';
                return val.toString();
            });
            stmt.run(values);
        });
        stmt.free();
        
        // Track the table
        currentSchema[tableName] = headers;
        updateTableChips();
        
        const studioEditor = document.getElementById('studio-editor');
        if (studioEditor) studioEditor.value = `SELECT * FROM ${tableName}\nLIMIT 10;`;
        
    } catch(e) {
        setFeedback(`Failed to insert data: ${e.message}`, 'error');
    }
}

function updateTableChips() {
    const container = document.getElementById('loaded-tables-container');
    const chipBox = document.getElementById('table-chips');
    if (!container || !chipBox) return;

    chipBox.innerHTML = '';
    
    const tables = Object.keys(currentSchema);
    if(tables.length === 0){
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    tables.forEach(table => {
        const chip = document.createElement('div');
        chip.className = 'table-chip';
        chip.style.cursor = 'pointer';
        chip.innerHTML = `
           📊 <span class="chip-name" style="text-decoration: underline; text-underline-offset: 3px;">${table}</span>
           <span class="chip-remove" data-table="${table}" style="margin-left:8px; opacity:0.6;">✕</span>
        `;
        chip.addEventListener('click', (e) => {
            if (e.target.classList.contains('chip-remove')) {
                removeTable(table);
            } else {
                showTablePreview(table);
            }
        });
        chipBox.appendChild(chip);
    });
}

async function showTablePreview(tableName) {
    const previewContainer = document.getElementById('studio-table-preview');
    const previewContent = document.getElementById('studio-preview-content');
    if (!previewContainer || !previewContent) return;

    previewContainer.style.display = 'block';
    previewContent.innerHTML = '<div style="padding:20px; text-align:center; color:#b86a7c; font-weight:700;">FETCHING_PREVIEW...</div>';

    try {
        const result = sqlEngine.exec(`SELECT * FROM ${tableName} LIMIT 5`);
        const schema = sqlEngine.exec(`PRAGMA table_info(${tableName})`);

        if (result.success && schema.success) {
            const cols = schema.results[0].values.map(v => v[1]).join(', ');
            previewContent.innerHTML = `
                <div style="padding:12px; border-bottom:1.5px solid #f2e7de; background:#fcfcfc;">
                    <div style="font-size:0.65rem; font-weight:800; color:#718096; letter-spacing:1px; margin-bottom:4px;">COLUMN_MAP</div>
                    <div style="font-size:0.75rem; color:#b86a7c; font-family:'JetBrains Mono',monospace;">${cols}</div>
                </div>
                <div style="padding:5px;">
                    ${sqlEngine.renderResults(result.results)}
                </div>
            `;
            // Compact the preview results
            previewContent.querySelectorAll('.result-container').forEach(r => {
                r.style.marginTop = '0';
                r.style.boxShadow = 'none';
                r.style.borderRadius = '0';
            });
        }
    } catch(e) {
        previewContent.innerHTML = `<div style="padding:20px; color:#e53e3e;">Error: ${e.message}</div>`;
    }
}

function removeTable(tableName) {
    try {
        sqlEngine.exec(`DROP TABLE ${tableName}`);
        delete currentSchema[tableName];
        updateTableChips();
        setFeedback(`Dropped table ${tableName}`, 'info');
    } catch(e) {}
}

function setupEditor() {
    const runBtn = document.getElementById('run-btn');
    const editor = document.getElementById('studio-editor');
    const chipBox = document.getElementById('table-chips');
    const exportCsv = document.getElementById('export-csv-btn');
    const exportExcel = document.getElementById('export-excel-btn');

    if (runBtn) runBtn.addEventListener('click', runAnalysis);
    
    if (editor) {
        editor.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                runAnalysis();
            }
        });
    }

    /* Handled via individual chip listeners in updateTableChips */
    if (exportCsv) exportCsv.addEventListener('click', () => exportData('csv'));
    if (exportExcel) exportExcel.addEventListener('click', () => exportData('xlsx'));
}

function runAnalysis() {
    const editor = document.getElementById('studio-editor');
    const resultDiv = document.getElementById('studio-result');
    const exportDiv = document.getElementById('export-actions');
    const query = editor.value.trim();
    
    if (!query) {
        setFeedback("Please write an analysis query first.", 'info');
        exportDiv.style.display = 'none';
        return;
    }
    
    const startTime = performance.now();
    const result = sqlEngine.exec(query);
    const elapsed = (performance.now() - startTime).toFixed(1);
    
    const execTimeEl = document.getElementById('exec-time');
    if (execTimeEl) execTimeEl.textContent = `⏱ ${elapsed}ms`;
    
    if (result.success) {
        if (result.results && result.results.length > 0) {
           lastQueryResults = result.results[0]; // Take primary output
           resultDiv.innerHTML = sqlEngine.renderResults(result.results);
           exportDiv.style.display = 'flex';
        } else {
           lastQueryResults = null;
           exportDiv.style.display = 'none';
           resultDiv.innerHTML = '<div class="feedback feedback-info">Query executed. No rows returned.</div>';
        }
    } else {
        lastQueryResults = null;
        exportDiv.style.display = 'none';
        resultDiv.innerHTML = `<div class="feedback feedback-error"><span class="feedback-icon">❌</span><div><strong>Wrong!</strong><br><span style="font-size:0.9em; opacity:0.9;">Your query has an error: ${escapeHtml(result.error)}</span></div></div>`;
    }
}

function setFeedback(msg, type) {
    const resultDiv = document.getElementById('studio-result');
    let icon = 'ℹ️';
    if(type === 'success') icon = '✅';
    if(type === 'error') icon = '❌';
    
    resultDiv.innerHTML = `<div class="feedback feedback-${type}" style="margin-top: 20px;"><span class="feedback-icon">${icon}</span><span>${msg}</span></div>`;
}

function exportData(format) {
    if(!lastQueryResults || !lastQueryResults.columns) return;
    
    // Convert to Array of Objects
    const dataObj = lastQueryResults.values.map(row => {
       const rowData = {};
       lastQueryResults.columns.forEach((col, idx) => {
           rowData[col] = row[idx];
       });
       return rowData;
    });

    // Use SheetJS to convert and download
    const worksheet = XLSX.utils.json_to_sheet(dataObj);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Analysis_Outputs");

    if (format === 'csv') {
        XLSX.writeFile(workbook, "SQL_Master_Export.csv", { bookType: "csv" });
    } else {
        XLSX.writeFile(workbook, "SQL_Master_Export.xlsx", { bookType: "xlsx" });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
