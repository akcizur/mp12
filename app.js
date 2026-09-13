const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const STORAGE = 'mp12-data-v2';
const THEME = 'mp12-theme';

const initial = {
  pages: [
    { id: 'dashboard', title: 'Přehled', description: 'Jednoduchý přehled obsahu aplikace.', icon: '⌂', type: 'dashboard' },
    { id: 'materials', title: 'Suroviny', description: 'Seznam surovin a jejich základní údaje.', icon: '▤', type: 'table', table: 'materials' },
    { id: 'stock', title: 'Sklad', description: 'Přehled položek, umístění a množství.', icon: '▦', type: 'table', table: 'stock' },
    { id: 'moves', title: 'Pohyby', description: 'Historie příjmů, výdejů a přesunů.', icon: '↕', type: 'table', table: 'moves' },
    { id: 'locations', title: 'Pozice', description: 'Seznam skladových pozic.', icon: '⌗', type: 'table', table: 'locations' }
  ],
  materials: [
    { id: 'MAT-01', name: 'MagChel Magnesium bisglycinate', unit: 'g', note: 'Magnesium' },
    { id: 'MAT-02', name: 'Herbal Extract', unit: 'g', note: 'Extrakt' },
    { id: 'MAT-03', name: 'Vitamin C', unit: 'g', note: 'Prášek' }
  ],
  stock: [
    { id: 'P-0001', material: 'MagChel Magnesium bisglycinate', lot: '42/26', expiration: '01/28', box: '12', position: 'A-01', weight: '1250.00', state: 'nový' },
    { id: 'P-0002', material: 'Herbal Extract', lot: '14/26', expiration: '06/28', box: '4', position: 'B-02', weight: '720.50', state: 'otevřený' },
    { id: 'P-0003', material: 'Vitamin C', lot: '18/26', expiration: '11/27', box: '8', position: 'A-03', weight: '980.00', state: 'nový' },
    { id: 'P-0004', material: 'MagChel Magnesium bisglycinate', lot: '48/26', expiration: '09/28', box: '12', position: 'A-01', weight: '540.25', state: 'otevřený' }
  ],
  moves: [
    { id: 'M-0004', date: '13.09.2026 07:12', pack: 'P-0004', type: 'Přesun', amount: '0', note: 'A-02 → A-01' },
    { id: 'M-0003', date: '12.09.2026 16:40', pack: 'P-0002', type: 'Výdej', amount: '-120.00', note: 'Výrobní dávka' },
    { id: 'M-0002', date: '12.09.2026 09:15', pack: 'P-0003', type: 'Příjem', amount: '+980.00', note: 'Nový pytel' },
    { id: 'M-0001', date: '11.09.2026 14:21', pack: 'P-0001', type: 'Přesun', amount: '0', note: 'B-01 → A-01' }
  ],
  locations: [
    { id: 'A-01', name: 'A-01', box: '12', note: 'Hlavní sklad' },
    { id: 'A-02', name: 'A-02', box: '2', note: 'Příjem' },
    { id: 'A-03', name: 'A-03', box: '8', note: 'Výdej' },
    { id: 'B-02', name: 'B-02', box: '4', note: 'Extrakt' }
  ]
};

let data = load();
let currentPage = data.pages[0].id;
let query = '';
let editing = null;
let sort = { key: null, direction: 1 };

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE));
    return saved?.pages ? saved : structuredClone(initial);
  } catch { return structuredClone(initial); }
}

function save() { localStorage.setItem(STORAGE, JSON.stringify(data)); }
function esc(value) { return String(value ?? '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c])); }
function current() { return data.pages.find(p => p.id === currentPage) || data.pages[0]; }

function tableConfig(type) {
  return {
    materials: {
      title: 'Suroviny',
      columns: [['id','ID'],['name','Název suroviny'],['unit','Jednotka'],['note','Poznámka']],
      rows: data.materials,
      form: [['name','Název suroviny','text'],['unit','Jednotka','text'],['note','Poznámka','text']]
    },
    stock: {
      title: 'Sklad',
      columns: [['id','ID pytle'],['material','Název suroviny'],['lot','Šarže'],['expiration','Expirace'],['box','Box'],['position','Pozice'],['weight','Hmotnost (g)'],['state','Stav']],
      rows: data.stock,
      form: [['material','Název suroviny','text'],['lot','Šarže','text'],['expiration','Expirace (mm/yy)','text'],['box','Box','text'],['position','Pozice','text'],['weight','Hmotnost (g)','number'],['state','Stav','select']]
    },
    moves: {
      title: 'Pohyby',
      columns: [['id','ID záznamu'],['date','Datum a čas'],['pack','ID pytle'],['type','Typ'],['amount','Pohyb (g)'],['note','Poznámka']],
      rows: data.moves,
      form: [['pack','ID pytle','text'],['type','Typ','select'],['amount','Pohyb (g)','number'],['note','Poznámka','text']]
    },
    locations: {
      title: 'Pozice',
      columns: [['id','ID pozice'],['name','Název'],['box','Boxů'],['note','Poznámka']],
      rows: data.locations,
      form: [['name','Název','text'],['box','Počet boxů','number'],['note','Poznámka','text']]
    }
  }[type];
}

function renderNav() {
  $('#pageNav').innerHTML = data.pages.map(page => `
    <button class="page-link ${page.id === currentPage ? 'active' : ''}" data-page="${esc(page.id)}" type="button">
      <span class="page-icon">${esc(page.icon)}</span><span>${esc(page.title)}</span>
    </button>`).join('');
}

function renderPage() {
  const page = current();
  $('#breadcrumbCurrent').textContent = page.title;
  $('#pageTitle').textContent = page.title;
  $('#pageDescription').textContent = page.description;
  $('#mobileTitle').textContent = page.title;
  $('#pageAction').textContent = page.type === 'dashboard' ? '＋ Nová stránka' : '＋ Přidat';

  if (page.type === 'dashboard') renderDashboard();
  else renderTable(page.table);
}

function renderDashboard() {
  const stockWeight = data.stock.reduce((n, x) => n + Number(x.weight || 0), 0);
  $('#content').innerHTML = `
    <div class="stats">
      <article class="stat"><span>Stránky</span><strong>${data.pages.length}</strong><small>v navigaci</small></article>
      <article class="stat"><span>Pytle</span><strong>${data.stock.length}</strong><small>ve skladu</small></article>
      <article class="stat"><span>Hmotnost</span><strong>${stockWeight.toFixed(2)} g</strong><small>aktuální součet</small></article>
      <article class="stat"><span>Pohyby</span><strong>${data.moves.length}</strong><small>v historii</small></article>
    </div>
    <div class="dashboard-grid">
      <section class="panel">
        <div class="panel-head"><div><span class="eyebrow">RYCHLÝ PŘEHLED</span><h2>Poslední pohyby</h2></div><button class="link-btn" data-go="moves">Zobrazit vše →</button></div>
        ${data.moves.slice(0,4).map(m => `<div class="activity-row"><div><strong>${esc(m.type)}</strong><span>${esc(m.pack)} · ${esc(m.note)}</span></div><b>${esc(m.amount)} g</b></div>`).join('')}
      </section>
      <section class="panel"><div class="panel-head"><div><span class="eyebrow">STRÁNKY</span><h2>Obsah</h2></div></div>
        <div class="quick-pages">${data.pages.slice(1).map(p => `<button class="quick-page" data-go="${p.id}" type="button"><span>${esc(p.icon)}</span><div><strong>${esc(p.title)}</strong><small>${esc(p.description)}</small></div><b>→</b></button>`).join('')}</div>
      </section>
    </div>`;
}

function renderTable(type) {
  const cfg = tableConfig(type);
  let rows = [...cfg.rows];
  if (query.trim()) {
    const q = query.toLocaleLowerCase('cs-CZ');
    rows = rows.filter(row => Object.values(row).some(v => String(v).toLocaleLowerCase('cs-CZ').includes(q)));
  }
  if (sort.key) rows.sort((a,b) => String(a[sort.key]).localeCompare(String(b[sort.key]), 'cs-CZ', { numeric: true }) * sort.direction);

  $('#content').innerHTML = `
    <section class="table-panel">
      <div class="table-tools">
        <label class="search"><span>⌕</span><input id="tableSearch" value="${esc(query)}" type="search" placeholder="Hledat v tabulce…" autocomplete="off"></label>
        <span class="result-count">${rows.length} z ${cfg.rows.length}</span>
      </div>
      <div class="table-scroll">
        <table><thead><tr>${cfg.columns.map(([key,label]) => `<th><button class="th-button" data-sort="${key}" type="button">${esc(label)} <span>${sort.key === key ? (sort.direction === 1 ? '↑' : '↓') : '↕'}</span></button></th>`).join('')}<th class="actions-head"></th></tr></thead>
        <tbody>${rows.length ? rows.map(row => `<tr data-row-id="${esc(row.id)}">${cfg.columns.map(([key]) => `<td>${cellValue(row[key], key)}</td>`).join('')}<td class="row-actions"><button class="row-btn edit" type="button">Upravit</button><button class="row-btn danger delete" type="button">Smazat</button></td></tr>`).join('') : `<tr><td colspan="${cfg.columns.length + 1}" class="empty">Žádná data</td></tr>`}</tbody></table>
      </div>
    </section>`;
}

function cellValue(value, key) {
  if (key === 'state') return `<span class="pill">${esc(value)}</span>`;
  if (key === 'weight' || key === 'amount') return `<span class="number">${esc(value)}${key === 'weight' ? '' : ' g'}</span>`;
  return esc(value);
}

function openEditor(type, id = null) {
  const cfg = tableConfig(type);
  editing = { type, id };
  const row = id ? cfg.rows.find(r => r.id === id) : null;
  $('#dialogTitle').textContent = row ? 'Upravit položku' : `Nová položka · ${cfg.title}`;
  $('#formFields').innerHTML = cfg.form.map(([key,label,kind]) => {
    const value = row?.[key] ?? '';
    if (kind === 'select') return `<label>${esc(label)}<select name="${key}"><option value="nový" ${value === 'nový' ? 'selected' : ''}>nový</option><option value="otevřený" ${value === 'otevřený' ? 'selected' : ''}>otevřený</option></select></label>`;
    return `<label>${esc(label)}<input name="${key}" type="${kind}" value="${esc(value)}" ${key === 'expiration' ? 'pattern="\\d{2}\\/\\d{2}"' : ''} required></label>`;
  }).join('');
  $('#dialog').showModal();
}

function storeRows(type) { return data[tableConfig(type) ? type : 'stock']; }

function addRow(type, values) {
  const rows = storeRows(type);
  const prefix = { materials:'MAT', stock:'P', moves:'M', locations:'POS' }[type];
  const next = rows.reduce((n, r) => Math.max(n, Number(String(r.id).replace(/\D/g,'')) || 0), 0) + 1;
  const id = `${prefix}-${String(next).padStart(4,'0')}`;
  rows.unshift({ id, ...values });
}

$('#pageNav').addEventListener('click', e => {
  const button = e.target.closest('[data-page]');
  if (!button) return;
  currentPage = button.dataset.page;
  query = '';
  sort = { key: null, direction: 1 };
  renderNav(); renderPage();
  $('#sidebar').classList.remove('open');
});

$('#content').addEventListener('click', e => {
  const go = e.target.closest('[data-go]');
  if (go) { currentPage = go.dataset.go; renderNav(); renderPage(); return; }
  const sortBtn = e.target.closest('[data-sort]');
  if (sortBtn) { sort.direction = sort.key === sortBtn.dataset.sort ? sort.direction * -1 : 1; sort.key = sortBtn.dataset.sort; renderPage(); return; }
  const row = e.target.closest('[data-row-id]');
  if (!row) return;
  const page = current();
  if (e.target.closest('.edit')) openEditor(page.table, row.dataset.rowId);
  if (e.target.closest('.delete')) {
    const rows = storeRows(page.table);
    const index = rows.findIndex(r => r.id === row.dataset.rowId);
    if (index !== -1 && confirm('Opravdu smazat tuto položku?')) { rows.splice(index, 1); save(); renderPage(); }
  }
});

$('#content').addEventListener('input', e => {
  if (e.target.id === 'tableSearch') { query = e.target.value; renderPage(); const input = $('#tableSearch'); input?.focus(); input?.setSelectionRange(query.length, query.length); }
});

$('#pageAction').addEventListener('click', () => {
  const page = current();
  if (page.type === 'dashboard') return $('#newPage').click();
  openEditor(page.table);
});

$('#newPage').addEventListener('click', () => {
  const title = prompt('Název nové stránky:');
  if (!title?.trim()) return;
  const id = `page-${Date.now()}`;
  data.pages.push({ id, title: title.trim(), description: 'Nová stránka.', icon: '□', type: 'table', table: 'materials' });
  save(); currentPage = id; renderNav(); renderPage();
});

$('#form').addEventListener('submit', e => {
  if (e.submitter?.value === 'cancel') return;
  e.preventDefault();
  const form = new FormData(e.currentTarget);
  const values = Object.fromEntries(form.entries());
  const rows = storeRows(editing.type);
  if (editing.id) {
    const row = rows.find(r => r.id === editing.id);
    if (row) Object.assign(row, values);
  } else addRow(editing.type, values);
  save(); $('#dialog').close(); renderPage();
});

$('#refreshBtn').addEventListener('click', () => { query = ''; sort = { key: null, direction: 1 }; renderPage(); });
$('#themeBtn').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next; localStorage.setItem(THEME, next);
});
$('#menuBtn').addEventListener('click', () => $('#sidebar').classList.toggle('open'));

const savedTheme = localStorage.getItem(THEME) || 'light';
document.documentElement.dataset.theme = savedTheme;
renderNav();
renderPage();
