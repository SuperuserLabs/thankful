install:
	bundle install

serve:
	bundle exec jekyll serve

build:
	bundle exec jekyll build
	touch _site/.nojekyll

# we need to build the thankful page separately because it's in a subdirectory named the same as the repo, which GitHub Pages doesn't like
build-thankful:
	bundle exec jekyll build -d _site/thankful
	mv _site/thankful/thankful/* _site/thankful
	touch _site/thankful/.nojekyll
