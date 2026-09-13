const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const KEY = 'mp12-pages-v1';
const THEME_KEY = 'mp12-theme';

const seed = [
  {id:'P-01', title:'Dashboard', desc:'Hlavní přehled a rychlé vstupy do aplikace.', status:'open'},
  {id:'P-02', title:'Sklad', desc:'Seznam položek, filtry, pozice a hmotnosti.', status:'open'},
  {id:'P-03', title:'Pozice', desc:'Pohled na uložení jako samostatná stránka.', status:'done'},
  {id:'P-04', title:'Pohyby', desc:'Historie přesunů, příjmů a výdejů.', status:'draft'},
  {id:'P-05', title:'Nastavení', desc:'Konfigurace lokální aplikace a vzhledu.', status:'draft'}
];

let pages = loadPages();
const state = {view:'list', q:'', filter:'all', theme:localStorage.getItem(THEME_KEY) || 'dark'};

function loadPages(){
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    return Array.isArray(saved) && saved.length ? saved : structuredClone(seed);
  } catch { return structuredClone(seed); }
}
function save(){ localStorage.setItem(KEY, JSON.stringify(pages)); }
function esc(v){ return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function statusLabel(s){ return s === 'open' ? 'Aktivní' : s === 'done' ? 'Hotové' : 'Koncept'; }
function filtered(){
  const q = state.q.trim().toLocaleLowerCase('cs-CZ');
  return pages.filter(p => {
    const hay = `${p.id} ${p.title} ${p.desc}`.toLocaleLowerCase('cs-CZ');
    return (!q || hay.includes(q)) && (state.filter === 'all' || p.status === state.filter);
  });
}

// Main includePages renderer. Both views share the same data and event model.
function includePages(items, mode = state.view){
  const root = $('#pages');
  root.className = `pages ${mode === 'stack' ? 'stack-mode' : 'list-mode'}`;

  if(!items.length){
    root.innerHTML = '<div class="stack-empty">Žádné stránky neodpovídají filtru.</div>';
    return;
  }

  if(mode === 'list'){
    root.innerHTML = items.map((p,i) => `
      <article class="page-row" data-id="${esc(p.id)}">
        <span class="page-number">${String(i+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}</span>
        <div><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p><div class="meta"><span>${esc(p.id)}</span><span class="state">${statusLabel(p.status)}</span></div></div>
        <button class="btn open-card" type="button">Otevřít</button>
      </article>`).join('');
    return;
  }

  // Limit the visible stack to keep the interaction readable.
  const visible = items.slice(0, 6);
  root.innerHTML = `<div class="stack-canvas">${visible.map((p,i) => {
    const offset = i * 40;
    const rotate = (i % 2 === 0 ? -1 : 1) * Math.min(i * .55, 2.6);
    return `
      <article class="stack-card active" data-id="${esc(p.id)}" style="--offset:${offset}px;--rotate:${rotate}deg;--z:${100-i}">
        <span class="page-number">${esc(p.id)} · ${statusLabel(p.status)}</span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.desc)}</p>
        <div class="card-bottom"><span class="ghost">includePages[${i}]</span><button class="btn open-card" type="button">Otevřít stránku</button></div>
      </article>`;
  }).join('')}</div>`;

  $$('.stack-card', root).forEach(card => card.addEventListener('click', e => {
    if(e.target.closest('button')) return;
    bringToFront(card.dataset.id);
  }));
}

function bringToFront(id){
  const picked = pages.find(p => p.id === id);
  if(!picked) return;
  pages = [picked, ...pages.filter(p => p.id !== id)];
  save();
  render();
}

function render(){
  document.documentElement.dataset.theme = state.theme;
  $$('.switch').forEach(b => b.classList.toggle('active', b.dataset.view === state.view));
  const items = filtered();
  includePages(items, state.view);
  $('#count').textContent = `${items.length} ${items.length === 1 ? 'položka' : 'položek'}`;
}

function openPage(id){
  const p = pages.find(x => x.id === id);
  if(!p) return;
  $('#titleInput').value = p.title;
  $('#descInput').value = p.desc;
  $('#statusInput').value = p.status;
  $('#dialog').dataset.edit = id;
  $('#dialog').querySelector('.eyebrow').textContent = 'PAGE';
  $('#dialog').querySelector('h2').textContent = p.title;
  $('#dialog').showModal();
}

$('#search').addEventListener('input', e => { state.q = e.target.value; render(); });
$('#filter').addEventListener('change', e => { state.filter = e.target.value; render(); });
$$('.switch').forEach(b => b.addEventListener('click', () => { state.view = b.dataset.view; render(); }));
$('#themeBtn').addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, state.theme);
  render();
});
$('#shuffleBtn').addEventListener('click', () => {
  pages = pages.map(v => ({v, r:Math.random()})).sort((a,b) => a.r - b.r).map(x => x.v);
  save(); render();
});
$('#addBtn').addEventListener('click', () => {
  $('#dialog').dataset.edit = '';
  $('#titleInput').value = '';
  $('#descInput').value = '';
  $('#statusInput').value = 'open';
  $('#dialog').querySelector('.eyebrow').textContent = 'NOVÁ PAGE';
  $('#dialog').querySelector('h2').textContent = 'Přidat kartu';
  $('#dialog').showModal();
});
$('#cardForm').addEventListener('submit', e => {
  if(e.submitter?.value === 'cancel') return;
  e.preventDefault();
  const edit = $('#dialog').dataset.edit;
  const title = $('#titleInput').value.trim();
  const desc = $('#descInput').value.trim();
  const status = $('#statusInput').value;
  if(!title) return;

  if(edit){
    const p = pages.find(x => x.id === edit);
    if(p) Object.assign(p, {title, desc, status});
  } else {
    const next = pages.reduce((n,p) => Math.max(n, Number(String(p.id).replace(/\D/g,'')) || 0), 0) + 1;
    pages.unshift({id:`P-${String(next).padStart(2,'0')}`, title, desc, status});
  }
  save();
  $('#dialog').close();
  render();
});
$('#pages').addEventListener('click', e => {
  const button = e.target.closest('.open-card');
  const card = e.target.closest('[data-id]');
  if(button && card) openPage(card.dataset.id);
});

render();
