ROOT=.
HUX_JS=$(ROOT)/hux.js
SRC=$(ROOT)/src
CORE=$(SRC)/core.hux.js


all: core simpleloader hashmgr hashmgr4indexing form scriptinjecter stageclassmgr
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
hashmgr4indexing: hashmgr
	@@cat $(SRC)/hashmgr4indexing.hux.js >> $(HUX_JS);
form:	core
	@@cat $(SRC)/form.hux.js >> $(HUX_JS);
scriptinjecter: core
	@@cat $(SRC)/scriptinjecter.hux.js >> $(HUX_JS);
stageclassmgr: core
	@@cat $(SRC)/stageclassmgr.hux.js >> $(HUX_JS);
checker:   core
	@@cat $(SRC)/checker.hux.js >> $(HUX_JS);
clean:
	@@ rm $(HUX_JS); echo "hux.js removed";
