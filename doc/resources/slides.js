HUX.Slide = {
	init: function(){
		// add event listener to document because of IE 8-
		HUX.Compat.addEventListener(document, "keydown", this.treatSlideChange);
		var slideCont = this.getSlideContainer();
		/*if( slideCont !== null )
			this.updateDirectionLinks(slideCont);*/
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
				HUX.AtMgr.addAt("slide", "s_"+(++self.curSlide));
			}
			else if(event.keyCode === 37 && self.curSlide > 0){ // PREVIOUS
				self.curSlide--;
				if(self.curSlide >= 1)
					HUX.AtMgr.addAt("slide", "s_"+self.curSlide);
				else
					HUX.AtMgr.removeAt("slide");
			}
			
		}
	}
	
};
HUX.addModule(HUX.Slide);