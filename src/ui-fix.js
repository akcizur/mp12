const root = document.documentElement
const sidebarStyle = document.createElement('style')
sidebarStyle.textContent = `
  .sidebar { padding: 12px 8px; }
  .brand { padding: 4px 7px 16px; }
  .new-btn { margin: 0 2px 16px; padding: 0 10px; }
  .nav-label { padding-left: 8px; padding-right: 8px; }
  .nav-item { padding-left: 8px; padding-right: 8px; }
  .ghost-btn { padding-left: 8px; padding-right: 8px; }
  .sidebar-foot small { padding-left: 8px; padding-right: 8px; }
  @media (max-width: 820px) { .sidebar { padding: 12px 8px; } }
`
document.head.appendChild(sidebarStyle)

function applyTheme(theme) {
  const next = theme === 'light' ? 'light' : 'dark'
  localStorage.setItem('mp12-theme', next)
  root.classList.toggle('dark', next === 'dark')
  root.dataset.theme = next
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = next === 'dark' ? '#09090b' : '#ffffff'
}

applyTheme(localStorage.getItem('mp12-theme') || 'dark')

const themeButton = document.querySelector('#themeBtn')
if (themeButton) {
  themeButton.onclick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    applyTheme(root.classList.contains('dark') ? 'light' : 'dark')
  }
}
