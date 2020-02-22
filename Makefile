SRC_ICON = copyclipper.png
ICONS=icon128.png icon48.png icon16.png
ZIP_EXCLUDE= .git* $(SRC_ICON) screenshot*.png Makefile README.md \
	node_modules/* package.json dist/* .DS_Store *.xcf \
	copyclipperrc *.py *.pyc

JSON_FILES = manifest.json
JS_FILES = background.js options.js

space :=
space +=
ZIP_EXCLUDE_FLAGS = --exclude=$(subst $(space),$(space)--exclude=,$(ZIP_EXCLUDE))

build: setup $(wildcard **/*) $(ICONS) $(JSON_FILES) $(JS_FILES)
	dirname=$(shell basename $(PWD)); zip -r $(ZIP_EXCLUDE_FLAGS) dist/$$dirname.zip . $(ZIP_INCLUDES)

clean:
	rm -fv $(JSON_FILES) $(JS_FILES) $(ICONS)
	rm -rf node_modules/ vendor/ dist/
	rm -fv icon[1-9][0-9]*.png
	dirname=$(shell basename $(PWD)); rm -fv dist/$$dirname.zip

icon%.png: $(SRC_ICON)
	convert $(SRC_ICON) -resize $* $@

dist:
	mkdir -v dist

setup: dist

python:
	if ! type -f terminal-notifier; then brew install terminal-notifier; fi
	if ! python -c "import AppKit"; then \
	  sudo -H easy_install -U pyobjc-core; sudo -H easy_install -U pyobjc; fi
	if [ ! -r ~/.copyclipperrc ]; then D="$$PWD/copyclipperrc"; cd ~; ln -s "$$D" .copyclipperrc; fi
	python -m unittest -f test_copyclipper

tests:
	sniffer
