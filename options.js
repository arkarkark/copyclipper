// Copyright 2012 wtwf.com, All Rights Reserved.
// Created by: Alex K (wtwf.com)
/* global chrome */

var ccoptions = {}

var copyclipper = chrome.extension.getBackgroundPage().copyclipper

// TODO(ark) allow subscriptions to sets of patterns
// TODO(ark) turn the patterns area into rich text with color coding
// TODO(ark) display parsing errors

ccoptions.currentTab = 'patterns'

ccoptions.saveRegexes = function () {
  var tab = document.getElementById('regexes')
  chrome.storage.sync.set({ regexes: tab.value }, function () {
    copyclipper.restoreRegexes()

    // Update status to let user know options were saved.
    var status = document.getElementById('status')
    status.innerHTML = 'Saved.'
    setTimeout(function () {
      status.innerHTML = ''
    }, 750)
  })
}

// Restores select box state to saved value passed in
ccoptions.restoreRegexes = function (regexes) {
  if (!regexes) {
    return
  }
  var ta = document.getElementById('regexes')
  ta.value = regexes
}

ccoptions.addButtons = function (tr) {
  var td = document.createElement('td')
  var but = document.createElement('button')
  but.onclick = function () {
    ccoptions.removeRow(tr)
  }
  but.appendChild(document.createTextNode('X'))
  td.appendChild(but)
  tr.appendChild(td)
}

ccoptions.addRow = function (tr, pattern) {
  var td = document.createElement('td')
  var inp = document.createElement('input')
  inp.value = pattern.search.source
  inp.className = 'search'
  td.appendChild(inp)
  tr.appendChild(td)
  td = document.createElement('td')
  inp = document.createElement('input')
  inp.value = pattern.replace
  inp.className = 'replace'
  td.appendChild(inp)
  tr.appendChild(td)
  ccoptions.addButtons(tr)
}

ccoptions.getRow = function (tr) {
  var td = tr.childNodes[0]
  var inp = td.firstChild
  if (inp.nodeName !== 'INPUT') {
    return null
  }

  var search = {}
  search.source = inp.value
  search.global = false
  search.ignoreCase = false
  search.lastIndex = false
  search.multiline = false

  td = tr.childNodes[1]
  inp = td.firstChild
  var replace = inp.value

  return { search: search, replace: replace }
}

ccoptions.removeRow = function (tr) {
  tr.parentNode.removeChild(tr)
}

ccoptions.emptySearch = {
  global: false,
  ignoreCase: false,
  lastIndex: false,
  multiline: false,
  source: ''
}

ccoptions.add = function () {
  var tab = document.getElementById('patterns')
  var tr = document.createElement('tr')
  ccoptions.addRow(tr, { search: ccoptions.emptySearch, replace: '' })
  tab.appendChild(tr)
}

ccoptions.close = function () {
  // TODO(ark) warn if there are unsaved changes
  window.close()
}

ccoptions.selectTab = function (tabName) {
  // each tab is selected with a {tabName}Button and in {tabName}Container
  var tabs = ['patterns', 'testing']

  for (var i = 0; i < tabs.length; i++) {
    var button = document.getElementById(tabs[i] + 'Button').parentNode
    var container = document.getElementById(tabs[i] + 'Container')
    if (tabs[i] === tabName) {
      button.className = 'selected'
      container.style.display = 'block'
      ccoptions.currentTab = tabName
    } else {
      button.className = ''
      container.style.display = 'none'
    }
  }
}

ccoptions.test = function () {
  var input = document.getElementById('input').value
  var pat = copyclipper.decodeRegexes(document.getElementById('regexes').value)
  var output = copyclipper.replace(input, pat)
  document.getElementById('output').innerHTML = copyclipper.textToHtml(output)
}

ccoptions.intervalFunction = function () {
  switch (ccoptions.currentTab) {
  // case 'patterns': ccoptions.patternsInterval(); break;
    case 'testing': ccoptions.testingInterval(); break
  }
}

ccoptions.testingInterval = function () {
  var els = ['clipboardValue', 'clipboardValueOriginal']
  for (var i = 0; i < els.length; i++) {
    document.getElementById(els[i]).innerText = copyclipper[els[i]]
  }
}

ccoptions.onLoad = function () {
  copyclipper.restoreRegexes()
  chrome.storage.sync.get('regexes', function (reply) {
    ccoptions.restoreRegexes(reply.regexes)
  })
  function getEl (el) { return document.getElementById(el) };
  getEl('save').addEventListener('click', ccoptions.saveRegexes, true)
  getEl('close').addEventListener('click', ccoptions.close, true)
  getEl('patternsButton').addEventListener('click',
    function () { ccoptions.selectTab('patterns') }, true)
  getEl('testingButton').addEventListener('click',
    function () { ccoptions.selectTab('testing') }, true)

  getEl('input').addEventListener('keyup', ccoptions.test, true)
  getEl('regexes').addEventListener('keyup', ccoptions.test, true)

  var el = getEl('tests')
  for (var i = 0; i < el.childNodes.length; i++) {
    var t = el.childNodes[i]
    if (t.tagName === 'LI') {
      t.addEventListener('click', function (e) {
        copyclipper.setClipboardContents(e.target.innerText)
        copyclipper.copyclip()
      }, true)
    }
  }

  // put the clipboard into 'input'
  getEl('input').value = copyclipper.getClipboardContents()
  ccoptions.test()

  // ccoptions.selectTab('testing');
  ccoptions.intervalId = window.setInterval(ccoptions.intervalFunction, 1000)
}

window.addEventListener('DOMContentLoaded', ccoptions.onLoad, false)
