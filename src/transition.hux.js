/**
    HTTP Using XML (HUX) : Transition
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



(function(){
	var ht;
	HUX.Transition = ht = {
		enabled: false,
		timeout:30,
		sTransitionEnd:HUX.Browser.evtPrefix() !== "moz" ? HUX.Browser.evtPrefix()+"TransitionEnd" : "transitionend",

		cssPrefix: HUX.Browser.cssPrefix(),
		/**
		* inspired from http://www.quirksmode.org/dom/getstyles.html
		* get the computed style of an element
		*/ 
		getStyle: function(el, styleProp){
			var func = new Function();
			// IE
			if (el.currentStyle)
				return  el.currentStyle[styleProp] || "";
			// other browsers
			else if(window.getComputedStyle)
				return document.defaultView.getComputedStyle(el,null).getPropertyValue(styleProp) || "";
			else
				return null;
		},
		init: function(){
			
			var evName;
			HUX.HUXEvents.bindGlobal("loading", ht.onLoading);
		},
		onLoading: function(ev){
			var target;
			if( ht.hasClass(ev.target, "hux_transition") ){
				ev.target.className = ev.target.className.replace(/\s*hux_tAppear\s*/g, "");
				target = ev.target.cloneNode(true);
				target.className += " hux_tVanishInit";
				ev.target.parentNode.insertBefore(target, ev.target);
				// this makes flush the style ...
				ht.getStyle(target, "display");
				
				target.className += " hux_tVanish";
				var duration = ht.getStyle(target, ht.cssPrefix+"transition-duration");
				var ms ;
				if(! duration)
					ms = 0;
				else
					ms = parseFloat(duration.replace(/s$/, ""))*1000;
				// rather than use transitionEnd that can never be triggered (if transition is not done)
				// we use setTimeout with the value of the duration
				setTimeout(function(){
					target.parentNode.removeChild(target);
					ht.makeAppear(ev);
				}, ms);
				
			}
		},
		makeAppear: function(ev){
			ev.target.className += " hux_tAppearInit";
			// flush the style
			ht.getStyle(ev.target, "display");
			ev.target.className = ev.target.className.replace(/(hux_tAppear)Init/, "$1");
		},
		hasClass: function(target, className){
			return new RegExp("(^|\\s)"+className+"($|\\s)").test(target.className);
		}
	};
	ht.init(); // we launch the module directly
})();