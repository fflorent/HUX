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
/**
 * Namespace: PairManager
 * 
 * Pair Manager for HashBang or AtInclusion
 */
HUX.PairManager = function(callbacks){
	var _this = this;
	callbacks = callbacks || {};
	(function(){
		// the array which stores the pairs
		var pairs = [];
		// we add this.push, this.map, this.splice and this.slice to call respectively pairs.push, pairs.map and pairs.slice
		HUX.Compat.Array.forEach(["push", "map", "splice", "slice"], function(f){
			this[f] = function(){ return Array.prototype[f].apply(pairs, arguments); };
		}, this);
		// returns the length of pairs
		this.getLength = function(){ return pairs.length; };
		// sets the value at the specified index
		this.set = function(index, value){
			return pairs[index] = value;
		};
		this.get = function(index){ return pairs[index] };
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
		HUX.Compat.Array.forEach(candidates, function(candidate){
			var eCandidate = document.getElementById(candidate.target);
			if( eCandidate && HUX.Compat.Element.contains(eTarget, eCandidate) )
				ret.push( candidate.target );
		});
		return ret;
	};
	/**
	 * Function: removePairs
	 * removes pairs 
	 * 
	 * Parameters: 
	 *  - targets : {Array of String} the targets whose pairs have to be removed
	 * 
	 */
	var removePairs = function(targets){
		HUX.Compat.Array.forEach(targets, function(el){
			this.removePair(el, /* bRemoveSubTargets=*/ false );
		}, _this);
	};
	var arePairsEqual = function(p1, p2){
		return p1.target === p2.target && p1.url === p2.url;
	};
	/**
	 * extracts the target and the URL from a string
	 */
	var splitPair = function(sPair){
		var pair;
		pair = sPair.split(/=/);
		return {target:pair[0], url:pair[1]};
	};
	/**
	 * Function: change
	 * applies changes in pairs with a given string
	 * 
	 * Parameters:
	 *  - sPairs: the pairs string (either with operations or not)
	 */
	this.change = function(sPairs){
		var reModif = /^[+-]/, isModif = reModif.test( sPairs[0] ), // isModif === true if the first character of the first pair equals to '+' or '-'
		    op, lastop ; // lastop : the last operator
		
		if(isModif) {
			for(var i = 0; i < sPairs.length; i++){
				var sPair , op, pair, sTarget, reRes;
				
				reRes = sPairs[i].match(/^([+-])?(.*)/);
				op = reRes[1] || lastop;
				sPair = reRes[2];
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
			var pair, i;
			// NOTE : this algorithme should be improved later, 
			//        because there are some cases where it changes pair even if it is not needed
			for(i = 0; i < sPairs.length; i++){
				if(sPairs[i].length === 0){
					sPairs.splice(i, 1);
					i--;
					continue;
				}
				pair = splitPair(sPairs[i]);
				while(i < this.getLength() && this.get(i).target !== pair.target)
					this.removeAt(i, 1);
				this.setPair(pair.target, pair.url);
			}
			if(i < this.getLength())
				this.removeAt(i, "all");
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
			// if a pair of the same target exists, and its url is different, we replace it by the new one
			var replacement = {target:target, url:url}, subtargets;
			if(! arePairsEqual(this.get(index), replacement))
			{
				subtargets = getSubTargets(target, this.slice(index + 1));
				ok = callbacks.onReplace(replacement, this.get(index));
				if(ok !== false){
					this.set(index, replacement);
					// we remove each subtargets : 
					removePairs(subtargets);
				}
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
	/**
	 * Function: getPairValue
	 * get the value of a pair
	 * 
	 * Parameters:
	 *  - target: {String} the target of the pair
	 * 
	 * Returns:
	 *  - {String} the value
	 */
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
	 *  - bRemoveSubTargets: {Boolean} if set to true, removes also subtargets (optional, default: true)
	 */
	this.removePair = function(target, bRemoveSubTargets){
		var index = this.indexOf(target), subtargets;
		if(index >= 0){
			if(bRemoveSubTargets !== false){
				subtargets = getSubTargets(target, this.slice(index+1));
				removePairs(subtargets);
			}
			this.removeAt(index, 1);
		}
	};
	/**
	 * Function: removeAt
	 * remove element(s) at the specified index
	 * 
	 * Parameters:
	 *  - index: {integer}
	 *  - nb: {integer or "all"} number of element to remove after the index specified (optional)
	 */
	this.removeAt = function(index, nb){
		nb = nb || 1; // by default, nb == 1
		if(nb === "all") // if nb is all
			nb = this.getLength(); // we set nb as being this.getLength(), thus we ensure that splice removes all after this.get(index)
		else if(nb instanceof String)
			throw new TypeError("second argument is invalid");
		if(typeof index === "number" && index >= 0){
			var aDeleted = this.splice(index,nb);
			HUX.Compat.Array.forEach(aDeleted, callbacks.onDelete);
		}
		else
			throw new TypeError(index+" is not a valid index");
	};
};
