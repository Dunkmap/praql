import { escapeHtml } from '../engine/sql-engine.js';

/* ================================================================
   LEETCODE — Extension Promo & Download Page
   ================================================================ */

export function renderLeetcode() {
  return `
  <div style="max-width:860px;margin:0 auto;">

    <!-- Hero -->
    <div style="text-align:center;margin-bottom:48px;">
      <div style="font-size:4rem;margin-bottom:12px;"></div>
      <h1 class="page-title" style="font-size:2.2rem;margin-bottom:10px;">SQL Master × LeetCode</h1>
      <p class="page-subtitle" style="max-width:520px;margin:0 auto;line-height:1.8;">
        Supercharge your LeetCode SQL workflow with our browser extension. Auto-capture problems, AI-powered solution write-ups, and seamless integration.
      </p>
    </div>

    <!-- Feature Cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;margin-bottom:40px;">
      <div class="card" style="text-align:center;padding:32px 24px;">
        <div style="font-size:2.5rem;margin-bottom:14px;"></div>
        <div style="font-weight:900;font-size:1rem;color:var(--text-primary);margin-bottom:8px;">Auto-Capture</div>
        <p style="font-size:0.82rem;color:var(--text-muted);font-weight:600;line-height:1.7;">
          Automatically captures SQL problems as you browse LeetCode. Every problem is saved locally for practice.
        </p>
      </div>
      <div class="card" style="text-align:center;padding:32px 24px;">
        <div style="font-size:2.5rem;margin-bottom:14px;"></div>
        <div style="font-weight:900;font-size:1rem;color:var(--text-primary);margin-bottom:8px;">AI Auto-Fill</div>
        <p style="font-size:0.82rem;color:var(--text-muted);font-weight:600;line-height:1.7;">
          One-click AI generates Intuition, Approach & Complexity analysis for your LeetCode solutions.
        </p>
      </div>
      <div class="card" style="text-align:center;padding:32px 24px;">
        <div style="font-size:2.5rem;margin-bottom:14px;"></div>
        <div style="font-weight:900;font-size:1rem;color:var(--text-primary);margin-bottom:8px;">Clause Detection</div>
        <p style="font-size:0.82rem;color:var(--text-muted);font-weight:600;line-height:1.7;">
          Automatically categorizes problems by SQL clauses — JOINs, GROUP BY, Window Functions, and more.
        </p>
      </div>
    </div>

    <!-- How It Works -->
    <div class="card" style="margin-bottom:40px;padding:36px;">
      <div class="card-title" style="margin-bottom:24px;text-align:center;font-size:0.9rem;"> How It Works</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px;">
        <div style="text-align:center;">
          <div style="width:44px;height:44px;border-radius:50%;background:var(--accent-pink-light);color:var(--accent-primary);display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:1.1rem;margin-bottom:12px;">1</div>
          <div style="font-weight:800;font-size:0.88rem;color:var(--text-primary);margin-bottom:6px;">Install Extension</div>
          <div style="font-size:0.78rem;color:var(--text-muted);font-weight:600;line-height:1.6;">Download and enable the Chrome extension in one click.</div>
        </div>
        <div style="text-align:center;">
          <div style="width:44px;height:44px;border-radius:50%;background:var(--accent-green-light);color:var(--accent-green-dark);display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:1.1rem;margin-bottom:12px;">2</div>
          <div style="font-weight:800;font-size:0.88rem;color:var(--text-primary);margin-bottom:6px;">Solve on LeetCode</div>
          <div style="font-size:0.78rem;color:var(--text-muted);font-weight:600;line-height:1.6;">Open any SQL problem on LeetCode. The extension activates automatically.</div>
        </div>
        <div style="text-align:center;">
          <div style="width:44px;height:44px;border-radius:50%;background:#fef3c7;color:#92400e;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:1.1rem;margin-bottom:12px;">3</div>
          <div style="font-weight:800;font-size:0.88rem;color:var(--text-primary);margin-bottom:6px;">AI Does the Rest</div>
          <div style="font-size:0.78rem;color:var(--text-muted);font-weight:600;line-height:1.6;">Hit " AI Auto Fill" to generate complete solution write-ups instantly.</div>
        </div>
      </div>
    </div>

    <!-- Demo Preview -->
    <div class="card" style="margin-bottom:40px;padding:0;overflow:hidden;">
      <div style="padding:20px 24px;border-bottom:1.5px solid var(--border-color);">
        <div class="card-title" style="margin:0;"> What You Get on LeetCode</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;">
        <!-- Before -->
        <div style="padding:24px;border-right:1.5px solid var(--border-color);">
          <div style="font-weight:800;font-size:0.72rem;color:var(--accent-red);text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;"> Without Extension</div>
          <div style="background:var(--bg-editor);border-radius:8px;padding:16px;font-family:var(--font-mono);font-size:0.8rem;color:#6b7280;line-height:1.8;">
            <div style="color:#6272a4;">-- Solve the problem</div>
            <div style="color:#6272a4;">-- Manually write intuition</div>
            <div style="color:#6272a4;">-- Figure out complexity</div>
            <div style="color:#6272a4;">-- Format the solution post</div>
            <div style="color:#ff6b6b;margin-top:8px;font-weight:700;"> ~15 minutes per solution</div>
          </div>
        </div>
        <!-- After -->
        <div style="padding:24px;">
          <div style="font-weight:800;font-size:0.72rem;color:var(--accent-green-dark);text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;"> With SQL Master</div>
          <div style="background:var(--bg-editor);border-radius:8px;padding:16px;font-family:var(--font-mono);font-size:0.8rem;color:#a0c4ff;line-height:1.8;">
            <div><span style="color:#ff79c6;font-weight:700;">1.</span> Write your SQL solution</div>
            <div><span style="color:#ff79c6;font-weight:700;">2.</span> Click  AI Auto Fill</div>
            <div><span style="color:#ff79c6;font-weight:700;">3.</span> Done! Post your solution</div>
            <div style="color:var(--accent-green);margin-top:8px;font-weight:700;"> ~10 seconds per solution</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Keyboard Shortcut -->
    <div class="card" style="margin-bottom:40px;padding:24px;text-align:center;background:var(--bg-tertiary);">
      <div style="font-weight:800;font-size:0.78rem;color:var(--text-muted);margin-bottom:10px;"> PRO TIP</div>
      <div style="font-size:1rem;font-weight:800;color:var(--text-primary);">
        Press <kbd style="padding:4px 10px;background:var(--bg-editor);color:#a0c4ff;border-radius:6px;font-size:0.88rem;border:1px solid #2d323a;">ALT</kbd> + <kbd style="padding:4px 10px;background:var(--bg-editor);color:#a0c4ff;border-radius:6px;font-size:0.88rem;border:1px solid #2d323a;">Q</kbd>
        to force-capture any LeetCode problem instantly
      </div>
    </div>

    <!-- Download CTA -->
    <div class="card" style="text-align:center;padding:48px 40px;border-color:var(--accent-primary);border-width:2px;background:linear-gradient(135deg, var(--accent-pink-light) 0%, var(--bg-card) 100%);">
      <div style="font-size:3rem;margin-bottom:16px;"></div>
      <div style="font-weight:900;font-size:1.5rem;color:var(--text-primary);margin-bottom:8px;">Ready to Level Up?</div>
      <p style="font-size:0.88rem;color:var(--text-muted);font-weight:600;max-width:400px;margin:0 auto 28px;line-height:1.7;">
        Install the SQL Master Chrome extension and transform your LeetCode experience forever.
      </p>
      <a href="https://github.com/Dunkmap/praql/releases" target="_blank" rel="noopener noreferrer"
         class="btn btn-primary" id="download-ext-btn"
         style="padding:16px 44px;font-size:1.05rem;font-weight:900;display:inline-flex;gap:10px;text-decoration:none;">
         Download Extension
      </a>
      <div style="margin-top:16px;font-size:0.75rem;color:var(--text-muted);font-weight:700;">
        Free & Open Source • Chrome / Edge / Brave • v1.1.0
      </div>
    </div>

  </div>`;
}

export function initLeetcode() {
  // Nothing dynamic needed — it's a static promo page
}
