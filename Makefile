# Install

install:
	npm install

install-ci:
	npm ci


# Build

build:
	npm run build

build-production:
	env PRODUCTION=true npm run build

build-svgs:
	for size in 64 128 256 512; do inkscape --without-gui --export-png=dist/media/icon-$$size.png --export-width=$$size --export-height=$$size dist/media/icon.svg; done


# Dev tools

dev:
	npm run dev

vue-devtools:
	npx @vue/devtools

serve:
	cd dist/ && python3 -m http.server

get-crypto-addresses:
	node scripts/get_crypto_addresses.js > dist/data/crypto_addresses.json


## Testing, linting, and code checking

test:
	npm run test

lint:
	npm run lint

lint-fix:
	npm run precommit

typecheck:
	mypy scripts/

precommit:
	make typecheck
	make lint-fix
	make test


# Package and clean

package:
	cd dist/ && zip -r ../thankful.zip *

zip-src:
	git archive -o thankful-src.zip HEAD

clean:
	-git clean -fdx dist
	rm -f thankful.zip


# Deployment

prepublish:
	make clean
	-scripts/set_version.py dist/manifest.json
	-scripts/set_version.py package.json
	npm run precommit
	make build-production
	make package

thankful.zip:
	make prepublish

deploy-travis:
	make install-ci
	make publish-amo

publish-amo: thankful.zip
	env MOZILLA_EXTENSION_ID='{b4bbcd8e-acc0-4044-b09b-1c15d0b66875}' \
		node scripts/publish-mozilla-addons.js

publish-webstore: thankful.zip
	# This will likely not be able to run in CI, see:
	#	https://github.com/SuperuserLabs/thankful/pull/39#issuecomment-401839665
	env $$(cat .env-webstore | xargs) \
		npx webstore upload --auto-publish --source thankful.zip \
							--extension-id 'eapbondnpopbiepnjfhnaaejfdfjhnde'

webstore-step1:
	# https://developer.chrome.com/webstore/using_webstore_api
	env $$(cat .env-webstore | xargs) bash -c 'xdg-open "https://accounts.google.com/o/oauth2/auth?response_type=code&scope=https://www.googleapis.com/auth/chromewebstore&client_id=$$CLIENT_ID&redirect_uri=urn:ietf:wg:oauth:2.0:oob"'

webstore-step2:
	env $$(cat .env-webstore | xargs) bash -c 'curl "https://accounts.google.com/o/oauth2/token" -d "client_id=$$CLIENT_ID&client_secret=$$CLIENT_SECRET&code=$$CODE&grant_type=authorization_code&redirect_uri=urn:ietf:wg:oauth:2.0:oob"'
