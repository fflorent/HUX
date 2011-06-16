/**
    HTTP by Using XML (HUX) : Hash Manager
    Copyright (C) 2011  Florent FAYOLLE

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
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
		HUX.core.recursiveListen(HUX.HashMgr);
		// we treat location.hash
		HUX.HashMgr.handler(null, true);
	},
	listen: function(context){
		var fnFilter, fnEach = HUX.HashMgr.__callback_anchor, prefixedTN;
		if(document.evaluate !== undefined){
			prefixedTN = HUX.core.Selector.prefixTagName("a");
			HUX.core.Selector.evaluate("//"+prefixedTN+"[starts-with(@href, '#!')]", context, fnEach);
		}
		else{
			fnFilter = function(){  return this.getAttribute("href").indexOf("#!") === 0;  };
			HUX.core.Selector.filterIE("a", fnFilter, context, fnEach);
		}
		
	},
	mgrListener: function(sAction){
		switch(sAction){
			case 'add':
			case 'remove':
				if(HUX.HashMgr.hashchangeEnabled){
					var sFn = sAction+'EventListener'; // sFn = addEventListener or removeEventListener
					HUX.core[sFn](window, "hashchange", HUX.HashMgr.handleIfChangement);
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
		var hash = location.hash;
		if(hash !== HUX.HashMgr.__prev_hash && !HUX.HashMgr.inTreatment){
			try{
				HUX.HashMgr.inTreatment = true;
				HUX.HashMgr.handler(ev);
			}
			finally{
				HUX.HashMgr.__prev_hash = hash;
				HUX.HashMgr.inTreatment = false;
			}
		}
	},
	// watcher for browsers which don't implement [on]hashchange event
	__watch: function(){
		try{
			HUX.HashMgr.handleIfChangement();
		}
		catch(ex){
			HUX.core.logError(ex);
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
		HUX.core.xhr(opt);
	},
	__last_timeStamp:0,
	__callback_anchor: function(el){
		HUX.core.addEventListener(el, "click", HUX.HashMgr.__handle_click);
	},
	__handle_click:function(ev){
		var srcNode = HUX.core.getEventTarget(ev);
		location.hash += srcNode.getAttribute("href").replace(/^#/,",");
		HUX.core.preventDefault(ev);
	},
	updateHashSilently: function(hash, keepPrevHash){
		if( hash.replace(/^#/, "") !== location.hash.replace(/^#/, "") ){
			// temporary, we disable the event Listener 
			/*HUX.HashMgr.mgrListener('remove');*/
			
			// we "cancel" the previous location.hash which may be incorrect
			if(!keepPrevHash) // keepPrevHash === true when called by init()
				history.back();
			
			location.hash = hash;
			/*setTimeout(function(){
				HUX.HashMgr.mgrListener('add');
			}, 0);*/
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

HUX.core.addModule(HUX.HashMgr);



