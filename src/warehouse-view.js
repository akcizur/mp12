const DB_KEY = 'mp12-inventory-v4'

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]))

function readDb() {
  try {
    const data = JSON.parse(localStorage.getItem(DB_KEY) || 'null') || {}
    return {
      materials: Array.isArray(data.materials) ? data.materials : [],
      positions: Array.isArray(data.positions) ? data.positions : [],
      packs: Array.isArray(data.packs) ? data.packs : []
    }
  } catch {
    return { materials: [], positions: [], packs: [] }
  }
}

function renderWarehouse() {
  const page = document.querySelector('.page-layer.current')
  if (!page || !page.querySelector('.warehouse-card')) return
  if (page.dataset.warehouseView === 'v2') return

  const db = readDb()
  const packs = db.packs.filter((pack) => Number(pack.qty) > 0)
  const materialName = new Map(db.materials.map((item) => [String(item.id), item.name]))
  const positions = db.positions.length
    ? db.positions.map((item) => String(item.id))
    : [...new Set(packs.map((pack) => String(pack.position || '')).filter(Boolean))]

  const sectionHtml = positions.map((position) => {
    const positionPacks = packs.filter((pack) => String(pack.position || '') === position)
    const boxIds = [...new Set(positionPacks.map((pack) => String(pack.box || '')).filter(Boolean))]

    const boxesHtml = boxIds.length
      ? boxIds.map((boxId) => {
          const boxPacks = positionPacks.filter((pack) => String(pack.box || '') === boxId)
          return `<article class="warehouse-box-card">
            <header class="warehouse-box-head">
              <div>
                <span class="warehouse-box-kicker">BOX</span>
                <strong>${esc(boxId)}</strong>
              </div>
              <span class="warehouse-box-count">${boxPacks.length} ${boxPacks.length === 1 ? 'pytel' : 'pytlů'}</span>
            </header>
            <div class="warehouse-pack-list">
              ${boxPacks.map((pack) => `<div class="warehouse-pack-row">
                <span class="warehouse-pack-id">${esc(pack.id)}</span>
                <span class="warehouse-pack-name">${esc(materialName.get(String(pack.material)) || pack.material || 'Neznámá surovina')}</span>
                <span class="warehouse-pack-qty">${Number(pack.qty || 0).toLocaleString('cs-CZ', { maximumFractionDigits: 2 })} g</span>
              </div>`).join('')}
            </div>
          </article>`
        }).join('')
      : `<div class="warehouse-empty">V této pozici nejsou žádné boxy.</div>`

    return `<section class="warehouse-position-section">
      <header class="warehouse-position-head">
        <div>
          <span class="warehouse-position-kicker">POZICE</span>
          <h2>${esc(position)}</h2>
        </div>
        <span class="warehouse-position-meta">${boxIds.length} ${boxIds.length === 1 ? 'box' : 'boxů'}</span>
      </header>
      <div class="warehouse-box-grid">${boxesHtml}</div>
    </section>`
  }).join('')

  page.querySelector('.warehouse-card').outerHTML = `<div class="warehouse-card warehouse-v2">
    ${sectionHtml || '<div class="warehouse-empty">Žádné skladové pozice.</div>'}
  </div>`
  page.dataset.warehouseView = 'v2'
}

const warehouseObserver = new MutationObserver(() => {
  if (document.querySelector('.page-layer.current .warehouse-card')) renderWarehouse()
})
warehouseObserver.observe(document.body, { childList: true, subtree: true })

renderWarehouse()
