 /**
    HTTP Using XML (HUX) : Core
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

//NOTE : some parts of HUX and its modules are still a bit fragile. They need simplification.
// core.hux.js 

//TODO : split the core ...
"use strict";
// nodeType Constants if not defined
if(!document.ELEMENT_NODE)
{
	document.ELEMENT_NODE = 1;
	document.ATTRIBUTE_NODE = 2;
	document.TEXT_NODE = 3;
	document.CDATA_NODE = 4;
	document.ENTITY_REFERENCE_NODE = 5;
	document.ENTITY_NODE = 6;
	document.PROCESSING_INSTRUCTION_NODE = 7;
	document.COMMENT_NODE = 8;
	document.DOCUMENT_NODE = 9;
	document.DOCUMENT_TYPE_NODE = 10;
	document.DOCUMENT_FRAGMENT_NODE = 11;
	document.NOTATION_NODE = 12;
}


/**
 * Namespace: HUX Core
 */
var HUX = {
	// ==============================
	// INNER FUNCTIONS AND PROPERTIES
	// MAY NOT BE USED DIRECTLY
	// ==============================
	inner:{
		modules : [],
		// loads each modules when the page is loaded
		initModuleLoader: function(){
			if(!HUX.enabled)
				return;
			HUX.Compat.Event.addEventListener(window, "load", function(){
				var mod;
				while( (mod = HUX.inner.modules.shift()) !== undefined )
					mod.init();
			});
		}
	},
	enabled: true,
	/**
	 * Function: init
	 * inits the core
	 */
	init: function(){
		// does nothing now ....
	},
	/**
	 * Function: addModule
	 * 
	 * registers a HUX module.
	 * 
	 * NOTE : currently, the function only adds an event listener for "load" event. 
	 * 	  However, this function might evolve later, so use this function to register your module.
	 * 
	 * Parameters:
	 * 	- *mod*: {Object} a HUX module implementing init() function
	 * 
	 * See also:
	 * 	- <addLiveListener>
	 * 
	 * Example of use:
	 * This simple module just show an alert with the message "hello world".
	 * >	HUX.hello = {
	 * >		init: function(){
	 * >			alert("hello world");
	 * >		}
	 * >	};
	 * >	HUX.addModule( HUX.hello );
	 */
	addModule: function(mod){
		HUX.inner.modules.push(mod);
	},
	/**
	 * Function: addLiveListener
	 * 
	 * calls listen(context, target) when the document is loaded or when HUX injects content
	 * 
	 * 
	 * NOTE : this method should be called in an init() method of a module
	 * 
	 * Parameters:
	 * 	- *listen*: {Function or HUX Module} an HUX module implementing listen or the listen function itself
	 * 
	 * Parameters of listen: 
	 * 	- *context*: {DocumentFragment} the DocumentFragment that is being inserted
	 * 	- *target*: {Element} the target where the context will be inserted
	 * 
	 * See also : 
	 * 	- <init>
	 * 
	 * Example of use #1 :
	 * >	HUX.hello = { 
	 * > 		listen: function(context){ 
	 * >			alert("hello world"); 
	 * >		},
	 * >		init: function(){
	 * >			HUX.addListener( HUX.hello );
	 * >		}
	 * >	};
	 * >	HUX.addModule( HUX.hello );
	 * 
	 * Example of use #2 :
	 * >	HUX.addLiveListener(function(context, target){
	 * >		alert('hello world');
	 * > 	});
	 */
	addLiveListener: function(arg1, thisObject){
		var listen = typeof arg1 === "object"? arg1.listen : arg1;
		if( listen === undefined )
			throw new TypeException("The module does not implement the following method : listen(context, target)");
		listen.call(thisObject || this, document, document);
		HUX.HUXEvents.bindGlobal("beforeInject", function(event){
			try{
				listen.call(thisObject || this, event.content, event.target);
			}
			catch(ex){
				HUX.logError(ex);
			}
		});
	},
	/**
	 * Function: logError
	 * logs errors in browser consoles
	 * 
	 * Parameters:
	 * 	- *ex* : {Error} the exception to log
	 */
	logError: function(ex){
		if(typeof console !== "undefined"){
			if(console.exception !== undefined){
				console.exception.apply(console, arguments);
			}
			else if(console.error !== undefined){
				console.error(ex);
				if(ex.message) // IE
					console.error(ex.message);
			}
		}
	},
	// we cannot use document.importNode directly, since XML is case-sensitive, and HTML node names are uppercase. So it would require 
	// 	that we write node names in uppercase in our Overlay XML document ... It is not natural, so we need to use something else.
	// thanks to Anthony Holdener for this js implementation of importNode : 
	// see http://www.alistapart.com/articles/crossbrowserscripting/
	/**
	 * Function: importNode
	 * a function similar to document.importNode, that import node from a document to the current HTML document. 
	 * See <https://developer.mozilla.org/en/DOM/document.importNode> for more information
	 * 
	 * Parameters:
	 * 	- *node*: {Node} the node to import
	 * 	- *allChildren*: {Boolean} set to true to also import its children (default: true)
	 * 
	 * Returns:
	 * 	- {Node} the imported node
	 */
	importNode: function(node, allChildren) {
		/* find the node type to import */
		allChildren = (allChildren === undefined || allChildren); // by default, allChildren=true
		switch (node.nodeType) {
			case document.ELEMENT_NODE:
				/* create a new element */
				var newNode = document.createElement(node.nodeName);
				/* does the node have any attributes to add? */
				if (node.attributes && node.attributes.length > 0)
					/* add all of the attributes */
					for (var i = 0, il = node.attributes.length; i < il;)
						newNode.setAttribute(node.attributes[i].nodeName, node.getAttribute(node.attributes[i++].nodeName));
				/* are we going after children too, and does the node have any? */
				if (allChildren && node.childNodes && node.childNodes.length > 0)
					/* recursively get all of the child nodes */
					for (var i = 0, il = node.childNodes.length; i < il;)
						newNode.appendChild(this.importNode(node.childNodes[i++], allChildren));
				return newNode;
				break;
			case document.TEXT_NODE:
			case document.CDATA_SECTION_NODE:
			case document.COMMENT_NODE:
				return document.createTextNode( node.nodeValue );
				break;
		}
	},
	
	
	/**
	 * HUX.wrapFn(wrapper) -> Function
	 * 
	 * Parameters: 
	 * - *orig* : {Function} the original function
	 * - *wrapper* : {Function} The function to use as a wrapper
	 * - *_this* : {Object} the value of this to call the wrapper
	 *
	 * Returns a function "wrapped" around the original function.
	 *
	 * see also http://www.prototypejs.org/api/function/wrap
	 **/
	 // inspired from Prototype Wrap Method : https://github.com/sstephenson/prototype/blob/master/src/prototype/lang/function.js
	wrapFn: function(orig, wrapper, _this){
		return function(){
			var a = [ orig ];
			orig.args = arguments; // the original arguments are set as fnOrig.args
			orig.execute = function(_this){ return orig.apply(_this, orig.args); }; // method to execute the proxied function with the arguments
			Array.prototype.push.apply(a, arguments); // <=> a.push(arguments);
			return wrapper.apply(_this, a);
		};
	},
	/**
	 * Namespace: HUXEvents
	 * HUX specific event Manager 
	 * Events :
	 *  - *beforeInject* : triggered before injecting content to the target element. 2 arguments : event.target = {Element} the target element, event.content = {DocumentFragment} the content that is being inserted
	 *  - *afterInject* : triggered after injecting content to the target element. 2 arguments : event.target = {Element} the target element, event.children = {NodeList} the inserted nodes
	 *  - *requestError* : triggered if an XMLHttpRequest failed. 3 argument : event.xhr = {XMLHttpRequest} the XHR object, event.filling = {String} the filling method, event.target: {Element} the target
	 *  - *loading* : triggered when a HUX request is running. 3 argument : event.target = {Element} the target of the HUX request, event.xhr = {XMLHttpRequest} the XHR object, event.xhrOpt: {Object} the provided xhr options
	 */
	HUXEvents: (function(){
		/** =================== PRIVATE ================== **/ 
		var GLOBAL = {};
		// array of listener for each event
		var arrEv = {
			"beforeInject":{GLOBAL:[]},
			"requestError":{GLOBAL:[]},
			"afterInject":{GLOBAL:[]},
			"loading":{GLOBAL:[]}
		};
		// adds a listener (generic method)
		var addListener = function(key, evName, fn){
			if(arrEv[evName]){
				if(! (key in arrEv[evName]) )
					arrEv[evName][key] = [];
				arrEv[evName][key].push(fn);
			}
			else
				throw new Error("the event "+evName+" does not exist for HUX");
		};
		// removes a listener (generic method)
		var removeListener = function(key, evName, fn){
			var array = arrEv[evName][key], i;
			if(array !== undefined){
				while((i = HUX.Compat.Array.indexOf(array, fn)) >= 0)
					array.splice(i, 1);
			}
		};
		// get the listeners of an event safely
		var getListeners = function(evName, tid){ 
			var lis = arrEv[ evName ];
			// if arrEv[ evName ][ tid ] does not exist, we return an empty array
			return ( lis && tid in lis ) ? lis[ tid ] : [];
		};
		
		/** ==================== PUBLIC ==================== **/
		
		var pub = {};
		/**
		 * Function: bindGlobal
		 * binds an event listener for all elements
		 * 
		 * Parameters:
		 * 	- *evName*: {String} the event Name
		 * 	- *fn*: {Function} the event listener
		 */
		pub.bindGlobal = function(evName, fn){// public
			return addListener(GLOBAL, evName, fn);
		};
		/**
		 * Function: unbindGlobal
		 * unbind an event listener that have been bound 
		 * 
		 * Parameters: 
		 * 	- *evName*: {String} the event Name
		 * 	- *fn*: {Function} the event listener to remove
		 */
		pub.unbindGlobal = function(evName, fn){
			return removeListener(GLOBAL, evName, fn);
		};
		
		/**
		 * Function: bind
		 * sort of addEventListener
		 * 
		 * Parameters: 
		 *	- *target* : {String} the target ID
		 * 	- *evName* : {String} the name of the event
		 * 	- *fn* : {Function} the listener
		 */
		pub.bind = function(target, evName, fn){
			return addListener(target, evName, fn);
		};
		/**
		 * Function: unbind
		 * sort of removeEventListener
		 * 
		 * Parameters: 
		 *	- *target* : {String} the target ID
		 * 	- *evName* : {String} the name of the event
		 * 	- *fn* : {Function} the listener to remove
		 */
		pub.unbind = function(target, evName, fn){
			return removeListener(target, evName, fn);
		};
		/**
		 * Function: trigger
		 * trigger all event Listener for a specific event 
		 * 
		 * Parameters:
		 * 	- *evName* : {String} the name of the Event (String)
		 * 	- *event* : {HUX Event Object} object with information about the event 
		 * NOTE : if the event has a target, put it as event.target
		 */
		pub.trigger = function(evName, event){
			try{
				var lsters = [], tid = (event.target?event.target.id : null), arrEv = arrEv;
				
				// we merge the listeners for the specific element and the listeners for GLOBAL
				if(tid)
					lsters = getListeners(evName, tid);
				lsters = lsters.concat( getListeners(evName, GLOBAL) );
				event.type = evName;
				// we trigger all the events
				HUX.Compat.Array.forEach(lsters, function(fn){
					fn.call(window, event);
				});
			}
			catch(ex){
				HUX.logError(ex);
			}
		};
		return pub;
	})(),

	/**
	 * Namespace: Inject
	 * 
	 * DOM Injection manager. 
	 */
	Inject:(function(){
		/** =================== INNER ================== **/ 
		var inner = {};
		inner.fillingMethods = {
			prepend: function(content, target){
				var aInserted;
				if(target.childNodes.length > 0){ // we use InsertBefore
					firstChild = target.firstChild;
					aInserted = target.insertBefore(content, firstChild);
				}
				else{ // if target has no children, we append 
					aInserted = target.appendChild(content);
				}
				return aInserted;
			},
			append: function(content, target){
				return target.appendChild(content);
			},
			replace: function(content, target){
				pub.empty(target);
				return pub.proceed(target, "append", content);
			}
		};
		
		
		
		/** =================== PUBLIC ================== **/ 
		
		var pub = {inner:inner};
		/**
		 * Function: proceed
		 * proceeds to the injection. Do not use this function directly. See <inject>
		 * 
		 * Parameters:
		 * 	- *target* : {Element} the element which will receive DOMContent
		 * 	- *method* : {String} the string tallying to hux:filling
		 * 	- *content* : {DocumentFragment, Document or String} elements to be added to target
		 * 
		 * NOTE : DOMContent is a DocumentFragment if it has been generated through a String, or a Document if it has been given as is by the brower. 
		 * 	If it is a Document, you may have to use <importNode>.
		 * 	In the most cases, it is a DocumentFragment.
		 * 
		 * Returns:
		 * 	- {NodeList of Elements} the inserted elements
		 */
		pub.proceed = function(target, method, content){
			if(!target || target.nodeType === undefined){
				throw new TypeError("invalid target");
			}
			return inner.fillingMethods[ method ].call(this, content, target);
		};
		/**
		 * Function: injectIntoDocFrag
		 * injects the nodeList (or any enumerable object of DOM elements) in a DocumentFragment
		 * and returns the last.
		 * 
		 * Parameters:
		 * 	- *nodes* : {NodeList} the nodes
		 * 
		 * Returns:
		 * 	- {DocumentFragment} the DocumentFragment with the cloned nodes
		 */
		pub.injectIntoDocFrag = function(nodes){
			var frag = document.createDocumentFragment(), node;
			while(nodes.length > 0){
				node = nodes[0];
				frag.appendChild( node );
				pub.pauseMedias( node );
			}
			return frag;
		};
		/**
		 * Function: empty
		 * removes each child of parent
		 * 
		 * Parameters:
		 * 	- *parent* : {Element} the parent to empty
		 */
		pub.empty = function(parent){
			var child;
			pub.pauseMedias(parent);
			while( (child=parent.firstChild) !== null )
				parent.removeChild(child);
		};
		
		/**
		 * Function: pauseMedias
		 * Pause any media in parent. 
		 * To be used before removing elements (since HTMLMediaElement specification says .
		 * 
		 * 
		 */
		pub.pauseMedias = function(parent){
			// we pause any HTMLMediaElement before emptying ( https://bugzilla.mozilla.org/show_bug.cgi?id=594748 )
			if(window.Audio === undefined || parent.querySelectorAll === undefined)
				return;
			HUX.Compat.Array.forEach(parent.querySelectorAll("audio, video"), function(media){
				media.pause();
			});
		};
		/**
		 * Function: htmltodom
		 * convert HTML String to DOM
		 * 
		 * Parameters:
		 * 	- *sHtml* : {String} String containing HTML
		 * 	- *context* : {Element} the element designed to receive the content
		 * 
		 * Returns:
		 * 	- {DocumentFragment} a DocumentFragment with the generated Elements
		 */
		pub.htmltodom = function(sHtml, context){
			var ret;
			// required by range.selectNodeContents, which is required by Chrome
			if(context === undefined || ! context.nodeType)
				throw "htmltodom : context is required and must be a node";
			
			if(window.Range !== undefined && Range.prototype.createContextualFragment !== undefined){ // better performance with createContextualFragment since we need to return the children
				var doc = (context !== undefined ? context.ownerDocument : document), range = doc.createRange();
				range.selectNodeContents(context); // required by Chrome
				ret = range.createContextualFragment(sHtml);
			}
			else{ // IE ...
				var parent = context.cloneNode(false);
				try{
					parent.innerHTML = sHtml;
				}
				catch(e){
					// IE doesn't allow using innerHTML with table,
					// but allows create a div element in which we inject the HTML String of a TABLE
					if(parent.tagName === "TABLE" ){
						if(/^<(tr|tbody)/i.test(sHtml)){
							parent = pub.htmltodom("<TABLE>"+sHtml+"</TABLE>", document.createElement("div")).firstChild;
						}
						else{
							HUX.logError("TABLE element can only have TR and TBODY elements as direct children");
						}
					}
					else
						HUX.logError(e);
				}
				ret = pub.injectIntoDocFrag(parent.childNodes);
				parent = null;
			}
			return ret;
		};
		
		return pub;
	})(),
	
	/**
	 * Function: inject
	 * 
	 * Parameters:
	 *	- *target* : {Element} the element which will receive @DOMContent
	 * 	- *method* : {String} the string tallying to hux:filling (default : "replace")
	 * 	- *content* : {String or Array of Elements} HTML String or Array of elements to be added to @target
	 */
	inject:function(target, method, content){
		var DOMContent , aInserted;
		if(typeof content === "string")
			DOMContent = this.Inject.htmltodom(content, target);
		else if(content.length !== undefined) // if the content is enumerable and is not a node
			DOMContent = this.Inject.injectIntoDocFrag( content );
		
		else
			throw new TypeError("content : invalid argument");
		
		if(! method) // if method === null, default is REPLACEMENT
			method = "replace";
		
		HUX.HUXEvents.trigger("beforeInject", {target: target, content: DOMContent})
		aInserted = HUX.Inject.proceed(target, method, DOMContent); 
		HUX.HUXEvents.trigger("afterInject", {target: target || document.body, children: aInserted});
	},
	/**
	 * Namespace: Selector
	 * DOM Selector Tool
	 */
	Selector: (function(){

		// for browsers which do not implement querySelector (mainly IE7-)
		// see its use in pub.byAttribute
		var inner = {};
		inner.oFnMatchAttrValIE = {
			"=": function(found, expected){
				return found === expected;
			},
			"*=": function(found, expected){
				return found.indexOf(expected) >= 0; 
			},
			"^=": function(found, expected){
				return found.indexOf(expected) === 0;
			},
			"$=": function(found, expected){
				return found.lastIndexOf(expected) === found.length - expected.length;
			},
			"~=": function(found, expected){
				return new RegExp("(^|\\s)"+expected+"(\\s|$)").test(found);
			},
			"": function() { return true;} // if no value expected, return true in all case
		};
		/**
		 * splits the attribute selector (ex. : "data-hux-filling='replace'") to get the attribute name, 
		 * 	the operator and the attribute value without quotes
		 * 
		 * Example of use: 
		 * > inner.splitAttrSel("data-hux-filling='replace'"); 
		 * // returns : {attrName:"data-hux-filling", op:"=", attrVal:"replace"}
		 */
		inner.splitAttrSel = function(attrSel){
			var resMatch = attrSel.match(/([^\^$*~=]+)([\^$*~]?=)?['"]?([^'"]*)['"]?/);
			return {
				attrName: resMatch[1],
				op: resMatch[2],
				attrVal: resMatch[3]
			};
		};
		

		var pub = {inner:inner};
		/**
		 * Function: byAttribute
		 * Selects elements by their attributes
		 * 
		 * Parameters:
		 * 	- *tagName*: {String} the tagName of the element you look for
		 * 	- *attrSel*: {String} the attribute selector (supported : "att", "att='val'", "att^='val', "att*='val'", "att$='val'"). See CSS3 attribute selectors
		 * 	- *context*: {Element or DocumentFragment} the element in which one will search (optional)
		 * 	- *fnEach*: {Function} thefunction executed for each result (optional)
		 * 
		 * Returns:
		 * 	- {Array of Elements} the elements found
		 */
		pub.byAttribute = function(tagName, attrSel, context, fnEach){
			context = context || document;
			if(context.querySelector !== undefined)
			{
				var result = context.querySelectorAll(tagName+"["+attrSel+"]");
				if(fnEach !== undefined)
					HUX.Compat.Array.forEach(result, fnEach);
				return result;
			}
			else{ // fallback (mostly for IE 7-)
				var resSplitAttrSel = inner.splitAttrSel(attrSel),
				    fnMatch = inner.oFnMatchAttrValIE[ resSplitAttrSel.op || "" ],
				    attrName = resSplitAttrSel.attrName, 
				    expectedVal = resSplitAttrSel.attrVal,
				    fnFilter = function(el){ 
					var foundVal = el.getAttribute(attrName);
					return (!!foundVal) && fnMatch(foundVal, expectedVal); // NOTE: IE7 returns "" if the attribute does not exist
				    }; 
				
				return pub.filterIE(tagName, fnFilter, context, fnEach);
			}
		};
		
		/**
		 * Function: byAttributeHUX
		 * similar to <byAttribute>, but searches for HUX attributes whatever the prefix is
		 * 
		 * Parameters:
		 * 	- *tagName*: {String} the tagName of the element you look for
		 * 	- *attrSel*: {String} the attribute selector (supported : "att", "att=val", "att^=val, "att*=val", "att$=val"). See CSS3 attribute selectors
		 * 	- *context*: {Element or DocumentFragment} the element in which one will search (optional)
		 * 	- *fnEach*: {Function} the function executed for each result (optional)
		 * 
		 * Returns:
		 * 	- {Array of Elements} the elements found
		 */
		pub.byAttributeHUX = function(tagName, attrSel, context, fnEach){
			var prefixedAttrSel = HUX.HUXattr.getAttrPrefix(attrSel);
			return pub.byAttribute(tagName, prefixedAttrSel, context, fnEach);
		};
		/**
		 * Function: byClassName
		 * selects elements by their class name
		 * 
		 * Parameters:
		 * 	- *className*: {String} the className
		 * 	- *context*: {Element or DocumentFragment} the element in which one will search (optional)
		 * 	- *fnEach*: {Function} the function executed for each result (optional)
		 */
		pub.byClassName = function(className, context, fnEach){
			var ret;
			context = context || document;
			if(context.querySelectorAll !== undefined)
			{
				ret = context.querySelectorAll('.'+className);
				if(fnEach !== undefined)
					HUX.Compat.Array.forEach( ret, fnEach );
			}
			else{
				var msieVersion = HUX.Browser.getMSIEVersion(), attrName;
				// IE 7- has a weird behaviour : to get the class attribute, you must use el.getAttribute("classname")
				// so, we detect IE 7-, and fix it. See : http://thicksliced.blogspot.fr/2006/12/elementgetattributeclass.html
				attrName = (msieVersion && msieVersion < 8 ? "classname" : "class");
				ret = pub.byAttribute("*", attrName+"~='"+className+"'", context, fnEach);
			}
			return ret;
		};
		/**
		 * Function: byId
		 * selects an element by its ID
		 * usefull to do treatments before the injection
		 * 
		 * Parameters:
		 * 	- *id*: {String} the ID
		 * 	- *context*: {Element or DocumentFragment} the element in which one will search (optional)
		 */
		pub.byId = function(id, context){
			context = context || document;
			if(context.querySelector)
				return context.querySelector("#"+id);
			else
				return pub.byAttribute("*", "id='"+id+"'", context)[0];
		};
		
		
		/**
		 * Function: filterIE
		 * IE does not implement document.evaluate. So, this function is a generic fallback
		 * 
		 * Parameters:
		 * 	- *tagName* : {String} the tagName of the element you look for
		 * 	- *fnFilter* : {Function} the function that returns true if the element matches
		 * 	- *context* : {Element or Document} the element where we will search for results (default: document)
		 * 	- *fnEach* : {Function} the function executed for each results (optional)
		 * 
		 * Example of use:
		 * >	var fnFilter, fnEach;
		 * >	fnFilter = function(el){
		 * >		return el.getAttribute("name"); // keeps only elements having the attribute "name"
		 * >	};
		 * >	fnEach = function(el){ 
		 * >		alert(el.getAttribute("bar"));
		 * >	};
		 * >	filterIE("a", fnFilter, document.getElementById("foo"), fnEach);
		 */
		pub.filterIE = function(tagName, fnFilter, context, fnEach){
			var ret = [], elts;
			context = context || document;
			fnEach = fnEach || function(){};
			// NOTE : we clone the array, because elts would be updated otherwise, behaviour that we do not want
			elts = Array.apply([], context.getElementsByTagName(tagName));
			// for each element found above
			HUX.Compat.Array.forEach(elts, function(el){
				// we test the Filter function given
				if( fnFilter(el) ){
					ret.push(el); // if the filter accepted the condition, we add the current element in the results
					fnEach(el);   // we call the for-each function given by the user
				}
			}, this);
			return ret;
		};
		return pub;
	})(),
	/**
	 * Namespace: XHR
	 * Prefer use directly <HUX.xhr> instead
	 */
	XHR: (function(){
		/** =================== INNER ================== **/ 
		var inner = {};
		inner.setReadystatechange = function(xhr, opt){
			try{
				var timeoutID;
				xhr.onreadystatechange = function(){
					try{
						if(xhr.readyState  === 4){
							window.clearTimeout(timeoutID);
							if(xhr.status  === 200) 
								opt.onSuccess(xhr, opt.filling, opt.target);
							else {
								HUX.HUXEvents.trigger("requestError", {xhr:xhr,filling:opt.filling,target:opt.target});
								opt.onError(xhr, opt.filling, opt.target);
							}
						}
					}
					catch(ex){
						HUX.logError(ex);
					}
				};
				// setting request timeout
				timeoutID = window.setTimeout(function(){
					opt.onTimeout(xhr, opt.filling, opt.target);
					xhr.abort();
				}, pub.timeout * 1000);
			}
			catch(ex){
				HUX.logError(ex);
			}
		};
		inner.getDefaultErrorMessage = function(xhr){
			return "<h1>"+xhr.status+" : "+xhr.statusText+"</h1>";
		}
		inner.ERROR_TARGET = "opt.target not defined or null";
		inner.ERROR_TIMEOUT = "<h1>Request timeout</h1>";
		/** =================== PUBLIC ================== **/ 
		var pub = {inner:inner};
		// see HUX.xhr(opt)
		pub.proceed = function(opt){
			if(! opt.url ) // opt.url === undefined || opt.url === null || opt.url === ""
				throw new TypeError("invalid argument : opt.url");
			
			if(typeof opt.target === "string"){ // if opt.target is an id string, get the matching element 
				var target = document.getElementById( opt.target );
				if(! target) // === undefined or === null
					throw "HUX.xhr: target of id '"+opt.target+"' not found";
				else
					opt.target = target;
			}
			
			try{
				var data = null, xhr;
				// default value for opt.async is true
				if(opt.async === undefined)
					opt.async = true;
				
				xhr = new XMLHttpRequest();
				
				// we add GET parameters to the URL. If there are some already, we add a "&"+opt.data to the string. Otherwise, we add "?"+opt.data
				if(opt.method.toLowerCase() === "get" && opt.data)
					opt.url += (opt.url.indexOf("?") >= 0 ? "&" : "?") +opt.data;
				else if(opt.method.toLowerCase() === "post")
					data = opt.data || null; // if opt.data is undefined, we set it to null
				// is there connection parameters ?
				if( opt.username )
					xhr.open(opt.method, opt.url, opt.async, opt.username, opt.password);
				else
					xhr.open(opt.method, opt.url, opt.async);
				
				if(opt.responseType){ // we try to apply a responseType
					try{ xhr.responseType = opt.responseType; } finally{}
				}
				// we get opt.onSuccess, opt.onError and opt.onTimeout if provided, or we set it to the default behaviour
				opt.onSuccess = opt.onSuccess || pub.onSuccess;
				opt.onError = opt.onError || pub.onError;
				opt.onTimeout = opt.onTimeout || pub.onTimeout;
				
				inner.setReadystatechange(xhr, opt);
				
				xhr.setRequestHeader("Content-Type", opt.contentType || "application/x-www-form-urlencoded");
				
				// if the user set requestHeaders
				if(opt.requestHeaders ){
					for(var hName in opt.requestHeaders)
						xhr.setRequestHeader(hName, opt.requestHeaders[hName]);
				}
					
				// we trigger the event "loading"
				
				HUX.HUXEvents.trigger("loading", {target: opt.target, xhrOpt:opt, xhr:xhr});
				xhr.send(data);
				return xhr;
			}
			catch(ex){
				HUX.logError(ex); // 
			}
		};
		/**
		 * Function: onSuccess
		 * function called by default on request success
		 */
		pub.onSuccess = function(xhr, filling, target){
			if( target )
				HUX.inject(target, filling, xhr.responseText);
			else
				HUX.logError( inner.ERROR_TARGET );
		};
		/**
		 * Function: onError
		 * function called by default on request error
		 */
		pub.onError = function(xhr, filling, target){
			if( target )
				HUX.inject(target, null, inner.getDefaultErrorMessage(xhr));
			else
				HUX.logError( inner.getDefaultErrorMessage(xhr) );
		};
		/**
		 * Function: onTimeout
		 * function called by default on request timeout
		 */
		pub.onTimeout = function(xhr, filling, target){
			if( target )
				HUX.inject(target, null, inner.ERROR_TIMEOUT);
			else
				HUX.logError( "Request timeout" );
		};
		/**
		 * PROPERTY: timeout 
		 * 
		 * timeout for a request (in seconds)
		 */
		pub.timeout = 60;
		return pub;
	})(),
	/* 
	 * Function: xhr
	 * does an XMLHttpRequest
	 * 
	 * Parameters: 
	 *  	- *opt* : {Option object}
	 * 
	 * opt:
	 * 	- *opt.url* : {String} the URL to load
	 * 	- *opt.method* : {String} the method : POST or GET
	 * 	- *opt.filling* : {String} the filling method ("replace", "append", "prepend", ...)
	 * 	- *opt.target* : {Element or String} the target (in which we will inject the content). Optional.
	 * 	- *opt.data* : {URLEncoded String} the data to send. Optional
	 *	- *opt.async* : {Boolean} asynchronous if true, synchronous if false (default = true)
	 *	- *opt.username* ; {String} the login (optional)
	 * 	- *opt.password* : {String} the password (optional)
	 *	- *opt.contentType* : {String} Content-Type Request Header (default = "application/x-www-form-urlencoded")
	 * 	- *opt.requestHeaders* : {HashMap} map of this type {"<headerName>":"<headerValue>" , ...}
	 * 	- *opt.responseType* : {String} the responseType if supported. (optional, default="document")
	 * 	- *opt.onSuccess* : {Function} function to trigger if the request succeeds (optional)
	 * 	- *opt.onError* : {Function} function to trigger if the request fails (optional)
	 * 	- *opt.onTimeout* : {Function} function to trigger if the request is timeout (optional)
	 */
	xhr: function(opt){
		return HUX.XHR.proceed(opt);
	},
	/**
	 * Namespace: HUXattr
	 * Attribute Manager for HUX
	 */
	HUXattr: (function(){
		/** =================== PUBLIC ================== **/ 
		var pub = {};
		/**
		 * Function: getAttributeHUX
		 * returns the attribute value whatever the HUX prefix is
		 * 
		 * Parameters:
		 * 	- *el*: {Element} the Element having the attribute
		 * 	- *name* : the unprefixed attribute name
		 * 
		 * Returns : 
		 * 	- {String} the value of the attribute
		 */
		pub.getAttributeHUX = function(el, name){
			return el.getAttribute( pub.getAttrPrefix(name) );
		};
		/**
		 * Function: getFillingMethod
		 * extracts the filling method from an element
		 * 
		 * Parameters: 
		 * 	- *el*: {Element} the element having this attribute
		 * 
		 * Returns:
		 * 	- {String} the value of the attribute
		 */
		pub.getFillingMethod = function(el){
			return pub.getAttributeHUX(el, "filling");
		};
		/**
		 * Function: getTarget
		 * gets the target element from another element having the target attribute
		 * 
		 * Parameters: 
		 * 	- *el*: {Element} the element having this attribute
		 * 
		 * Returns:
		 * 	- {Element} the value of the attribute
		 */
		pub.getTarget = function(el){
			var idTn = pub.getAttributeHUX(el, "target");
			return document.getElementById(idTn);
		};
		/**
		 * Function: getAttrPrefixes
		 * returns the prefixed attribute name 
		 * 
		 * Parameters: 
		 * 	- *attr*: {String} the unprefixed attribute name
		 * 
		 * Returns: 
		 * 	- {String} the prefixed attribute name
		 */
		pub.getAttrPrefix = function(attr){
			return "data-hux-"+attr;
		};
		return pub;
		
	})(),
	/**
	 * Namespace: Compat
	 * functions for cross-browsers compatibilities
	 */
	Compat: (function(){
		/** =================== PRIVATE ================== **/ 
		// do we use addEventListener or attachEvent ?
		var fn_addEventListener = (window.addEventListener? 'addEventListener':'attachEvent'),
		    fn_removeEventListener = (window.removeEventListener ? 'removeEventListener':'detachEvent'),
		    // does the event name have to be prefixed with 'on' ? (yes with attachEvent, no with addEventListener)
		    prefix_eventListener = (window.addEventListener? '':'on'),
		    ie_listeners = {};
		    
		    
		/** =================== PUBLIC ================== **/ 
		
		var pub = {
			Array:{},
			Element:{},
			Event: {}
		};
		/**
		 * Namespace: Compat.Event
		 * functions for cross-browsers compatibilities to manage events
		 */
		
		/**
		 * Function: addEventListener
		 * adds a DOM event listener to an element
		 * 
		 * Parameters:
		 *	- *target* : {Element} the event target 
		 *	- *evName* : {String} the name of the event
		 *	- *fn* : {Function} the function to call when the event is triggered
		 * 
		 * See Also:
		 * 	- <removeEventListener>
		 * 	- <addEventListenerOnce>
		 * 	- <getEventTarget>
		 * 	- <preventDefault>
		 * 
		 * Example of use: 
		 * >	function liLoad(ev){ alert("page loaded") };
		 * >	HUX.Compat.Event.addEventListener(window, "load", liLoad );
		 */
		pub.Event.addEventListener = function(target, evName, fn){
			evName = prefix_eventListener+evName;
			var listener = fn;
			if( document.addEventListener === undefined ){
				// we set currentTarget for IE
				// TODO : place evName in the index
				ie_listeners[fn] = listener = function(ev){
					ev.currentTarget = window.event.currentTarget = target;
					return fn.apply(this, arguments);
				}
			}
			
			return target[fn_addEventListener](evName, listener, false);
		};
		
		/**
		 * Function: removeEventListener
		 * removes a DOM event listener from an element
		 * 
		 * Parameters: 
		 *	- *target* : {Element} the event target 
		 *	- *evName* : {String} the name of the event
		 *	- *fn* : {Function} the listener function to remove
		 * 
		 * See Also:
		 * 	- <addEventListener>
		 * 
		 * Example of use:
		 * >	HUX.Compat.Event.removeEventListener(window, "load", liLoad);
		 * 
		 */
		pub.Event.removeEventListener = function(target, evName, fn){
			var listener = fn;
			evName = prefix_eventListener+evName;
			if(document.addEventListener === undefined){
				listener = ie_listeners[fn] || fn;
				// we cannot delete ie_listeners since other element may also be listened
			}
			return target[fn_removeEventListener](evName, listener, false);
		};
		/**
		 * Function: addEventListenerOnce
		 * adds an event listener and ensure that the listener will be called only once
		 * 
		 * 
		 * Parameters: 
		 *	- *target* : {Element} the event target 
		 *	- *evName* : {String} the name of the event
		 *	- *fn* : {Function} the function to call when the event is triggered
		 * 
		 * See Also:
		 * 	- <addEventListener>
		 * 	- <removeEventListener>
		 */
		pub.Event.addEventListenerOnce = function(){
			pub.Event.removeEventListener.apply(this, arguments);
			pub.Event.addEventListener.apply(this, arguments);
		};
		/**
		 * Function: getEventTarget
		 * returns the target of the DOM event
		 * 
		 * Parameters: 
		 * 	- *ev* : {DOM Event} the DOM Event Object passed as a parameter to the listener
		 * 
		 * Returns:
		 * 	- {Element} the target of the Event
		 * 
		 * Example of use: 
		 * >	function liClick(ev){
		 * >		var target = HUX.Compat.Event.getEventTarget(ev); 
		 * >		alert("the tagName of the element clicked is " + target.tagName);
		 * >	}
		 * >	HUX.Compat.Event.addEventListener(document.body, "click", liClick);
		 * 	
		 */
		pub.Event.getEventTarget = function(event){
			return event.currentTarget;
		};
		
		/**
		 * Function: preventDefault
		 * prevents the default behaviour of an event
		 * 
		 * Parameters: 
		 * 	- *ev* : {DOM Event} the DOM Event Object passed as a parameter to the listener
		 * 
		 * Example of use:
		 * >	function liClick(ev){
		 * >		alert("nothing else will happen, even if you clicked on a link");
		 * > 		HUX.Compat.Event.preventDefault(ev);
		 * >	}
		 * >	HUX.Compat.Event.addEventListener(document.body, "click", liClick);
		 * 
		 * 
		 */
		pub.Event.preventDefault = function(ev){
			if(window.event === undefined) // not IE
				ev.preventDefault();
			else // IE
				event.cancelBubble = event.returnValue = false;
		};
		
		
		/**
		 * Namespace: Compat.Array
		 * functions for cross-browsers compatibilities for Arrays
		 */
		
		/**
		 * Function: forEach
		 * do a for-each of the array
		 * 
		 * Parameters:
		 * 	- *array* : {Array} the array (or nodelist or any list-object with integer key)
		 * 	- *fn* : {Function} the function called for each element
		 * 
		 * Example of use: 
		 * > 	forEach(document.getElementsByTagName("*"), function(el){ 
		 * > 		alert(el.tagName); 
		 * > 	});
		 */
		pub.Array.forEach = Array.forEach || function(array, fn, t){
			if(Array.prototype.forEach !== undefined )
				Array.prototype.forEach.call(array, fn, t);
			else {
				for(var i = 0; i < array.length; i++)
					fn.call(t||this, array[i], i, array);
			}
		};
		/**
		 * Function: indexOf
		 * returns the index of an object in the array, or -1 if not found
		 * 
		 * Parameters:
		 * 	- *array* : {Array} the array (or nodelist or any list-object with integer key)
		 * 	- *obj* : {Object} the element to find
		 * 
		 * Example of use: 
		 * > 	indexOf(["a","b","c"], "b"); // => 1
		 * >	indexOf(["a","b","c"], "d"); // => -1
		 */
		pub.Array.indexOf = Array.indexOf || function(array, obj){
			var ap = Array.prototype;
			return ap.indexOf !== undefined? ap.indexOf.apply(arguments[0], Array.prototype.slice.call(arguments, 1)) : (function(){
				for(var i = 0; i < array.length; i++){
					if(array[i] === obj)
						return i;
				}
				return -1;
			})();
		};
		/**
		 * Namespace: Compat.Element
		 * functions for cross-browsers compatibilities for Elements
		 */
		
		/**
		 * Function: contains
		 * returns true if *parent* contains *candidate*
		 * 
		 * Parameters:
		 * 	- *parent*: {Node} the possible parent element
		 * 	- *candidate*: {Node} the possible descendent
		 * 
		 * Returns:
		 * 	- {Boolean} true if *parent* contains *candidate*
		 */
		pub.Element.contains = function(parent, candidate){
			if(window.Element !== undefined && Element.prototype.contains !== undefined)
				return parent.contains(candidate);
			else{
				var isDesc = false, cur = candidate; // is the candidate descendent of target ?
				while( cur !== null && !isDesc){ // we go through the ancestors of candidate
					isDesc = (cur === parent); 
					cur = cur.parentNode;
				}
				return isDesc;
			}
		};
		
		return pub;
	})(),
	/**
	 * Namespace: Browser
	 * information about the used browser
	 */
	Browser: (function(){
		/** =================== PRIVATE ================== **/ 
		var __prefixes = {"Gecko":"moz", "AppleWebKit":"webkit", "Presto":"o", "Trident":"ms"}
		
		/** =================== PUBLIC ================== **/ 
		var pub = {};
		pub.layout_engine= /(Gecko|AppleWebKit|Presto)\/|(MSIE) /.exec(navigator.userAgent)[0].replace(/(\/| )$/, "").replace("MSIE", "Trident");
		/**
		* Function: evtPrefix
		* returns the prefix for browser-specific events (like (webkit|o)transitionend for Webkit and Presto)
		*/
		pub.evtPrefix= function(){
			return __prefixes[pub.layout_engine]; // example : moz
		};
		/**
		* Function: cssPrefix
		* returns the prefix for browser-specific css properties (like (-webkit-|-o-|-moz-)transition)
		*/
		pub.cssPrefix = function(){
			return "-"+pub.evtPrefix()+"-"; // example : -moz-
		};
		pub.domPrefix = function(){
			var prefix = pub.evtPrefix();
			return prefix === "ms" ? 
				prefix : 
				prefix.charAt(0).toUpperCase() + prefix.slice(1);
		};
		/*pub.isOldMSIE = function(){
			return /MSIE [0-8]/.test(navigator.userAgent);
		};*/
		pub.getMSIEVersion = function(){
			return document.documentMode || 
				( (navigator.userAgent.match(/MSIE ([0-9]+)/) || [null, null])[1] );
		}
		return pub;
	})()
};

HUX.addModule( HUX );

HUX.inner.initModuleLoader();



