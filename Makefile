
build:
	npm run build

build-production:
	env PRODUCTION=true npm run build

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
	cd dist/ && zip -r ../thankful.zip *

publish:
	# Use these to automatically publish
	# https://www.npmjs.com/package/chrome-webstore-upload-cli
	# https://www.npmjs.com/package/firefox-extension-deploy
	node scripts/publish-mozilla-addons.sh
	# Doing it like this would expose keys, not acceptable
	#    webstore upload --source extension.zip --extension-id ${WEBSTORE_EXTENSION_ID} --client-id ${WEBSTORE_CLIENT_ID} --client-secret ${WEBSTORE_CLIENT_SECRET} --refresh-token ${REFRESH_TOKEN}

