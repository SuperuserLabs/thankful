
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
