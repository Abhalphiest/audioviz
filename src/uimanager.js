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
				icon: document.querySelector("#volumeIcon"),
				mute: function(){
					application.audio.setVolume(0);
					this.slider.value = 0;
					this.icon.innerHTML = '<img src="media/volumemutedwhite.png" height=20 width=20 alt="Volume">'; 
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
					this.icon.innerHTML = '<img src="media/volumeiconwhite.png" height=20 width=20 alt="Volume">'; 
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
						case "dynamicBgSettings":
							application.visualizer.visualization.dynamicBG.enabled = option.enabled;
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

			 	this.volume = e.target.value;
			 	// if we're muted and they move the slider, we unmute
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
			this.controls.volumeControl.icon.ondblclick= function(e){
				if(this.muted){
					this.unmute();
				}
				else{
					this.mute();
				}

			}.bind(this.controls.volumeControl)

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


			// equalizer settings

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

			// visualization settings

			var visualizationSettings = this.options.visualizationSettings;
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

			// visualization  advanced options

			// everything except for color
			var visualizationAdvancedOptions = visualizationSettings.element.querySelectorAll(".advancedOptions");
			var advancedOptionInputs = [];

			for(var i = 0; i < visualizationAdvancedOptions.length; i++)
				Array.prototype.push.apply(advancedOptionInputs,visualizationAdvancedOptions[i].querySelectorAll('input'));

			advancedOptionInputs.forEach(function(input){
				input.addEventListener("change", setAdvancedOptions);
				input.addEventListener("input", setAdvancedOptions);
			}); 

			function setAdvancedOptions(){
				
				// I must have been a real jerk in a past life
				switch(this.parentElement.id){
					case "bezierMaxCurveHeight":
						application.visualizer.visualization.bezierCurves.maxCurveHeight = this.value;
					break;

					case "bezierControlPointOffset":
						application.visualizer.visualization.bezierCurves.controlPointOffset = this.value;
					break;

					case "bezierTrailEffect":
						application.visualizer.visualization.bezierCurves.trailEffect = this.checked;
					break;

					case "maxParticles":
						application.visualizer.visualization.particles.maxParticles = this.value;
					break;

					case "particlesLifetime":
						application.visualizer.visualization.particles.lifetime = this.value;
					break;

					case "particleColors":
						// no fucking clue
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

					case "eqbarWidth":
						application.visualizer.visualization.eqBars.width = this.value;
					break;

					case "eqbarAppearance":
						application.visualizer.visualization.eqBars.appearance = this.value;
					break;

					case "eqbarLocation":
						application.visualizer.visualization.eqBars.location = this.value;
					break;

					case "dynamicBgType":
						application.visualizer.visualization.dynamicBG.type = this.value;
					break;

				}


			}

			// color selectors.. what drove me to this?
			var colorOptions = document.querySelectorAll(".colorOption");

			function setColorOption(){

				// "this" is the input being changed
				var parent = this.parentElement;
				var preview = parent.parentElement.parentElement.querySelectorAll(".colorPreview")[0]

				function makeRGBColor(r,g,b){
					return "rgb(" + r +"," + g + "," + b + ")";
				}

				function makeHSLColor(h,s,l){
					return "hsl(" + r +"," + g + "," + b + ")";
				}
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
						// the compiler will do that for us and this is more
						// readable
						if(hex[i] < '0')
							valid = false;
						else if(hex[i] > '9' && hex[i] < 'A')
							valid = false;
						else if (hex[i] > 'F')
							valid = false;
					}


					
					return {string:hex, valid: valid};
				}

				switch(parent.classList[0]){
					case "rgbSlider": 

					break;

					case "hslSlider":

					break;

					case "hexPicker":
						var result = validateHexColor(this.value);
						this.value = result.string;
						if(result.valid){
							console.dir(parent.parentElement);
							preview.style.backgroundColor = result.string;
						}
					break;
				}

			}

			// this hideousness is because the onchange event is terrible and
			// doesn't fire for a radio button being unchecked, so it ends up being
			// easier to just replace the innerHTML rather than trying to cache the
			// previous value for EVERY color radio button on the page somewhere so we can collapse
			// one element and expand another

			// This is the HTML that the following IIFE builds
					// <span class="rgbPicker">\
  					// 		<div class="rgbSlider"> \
  					// 			<label for="RSlider">Red</label>\
							// 	<input id="RSlider" class="slider" type ="range" min ="0" max="255" step ="1" value ="255"/>\
  					// 		</div>\
  					// 		<div class="rgbSlider"> \
  					// 			<label for="GSlider">Green</label>\
							// 	<input id="GSlider" class="slider" type ="range" min ="0" max="255" step ="1" value ="0"/>\
  					// 		</div>\
  					// 		<div class="rgbSlider"> \
  					// 			<label for="BSlider">Blue</label>\
							// 	<input id="BSlider" class="slider" type ="range" min ="0" max="255" step ="1" value ="0"/>\
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
								// <input id="HSlider" class="slider" type ="range" min ="0" max="255" step ="1" value ="255"/>\
  						// 	</div>\
  						// 	<div class="hslSlider"> \
  						// 		<label for="SSlider">Saturation</label>\
								// <input id="SSlider" class="slider" type ="range" min ="0" max="255" step ="1" value ="0"/>\
  						// 	</div>\
  						// 	<div class="hslSlider"> \
  						// 		<label for="LSlider">Lightness</label>\
								// <input id="LSlider" class="slider" type ="range" min ="0" max="255" step ="1" value ="0"/>\
  						// 	</div>\
  						// 	</span>';

  			var hslPicker = function(){
				var element = document.createElement('span');
				element.classList.add('hslPicker');

				var div1 = document.createElement('div');
				div1.classList.add("hslSlider");

				var hslider = document.createElement('input');
				hslider.id = "HSlider";
				hslider.classList.add("slider");
				hslider.type = "range";
				hslider.min = "0";
				hslider.max = "255";
				hslider.step = "1";
				hslider.value = "255";

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
				sslider.max = "255";
				sslider.step = "1";
				sslider.value = "255";

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
				lslider.max = "255";
				lslider.step = "1";
				lslider.value = "255";

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
  							// 		<label for="HexInput">Value</label>\
  							// 		<input id="HexInput" type="text">\
  							// </span>';
  			var hexPicker = function(){
  				var element = document.createElement("span");
  				element.classList.add("hexPicker");

  				var textinput = document.createElement("input");
  				textinput.type = "text";
  				textinput.id= "HexInput";

  				var label = document.createElement("label");
  				label.for = "HexInput";
  				label.innerText = "Value";

  				element.appendChild(label);
  				element.appendChild(textinput);

  				return element;
  			}();



			for(var i = 0; i < colorOptions.length; i++){
				var radioButtons = colorOptions[i].querySelectorAll("input[type='radio']");

				radioButtons.forEach(function(radio){
					radio.onchange = function(e){
						var colorPicker = this.querySelectorAll('.colorPicker')[0];
						if(e.target.id.includes('RGB')){
							colorPicker.innerHTML = rgbPicker.outerHTML;
						}
						else if(e.target.id.includes('HSL')){
							colorPicker.innerHTML = hslPicker.outerHTML;
						}
						else if(e.target.id.includes('Hex')){
							colorPicker.innerHTML = hexPicker.outerHTML;
						}
						// make ids trivially unique, lazy but effective
						colorPicker.querySelectorAll("input").forEach(function(input){
							input.addEventListener("input", setColorOption);
							input.addEventListener("value", setColorOption);
							input.id += i;
						});
						colorPicker.querySelectorAll("label").forEach(function(label){
							label.id += i;
						});
					}.bind(colorOptions[i]);
				});

				// make rgb picker default
				// (I am cheating a little here)
				var event = {target: radioButtons[0]};
				radioButtons[0].onchange(event);
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