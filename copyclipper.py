#!/usr/bin/python

"""CopyClipper monitors the clipboard and replaces strings in the clipboard based on regex patterns.

You get notifications when an item has been clipped.
You can click the notification to undo the action, or just copy the same string again.
"""

# we'll switch over to pyperclip if this ever gets fixed
# https://github.com/asweigart/pyperclip/issues/18

import BaseHTTPServer
import argparse
import ast
import logging
import os
import re
import subprocess
import threading
import time

import AppKit
import Foundation


def ParseArgs():
  """Parse all the command line arguments."""
  parser = argparse.ArgumentParser()
  parser.add_argument("-p", "--port", help="Port to run web server on.", default="19746")
  parser.add_argument("-f", "--file", help="Config file location.", default="~/.copyclipperrc")
  parser.add_argument("-v", "--verbose", help="lots a logging.", action="store_true")

  return parser.parse_args()

def SetupLogging():
  """Setup the logging system."""
  logging.basicConfig()
  logging.getLogger().setLevel(logging.ERROR)

  logger = logging.getLogger("copyclipper")
  if args.verbose:
    logger.setLevel(logging.DEBUG)
  else:
    logger.setLevel(logging.INFO)
  return logger

args = ParseArgs()  # pylint: disable=invalid-name
console = SetupLogging()  # pylint: disable=invalid-name

original_value = None  # pylint: disable=invalid-name
last_value = None  # pylint: disable=invalid-name

def Paste():
  """Get the value from the clipboard."""
  pasteboard = AppKit.NSPasteboard.generalPasteboard()  # pylint: disable=no-member
  pbstring = pasteboard.stringForType_(AppKit.NSStringPboardType)  # pylint: disable=no-member
  return pbstring

def Copy(string):
  """Set the clipboard value."""
  new_str = Foundation.NSString.stringWithString_(string).nsstring()  # pylint: disable=no-member
  new_data = new_str.dataUsingEncoding_(Foundation.NSUTF8StringEncoding)  # pylint: disable=no-member
  board = AppKit.NSPasteboard.generalPasteboard()  # pylint: disable=no-member
  board.declareTypes_owner_([AppKit.NSStringPboardType], None)  # pylint: disable=no-member
  board.setData_forType_(new_data, AppKit.NSStringPboardType)  # pylint: disable=no-member

def LoadConfig():
  """Load up ~/.copyclipperrc"""
  file_name = os.path.expanduser(args.file)
  console.info("Loading: %r", file_name)
  config = ast.literal_eval(open(file_name).read())

  for pattern in config["patterns"]:
    console.debug("Compiling: %r", pattern["search"])
    pattern["search"] = re.compile(pattern["search"])

  return config

def ProcessValue(patterns, value):
  """Loop over all patterns and try and search replacey."""
  for pattern in patterns:
    value = pattern["search"].sub(pattern["replace"], value)

  return value

def Notify(message):
  """Notify the user of the change."""
  cmd_args = [
    "terminal-notifier",
    "-message", message,
    "-title", "CopyClipper",
    "-subtitle", "re-copy or click to undo",
    "-group", "CopyClipper",
    "-sender", "CopyClipper",
  ]
  if args.port:
    base = "http://localhost:%s" % args.port
    cmd_args.extend([
      "-execute", "curl -O /dev/null %s/undo" % base,
      "-appIcon", "%s/icon.png" % base,
    ])
  devnull = open('/dev/null', 'w')
  subprocess.call(cmd_args, stdout=devnull, stderr=devnull)

def StartServer(port):
  class MyHandler(BaseHTTPServer.BaseHTTPRequestHandler):
    """Simple http server to serve up an icon and also undo."""
    def do_GET(self):  # pylint: disable=invalid-name
      """handle a get request."""
      global last_value  # pylint: disable=invalid-name,global-statement
      console.debug("HTTP: %r", self.path)
      if self.path.startswith("/undo"):
        self.wfile.write("<script>window.close();</script>")
        last_value = original_value
        Copy(last_value)
      elif self.path.startswith("/icon"):
        self.wfile.write(open(os.path.join(os.path.dirname(__file__), "icon128.png")).read())

  def Serve():
    """Start up the webserver."""
    console.info("Starting Webserver on port: %d", port)
    httpd = BaseHTTPServer.HTTPServer(("localhost", port), MyHandler)
    while True:
      httpd.handle_request()

  t = threading.Thread(target=Serve)
  t.daemon = True
  t.start()

def WatchClipboard(config):
  """Monitor the clipboard for changes."""
  global last_value, original_value

  if args.port:
    StartServer(int(args.port))

  while True:
    new_value = Paste()
    if new_value and (last_value is None or new_value != last_value):
      console.debug("n/l/o: %15s %15s %15s",
                    str(new_value)[0:15], str(last_value)[0:15], str(original_value)[0:15])
      if new_value == original_value:
        console.debug("Not clipping due to re-copy")
        last_value = original_value
      else:
        console.debug("Clipboard: %s", new_value)
        processed_value = ProcessValue(config["patterns"], new_value)
        if processed_value != new_value:
          console.info("Clipped: %s", processed_value)
          Notify("Clipped: %s" % processed_value)
          Copy(processed_value)
        else:
          console.debug("No change\n")
        original_value = new_value
        last_value = processed_value
    time.sleep(1)

def Main():
  """Main."""
  WatchClipboard(LoadConfig())

if __name__ == "__main__":
  Main()
