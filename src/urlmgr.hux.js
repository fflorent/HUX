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
	preventDefaultIfDisabled: false,
	asyncReq: false,
	state:  null,
	init: function(){
		if(history.replaceState === undefined)
			return;
		if(!this.getState() || ! (this.getState().HUXStates instanceof Array) ){
			this.initHUXState();
		}
		HUX.addLiveListener( this );
		this.pairs = new HUX.PairManager();
		this.pairs.toString = function(){
			return "@"+this.map(function(a){ return a.target+"="+a.url; }).join();
		};
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
                HUX.xhr(opt);
	},
	split: function(target, url, str, pReplace){
                
		/*var split = [], sTarget, url;
                var pattern = new RegExp("[#,]!([^=,]+)=([^=,]+)", "g");
                while( ( resExec = (pattern.exec(str)) ) !== null){
         	        sTarget = resExec[1];
			if(sTarget !== target){
                       		url = resExec[2];
				split.addPair(target, url);
			}
			else if(pReplace !== undefined){
				pReplace.value = true;
			}
	        }
		split.push({target: target, url: url});
                return split;*/
	},
	getNewState: function(target, url){
		var reExtract = new RegExp(location.pathname+".*");
		var curState = location.href.match(reExtract)[0].replace();
		/*var split = this.split(target, url, curState);
		split.push({target:target, url:url});*/

		//var newState = curState.replace( /(@.*|$)/, "@"+split.map(function(a){return a.target+"="+a.url}).join() );
		var replaced = this.pairs.addPair(target, url);
		//if(!replaced){
		this.addObjectToState({target:target, content:document.getElementById(target).innerHTML, url:"", type:this.OLD_CONTENT});
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
		var pair = event.target.href.replace(/[^@]*@!?/, "").split("=");
		var sTarget = pair[0], target = document.getElementById(sTarget);
		var url = pair[1], self = this;
		this.pairs.addPair(sTarget, url, {
			onAdd: function(added){
				var sTarget = added.target, target = document.getElementById(sTarget);
				if(target !== null){
					self.load(target, added.url);
					return true;
				}
				else{
					return false;
				}
			},
			onReplace: function(added){
				var target = document.getElementById(added.target);
				if(target !== null){
					self.load(target, added.url);
					return true;
				}
				else
					return false;
				},
			onDelete: function(deleted){
				var sTarget = deleted.target, replacement = document.createElement("div");
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
			
		});
		/*var currentTargetContent = target.innerHTML;*/
		var newState = this.getNewState(sTarget, url);
		/*this.load(target, url);*/
		this.pushState({target: sTarget, content:target.innerHTML ,url:url, type:this.NEW_CONTENT}, "", newState);
		HUX.Compat.preventDefault(event);
	},
	pushState: function(obj, title, newState){
		var state = {HUXStates: [obj]};
		state.level = ++this.level;
		history.pushState(state, title, newState);
	},
	addObjectToState: function(obj, title){
		var state = this.getState() || {};
		state.HUXStates = state.HUXStates.filter(function(el){return el.target !== obj.target;}).concat([obj]);
		history.replaceState(state, title, "");
	},
	onPopState: function(event){
	//	console.log(arguments);
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
				HUX.inject(target, null, info.content);
			}
		}, this);
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
