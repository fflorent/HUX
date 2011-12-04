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
		this.Selector.init();
	},
	
	/**
	 * variable: namespace
	 * {String} the namespace of HUX for XHTML 
	 */
	namespace: "urn:hux:1.0",
	
		
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
	
	addToAPI: function(name, func){
		if(typeof name !== "string")
			throw "First argument must be a string";
		if(typeof func !== "function")
			throw "Second argument must be a function";
		var i, chunk, chunks = name.split('.'), cur = HAPI; 
		for(i = 0; i < chunks.length-1; i++){// for each sub-namespace in name
			chunk = chunks[i];
			if(! (chunk in cur) )
				cur[chunk] = {}; // we create a new object
			if( typeof cur[ chunk ] === "function" )
				throw "unable to to create HAPI."+name+" : HAPI."+chunks.slice(0,HUX.Compat.indexOf(chunk)).join('.')+" is not a namespace";
			cur = cur[ chunk ];     // we go through
		}
		cur[ chunks[i] ] = func;      // we finally add func
	},
	
	/**
	 * Function: addLiveListener
	 * 
	 * calls listen(context) when the document is loaded or when HUX injects content
	 * 
	 * NOTE : this method should be called in an init() method of a module
	 * 
	 * Parameters:
	 * 	- *mod* : {Object} a HUX module implementing listen(context) function
	 * 
	 * See also : 
	 * 	- <init>
	 * 
	 * Example of use:
	 * This example will count how many elements are parsed when the browser or HUX parsed new ones. 
	 * >	HUX.myCounterModule = {
	 * >		init: function(){
	 * >			HUX.addLiveListener( this ); // this refers to HUX.myCounterModule
	 * >		},
	 * >		listen: function(context){
	 * >			alert(context.getElementsByTagName("*").length+" elements have just been parsed");
	 * >		}
	 * >	};
	 * >	HUX.addModule( HUX.myCounterModule ); // see <init>
	 * 
	 */
	addLiveListener: function(mod){
		if( mod.listen === undefined )
			throw new TypeException("The module does not implement the following method : listen(context)");
		mod.listen(document, document);
		HUX.HUXEvents.bindGlobal("beforeInject", function(event){
			HUX.Compat.forEach(event.children, function(child){
				if(child.nodeType === 1)  // is child an Element ?
					mod.listen(child, event.target); 
			});
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
		var index = array.indexOf(el);
		if(index < 0)
			throw new Error("the element is not present in the array");
		var rest = array.slice(index + 1);
		// recursion. We remove all "el"
		if(rest.indexOf(el) >=0)
			HUX.removeElement.removeElement(el);
		array.length = index;
		return array.push.apply(array, rest);
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
	 * - *wrapper* : {Function} The function to use as a wrapper.
	 *
	 * Returns a function "wrapped" around the original function.
	 *
	 * see also http://www.prototypejs.org/api/function/wrap
	 **/
	 // inspired from Prototype Wrap Method : https://github.com/sstephenson/prototype/blob/master/src/prototype/lang/function.js
	wrapFn: function(orig, fn){
		return function(){
			var a = [ orig ];
			orig.args = arguments; // the original arguments are set as fnOrig.args
			orig.execute = function(){ orig.apply(this, orig.args); }; // method to execute the proxied function
			Array.prototype.push.apply(a, arguments);
			return fn.apply(this, a);
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
			HUX.removeElement(arrEv[evName][key], fn);
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
		pub.unbindGlobal = function(evName, fn){// public
			return removeListener("global", evName, fn);
		};
		
		/**
		 * Function: bind
		 * sort of addEventListener
		 * 
		 * Parameters: 
		 *	- *target* : {Element} the target of the event. Can be a 
		 * 	- *evName* : {String} the name of the event
		 * 	- *fn* : {Function} the listener
		 */
		pub.bind = function(target, evName, fn){// public
			checktid("HUXEvents.bind", target);
			return addListener(target.id, evName, fn);
		};
		/**
		 * Function: unbind
		 * sort of removeEventListener
		 * 
		 * Parameters: 
		 *	- *target* : {Element} the target of the event. Can be a 
		 * 	- *evName* : {String} the name of the event
		 * 	- *fn* : {Function} the listener to remove
		 */
		pub.unbind = function(target, evName, fn){// public
			checktid("HUXEvents.unbind", target);
			return removeListener(target.id, evName, fn);
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
		pub.trigger = function(evName, event, callback){// public
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
		pub.createEventType = function(evName){// public
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
			var frag = document.createDocumentFragment();
			var i = 0;
			for(var i = 0;  i < nodes.length; i++){
				
				frag.appendChild( nodes[i]);
				pub.pauseMedias(nodes[i])
				
			}
			delete nodes;
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
				delete child;
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
			if(context === undefined || ! context.nodeType)
				throw "htmltodom : context is required and must be a node";
			
			if(window.Range !== undefined && Range.prototype.createContextualFragment !== undefined){ // better performance with createContextualFragment since we need to return the children
				var doc = (context !== undefined ? context.ownerDocument : document), range = doc.createRange();
				range.selectNodeContents(context); // required by Chrome
				ret = range.createContextualFragment(sHtml);
			}
			else{ // IE ...
				var parent = context ? context.cloneNode(false) : document.createElement('div');
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
	 * 	- *content* : {String or Array of Element} HTML String or Array of elements to be added to @target
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
				delete arrContents;
			}
			else
				DOMContent = this.Inject.injectIntoDocFrag( [ HUX.importNode(content) ] ); // we create a single imported element Array
		}
		else if(content.length !== undefined && typeof content !== "string"){ // if the content is enumerable and is not a node
			DOMContent = this.Inject.injectIntoDocFrag( content );
			delete content;
		}
		else if(typeof content !== "string")
			throw new TypeError("content : invalid argument");
		if(! method) // if method === null, default is REPLACEMENT
			method = "replace";
		
		
		HUX.HUXEvents.trigger("beforeInject", {target: target, children: DOMContent.childNodes}, function(){
			var aInserted = [];
			try{
				aInserted = HUX.Inject.proceed(target, method, DOMContent); 
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
		var prefixTN = "";
		
		/**
		 * IE does not implement document.evaluate
		 * This function is a fallback for Selector.byAttribute
		 */
		var byAttributeIE = function(tagName, attr, context, fnEach){
			var fnFilter = function(el){  return el.getAttribute(attr);  }; // NOTE : IE7 returns "" if the attribute does not exist
			return pub.filterIE(tagName, fnFilter, context, fnEach);
		};
		/**
		 * Function: init
		 * inits the module
		 */
		var pub = {};
		pub.init = function(){
			// check whether we are using html or xhtml ...
			if(document.evaluate !== undefined){
				if( this.evaluate("/html").length > 0 )
					prefixTN = "";
				else if(this.evaluate("/xhtml:html").length > 0)
					prefixTN = "xhtml:";
				else
					throw new Error("Document non supported by HUX");
			}
		};
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
		pub.prefixTagName= function(tagName){
			return prefixTN+tagName;
		};
		/**
		 * Function: byAttribute
		 * Selects elements by their attributes
		 * 
		 * Parameters:
		 * 	- *tagName* : {String} the tagName of the element you look for
		 * 	- *attr* : {String} the attribute to look for
		 * 	- *context* : {Element} the element in which one will search (optional)
		 * 	- *fnEach* : {Function} thefunction executed for each result (optional)
		 * 
		 * Returns:
		 * 	- {Array of Element} the elements found
		 */
		pub.byAttribute = function(tagName, attr, context, fnEach){
			var xpath, prefixedTN = pub.prefixTagName(tagName);
			if(typeof document.evaluate !== "undefined"){
				xpath = "//"+prefixedTN+"[@"+attr+"]";
				return pub.evaluate(xpath, context, fnEach);
			}
			else
				return byAttributeIE(tagName, attr, context, fnEach);
		};
		
		/**
		 * Function: byAttributeHUX
		 * similar to <byAttribute>, but search for HUX attributes whatever the prefix is
		 * 
		 * Parameters:
		 * 	- *tagName* : {String} the tagName of the element you look for
		 * 	- *attr* : {String} the attribute to look for
		 * 	- *context* : {Element} the element in which one will search (optional)
		 * 	- *fnEach* : {Function} thefunction executed for each result (optional)
		 * 
		 * Returns:
		 * 	- {Array of Element} the elements found
		 */
		pub.byAttributeHUX = function(tagName, attr, context, fnEach){
			var xpath, prefixedTN, attrs = HUX.HUXattr.getAttrAllPrefixes(attr), sAttrXP, ieRet = [];
			prefixedTN = pub.prefixTagName(tagName);
			if(typeof document.evaluate !== "undefined"){
				sAttrXP = attrs.join(" or @"); // sAttrXP = "data-attr OR @data-hux-attr OR @hux:attr"
				xpath = "./descendant-or-self::"+prefixedTN+"[@"+sAttrXP+"]";
				return pub.evaluate(xpath, context, fnEach);
			}
			else{
				HUX.Compat.forEach(attrs, function(attr){
					ieRet = ieRet.concat( byAttributeIE(tagName, attr, context, fnEach) );
				});
				return ieRet;
			}
		};
		/**
		 * Function:nsResolver
		 * function used by document.evaluate in <evaluate> for namespaces
		 * 
		 * Parameters:
		 * 	- *prefix*: {String} the prefix used in the XPath expression
		 * 
		 * Returns :
		 * 	- {String} the namespace
		 */
		pub.nsResolver = function(prefix){
			var ns = {
				"hux":HUX.namespace,
				"xhtml":"http://www.w3.org/1999/xhtml"
			};
			if(!prefix)
				return ns.xhtml;
			return ns[prefix];
		};
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
		 * 	- {Array of Element} the elements found
		 */
		pub.evaluate = function(sXpath, context, fnEach){
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
			elts = context.getElementsByTagName(tagName);
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
		/** =================== PRIVATE ================== **/ 
		var setReadystatechange = function(xhr, filling, target, opt){
			try{
				var onSuccess = opt.onSuccess || pub.onSuccess,
				    onError = opt.onError || pub.onError;
				xhr.onreadystatechange = function(){
					try{
						if(xhr.readyState  === 4){
							if(xhr.status  === 200) 
								onSuccess(xhr, filling, target);
							else 
								onError(xhr, filling, target);
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
		},
		// taken from jQuery, returns an XMLHttpRequest object
		getXhrObject = function(){
			return window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
		};
		
		
		
		/** =================== PUBLIC ================== **/ 
		var pub = {};
		// see HUX.xhr(opt)
		pub.proceed = function(opt){
			if(! opt.url.length === 0)
				throw new TypeError("invalid arguments");
			if(typeof opt.target === "string") // if opt.target is an id string, get the matching element 
				opt.target = document.getElementById(opt.target);
			try{
				var data = null, xhr;
				// mainly for stageclassmgr
				HUX.HUXEvents.trigger("prepareLoading", {target: (opt.target || document.body) });
				// default value for opt.async is true
				if(opt.async === undefined)
					opt.async = true;
				// we get the XHR Object
				xhr = getXhrObject();
				
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
				setReadystatechange(xhr, opt.filling, opt.target, opt);
				xhr.setRequestHeader("Content-Type", opt.contentType || "application/x-www-form-urlencoded");
				// if the user set requestHeaders
				if(opt.requestHeaders){
					for(var hName in opt.requestHeaders)
						xhr.setRequestHeader(hName, opt.requestHeaders[hName]);
				}
					
				// we trigger the event "loading"
				HUX.HUXEvents.trigger("loading", {target: (opt.target || document.body) });
				xhr.send(data);
				return xhr;
			}
			catch(ex){
				HUX.logError(ex); // 
			}
		};
		
		pub.onSuccess = function(xhr, filling, target){
			HUX.inject(target, filling, (xhr.responseXML && xhr.responseXML.documentElement)? xhr.responseXML : xhr.responseText);
		};
		pub.onError = function(xhr, filling, target){
			HUX.HUXEvents.trigger("requestError", {xhr:xhr,filling:filling,target:target});
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
		/** =================== PRIVATE ================== **/ 
		var getAttributeNS = function(srcElement, name){
			return srcElement.getAttributeNS ? srcElement.getAttributeNS(HUX.namespace, name) : srcElement.getAttribute("hux:"+name);
		};
	   
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
			var ret = null,  attrs = pub.getAttrAllPrefixes(name), i;
			for(i = 0; i < attrs.length && ret === null; i++){
				ret = el.getAttribute( attrs[i] );
			}
			if(ret === null) // this might be because of non-support of Opera for getAttribute("hux:...")
				ret = getAttributeNS(el, name);
			if(ret === "") // correct odd behaviour of getAttributeNS, which returns "" if the attribute was not found
				ret = null;
			return ret;
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
		 * Function: getAttrAllPrefixes
		 * returns all the possible prefixed name for an attribute
		 * 
		 * Parameters: 
		 * 	- *attr*: {String} the unprefixed attribute name
		 * 
		 * Returns: 
		 * 	- {Array} all the possible prefixed name
		 */
		pub.getAttrAllPrefixes = function(attr){
			return [
				"data-hux-"+attr,
				"data-"+attr,
				"hux:"+attr
				// removed non-prefixed attribute because of conflicts with target
			];
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
		 * adds an event listener and ensure that teh listener will be called only once
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
			for(var i = 0; i < array.length; i++)
				fn.call(t||this, array[i], i, array);
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
	Browser: {
		layout_engine: /(Gecko|AppleWebKit|Presto)\/|(MSIE) /.exec(navigator.userAgent)[0].replace(/(\/| )$/, "").replace("MSIE", "Trident"),
		__prefixes: {"Gecko":"moz", "AppleWebKit":"webkit", "Presto":"o", "Trident":"ms"},
		/**
		 * Function: evtPrefix
		 * returns the prefix for browser-specific events (like (webkit|o)transitionend for Webkit and Presto)
		 */
		evtPrefix: function(){
			return this.__prefixes[this.layout_engine]; // example : moz
		},
		/**
		 * Function: cssPrefix
		 * returns the prefix for browser-specific css properties (like (-webkit-|-o-|-moz-)transition)
		 */
		cssPrefix: function(){
			return "-"+this.evtPrefix()+"-"; // example : -moz-
		},
		isOldMSIE: function(){
			return /MSIE [0-8]/.test(navigator.userAgent);
		}
	}
};

HUX.addModule( HUX );


// register Core API : 
(function(){
	//var isPublic = function(name){ return ! /^_/.test(name); };
	// register Compat : 
	HUX.Compat.forEach(["Compat", "HUXEvents", "Selector"], function(ns){
	
		for(var name in HUX[ns]){
			if( ! /^_/.test(name) )
				HUX.addToAPI(ns+'.'+name, HUX[ns][name]);
		}
	});
	HUX.addToAPI("inject", HUX.inject);
	HUX.addToAPI("xhr", HUX.xhr);
	
})();





