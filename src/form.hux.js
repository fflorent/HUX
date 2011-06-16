 /**
    HTTP by Using XML (HUX) : Form Manager
    Copyright (C) 2011  Florent FAYOLLE

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
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
		HUX.core.addEventListener(el, "submit", HUX.Form.onSubmit );
	},
	onSubmit: function(ev){
		var arrData = [], form = HUX.core.getEventTarget(ev);
		
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
		HUX.core.preventDefault(ev);
	}
};
HUX.core.addModule(HUX.Form);



