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
	
	/**
	 * handler for Click Event
	 */
	__onclick: function(ev){
		var srcNode = HUX.core.Compat.getEventTarget(ev) ;
		var opt = {
			data:null,
			url:srcNode.href,
			method:'get',
			async:true,
			filling:HUX.core.HUXattr.getFillingMethod(srcNode),
			target:HUX.core.HUXattr.getTargetNode(srcNode),
			srcNode:srcNode
		};
		HUX.core.xhr(opt);
		HUX.core.Compat.preventDefault(ev);
	},
	__fnEach: function(el){
		HUX.core.Compat.addEventListener(el, "click", HUX.SimpleLoader.__onclick );
	},
	listen:function(context){
		// for all anchor nodes having targetnode attributes, we listen to "click" events
		HUX.core.Selector.byAttributeHUX("a", "targetnode", context, this.__fnEach);
	},
	init: function(){
		HUX.core.recursiveListen(this);
	}
};

HUX.core.addModule(HUX.SimpleLoader); 
