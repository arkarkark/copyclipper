/* global chrome, window */

function sendTo (name) {
  chrome.runtime.sendMessage({ send: name })
  window.close()
}

function activate (li, name) {
  li.addEventListener('click', () => { sendTo(name) })
}

const ul = document.getElementById('devices')

chrome.storage.sync.get('devices', function (reply) {
  chrome.sessions.getDevices(function (devices) {
    for (const dev of devices) {
      const li = document.createElement('li')
      const name = dev.deviceName
      li.innerHTML = name
      activate(li, name)
      ul.appendChild(li)
    }
  })
})
