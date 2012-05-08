ROOT=.
HUX_JS=$(ROOT)/hux.js
SRC=$(ROOT)/src
MODULES=$(SRC)/modules
CORE=$(SRC)/core/core.hux.js
CCAT_MOD= @@cat $(MODULES)/$(1).hux.js >> $(HUX_JS); echo "" >> $(HUX_JS);

all: core simpleloader hashbang form stageclassmgr atinclusion atinclusionfallback formupdateurl xhtmlsupport scriptinjecter#animation  hashbang4indexing overlay transition  
	@@echo "generation done";
all-dev: all checker

init: 
	@@echo "generating hux.js"; echo "" > $(HUX_JS);
core: init
	@@cat $(CORE) >> $(HUX_JS); 
simpleloader: core
	$(call CCAT_MOD,simpleloader)
hashbang: pairmgr contentmanager core
	$(call CCAT_MOD,hashbang)
hashbang4indexing: hashbang
	$(call CCAT_MOD,hashbang4indexing)
form:	core
	$(call CCAT_MOD,form)
formupdateurl: form hashbang atinclusion
	$(call CCAT_MOD,formupdateurl)
scriptinjecter: core
	$(call CCAT_MOD,scriptinjecter)
stageclassmgr: core
	$(call CCAT_MOD,stageclassmgr)
overlay: core
	$(call CCAT_MOD,overlay)
atinclusion:  pairmgr contentmanager core
	$(call CCAT_MOD,atinclusion)
pairmgr: core
	$(call CCAT_MOD,pairmgr)
contentmanager: core
	$(call CCAT_MOD,contentmanager)
transition: core stageclassmgr
	$(call CCAT_MOD,transition)
animation: core stageclassmgr
	$(call CCAT_MOD,animation)
atinclusionfallback: atinclusion hashbang
	$(call CCAT_MOD,atinclusionfallback)
xhtmlsupport: core
	$(call CCAT_MOD,xhtmlsupport)
# needs improvement
#defaulttrigger: core
#	$(call CCAT_MOD,defaulttrigger) >> $(HUX_JS);
#checker:   core
#	@@cat $(MODULES)/checker.hux.js >> $(HUX_JS);
clean:
	@@ rm $(HUX_JS); echo "hux.js removed";

