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

HUX.PairManager = function(callbacks){
	callbacks = callbacks || {};
	var getPairsCopy;
	(function(){
		// the array which stores the pairs
		var pairs = [];
		// we add this.push, this.map and this.slice to call respectively pairs.push, pairs.map and pairs.slice
		HUX.Compat.forEach(["push", "map", "splice", "slice"], function(f){
			this[f] = function(){ return pairs[f].apply(pairs, arguments); };
		}, this);
		// returns the length of pairs
		this.getLength = function(){ return pairs.length; };
		// sets the value at the specified index
		this.set = function(index, value){
			return pairs[index] = value;
		};
		this.get = function(index){ return pairs[index] };
		// NOTE : getPairsCopy defined outside, but is not public
		getPairsCopy = function(){
			return pairs.slice(0); // clone pairs
		};
		// a workaround for IE which does not implement Array.prototype.map
		if( !pairs.map ){
			this.map = function(fn, thisArg){
				var a = [];
				thisArg = thisArg || this;
				for(var i = 0; i < this.getLength(); i++){
					a[ i ] = fn.call(thisArg, this.get(i), i);
				}
				return a;
			}
		}
	}).call(this);
	
	// to avoid checking the existence of onAdd, onDelete and onReplace at each use,
	// we create empty functions when they do not exist
	HUX.Compat.forEach(["onAdd", "onDelete", "onReplace"], function(e){
		if(! (e in callbacks))
			callbacks[e] = function(){ return true;};
	});
	
	// override indexOf
	if(Array.prototype.indexOf){
		this.indexOf = function(target){
			return Array.prototype.indexOf.call(this.map(function(e){ return e.target;}), target);
		};
	}
	else{
		this.indexOf = function(target){
			for(var i = 0; i < this.getLength(); i++){
				if(this.get(i).target === target)
					return i;
			}
			return -1;
		};
	}
	/**
	 * Function: getSubTargets
	 * get the descendants of a target (we name them subtargets).
	 * 
	 * Parameters: 
	 *  - target : {String} the target in which we look for substargets
	 *  - candidates : {Array of Pairs} the candidates for being subTargets
	 * 
	 * Returns: 
	 *  - {Array of String} the subtargets
	 */
	var getSubTargets = function(target, candidates){
		var ret = [],
		    eTarget = document.getElementById(target);
		HUX.Compat.forEach(candidates, function(candidate){
			var cur = document.getElementById(candidate.target) || {parentNode:null}, 
			    isDesc = false; // is the candidate descendant of target ?
			while( (cur = cur.parentNode)  && !isDesc) // we go through the ancestors of candidate
				isDesc = cur === eTarget; 
			if(isDesc){
				ret.push(candidate.target);
			}
		}, this);
		return ret;
	};
	
	var arePairEqual = function(p1, p2){
		return p1.target === p2.target && p1.url === p2.url;
	};
	/**
	 * extracts the target and the URL from a string
	 */
	var splitPair = function(sPair){
		var pair;
		pair = sPair.replace(/^!/, "").split(/=/);
		return {target:pair[0], url:pair[1]};
	};
	this.change = function(sPairs){
		var reModif = /^!?[+-]/, isModif = reModif.test( sPairs[0] ), // isModif === true if the first character of the first pair equals to '+' or '-'
		    op, lastop ; // lastop : the last operator
		
		if(isModif) {
			for(var i = 0; i < sPairs.length; i++){
				
				var sPair = sPairs[i], bangOffset = (sPair.charAt(0)==='!'?1:0), pair, sTarget;
				op = sPair.charAt(bangOffset);
				//
				if(! /[+-]/.test(op) ){
					op = lastop;
				}
				else{
					sPair = sPair.slice(bangOffset+ 1); // we remove '+' or '-' from sPair
				}
				lastop = op;
				
				if(op === '-'){
					this.removePair(sPair);
				}
				else if(op === '+'){
					pair = splitPair(sPair);
					var res = this.setPair(pair.target, pair.url);
					if(res.ok === false)
						break;
				}
				else{
					throw "wrong operator for pair modification";
				}
			}
		}
		else{
			// in order to optimize, we look for the first index where there is differences,
			// so we treat only where needed
			var i, length = Math.min( sPairs.length, this.getLength() );
			for(i = 0; i < length && 
				arePairEqual( this.get(i), splitPair(sPairs[i]) ); i++);
			
			sPairs = sPairs.slice(i); // we only keep sPairs elements whose index are greater or equal to i
			this.removeAt(i, "all"); 
			
			for(var i = 0; i < sPairs.length; i++){
				var sPair = sPairs[i], pair, res;
				if(sPair.length > 0){
					pair = splitPair(sPair),
					res = this.setPair(pair.target, pair.url);
					if(res.ok === false)
						break;
				}
			}
		}
	};
	/**
	 * Function: setPair
	 * add or replace a pair
	 * 
	 * Parameters: 
	 *  - target : {String} the target ID of the pair
	 *  - url : {String} the URL of the pair
	 * 
	 * Returns: {index:index, ok:ok} where index is the index of the new pair and ok is the result of the callback
	 */
	this.setPair = function(target, url){
		var index = this.indexOf(target), ok = true;
		if(index >= 0){
			// if a pair of the same target exists, we replace it by the new one
			var replacement = {target:target, url:url};
			// we store in this variable each targets included in the target that will be replaced
			var subtargets = getSubTargets(target, this.slice(index+1));
			ok = callbacks.onReplace(replacement, this.get(index));
			if(ok !== false){
				this.set(index, replacement);
				// we remove each subtargets : 
				this.removePairs(subtargets);
			}
		}
		else{
			// otherwise, we add it to the array of pairs
			var added = {target:target, url:url};
			ok = callbacks.onAdd(added);
			if(ok !== false)
				this.push( added );
		}
		return {index: index, ok: ok};
	};
	this.getPairValue = function(target){
		var index = this.indexOf(target);
		return index >= 0 ? this.get(index).url : null;
	};
	/**
	 * Function: removePair
	 * remove a pair with the specified target
	 * 
	 * Parameters:
	 *  - target: {String} the target ID of the pair to remove
	 */
	this.removePair = function(target){
		var index = this.indexOf(target);
		if(index >= 0)
			this.removeAt(index, "all");
		
	};
	/**
	 * Function: removePairs
	 * remove pairs
	 * 
	 * Parameters:
	 *  - targets: {Array of String} the targets ID of the pairs to remove
	 */
	this.removePairs = function(targets){
		HUX.Compat.forEach(targets, this.removePair, this);
	};
	/**
	 * Function: removeAt
	 * remove element(s) at the specified index
	 * 
	 * Parameters:
	 *  - index: {integer}
	 *  - nb: {integer or "all"} number of element to remove after the index specified (optionnal)
	 */
	this.removeAt = function(index, nb){
		nb = nb || 1; // by default, nb == 1
		if(nb === "all") // if nb is all
			nb = this.getLength(); // we set nb as being this.getLength(), thus we ensure that splice removes all after this.get(index)
		else if(nb instanceof String)
			throw new TypeError("second argument is invalid");
		if(typeof index === "number" && index >= 0){
			var aDeleted = this.splice(index,nb);
			HUX.Compat.forEach(aDeleted, callbacks.onDelete); 
			
		}
		else
			throw new TypeError(index+" is not a valid index");
	};
};

HUX.PairManager.split = function(str, pattern, callbacks){
	var resExec, sTarget, url, index, pm;
	if(!pattern.global)
		throw new TypeError("pattern must have the 'g' flag");
	pm = new HUX.PairManager(callbacks);
	while( ( resExec = (pattern.exec(str)) ) !== null){
		sTarget = resExec[1];
		url = resExec[2];
		index = pm.setPair(sTarget, url);
	}
	return pm;
};
