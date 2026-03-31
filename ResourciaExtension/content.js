/**
 * Resourcia Extension - content.js
 * Injects subtle Resourcia chips beneath matching Google results.
 * Uses the backend domain lookup first and falls back to local mock data.
 */

const APP_URL = 'http://localhost:4200';
const DEBUG_PREFIX = '[Resourcia Extension]';

const RESOURCE_DB = {
  'coursera.org': {
    title: 'Machine Learning – Andrew Ng',
    type: 'Course',
    cost: 'Free',
    rating: 4.9,
    reviewCount: 214,
    difficulty: 35,
    difficultyLabel: 'Beginner',
    desc: 'World-famous ML course covering regression, neural networks, and unsupervised learning.',
    count: 38
  },
  'khanacademy.org': {
    title: 'Khan Academy',
    type: 'Course',
    cost: 'Free',
    rating: 4.7,
    reviewCount: 324,
    difficulty: 30,
    difficultyLabel: 'Beginner',
    desc: 'Free, world-class education for anyone: math, science, computing, and more.',
    count: 124
  },
  'developer.mozilla.org': {
    title: 'MDN Web Docs',
    type: 'Reference',
    cost: 'Free',
    rating: 4.8,
    reviewCount: 187,
    difficulty: 50,
    difficultyLabel: 'Intermediate',
    desc: 'The definitive reference for HTML, CSS, and JavaScript, maintained by Mozilla.',
    count: 83
  },
  'ocw.mit.edu': {
    title: 'MIT OpenCourseWare',
    type: 'Course',
    cost: 'Free',
    rating: 4.8,
    reviewCount: 92,
    difficulty: 75,
    difficultyLabel: 'Advanced',
    desc: 'Free lecture notes, exams, and videos from MIT. No registration required.',
    count: 55
  },
  'youtube.com': {
    title: 'Educational Video',
    type: 'Video',
    cost: 'Free',
    rating: 4.6,
    reviewCount: 149,
    difficulty: 40,
    difficultyLabel: 'Beginner',
    desc: 'Video learning resource referenced in Resourcia\'s community knowledge base.',
    count: 210
  },
  'github.com': {
    title: 'GitHub Repository',
    type: 'Repository',
    cost: 'Free',
    rating: 4.5,
    reviewCount: 63,
    difficulty: 55,
    difficultyLabel: 'Intermediate',
    desc: 'Open-source repository referenced as a learning resource in the Resourcia community.',
    count: 97
  },
  'freecodecamp.org': {
    title: 'freeCodeCamp',
    type: 'Course',
    cost: 'Free',
    rating: 4.8,
    reviewCount: 118,
    difficulty: 35,
    difficultyLabel: 'Beginner',
    desc: 'Learn to code for free with interactive exercises covering web development, data science, and more.',
    count: 44
  },
  'edx.org': {
    title: 'edX',
    type: 'Course',
    cost: 'Paid',
    rating: 4.6,
    reviewCount: 57,
    difficulty: 60,
    difficultyLabel: 'Intermediate',
    desc: 'University-level online courses from MIT, Harvard, Berkeley, and 200+ institutions.',
    count: 29
  },
  'udemy.com': {
    title: 'Udemy Course',
    type: 'Course',
    cost: 'Paid',
    rating: 4.4,
    reviewCount: 96,
    difficulty: 45,
    difficultyLabel: 'Intermediate',
    desc: 'Practical skill-building course available on Udemy, referenced in the Resourcia community.',
    count: 67
  },
  'docs.python.org': {
    title: 'Python Official Docs',
    type: 'Reference',
    cost: 'Free',
    rating: 4.7,
    reviewCount: 74,
    difficulty: 55,
    difficultyLabel: 'Intermediate',
    desc: 'The official Python language reference and standard library documentation.',
    count: 31
  }
};

const domainLookupCache = new Map();

function buildSearchUrl(query) {
  return `${APP_URL}/search?q=${encodeURIComponent(query)}`;
}

function buildResourceUrl(resource) {
  if (resource?.id) {
    return `${APP_URL}/resource/${resource.id}`;
  }

  return buildSearchUrl(resource?.title || resource?.domain || 'resource');
}

function normalizeDomain(value) {
  try {
    const url = value.startsWith('http://') || value.startsWith('https://')
      ? value
      : `https://${value}`;
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return String(value || '').replace(/^www\./, '').toLowerCase();
  }
}

async function getResourceForDomain(hostname) {
  const normalizedDomain = normalizeDomain(hostname);

  if (!normalizedDomain) {
    console.warn(`${DEBUG_PREFIX} Skipping lookup because the domain could not be normalized.`, { hostname });
    return null;
  }

  if (!domainLookupCache.has(normalizedDomain)) {
    console.log(`${DEBUG_PREFIX} Looking up domain.`, { domain: normalizedDomain });

    const lookupPromise = requestDomainLookup(normalizedDomain)
      .then((response) => {
        const backendItem = response?.items?.find((item) => normalizeDomain(item.domain) === normalizedDomain);
        const mappedResource = mapLookupItem(backendItem);

        if (mappedResource) {
          console.log(`${DEBUG_PREFIX} Backend lookup matched a resource.`, {
            domain: normalizedDomain,
            resourceId: mappedResource.id,
            title: mappedResource.title
          });
          return mappedResource;
        }

        if (RESOURCE_DB[normalizedDomain]) {
          console.log(`${DEBUG_PREFIX} Backend lookup returned no match, falling back to local demo data.`, {
            domain: normalizedDomain
          });
          return RESOURCE_DB[normalizedDomain];
        }

        console.log(`${DEBUG_PREFIX} No backend or local match found for domain.`, {
          domain: normalizedDomain
        });
        return null;
      })
      .catch((error) => {
        console.warn(`${DEBUG_PREFIX} Domain lookup failed, falling back to local demo data if available.`, {
          domain: normalizedDomain,
          error: error instanceof Error ? error.message : String(error)
        });
        return RESOURCE_DB[normalizedDomain] || null;
      });

    domainLookupCache.set(normalizedDomain, lookupPromise);
  }

  return await domainLookupCache.get(normalizedDomain);
}

function requestDomainLookup(domain) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: 'backend:lookup-domains',
        domains: [domain]
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.warn(`${DEBUG_PREFIX} Chrome runtime error during domain lookup.`, {
            domain,
            error: chrome.runtime.lastError.message
          });
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!response?.ok) {
          console.warn(`${DEBUG_PREFIX} Backend domain lookup returned a non-ok response.`, {
            domain,
            error: response?.error ?? 'Domain lookup failed.'
          });
          reject(new Error(response?.error ?? 'Domain lookup failed.'));
          return;
        }

        console.log(`${DEBUG_PREFIX} Backend domain lookup succeeded.`, {
          domain,
          itemCount: Array.isArray(response.data?.items) ? response.data.items.length : 0
        });
        resolve(response.data);
      }
    );
  });
}

function mapLookupItem(item) {
  if (!item) {
    return null;
  }

  const typeFacet = item.facets?.find((facet) =>
    ['type', 'resourcetype', 'resource-type', 'format'].includes(String(facet.key ?? '').toLowerCase()));

  const difficultyFacet = item.facets?.find((facet) =>
    ['difficulty', 'level'].includes(String(facet.key ?? '').toLowerCase()));

  const difficultyLabel = difficultyFacet?.label || difficultyFacet?.value || 'Not specified';

  return {
    id: item.id,
    domain: item.domain,
    title: item.title || 'Untitled resource',
    type: typeFacet?.label || item.learningStyle || 'Resource',
    cost: item.isFree ? 'Free' : 'Paid',
    rating: Number(item.ratings?.averageRating ?? 0),
    reviewCount: Number(item.ratings?.totalCount ?? 0),
    difficulty: mapDifficultyWidth(difficultyLabel),
    difficultyLabel,
    desc: item.description || 'No description available yet.',
    count: Number(item.resourceCount ?? item.ratings?.totalCount ?? 1)
  };
}

function mapDifficultyWidth(label) {
  switch (String(label ?? '').trim().toLowerCase()) {
    case 'beginner':
      return 30;
    case 'intermediate':
      return 60;
    case 'advanced':
      return 85;
    default:
      return 45;
  }
}

function renderStarsMarkup(rating, reviewCount, starClass) {
  const filledCount = reviewCount
    ? Math.max(0, Math.min(5, Math.round(Number(rating) || 0)))
    : 0;

  return Array.from({ length: 5 }, (_, index) => {
    const stateClass = index < filledCount ? `${starClass}--filled` : `${starClass}--empty`;
    return `<span class="${starClass} ${stateClass}">★</span>`;
  }).join('');
}

function formatChipRating(resource) {
  if (!resource.reviewCount) {
    return 'No ratings';
  }

  return Number(resource.rating || 0).toFixed(1);
}

function formatChipVoteCount(resource) {
  if (!resource.reviewCount) {
    return '(0)';
  }

  return `(${resource.reviewCount})`;
}

async function injectChips() {
  const resultEntries = collectResultEntries();
  console.log(`${DEBUG_PREFIX} Scanning Google results for chip injection.`, {
    resultCount: resultEntries.length
  });

  for (const [index, entry] of resultEntries.entries()) {
    const { node, linkEl } = entry;

    if (node.dataset.rscProcessed || linkEl.dataset.rscProcessed) {
      continue;
    }

    node.dataset.rscProcessed = 'true';
    linkEl.dataset.rscProcessed = 'true';

    let hostname = '';
    try {
      hostname = normalizeDomain(linkEl.href);
    } catch {
      console.warn(`${DEBUG_PREFIX} Skipping result because the link hostname could not be parsed.`, {
        index,
        href: linkEl.href
      });
      continue;
    }

    console.log(`${DEBUG_PREFIX} Processing result link.`, {
      index,
      href: linkEl.href,
      hostname
    });

    const resource = await getResourceForDomain(hostname);
    if (!resource) {
      console.log(`${DEBUG_PREFIX} No resource match found, chip will not be inserted.`, {
        index,
        hostname
      });
      continue;
    }

    const snippetEl = node.querySelector('[data-sncf], .VwiC3b, .s3v9rd, span[style], div[style*="WebkitLineClamp"]')
      || node.querySelector('cite')?.closest('div')
      || linkEl.closest('div')
      || linkEl.parentElement
      || linkEl;

    if (!snippetEl) {
      console.log(`${DEBUG_PREFIX} Skipping chip insertion because no snippet anchor was found.`, {
        index,
        hostname
      });
      continue;
    }

    const row = document.createElement('div');
    row.className = 'rsc-row';

    const anchor = document.createElement('div');
    anchor.className = 'rsc-anchor';

    const pill = document.createElement('div');
    pill.className = 'rsc-pill';
    pill.setAttribute('role', 'button');
    pill.setAttribute('tabindex', '0');
    pill.setAttribute('aria-label', `View ${hostname} on Resourcia`);

    const chipStarsMarkup = renderStarsMarkup(resource.rating, resource.reviewCount, 'rsc-pill__star');
    const chipRating = formatChipRating(resource);
    const chipVoteCount = formatChipVoteCount(resource);
    pill.innerHTML = `
      <span class="rsc-pill__zone rsc-pill__zone--rating">
        <span class="rsc-pill__stars">${chipStarsMarkup}</span>
        <span class="rsc-pill__rating-value">${chipRating}</span>
        <span class="rsc-pill__vote-count">${chipVoteCount}</span>
      </span>
      <span class="rsc-pill__hover-copy">
        <span class="rsc-pill__hover-icon">&#9758;</span>
        <span>Go to Resourcia</span>
      </span>
    `;

    const preview = buildPreviewCard(resource, hostname);
    const viewUrl = buildResourceUrl(resource);

    anchor.appendChild(pill);
    anchor.appendChild(preview);
    row.appendChild(anchor);
    snippetEl.after(row);

    console.log(`${DEBUG_PREFIX} Chip inserted successfully.`, {
      index,
      hostname,
      title: resource.title
    });

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

    pill.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        window.open(viewUrl, '_blank');
      }
    });

    pill.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      window.open(viewUrl, '_blank');
    });

    preview.querySelector('.rsc-view-btn')?.addEventListener('click', (event) => {
      event.stopPropagation();
      window.open(viewUrl, '_blank');
    });

    preview.querySelector('.rsc-save-btn')?.addEventListener('click', function (event) {
      event.stopPropagation();
      this.textContent = '✓ Saved';
      this.style.background = '#ecfdf5';
      this.style.color = '#059669';
      this.style.borderColor = '#a7f3d0';

      // TODO: Wire to the real save endpoint when extension auth exists.
    });
  }
}

function collectResultEntries() {
  const entries = [];
  const seenNodes = new Set();

  const legacyNodes = Array.from(document.querySelectorAll('div.g, div[data-sokoban-container]'));
  for (const node of legacyNodes) {
    const linkEl = extractResultLink(node);
    if (!linkEl) {
      continue;
    }

    seenNodes.add(node);
    entries.push({ node, linkEl });
  }

  const headingAnchors = Array.from(document.querySelectorAll('a[href]'))
    .filter((anchor) => anchor.querySelector('h3') && isExternalResultLink(anchor.href));

  for (const linkEl of headingAnchors) {
    const node =
      linkEl.closest('div.g, div[data-sokoban-container], .MjjYud, .tF2Cxc, [data-ved]') ||
      linkEl.closest('div') ||
      linkEl;

    if (seenNodes.has(node)) {
      continue;
    }

    seenNodes.add(node);
    entries.push({ node, linkEl });
  }

  return entries;
}

function extractResultLink(node) {
  const directLink = node.querySelector('a[href]');
  if (directLink && isExternalResultLink(directLink.href)) {
    return directLink;
  }

  const headingLink = Array.from(node.querySelectorAll('a[href]'))
    .find((anchor) => anchor.querySelector('h3') && isExternalResultLink(anchor.href));

  return headingLink || null;
}

function isExternalResultLink(href) {
  try {
    const url = new URL(href);
    const hostname = url.hostname.toLowerCase();

    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }

    return !hostname.includes('google.');
  } catch {
    return false;
  }
}

function buildPreviewCard(resource, hostname) {
  const preview = document.createElement('div');
  preview.className = 'rsc-preview';

  const costClass = resource.cost === 'Free' ? 'rsc-chip--free' : 'rsc-chip--paid';
  const summaryText = resource.reviewCount
    ? `${Number(resource.rating || 0).toFixed(1)} • ${resource.reviewCount} review${resource.reviewCount === 1 ? '' : 's'}`
    : 'No reviews yet';
  const primaryActionLabel = resource.reviewCount ? 'Open full listing' : 'Add first review';
  const previewStarsMarkup = renderStarsMarkup(resource.rating, resource.reviewCount, 'rsc-preview__star');

  preview.innerHTML = `
    <div class="rsc-preview__header">
      <div class="rsc-preview__title">${escapeHtml(resource.title)}</div>
      <div class="rsc-preview__score-block">
        <span class="rsc-preview__score-num">${resource.reviewCount ? Number(resource.rating || 0).toFixed(1) : 'New'}</span>
        <span class="rsc-preview__score-stars">${previewStarsMarkup}</span>
      </div>
    </div>
    <div class="rsc-preview__chips">
      <span class="rsc-chip rsc-chip--type">${escapeHtml(resource.type)}</span>
      <span class="rsc-chip ${costClass}">${escapeHtml(resource.cost)}</span>
      <span class="rsc-chip rsc-chip--neutral">${escapeHtml(resource.difficultyLabel)}</span>
    </div>
    <div class="rsc-preview__summary">${escapeHtml(summaryText)}</div>
    <div class="rsc-preview__desc">${escapeHtml(resource.desc)}</div>
    <div class="rsc-preview__difficulty">
      <span class="rsc-preview__diff-label">Level</span>
      <div class="rsc-preview__diff-bar">
        <div class="rsc-preview__diff-fill" style="width:${resource.difficulty}%"></div>
      </div>
      <span class="rsc-preview__diff-text">${escapeHtml(resource.difficultyLabel)}</span>
    </div>
    <div class="rsc-preview__footer">
      <button class="rsc-preview__btn rsc-preview__btn--primary rsc-view-btn" type="button">${primaryActionLabel}</button>
      <button class="rsc-preview__btn rsc-preview__btn--ghost rsc-save-btn" type="button">Save</button>
    </div>
    <div class="rsc-preview__count">${resource.count} resources from ${escapeHtml(hostname)}</div>
  `;

  return preview;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

void injectChips();

const observer = new MutationObserver(() => {
  void injectChips();
});

observer.observe(document.body, { childList: true, subtree: true });
