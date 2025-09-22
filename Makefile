# Build Definitions

PORT := 3003
NPM = $(shell which npm || echo "npm")
REBUILD = src
REBUILT = .next/app-build-manifest.json
CHEEZ := $(shell echo $(REBUILD) | xargs -n1 bin/md5sync --lazy --verbose --generate)

all: $(REBUILT)

node_modules: package.json $(NPM)
	npm install
	touch $@/.

$(REBUILT): node_modules $(REBUILD)
	npm run build
	@[ -e $@ ] && touch $@

start: $(REBUILT)
	@echo Starting server ...
	PORT=$(PORT) npm run dev </dev/null 1>>console.log 2>>console.err &

stop:
	@echo Stopping NodeJS ...
	@( ps fauwwx || ps auwwx ) 2>/dev/null | egrep -B1 '(n[o]de|n[p]m)'.*`pwd` | grep 'n[p]m' | awk '{print $$2}' | xargs --no-run-if-empty kill

status:
	@echo Checking status ...
	@if ( ( ( ps fauwwx || ps auwwx ) | grep -2 n[o]de.*`pwd` | grep -A3 n[p]m ) && ( netstat -pant || netstat -ant ) | grep $(PORT).*LISTEN ) 2>/dev/null; then echo Running fine; else echo Not running; exit 1; fi

restart:
	make stop
	sleep 2
	make start

clean:
	rm -rf node_modules

$(NPM):
	@echo "Need to install npm!"
	@[ ! -e /etc/centos-release ] || make INSTALL_CENTOS
	@uname -a | grep -vi darwin || make INSTALL_OSX
	@which npm || exit 1
	@sleep 2
	make $*

INSTALL_CENTOS:
	@echo Installing epel ...
	@[ -e /etc/yum.repos.d/epel.repo ] || sudo yum install epel-release
	@echo Installing nodejs ...
	@[ ! -e /etc/yum.repos.d/epel.repo ] || sudo yum install nodejs

INSTALL_OSX:
	@echo Installing brew ...
	@which brew || /usr/bin/ruby -e "$$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
	@which brew || exit 1
	@echo Installing npm ...
	@which npm || brew install node

.PHONY: all start stop
