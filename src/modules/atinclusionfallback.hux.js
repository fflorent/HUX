/**
    HTTP Using XML (HUX) : At Inclusion Fallback
    Copyright (C) 2011-2012  Florent FAYOLLE
    
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
 * 
 * converts links of type "@..." to "#!..."
 * if history.pushState is not available
 * 
 * Requires: HUX.AtInclusion, HUX.HashBang
 */

HUX.AtInclusionFb = (function(){
	var inner = {
		testExecuteOrig: function(){
			return !pub.enabled || !pub.overrideAtInclusionMethods;
		},
		extChangeAt: function(fnOrig, at, hash, addNewState){
			if( inner.testExecuteOrig() )
				return fnOrig.execute();
			if(hash.charAt(0) !== "#")
				hash = "#"+hash;
			var href = inner.replaceHref( at + hash );
			HUX.HashBang.changeHash(href);
		},
		extAddAt: function(fnOrig, target, url, addNewState){
			if( inner.testExecuteOrig() )
				return fnOrig.execute();
			return HUX.HashBang.addBang(target, url);
		},
		extRemoveAt: function(fnOrig, target, addNewState){
			if( inner.testExecuteOrig() )
				return fnOrig.execute();
			return HUX.HashBang.removeBang(target);
		},
		replaceHref: function(href){
			var splitHref = href.match(/([^#]*)(#.*)?/); // [0] => at inclusions ; [1] => hash part
			return splitHref[1].replace("@", "#!").replace(/,([^!])/g, ",!$1") // at inclusion replacement
				+ (splitHref[2] || "").replace(/^#/,","); // we replace "#" by ","
		}
	};
	
	var pub = {
		// by default, we enable that fallback if At Inclusions are not enabled
		enabled: ! HUX.AtInclusion.enabled,
		// do we override AtInclusion public methods ? 
		overrideAtInclusionMethods: true,
		init: function(){
			var am, atInclusions;
			if(pub.enabled){
				am = HUX.AtInclusion;
				atInclusions = am.getAtInclusions();
				// if there are atInclusions, we replace it by HashBangs
				if( atInclusions ){
					var hash = inner.replaceHref( atInclusions );
					location = location.href.replace(atInclusions, hash);
				}
				HUX.addLiveListener(HUX.AtInclusionFb);
				am.changeAt = HUX.wrapFn(am.changeAt, inner.extChangeAt);
				am.addAt = HUX.wrapFn(am.addAt, inner.extAddAt);
				am.removeAt = HUX.wrapFn(am.removeAt, inner.extRemoveAt);
			}
		},
		listen: function(context){
			if(pub.enabled)
				HUX.AtInclusion.inner.findAnchors(context, pub.replaceAnchorHref);
		},
		/**
		 * converts an href containing at inclusions to an href with hash bangs
		 */
		replaceAnchorHref: function(el){
			el.href = inner.replaceHref(el.href);
			// we ensure that the listener will not be called twice
			HUX.Compat.Event.addEventListenerOnce(el, "click", HUX.HashBang.inner.onClick); 
		}
	};
	return pub;
	
})();

HUX.addModule(HUX.AtInclusionFb);
HUX.HashBang.enabled = HUX.AtInclusionFb.enabled;

