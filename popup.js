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
      if (reply.devices[dev.deviceName].publicKey) {
        const li = document.createElement('li')
        const name = dev.deviceName
        const button = document.createElement('button')
        button.innerHTML = name
        li.appendChild(button)
        activate(li, name)
        ul.appendChild(li)
      }
    }
  })
})
