 /**
    HTTP Using XML (HUX) : Form Update Url
    Copyright (C) 2011  Florent FAYOLLE
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
**/

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
		if(HUX.AtInclusion !== undefined && HUX.AtInclusion.enabled){
			HUX.AtInclusion.changeAt( sPair );
		}
		else if(HUX.HashBang !== undefined && HUX.HashBang.enabled){
			HUX.HashBang.updateHash( "#!"+sPair );
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