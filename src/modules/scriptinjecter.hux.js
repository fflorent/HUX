/**
    HTTP Using XML (HUX) : Script Injecter
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

// scriptinjecter.hux.js

// NOTE : still experimental

/**
 * Namespace: HUX.ScriptInjecter
 * inject scripts and run them when they are loaded
 */

HUX.ScriptInjecter = {
	head:document.getElementsByTagName("head")[0],
	// enabled by default. See <init>
	enabled: true,
	asyn: false,
	/**
	 * Function : init
	 * inits the module
	 */
	init: function(){
		// we detect if scripts are natively executed
		// if they are, we disable the module
		var script = HUX.Inject.htmltodom("<script>HUX.ScriptInjecter.enabled = false;</script>", document.body).childNodes[0];
		if(script){
			HUX.ScriptInjecter.head.appendChild( script );
			HUX.ScriptInjecter.head.removeChild( script );
		}
		// if enabled, we listen to "afterInject" event : 
		if( this.enabled )
			HUX.HUXEvents.bindGlobal("afterInject", this.searchScripts);
	},
	/**
	 * Function: searchScripts
	 * search for scripts to inject and run
	 * 
	 * Parameters:
	 * 	- *ev* : {HUX Event Object}
	 */
	searchScripts: function(ev){
		try{
			var scripts = [];
			// we get the scripts that have been inserted
			HUX.Compat.Array.forEach(ev.children, function(child){
				if(child.tagName === "SCRIPT")
					scripts.push(child);
				else if(child.nodeType === 1)
					scripts.push.apply(scripts, child.getElementsByTagName("script"));
			});
			HUX.ScriptInjecter.exec.call(HUX.ScriptInjecter, scripts);
		}
		catch(ex){
			HUX.logError(ex);
		}
	},
	/**
	 * Function: exec
	 * execute scripts
	 * 
	 * Parameters:
	 * 	- *aScripts* : {Array of Element} the array of all the remaining script elements to execute
	 */
	exec: function(aScripts){
		if(aScripts.length === 0)
			return;
		var script = aScripts.pop();
		if(script.src){
			this.loadScript(script, aScripts);
		}
		else{
			this.evalScript(script, aScripts);
		}
	},
	/**
	 * Function: evalScript
	 * executes a script, having no src attribute
	 * 
	 * Parameters:
	 * 	- *curScript* : {Element} the script to execute
	 * 	- *aScripts* : {Array of Element} array of all the remaining script elements to execute
	 */
	evalScript: function(curScript, aScripts){
		var script = document.createElement("script"), head = this.head;
		// we take the content of the script 
		if(curScript.textContent)
			script.textContent = curScript.textContent;
		else if(curScript.innerHTML && typeof script.text !== "undefined")
			script.text = curScript.innerHTML;
		// we insert it in a different thread
		setTimeout(function(){
			head.insertBefore( script, head.firstChild );
			head.removeChild( script ); 
		}, 0);
		
		this.exec( aScripts );
	},
	/**
	 * Function: loadScript
	 * 
	 * loads a script, having an src attribute
	 * 
	 * Parameters:
	 * 	- *curScript* : {Element} the script to execute
 	 * 	- *aScripts* : {Array of Element} array of all the remaining script elements to execute
	 */
	loadScript: function(curScript, aScripts){
		var script = document.createElement("script"), self= this, done = false, head = this.head;
		script.src = curScript.src;
		script.type = curScript.type;
		this.head.insertBefore(script, this.head.firstChild);
		// inspired from jQuery
		// Attach handlers for all browsers
		script.onload = script.onreadystatechange = function() {
			if ( !done && (!script.readyState ||
					script.readyState === "loaded" || script.readyState === "complete") ) {
				done = true;
			
				// Handle memory leak in IE
				script.onload = script.onreadystatechange = null;
				head.removeChild( script );
				if( !self.asyn )
					self.exec( aScripts );
			}
		};
		if(this.asyn)
			this.exec( aScripts );
	}
};

HUX.addModule( HUX.ScriptInjecter );