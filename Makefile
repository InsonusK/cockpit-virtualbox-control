SHELL := /bin/bash

pip-i:
	python3 -m venv .venv
	source .venv/bin/activate
	pip install -r requirements.txt

aism-sync:
	source .venv/bin/activate
	aism sync

test:
	node --test

build:
	npm run build

typecheck:
	npm run typecheck
