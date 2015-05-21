#!/usr/bin/python
"""Test copyclipper."""

import unittest

import copyclipper

class TestCopyClipper(unittest.TestCase):
  """Test copyclipper."""

  def test_load_config(self):
    """Can we load a config?"""
    config = copyclipper.LoadConfig()
    self.assertTrue(len(config) > 0)

  def test_patterns(self):
    """Test all the patterns."""
    tests = (
      ("https://youtu.be/OQwD0QCbxaA", "https://www.youtube.com/watch?v=OQwD0QCbxaA&feature=my_favorites"),
      ("https://smile.amazon.com/Simons-Cat-Simon-Tofield/dp/0446560065",
       "http://www.amazon.com/Simons-Cat-Simon-Tofield/dp/0446560065/ref=sr_1_1?ie=UTF8&qid=1346302386&sr="),
      ("http://example.com/", "http://example.com/?feat=directlink"),
      ("http://example.com/", "http://example.com/?"),
      ("http://example.com/?foo=1", "http://example.com/?foo=1&"),

    )

    config = copyclipper.LoadConfig()
    for test in tests:
      result = copyclipper.ProcessValue(config, test[1])
      self.assertEquals(result, test[0],
                        msg="Expected\n%r\ngot\n%r\nfrom\n%r\n" % (test[0], test[1], result))

if __name__ == '__main__':
  unittest.main()
