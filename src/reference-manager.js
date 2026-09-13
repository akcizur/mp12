const DB_KEY = 'mp12-inventory-v4'

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]))

function readDb() {
  try {
    const data = JSON.parse(localStorage.getItem(DB_KEY) || 'null')
    return data && typeof data === 'object' ? data : { materials: [], boxes: [], positions: [], packs: [] }
  } catch {
    return { materials: [], boxes: [], positions: [], packs: [] }
  }
}

function writeDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
  document.dispatchEvent(new Event('mp12:db-changed'))
}

function renderReferenceManager(backdrop) {
  const db = readDb()
  const materials = Array.isArray(db.materials) ? db.materials : []
  const boxes = Array.isArray(db.boxes) ? db.boxes : []
  const positions = Array.isArray(db.positions) ? db.positions : []

  const section = (kind, title, rows, columns) => {
    const body = rows.length
      ? rows.map((row, index) => `
          <div class="ref-row" data-kind="${kind}" data-index="${index}">
            ${columns.map(column => `<input class="ref-input ${column.mono ? 'mono' : ''}" data-field="${column.key}" value="${esc(row[column.key])}" aria-label="${esc(column.label)}">`).join('')}
            <div class="ref-actions">
              <button type="button" class="ref-save" data-ref-save>Uložit</button>
              <button type="button" class="ref-delete" data-ref-delete>Smazat</button>
            </div>
          </div>`).join('')
      : `<div class="ref-empty">Prázdný číselník.</div>`

    const form = kind === 'materials'
      ? `<div class="ref-add-grid"><input data-add-id placeholder="ID, např. S-006"><input data-add-name placeholder="Název suroviny"><input data-add-min type="number" min="0" step="0.01" placeholder="Minimum (g)"><button type="button" data-ref-add>Přidat</button></div>`
      : `<div class="ref-add-grid single"><input data-add-id placeholder="ID"><button type="button" data-ref-add>Přidat</button></div>`

    return `<section class="ref-section">
      <header class="ref-section-head"><div><span>ČÍSELNÍK</span><h3>${title}</h3></div><b>${rows.length}</b></header>
      <div class="ref-table-head">${columns.map(c => `<span>${c.label}</span>`).join('')}<span></span></div>
      <div class="ref-list">${body}</div>
      ${form}
    </section>`
  }

  backdrop.innerHTML = `
    <section class="db-modal ref-manager" role="dialog" aria-modal="true" aria-labelledby="dbTitle">
      <div class="db-head">
        <div>
          <h2 id="dbTitle">DB / Číselníky</h2>
          <p>Přímá správa referenčních dat. Změny se ukládají okamžitě do lokální DB.</p>
        </div>
        <button type="button" class="db-close" id="dbClose" aria-label="Zavřít">×</button>
      </div>
      <p class="db-note">Číselníky jsou zdroj hodnot pro všechny formuláře. ID lze měnit; vazby existujících pytlů se při změně ID automaticky aktualizují. Smazání použité položky je blokováno.</p>
      <div class="ref-sections">
        ${section('materials','Suroviny',materials,[{key:'id',label:'ID',mono:true},{key:'name',label:'Název'},{key:'min',label:'Min. g'}])}
        ${section('boxes','Boxy',boxes,[{key:'id',label:'ID',mono:true}])}
        ${section('positions','Pozice',positions,[{key:'id',label:'ID',mono:true}])}
      </div>
    </section>`

  const close = () => backdrop.classList.remove('open')
  backdrop.querySelector('#dbClose').onclick = close

  backdrop.querySelectorAll('[data-ref-add]').forEach((button) => {
    button.onclick = () => {
      const sectionNode = button.closest('.ref-section')
      const heading = sectionNode.querySelector('h3')?.textContent || ''
      const addId = String(sectionNode.querySelector('[data-add-id]')?.value || '').trim()
      if (!addId) return

      const next = readDb()
      const targetKind = heading === 'Suroviny' ? 'materials' : heading === 'Boxy' ? 'boxes' : 'positions'
      const list = Array.isArray(next[targetKind]) ? next[targetKind] : []
      if (list.some(item => String(item.id) === addId)) {
        alert(`ID ${addId} už existuje.`)
        return
      }

      if (targetKind === 'materials') {
        const name = String(sectionNode.querySelector('[data-add-name]')?.value || '').trim()
        if (!name) return
        list.push({ id: addId, name, min: Number(sectionNode.querySelector('[data-add-min]')?.value || 0) || 0 })
      } else {
        list.push({ id: addId })
      }
      next[targetKind] = list
      writeDb(next)
      renderReferenceManager(backdrop)
      backdrop.classList.add('open')
    }
  })

  backdrop.querySelectorAll('[data-ref-save]').forEach((button) => {
    button.onclick = () => {
      const row = button.closest('.ref-row')
      const kind = row.dataset.kind
      const index = Number(row.dataset.index)
      const next = readDb()
      const list = Array.isArray(next[kind]) ? next[kind] : []
      const current = list[index]
      if (!current) return

      const newId = String(row.querySelector('[data-field="id"]')?.value || '').trim()
      if (!newId) return
      if (list.some((item, itemIndex) => itemIndex !== index && String(item.id) === newId)) {
        alert(`ID ${newId} už existuje.`)
        return
      }

      const oldId = String(current.id)
      if (kind === 'materials') {
        const newName = String(row.querySelector('[data-field="name"]')?.value || '').trim()
        if (!newName) return
        current.name = newName
        current.min = Number(row.querySelector('[data-field="min"]')?.value || 0) || 0
        if (oldId !== newId && Array.isArray(next.packs)) next.packs.forEach(pack => { if (String(pack.material) === oldId) pack.material = newId })
      }
      if (kind === 'boxes' && oldId !== newId && Array.isArray(next.packs)) next.packs.forEach(pack => { if (String(pack.box) === oldId) pack.box = newId })
      if (kind === 'positions' && oldId !== newId && Array.isArray(next.packs)) next.packs.forEach(pack => { if (String(pack.position) === oldId) pack.position = newId })
      current.id = newId
      list[index] = current
      next[kind] = list
      writeDb(next)
      renderReferenceManager(backdrop)
      backdrop.classList.add('open')
    }
  })

  backdrop.querySelectorAll('[data-ref-delete]').forEach((button) => {
    button.onclick = () => {
      const row = button.closest('.ref-row')
      const kind = row.dataset.kind
      const index = Number(row.dataset.index)
      const next = readDb()
      const list = Array.isArray(next[kind]) ? next[kind] : []
      const item = list[index]
      if (!item) return
      const id = String(item.id)
      const used = Array.isArray(next.packs) && next.packs.some(pack => String(kind === 'materials' ? pack.material : kind === 'boxes' ? pack.box : pack.position) === id)
      if (used) {
        alert(`${id} nelze smazat — je používáno existujícím pytlem.`)
        return
      }
      if (!confirm(`Smazat ${id}?`)) return
      list.splice(index, 1)
      next[kind] = list
      writeDb(next)
      renderReferenceManager(backdrop)
      backdrop.classList.add('open')
    }
  })
}

const managerStyle = document.createElement('style')
managerStyle.textContent = `
  .ref-manager { width: min(1100px, 100%); max-height: min(900px, 92vh); overflow: auto; }
  .ref-sections { display: grid; gap: 12px; }
  .ref-section { border: 1px solid hsl(var(--border)); border-radius: var(--radius); overflow: hidden; background: hsl(var(--card)); }
  .ref-section-head { display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border-bottom:1px solid hsl(var(--border)); background:hsl(var(--muted)/.28); }
  .ref-section-head span { font-size:9px; letter-spacing:.12em; font-weight:700; color:hsl(var(--muted-foreground)); }
  .ref-section-head h3 { margin:1px 0 0; font-size:14px; }
  .ref-section-head b { font:600 11px ui-monospace,SFMono-Regular,Menlo,monospace; color:hsl(var(--muted-foreground)); }
  .ref-table-head,.ref-row { display:grid; grid-template-columns: minmax(100px,.35fr) minmax(160px,1fr) minmax(100px,.4fr) auto; gap:8px; align-items:center; }
  .ref-table-head { padding:7px 10px; font-size:9px; color:hsl(var(--muted-foreground)); border-bottom:1px solid hsl(var(--border)); }
  .ref-row { padding:7px 10px; border-bottom:1px solid hsl(var(--border)); }
  .ref-row:last-child { border-bottom:0; }
  .ref-input { width:100%; min-width:0; height:32px; border:1px solid hsl(var(--input)); border-radius:var(--radius); background:hsl(var(--background)); color:hsl(var(--foreground)); padding:0 8px; outline:0; font-size:11px; }
  .ref-input:focus { border-color:hsl(var(--ring)); box-shadow:0 0 0 2px hsl(var(--ring)/.12); }
  .ref-actions { display:flex; gap:5px; }
  .ref-actions button,.ref-add-grid button { height:32px; border:1px solid hsl(var(--border)); border-radius:var(--radius); background:hsl(var(--secondary)); color:hsl(var(--secondary-foreground)); padding:0 9px; font-size:10px; cursor:pointer; }
  .ref-actions .ref-delete { color:hsl(var(--destructive)); }
  .ref-add-grid { display:grid; grid-template-columns:minmax(100px,.35fr) minmax(160px,1fr) minmax(100px,.4fr) auto; gap:8px; padding:9px 10px; border-top:1px solid hsl(var(--border)); background:hsl(var(--muted)/.15); }
  .ref-add-grid.single { grid-template-columns:1fr auto; }
  .ref-add-grid input { height:32px; border:1px solid hsl(var(--input)); border-radius:var(--radius); background:hsl(var(--background)); color:hsl(var(--foreground)); padding:0 8px; outline:0; font-size:11px; }
  .ref-empty { padding:12px; color:hsl(var(--muted-foreground)); font-size:11px; }
  @media(max-width:720px){ .ref-table-head { display:none; } .ref-row { grid-template-columns:1fr 1fr; } .ref-actions { grid-column:1 / -1; } .ref-add-grid,.ref-add-grid.single { grid-template-columns:1fr; } }
`
document.head.appendChild(managerStyle)

function bindReferenceManager() {
  const opener = document.querySelector('.db-open-btn')
  const backdrop = document.querySelector('#dbBackdrop')
  if (!opener || !backdrop || opener.dataset.refManagerBound === '1') return

  const boundOpener = opener.cloneNode(true)
  opener.replaceWith(boundOpener)
  boundOpener.dataset.refManagerBound = '1'
  boundOpener.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    renderReferenceManager(backdrop)
    backdrop.classList.add('open')
  })
}

bindReferenceManager()
const dbButtonObserver = new MutationObserver(bindReferenceManager)
dbButtonObserver.observe(document.body, { childList:true, subtree:true })
