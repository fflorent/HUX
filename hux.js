
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
	
	addToAPI: (function(){
		
		var isObject = function(obj){
			return obj.constructor === Object; 
		    },
		    merge = function(obj, branch){
			for(var i in obj){
				var o = obj[i];
				if(isObject(o)){ // if o is an object
					if(branch[i] === undefined) // if it is not present in the current branch of HAPI
						branch[i] = {}; // we create a new branch
					else if(branch[i] instanceof Function)
						throw new Exception("cannot create "+i+" because a function with this name already exists");
					merge(o, branch[i]);
				}
				else if(o instanceof Function){
					branch[i] = o; // we add the function to the branch of HAPI
				}
				else
					throw "the object must only have other objects or functions";
			}
		    };
		
		return function(obj){
			/*
			var i, chunk, chunks = name.split('.'), cur = HAPI; 
			for(i = 0; i < chunks.length-1; i++){// for each sub-namespace in name
				chunk = chunks[i];
				if(! (chunk in cur) )
					cur[chunk] = {}; // we create a new object
				if( typeof cur[ chunk ] === "function" )
					throw "unable to to create HAPI."+name+" : HAPI."+chunks.slice(0,HUX.Compat.indexOf(chunk)).join('.')+" is not a namespace";
				cur = cur[ chunk ];     // we go through
			}
			cur[ chunks[i] ] = func;      // we finally add func*/
			if(! isObject(obj))
				throw "argument must be simple object, containing functions or other simple objects";
			merge(obj, HAPI);
		};
	})(),
	
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
	/*HUX.Compat.forEach(["Compat", "HUXEvents", "Selector"], function(ns){
	
		for(var name in HUX[ns]){
			if( ! /^_/.test(name) )
				HUX.addToAPI(ns+'.'+name, HUX[ns][name]);
		}
	});
	HUX.addToAPI("inject", HUX.inject);
	HUX.addToAPI("xhr", HUX.xhr);*/
	HUX.addToAPI({
		Compat: HUX.Compat, 
		HUXEvents: HUX.HUXEvents,
		Selector: HUX.Selector,
		inject: HUX.inject,
		xhr: HUX.xhr
	});
	
})();





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
HUX.SimpleLoader = {
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
		HUX.Compat.addEventListener(el, "click", HUX.SimpleLoader.onclick );
	},
	/**
	 * Function: listen
	 * binds "click" event to HUX.SimpleLoader.onClick function for each anchors having target attribute
	 * 
	 * Parameters : 
	 * 	- *context* : {Element} the context where we listen for events
	 */
	listen:function(context){
		// for all anchor elements having target attributes, we listen to "click" events
		HUX.Selector.byAttributeHUX("a", this.sTarget, context, this.fnEach);
	},
	/**
	 * Function: init
	 * inits the module. Calls addLiveListener
	 */
	init: function(){
		HUX.addLiveListener(this);
	}
};

HUX.addModule(HUX.SimpleLoader); 

HUX.addToAPI({"simpleload" : function(target, url, filling /* optional */){
	HUX.xhr({
		data:null,
		url:url,
		target:target,
		filling: filling,
		method: 'get',
		async:true
	});
}});

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
HUX.Pair = function(target, url){
	this.target = target;
	this.url = url;
};
HUX.Pair.prototype.equals = function(other){
	return  other instanceof HUX.Pair && 
		this.target === other.target && 
		this.url === other.url;
};
HUX.PairManager = function(){
	this.push.apply(this, arguments);
	
	
	if(Array.prototype.indexOf){
		this.indexOf = function(target){
			return Array.prototype.indexOf.call(this.map(function(e){ return e.target;}), target);
		};
	}
	else{
		this.indexOf = function(target){
			for(var i = 0; i < this.length; i++){
				if(this[i].target === target)
					return i;
			}
			return -1;
		};
	}
	this.addPair = function(target, url, callbacks){
		callbacks = callbacks || {};
		var index = this.indexOf(target), ok = true;
		if(url === "__default"){
			// we remove the pair
			if(index >= 0)
				this.removeAt(index, "all", callbacks.onDelete);
		}
		else if(index >= 0){
			// if a pair of the same target exists, we replace it by the new one
			var replacement = new HUX.Pair(target, url);
			if(callbacks.onReplace)
				ok = callbacks.onReplace(replacement, this[index]);
			if(ok !== false){
				this[index] = replacement;
				// we erase all pairs after the replaced element
				this.removeAt(index+1, "all", callbacks.onDelete);
			}
		}
		else{
			// otherwise, we add it to the array of pairs
			var added = new HUX.Pair(target, url)
			if(callbacks.onAdd)
				ok = callbacks.onAdd(added);
			if(ok !== false)
				this.push( added );
		}
		return index;
	};
	this.removePair = function(target){
		var index = this.indexOf(target);
		if(index >= 0)
			this.removeAt(index, 1);
		else
			throw new TypeError("element not found");
	};
	this.removeAt = function(index, nb, onDelete){
		nb = nb || 1; // by default, nb == 1
		if(nb === "all") // if nb is all
			nb = this.length; // we set nb as being this.length, thus we ensure that splice removes all after this[index]
		else if(nb instanceof String)
			throw new TypeError("second argument is invalid");
		if(typeof index === "number" && index >= 0){
			var aDeleted = this.splice(index,nb);
			if(onDelete !== undefined)
				HUX.Compat.forEach(aDeleted, onDelete); 
			
		}
		else
			throw new TypeError(index+" is not a valid index");
	};
	this.compairWith = function(other, callbacks){
		if(! other instanceof HUX.PairManager)
			throw new TypeError("the first argument is not a HUX.PairManager");
		
		callbacks = callbacks || {};
		var newIndex, aAdded, cont = true;
		for(var i = 0; i < Math.min(other.length, this.length); i++){
			
			if(this[i].equals(other[i]))
				continue; // lets say it is the normal case
			
			// now we treat any addition, replacement or deletion
			if(this[i].target === other[i].target){ // the url are different, but their target are the same : it is a replacement
				if("onReplace" in callbacks)
					cont = callbacks.onReplace(other[i], this[i]);
				if(cont === false){
					this.removeAt(i, "all")
					return;
				}
				this[i] = other[i];
			}
			else{
				newIndex = other.indexOf(this[i].target);
				if(newIndex < 0){
					if("onDelete" in callbacks)
						callbacks.onDelete(this[i]);
					this.removeAt(i);
				}
				else{
					aAdded = other.slice(i, newIndex);
					var self = this;
					HUX.Compat.forEach(aAdded, function(el){
						if(self.indexOf(el.target) >= 0)
							throw new TypeError("Inversion of two elements. Abandon");
					});
					if("onAdd" in callbacks){
						
						for(var i = 0; i < aAdded.length && cont; i++){
							cont = callbacks.onAdd(aAdded[i]);
							cont = (cont !== false);// we abort only if false is returned
							if(cont){
								// we add the new Pair
								this.splice(newIndex+i, 0, aAdded[i]);
							}
							else{
								this.removeAt(i, "all");
								return;
							}
							
						}
						
						//HUX.Compat.forEach(aAdded, callbacks.onAdd);
					}
					/*var args = aAdded.slice(); // we copy aAdded
					args.unshift(newIndex, 0); // we add the two first arguments of splice here
					this.splice.apply(this, args); */
				}
			}
		}
		// we delete the rest :
		while( this.length > other.length ){
			if("onDelete" in callbacks)
				callbacks.onDelete(this[other.length]);
			this.removeAt(other.length);
		}
		while( this.length < other.length && cont ){
			var added = other[this.length];
			if("onAdd" in callbacks)
				cont = callbacks.onAdd(added);
			if(cont === false)
				return;
			this.push(added);
			
		}
	};
	// a workaround of Array.prototype.map if it does not exist
	if( !this.map ){
		this.map = function(fn, thisArg){
			var a = [];
			thisArg = thisArg || this;
			for(var i = 0; i < this.length; i++){
				a[ i ] = fn.call(thisArg, this[i], i);
			}
			return a;
		}
	}
	
	

	
	
	
	this.setAsync = function(async){
		this.async = !!async;
	};
	this.toString = null;
};

// inspired from the inheritance method of Andrea Giammarchi
// http://devpro.it/code/183.html
(function(PM){
	PM.prototype = new Array;
	PM.prototype.length = 0;
	if(! new PM(1).length){
		PM.prototype = { length: 0 };
		HUX.Compat.forEach(["join", "pop", "push", "reverse", "shift", "slice", "sort", "splice", "unshift"], function(i){
			PM.prototype[i] = Array.prototype[i];
		});
	}
	var toString= Object.prototype.toString,
		slice   = Array.prototype.slice,
		concat  = Array.prototype.concat;
	PM.prototype.concat = function(){
		
		for(var Array = this.slice(0), i = 0, length = arguments.length; i < length; ++i){
		if(toString.call(arguments[i]) != "[object Array]")
			arguments[i] = typeof arguments[i] == "object" ? slice.call(arguments[i]) : [arguments[i]];
		};
		Array.push.apply(Array, concat.apply([], arguments));
		return  Array;
	};
	PM.prototype.constructor = PM;
})(HUX.PairManager);

HUX.PairManager.split  = function(str, pattern, callbacks){
	var resExec, sTarget, url, index, pm;
	if(!pattern.global)
		throw new TypeError("pattern must have the 'g' flag");
	pm = new HUX.PairManager();
	while( ( resExec = (pattern.exec(str)) ) !== null){
		sTarget = resExec[1];
		url = resExec[2];
		index = pm.addPair(sTarget, url, callbacks);
	}
	return pm;
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
HUX.HashMgr = {
	// =============================
	// PRIVATE PROPERTIES
	// =============================
	
	/**
	 * PrivateProperty: __hashObj
	 * {HashMap<String, String>} Split object of the current Hash. Matches each id with the URL of the content loaded.
	 */
	__hashObj:new HUX.PairManager(),
	// the previous hash (private)
	__prev_hash:location.hash,
	// counter for exceptions
	__watcher_cpt_ex:0,
	
	// store the content by default (before having injected content with HUX)
	__default_contents:{},
	

	
	// =============================
	// PUBLIC PROPERTIES
	// =============================
	
	/**
	 * Property: asyncReq
	 * {boolean} true if the requests have to be asynchronous, false otherwise (default: false)
	 */
	asyncReq: false,
	// does the browser support [on]hashchange event ?
	hashchangeEnabled: null,
	/**
	 * Property: inTreatment
	 * sort of mutex for event handlers
	 */
	inTreatment: false, 
	
	// limit of exceptions before stopping
	watcher_cpt_limit:10,
	/**
	 * Property: timer
	 * {Integer} Timer for browsers which do not support hashchange event. Used in <__watch>.
	 */
	timer:100,
	
	pairsCallbacks:{
		onAdd: function(added){
			var sTarget = added.target, target = document.getElementById(sTarget), self= HUX.HashMgr;
			if(target !== null){
				self.__default_contents[sTarget] = target.innerHTML;
				self.load(target, added.url);
				return true;
			}
			else{
				return false;
			}
		},
		onReplace: function(added){
			var target = document.getElementById(added.target), self= HUX.HashMgr;
			if(target !== null){
				self.load(target, added.url);
				return true;
			}
			else
				return false;
			},
		onDelete: function(deleted){
			var sTarget = deleted.target, self= HUX.HashMgr, replacement = self.__default_contents[sTarget];
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
	
	
	// =============================
	// PRIVATE FUNCTIONS
	// =============================
	
	
	/**
	 * PrivateFunction: __watch
	 * watcher for browsers which don't implement [on]hashchange event
	 */
	__watch: function(){
		try{
			HUX.HashMgr.handleIfChangement();
		}
		catch(ex){
			HUX.logError(ex);
			HUX.HashMgr.__watcher_cpt_ex++;
			throw ex;
		}
		finally{
			if(HUX.HashMgr.__watcher_cpt_ex < HUX.HashMgr.watcher_cpt_limit)
				window.setTimeout(HUX.HashMgr.__watch, HUX.HashMgr.timer);
		}
	},
	
	
	
	
	
	// =============================
	// PUBLIC FUNCTIONS
	// =============================
	
	
	/**
	 * Function: init
	 * inits the module. 
	 */
	init:function(){
		
		this.hashchangeEnabled = ( "onhashchange" in window) && (! document.documentMode || document.documentMode >= 8);
		// if the IFrameHack is needed, we create immediatly the iframe 
		if(this.IFrameHack.enabled)
			this.IFrameHack.createIFrame();
		// initiate the listener to hash changement
		if( this.hashchangeEnabled )
			HUX.Compat.addEventListener(window, "hashchange", HUX.HashMgr.handleIfChangement);
		else // if hashchange event is not supported
			this.__watch();
		// we listen to any anchor beginning with "#!" (corresponding to CCS3 Selector : a[href^="#!"])
		HUX.addLiveListener(HUX.HashMgr);
		// we treat location.hash
		HUX.HashMgr.handler(null, true);
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
			HUX.Compat.addEventListenerOnce(el, "click", HUX.HashMgr.onClick);
		};
		// we look for anchors whose href beginns with "#!" 
		if(document.evaluate !== undefined){
			prefixedTN = HUX.Selector.prefixTagName("a");
			HUX.Selector.evaluate("./descendant-or-self::"+prefixedTN+"[starts-with(@href, '#!')]", context, fnEach);
		}
		else{
			fnFilter = function(el){  
				// NOTE : el.getAttribute("href", 2) does not always work with IE 7, so we use this workaround to 
				// test if the href attribute begins with "#!"
				return el.href.indexOf( location.href.replace(/#(.*)/, "")+"#!" ) === 0;  
			};
			HUX.Selector.filterIE("a", fnFilter, context, fnEach);
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
		if(hash !== HUX.HashMgr.__prev_hash && !HUX.HashMgr.inTreatment){
			//info.push("diff");
			try{
				HUX.HashMgr.inTreatment = true;
				HUX.HashMgr.handler(ev);
			}
			catch(ex){
				HUX.logError(ex);
			}
			finally{
				HUX.HashMgr.__prev_hash = location.hash;
				HUX.HashMgr.inTreatment = false;
				HUX.HUXEvents.trigger("afterHashChanged", {"new_hash":HUX.HashMgr.__prev_hash});
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
			async:this.asyncReq,
			filling:null, // use default option (replace)
			target:target
		};
		HUX.xhr(opt);
	},
	/**
	 * Funtion: onClick
	 * handles click event on anchors having href="#!...". 
	 * Instead of replacing the hash, adds the href content in the hash.
	 * 
	 * Parameters:
	 * 	- *ev* : {DOM Event}
	 */
	onClick:function(ev){
		var srcElement = HUX.Compat.getEventTarget(ev);
		location.hash += ( srcElement.hash || srcElement.getAttribute("href") ).replace(/^#/,",");
		HUX.Compat.preventDefault(ev);
	},
	
	/**
	 * Function: updateHashSilently
	 * update the hash silently, i.e. without triggering hashchange event
	 * 
	 * Parameters:
	 * 	- *hash*: {String} the new hash to set 
	 * 	- *keepPrevHash*: {Boolean} true if we correct the current URL (default: false)
	 */
	updateHashSilently: function(hash, keepPrevHash){
		if( hash.replace(/^#/, "") !== location.hash.replace(/^#/, "") ){
			
			if(history.replaceState){
				var fn = history[ keepPrevHash ? "pushState" : "replaceState" ];
				fn.call(history, {}, document.title, hash);
			}
			else{
				// we "cancel" the previous location.hash which may be incorrect
				if(!keepPrevHash){ // keepPrevHash === true when called by init()
					history.back();
				}
				location.hash = hash;
			}
		}
		
	},
	/**
	 * Function: handler
	 * handles the hash modification
	 * 
	 * Parameters:
	 * 	- *ev* : {DOM Event} event object for hashchange event. Can be null
	 * 	- *keepPrevHash*: {Boolean} set to true if used by init, false otherwise.
	 */
	handler: function(ev, keepPrevHash){
		
		// what we name a pair here 
		// is a pair "TARGET ID" : "URL" that you can find in the hash
		var hash = location.hash.toString();
		var newPM = HUX.PairManager.split(hash, /[#,]!([^=,]+)=([^=,]+)/g), self = this;
		var normalHash = /,[^!]*$/.exec( location.hash ) || "";
		this.__hashObj.compairWith(newPM, this.pairsCallbacks);
		var sHash = "#"+this.__hashObj.map(function(e){return "!"+e.target+"="+e.url;}).join(",") +  normalHash;
		this.updateHashSilently(sHash , keepPrevHash);
		HUX.HashMgr.IFrameHack.updateIFrame(); // only if IFrameHack enabled
	},
	
	/* 
	 * namespace: HUX.HashMgr.IFrameHack
	 * hack for browsers from which we cannot use previous or next button (for history) to go to the previous hash
	 */
	IFrameHack: {
		/* this hack is only enabled for MSIE 1-7 */
		/**
		 * Variable: enabled
		 * {boolean} if true, this hack is enabled. Only enable for MSIE 1->7
		 */
		enabled: navigator.userAgent.search(/MSIE [1-7]\./) > 0 || ( "documentMode" in document && document.documentMode < 8 ), 
		iframe:null,
		id:"HUXIFrameHack", // the id of the iframe
		tmpDisableUpd: false, // we need to disable temporary the IFrame update 
		// creates an iframe if the lasts does not exists, and if the Iframe Hack is enabled
		__createIFrame: function(){
			this.iframe = document.createElement("iframe");
			this.iframe.id=this.id;
			this.iframe.src="about:blank";
			this.iframe.style.display = "none";
			document.body.appendChild(this.iframe);
		},
		/**
		 * Function: createIFrame
		 * creates the Iframe
		 */
		createIFrame: function(){
			return HUX.HashMgr.IFrameHack.__createIFrame.apply(HUX.HashMgr.IFrameHack, arguments);
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
					doc.write("<html><head><scri" + "pt type=\"text/javascript\">top.HUX.HashMgr.IFrameHack.setHash('"+location.hash+"');</scri" + "pt></head><body></body></html>");
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
	}
};

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
		HUX.addLiveListener(HUX.Form);
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
				opt = {
					data:null, // set below
					url:arg1.action,
					method:arg1.getAttribute("method"),
					async:HUX.Form.async,
					filling:HUX.HUXattr.getFillingMethod(arg1) || HUX.Form.defaultFilling,
					target:HUX.HUXattr.getTarget(arg1) || undefined/*, // 
					srcElement:form // ????*/
				};
				// we fill arrData : 
				HUX.Selector.byAttribute("*", "name", arg1, function(el){
					HUX.Form.serialize(el, arrData);
				});
				
				// we join the data array to have this form : "name1=value1&name2=value2&...."
				opt.data = arrData.join("&"); 
			}
			else 
				opt = arg1;
			
			// we call the XHR method
			HUX.xhr(opt);
			
		}
		catch(ex){
			HUX.logError(ex);
		}
	}
}; 
HUX.addModule(HUX.Form);
HUX.addToAPI({submit: HUX.Form.submit});


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

/**
 * Namespace: HUX.ScriptInjecter
 * inject scripts and run them when they are loaded
 */

HUX.ScriptInjecter = {
	head:document.getElementsByTagName("head")[0],
	asyn: false,
	/**
	 * Function : init
	 * inits the module
	 */
	init: function(){
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
			var toArray = Array.prototype.slice;
			HUX.Compat.forEach(ev.children, function(child){
				if(child.tagName === "SCRIPT")
					scripts.push(child);
				else if(child.nodeType === 1)
					scripts.push.apply(scripts, HUX.toArray(child.getElementsByTagName("script")));
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
		var script = aScripts.pop();
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
		else if(curScript.innerHTML && typeof script.text !== "undefined")
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
	 * loads a script, having a src attribute
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

HUX.addModule( HUX.ScriptInjecter );/**
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
    HTTP Using XML (HUX) : UrlManager
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
HUX.UrlMgr = {
	// history level
	level:0,
	// OLD_CONTENT corresponds to content that have been deleted. onPopState loads this type of content if the user goes back
	OLD_CONTENT:1,
	// NEW_CONTENT corresponds to content that have been added. onPopState loads this type of content if the user goes forward
	NEW_CONTENT:2,
	pairs: null,
	enabled: !!history.pushState,
	pairsCallbacks: {
		onAdd: function(added){
			var sTarget = added.target, target = document.getElementById(sTarget), self = HUX.UrlMgr;
			if(target !== null){
				self.__default_contents[sTarget] = target.innerHTML;
				return self.load(target, added.url);
			}
			else{
				return false;
			}
		},
		onReplace: function(added){
			var target = document.getElementById(added.target), self = HUX.UrlMgr;
			if(target !== null){
				return self.load(target, added.url);
			}
			else
				return false;
		},
		onDelete: function(deleted){
			var sTarget = deleted.target, replacement = HUX.UrlMgr.__default_contents[sTarget];
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
	preventDefaultIfDisabled: false,
	asyncReq: false,
	state:  null,
	__default_contents : {},
	init: function(){
		this.pairs = HUX.PairManager.split((location.pathname.match(/[^@]@(.*)/) || ["",""])[1], /([^=,]+)=([^=,]+)/g, this.pairsCallbacks);
		if(! this.enabled )
			return;
		if(!this.getState() || ! ( (this.getState().HUXStates || null) instanceof Array) ){
			this.initHUXState();
		}
		this.addObjectToState({});
		HUX.addLiveListener( this );
		
		this.pairs.toString = function(){
			return "@"+this.map(function(a){ return a.target+"="+a.url; }).join();
		};
		if( this.pairs.toString() !== ( location.pathname.match(/@.*/)||["@"] )[0] ){
			this.pushState([], "", location.pathname.replace(/@.*/g, "") + this.pairs.toString());
		}
	},
	listen: function(context){
		var self = HUX.UrlMgr;
		// this module works only with modern browsers which implements history.pushState
		// so we suppose that they implement evaluate as well...
		HUX.Selector.evaluate( "./descendant-or-self::a[starts-with(@href, '@')]", context, function(el){ 
			HUX.Compat.addEventListener(el, "click", function(){self.onClick.apply(self,arguments)}); 
		});
	},
	getState: function(){
		return history.state !== undefined ? history.state : HUX.UrlMgr.state;
	},
	updateState: function(state){
		if(!history.state)
			HUX.UrlMgr.state = state;
	},
	load: function(target, url){
		var opt = {
                        data:null,
                        url:url,
                        method:'get',
                        async:this.asyncReq,
                        filling:null, // use default option (replace)
                        target:target
                };
		
                var xhr = HUX.xhr(opt);
		return xhr.status === 200;
	},
	getNewState: function(target, url){
		var reExtract = new RegExp(location.pathname+".*");
		var curState = location.href.match(reExtract)[0];
		var newState = curState.replace( /(@.*|$)/, this.pairs.toString());
		return newState;
	},
	initHUXState: function(){
		var state = this.getState() || {};
		state.HUXStates = [];
		state.level = this.level;
		history.replaceState(state, "", "");
	},
	getProxyOnClickCallback: function(fnOrig, newHUXStates){
		var self = this;
		return function(oTarget){
			var obj, target, ret, sTarget = oTarget.target;
			target = document.getElementById( sTarget );
			if(target !== null)
				obj = {target: sTarget, content:target.innerHTML, type:self.OLD_CONTENT};
			ret = fnOrig.apply(this, arguments);
			if(ret && target !== null){
				self.addObjectToState(  obj  );
				newHUXStates.push( {target: sTarget, content:target.innerHTML, type:self.NEW_CONTENT} );
			}
			return ret;
		};
	},
	onClick: function(event){
		var at = HUX.Compat.getEventTarget(event).href.replace(/.*@!?/g, "");
		var sPairs = at.split(",");
		var newHUXStates = [], self = this;
		HUX.Compat.forEach(sPairs, function(sPair){
			var pair, sTarget, target, url;
			pair = sPair.split("=");
			sTarget = pair[0];
			target = document.getElementById(sTarget);
			url = pair[1];
			//this.addObjectToState({target:target.id, content:target.innerHTML, url:"", type:this.OLD_CONTENT});
			this.pairs.addPair(sTarget, url, {
				onAdd: this.getProxyOnClickCallback(this.pairsCallbacks.onAdd, newHUXStates),
				onDelete: this.getProxyOnClickCallback(this.pairsCallbacks.onDelete, newHUXStates),
				onReplace: this.getProxyOnClickCallback(this.pairsCallbacks.onReplace, newHUXStates)
			});
			//newHUXStates.push(  {target: sTarget, content:target.innerHTML ,url:url, type:this.NEW_CONTENT}  );
		}, this);
		this.pushState(newHUXStates, "", this.pairs.toString());
		HUX.Compat.preventDefault(event);
	},
	pushState: function(obj, title, newState){
		var state = {HUXStates: obj};
		state.level = ++this.level;
		history.pushState(state, title, newState);
	},
	addObjectToState: function(obj, title){
		var state = this.getState();
		if(!state)
			throw new Error("state is null");
		state.HUXStates = (state.HUXStates || []).filter(function(el){return el.target !== obj.target || el.type !== obj.type;}).concat([obj]);
		history.replaceState(state, title, "");
	},
	onPopState: function(event){
	//	console.log(arguments);
		try{
			var state = event.state, self = HUX.UrlMgr;
			if(!state || state.level === undefined || !self.enabled)
				return;
			self.updateState( state );
			var old_level = self.level;
			self.level = state.level;
			var type2load = old_level > self.level ? self.OLD_CONTENT : self.NEW_CONTENT;
			HUX.Compat.forEach(state.HUXStates, function (info){
				if(info.type === type2load){
					var target = document.getElementById(info.target);
					if(target === null){
						HUX.logError("target #"+info.target+" not found");
						return;
					}
					HUX.HUXEvents.trigger("loading", {target:  target});
					HUX.inject(target, "replace", info.content);
				}
			}, this);
		}
		catch(ex){
			HUX.logError(ex);
		}
	}
};
HUX.Compat.addEventListener( window, "popstate", HUX.UrlMgr.onPopState );
HUX.addModule( HUX.UrlMgr );

(function(){
	var proxy;
	// we update HUx.UrlMgr.state each time pushState or replaceState is called
	if(history.pushState && history.state === undefined){
		proxy = function(origFn, state){
			var args = Array.prototype.slice.call(arguments, 1);
			origFn.apply(this, args);
			HUX.UrlMgr.updateState( state );
		};
		history.pushState = HUX.wrapFn(history.pushState, proxy );
		history.replaceState = HUX.wrapFn(history.replaceState,  proxy );
	}
	
})();

/**
 * 
 * converts links of type "@..." to "#!..."
 * if history.pushState is not available
 * 
 * Requires: HUX.UrlMgr, HUX.HashMgr
 */

HUX.UrlMgrFb = {
	enabled: history.pushState === undefined,
	init: function(){
		if(this.enabled){
			HUX.addLiveListener(this);
		}
	},
	listen: function(context){
		if(document.evaluate){
			var links = HUX.Selector.evaluate( "./descendant-or-self::a[starts-with(@href, '@')]", context);
			HUX.Compat.forEach(links, this.replaceEach, this);
		}
		else{
			fnFilter = function(el){  
				// NOTE : el.getAttribute("href", 2) does not always work with IE 7, so we use this workaround to 
				// test if the href attribute begins with "#!"
				return el.href.indexOf( location.href.replace(/@.*|#.*/g, "")+"@" ) === 0;  
			};
			HUX.Selector.filterIE("a", fnFilter, context, this.replaceEach);
		}
	},
	
	replaceEach: function(el){
		el.href = el.href.replace(/^.*@/, "#!").replace(",", ",!");
		// we ensure that the listener will not be called twice
		HUX.Compat.addEventListenerOnce(el, "click", HUX.HashMgr.onClick); 
	}
	
};
HUX.addModule(HUX.UrlMgrFb);/**
    HTTP Using XML (HUX) : Transition
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

// NOTE : experimental, needs improvement ...

(function(){
	var ht;
	HUX.Transition = ht = {
		enabled: true,
		timeout:30,
		sTransitionEnd:HUX.Browser.evtPrefix() !== "moz" ? HUX.Browser.evtPrefix()+"TransitionEnd" : "transitionend",

		cssPrefix: HUX.Browser.cssPrefix(),
		/**
		* inspired from http://www.quirksmode.org/dom/getstyles.html
		* get the computed style of an element
		*/ 
		getStyle: function(el, styleProp){
			var func = new Function();
			// IE
			if (el.currentStyle)
				return  el.currentStyle[styleProp] || "";
			// other browsers
			else if(window.getComputedStyle)
				return document.defaultView.getComputedStyle(el,null).getPropertyValue(styleProp) || "";
			else
				return null;
		},
		init: function(){
			var evName;
			if(!this.enabled)
				return;
			HUX.HUXEvents.bindGlobal("loading", ht.onLoading);
			HUX.HUXEvents.createEventType("transiting");
		},
		getDuration: function(target){
			var duration = ht.getStyle(target, ht.cssPrefix+"transition-duration");
			var ms ;
			if(! duration)
				ms = 0;
			else
				ms = parseFloat(duration.replace(/s$/, ""))*1000;
			return ms;
		},
		flushStyle: function(target){
			ht.getStyle(target, "display");
		},
		onLoading: function(ev){
			var target;
			if( ht.hasClass(ev.target, "hux_transition") && ht.enabled ){
				ev.target.className = ev.target.className.replace(/\s*hux_tAppear\s*/g, "");
				target = ev.target.cloneNode(true);
				target.className += " hux_tVanishInit";
				HUX.HUXEvents.trigger("transiting", {target:target});
				ev.target.parentNode.insertBefore(target, ev.target);
				// this makes flush the style ...
				ht.flushStyle(target);
				
				target.className += " hux_tVanish";
				var ms = ht.getDuration(target);
				// rather than use transitionEnd that can never be triggered (if transition is not done)
				// we use setTimeout with the value of the duration
				setTimeout(function(){
					target.parentNode.removeChild(target);
					ht.makeAppear(ev);
				}, ms);
			}
		},
		makeAppear: function(ev){
			var target = ev.target;
			target.className += " hux_tAppearInit";
			// flush the style
			ht.flushStyle(target);
			target.className = target.className.replace(/(hux_tAppear)Init/, "$1");
			var ms = ht.getDuration(target);
			setTimeout(function(){
				target.className = target.className.replace("hux_tAppear", "");
			}, ms);
		},
		hasClass: function(target, className){
			return new RegExp("(^|\\s)"+className+"($|\\s)").test(target.className);
		}
	};
	ht.init(); // we launch the module directly
})();