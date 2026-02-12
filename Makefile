serve:
	bundle exec jekyll serve --livereload

build:
	bundle exec jekyll build

test: build

install:
	bundle install
