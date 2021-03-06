/**
    HTTP Using XML (HUX) : Syntax checker
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

// checker.hux.js
// NOTE : far to be finished...
HUX.Checker = {
	init: function(){
		this.check_targets();
	},
	
	logError: function(strErr){
		// we call HUX.logError with a timeout in order to avoid to stop the rest of the execution
		setTimeout(HUX.logError, 0, strErr); 
	},
	__get_targets: function(){
		var targets = [];
		// we get all id in href attributes : 
		HUX.Selector.byAttribute("a", "href", null, function(el){
			var re = /!([^=]+)/g, res;
			while( (res = re.exec(el.href)) !== null )
				targets.push( res[1] );
		});
		// we get all target attributes
		HUX.Selector.byAttributeHUX("*", "target", null, function(el){
			targets.push( HUX.HUXattr.getAttributeHUX(el, "target") );
		});
		return targets;
	},
	/* check the id of target attributes and the id given in href attributes */
	check_targets: function(){
		var targets = this.__get_targets();
		HUX.Compat.Array.forEach(targets, function(targ){
			if( document.getElementById(targ) === null){
				this.logError("No Element of id=\""+targ+"\" found");
			}
		});
	}
	
};
HUX.addModule( HUX.Checker );


