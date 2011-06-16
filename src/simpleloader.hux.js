/**
    HTTP by Using XML (HUX) : Simple Loader
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


//simpleloader.hux.js


HUX.SimpleLoader = {
	
	/**
	 * handler for Click Event
	 */
	__onclick: function(ev){
		var srcNode = HUX.core.getEventTarget(ev) ;
		var opt = {
			data:null,
			url:srcNode.href,
			method:'get',
			async:true,
			filling:HUX.core.HUXattr.getFillingMethod(srcNode),
			target:HUX.core.HUXattr.getTargetNode(srcNode),
			srcNode:srcNode
		};
		HUX.core.xhr(opt);
		HUX.core.preventDefault(ev);
	},
	__fnEach: function(el){
		HUX.core.addEventListener(el, "click", HUX.SimpleLoader.__onclick );
	},
	listen:function(context){
		// for all anchor nodes having targetnode attributes, we listen to "click" events
		HUX.core.Selector.byAttributeHUX("a", "targetnode", context, this.__fnEach);
	},
	init: function(){
		HUX.core.recursiveListen(this);
	}
};

HUX.core.addModule(HUX.SimpleLoader); 
