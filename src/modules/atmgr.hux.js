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
HUX.AtMgr = {
	// history level
	level:0,
	// OLD_CONTENT corresponds to content that have been deleted. onPopState loads this type of content if the user goes back
	OLD_CONTENT:1,
	// NEW_CONTENT corresponds to content that have been added. onPopState loads this type of content if the user goes forward
	NEW_CONTENT:2,
	pairs: null,
	enabled: !!history.pushState,
	/**
	 * Callbacks per action (add, delete or replace a pair in @...).
	 */
	pairsCallbacks: {
		onAdd: function(added){
			var sTarget = added.target, target = document.getElementById(sTarget), self = HUX.AtMgr;
			if(target !== null){
				self.__default_contents[sTarget] = target.innerHTML;
				return self.load(target, added.url);
			}
			else{
				return false;
			}
		},
		onReplace: function(added){
			var target = document.getElementById(added.target), self = HUX.AtMgr;
			if(target !== null){
				return self.load(target, added.url);
			}
			else{
				return false;
			}
		},
		onDelete: function(deleted){
			var sTarget = deleted.target, replacement = HUX.AtMgr.__default_contents[sTarget];
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
		this.pairs = this.createPairMgr(this.pairsCallbacks);
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
	setEnabled: function(value){
		this.enabled = value;
	},
	createPairMgr: function(callbacks){
		return HUX.PairManager.split((location.pathname.match(/[^@]@(.*)/) || ["",""])[1], /([^=,]+)=([^=,]+)/g, callbacks);
	},
	listen: function(context){
		var self = HUX.AtMgr;
		// this module works only with modern browsers which implements history.pushState
		// so we suppose that they implement evaluate as well...
		HUX.Selector.evaluate( "./descendant-or-self::a[starts-with(@href, '@')]", context, function(el){ 
			HUX.Compat.addEventListener(el, "click", function(){self.onClick.apply(self,arguments)}); 
		});
	},
	getState: function(){
		return history.state !== undefined ? history.state : HUX.AtMgr.state;
	},
	updateState: function(state){
		if(!history.state)
			HUX.AtMgr.state = state;
	},
	load: function(target, url){
		var opt = {
                        data:null,
                        url:url,
                        method:'get',
                        async:this.asyncReq,
                        filling:"replace", 
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
		HUX.Compat.preventDefault(event);
		var at = HUX.Compat.getEventTarget(event).href;
		this.changeAt(at);
	},
	changeAt: function(at, addNewState){
		at = at.replace(/.*@!?/g, "");
		var sPairs = at.split(/,!?/), 
		    newHUXStates = []; // empty for now ...
		this.pairs.change(sPairs);
		if(addNewState !== false){ // default is true
			var filename = (location.pathname.match(/.*\/([^@]*)/) || [null,""])[1];
			this.pushState(newHUXStates, "", filename +  this.pairs.toString());
		}
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
		try{
			var state = event.state, self = HUX.AtMgr;
			if(!state || state.level === undefined || !self.enabled)
				return;
			self.updateState( state );
			var old_level = self.level;
			self.level = state.level;
			self.changeAt(location.pathname, false);
		}
		catch(ex){
			HUX.logError(ex);
		}
	}
};
HUX.Compat.addEventListener( window, "popstate", HUX.AtMgr.onPopState );
HUX.addModule( HUX.AtMgr );

(function(){
	var proxy;
	// we update HUx.AtMgr.state each time pushState or replaceState is called
	// for browsers which do not have history.state
	if(history.pushState && history.state === undefined){
		proxy = function(origFn, state){
			origFn.execute(history);
			HUX.AtMgr.updateState( state );
		};
		history.pushState = HUX.wrapFn(history.pushState, proxy );
		history.replaceState = HUX.wrapFn(history.replaceState,  proxy );
	}
	
})();
