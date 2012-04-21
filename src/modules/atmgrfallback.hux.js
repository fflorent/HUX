/**
    HTTP Using XML (HUX) : At Manager Fallback
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
 * 
 * converts links of type "@..." to "#!..."
 * if history.pushState is not available
 * 
 * Requires: HUX.AtMgr, HUX.HashMgr
 */

HUX.AtMgrFb = (function(){
	var inner = {
		testExecuteOrig: function(){
			return !pub.enabled || !pub.overrideAtMgrMethods;
		},
		extChangeAt: function(fnOrig, at, addNewState){
			if( inner.testExecuteOrig() )
				return fnOrig.execute();
			var href = inner.replaceHref( at );
			HUX.HashMgr.changeHash(href);
		},
		extAddAt: function(fnOrig, target, url, addNewState){
			if( inner.testExecuteOrig() )
				return fnOrig.execute();
			return HUX.HashMgr.addBang(target, url);
		},
		extRemoveAt: function(fnOrig, target, addNewState){
			if( inner.testExecuteOrig() )
				return fnOrig.execute();
			return HUX.HashMgr.removeBang(target);
		},
		replaceHref: function(href){
			return href.replace(/^.*@/, "#!").replace(/,([^!])/g, ",!$1")
		}
	};
	
	var pub = {
		enabled: ! HUX.AtMgr.inner.enabled,
		overrideAtMgrMethods: true,
		init: function(){
			var am;
			if(pub.enabled){
				am = HUX.AtMgr;
				HUX.addLiveListener(HUX.AtMgrFb);
				am.changeAt = HUX.wrapFn(am.changeAt, inner.extChangeAt);
				am.addAt = HUX.wrapFn(am.addAt, inner.extAddAt);
				am.removeAt = HUX.wrapFn(am.removeAt, inner.extRemoveAt);
			}
		},
		listen: function(context){
			if(pub.enabled)
				HUX.AtMgr.inner.findAnchors(context, pub.replaceEach);
			
		},
		
		replaceEach: function(el){
			el.href = inner.replaceHref(el.href);
			// we ensure that the listener will not be called twice
			HUX.Compat.addEventListenerOnce(el, "click", HUX.HashMgr.inner.onClick); 
		}
	};
	return pub;
	
})();

(function(am){
	am.setEnabled = HUX.wrapFn(am.setEnabled, function(fnOrig, val){
		HUX.AtMgrFb.enabled = !val;
		return fnOrig.execute(um);
	});
})(HUX.AtMgr);

HUX.addModule(HUX.AtMgrFb);


