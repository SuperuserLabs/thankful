
build:
	npm run build

dev:
	npm run dev

install:
	npm install

lint:
	npm run lint

lint-fix:
	npm run lint -- --fix

test:
	npm run test

typecheck:
	mypy scripts/

clean:
	git clean -n dist
	rm -v dist/**/*.{js,html}

package:
	cd dist/
	zip -r ../thankful.zip *

publish:
	echo not implemented
	# Use these to automatically publish
	# https://www.npmjs.com/package/chrome-webstore-upload-cli
	# https://www.npmjs.com/package/firefox-extension-deploy
