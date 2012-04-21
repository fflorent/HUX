
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

window.HAPI = {};

/**
 * Namespace: HUX Core
 */
var HUX = {
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
		this.Compat.addEventListener(window, "load", function(){
			mod.init();
		});
	},
	
	/**
	 * Function: addLiveListener
	 * 
	 * calls listen(context) when the document is loaded or when HUX injects content
	 * 
	 * NOTE : this method should be called in an init() method of a module
	 * 
	 * Parameters:
	 * 	- *listen*: {Function or HUX Module} an HUX module implementing listen or the listen function itself
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
	 * >	HUX.addLiveListener(function(context){
	 * >		alert('hello world');
	 * > 	});
	 */
	addLiveListener: function(arg1, thisObject){
		var listen = typeof arg1 === "object"? arg1.listen : arg1;
		if( listen === undefined )
			throw new TypeException("The module does not implement the following method : listen(context)");
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
	 * Function: toArray
	 * converts arguments, nodelist ... or any object having an integer index to an array
	 * 
	 * Parameters: 
	 * 	- *obj* : the object to convert to array
	 * 
	 * Returns: 
	 * 	- {Array} the converted array
	 */
	toArray: function(obj){
		// NOTE : Array.prototype.slice.call(obj) when obj is a node list is not supported by IE 7
		// since the execution seems really fast with modern browser, we just run this basic algotihm :
		var ret = [], i;
		for(i = 0; i < obj.length; i++){
			ret.push( obj[i] );
		}
		return ret;
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
	// Inspired From : Array Remove - By John Resig (MIT Licensed)
	/**
	 * Function: removeElement
	 * removes the element of an array
	 * 
	 * Parameters:
	 * 	- *array* : {Array}
	 * 	- *el* : {Object} the element to remove
	 * 
	 * Returns:
	 * 	- {Array} the array without the element
	 */
	removeElement: function(array, el){
		var index = HUX.Compat.indexOf(array, el), rest;
		if(index >= 0)
		{
			// el is removed : all before is stored in array, the rest in rest
			rest = array.splice(index).splice(1);
			// recursion. We remove all "el"
			HUX.removeElement(rest, el);
			// we concat the rest with the array
			return array.concat(rest);
		}
		else
			return array;
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
	 *  - *beforeInject* : triggered before injecting content to the target element. 2 arguments : event.target = the target element, event.children = the elements to add
	 *  - *afterInject* : triggered after injecting content to the target element. 2 arguments : event.target = the target element, event.children = the added elements
	 *  - *beforeEmpty* : triggered before emptying target element. 1 argument : event.target=the element to empty
	 *  - *requestError* : triggered if an XMLHttpRequest failed. 1 argument : event.xhr = the XHR object
	 *  - *loading* : triggered when a HUX request is running. 1 argument : event.target = the target of the HUX request
	 */
	HUXEvents: (function(){
		/** =================== PRIVATE ================== **/ 
		
		// array of listener for each event
		var arrEv = {
			"beforeInject":{"global":[]}, 
			"beforeEmpty":{"global":[]},
			"requestError":{"global":[]},
			"afterInject":{"global":[]},
			"loading":{"global":[]},
			"prepareLoading":{"global":[]}
		};

		var addListener = function(key, evName, fn){
			if(arrEv[evName]){
				if(! (key in arrEv[evName]) )
					arrEv[evName][key] = [];
				arrEv[evName][key].push(fn);
			}
			else
				throw new Error("the event "+evName+" does not exist for HUX");
		};
		var removeListener = function(key, evName, fn){
			var array = arrEv[evName][key];
			if(array !== undefined)
				HUX.removeElement(array, fn);
		};
		// get the listeners of an event safely
		var getListeners = function(evName, tid){ 
			var lis = arrEv[ evName ];
			// if arrEv[ evName ][ tid ] does not exist, we return an empty array
			return ( lis && tid in lis ) ? lis[ tid ] : [];
		};
		// check if the target has an id. If not, throws an exception
		var checktid = function(callerName, target){
			if(!target.id)
				throw new Error(callerName+": first argument must be an HTMLElement with an id");
			
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
			return addListener("global", evName, fn);
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
			return removeListener("global", evName, fn);
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
		pub.trigger = function(evName, event, callback){
			try{
				var lsters = [], tid = (event.target?event.target.id : null), arrEv = arrEv;
				// we merge the listeners for the specific element and the listeners for "global"
				
				if(tid)
					lsters = lsters.concat( getListeners(evName, tid) );
				lsters = lsters.concat( getListeners(evName, "global") );
				
				event.type = evName;
				
				// set preventDefault method
				event.defaultPrevented = false;
				event.preventDefault = function(){
					event.defaultPrevented = true;
				};
				
				// we trigger all the events
				HUX.Compat.forEach(lsters, function(fn){
					var ret = fn.call(window, event, callback);
				});
				// is the event is not prevented, we run the callback function
				if(!event.defaultPrevented && callback !== undefined)
					callback(event);
			}
			catch(ex){
				HUX.logError(ex);
			}
		};
		/**
		 * Function: createEventType
		 * creates a new event type
		 * 
		 * Parameters: 
		 * 	- *evName* : {String} the name of the event to create
		 * 
		 * Returns:
		 * 	- {Boolean} true if the event type has been created successfully
		 */
		pub.createEventType = function(evName){
			// if arrEv is not undefined nor null
			if( arrEv[evName] )
				return false; // we do not create the same event type twice
			// normal case
			arrEv[evName] = {"global":[]};
			
			return true;
		};
		return pub;
	})(),

	/**
	 * Namespace; Inject
	 * 
	 * DOM Injection manager. 
	 */
	Inject:(function(){
		/** =================== PRIVATE ================== **/ 
		var checkTarget = function(target, methodName){
			if(!target)
				throw new Error(methodName+" filling method requires a target element");
		},
		    fillingMethods = {
			prepend: function(content, target){
				var aInserted;
				checkTarget( target, "prepend");
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
				var aInserted;
				checkTarget(target, "append");
				target.appendChild(content);
				aInserted = target.childNodes;
				return aInserted;
			},
			replace: function(content, target){
				checkTarget(target, "replace");
				pub.empty(target);
				return pub.proceed(target, "append", content);
			}
		};
		
		
		
		/** =================== PUBLIC ================== **/ 
		
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
		var pub = {};
		pub.proceed = function(target, method, content){
			if(typeof content !== "string" && content.nodeType !== undefined) // if content is a node
				content = pub.forceDocumentFragment( content );
			return fillingMethods[ method ].call(this, content, target || null);
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
			var frag = document.createDocumentFragment()
			while(nodes.length > 0){
				var node = nodes[0];
				frag.appendChild( node);
				pub.pauseMedias( node );
			}
			return frag;
		};
		/**
		 * Function: setFillingMethod
		 * sets a function for a filling method.
		 * 
		 * Parameters:
		 * 	- *method*: {String} the filling method
		 * 	- *fn*: {Function} the function to call when HUX proceeds to a request with that filling method
		 * 	- *requiresTarget*: {boolean} true if the function requires a target element (default: false)
		 * 
		 * Fn must have this signature: 
		 * 	- function(DOMContent, target){ ... }
		 * 	
		 * With:
		 * 	- *this* = HUX.Inject, so you can call its methods
		 * 	- *DOMContent*: {DocumentFragment or Document} the received elements via XHR
		 * 	- *target*: {Element} the element receiving the content (if no target: null)
		 * 	- *returns* : {Array of elements} the inserted elements
		 * 
		 * Example of use: 
		 * >	this.setFillingMethod("myMethod", function(DOMContent, target){
		 * >		var inserted;
		 * >		inserted = target.appendChild( DOMContent[0] ); // suppose we only want to insert the first element
		 * >		return new Array(inserted); // we return a single-array of element
		 * >	}, true); // we have to set requiresTarget to true because we need target
		 * 
		 */
		pub.setFillingMethod = function( method, fn, requiresTarget){
			var _fn = fn;
			if(requiresTarget){
				// we create a proxy to call checkTarget before calling the original function
				_fn = function(DOMContent, target){
					checkTarget(target, method);
					return fn.apply(this, arguments);
				}
			}
			fillingMethods[ method ] = _fn;
		};
		
		/**
		 * Function: forceDocumentFragment
		 * if DOMContent is a document, converts *node* to a DocumentFragment, or return *node* as is otherwise.
		 * 
		 * Parameters: 
		 * 	- *node*: {Document or DocumentFragment} the node to convert to DocumentFragment
		 * 
		 * Returns:
		 * 	- {DocumentFragment} the DocumentFragment converted (or *node* as is if it was already a DocumentFragment)
		 */
		// NOTE : usefull ?
		pub.forceDocumentFragment = function(doc){
			var ret = doc, content;
			if(doc.nodeType === document.DOCUMENT_NODE){
				content = [];
				HUX.Compat.forEach(doc.childNodes, function(c){
					content.push( c );
				});
				ret = pub.injectIntoDocFrag( content );
			}
			return ret;
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
			HUX.HUXEvents.trigger("beforeEmpty", {target: parent});
			pub.pauseMedias(parent);
			/*if(window.Audio !== undefined){
				HUX.Compat.forEach(parent.querySelectorAll("audio, video"), function(media){
					media.pause();
				});
			}*/
			while( (child=parent.firstChild) !== null ){
				parent.removeChild(child);
			}
			
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
			if(window.Audio === undefined)
				return;
			if(parent.tagName in ["audio", "video"])
				parent.pause();
			if( parent.querySelectorAll ){
				HUX.Compat.forEach(parent.querySelectorAll("audio, video"), function(media){
					media.pause();
				});
			}
			
		};

		
		/**
		 * Function: htmltodom
		 * convert HTML String to DOM
		 * 
		 * => Deprecated
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
				var parent = ( context !== undefined? context.cloneNode(false) : 						document.createElement('div') );
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
		var DOMContent = content;
		if(typeof content === "string")
			DOMContent = this.Inject.htmltodom(content, target);
		if(content.nodeType){ // if content is a node : 
			if(content.nodeType === document.DOCUMENT_NODE){ // if the node is an XML Document
				var arrContents = [];
				HUX.Compat.forEach(content.childNodes, function(c){
					arrContents.push( HUX.importNode(c) );
				});
				DOMContent = this.Inject.injectIntoDocFrag( arrContents );
			}
			else
				DOMContent = this.Inject.injectIntoDocFrag( [ HUX.importNode(content) ] ); // we create a single imported element Array
		}
		else if(content.length !== undefined && typeof content !== "string"){ // if the content is enumerable and is not a node
			DOMContent = this.Inject.injectIntoDocFrag( content );
		}
		else if(typeof content !== "string")
			throw new TypeError("content : invalid argument");
		if(! method) // if method === null, default is REPLACEMENT
			method = "replace";
		
		
		HUX.HUXEvents.trigger("beforeInject", {target: target, children: DOMContent.childNodes, content: DOMContent}, function(){
			var aInserted = [];
			try{
				aInserted = HUX.Inject.proceed(target, method, DOMContent); 
			}
			catch(ex){
				HUX.logError(ex);
			}
			finally{
				HUX.HUXEvents.trigger("afterInject", {target: target || document.body, children: aInserted});
			}
		});
	},
	/**
	 * Namespace: Selector
	 * DOM Selector Tool
	 */
	Selector: (function(){

		// for browsers which do not implement querySelector (mainly IE7-)
		// see its use in pub.byAttribute
		var oFnMatchAttrValIE = {
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
		 * Function: init
		 * inits the module
		 */
		var pub = {};
		
		pub.splitAttrSel = function(attrSel){
			var resMatch = attrSel.match(/([^\^$*~=]+)([\^$*~]?=)?['"]?([^'"]*)['"]?/);
			return {
				attrName: resMatch[1],
				op: resMatch[2],
				attrVal: resMatch[3]
			};
		};
		/**
		 * Function: byAttribute
		 * Selects elements by their attributes
		 * 
		 * Parameters:
		 * 	- *tagName*: {String} the tagName of the element you look for
		 * 	- *attrSel*: {String} the attribute selector (supported : "att", "att='val'", "att^='val', "att*='val'", "att$='val'"). See CSS3 attribute selectors
		 * 	- *context*: {Element} the element in which one will search (optional)
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
					HUX.Compat.forEach(result, fnEach);
				return HUX.toArray(result);
			}
			else{ // fallback (mostly for IE 7-)
				var resSplitAttrSel = pub.splitAttrSel(attrSel),
				    fnMatch = oFnMatchAttrValIE[ resSplitAttrSel.op || "" ],
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
		 * similar to <byAttribute>, but search for HUX attributes whatever the prefix is
		 * 
		 * Parameters:
		 * 	- *tagName*: {String} the tagName of the element you look for
		 * 	- *attrSel*: {String} the attribute selector (supported : "att", "att=val", "att^=val, "att*=val", "att$=val"). See CSS3 attribute selectors
		 * 	- *context*: {Element} the element in which one will search (optional)
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
		 * 	- *context*: {Element} the element in which one will search (optional)
		 * 	- *fnEach*: {Function} the function executed for each result (optional)
		 */
		pub.byClassName = function(className, context, fnEach){
			var ret;
			context = context || document;
			if(context.querySelectorAll !== undefined)
			{
				ret = HUX.toArray( context.querySelectorAll('.'+className) );
				if(fnEach !== undefined)
					HUX.Compat.forEach( ret, fnEach );
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
		 * 	- *context*: {Element} the element in which one will search (optional)
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
			elts = HUX.toArray(context.getElementsByTagName(tagName));
			// for each element found above
			HUX.Compat.forEach(elts, function(el){
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
		inner.setReadystatechange = function(xhr, filling, target, opt){
			try{
				var onSuccess = opt.onSuccess || pub.onSuccess,
				    onError = opt.onError || pub.onError;
				xhr.onreadystatechange = function(){
					try{
						if(xhr.readyState  === 4){
							if(xhr.status  === 200) 
								onSuccess(xhr, filling, target);
							else {
								HUX.HUXEvents.trigger("requestError", {xhr:xhr,filling:filling,target:target});
								onError(xhr, filling, target);
							}
						}
					}
					catch(ex){
						HUX.logError(ex);
					}
				};
			}
			catch(ex){
				HUX.logError(ex);
			}
		};
		// taken from jQuery, returns an XMLHttpRequest object
		inner.getXhrObject = function(){
			return window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
		};
		inner.getDefaultErrorMessage = function(xhr){
			return "<h1>"+xhr.status+" : "+xhr.statusText+"</h1>";
		}
		inner.errorTarget = "opt.target not defined or null";
		
		
		
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
				// mainly for stageclassmgr
				if(opt.target) // ! (undefined or null)
					HUX.HUXEvents.trigger("prepareLoading", {target: opt.target });
				// default value for opt.async is true
				if(opt.async === undefined)
					opt.async = true;
				// we get the XHR Object
				xhr = inner.getXhrObject();
				
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
				// 
				inner.setReadystatechange(xhr, opt.filling, opt.target, opt);
				xhr.setRequestHeader("Content-Type", opt.contentType || "application/x-www-form-urlencoded");
				// if the user set requestHeaders
				if(opt.requestHeaders ){
					for(var hName in opt.requestHeaders)
						xhr.setRequestHeader(hName, opt.requestHeaders[hName]);
				}
					
				// we trigger the event "loading"
				if(opt.target) // ! (undefined or null)
					HUX.HUXEvents.trigger("loading", {target: opt.target });
				xhr.send(data);
				return xhr;
			}
			catch(ex){
				HUX.logError(ex); // 
			}
		};
		/**
		 * Function; getContentOnSuccess
		 * returns the result of the XHR request on success 
		 * 
		 * PARAMETERS: 
		 * 	- *xhr*: the XHR object
		 * 
		 * RETURNS:
		 * 	- {String, XML Document or HTML Document} the result that HUX.inject can treat
		 */
		pub.getResultOnSuccess = function(xhr){
			return (xhr.responseXML && xhr.responseXML.documentElement)? 
				xhr.responseXML : 
				xhr.responseText;
		};
		pub.onSuccess = function(xhr, filling, target){
			if( target )
				HUX.inject(target, filling, pub.getResultOnSuccess(xhr));
			else
				HUX.logError( inner.errorTarget );
		};
		pub.onError = function(xhr, filling, target){
			if( target )
				HUX.inject(target, null, inner.getDefaultErrorMessage(xhr));
			else
				HUX.logError( inner.errorTarget );
		};
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
	 * 	- *opt.data* : {URLEncoded String} the data to send
	 *	- *opt.async* : {Boolean} asynchronous if true, synchronous if false (default = true)
	 *	- *opt.username* ; {String} the login (optional)
	 * 	- *opt.password* : {String} the password (optional)
	 *	- *opt.contentType* : {String} Content-Type Request Header (default = "application/x-www-form-urlencoded")
	 * 	- *opt.requestHeaders* : {HashMap} map of this type {"<headerName>":"<headerValue>" , ...}
	 * 	- *opt.onSuccess* : {Function} function to trigger if the request succeeds (optional)
	 * 	- *opt.onError* : {Function} function to trigger if the request fails (optional)
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
		
		var pub = {};
		
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
		 * >	HUX.Compat.addEventListener(window, "load", liLoad );
		 */
		pub.addEventListener = function(target, evName, fn){
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
		 * >	HUX.Compat.removeEventListener(window, "load", liLoad);
		 * 
		 */
		pub.removeEventListener = function(target, evName, fn){
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
		pub.addEventListenerOnce = function(){
			pub.removeEventListener.apply(this, arguments);
			pub.addEventListener.apply(this, arguments);
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
		 * >		var target = HUX.Compat.getEventTarget(ev); 
		 * >		alert("the tagName of the element clicked is " + target.tagName);
		 * >	}
		 * >	HUX.Compat.addEventListener(document.body, "click", liClick);
		 * 	
		 */
		pub.getEventTarget = function(event){
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
		 * > 		HUX.Compat.preventDefault(ev);
		 * >	}
		 * >	HUX.Compat.addEventListener(document.body, "click", liClick);
		 * 
		 * 
		 */
		pub.preventDefault = function(ev){
			if(window.event === undefined) // not IE
				ev.preventDefault();
			else // IE
				event.cancelBubble = event.returnValue = false;
		};
		/**
		* Function: foreach
		* do a for-each of the array
		* 
		* Parameters:
		* 	- *array* : {Array} the array (or nodelist or any object listing other objects with integer key)
		* 	- *fn* : {Function} the function called for each element
		* 
		* Example of use: 
		* > 	foreach(document.getElementsByTagName("*"), function(el){ 
		* > 		alert(el.tagName); 
		* > 	});
		*/
		pub.forEach = Array.forEach || function(array, fn, t){
			if(Array.prototype.forEach !== undefined )
				Array.prototype.forEach.call(array, fn, t);
			else {
				for(var i = 0; i < array.length; i++)
					fn.call(t||this, array[i], i, array);
			}
		};
		
		pub.indexOf = Array.indexOf || function(array, obj){
			var ap = Array.prototype;
			return ap.indexOf !== undefined? ap.indexOf.apply(arguments[0], Array.prototype.slice.call(arguments, 1)) : (function(){
				for(var i = 0; i < array.length; i++){
					if(array[i] === obj)
						return i;
				}
				return -1;
			})();
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
				var srcElement = HUX.Compat.getEventTarget(ev) ;
				var opt = {
					data:null,
					url:srcElement.href,
					method:'get',
					async:true,
					filling:HUX.HUXattr.getFillingMethod(srcElement),
					target:HUX.HUXattr.getTarget(srcElement)
				};
				HUX.xhr(opt);
				HUX.Compat.preventDefault(ev);
			}
			catch(ex){
				HUX.logError(ex);
			}
		},
		fnEach: function(el){
			HUX.Compat.addEventListener(el, "click", inner.onclick );
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

HUX.PairManager = function(callbacks){
	callbacks = callbacks || {};
	var getPairsCopy;
	(function(){
		// the array which stores the pairs
		var pairs = [];
		// we add this.push, this.map and this.slice to call respectively pairs.push, pairs.map and pairs.slice
		HUX.Compat.forEach(["push", "map", "splice", "slice"], function(f){
			this[f] = function(){ return pairs[f].apply(pairs, arguments); };
		}, this);
		// returns the length of pairs
		this.getLength = function(){ return pairs.length; };
		// sets the value at the specified index
		this.set = function(index, value){
			return pairs[index] = value;
		};
		this.get = function(index){ return pairs[index] };
		// NOTE : getPairsCopy defined outside, but is not public
		getPairsCopy = function(){
			return pairs.slice(0); // clone pairs
		};
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
	
	// to avoid checking the existence of onAdd, onDelete and onReplace at each use,
	// we create empty functions when they do not exist
	HUX.Compat.forEach(["onAdd", "onDelete", "onReplace"], function(e){
		if(! (e in callbacks))
			callbacks[e] = function(){ return true;};
	});
	
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
		HUX.Compat.forEach(candidates, function(candidate){
			var cur = document.getElementById(candidate.target) || {parentNode:null}, 
			    isDesc = false; // is the candidate descendant of target ?
			while( (cur = cur.parentNode)  && !isDesc) // we go through the ancestors of candidate
				isDesc = cur === eTarget; 
			if(isDesc){
				ret.push(candidate.target);
			}
		}, this);
		return ret;
	};
	
	var arePairEqual = function(p1, p2){
		return p1.target === p2.target && p1.url === p2.url;
	};
	/**
	 * extracts the target and the URL from a string
	 */
	var splitPair = function(sPair){
		var pair;
		pair = sPair.replace(/^!/, "").split(/=/);
		return {target:pair[0], url:pair[1]};
	};
	this.change = function(sPairs){
		var reModif = /^!?[+-]/, isModif = reModif.test( sPairs[0] ), // isModif === true if the first character of the first pair equals to '+' or '-'
		    op, lastop ; // lastop : the last operator
		
		if(isModif) {
			for(var i = 0; i < sPairs.length; i++){
				
				var sPair = sPairs[i], bangOffset = (sPair.charAt(0)==='!'?1:0), pair, sTarget;
				op = sPair.charAt(bangOffset);
				//
				if(! /[+-]/.test(op) ){
					op = lastop;
				}
				else{
					sPair = sPair.slice(bangOffset+ 1); // we remove '+' or '-' from sPair
				}
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
			// in order to optimize, we look for the first index where there is differences,
			// so we treat only where needed
			var i, length = Math.min( sPairs.length, this.getLength() );
			for(i = 0; i < length && 
				arePairEqual( this.get(i), splitPair(sPairs[i]) ); i++);
			
			sPairs = sPairs.slice(i); // we only keep sPairs elements whose index are greater or equal to i
			this.removeAt(i, "all"); 
			
			for(var i = 0; i < sPairs.length; i++){
				var sPair = sPairs[i], pair, res;
				if(sPair.length > 0){
					pair = splitPair(sPair),
					res = this.setPair(pair.target, pair.url);
					if(res.ok === false)
						break;
				}
			}
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
			// if a pair of the same target exists, we replace it by the new one
			var replacement = {target:target, url:url};
			// we store in this variable each targets included in the target that will be replaced
			var subtargets = getSubTargets(target, this.slice(index+1));
			ok = callbacks.onReplace(replacement, this.get(index));
			if(ok !== false){
				this.set(index, replacement);
				// we remove each subtargets : 
				this.removePairs(subtargets);
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
	 */
	this.removePair = function(target){
		var index = this.indexOf(target);
		if(index >= 0)
			this.removeAt(index, "all");
		
	};
	/**
	 * Function: removePairs
	 * remove pairs
	 * 
	 * Parameters:
	 *  - targets: {Array of String} the targets ID of the pairs to remove
	 */
	this.removePairs = function(targets){
		HUX.Compat.forEach(targets, this.removePair, this);
	};
	/**
	 * Function: removeAt
	 * remove element(s) at the specified index
	 * 
	 * Parameters:
	 *  - index: {integer}
	 *  - nb: {integer or "all"} number of element to remove after the index specified (optionnal)
	 */
	this.removeAt = function(index, nb){
		nb = nb || 1; // by default, nb == 1
		if(nb === "all") // if nb is all
			nb = this.getLength(); // we set nb as being this.getLength(), thus we ensure that splice removes all after this.get(index)
		else if(nb instanceof String)
			throw new TypeError("second argument is invalid");
		if(typeof index === "number" && index >= 0){
			var aDeleted = this.splice(index,nb);
			HUX.Compat.forEach(aDeleted, callbacks.onDelete); 
			
		}
		else
			throw new TypeError(index+" is not a valid index");
	};
};

HUX.PairManager.split = function(str, pattern, callbacks){
	var resExec, sTarget, url, index, pm;
	if(!pattern.global)
		throw new TypeError("pattern must have the 'g' flag");
	pm = new HUX.PairManager(callbacks);
	while( ( resExec = (pattern.exec(str)) ) !== null){
		sTarget = resExec[1];
		url = resExec[2];
		index = pm.setPair(sTarget, url);
	}
	return pm;
};
HUX.ContentSynchronizer = function(method){
	// if method is null, this class will behave as if it were "replace"
	// the waiting contents : 
	var contents = {};
	// the keys in the order as displayed in the URL
	var keys = [];
	this.addContent = function(pairKey, content){
		var iPairKey, target = document.getElementById(pairKey);
		
		if(target === null){
			contents[pairKey] = content;
		}
		else{
			iPairKey = HUX.Compat.indexOf(keys, pairKey);
			HUX.inject( target, method, content );
			for(var i = iPairKey; i < keys.length; i++){
				var curKey = keys[i], curContent = contents[ curKey ],
					curTarget = document.getElementById(curKey);
				if( curContent !== undefined && curTarget !== null ){
					HUX.inject( curTarget, method, curContent );
					delete contents[ curKey ] ;
				}
			}
		}
	};
	this.setKeys = function(_keys){
		keys = _keys;
		contents = {};
	};
};/**
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

//hashmgr.hux.js


/**
 * Namespace: HUX.HashMgr
 * Manages Hash for HUX
 */
HUX.HashMgr = (function(){
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
		// counter for exceptions
		watcher_cpt_ex:0,
		
		// store the content by default (before having injected content with HUX)
		default_contents:{},
		
		// does the browser support [on]hashchange event ?
		hashchangeEnabled: null,
		/**
		 * Property: inTreatment
		 * sort of mutex for event handlers
		 */
		inTreatment: false, 
	       
		contentSynchronizer: null,
		
		// limit of exceptions before stopping
		watcher_cpt_limit:10,
	       	/**
		 * Property: timer
		 * {Integer} Timer for browsers which do not support hashchange event. Used in <inner.watch>.
		 */
		timer:100,
		pairsCallbacks:{
			onAdd: function(added){
				// we make sure we call inner.saveDefaultContent only once : 
				HUX.HUXEvents.unbind(added.target, "beforeInject", inner.saveDefaultContent);
				// we listen to "beforeInject" se we save the default content : 
				HUX.HUXEvents.bind(added.target, "beforeInject", inner.saveDefaultContent);
				// then we load the content asynchronously
				inner.load(added.target, added.url);
				return true;
			},
			onReplace: function(added){
				inner.load(added.target, added.url);
				return true;
			},
			onDelete: function(deleted){
				var sTarget = deleted.target, self= HUX.HashMgr, replacement = inner.default_contents[sTarget];
				if(replacement !== undefined){
					var target = document.getElementById(sTarget);
					if(target !== null){
						HUX.HUXEvents.trigger("loading", {target: target });
						HUX.inject(target, "replace", replacement);
						return true;
					}
				}
				return false;
			}
			
		},
		/**
		 * PrivateFunction: watch
		 * watcher for browsers which don't implement [on]hashchange event
		 */
		watch: function(){
			try{
				inner.handleIfChangement();
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
			if(this.__msieVers && this.__msieVers <= 7){
				fnFilter = function(el){  
					// NOTE : el.getAttribute("href", 2) does not always work with IE 7, so we use this workaround to 
					// test if the href attribute begins with "#!"
					return el.href.indexOf( location.href.replace(/#(.*)/, "")+"#!" ) === 0;  
				};
				HUX.Selector.filterIE("a", fnFilter, context, fnEach);
			}
			else{
				HUX.Selector.byAttribute("a", "href^='!#'", context, fnEach);
			}
		},
	       	       	/*
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
					HUX.HUXEvents.trigger("afterHashChanged", {"new_hash":inner.prev_hash});
				}
			}
		},
		saveDefaultContent: function(ev){
			inner.default_contents[ev.target.id] = ev.target.innerHTML;
			// we unbind since we want it to vbe executed only once
			HUX.HUXEvents.unbind(ev.target.id, "beforeInject", inner.saveDefaultContent);
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
				inner.contentSynchronizer.addContent(target, (xhr.responseXML && xhr.responseXML.documentElement)? 
					xhr.responseXML : 
					xhr.responseText );
			};
			opt.onError = function(xhr){
				inner.contentSynchronizer.addContent(target, HUX.XHR.inner.getDefaultErrorMessage(xhr));
			};
			HUX.xhr(opt);
		},
	       	/**
		 * Funtion: onClick
		 * handles click event on anchors having href="#!...". 
		 * directly treat the hash changement
		 * 
		 * Parameters:
		 * 	- *ev* : {DOM Event}
		 */
		onClick:function(ev){
			var srcElement = HUX.Compat.getEventTarget(ev), 
			hash = ( srcElement.hash || srcElement.getAttribute("href") );
			//location.hash += ( srcElement.hash || srcElement.getAttribute("href") ).replace(/^#/,",");
			pub.changeHash(hash);
			HUX.Compat.preventDefault(ev);
		},
	       		
		/**
		 * Function: updateHash
		 * updates the hash
		 * 
		 * Parameters:
		 * 	- *hash*: {String} the new hash to set 
		 * 	- *keepPrevHash*: {Boolean} true if we do not change the current hash (optional; default: false)
		 */
		updateHash: function(hash/*, keepPrevHash*/){
			if( hash.replace(/^#/, "") !== location.hash.replace(/^#/, "") ){
				inner.prev_hash = hash; // necessary in order to prevent another execution of changeHash via handleIfChangement
				location.hash = hash;
			}
			
		}
	};
	/* 
	 * namespace: HUX.HashMgr.inner.IFrameHack
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
			this.iframe = document.createElement("iframe");
			this.iframe.id=this.id;
			this.iframe.src="about:blank";
			this.iframe.style.display = "none";
			document.body.appendChild(this.iframe);
		},
		/**
		 * Function: updateIframe
		 * update the content of the Iframe
		 */
		updateIFrame: function(){
			if(this.enabled){
				if(!this.tmpDisableUpd){
					var doc = this.iframe.contentWindow.document;
					doc.open("javascript:'<html></html>'");
					doc.write("<html><head><scri" + "pt type=\"text/javascript\">top.HUX.HashMgr.inner.IFrameHack.setHash('"+location.hash+"');</scri" + "pt></head><body></body></html>");
					doc.close();
				}
				else
					this.tmpDisableUpd = false;
			}
			
		},

		/**
		 * Function: setHash
		 * modifies the hash
		 */
		setHash: function(hash){
			if(hash !== location.hash){
				this.tmpDisableUpd = true;
				location.hash = hash;
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
			inner.contentSynchronizer = new HUX.ContentSynchronizer();
			inner.hashchangeEnabled = ( "onhashchange" in window) && (! document.documentMode || document.documentMode >= 8);
			// if the IFrameHack is needed, we create immediatly the iframe 
			if(inner.IFrameHack.enabled)
				inner.IFrameHack.createIFrame();
			// initiate the listener to hash changement
			if( inner.hashchangeEnabled )
				HUX.Compat.addEventListener(window, "hashchange", inner.handleIfChangement);
			else // if hashchange event is not supported
				inner.watch();
			// we listen to any anchor beginning with "#!" (corresponding to CCS3 Selector : a[href^="#!"])
			HUX.addLiveListener(pub.listen);
			// we treat location.hash
			pub.changeHash(location.hash);
			HUX.HUXEvents.createEventType("afterHashChanged");
		},
		/**
		 * Function: listen
		 * Binds all anchor elements having an href beginning with "#!"
		 * 
		 * Parameters:
		 * 	- *context*: {Element} the context where we listen for events
		 */
		listen: function(context){
			var fnFilter, prefixedTN, fnEach;
			fnEach = function(el){
				HUX.Compat.addEventListenerOnce(el, "click", inner.onClick);
			};
			// we look for anchors whose href begins with "#!" 
			// so anchors with hash operations ("#!+", "#!-") can be treated before location.hash is changed
			inner.findAnchors(context, fnEach);
		},

		/**
		 * Function: changeHash
		 * handles the hash modification
		 * 
		 * Parameters:
		 * 	- *sHash* : {String} the hash to treat. Can be null (default : location.hash)
		 */
		changeHash: function(sHash){
			// what we name a pair here 
			// is a pair "TARGET ID" : "URL" that you can find in the hash
			var keys = [], hash = sHash.replace(/^#,?/, "").split(/,[^!]/),
			    sPairs = hash[0].split(/,/), // the pairs described in the hash 
			    normalHash = hash[1] || ""; // the hash that usually lead to an anchor (is at the end of the hash, must not begin with a '!')
			HUX.Compat.forEach(sPairs, function(sPair){
				var pair = sPair.replace(/^!/,'').split('=');
				if(sPair.charAt(0) !== '-' && pair.length === 2)
					keys.push( pair[0] );
			});
			inner.contentSynchronizer.setKeys(keys);
			inner.pairs.change( sPairs );
			var sHash = "#"+inner.pairs.map(function(e){return "!"+e.target+"="+e.url;}).join(",") +  normalHash;
			inner.updateHash(sHash);
			inner.IFrameHack.updateIFrame(); // only if IFrameHack enabled
		},
	       
		addBang: function(target, url){
			return pub.changeHash("#!+"+target+"="+url);
		},
		removeBang: function(target){
			return pub.changeHash("#!-"+target);
		}
		

	};
	return pub;
})();

HUX.addModule(HUX.HashMgr);


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
 
// extend old function HUX.HashMgr.listen to add some treatments before 
HUX.HashMgr.listen = HUX.wrapFn(HUX.HashMgr.listen, function(origFn, context){
	try{
		// before calling the original HashMgr.listen()
		// we transpose HUX-prefixed href to non-prefixed href
		var elts = HUX.Selector.byAttributeHUX("a", "href", context); // get all anchors with the HUX prefixed href attribute
		HUX.Compat.forEach(elts, function(el){
			el.setAttribute("href", HUX.HUXattr.getAttributeHUX(el, "href"));
		});
	}
	catch(ex){
		HUX.logError(ex);
	}
	finally{
		var args = Array.prototype.slice.call(arguments, 1); // we do not keep origFn in arguments for calling the original function
		origFn.apply(this, args);
	}
});
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
		HUX.Compat.forEach(["target", "sendonly"], function(searchedAttr){
			HUX.Selector.byAttributeHUX("form", searchedAttr, context, function(el){
				// when submitting, we trigger HUX.Form.onSubmit 
				HUX.Compat.addEventListener(el, "submit", function(ev){
					var form = HUX.Compat.getEventTarget(ev);
					HUX.Form.submit(form);
					HUX.Compat.preventDefault(ev);
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
					target:HUX.HUXattr.getTarget(form) || undefined/*, // 
					srcElement:form // ????*/
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

(function(){
	var hscm ;// alias, stands for Hux Stage Class Manager
	
	/**
	 * Namespace: HUX.StageClassMgr
	 * changes the class of the target at each stage of the load
	 */
	HUX.StageClassMgr = hscm = {
		// regular expression for erasing stage classes
		reErase: null,
		/**
		 * Property: classNames
		 * {HashMap<String, String>} gives a class name for each HUX event
		 */
		classNames:{
			/* map : [event] : [className] */
			"prepareLoading":"hux_initLoading",
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
				HUX.HUXEvents.bindGlobal(evName, hscm.eventHandler);
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
			var timeout = 0;
			var target = ev.target || document.body;
			hscm.setHuxClassName(target, ev.type);
		},
		/**
		 * Function: setHuxClassName
		 * modifies the class name of a target. Removes any class names previously added by this function.
		 * 
		 * Parameters :
		 * 	- *el* : {Element} the target element
		 * 	- *evName* : {String} the event name. 
		 */
		setHuxClassName: function(el, evName){
			el.className = hscm.classNames[evName] + " " + el.className.replace(hscm.reErase, ""); // we push the new className and erase any old HUX class Name 
		}
	};
	hscm.init(); // we launch the module directly
})();
/**
    HTTP Using XML (HUX) : Overlay
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
 * Overlay aims to replace dynamically the content of the webpage as XUL overlay does
 */
// overlay.hux.js



// we add a new Filling method
HUX.Inject.setFillingMethod("overlay", function(DOMContent){
	return HUX.Overlay.proceed.call(HUX.Overlay, DOMContent );
}, false);




HUX.Overlay = {
	__rootTagName: "overlay",
	attributes: {
		POSITION:"position",
		REPLACEELEMENT:"replaceelement",
		REMOVEELEMENT:"removeelement",
		INSERTBEFORE:"insertbefore",
		INSERTAFTER:"insertafter",
		PREPENDCHILDREN: "prependchildren"
	},
	tabAttr: [], // filled in init
	init: function(){
		var aName;
		for(aName in this.attributes)
			this.tabAttr.push( this.attributes[aName] );
	},
	/**
	 * Function: proceed
	 * proceeds to the merge of the HTML Document and the Overlay document.
	 * 
	 * Parameters:
	 * 	- docOvl: {DocumentFragment} the Overlay XML Document
	 */
	proceed: function( docOvl ){
		try{
			if(docOvl.documentElement.tagName.toLowerCase() !== this.__rootTagName)
				throw new TypeError("wrong overlay document passed in HUX.Overlay.proceed");
			var childNodes = docOvl.documentElement.childNodes;
			HUX.Compat.forEach(childNodes, function(el){
				if(el.nodeType === document.ELEMENT_NODE){ // only treat element nodes
					HUX.Overlay.treatOvlChild( el );
				}
			});
			docOvl = null; 
			return childNodes;
		}
		catch(ex){
			HUX.logError(ex);
		}
		
	},
	selectByClassName: function(context, tagName, className){
		if(! document.getElementsByClassName ){
			var rExp = new RegExp("(^|\\s)"+className+"($|\\s)");
			var fnFilter = function(el){
				return rExp.test( el.className );
			};
			return HUX.Selector.filterIE(tagName, fnFilter , context);
		}
		else{
			var ret = [], nodelist;
			// since in general, there are less elements matching with the className than the elements matching with the tagName
			// first we filter with the className
			nodelist = context.getElementsByClassName( className );
			// second we filter with the tagName
			HUX.Compat.forEach(nodelist, function(e){
				if(e.tagName.toLowerCase() === tagName.toLowerCase())
					ret.push( e );
			});
			return ret;
		}
	},
	
	getElementFromElOvl: function( elOvl, attr ){
		return document.getElementById( elOvl.getAttribute(attr) );
	},
	
	cleanAttributes: function( el ){
		var attr;
		for(var i = 0; i < this.tabAttr.length; i++)
			el.removeAttribute( this.tabAttr[i] );
	},
	
	copyAttribute: function(target, attr){
		// we avoid copying attributes that are Overlay relative
		var lA = this.attributes;
		var aName = attr.nodeName;
		
		if(this.tabAttr[  aName ] !== undefined)
			return;
		if(aName === "class"){
			var rExp = new RegExp("(^|\\s)"+attr.nodeValue+"($|\\s)"); // rExp ensure that there will not be any double
			target.className = target.className.replace(rExp, "$2") + attr.nodeValue; 
		}
		else
			target.setAttribute(attr.nodeName, attr.nodeValue);
		
	},
	
	mergeAttributes: function(target, evOvl){
		var attrs = evOvl.attributes, attr;
		for(var i = 0; i < attrs.length; i++){
			attr = attrs.item(i);
			// IE includes non-speicified attributes, so we add this condition for it : 
			if(attr.specified){
				this.copyAttribute(target, attr);
			}
		}
	},
	
	treatRemove: function( elOvl ){
		var el;
		el = document.getElementById( elOvl.getAttribute("id") );
		return el.parentNode.removeChild( el );
	},
	
	
	
	treatInsertBefore: function(elOvl){
		var next = this.getElementFromElOvl(elOvl, this.attributes.INSERTBEFORE);
		var parent = next.parentNode;
		var _new = this.importNode(elOvl, true);
		var ret =  parent.insertBefore(_new , next );
		this.cleanAttributes( ret );
		return ret;
	},
	
	treatInsertAfter: function( elOvl ){
		var prev = this.getElementFromElOvl(elOvl, this.attributes.INSERTAFTER), next;
		var parent = prev.parentNode, imported = this.importNode(elOvl, true);
		this.cleanAttributes( imported );
		if( prev === (parent.lastElementChild || parent.lastChild) )
			return parent.appendChild( imported );
		else{
			next = ( prev.nextElementSibling || prev.nextSibling );
			return parent.insertBefore( imported, next );
		}
	},
	
	treatReplace: function( elOvl ){
		var old = document.getElementById( elOvl.getAttribute("id") );
		var _new = this.importNode( elOvl, true );
		_new.removeAttribute( this.attributes.REPLACEELEMENT );
		var ret = old.parentNode.replaceChild(_new, old);
		this.cleanAttributes( _new );
		return _new;
	},
	
	treatPosition: function(target, el, position){
		/*var i, curEl = target.firstChild;
		// NOTE : position attributes value begins from 1
		for(i = 1; i < position && curEl; i++){
			curEl = curEl.nextSibling; // position take into account any node position
		}*/
		var ret;
		if(position <= 0)
			throw new Error("position must be greater than 1");
		else if(position > target.children.length+1)
			throw new Error("position given is greater than the target capacity");
		else if(position === target.children.length) // we must append here
			ret = target.appendChild( el.cloneNode(true) );
		else // normal case
			ret = target.insertBefore( el.cloneNode(true), target.children[position-1] );
		this.cleanAttributes( ret );
		return ret;
	},
	
	positionContent: function(target, toPosition){
		// seems DocumentFragment has no children property
		// so, we use firstChild and nextSibling to go through all the children
		var child = toPosition.firstChild;
		if(!child)
			return;
		do{
			this.treatPosition( target, child, parseInt( child.getAttribute(this.attributes.POSITION) ) );
		}while( (child = child.nextSibling) !== null);
	},
	/**
	 * Function: appendContent
	 * appends DOM content to a list of Elements
	 * 
	 * Parameters:
	 * 	- targets: {Array of Element} an array of element that will append the content
	 * 	- toAppend: {Element or DocumentFragment} the element to append
	 * 
	 * NOTE: for appending to a single target, just call has below :
	 * > HUX.Overlay.appendContent( [ myTarget ], elToClone );
	 */
	appendContent: function(targets, toAppend){
		for(var i = 0; i < targets.length; i++)
			targets[i].appendChild( toAppend.cloneNode(true) );
	},
	
	prependContent: function(targets, toAppend){
		HUX.Compat.forEach(targets, function( target ){
			if(target.firstChild) // if there is at least one child node
				target.insertBefore( toAppend.cloneNode(true), target.firstChild );
			else // otherwise, we append
				return target.appendChild( toAppend );
		});
	},
	checkId: function( el, neededAttrName, isPointer ){
		var id = el.getAttribute("id");
		if(! id )
			throw new Error("an element having "+ neededAttrName +" attribute must also have an id attribute");
		if(isPointer && ! document.getElementById( id ) )
			throw new Error("no element of id=\""+ id +"\" found");
	},
	
	treatOvlChild: function( el ){
		var atts = this.attributes;
		if( el.getAttribute(atts.INSERTBEFORE) ){
			this.treatInsertBefore( el );
		}
		else if( el.getAttribute(atts.INSERTAFTER) ){
			this.treatInsertAfter( el );
		}
		else if( el.getAttribute(atts.REPLACEELEMENT) === "true" ){
			this.checkId( el, atts.REPLACEELEMENT, true );
			this.treatReplace( el );
		}
		else if( el.getAttribute(atts.REMOVEELEMENT) === "true" ){
			this.checkId(el, atts.REMOVEELEMENT, true);
			this.treatRemove( el );
		}
		else{
			 // we create documentfragment that is really interesting when there are a lot of found elements
			var foundElts, toAdd = document.createDocumentFragment(), toPosition = document.createDocumentFragment(), c;
			while(el.childNodes.length > 0){
				c = el.childNodes[0];
				if(c.nodeType === document.ELEMENT_NODE && c.getAttribute( this.attributes.POSITION )) // if the node is an element and has "position" attribute
					toPosition.appendChild( this.importNode( c, true ) );
				else
					toAdd.appendChild( this.importNode( c, true) );
				el.removeChild( c );
			}
			if( el.getAttribute("id") ){
				foundElts = [ document.getElementById(el.getAttribute("id")) ]; // we create a unique-element array for appendContent and mergeAttributes
				this.positionContent( foundElts[0], toPosition );
			}
			else if( el.getAttribute("class") ){
				foundElts = this.selectByClassName( document, el.tagName, el.getAttribute("class") );
			}
			
			// we insert the content
			if( el.getAttribute(atts.PREPENDCHILDREN) === "true" )
				this.prependContent( foundElts, toAdd );
			else
				this.appendContent( foundElts, toAdd);
			var self = this;
			HUX.Compat.forEach(foundElts, function(target){
				self.mergeAttributes( target, el );
			});
			el = toPosition = toAdd = null;
		}
	},
	
	
	importNode: HUX.importNode // just an alias
};




HUX.addModule( HUX.Overlay );
/**
    HTTP Using XML (HUX) :At Manager
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
// atmgr.hux.js
HUX.AtMgr = (function(){
	/** =================== INNER FUNCTIONS ================== **/ 
	var inner = {
		enabled: !!history.pushState,
		// history level
		level:0,
		pairs: null,
		asyncReq: true,
		state:  null,
		contentSynchronizer: null,
		default_contents: {},
		/**
		 * Callbacks per action (add, delete or replace a pair in @...).
		 */
		pairsCallbacks: {
			onAdd: function(added){
				// we make sure we call inner.saveDefaultContent only once : 
				HUX.HUXEvents.unbind(added.target, "beforeInject", inner.saveDefaultContent);
				// we listen to "beforeInject" se we save the default content : 
				HUX.HUXEvents.bind(added.target, "beforeInject", inner.saveDefaultContent);
				// then we load the content asynchronously
				inner.load(added.target, added.url);
				return true;
			},
			onReplace: function(added){
				inner.load(added.target, added.url);
				return true;
			},
			onDelete: function(deleted){
				var sTarget = deleted.target, replacement = inner.default_contents[sTarget];
				if(replacement !== undefined){
					var target = document.getElementById(sTarget);
					if(target !== null){
						HUX.HUXEvents.trigger("loading", {target: target });
						HUX.inject(target, "replace", replacement);
						return true;
					}
				}
				return false;
			}
		},
		saveDefaultContent: function(ev){
			inner.default_contents[ev.target.id] = ev.target.innerHTML;
			// we unbind since we want it to vbe executed only once
			HUX.HUXEvents.unbind(ev.target.id, "beforeInject", inner.saveDefaultContent);
		},
		/**
		 * Function; createPairMgr
		 * creates an instance of HUX.PairManager for AtMgr
		 * 
		 * Parameters:
		 * 	- *callbacks*: {Object} the callback object
		 * 
		 * Returns:
		 * 	- {HUX.PairManager} the instance
		 */
		createPairMgr: function(callbacks){
			return new HUX.PairManager(callbacks);//.split((location.toString().match(/[^@]@(.*)/) || ["",""])[1], /([^=,]+)=([^=,]+)/g, callbacks);
		},
		
		findAnchors: function(context, fnEach){
			var msieVers = HUX.Browser.getMSIEVersion();
			if(msieVers && msieVers <= 7){
				var fnFilter = function(el){  
					// NOTE : el.getAttribute("href", 2) does not always work with IE 7, so we use this workaround to 
					// test if the href attribute begins with "#!"
					return el.href.indexOf( location.href.replace(/@.*|#.*/g, "")+"@" ) === 0;  
				};
				HUX.Selector.filterIE("a", fnFilter, context, fnEach);
			}
			else{
				HUX.Selector.byAttribute( "a", "href^='@'", context, fnEach);
			}
		},
		
		/**
		 * Function: setState
		 * sets the history state if history.state does not exist
		 */
		setState: function(state){
			if(!history.state)
				inner.state = state;
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
			opt.onSuccess = function(xhr){
				// NOTE : cf "return false" dans callbacks
				inner.contentSynchronizer.addContent(target, (xhr.responseXML && xhr.responseXML.documentElement)? 
					xhr.responseXML : 
					xhr.responseText );
			};
			opt.onError = function(xhr){
				inner.contentSynchronizer.addContent(target, HUX.XHR.inner.getDefaultErrorMessage(xhr));
			};
			HUX.xhr(opt);
		},
		/**
		 * Function: initHUXState
		 * initializes the history state
		 */
		initHUXState: function(){
			var state = pub.getState() || {};
			state.HUX_AT = {
				info: [],
				level: inner.level
			};
			history.replaceState(state, "", "");
		},
		/**
		 * Function: onClick
		 * click event handler for links with atinclusions
		 */
		onClick: function(event){
			HUX.Compat.preventDefault(event);
			var at = HUX.Compat.getEventTarget(event).href;
			pub.changeAt(at);
		},
		
		/**
		 * Function: pushState
		 * adds a new history state
		 * 
		 */
		pushState: function(obj, title, newState){
			var state = {
				HUX_AT:{
					info: obj,
					level: ++inner.level
				}
			};
			if(newState === undefined){
				//var filename = ;(location.toString().match(/.*\/([^@]*)/) || [null,""])[1];
				var oldAtInclusions = pub.getAtInclusions(), newAtInclusions = inner.pairs.toString();
				if( oldAtInclusions )
					newState = location.toString().replace(oldAtInclusions, newAtInclusions);
				else
					newState = location.toString() + newAtInclusions;
			}
			history.pushState(state, title, newState);
		},
		/**
		 * Function: onPopState
		 * popstate event handler
		 */
		onPopState: function(event){
			try{
				var state = event.state;
				if(!state || state.HUX_AT === undefined || !inner.enabled)
					return;
				inner.setState( state );
				/*var old_level = inner.level;
				inner.level = inner.level;*/
				pub.changeAt(location.toString(), false);
			}
			catch(ex){
				HUX.logError(ex);
			}
		}
	};
	
	
	/** =================== PUBLIC ================== **/ 
	var pub = {
		inner: inner,
		
		/**
		 * Function: changeAt
		 * adds or replaces atinclusions in the URL
		 * 
		 * Parameters:
		 * 	- *at*: {String} the atinclusion string
		 * 	- *addNewState*: {Boolean} indicates if a new state is added (optional; default=true)
		 */
		changeAt: function(at, addNewState){
			at = at.replace(/.*@!?/g, "");
			var sPairs = at.split(/,!?/), 
			    newInfo = [],// empty for now ...
			    keys; 
			keys = sPairs.map(function(s){ 
					return (s.match(/^\+?([^=]+)/) || [null,null])[1];
				}).filter(function(s){ 
					return s !== null && s.charAt(0) !== '-';
				});
			inner.contentSynchronizer.setKeys( keys );
			inner.pairs.change(sPairs);
			if(addNewState !== false){ // default is true
				inner.pushState(newInfo, "");
			}
		},
		addAt: function(target, url, addNewState){
			var ret = inner.pairs.setPair(target, url);
			if(addNewState !== false)
				inner.pushState([], "");
			return ret;
		},
		removeAt: function(target, addNewState){
			var ret = inner.pairs.removePair(target);
			if(addNewState !== false)
				inner.pushState([], "");
			return ret;
		},
		init: function(){
			if(! inner.enabled )
				return;
			inner.contentSynchronizer = new HUX.ContentSynchronizer();
			inner.pairs = new HUX.PairManager(inner.pairsCallbacks);
			inner.pairs.toString = function(){
				return "@"+this.map(function(a){ return a.target+"="+a.url; }).join();
			};
			if(!pub.getState() || ! ( (pub.getState().HUX_AT || null) instanceof Object) ){
				inner.initHUXState();
			}
			//this.addObjectToState({});
			HUX.addLiveListener( pub.listen );
			
			pub.changeAt( pub.getAtInclusions() || "@" );
		},
		listen: function(context){
			// this module works only with modern browsers which implements history.pushState
			// so we suppose that they implement evaluate as well...
			inner.findAnchors(context, function(el){ 
				HUX.Compat.addEventListener(el, "click", inner.onClick); 
			});
		},
		getAtInclusions: function(){
			return ( (location.pathname + location.search).match(/@.*/) || [null] )[0];
		},
		getAtInclusionValue: function(key){
			return inner.pairs.getPairValue(key);
		},
		/**
		 * Function; getState
		 * gets the history state
		 */
		getState: function(){
			return history.state !== undefined ? history.state : inner.state;
		},
		setEnabled: function(val){
			inner.enabled = val;
		}
	};
	
	
	return pub;
})();

HUX.Compat.addEventListener( window, "popstate", HUX.AtMgr.inner.onPopState );
HUX.addModule( HUX.AtMgr );


(function(){
	var proxy;
	// we update HUX.AtMgr.state each time pushState or replaceState are called
	// for browsers which do not have history.state (currently Chrome and Safary)
	if(history.pushState && history.state === undefined){
		proxy = function(origFn, state){
			origFn.execute(history);
			HUX.AtMgr.inner.setState( state );
		};
		history.pushState = HUX.wrapFn(history.pushState, proxy );
		history.replaceState = HUX.wrapFn(history.replaceState,  proxy );
	}
	
})();
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
		if(HUX.AtMgr !== undefined && HUX.AtMgr.enabled){
			HUX.AtMgr.changeAt( sPair );
		}
		else if(HUX.HashMgr !== undefined && HUX.HashMgr.enabled){
			HUX.HashMgr.updateHash( "#!"+sPair );
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
});/**
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
			var resSplit = HUX.Selector.splitAttrSel(attrSel),
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