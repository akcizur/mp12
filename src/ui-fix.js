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
  .sidebar-foot small {
    padding: 8px 10px 0;
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
