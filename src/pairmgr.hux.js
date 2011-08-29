/**
    HTTP Using XML (HUX) : SplitArray Class
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
HUX.Pair = function(target, url){
	this.target = target;
	this.url = url;
};
HUX.Pair.prototype.equals = function(other){
	return  other instanceof HUX.Pair && 
		this.target === other.target && 
		this.url === other.url;
};
HUX.PairManager = function(){
	this.push.apply(this, arguments);
	
	
	if(Array.prototype.indexOf){
		this.indexOf = function(target){
			return Array.prototype.indexOf.call(this.map(function(e){ return e.target;}), target);
		};
	}
	else{
		this.indexOf = function(target){
			for(var i = 0; i < this.length; i++){
				if(this[i].target === target)
					return i;
			}
			return -1;
		};
	}
	this.addPair = function(target, url, callbacks){
		callbacks = callbacks || {};
		var index = this.indexOf(target), ok = true;
		if(url === "__default"){
			// we remove the pair
			if(index >= 0)
				this.removeAt(index, "all", callbacks.onDelete);
		}
		else if(index >= 0){
			// if a pair of the same target exists, we replace it by the new one
			var replacement = new HUX.Pair(target, url);
			if(callbacks.onReplace)
				ok = callbacks.onReplace(replacement, this[index]);
			if(ok !== false){
				this[index] = replacement;
				// we erase all pairs after the replaced element
				this.removeAt(index+1, "all", callbacks.onDelete);
			}
		}
		else{
			// otherwise, we add it to the array of pairs
			var added = new HUX.Pair(target, url)
			if(callbacks.onAdd)
				ok = callbacks.onAdd(added);
			if(ok !== false)
				this.push( added );
		}
		return index;
	};
	this.removePair = function(target){
		var index = this.indexOf(target);
		if(index >= 0)
			this.removeAt(index, 1);
		else
			throw new TypeError("element not found");
	};
	this.removeAt = function(index, nb, onDelete){
		nb = nb || 1; // by default, nb == 1
		if(nb === "all") // if nb is all
			nb = this.length; // we set nb as being this.length, thus we ensure that splice removes all after this[index]
		else if(nb instanceof String)
			throw new TypeError("second argument is invalid");
		if(typeof index === "number" && index >= 0){
			var aDeleted = this.splice(index,nb);
			if(onDelete !== undefined)
				HUX.foreach(aDeleted, onDelete); 
			
		}
		else
			throw new TypeError(index+" is not a valid index");
	};
	this.compairWith = function(other, callbacks){
		if(! other instanceof HUX.PairManager)
			throw new TypeError("the first argument is not a HUX.PairManager");
		
		callbacks = callbacks || {};
		var newIndex, aAdded, cont = true;
		for(var i = 0; i < Math.min(other.length, this.length); i++){
			
			if(this[i].equals(other[i]))
				continue; // lets say it is the normal case
			
			// now we treat any addition, replacement or deletion
			if(this[i].target === other[i].target){ // the url are different, but their target are the same : it is a replacement
				if("onReplace" in callbacks)
					cont = callbacks.onReplace(other[i], this[i]);
				if(cont === false){
					this.removeAt(i, "all")
					return;
				}
				this[i] = other[i];
			}
			else{
				newIndex = other.indexOf(this[i].target);
				if(newIndex < 0){
					if("onDelete" in callbacks)
						callbacks.onDelete(this[i]);
					this.removeAt(i);
				}
				else{
					aAdded = other.slice(i, newIndex);
					var self = this;
					HUX.foreach(aAdded, function(el){
						if(self.indexOf(el.target) >= 0)
							throw new TypeError("Inversion of two elements. Abandon");
					});
					if("onAdd" in callbacks){
						
						for(var i = 0; i < aAdded.length && cont; i++){
							cont = callbacks.onAdd(aAdded[i]);
							cont = (cont !== false);// we abort only if false is returned
							if(cont){
								// we add the new Pair
								this.splice(newIndex+i, 0, aAdded[i]);
							}
							else{
								this.removeAt(i, "all");
								return;
							}
							
						}
						
						//HUX.foreach(aAdded, callbacks.onAdd);
					}
					/*var args = aAdded.slice(); // we copy aAdded
					args.unshift(newIndex, 0); // we add the two first arguments of splice here
					this.splice.apply(this, args); */
				}
			}
		}
		// we delete the rest :
		while( this.length > other.length ){
			if("onDelete" in callbacks)
				callbacks.onDelete(this[other.length]);
			this.removeAt(other.length);
		}
		while( this.length < other.length && cont ){
			var added = other[this.length];
			if("onAdd" in callbacks)
				cont = callbacks.onAdd(added);
			if(cont === false)
				return;
			this.push(added);
			
		}
	};
	// a workaround of Array.prototype.map if it does not exist
	if( !this.map ){
		this.map = function(fn, thisArg){
			var a = [];
			thisArg = thisArg || this;
			for(var i = 0; i < this.length; i++){
				a[ i ] = fn.call(thisArg, this[i], i);
			}
			return a;
		}
	}
	
	

	
	
	
	this.setAsync = function(async){
		this.async = !!async;
	};
	this.toString = null;
};

// inspired from the inheritance method of Andrea Giammarchi
// http://devpro.it/code/183.html
(function(PM){
	PM.prototype = new Array;
	PM.prototype.length = 0;
	if(! new PM(1).length){
		PM.prototype = { length: 0 };
		HUX.foreach(["join", "pop", "push", "reverse", "shift", "slice", "sort", "splice", "unshift"], function(i){
			PM.prototype[i] = Array.prototype[i];
		});
	}
	var toString= Object.prototype.toString,
		slice   = Array.prototype.slice,
		concat  = Array.prototype.concat;
	PM.prototype.concat = function(){
		
		for(var Array = this.slice(0), i = 0, length = arguments.length; i < length; ++i){
		if(toString.call(arguments[i]) != "[object Array]")
			arguments[i] = typeof arguments[i] == "object" ? slice.call(arguments[i]) : [arguments[i]];
		};
		Array.push.apply(Array, concat.apply([], arguments));
		return  Array;
	};
	PM.prototype.constructor = PM;
})(HUX.PairManager);

HUX.PairManager.split  = function(str, pattern, callbacks){
	var resExec, sTarget, url, index, pm;
	if(!pattern.global)
		throw new TypeError("pattern must have the 'g' flag");
	pm = new HUX.PairManager();
	while( ( resExec = (pattern.exec(str)) ) !== null){
		sTarget = resExec[1];
		url = resExec[2];
		index = pm.addPair(sTarget, url, callbacks);
	}
	return pm;
};