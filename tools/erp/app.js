/* Forge ERP — browser client. No dependencies; all DOM built with textContent (no innerHTML of data). */
'use strict';
const S = { me: null, meta: null, lists: {}, cur: '$' };
const RANK = { viewer: 0, clerk: 1, manager: 2, admin: 3 };
const can = r => S.me && RANK[S.me.role] >= RANK[r];

/* ------------------------------------------------------------------ DOM helpers */
function h(tag, attrs, ...kids) {
  const el = document.createElementNS(tag === 'svg' || attrs?.__svg ? 'http://www.w3.org/2000/svg' : 'http://www.w3.org/1999/xhtml', tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === '__svg' || v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.setAttribute('class', v);
    else if (['value', 'checked', 'disabled', 'selected', 'indeterminate'].includes(k)) el[k] = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  add(el, kids);
  return el;
}
function add(el, kids) {
  for (const k of kids.flat(9)) {
    if (k == null || k === false) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
  return el;
}
const ap = (el, ...kids) => add(el, kids);
const svg = (tag, attrs, ...kids) => h(tag, { ...attrs, __svg: true }, ...kids);
const clear = el => { while (el.firstChild) el.firstChild.remove(); return el; };
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const esc = s => String(s ?? '');

/* ------------------------------------------------------------------ formatting */
const nf2 = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf4 = new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 });
const nfc = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
const money = v => (v < 0 ? '-' : '') + S.cur + nf2.format(Math.abs(+v || 0));
const moneyK = v => { const a = Math.abs(v); return (v < 0 ? '-' : '') + S.cur + (a >= 1e6 ? (a / 1e6).toFixed(2) + 'M' : a >= 1e3 ? (a / 1e3).toFixed(1) + 'K' : nf2.format(a)); };
const qty = v => nf4.format(+v || 0);
const STATUS = {
  good: ['paid', 'received', 'closed', 'completed', 'shipped', 'active', 'in_service', 'yes'],
  info: ['approved', 'confirmed', 'released', 'open', 'receipt', 'output'],
  warn: ['partial', 'draft', 'planned', 'maintenance', 'leave', 'adjustment', 'make'],
  bad: ['cancelled', 'void', 'terminated', 'disposed', 'no', 'shipment', 'issue'],
};
function tag(v) {
  if (v == null || v === '') return '';
  const s = String(v); let cls = '';
  for (const [k, arr] of Object.entries(STATUS)) if (arr.includes(s)) cls = k;
  return h('span', { class: 'tag ' + cls }, s.replace(/_/g, ' '));
}
function cell(type, v) {
  if (v == null || v === '') return '';
  switch (type) {
    case 'money': return h('span', { class: v < 0 ? 'neg' : '' }, money(v));
    case 'cost': return S.cur + nfc.format(v);
    case 'qty': return h('span', { class: v < 0 ? 'neg' : '' }, qty(v));
    case 'int': return String(v);
    case 'pct': return nf4.format(v) + '%';
    case 'bool': return v ? 'Yes' : h('span', { class: 'faint' }, 'No');
    case 'tag': return tag(v);
    case 'date': return String(v).slice(0, 10);
    case 'datetime': return String(v).replace('T', ' ').slice(0, 16);
    default: return String(v);
  }
}
const isNum = t => ['money', 'cost', 'qty', 'int', 'pct', 'float'].includes(t);
const todayISO = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };

/* ------------------------------------------------------------------ API */
async function api(path, body) {
  const opt = { headers: {}, credentials: 'same-origin' };
  if (body !== undefined) {
    opt.method = 'POST';
    opt.headers['Content-Type'] = 'application/json';
    if (S.me) opt.headers['X-CSRF'] = S.me.csrf;
    opt.body = JSON.stringify(body);
  }
  let r;
  try { r = await fetch(path, opt); } catch (e) { throw new Error('The ERP server is not responding. Is it still running?'); }
  if (r.status === 401 && !path.endsWith('/login')) { S.me = null; renderLogin(); throw new Error('Your session has ended. Please sign in.'); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || r.statusText);
  return d;
}
async function download(path) {
  const r = await fetch(path, { credentials: 'same-origin' });
  if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || 'Download failed'); }
  const cd = r.headers.get('Content-Disposition') || '';
  const name = (cd.match(/filename="([^"]+)"/) || [])[1] || 'download';
  const url = URL.createObjectURL(await r.blob());
  const a = h('a', { href: url, download: name }); ap(document.body, a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function toast(msg, err) {
  const t = h('div', { class: 'toast' + (err ? ' err' : ''), role: err ? 'alert' : 'status' }, msg);
  document.getElementById('toasts').append(t);
  setTimeout(() => t.remove(), err ? 7000 : 3500);
}
/** Run an async handler with a busy button and error toast. */
function busy(fn) {
  return async ev => {
    const b = ev?.currentTarget; if (b?.getAttribute?.('aria-busy') === 'true') return;
    b?.setAttribute?.('aria-busy', 'true');
    try { await fn(ev); } catch (e) { toast(e.message, true); } finally { b?.removeAttribute?.('aria-busy'); }
  };
}
const btn = (label, onclick, cls = '', extra = {}) => h('button', { class: 'btn ' + cls, type: 'button', onclick: onclick && busy(onclick), ...extra }, label);
const go = hash => { if (location.hash === hash) route(); else location.hash = hash; };

/* ------------------------------------------------------------------ dialogs */
function dialog(title, body, buttons, opts = {}) {
  const msg = h('div');
  const prev = document.activeElement;
  const close = () => { scrim.remove(); document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  const foot = h('footer', {}, btn('Cancel', close, 'ghost'),
    buttons.map(b => h('button', {
      class: 'btn ' + (b.cls || ''), type: 'button', onclick: async ev => {
        const t = ev.currentTarget; if (t.getAttribute('aria-busy')) return;
        t.setAttribute('aria-busy', 'true'); clear(msg);
        try { if ((await b.run()) !== false) close(); }
        catch (e) { ap(msg, h('div', { class: 'msg err', role: 'alert' }, e.message)); }
        finally { t.removeAttribute('aria-busy'); }
      }
    }, b.label)));
  const box = h('div', { class: 'dlg' + (opts.wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('header', {}, title), h('div', { class: 'body' }, msg, body), foot);
  const scrim = h('div', { class: 'scrim', onmousedown: e => { if (e.target === scrim) close(); } }, box);
  ap(document.body, scrim);
  document.addEventListener('keydown', onKey);
  setTimeout(() => (box.querySelector('input:not([type=checkbox]),select,textarea') || foot.lastChild).focus(), 20);
  return { close, msg };
}
const confirmDlg = (title, text, label, run, cls = 'danger') => dialog(title, h('p', {}, text), [{ label, cls, run }]);

/* ------------------------------------------------------------------ inputs */
function field(label, input, opts = {}) {
  return h('label', { class: 'f' + (opts.wide ? ' wide' : '') }, h('span', {}, label, opts.req ? h('b', {}, ' *') : ''), input);
}
const inp = (type, value, extra = {}) => h('input', { class: 'in', type, value: value ?? '', ...extra });
const numIn = (value, extra = {}) => inp('number', value, { step: 'any', min: '0', inputmode: 'decimal', ...extra });
function selectIn(choices, value, blank) {
  return h('select', { class: 'in' }, blank !== undefined ? h('option', { value: '' }, blank) : null,
    choices.map(c => { const [v, l] = Array.isArray(c) ? c : [c, String(c).replace(/_/g, ' ')]; return h('option', { value: v, selected: String(v) === String(value ?? '') }, l); }));
}
function locationSel(value) {
  return selectIn(S.meta.locations.map(l => [l.id, `${l.code} — ${l.name}`]), value ?? S.meta.locations[0]?.id);
}

/** Async type-ahead for references. el.value -> id. */
function lookup(entity, id, opts = {}) {
  let cur = id || null, items = [], sel = -1;
  const input = h('input', { class: 'in', type: 'text', placeholder: opts.placeholder || 'Search…', autocomplete: 'off', disabled: !!opts.disabled, role: 'combobox', 'aria-expanded': 'false' });
  const pop = h('div', { class: 'pop', role: 'listbox', hidden: true });
  const wrap = h('div', { class: 'lk' }, input, pop);
  const pick = it => { cur = it.id; input.value = it.label; pop.hidden = true; input.setAttribute('aria-expanded', 'false'); opts.onPick?.(it); };
  const paint = () => {
    clear(pop);
    if (!items.length) ap(pop, h('div', { class: 'none' }, 'No matches'));
    items.forEach((it, i) => ap(pop, h('div', { class: i === sel ? 'sel' : '', role: 'option', onmousedown: e => { e.preventDefault(); pick(it); } }, it.label)));
    pop.hidden = false; input.setAttribute('aria-expanded', 'true');
  };
  const search = debounce(async () => { try { items = await api(`/api/lookup/${entity}?q=${encodeURIComponent(input.value)}`); sel = items.length ? 0 : -1; paint(); } catch (e) { toast(e.message, true); } }, 180);
  input.addEventListener('input', () => { cur = null; search(); });
  input.addEventListener('focus', () => { if (!input.value) search(); });
  input.addEventListener('blur', () => setTimeout(() => { pop.hidden = true; if (!cur) input.value = ''; }, 150));
  input.addEventListener('keydown', e => {
    if (pop.hidden) return;
    if (e.key === 'ArrowDown') { sel = Math.min(items.length - 1, sel + 1); paint(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); paint(); e.preventDefault(); }
    else if (e.key === 'Enter' && items[sel]) { pick(items[sel]); e.preventDefault(); }
    else if (e.key === 'Escape') { pop.hidden = true; e.stopPropagation(); }
  });
  if (id) api(`/api/lookup/${entity}?id=${id}`).then(r => { if (r[0]) { input.value = r[0].label; opts.onLoad?.(r[0]); } }).catch(() => {});
  Object.defineProperty(wrap, 'value', { get: () => cur });
  wrap.focus = () => input.focus();
  return wrap;
}

/** Generic form from field metadata. */
function buildForm(fields, rec, ro) {
  const ctl = {};
  const form = h('div', { class: 'form' });
  for (const f of fields) {
    const v = rec?.[f.name] ?? (rec?.id ? null : f.default);
    let el;
    const dis = ro || f.readonly;
    switch (f.type) {
      case 'bool': el = h('input', { type: 'checkbox', checked: !!+v, disabled: dis }); ap(form, h('label', { class: 'f' }, h('span', {}, f.label), h('label', { class: 'chk' }, el, 'Yes'))); ctl[f.name] = el; continue;
      case 'int': case 'float': case 'money': case 'cost': el = numIn(v, { disabled: dis, step: f.type === 'int' ? '1' : 'any' }); break;
      case 'date': el = inp('date', v ? String(v).slice(0, 10) : '', { disabled: dis }); break;
      case 'select': el = selectIn(f.choices, v, f.required ? undefined : '—'); el.disabled = dis; break;
      case 'ref': el = lookup(f.ref, v, { disabled: dis }); break;
      case 'textarea': el = h('textarea', { class: 'in', disabled: dis }, v ?? ''); break;
      default: el = inp(f.type === 'email' ? 'email' : 'text', v, { disabled: dis, maxlength: '400' });
    }
    if (f.sensitive && v == null && rec?.id && !can('manager')) el.disabled = true;
    ctl[f.name] = el;
    ap(form, field(f.label, el, { req: f.required, wide: f.type === 'textarea' }));
  }
  form.values = () => {
    const out = {};
    for (const f of fields) {
      if (f.readonly) continue;
      const el = ctl[f.name];
      if (el.disabled && f.sensitive) continue;
      out[f.name] = f.type === 'bool' ? (el.checked ? 1 : 0) : el.value === '' ? null : el.value;
    }
    return out;
  };
  form.ctl = ctl;
  return form;
}

/* ------------------------------------------------------------------ tables */
function table(cols, rows, opts = {}) {
  const tb = h('tbody');
  if (!rows.length) ap(tb, h('tr', {}, h('td', { colspan: cols.length + (opts.check ? 1 : 0), class: 'empty' }, opts.empty || 'Nothing to show.')));
  for (const r of rows) {
    const href = opts.href?.(r);
    const tr = h('tr', { class: (href ? 'link' : '') + (opts.selected?.has(r.id) ? ' chosen' : ''), tabindex: href ? '0' : null });
    if (opts.check) {
      const cb = h('input', { type: 'checkbox', checked: opts.selected.has(r.id), 'aria-label': 'Select row', onclick: e => { e.stopPropagation(); opts.onCheck(r, cb.checked); } });
      ap(tr, h('td', { class: 'ck' }, cb));
    }
    for (const c of cols) ap(tr, h('td', { class: isNum(c.type) ? 'num' : '' }, c.render ? c.render(r) : cell(c.type, r[c.key])));
    if (href) { tr.addEventListener('click', e => { if (e.target.closest('a,button,input')) return; go(href); }); tr.addEventListener('keydown', e => { if (e.key === 'Enter') go(href); }); }
    ap(tb, tr);
  }
  const head = h('tr', {}, opts.check ? h('th', { class: 'ck' }, h('input', {
    type: 'checkbox', 'aria-label': 'Select all', checked: rows.length > 0 && rows.every(r => opts.selected.has(r.id)),
    onclick: e => opts.onCheckAll(e.target.checked)
  })) : null,
    cols.map(c => {
      const sorted = opts.sort === c.key;
      return h('th', { class: (isNum(c.type) ? 'num ' : '') + (opts.onSort ? 'sort' : ''), onclick: opts.onSort ? () => opts.onSort(c.key) : null, 'aria-sort': sorted ? (opts.dir === 'desc' ? 'descending' : 'ascending') : null },
        c.label, sorted ? h('span', { class: 'ar' }, opts.dir === 'desc' ? '▼' : '▲') : '');
    }));
  const foot = opts.totals ? h('tfoot', {}, h('tr', {}, cols.map((c, i) => h('td', { class: isNum(c.type) ? 'num' : '' }, i === 0 ? 'Total' : opts.totals[c.key] != null ? cell(c.type, opts.totals[c.key]) : '')))) : null;
  return h('div', { class: 'tw' }, h('table', { class: 't' }, h('thead', {}, head), tb, foot));
}
const panel = (title, body, acts) => h('section', { class: 'panel' }, title ? h('header', {}, title, acts ? h('div', { class: 'acts' }, acts) : null) : null, h('div', { class: 'body' }, body));
const flush = (title, body, acts) => h('section', { class: 'panel' }, h('header', {}, title, acts ? h('div', { class: 'acts' }, acts) : null), body);
function pageHead(title, sub, acts, crumb) {
  return h('div', { class: 'ph' }, h('div', {}, crumb ? h('div', { class: 'crumb' }, crumb) : null, h('h1', {}, title), sub ? h('div', { class: 'sub' }, sub) : null),
    h('div', { class: 'acts' }, acts));
}
const crumbTo = ent => h('a', { href: '#/list/' + ent }, S.meta.entities[ent].plural);

/* ------------------------------------------------------------------ login & shell */
function renderLogin(err) {
  const u = inp('text', '', { autocomplete: 'username', required: true }), p = inp('password', '', { autocomplete: 'current-password', required: true });
  const msg = h('div');
  if (err) ap(msg, h('div', { class: 'msg err' }, err));
  const f = h('form', {
    onsubmit: async e => {
      e.preventDefault(); clear(msg);
      try { await api('/api/login', { username: u.value, password: p.value }); await boot(); }
      catch (er) { ap(msg, h('div', { class: 'msg err', role: 'alert' }, er.message)); p.select(); }
    }
  }, h('h1', {}, 'Forge ERP'), h('p', {}, 'Sign in to continue'), msg,
    h('label', { class: 'f' }, h('span', {}, 'Username'), u), h('label', { class: 'f' }, h('span', {}, 'Password'), p),
    h('button', { class: 'btn pri', type: 'submit', style: 'width:100%;justify-content:center' }, 'Sign in'));
  ap(clear(document.getElementById('app')), h('div', { class: 'login' }, f));
  u.focus();
}

const NAV = [
  ['Overview', [['Dashboard', '#/dash'], ['Reports', '#/reports']]],
  ['Sales', [['Customers', '#/list/customers'], ['Sales orders', '#/list/sales_orders'], ['Shipments', '#/list/shipments'], ['Invoices', '#/list/invoices'], ['Customer payments', '#/list/payments']]],
  ['Purchasing', [['Suppliers', '#/list/suppliers'], ['Purchase orders', '#/list/purchase_orders'], ['Receipts', '#/list/receipts'], ['Supplier bills', '#/list/bills'], ['Supplier payments', '#/list/supplier_payments']]],
  ['Inventory', [['Items', '#/list/items'], ['Stock by location', '#/list/stock'], ['Inventory ledger', '#/list/inventory_txns'], ['Locations', '#/list/locations'], ['Reconciliation', '#/reconcile']]],
  ['Manufacturing', [['Production orders', '#/list/production_orders'], ['Bills of materials', '#/list/boms']]],
  ['People & assets', [['Employees', '#/list/employees'], ['Assets', '#/list/assets']]],
  ['Admin', [['Users', '#/list/users', 'admin'], ['Settings', '#/settings', 'admin'], ['Backup & restore', '#/backups', 'admin'], ['Audit log', '#/list/audit_log', 'manager']]],
];

let MAIN, SHELL;
function renderShell() {
  const nav = h('nav', { class: 'nav', 'aria-label': 'Main' });
  for (const [grp, links] of NAV) {
    const vis = links.filter(l => !l[2] || can(l[2]));
    if (!vis.length) continue;
    ap(nav, h('h6', {}, grp), vis.map(([l, href]) => h('a', { href, dataset: { href } }, l)));
  }
  const theme = () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; try { localStorage.setItem('erp-theme', t); } catch (e) { } route(); };
  MAIN = h('main', { id: 'main', tabindex: '-1' });
  SHELL = h('div', { class: 'shell' },
    h('header', { class: 'top' },
      h('button', { class: 'btn ghost menu-btn', 'aria-label': 'Menu', onclick: () => SHELL.classList.toggle('open') }, '☰'),
      h('div', { class: 'brand' }, h('i'), 'Forge ERP', h('span', {}, S.meta.values.company_name)),
      globalSearch(), h('div', { class: 'spacer' }),
      h('div', { class: 'who' },
        btn(document.documentElement.dataset.theme === 'dark' ? 'Light' : 'Dark', theme, 'ghost sm', { title: 'Toggle theme' }),
        h('span', { class: 'name muted' }, S.me.full_name, ' · ', S.me.role),
        btn('Password', () => passwordDlg(), 'ghost sm pw'),
        btn('Sign out', async () => { await api('/api/logout', {}); S.me = null; renderLogin(); }, 'sm'))),
    nav, MAIN);
  nav.addEventListener('click', e => { if (e.target.closest('a')) SHELL.classList.remove('open'); });
  ap(clear(document.getElementById('app')), SHELL);
}

function globalSearch() {
  const input = h('input', { type: 'search', placeholder: 'Search everything…', 'aria-label': 'Global search', autocomplete: 'off' });
  const res = h('div', { class: 'results', hidden: true });
  let items = [], sel = 0;
  const paint = () => {
    clear(res);
    if (!items.length) ap(res, h('div', { class: 'empty' }, 'No matches'));
    items.forEach((r, i) => ap(res, h('a', { href: `#/rec/${r.entity}/${r.id}`, class: i === sel ? 'sel' : '', onclick: () => { res.hidden = true; input.blur(); } },
      h('span', { class: 'k' }, r.label), h('span', {}, h('b', {}, r.title), ' ', h('span', { class: 'muted' }, r.subtitle || '')), r.status ? tag(r.status) : '')));
    res.hidden = false;
  };
  const run = debounce(async () => {
    if (input.value.trim().length < 2) { res.hidden = true; return; }
    try { items = await api('/api/search?q=' + encodeURIComponent(input.value)); sel = 0; paint(); } catch (e) { toast(e.message, true); }
  }, 200);
  input.addEventListener('input', run);
  input.addEventListener('keydown', e => {
    if (res.hidden) return;
    if (e.key === 'ArrowDown') { sel = Math.min(items.length - 1, sel + 1); paint(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); paint(); e.preventDefault(); }
    if (e.key === 'Enter' && items[sel]) { go(`#/rec/${items[sel].entity}/${items[sel].id}`); res.hidden = true; input.blur(); }
    if (e.key === 'Escape') { res.hidden = true; input.blur(); }
  });
  input.addEventListener('blur', () => setTimeout(() => res.hidden = true, 200));
  document.addEventListener('keydown', e => {
    if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !e.target.closest('input,textarea,select'))) { e.preventDefault(); input.focus(); input.select(); }
  });
  return h('div', { class: 'search', role: 'search' },
    svg('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, svg('circle', { cx: 7, cy: 7, r: 5 }), svg('path', { d: 'M11 11l4 4' })),
    input, h('kbd', {}, 'Ctrl K'), res);
}

function passwordDlg(userId, username) {
  const oldp = inp('password', '', { autocomplete: 'current-password' }), n1 = inp('password', '', { autocomplete: 'new-password' }), n2 = inp('password', '', { autocomplete: 'new-password' });
  const admin = userId != null;
  dialog(admin ? `Reset password for ${username}` : 'Change password',
    h('div', { class: 'form', style: 'grid-template-columns:1fr' }, admin ? null : field('Current password', oldp), field('New password (8+ characters)', n1), field('Repeat new password', n2),
      admin ? h('p', { class: 'muted' }, 'The user will be signed out and asked to change it at next sign-in.') : null),
    [{
      label: admin ? 'Reset' : 'Change', cls: 'pri', run: async () => {
        if (n1.value !== n2.value) throw new Error('New passwords do not match.');
        await api('/api/password', { user_id: userId, old_password: oldp.value, new_password: n1.value });
        toast('Password updated'); if (!admin) { S.me.must_change_pw = false; route(); }
      }
    }]);
}

/* ------------------------------------------------------------------ router */
let ROUTE_SEQ = 0;
async function route() {
  if (!S.me) return;
  const seq = ++ROUTE_SEQ;
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  const [view, a, b] = parts;
  document.querySelectorAll('.nav a').forEach(x => {
    const hr = x.dataset.href; const cur = '#/' + parts.slice(0, view === 'rec' ? 0 : 2).join('/');
    x.classList.toggle('on', hr === cur || (view === 'rec' && hr === '#/list/' + a) || (view === 'reports' && hr === '#/reports'));
  });
  ap(clear(MAIN), h('div', { class: 'loading' }, 'Loading…'));
  const page = h('div');
  if (S.me.must_change_pw) ap(page, h('div', { class: 'banner' }, h('b', {}, 'Default or temporary password in use.'), ' Change it before using this system with real data.', btn('Change now', () => passwordDlg(), 'sm')));
  try {
    if (!view || view === 'dash') await viewDash(page);
    else if (view === 'list') await viewList(page, a);
    else if (view === 'rec') await viewRecord(page, a, b, parts.slice(3));
    else if (view === 'reports') await (a ? viewReport(page, a) : viewReports(page));
    else if (view === 'reconcile') await viewReconcile(page);
    else if (view === 'settings') await viewSettings(page);
    else if (view === 'backups') await viewBackups(page);
    else ap(page, h('div', { class: 'empty' }, 'Page not found.'));
  } catch (e) {
    ap(page, h('div', { class: 'msg err', role: 'alert' }, e.message));
  }
  if (seq !== ROUTE_SEQ) return; // a newer navigation superseded this one
  ap(clear(MAIN), page);
  MAIN.scrollTop = 0;
}
window.addEventListener('hashchange', route);

/* ------------------------------------------------------------------ charts */
function niceMax(v) { if (v <= 0) return 1; const p = 10 ** Math.floor(Math.log10(v)); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
function lineChart(rows, series, xKey) {
  const W = 680, H = 230, L = 56, R = 64, T = 12, B = 26;
  const max = niceMax(Math.max(1, ...rows.flatMap(r => series.map(s => r[s.key]))));
  const x = i => L + (rows.length < 2 ? 0 : i * (W - L - R) / (rows.length - 1));
  const y = v => T + (H - T - B) * (1 - v / max);
  const g = svg('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': series.map(s => s.label).join(' and ') + ' by month' });
  for (let i = 0; i <= 4; i++) {
    const v = max * i / 4;
    ap(g, svg('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: 'var(--grid)', 'stroke-width': 1 }),
      svg('text', { x: L - 8, y: y(v) + 4, 'text-anchor': 'end', 'font-size': 11, fill: 'var(--text-3)' }, moneyK(v)));
  }
  rows.forEach((r, i) => { if (i % 2 === 0 || rows.length <= 8) ap(g, svg('text', { x: x(i), y: H - 6, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--text-3)' }, r[xKey])); });
  for (const s of series) {
    ap(g, svg('path', { d: rows.map((r, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(r[s.key]).toFixed(1)).join(''), fill: 'none', stroke: s.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    const last = rows[rows.length - 1];
    if (last) ap(g, svg('text', { x: x(rows.length - 1) + 8, y: y(last[s.key]) + 4, 'font-size': 11, fill: 'var(--text-2)' }, s.label));
  }
  const cross = svg('line', { y1: T, y2: H - B, stroke: 'var(--line-strong)', 'stroke-width': 1, visibility: 'hidden' });
  const dots = series.map(s => svg('circle', { r: 4, fill: s.color, stroke: 'var(--surface)', 'stroke-width': 2, visibility: 'hidden' }));
  ap(g, cross, ...dots);
  const tip = h('div', { class: 'tip', hidden: true });
  const hit = svg('rect', { x: L, y: T, width: W - L - R, height: H - T - B, fill: 'transparent' });
  const wrap = h('div', { class: 'chart' }, g, tip);
  hit.addEventListener('mousemove', e => {
    const box = g.getBoundingClientRect(); const px = (e.clientX - box.left) * W / box.width;
    const i = Math.max(0, Math.min(rows.length - 1, Math.round((px - L) / ((W - L - R) / Math.max(1, rows.length - 1)))));
    cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.setAttribute('visibility', 'visible');
    series.forEach((s, k) => { dots[k].setAttribute('cx', x(i)); dots[k].setAttribute('cy', y(rows[i][s.key])); dots[k].setAttribute('visibility', 'visible'); });
    ap(clear(tip), h('b', {}, rows[i][xKey]), series.map(s => h('div', {}, h('span', { style: `display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.color};margin-right:6px` }), s.label + ': ' + money(rows[i][s.key]))));
    tip.hidden = false;
    const left = x(i) * box.width / W;
    tip.style.left = Math.min(left + 12, box.width - 170) + 'px'; tip.style.top = '8px';
  });
  hit.addEventListener('mouseleave', () => { tip.hidden = true; cross.setAttribute('visibility', 'hidden'); dots.forEach(d => d.setAttribute('visibility', 'hidden')); });
  ap(g, hit);
  return h('div', {}, h('div', { class: 'legend' }, series.map(s => h('span', {}, h('i', { style: `background:${s.color}` }), s.label))), wrap);
}
function hbars(rows, labelFn, valKey, hrefFn) {
  const max = Math.max(1, ...rows.map(r => r[valKey]));
  if (!rows.length) return h('div', { class: 'empty' }, 'No data');
  return h('div', {}, rows.map(r => h('div', { class: 'hbar' },
    hrefFn ? h('a', { href: hrefFn(r), style: 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }, labelFn(r)) : h('span', {}, labelFn(r)),
    h('div', { class: 'track', title: money(r[valKey]) }, h('div', { class: 'fill', style: `width:${Math.max(r[valKey] > 0 ? 2 : 0, 100 * r[valKey] / max)}%` })),
    h('span', { class: 'num' }, moneyK(r[valKey])))));
}

/* ------------------------------------------------------------------ dashboard */
async function viewDash(page) {
  const d = await api('/api/dashboard'), k = d.kpi;
  const delta = k.revenue_last_month ? (k.revenue_mtd / k.revenue_last_month - 1) * 100 : 0;
  const kpi = (l, v, s, href) => h(href ? 'a' : 'div', { class: 'kpi', href }, h('div', { class: 'l' }, l), h('div', { class: 'v' }, v), h('div', { class: 's' }, s));
  const late = (n, w) => n ? h('span', { class: 'bad' }, `${n} ${w}`) : h('span', {}, `none ${w}`);
  ap(page, pageHead('Dashboard', `${S.meta.values.company_name} · ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    [can('clerk') ? btn('New sales order', () => go('#/rec/sales_orders/new'), 'pri') : null, can('clerk') ? btn('New purchase order', () => go('#/rec/purchase_orders/new')) : null]),
    h('div', { class: 'kpis' },
      kpi('Revenue, month to date', moneyK(k.revenue_mtd), [`vs ${moneyK(k.revenue_last_month)} last month `, k.revenue_last_month ? h('span', { class: delta >= 0 ? 'good' : 'bad' }, `${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta).toFixed(0)}%`) : ''], '#/reports/sales_by_customer'),
      kpi('Gross margin, MTD', k.revenue_mtd ? (100 * (k.revenue_mtd - k.cogs_mtd) / k.revenue_mtd).toFixed(1) + '%' : '—', `COGS ${moneyK(k.cogs_mtd)} · YTD rev ${moneyK(k.revenue_ytd)}`, '#/reports/sales_by_item'),
      kpi('Receivables open', moneyK(k.ar_open), [k.ar_overdue ? h('span', { class: 'bad' }, moneyK(k.ar_overdue) + ' overdue') : 'nothing overdue'], '#/reports/ar_aging'),
      kpi('Payables open', moneyK(k.ap_open), `${moneyK(k.ap_due_7)} due within 7 days`, '#/reports/ap_aging'),
      kpi('Inventory value', moneyK(k.inventory_value), [k.low_stock ? h('span', { class: 'bad' }, `${k.low_stock} items to replenish`) : 'stock levels OK'], '#/reports/reorder'),
      kpi('Sales backlog', moneyK(k.so_backlog), [`${k.so_open} open orders · `, late(k.so_late, 'late')], '#/reports/open_orders'),
      kpi('Open purchase orders', moneyK(k.po_open_value), [`${k.po_draft} awaiting approval · `, late(k.po_late, 'late')], '#/list/purchase_orders'),
      kpi('Production', `${k.mo_active} active`, [late(k.mo_late, 'past due'), ` · ${k.headcount} staff`], '#/list/production_orders')),
    h('div', { class: 'cols3' },
      h('div', { class: 'stack' },
        panel('Revenue and cost of goods sold, last 12 months', lineChart(d.monthly, [{ key: 'revenue', label: 'Revenue', color: 'var(--series-1)' }, { key: 'cogs', label: 'COGS', color: 'var(--series-2)' }], 'month'),
          h('a', { href: '#/reports/sales_by_customer' }, 'Details')),
        flush('Late sales orders', table([{ key: 'number', label: 'SO #' }, { key: 'customer_name', label: 'Customer' }, { key: 'ship_by', label: 'Ship by', type: 'date' }, { key: 'open_value', label: 'Open value', type: 'money' }],
          d.late_orders, { href: r => `#/rec/sales_orders/${r.id}`, empty: 'No late orders.' })),
        panel('Recent activity', h('ul', { class: 'list-plain' }, d.recent.map(r => h('li', {}, h('span', { class: 'faint mono', style: 'min-width:110px' }, r.ts.replace('T', ' ').slice(5, 16)),
          h('span', { class: 'muted', style: 'min-width:80px' }, r.username), h('span', {}, r.summary || `${r.action} ${r.entity}`)))), h('a', { href: '#/list/audit_log' }, 'Audit log'))),
      h('div', { class: 'stack' },
        panel('Receivables aging', hbars(d.ar_aging, r => r.bucket === 'Current' ? 'Not yet due' : r.bucket + ' days late', 'amount'), h('a', { href: '#/reports/ar_aging' }, 'Report')),
        panel('Top customers, 12 months', hbars(d.top_customers, r => r.name, 'revenue', r => `#/rec/customers/${r.id}`)),
        panel('Top products, 12 months', hbars(d.top_items, r => r.name, 'revenue', r => `#/rec/items/${r.id}`)),
        panel('Inventory value by type', hbars(d.inventory_by_type, r => r.type, 'value')))));
}

/* ------------------------------------------------------------------ generic list */
const CREATE = { purchase_orders: 'clerk', sales_orders: 'clerk', production_orders: 'clerk', boms: 'manager' };
function rowHref(ent, r) {
  switch (ent) {
    case 'inventory_txns': case 'stock': return `#/rec/items/${r.item_id}`;
    case 'payments': return `#/rec/invoices/${r.invoice_id}`;
    case 'supplier_payments': return `#/rec/bills/${r.bill_id}`;
    case 'audit_log': return r.entity_id && S.meta.entities[r.entity] && !['stock'].includes(r.entity) ? `#/rec/${r.entity}/${r.entity_id}` : null;
    default: return `#/rec/${ent}/${r.id}`;
  }
}
function listState(ent) {
  if (!S.lists[ent]) {
    let saved = null; try { saved = JSON.parse(sessionStorage.getItem('erp-list-' + ent)); } catch (e) { }
    S.lists[ent] = Object.assign({ q: '', f: {}, from: '', to: '', sort: '', dir: '', page: 1, size: 50 }, saved || {}, { sel: new Set() });
  }
  return S.lists[ent];
}
async function viewList(page, ent) {
  const m = S.meta.entities[ent];
  if (!m) throw new Error('Unknown list.');
  const st = listState(ent);
  const save = () => { try { const { sel, ...rest } = st; sessionStorage.setItem('erp-list-' + ent, JSON.stringify(rest)); } catch (e) { } };
  const canCreate = m.txn ? (CREATE[ent] && can(CREATE[ent])) : can(m.role || 'clerk');
  const bulkable = (m.bulk || []).length && can('manager') && !m.txn;
  const qs = (extra = {}) => {
    const p = new URLSearchParams({ q: st.q, from: st.from, to: st.to, sort: st.sort, dir: st.dir, page: st.page, size: st.size, ...extra });
    for (const [k, v] of Object.entries(st.f)) if (v !== '') p.set('f_' + k, v);
    return p.toString();
  };
  const exportMenu = selectIn([['csv', 'Export view to CSV'], ['xlsx', 'Export view to Excel'], ...(!m.txn && !m.noimport ? [['data', 'Export data for re-import'], ['template', 'Import template']] : [])], '', 'Export…');
  exportMenu.style.width = 'auto';
  exportMenu.addEventListener('change', busy(async () => {
    const v = exportMenu.value; exportMenu.value = '';
    if (v === 'csv' || v === 'xlsx') await download(`/api/list/${ent}?${qs({ format: v })}`);
    else if (v === 'data') await download(`/api/export/${ent}?format=xlsx`);
    else if (v === 'template') await download(`/api/template/${ent}?format=xlsx`);
  }));
  ap(page, pageHead(m.plural, null, [
    canCreate ? btn('New ' + m.label.toLowerCase(), () => go(`#/rec/${ent}/new`), 'pri') : null,
    !m.txn && !m.noimport && can('manager') ? btn('Import', () => importDlg(ent, reload)) : null, exportMenu]));
  const q = inp('search', st.q, { class: 'in grow', placeholder: `Search ${m.plural.toLowerCase()}…`, 'aria-label': 'Filter list' });
  q.addEventListener('input', debounce(() => { st.q = q.value; st.page = 1; save(); reload(); }, 250));
  const tools = h('div', { class: 'tools' }, q);
  for (const [k, choices] of Object.entries(m.filters || {})) {
    const lbl = (m.fields || []).find(f => f.name === k)?.label || m.columns.find(c => c.key === k)?.label || k;
    const s = selectIn(choices.map(c => [c, k === 'active' ? (c ? 'Active' : 'Inactive') : String(c).replace(/_/g, ' ')]), st.f[k] ?? '', 'All ' + lbl.toLowerCase());
    s.style.width = 'auto';
    s.addEventListener('change', () => { st.f[k] = s.value; st.page = 1; save(); reload(); });
    ap(tools, s);
  }
  if (m.datecol) {
    const fr = inp('date', st.from, { 'aria-label': 'From date' }), to = inp('date', st.to, { 'aria-label': 'To date' });
    fr.style.width = to.style.width = 'auto';
    fr.onchange = () => { st.from = fr.value; st.page = 1; save(); reload(); };
    to.onchange = () => { st.to = to.value; st.page = 1; save(); reload(); };
    ap(tools, h('span', { class: 'muted' }, 'From'), fr, h('span', { class: 'muted' }, 'to'), to);
  }
  ap(tools, btn('Reset', () => { Object.assign(st, { q: '', f: {}, from: '', to: '', sort: '', dir: '', page: 1 }); st.sel.clear(); save(); route(); }, 'ghost'));
  const selBar = h('div'), body = h('div'), pager = h('div', { class: 'pager' });
  ap(page, tools, selBar, body, pager);
  const cols = m.columns.filter(c => !(c.sensitive && !can('manager')));
  async function reload() {
    const d = await api(`/api/list/${ent}?${qs()}`);
    clear(selBar);
    if (bulkable && st.sel.size) ap(selBar, h('div', { class: 'sel-bar' }, h('b', {}, `${st.sel.size} selected`),
      btn('Bulk edit…', () => bulkDlg(ent, [...st.sel], () => { st.sel.clear(); reload(); }), 'sm pri'),
      btn('Clear selection', () => { st.sel.clear(); reload(); }, 'sm ghost')));
    ap(clear(body), table(cols, d.rows, {
      href: r => rowHref(ent, r), sort: st.sort || m.sort, dir: st.dir || m.dir || 'asc',
      onSort: k => { if ((st.sort || m.sort) === k) st.dir = (st.dir || m.dir || 'asc') === 'asc' ? 'desc' : 'asc'; else { st.sort = k; st.dir = 'asc'; } save(); reload(); },
      check: bulkable, selected: st.sel,
      onCheck: (r, on) => { on ? st.sel.add(r.id) : st.sel.delete(r.id); reload(); },
      onCheckAll: on => { d.rows.forEach(r => on ? st.sel.add(r.id) : st.sel.delete(r.id)); reload(); },
      empty: st.q || Object.values(st.f).some(v => v !== '') ? 'No records match these filters.' : `No ${m.plural.toLowerCase()} yet.`,
    }));
    const pages = Math.max(1, Math.ceil(d.total / d.size));
    const sizeSel = selectIn([25, 50, 100, 250], st.size); sizeSel.style.width = 'auto';
    sizeSel.onchange = () => { st.size = +sizeSel.value; st.page = 1; save(); reload(); };
    ap(clear(pager), `${d.total.toLocaleString()} records`, sizeSel, 'per page',
      btn('‹ Prev', () => { st.page--; save(); reload(); }, 'sm', { disabled: st.page <= 1 }),
      `Page ${st.page} of ${pages}`,
      btn('Next ›', () => { st.page++; save(); reload(); }, 'sm', { disabled: st.page >= pages }));
  }
  await reload();
}

function bulkDlg(ent, ids, done) {
  const m = S.meta.entities[ent];
  const fields = m.fields.filter(f => m.bulk.includes(f.name));
  const fsel = selectIn(fields.map(f => [f.name, f.label]), fields[0].name);
  const opSel = selectIn([['set', 'Set to'], ['add', 'Add amount'], ['pct', 'Change by %']], 'set');
  const valBox = h('div');
  const render = () => {
    const f = fields.find(x => x.name === fsel.value);
    const numeric = ['int', 'float', 'money', 'cost'].includes(f.type);
    opSel.disabled = !numeric; if (!numeric) opSel.value = 'set';
    const op = opSel.value;
    const el = op !== 'set' ? numIn('', { min: null }) : buildForm([{ ...f, required: false, default: null }], {}, false).ctl[f.name];
    valBox.el = el; valBox.f = f;
    ap(clear(valBox), field(op === 'pct' ? 'Percent (e.g. 5 or -10)' : op === 'add' ? 'Amount (may be negative)' : 'New value', f.type === 'bool' ? h('label', { class: 'chk' }, el, 'Yes') : el));
  };
  fsel.onchange = render; opSel.onchange = render; render();
  dialog(`Bulk edit ${ids.length} ${m.plural.toLowerCase()}`, h('div', { class: 'form', style: 'grid-template-columns:1fr' }, field('Field', fsel), field('Operation', opSel), valBox,
    h('p', { class: 'muted' }, 'All changes are applied in one transaction and recorded in the audit log.')),
    [{
      label: 'Apply', cls: 'pri', run: async () => {
        const el = valBox.el; const v = valBox.f.type === 'bool' && opSel.value === 'set' ? (el.checked ? 1 : 0) : el.value;
        const r = await api(`/api/bulk/${ent}`, { ids, field: fsel.value, op: opSel.value, value: v });
        toast(`${r.updated} record(s) updated`); done();
      }
    }]);
}

function importDlg(ent, done) {
  const m = S.meta.entities[ent];
  const file = h('input', { type: 'file', accept: '.xlsx,.csv,.txt', class: 'in', style: 'height:auto;padding:6px' });
  const out = h('div');
  let payload = null;
  const read = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1] || ''); r.onerror = rej; r.readAsDataURL(f); });
  const report = r => {
    ap(clear(out), h('div', { class: 'msg ' + (r.errors.length ? 'err' : r.committed ? 'ok' : 'warn') },
      r.committed ? `Imported: ${r.created} created, ${r.updated} updated, ${r.unchanged} unchanged.` :
        r.errors.length ? `${r.errors.length} row(s) have errors. Nothing was imported.` : `Validation passed: ${r.created} to create, ${r.updated} to update, ${r.unchanged} unchanged. Click Import to commit.`),
      r.ignored_columns.length ? h('p', { class: 'muted' }, 'Ignored columns: ' + r.ignored_columns.join(', ')) : null,
      r.errors.length ? table([{ key: 'row', label: 'Row', type: 'int' }, { key: 'key', label: 'Key' }, { key: 'message', label: 'Problem' }], r.errors.slice(0, 200)) : null);
  };
  const dlg = dialog(`Import ${m.plural.toLowerCase()}`, h('div', {},
    h('p', { class: 'muted' }, `Upload .xlsx or .csv. Rows are matched on "${m.key}": existing records are updated (blank cells keep current values), new keys are created. The file is validated first and then committed in one transaction; a backup is taken before committing.`),
    h('p', {}, h('a', { href: '#', onclick: e => { e.preventDefault(); download(`/api/template/${ent}?format=xlsx`).catch(er => toast(er.message, true)); } }, 'Download template')),
    file, out), [
    { label: 'Validate', run: async () => { if (!file.files[0]) throw new Error('Choose a file.'); payload = { filename: file.files[0].name, data: await read(file.files[0]) }; report(await api(`/api/import/${ent}`, { ...payload, dry_run: true })); return false; } },
    { label: 'Import', cls: 'pri', run: async () => { if (!file.files[0]) throw new Error('Choose a file.'); payload = { filename: file.files[0].name, data: await read(file.files[0]) }; const r = await api(`/api/import/${ent}`, { ...payload, dry_run: false }); report(r); if (r.committed) { toast('Import complete'); done(); } return false; } }], { wide: true });
  return dlg;
}

/* ------------------------------------------------------------------ record router */
async function viewRecord(page, ent, id, rest) {
  const isNew = id === 'new';
  const views = { purchase_orders: viewPO, sales_orders: viewSO, production_orders: viewMO, boms: viewBOM, invoices: viewInvoice, bills: viewBill, shipments: viewShipment, receipts: viewReceipt };
  if (views[ent]) return views[ent](page, isNew ? null : +id);
  const m = S.meta.entities[ent];
  if (!m || m.txn) throw new Error('This record type has no detail view.');
  return viewMaster(page, ent, isNew ? null : +id);
}
function history(rec) {
  return flush('History', table([{ key: 'ts', label: 'When', type: 'datetime' }, { key: 'username', label: 'User' }, { key: 'action', label: 'Action', type: 'tag' }, { key: 'summary', label: 'Detail' }], rec.history || [], { empty: 'No changes recorded.' }));
}
const docBtn = (doc, id, label) => btn(label, () => window.open(`/doc/${doc}/${id}`, '_blank', 'noopener'));
const act = async (name, body, msg) => { const r = await api('/api/action/' + name, body); if (msg) toast(msg); return r; };

/* ------------------------------------------------------------------ masters */
async function viewMaster(page, ent, id) {
  const m = S.meta.entities[ent];
  const rec = id ? await api(`/api/record/${ent}/${id}`) : {};
  const editable = can(m.role || 'clerk');
  const form = buildForm(m.fields, rec, !editable);
  let pw = null;
  if (ent === 'users' && !id) { pw = inp('password', '', { autocomplete: 'new-password' }); ap(form, field('Initial password (8+ characters)', pw, { req: true })); }
  const title = id ? (rec[m.key] + (rec.name ? ' — ' + rec.name : rec.full_name ? ' — ' + rec.full_name : '')) : 'New ' + m.label.toLowerCase();
  const save = async () => {
    const body = { ...form.values(), id };
    if (pw) body.password = pw.value;
    const r = await api(`/api/save/${ent}`, body);
    toast(`${m.label} saved`);
    if (!id) go(`#/rec/${ent}/${r.id}`); else route();
  };
  const acts = [];
  if (editable) acts.push(btn('Save', save, 'pri'));
  if (id && can(m.role === 'admin' ? 'admin' : 'manager')) acts.push(btn('Delete', () => confirmDlg(`Delete ${m.label.toLowerCase()}`, `Delete ${rec[m.key]}? Records with history cannot be deleted — deactivate them instead.`, 'Delete',
    async () => { await api(`/api/delete/${ent}/${id}`, {}); toast('Deleted'); go('#/list/' + ent); }), 'danger'));
  if (ent === 'users' && id && can('admin')) acts.push(btn('Reset password', () => passwordDlg(id, rec.username)));
  if (ent === 'customers' && id) { acts.push(docBtn('statement', id, 'Statement')); if (can('clerk')) acts.push(btn('New sales order', () => { S.prefill = { customer_id: id }; go('#/rec/sales_orders/new'); })); }
  if (ent === 'suppliers' && id && can('clerk')) acts.push(btn('New purchase order', () => { S.prefill = { supplier_id: id }; go('#/rec/purchase_orders/new'); }));
  if (ent === 'items' && id && rec.type !== 'service') {
    if (can('manager')) acts.push(btn('Adjust / count', () => adjustDlg(rec)));
    if (can('clerk') && S.meta.locations.length > 1) acts.push(btn('Transfer', () => transferDlg(rec)));
  }
  form.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && editable) busy(save)(); });
  ap(page, pageHead(title, id && rec.active === 0 ? 'Inactive' : null, acts, crumbTo(ent)));
  const main = [panel('Details', form)];
  if (id) main.push(...relatedFor(ent, rec));
  ap(page, h('div', { class: 'stack' }, main, id ? history(rec) : null));
}

function relatedFor(ent, r) {
  const out = [];
  if (ent === 'items') {
    out.push(h('div', { class: 'cols' },
      panel('Availability', h('dl', { class: 'kv' }, h('dt', {}, 'On hand'), h('dd', {}, qty(r.on_hand) + ' ' + r.uom), h('dt', {}, 'Committed to orders'), h('dd', {}, qty(r.committed)),
        h('dt', {}, 'On order (POs)'), h('dd', {}, qty(r.on_order)), h('dt', {}, 'Average cost'), h('dd', {}, S.cur + nfc.format(r.avg_cost)), h('dt', {}, 'Stock value'), h('dd', {}, money(r.stock_value)))),
      flush('Stock by location', table([{ key: 'location_code', label: 'Location' }, { key: 'qty', label: 'On hand', type: 'qty' }, { key: 'value', label: 'Value', type: 'money' }], r.stock, { empty: 'No stock.' }))));
    if (r.boms.length || ['finished', 'component'].includes(r.type)) out.push(flush('Bills of materials', table([{ key: 'version', label: 'Rev' }, { key: 'component_count', label: 'Components', type: 'int' }, { key: 'rolled_cost', label: 'Rolled cost', type: 'cost' }, { key: 'active', label: 'Active', type: 'bool' }], r.boms, { href: b => `#/rec/boms/${b.id}`, empty: 'No BOM defined.' }),
      can('manager') ? btn('New BOM', () => { S.prefill = { item_id: r.id }; go('#/rec/boms/new'); }, 'sm') : null));
    if (r.used_in.length) out.push(flush('Used in', table([{ key: 'sku', label: 'Parent' }, { key: 'name', label: 'Item' }, { key: 'version', label: 'Rev' }, { key: 'qty_per', label: 'Qty per', type: 'qty' }], r.used_in, { href: b => `#/rec/boms/${b.id}` })));
    out.push(flush('Recent inventory transactions', table([{ key: 'ts', label: 'Time', type: 'datetime' }, { key: 'location_code', label: 'Loc' }, { key: 'type', label: 'Type', type: 'tag' }, { key: 'qty', label: 'Qty', type: 'qty' }, { key: 'unit_cost', label: 'Unit cost', type: 'cost' }, { key: 'balance_after', label: 'Balance', type: 'qty' }, { key: 'note', label: 'Reference' }, { key: 'username', label: 'User' }], r.txns, { empty: 'No transactions.' })));
  }
  if (ent === 'customers') {
    const cr = r.credit, avail = cr.limit ? cr.limit - cr.open_ar - cr.open_orders : null;
    out.push(panel('Credit', h('dl', { class: 'kv' }, h('dt', {}, 'Credit limit'), h('dd', {}, cr.limit ? money(cr.limit) : 'Unlimited'), h('dt', {}, 'Open receivables'), h('dd', {}, money(cr.open_ar)),
      h('dt', {}, 'Open orders'), h('dd', {}, money(cr.open_orders)), h('dt', {}, 'Available'), h('dd', { class: avail != null && avail < 0 ? 'neg' : '' }, avail == null ? '—' : money(avail)))));
    out.push(flush('Sales orders', table(S.meta.entities.sales_orders.columns.filter(c => c.key !== 'customer_name'), r.orders, { href: x => `#/rec/sales_orders/${x.id}` })));
    out.push(flush('Invoices', table(S.meta.entities.invoices.columns.filter(c => c.key !== 'customer_name'), r.invoices, { href: x => `#/rec/invoices/${x.id}` })));
  }
  if (ent === 'suppliers') {
    out.push(flush('Purchase orders', table(S.meta.entities.purchase_orders.columns.filter(c => c.key !== 'supplier_name'), r.orders, { href: x => `#/rec/purchase_orders/${x.id}` })));
    out.push(flush('Bills', table(S.meta.entities.bills.columns.filter(c => c.key !== 'supplier_name'), r.bills, { href: x => `#/rec/bills/${x.id}` })));
    out.push(flush('Items supplied', table([{ key: 'sku', label: 'SKU' }, { key: 'name', label: 'Item' }, { key: 'avg_cost', label: 'Avg cost', type: 'cost' }], r.items, { href: x => `#/rec/items/${x.id}` })));
  }
  if (ent === 'employees') {
    out.push(h('div', { class: 'cols' }, flush('Direct reports', table([{ key: 'code', label: 'Emp #' }, { key: 'full_name', label: 'Name' }, { key: 'title', label: 'Title' }], r.reports, { href: x => `#/rec/employees/${x.id}`, empty: 'None' })),
      flush('Assigned assets', table([{ key: 'tag', label: 'Tag' }, { key: 'name', label: 'Asset' }, { key: 'status', label: 'Status', type: 'tag' }], r.assets, { href: x => `#/rec/assets/${x.id}`, empty: 'None' }))));
  }
  if (ent === 'assets') {
    out.push(panel('Depreciation', h('dl', { class: 'kv' }, h('dt', {}, 'Cost'), h('dd', {}, money(r.cost)), h('dt', {}, 'Book value today'), h('dd', {}, money(r.book_value)),
      h('dt', {}, 'Accumulated'), h('dd', {}, money(r.cost - r.book_value)), h('dt', {}, 'Method'), h('dd', {}, `Straight-line over ${r.useful_life_months} months to ${money(r.salvage_value)} salvage`))));
    out.push(flush('Service & event log', table([{ key: 'date', label: 'Date', type: 'date' }, { key: 'type', label: 'Type', type: 'tag' }, { key: 'description', label: 'Description' }, { key: 'cost', label: 'Cost', type: 'money' }, { key: 'username', label: 'By' }], r.events, { empty: 'No events.' }),
      can('clerk') ? btn('Log event', () => assetEventDlg(r), 'sm') : null));
  }
  return out;
}

function adjustDlg(item) {
  const loc = locationSel(), mode = selectIn([['count', 'Set to counted quantity'], ['delta', 'Adjust by quantity (+/-)']], 'count');
  const q = numIn('', { min: null }), reason = inp('text', ''), cost = numIn(''), dt = inp('date', todayISO());
  dialog(`Adjust stock — ${item.sku}`, h('div', { class: 'form' }, field('Location', loc), field('Method', mode), field('Quantity', q, { req: true }), field('Date', dt),
    field('Unit cost for increases (blank = average)', cost), field('Reason', reason, { req: true, wide: true })), [{
      label: 'Post adjustment', cls: 'pri', run: async () => {
        const r = await act('inv_adjust', { item_id: item.id, location_id: loc.value, [mode.value === 'count' ? 'counted' : 'qty']: q.value, reason: reason.value, unit_cost: cost.value, date: dt.value });
        toast(r.delta ? `Adjusted by ${qty(r.delta)}` : 'No change — count matches'); route();
      }
    }]);
}
function transferDlg(item) {
  const fr = locationSel(), to = locationSel(S.meta.locations[1]?.id), q = numIn(''), note = inp('text', ''), dt = inp('date', todayISO());
  dialog(`Transfer — ${item.sku}`, h('div', { class: 'form' }, field('From', fr), field('To', to), field('Quantity', q, { req: true }), field('Date', dt), field('Note', note, { wide: true })),
    [{ label: 'Transfer', cls: 'pri', run: async () => { await act('inv_transfer', { item_id: item.id, from_location_id: fr.value, to_location_id: to.value, qty: q.value, note: note.value, date: dt.value }, 'Transfer posted'); route(); } }]);
}
function assetEventDlg(a) {
  const t = selectIn(['maintenance', 'repair', 'inspection', 'transfer', 'assignment', 'status', 'note'], 'maintenance');
  const d = inp('date', todayISO()), desc = inp('text', ''), cost = numIn(0), st = selectIn(['in_service', 'maintenance', 'retired', 'disposed'], '', 'Unchanged');
  dialog(`Log event — ${a.tag}`, h('div', { class: 'form' }, field('Type', t), field('Date', d), field('Cost', cost), field('Set status', st), field('Description', desc, { wide: true })),
    [{ label: 'Save', cls: 'pri', run: async () => { await act('asset_event', { id: a.id, type: t.value, date: d.value, description: desc.value, cost: cost.value, status: st.value }, 'Event logged'); route(); } }]);
}

/* ------------------------------------------------------------------ line editor */
function lineEditor({ itemKey, entity = 'items', cols, rows, onItem, total }) {
  const tbody = h('tbody'), foot = h('td', { class: 'num' });
  const state = [];
  const recalc = () => { if (total) foot.textContent = money(state.reduce((s, r) => s + total(r.vals()), 0)); state.forEach(r => r.refresh()); };
  const addRow = (data = {}) => {
    const ctrls = {};
    const lk = lookup(entity, data[itemKey], { placeholder: 'Find item…', onPick: it => { onItem?.(it, ctrls); recalc(); } });
    const tr = h('tr', {}, h('td', { class: 'edit', style: 'min-width:260px' }, lk));
    for (const c of cols) {
      if (c.calc) { ctrls[c.key] = h('td', { class: 'num' }); ap(tr, ctrls[c.key]); continue; }
      const el = numIn(data[c.key] ?? c.default ?? '', { 'aria-label': c.label, style: 'width:110px' });
      el.addEventListener('input', recalc); ctrls[c.key] = el;
      ap(tr, h('td', { class: 'edit' }, el));
    }
    const row = {
      vals: () => { const o = { [itemKey]: lk.value }; for (const c of cols) if (!c.calc) o[c.key] = ctrls[c.key].value; return o; },
      refresh: () => { for (const c of cols) if (c.calc) ctrls[c.key].textContent = c.calc(row.vals()); }
    };
    ap(tr, h('td', { class: 'edit' }, btn('✕', () => { tr.remove(); state.splice(state.indexOf(row), 1); recalc(); }, 'ghost sm', { 'aria-label': 'Remove line', title: 'Remove line' })));
    state.push(row); ap(tbody, tr); recalc();
    return lk;
  };
  (rows.length ? rows : [{}]).forEach(r => addRow(r));
  const el = h('div', {}, h('div', { class: 'tw' }, h('table', { class: 't' },
    h('thead', {}, h('tr', {}, h('th', {}, 'Item'), cols.map(c => h('th', { class: 'num' }, c.label)), h('th'))), tbody,
    total ? h('tfoot', {}, h('tr', {}, h('td', { colspan: cols.length }, 'Total'), foot, h('td'))) : null)),
    h('div', { style: 'margin-top:8px' }, btn('+ Add line', () => addRow().focus(), 'sm')));
  el.get = () => state.map(r => r.vals()).filter(v => v[itemKey]);
  return el;
}

/* ------------------------------------------------------------------ purchase orders */
async function viewPO(page, id) {
  const po = id ? await api(`/api/record/purchase_orders/${id}`) : { status: 'draft', lines: [], order_date: todayISO(), ...(S.prefill || {}) };
  S.prefill = null;
  const draft = po.status === 'draft' && can('clerk');
  const sup = lookup('suppliers', po.supplier_id, { disabled: !draft });
  const od = inp('date', po.order_date, { disabled: !draft }), ed = inp('date', po.expected_date || '', { disabled: !draft });
  const loc = locationSel(po.location_id); loc.disabled = !draft;
  const notes = h('textarea', { class: 'in', disabled: !draft }, po.notes || '');
  const head = h('div', { class: 'form' }, field('Supplier', sup, { req: true }), field('Order date', od), field('Expected (blank = lead time)', ed), field('Receive into', loc), field('Notes', notes, { wide: true }));
  let lines;
  const amt = r => (+r.qty || 0) * (+r.unit_cost || 0);
  if (draft) lines = lineEditor({ itemKey: 'item_id', rows: po.lines, cols: [{ key: 'qty', label: 'Qty' }, { key: 'unit_cost', label: 'Unit cost' }, { key: 'amount', label: 'Amount', calc: r => money(amt(r)) }], total: amt, onItem: (it, c) => { if (!c.unit_cost.value) c.unit_cost.value = it.avg_cost || it.std_cost || ''; if (!c.qty.value) c.qty.value = 1; } });
  else lines = table([{ key: 'sku', label: 'SKU' }, { key: 'name', label: 'Item' }, { key: 'qty', label: 'Ordered', type: 'qty' }, { key: 'qty_received', label: 'Received', type: 'qty' }, { key: 'qty_billed', label: 'Billed', type: 'qty' }, { key: 'uom', label: 'UoM' }, { key: 'unit_cost', label: 'Unit cost', type: 'cost' }, { key: 'amount', label: 'Amount', type: 'money' }], po.lines, { totals: { amount: po.total }, href: l => `#/rec/items/${l.item_id}` });
  const save = async () => {
    const r = await act('po_save', { id, supplier_id: sup.value, order_date: od.value, expected_date: ed.value, location_id: loc.value, notes: notes.value, lines: lines.get() }, 'Purchase order saved');
    if (!id) go(`#/rec/purchase_orders/${r.id}`); else route(); return r;
  };
  const acts = [];
  if (draft) acts.push(btn('Save', save, 'pri'));
  if (id && po.status === 'draft' && can('clerk')) acts.push(btn('Approve', async () => { await act('po_save', { id, supplier_id: sup.value, order_date: od.value, expected_date: ed.value, location_id: loc.value, notes: notes.value, lines: lines.get() }); await act('po_approve', { id }, 'Approved'); route(); }));
  if (['approved', 'partial'].includes(po.status) && can('clerk')) acts.push(btn('Receive…', () => receiveDlg(po), 'pri'));
  if (id && po.lines.some(l => l.qty_received - l.qty_billed > 1e-9) && !['draft', 'cancelled'].includes(po.status) && can('clerk')) acts.push(btn('Enter bill…', () => billDlg(po)));
  if (['approved', 'partial'].includes(po.status) && can('manager') && po.receipts.length) acts.push(btn('Short-close', () => confirmDlg('Short-close order', 'Close this order? Remaining quantities will no longer be expected.', 'Close order', async () => { await act('po_close', { id }, 'Closed'); route(); }, 'pri')));
  if (id && ['draft', 'approved'].includes(po.status) && !po.receipts.length && can('manager')) acts.push(btn('Cancel order', () => confirmDlg('Cancel purchase order', `Cancel ${po.number}?`, 'Cancel order', async () => { await act('po_cancel', { id }, 'Cancelled'); route(); }), 'danger'));
  if (id) acts.push(docBtn('purchase_order', id, 'Print'));
  ap(page, pageHead(id ? po.number : 'New purchase order', id ? [tag(po.status), ' ', po.supplier_name, po.approved_by ? ` · approved by ${po.approved_by}` : ''] : null, acts, crumbTo('purchase_orders')),
    h('div', { class: 'stack' }, panel('Order', head), panel('Lines', lines),
      id ? h('div', { class: 'cols' },
        flush('Receipts', table([{ key: 'number', label: 'Receipt #' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'location_code', label: 'Loc' }, { key: 'value', label: 'Value', type: 'money' }], po.receipts, { href: r => `#/rec/receipts/${r.id}`, empty: 'Nothing received yet.' })),
        flush('Bills', table([{ key: 'number', label: 'Bill #' }, { key: 'supplier_ref', label: 'Supplier ref' }, { key: 'total', label: 'Total', type: 'money' }, { key: 'balance', label: 'Balance', type: 'money' }, { key: 'status', label: 'Status', type: 'tag' }], po.bills, { href: r => `#/rec/bills/${r.id}`, empty: 'Not billed.' }))) : null,
      id ? history(po) : null));
}
function receiveDlg(po) {
  const tol = S.meta.values.over_receipt_tolerance_pct;
  const ctl = po.lines.map(l => ({ l, el: numIn(Math.max(0, +(l.qty - l.qty_received).toFixed(4)), { style: 'width:110px' }) }));
  const dt = inp('date', todayISO()), loc = locationSel(po.location_id), notes = inp('text', '');
  dialog(`Receive ${po.number}`, h('div', {}, h('div', { class: 'form' }, field('Receipt date', dt), field('Location', loc), field('Notes / packing slip #', notes)), h('br'),
    table([{ key: 'sku', label: 'SKU' }, { key: 'name', label: 'Item' }, { key: 'qty', label: 'Ordered', type: 'qty' }, { key: 'qty_received', label: 'Received', type: 'qty' }, { key: 'x', label: 'Receive now', render: r => ctl.find(c => c.l.id === r.id).el }], po.lines),
    h('p', { class: 'muted' }, `Over-receipt tolerance: ${tol}%. Inventory and average cost update immediately.`)), [{
      label: 'Post receipt', cls: 'pri', run: async () => {
        const r = await act('po_receive', { id: po.id, date: dt.value, location_id: loc.value, notes: notes.value, lines: ctl.map(c => ({ po_line_id: c.l.id, qty: c.el.value })) }, 'Receipt posted');
        route(); return r;
      }
    }], { wide: true });
}
function billDlg(po) {
  const ref = inp('text', ''), dt = inp('date', todayISO()), tax = numIn(0);
  const billable = po.lines.reduce((s, l) => s + Math.max(0, l.qty_received - l.qty_billed) * l.unit_cost, 0);
  dialog(`Enter supplier bill — ${po.number}`, h('div', {}, h('p', { class: 'muted' }, `Three-way match: the bill covers received but unbilled quantity, ${money(billable)}.`),
    h('div', { class: 'form' }, field("Supplier's invoice #", ref), field('Bill date', dt), field('Tax / freight', tax))),
    [{ label: 'Create bill', cls: 'pri', run: async () => { const r = await act('bill_create', { po_id: po.id, supplier_ref: ref.value, date: dt.value, tax: tax.value }, 'Bill created'); go(`#/rec/bills/${r.id}`); } }]);
}

/* ------------------------------------------------------------------ sales orders */
async function viewSO(page, id) {
  const so = id ? await api(`/api/record/sales_orders/${id}`) : { status: 'draft', lines: [], order_date: todayISO(), ...(S.prefill || {}) };
  S.prefill = null;
  const draft = so.status === 'draft' && can('clerk');
  const credit = h('div');
  const showCredit = async cid => {
    clear(credit); if (!cid) return;
    const c = await api(`/api/record/customers/${cid}`); const cr = c.credit;
    ap(credit, h('div', { class: 'msg ' + (cr.limit && cr.open_ar + cr.open_orders > cr.limit * 0.9 ? 'warn' : 'ok') },
      `Terms net ${c.terms_days} · credit limit ${cr.limit ? money(cr.limit) : 'unlimited'} · open AR ${money(cr.open_ar)} · open orders ${money(cr.open_orders)}${c.tax_exempt ? ' · tax exempt' : ''}`));
  };
  const cus = lookup('customers', so.customer_id, { disabled: !draft, onPick: it => showCredit(it.id) });
  const od = inp('date', so.order_date, { disabled: !draft }), sb = inp('date', so.ship_by || '', { disabled: !draft }), cpo = inp('text', so.customer_po || '', { disabled: !draft });
  const loc = locationSel(so.location_id); loc.disabled = !draft;
  const rate = numIn(so.id ? +(so.tax_rate * 100).toFixed(4) : '', { disabled: !draft, placeholder: `default ${(S.meta.values.default_tax_rate * 100).toFixed(2)}` });
  const notes = h('textarea', { class: 'in', disabled: !draft }, so.notes || '');
  if (so.customer_id) showCredit(so.customer_id);
  const head = h('div', {}, credit, h('div', { class: 'form' }, field('Customer', cus, { req: true }), field('Order date', od), field('Ship by', sb), field('Customer PO', cpo), field('Ship from', loc), field('Tax rate %', rate), field('Notes', notes, { wide: true })));
  const amt = r => (+r.qty || 0) * (+r.unit_price || 0) * (1 - (+r.discount_pct || 0) / 100);
  let lines;
  if (draft) lines = lineEditor({ itemKey: 'item_id', rows: so.lines, cols: [{ key: 'qty', label: 'Qty' }, { key: 'unit_price', label: 'Unit price' }, { key: 'discount_pct', label: 'Disc %', default: 0 }, { key: 'amount', label: 'Amount', calc: r => money(amt(r)) }], total: amt, onItem: (it, c) => { c.unit_price.value = it.price; if (!c.qty.value) c.qty.value = 1; } });
  else lines = table([{ key: 'sku', label: 'SKU' }, { key: 'name', label: 'Item' }, { key: 'qty', label: 'Ordered', type: 'qty' }, { key: 'qty_shipped', label: 'Shipped', type: 'qty' }, { key: 'qty_invoiced', label: 'Invoiced', type: 'qty' }, { key: 'available', label: 'Available', type: 'qty', render: l => l.item_type === 'service' ? h('span', { class: 'faint' }, 'service') : h('span', { class: l.available < l.qty - l.qty_shipped ? 'neg' : '' }, qty(l.available)) }, { key: 'unit_price', label: 'Price', type: 'cost' }, { key: 'discount_pct', label: 'Disc %', type: 'pct' }, { key: 'amount', label: 'Amount', type: 'money' }], so.lines, { totals: { amount: so.subtotal }, href: l => `#/rec/items/${l.item_id}` });
  const body = () => ({ id, customer_id: cus.value, order_date: od.value, ship_by: sb.value, customer_po: cpo.value, location_id: loc.value, tax_rate: rate.value === '' ? '' : rate.value / 100, notes: notes.value, lines: lines.get() });
  const acts = [];
  if (draft) acts.push(btn('Save', async () => { const r = await act('so_save', body(), 'Sales order saved'); if (!id) go(`#/rec/sales_orders/${r.id}`); else route(); }, 'pri'));
  if (id && so.status === 'draft' && can('clerk')) acts.push(btn('Confirm', async () => {
    await act('so_save', body());
    try { await act('so_confirm', { id }, 'Order confirmed'); route(); }
    catch (e) {
      if (/Credit limit/.test(e.message) && can('manager')) confirmDlg('Credit limit exceeded', e.message + ' Override and confirm anyway? The override is recorded in the audit log.', 'Override & confirm', async () => { await act('so_confirm', { id, override_credit: true }, 'Confirmed with credit override'); route(); });
      else throw e;
    }
  }));
  if (['confirmed', 'partial'].includes(so.status) && can('clerk')) acts.push(btn('Ship…', () => shipDlg(so), 'pri'));
  if (['confirmed', 'partial', 'shipped'].includes(so.status) && can('manager') && so.shipments.length) acts.push(btn('Close order', () => confirmDlg('Close sales order', 'Close this order? Any unshipped quantity is cancelled.', 'Close order', async () => { await act('so_close', { id }, 'Closed'); route(); }, 'pri')));
  if (id && ['draft', 'confirmed'].includes(so.status) && !so.shipments.length && can('manager')) acts.push(btn('Cancel order', () => confirmDlg('Cancel sales order', `Cancel ${so.number}?`, 'Cancel order', async () => { await act('so_cancel', { id }, 'Cancelled'); route(); }), 'danger'));
  const totals = id ? panel(null, h('dl', { class: 'kv', style: 'max-width:320px;margin-left:auto' }, h('dt', {}, 'Subtotal'), h('dd', { class: 'num' }, money(so.subtotal)), h('dt', {}, `Tax (${(so.tax_rate * 100).toFixed(2)}%)`), h('dd', { class: 'num' }, money(so.tax)), h('dt', {}, h('b', {}, 'Total')), h('dd', { class: 'num' }, h('b', {}, money(so.total))))) : null;
  ap(page, pageHead(id ? so.number : 'New sales order', id ? [tag(so.status), ' ', so.customer_name, so.customer_po ? ` · PO ${so.customer_po}` : ''] : null, acts, crumbTo('sales_orders')),
    h('div', { class: 'stack' }, panel('Order', head), panel('Lines', lines), totals,
      id ? h('div', { class: 'cols' },
        flush('Shipments', table([{ key: 'number', label: 'Shipment #' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'carrier', label: 'Carrier' }, { key: 'invoice_number', label: 'Invoice', render: s => s.invoice_number || (can('clerk') ? btn('Invoice', () => invoiceDlg(s)) : '') }], so.shipments, { href: s => `#/rec/shipments/${s.id}`, empty: 'Not shipped yet.' })),
        flush('Invoices', table([{ key: 'number', label: 'Invoice #' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'total', label: 'Total', type: 'money' }, { key: 'balance', label: 'Balance', type: 'money' }, { key: 'status', label: 'Status', type: 'tag' }], so.invoices, { href: v => `#/rec/invoices/${v.id}`, empty: 'Not invoiced.' }))) : null,
      id ? history(so) : null));
}
function shipDlg(so) {
  const open = so.lines.filter(l => l.qty - l.qty_shipped > 1e-9);
  const ctl = open.map(l => ({ l, el: numIn(Math.max(0, +Math.min(l.qty - l.qty_shipped, l.item_type === 'service' ? Infinity : l.available).toFixed(4)), { style: 'width:110px' }) }));
  const dt = inp('date', todayISO()), carrier = inp('text', ''), track = inp('text', ''), loc = locationSel(so.location_id);
  const auto = S.meta.values.auto_invoice_on_ship;
  dialog(`Ship ${so.number}`, h('div', {}, h('div', { class: 'form' }, field('Ship date', dt), field('Ship from', loc), field('Carrier', carrier), field('Tracking #', track)), h('br'),
    table([{ key: 'sku', label: 'SKU' }, { key: 'name', label: 'Item' }, { key: 'qty', label: 'Ordered', type: 'qty' }, { key: 'qty_shipped', label: 'Shipped', type: 'qty' }, { key: 'available', label: 'Available', type: 'qty' }, { key: 'x', label: 'Ship now', render: r => ctl.find(c => c.l.id === r.id).el }], open),
    h('p', { class: 'muted' }, auto ? 'An invoice will be created automatically.' : 'Quantities default to what is available at the ship-from location.')), [{
      label: 'Post shipment', cls: 'pri', run: async () => {
        const r = await act('so_ship', { id: so.id, date: dt.value, location_id: loc.value, carrier: carrier.value, tracking: track.value, lines: ctl.map(c => ({ so_line_id: c.l.id, qty: c.el.value })) }, 'Shipment posted');
        go(`#/rec/shipments/${r.id}`);
      }
    }], { wide: true });
}
function invoiceDlg(sh) {
  const dt = inp('date', todayISO());
  dialog(`Invoice shipment ${sh.number}`, h('div', { class: 'form' }, field('Invoice date', dt)),
    [{ label: 'Create invoice', cls: 'pri', run: async () => { const r = await act('invoice_create', { shipment_id: sh.id, date: dt.value }, 'Invoice created'); go(`#/rec/invoices/${r.id}`); } }]);
}

/* ------------------------------------------------------------------ shipments, receipts, invoices, bills */
async function viewShipment(page, id) {
  const s = await api(`/api/record/shipments/${id}`);
  const acts = [docBtn('packing_slip', id, 'Packing slip')];
  if (!s.invoice && can('clerk')) acts.unshift(btn('Create invoice…', () => invoiceDlg(s), 'pri'));
  ap(page, pageHead(s.number, [`Shipment for `, h('a', { href: `#/rec/sales_orders/${s.so_id}` }, s.so_number), ` · ${s.customer_name} · ${s.date}`], acts, crumbTo('shipments')),
    h('div', { class: 'stack' }, panel('Details', h('dl', { class: 'kv' }, h('dt', {}, 'Carrier'), h('dd', {}, s.carrier || '—'), h('dt', {}, 'Tracking'), h('dd', {}, s.tracking || '—'), h('dt', {}, 'From'), h('dd', {}, s.location_code),
      h('dt', {}, 'Invoice'), h('dd', {}, s.invoice ? h('a', { href: `#/rec/invoices/${s.invoice.id}` }, s.invoice.number) : 'Not invoiced'), h('dt', {}, 'Cost of goods'), h('dd', {}, money(s.cost_value)))),
      flush('Lines', table([{ key: 'sku', label: 'SKU' }, { key: 'name', label: 'Item' }, { key: 'qty', label: 'Shipped', type: 'qty' }, { key: 'uom', label: 'UoM' }, { key: 'unit_cost', label: 'Unit cost', type: 'cost' }], s.lines)), history(s)));
}
async function viewReceipt(page, id) {
  const r = await api(`/api/record/receipts/${id}`);
  ap(page, pageHead(r.number, ['Receipt against ', h('a', { href: `#/rec/purchase_orders/${r.po_id}` }, r.po_number), ` · ${r.supplier_name} · ${r.date}`], [docBtn('receiving_report', id, 'Receiving report')], crumbTo('receipts')),
    h('div', { class: 'stack' }, flush('Lines', table([{ key: 'sku', label: 'SKU' }, { key: 'name', label: 'Item' }, { key: 'qty', label: 'Received', type: 'qty' }, { key: 'uom', label: 'UoM' }, { key: 'unit_cost', label: 'Unit cost', type: 'cost' }], r.lines, { totals: { unit_cost: null } })), history(r)));
}
async function viewInvoice(page, id) {
  const v = await api(`/api/record/invoices/${id}`);
  const acts = [];
  if (['open', 'partial'].includes(v.status) && can('clerk')) acts.push(btn('Record payment…', () => payDlg('invoice_pay', v, 'Check'), 'pri'));
  if (v.status !== 'void' && !v.payments.length && can('manager')) acts.push(btn('Void', () => confirmDlg('Void invoice', `Void ${v.number}? The shipment becomes un-invoiced and can be invoiced again.`, 'Void invoice', async () => { await act('invoice_void', { id }, 'Invoice voided'); route(); }), 'danger'));
  acts.push(docBtn('invoice', id, 'Print'));
  ap(page, pageHead(v.number, [tag(v.status), ' ', h('a', { href: `#/rec/customers/${v.customer_id}` }, v.customer_name), ' · order ', h('a', { href: `#/rec/sales_orders/${v.so_id}` }, v.so_number), v.days_overdue ? h('span', { class: 'neg' }, ` · ${v.days_overdue} days overdue`) : ''], acts, crumbTo('invoices')),
    h('div', { class: 'stack' }, h('div', { class: 'cols' },
      panel('Summary', h('dl', { class: 'kv' }, h('dt', {}, 'Invoice date'), h('dd', {}, v.date), h('dt', {}, 'Due'), h('dd', {}, v.due_date), h('dt', {}, 'Subtotal'), h('dd', {}, money(v.subtotal)), h('dt', {}, 'Tax'), h('dd', {}, money(v.tax)),
        h('dt', {}, 'Total'), h('dd', {}, h('b', {}, money(v.total))), h('dt', {}, 'Paid'), h('dd', {}, money(v.amount_paid)), h('dt', {}, 'Balance'), h('dd', {}, h('b', {}, money(v.balance))))),
      flush('Payments', table([{ key: 'number', label: 'Payment #' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'method', label: 'Method' }, { key: 'reference', label: 'Ref' }, { key: 'amount', label: 'Amount', type: 'money' }], v.payments, { empty: 'No payments.' }))),
      flush('Lines', table([{ key: 'description', label: 'Description' }, { key: 'qty', label: 'Qty', type: 'qty' }, { key: 'unit_price', label: 'Unit price', type: 'cost' }, { key: 'amount', label: 'Amount', type: 'money' }], v.lines, { totals: { amount: v.subtotal } })), history(v)));
}
async function viewBill(page, id) {
  const b = await api(`/api/record/bills/${id}`);
  const acts = [];
  if (['open', 'partial'].includes(b.status) && can('clerk')) acts.push(btn('Pay…', () => payDlg('bill_pay', b, 'ACH'), 'pri'));
  if (b.status !== 'void' && !b.payments.length && can('manager')) acts.push(btn('Void', () => confirmDlg('Void bill', `Void ${b.number}? Quantities return to unbilled on the PO.`, 'Void bill', async () => { await act('bill_void', { id }, 'Bill voided'); route(); }), 'danger'));
  ap(page, pageHead(b.number, [tag(b.status), ' ', b.supplier_name, b.supplier_ref ? ` · ref ${b.supplier_ref}` : '', b.po_id ? [' · ', h('a', { href: `#/rec/purchase_orders/${b.po_id}` }, b.po_number)] : ''], acts, crumbTo('bills')),
    h('div', { class: 'stack' }, h('div', { class: 'cols' },
      panel('Summary', h('dl', { class: 'kv' }, h('dt', {}, 'Bill date'), h('dd', {}, b.date), h('dt', {}, 'Due'), h('dd', {}, b.due_date), h('dt', {}, 'Subtotal'), h('dd', {}, money(b.subtotal)), h('dt', {}, 'Tax / freight'), h('dd', {}, money(b.tax)),
        h('dt', {}, 'Total'), h('dd', {}, h('b', {}, money(b.total))), h('dt', {}, 'Balance'), h('dd', {}, h('b', {}, money(b.balance))))),
      flush('Payments', table([{ key: 'number', label: 'Payment #' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'method', label: 'Method' }, { key: 'reference', label: 'Ref' }, { key: 'amount', label: 'Amount', type: 'money' }], b.payments, { empty: 'No payments.' }))),
      flush('Lines', table([{ key: 'sku', label: 'SKU' }, { key: 'name', label: 'Item' }, { key: 'qty', label: 'Qty', type: 'qty' }, { key: 'unit_cost', label: 'Unit cost', type: 'cost' }, { key: 'amount', label: 'Amount', type: 'money' }], b.lines, { totals: { amount: b.subtotal } })), history(b)));
}
function payDlg(action, doc, method) {
  const amt = numIn(doc.balance), dt = inp('date', todayISO()), m = selectIn(['Check', 'ACH', 'Wire', 'Card', 'Cash'], method), ref = inp('text', '');
  dialog(`Payment — ${doc.number}`, h('div', { class: 'form' }, field(`Amount (balance ${money(doc.balance)})`, amt, { req: true }), field('Date', dt), field('Method', m), field('Reference', ref)),
    [{ label: 'Record payment', cls: 'pri', run: async () => { await act(action, { id: doc.id, amount: amt.value, date: dt.value, method: m.value, reference: ref.value }, 'Payment recorded'); route(); } }]);
}

/* ------------------------------------------------------------------ manufacturing */
async function viewMO(page, id) {
  const mo = id ? await api(`/api/record/production_orders/${id}`) : { status: 'planned', start_date: todayISO(), qty: 1, ...(S.prefill || {}) };
  S.prefill = null;
  const ed = mo.status === 'planned' && can('clerk');
  const bomSel = selectIn([], '');
  const loadBoms = async itemId => {
    clear(bomSel); if (!itemId) return;
    const it = await api(`/api/record/items/${itemId}`);
    it.boms.forEach(b => ap(bomSel, h('option', { value: b.id, selected: mo.bom_id ? b.id === mo.bom_id : !!b.active }, `Rev ${b.version}${b.active ? ' (active)' : ''} — ${S.cur}${nfc.format(b.rolled_cost)}/unit`)));
    if (!it.boms.length) ap(bomSel, h('option', { value: '' }, 'No BOM — create one first'));
  };
  const item = lookup('items', mo.item_id, { disabled: !ed, onPick: it => loadBoms(it.id) });
  bomSel.disabled = !ed;
  if (mo.item_id) await loadBoms(mo.item_id);
  const q = numIn(mo.qty, { disabled: !ed }), sd = inp('date', mo.start_date || '', { disabled: !ed }), dd = inp('date', mo.due_date || '', { disabled: !ed });
  const loc = locationSel(mo.location_id); loc.disabled = !ed;
  const notes = h('textarea', { class: 'in', disabled: !ed }, mo.notes || '');
  const body = () => ({ id, item_id: item.value, bom_id: bomSel.value, qty: q.value, start_date: sd.value, due_date: dd.value, location_id: loc.value, notes: notes.value });
  const acts = [];
  if (ed) acts.push(btn('Save', async () => { const r = await act('mo_save', body(), 'Production order saved'); if (!id) go(`#/rec/production_orders/${r.id}`); else route(); }, 'pri'));
  if (id && mo.status === 'planned' && can('clerk')) acts.push(btn('Release', async () => { await act('mo_save', body()); await act('mo_release', { id }, 'Released to the floor'); route(); }));
  if (mo.status === 'released' && can('clerk')) acts.push(btn('Report output…', () => completeDlg(mo), 'pri'));
  if (id && ['planned', 'released'].includes(mo.status) && can('manager')) acts.push(btn(mo.qty_completed > 0 ? 'Close short' : 'Cancel', () => confirmDlg(mo.qty_completed > 0 ? 'Close short' : 'Cancel production order', mo.qty_completed > 0 ? 'Close the order with the quantity completed so far?' : `Cancel ${mo.number}?`, 'Confirm', async () => { await act('mo_cancel', { id }, 'Done'); route(); }), 'danger'));
  if (id) acts.push(docBtn('traveler', id, 'Traveler / pick list'));
  const short = id ? mo.components.filter(c => c.short > 0) : [];
  ap(page, pageHead(id ? mo.number : 'New production order', id ? [tag(mo.status), ` ${qty(mo.qty_completed)} of ${qty(mo.qty)} ${mo.sku} completed`] : null, acts, crumbTo('production_orders')),
    h('div', { class: 'stack' }, panel('Order', h('div', { class: 'form' }, field('Item to build', item, { req: true }), field('BOM revision', bomSel), field('Quantity', q, { req: true }), field('Location', loc), field('Start', sd), field('Due', dd), field('Notes', notes, { wide: true }))),
      id ? flush('Component requirements', h('div', {}, short.length && mo.status !== 'completed' ? h('div', { class: 'msg warn', style: 'margin:10px' }, `${short.length} component(s) short for the remaining quantity. Output will be blocked until stock arrives.`) : null,
        table([{ key: 'sku', label: 'SKU' }, { key: 'name', label: 'Component' }, { key: 'qty_per', label: 'Per unit', type: 'qty' }, { key: 'scrap_pct', label: 'Scrap %', type: 'pct' }, { key: 'required', label: 'Total req.', type: 'qty' }, { key: 'remaining', label: 'Still needed', type: 'qty' }, { key: 'available', label: 'Available', type: 'qty' }, { key: 'short', label: 'Short', type: 'qty', render: c => c.short ? h('span', { class: 'neg' }, qty(c.short)) : '' }], mo.components, { href: c => `#/rec/items/${c.component_id}` }))) : null,
      id && mo.txns.length ? flush('Material & output postings', table([{ key: 'ts', label: 'Time', type: 'datetime' }, { key: 'sku', label: 'SKU' }, { key: 'type', label: 'Type', type: 'tag' }, { key: 'qty', label: 'Qty', type: 'qty' }, { key: 'unit_cost', label: 'Unit cost', type: 'cost' }, { key: 'value', label: 'Value', type: 'money' }], mo.txns)) : null,
      id ? history(mo) : null));
}
function completeDlg(mo) {
  const q = numIn(+(mo.qty - mo.qty_completed).toFixed(4)), dt = inp('date', todayISO());
  dialog(`Report output — ${mo.number}`, h('div', {}, h('div', { class: 'form' }, field('Quantity completed', q), field('Date', dt)),
    h('p', { class: 'muted' }, 'Components are backflushed from stock at average cost; finished goods are received at actual cost (materials + labor + overhead).')),
    [{ label: 'Post output', cls: 'pri', run: async () => { const r = await act('mo_complete', { id: mo.id, qty: q.value, date: dt.value }); toast(`Completed ${qty(r.completed)} at ${money(r.cost)}`); route(); } }]);
}
async function viewBOM(page, id) {
  const b = id ? await api(`/api/record/boms/${id}`) : { version: 'A', active: 1, labor_cost: 0, overhead_cost: 0, lines: [], ...(S.prefill || {}) };
  S.prefill = null;
  const ed = can('manager');
  const item = lookup('items', b.item_id, { disabled: !ed || !!id });
  const ver = inp('text', b.version, { disabled: !ed }), lab = numIn(b.labor_cost, { disabled: !ed }), ovh = numIn(b.overhead_cost, { disabled: !ed });
  const active = h('input', { type: 'checkbox', checked: !!b.active, disabled: !ed });
  const notes = h('textarea', { class: 'in', disabled: !ed }, b.notes || '');
  const lines = ed ? lineEditor({ itemKey: 'component_id', rows: b.lines, cols: [{ key: 'qty_per', label: 'Qty per unit' }, { key: 'scrap_pct', label: 'Scrap %', default: 0 }] }) :
    table([{ key: 'sku', label: 'SKU' }, { key: 'name', label: 'Component' }, { key: 'qty_per', label: 'Qty per', type: 'qty' }, { key: 'scrap_pct', label: 'Scrap %', type: 'pct' }, { key: 'ext_cost', label: 'Ext. cost', type: 'cost' }], b.lines);
  const acts = ed ? [btn('Save', async () => {
    const r = await act('bom_save', { id, item_id: item.value, version: ver.value, labor_cost: lab.value, overhead_cost: ovh.value, active: active.checked ? 1 : 0, notes: notes.value, lines: lines.get() }, 'BOM saved');
    if (!id) go(`#/rec/boms/${r.id}`); else route();
  }, 'pri')] : [];
  if (id && can('clerk')) acts.push(btn('New production order', () => { S.prefill = { item_id: b.item_id, bom_id: id }; go('#/rec/production_orders/new'); }));
  ap(page, pageHead(id ? `${b.sku} rev ${b.version}` : 'New bill of materials', id ? `${b.item_name} · rolled cost ${S.cur}${nfc.format(b.rolled_cost)} per unit` : null, acts, crumbTo('boms')),
    h('div', { class: 'stack' }, panel('Header', h('div', { class: 'form' }, field('Parent item (finished/component)', item, { req: true }), field('Revision', ver), field('Labor cost / unit', lab), field('Overhead / unit', ovh),
      h('label', { class: 'f' }, h('span', {}, 'Active revision'), h('label', { class: 'chk' }, active, 'Use for new production')), field('Notes', notes, { wide: true }))),
      panel('Components', lines),
      id && ed ? flush('Current cost roll-up', table([{ key: 'sku', label: 'SKU' }, { key: 'name', label: 'Component' }, { key: 'qty_per', label: 'Qty per', type: 'qty' }, { key: 'avg_cost', label: 'Avg cost', type: 'cost' }, { key: 'ext_cost', label: 'Ext. cost', type: 'cost' }], b.lines)) : null,
      id && b.where_used.length ? flush('Recent production orders', table([{ key: 'number', label: 'MO #' }, { key: 'qty', label: 'Qty', type: 'qty' }, { key: 'status', label: 'Status', type: 'tag' }], b.where_used, { href: x => `#/rec/production_orders/${x.id}` })) : null,
      id ? history(b) : null));
}

/* ------------------------------------------------------------------ reports */
async function viewReports(page) {
  const groups = {};
  S.meta.reports.filter(r => can(r.role)).forEach(r => (groups[r.group] ||= []).push(r));
  ap(page, pageHead('Reports', 'Every report can be filtered, printed, and exported to CSV or Excel.'),
    h('div', { class: 'cols' }, Object.entries(groups).map(([g, rs]) => panel(g, h('ul', { class: 'list-plain' }, rs.map(r => h('li', {}, h('a', { href: '#/reports/' + r.name }, r.label))))))));
}
async function viewReport(page, name) {
  const p = new URLSearchParams(location.hash.split('?')[1] || '');
  const fr = inp('date', p.get('from') || ''), to = inp('date', p.get('to') || '');
  const qs = () => new URLSearchParams({ from: fr.value, to: to.value }).toString();
  const r = await api(`/api/reports/${name.split('?')[0]}?${qs()}`);
  const nm = name.split('?')[0];
  if (r.params.includes('from') && !fr.value) { /* show server-chosen defaults */ const m = r.title.match(/(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})/); if (m) { fr.value = m[1]; to.value = m[2]; } }
  fr.style.width = to.style.width = 'auto';
  const acts = [btn('CSV', () => download(`/api/reports/${nm}?${qs()}&format=csv`)), btn('Excel', () => download(`/api/reports/${nm}?${qs()}&format=xlsx`)), btn('Print', () => window.print())];
  if (nm === 'reorder' && can('clerk') && r.rows.some(x => x.action === 'buy' && x.supplier_code)) acts.unshift(btn('Create draft POs', async () => { const res = await act('reorder_create_pos', {}); toast(`${res.created.length} draft purchase order(s) created`); go('#/list/purchase_orders'); }, 'pri'));
  ap(page, pageHead(r.title, `${r.rows.length} rows`, acts, h('a', { href: '#/reports' }, 'Reports')));
  if (r.params.includes('from')) ap(page, h('div', { class: 'tools' }, h('span', { class: 'muted' }, 'From'), fr, h('span', { class: 'muted' }, 'to'), to,
    btn('Run', () => { location.hash = `#/reports/${nm}?${qs()}`; }, 'pri')));
  ap(page, table(r.columns, r.rows, { totals: Object.keys(r.totals).length ? r.totals : null, href: r.link ? x => x.id ? `#/rec/${r.link}/${x.id}` : null : null }));
}

/* ------------------------------------------------------------------ reconciliation */
async function viewReconcile(page) {
  const r = await api('/api/reconcile');
  const fails = r.checks.filter(c => !c.ok);
  ap(page, pageHead('Reconciliation & integrity', `Ran ${r.ran_at.replace('T', ' ')} · ${r.checks.length} checks · ${fails.length ? fails.length + ' failing' : 'all passing'}`,
    [btn('Run again', () => route(), 'pri'), can('admin') ? btn('Rebuild stock from ledger', () => confirmDlg('Rebuild stock', 'Recompute every on-hand balance and running balance from the inventory ledger. Use this if the stock check fails. The action is audited.', 'Rebuild', async () => { await act('rebuild_stock', {}, 'Stock rebuilt from ledger'); route(); }, 'pri')) : null]),
    h('div', { class: 'msg ' + (r.ok ? 'ok' : 'err') }, r.ok ? 'All subledgers reconcile: stock equals the ledger, documents match their lines, and payments match balances.' : 'Discrepancies found. Review the failing checks below.'),
    flush('Checks', h('div', {}, r.checks.map(c => h('div', { class: 'check' }, h('span', { class: 'dot ' + (c.ok ? 'ok' : 'no'), 'aria-label': c.ok ? 'Pass' : 'Fail' }, c.ok ? '✓' : '!'),
      h('div', {}, h('b', {}, c.name), h('div', { class: 'muted' }, c.description),
        c.rows.length ? h('div', { style: 'margin-top:8px' }, table(Object.keys(c.rows[0]).map(k => ({ key: k, label: k })), c.rows.slice(0, 20))) : null),
      h('span', { class: c.ok ? 'muted' : 'neg' }, c.ok ? 'Pass' : `${c.count} issue(s)`))))));
}

/* ------------------------------------------------------------------ settings & backups */
async function viewSettings(page) {
  const meta = await api('/api/meta'); S.meta = meta;
  const ctl = {};
  const groups = {};
  meta.settings.forEach(s => (groups[s.grp] ||= []).push(s));
  const panels = Object.entries(groups).map(([g, ss]) => panel(g, h('div', { class: 'form' }, ss.map(s => {
    const el = s.type === 'bool' ? h('input', { type: 'checkbox', checked: s.value === '1' }) : s.type === 'str' ? inp('text', s.value) : numIn(s.value, { step: s.type === 'int' ? '1' : 'any' });
    ctl[s.key] = { el, s };
    return h('label', { class: 'f' + (s.type === 'str' && s.key.includes('address') ? ' wide' : '') }, h('span', { title: s.description }, s.label), s.type === 'bool' ? h('label', { class: 'chk' }, el, 'Enabled') : el,
      s.description ? h('span', { class: 'faint', style: 'font-size:11px' }, s.description) : null);
  }))));
  ap(page, pageHead('Settings', 'Business rules take effect immediately for all users. Changes are audited.', [btn('Save settings', async () => {
    const values = {};
    for (const [k, { el, s }] of Object.entries(ctl)) values[k] = s.type === 'bool' ? (el.checked ? '1' : '0') : el.value;
    await api('/api/settings', { values }); S.meta = await api('/api/meta'); S.cur = S.meta.values.currency_symbol; toast('Settings saved'); route();
  }, 'pri')]), h('div', { class: 'stack' }, panels));
}
async function viewBackups(page) {
  const list = await api('/api/backups');
  const file = h('input', { type: 'file', accept: '.db', class: 'in', style: 'height:auto;padding:6px;max-width:340px' });
  const restore = (name, data) => confirmDlg('Restore database', `Replace ALL current data with ${name}? A safety backup of the current database is taken first. Other users should stop working until this finishes.`, 'Restore',
    async () => { const r = await api('/api/backups/restore', data ? { data } : { name }); toast(`Restored ${r.restored}. Safety copy: ${r.safety_backup}`); S.lists = {}; await boot(); });
  ap(page, pageHead('Backup & restore', 'Backups are consistent snapshots taken with SQLite’s online backup API and verified before use.', [btn('Create backup now', async () => { const r = await api('/api/backups/create', {}); toast('Backup created: ' + r.name); route(); }, 'pri')]),
    h('div', { class: 'stack' },
      panel('Restore from a file', h('div', { class: 'tools' }, file, btn('Restore from file…', async () => {
        if (!file.files[0]) throw new Error('Choose a .db backup file.');
        const data = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result.split(',')[1]); fr.onerror = rej; fr.readAsDataURL(file.files[0]); });
        restore(file.files[0].name, data);
      }, 'danger'))),
      flush(`Backups (${list.length})`, table([{ key: 'name', label: 'File', render: b => h('span', { class: 'mono' }, b.name) }, { key: 'modified', label: 'Created' }, { key: 'size', label: 'Size', render: b => (b.size / 1048576).toFixed(2) + ' MB' },
        { key: 'x', label: '', render: b => h('span', { style: 'display:flex;gap:4px' }, btn('Download', () => download(`/api/backups/download/${encodeURIComponent(b.name)}`), 'sm'),
          btn('Verify', async () => { const v = await api('/api/backups/verify', { name: b.name }); toast(`OK · schema v${v.schema_version} · ${v.counts.customers} customers, ${v.counts.sales_orders} sales orders`); }, 'sm'),
          btn('Restore', () => restore(b.name), 'sm danger')) }], list, { empty: 'No backups yet.' }))));
}

/* ------------------------------------------------------------------ boot */
async function boot() {
  try { S.me = await api('/api/me'); } catch (e) { return renderLogin(); }
  S.meta = await api('/api/meta');
  S.cur = S.meta.values.currency_symbol || '$';
  renderShell();
  await route();
}
boot();
