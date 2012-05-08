/**
    HTTP Using XML (HUX) : Content Manager
    Copyright (C) 2011-2012  Florent FAYOLLE
    
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

/**
 * Namespace: ContentManager
 * 
 * Content Synchronizer to inject content loaded with asynchronous requests
 * usefull to deal with nested targets
 */

HUX.ContentManager = function(onTargetsNotFound){
	// the waiting contents (only for content addition or replacement) : 
	var contents = {};
	// the keys in the order as displayed in the URL (only for content addition or replacement)
	var keys = [];
	// the default contents to restore when deleting contents
	var defaultContents = {};
	
	var countRemainingContents = function(){
		if(typeof Object.keys === "function")
			return Object.keys(contents).length;
		else{
			var prop,i=0;
			for(prop in contents){
				if(contents.hasOwnProperty(prop))
					i++;
			}
			return i;
		}
	};
	
	var injectNewContent = function(target, content){
		var sTarget = target.id;
		if(defaultContents[ sTarget ] === undefined)
			defaultContents[ sTarget ] = target.innerHTML;
		HUX.inject( target, "replace", content );
		delete contents[ sTarget ] ;
		// we remove the key
		keys.splice(HUX.Compat.Array.indexOf(keys, target.id), 1); 
	};
	
	/**
	 * Function: addContent
	 * stores a content for a target and inject it in the last when available
	 * 
	 * Parameters:
	 * 	- *sTarget*: {String} the id of the target element
	 * 	- *content*: {String} the content to inject
	 */
	this.addContent = function(sTarget, content){
		var iPairKey, target = document.getElementById(sTarget), _keys;
		
		// if the target is not ready yet : 
		if(target === null){
			contents[sTarget] = content;
		}
		else{
			iPairKey = HUX.Compat.Array.indexOf(keys, sTarget);
			injectNewContent(target, content);
			_keys = Array.apply([], keys); // make a copy of keys
			for(var i = iPairKey; i < _keys.length; i++){
				var curKey = _keys[i], curContent = contents[ curKey ],
					curTarget = document.getElementById(curKey);
				if( curContent !== undefined && curTarget !== null ){
					injectNewContent(curTarget, curContent);
				}
			}
		}
		// if this was the last key to be loaded, and there remains contents to inject : 
		if(keys.length > 0 && countRemainingContents() === keys.length)
			onTargetsNotFound(keys);
	};
	/**
	 * Function: setKeys
	 * sets the keys (or targets) of the contents being synchronized
	 * 
	 * Parameters: 
	 * 	- *_keys*: {Array of String} the keys
	 */
	this.setKeys = function(_keys){
		keys = _keys;
		contents = {};
	};
	
	this.removeContent = function(sTarget){
		var target = document.getElementById( sTarget );
		if(defaultContents[ sTarget ] !== undefined && target !== null){
			HUX.inject( target, "replace", defaultContents[ sTarget ] );
			// we do not store the content in order to save memory
			delete defaultContents[ sTarget ];
		}
	};
	
	
};