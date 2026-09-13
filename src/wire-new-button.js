const newButton = document.querySelector('#newBtn')
if (newButton) {
  newButton.type = 'button'
  newButton.addEventListener('click', (event) => {
    event.preventDefault()
    document.querySelector('#headAction')?.click()
  })
}

const warehouseStyle = document.createElement('style')
warehouseStyle.textContent = `
  .warehouse-v2 { padding: 14px; display: grid; gap: 14px; }
  .warehouse-position-section { border: 1px solid hsl(var(--border)); border-radius: var(--radius); background: hsl(var(--background)); overflow: hidden; }
  .warehouse-position-head { min-height: 52px; padding: 10px 13px; display:flex; align-items:center; justify-content:space-between; gap:12px; border-bottom:1px solid hsl(var(--border)); background:hsl(var(--muted)/.28); }
  .warehouse-position-kicker,.warehouse-box-kicker { display:block; color:hsl(var(--muted-foreground)); font-size:9px; font-weight:700; letter-spacing:.12em; }
  .warehouse-position-head h2 { margin:1px 0 0; font-size:17px; letter-spacing:-.02em; }
  .warehouse-position-meta,.warehouse-box-count { color:hsl(var(--muted-foreground)); font-size:10px; white-space:nowrap; }
  .warehouse-box-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:10px; padding:10px; }
  .warehouse-box-card { min-width:0; border:1px solid hsl(var(--border)); border-radius:var(--radius); background:hsl(var(--card)); overflow:hidden; }
  .warehouse-box-head { min-height:48px; padding:9px 11px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid hsl(var(--border)); }
  .warehouse-box-head strong { display:block; margin-top:1px; font:700 15px ui-monospace,SFMono-Regular,Menlo,monospace; }
  .warehouse-pack-list { display:grid; }
  .warehouse-pack-row { display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:9px; min-height:42px; padding:8px 10px; border-bottom:1px solid hsl(var(--border)); }
  .warehouse-pack-row:last-child { border-bottom:0; }
  .warehouse-pack-id { font:700 11px ui-monospace,SFMono-Regular,Menlo,monospace; white-space:nowrap; }
  .warehouse-pack-name { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px; }
  .warehouse-pack-qty { color:hsl(var(--muted-foreground)); font:10px ui-monospace,SFMono-Regular,Menlo,monospace; white-space:nowrap; }
  .warehouse-empty { padding:18px 12px; color:hsl(var(--muted-foreground)); font-size:11px; text-align:center; }
  @media (max-width:720px) { .warehouse-box-grid { grid-template-columns:1fr; } .warehouse-pack-row { grid-template-columns:1fr auto; } .warehouse-pack-name { grid-column:1/-1; grid-row:2; } }
`
document.head.appendChild(warehouseStyle)

const WAREHOUSE_DB_KEY = 'mp12-inventory-v4'
function warehouseEscape(value) { return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char])) }

function renderWarehouseHierarchy() {
  const page = document.querySelector('.page-layer.current')
  const card = page?.querySelector('.warehouse-card')
  if (!page || !card || page.dataset.warehouseView === 'v2') return
  let data = {}
  try { data = JSON.parse(localStorage.getItem(WAREHOUSE_DB_KEY) || 'null') || {} } catch {}

  const materials = Array.isArray(data.materials) ? data.materials : []
  const positions = Array.isArray(data.positions) ? data.positions.map(item => String(item.id)) : []
  const packs = Array.isArray(data.packs) ? data.packs.filter(pack => Number(pack.qty) > 0) : []
  const materialNames = new Map(materials.map(item => [String(item.id), item.name]))
  const effectivePositions = positions.length ? positions : [...new Set(packs.map(pack => String(pack.position || '')).filter(Boolean))]

  const sections = effectivePositions.map(position => {
    const positionPacks = packs.filter(pack => String(pack.position || '') === position)
    const boxIds = [...new Set(positionPacks.map(pack => String(pack.box || '')).filter(Boolean))]
    const boxes = boxIds.length ? boxIds.map(boxId => {
      const boxPacks = positionPacks.filter(pack => String(pack.box || '') === boxId)
      return `<article class="warehouse-box-card">
        <header class="warehouse-box-head"><div><span class="warehouse-box-kicker">BOX</span><strong>${warehouseEscape(boxId)}</strong></div><span class="warehouse-box-count">${boxPacks.length} ${boxPacks.length === 1 ? 'pytel' : 'pytlů'}</span></header>
        <div class="warehouse-pack-list">${boxPacks.map(pack => `<div class="warehouse-pack-row"><span class="warehouse-pack-id">${warehouseEscape(pack.id)}</span><span class="warehouse-pack-name">${warehouseEscape(materialNames.get(String(pack.material)) || pack.material || 'Neznámá surovina')}</span><span class="warehouse-pack-qty">${Number(pack.qty || 0).toLocaleString('cs-CZ',{maximumFractionDigits:2})} g</span></div>`).join('')}</div>
      </article>`
    }).join('') : '<div class="warehouse-empty">V této pozici nejsou žádné boxy.</div>'

    return `<section class="warehouse-position-section"><header class="warehouse-position-head"><div><span class="warehouse-position-kicker">POZICE</span><h2>${warehouseEscape(position)}</h2></div><span class="warehouse-position-meta">${boxIds.length} ${boxIds.length === 1 ? 'box' : 'boxů'}</span></header><div class="warehouse-box-grid">${boxes}</div></section>`
  }).join('')

  card.outerHTML = `<div class="warehouse-card warehouse-v2">${sections || '<div class="warehouse-empty">Žádné skladové pozice.</div>'}</div>`
  page.dataset.warehouseView = 'v2'
}

const warehouseObserver = new MutationObserver(renderWarehouseHierarchy)
warehouseObserver.observe(document.body, { childList:true, subtree:true })
renderWarehouseHierarchy()
