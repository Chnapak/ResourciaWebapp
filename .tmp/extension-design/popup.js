/**
 * Resourcia Extension — popup.js
 * Reads the current tab's Google search query and shows mock resource data.
 * Wire up the fetch() calls to the real /api/Search endpoint when ready.
 */

const APP_URL = 'https://resourcia.com'; // 🔜 update to real prod URL

// ── Mock data (replace with real API calls) ──────────────────────────────────
const MOCK_RESOURCES = {
  'machine learning': {
    title: 'Machine Learning – Andrew Ng',
    domain: 'coursera.org',
    type: 'Course',
    cost: 'Free',
    rating: 4.9,
    difficulty: 35,
    difficultyLabel: 'Beginner',
    desc: 'The world\'s most popular ML course. Covers regression, neural networks, SVMs, and unsupervised learning.',
    totalCount: 38,
  },
  'calculus': {
    title: 'Essence of Calculus – 3Blue1Brown',
    domain: 'youtube.com',
    type: 'Video',
    cost: 'Free',
    rating: 4.9,
    difficulty: 45,
    difficultyLabel: 'Beginner',
    desc: 'Beautifully animated series building intuition for derivatives, integrals, and limits from scratch.',
    totalCount: 14,
  },
  'react': {
    title: 'The Road to React',
    domain: 'roadtoreact.com',
    type: 'Book',
    cost: 'Paid',
    rating: 4.7,
    difficulty: 55,
    difficultyLabel: 'Intermediate',
    desc: 'Comprehensive guide to modern React — hooks, context, testing, and real-world application patterns.',
    totalCount: 22,
  },
  'linear algebra': {
    title: 'Linear Algebra – MIT OpenCourseWare',
    domain: 'ocw.mit.edu',
    type: 'Course',
    cost: 'Free',
    rating: 4.8,
    difficulty: 65,
    difficultyLabel: 'Intermediate',
    desc: 'Gilbert Strang\'s legendary lecture series covering vectors, matrices, eigenvalues, and applications.',
    totalCount: 9,
  },
  'python': {
    title: 'Python for Everybody',
    domain: 'coursera.org',
    type: 'Course',
    cost: 'Free',
    rating: 4.8,
    difficulty: 25,
    difficultyLabel: 'Beginner',
    desc: 'Hands-on introduction to programming with Python — data types, loops, functions, and web data.',
    totalCount: 61,
  },
};

// ── State ─────────────────────────────────────────────────────────────────────
let currentQuery = '';
let currentResource = null;
let savedState = false;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const stateLoading  = document.getElementById('stateLoading');
const stateEmpty    = document.getElementById('stateEmpty');
const stateResult   = document.getElementById('stateResult');
const currentQueryEl = document.getElementById('currentQuery');

// ── Initialise ────────────────────────────────────────────────────────────────
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab?.url) { showEmpty(); return; }

  try {
    const url = new URL(tab.url);
    const q = url.searchParams.get('q');

    if (url.hostname.includes('google.com') && q) {
      currentQuery = q;
      currentQueryEl.textContent = q.length > 32 ? q.slice(0, 32) + '…' : q;
      loadResource(q);
    } else {
      currentQueryEl.textContent = tab.title?.slice(0, 35) || '—';
      showEmpty();
    }
  } catch {
    showEmpty();
  }
});

// ── Resource loading ──────────────────────────────────────────────────────────
function loadResource(query) {
  showLoading();

  // 🔜 Replace this timeout with: fetch(`${API_BASE}/api/Search?q=${encodeURIComponent(query)}`)
  setTimeout(() => {
    const key = Object.keys(MOCK_RESOURCES).find(k =>
      query.toLowerCase().includes(k)
    );

    if (key) {
      currentResource = MOCK_RESOURCES[key];
      renderResource(currentResource);
      showResult();
    } else {
      showEmpty();
    }
  }, 600);
}

function renderResource(r) {
  document.getElementById('resTitle').textContent   = r.title;
  document.getElementById('resDomain').textContent  = r.domain;
  document.getElementById('resType').textContent    = r.type;
  document.getElementById('resDesc').textContent    = r.desc;
  document.getElementById('moreCount').textContent  = r.totalCount;

  const costEl = document.getElementById('resCost');
  costEl.textContent = r.cost;
  costEl.className = `rp-chip ${r.cost === 'Free' ? 'rp-chip--free' : 'rp-chip--paid'}`;

  const scoreNum = document.getElementById('resScore');
  const stars = '★'.repeat(Math.round(r.rating)) + '☆'.repeat(5 - Math.round(r.rating));
  scoreNum.querySelector('.rp-score__num').textContent = r.rating.toFixed(1);
  scoreNum.querySelector('.rp-score__stars').textContent = stars;

  document.getElementById('diffBar').style.width  = r.difficulty + '%';
  document.getElementById('diffText').textContent = r.difficultyLabel;
}

// ── State helpers ─────────────────────────────────────────────────────────────
function showLoading() {
  stateLoading.classList.remove('hidden');
  stateEmpty.classList.add('hidden');
  stateResult.classList.add('hidden');
}

function showEmpty() {
  stateLoading.classList.add('hidden');
  stateEmpty.classList.remove('hidden');
  stateResult.classList.add('hidden');
}

function showResult() {
  stateLoading.classList.add('hidden');
  stateEmpty.classList.add('hidden');
  stateResult.classList.remove('hidden');
}

// ── Button actions ────────────────────────────────────────────────────────────
document.getElementById('openApp').addEventListener('click', () => {
  chrome.tabs.create({ url: APP_URL });
});

document.getElementById('viewInApp').addEventListener('click', () => {
  if (!currentResource) return;
  const q = encodeURIComponent(currentQuery);
  chrome.tabs.create({ url: `${APP_URL}/search?q=${q}` });
});

document.getElementById('viewSimilar').addEventListener('click', () => {
  chrome.tabs.create({ url: `${APP_URL}/search?q=${encodeURIComponent(currentQuery)}` });
});

document.getElementById('addResourceBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: `${APP_URL}/resources/new` });
});

document.getElementById('signInLink').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: `${APP_URL}/login` });
});

document.getElementById('viewAllSaved').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: `${APP_URL}/saved` });
});

document.getElementById('saveResource').addEventListener('click', function () {
  if (savedState) return;
  savedState = true;
  this.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.5">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
    </svg>
    Saved!
  `;
  this.style.color = '#059669';
  this.style.borderColor = '#a7f3d0';
  this.style.background = '#ecfdf5';

  // 🔜 Wire to: POST /api/Saved with resource id
});
