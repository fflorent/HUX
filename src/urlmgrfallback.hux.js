
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
			HUX.Selector.evaluate( "./descendant-or-self::a[starts-with(@href, '@')]", context, );
		}
	},
	
	replaceEach: function(el){
		el.href = el.href.replace(/^.*@/, "#!").replace(",", ",!");
		HUX.Compat.addEventListener(el, "click", HUX.HashMgr.onClick); 
	}
	
};
HUX.addModule(HUX.UrlMgrFb);