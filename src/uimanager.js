"use strict";
var application = application || {};

application.ui = function(){
	var obj = {};
	var initialized = false;

	// MUST BE INITIALIZED BEFORE USE
	obj.initializeUI = function(){
		if(initialized)
			return;

		this.controls = {
			element: document.querySelector("#controls"),
			height: 60,
			hidden: false,
			sensor: document.querySelector("#bottomsensor"),
			playButton: document.querySelector("#playButton"),
			volumeControl: {
				slider: document.querySelector("#volumeSlider"),
				element: document.querySelector("#volumeControl"),
				icon: document.querySelector("#volumeIcon")
			},			 
			trackSelector: {
			 	trackSelect: document.querySelector("#trackSelect"),
			 	trackList: document.querySelector("#trackList"),
			 	currentTrack: document.querySelector("#currentTrack"),
			 	trackListVisible: false,
			 	trackListHeight: 0,
			 	createSelectOptions: function (trackList){
			 		var path = "tracks/";
			 		var elements = [];
			 		trackList.innerHTML = "";
			 		for(var i = 0; i < tracks.length; i++){
			 			var li = document.createElement("li");
			 			li.innerHTML = tracks[i];
			 		
			 			li.addEventListener("click", function(e){ 
			 				var streamPath = path + e.target.innerText + ".mp3";
			 				application.audio.setStream(streamPath);

			 				// set this as our current track in the ui
			 				this.currentTrack.innerText = e.target.innerText;

			 				//collapse the selector
			 				this.trackSelect.style.backgroundColor = "#f2e8e8";
			 				this.trackSelect.style.color = "black";
			 				slideDown(this.trackList);
			 				this.trackListVisible = false;
			 			}.bind(this));
			 			elements[i] = li;
			 			this.trackList.appendChild(li);
			 		}
			 		this.trackList.style.maxHeight = "none";
			 		this.trackListHeight = this.trackList.offsetHeight;
			 		this.trackList.style.maxHeight = "0";
			 		return elements;

			 	}
			 },
			 hideButton: document.querySelector('#hideButton'),
			 optionsButton: document.querySelector('#showOptionsButton')
		};
		
		// want the controls to be visible by default, so a user knows where they are
		slideUp(this.controls.element, this.controls.height);
		this.controls.element.style.overflow = "visible";

		this.options = {
			element: document.querySelector("#options"),
			hidden: true,
			width: 100,
			equalizerSettings: {
				element: document.querySelector("#equalizerSettings"),
				settings: document.getElementsByClassName("eqControl"),
			},
			visualizationSettings: {
				element: document.querySelector("#visualizationSettings"),
				settings: function(){
					var settings = [];
					var elements = document.getElementsByClassName("visOption");
					for(var i = 0; i < elements.length; i++){
						settings[i] = {
							element: elements[i],
							checkbox: elements[i].querySelectorAll("input[type='checkbox']")[0],
							expandButton: elements[i].getElementsByClassName("expandButton")[0],
							advancedOptions: {
								element: elements[i].getElementsByClassName("advancedOptions")[0],
								inputs: elements[i].getElementsByClassName("advancedOptions")[0]? 
										elements[i].getElementsByClassName("advancedOptions")[0].getElementsByTagName("input")
										:undefined,
								visible: false
							},
							enabled: false,
							
						};
					}
					return settings;
				}(),
				expanded: 0,
				expandedSetting: undefined,
				toggleAdvancedSettings: function(option){

					if(!option.advancedOptions.visible && this.expanded){
						slideLeft(this.expandedSetting.advancedOptions.element);
						this.expandedSetting.advancedOptions.visible = false;
						this.expandedSetting.element.style.backgroundColor = "#333333";
						slideRight(option.advancedOptions.element, 300);
						option.advancedOptions.visible = true;
						this.expandedSetting = option;
						option.element.style.backgroundColor = "#555555";
					}
					else if(!option.advancedOptions.visible){
						slideRight(option.advancedOptions.element, 300);
						option.advancedOptions.visible = true;
						option.element.style.backgroundColor = "#555555";
						this.expanded = true;
						this.expandedSetting = option;
					}
					else{
						slideLeft(option.advancedOptions.element);
						option.advancedOptions.visible = false;
						option.element.style.backgroundColor = "#333333";
						this.expanded = false;
						this.expandedSetting = undefined;
					}
				},
			},
			resetButton: document.querySelector('#resetButton')
		};


		// set up event listeners
		if(window.addEventListener) {

			// window resizing
   			window.addEventListener('resize', function() {
        		if(application.visualizer && application.visualizer.isInitialized())
        			application.visualizer.resizeCanvas(window.innerWidth, window.innerHeight);
    		}, true);

   			// handling the sensor for the controls
    		this.controls.sensor.addEventListener("mouseenter", function(){

    			if(this.controls.hidden){
    				slideUp(this.controls.element, this.controls.height);
    			}
    		}.bind(this));
    		this.controls.sensor.addEventListener("mouseleave", function(){

    			if(this.controls.hidden){
    				if(!this.controls.trackSelector.trackListVisible)
    				{
    					slideDown(this.controls.element);
    				}
    			}
    			
    		}.bind(this));

    		// handling the play/pause button
    		this.controls.playButton.addEventListener("click", function(){
    			if(application.audio && application.audio.isInitialized())
    			{
    				if(application.audio.isPlaying()){
    					application.audio.pause();
    					// Shouldn't hard code this HTML, TODO clean this up
    					this.playButton.innerHTML = '<img src="media/playcirclewhite.png" height=30 width=30 alt="Play">';
    				}
    				else{
    					application.audio.play();
    					this.playButton.innerHTML = '<img src="media/pausecirclewhite.png" height=30 width=30 alt="Pause">'; 
    				}
    			}
			}.bind(this.controls));

			// volume controls
			this.controls.volumeControl.slider.onchange = function(e){
			 	if(application.audio && application.audio.isInitialized())
			 		application.audio.setVolume(e.target.value);
			 };

			 // track selector
			 //populate internal ul with tracks
			 this.controls.trackSelector.createSelectOptions(this.controls.trackSelector.trackList);

			 document.querySelector("#trackSelect").onclick = function(e){
			 	if(this.trackSelector.trackListVisible){
			 		this.trackSelector.trackSelect.style.backgroundColor = "#f2e8e8";
			 		this.trackSelector.trackSelect.style.color = "black";
			 		slideDown(this.trackSelector.trackList);
			 		this.trackSelector.trackListVisible = false;
			 	}
			 	else{
			 		this.trackSelector.trackList.style.display="block";
			 		slideUp(this.trackSelector.trackList,this.trackSelector.trackListHeight);
			 		this.trackSelector.trackSelect.style.backgroundColor = "transparent";
			 		this.trackSelector.trackSelect.style.color = "white";
			 		this.trackSelector.trackListVisible = true;
			 	}	
			}.bind(this.controls);


			// hide button
			this.controls.hideButton.onclick = function(e){
				// TODO : Fix this ugly hard-coded HTML as well
				if(this.hidden){
					this.hidden = false;
					this.hideButton.innerHTML = '<img src="media/unpinwhite.png" height=30 width=30 alt="Unpin Controls">';
				}
				else{
					this.hidden = true;
					this.hideButton.innerHTML = '<img src="media/pinwhite.png" height=30 width=30 alt="Pin Controls">';
				}
			}.bind(this.controls);

			this.controls.optionsButton.onclick = function(){
				if(this.options.hidden){
					slideUp(this.options.element, window.innerHeight);
					this.options.hidden = false;
				}
				else{
					slideDown(this.options.element);
					this.options.hidden = true;
				}
			}.bind(this);

			function setEqSetting(){
				var equalizer = application.audio.equalizer;
				switch(this.id){
					case "gainSlider":
						equalizer.setGain(this.value);
						break;
					case "pbrSlider":
						equalizer.setPlaybackRate(this.value);
						break;
					case "lowSlider":
						equalizer.setLow(this.value);
						break;
					case "midSlider":
						equalizer.setMid(this.value);
						break;
					case "highSlider":
						equalizer.setHigh(this.value);
						break;
				}
			}

			for(var i = 0; i < this.options.equalizerSettings.settings.length; i++){
				var setting =this.options.equalizerSettings.settings[i];

				var input = setting.getElementsByTagName("input")[0];
				// oninput will let the setting change without the mouse being released for easier EQ tuning
				// but it isn't supported in all browsers so change is a backup
				input.addEventListener("change", setEqSetting);
				input.addEventListener("input", setEqSetting);
			}

			var visualizationSettings = this.options.visualizationSettings;
			for(var i = 0; i < this.options.visualizationSettings.settings.length; i++){
				var option = visualizationSettings.settings[i];
				if(option.expandButton){
					option.expandButton.onclick = function(){visualizationSettings.toggleAdvancedSettings(this)}.bind(option);
				}
				option.checkbox.onchange = function(){
					if(this.checkbox.checked){
						this.enabled = true;
					}
					else{
						this.enabled = false;
					}				
				}.bind(option);

			}
			



    	}
		else {
    		// The browser does not support Javascript event binding, or is IE pre-9. . .
    		// TODO: Error screen?
    		console.log("browser does not support addEventListener");
		}

		// prevent the ui from being extended accidentally after initialization
		Object.seal(this);
		initialized = true;
	};

	obj.hideControls = function(){
		this.controls.hidden = true;
	};

	obj.showControls = function(){
		this.controls.hidden = false;
	};

	obj.showOptions = function(){
		this.options.hidden = false;
	};
	obj.hideOptions = function(){
		this.options.hidden = true;
	};
	return obj;
}();

// helpers


// jQuery-like sliding (adapted from https://gist.github.com/ludder/4226288)
// Up is visible, down is invisible
function slideUp(elem, height) {
	elem.style.maxHeight = height+"px";
	// We're using a timer to set opacity = 0 because setting max-height = 0 doesn't (completely) hide the element.
	elem.style.opacity   = '1';
	elem.style.overflow = "visible";
}

function slideDown(elem) {
	elem.style.overflow = "hidden";
	elem.style.maxHeight = '0';
	once( 1, function () {
		elem.style.opacity = '0';
	});
}

// Horizontal sliding 
// Right is visible, left is invisible
function slideRight(elem, width){
	elem.style.maxWidth = width+"px";
	// We're using a timer to set opacity = 0 because setting max-height = 0 doesn't (completely) hide the element.
	elem.style.opacity   = '1';
}

function slideLeft(elem){
	elem.style.maxWidth = '0';
	once( 1, function () {
		elem.style.opacity = '0';
	});
}

// simple timeout for reducing opacity after a slide down/left
function once (seconds, callback) {
	var counter = 0;
	var time = window.setInterval( function () {
		counter++;
		if ( counter >= seconds ) {
			callback();
			window.clearInterval( time );
		}
	}, 400 );
}