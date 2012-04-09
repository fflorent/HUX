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
		
		/**
		 * Callbacks per action (add, delete or replace a pair in @...).
		 */
		pairsCallbacks: {
			onAdd: function(added){
				var sTarget = added.target, target = document.getElementById(sTarget);
				if(target !== null){
					inner.default_contents[sTarget] = target.innerHTML;
					return inner.load(target, added.url);
				}
				else{
					return false;
				}
			},
			onReplace: function(added){
				var target = document.getElementById(added.target);
				if(target !== null){
					return inner.load(target, added.url);
				}
				else{
					return false;
				}
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
		asyncReq: false,
		state:  null,
		default_contents : {},
		
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
			return HUX.PairManager.split((location.toString().match(/[^@]@(.*)/) || ["",""])[1], /([^=,]+)=([^=,]+)/g, callbacks);
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
		 * Function: updateState
		 * sets the history state if history.state does not exist
		 */
		updateState: function(state){
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
				target:target
			};
			
			var xhr = HUX.xhr(opt);
			return xhr.status === 200;
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
		 * 
		 */
		pushState: function(obj, title, newState){
			var state = {
				HUX_AT:{
					info: obj,
					level: ++inner.level
				}
			};
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
				inner.updateState( state );
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
			    newInfo = []; // empty for now ...
			inner.pairs.change(sPairs);
			if(addNewState !== false){ // default is true
				var filename = (location.toString().match(/.*\/([^@]*)/) || [null,""])[1];
				inner.pushState(newInfo, "", filename +  inner.pairs.toString());
			}
		},
		init: function(){
			if(! inner.enabled )
				return;
			inner.pairs = inner.createPairMgr(inner.pairsCallbacks);
			if(!pub.getState() || ! ( (pub.getState().HUX_AT || null) instanceof Object) ){
				inner.initHUXState();
			}
			//this.addObjectToState({});
			HUX.addLiveListener( this );
			
			inner.pairs.toString = function(){
				return "@"+this.map(function(a){ return a.target+"="+a.url; }).join();
			};
			if( inner.pairs.toString() !== ( location.toString().match(/@.*/)||["@"] )[0] ){
				inner.pushState([], "", location.toString().replace(/@.*/g, "") + inner.pairs.toString());
			}
		},
		listen: function(context){
			// this module works only with modern browsers which implements history.pushState
			// so we suppose that they implement evaluate as well...
			inner.findAnchors(context, function(el){ 
				HUX.Compat.addEventListener(el, "click", inner.onClick); 
			});
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
			HUX.AtMgr.inner.updateState( state );
		};
		history.pushState = HUX.wrapFn(history.pushState, proxy );
		history.replaceState = HUX.wrapFn(history.replaceState,  proxy );
	}
	
})();
