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
	OLD_CONTENT:1,
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
		
		HUX.addLiveListener( this );
		
		this.pairs.toString = function(){
			return "@"+this.map(function(a){ return a.target+"="+a.url; }).join();
		};
		if( this.pairs.toString() !== ( location.pathname.match(/@.*/)||["@"] )[0] ){
			this.pushState({}, "", location.pathname.replace(/@.*/g, "") + this.pairs.toString());
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
		/*var split = this.split(target, url, curState);
		split.push({target:target, url:url});*/

		//var newState = curState.replace( /(@.*|$)/, "@"+split.map(function(a){return a.target+"="+a.url}).join() );
		//var replaced = this.pairs.addPair(target, url);
		//if(!replaced){
		
		//}
		var newState = curState.replace( /(@.*|$)/, this.pairs.toString());
		return newState;
	},
	initHUXState: function(){
		var state = this.getState() || {};
		state.HUXStates = [];
		state.level = this.level;
		history.replaceState(state, "", "");
	},
	onClick: function(event){
		var pair = HUX.Compat.getEventTarget(event).href.replace(/.*@!?/g, "").split("=");
		var sTarget = pair[0], target = document.getElementById(sTarget);
		var url = pair[1];
		HUX.Compat.preventDefault(event);
		this.addObjectToState({target:target.id, content:target.innerHTML, url:"", type:this.OLD_CONTENT});
		this.pairs.addPair(sTarget, url, this.pairsCallbacks);
		var newState = this.getNewState(sTarget, url);
		this.pushState({target: sTarget, content:target.innerHTML ,url:url, type:this.NEW_CONTENT}, "", newState);
		
	},
	pushState: function(obj, title, newState){
		var state = {HUXStates: [obj]};
		state.level = ++this.level;
		history.pushState(state, title, newState);
	},
	addObjectToState: function(obj, title){
		var state = this.getState();
		if(!state)
			throw new Error("state is null");
		state.HUXStates = (state.HUXStates || []).filter(function(el){return el.target !== obj.target;}).concat([obj]);
		history.replaceState(state, title, "");
	},
	onPopState: function(event){
	//	console.log(arguments);
		try{
			var state = event.state;
			if(!state || state.level === undefined)
				return;
			var self = HUX.UrlMgr;
			self.updateState( state );
			var old_level = self.level;
			self.level = state.level;
			var type2load = old_level > self.level ? self.OLD_CONTENT : self.NEW_CONTENT;
			HUX.foreach(state.HUXStates, function (info){
				if(info.type === type2load){
					var target = document.getElementById(info.target);
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
		history.pushState = history.pushState.hux_wrap( proxy );
		history.replaceState = history.replaceState.hux_wrap( proxy );
	}
})();
