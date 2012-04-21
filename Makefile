ROOT=.
HUX_JS=$(ROOT)/hux.js
SRC=$(ROOT)/src
MODULES=$(SRC)/modules
CORE=$(SRC)/core/core.hux.js
CCAT_MOD= @@cat $(MODULES)/$(1).hux.js >> $(HUX_JS);

all: core simpleloader hashmgr hashmgr4indexing form stageclassmgr overlay atmgr atmgrfallback formupdateurl xhtmlsupport# scriptinjecter transition 
	@@echo "generation done";
all-dev: all checker

init: 
	@@echo "generating hux.js"; echo "" > $(HUX_JS);
core: init
	@@cat $(CORE) >> $(HUX_JS); 
simpleloader: core
	$(call CCAT_MOD,simpleloader)
hashmgr: pairmgr contentsynchronizer core
	$(call CCAT_MOD,hashmgr)
hashmgr4indexing: hashmgr
	$(call CCAT_MOD,hashmgr4indexing)
form:	core
	$(call CCAT_MOD,form)
formupdateurl: form hashmgr atmgr
	$(call CCAT_MOD,formupdateurl)
scriptinjecter: core
	$(call CCAT_MOD,scriptinjecter)
stageclassmgr: core
	$(call CCAT_MOD,stageclassmgr)
overlay: core
	$(call CCAT_MOD,overlay)
atmgr:  pairmgr contentsynchronizer core
	$(call CCAT_MOD,atmgr)
pairmgr: core
	$(call CCAT_MOD,pairmgr)
contentsynchronizer: core
	$(call CCAT_MOD,contentsynchronizer)
transition: stageclassmgr
	$(call CCAT_MOD,transition)
atmgrfallback: atmgr hashmgr
	$(call CCAT_MOD,atmgrfallback)
xhtmlsupport: core
	$(call CCAT_MOD,xhtmlsupport)
# needs improvement
#defaulttrigger: core
#	$(call CCAT_MOD,defaulttrigger) >> $(HUX_JS);
#checker:   core
#	@@cat $(MODULES)/checker.hux.js >> $(HUX_JS);
clean:
	@@ rm $(HUX_JS); echo "hux.js removed";

