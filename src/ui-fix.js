const root = document.documentElement

const style = document.createElement('style')
style.textContent = `
  .sidebar {
    width: 100%;
    padding: 16px 12px;
  }
  .brand {
    padding: 2px 8px 20px;
  }
  .new-btn {
    margin: 0 4px 20px;
    width: calc(100% - 8px);
    padding: 0 10px;
  }
  .nav-label {
    padding: 0 10px 8px;
  }
  .nav-item {
    padding: 0 10px;
  }
  .ghost-btn {
    padding: 0 10px;
  }
  .sidebar-foot {
    gap: 5px;
  }
  .sidebar-foot small {
    padding: 8px 10px 0;
  }
  .settings-btn {
    width: 100%;
    height: 34px;
    border: 0;
    border-radius: var(--radius);
    background: transparent;
    color: hsl(var(--muted-foreground));
    text-align: left;
    padding: 0 10px;
    font: inherit;
    cursor: pointer;
  }
  .settings-btn:hover {
    background: hsl(var(--accent));
    color: hsl(var(--accent-foreground));
  }
  .settings-backdrop,
  .db-backdrop {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: none;
    place-items: center;
    padding: 16px;
    background: hsl(222.2 84% 4.9%/.72);
  }
  .settings-backdrop.open,
  .db-backdrop.open {
    display: grid;
  }
  .settings-modal,
  .db-modal {
    width: min(460px, 100%);
    background: hsl(var(--background));
    color: hsl(var(--foreground));
    border: 1px solid hsl(var(--border));
    border-radius: var(--radius);
    box-shadow: 0 25px 50px -12px hsl(0 0% 0%/.45);
    padding: 18px;
  }
  .db-modal {
    width: min(760px, 100%);
  }
  .settings-head,
  .db-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }
  .settings-head h2,
  .db-head h2 {
    margin: 0 0 4px;
    font-size: 20px;
  }
  .settings-head p,
  .db-head p {
    margin: 0;
    color: hsl(var(--muted-foreground));
    font-size: 12px;
  }
  .settings-close,
  .db-close {
    width: 34px;
    height: 34px;
    border: 1px solid hsl(var(--border));
    border-radius: var(--radius);
    background: transparent;
    color: hsl(var(--foreground));
    cursor: pointer;
  }
  .settings-actions {
    display: grid;
    gap: 7px;
  }
  .settings-actions .ghost-btn,
  .settings-actions #themeBtn,
  .settings-actions .db-open-btn {
    width: 100%;
    height: 38px;
    border: 1px solid hsl(var(--border));
    background: hsl(var(--secondary));
    color: hsl(var(--secondary-foreground));
    border-radius: var(--radius);
    padding: 0 12px;
    text-align: left;
  }
  .settings-actions .ghost-btn:hover,
  .settings-actions #themeBtn:hover,
  .settings-actions .db-open-btn:hover {
    background: hsl(var(--accent));
    color: hsl(var(--accent-foreground));
  }
  .settings-divider {
    height: 1px;
    background: hsl(var(--border));
    margin: 4px 0;
  }
  .db-note {
    margin: 0 0 14px;
    padding: 10px 12px;
    border: 1px solid hsl(var(--border));
    background: hsl(var(--muted)/.35);
    border-radius: var(--radius);
    color: hsl(var(--muted-foreground));
    font-size: 11px;
  }
  .db-sections {
    display: grid;
    grid-template-columns: 1.4fr .8fr 1fr;
    gap: 10px;
  }
  .db-section {
    min-width: 0;
    border: 1px solid hsl(var(--border));
    border-radius: var(--radius);
    overflow: hidden;
    background: hsl(var(--card));
  }
  .db-section h3 {
    margin: 0;
    padding: 9px 10px;
    border-bottom: 1px solid hsl(var(--border));
    background: hsl(var(--muted)/.35);
    font-size: 11px;
  }
  .db-list {
    max-height: 260px;
    overflow: auto;
  }
  .db-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 10px;
    border-bottom: 1px solid hsl(var(--border));
    font-size: 11px;
  }
  .db-row:last-child { border-bottom: 0; }
  .db-row b { font-family: ui-monospace,SFMono-Regular,Menlo,monospace; font-size: 10px; }
  .db-row span { color: hsl(var(--muted-foreground)); text-align: right; }
  .reference-select.invalid-reference {
    border-color: hsl(var(--destructive));
  }
  .reference-warning {
    color: hsl(var(--destructive));
    font-size: 10px;
  }
  @media (max-width: 820px) {
    .sidebar {
      padding: 16px 12px;
    }
    .db-sections {
      grid-template-columns: 1fr;
    }
  }
`
document.head.appendChild(style)

function setTheme(theme) {
  const next = theme === 'light' ? 'light' : 'dark'
  localStorage.setItem('mp12-theme', next)
  root.dataset.theme = next
  root.classList.toggle('dark', next === 'dark')
  root.classList.toggle('light', next === 'light')

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = next === 'dark' ? '#09090b' : '#ffffff'
}

setTheme(localStorage.getItem('mp12-theme') || 'dark')

const originalThemeButton = document.querySelector('#themeBtn')
if (originalThemeButton) {
  const themeButton = originalThemeButton.cloneNode(true)
  originalThemeButton.replaceWith(themeButton)
  themeButton.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()
    const current = root.classList.contains('dark') ? 'dark' : 'light'
    setTheme(current === 'dark' ? 'light' : 'dark')
  })
}

const sidebarFoot = document.querySelector('.sidebar-foot')
const importButton = document.querySelector('#importBtn')
const exportButton = document.querySelector('#exportBtn')
const themeButton = document.querySelector('#themeBtn')

if (sidebarFoot && importButton && exportButton && themeButton) {
  const settingsButton = document.createElement('button')
  settingsButton.type = 'button'
  settingsButton.id = 'settingsBtn'
  settingsButton.className = 'settings-btn'
  settingsButton.textContent = '⚙ Nastavení'

  sidebarFoot.insertBefore(settingsButton, sidebarFoot.firstChild)
  importButton.remove()
  exportButton.remove()
  themeButton.remove()

  const backdrop = document.createElement('div')
  backdrop.id = 'settingsBackdrop'
  backdrop.className = 'settings-backdrop'
  backdrop.innerHTML = `
    <section class="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
      <div class="settings-head">
        <div>
          <h2 id="settingsTitle">Nastavení</h2>
          <p>Import, export, vzhled a databázové číselníky.</p>
        </div>
        <button type="button" class="settings-close" id="settingsClose" aria-label="Zavřít">×</button>
      </div>
      <div class="settings-actions" id="settingsActions"></div>
    </section>
  `
  document.body.appendChild(backdrop)

  const actions = backdrop.querySelector('#settingsActions')
  const dbOpenButton = document.createElement('button')
  dbOpenButton.type = 'button'
  dbOpenButton.className = 'db-open-btn'
  dbOpenButton.textContent = 'Databáze / Číselníky'
  actions.appendChild(dbOpenButton)

  const divider = document.createElement('div')
  divider.className = 'settings-divider'
  actions.appendChild(divider)
  actions.appendChild(importButton)
  actions.appendChild(exportButton)
  const themeDivider = document.createElement('div')
  themeDivider.className = 'settings-divider'
  actions.appendChild(themeDivider)
  actions.appendChild(themeButton)

  const dbBackdrop = document.createElement('div')
  dbBackdrop.id = 'dbBackdrop'
  dbBackdrop.className = 'db-backdrop'
  document.body.appendChild(dbBackdrop)

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>\"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;' }[char]))
  }

  function readDb() {
    try {
      const parsed = JSON.parse(localStorage.getItem('mp12-inventory-v4') || 'null')
      return parsed && typeof parsed === 'object' ? parsed : { materials: [], boxes: [], positions: [] }
    } catch {
      return { materials: [], boxes: [], positions: [] }
    }
  }

  function renderDbModal() {
    const db = readDb()
    const materials = Array.isArray(db.materials) ? db.materials : []
    const boxes = Array.isArray(db.boxes) ? db.boxes : []
    const positions = Array.isArray(db.positions) ? db.positions : []
    dbBackdrop.innerHTML = `
      <section class="db-modal" role="dialog" aria-modal="true" aria-labelledby="dbTitle">
        <div class="db-head">
          <div>
            <h2 id="dbTitle">DB / Číselníky</h2>
            <p>Neměnná referenční data používaná formuláři skladu.</p>
          </div>
          <button type="button" class="db-close" id="dbClose" aria-label="Zavřít">×</button>
        </div>
        <p class="db-note">ID surovin, Box ID a Pozice jsou pouze referenční hodnoty. V příjmu a přesunu se vybírají ze seznamů; nové hodnoty se automaticky nevytvářejí.</p>
        <div class="db-sections">
          <section class="db-section"><h3>Suroviny · ${materials.length}</h3><div class="db-list">${materials.map(m=>`<div class="db-row"><b>${escapeHtml(m.id)}</b><span>${escapeHtml(m.name)}</span></div>`).join('') || '<div class="db-row"><span>Prázdné</span></div>'}</div></section>
          <section class="db-section"><h3>Boxy · ${boxes.length}</h3><div class="db-list">${boxes.map(b=>`<div class="db-row"><b>${escapeHtml(b.id)}</b></div>`).join('') || '<div class="db-row"><span>Prázdné</span></div>'}</div></section>
          <section class="db-section"><h3>Pozice · ${positions.length}</h3><div class="db-list">${positions.map(p=>`<div class="db-row"><b>${escapeHtml(p.id)}</b></div>`).join('') || '<div class="db-row"><span>Prázdné</span></div>'}</div></section>
        </div>
      </section>
    `
    dbBackdrop.classList.add('open')
    dbBackdrop.querySelector('#dbClose').addEventListener('click', () => dbBackdrop.classList.remove('open'))
  }

  const closeSettings = () => backdrop.classList.remove('open')
  const openSettings = () => backdrop.classList.add('open')

  settingsButton.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    openSettings()
  })
  dbOpenButton.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    renderDbModal()
  })
  backdrop.querySelector('#settingsClose').addEventListener('click', closeSettings)
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) closeSettings()
  })
  dbBackdrop.addEventListener('click', (event) => {
    if (event.target === dbBackdrop) dbBackdrop.classList.remove('open')
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      dbBackdrop.classList.remove('open')
      closeSettings()
    }
  })
}

function getReferenceData() {
  try {
    const data = JSON.parse(localStorage.getItem('mp12-inventory-v4') || 'null') || {}
    return {
      materials: Array.isArray(data.materials) ? data.materials : [],
      boxes: Array.isArray(data.boxes) ? data.boxes : [],
      positions: Array.isArray(data.positions) ? data.positions : []
    }
  } catch {
    return { materials: [], boxes: [], positions: [] }
  }
}

function replaceWithReferenceSelect(input, items, label) {
  if (!input || input.dataset.referenceSelect === '1') return
  const value = String(input.value || '').trim()
  const select = document.createElement('select')
  select.name = input.name
  select.className = `${input.className || ''} reference-select`.trim()
  select.required = input.required
  select.disabled = input.disabled
  select.dataset.referenceSelect = '1'

  const placeholder = document.createElement('option')
  placeholder.value = ''
  placeholder.textContent = `Vyberte ${label}`
  placeholder.disabled = true
  placeholder.selected = !value
  select.appendChild(placeholder)

  const values = items.map(item => typeof item === 'string' ? item : item.id).filter(Boolean).map(String)
  const validValue = values.includes(value)

  if (value && !validValue) {
    const invalid = document.createElement('option')
    invalid.value = ''
    invalid.textContent = `Neplatné: ${value} — vyberte z DB`
    invalid.disabled = true
    invalid.selected = true
    select.appendChild(invalid)
    select.classList.add('invalid-reference')
  }

  values.forEach(id => {
    const option = document.createElement('option')
    option.value = id
    option.textContent = id
    if (id === value && validValue) option.selected = true
    select.appendChild(option)
  })

  input.replaceWith(select)

  if (!validValue && value) {
    const note = document.createElement('small')
    note.className = 'reference-warning'
    note.textContent = `Původní ${label} „${value}“ není v referenční DB.`
    select.insertAdjacentElement('afterend', note)
  }
}

function normalizeReferenceInputs(rootNode = document) {
  const data = getReferenceData()
  rootNode.querySelectorAll('input[name="box"]').forEach(input => replaceWithReferenceSelect(input, data.boxes, 'box'))
  rootNode.querySelectorAll('input[name="position"]').forEach(input => replaceWithReferenceSelect(input, data.positions, 'pozici'))
}

const referenceObserver = new MutationObserver(() => normalizeReferenceInputs(document))
referenceObserver.observe(document.body, { childList: true, subtree: true })
normalizeReferenceInputs(document)
