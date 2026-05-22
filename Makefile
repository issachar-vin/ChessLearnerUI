.PHONY: install lint format check dev build

install:
	npm install
	npx husky install || true

lint:
	npm run lint
	npm run format

format: lint

check:
	npm run lint:check
	npm run format:check
	npm run typecheck

dev:
	npm run dev

build:
	npm run build
