 /**
    HTTP Using XML (HUX) : Form Manager
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
/**
 * Namespace: HUX.Form
 * Form submission manager for HUX
 */
HUX.Form = {
	/**
	 * Variable: defaultFilling
	 * {String} the default filling method for forms
	 * 
	 * Default: "replace"
	 */
	defaultFilling: "replace",
	/**
	 * Variable: clearAfterSubmit
	 * {Boolean} if true, the form is cleared after being submitted
	 * 
	 * Default: true
	 */
	clearAfterSubmit: true,
	/**
	 * Function: init
	 * inits the module. Calls addLiveListener.
	 * 
	 */
	init: function(){
		HUX.addLiveListener(HUX.Form);
	},
	/**
	 * Function: listen
	 * called by addLiveListener. For all forms having the "target" attribute, listens to submit events.
	 */
	listen: function(context){
		// we look for elements having the target attribute (to send and inject the content) 
		// or the sendonly attribute (to send the data only)
		HUX.Compat.forEach(["target", "sendonly"], function(searchedAttr){
			HUX.Selector.byAttributeHUX("form", searchedAttr, context, function(el){
				// when submitting, we trigger HUX.Form.onSubmit 
				HUX.Compat.addEventListener(el, "submit", function(ev){
					var form = HUX.Compat.getEventTarget(ev);
					HUX.Form.submit(form);
				});
			});
		});
	},
	/**
	 * Function: serialize
	 * serializes the form data to URLEncode format.
	 * 
	 * Parameters:
	 * 	- *el* : {Element} the form Element whose data will be serialized
	 * 	- *arrData* : {Array of String} empty array that will be filled of Strings of this type : "[name]=[value]"
	 * 
	 * Used in:
	 * 	- <onSubmit>
	 */
	serialize: function(el, arrData){
		// TODO: explain the condition below : 
		if( !el.disabled && 
			(typeof el.getAttribute("type") === "undefined" || ! /radio|checkbox/.test(el.type) || el.checked) ){
				arrData.push( el.name+"="+el.value );
				// clear form (must need improvement)
				if(HUX.Form.clearAfterSubmit && (el.type === "text" || el.tagName.toLowerCase() === "textarea") )
					el.value = "";
		}
	},
	/**
	 * Function: submit
	 * handles the form submission
	 * 
	 * Parameters:
	 * 	- *form*: {Form Element}
	 * 	- OR *opt*: {Object} of this form : 
	 * 		{
	 * 			method: <HTTP method>,
	 * 			url: <url>,
	 * 			target: <id of the target to fill>,
	 * 			data: {<the data to send in this object...>},
	 * 			async: <(optional) boolean>,
	 * 			filling: <"replace", "append", "prepend", etc...>
	 * 		}
	 * 
	 */
	submit: function(arg1){
		try{
			var arrData = [], opt;
			// we fill the option object
			if(arg1.nodeType === 1 && arg1.tagName === "form"){
				opt = {
					data:null, // set below
					url:form.action,
					method:form.getAttribute("method"),
					async:true,
					filling:HUX.HUXattr.getFillingMethod(form) || HUX.Form.defaultFilling,
					target:HUX.HUXattr.getTarget(form) || undefined/*, // 
					srcElement:form // ????*/
				};
				// we fill arrData : 
				HUX.Selector.byAttribute("*", "name", form, function(el){
					HUX.Form.serialize(el, arrData);
				});
				
				// we join the data array to have this form : "name1=value1&name2=value2&...."
				opt.data = arrData.join("&"); 
			}
			else 
				opt = arg1;
			
			// we call the XHR method
			HUX.xhr(opt);
			HUX.Compat.preventDefault(ev);
		}
		catch(ex){
			HUX.logError(ex);
		}
	}
}; 
HUX.addModule(HUX.Form);
HUX.addToAPI("submit", HUX.Form.submit);


