// Copyright 2012 wtwf.com, All Rights Reserved.
// Created by: Alex K (wtwf.com)

// TODO(ark) allow updating of patterns to batter ones.
// TODO(ark) we can expand short urls too!?
// TODO(ark) have a toolbar icon to turn this on and off
// TODO(ark) allow credit card looking numbers only for a short period of time?

// NOTODO(ark) should we do http://amzn.com/ASIN ? not until it supports https

// The icons are creative commons (non-commercial) licensed from:
// http://www.ilmarin.info/gallery/album128/scissors01

copyclipper = {};  // Namespace

/** search and replace regexes
 *  !search!replace!regex_options
 * remember you can use $1, $2 etc in the replace string
 */
copyclipper.DEFAULT_REGEXES = [
  '# Add all new patterns above this line.',
  '# Begin Default Patterns',
  '# If you don\'t want one of thise patterns to execute, add a # at the start',
  '!^(http.*)\\?feat=directlink$!$1!',  // picasaweb
  '!^(http.*)\\?source=rss$!$1!',  // sentinel
  '!^(http.*)\\?_r=1$!$1!',  // nytimes
  '!^(http.*)\\?utm_source=[^#]*!$1!',  // GA
  '!^http.*[/\.]youtube\..*[&?]v=([^&]*).*?(#t=.*)?$!https://youtu.be/$1$2!',
  '!^https?([a-z0-9:/.]*[/\.]amazon\.[^/]*/' +
    '(gp/product|([^/]*/)?dp)/[^/]*).*$!' +
    'https$1!',
  '!^http.*google.*search.*[?&]tbm=isch&q=([^&]*).*$!' +
    'https://www.google.com/search?tbm=isch&q=$1!',
  '!^(https?://www.ebay.com/itm/[^/]+/\d+).*!$1!',
  '# Uncomment this next line (remove the #) if you feel brave!',
  '#!/index\\.(php|s?html|asp)$!/!',
  '# End Default Patterns',
];

/** How long to wait before the Chrome notification disappears. */
copyclipper.NOTIFICATION_TIMEOUT = 4000;

/** Is an object empty.
 * @param {Object} obj the object to check.
 * @return {bool} true if object has properties.
 */
copyclipper.isEmpty = function(obj) {
  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      return false;
    }
  }
  return true;
};

copyclipper.restoreRegexes = function() {
  // try and get the data from chrome.storage.sync
  chrome.storage.sync.get('regexes', function(reply) {
    var regexes;
    if (copyclipper.isEmpty(reply)) {
      // maybe they are in localstorage?
      if (localStorage.hasOwnProperty('copyclipper.regexes') &&
          localStorage['copyclipper.regexes']) {
        console.log('loaded regexes from localStorage');
        regexes = localStorage['copyclipper.regexes'];
      } else {
        console.log('no regexes found, using defaults');
        regexes = copyclipper.DEFAULT_REGEXES.join('\n');
      }
      chrome.storage.sync.set({regexes: regexes}, function() {
        console.log('regexes saved to chrome.storage.sync');
      });
    } else {
      console.log('loaded regexes from chrome.storage.sync');
      regexes = reply['regexes'];
    }
    copyclipper.patterns = copyclipper.decodeRegexes(regexes);
  });
};

copyclipper.decodeRegexes = function(regex_blob) {
  var regex_lines = regex_blob.split('\n');
  var patterns = [];
  for (var i = 0; i < regex_lines.length; i++) {
    var pattern = copyclipper.decodeRegexLine(regex_lines[i]);
    if (pattern) {
      patterns.push(pattern);
    }
  }
  return patterns;
};

/** Remove whitespace from the start & end of the line. */
copyclipper.trim = function(s) {
  return s.replace(/^\s+/, '').replace(/\s+$/, '');
};

/** Take a line like !search!replace!re_args and turn it into a
 * Two element [RegExp, string] Array.
 * Returns null on comment lines or an error parsing.
 */
copyclipper.decodeRegexLine = function(regex_line) {
  console.log(regex_line);

  regex_line = copyclipper.trim(regex_line);
  if (regex_line.charAt(0) === '#') {
    // ignore comment lines
    return null;
  }

  var old_parts = regex_line.split('!');
  var pos = 1;
  var parts = [];

  while (pos < old_parts.length) {
    parts.push(old_parts[pos++]);
    while (old_parts[pos - 1].charAt(old_parts[pos - 1].length - 1) == '\\' &&
           pos < old_parts.length) {
      parts[paths.length - 1] = parts[paths.length - 1] + '!' + old_parts[pos];
      pos++;
    }
  }
  if (parts.length == 3) {
    return [RegExp(parts[0], parts[2]), parts[1]];
  }
  return null;
};

copyclipper.textToHtml = function(txt) {
  txt = txt.replace('&', '&amp;');
  txt = txt.replace('<', '&lt;');
  txt = txt.replace('>', '&gt;');
  return txt;
};

copyclipper.getClipboardContents = function() {
  var el = document.getElementById('txt');
  el.focus();
  el.select();
  document.execCommand('paste');
  return el.value;
};

copyclipper.setClipboardContents = function(val) {
  var el = document.getElementById('txt');
  el.value = val;
  el.focus();
  el.select();
  document.execCommand('copy');
  copyclipper.clipboardValue = val;
};

/** Go through all our patterns and sear/replace on val. */
copyclipper.replace = function(val, patterns) {
  for (var i = 0; i < patterns.length; i++) {
    var search = patterns[i][0];
    var replace = patterns[i][1];
    val = val.replace(search, replace);
  }
  return val;
};

/** Called when the clipboard has changed, see if we can clip the clipboard. */
copyclipper.copyclip = function() {
  var val = copyclipper.getClipboardContents();
  var orig = val + '';

  val = copyclipper.replace(val, copyclipper.patterns);

  copyclipper.clipboardValue = val;
  copyclipper.clipboardValueOriginal = orig;
  if (val != orig) {
    copyclipper.setClipboardContents(val);
    copyclipper.createNotification();
  }
};


/** Called every second to see if the clipboard has changed. */
copyclipper.pollClipboard = function() {
  var val = copyclipper.getClipboardContents();
  if (val != copyclipper.clipboardValue) {
    copyclipper.copyclip();
  }
};

copyclipper.restoreRegexes();
copyclipper.clipboardValue = '';  // the last value we saw
copyclipper.clipboardValueOriginal = '';

// Check the clipboard every second, if anything changed copyclip/filter it.
copyclipper.intervalId = window.setInterval(copyclipper.pollClipboard, 1000);

copyclipper.notificationTimer = null;

copyclipper.createNotification = function() {

  var desciption = '\n\nClipped from:\n';
  if (copyclipper.clipboardValueOriginal.length <
      copyclipper.clipboardValue.length) {
    desciption = '\n\nUnclipped from:\n';
  }

  copyclipper.clearNotifications();

  chrome.notifications.create('',
                              {
                                type: 'basic',
                                title: 'Copyclipper',
                                message: (copyclipper.clipboardValue +
                                          desciption +
                                          copyclipper.clipboardValueOriginal),
                                iconUrl: 'icon48.png',
                                buttons: [{title: 'Undo'}]},
                              function(notificationId) {});

  if (copyclipper.notificationTimer != null) {
    clearTimeout(copyclipper.notificationTimer);
  }
  copyclipper.notificationTimer = setTimeout(copyclipper.clearNotifications,
                                             copyclipper.NOTIFICATION_TIMEOUT);

};

copyclipper.clearNotifications = function() {
  chrome.notifications.getAll(function(notificationIds) {
    for (var notificationId in notificationIds) {
      chrome.notifications.clear(notificationId, function(wasCleared) {});
    }
  });
};

copyclipper.notificationButtonClicked = function(notificationId, buttonIndex) {
  var orig = copyclipper.clipboardValueOriginal;
  copyclipper.clipboardValueOriginal = copyclipper.clipboardValue;
  copyclipper.setClipboardContents(orig);
  copyclipper.createNotification();
};

// handlers for notification clicks
chrome.notifications.onButtonClicked.addListener(
  copyclipper.notificationButtonClicked);
