NPM := $(shell command -v npm 2> /dev/null)
YARN := $(shell command -v yarn 2> /dev/null)

default: build

setup: check-env yarn-install
build: gulp-build
publish: npm-publish

check-env:
ifndef NPM
	$(error npm is not installed)
endif
ifndef YARN
	$(error yarn is not installed [npm install -g yarn])
endif

gulp-build:
	gulp build;

yarn-install:
	yarn install

npm-publish:
	npm publish ./dist