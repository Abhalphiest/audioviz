"use strict";
var application = application || {};

// ----------------------------------------------------------------------------
//
// This module handles the behavior of all UI elements, primarily through
// event handling.
//
// ----------------------------------------------------------------------------

application.ui = function(){
	var obj = {};
	var initialized = false;

	// MUST BE INITIALIZED BEFORE USE
	obj.initializeUI = function(){
		if(initialized)
			return;

		// the controls for track selection and audio playback
		this.controls = {
			element: document.querySelector("#controls"),
			height: 60,
			hidden: false,
			sensor: document.querySelector("#bottomsensor"),
			playButton: document.querySelector("#playButton"),
			volumeControl: {
				slider: document.querySelector("#volumeSlider"),
				element: document.querySelector("#volumeControl"),
				icon: document.querySelector("#volumeIcon"),
				mute: function(){
					application.audio.setVolume(0);
					this.slider.value = 0;
					this.icon.querySelector('img').src = 'media/volumemutedwhite.png'; 
					this.muted = true;
				},
				unmute: function(){
					if(this.volume != 0){
						application.audio.setVolume(this.volume);
						this.slider.value = this.volume;
					}
					else { // set it to a default audio if they muted by dragging the slider down
						application.audio.setVolume(.2);
						this.slider.value = .2;
						this.volume = .2;
					}
					this.icon.querySelector('img').src = 'media/volumeiconwhite.png';
					this.muted = false;
				},
				muted: false,
				volume: .2,
			},			 
			trackSelector: {
			 	trackSelect: document.querySelector("#trackSelect"),
			 	trackList: document.querySelector("#trackList"),
			 	currentTrack: document.querySelector("#currentTrack"),
			 	trackListVisible: false,
			 	trackListHeight: 0,
			 	// populate the custom tracklist selector with the available tracks
			 	createSelectOptions: function (trackList){

			 		var path = "tracks/";
			 		var tracks = getTracks();

			 		// clear out the trackList (if we're dynamically changing it might be populated)
			 		trackList.innerHTML = "";
			 		for(var i = 0; i < tracks.length; i++){

			 			var li = document.createElement("li");
			 			li.innerText = tracks[i];

			 			// selector behavior
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

			 			this.trackList.appendChild(li);
			 		}
			 		// prepping the tracklist for slide up/down
			 		this.trackList.style.maxHeight = "none";
			 		this.trackListHeight = this.trackList.offsetHeight;
			 		this.trackList.style.maxHeight = "0";

			 	}
			 },
			 hideButton: document.querySelector('#hideButton'),
			 optionsButton: document.querySelector('#showOptionsButton')
		};
		
		// want the controls to be visible by default, so a new user knows where they are
		slideUp(this.controls.element, this.controls.height);
		this.controls.element.style.overflow = "visible";

		this.options = {
			element: document.querySelector("#options"),
			hidden: true,
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
				toggleVisualizationOption: function(option){
					switch(option.element.id){
						case "bezierCurveSettings":
							application.visualizer.visualization.bezierCurves.enabled = option.enabled;
						break;
						case "particleSettings":
							application.visualizer.visualization.particles.enabled = option.enabled;
						break;
						case "wlineSettings":
							application.visualizer.visualization.waveformLines.enabled = option.enabled;
						break;
						case "eqbarSettings":
							application.visualizer.visualization.eqBars.enabled = option.enabled;
						break;
						case "invertSetting":
							application.visualizer.visualization.invert = option.enabled;
						break;
						case "greyscaleSetting":
							application.visualizer.visualization.greyscale = option.enabled;
						break;
					}
				},
			},
			resetButton: document.querySelector('#resetButton'),
			// used to initialize the app and to reset user settings 
			// with the reset button
			defaults:{
				eqGain: 1,
				eqBass: 0,
				eqLow: 0,
				eqMid: 0,
				eqHigh: 0,
				eqPresence: 0,
				eqBrilliance: 0,

				invert: false,
				greyscale:false,
				bezierDefaults:{
					enabled: false,
					color: {rgb:[0,0,0], hsl:[0,0,0], hex:"#000000"},
					maxCurveHeight: 1000,
					controlPointOffset: 1770,
					trailsEnabled: false
				},
				eqBarDefaults:{
					enabled: true,
					color: {rgb:[157,184,193], hsl:[195,18,75], hex:"#9db8c1"},
					appearance: "Rounded",
					location: "Background",
					height: 300
				},
				particleDefaults:{
					enabled:true,
					colors: [{rgb:[89,89,89], hsl:[0,0,34], hex:"#595959"},
							 {rgb:[81,0,0], hsl:[0,100,31], hex:"#510000"},
							 {rgb:[45,36,68], hsl:[256,47,26], hex:"#2d2444"},
							 {rgb:[143,143,143], hsl:[0,0,56], hex:"#8f8f8f"}],
					maxParticles: 200,
					particlesLifetime: 100
				},
				wlineDefaults:{
					enabled: true,
					color: {rgb:[101,26,26], hsl:[0,74,39], hex:"#651a1a"},
					location: "Overlay",
					scale: 300
				}
			},
			setDefaults: function(){
				// I am certain there's a more satisfying way than hard coding
				// all of this, but there's a finite amount of time I can spend
				// on this project and I have the benefit of knowing what I'm working with

				//equalizer stuff
				document.querySelector("#gainSlider").value = this.options.defaults.eqGain;
				application.audio.equalizer.setGain(this.options.defaults.eqGain);
				document.querySelector("#bassSlider").value = this.options.defaults.eqBass;
				application.audio.equalizer.setBass(this.options.defaults.eqBass);
				document.querySelector("#lowSlider").value = this.options.defaults.eqLow;
				application.audio.equalizer.setLow(this.options.defaults.eqLow);
				document.querySelector("#midSlider").value = this.options.defaults.eqMid;
				application.audio.equalizer.setMid(this.options.defaults.eqMid);
				document.querySelector("#highSlider").value = this.options.defaults.eqHigh;
				application.audio.equalizer.setHigh(this.options.defaults.eqHigh);
				document.querySelector("#presenceSlider").value = this.options.defaults.eqPresence;
				application.audio.equalizer.setPresence(this.options.defaults.eqPresence);
				document.querySelector("#brillianceSlider").value = this.options.defaults.eqBrilliance;
				application.audio.equalizer.setBrilliance(this.options.defaults.eqBrilliance);


				document.querySelector("#invertCheckbox").checked = this.options.defaults.invert;
				application.visualizer.visualization.invert = this.options.defaults.invert;
				document.querySelector("#greyscaleCheckbox").checked = this.options.defaults.greyscale;
				application.visualizer.visualization.greyscale = this.options.defaults.greyscale;

				document.querySelector("#bezierCurveCheckbox").checked = this.options.defaults.bezierDefaults.enabled;
				application.visualizer.visualization.bezierCurves.enabled = this.options.defaults.bezierDefaults.enabled;
				document.querySelector("#maxCurveHeightSlider").value = this.options.defaults.bezierDefaults.maxCurveHeight;
				application.visualizer.visualization.bezierCurves.maxCurveHeight = this.options.defaults.bezierDefaults.maxCurveHeight;
				document.querySelector("#controlPointOffsetSlider").value = this.options.defaults.bezierDefaults.controlPointOffset;
				application.visualizer.visualization.bezierCurves.controlPointOffset = this.options.defaults.bezierDefaults.controlPointOffset;
				document.querySelector("#trailEffectCheckbox").checked = this.options.defaults.bezierDefaults.trailsEnabled;
				application.visualizer.visualization.bezierCurves.trailEffect = this.options.defaults.bezierDefaults.trailsEnabled;
				setColorWidget("#bezierColorPicker", this.options.defaults.bezierDefaults.color);
				application.visualizer.visualization.bezierCurves.color = this.options.defaults.bezierDefaults.color.hex;

				document.querySelector("#eqbarCheckbox").checked = this.options.defaults.eqBarDefaults.enabled;
				application.visualizer.visualization.eqBars.enabled = this.options.defaults.eqBarDefaults.enabled;
				document.querySelector("#eqbarHeightSlider").value = this.options.defaults.eqBarDefaults.height;
				application.visualizer.visualization.eqBars.height = this.options.defaults.eqBarDefaults.height;
				document.querySelector("#eqbarAppearance"+this.options.defaults.eqBarDefaults.appearance).checked = true;
				application.visualizer.visualization.eqBars.appearance = this.options.defaults.eqBarDefaults.appearance;
				document.querySelector("#eqbarLocation"+this.options.defaults.eqBarDefaults.location).checked = true;
				application.visualizer.visualization.eqBars.location = this.options.defaults.eqBarDefaults.location;
				setColorWidget("#eqbarColorPicker", this.options.defaults.eqBarDefaults.color);
				application.visualizer.visualization.eqBars.color = this.options.defaults.eqBarDefaults.color.hex;

				document.querySelector("#particleCheckbox").checked = this.options.defaults.particleDefaults.enabled;
				application.visualizer.visualization.particles.enabled = this.options.defaults.particleDefaults.enabled;
				document.querySelector("#maxParticleSlider").value = this.options.defaults.particleDefaults.maxParticles;
				application.visualizer.visualization.particles.maxParticles = this.options.defaults.particleDefaults.maxParticles;
				document.querySelector("#lifetimeSlider").value = this.options.defaults.particleDefaults.particlesLifetime;
				application.visualizer.visualization.particles.lifetime = this.options.defaults.particleDefaults.particlesLifetime;
				setColorWidget("#particleColorPicker", this.options.defaults.particleDefaults.colors[0]);
				// also set the colors of all the preview panes and create a color array for the visualization object
				var colorArr = [];
				for(var i = 0; i < 4; i++){

					var colorobj = this.options.defaults.particleDefaults.colors[i];
					var rgbcolor = {r:0, g:0, b:0};
					rgbcolor.r = colorobj.rgb[0];
					rgbcolor.g = colorobj.rgb[1];
					rgbcolor.b = colorobj.rgb[2];
					colorArr.push(rgbcolor);

					document.querySelector("#particleColor-"+i).style.backgroundColor = colorobj.hex;
				}
				application.visualizer.visualization.particles.colors = colorArr;

				document.querySelector("#wlineCheckbox").checked = this.options.defaults.wlineDefaults.enabled;
				application.visualizer.visualization.waveformLines.enabled = this.options.defaults.wlineDefaults.enabled;
				document.querySelector("#wlineScaleSlider").value = this.options.defaults.wlineDefaults.scale;
				application.visualizer.visualization.waveformLines.scale = this.options.defaults.wlineDefaults.scale;
				document.querySelector("#wlineLocation"+this.options.defaults.wlineDefaults.location).checked = true;
				application.visualizer.visualization.waveformLines.location = this.options.defaults.wlineDefaults.location;
				setColorWidget("#wlineColorPicker", this.options.defaults.wlineDefaults.color);
				application.visualizer.visualization.waveformLines.color = this.options.defaults.wlineDefaults.color.hex;
				
				function setColorWidget(colorPickerID, colorObj){
					// determine which selector is up
					var colorPicker = document.querySelector(colorPickerID);
					var pickerType = colorPicker.querySelector('span').className;

					// populate it
					switch(pickerType){
						case "rgbPicker":
							colorPicker.querySelector('input[name="red"]').value = colorObj.rgb[0];
							colorPicker.querySelector('input[name="green"]').value = colorObj.rgb[1];
							colorPicker.querySelector('input[name="blue"]').value = colorObj.rgb[2];

						break;
						case "hslPicker":
							colorPicker.querySelector('input[name="hue"]').value = colorObj.hsl[0];
							colorPicker.querySelector('input[name="saturation"]').value = colorObj.hsl[1];
							colorPicker.querySelector('input[name="lightness"]').value = colorObj.hsl[2];
						break;
						case "hexPicker":
							colorPicker.querySelector('input').value = colorObj.hex;
						break;
					}

					//update the preview
					colorPicker.parentElement.querySelector('.colorPreview').style.backgroundColor = colorObj.hex;

				}



			}.bind(this),
		};

		// we will not (and should not) mess with these
		Object.freeze(this.options.defaults);

		

		// set up event listeners
		if(window.addEventListener) {

			// window resizing
   			window.addEventListener('resize', function() {
        		application.visualizer.resizeCanvas(window.innerWidth, window.innerHeight);
    		}, true);

   			// handling the sensor for the controls
   			// if the controls are unpinned and hidden, mousing over the
   			// area where they should be will slide them up
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
    		// it behaves how you'd expect..
    		this.controls.playButton.addEventListener("click", function(){
    				if(application.audio.isPlaying()){
    					application.audio.pause();
    					// Toggle icon and alt (for screen readers and server SNAFU)
    					this.playButton.querySelector('img').src = 'media/playcirclewhite.png';
    					this.playButton.querySelector('img').alt = 'Play';
    				}
    				else{
    					application.audio.play();
    					this.playButton.querySelector('img').src = 'media/pausecirclewhite.png';
    					this.playButton.querySelector('img').alt = 'Pause'; 
    				}
			}.bind(this.controls));

			// volume controls
			// you know this whole comment per function thing gets really old
			this.controls.volumeControl.slider.onchange = function(e){
			 	application.audio.setVolume(e.target.value);

			 	// cache the volume so we can handle muting and unmuting
			 	// also, what's the harm in having 3 separate, uncoordinated
			 	// locations for the same data? NOTHING COULD GO WRONG
			 	this.volume = e.target.value;

			 	// if we're muted and they've moved the slider off 0, we unmute
			 	if(this.muted && e.target.value != 0){
			 		this.unmute();
			 	}
			 	// if they slide the slider to 0, we mute
			 	if(!this.muted && e.target.value == 0){
			 		this.mute();
			 	}

			 }.bind(this.controls.volumeControl);

			 // double click the volume icon to mute/unmute
			 // volume from pre-mute is cached for unmute
			 // (I'm really glad there's a dblclick event, I was expecting to have 
			 // to do something absolutely horrifying with system time)
			this.controls.volumeControl.icon.ondblclick= function(e){
				if(this.muted){
					this.unmute();
				}
				else{
					this.mute();
				}

			}.bind(this.controls.volumeControl)

			 // track selector 

			 // populate internal ul with tracks
			 this.controls.trackSelector.createSelectOptions(this.controls.trackSelector.trackList);

			 // show/hide the tracklist when you click on the track
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
			// slightly oddly named, but it toggles the playback controls being pinned/unpinned,
			// if unpinned, when the user stops messing with them they hide themselves
			// if pinned they hang around like a bad cold at the bottom of the page
			this.controls.hideButton.onclick = function(e){
				if(this.hidden){
					this.hidden = false;
					this.hideButton.querySelector('img').src = 'media/unpinwhite.png';
					this.hideButton.querySelector('img').alt = "Unpin Controls"
				}
				else{
					this.hidden = true;
					this.hideButton.querySelector('img').src = "media/pinwhite.png";
					this.hideButton.querySelector('img').alt = "Pin Controls";
				}
			}.bind(this.controls);


			// shows/hides the options sidebar
			// DO YOU GET IT IT'S A HAMBURGER MENU
			// A MENU
			// THAT'S ALSO A HAMBURGER
			// HA
			// HAHA
			// Why are you making me comment all these event handlers
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

			this.options.resetButton.addEventListener("click", this.options.setDefaults);

			// equalizer settings

			// all of the behavior for the equalizer sliders
			// is consolidated here, so it's easy to add/remove them
			// as I slowly realize how out of scope this project is
			function setEqSetting(){
				var equalizer = application.audio.equalizer;
				switch(this.id){
					case "gainSlider":
						equalizer.setGain(this.value);
						break;
					case "bassSlider":
						equalizer.setBass(this.value);
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
					case "presenceSlider":
						equalizer.setPresence(this.value);
						break;
					case "brillianceSlider":
						equalizer.setBrilliance(this.value);
						break;
				}
			}

			// add event listeners to all the equalizer sliders
			for(var i = 0; i < this.options.equalizerSettings.settings.length; i++){
				var setting =this.options.equalizerSettings.settings[i];

				var input = setting.getElementsByTagName("input")[0];
				// oninput will let the setting change without the mouse being released for easier EQ tuning
				// but it isn't supported in all browsers so change is a backup
				input.addEventListener("change", setEqSetting);
				input.addEventListener("input", setEqSetting);
			}


			// visualization settings

			var visualizationSettings = this.options.visualizationSettings;

			// set up enable/disable and advanced option panel expansion (when appropriate)
			// for all the visualization options
			// again, doing it like this makes it much easier to add/remove options cleanly
			for(var i = 0; i < this.options.visualizationSettings.settings.length; i++){
				var option = visualizationSettings.settings[i];
				if(option.expandButton){
					option.expandButton.onclick = function(){visualizationSettings.toggleAdvancedSettings(this)}.bind(option);
				}
				option.checkbox.onchange = function(){
					if(this.checkbox.checked){
						this.enabled = true;
						visualizationSettings.toggleVisualizationOption(this);
					}
					else{
						this.enabled = false;
						visualizationSettings.toggleVisualizationOption(this);
					}				
				}.bind(option);

			}

			// visualization advanced options

			// event listeners for everything except for color 
			// (WE DON'T TALK ABOUT COLOR OKAY)
			var visualizationAdvancedOptions = visualizationSettings.element.querySelectorAll(".advancedOptions");
			var advancedOptionInputs = [];

			// make one giant array of all the inputs from all advanced option sections
			// the first of many shameless abuses of the array prototype functions 
			for(var i = 0; i < visualizationAdvancedOptions.length; i++)
				Array.prototype.push.apply(advancedOptionInputs,visualizationAdvancedOptions[i].querySelectorAll('input'));

			advancedOptionInputs.forEach(function(input){
				input.addEventListener("change", setAdvancedOptions);
				input.addEventListener("input", setAdvancedOptions);
			}); 

			// one more for particle color
			document.querySelector("#particleColors").querySelectorAll('span').forEach(function(colorbox){
				colorbox.addEventListener("click", setAdvancedOptions)});

			// hideous, giant switch statement to make a one stop shop for
			// advanced options (makes it easier to find where this stuff happens)
			function setAdvancedOptions(){
				
				// I must have been a real jerk in a past life
				switch(this.parentElement.id){
					case "bezierMaxCurveHeight":
						application.visualizer.visualization.bezierCurves.maxCurveHeight = this.value;
					break;

					case "bezierControlPointOffset":
						application.visualizer.visualization.bezierCurves.controlPointOffset = this.value;
					break;

					case "trailEffectToggle":
						application.visualizer.visualization.bezierCurves.trailEffect = this.checked;
					break;

					case "maxParticles":
						application.visualizer.visualization.particles.maxParticles = this.value;
					break;

					case "particlesLifetime":
						application.visualizer.visualization.particles.lifetime = this.value;
					break;

					case "particleColors":
						var colorPicker = document.querySelector("#particleColorPicker");
						colorPicker.dataset.colorindex = this.id.split("-").pop();
						colorPicker.parentElement.querySelector('.colorPreview').style.backgroundColor = this.style.backgroundColor;
						this.parentElement.querySelectorAll('span').forEach(function(s){
							s.className = "";
						});
						this.className = "selectedParticleColor";

						// set the sliders to this newly selected color
						// (I am cheating a little here, I guess, but it's easier than making a legitimate event object)
						
						var radioButtons = colorPicker.parentElement.querySelectorAll('input[type="radio"]');
						var button = radioButtons[0];
						if(radioButtons[1].checked) button = radioButtons[1];
						else if (radioButtons[2].checked) button = radioButtons[2];

						var event = {target: button};
						button.onchange(event);
					break;

					case "wlineScale":
						application.visualizer.visualization.waveformLines.scale = this.value;
					break;

					case "wlineLocation":
						application.visualizer.visualization.waveformLines.location = this.value;
					break;

					case "eqbarHeight":
						application.visualizer.visualization.eqBars.height = this.value;
					break;

					case "eqbarAppearance":
						application.visualizer.visualization.eqBars.appearance = this.value;
					break;

					case "eqbarLocation":
						application.visualizer.visualization.eqBars.location = this.value;
					break;

				}


			}

			// color selectors.. what drove me to this?
			// at what point during the fever dream of this semester did I say
			// yes, a custom color widget is core functionality and is worth it
			// also, let's do all 3 major color schemes because that is totally reasonable
			// and I really want to figure out how to translate between them

			// can we just forget this happened?

			var colorOptions = document.querySelectorAll(".colorOption");

			function setColorOption(){

				// "this" is the input being changed
				var parent = this.parentElement;
				var colorPicker = parent.parentElement.parentElement;
				var preview = colorPicker.parentElement.querySelector(".colorPreview");


				// functions for parsing input values into colors
				function makeRGBColor(r,g,b){
					return "rgb(" + r +"," + g + "," + b + ")";
				}

				function makeHSLColor(h,s,l){
					return "hsl(" + h +"," + s + "%," + l + "%)";
				}

				// edits the string in the input box, so the user will always
				// have a single # prepended (even if they type it)
				// and will be limited to 7 characters total
				// accepts both short and long form hex colors
				// BECAUSE WHY NOT, WHY NOT
				function validateHexColor(hex){
					var valid = true;

					// remove leading and trailing whitespace
					hex.trim();
					// prepend a # if the user didn't see fit to
					if(hex.charAt(0) !== '#'){
						hex = '#' + hex;
					}
					// truncate to correct string length (1 + 6 = 7)
					if(hex.length > 7)
						hex = hex.substring(0,7);

					// make uppercase
					hex = hex.toUpperCase();

					// check for valid lengths (4 for abbreviated hex, 7 for long hex)
					if(hex.length != 4 && hex.length != 7)
						valid = false;
					
					// check for valid alpha-numeric values
					for(var i = 1; i < hex.length; i++){
						// could easily make this one if statement, but 
						// the compiler (assuming it is not trashy, I know nothing about js compilers but I assume they've caught up to C99 compiler optimizations..)
						// will do that for us and this is more readable
						
						if(hex[i] < '0')
							valid = false;
						else if(hex[i] > '9' && hex[i] < 'A')
							valid = false;
						else if (hex[i] > 'F')
							valid = false;
					}


					
					return {string:hex, valid: valid};
				}

				var result = "black"; // default to black if we have nonsense
									  // emulating CSS behavior, because if there's one thing I've learned, it's that CSS is the gold standard for best practices
				switch(parent.classList[0]){
					case "rgbSlider": 
						var red = colorPicker.querySelector('input[name="red"]').value;
						var green = colorPicker.querySelector('input[name="green"]').value;
						var blue = colorPicker.querySelector('input[name="blue"]').value;
						result = makeRGBColor(red,green,blue);
						preview.style.backgroundColor = result;
					break;

					case "hslSlider":
						var hue = colorPicker.querySelector('input[name="hue"]').value;
						var saturation = colorPicker.querySelector('input[name="saturation"]').value;
						var lightness = colorPicker.querySelector('input[name="lightness"]').value;
						result = makeHSLColor(hue,saturation,lightness);
						preview.style.backgroundColor = result;
					break;

					case "hexTextBox":
						var hexresult = validateHexColor(this.value);
						this.value = hexresult.string;
						if(hexresult.valid){
							preview.style.backgroundColor = result.string;
							result = hexresult.string;
						}
					break;
				}

				// set the color property of the appropriate visualization
				switch(colorPicker.id){
					case "bezierColorPicker":
						application.visualizer.visualization.bezierCurves.color = result;
					break;

					case "wlineColorPicker":
						application.visualizer.visualization.waveformLines.color = result;
					break;

					case "eqbarColorPicker":
						application.visualizer.visualization.eqBars.color = result;
					break;

					case "particleColorPicker":
						var rgb = parseToRGBValues(result);
						var index = colorPicker.dataset.colorindex;
						application.visualizer.visualization.particles.colors[index] = rgb;
						document.querySelector("#particleColor-" + index).style.backgroundColor = result;
					break;
				}



			}

			// this hideousness is because the onchange event is terrible and
			// doesn't fire for a radio button being unchecked, so it ends up being
			// easier to just replace the innerHTML rather than trying to cache the
			// previous value for EVERY color radio button on the page somewhere so we can collapse
			// one element and expand another

			// I could have just hard coded the HTML, but this made my soul hurt a little less
			// For absolutely no raisins.

			// This is the HTML that the following IIFE builds
					// <span class="rgbPicker">\
  					// 		<div class="rgbSlider"> \
  					// 			<label for="RSlider">Red</label>\
							// 	<input id="RSlider" name="red" class="slider" type ="range" min ="0" max="255" step ="1" value ="255"/>\
  					// 		</div>\
  					// 		<div class="rgbSlider"> \
  					// 			<label for="GSlider">Green</label>\
							// 	<input id="GSlider" name="green" class="slider" type ="range" min ="0" max="255" step ="1" value ="0"/>\
  					// 		</div>\
  					// 		<div class="rgbSlider"> \
  					// 			<label for="BSlider">Blue</label>\
							// 	<input id="BSlider" name="blue" class="slider" type ="range" min ="0" max="255" step ="1" value ="0"/>\
  					// 		</div>\
  					// 		</span>
			var rgbPicker = function(){
				var element = document.createElement('span');
				element.classList.add('rgbPicker');

				var div1 = document.createElement('div');
				div1.classList.add("rgbSlider");

				var rslider = document.createElement('input');
				rslider.id = "RSlider";
				rslider.classList.add("slider");
				rslider.type = "range";
				rslider.min = "0";
				rslider.max = "255";
				rslider.step = "1";
				rslider.value = "255";
				rslider.name = "red";

				var rlabel = document.createElement('label');
				rlabel.for = "RSlider";
				rlabel.innerText = "Red";

				div1.appendChild(rlabel);
				div1.appendChild(rslider);

				element.appendChild(div1);

				var div2 = document.createElement('div');
				div2.classList.add("rgbSlider");

				var gslider = document.createElement('input');
				gslider.id = "GSlider";
				gslider.classList.add("slider");
				gslider.type = "range";
				gslider.min = "0";
				gslider.max = "255";
				gslider.step = "1";
				gslider.value = "255";
				gslider.name = "green";

				var glabel = document.createElement('label');
				glabel.for = "GSlider";
				glabel.innerText = "Green";

				div2.appendChild(glabel);
				div2.appendChild(gslider);

				element.appendChild(div2);


				var div3 = document.createElement('div');
				div3.classList.add("rgbSlider");

				var bslider = document.createElement('input');
				bslider.id = "BSlider";
				bslider.classList.add("slider");
				bslider.type = "range";
				bslider.min = "0";
				bslider.max = "255";
				bslider.step = "1";
				bslider.value = "255";
				bslider.name = "blue";

				var blabel = document.createElement('label');
				blabel.for = "BSlider";
				blabel.innerText = "Blue";

				div3.appendChild(blabel);
				div3.appendChild(bslider);

				element.appendChild(div3);

				return element;

			}();


			// This is the HTML that the following IIFE builds
 						// 	'<span class="hslPicker">\
  						// 	<div class="hslSlider"> \
  						// 		<label for="HSlider">Hue</label>\
						// 		<input id="HSlider" name="hue" class="slider" type ="range" min ="0" max="360" step ="1" value ="255"/>\
  						// 	</div>\
  						// 	<div class="hslSlider"> \
  						// 		<label for="SSlider">Saturation</label>\
						// 		<input id="SSlider" name="saturation" class="slider" type ="range" min ="0" max="100" step ="1" value ="100"/>\
  						// 	</div>\
  						// 	<div class="hslSlider"> \
  						// 		<label for="LSlider">Lightness</label>\
						// 		<input id="LSlider" name="lightness" class="slider" type ="range" min ="0" max="100" step ="1" value ="50"/>\
  						// 	</div>\
  						// 	</span>';

  			var hslPicker = function(){
				var element = document.createElement('span');
				element.classList.add('hslPicker');

				var div1 = document.createElement('div');
				div1.classList.add("hslSlider");

				// special snowflake hsl and its special snowflake slider ranges,
				// making me have two different sets
				// I mean 'making me' is strong, I could have just changed the ranges and values dynamically
				// but you know what? Shut up. I don't *need* this right now.
				// One of these days, I swear..
				var hslider = document.createElement('input');
				hslider.id = "HSlider";
				hslider.classList.add("slider");
				hslider.type = "range";
				hslider.min = "0";
				hslider.max = "360";
				hslider.step = "1";
				hslider.value = "255";
				hslider.name = "hue";

				var hlabel = document.createElement('label');
				hlabel.for = "HSlider";
				hlabel.innerText = "Hue";

				div1.appendChild(hlabel);
				div1.appendChild(hslider);

				element.appendChild(div1);

				var div2 = document.createElement('div');
				div2.classList.add("hslSlider");

				var sslider = document.createElement('input');
				sslider.id = "SSlider";
				sslider.classList.add("slider");
				sslider.type = "range";
				sslider.min = "0";
				sslider.max = "100";
				sslider.step = "1";
				sslider.value = "100";
				sslider.name = "saturation"

				var slabel = document.createElement('label');
				slabel.for = "SSlider";
				slabel.innerText = "Saturation";

				div2.appendChild(slabel);
				div2.appendChild(sslider);

				element.appendChild(div2);


				var div3 = document.createElement('div');
				div3.classList.add("hslSlider");

				var lslider = document.createElement('input');
				lslider.id = "LSlider";
				lslider.classList.add("slider");
				lslider.type = "range";
				lslider.min = "0";
				lslider.max = "100";
				lslider.step = "1";
				lslider.value = "50";
				lslider.name = "lightness";

				var llabel = document.createElement('label');
				llabel.for = "LSlider";
				llabel.innerText = "Lightness";

				div3.appendChild(llabel);
				div3.appendChild(lslider);

				element.appendChild(div3);

				return element;

			}();


			// This is the HTML that the following IIFE builds
  							// '<span class="hexPicker">\
  							// 		<div class="hexTextBox"
  							// 			<label for="HexInput">Value</label>\
  							// 			<input id="HexInput" type="text">\
  							//		</div>
  							// </span>';
  			var hexPicker = function(){
  				var element = document.createElement("span");
  				element.classList.add("hexPicker");

  				var div = document.createElement("div");
  				div.classList.add("hexTextBox");

  				var textinput = document.createElement("input");
  				textinput.type = "text";
  				textinput.id= "HexInput";

  				var label = document.createElement("label");
  				label.for = "HexInput";
  				label.innerText = "Value";

  				div.appendChild(label);
  				div.appendChild(textinput);
  				element.appendChild(div);

  				return element;
  			}();


  			// event handling for the color widget radio buttons
  			// populates the widget sliders in response to being checked
			for(var i = 0; i < colorOptions.length; i++){
				var radioButtons = colorOptions[i].querySelectorAll("input[type='radio']");

				radioButtons.forEach(function(radio){
					radio.onchange = function(e){
						var colorPicker = this.querySelectorAll('.colorPicker')[0];
						var color = colorPicker.parentElement.querySelector('.colorPreview').style.backgroundColor;
						if(e.target.id.includes('RGB')){
							colorPicker.innerHTML = rgbPicker.outerHTML;
							// set values to current color
							var rgb = parseToRGBValues(color);
							colorPicker.querySelector('input[name="red"]').value = rgb.r;
							colorPicker.querySelector('input[name="green"]').value = rgb.g;
							colorPicker.querySelector('input[name="blue"]').value = rgb.b;
						}
						else if(e.target.id.includes('HSL')){
							colorPicker.innerHTML = hslPicker.outerHTML
							var hsl = parseToHSLValues(color);
							colorPicker.querySelector('input[name="hue"]').value = hsl.h;
							colorPicker.querySelector('input[name="saturation"]').value = hsl.s;
							colorPicker.querySelector('input[name="lightness"]').value = hsl.l;
						}
						else if(e.target.id.includes('Hex')){
							colorPicker.innerHTML = hexPicker.outerHTML;
							colorPicker.querySelector('input').value = parseToHexValue(color);
						}
						// make ids trivially unique, lazy but effective
						colorPicker.querySelectorAll("input").forEach(function(input){
							input.addEventListener("input", setColorOption);
							input.addEventListener("value", setColorOption);
							input.id += i;
						});
						
						


					}.bind(colorOptions[i]);
				});

				// make rgb picker default
				// (I am cheating a little here, I guess, but it's easier than making a legitimate event object)
				var event = {target: radioButtons[0]};
				radioButtons[0].onchange(event);
			}

			// initialize to defaults
			this.options.setDefaults();
    	}
		else {
    		// The browser does not support Javascript event binding, or is IE pre-9. . .
    		browserRagequit();
		}

		// prevent the ui from being extended accidentally after initialization
		Object.seal(this);
		initialized = true;
	};

	obj.isInitialized = function(){
		return initialized;
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


// UI HELPERS

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
