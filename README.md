# Copyclipper

## Overview

Trim urls copied to the clipboard to make them shorter.
Copy Clipper monitors the clipboard, and if it sees something that can be simplified it does. It's mostly used for urls.

It makes youtube urls short, amazon urls short, strips off the GA tracking parameters that reader/feedburner puts on urls and is driven by regexp search/replace.

https://www.youtube.com/watch?v=OQwD0QCbxaA&feature=my_favorites
becomes https://youtu.be/OQwD0QCbxaA

http://www.amazon.com/Simons-Cat-Simon-Tofield/dp/0446560065/ref=sr_1_1?ie=UTF8&qid=1346302386&sr=8-1&keywords=simons+cat
becomes http://www.amazon.com/Simons-Cat-Simon-Tofield/dp/0446560065

If it ever clips something you don't want clipped, you can click Undo in the notification window and it will restore the original value.

It didn't have to be a chrome extension, but I like the easy UI for an options panel, and the auto updating from the chrome store is neat.

It's a bit like this extension: https://chrome.google.com/webstore/detail/kcpnkledgcbobhkgimpbmejgockkplob
but the urls don't have to hit the url bar/omnibox before they are trimmed.
