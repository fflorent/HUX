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

HUX.AtMgrFb = {
	enabled: ! HUX.AtMgr.inner.enabled,
	init: function(){
		if(this.enabled){
			HUX.addLiveListener(this);
		}
	},
	listen: function(context){
		if(this.enabled)
			HUX.AtMgr.inner.findAnchors(context, this.replaceEach);
		
	},
	
	replaceEach: function(el){
		el.href = el.href.replace(/^.*@/, "#!").replace(/,([^!])/g, ",!$1");
		// we ensure that the listener will not be called twice
		HUX.Compat.addEventListenerOnce(el, "click", HUX.HashMgr.onClick); 
	}
	
};
(function(am){
	am.setEnabled = HUX.wrapFn(am.setEnabled, function(fnOrig, val){
		HUX.AtMgrFb.enabled = !val;
		return fnOrig.execute(um);
	});
})(HUX.AtMgr);
HUX.addModule(HUX.AtMgrFb);
