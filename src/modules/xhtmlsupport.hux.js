/**
    HTTP Using XML (HUX) : XHTML Support
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
/// NEEDS A TEST
// xhtmlsupport.hux.js
HUX.XHTMLSupport = (function(){
	// private
	var prefixTN = ""; // see INITIALIZATION
	var doctype = document.doctype ? 
			document.doctype.publicId : document.all[0].text; 
	// we enable XHTMLSupport only if we detect XHTML in the doctype
	var enabled = (doctype || "").indexOf("XHTML") >= 0;
	
	/**
	 * variable: namespace
	 * {String} the namespace of HUX for XHTML 
	 */
	var namespace = "urn:hux:1.0";
	
	var pub;
	var selByAttributeHUX;
	/**
	 * Function: evaluate
	 * 
	 * evaluates an XPath Expression
	 * 
	 * NOTES: 
	 *  - use Selector.filterIE when you detect that IE is being used
	 *  - we use document.evaluate instead of document.querySelectorAll because of the non-implementation of namespace gestion in CSS3 selectors 
	 *  - if you use a context, your xpath expression may begin with a dot (example : "./descendant-or-self::p" for selecting all paragraphs in the context)
	 *  - See Also prefixTagName for convenience with the tagName of the elements
	 * 
	 * Parameters:
	 * 	- *sXpath* : {String} the xpath expression
	 * 	- *context* : {Element or Document} the element where we will search for results (default : document)
	 * 	- *fnEach* : {Function} the function executed for each results (default: empty function)
	 * 
	 * Returns: 
	 * 	- {Array of Elements} the found elements
	 */
	var evaluate = function(sXpath, context, fnEach){
		context = context || document;
		fnEach = fnEach || function(){};
		var results = document.evaluate(sXpath, context, pub.nsResolver, XPathResult.ANY_TYPE, null); 
		var thisResult;
		var ret = [];
		while ( (thisResult = results.iterateNext()) !== null) {
			ret.push(thisResult);
			fnEach(thisResult);
		}
		return ret;
	};
	/**
	 * Function: nsResolver
	 * function used by document.evaluate in <evaluate> for namespaces
	 * 
	 * Parameters:
	 * 	- *prefix*: {String} the prefix used in the XPath expression
	 * 
	 * Returns :
	 * 	- {String} the namespace
	 */
	var nsResolver = function(prefix){
		var ns = {
			"hux":pub.namespace,
			"xhtml":"http://www.w3.org/1999/xhtml"
		};
		if(!prefix)
			return ns.xhtml;
		return ns[prefix];
	};
	
	var getAttributeNS = function(srcElement, name){
		// workaround if getAttributeNS is not provided
		return srcElement.getAttributeNS ? srcElement.getAttributeNS(pub.namespace, name) : srcElement.getAttribute("hux:"+name);
	};
	
	HUX.HUXattr.getAttributeHUX = HUX.wrapFn(HUX.HUXattr.getAttributeHUX , function(fnOrig, el, name){
		return pub.enabled ? getAttributeNS(el, name) : fnOrig.execute();
	});
	HUX.HUXattr.getAttrPrefix = HUX.wrapFn(HUX.HUXattr.getAttrPrefix, function(fnOrig, attrName){
		return pub.enabled ? "hux:"+attrName : fnOrig.execute();
	});
	/**
	 * Function: prefixTagName
	 * adds the prefix for the element depending on the document type (html or xhtml)
	 * to be used to write an XPath Expression
	 * 
	 * Parameters:
	 * 	- *tagName*: {String} the tagName
	 * 
	 * Returns:
	 * 	- {String} the prefixed tagName
	 */
	var prefixTagName= function(tagName){
		return prefixTN+tagName;
	};
	var oMapAttrValue = {
		"*=": function(attrName, attrVal){
			return "contains(@"+attrName+", \""+attrVal+"\")";
		},
		"^=": function(attrName, attrVal){
			return "starts-with(@"+attrName+", \""+attrVal+"\")";
		},
		"=": function(attrName, attrVal){
			return "@"+attrName+"=\""+attrVal+"\"";
		},
		"$=": function(attrName, attrVal){
			return "substring(@"+attrName+", string-length(@"+attrName+")- string-length(\""+attrVal+"\") +1) = \""+attrVal+"\"";
		},
		undefined: function(attrName, attrVal){
			return "@"+attrName;
		}
	};
	// override HUX.Selector.byAttributeHUX
	selByAttributeHUX = function(fnOrig, tagName, attrSel, context, fnEach){
		if(!pub.enabled)
			return fnOrig.execute();
		var xpath, prefixedTN, sAttrXP, ieRet = [];
		prefixedTN = pub.prefixTagName(tagName);
		if(document.evaluate !== undefined){
			var resSplit = HUX.Selector.inner.splitAttrSel(attrSel),
			    attrName = HUX.HUXattr.getAttrPrefix(resSplit.attrName),
			    attrVal = resSplit.attrVal,
			    sAttrXP = ( oMapAttrValue[resSplit.op] )(attrName, attrVal);
			xpath = "./descendant-or-self::"+prefixedTN+"["+sAttrXP+"]";
			return pub.evaluate(xpath, context, fnEach);
		}
		else{
			HUX.Selector.byAttribute.call(HUX.Selector, tagName, attr, context, fnEach);
		}
	};
	HUX.Selector.byAttributeHUX = HUX.wrapFn(HUX.Selector.byAttributeHUX, selByAttributeHUX);
	
	
	
	// public
	pub = {
		enabled:enabled,
		evaluate: evaluate,
		nsResolver: nsResolver,
		namespace:namespace,
		prefixTagName: prefixTagName
	};
	// INITIALIZATION
	setTimeout(function(){
		if(document.evaluate !== undefined){
			if( pub.evaluate("/html").length > 0 )
				prefixTN = "";
			else if(pub.evaluate("/xhtml:html").length > 0)
				prefixTN = "xhtml:";
			else
				throw new Error("Document non supported by HUX");
		}
	}, 0);
	return pub;
})();

//HUX.addModule( HUX.XHTMLSupport );