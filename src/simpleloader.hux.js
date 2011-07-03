/**
    HTTP by Using XML (HUX) : Simple Loader
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


HUX.SimpleLoader = {
	sTarget:"target",
	/**
	 * handler for Click Event
	 */
	__onclick: function(ev){
		var srcElement = HUX.Core.Compat.getEventTarget(ev) ;
		var opt = {
			data:null,
			url:srcElement.href,
			method:'get',
			async:true,
			filling:HUX.Core.HUXattr.getFillingMethod(srcElement),
			target:HUX.Core.HUXattr.getTarget(srcElement),
			srcElement:srcElement
		};
		HUX.Core.xhr(opt);
		HUX.Core.Compat.preventDefault(ev);
	},
	__fnEach: function(el){
		HUX.Core.Compat.addEventListener(el, "click", HUX.SimpleLoader.__onclick );
	},
	listen:function(context){
		// for all anchor elements having target attributes, we listen to "click" events
		HUX.Core.Selector.byAttributeHUX("a", this.sTarget, context, this.__fnEach);
	},
	init: function(){
		HUX.Core.addLiveListener(this);
	}
};

HUX.Core.addModule(HUX.SimpleLoader); 
