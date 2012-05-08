(function(){
	var showTab = function(ev){
		var target = HUX.Compat.Event.getEventTarget(ev), parent = target;
		var tab2display = target.getAttribute("data-showtab");
		while( (parent = parent.parentNode) && 
			! /testit( |$)/.test(parent.className) );
		if(parent){
			var chosen = HUX.Selector.byClassName(tab2display, parent)[0],
				expected = HUX.Selector.byClassName("expected", parent)[0];
			HUX.Selector.byClassName("tab", parent, function(tab){
				tab.style.display = "none";
			});
			HUX.Selector.byAttribute("a", "data-showtab", parent, function(a){
				a.className = a.className.replace(/\s*selected\s*/gi, "");
			});
			target.className += " selected";
			chosen.style.display = "block";
			if(tab2display === "result"){
				HUX.inject(chosen, "replace", HUX.Selector.byClassName("usercodetxtarea", parent)[0].value);
			}
			// we change ids in expected tab, so there is no possible conflict with result tab
			HUX.Selector.byAttribute("*", "id", expected, function(el){
				var origId = el.id.replace(/^_+/, "");
				// we remove any reference of that ID in At Inclusions
				HUX.AtInclusion.changeAt('@-'+origId);
				// we change the ID
				el.id = tab2display === "expected" ? 
					origId : 
					"__"+origId;
			});
		}
		HUX.Compat.Event.preventDefault(ev);
	};
	HUX.addLiveListener(function(context){
		var model = document.getElementById("testit-model");
		if(model !== null){
			HUX.Selector.byClassName("testit", context, function(testit){
				// do not add content twice 
				if(testit.getAttribute("data-testitset"))
					return;
				testit.setAttribute("data-testitset", true);
				var menu = HUX.Selector.byClassName("testit-menu", model)[0].cloneNode(true), menuLinks, onblur, onfocus, expected;
				HUX.Selector.byClassName("tab", model, function(tab){
					testit.appendChild( tab.cloneNode(true) );
				});
				expected = HUX.Selector.byClassName("expected", context)[0];
				testit.insertBefore(menu, testit.firstChild);
				HUX.Compat.Array.forEach(menu.getElementsByTagName("a"), function(a){
					HUX.Compat.Event.addEventListener(a, "click", showTab);
				});
				HUX.Selector.byClassName("expected", testit, function(divExpected){
					divExpected.className += " sandbox tab";
				});
			});
		}
	});
})();
// inspired from : http://pallieter.org/Projects/insertTab/
var keydownEdit = function(e, o){
	var kc = e.keyCode ? e.keyCode : e.charCode ? e.charCode : e.which, oS, sS, sE, oValue;
	if(kc === 9 && !e.ctrlKey && !e.altKey){ // tabulation
		oS = o.scrollTop;
		sS = o.selectionStart;
		sE = o.selectionEnd;
		oValue = o.value;
		if(e.shiftKey){
			if(sS !== undefined){
				o.value = oValue.substring(0, sS-1) + oValue.substring(sS-1, sS).replace("\t", "")
						+ oValue.substring(sE);
			}
			else{
				// pff, no op ...
			}
		}
		else{
			if (sS !== undefined)
			{
				o.value = o.value.substring(0, sS) + "\t" + o.value.substr(sE);
			}
			else if (o.createTextRange !== undefined)
			{
				document.selection.createRange().text = "\t";
			}
		}
		if(sS !== undefined){
			o.setSelectionRange(sS + 1, sS + 1);
			o.focus();
		}
		o.scrollTop = oS;
		HUX.Compat.Event.preventDefault(e);
	}
};