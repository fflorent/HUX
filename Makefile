ROOT=.
HUX_JS=$(ROOT)/hux.js
SRC=$(ROOT)/src
MODULES=$(SRC)/modules
CORE=$(SRC)/core/core.hux.js


all: core simpleloader hashmgr hashmgr4indexing form scriptinjecter stageclassmgr overlay urlmgr urlmgrfallback # transition 
	@@echo "generation done";
all-dev: all checker

init: 
	@@echo "generating hux.js"; echo "" > $(HUX_JS);
core: init
	@@cat $(CORE) >> $(HUX_JS); 
simpleloader: core
	@@cat $(MODULES)/simpleloader.hux.js >> $(HUX_JS);
hashmgr: pairmgr core
	@@cat $(MODULES)/hashmgr.hux.js >> $(HUX_JS);
hashmgr4indexing: hashmgr
	@@cat $(MODULES)/hashmgr4indexing.hux.js >> $(HUX_JS);
form:	core
	@@cat $(MODULES)/form.hux.js >> $(HUX_JS);
scriptinjecter: core
	@@cat $(MODULES)/scriptinjecter.hux.js >> $(HUX_JS);
stageclassmgr: core
	@@cat $(MODULES)/stageclassmgr.hux.js >> $(HUX_JS);
overlay: core
	@@cat $(MODULES)/overlay.hux.js >> $(HUX_JS);
urlmgr:  pairmgr core
	@@cat $(MODULES)/urlmgr.hux.js >> $(HUX_JS);
pairmgr: core
	@@cat $(MODULES)/pairmgr.hux.js >> $(HUX_JS);
transition: stageclassmgr
	@@cat $(MODULES)/transition.hux.js >> $(HUX_JS);
urlmgrfallback: urlmgr hashmgr
	@@cat $(MODULES)/urlmgrfallback.hux.js >> $(HUX_JS);
# needs improvement
#default: core
#	@@cat $(MODULES)/default.hux.js >> $(HUX_JS);
checker:   core
	@@cat $(MODULES)/checker.hux.js >> $(HUX_JS);
clean:
	@@ rm $(HUX_JS); echo "hux.js removed";

