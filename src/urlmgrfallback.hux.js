
/**
 * 
 * converts links of type "@..." to "#!..."
 * if history.pushState is not available
 * 
 * Requires: HUX.UrlMgr, HUX.HashMgr
 */

HUX.UrlMgrFb = {
	enable: history.pushState === undefined,
	init: function(){
		if(this.enable){
			HUX.addLiveListener(this);
		}
	},
	listen: function(context){
		if(document.evaluate){
			HUX.Selector.evaluate( "./descendant-or-self::a[starts-with(@href, '@')]", context, this.replaceEach);
		}
		else{
			fnFilter = function(el){  
				// NOTE : el.getAttribute("href", 2) does not always work with IE 7, so we use this workaround to 
				// test if the href attribute begins with "#!"
				return el.href.indexOf( location.href.replace(/@.*|#.*/g, "")+"@" ) === 0;  
			};
			HUX.Selector.filterIE("a", fnFilter, context, this.replaceEach);
		}
	},
	
	replaceEach: function(el){
		el.href = el.href.replace(/^.*@/, "#!").replace(",", ",!");
		// we ensure that the listener will not be called twice
		HUX.Compat.addEventListenerOnce(el, "click", HUX.HashMgr.onClick); 
	}
	
};
HUX.addModule(HUX.UrlMgrFb);