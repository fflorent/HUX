ROOT=.
HUX_JS=$(ROOT)/hux.js
SRC=$(ROOT)/src
CORE=$(SRC)/core.hux.js


all: core simpleloader hashmgr form
	@@echo "generation done";
all-dev: all checker

init: 
	@@echo "generating hux.js"; echo "" > $(HUX_JS);
core: init
	@@cat $(CORE) >> $(HUX_JS); 
simpleloader: core
	@@cat $(SRC)/simpleloader.hux.js >> $(HUX_JS);
hashmgr: core
	@@cat $(SRC)/hashmgr.hux.js >> $(HUX_JS);
form:	core
	@@cat $(SRC)/form.hux.js >> $(HUX_JS);
checker:   core
	@@cat $(SRC)/checker.hux.js >> $(HUX_JS);
clean:
	@@ rm $(HUX_JS); echo "hux.js removed";
