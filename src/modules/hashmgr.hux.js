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


