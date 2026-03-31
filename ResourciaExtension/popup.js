/**
 * Resourcia Extension - popup.js
 * Uses backend search first and falls back to local demo data when needed.
 * The UI is organized into Match and Saved views on top of the same wiring.
 */

const APP_URL = 'http://localhost:4200';

const MOCK_RESOURCES = {
  'machine learning': {
    title: 'Machine Learning - Andrew Ng',
    domain: 'coursera.org',
    type: 'Course',
    cost: 'Free',
    difficultyLabel: 'Beginner',
    desc: 'A foundational machine learning course with practical models, intuition, and community-backed reviews.',
    rating: 4.9,
    reviewCount: 214,
    matchCount: 38
  },
  'calculus': {
    title: 'Essence of Calculus - 3Blue1Brown',
    domain: 'youtube.com',
    type: 'Video',
    cost: 'Free',
    difficultyLabel: 'All levels',
    desc: 'A visual series that builds intuition for derivatives, integrals, and limits before formal notation takes over.',
    rating: 4.9,
    reviewCount: 47,
    matchCount: 14
  },
  'react': {
    title: 'The Road to React',
    domain: 'roadtoreact.com',
    type: 'Book',
    cost: 'Paid',
    difficultyLabel: 'Intermediate',
    desc: 'A practical guide for developers growing from React basics into real application architecture.',
    rating: 4.7,
    reviewCount: 28,
    matchCount: 22
  },
  'linear algebra': {
    title: 'Linear Algebra - MIT OpenCourseWare',
    domain: 'ocw.mit.edu',
    type: 'Course',
    cost: 'Free',
    difficultyLabel: 'Intermediate',
    desc: 'A classic university course with rigorous explanations and one of the strongest reputations in the subject.',
    rating: 4.8,
    reviewCount: 81,
    matchCount: 9
  },
  'python': {
    title: 'Python for Everybody',
    domain: 'coursera.org',
    type: 'Course',
    cost: 'Free',
    difficultyLabel: 'Beginner',
    desc: 'A friendly on-ramp into programming with clear exercises, practical examples, and strong beginner support.',
    rating: 4.8,
    reviewCount: 163,
    matchCount: 61
  }
};

const RECENTLY_SAVED = [
  {
    title: 'Khan Academy - Calculus',
    domain: 'khanacademy.org',
    type: 'Course',
    savedAgo: 'saved 2h ago'
  },
  {
    title: 'MDN - CSS Grid',
    domain: 'developer.mozilla.org',
    type: 'Docs',
    savedAgo: 'saved yesterday'
  },
  {
    title: '3Blue1Brown - Linear Algebra',
    domain: 'youtube.com',
    type: 'Video',
    savedAgo: 'saved 3 days ago'
  }
];

let currentQuery = '';
let currentResource = null;
let savedState = false;

const stateLoading = document.getElementById('stateLoading');
const stateEmpty = document.getElementById('stateEmpty');
const stateResult = document.getElementById('stateResult');
const currentQueryEl = document.getElementById('currentQuery');
const contextTitleEl = document.getElementById('contextTitle');
const resourceCountBadgeEl = document.getElementById('resourceCountBadge');
const panelMatch = document.getElementById('panelMatch');
const panelSaved = document.getElementById('panelSaved');
const tabMatch = document.getElementById('tabMatch');
const tabSaved = document.getElementById('tabSaved');
const savedPreviewList = document.getElementById('savedPreviewList');
const savedList = document.getElementById('savedList');
const saveResourceButton = document.getElementById('saveResource');

initializeTabs();
renderSavedLists();

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab?.url) {
    setContext('Open a Google search', 'No active search');
    showEmpty();
    return;
  }

  try {
    const url = new URL(tab.url);
    const query = url.searchParams.get('q');

    if (url.hostname.includes('google.') && query) {
      currentQuery = query;
      setContext(query, 'Google search detected');
      loadResource(query);
      return;
    }

    setContext(tab.title?.slice(0, 36) || url.hostname, 'Open a Google search');
    showEmpty();
  } catch {
    setContext('Open a Google search', 'Search unavailable');
    showEmpty();
  }
});

function initializeTabs() {
  [tabMatch, tabSaved].forEach((tabButton) => {
    tabButton.addEventListener('click', () => {
      const isMatchTab = tabButton.dataset.tabTarget === 'match';
      tabMatch.classList.toggle('rp-tab--active', isMatchTab);
      tabSaved.classList.toggle('rp-tab--active', !isMatchTab);
      panelMatch.classList.toggle('hidden', !isMatchTab);
      panelSaved.classList.toggle('hidden', isMatchTab);
    });
  });
}

function renderSavedLists() {
  savedPreviewList.innerHTML = RECENTLY_SAVED.slice(0, 3).map(renderSavedItem).join('');
  savedList.innerHTML = RECENTLY_SAVED.map(renderSavedItem).join('');

  savedPreviewList.querySelectorAll('.rp-saved-item').forEach((button) => {
    button.addEventListener('click', handleSavedItemClick);
  });

  savedList.querySelectorAll('.rp-saved-item').forEach((button) => {
    button.addEventListener('click', handleSavedItemClick);
  });
}

function renderSavedItem(item) {
  const typeClass = getSavedTypeClass(item.type);

  return `
    <button class="rp-saved-item" type="button" data-domain="${escapeHtml(item.domain)}" data-title="${escapeHtml(item.title)}">
      <span class="rp-saved-item__icon ${typeClass}" aria-hidden="true">${getSavedTypeIcon(item.type)}</span>
      <span class="rp-saved-item__body">
        <span class="rp-saved-item__title">${escapeHtml(item.title)}</span>
        <span class="rp-saved-item__meta">${escapeHtml(item.domain)} - ${escapeHtml(item.savedAgo)}</span>
      </span>
      <span class="rp-saved-item__tag">${escapeHtml(item.type)}</span>
    </button>
  `;
}

function handleSavedItemClick(event) {
  const button = event.currentTarget;
  const query = button?.dataset.title || button?.dataset.domain || '';
  chrome.tabs.create({ url: `${APP_URL}/search?q=${encodeURIComponent(query)}` });
}

function loadResource(query) {
  showLoading();

  requestBackendSearch(query)
    .then((searchResponse) => {
      const backendResource = mapBackendSearchResult(searchResponse);

      if (backendResource) {
        currentResource = backendResource;
        renderResource(currentResource);
        showResult();
        return;
      }

      fallbackToMock(query);
    })
    .catch((error) => {
      console.warn('Resourcia extension backend search failed, falling back to mock data.', error);
      fallbackToMock(query);
    });
}

function renderResource(resource) {
  document.getElementById('resTitle').textContent = resource.title;
  document.getElementById('resDomain').textContent = resource.domain;
  document.getElementById('resType').textContent = resource.type;
  document.getElementById('resCost').textContent = resource.cost;
  document.getElementById('resDifficultyTag').textContent = resource.difficultyLabel || 'All levels';
  document.getElementById('resDesc').textContent = resource.desc;
  document.getElementById('resStars').textContent = formatStars(resource.rating, resource.reviewCount);
  document.getElementById('resReviews').textContent = formatReviewSummary(resource.rating, resource.reviewCount);
  document.getElementById('resIcon').innerHTML = getResourceIconMarkup(resource.type);
  document.getElementById('moreCount').textContent = String(resource.matchCount);

  setContext(currentQuery || resource.domain, `${resource.domain} detected`);
  resourceCountBadgeEl.textContent = formatMatchCount(resource.matchCount);

  saveResourceButton.classList.toggle('rp-bookmark-btn--saved', savedState);
}

function requestBackendSearch(query) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: 'backend:search',
        query,
        pageSize: 5
      },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!response?.ok) {
          reject(new Error(response?.error ?? 'Backend request failed.'));
          return;
        }

        resolve(response.data);
      }
    );
  });
}

function mapBackendSearchResult(searchResponse) {
  const item = searchResponse?.items?.[0];
  if (!item) {
    return null;
  }

  const typeFacet = item.facets?.find((facet) =>
    ['type', 'resourcetype', 'resource-type', 'format'].includes(String(facet.key ?? '').toLowerCase()));

  const difficultyFacet = item.facets?.find((facet) =>
    ['difficulty', 'level'].includes(String(facet.key ?? '').toLowerCase()));

  return {
    id: item.id,
    title: item.title || 'Untitled resource',
    domain: getDomain(item.url),
    type: typeFacet?.label || item.learningStyle || 'Resource',
    cost: item.isFree ? 'Free' : 'Paid',
    difficultyLabel: difficultyFacet?.label || difficultyFacet?.value || 'All levels',
    desc: item.description || 'No description available yet.',
    rating: Number(item.ratings?.averageRating ?? 0),
    reviewCount: Number(item.ratings?.totalCount ?? 0),
    matchCount: Number(searchResponse?.totalItems ?? 1)
  };
}

function fallbackToMock(query) {
  setTimeout(() => {
    const key = Object.keys(MOCK_RESOURCES).find((mockKey) =>
      query.toLowerCase().includes(mockKey));

    if (key) {
      currentResource = MOCK_RESOURCES[key];
      renderResource(currentResource);
      showResult();
      return;
    }

    currentResource = null;
    showEmpty();
  }, 240);
}

function setContext(query, title) {
  contextTitleEl.textContent = title;
  currentQueryEl.textContent = query.length > 34 ? `${query.slice(0, 34)}...` : query;
}

function formatMatchCount(count) {
  return `${count} resource${count === 1 ? '' : 's'} found`;
}

function formatStars(rating, reviewCount) {
  if (!reviewCount) {
    return '- - -';
  }

  const rounded = Math.max(0, Math.min(5, Math.round(rating || 0)));
  return `${'★'.repeat(rounded)}${'☆'.repeat(5 - rounded)}`;
}

function formatReviewSummary(rating, reviewCount) {
  if (!reviewCount) {
    return 'Be the first to review';
  }

  const roundedRating = Number(rating || 0).toFixed(1);
  return `${roundedRating} - ${reviewCount} review${reviewCount === 1 ? '' : 's'}`;
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url || 'Unknown domain';
  }
}

function getSavedTypeClass(type) {
  switch (String(type).toLowerCase()) {
    case 'course':
      return 'rp-saved-item__icon--course';
    case 'docs':
    case 'reference':
      return 'rp-saved-item__icon--docs';
    case 'video':
      return 'rp-saved-item__icon--video';
    default:
      return 'rp-saved-item__icon--reference';
  }
}

function getSavedTypeIcon(type) {
  switch (String(type).toLowerCase()) {
    case 'course':
      return `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"></path>
        </svg>
      `;
    case 'video':
      return `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7-11-7z"></path>
        </svg>
      `;
    default:
      return `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 00-2 2v16l5-3 5 3V4a2 2 0 00-2-2z"></path>
          <path d="M18 7h2v13l-4-2.5"></path>
        </svg>
      `;
  }
}

function getResourceIconMarkup(type) {
  switch (String(type).toLowerCase()) {
    case 'course':
      return `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5A2.5 2.5 0 016.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"></path>
        </svg>
      `;
    case 'video':
      return `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7-11-7z"></path>
        </svg>
      `;
    case 'reference':
    case 'docs':
      return `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 00-2 2v16l5-3 5 3V4a2 2 0 00-2-2z"></path>
          <path d="M18 7h2v13l-4-2.5"></path>
        </svg>
      `;
    default:
      return escapeHtml(String(type).slice(0, 1).toUpperCase() || 'R');
  }
}

function showLoading() {
  stateLoading.classList.remove('hidden');
  stateEmpty.classList.add('hidden');
  stateResult.classList.add('hidden');
  resourceCountBadgeEl.textContent = 'Scanning...';
}

function showEmpty() {
  stateLoading.classList.add('hidden');
  stateEmpty.classList.remove('hidden');
  stateResult.classList.add('hidden');
  resourceCountBadgeEl.textContent = '0 resources found';
}

function showResult() {
  stateLoading.classList.add('hidden');
  stateEmpty.classList.add('hidden');
  stateResult.classList.remove('hidden');
}

document.getElementById('openApp').addEventListener('click', () => {
  chrome.tabs.create({ url: APP_URL });
});

document.getElementById('viewInApp').addEventListener('click', () => {
  if (!currentResource) {
    return;
  }

  const targetUrl = currentResource.id
    ? `${APP_URL}/resource/${currentResource.id}`
    : `${APP_URL}/search?q=${encodeURIComponent(currentResource.title)}`;

  chrome.tabs.create({ url: targetUrl });
});

document.getElementById('viewSimilar').addEventListener('click', () => {
  chrome.tabs.create({ url: currentQuery ? `${APP_URL}/search?q=${encodeURIComponent(currentQuery)}` : `${APP_URL}/search` });
});

document.getElementById('viewSimilarMatches').addEventListener('click', () => {
  chrome.tabs.create({ url: currentQuery ? `${APP_URL}/search?q=${encodeURIComponent(currentQuery)}` : `${APP_URL}/search` });
});

document.getElementById('addResourceBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: `${APP_URL}/addresource` });
});

document.getElementById('signInLink').addEventListener('click', () => {
  chrome.tabs.create({ url: `${APP_URL}/login` });
});

document.getElementById('viewAllSavedPreview').addEventListener('click', () => {
  chrome.tabs.create({ url: `${APP_URL}/search` });
});

document.getElementById('viewAllSaved').addEventListener('click', () => {
  chrome.tabs.create({ url: `${APP_URL}/search` });
});

saveResourceButton.addEventListener('click', () => {
  if (savedState) {
    return;
  }

  savedState = true;
  saveResourceButton.classList.add('rp-bookmark-btn--saved');
  saveResourceButton.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"></path>
    </svg>
  `;

  // TODO: Wire to the real save endpoint when extension auth exists.
});

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
