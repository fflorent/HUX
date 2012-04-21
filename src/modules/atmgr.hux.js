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
