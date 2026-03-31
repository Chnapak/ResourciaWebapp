/**
 * Resourcia Extension — content.js
 * Injects a subtle "Resourcia score" pill beneath matching Google search results.
 * On hover, expands to a rich metadata preview card.
 *
 * Design goals:
 *  - Subtle, non-intrusive, respectful of Google's layout
 *  - Only annotates results where we actually have data
 *  - Hover card shows type, difficulty, cost, rating, description
 */

const APP_URL = 'https://resourcia.com'; // 🔜 update to real prod URL

// ── Mock resource index ───────────────────────────────────────────────────────
// 🔜 Replace with: fetch(`/api/Search/batch?domains=${domains.join(',')}`)
const RESOURCE_DB = {
  'coursera.org': {
    title: 'Machine Learning – Andrew Ng',
    type: 'Course', cost: 'Free', rating: 4.9, difficulty: 35, difficultyLabel: 'Beginner',
    desc: 'World-famous ML course covering regression, neural networks, and unsupervised learning.',
    count: 38,
  },
  'khanacademy.org': {
    title: 'Khan Academy',
    type: 'Course', cost: 'Free', rating: 4.7, difficulty: 30, difficultyLabel: 'Beginner',
    desc: 'Free, world-class education for anyone — math, science, computing, and more.',
    count: 124,
  },
  'developer.mozilla.org': {
    title: 'MDN Web Docs',
    type: 'Reference', cost: 'Free', rating: 4.8, difficulty: 50, difficultyLabel: 'Intermediate',
    desc: 'The definitive reference for HTML, CSS, and JavaScript, maintained by Mozilla.',
    count: 83,
  },
  'ocw.mit.edu': {
    title: 'MIT OpenCourseWare',
    type: 'Course', cost: 'Free', rating: 4.8, difficulty: 75, difficultyLabel: 'Advanced',
    desc: 'Free lecture notes, exams, and videos from MIT. No registration required.',
    count: 55,
  },
  'youtube.com': {
    title: 'Educational Video',
    type: 'Video', cost: 'Free', rating: 4.6, difficulty: 40, difficultyLabel: 'Beginner',
    desc: 'Video learning resource referenced in Resourcia\'s community knowledge base.',
    count: 210,
  },
  'github.com': {
    title: 'GitHub Repository',
    type: 'Repository', cost: 'Free', rating: 4.5, difficulty: 55, difficultyLabel: 'Intermediate',
    desc: 'Open-source repository referenced as a learning resource in the Resourcia community.',
    count: 97,
  },
  'freecodecamp.org': {
    title: 'freeCodeCamp',
    type: 'Course', cost: 'Free', rating: 4.8, difficulty: 35, difficultyLabel: 'Beginner',
    desc: 'Learn to code for free with interactive exercises covering web development, data science, and more.',
    count: 44,
  },
  'edx.org': {
    title: 'edX',
    type: 'Course', cost: 'Paid', rating: 4.6, difficulty: 60, difficultyLabel: 'Intermediate',
    desc: 'University-level online courses from MIT, Harvard, Berkeley, and 200+ institutions.',
    count: 29,
  },
  'udemy.com': {
    title: 'Udemy Course',
    type: 'Course', cost: 'Paid', rating: 4.4, difficulty: 45, difficultyLabel: 'Intermediate',
    desc: 'Practical skill-building course available on Udemy, referenced in the Resourcia community.',
    count: 67,
  },
  'docs.python.org': {
    title: 'Python Official Docs',
    type: 'Reference', cost: 'Free', rating: 4.7, difficulty: 55, difficultyLabel: 'Intermediate',
    desc: 'The official Python language reference and standard library documentation.',
    count: 31,
  },
};

// ── Resourcia icon SVG (inline) ───────────────────────────────────────────────
const ICON_SVG = `<svg class="rsc-pill__icon" viewBox="0 0 24 24" fill="none">
  <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="#c7d8fc"/>
  <path d="M8 11h3v6h2v-6h3l-4-4-4 4z" fill="#2952d9"/>
</svg>`;

// ── Inject resource chips into Google results ─────────────────────────────────
function injectChips() {
  // Google result containers — MV selector that works across Google layouts
  const resultNodes = document.querySelectorAll('div.g, div[data-sokoban-container]');

  resultNodes.forEach(node => {
    if (node.dataset.rscProcessed) return;
    node.dataset.rscProcessed = 'true';

    // Find the visible link inside the result
    const linkEl = node.querySelector('a[href]:not([href^="#"])');
    if (!linkEl) return;

    let hostname = '';
    try {
      hostname = new URL(linkEl.href).hostname.replace('www.', '');
    } catch {
      return;
    }

    const resource = RESOURCE_DB[hostname];
    if (!resource) return;

    // Find where to insert — after the snippet / description text
    const snippetEl = node.querySelector(
      '[data-sncf], .VwiC3b, .s3v9rd, span[style], div[style*="WebkitLineClamp"]'
    ) || node.querySelector('cite')?.closest('div') || linkEl.closest('div');

    if (!snippetEl) return;

    const row = document.createElement('div');
    row.className = 'rsc-row';

    const anchor = document.createElement('div');
    anchor.className = 'rsc-anchor';

    const pill = document.createElement('div');
    pill.className = 'rsc-pill';
    pill.setAttribute('role', 'button');
    pill.setAttribute('tabindex', '0');
    pill.setAttribute('aria-label', `View ${hostname} on Resourcia`);

    const starsStr = '★'.repeat(Math.round(resource.rating)) + '☆'.repeat(5 - Math.round(resource.rating));

    pill.innerHTML = `
      ${ICON_SVG}
      <span>Resourcia</span>
      <span class="rsc-pill__score">${resource.rating.toFixed(1)}</span>
      <span class="rsc-pill__star">★</span>
    `;

    // Build hover preview
    const preview = buildPreviewCard(resource, hostname, starsStr);
    anchor.appendChild(pill);
    anchor.appendChild(preview);
    row.appendChild(anchor);

    // Insert after snippet
    snippetEl.after(row);

    // Hover logic
    let hideTimeout;

    const showPreview = () => {
      clearTimeout(hideTimeout);
      preview.classList.add('rsc-preview--visible');
    };

    const hidePreview = () => {
      hideTimeout = setTimeout(() => {
        preview.classList.remove('rsc-preview--visible');
      }, 120);
    };

    anchor.addEventListener('mouseenter', showPreview);
    anchor.addEventListener('mouseleave', hidePreview);
    preview.addEventListener('mouseenter', showPreview);
    preview.addEventListener('mouseleave', hidePreview);

    // Keyboard: Enter opens app
    pill.addEventListener('keydown', e => {
      if (e.key === 'Enter') window.open(`${APP_URL}/search?q=${encodeURIComponent(hostname)}`, '_blank');
    });

    // Click pill to open Resourcia search
    pill.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      window.open(`${APP_URL}/search?q=${encodeURIComponent(hostname)}`, '_blank');
    });

    // Preview buttons
    preview.querySelector('.rsc-view-btn')?.addEventListener('click', e => {
      e.stopPropagation();
      window.open(`${APP_URL}/search?q=${encodeURIComponent(hostname)}`, '_blank');
    });

    preview.querySelector('.rsc-save-btn')?.addEventListener('click', function (e) {
      e.stopPropagation();
      this.textContent = '✓ Saved';
      this.style.background = '#ecfdf5';
      this.style.color = '#059669';
      this.style.borderColor = '#a7f3d0';
      // 🔜 Wire to POST /api/Saved
    });
  });
}

function buildPreviewCard(r, hostname, starsStr) {
  const preview = document.createElement('div');
  preview.className = 'rsc-preview';

  const costClass = r.cost === 'Free' ? 'rsc-chip--free' : 'rsc-chip--paid';

  preview.innerHTML = `
    <div class="rsc-preview__header">
      <div class="rsc-preview__title">${escHtml(r.title)}</div>
      <div class="rsc-preview__score-block">
        <span class="rsc-preview__score-num">${r.rating.toFixed(1)}</span>
        <span class="rsc-preview__score-stars">${starsStr}</span>
      </div>
    </div>
    <div class="rsc-preview__chips">
      <span class="rsc-chip rsc-chip--type">${escHtml(r.type)}</span>
      <span class="rsc-chip ${costClass}">${escHtml(r.cost)}</span>
    </div>
    <div class="rsc-preview__desc">${escHtml(r.desc)}</div>
    <div class="rsc-preview__difficulty">
      <span class="rsc-preview__diff-label">Level</span>
      <div class="rsc-preview__diff-bar">
        <div class="rsc-preview__diff-fill" style="width:${r.difficulty}%"></div>
      </div>
      <span class="rsc-preview__diff-text">${escHtml(r.difficultyLabel)}</span>
    </div>
    <div class="rsc-preview__footer">
      <button class="rsc-preview__btn rsc-preview__btn--primary rsc-view-btn">View in Resourcia</button>
      <button class="rsc-preview__btn rsc-preview__btn--ghost rsc-save-btn">Save</button>
    </div>
    <div class="rsc-preview__count">${r.count} resources from ${escHtml(hostname)}</div>
  `;

  return preview;
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Run on load + observe DOM mutations ──────────────────────────────────────
injectChips();

// Google loads results dynamically — observe for new nodes
const observer = new MutationObserver(() => injectChips());
observer.observe(document.body, { childList: true, subtree: true });
