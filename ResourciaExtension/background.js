const API_BASE_URLS = [
  'https://localhost:5001',
  'http://localhost:5000'
];

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'backend:search') {
    handleSearchRequest(message)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  }

  if (message?.type === 'backend:lookup-domains') {
    handleLookupDomainsRequest(message)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  }

  return false;
});

async function handleSearchRequest(message) {
  const query = String(message.query ?? '').trim();
  const pageSize = Number(message.pageSize ?? 5);

  if (!query) {
    return { items: [], totalItems: 0, totalPages: 0, page: 1, pageSize };
  }

  const params = new URLSearchParams({
    q: query,
    page: '1',
    pageSize: String(pageSize)
  });

  return fetchJson(`/api/resources/search?${params.toString()}`);
}

async function handleLookupDomainsRequest(message) {
  const domains = Array.isArray(message.domains)
    ? message.domains.map((domain) => String(domain ?? '').trim()).filter(Boolean)
    : [];

  if (domains.length === 0) {
    return { items: [] };
  }

  const params = new URLSearchParams();
  domains.forEach((domain) => params.append('domains', domain));

  return fetchJson(`/api/resources/lookup?${params.toString()}`);
}

async function fetchJson(path) {
  let lastError = new Error('Backend request failed.');

  for (const baseUrl of API_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}.`);
      }

      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError;
}
