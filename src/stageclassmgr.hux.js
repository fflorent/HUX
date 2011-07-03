/**
    HTTP by Using XML (HUX) : Stage Class Manager
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

(function(){
	var hscm;
	HUX.StageClassMgr = hscm = {
		delayEnd:30, // needed for transitions 
		classNames:{
			/* map : [event] : [className] */
			"loading":"hux_loading",
			"requestError":"hux_error",
			"beforeInject":"hux_initLoaded",
			"afterInject":"hux_loaded"
		},
		init: function(){
			var evName;
			for(evName in this.classNames){
				HUX.Core.HUXevents.bindGlobal(evName, hscm.eventHandler);
			}
		},
		eventHandler: function(ev){
			var timeout = 0;
			if(ev.type === "afterInject")
				timeout = hscm.delayEnd;
			// NOTE : IE does not implement extra arguments for setTimeout, so we use an anonymous function 
			// to send ev.target and ev.type
			setTimeout(function(){
				hscm.setHuxClassName(ev.target, ev.type);
			}, timeout);
		},
		setHuxClassName: function(el, key){
			
			el.className = hscm.classNames[key] + " " + el.className.replace(/hux_[^ ]+[ ]*/g, ""); // we push the new className and erase any old HUX class Name 
		}

	};
	hscm.init(); // we launch the module directly
})();
