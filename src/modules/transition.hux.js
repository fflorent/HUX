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

// NOTE : experimental, needs improvement ...

(function(){
	var ht;
	HUX.Transition = ht = {
		enabled: true,
		timeout:30,
		sTransitionEnd:HUX.Browser.evtPrefix() !== "moz" ? HUX.Browser.evtPrefix()+"TransitionEnd" : "transitionend",

		cssPrefix: HUX.Browser.cssPrefix(),
		/**
		* inspired from http://www.quirksmode.org/dom/getstyles.html
		* get the computed style of an element
		*/ 
		getStyle: function(el, styleProp){
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
			if(!this.enabled)
				return;
			HUX.HUXEvents.bindGlobal("loading", ht.onLoading);
			HUX.HUXEvents.createEventType("transiting");
		},
		getDuration: function(target){
			var duration = ht.getStyle(target, ht.cssPrefix+"transition-duration");
			var ms ;
			if(! duration)
				ms = 0;
			else
				ms = parseFloat(duration.replace(/s$/, ""))*1000;
			return ms;
		},
		flushStyle: function(target){
			ht.getStyle(target, "display");
		},
		onLoading: function(ev){
			var target;
			if( ht.hasClass(ev.target, "hux_transition") && ht.enabled ){
				ev.target.className = ev.target.className.replace(/\s*hux_tAppear\s*/g, "");
				target = ev.target.cloneNode(true); // we clone the target in order to display the clone while the original target is loading contents 
				target.className += " hux_tVanishInit";
				HUX.HUXEvents.trigger("transiting", {target:target});
				// we insert after the target
				if(ev.target.nextSibling !== undefined)
					ev.target.parentNode.insertBefore(target, ev.target.nextSibling);
				else
					ev.target.parentNode.appendChild(target);
				// this makes flush the style ...
				ht.flushStyle(target);
				
				target.className += " hux_tVanish";
				var ms = ht.getDuration(target);
				// rather than use transitionEnd that can never be triggered (if transition is not done)
				// we use setTimeout with the value of the duration
				setTimeout(function(){
					target.parentNode.removeChild(target);
					ht.makeAppear(ev);
				}, ms);
			}
		},
		makeAppear: function(ev){
			var target = ev.target;
			target.className += " hux_tAppearInit";
			// flush the style
			ht.flushStyle(target);
			target.className = target.className.replace(/(hux_tAppear)Init/, "$1");
			var ms = ht.getDuration(target);
			setTimeout(function(){
				target.className = target.className.replace("hux_tAppear", "");
			}, ms);
		},
		hasClass: function(target, className){
			return new RegExp("(^|\\s)"+className+"($|\\s)").test(target.className);
		}
	};
	ht.init(); // we launch the module directly
})();