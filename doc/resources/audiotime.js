// fastly implemented module for HUX (not official)
// save the currentTime of an audio in the URL
HUX.AudioTime = {
	enabled:window.Audio !== undefined,
	init: function(){
		if(this.enabled === false)
			return;
		// we add the live listener
		HUX.addLiveListener(this);
		
		
		HUX.Compat.addEventListener(window, "popstate", HUX.AudioTime.onPopState);
		if(HUX.Transition !== undefined){
			HUX.HUXEvents.bindGlobal("transiting", function(ev){
				HUX.Compat.forEach(ev.target.querySelectorAll("audio"), function(audio){
					audio.setAttribute("autoplay", false);
					audio.pause();
				});
			});
		}
		
	},
	listen: function(context){
		// for each audio elements, we add the "pause" event listener, so the URL is updated each time it is paused
		HUX.Compat.forEach(context.querySelectorAll("audio"), function(audio){
			// audio elements must have an id
			if(!audio.id){
				if(typeof console !== "undefined")
					console.warn("id is not set for an audio Element");
				return;
			}
			HUX.Compat.addEventListener(audio, "pause", function(){
				HUX.AudioTime.updateState(audio.id, audio.currentTime);
			});
		});
		
		this.adjustTime(context);
	},
	updateState: function(id, currTime){
		var ext = (id && document.getElementById(id)) ?  ",~"+id+"="+currTime   : "";
		var stateUpdater, newState = (location.pathname + location.hash).replace(/,?~([^,#]*)/g, "") + ext;
		// we keep the same state
		history.replaceState(HUX.UrlMgr.getState(), "", newState);
	},
	adjustTime: function(context){
		context = context || document;
		// if the new URL ends with a tilde 
		// if a currentTime is set in the URL :
		var match = (location.pathname + location.hash).match( /~([^=]*)=([0-9\.]*)/ ), audio, currTime;
		if(match !== null){
			// we set the currentTime 
			// NOTE : context.getElementById is undefined, we use querySelector instead ...
			audio =  context.querySelector( "#"+match[1] );
			if(audio !== null){
				currTime = match[2];
				audio.addEventListener("loadeddata", function(){
					audio.currentTime = currTime;
				}, false);
			}
		}
		else{
			HUX.AudioTime.updateState(); // reset the state
		}
	},
	onPopState : function(event){
		HUX.AudioTime.adjustTime(document);
		
	}
};

// we say to UrlMgr that a key beginning with a ~ is not a target, and ask not to remove it
(function (umpc, hmpc){
	var proxy = function(fnOrig, pair){
		if(pair.target.indexOf("~") === 0)
			return !! document.querySelector("#demo #"+pair.target.substring(1));
		else
			return fnOrig.apply(this,fnOrig.args);
	};
	umpc.onAdd = HUX.wrapFn(umpc.onAdd,  proxy );
	umpc.onReplace = HUX.wrapFn(umpc.onReplace,  proxy );
	hmpc.onAdd = HUX.wrapFn(hmpc.onAdd,  proxy );
})( HUX.UrlMgr.pairsCallbacks, HUX.HashMgr.pairsCallbacks ); 

HUX.addModule(HUX.AudioTime);
