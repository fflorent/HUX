/**
    HTTP Using XML (HUX) : Stage Class Manager
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

//stageclassmgr.hux.js

/**
 * Namespace: HUX.StageClassMgr
 * changes the class of the target at each stage of the load
 */
HUX.StageClassMgr = (function(){
	
	var inner =  {
		// regular expression for erasing stage classes
		reErase: null,
		/**
		 * Property: classNames
		 * {HashMap<String, String>} gives a class name for each HUX event
		 */
		classNames:{
			/* map : [event] : [className] */
			"loading":"hux_loading",
			"requestError":"hux_error",
			"beforeInject":"hux_initLoaded",
			"afterInject":"hux_loaded"
		},
		/**
		 * Function: init
		 * inits the module
		 */
		init: function(){
			var evName, tabClasses = [];
			for(evName in this.classNames){
				HUX.HUXEvents.bindGlobal(evName, inner.eventHandler);
			}
			for(var c in this.classNames)
				tabClasses.push(this.classNames[c]);
			// RegExp to delete our classNames
			this.reErase = new RegExp("("+tabClasses.join("|")+")\\s*", 'g');
			
		},
 
		/**
		 * Function: eventHandler
		 * handles any event given in classNames.
		 * calls setHuxClassName to modify the class name of the target
		 * 
		 * Parameters : 
		 * 	- *ev* : {HUX Event Object}
		 */
		eventHandler: function(ev, callback){
			var target = ev.target;
			if(target) // target !== undefined && target !== null
				pub.setHuxClassName(target, ev.type);
		}
	};
	var pub = {
		inner:inner,
		/**
		 * Function: setHuxClassName
		 * modifies the class name of a target. Removes any class names previously added by this function.
		 * 
		 * Parameters :
		 * 	- *el* : {Element} the target element
		 * 	- *evName* : {String} the event name. 
		 */
		setHuxClassName: function(el, evName){
			el.className = inner.classNames[evName] + " " + el.className.replace(inner.reErase, ""); // we push the new className and erase any old HUX class Name 
		}
	}
	inner.init(); // we launch the module directly
	return pub;
})();
