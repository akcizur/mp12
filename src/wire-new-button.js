const newButton = document.querySelector('#newBtn')

if (newButton) {
  newButton.type = 'button'
  newButton.addEventListener('click', (event) => {
    event.preventDefault()
    document.querySelector('#headAction')?.click()
  })
}
