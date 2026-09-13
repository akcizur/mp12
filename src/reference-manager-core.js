const DB_KEY = 'mp12-inventory-v4'

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]))
const numericId = (rows) => String(Math.max(0, ...(rows || []).map(x => Number(x?.id) || 0)) + 1)

function readDb() {
  try {
    const data = JSON.parse(localStorage.getItem(DB_KEY) || 'null')
    return data && typeof data === 'object' ? data : { materials: [], boxes: [], positions: [], packs: [] }
  } catch {
    return { materials: [], boxes: [], positions: [], packs: [] }
  }
}
function writeDb(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); document.dispatchEvent(new Event('mp12:db-changed')) }

function renderReferenceManager(backdrop) {
  const db = readDb()
  const materials = Array.isArray(db.materials) ? db.materials : []
  const boxes = Array.isArray(db.boxes) ? db.boxes : []
  const positions = Array.isArray(db.positions) ? db.positions : []
  const section = (kind, title, rows, columns, addLabel) => {
    const body = rows.length ? rows.map((row, index) => `
      <div class="ref-row" data-kind="${kind}" data-index="${index}">
        ${columns.map(column => `<div class="ref-cell"><span class="ref-mobile-label">${column.label}</span><input class="ref-input ${column.mono ? 'mono' : ''}" data-field="${column.key}" value="${esc(row[column.key])}" aria-label="${esc(column.label)}" ${column.readonly ? 'readonly' : ''}></div>`).join('')}
        <div class="ref-actions"><button type="button" class="ref-save" data-ref-save>Uložit</button><button type="button" class="ref-delete" data-ref-delete>Smazat</button></div>
      </div>`).join('') : '<div class="ref-empty">Prázdný číselník.</div>'
    const form = kind === 'materials'
      ? `<div class="ref-add-grid"><input data-add-name placeholder="Název suroviny"><button type="button" data-ref-add>Přidat surovinu</button></div>`
      : kind === 'boxes'
        ? `<div class="ref-add-grid single"><input value="${numericId(rows)}" readonly aria-label="Číslo boxu"><button type="button" data-ref-add>Přidat box</button></div>`
        : `<div class="ref-add-grid"><input value="${numericId(rows)}" readonly aria-label="ID pozice"><input data-add-name placeholder="Název pozice"><button type="button" data-ref-add>Přidat pozici</button></div>`
    return `<section class="ref-section"><header class="ref-section-head"><div><span>ČÍSELNÍK</span><h3>${title}</h3></div><b>${rows.length}</b></header><div class="ref-table-head">${columns.map(c => `<span>${c.label}</span>`).join('')}<span></span></div><div class="ref-list">${body}</div>${form}</section>`
  }
  backdrop.innerHTML = `<section class="db-modal ref-manager" role="dialog" aria-modal="true" aria-labelledby="dbTitle">
    <div class="db-head"><div><h2 id="dbTitle">DB / Číselníky</h2><p>Referenční data pro formuláře skladu.</p></div><button type="button" class="db-close" id="dbClose" aria-label="Zavřít">×</button></div>
    <p class="db-note">ID jsou automatická a číselná. U surovin se zadává pouze název, u boxu pouze přidání boxu a u pozice název pozice. ID se nemění.</p>
    <div class="ref-sections">
      ${section('materials','Suroviny',materials,[{key:'id',label:'ID',mono:true,readonly:true},{key:'name',label:'Název'}])}
      ${section('boxes','Boxy',boxes,[{key:'id',label:'Box',mono:true,readonly:true}])}
      ${section('positions','Pozice',positions,[{key:'id',label:'ID',mono:true,readonly:true},{key:'name',label:'Název'}])}
    </div></section>`
  const close = () => backdrop.classList.remove('open')
  backdrop.querySelector('#dbClose').onclick = close
  backdrop.querySelectorAll('[data-ref-add]').forEach(button => {
    button.onclick = () => {
      const node = button.closest('.ref-section')
      const title = node.querySelector('h3')?.textContent || ''
      const next = readDb()
      const kind = title === 'Suroviny' ? 'materials' : title === 'Boxy' ? 'boxes' : 'positions'
      const list = Array.isArray(next[kind]) ? next[kind] : []
      if (kind === 'materials') {
        const name = String(node.querySelector('[data-add-name]')?.value || '').trim()
        if (!name) return
        list.push({ id: numericId(list), name })
      } else if (kind === 'boxes') {
        list.push({ id: numericId(list) })
      } else {
        const name = String(node.querySelector('[data-add-name]')?.value || '').trim()
        if (!name) return
        list.push({ id: numericId(list), name })
      }
      next[kind] = list; writeDb(next); renderReferenceManager(backdrop); backdrop.classList.add('open')
    }
  })
  backdrop.querySelectorAll('[data-ref-save]').forEach(button => {
    button.onclick = () => {
      const row = button.closest('.ref-row'); const kind = row.dataset.kind; const index = Number(row.dataset.index); const next = readDb(); const list = Array.isArray(next[kind]) ? next[kind] : []; const current = list[index]; if (!current) return
      if (kind === 'materials') { const name = String(row.querySelector('[data-field="name"]')?.value || '').trim(); if (!name) return; current.name = name }
      if (kind === 'positions') { const name = String(row.querySelector('[data-field="name"]')?.value || '').trim(); if (!name) return; current.name = name }
      list[index] = current; next[kind] = list; writeDb(next); renderReferenceManager(backdrop); backdrop.classList.add('open')
    }
  })
  backdrop.querySelectorAll('[data-ref-delete]').forEach(button => {
    button.onclick = () => {
      const row = button.closest('.ref-row'); const kind = row.dataset.kind; const index = Number(row.dataset.index); const next = readDb(); const list = Array.isArray(next[kind]) ? next[kind] : []; const item = list[index]; if (!item) return
      const id = String(item.id); const used = Array.isArray(next.packs) && next.packs.some(pack => String(kind === 'materials' ? pack.material : kind === 'boxes' ? pack.box : pack.position) === id)
      if (used) { alert(`${id} nelze smazat — je používáno existujícím pytlem.`); return }
      if (!confirm(`Smazat ${kind === 'boxes' ? 'box' : kind === 'positions' ? 'pozici' : 'surovinu'} ${id}?`)) return
      list.splice(index, 1); next[kind] = list; writeDb(next); renderReferenceManager(backdrop); backdrop.classList.add('open')
    }
  })
}

const managerStyle = document.createElement('style')
managerStyle.textContent = `
  .ref-manager { width:min(1100px,100%); max-height:min(900px,92vh); overflow:auto; }
  .ref-sections { display:grid; gap:12px; }
  .ref-section { border:1px solid hsl(var(--border)); border-radius:var(--radius); overflow:hidden; background:hsl(var(--card)); }
  .ref-section-head { display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border-bottom:1px solid hsl(var(--border)); background:hsl(var(--muted)/.28); }
  .ref-section-head span { font-size:9px; letter-spacing:.12em; font-weight:700; color:hsl(var(--muted-foreground)); }
  .ref-section-head h3 { margin:1px 0 0; font-size:14px; }
  .ref-table-head,.ref-row { display:grid; grid-template-columns:minmax(90px,.35fr) minmax(170px,1fr) auto; gap:8px; align-items:center; }
  .ref-table-head { padding:7px 10px; font-size:9px; color:hsl(var(--muted-foreground)); border-bottom:1px solid hsl(var(--border)); }
  .ref-row { padding:7px 10px; border-bottom:1px solid hsl(var(--border)); }
  .ref-row:last-child { border-bottom:0; }
  .ref-input { width:100%; min-width:0; height:32px; border:1px solid hsl(var(--input)); border-radius:var(--radius); background:hsl(var(--background)); color:hsl(var(--foreground)); padding:0 8px; outline:0; font-size:11px; }
  .ref-input[readonly] { opacity:.7; }
  .ref-actions { display:flex; gap:5px; }
  .ref-actions button,.ref-add-grid button { height:32px; border:1px solid hsl(var(--border)); border-radius:var(--radius); background:hsl(var(--secondary)); color:hsl(var(--secondary-foreground)); padding:0 9px; font-size:10px; cursor:pointer; }
  .ref-actions .ref-delete { color:hsl(var(--destructive)); }
  .ref-add-grid { display:grid; grid-template-columns:1fr 1fr auto; gap:8px; padding:9px 10px; border-top:1px solid hsl(var(--border)); background:hsl(var(--muted)/.15); }
  .ref-add-grid.single { grid-template-columns:1fr auto; }
  .ref-add-grid input { height:32px; border:1px solid hsl(var(--input)); border-radius:var(--radius); background:hsl(var(--background)); color:hsl(var(--foreground)); padding:0 8px; outline:0; font-size:11px; }
  .ref-mobile-label { display:none; }
  .ref-empty { padding:12px; color:hsl(var(--muted-foreground)); font-size:11px; }
  @media(max-width:720px){ .ref-table-head{display:none}.ref-row{grid-template-columns:1fr 1fr}.ref-mobile-label{display:block;font-size:9px;color:hsl(var(--muted-foreground));margin-bottom:3px}.ref-actions{grid-column:1/-1}.ref-add-grid,.ref-add-grid.single{grid-template-columns:1fr} }
`
document.head.appendChild(managerStyle)

function bindReferenceManager() {
  const opener = document.querySelector('.db-open-btn')
  const backdrop = document.querySelector('#dbBackdrop')
  if (!opener || !backdrop || opener.dataset.refManagerBound === '1') return
  const boundOpener = opener.cloneNode(true)
  opener.replaceWith(boundOpener)
  boundOpener.dataset.refManagerBound = '1'
  boundOpener.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); renderReferenceManager(backdrop); backdrop.classList.add('open') })
}

bindReferenceManager()
const dbButtonObserver = new MutationObserver(bindReferenceManager)
dbButtonObserver.observe(document.body, { childList:true, subtree:true })
