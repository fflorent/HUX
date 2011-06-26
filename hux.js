
 /**
    HTTP by Using XML (HUX) : Core
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


var HUX = {};
/**
 * Common tools
 */
HUX.Core = {
	init: function(){
		this.Selector.init();
	},
	namespace: "http://www.example.org/HUX",
	/**
	 * HUX specific event Manager 
	 * Events :
	 *  - beforeInject : triggered before injecting content to the target node. 2 arguments : event.target = the target node, event.children = the nodes to add
	 *  - afterInject : triggered after injecting content to the target node. 2 arguments : event.target = the target node, event.children = the added nodes
	 *  - beforeEmpty : triggered before emptying target node. 1 argument : event.target=the node to empty
	 *  - requestError : triggered if an XMLHttpRequest failed. 1 argument : event.xhr = the XHR object
	 */
	HUXevents:{
		// array of listener for each event
		__arrEv:{
			"beforeInject":{},
			"beforeEmpty":{},
			"requestError":{},
			"afterInject":{}
		},
		__addListener: function(key, evName, fn){
			var arrEv = this.__arrEv;
			if(arrEv[evName]){
				if(! (key in arrEv[evName]) )
					arrEv[evName][key] = [];
				arrEv[evName][key].push(fn);
			}
			else
				throw "the event "+evName+" does not exist for HUX";
		},
		__removeListener: function(key, evName, fn){
			HUX.Core.removeElement(this.__arrEv[evName][key], fn);
		},
		/**
		 * bind event for all nodes
		 */
		bindGlobal: function(evName, fn){
			return this.__addListener("global", evName, fn);
		},
		unbindGlobal: function(evName, fn){
			return this.__removeListener("global", evName, fn);
		},
		__checktid: function(callerName, target){
			if(!target.id)
				throw callerName+": first argument must be an HTMLElement with an id";
			
		},
		/**
		 * sort of addEventListener
		 * HUXevents.bind(target , evName, fn)
		 * 	- target : the target of the event. Can be a 
		 * 	- evName : the name of the event
		 * 	- fn : the listener
		 */
		bind:function(target, evName, fn){
			this.__checktid("HUXevents.bind", target);
			return this.__addListener(target.id, evName, fn);
		},
		// sort of removeEventListener
		unbind: function(target, evName, fn){
			this.__checktid("HUXevents.unbind", target);
			return this.__removeListener(target.id, evName, fn);
		},
		/**
		 * trigger all event Listener for a specific event 
		 * trigger(evName, event)
		 * 	@evName : the name of the Event (String)
		 * 	@event : object with information about the event 
		 * NOTE : if the event has a target, put it as event.target
		 */
		trigger: function(evName, event){
			var lsters = [], tid = (event.target?event.target.id : null), arrEv = this.__arrEv;
			if(tid)
				lsters = lsters.concat(arrEv[evName][tid] || []);
			lsters = lsters.concat(arrEv[evName]["global"] || []);
			
			HUX.Core.foreach(lsters, function(fn){
				var ret = fn.call(window, event);
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
			var sMethods = this.sMethods, firstChild, done = false, inserted, aInserted = [];
			switch(method){
				case sMethods.PREPEND:
					if(target.childNodes.length > 0){ // we use InsertBefore
						HUX.Core.HUXevents.trigger("beforeInject", {target: target, children: DOMContent});
						firstChild = target.firstChild;
						HUX.Core.foreach(DOMContent, function(el){
							target.insertBefore(el, firstChild);
						});
					}
					else{ // if target has no children, we append 
						return this.init(target, sMethods.APPEND, DOMContent);
					}
					done = true;
					break;
					
				case sMethods.APPEND: 
					HUX.Core.HUXevents.trigger("beforeInject", {target: target, children: DOMContent});
					while(DOMContent.length > 0)
						aInserted.push( target.appendChild(DOMContent[0]) );
					done = true;
					break;
					
				case sMethods.REPLACE:
					// In order to replace the content of the target, we empty it, and we append DOMContent in it
					this.empty(target);
					return this.init(target, sMethods.APPEND, DOMContent);
			}
			if(done)
				HUX.Core.HUXevents.trigger("afterInject", {target: target, children: aInserted});
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
			HUX.Core.HUXevents.trigger("beforeEmpty", {target: parent});
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
			DOMContent = this.Inject.htmltodom(content, target);
		else if(content instanceof Array)
			DOMContent = content;
		else
			throw new TypeError("content : invalid argument");
		if(! method) // if method === null, default is REPLACEMENT
			method = this.Inject.sMethods.REPLACE;
		this.Inject.init.call(this.Inject, target, method, DOMContent); 
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
			var xpath, prefixedTN, attrs = HUX.Core.HUXattr.getAttrAllPrefixes(attr), sAttrXP, ieRet = [];
			prefixedTN = this.prefixTagName(tagName);
			if(typeof document.evaluate !== "undefined"){
				sAttrXP = attrs.join(" or @"); // sAttrXP = "data-attr OR @data-hux-attr OR @hux:attr"
				xpath = "//"+prefixedTN+"[@"+sAttrXP+"]";
				return this.evaluate(xpath, context, fnEach);
			}
			else{
				var self= this;
				HUX.Core.foreach(attrs, function(attr){
					ieRet = ieRet.concat( self.__byAttributeIE.call(self, tagName, attr, context, fnEach) );
				});
				return ieRet;
			}
		},
		/**
		 * function used by document.evaluate for Namespaces
		 */
		__nsResolver:function(prefix){
			var ns = {
				"hux":HUX.Core.namespace,
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
		 * 	context : the node where we will search for results (must have an id or be a documentElement; default : document)
		 * 	fnEach : the function executed for each results
		 * 
		 * See Also prefixTagName for convenience with elements tagnames
		 */
		evaluate:function(sXpath, context, fnEach){
			context = context || document.documentElement;
			fnEach = fnEach || function(){};
			if(context.id)
				sXpath = ("//*[@id='"+context.id+"']"+sXpath) ;
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
			HUX.Core.foreach(elts, function(el){
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
		// see HUX.Core.xhr(opt)
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
				HUX.Core.logError(ex); // 
			}
		},
		// taken from jQuery, returns an XMLHttpRequest object
		getXhrObject: function(){
			return window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
		},
		onSuccess: function(rspText, xhr, filling, target){
			HUX.Core.inject(target, filling, rspText);
		},
		onError: function(xhr){
			HUX.Core.HUXevents.trigger("requestError", {xhr:xhr});
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
						HUX.Core.logError(ex);
					}
				};
			}
			catch(ex){
				HUX.Core.logError(ex);
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
		return this.XHR.init.apply(this.XHR, arguments);
	},
	/**
	 * Attribute Manager for HUX
	 */
	HUXattr: {
		__getAttributeNS: function(srcNode, name){
			return srcNode.getAttributeNS ? srcNode.getAttributeNS(HUX.Core.namespace, name) : srcNode.getAttribute("hux:"+name);
		},
		getAttributeHUX: function(srcNode, name){
			var ret = null,  attrs = this.getAttrAllPrefixes(name), i;
			for(i = 0; i < attrs.length && ret === null; i++){
				ret = srcNode.getAttribute( attrs[i] );
			}
			if(ret === null) // this might be because of non-support of Opera for getAttribute("hux:...")
				ret = this.__getAttributeNS(srcNode, name);
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
	/**
	 * functions for cross-browsers compatibilities
	 */
	Compat: {
		// do we use addEventListener or attachEvent ?
		__fn_addEventListener : (window.addEventListener? 'addEventListener':'attachEvent'),
		__fn_removeEventListener : (window.removeEventListener ? 'removeEventListener':'detachEvent'),
		// does the event name have to be prefixed with 'on' ? (yes with attachEvent, no with addEventListener)
		__prefix_eventListener: (window.addEventListener? '':'on'),
		/**
		* HUX.Core.compat.addEventListener(target, evName, fn);
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
		}
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
		HUX.Core.HUXevents.bindGlobal("beforeInject", function(event){
			HUX.Core.foreach(event.children, function(child){
				jsNamespace.listen(child); 
			});
		});
	},
	// just call init when the page is loaded... 
	addModule: function(mod){
		this.Compat.addEventListener(window, "load", function(){
			mod.init();
		});
	},
	foreach: function(array, fn){
		for(var i = 0; i < array.length; i++)
			fn(array[i]); // using call because of IE which lose "this" reference
	}
};

HUX.Core.addModule( HUX.Core );



/**
    HTTP by Using XML (HUX) : Simple Loader
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


HUX.SimpleLoader = {
	
	/**
	 * handler for Click Event
	 */
	__onclick: function(ev){
		var srcNode = HUX.Core.Compat.getEventTarget(ev) ;
		var opt = {
			data:null,
			url:srcNode.href,
			method:'get',
			async:true,
			filling:HUX.Core.HUXattr.getFillingMethod(srcNode),
			target:HUX.Core.HUXattr.getTargetNode(srcNode),
			srcNode:srcNode
		};
		HUX.Core.xhr(opt);
		HUX.Core.Compat.preventDefault(ev);
	},
	__fnEach: function(el){
		HUX.Core.Compat.addEventListener(el, "click", HUX.SimpleLoader.__onclick );
	},
	listen:function(context){
		// for all anchor nodes having targetnode attributes, we listen to "click" events
		HUX.Core.Selector.byAttributeHUX("a", "targetnode", context, this.__fnEach);
	},
	init: function(){
		HUX.Core.recursiveListen(this);
	}
};

HUX.Core.addModule(HUX.SimpleLoader); 
/**
    HTTP by Using XML (HUX) : Hash Manager
    Copyright (C) 2011  Florent FAYOLLE
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.
//     
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
**/

//hashmgr.hux.js
HUX.HashMgr = {
	// do we use asynchronous requests
	asyncReq: false,
	// does the browser support [on]hashchange event ?
	hashchangeEnabled: null,
	inTreatment: false, // sort of mutex
	init:function(){
		this.hashchangeEnabled = ( "onhashchange" in window) && (! document.documentMode || document.documentMode >= 8);
		if( this.hashchangeEnabled )
			this.mgrListener('add');
		else
			this.__watch();
		if(this.IFrameHack.enabled)
			this.IFrameHack.createIFrame();
		// we listen to any anchor beginning with "#!" (corresponding to CCS3 Selector : a[href^="#!"])
		HUX.Core.recursiveListen(HUX.HashMgr);
		// we treat location.hash
		HUX.HashMgr.handler(null, true);
		HUX.Core.HUXevents.__arrEv["afterHashChanged"] = [];
	},
	listen: function(context){
		var fnFilter, fnEach = HUX.HashMgr.__callback_anchor, prefixedTN;
		if(document.evaluate !== undefined){
			prefixedTN = HUX.Core.Selector.prefixTagName("a");
			HUX.Core.Selector.evaluate("//"+prefixedTN+"[starts-with(@href, '#!')]", context, fnEach);
		}
		else{
			fnFilter = function(){  return this.getAttribute("href").indexOf("#!") === 0;  };
			HUX.Core.Selector.filterIE("a", fnFilter, context, fnEach);
		}
		
	},
	mgrListener: function(sAction){
		switch(sAction){
			case 'add':
			case 'remove':
				if(HUX.HashMgr.hashchangeEnabled){
					var sFn = sAction+'EventListener'; // sFn = addEventListener or removeEventListener
					HUX.Core.Compat[sFn](window, "hashchange", HUX.HashMgr.handleIfChangement);
				}
				break;
			default:
				throw new TypeError("mgrListener : no action available for : "+sAction);
		}
	},
	__prev_hash:location.hash,
	__watcher_cpt_ex:0,
	watcher_cpt_limit:10,
	timer:100,
	// handle each time the hash has changed
	handleIfChangement: function(ev){
		//info.push("enter");
		var hash = location.hash;
		if(hash !== HUX.HashMgr.__prev_hash && !HUX.HashMgr.inTreatment){
			//info.push("diff");
			try{
				HUX.HashMgr.inTreatment = true;
				HUX.HashMgr.handler(ev);
			}
			finally{
				HUX.HashMgr.__prev_hash = location.hash;
				HUX.HashMgr.inTreatment = false;
				HUX.Core.HUXevents.trigger("afterHashChanged", {"new_hash":HUX.HashMgr.__prev_hash});
			}
		}
	},
	// watcher for browsers which don't implement [on]hashchange event
	__watch: function(){
		try{
			HUX.HashMgr.handleIfChangement();
		}
		catch(ex){
			HUX.Core.logError(ex);
			HUX.HashMgr.__watcher_cpt_ex++;
			throw ex;
		}
		finally{
			if(HUX.HashMgr.__watcher_cpt_ex < HUX.HashMgr.watcher_cpt_limit)
				window.setTimeout(HUX.HashMgr.__watch, HUX.HashMgr.timer);
		}
	},
	// Map id<=>url, extracted from location.hash
	__hashObj:{},
	// store the content by default (before having injected content with HUX)
	__default_content:{},
	__load: function(target, url){
		var opt = {
			data:null,
			url:url,
			method:'get',
			async:this.asyncReq,
			filling:null, // use default option (replace)
			target:target
		};
		HUX.Core.xhr(opt);
	},
	__last_timeStamp:0,
	__callback_anchor: function(el){
		HUX.Core.Compat.addEventListener(el, "click", HUX.HashMgr.__handle_click);
	},
	__handle_click:function(ev){
		var srcNode = HUX.Core.Compat.getEventTarget(ev);
		location.hash += srcNode.getAttribute("href").replace(/^#/,",");
		HUX.Core.Compat.preventDefault(ev);
	},
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
					//info.push("back()");
				}
				location.hash = hash;
			}
		}
		
	},
	// creates the Object for hash : {"[sTarget]":"[url]", ...}
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
	handler: function(ev, keepPrevHash){
		var hash = location.hash.toString();
		var resExec, sTarget, target, url, hash_found, sHash = "#";
		var new_hashObj = this.__hashStringToObject(hash);
		// we do all XHR asked through location.hash
		for(sTarget in new_hashObj){
			target = document.getElementById(sTarget);
			url = new_hashObj[sTarget];
			hash_found = this.__hashObj[sTarget];
			if(target!== null && url !== "__default"){ // if the URL given is __default, we load the default content in the target node
				// we fill a string which will be the new location.hash
				sHash += '!'+sTarget+'='+url+',';
				if(!hash_found || hash_found !== url){
					if(!hash_found){
						this.__default_content[sTarget] = target.cloneNode(true);
					}
					this.__load(target, url);
				}
				
				delete this.__hashObj[sTarget]; // later, we will inject the default content in the remaining nodes
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
				target.parentNode.insertBefore(replacement, target);
				target.parentNode.removeChild(target);
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
	 * hack for browsers from which we cannot use previous or next button (for history) to go to the previous hash
	 */
	IFrameHack: {
		/* this hack is only enabled for MSIE 1-7 */
		enabled: navigator.userAgent.search(/MSIE [1-7]\./) > 0 || ( "documentMode" in document && document.documentMode < 8 ), 
		iframe:null,
		id:"HUXIFrameHack",
		tmpDisableUpd: false, // we need to disable temporary the IFrame update 
		// creates an iframe if the lasts does not exists, and if the Iframe Hack is enabled
		__createIFrame: function(){
			this.iframe = document.createElement("iframe");
			this.iframe.id=this.id;
			this.iframe.src="about:blank";
			this.iframe.style.display = "none";
			document.body.appendChild(this.iframe);
		},
		createIFrame: function(){
			return HUX.HashMgr.IFrameHack.__createIFrame.apply(HUX.HashMgr.IFrameHack, arguments);
		},
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
		setHash: function(hash){
			if(hash !== location.hash){
				this.tmpDisableUpd = true;
				location.hash = hash;
			}
		}
	}
};

HUX.Core.addModule(HUX.HashMgr);


 /**
    HTTP by Using XML (HUX) : Form Manager
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

HUX.Form = {
	defaultFilling: HUX.Core.Inject.sMethods.APPEND,
	// if true, the form is reset after each submit
	clearAfterSubmit: true,
	init: function(){
		HUX.Core.recursiveListen(HUX.Form);
	},
	// called by HUX.Core.recursiveListen
	listen: function(context){
		HUX.Core.Selector.byAttributeHUX("form", "targetnode", context, this.__fnEach);
	},
	__fnEach: function(el){
		HUX.Core.Compat.addEventListener(el, "submit", HUX.Form.onSubmit );
	},

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
	onSubmit: function(ev){
		var arrData = [], form = HUX.Core.Compat.getEventTarget(ev);
		
		var opt = {
			data:null, // set below
			url:form.action,
			method:form.getAttribute("method"),
			async:true,
			filling:HUX.Core.HUXattr.getFillingMethod(form) || HUX.Form.defaultFilling,
			target:HUX.Core.HUXattr.getTargetNode(form),
			srcNode:form
		};
		// we fill arrData : 
		HUX.Core.Selector.byAttribute("*", "name", form, function(el){
			HUX.Form.serialize(el, arrData);
		});
		opt.data = arrData.join("&"); // 
		HUX.Core.xhr(opt);
		HUX.Core.Compat.preventDefault(ev);
	}
};
HUX.Core.addModule(HUX.Form);



/**
    HTTP by Using XML (HUX) : Script Injecter
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



HUX.ScriptInjecter = {
	head:document.getElementsByTagName("head")[0],
	asyn: false,
	init: function(){
		HUX.Core.HUXevents.bindGlobal("afterInject", this.searchScripts);
	},
	searchScripts: function(ev){
		var scripts = [];
		HUX.Core.foreach(ev.children, function(child){
			if(child.tagName === "SCRIPT")
				scripts.push(child);
			else if(child.nodeType === 1)
				scripts.push.apply(scripts, child.getElementsByTagName("script") );
		});
		HUX.ScriptInjecter.exec.call(HUX.ScriptInjecter, scripts);
	},
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
	evalScript: function(curScript, aScripts){
		var script = document.createElement("script");
		if(curScript.textContent)
			script.textContent = curScript.textContent;
		else if(curScript.innerHTML && typeof script.text !== "undefined")
			script.text = curScript.innerHTML;
		
		setTimeout(function(script, head){
			head.insertBefore( script, head.firstChild );
			head.removeChild( script );
		}, 0, script, this.head);
		
		this.exec( aScripts );
	},
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

HUX.Core.addModule( HUX.ScriptInjecter );