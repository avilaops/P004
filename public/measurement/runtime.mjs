import { resolveRoute, sanitizeUrl, sanitizeEvent } from './core.mjs';

export function installMeasurement(config, options = {}) {
  if (window.__avilaMeasurement) return window.__avilaMeasurement;
  const initial = resolveRoute(config, location.href);
  if (!initial) return { setConsent() {}, track() {} };
  const loaded = new Set();
  const ids = new Set(config.sites.map(s => s.measurementId).filter(Boolean));
  let consent = false;
  let lastView = null;
  let banner;
  window.dataLayer = window.dataLayer || [];
  const command = function () { window.dataLayer.push(arguments); };
  const permitsMeasurement = choice => choice === 'aceito' || choice === 'medicao';
  command('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 });
  command('set', 'ads_data_redaction', true);

  function context() {
    const route = resolveRoute(config, location.href);
    if (!route) return null;
    return {
      measurement_id: route.measurementId,
      container_id: route.containerId,
      operation: route.operation,
      site_area: route.area,
      page_location: sanitizeUrl(location.href, route.area),
      // Referrers may contain customer identifiers even when the current page is public.
      page_referrer: '',
      page_title: route.domain + ' • ' + route.area,
    };
  }

  function loadContainer(id) {
    if (loaded.has(id)) return;
    loaded.add(id);
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.async = true;
    script.dataset.avilaGtm = id;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(id);
    document.head.append(script);
  }

  function view() {
    if (!consent) return;
    const ctx = context();
    if (!ctx) return;
    const key = ctx.container_id + ':' + location.origin + location.pathname;
    if (key === lastView) return;
    lastView = key;
    loadContainer(ctx.container_id);
    window.dataLayer.push({ event: 'avila_page_view', avila: ctx, avila_payload: encodeURIComponent(JSON.stringify({ ...ctx, event_name: 'page_view', parameters: {} })) });
  }

  function setConsent(accepted) {
    const next = accepted === true;
    if (consent === next) return;
    consent = next;
    for (const id of ids) window['ga-disable-' + id] = !next;
    command('consent', 'update', { analytics_storage: next ? 'granted' : 'denied' });
    banner?.remove();
    if (next) { lastView = null; view(); }
  }

  function track(name, input) {
    if (!consent) return false;
    const ctx = context();
    const event = sanitizeEvent(name, input);
    if (!ctx || !event || name === 'page_view') return false;
    const payload = { ...ctx, event_name: event.name, parameters: event.parameters };
    window.dataLayer.push({ event: 'avila_event', avila: payload, avila_payload: encodeURIComponent(JSON.stringify(payload)) });
    return true;
  }

  const api = { setConsent, track };
  window.__avilaMeasurement = api;
  for (const method of ['pushState', 'replaceState']) {
    const original = history[method];
    history[method] = function (...args) { const result = original.apply(this, args); view(); return result; };
  }
  window.addEventListener('popstate', view);
  document.addEventListener('click', event => {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link) return;
    let target;
    try { target = new URL(link.href, location.href); } catch { return; }
    const channel = target.protocol === 'tel:' ? 'phone' : target.protocol === 'mailto:' ? 'email' : ['wa.me', 'api.whatsapp.com', 'web.whatsapp.com'].includes(target.hostname) ? 'whatsapp' : null;
    if (channel) track('contact_click', { contact_channel: channel });
  });
  window.addEventListener('loja:consentimento', event => setConsent(permitsMeasurement(event.detail)));
  window.addEventListener('avila:consentimento', event => setConsent(permitsMeasurement(event.detail)));
  let stored;
  try { stored = JSON.parse(localStorage.getItem('loja_consentimento')); } catch { /* no usable decision */ }
  if (stored?.versao === 1) setConsent(permitsMeasurement(stored.escolha));
  else if (initial.operation !== 'ecommerce' && options.banner === true) {
    try { stored = JSON.parse(localStorage.getItem('avila_consentimento')); } catch { /* no usable decision */ }
    if (stored?.versao === 1) setConsent(stored.escolha === 'aceito');
    else {
      banner = document.createElement('aside');
      banner.dataset.avilaConsent = '';
      banner.setAttribute('aria-label', 'Preferências de privacidade');
      banner.style.cssText = 'position:fixed;bottom:16px;left:16px;right:16px;padding:20px;background:#fff;color:#171717;border:1px solid #aaa;border-radius:12px;z-index:2147483647;font:16px system-ui;box-shadow:0 4px 24px #0003';
      const message = document.createElement('p');
      message.textContent = 'Podemos usar cookies de análise para entender o uso deste site? Você pode continuar apenas com os cookies essenciais.';
      banner.append(message);
      for (const [label, accepted] of [['Apenas essenciais', false], ['Aceitar análise', true]]) {
        const button = document.createElement('button');
        button.textContent = label;
        button.type = 'button';
        button.style.cssText = 'padding:10px 16px;margin:4px;border:1px solid #777;border-radius:6px;cursor:pointer';
        button.onclick = () => {
          try { localStorage.setItem('avila_consentimento', JSON.stringify({ escolha: accepted ? 'aceito' : 'essencial', versao: 1 })); } catch { /* session-only decision */ }
          setConsent(accepted);
          banner.remove();
        };
        banner.append(button);
      }
      document.body.append(banner);
    }
  }
  const pending = window.__avilaMeasurementQueue || [];
  window.__avilaMeasurementQueue = [];
  for (const item of pending) if (item.path === location.pathname) track(item.name, item.parameters);
  return api;
}
