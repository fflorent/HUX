HUX.FormUpdateUrl = {
	defaultUpdateUrl: "enabled",
	updateUrl: function(target, url, data){
		// we test the first argument
		if(typeof target === "string"){
			if(document.getElementById("target") === null)
				throw "HUX.Form.updateUrl : #"+target+" not found";
		}	
		if(target.nodeType !== undefined) 
			target = target.id;
		else
			throw "HUX.Form.updateUrl : first argument must be either an id string or an HTML element";
		var sPair = "+"+target+"="+url;
		if(HUX.AtMgr !== undefined && HUX.AtMgr.enabled){
			HUX.AtMgr.changeAt( sPair );
		}
		else{
			HUX.HashMgr.updateHash( "#!"+sPair );
		}
		
	}
};

HUX.Form.submit = HUX.wrapFn(HUX.Form.submit, function(orig, form){
	var opt = orig.execute(HUX.Form); // we execute the proxied function
	var updateUrl = HUX.HUXattr.getAttributeHUX(form, "updateurl") || HUX.FormUpdateUrl.defaultUpdateUrl;
	if(opt.method.toLowerCase() === "get"
	    && updateUrl !== "none"){
		HUX.FormUpdateUrl.updateUrl( opt.target, opt.url, opt.data );
	}
});