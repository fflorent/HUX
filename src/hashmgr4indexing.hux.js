 // depends on HashMgr (hashmgr.hux.js)
 
 /**
    HTTP Using XML (HUX) : Hash Manager
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
  * This module just extends the HashMgr module
  * To let Search Engines index websites.
  * 
  * To do so, instead of using this kind of Anchor Element : <a href="#!TARGET=URL">...</a>
  * We permit to use this kind one : <a href="FALLBACK_URL" data-hux-href="#!TARGET=URL">...</a>
  */
 
(function(hm, hc) {
	// extend old function HUX.HashMgr.listen to add some treatments before 
	hm.listen = hm.listen.hux_wrap(function(origFn, context){
		try{
			// before calling the original HashMgr.listen()
			// we transpose HUX-prefixed href to non-prefixed href
			var elts = hc.Selector.byAttributeHUX("a", "href", context); // get all anchors with the HUX prefixed href attribute
			hc.foreach(elts, function(el){
				el.setAttribute("href", hc.HUXattr.getAttributeHUX(el, "href"));
			});
		}
		finally{
			var args = Array.prototype.slice.call(arguments, 1); // we do not keep origFn in arguments for calling the original function
			origFn.apply(this, args);
		}
	});
	
})(HUX.HashMgr, HUX);