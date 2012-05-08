HUX.Slide = {
	init: function(){
		// add event listener to document because of IE 8-
		HUX.Compat.Event.addEventListener(document, "keydown", this.treatSlideChange);
		var slideCont = this.getSlideContainer();
	},
	nbSlides: 7,
	curSlide: 0,
	getSlideContainer: function(){
		return document.getElementById("slide");
	},
	treatSlideChange: function(event){
		var self = HUX.Slide, elDir;
		if( self.getSlideContainer() !== null ){
			if(event.keyCode === 39 && self.curSlide < self.nbSlides-1){ // NEXT
				HUX.AtInclusion.addAt("slide", "s_"+(++self.curSlide));
			}
			else if(event.keyCode === 37 && self.curSlide > 0){ // PREVIOUS
				self.curSlide--;
				if(self.curSlide >= 1)
					HUX.AtInclusion.addAt("slide", "s_"+self.curSlide);
				else
					HUX.AtInclusion.removeAt("slide");
			}
			
		}
	}
	
};
HUX.addModule(HUX.Slide);