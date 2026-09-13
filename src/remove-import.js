function removeImportUI() {
  document.querySelector('#importBtn')?.remove()
  document.querySelector('#csvFile')?.remove()
  document.querySelector('#settingsActions #importBtn')?.remove()
}

removeImportUI()

const importObserver = new MutationObserver(removeImportUI)
importObserver.observe(document.body, { childList: true, subtree: true })
