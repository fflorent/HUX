// TODO : les noms !
(function(){
	
	window.registered = {};
	var port = 8081;
	if(window.WebSocket === undefined){
		alert('WebSocket unsupported by your browser');
	}
	var ws = new WebSocket("ws://"+location.host+":"+port);
	ws.addEventListener("open", function(){
		ws.send('{"setChannel":"'+location.pathname+'"}');
	}, false);
	var toArray = function(enum){
		var a = [];
		for(var i = 0; i < enum.length; i++)
			a.push( enum[i] );
		return a;
	};
	ws.onmessage = function(ev){
		var data = ev.data;
		if(data[0] === "{"){
			data = JSON.parse( data );
			if(data.env === "HUX"){
				if( data.action === "call" ){
					window.registered[ data.name ].apply( window, data.arguments);
				}
			}
		}
	};
	Function.prototype.register = function(name){
		window.registered[name] = this;
		var self = this;
		return function(){
			try{
				var json = {
					"env":"HUX",
					"action": "call",
					"name": name,
					"arguments": toArray(arguments)
				};
				var sJson = JSON.stringify( json );
				ws.send( sJson );
			}
			catch(ex){
				if(typeof console !== "undefined" && console.error)
					console.error(ex);
			}
		};
	};
})();