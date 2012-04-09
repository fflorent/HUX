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
	 * PrivateProperty: __pairs
	 * {HashMap<String, String>} Split object of the current Hash. Matches each id with the URL of the content loaded.
	 */
	__pairs:null,
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
		this.__pairs = new HUX.PairManager(this.pairsCallbacks);
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
		HUX.HashMgr.changeHash(null, true);
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
		// we look for anchors whose href begins with "#!" 
		// so anchors with hash operations ("#!+", "#!-") can be treated before location.hash is changed
		HUX.HashMgr.findAnchors(context, fnEach);
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
		var msieVers = HUX.Browser.getMSIEVersion();
		if(msieVers && msieVers <= 7){
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
		if(hash !== HUX.HashMgr.__prev_hash && !HUX.HashMgr.inTreatment){
			//info.push("diff");
			try{
				HUX.HashMgr.inTreatment = true;
				HUX.HashMgr.changeHash(hash);
			}
			catch(ex){
				HUX.logError(ex);
			}
			finally{
				HUX.HashMgr.__prev_hash = hash; // even if there is an exeception, we ensure that __prev_hash is changed
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
	 * directly treat the hash changement
	 * 
	 * Parameters:
	 * 	- *ev* : {DOM Event}
	 */
	onClick:function(ev){
		var srcElement = HUX.Compat.getEventTarget(ev), 
		    hash = ( srcElement.hash || srcElement.getAttribute("href") ),
		    hm = HUX.HashMgr;
		//location.hash += ( srcElement.hash || srcElement.getAttribute("href") ).replace(/^#/,",");
		hm.changeHash.call(hm, hash);
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
	updateHash: function(hash, keepPrevHash){
		if( hash.replace(/^#/, "") !== location.hash.replace(/^#/, "") ){
			HUX.HashMgr.__prev_hash = hash; // necessary in order to prevent another execution of changeHash via handleIfChangement
			location.hash = hash;
		}
		
	},
	/**
	 * Function: changeHash
	 * handles the hash modification
	 * 
	 * Parameters:
	 * 	- *sHash* : {String} the hash to treat. Can be null (default : location.hash)
	 * 	- *keepPrevHash*: {Boolean} set to true if used by init, false otherwise.
	 */
	changeHash: function(sHash, keepPrevHash){
		// what we name a pair here 
		// is a pair "TARGET ID" : "URL" that you can find in the hash
		var hash = (sHash || location.hash).toString().replace(/^#,?/, "").split(/,[^!]/),
		    sPairs = hash[0].split(/,/), // the pairs described in the hash 
		    normalHash = hash[1] || ""; // the hash that usually lead to an anchor (is at the end of the hash, must not begin with a '!')
		this.__pairs.change( sPairs );
		var sHash = "#"+this.__pairs.map(function(e){return "!"+e.target+"="+e.url;}).join(",") +  normalHash;
		this.updateHash(sHash, keepPrevHash);
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


