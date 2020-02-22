// code to send the clipboard to another machine

/* global chrome, copyclipper, crypto */

var myDevice = ''

const ENCRYPTION_TYPE = 'RSA-OAEP'
const ENCRYPTION_HASH = 'SHA-256'
const RSA_HASHED_IMPORT_PARAMS = {
  name: ENCRYPTION_TYPE,
  hash: { name: ENCRYPTION_HASH }
}

function updateDevices () {
  chrome.sessions.getDevices(function (devices) {
    chrome.storage.sync.get('devices', function (reply) {
      const devicesStorage = reply.devices || {}
      let allDevices = Object.keys(devicesStorage)
      for (const dev of devices) {
        const name = dev.deviceName
        if (!devicesStorage[name]) {
          devicesStorage[name] = {}
        }
        allDevices = allDevices.filter((x) => x !== name)
      }
      chrome.storage.sync.set({ devices: devicesStorage })
      if (allDevices.length === 1) {
        myDevice = allDevices[0]
        if (!devicesStorage[myDevice].publicKey) {
          generatePublicPrivateKeys(devicesStorage)
        }
      } else {
        console.log('Failed to find myDevice:' + JSON.stringify(allDevices))
      }
    })
  })
}

function generatePublicPrivateKeys (devices) {
  window.crypto.subtle.generateKey(
    {
      name: ENCRYPTION_TYPE,
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: ENCRYPTION_HASH
    },
    true,
    ['encrypt', 'decrypt']
  ).then((keyPair) => {
    crypto.subtle.exportKey('jwk', keyPair.publicKey).then(function (key) {
      devices[myDevice].publicKey = key
      chrome.storage.sync.set({ devices: devices })
    })
    crypto.subtle.exportKey('jwk', keyPair.privateKey).then(function (key) {
      chrome.storage.local.set({ privateKey: key })
    })
  })
}

function sendMessage (recipient) {
  const message = copyclipper.getClipboardContents()

  chrome.storage.sync.get('devices', function (reply) {
    const jwkKey = reply.devices[recipient].publicKey
    crypto.subtle.importKey(
      'jwk', jwkKey, RSA_HASHED_IMPORT_PARAMS, jwkKey.ext, jwkKey.key_ops
    ).then(function (publicKey) {
      window.crypto.subtle.encrypt(
        {
          name: ENCRYPTION_TYPE
        },
        publicKey,
        new TextEncoder().encode(message)
      ).then(function (cipherbytes) {
        const ciphertext = Array.from(new Uint8Array(cipherbytes))
        const syncSet = { sent: { device: recipient, from: myDevice, message: ciphertext } }
        chrome.storage.sync.set(syncSet)
      })
    })
  })
}

function receiveMessage (sent) {
  if (myDevice !== sent.device) {
    console.log('I (' + myDevice + ') am not the message recipient: ' + sent.device)
    return
  }
  // clear the message as soon as possible.
  chrome.storage.sync.remove('sent')

  chrome.storage.local.get('privateKey', function (reply) {
    const jwkKey = reply.privateKey
    crypto.subtle.importKey(
      'jwk', jwkKey, RSA_HASHED_IMPORT_PARAMS, jwkKey.ext, jwkKey.key_ops
    ).then(function (privateKey) {
      window.crypto.subtle.decrypt(
        {
          name: ENCRYPTION_TYPE
        },
        privateKey,
        Uint8Array.from(sent.message)
      ).then(function (decrypted) {
        const newClipboard = new TextDecoder().decode(decrypted)
        console.log('decoded: ' + newClipboard)
        copyclipper.remoteSetClipboard(newClipboard, sent.from)
      }, function (msg) {
        console.log('ERROR:', msg)
      })
    })
  })
}

// Initialization and Listeners

updateDevices()

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.send) {
    sendMessage(request.send)
  }
})

chrome.storage.onChanged.addListener(function (changed, area) {
  if (area === 'sync' && changed.devices) {
    console.log("'devices' changed in chrome.storage.sync")
    updateDevices()
  }

  if (area === 'sync' && changed.sent && changed.sent.newValue) {
    console.log("'sent' changed in chrome.storage.sync")
    receiveMessage(changed.sent.newValue)
  }
})
