/**
    HTTP Using XML (HUX) : Overlay
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
 * Overlay aims to replace dynamically the content of the webpage as XUL overlay does
 */
// overlay.hux.js



// we add a new Filling method
/*HUX.Inject.setFillingMethod("overlay", function(DOMContent){
	return HUX.Overlay.proceed.call(HUX.Overlay, DOMContent );
}, false);*/




HUX.Overlay = {
	__rootTagName: "overlay",
	attributes: {
		POSITION:"position",
		REPLACEELEMENT:"replaceelement",
		REMOVEELEMENT:"removeelement",
		INSERTBEFORE:"insertbefore",
		INSERTAFTER:"insertafter",
		PREPENDCHILDREN: "prependchildren"
	},
	tabAttr: [], // filled in init
	init: function(){
		var aName;
		for(aName in this.attributes)
			this.tabAttr.push( this.attributes[aName] );
	},
	/**
	 * Function: proceed
	 * proceeds to the merge of the HTML Document and the Overlay document.
	 * 
	 * Parameters:
	 * 	- docOvl: {DocumentFragment} the Overlay XML Document
	 */
	proceed: function( docOvl ){
		try{
			if(docOvl.documentElement.tagName.toLowerCase() !== this.__rootTagName)
				throw new TypeError("wrong overlay document passed in HUX.Overlay.proceed");
			var childNodes = docOvl.documentElement.childNodes;
			HUX.Compat.Array.forEach(childNodes, function(el){
				if(el.nodeType === document.ELEMENT_NODE){ // only treat element nodes
					HUX.Overlay.treatOvlChild( el );
				}
			});
			docOvl = null; 
			return childNodes;
		}
		catch(ex){
			HUX.logError(ex);
		}
		
	},
	selectByClassName: function(context, tagName, className){
		if(! document.getElementsByClassName ){
			var rExp = new RegExp("(^|\\s)"+className+"($|\\s)");
			var fnFilter = function(el){
				return rExp.test( el.className );
			};
			return HUX.Selector.filterIE(tagName, fnFilter , context);
		}
		else{
			var ret = [], nodelist;
			// since in general, there are less elements matching with the className than the elements matching with the tagName
			// first we filter with the className
			nodelist = context.getElementsByClassName( className );
			// second we filter with the tagName
			HUX.Compat.Array.forEach(nodelist, function(e){
				if(e.tagName.toLowerCase() === tagName.toLowerCase())
					ret.push( e );
			});
			return ret;
		}
	},
	
	getElementFromElOvl: function( elOvl, attr ){
		return document.getElementById( elOvl.getAttribute(attr) );
	},
	
	cleanAttributes: function( el ){
		var attr;
		for(var i = 0; i < this.tabAttr.length; i++)
			el.removeAttribute( this.tabAttr[i] );
	},
	
	copyAttribute: function(target, attr){
		// we avoid copying attributes that are Overlay relative
		var lA = this.attributes;
		var aName = attr.nodeName;
		
		if(this.tabAttr[  aName ] !== undefined)
			return;
		if(aName === "class"){
			var rExp = new RegExp("(^|\\s)"+attr.nodeValue+"($|\\s)"); // rExp ensure that there will not be any double
			target.className = target.className.replace(rExp, "$2") + attr.nodeValue; 
		}
		else
			target.setAttribute(attr.nodeName, attr.nodeValue);
		
	},
	
	mergeAttributes: function(target, evOvl){
		var attrs = evOvl.attributes, attr;
		for(var i = 0; i < attrs.length; i++){
			attr = attrs.item(i);
			// IE includes non-speicified attributes, so we add this condition for it : 
			if(attr.specified){
				this.copyAttribute(target, attr);
			}
		}
	},
	
	treatRemove: function( elOvl ){
		var el;
		el = document.getElementById( elOvl.getAttribute("id") );
		return el.parentNode.removeChild( el );
	},
	
	
	
	treatInsertBefore: function(elOvl){
		var next = this.getElementFromElOvl(elOvl, this.attributes.INSERTBEFORE);
		var parent = next.parentNode;
		var _new = this.importNode(elOvl, true);
		var ret =  parent.insertBefore(_new , next );
		this.cleanAttributes( ret );
		return ret;
	},
	
	treatInsertAfter: function( elOvl ){
		var prev = this.getElementFromElOvl(elOvl, this.attributes.INSERTAFTER), next;
		var parent = prev.parentNode, imported = this.importNode(elOvl, true);
		this.cleanAttributes( imported );
		if( prev === (parent.lastElementChild || parent.lastChild) )
			return parent.appendChild( imported );
		else{
			next = ( prev.nextElementSibling || prev.nextSibling );
			return parent.insertBefore( imported, next );
		}
	},
	
	treatReplace: function( elOvl ){
		var old = document.getElementById( elOvl.getAttribute("id") );
		var _new = this.importNode( elOvl, true );
		_new.removeAttribute( this.attributes.REPLACEELEMENT );
		var ret = old.parentNode.replaceChild(_new, old);
		this.cleanAttributes( _new );
		return _new;
	},
	
	treatPosition: function(target, el, position){
		/*var i, curEl = target.firstChild;
		// NOTE : position attributes value begins from 1
		for(i = 1; i < position && curEl; i++){
			curEl = curEl.nextSibling; // position take into account any node position
		}*/
		var ret;
		if(position <= 0)
			throw new Error("position must be greater than 1");
		else if(position > target.children.length+1)
			throw new Error("position given is greater than the target capacity");
		else if(position === target.children.length) // we must append here
			ret = target.appendChild( el.cloneNode(true) );
		else // normal case
			ret = target.insertBefore( el.cloneNode(true), target.children[position-1] );
		this.cleanAttributes( ret );
		return ret;
	},
	
	positionContent: function(target, toPosition){
		// seems DocumentFragment has no children property
		// so, we use firstChild and nextSibling to go through all the children
		var child = toPosition.firstChild;
		if(!child)
			return;
		do{
			this.treatPosition( target, child, parseInt( child.getAttribute(this.attributes.POSITION) ) );
		}while( (child = child.nextSibling) !== null);
	},
	/**
	 * Function: appendContent
	 * appends DOM content to a list of Elements
	 * 
	 * Parameters:
	 * 	- targets: {Array of Element} an array of element that will append the content
	 * 	- toAppend: {Element or DocumentFragment} the element to append
	 * 
	 * NOTE: for appending to a single target, just call has below :
	 * > HUX.Overlay.appendContent( [ myTarget ], elToClone );
	 */
	appendContent: function(targets, toAppend){
		for(var i = 0; i < targets.length; i++)
			targets[i].appendChild( toAppend.cloneNode(true) );
	},
	
	prependContent: function(targets, toAppend){
		HUX.Compat.Array.forEach(targets, function( target ){
			if(target.firstChild) // if there is at least one child node
				target.insertBefore( toAppend.cloneNode(true), target.firstChild );
			else // otherwise, we append
				return target.appendChild( toAppend );
		});
	},
	checkId: function( el, neededAttrName, isPointer ){
		var id = el.getAttribute("id");
		if(! id )
			throw new Error("an element having "+ neededAttrName +" attribute must also have an id attribute");
		if(isPointer && ! document.getElementById( id ) )
			throw new Error("no element of id=\""+ id +"\" found");
	},
	
	treatOvlChild: function( el ){
		var atts = this.attributes;
		if( el.getAttribute(atts.INSERTBEFORE) ){
			this.treatInsertBefore( el );
		}
		else if( el.getAttribute(atts.INSERTAFTER) ){
			this.treatInsertAfter( el );
		}
		else if( el.getAttribute(atts.REPLACEELEMENT) === "true" ){
			this.checkId( el, atts.REPLACEELEMENT, true );
			this.treatReplace( el );
		}
		else if( el.getAttribute(atts.REMOVEELEMENT) === "true" ){
			this.checkId(el, atts.REMOVEELEMENT, true);
			this.treatRemove( el );
		}
		else{
			 // we create documentfragment that is really interesting when there are a lot of found elements
			var foundElts, toAdd = document.createDocumentFragment(), toPosition = document.createDocumentFragment(), c;
			while(el.childNodes.length > 0){
				c = el.childNodes[0];
				if(c.nodeType === document.ELEMENT_NODE && c.getAttribute( this.attributes.POSITION )) // if the node is an element and has "position" attribute
					toPosition.appendChild( this.importNode( c, true ) );
				else
					toAdd.appendChild( this.importNode( c, true) );
				el.removeChild( c );
			}
			if( el.getAttribute("id") ){
				foundElts = [ document.getElementById(el.getAttribute("id")) ]; // we create a unique-element array for appendContent and mergeAttributes
				this.positionContent( foundElts[0], toPosition );
			}
			else if( el.getAttribute("class") ){
				foundElts = this.selectByClassName( document, el.tagName, el.getAttribute("class") );
			}
			
			// we insert the content
			if( el.getAttribute(atts.PREPENDCHILDREN) === "true" )
				this.prependContent( foundElts, toAdd );
			else
				this.appendContent( foundElts, toAdd);
			var self = this;
			HUX.Compat.Array.forEach(foundElts, function(target){
				self.mergeAttributes( target, el );
			});
			el = toPosition = toAdd = null;
		}
	},
	
	
	importNode: HUX.importNode // just an alias
};




HUX.addModule( HUX.Overlay );
