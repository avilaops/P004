const RESERVED = /^\/(api|oauth|\.well-known|_next|cdn-cgi)(\/|$)/i;
const BLOCKED = new Set(['redirect', 'sso']);
const MATCH_ID = /^[A-Z]+-[A-Z0-9]{6,20}$/;
const CAMPAIGN_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const EVENTS = new Set(['page_view', 'click', 'contact_click', 'form_submitted', 'sign_up', 'login', 'activation_completed', 'feature_used', 'subscription_started', 'view_item_list', 'select_item', 'view_item', 'add_to_cart', 'remove_from_cart', 'view_cart', 'begin_checkout', 'add_shipping_info', 'add_payment_info', 'purchase', 'refund']);

function matches(path, prefix) {
  return prefix === '/' ? path === '/' : path === prefix || path.startsWith(prefix + '/');
}

export function resolveRoute(config, rawUrl) {
  let url;
  try { url = new URL(rawUrl); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || RESERVED.test(url.pathname)) return null;
  const site = config.sites.find(s => s.domain === url.hostname || s.aliases?.includes(url.hostname));
  if (!site || BLOCKED.has(site.operation) || !MATCH_ID.test(site.measurementId || '')) return null;
  let operation = site.operation;
  if (operation === 'saas' || operation === 'platform') {
    if (site.applicationPrefixes?.some(prefix => matches(url.pathname, prefix))) {
      operation = site.operation;
    } else if (site.publicPrefixes?.some(prefix => matches(url.pathname, prefix))) {
      operation = 'institutional';
    } else return null;
  }
  const containerId = config.operations[operation]?.id;
  if (!/^GTM-[A-Z0-9]{6,15}$/.test(containerId || '')) return null;
  const privateRoute = site.privatePrefixes?.some(prefix => matches(url.pathname, prefix));
  return { domain: site.domain, operation, area: privateRoute || operation === 'saas' || operation === 'platform' ? 'application' : 'public', measurementId: site.measurementId, containerId };
}

export function sanitizeUrl(rawUrl, area = 'public') {
  let url;
  try { url = new URL(rawUrl); } catch { return null; }
  if (!['http:', 'https:'].includes(url.protocol)) return null;
  if (area === 'application') return url.origin + '/app';
  const segments = url.pathname.split('/').map(segment => {
    let decoded;
    try { decoded = decodeURIComponent(segment); } catch { return 'item'; }
    return /@|\b\d{6,}\b|^[0-9a-f]{8}-[0-9a-f-]{20,}$/i.test(decoded) || decoded.length > 100 ? 'item' : segment;
  });
  const clean = new URL(url.origin + segments.join('/'));
  for (const key of CAMPAIGN_KEYS) {
    const value = url.searchParams.get(key);
    if (value && /^[a-zA-Z0-9._-]{1,80}$/.test(value) && !/\d{9,}/.test(value)) clean.searchParams.set(key, value);
  }
  return clean.toString();
}

function safeText(value, max = 100) {
  return typeof value === 'string' && value.length <= max && !/@|[\r\n<>]/.test(value) ? value : undefined;
}

export function sanitizeEvent(name, input = {}) {
  if (!EVENTS.has(name) || !input || typeof input !== 'object') return null;
  if (name === 'purchase' && (input.confirmed !== true || !safeText(input.transaction_id) || !Number.isFinite(input.value) || input.value < 0 || !/^[A-Z]{3}$/.test(input.currency || ''))) return null;
  const parameters = {};
  for (const key of ['transaction_id', 'currency', 'method', 'feature_name', 'form_type', 'contact_channel', 'site_area', 'operation']) {
    const value = safeText(input[key]);
    if (value !== undefined) parameters[key] = value;
  }
  for (const key of ['value', 'tax', 'shipping']) if (Number.isFinite(input[key]) && input[key] >= 0) parameters[key] = input[key];
  if (Array.isArray(input.items)) parameters.items = input.items.slice(0, 200).map(item => {
    const clean = {};
    for (const key of ['item_id', 'item_name', 'item_category', 'item_brand', 'item_variant']) {
      const value = safeText(item?.[key], 150); if (value !== undefined) clean[key] = value;
    }
    for (const key of ['price', 'quantity', 'discount']) if (Number.isFinite(item?.[key]) && item[key] >= 0) clean[key] = item[key];
    return clean;
  }).filter(item => item.item_id || item.item_name);
  return { name, parameters };
}
