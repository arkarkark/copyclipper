python:
	if ! type -f terminal-notifier; then brew install terminal-notifier; fi
	if ! python -c "import AppKit"; then \
	  sudo -H easy_install -U pyobjc-core; sudo -H easy_install -U pyobjc; fi
