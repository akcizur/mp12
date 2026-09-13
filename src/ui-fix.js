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
  .settings-backdrop {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: none;
    place-items: center;
    padding: 16px;
    background: hsl(222.2 84% 4.9%/.72);
  }
  .settings-backdrop.open {
    display: grid;
  }
  .settings-modal {
    width: min(460px, 100%);
    background: hsl(var(--background));
    color: hsl(var(--foreground));
    border: 1px solid hsl(var(--border));
    border-radius: var(--radius);
    box-shadow: 0 25px 50px -12px hsl(0 0% 0%/.45);
    padding: 18px;
  }
  .settings-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }
  .settings-head h2 {
    margin: 0 0 4px;
    font-size: 20px;
  }
  .settings-head p {
    margin: 0;
    color: hsl(var(--muted-foreground));
    font-size: 12px;
  }
  .settings-close {
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
  .settings-actions #themeBtn {
    width: 100%;
    height: 38px;
    border: 1px solid hsl(var(--border));
    background: hsl(var(--secondary));
    color: hsl(var(--secondary-foreground));
    border-radius: var(--radius);
    padding: 0 12px;
  }
  .settings-actions .ghost-btn:hover,
  .settings-actions #themeBtn:hover {
    background: hsl(var(--accent));
    color: hsl(var(--accent-foreground));
  }
  .settings-divider {
    height: 1px;
    background: hsl(var(--border));
    margin: 4px 0;
  }
  @media (max-width: 820px) {
    .sidebar {
      padding: 16px 12px;
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
          <p>Import, export a vzhled aplikace.</p>
        </div>
        <button type="button" class="settings-close" id="settingsClose" aria-label="Zavřít">×</button>
      </div>
      <div class="settings-actions" id="settingsActions"></div>
    </section>
  `
  document.body.appendChild(backdrop)

  const actions = backdrop.querySelector('#settingsActions')
  actions.appendChild(importButton)
  actions.appendChild(exportButton)
  const divider = document.createElement('div')
  divider.className = 'settings-divider'
  actions.appendChild(divider)
  actions.appendChild(themeButton)

  const close = () => backdrop.classList.remove('open')
  const open = () => backdrop.classList.add('open')

  settingsButton.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    open()
  })
  backdrop.querySelector('#settingsClose').addEventListener('click', close)
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) close()
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close()
  })
}
