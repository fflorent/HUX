 /**
    HTTP by Using XML (HUX) : Form Manager
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
 //form.hux.js

HUX.Form = {
	defaultFilling: HUX.core.Inject.sMethods.APPEND,
	// if true, the form is reset after each submit
	clearAfterSubmit: true,
	init: function(){
		HUX.core.recursiveListen(HUX.Form);
	},
	// called by HUX.core.recursiveListen
	listen: function(context){
		HUX.core.Selector.byAttributeHUX("form", "targetnode", context, this.__fnEach);
	},
	__fnEach: function(el){
		HUX.core.Compat.addEventListener(el, "submit", HUX.Form.onSubmit );
	},
	onSubmit: function(ev){
		var arrData = [], form = HUX.core.Compat.getEventTarget(ev);
		
		var opt = {
			data:null, // set below
			url:form.action,
			method:form.getAttribute("method"),
			async:true,
			filling:HUX.core.HUXattr.getFillingMethod(form) || HUX.Form.defaultFilling,
			target:HUX.core.HUXattr.getTargetNode(form),
			srcNode:form
		};
		// we fill arrData : 
		HUX.core.Selector.byAttribute("*", "name", form, function(el){
			// TODO: explain the condition below : 
			if( !el.disabled && 
				(typeof el.getAttribute("type") === "undefined" || ! /radio|checkbox/.test(el.type) || el.checked) ){
					arrData.push( el.name+"="+el.value );
					// clear form (must need improvement)
					if(HUX.Form.clearAfterSubmit && (el.type === "text" || el.tagName.toLowerCase() === "textarea") )
						el.value = "";
			}
		});
		opt.data = arrData.join("&"); // 
		HUX.core.xhr(opt);
		HUX.core.Compat.preventDefault(ev);
	}
};
HUX.core.addModule(HUX.Form);



