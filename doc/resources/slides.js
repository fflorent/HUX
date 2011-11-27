HUX.Slide = {
	init: function(){
		HUX.Compat.addEventListener(window, "keydown", this.treatSlideChange);
		var slideCont = this.getSlideContainer();
		/*if( slideCont !== null )
			this.updateDirectionLinks(slideCont);*/
	},
	nbSlides: 7,
	
	afterInject: function(ev){
		if( ev.target.id === "slide" ){
			HUX.Slide.updateDirectionLinks(ev.target);
		}
	},
	getNextLink: function(){
		return document.getElementById("nextSlide");
	},
	getPrevLink: function(){
		return document.getElementById("prevSlide");
	},
	slideNumber: function(slide){
		return parseInt( (slide || this.getSlideContainer()).children[0].getAttribute("data-slide") );
	},
	getSlideContainer: function(){
		return document.getElementById("slide");
	},
	treatSlideChange: function(event){
		var self = HUX.Slide, elDir;
		if( self.getSlideContainer() !== null ){
			if(event.keyCode === 39){ // NEXT
				elDir = self.getNextLink();
			}
			else if(event.keyCode === 37){ // PREVIOUS
				elDir = self.getPrevLink();
			}
			
			if(elDir !== undefined && elDir.style.display !== "none")
				self.simulateClick( elDir );
		}
	},
	updateDirectionLink: function(link, numSlide){
		if(numSlide < 0 || numSlide === HUX.Slide.nbSlides )
			link.style.display = "none";
		else
			link.style.display = "inline";
		var replacement = (numSlide <= 0 ? "slide=__default": ("slide=s_"+numSlide));
		link.href = link.getAttribute("href").replace(/slide=[^,]*/, replacement);
	},
	updateDirectionLinks: function(slide){
		var curSlide;
		curSlide = this.slideNumber(slide);
		this.updateDirectionLink( this.getNextLink(), curSlide+1 );
		this.updateDirectionLink( this.getPrevLink(), curSlide-1 );
	},
	simulateClick: function(link){
		if("click" in link)
			link.click();
		else if(link.fireEvent)
			link.fireEvent("onclick");
		else{
			var evt = document.createEvent("MouseEvents");
			evt.initMouseEvent("click", false, false, window,
			0, 0, 0, 0, 0, false, false, false, false, 0, null);
			link.dispatchEvent(evt);
		}
	}
	
};
HUX.addModule(HUX.Slide);
HUX.HUXEvents.bindGlobal("afterInject", HUX.Slide.afterInject);