/**
    HTTP Using XML (HUX) : Simple Loader
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


//simpleloader.hux.js

/**
 * Namespace: HUX.SimpleLoader
 * Loads content without URL update
 */
HUX.SimpleLoader = (function(){
	var inner = {
		sTarget:"target",
		/**
		* Function: onClick
		* handler for Click Event
		*/
		onclick: function(ev){
			try{
				var srcElement = HUX.Compat.Event.getEventTarget(ev) ;
				var opt = {
					data:null,
					url:srcElement.href,
					method:'get',
					async:true,
					filling:HUX.HUXattr.getFillingMethod(srcElement),
					target:HUX.HUXattr.getTarget(srcElement)
				};
				HUX.xhr(opt);
				HUX.Compat.Event.preventDefault(ev);
			}
			catch(ex){
				HUX.logError(ex);
			}
		},
		fnEach: function(el){
			HUX.Compat.Event.addEventListener(el, "click", inner.onclick );
		}
	};
	var pub = {
		inner: inner,
		/**
		* Function: listen
		* binds "click" event to inner.onClick function for each anchors having target attribute
		* 
		* Parameters : 
		* 	- *context* : {Element} the context where we listen for events
		*/
		listen:function(context){
			// for all anchor elements having target attributes, we listen to "click" events
			HUX.Selector.byAttributeHUX("a", inner.sTarget, context, inner.fnEach);
		},
		/**
		* Function: init
		* inits the module. Calls addLiveListener
		*/
		init: function(){
			HUX.addLiveListener(pub.listen);
		}
	};
	return pub;
})();

HUX.addModule(HUX.SimpleLoader); 



