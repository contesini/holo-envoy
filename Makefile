SHELL		= bash

package-lock.json: package.json
	npm install
	touch $@
node_modules: package-lock.json
	npm install

build/index.js:		src/*.ts
	npm run build
docs/index.html:	build/index.js
	npx jsdoc --verbose -c ./docs/.jsdoc.json --private --destination ./docs build/index.js


.PRECIOUS:	keystore-%.key
.PHONY:		src build docs docs-watch build-watch

dnas:
	mkdir -p ./dnas
dnas/holo-hosting-app.dna.gz:	dnas
	curl 'https://holo-host.github.io/holo-hosting-app-rsm/releases/downloads/v0.0.1-alpha3/holo-hosting-app.dna.gz' -o $@
dnas/servicelogger.dna.gz:	dnas
	curl 'https://holo-host.github.io/servicelogger-rsm/releases/downloads/v0.0.1-alpha3/servicelogger.dna.gz' -o $@
dnas/elemental-chat.dna.gz:	dnas
	curl -LJ 'https://github.com/holochain/elemental-chat/releases/download/v0.0.1-alpha9/elemental-chat.dna.gz' -o $@

build:			node_modules build/index.js
docs:			node_modules docs/index.html
DNAs:			dnas/elemental-chat.dna.gz dnas/holo-hosting-app.dna.gz dnas/servicelogger.dna.gz

MOCHA_OPTS		= 

test:			build
	make test-unit;
	make test-integration;
	make test-e2e
test-nix:		build
	make test-unit;
	CONDUCTOR_LOGS=error,warn LOG_LEVEL=silly make test-integration
test-debug:		build
	CONDUCTOR_LOGS=error,warn LOG_LEVEL=silly npx mocha $(MOCHA_OPTS) ./tests/unit/
	make test-integration-debug
	make test-e2e-debug2

test-unit:		build
	npx mocha $(MOCHA_OPTS) ./tests/unit/
test-unit-debug:	build
	LOG_LEVEL=silly npx mocha $(MOCHA_OPTS) ./tests/unit/

test-integration:	build DNAs
	npx holochain-run-dna -c ./app-config.yml -a 4444 &> holochain-conductor.log &
	npx mocha $(MOCHA_OPTS) ./tests/integration/
	killall holochain
test-integration-debug:	build DNAs
	npx holochain-run-dna -c ./app-config.yml -a 4444 &> holochain-conductor.log &
	LOG_LEVEL=silly CONDUCTOR_LOGS=error,warn npx mocha $(MOCHA_OPTS) ./tests/integration/
	killall holochain

test-e2e:		build DNAs dist/holo_hosting_chaperone.js
	npx holochain-run-dna -c ./app-config.yml -a 4444 &> holochain-conductor.log &
	npx mocha $(MOCHA_OPTS) ./tests/e2e
	killall holochain
test-e2e-debug:		build DNAs dist/holo_hosting_chaperone.js
	npx holochain-run-dna -c ./app-config.yml -a 4444 &> holochain-conductor.log &
	LOG_LEVEL=silly npx mocha $(MOCHA_OPTS) ./tests/e2e/
	killall holochain
test-e2e-debug2:	build DNAs dist/holo_hosting_chaperone.js
	npx holochain-run-dna -c ./app-config.yml -a 4444 &> holochain-conductor.log &
	LOG_LEVEL=silly CONDUCTOR_LOGS=error,warn npx mocha $(MOCHA_OPTS) ./tests/e2e/
	killall holochain

docs-watch:
build-watch:
# above targets are for autocompletion
%-watch:
	npx chokidar -d 3000 'src/**/*.ts' -c "make --no-print-directory $*" 2> /dev/null

clean-docs:
	git clean -df ./docs

CURRENT_BRANCH = $(shell git branch | grep \* | cut -d ' ' -f2)
publish-docs:
	git branch -D gh-pages || true
	git checkout -b gh-pages
	echo "\nBuilding Envoy docs"
	make docs
	ln -s docs v$$( cat package.json | jq -r .version )
	@echo "\nAdding Envoy docs..."
	git add -f docs
	git add v$$( cat package.json | jq -r .version )
	@echo "\nCreating commit..."
	git commit -m "JSdocs v$$( cat package.json | jq -r .version )"
	@echo "\nForce push to gh-pages"
	git push -f origin gh-pages
	git checkout $(CURRENT_BRANCH)


# Manage Holochain Conductor config
HC_LOCAL_STORAGE	= $(shell pwd)/holochain-conductor/storage

.PHONY:		start-hcc-%
conductor.log:
	touch $@

dist/holo_hosting_chaperone.js:
	ln -s node_modules/@holo-host/chaperone/dist dist

check-conductor:	check-holochain
check-holochain:
	ps -efH | grep holochain | grep -E "conductor-[0-9]+.toml"
stop-conductor:		stop-holochain
stop-holochain:
	@if [[ $$(ps -efH | grep holochain | grep -E "conductor-[0-9]+.toml") ]]; then	\
		echo "Stopping holochain conductor...";					\
		killall holochain || true;						\
	else										\
		echo "holochain conductor is not running";				\
	fi

keystore-%.key:
	@echo "Creating Holochain key for Agent $*: keystore-$*.key";
	echo $$( hc keygen --nullpass --quiet --path ./keystore-$*.key)			\
		| while read key _; do							\
			echo $$key > AGENTID;						\
		done
	@echo "Agent ID: $$(cat AGENTID)";

# TMP targets
use-local-chaperone:
	npm uninstall --save @holo-host/chaperone; npm install --save-dev ../chaperone
use-npm-chaperone:
	npm uninstall --save @holo-host/chaperone; npm install --save-dev @holo-host/chaperone
use-npm-chaperone-%:
	npm uninstall --save @holo-host/chaperone; npm install --save-dev @holo-host/chaperone@$*
