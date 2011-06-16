 /**
    HTTP by Using XML (HUX) : Core
    Copyright (C) 2011  Florent FAYOLLE

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
**/
 
// core.hux.js 

var HUX = {};
/**
 * Common tools
 */
HUX.core = {
	init: function(){
		this.Selector.init();
		
	},
	namespace: "http://www.example.org/HUX",
	/**
	 * HUX specific event Manager 
	 * Events :
	 *  - beforeInject : triggered before injecting content to the target node (1 argument : the nodes to be added)
	 *  - beforeEmpty : triggered before emptying target node (1 argument : the node to be emptied)
	 *  - requestError : triggered if an XMLHttpRequest failed (1 argument : the XHR object)
	 */
	HUXevents:{
		// array of listener for each event
		__arrEv:{
			"beforeInject":[],
			"beforeEmpty":[],
			"requestError":[]
		},
		// sort of addEventListener
		add:function(evName, fn){
			var arrEv = this.__arrEv;
			if(arrEv[evName])
				this.__arrEv[evName].push(fn);
			else
				throw "the event "+evName+" does not exist for HUX";
		},
		// sort of removeEventListener
		remove: function(evName, fn){
			HUX.core.removeElement(this.__arrEv[evName], fn);
		},
		/**
		 * trigger all event Listener for a specific event 
		 * trigger(evName, args)
		 * 	@evName : the name of the Event (String)
		 * 	@args : the arguments to give to each listener
		 */
		trigger: function(evName, args){
			HUX.core.foreach(HUX.core.HUXevents.__arrEv[evName], function(fn){
				var ret = fn.apply(window, args);
				if(ret === false)
					throw "trigger stoped";
			});
		}
	},
	// to log error properly
	logError: function(ex){
		if(typeof console !== "undefined"){
			console.error(ex);
		}
	},
	/**
	 * DOM Injection manager
	 */
	Inject:{
		/**
		 * init(target, method, DOMContent)
		 * 	@target : the element which will receive @DOMContent
		 * 	@method : the string tallying to hux:filling
		 * 	@DOMContent : Array of elements to be added to @target
		 */
		init: function(target, method, DOMContent){
			var sMethods = this.sMethods, firstChild;
			switch(method){
				case sMethods.PREPEND:
					if(target.childNodes.length > 0){ // we use InsertBefore
						HUX.core.HUXevents.trigger("beforeInject", [DOMContent]);
						firstChild = target.firstChild;
						HUX.core.foreach(DOMContent, function(el){
							target.insertBefore(el, firstChild);
						});
					}
					else{ // if target has no children, we append 
						return this.init(target, sMethods.APPEND, DOMContent);
					}
					break;
					
				case sMethods.APPEND: 
					HUX.core.HUXevents.trigger("beforeInject", [DOMContent]);
					while(DOMContent.length > 0)
						target.appendChild(DOMContent[0]);
					break;
					
				case sMethods.REPLACE:
					// In order to replace the content of the target, we empty it, and we append DOMContent in it
					this.empty(target);
					return this.init(target, sMethods.APPEND, DOMContent);
			}
		},
		// constants
		sMethods:{
			PREPEND:"prepend",
			APPEND:"append",
			REPLACE:"replace"
		},
		// remove each child of parent
		empty: function(parent){
			var child;
			HUX.core.HUXevents.trigger("beforeEmpty", [parent]);
			while( (child=parent.firstChild) !== null ){
				parent.removeChild(child);
			}
		},	
		/**
		* get all the children from a parent Node
		*/
		getChildren: function(parent){
			return parent.childNodes;
		},
		/**
		 * convert HTML String to DOM
		 * @sHtml : String containing HTML
		 * @context : the node designed to receive the content (optionnal)
		 */
		htmltodom: function(sHtml, context){
			var parent = context ? context.cloneNode(false) : document.createElement('div');
			try{
				parent.innerHTML = sHtml;
			}
			catch(e){
				// IE doesn't allow using innerHTML with table,
				// but allows create a div element in which we inject the HTML String of a TABLE
				if(parent.tagName === "TABLE")
					parent = this.htmltodom("<TABLE>"+sHtml+"</TABLE>", null)[0];
			}
			return this.getChildren(parent);
		}
	},
	/**
	 * inject(target, method, content)
	 * 	@target : the element which will receive @DOMContent
	 * 	@method : the string tallying to hux:filling (default : "replace")
	 * 	@content : HTML String or Array of elements to be added to @target
	 */
	inject:function(target, method, content){
		var DOMContent;
		if(typeof content === "string")
			DOMContent = HUX.core.Inject.htmltodom(content, target);
		else if(content instanceof Array)
			DOMContent = content;
		else
			throw new TypeError("content : invalid argument");
		if(! method) // if method === null, default is REPLACEMENT
			method = HUX.core.Inject.sMethods.REPLACE;
		HUX.core.Inject.init.call(HUX.core.Inject, target, method, DOMContent); 
	},
	/**
	 * DOM Selector Tool
	 */
	Selector: {
		__prefixTN: "",
		init: function(){
			// check whether we are using html or xhtml ...
			if(document.evaluate !== undefined){
				if( this.evaluate("/html").length > 0 )
					this.__prefixTN = "";
				else if(this.evaluate("/xhtml:html").length > 0)
					this.__prefixTN = "xhtml:";
				else
					throw new TypeError("Document non supported by HUX");
			}
		},
		prefixTagName: function(tagName){
			return this.__prefixTN+tagName;
		},
		/**
		 * Select nodes by their attributes
		 * byAttribute(attr, context, fnEach)
		 * 	@attr : String, attribute to look for
		 * 	@context : the node in which one will search (optionnal)
		 * 	@fnEach : function executed for each result (optionnal)
		 */
		byAttribute: function(tagName, attr, context, fnEach){
			var xpath, prefixedTN = this.prefixTagName(tagName);
			if(typeof document.evaluate !== "undefined"){
				xpath = "//"+prefixedTN+"[@"+attr+"]";
				return this.evaluate(xpath, context, fnEach);
			}
			else
				return this.__byAttributeIE(tagName, attr, context, fnEach);
		},
		
		/**
		 * similar to byAttribute() 
		 * but search for HUX attributes whatever the prefix is
		 */
		byAttributeHUX: function(tagName, attr, context, fnEach){
			var xpath, prefixedTN, attrs = HUX.core.HUXattr.getAttrAllPrefixes(attr), sAttrXP, ieRet = [];
			prefixedTN = this.prefixTagName(tagName);
			if(typeof document.evaluate !== "undefined"){
				sAttrXP = attrs.join(" or @"); // sAttrXP = "data-attr OR @data-hux-attr OR @hux:attr"
				xpath = "//"+prefixedTN+"[@"+sAttrXP+"]";
				return this.evaluate(xpath, context, fnEach);
			}
			else{
				HUX.core.foreach(attrs, function(attr){
					ieRet = ieRet.concat( this.__byAttributeIE(tagName, attr, context, fnEach) );
				});
				return ieRet;
			}
		},
		/**
		 * function used by document.evaluate for Namespaces
		 */
		__nsResolver:function(prefix){
			var ns = {
				"hux":HUX.core.namespace,
				"xhtml":"http://www.w3.org/1999/xhtml"
			};
			if(!prefix)
				return ns.xhtml;
			return ns[prefix];
		},
		/**
		 * we use document.evaluate instead of document.querySelectorAll because of
		 * the non-implementation of namespace gestion in CSS3 selectors 
		 * 
		 * evaluate(sXpath, context, fnEach)
		 * 	sXpath : xpath String
		 * 	context : the node where we will search for results (default : document)
		 * 	fnEach : the function executed for each results
		 * 
		 * See Also prefixTagName for convenience with elements tagnames
		 */
		evaluate:function(sXpath, context, fnEach){
			context = context || document.documentElement;
			fnEach = fnEach || function(){};
			var results = document.evaluate(sXpath, context, this.__nsResolver, XPathResult.ANY_TYPE, null); 
			var thisResult;
			var ret = [];
			while ( (thisResult = results.iterateNext()) !== null) {
				ret.push(thisResult);
				fnEach(thisResult);
			}
			return ret;
		},
		/**
		 * IE does not implement document.evaluate
		 * This function is a fallback for Selector.byAttribute
		 */
		__byAttributeIE: function(tagName, attr, context, fnEach){
			var fnFilter = function(){  return this.getAttribute(attr) !== null;  };
			return this.filterIE(tagName, fnFilter, context, fnEach);
		},
		/**
		 * IE does not implement document.evaluate
		 * This function is a generic fallback
		 */
		filterIE: function(tagName, fnFilter, context, fnEach){
			var ret = [], elts;
			context = context || document;
			fnEach = fnEach || function(){};
			
			elts = context.getElementsByTagName(tagName);
			// for each element found above
			HUX.core.foreach(elts, function(el){
				// we test the Filter function given
				if( fnFilter.call(el) ){
					ret.push(el); // if the filter accepted the condition, we add the current element in the results
					fnEach(el);   // we call the for-each function given by the user
				}
			});
			return ret;
		}
	},
	/**
	 * XMLHttpRequest Class
	 */
	XHR: {
		// see HUX.core.xhr(opt)
		init: function(opt){
			if(!opt.target || opt.url.length === 0)
				throw "invalid arguments";
			try{
				var data = null, xhr;
				if(opt.async === undefined)
					opt.async = true;
				xhr = this.getXhrObject();
				
				// we add GET parameters to the URL. If there are some already, we add a "&"+opt.data to the string. Otherwise, we add "?"+opt.data
				if(opt.method.toLowerCase() === "get" && typeof opt.data !== "undefined" && opt.data)
					opt.url += (opt.url.indexOf("?") >= 0 ? "&" : "?") +opt.data;
				else if(opt.method.toLowerCase() === "post")
					data = opt.data;
				
				if( opt.username )
					xhr.open(opt.method, opt.url, opt.async, opt.username, opt.password);
				else
					xhr.open(opt.method, opt.url, opt.async);
				
				this.setReadystatechange(xhr, opt.filling, opt.target);
				xhr.setRequestHeader("Content-Type", opt.contentType || "application/x-www-form-urlencoded");
				xhr.send(data);
			}
			catch(ex){
				HUX.core.logError(ex); // 
			}
		},
		// taken from jQuery, returns an XMLHttpRequest object
		getXhrObject: function(){
			return window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
		},
		onSuccess: function(rspText, xhr, filling, target){
			HUX.core.inject(target, filling, rspText);
		},
		onError: function(xhr){
			HUX.core.HUXevents.trigger("requestError", arguments);
		},
		setReadystatechange: function(xhr, filling, target){
			try{
				var self = this;
				xhr.onreadystatechange = function(){
					try{
						if(xhr.readyState  === 4){
							if(xhr.status  === 200) 
								self.onSuccess(xhr.responseText, xhr, filling, target);
							else 
								self.onError(xhr);
						}
					}
					catch(ex){
						HUX.core.logError(ex);
					}
				};
			}
			catch(ex){
				HUX.core.logError(ex);
			}
		}
	},
	/* does an XMLHttpRequest
	* argument : opt
	* 	opt.url
	* 	opt.method = POST or GET
	* 	opt.data : data to send
	*	opt.onSuccess: function executed once xhr request is complete
	*	opt.onError: function executed if xhr request has failed
	*	opt.async : request is asynchronous (opt.async = true) or synchronous (opt.async = false) ?
	*	opt.username, opt.password : login and password
	*	opt.contentType: Content-Type Request Header
	*	opt.srcNode: Node that have targetNodes or appendNodes attribute
	*/
	xhr:function(opt){
		return HUX.core.XHR.init.apply(HUX.core.XHR, arguments);
	},
	/**
	 * Attribute Manager for HUX
	 */
	HUXattr: {
		__getAttributeNS: function(srcNode, name){
			return srcNode.getAttributeNS ? srcNode.getAttributeNS(HUX.core.namespace, name) : srcNode.getAttribute("hux:"+name);
		},
		getAttributeHUX: function(srcNode, name){
			var ret = null,  attrs = this.getAttrAllPrefixes(name), i;
			for(i = 0; i < attrs.length && ret === null; i++){
				ret = srcNode.getAttribute( attrs[i] );
			}
			if(ret === null) // this might be because of non-support of Opera for getAttribute("hux:...")
				ret = HUX.core.HUXattr.__getAttributeNS(srcNode, name);
			if(ret === "") // correct odd behaviour of getAttributeNS, which returns "" if the attribute was not found
				ret = null;
			return ret;
		},
		getFillingMethod: function(srcNode){
			return this.getAttributeHUX(srcNode, "filling");
		},
		getTargetNode: function(srcNode){
			var idTn = this.getAttributeHUX(srcNode, "targetnode");
			return document.getElementById(idTn);
		},
		getAttrAllPrefixes: function(attr){
			return [
				"data-hux-"+attr,
				"data-"+attr,
				"hux:"+attr,
				attr
			];
		}
		
	},
	
	// do we use addEventListener or attachEvent ?
	__fn_addEventListener : (window.addEventListener? 'addEventListener':'attachEvent'),
	__fn_removeEventListener : (window.removeEventListener ? 'removeEventListener':'detachEvent'),
	// does the event name have to be prefixed with 'on' ? (yes with attachEvent, no with addEventListener)
	__prefix_eventListener: (window.addEventListener? '':'on'),
	/**
	 * HUX.core.addEventListener(target, evName, fn);
	 *	target : the event target 
	 *	evName : the name of the event
	 *	fn : the function to call when the event is triggered
	 */
	addEventListener: function(target, evName, fn){
		evName = this.__prefix_eventListener+evName;
		return target[this.__fn_addEventListener](evName, fn, false);
	},
	removeEventListener: function(target, evName, fn){
		evName = this.__prefix_eventListener+evName;
		return target[this.__fn_removeEventListener](evName, fn, false);
	},
	getEventTarget: function(ev){
		return window.event === undefined ? ev.target : event.srcElement;
	},
	preventDefault: function(ev){
		if(window.event === undefined) // not IE
			ev.preventDefault();
		else // IE
			event.cancelBubble = event.returnValue = false;
	},

	
	foreach: function(array, fn){
		var i;
		for(i = 0; i < array.length; i++)
			fn(array[i]);
	},
	// Inspired From : Array Remove - By John Resig (MIT Licensed)
	removeElement: function(array, el){
		var index = array.indexOf(el);
		if(index < 0)
			throw "the element is not present in the array";
		var rest = array.slice(index + 1);
		// recursion. We remove all "el"
		if(rest.indexOf(el) >=0)
			rest.removeElement(el);
		array.length = index;
		return array.push.apply(array, rest);
	},
	
	// ensures that any node added by HUX would be listened
	recursiveListen: function(jsNamespace){
		jsNamespace.listen(document.documentElement);
		HUX.core.HUXevents.add("beforeInject", function(children){
			HUX.core.foreach(children, function(child){
				jsNamespace.listen(child); 
			});
		});
	},
	// just call init when the page is loaded... 
	addModule: function(mod){
		HUX.core.addEventListener(window, "load", function(){
			mod.init();
		});
	}
};
HUX.core.addModule(HUX.core);


