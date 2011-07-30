
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

/**
 * Namespace: HUX Core
 * NOTE : all methods or attributes beginning with __ (for example : HUX.HUXEvents.__arrEv) should not be used elsewhere than in their namespace
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
		mod.listen(document);
		HUX.HUXEvents.bindGlobal("beforeInject", function(event){
			HUX.foreach(event.children, function(child){
				if(child.nodeType === 1)  // is child an Element ?
					mod.listen(child); 
			});
		});
	},
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
	foreach: function(array, fn){
		for(var i = 0; i < array.length; i++)
			fn(array[i]); // using call because of IE which lose "this" reference
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
		// NOTE : Array.slice.prototype.call(obj) when obj is a node list is not supported by IE 7
		// since the execution seems really fast with modern browser, we just run this basic algotihm :
		var ret = [], i;
		for(i = 0; i < obj.length; i++){
			ret.push( obj[i] );
		}
		return ret;
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
	 * 	- *allChildren*: {Boolean} set to true to also import its children
	 * 
	 * Returns:
	 * 	- {Node} the imported node
	 */
	importNode: function(node, allChildren) {
		/* find the node type to import */
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
	 * Namespace: HUXEvents
	 * HUX specific event Manager 
	 * Events :
	 *  - *beforeInject* : triggered before injecting content to the target element. 2 arguments : event.target = the target element, event.children = the elements to add
	 *  - *afterInject* : triggered after injecting content to the target element. 2 arguments : event.target = the target element, event.children = the added elements
	 *  - *beforeEmpty* : triggered before emptying target element. 1 argument : event.target=the element to empty
	 *  - *requestError* : triggered if an XMLHttpRequest failed. 1 argument : event.xhr = the XHR object
	 *  - *loading* : triggered when a HUX request is running. 1 argument : event.target = the target of the HUX request
	 */
	HUXEvents:{
		// array of listener for each event
		__arrEv:{
			"beforeInject":{"global":[]}, 
			"beforeEmpty":{"global":[]},
			"requestError":{"global":[]},
			"afterInject":{"global":[]},
			"loading":{"global":[]}
		},

		__addListener: function(key, evName, fn){
			var arrEv = this.__arrEv;
			if(arrEv[evName]){
				if(! (key in arrEv[evName]) )
					arrEv[evName][key] = [];
				arrEv[evName][key].push(fn);
			}
			else
				throw new Error("the event "+evName+" does not exist for HUX");
		},
		__removeListener: function(key, evName, fn){
			HUX.removeElement(this.__arrEv[evName][key], fn);
		},
		// get the listeners of an event safely
		__getListeners: function(evName, tid){
			var lis = this.__arrEv[ evName ];
			// if this.__arrEv[ evName ][ tid ] does not exist, we return an empty array
			return ( lis && tid in lis ) ? lis[ tid ] : [];
		},
		/**
		 * Function: bindGlobal
		 * binds an event listener for all elements
		 * 
		 * Parameters:
		 * 	- *evName*: {String} the event Name
		 * 	- *fn*: {Function} the event listener
		 */
		bindGlobal: function(evName, fn){
			return this.__addListener("global", evName, fn);
		},
		/**
		 * Function: unbindGlobal
		 * unbind an event listener that have been bound 
		 * 
		 * Parameters: 
		 * 	- *evName*: {String} the event Name
		 * 	- *fn*: {Function} the event listener to remove
		 */
		unbindGlobal: function(evName, fn){
			return this.__removeListener("global", evName, fn);
		},
		// check if the target has an id. If not, throws an exception
		__checktid: function(callerName, target){
			if(!target.id)
				throw new Error(callerName+": first argument must be an HTMLElement with an id");
			
		},
		/**
		 * Function: bind
		 * sort of addEventListener
		 * 
		 * Parameters: 
		 *	- *target* : {Element} the target of the event. Can be a 
		 * 	- *evName* : {String} the name of the event
		 * 	- *fn* : {Function} the listener
		 */
		bind:function(target, evName, fn){
			this.__checktid("HUXEvents.bind", target);
			return this.__addListener(target.id, evName, fn);
		},
		/**
		 * Function: unbind
		 * sort of removeEventListener
		 * 
		 * Parameters: 
		 *	- *target* : {Element} the target of the event. Can be a 
		 * 	- *evName* : {String} the name of the event
		 * 	- *fn* : {Function} the listener to remove
		 */
		unbind: function(target, evName, fn){
			this.__checktid("HUXEvents.unbind", target);
			return this.__removeListener(target.id, evName, fn);
		},
		/**
		 * Function: trigger
		 * trigger all event Listener for a specific event 
		 * 
		 * Parameters:
		 * 	- *evName* : {String} the name of the Event (String)
		 * 	- *event* : {HUX Event Object} object with information about the event 
		 * NOTE : if the event has a target, put it as event.target
		 */
		trigger: function(evName, event){
			try{
				var lsters = [], tid = (event.target?event.target.id : null), arrEv = this.__arrEv;
				// we merge the listeners for the specific element and the listeners for "global"
				
				if(tid)
					lsters = lsters.concat( this.__getListeners(evName, tid) );
				lsters = lsters.concat( this.__getListeners(evName, "global") );
				
				event.type = evName;
				HUX.foreach(lsters, function(fn){
					var ret = fn.call(window, event);
					if(ret === false)
						throw "trigger stoped";
				});
			}
			catch(ex){
				HUX.logError(ex);
			}
		},
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
		createEventType: function(evName){
			// if this.__arrEv is not undefined nor null
			if( this.__arrEv[evName] )
				return false; // we do not create the same event type twice
			// normal case
			this.__arrEv[evName] = {"global":[]};
			
			return true;
		}
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
	/**
	 * Namespace; Inject
	 * 
	 * DOM Injection manager. 
	 */
	Inject:{
		
		/**
		 * Function: __proceed
		 * proceeds to the injection. Do not use this function directly. See <inject>
		 * 
		 * Parameters:
		 * 	- *target* : {Element} the element which will receive DOMContent
		 * 	- *method* : {String} the string tallying to hux:filling
		 * 	- *DOMContent* : {DocumentFragment or Document} container of elements to be added to target
		 * 
		 * NOTE : DOMContent is a DocumentFragment if it has been generated through a String, or a Document if it has been given as is by the brower. 
		 * 	If it is a Document, you may have to use <importNode>.
		 * 	In the most cases, it is a DocumentFragment.
		 * 
		 * Returns:
		 * 	- {NodeList of Elements} the inserted elements
		 */
		__proceed: function(target, method, DOMContent){
			var aInserted = this.callFillingMethod(target, method, DOMContent);
			HUX.HUXEvents.trigger("afterInject", {target: target || document.body, children: aInserted});
			return aInserted;
			
		},
		__checkTarget: function(target, methodName){
			if(!target)
				throw new Error(methodName+" filling method requires a target element");
		},
		__fillingMethods: {
			prepend: function(DOMContent, target){
				this.__checkTarget( target, "prepend")
				DOMContent = this.forceDocumentFragment( DOMContent );
				if(target.childNodes.length > 0){ // we use InsertBefore
					HUX.HUXEvents.trigger("beforeInject", {target: target, children: DOMContent.childNodes});
					firstChild = target.firstChild;
					target.insertBefore(DOMContent, firstChild);
					return DOMContent.childNodes;
				}
				else{ // if target has no children, we append 
					return this.callFillingMethod(target, "append", DOMContent);
				}
			},
			append: function(DOMContent, target){
				var aInserted;
				DOMContent = this.forceDocumentFragment( DOMContent );
				if(DOMContent.nodeType !== document.DOCUMENT_FRAGMENT_NODE)
					throw new TypeError("append expects a DocumentFragment");
				this.__checkTarget(target, "append");
				HUX.HUXEvents.trigger("beforeInject", {target: target, children: DOMContent.childNodes});
				target.appendChild(DOMContent);
				aInserted = target.childNodes;
				return aInserted;
			},
			replace: function(DOMContent, target){
				this.__checkTarget(target, "replace");
				this.empty(target);
				return this.callFillingMethod(target, "append", DOMContent);
			}
		},
		/**
		 * Function: callFillingMethod
		 * calls a filling method
		 * 
		 * NOTE: This function is rather designed to be called by other filling methods. 
		 * 	If you want to handle an event, see <HUX.inject>
		 * 
		 * Parameters:
		 * 	- *target* : {Element} the element which will receive @DOMContent
		 * 	- *method* : {String} the string tallying to hux:filling
		 * 	- *DOMContent* : {DocumentFragment or Document} Document(Fragment) containing elements to be added to @target
		 * 
		 * Returns:
		 * 	- {NodeList} the inserted elements
		 */
		callFillingMethod: function(target, method, DOMContent){
			return this.__fillingMethods[ method ].call(this, DOMContent, target || null);
		},
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
		setFillingMethod: function( method, fn, requiresTarget){
			var _fn = fn;
			if(requiresTarget){
				// we create a proxy to call __checkTarget before calling the original function
				_fn = function(DOMContent, target){
					this.__checkTarget(target, method);
					return fn.apply(this, arguments);
				}
			}
			this.__fillingMethods[ method ] = _fn;
		},
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
		forceDocumentFragment: function(doc){
			var ret = doc, content;
			if(doc.nodeType === document.DOCUMENT_NODE){
				content = [];
				HUX.foreach(doc.childNodes, function(c){
					content.push( c );
				});
				ret = this.injectIntoDocFrag( content );
			}
			return ret;
		},
		/**
		 * Function: empty
		 * removes each child of parent
		 * 
		 * Parameters:
		 * 	- *parent* : {Element} the parent to empty
		 */
		empty: function(parent){
			var child;
			HUX.HUXEvents.trigger("beforeEmpty", {target: parent});
			while( (child=parent.firstChild) !== null ){
				parent.removeChild(child);
			}
		},	
		/**
		 * Function: getChildren
		 * DEPRECATED: use <injectIntoDocFrag> instead
		 * 
		 * gets all the children from a parent Element
		 * 
		 * Parameters:
		 * 	- *parent*: {Element} the parent Element
		 * 
		 * Returns:
		 * 	- {NodeList} the children
		 */
		getChildren: function(parent){
			return parent.childNodes;
		},
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
		injectIntoDocFrag: function(nodes){
			var frag = document.createDocumentFragment();
			var i = 0;
			for(var i = 0;  i < nodes.length; i++){
				// depending on the parentNode, the NodeList can remove nodes[ i ] once it is appended somewhere else
				// so, we use cloneNode(true), even if it is less optimized
				frag.appendChild( nodes[i].cloneNode(true) );
			}
			return frag;
		},
		
		/**
		 * Function: htmltodom
		 * convert HTML String to DOM
		 * 
		 * Parameters:
		 * 	- *sHtml* : {String} String containing HTML
		 * 	- *context* : {Element} the element designed to receive the content (optional)
		 * 
		 * Returns:
		 * 	- {DocumentFragment} a DocumentFragment with the generated Elements
		 */
		htmltodom: function(sHtml, context){
			var parent = context ? context.cloneNode(false) : document.createElement('div');
			try{
				parent.innerHTML = sHtml;
			}
			catch(e){
				// IE doesn't allow using innerHTML with table,
				// but allows create a div element in which we inject the HTML String of a TABLE
				if(parent.tagName === "TABLE" ){
					if(/^<(tr|tbody)/i.test(sHTML)){
						parent = this.htmltodom("<TABLE>"+sHtml+"</TABLE>", context).firstChild;
					}
					else{
						HUX.logError("TABLE element can only have TR and TBODY elements as direct children");
					}
				}
				else
					HUX.logError(e);
			}
			var ret = this.injectIntoDocFrag(parent.childNodes);
			parent = null;
			return ret;
		}
	},
	/**
	 * Function: inject
	 * 
	 * Parameters:
	 *	- *target* : {Element} the element which will receive @DOMContent
	 * 	- *method* : {String} the string tallying to hux:filling (default : "replace")
	 * 	- *content* : {String or Array of Element} HTML String or Array of elements to be added to @target
	 */
	inject:function(target, method, content){
		var DOMContent;
		if(typeof content === "string")
			DOMContent = this.Inject.htmltodom(content, target);
		else if(content.nodeType){ // if content is a node : 
			if(content.nodeType === document.DOCUMENT_NODE){ // if the node is an XML Document
				DOMContent = content;
			}
			else
				DOMContent = this.Inject.injectIntoDocFrag( [ content ] ); // we create a single element Array
		}
		else if(content.length !== undefined){ // if the content is enumerable and is not a node
			DOMContent = this.Inject.injectIntoDocFrag( content );
		}
		else
			throw new TypeError("content : invalid argument");
		if(! method) // if method === null, default is REPLACEMENT
			method = "replace";
		this.Inject.__proceed.call(this.Inject, target, method, DOMContent); 
	},
	/**
	 * Namespace: Selector
	 * DOM Selector Tool
	 */
	Selector: {
		__prefixTN: "",
		/**
		 * Function: init
		 * inits the module
		 */
		init: function(){
			// check whether we are using html or xhtml ...
			if(document.evaluate !== undefined){
				if( this.evaluate("/html").length > 0 )
					this.__prefixTN = "";
				else if(this.evaluate("/xhtml:html").length > 0)
					this.__prefixTN = "xhtml:";
				else
					throw new Error("Document non supported by HUX");
			}
		},
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
		prefixTagName: function(tagName){
			return this.__prefixTN+tagName;
		},
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
		byAttributeHUX: function(tagName, attr, context, fnEach){
			var xpath, prefixedTN, attrs = HUX.HUXattr.getAttrAllPrefixes(attr), sAttrXP, ieRet = [];
			prefixedTN = this.prefixTagName(tagName);
			if(typeof document.evaluate !== "undefined"){
				sAttrXP = attrs.join(" or @"); // sAttrXP = "data-attr OR @data-hux-attr OR @hux:attr"
				xpath = ".//"+prefixedTN+"[@"+sAttrXP+"]";
				return this.evaluate(xpath, context, fnEach);
			}
			else{
				var self= this;
				HUX.foreach(attrs, function(attr){
					ieRet = ieRet.concat( self.__byAttributeIE.call(self, tagName, attr, context, fnEach) );
				});
				return ieRet;
			}
		},
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
		nsResolver:function(prefix){
			var ns = {
				"hux":HUX.namespace,
				"xhtml":"http://www.w3.org/1999/xhtml"
			};
			if(!prefix)
				return ns.xhtml;
			return ns[prefix];
		},
		/**
		 * Function: evaluate
		 * 
		 * evaluates an XPath Expression
		 * 
		 * NOTES: 
		 *  - we use document.evaluate instead of document.querySelectorAll because of the non-implementation of namespace gestion in CSS3 selectors 
		 *  - if you use a context, your xpath expression may begin with a dot (example : ".//p" for selecting all paragraphs in the context)
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
		evaluate:function(sXpath, context, fnEach){
			context = context || document;
			fnEach = fnEach || function(){};
			var results = document.evaluate(sXpath, context, this.nsResolver, XPathResult.ANY_TYPE, null); 
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
			var fnFilter = function(el){  return el.getAttribute(attr);  }; // NOTE : IE7 returns "" if the attribute does not exist
			return this.filterIE(tagName, fnFilter, context, fnEach);
		},
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
		filterIE: function(tagName, fnFilter, context, fnEach){
			var ret = [], elts;
			context = context || document;
			fnEach = fnEach || function(){};
			elts = context.getElementsByTagName(tagName);
			// for each element found above
			HUX.foreach(elts, function(el){
				// we test the Filter function given
				if( fnFilter(el) ){
					ret.push(el); // if the filter accepted the condition, we add the current element in the results
					fnEach(el);   // we call the for-each function given by the user
				}
			});
			return ret;
		}
	},
	/**
	 * Namespace: XHR
	 * Prefer use directly <HUX.xhr> instead
	 */
	XHR: {
		// see HUX.xhr(opt)
		proceed: function(opt){
			if(! opt.url.length === 0)
				throw new TypeError("invalid arguments");
			try{
				var data = null, xhr;
				// default value for opt.async is true
				if(opt.async === undefined)
					opt.async = true;
				// we get the XHR Object
				xhr = this.getXhrObject();
				
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
				// we trigger the event "loading"
				HUX.HUXEvents.trigger("loading", {target:opt.target || document.body});
				// 
				this.setReadystatechange(xhr, opt.filling, opt.target);
				xhr.setRequestHeader("Content-Type", opt.contentType || "application/x-www-form-urlencoded");
				xhr.send(data);
			}
			catch(ex){
				HUX.logError(ex); // 
			}
		},
		// taken from jQuery, returns an XMLHttpRequest object
		getXhrObject: function(){
			return window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
		},
		
		onSuccess: function(xhr, filling, target){
			HUX.inject(target, filling, (xhr.responseXML && xhr.responseXML.documentElement)? xhr.responseXML : xhr.responseText);
		},
		onError: function(xhr){
			HUX.HUXEvents.trigger("requestError", {xhr:xhr});
		},
		setReadystatechange: function(xhr, filling, target){
			try{
				var self = this;
				xhr.onreadystatechange = function(){
					try{
						if(xhr.readyState  === 4){
							if(xhr.status  === 200) 
								self.onSuccess(xhr, filling, target);
							else 
								self.onError(xhr);
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
		}
	},
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
	 * 	- *opt.target* : {Element} the target (in which we will inject the content). Optional for some filling methods.
	 * 	- *opt.data* : {URLEncoded String} the data to send
	 *	- *opt.async* : {Boolean} asynchronous if true, synchronous if false (default = true)
	 *	- *opt.username* ; {String} the login (optional)
	 * 	- *opt.password* : {String} the password (optional)
	 *	- *opt.contentType* : {String} Content-Type Request Header (default = "application/x-www-form-urlencoded")
	 */
	xhr:function(opt){
		return this.XHR.proceed.apply(this.XHR, arguments);
	},
	/**
	 * Namespace: HUXattr
	 * Attribute Manager for HUX
	 */
	HUXattr: {
		__getAttributeNS: function(srcElement, name){
			return srcElement.getAttributeNS ? srcElement.getAttributeNS(HUX.namespace, name) : srcElement.getAttribute("hux:"+name);
		},
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
		getAttributeHUX: function(el, name){
			var ret = null,  attrs = this.getAttrAllPrefixes(name), i;
			for(i = 0; i < attrs.length && ret === null; i++){
				ret = el.getAttribute( attrs[i] );
			}
			if(ret === null) // this might be because of non-support of Opera for getAttribute("hux:...")
				ret = this.__getAttributeNS(el, name);
			if(ret === "") // correct odd behaviour of getAttributeNS, which returns "" if the attribute was not found
				ret = null;
			return ret;
		},
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
		getFillingMethod: function(el){
			return this.getAttributeHUX(el, "filling");
		},
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
		getTarget: function(el){
			var idTn = this.getAttributeHUX(el, "target");
			return document.getElementById(idTn);
		},
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
		getAttrAllPrefixes: function(attr){
			return [
				"data-hux-"+attr,
				"data-"+attr,
				"hux:"+attr
				// removed non-prefixed attribute because of conflicts with target
			];
		}
		
	},
	/**
	 * Namespace: Compat
	 * functions for cross-browsers compatibilities
	 */
	Compat: {
		// do we use addEventListener or attachEvent ?
		__fn_addEventListener : (window.addEventListener? 'addEventListener':'attachEvent'),
		__fn_removeEventListener : (window.removeEventListener ? 'removeEventListener':'detachEvent'),
		// does the event name have to be prefixed with 'on' ? (yes with attachEvent, no with addEventListener)
		__prefix_eventListener: (window.addEventListener? '':'on'),
		
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
		 * 	- <getEventTarget>
		 * 	- <preventDefault>
		 * 
		 * Example of use: 
		 * >	function liLoad(ev){ alert("page loaded") };
		 * >	HUX.Compat.addEventListener(window, "load", liLoad );
		 */
		addEventListener: function(target, evName, fn){
			evName = this.__prefix_eventListener+evName;
			return target[this.__fn_addEventListener](evName, fn, false);
		},
		
		/**
		 * Function: removeEventListener
		 * removes a DOM event listener from an element
		 * 
		 * Parameters: 
		 *	- *target* : {Element} the event target 
		 *	- *evName* : {String} the name of the event
		 *	- *fn* : {Function} the function to call when the event is triggered
		 * 
		 * See Also:
		 * 	- <addEventListener>
		 * 
		 * Example of use:
		 * >	HUX.Compat.removeEventListener(window, "load", liLoad);
		 * 
		 */
		removeEventListener: function(target, evName, fn){
			evName = this.__prefix_eventListener+evName;
			return target[this.__fn_removeEventListener](evName, fn, false);
		},
		
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
		getEventTarget: function(ev){
			return window.event === undefined ? ev.target : event.srcElement;
		},
		
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
		preventDefault: function(ev){
			if(window.event === undefined) // not IE
				ev.preventDefault();
			else // IE
				event.cancelBubble = event.returnValue = false;
		}
	}
};

HUX.addModule( HUX );

/**
* Function#hux_wrap(wrapper) -> Function
* - *wrapper* (Function): The function to use as a wrapper.
*
* Returns a function "wrapped" around the original function.
*
* for the full documentation, see http://www.prototypejs.org/api/function/wrap
**/
// inspired from Prototype Wrap Method : https://github.com/sstephenson/prototype/blob/master/src/prototype/lang/function.js
Function.prototype.hux_wrap = function(fn){
	var __method = this;
	return function(){
		var a = [__method];
		Array.prototype.push.apply(a, arguments);
		return fn.apply(this, a);
	};
};
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
				target:HUX.HUXattr.getTarget(srcElement),
				srcElement:srcElement
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
	__hashObj:{},
	// the previous hash (private)
	__prev_hash:location.hash,
	// counter for exceptions
	__watcher_cpt_ex:0,
	
	// store the content by default (before having injected content with HUX)
	__default_content:{},
	

	
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
	
	
	/**
	 * PrivateFunction: __hashStringToObject
	 * creates the Object for hash
	 * 
	 * Parameters:
	 * 	- *hash*: {String} the location hash to convert
	 * 
	 * Returns: 
	 * 	- the object of this type : {"[sTarget]":"[url]", ...}
	 */
	__hashStringToObject: function(hash){
		var new_hashObj = {};
		var pattern = new RegExp("[#,]!([^=,]+)=([^=,]+)", "g");
		
		while( ( resExec = (pattern.exec(hash)) ) !== null){
			sTarget = resExec[1];
			url = resExec[2];
			new_hashObj[sTarget] = url;
		}
		return new_hashObj;
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
			HUX.Compat.addEventListener(el, "click", HUX.HashMgr.onClick);
		};
		// we look for anchors whose href beginns with "#!" 
		if(document.evaluate !== undefined){
			prefixedTN = HUX.Selector.prefixTagName("a");
			HUX.Selector.evaluate(".//"+prefixedTN+"[starts-with(@href, '#!')]", context, fnEach);
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
		var hash = location.hash.toString();
		var resExec, sTarget, target, url, hash_found, sHash = "#";
		var new_hashObj = this.__hashStringToObject(hash);
		// we do all XHR asked through location.hash
		for(sTarget in new_hashObj){
			target = document.getElementById(sTarget);
			url = new_hashObj[sTarget];
			hash_found = this.__hashObj[sTarget];
			if(target!== null && url !== "__default"){ // if the URL given is __default, we load the default content in the target element  
				// we fill a string which will be the new location.hash
				sHash += '!'+sTarget+'='+url+',';
				if(!hash_found || hash_found !== url){
					if(!hash_found){
						this.__default_content[sTarget] = target.cloneNode(true);
					}
					this.load(target, url);
				}
				
				delete this.__hashObj[sTarget]; // later, we will inject the default content in the remaining elements
			}
			else if(url === "__default")
				delete new_hashObj[sTarget];
		}
		// for each element remaining in __hashObj, we inject the default content in it
		for(sTarget in this.__hashObj){
			var replacement;
			replacement = this.__default_content[sTarget];
			if(replacement !== undefined){
				target = document.getElementById(sTarget);
				if(target !== null){
					target.parentNode.insertBefore(replacement, target);
					target.parentNode.removeChild(target);
				}
			}
		}
		
		// we update location.hash
		this.updateHashSilently( sHash.replace(/,$/, ""), keepPrevHash);
		HUX.HashMgr.IFrameHack.updateIFrame(); // only if IFrameHack enabled
		this.__hashObj = new_hashObj;
	},
	/*handler:function(){
		return HUX.HashMgr.__handler.apply(HUX.HashMgr, arguments);
	},*/
	
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
		catch(ex){
			HUX.logError(ex);
		}
		finally{
			var args = Array.prototype.slice.call(arguments, 1); // we do not keep origFn in arguments for calling the original function
			origFn.apply(this, args);
		}
	});
	
})(HUX.HashMgr, HUX); /**
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
	 * Default: "append"
	 */
	defaultFilling: "append",
	/**
	 * Variable: clearAfterSubmit
	 * {Boolean} if true, the form is cleared after being submitted
	 * 
	 * Default: true
	 */
	clearAfterSubmit: true,
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
		HUX.Selector.byAttributeHUX("form", "target", context, function(el){
			HUX.Compat.addEventListener(el, "submit", HUX.Form.onSubmit );
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
	 * Function: onSubmit
	 * handles the form submission
	 * 
	 * Parameters:
	 * 	- *ev*: {DOM Event Object}
	 */
	onSubmit: function(ev){
		try{
			var arrData = [], form = HUX.Compat.getEventTarget(ev);
			// we fill the option object
			var opt = {
				data:null, // set below
				url:form.action,
				method:form.getAttribute("method"),
				async:true,
				filling:HUX.HUXattr.getFillingMethod(form) || HUX.Form.defaultFilling,
				target:HUX.HUXattr.getTarget(form),
				srcElement:form
			};
			// we fill arrData : 
			HUX.Selector.byAttribute("*", "name", form, function(el){
				HUX.Form.serialize(el, arrData);
			});
			// we join the data array to have this form : "name1=value1&name2=value2&...."
			opt.data = arrData.join("&"); // 
			// we call the XHR method
			HUX.xhr(opt);
			HUX.Compat.preventDefault(ev);
		}
		catch(ex){
			HUX.logError(ex);
		}
	}
}; 
HUX.addModule(HUX.Form);



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
			HUX.foreach(ev.children, function(child){
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
		delayEnd:30, // needed for transitions 
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
			var evName;
			for(evName in this.classNames){
				HUX.HUXEvents.bindGlobal(evName, hscm.eventHandler);
			}
		},
		/**
		 * Function: eventHandler
		 * handles any event given in classNames.
		 * calls setHuxClassName to modify the class name of the target
		 * 
		 * Parameters : 
		 * 	- *ev* : {HUX Event Object}
		 */
		eventHandler: function(ev){
			var timeout = 0;
			var target = ev.target || document.body;
			if(ev.type === "afterInject")
				timeout = hscm.delayEnd;
			// NOTE : IE does not implement extra arguments for setTimeout, so we use an anonymous function 
			// to send ev.target and ev.type
			function run(){
				hscm.setHuxClassName(target, ev.type);
			}
			if(timeout > 0)
				setTimeout(run, timeout);
			else
				run();
		},
		/**
		 * Function: setHuxClassName
		 * modifies the class name of a target. Removes any class names previously added by this function.
		 * 
		 * Parameters :
		 * 	- *el* : {Element} the target element
		 * 	- *key* : {String} the event name. 
		 */
		setHuxClassName: function(el, key){
			el.className = hscm.classNames[key] + " " + el.className.replace(/hux_[^ ]+[ ]*/g, ""); // we push the new className and erase any old HUX class Name 
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
			HUX.foreach(childNodes, function(el){
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
			HUX.foreach(nodelist, function(e){
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
		HUX.foreach(targets, function( target ){
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
			HUX.foreach(foundElts, function(target){
				self.mergeAttributes( target, el );
			});
			el = toPosition = toAdd = null;
		}
	},
	
	
	importNode: HUX.importNode // just an alias
};




HUX.addModule( HUX.Overlay );
