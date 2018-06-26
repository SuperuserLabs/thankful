
build:
	npm run build

dev:
	npm run dev

install:
	npm install

clean-install:
	npm ci

lint:
	npm run lint

lint-fix:
	npm run lint -- --fix

test:
	npm run test

clean:
	git clean -n dist
	rm -v dist/**/*.{js,html}

package: clean clean-install lint test build
	cd dist/
	zip -r ../thankful.zip *

publish: package
	echo not implemented
	# Use these to automatically publish
	# https://www.npmjs.com/package/chrome-webstore-upload-cli
	# https://www.npmjs.com/package/firefox-extension-deploy
