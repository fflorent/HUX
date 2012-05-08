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
				inner.prev_hash = new_hash; // necessary in order to prevent another execution of changeHash via handleIfChangement
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
				var hashTarget = HUX.Selector.byAttribute("a", "name='"+inner.normal_hash+"'")[0];
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
					doc.write("<html><head><scri" + "pt type=\"text/javascript\">top.HUX.HashBang.inner.IFrameHack.setHash('"+location.hash+"');</scri" + "pt></head><body></body></html>");
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


