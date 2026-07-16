import { escapeHtml } from '../engine/sql-engine.js';

/* ================================================================
   SQLENS — Independent SQL Study Companion
   ================================================================ */

export function renderLeetcode() {
  return `
  <div style="max-width:860px;margin:0 auto;">

    <!-- Hero -->
    <div style="text-align:center;margin-bottom:48px;">
      <div style="font-size:4rem;margin-bottom:12px;"></div>
      <h1 class="page-title" style="font-size:2.2rem;margin-bottom:10px;">SQLens</h1>
      <p class="page-subtitle" style="max-width:560px;margin:0 auto;line-height:1.8;">
        Your personal SQL study companion — designed to support coding practice and personal study with guided examples, smart assistance, and structured review.
      </p>
    </div>

    <!-- Product Positioning -->
    <div class="card" style="margin-bottom:40px;padding:36px;border-left:4px solid var(--accent-primary);background:linear-gradient(135deg, var(--accent-pink-light) 0%, var(--bg-card) 100%);">
      <div class="card-title" style="margin-bottom:16px;font-size:0.9rem;"> Our Philosophy</div>
      <p style="font-size:0.85rem;color:var(--text-secondary);font-weight:600;line-height:1.85;margin:0;">
        SQLens is an <strong style="color:var(--text-primary);">independent educational tool</strong> built to support coding practice and personal study. It helps learners strengthen their SQL query logic through guided examples, reduces repetitive typing with smart input assistance, and generates structured study notes for offline review. The tool is offered <strong style="color:var(--text-primary);">strictly for personal educational use</strong> and is not affiliated with, endorsed by, or connected to LeetCode or any other third‑party platform.
      </p>
    </div>

    <!-- Feature Cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;margin-bottom:40px;">
      <div class="card" style="text-align:center;padding:32px 24px;">
        <div style="font-size:2.5rem;margin-bottom:14px;">📖</div>
        <div style="font-weight:900;font-size:1rem;color:var(--text-primary);margin-bottom:8px;">Guided SQL Practice</div>
        <p style="font-size:0.82rem;color:var(--text-muted);font-weight:600;line-height:1.7;">
          Curated practice examples organized by concept — from basic SELECTs to advanced Window Functions — helping you build strong query logic step by step.
        </p>
      </div>
      <div class="card" style="text-align:center;padding:32px 24px;">
        <div style="font-size:2.5rem;margin-bottom:14px;">✍️</div>
        <div style="font-weight:900;font-size:1rem;color:var(--text-primary);margin-bottom:8px;">Smart Input Assistance</div>
        <p style="font-size:0.82rem;color:var(--text-muted);font-weight:600;line-height:1.7;">
          Intelligent writing support that reduces repetitive typing during practice sessions, letting you focus on understanding query patterns instead of boilerplate.
        </p>
      </div>
      <div class="card" style="text-align:center;padding:32px 24px;">
        <div style="font-size:2.5rem;margin-bottom:14px;">📝</div>
        <div style="font-weight:900;font-size:1rem;color:var(--text-primary);margin-bottom:8px;">Study Notes Generation</div>
        <p style="font-size:0.82rem;color:var(--text-muted);font-weight:600;line-height:1.7;">
          Automatically generates structured study notes — including intuition, approach breakdown, and complexity analysis — for offline review and revision.
        </p>
      </div>
    </div>

    <!-- How It Works -->
    <div class="card" style="margin-bottom:40px;padding:36px;">
      <div class="card-title" style="margin-bottom:24px;text-align:center;font-size:0.9rem;"> How It Works</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px;">
        <div style="text-align:center;">
          <div style="width:44px;height:44px;border-radius:50%;background:var(--accent-pink-light);color:var(--accent-primary);display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:1.1rem;margin-bottom:12px;">1</div>
          <div style="font-weight:800;font-size:0.88rem;color:var(--text-primary);margin-bottom:6px;">Install the Extension</div>
          <div style="font-size:0.78rem;color:var(--text-muted);font-weight:600;line-height:1.6;">Add the Chrome extension in a single click to enhance your personal study workflow.</div>
        </div>
        <div style="text-align:center;">
          <div style="width:44px;height:44px;border-radius:50%;background:var(--accent-green-light);color:var(--accent-green-dark);display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:1.1rem;margin-bottom:12px;">2</div>
          <div style="font-weight:800;font-size:0.88rem;color:var(--text-primary);margin-bottom:6px;">Practice SQL Problems</div>
          <div style="font-size:0.78rem;color:var(--text-muted);font-weight:600;line-height:1.6;">Work through SQL problems at your own pace. The extension provides contextual study support as you practice.</div>
        </div>
        <div style="text-align:center;">
          <div style="width:44px;height:44px;border-radius:50%;background:#fef3c7;color:#92400e;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:1.1rem;margin-bottom:12px;">3</div>
          <div style="font-weight:800;font-size:0.88rem;color:var(--text-primary);margin-bottom:6px;">Review & Revise</div>
          <div style="font-size:0.78rem;color:var(--text-muted);font-weight:600;line-height:1.6;">Generate comprehensive study notes to review concepts offline and strengthen your understanding over time.</div>
        </div>
      </div>
    </div>

    <!-- Study Benefits -->
    <div class="card" style="margin-bottom:40px;padding:0;overflow:hidden;">
      <div style="padding:20px 24px;border-bottom:1.5px solid var(--border-color);">
        <div class="card-title" style="margin:0;"> Why Learners Love SQLens</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;">
        <!-- Without -->
        <div style="padding:24px;border-right:1.5px solid var(--border-color);">
          <div style="font-weight:800;font-size:0.72rem;color:var(--accent-red);text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;"> Studying Alone</div>
          <div style="background:var(--bg-editor);border-radius:8px;padding:16px;font-family:var(--font-mono);font-size:0.8rem;color:#6b7280;line-height:1.8;">
            <div style="color:#6272a4;">— Scattered resources, no structure</div>
            <div style="color:#6272a4;">— Manual note-taking after each problem</div>
            <div style="color:#6272a4;">— Hard to track which concepts you've covered</div>
            <div style="color:#6272a4;">— Easy to lose momentum and consistency</div>
            <div style="color:#ff6b6b;margin-top:8px;font-weight:700;"> ~30 min per topic to organize notes</div>
          </div>
        </div>
        <!-- With -->
        <div style="padding:24px;">
          <div style="font-weight:800;font-size:0.72rem;color:var(--accent-green-dark);text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;"> With SQLens</div>
          <div style="background:var(--bg-editor);border-radius:8px;padding:16px;font-family:var(--font-mono);font-size:0.8rem;color:#a0c4ff;line-height:1.8;">
            <div><span style="color:#ff79c6;font-weight:700;">✓</span> Guided practice with structured examples</div>
            <div><span style="color:#ff79c6;font-weight:700;">✓</span> Auto-generated study notes for every problem</div>
            <div><span style="color:#ff79c6;font-weight:700;">✓</span> Concept-organized review for spaced repetition</div>
            <div><span style="color:#ff79c6;font-weight:700;">✓</span> Focus on learning, not formatting</div>
            <div style="color:var(--accent-green);margin-top:8px;font-weight:700;"> ~5 min per topic with structured notes</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Key Highlights -->
    <div class="card" style="margin-bottom:40px;padding:24px;text-align:center;background:var(--bg-tertiary);">
      <div style="font-weight:800;font-size:0.78rem;color:var(--text-muted);margin-bottom:10px;"> BUILT FOR LEARNERS</div>
      <div style="font-size:0.92rem;font-weight:700;color:var(--text-primary);line-height:1.8;max-width:520px;margin:0 auto;">
        100% focused on education · No contest assistance · No platform manipulation · Designed for personal study only
      </div>
    </div>

    <!-- Download CTA -->
    <div class="card" style="text-align:center;padding:48px 40px;border-color:var(--accent-primary);border-width:2px;background:linear-gradient(135deg, var(--accent-pink-light) 0%, var(--bg-card) 100%);">
      <div style="font-size:3rem;margin-bottom:16px;"></div>
      <div style="font-weight:900;font-size:1.5rem;color:var(--text-primary);margin-bottom:8px;">Ready to Study Smarter?</div>
      <p style="font-size:0.88rem;color:var(--text-muted);font-weight:600;max-width:440px;margin:0 auto 28px;line-height:1.7;">
        Install SQLens and transform your SQL practice into an efficient, structured learning experience — entirely on your terms.
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

    <!-- Legal Disclaimer -->
    <div style="margin-top:32px;padding:20px 24px;border-radius:10px;background:var(--bg-tertiary);border:1px solid var(--border-color);">
      <p style="font-size:0.72rem;color:var(--text-muted);font-weight:600;line-height:1.8;margin:0;text-align:center;">
        <strong style="color:var(--text-secondary);">Disclaimer:</strong> SQLens is an independent educational tool designed for personal study. It is not affiliated with, endorsed by, or connected to LeetCode or any other third‑party platform. End‑users are solely responsible for how they apply this tool in relation to external services. This product does not provide contest assistance, bypass access controls, or manipulate any third‑party platform.
      </p>
    </div>

  </div>`;
}

export function initLeetcode() {
  // Nothing dynamic needed — it's a static educational page
}
