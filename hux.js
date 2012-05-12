
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
				// NOTE : appendChild or insertBefore with a DocumentFragment returns the DocumentFragment (without childNodes)
// 				// but we want the inserted content, so we copy these childNodes in a new array : 
				var aInserted = Array.apply([], content.childNodes);
				if(target.childNodes.length > 0){ // we use InsertBefore
					target.insertBefore(content, target.firstChild);
				}
				else{ // if target has no children, we append 
					target.appendChild(content);
				}
				return aInserted;
			},
			append: function(content, target){
				// we copy the element inserted in a new array : 
				var aInserted = Array.apply([], content.childNodes);
				target.appendChild(content);
				return aInserted;
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
		// NOTE : aInserted returns the nodes that have been inserted in target, 
		// but target can have children that are not in aInserted (content has been appended or prepended for example)
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



/**
    HTTP Using XML (HUX) : Simple Loader
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


//simpleloader.hux.js

/**
 * Namespace: HUX.SimpleLoader
 * Loads content without URL update
 */
HUX.SimpleLoader = (function(){
	var inner = {
		sTarget:"target",
		/**
		* Function: onClick
		* handler for Click Event
		*/
		onclick: function(ev){
			try{
				var srcElement = HUX.Compat.Event.getEventTarget(ev) ;
				var opt = {
					data:null,
					url:srcElement.href,
					method:'get',
					async:true,
					filling:HUX.HUXattr.getFillingMethod(srcElement),
					target:HUX.HUXattr.getTarget(srcElement)
				};
				HUX.xhr(opt);
				HUX.Compat.Event.preventDefault(ev);
			}
			catch(ex){
				HUX.logError(ex);
			}
		},
		fnEach: function(el){
			HUX.Compat.Event.addEventListener(el, "click", inner.onclick );
		}
	};
	var pub = {
		inner: inner,
		/**
		* Function: listen
		* binds "click" event to inner.onClick function for each anchors having target attribute
		* 
		* Parameters : 
		* 	- *context* : {Element} the context where we listen for events
		*/
		listen:function(context){
			// for all anchor elements having target attributes, we listen to "click" events
			HUX.Selector.byAttributeHUX("a", inner.sTarget, context, inner.fnEach);
		},
		/**
		* Function: init
		* inits the module. Calls addLiveListener
		*/
		init: function(){
			HUX.addLiveListener(pub.listen);
		}
	};
	return pub;
})();

HUX.addModule(HUX.SimpleLoader); 




/**
    HTTP Using XML (HUX) : SplitArray Class
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
 * Namespace: PairManager
 * 
 * Pair Manager for HashBang or AtInclusion
 */
HUX.PairManager = function(callbacks){
	var _this = this;
	callbacks = callbacks || {};
	(function(){
		// the array which stores the pairs
		var pairs = [];
		// we add this.push, this.map, this.splice and this.slice to call respectively pairs.push, pairs.map and pairs.slice
		HUX.Compat.Array.forEach(["push", "map", "splice", "slice"], function(f){
			this[f] = function(){ return Array.prototype[f].apply(pairs, arguments); };
		}, this);
		// returns the length of pairs
		this.getLength = function(){ return pairs.length; };
		// sets the value at the specified index
		this.set = function(index, value){
			return pairs[index] = value;
		};
		this.get = function(index){ return pairs[index] };
		// a workaround for IE which does not implement Array.prototype.map
		if( !pairs.map ){
			this.map = function(fn, thisArg){
				var a = [];
				thisArg = thisArg || this;
				for(var i = 0; i < this.getLength(); i++){
					a[ i ] = fn.call(thisArg, this.get(i), i);
				}
				return a;
			}
		}
	}).call(this);
	
	// override indexOf
	if(Array.prototype.indexOf){
		this.indexOf = function(target){
			return Array.prototype.indexOf.call(this.map(function(e){ return e.target;}), target);
		};
	}
	else{
		this.indexOf = function(target){
			for(var i = 0; i < this.getLength(); i++){
				if(this.get(i).target === target)
					return i;
			}
			return -1;
		};
	}
	/**
	 * Function: getSubTargets
	 * get the descendants of a target (we name them subtargets).
	 * 
	 * Parameters: 
	 *  - target : {String} the target in which we look for substargets
	 *  - candidates : {Array of Pairs} the candidates for being subTargets
	 * 
	 * Returns: 
	 *  - {Array of String} the subtargets
	 */
	var getSubTargets = function(target, candidates){
		var ret = [],
		    eTarget = document.getElementById(target);
		HUX.Compat.Array.forEach(candidates, function(candidate){
			var eCandidate = document.getElementById(candidate.target);
			if( eCandidate && HUX.Compat.Element.contains(eTarget, eCandidate) )
				ret.push( candidate.target );
		});
		return ret;
	};
	/**
	 * Function: removePairs
	 * removes pairs 
	 * 
	 * Parameters: 
	 *  - targets : {Array of String} the targets whose pairs have to be removed
	 * 
	 */
	var removePairs = function(targets){
		HUX.Compat.Array.forEach(targets, function(el){
			this.removePair(el, /* bRemoveSubTargets=*/ false );
		}, _this);
	};
	var arePairsEqual = function(p1, p2){
		return p1.target === p2.target && p1.url === p2.url;
	};
	/**
	 * extracts the target and the URL from a string
	 */
	var splitPair = function(sPair){
		var pair;
		pair = sPair.split(/=/);
		return {target:pair[0], url:pair[1]};
	};
	/**
	 * Function: change
	 * applies changes in pairs with a given string
	 * 
	 * Parameters:
	 *  - sPairs: the pairs string (either with operations or not)
	 */
	this.change = function(sPairs){
		var reModif = /^[+-]/, isModif = reModif.test( sPairs[0] ), // isModif === true if the first character of the first pair equals to '+' or '-'
		    op, lastop ; // lastop : the last operator
		
		if(isModif) {
			for(var i = 0; i < sPairs.length; i++){
				var sPair , op, pair, sTarget, reRes;
				
				reRes = sPairs[i].match(/^([+-])?(.*)/);
				op = reRes[1] || lastop;
				sPair = reRes[2];
				lastop = op;
				if(op === '-'){
					this.removePair(sPair);
				}
				else if(op === '+'){
					pair = splitPair(sPair);
					var res = this.setPair(pair.target, pair.url);
					if(res.ok === false)
						break;
				}
				else{
					throw "wrong operator for pair modification";
				}
			}
		}
		else{
			var pair, i;
			// NOTE : this algorithme should be improved later, 
			//        because there are some cases where it changes pair even if it is not needed
			for(i = 0; i < sPairs.length; i++){
				if(sPairs[i].length === 0){
					sPairs.splice(i, 1);
					i--;
					continue;
				}
				pair = splitPair(sPairs[i]);
				while(i < this.getLength() && this.get(i).target !== pair.target)
					this.removeAt(i, 1);
				this.setPair(pair.target, pair.url);
			}
			if(i < this.getLength())
				this.removeAt(i, "all");
		}
	};
	/**
	 * Function: setPair
	 * add or replace a pair
	 * 
	 * Parameters: 
	 *  - target : {String} the target ID of the pair
	 *  - url : {String} the URL of the pair
	 * 
	 * Returns: {index:index, ok:ok} where index is the index of the new pair and ok is the result of the callback
	 */
	this.setPair = function(target, url){
		var index = this.indexOf(target), ok = true;
		
		if(index >= 0){
			// if a pair of the same target exists, and its url is different, we replace it by the new one
			var replacement = {target:target, url:url}, subtargets;
			if(! arePairsEqual(this.get(index), replacement))
			{
				subtargets = getSubTargets(target, this.slice(index + 1));
				ok = callbacks.onReplace(replacement, this.get(index));
				if(ok !== false){
					this.set(index, replacement);
					// we remove each subtargets : 
					removePairs(subtargets);
				}
			}
		}
		else{
			// otherwise, we add it to the array of pairs
			var added = {target:target, url:url};
			ok = callbacks.onAdd(added);
			if(ok !== false)
				this.push( added );
		}
		return {index: index, ok: ok};
	};
	/**
	 * Function: getPairValue
	 * get the value of a pair
	 * 
	 * Parameters:
	 *  - target: {String} the target of the pair
	 * 
	 * Returns:
	 *  - {String} the value
	 */
	this.getPairValue = function(target){
		var index = this.indexOf(target);
		return index >= 0 ? this.get(index).url : null;
	};
	/**
	 * Function: removePair
	 * remove a pair with the specified target
	 * 
	 * Parameters:
	 *  - target: {String} the target ID of the pair to remove
	 *  - bRemoveSubTargets: {Boolean} if set to true, removes also subtargets (optional, default: true)
	 */
	this.removePair = function(target, bRemoveSubTargets){
		var index = this.indexOf(target), subtargets;
		if(index >= 0){
			if(bRemoveSubTargets !== false){
				subtargets = getSubTargets(target, this.slice(index+1));
				removePairs(subtargets);
			}
			this.removeAt(index, 1);
		}
	};
	/**
	 * Function: removeAt
	 * remove element(s) at the specified index
	 * 
	 * Parameters:
	 *  - index: {integer}
	 *  - nb: {integer or "all"} number of element to remove after the index specified (optional)
	 */
	this.removeAt = function(index, nb){
		nb = nb || 1; // by default, nb == 1
		if(nb === "all") // if nb is all
			nb = this.getLength(); // we set nb as being this.getLength(), thus we ensure that splice removes all after this.get(index)
		else if(nb instanceof String)
			throw new TypeError("second argument is invalid");
		if(typeof index === "number" && index >= 0){
			var aDeleted = this.splice(index,nb);
			HUX.Compat.Array.forEach(aDeleted, callbacks.onDelete);
		}
		else
			throw new TypeError(index+" is not a valid index");
	};
};

/**
    HTTP Using XML (HUX) : Content Manager
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
 * Namespace: ContentManager
 * 
 * Content Synchronizer to inject content loaded with asynchronous requests
 * usefull to deal with nested targets
 */

HUX.ContentManager = function(onTargetsNotFound){
	// the waiting contents (only for content addition or replacement) : 
	var contents = {};
	// the keys in the order as displayed in the URL (only for content addition or replacement)
	var keys = [];
	// the default contents to restore when deleting contents
	var defaultContents = {};
	
	var countRemainingContents = function(){
		if(typeof Object.keys === "function")
			return Object.keys(contents).length;
		else{
			var prop,i=0;
			for(prop in contents){
				if(contents.hasOwnProperty(prop))
					i++;
			}
			return i;
		}
	};
	
	var injectNewContent = function(target, content){
		var sTarget = target.id;
		if(defaultContents[ sTarget ] === undefined)
			defaultContents[ sTarget ] = target.innerHTML;
		HUX.inject( target, "replace", content );
		delete contents[ sTarget ] ;
		// we remove the key
		keys.splice(HUX.Compat.Array.indexOf(keys, target.id), 1); 
	};
	
	/**
	 * Function: addContent
	 * stores a content for a target and inject it in the last when available
	 * 
	 * Parameters:
	 * 	- *sTarget*: {String} the id of the target element
	 * 	- *content*: {String} the content to inject
	 */
	this.addContent = function(sTarget, content){
		var iPairKey, target = document.getElementById(sTarget), _keys;
		
		// if the target is not ready yet : 
		if(target === null){
			contents[sTarget] = content;
		}
		else{
			iPairKey = HUX.Compat.Array.indexOf(keys, sTarget);
			injectNewContent(target, content);
			_keys = Array.apply([], keys); // make a copy of keys
			for(var i = iPairKey; i < _keys.length; i++){
				var curKey = _keys[i], curContent = contents[ curKey ],
					curTarget = document.getElementById(curKey);
				if( curContent !== undefined && curTarget !== null ){
					injectNewContent(curTarget, curContent);
				}
			}
		}
		// if this was the last key to be loaded, and there remains contents to inject : 
		if(keys.length > 0 && countRemainingContents() === keys.length)
			onTargetsNotFound(keys);
	};
	/**
	 * Function: setKeys
	 * sets the keys (or targets) of the contents being synchronized
	 * 
	 * Parameters: 
	 * 	- *_keys*: {Array of String} the keys
	 */
	this.setKeys = function(_keys){
		keys = _keys;
		contents = {};
	};
	
	this.removeContent = function(sTarget){
		var target = document.getElementById( sTarget );
		if(defaultContents[ sTarget ] !== undefined && target !== null){
			HUX.inject( target, "replace", defaultContents[ sTarget ] );
			// we do not store the content in order to save memory
			delete defaultContents[ sTarget ];
		}
	};
	
	
};
/**
    HTTP Using XML (HUX) : Hash Bang
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

//hashmgr.hux.js


/**
 * Namespace: HUX.HashBang
 * Manages Hash for HUX
 */
HUX.HashBang = (function(){
	// =============================
	// INNER FUNCTIONS AND PROPERTIES
	// =============================
	var inner = {
		msieVersion:HUX.Browser.getMSIEVersion(),
		// =============================
		// PRIVATE PROPERTIES
		// =============================
		/**
		 * PrivateProperty: pairs
		 * {HashMap<String, String>} Split object of the current Hash. Matches each id with the URL of the content loaded.
		 */
		pairs:null,
		// the previous hash (private)
		prev_hash:location.hash,
		
		normal_hash: null,
		// counter for exceptions
		watcher_cpt_ex:0,
		
		// does the browser support [on]hashchange event ?
		hashchangeEnabled: null,
		/**
		 * Property: inTreatment
		 * sort of mutex for event handlers
		 */
		inTreatment: false, 
	       
		contentManager: null,
		
		// limit of exceptions before stopping
		watcher_cpt_limit:10,
	       	/**
		 * Property: timer
		 * {Integer} Timer for browsers which do not support hashchange event. Used in <inner.watch>.
		 */
		timer:100,
		pairsCallbacks: {
			onAdd: function(added){
				inner.load(added.target, added.url);
				return true;
			},
			onReplace: function(replaced){
				inner.load(replaced.target, replaced.url);
				return true;
			},
			onDelete: function(deleted){
				inner.contentManager.removeContent(deleted.target);
				inner.applyNormalHash();
				return true;
			}
		},
		onTargetsNotFound: function(targets){
			HUX.Compat.Array.forEach(targets, function(target){
				HUX.logError("target #"+target+" not found. Check the content of your link.");
			});
			// we remove each targets from at inclusions : 
			pub.changeHash( "#!-"+targets.join(",!-") );
		},
		/**
		 * PrivateFunction: watch
		 * watcher for browsers which don't implement [on]hashchange event
		 */
		watch: function(){
			try{
				inner.handleIfChangement();
				inner.watcher_cpt_ex = 0;
			}
			catch(ex){
				HUX.logError(ex);
				inner.watcher_cpt_ex++;
				throw ex;
			}
			finally{
				if(inner.watcher_cpt_ex < inner.watcher_cpt_limit)
					window.setTimeout(inner.watch, inner.timer);
			}
		},
	       	/**
		 * Function: findAnchors
		 * gets the anchors with hashbangs within a context node
		 * 
		 * Parameters:
		 * 	- *context*: {Element} the context node
		 * 	- *fnEach*: {Function} the function to execute for each found element
		 * 
		 * Returns:
		 * 	- {Array of Elements} the found elements
		 */
		findAnchors: function(context, fnEach){
			if(inner.msieVersion && inner.msieVersion <= 7){
				var fnFilter = function(el){  
					// NOTE : el.getAttribute("href", 2) does not always work with IE 7, so we use this workaround to 
					// test if the href attribute begins with "#!"
					return el.href.indexOf( location.href.replace(/#(.*)/, "")+"#" ) === 0;  
				};
				HUX.Selector.filterIE("a", fnFilter, context, fnEach);
			}
			else{
				HUX.Selector.byAttribute("a", "href^='#'", context, fnEach);
			}
		},
		/**
		 * Function: handleIfChangement
		 * handles the hash changement
		 * 
		 * Parameters:
		 * 	- *ev*: {DOM Event}
		 */
		handleIfChangement: function(ev){
			//info.push("enter");
			var hash = location.hash;
			if(hash !== inner.prev_hash && !inner.inTreatment){
				//info.push("diff");
				try{
					inner.inTreatment = true;
					pub.changeHash(hash);
				}
				catch(ex){
					HUX.logError(ex);
				}
				finally{
					inner.prev_hash = hash; // even if there is an exeception, we ensure that inner.prev_hash is changed
					inner.inTreatment = false;
				}
			}
		},
		/**
		 * Function: load
		 * loads the content (specified through its URL) to the target element.
		 * 
		 * Parameters:
		 * 	- *target*: {Element} the target element in which we will load the remote content
		 * 	- *url*: {String} the URL of the remote content
		 */
		load: function(target, url){
			var opt = {
				data:null,
				url:url,
				method:'get',
				async:pub.asyncReq,
				filling:null, // use default option (replace)
				target:document.getElementById(target)
			};
			opt.onSuccess = function(xhr){
				// NOTE : cf "return false" dans callbacks
				inner.contentManager.addContent(target, xhr.responseText );
				inner.applyNormalHash();
			};
			opt.onError = function(xhr){
				inner.contentManager.addContent(target, HUX.XHR.inner.getDefaultErrorMessage(xhr));
			};
			opt.onTimeout = function(xhr){
				inner.contentManager.addContent(target, HUX.XHR.inner.ERROR_TIMEOUT);
			};
			HUX.xhr(opt);
		},
		/**
		 * Funtion: onClick
		 * handles click event on anchors having href="#!...".
		 * directly treat the hash changement
		 *
		 * Parameters:
		 * - *ev* : {DOM Event}
		 */
		onClick:function(ev){
			var srcElement = HUX.Compat.Event.getEventTarget(ev),
			    hash = ( srcElement.hash || srcElement.getAttribute("href") );
			pub.changeHash(hash);
			HUX.Compat.Event.preventDefault(ev);
		},


		/**
		 * Function: updateHash
		 * updates the hash
		 * 
		 * Parameters:
		 * 	- *hashbangs*: {String} the new hash bangs to set 
		 * 	- *normalHash*: {String} the hash for scrolling
		 */
		updateHash: function(hash, normalHash){
			var new_hash = hash;
			inner.normal_hash = normalHash;
			if(!new_hash)
				new_hash = normalHash 
			else if(normalHash)
				new_hash += "," + normalHash;
			
			if( new_hash !== location.hash.replace(/^#/, "") ){
				inner.prev_hash = "#"+new_hash; // necessary in order to prevent another execution of changeHash via handleIfChangement
				location.hash = new_hash;
			}
			if(normalHash){
				inner.applyNormalHash();
			}
		},
		/**
		 * Function: applyNormalHash
		 * scrolls to the element refered by the normal hash (like the default behaviour of the browsers)
		 * 
		 * Parameters:
		 * 	- *anchorName*: the name of the anchor
		 */
		applyNormalHash: function(){
			if(pub.enabled && inner.normal_hash){
				var hashTarget = document.getElementById(inner.normal_hash) || 
					HUX.Selector.byAttribute("a", "name='"+inner.normal_hash+"'")[0];
				if(hashTarget !== undefined){
					hashTarget.scrollIntoView();
					inner.normalHash = null;
				}
			}
		}
	};
	/* 
	 * namespace: HUX.HashBang.inner.IFrameHack
	 * hack for browsers from which we cannot use previous or next button (for history) to go to the previous hash
	 */
	inner.IFrameHack = {
		/* this hack is only enabled for MSIE 7- */
		/**
		 * Variable: enabled
		 * {boolean} if true, this hack is enabled. Only enable for MSIE 1->7
		 */
		enabled: inner.msieVersion && inner.msieVersion < 8, //navigator.userAgent.search(/MSIE [1-7]\./) > 0 || ( "documentMode" in document && document.documentMode < 8 ), 
		iframe:null,
		id:"HUXIFrameHack", // the id of the iframe
		tmpDisableUpd: false, // we need to disable temporary the IFrame update 
	       
		// creates an iframe if the lasts does not exists, and if the Iframe Hack is enabled
		createIFrame: function(){
			inner.IFrameHack.iframe = document.createElement("iframe");
			inner.IFrameHack.iframe.id=inner.IFrameHack.id;
			inner.IFrameHack.iframe.src="about:blank";
			inner.IFrameHack.iframe.style.display = "none";
			document.body.appendChild(inner.IFrameHack.iframe);
		},
		/**
		 * Function: updateIframe
		 * update the content of the Iframe
		 */
		updateIFrame: function(){
			if(inner.IFrameHack.enabled){
				if(!inner.IFrameHack.tmpDisableUpd){
					var doc = this.iframe.contentWindow.document;
					doc.open("javascript:'<html></html>'");
					doc.write("<html><head><scri" + "pt type=\"text/javascript\">parent.HUX.HashBang.inner.IFrameHack.setHash('"+location.hash+"'); </scri" + "pt></head><body></body></html>");
					doc.close();
				}
				else
					inner.IFrameHack.tmpDisableUpd = false;
			}
			
		},

		/**
		 * Function: setHash
		 * modifies the hash
		 */
		setHash: function(hash){
			if(hash !== location.hash){
				inner.IFrameHack.tmpDisableUpd = true;
				pub.changeHash(hash);
			}
		}
	};
	

	
	// =============================
	// PUBLIC FUNCTIONS AND PROPERTIES
	// =============================
	var pub = {
		inner:inner,
		/**
		 * Property: asyncReq
		 * {boolean} true if the requests have to be asynchronous, false otherwise (default: true)
		 */
		asyncReq: true,
		
		// =============================
		// PUBLIC FUNCTIONS
		// =============================
		
		
		/**
		 * Function: init
		 * inits the module. 
		 */
		init:function(){
			inner.pairs = new HUX.PairManager(inner.pairsCallbacks);
			inner.contentManager = new HUX.ContentManager( inner.onTargetsNotFound );
			inner.hashchangeEnabled = ( "onhashchange" in window) && (! document.documentMode || document.documentMode >= 8);
			// if the IFrameHack is needed, we create immediatly the iframe 
			if(inner.IFrameHack.enabled)
				inner.IFrameHack.createIFrame();
			// initiate the listener to hash changement
			if( inner.hashchangeEnabled )
				HUX.Compat.Event.addEventListener(window, "hashchange", inner.handleIfChangement);
			else // if hashchange event is not supported
				inner.watch();
			// we listen to any anchor beginning with "#!" (corresponding to CCS3 Selector : a[href^="#!"])
			HUX.addLiveListener(pub.listen);
			// we treat location.hash
			pub.changeHash(location.hash);
		},
		/**
		 * Function: listen
		 * Binds all anchor elements having an href beginning with "#!"
		 * 
		 * Parameters:
		 * 	- *context*: {Element} the context where we listen for events
		 */
		listen: function(context){
			// we look for anchors whose href begins with "#!" 
			// so anchors with hash operations ("#!+", "#!-") can be treated before location.hash is changed
			inner.findAnchors(context, function(el){
				HUX.Compat.Event.addEventListenerOnce(el, "click", inner.onClick);
			});
		},

		/**
		 * Function: changeHash
		 * handles the hash modification
		 * 
		 * Parameters:
		 * 	- *sHash* : {String} the hash to treat. Can be null (default : location.hash)
		 */
		changeHash: function(sHash){
			if(! /^#!/.test(sHash) ){
				pub.setNormalHash(sHash);
				return; 
			}
			// what we name a pair here 
			// is a pair "TARGET ID" : "URL" that you can find in the hash
			var keys = [], pairs = sHash.replace(/^#/, "").split(","), cleanPairs = [], normalHash, i;
			// we extract the normal hash (which do not begin with "!") : 
			for(i = 0; i < pairs.length && pairs[i].charAt(0) === "!"; i++);
			if(i < pairs.length)
				normalHash = pairs.splice(i, pairs.length - i)[0];
			
			HUX.Compat.Array.forEach(pairs, function(sPair, index){
				sPair = sPair.replace(/^!/, '');
				var pair = sPair.split('='),
				    isRemovalOp = (sPair.charAt(0) === '-');
				// filling keys for contentManager
				if(! isRemovalOp && pair.length === 2)
					keys.push( pair[0] );
				// keeping only "clean pairs" : 
				if(pair.length === 2 || isRemovalOp)
					cleanPairs.push(sPair);
			});
			inner.contentManager.setKeys(keys);
			inner.pairs.change( cleanPairs );
			var sHash = inner.pairs.map(function(e){return "!"+e.target+"="+e.url;}).join(",");
			inner.updateHash(sHash, normalHash || "");
			inner.IFrameHack.updateIFrame(); // only if IFrameHack enabled
		},
	       
		addBang: function(target, url){
			return pub.changeHash("#!+"+target+"="+url);
		},
		removeBang: function(target){
			return pub.changeHash("#!-"+target);
		},
		/**
		 * Function: setNormalHash
		 * changes the normal hash (and scroll to the targeted anchor)
		 * 
		 * Parameters:
		 * 	- *normalHash*: {String} the normal hash and the name of the targeted anchor
		 */
		setNormalHash: function(normalHash){
			normalHash = normalHash.replace(/^#/, "");
			if(normalHash.length > 0){
				inner.updateHash(location.hash.replace(/(^#|,)[^!].*/, ""), normalHash);
				//location.hash = location.hash.replace(/(^|,[^!][^,]+)?$/, ","+normalHash);
			}
		}
		

	};
	return pub;
})();

HUX.addModule(HUX.HashBang);



 /**
    HTTP Using XML (HUX) : Form Manager
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
 //form.hux.js
/**
 * Namespace: HUX.Form
 * Form submission manager for HUX
 */
HUX.Form = {
	/**
	 * Variable: defaultFilling
	 * {String} the default filling method for forms
	 * 
	 * Default: "replace"
	 */
	defaultFilling: "replace",
	/**
	 * Variable: clearAfterSubmit
	 * {Boolean} if true, the form is cleared after being submitted
	 * 
	 * Default: true
	 */
	clearAfterSubmit: true,
	/**
	 * Variable: async 
	 * {Boolean} are the requests asynchronous ? 
	 * 
	 * Default: true
	 */
	async: true,
	/**
	 * Function: init
	 * inits the module. Calls addLiveListener.
	 * 
	 */
	init: function(){
		HUX.addLiveListener(HUX.Form.listen);
	},
	/**
	 * Function: listen
	 * called by addLiveListener. For all forms having the "target" attribute, listens to submit events.
	 */
	listen: function(context){
		// we look for elements having the target attribute (to send and inject the content) 
		// or the sendonly attribute (to send the data only)
		HUX.Compat.Array.forEach(["target", "sendonly"], function(searchedAttr){
			HUX.Selector.byAttributeHUX("form", searchedAttr, context, function(el){
				// when submitting, we trigger HUX.Form.onSubmit 
				HUX.Compat.Event.addEventListener(el, "submit", function(ev){
					var form = HUX.Compat.Event.getEventTarget(ev);
					HUX.Form.submit(form);
					HUX.Compat.Event.preventDefault(ev);
				});
			});
		});
	},
	/**
	 * Function: serialize
	 * serializes the form data to URLEncode format.
	 * 
	 * Parameters:
	 * 	- *el* : {Element} the form Element whose data will be serialized
	 * 	- *arrData* : {Array of String} empty array that will be filled of Strings of this type : "[name]=[value]"
	 * 
	 * Used in:
	 * 	- <onSubmit>
	 */
	serialize: function(el, arrData){
		// TODO: explain the condition below : 
		if( !el.disabled && 
			(typeof el.getAttribute("type") === "undefined" || ! /radio|checkbox/.test(el.type) || el.checked) ){
				arrData.push( el.name+"="+el.value );
				// clear form (must need improvement)
				if(HUX.Form.clearAfterSubmit && (el.type === "text" || el.tagName.toLowerCase() === "textarea") )
					el.value = "";
		}
	},
	/**
	 * Function: submit
	 * handles the form submission
	 * 
	 * Parameters:
	 * 	- *form*: {Form Element}
	 * 	- OR *opt*: {Object} of this form : 
	 * 		{
	 * 			method: <HTTP method>,
	 * 			url: <url>,
	 * 			target: <id of the target to fill>,
	 * 			data: {<the data to send in this object...>},
	 * 			async: <(optional) boolean>,
	 * 			filling: <"replace", "append", "prepend", etc...>
	 * 		}
	 * 
	 */
	submit: function(arg1){
		try{
			var arrData = [], opt;
			// we fill the option object
			if(arg1.nodeType === 1 && arg1.tagName === "FORM"){
				var form = arg1;
				opt = {
					data:null, // set below
					url:form.action,
					method:form.getAttribute("method"),
					async:HUX.Form.async,
					filling:HUX.HUXattr.getFillingMethod(form) || HUX.Form.defaultFilling,
					target:HUX.HUXattr.getTarget(form) || undefined
				};
				// we fill arrData : 
				HUX.Selector.byAttribute("*", "name", form, function(el){
					HUX.Form.serialize(el, arrData);
				});
				
				// we join the data array to have this form : "name1=value1&name2=value2&...."
				opt.data = arrData.join("&"); 
			}
			else 
				opt = arg1;
			
			// we call the XHR method
			HUX.xhr(opt);
			return opt;
		}
		catch(ex){
			HUX.logError(ex);
		}
	}
}; 
HUX.addModule(HUX.Form);



/**
    HTTP Using XML (HUX) : Stage Class Manager
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

//stageclassmgr.hux.js

/**
 * Namespace: HUX.StageClassMgr
 * changes the class of the target at each stage of the load
 */
HUX.StageClassMgr = (function(){
	
	var inner =  {
		// regular expression for erasing stage classes
		reErase: null,
		/**
		 * Property: classNames
		 * {HashMap<String, String>} gives a class name for each HUX event
		 */
		classNames:{
			/* map : [event] : [className] */
			"loading":"hux_loading",
			"requestError":"hux_error",
			"beforeInject":"hux_initLoaded",
			"afterInject":"hux_loaded"
		},
		/**
		 * Function: init
		 * inits the module
		 */
		init: function(){
			var evName, tabClasses = [];
			for(evName in this.classNames){
				HUX.HUXEvents.bindGlobal(evName, inner.eventHandler);
			}
			for(var c in this.classNames)
				tabClasses.push(this.classNames[c]);
			// RegExp to delete our classNames
			this.reErase = new RegExp("("+tabClasses.join("|")+")\\s*", 'g');
			
		},
 
		/**
		 * Function: eventHandler
		 * handles any event given in classNames.
		 * calls setHuxClassName to modify the class name of the target
		 * 
		 * Parameters : 
		 * 	- *ev* : {HUX Event Object}
		 */
		eventHandler: function(ev, callback){
			var target = ev.target;
			if(target) // target !== undefined && target !== null
				pub.setHuxClassName(target, ev.type);
		}
	};
	var pub = {
		inner:inner,
		/**
		 * Function: setHuxClassName
		 * modifies the class name of a target. Removes any class names previously added by this function.
		 * 
		 * Parameters :
		 * 	- *el* : {Element} the target element
		 * 	- *evName* : {String} the event name. 
		 */
		setHuxClassName: function(el, evName){
			el.className = inner.classNames[evName] + " " + el.className.replace(inner.reErase, ""); // we push the new className and erase any old HUX class Name 
		}
	}
	inner.init(); // we launch the module directly
	return pub;
})();

/**
    HTTP Using XML (HUX) :At Inclusion
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
// atmgr.hux.js

/**
 * Namespace: AtInclusion
 * 
 * At Inclusions Manager
 */

HUX.AtInclusion = (function(){
	/** =================== INNER FUNCTIONS ================== **/ 
	var inner = {
		// the pairs manager :
		pairs: null,
		hash: null,
		asyncReq: true,
		// content synchronizer for nested targets and asynchronous requests : 
		contentManager: null,
		// stores the runnning XHR objects
		runningRequests: {},
		// forces at inclusion pairs to be in location.search
		// this is practical in order to avoid the use of .htaccess file
		forceAtInQuery: true,
		/**
		 * Callbacks per action (add, delete or replace a pair in @...).
		 */
		pairsCallbacks: {
			onAdd: function(added){
				inner.load(added.target, added.url);
				return true;
			},
			onReplace: function(replaced){
				inner.load(replaced.target, replaced.url);
				return true;
			},
			onDelete: function(deleted){
				inner.contentManager.removeContent(deleted.target);
				return true;
			}
		},
		// called when targets are not found : 
		onTargetsNotFound: function(targets){
			HUX.Compat.Array.forEach(targets, function(target){
				HUX.logError("target #"+target+" not found. Check the content of your link.");
			});
			// we remove each targets from at inclusions : 
			pub.changeAt( "@-"+targets.join(",-") , null, false /* addNewState */);
		},
		/**
		 * Function; createPairMgr
		 * creates an instance of HUX.PairManager for AtInclusion
		 * 
		 * Parameters:
		 * 	- *callbacks*: {Object} the callback object
		 * 
		 * Returns:
		 * 	- {HUX.PairManager} the instance
		 */
		createPairMgr: function(callbacks){
			return new HUX.PairManager(callbacks);
		},
		/**
		 * Function: findAnchors
		 * find the anchors that begin with '@'
		 * 
		 * Parameters:
		 * 	- *context*: the context node
		 * 	- *fnEach*: the function to execute for each found anchors
		 */
		findAnchors: function(context, fnEach){
			var msieVers = HUX.Browser.getMSIEVersion();
			if(msieVers && msieVers <= 7){
				var fnFilter = function(el){  
					// NOTE : el.getAttribute("href", 2) does not always work with IE 7, so we use this workaround to 
					// test if the href attribute begins with "#!"
					return el.href.indexOf( location.href.replace(/\?.*|@.*|#.*/g, "")+"@" ) === 0;  
				};
				HUX.Selector.filterIE("a", fnFilter, context, fnEach);
			}
			else{
				HUX.Selector.byAttribute( "a", "href^='@'", context, fnEach);
			}
		},
		
		/**
		 * Function: load
		 * does an xhr request and inject the content in the target element
		 * 
		 * Parameters:
		 * 	- *target*: {Element} the target element
		 * 	- *url*: {String} the location of the content
		 * 
		 * Returns:
		 * 	- {Boolean} true if the xhr request succeeded (xhr.status==200)
		 */
		load: function(target, url){
			var opt = {
				data:null,
				url:url,
				method:'get',
				async:inner.asyncReq,
				filling:"replace",
				target: document.getElementById(target)
			};
			// we abort any possible existing runningRequest for this target
			if(inner.runningRequests[target] instanceof XMLHttpRequest){
				inner.runningRequests[target].abort();
			}
			opt.onSuccess = function(xhr){
				// we delete the reference of inner.runningRequests[target]
				delete inner.runningRequests[target];
				// and we add the content for target
				inner.contentManager.addContent(target, xhr.responseText );
			};
			opt.onError = function(xhr){
				// we delete the reference of inner.runningRequests[target]
				delete inner.runningRequests[target];
				// and we put the error message in target
				inner.contentManager.addContent(target, HUX.XHR.inner.getDefaultErrorMessage(xhr));
			};
			opt.onTimeout = function(xhr){
				inner.contentManager.addContent(target, HUX.XHR.inner.ERROR_TIMEOUT);
			};
			// we run the request
			inner.runningRequests[target] = HUX.xhr(opt);
		},
		/**
		 * Function: onClick
		 * click event handler for links with atinclusions
		 */
		onClick: function(event){
			HUX.Compat.Event.preventDefault(event);
			var target = HUX.Compat.Event.getEventTarget(event),
			    hash = ( target.hash.length > 0 ? target.hash : null );
			
			pub.changeAt(target.href, hash);
		},
		
		/**
		 * Function: getNewUrl
		 * gets the new URL with atinclusions
		 * 
		 * Returns:
		 * 	-{String} the new URL
		 */
		getNewUrl: function(){
			var oldAtInclusions = pub.getAtInclusions(), newAtInclusions = inner.pairs.toString(),
			    href = location.href.replace(/#.*/,"");
			if( oldAtInclusions )
				href = href.replace(oldAtInclusions, newAtInclusions);
			else
				href = href + newAtInclusions;
			// we add the hash if set : 
			if(inner.hash)
				href += inner.hash;
			
			return href;
		},
		/**
		 * Function: pushState
		 * adds a new history state
		 */
		pushState: function(obj, title, newState){
			if(newState === undefined)
				newState = inner.getNewUrl();
			history.pushState(obj, title, newState);
		},
		/**
		 * Function: replaceState
		 * replace an history state
		 */
		replaceState: function(obj, title, newState){
			if(newState === undefined)
				newState = inner.getNewUrl();
			history.replaceState(obj, title, newState);
		},
		/**
		 * Function: onPopState
		 * popstate event handler
		 */
		onPopState: function(event){
			try{
				if( !pub.enabled )
					return;
				pub.changeAt(location.href, location.hash, false);
			}
			catch(ex){
				HUX.logError(ex);
			}
		},
		/**
		 * Function: applyHash
		 * scrolls to the element refered by the hash (like the default behaviour of the browsers)
		 */
		applyHash: function(){
			var anchorToView;
			if(inner.hash && pub.enabled ){
				// we scroll to the element whose ID matches the hash, or to the anchor whose name matches the hash
				anchorToView = document.querySelector(location.hash+", a[name=\""+location.hash.replace(/^#/,"")+"\"]");
				if(anchorToView !== null){
					anchorToView.scrollIntoView();
					inner.hash = null;
				}
			}
		}
	};
	
	
	/** =================== PUBLIC ================== **/ 
	var pub = {
		inner: inner,
		// by default, we enable At Inclusions if supported
		enabled: !!history.pushState,
		init: function(){
			if(! pub.enabled )
				return;
			inner.contentManager = new HUX.ContentManager( inner.onTargetsNotFound );
			inner.pairs = new HUX.PairManager(inner.pairsCallbacks);
			inner.pairs.toString = function(){
				return "@"+this.map(function(a){ return a.target+"="+a.url; }).join();
			};
			// we force at inclusions to be in query string
			// NOTE : location.search can return "" if there is nothing after "?", 
			//	  so we test using location.href.indexOf("?") instead
			if(inner.forceAtInQuery === true && location.href.indexOf("?") < 0) 
				inner.pushState({}, "", location.pathname.replace(pub.getAtInclusions(), "")
								+"?"+ (pub.getAtInclusions()||"") +location.hash);
			HUX.addLiveListener( pub.listen );
			HUX.HUXEvents.bindGlobal("afterInject", inner.applyHash);
			pub.changeAt( (pub.getAtInclusions() || "@"), location.hash );
		},
		listen: function(context){
			// this module works only with modern browsers which implements history.pushState
			// so we suppose that they implement evaluate as well...
			inner.findAnchors(context, function(el){ 
				HUX.Compat.Event.addEventListener(el, "click", inner.onClick); 
			});
			
		},
		/**
		 * Function: changeAt
		 * adds, replaces or removes atinclusions in the URL
		 * 
		 * Parameters:
		 * 	- *at*: {String} the atinclusion string. changeAt can also extract it from href strings.
		 * 	- *hash*: {String} the "normal" hash to apply when the contents are loaded (optional)
		 * 	- *addNewState*: {Boolean} indicates if a new state is added (optional; default=true)
		 */
		changeAt: function(at, hash, addNewState){
			if(!pub.enabled)
				return;
			var sPairs, keys, newurl; 
			// we store the hash string
			inner.hash = hash || null; // if undefined or "", we set inner.hash = null
			// we only keep at inclusions in *at*
			at = at.replace(/(.*@!?)|(#.*)/g, "");
			// we seperate the pairs : 
			sPairs = at.split(/,!?/);
			keys = sPairs.map(function(s){ 
					return (s.match(/^\+?([^=]+)/) || [null,null])[1];
				}).filter(function(s){ 
					return s !== null && s.charAt(0) !== '-';
				});
			inner.contentManager.setKeys( keys );
			inner.pairs.change(sPairs);
			if(addNewState !== false) // default is true
				inner.pushState({}, "");
			else
				inner.replaceState(history.state, "");
		},
		/**
		 * Function: addAt
		 * adds or replaces an atinclusion pair in the URL
		 * 
		 * Parameters:
		 * 	- *target*: {String} the target (key) of the atinclusion pair
		 * 	- *url*: {String} the url (value) of the atinclusion pair
		 * 	- *addNewState*: {Boolean} do we add a new history state ? (optional, default=true)
		 * 
		 */
		addAt: function(target, url, addNewState){
			inner.hash = null;
			var ret = inner.pairs.setPair(target, url);
			if(addNewState !== false) // default is true
				inner.pushState({}, "");
			else
				inner.replaceState(history.state, "");
			return ret;
		},
		/**
		 * Function: removeAt
		 * removes an atinclusion pair in the URL
		 * 
		 * Parameters:
		 * 	- *target*: the target (key) of the atinclusion pair to remove
		 * 	- *addNewState*: {Boolean} do we add a new history state ? (optional, default=true)
		 */
		removeAt: function(target, addNewState){
			inner.hash = null;
			var ret = inner.pairs.removePair(target);
			if(addNewState !== false) // default is true
				inner.pushState({}, "");
			else
				inner.replaceState(history.state, "");
			return ret;
		},
		/**
		 * Function: getAtInclusions
		 * gets the at inclusion string in the url
		 * 
		 * Returns:
		 * 	- {String} the at inclusion string or null if not found
		 */
		getAtInclusions: function(){
			return ( (location.pathname + location.search).match(/@.*/) || [null] )[0];
		},
	     
		/**
		 * Function: getAtInclusionValue
		 * gets the at inclusion value of a pair
		 * 
		 * Parameters:
		 * 	- *key*: the key of the pair to find
		 * Returns:
		 * 	- {String} the value or null if not found
		 */
		getAtInclusionValue: function(key){
			return inner.pairs.getPairValue(key) || null;
		}
	};
	
	
	return pub;
})();

HUX.Compat.Event.addEventListener( window, "popstate", HUX.AtInclusion.inner.onPopState );
HUX.addModule( HUX.AtInclusion );


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


 /**
    HTTP Using XML (HUX) : Form Update Url
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

HUX.FormUpdateUrl = {
	defaultUpdateUrl: "enabled",
	updateUrl: function(target, url, data){
		// we test the first argument
		if(typeof target === "string"){
			if(document.getElementById("target") === null)
				throw "HUX.Form.updateUrl : #"+target+" not found";
		}	
		if(target.nodeType !== undefined) 
			target = target.id;
		else
			throw "HUX.Form.updateUrl : first argument must be either an id string or an HTML element";
		var sPair = "+"+target+"="+url;
		if(HUX.AtInclusion !== undefined && HUX.AtInclusion.enabled){
			HUX.AtInclusion.changeAt( sPair );
		}
		else if(HUX.HashBang !== undefined && HUX.HashBang.enabled){
			HUX.HashBang.updateHash( "#!"+sPair );
		}
		
	}
};

HUX.Form.submit = HUX.wrapFn(HUX.Form.submit, function(orig, form){
	var opt = orig.execute(HUX.Form); // we execute the proxied function
	var updateUrl = HUX.HUXattr.getAttributeHUX(form, "updateurl") || HUX.FormUpdateUrl.defaultUpdateUrl;
	if(opt.method.toLowerCase() === "get"
	    && updateUrl !== "none"){
		HUX.FormUpdateUrl.updateUrl( opt.target, opt.url, opt.data );
	}
});
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
/**
    HTTP Using XML (HUX) : Script Injecter
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

// scriptinjecter.hux.js

// NOTE : still experimental

/**
 * Namespace: HUX.ScriptInjecter
 * inject scripts and run them when they are loaded
 */

HUX.ScriptInjecter = {
	head:document.getElementsByTagName("head")[0],
	// enabled by default. See <init>
	enabled: true,
	asyn: false,
	/**
	 * Function : init
	 * inits the module
	 */
	init: function(){
		// we detect if scripts are natively executed
		// if they are, we disable the module
		var script = HUX.Inject.htmltodom("<script>HUX.ScriptInjecter.enabled = false;</script>", document.body).childNodes[0];
		if(script){
			HUX.ScriptInjecter.head.appendChild( script );
			HUX.ScriptInjecter.head.removeChild( script );
		}
		// if enabled, we listen to "afterInject" event : 
		if( this.enabled )
			HUX.HUXEvents.bindGlobal("afterInject", this.searchScripts);
	},
	/**
	 * Function: searchScripts
	 * search for scripts to inject and run
	 * 
	 * Parameters:
	 * 	- *ev* : {HUX Event Object}
	 */
	searchScripts: function(ev){
		try{
			var scripts = [];
			// we get the scripts that have been inserted
			HUX.Compat.Array.forEach(ev.children, function(child){
				if(child.tagName === "SCRIPT")
					scripts.push(child);
				else if(child.nodeType === 1)
					scripts.push.apply(scripts, child.getElementsByTagName("script"));
			});
			HUX.ScriptInjecter.exec.call(HUX.ScriptInjecter, scripts);
		}
		catch(ex){
			HUX.logError(ex);
		}
	},
	/**
	 * Function: exec
	 * execute scripts
	 * 
	 * Parameters:
	 * 	- *aScripts* : {Array of Element} the array of all the remaining script elements to execute
	 */
	exec: function(aScripts){
		if(aScripts.length === 0)
			return;
		var script = aScripts.shift();
		if(script.src){
			this.loadScript(script, aScripts);
		}
		else{
			this.evalScript(script, aScripts);
		}
	},
	/**
	 * Function: evalScript
	 * executes a script, having no src attribute
	 * 
	 * Parameters:
	 * 	- *curScript* : {Element} the script to execute
	 * 	- *aScripts* : {Array of Element} array of all the remaining script elements to execute
	 */
	evalScript: function(curScript, aScripts){
		var script = document.createElement("script"), head = this.head;
		// we take the content of the script 
		if(curScript.textContent)
			script.textContent = curScript.textContent;
		else if(curScript.innerHTML && script.text !== undefined)
			script.text = curScript.innerHTML;
		// we insert it in a different thread
		setTimeout(function(){
			head.insertBefore( script, head.firstChild );
			head.removeChild( script ); 
		}, 0);
		
		this.exec( aScripts );
	},
	/**
	 * Function: loadScript
	 * 
	 * loads a script, having an src attribute
	 * 
	 * Parameters:
	 * 	- *curScript* : {Element} the script to execute
 	 * 	- *aScripts* : {Array of Element} array of all the remaining script elements to execute
	 */
	loadScript: function(curScript, aScripts){
		var script = document.createElement("script"), self= this, done = false, head = this.head;
		script.src = curScript.src;
		script.type = curScript.type;
		this.head.insertBefore(script, this.head.firstChild);
		// inspired from jQuery
		// Attach handlers for all browsers
		script.onload = script.onreadystatechange = function() {
			if ( !done && (!script.readyState ||
					script.readyState === "loaded" || script.readyState === "complete") ) {
				done = true;
			
				// Handle memory leak in IE
				script.onload = script.onreadystatechange = null;
				head.removeChild( script );
				if( !self.asyn )
					self.exec( aScripts );
			}
		};
		if(this.asyn)
			this.exec( aScripts );
	}
};

HUX.addModule( HUX.ScriptInjecter );
