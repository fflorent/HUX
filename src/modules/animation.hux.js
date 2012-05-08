/**
    HTTP Using XML (HUX) : Animation
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
/**
 * Namespace: Animation
 * 
 * Ensures that animations are executed before contents are unloaded
 */
HUX.Animation = (function(){
	var inner = {
		remainingAnimations: {},
		delayedFunctions: {},
		getDelayedSuccessOrError: function(el){
			return function(fnOrig){
				setTimeout(function(){
					if(! inner.remainingAnimations[el] ){
						delete inner.delayedFunctions[el];
						return fnOrig.execute();
					}
					inner.delayedFunctions[el] = fnOrig;
				}, 50);
			}
		},
		onLoading: function(ev){
			if(pub.enabled 
			   && ev.target !== undefined 
			   && ev.xhrOpt !== undefined){
				ev.xhrOpt.onSuccess = HUX.wrapFn(ev.xhrOpt.onSuccess, inner.getDelayedSuccessOrError(ev.target));
				// NOTE : buggy for the moment : 
				//ev.xhrOpt.onError = HUX.wrapFn(ev.xhrOpt.onError, inner.getDelayedSuccessOrError(ev.target));
			}
		},
		animationListener: function(ev){
			var curEl = ev.currentTarget, rem;
			switch(ev.type){
				case "animationstart":
				case HUX.Browser.evtPrefix()+"AnimationStart":
					++inner.remainingAnimations[curEl];
					break;
				case "animationend":
				case HUX.Browser.evtPrefix()+"AnimationEnd":
					rem = --inner.remainingAnimations[curEl];
					if(rem === 0 && inner.delayedFunctions[curEl]){
						try{
							inner.delayedFunctions[curEl].execute();
						}
						finally{
							delete inner.delayedFunctions[curEl];
						}
					}
					HUX.Compat.Array.forEach(["animationstart", HUX.Browser.evtPrefix()+"AnimationStart", "animationend", HUX.Browser.evtPrefix()+"AnimationEnd"], function(evName){
						curEl.removeEventListener(evName, inner.animationListener, false);
					});
					break;
			}
		},
		extSetHuxClassName: function(fnOrig, el, evName){
			if(!pub.enabled || evName !== "loading")
				return fnOrig.execute();
			inner.remainingAnimations[el] = 0;
			HUX.Compat.Array.forEach(["animationstart", HUX.Browser.evtPrefix()+"AnimationStart", "animationend", HUX.Browser.evtPrefix()+"AnimationEnd"], function(evName){
					el.addEventListener(evName, inner.animationListener, false);
			});
			return fnOrig.execute();
		}
	};
	
	var pub = {
		inner: inner,
		enabled: ("animationName" in document.documentElement.style 
			 || (HUX.Browser.domPrefix()+"AnimationName") in document.documentElement.style
			),
		init: function(){
			if(pub.enabled){
				HUX.HUXEvents.bindGlobal("loading", inner.onLoading);
				HUX.StageClassMgr.setHuxClassName = HUX.wrapFn(HUX.StageClassMgr.setHuxClassName, inner.extSetHuxClassName);
			}
		}
	};
	return pub;
})();
HUX.addModule( HUX.Animation );