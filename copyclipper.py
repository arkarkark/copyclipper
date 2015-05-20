#!/usr/bin/python

# we'll switch over to pyperclip if this ever gets fixed
# https://github.com/asweigart/pyperclip/issues/18

import ast
import logging
import os
import re
import time
import subprocess

import AppKit
import Foundation


def Paste():
  """Get the value from the clipboard."""
  pasteboard = AppKit.NSPasteboard.generalPasteboard() # pylint: disable=no-member
  pbstring = pasteboard.stringForType_(AppKit.NSStringPboardType) # pylint: disable=no-member
  return pbstring

def Copy(string):
  """Set the clipboard value."""
  new_str = Foundation.NSString.stringWithString_(string).nsstring() # pylint: disable=no-member
  new_data = new_str.dataUsingEncoding_(Foundation.NSUTF8StringEncoding) # pylint: disable=no-member
  board = AppKit.NSPasteboard.generalPasteboard() # pylint: disable=no-member
  board.declareTypes_owner_([AppKit.NSStringPboardType], None) # pylint: disable=no-member
  board.setData_forType_(new_data, AppKit.NSStringPboardType) # pylint: disable=no-member

def SetupLogging():
  """Setup the logging system."""
  logging.basicConfig()
  logging.getLogger().setLevel(logging.ERROR)

  logger = logging.getLogger("copyclipper")
  logger.setLevel(logging.DEBUG)
  return logger

console = SetupLogging() # pylint: disable=invalid-name

def LoadConfig():
  """Load up ~/.copyclipperrc"""
  config = ast.literal_eval(open(os.path.expanduser("~/.copyclipperrc")).read())

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
  subprocess.call(["terminal-notifier", "-message", message])


def WatchClipboard(config):
  last_value = None

  while True:
    new_value = Paste()
    if new_value and (last_value is None or new_value != last_value):
      console.info("Clipboard: %s", new_value)
      processed_value = ProcessValue(config["patterns"], new_value)
      if processed_value != new_value:
        # TODO(ark): show a popup allowing them to switch back
        console.info("Clipped: %s\n", processed_value)
        Notify("Clipped: %s" % processed_value)
        Copy(processed_value)
      else:
        console.debug("No change\n")
      last_value = processed_value
    time.sleep(1)


def Main():
  """Main."""
  WatchClipboard(LoadConfig())

if __name__ == "__main__":
  Main()
