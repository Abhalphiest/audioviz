"use strict";
var application = application || {};

// IIFE - audio will be returned object,
// with initializer function to build the rest of it once the
// page is loaded
application.audio = function(){

	
	var obj = {};

	// want these to be immutable from outside this closure
	// so make it local and not a member of obj
	var initialized = false;
	var playing = false;
	var NUM_SAMPLES = 256;

	obj.initializeAudio = function(){
		// only want to allow the application to initialize audio once, ideally
		// there is probably a more elegant way to handle this, but we want to wait until
		// the init function is called in the main file to initialize modules
		if(initialized)
			return;

		this.audioElement = document.createElement("audio");
		this.audioCtx =  new (window.AudioContext || window.webkitAudioContext);
		this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement); 
		this.analyserNode = function(){
			var analyserNode = this.audioCtx.createAnalyser();
			analyserNode.fftSize = NUM_SAMPLES;
			return analyserNode;
		}.bind(this)();

		// default starting value
		this.audioElement.volume = document.querySelector("#volumeSlider").value;

		// TODO: Debug
		this.equalizer = function(){
			var equalizer = {};
			var gain = 1, playbackRate = 1, 
			bass = 1, low = 1, mid = 1, high = 1, presence = 1, brilliance = 1,
			reverb = 1;

			equalizer.gainNode = this.audioCtx.createGain();
			gain = changeGain(equalizer.gainNode, gain);

			//bass filter
			// lowshelf filter allows all frequencies through, but boosts/attenuates lower frequencies
			equalizer.bassFilter = this.audioCtx.createBiquadFilter();
			equalizer.bassFilter.type = "lowshelf";
			equalizer.bassFilter.frequency.value = 100.0;
			equalizer.bassFilter.gain.value = 1.0;

			// low filter
			// peaking allows all frequencies through, but boosts a range of frequencies
			equalizer.lowFilter = this.audioCtx.createBiquadFilter();
			equalizer.lowFilter.type = "peaking";
			equalizer.lowFilter.frequency.value = 320.0;
			equalizer.lowFilter.Q.value = 0.5;
			equalizer.lowFilter.gain.value = 1.0;

			// mid filter
			equalizer.midFilter = this.audioCtx.createBiquadFilter();
			equalizer.midFilter.type = "peaking";
			equalizer.midFilter.frequency.value = 1000.0;
			equalizer.midFilter.Q.value = 0.5;
			equalizer.midFilter.gain.value = 1.0;

			// high filter
			equalizer.highFilter = this.audioCtx.createBiquadFilter();
			equalizer.highFilter.type = "peaking";
			equalizer.highFilter.frequency.value = 3200.0;
			equalizer.highFilter.Q.value = 0.5;
			equalizer.highFilter.gain.value = 1.0;

			//presence filter
			equalizer.presenceFilter = this.audioCtx.createBiquadFilter();
			equalizer.presenceFilter.type = "peaking";
			equalizer.presenceFilter.frequency.value = 5000.0;
			equalizer.presenceFilter.Q.value = 0.5;
			equalizer.presenceFilter.gain.value = 1.0;


			// brilliance filter
			// highshelf allows all frequencies through, but boosts/attenuates higher frequencies
			equalizer.brillianceFilter = this.audioCtx.createBiquadFilter();
			equalizer.brillianceFilter.type = "highshelf";
			equalizer.brillianceFilter.frequency.value = 8000.0;
			equalizer.brillianceFilter.gain.value = 1.0;

			equalizer.reverbFilter = this.audioCtx.createConvolver();

			// a billion accessors for our equalizer
			equalizer.setGain = function(value){gain = changeGain(equalizer.gainNode, value);};
			equalizer.getGain = function(){return gain;};
			equalizer.setPlaybackRate = function(value){playbackRate = value;};
			equalizer.getPlaybackRate = function(){return playbackRate;};
			equalizer.setBass = function(value){bass = changeGain(equalizer.bassNode, value);;};
			equalizer.getBass = function(){return bass;};
			equalizer.setLow = function(value){low = changeGain(equalizer.lowNode, value);;};
			// to the windoooooooow, to the walls
			equalizer.getLow = function(){return low;};
			equalizer.setMid = function(value){mid = changeGain(equalizer.midNode, value);};
			equalizer.getMid = function(){return mid;};
			equalizer.setHigh = function(value){high = changeGain(equalizer.highNode, value);};
			equalizer.getHigh = function(){return high;};
			equalizer.setPresence = function(value){presence = changeGain(equalizer.presenceNode, value);};
			equalizer.getPresence = function(){return presence;};
			equalizer.setBrilliance = function(value){brilliance = changeGain(equalizer.brillianceNode, value);};
			equalizer.getBrilliance = function(){return brilliance;};
			equalizer.setReverb = function(value){reverb = value;};
			equalizer.getReverb = function(){return reverb};

			return equalizer;
		}.bind(this)();

		// hook up all the node connections.. and hope to god it all works

		// gain has to go first, it normalizes input volume
		this.sourceNode.connect(this.equalizer.gainNode);

		// biquad filters go next for doing stuff and things (that's the technical jargon)
		this.equalizer.gainNode.connect(this.equalizer.brillianceFilter);
		this.equalizer.brillianceFilter.connect(this.equalizer.presenceFilter);
		this.equalizer.presenceFilter.connect(this.equalizer.highFilter);
		this.equalizer.highFilter.connect(this.equalizer.midFilter);
		this.equalizer.midFilter.connect(this.equalizer.lowFilter);
		this.equalizer.lowFilter.connect(this.analyserNode);

		//TODO: reverb

		// analyser goes last, we want it to be getting data from the audio the user will be hearing
		this.analyserNode.connect(this.audioCtx.destination)


		// prevent things from being added after initialization
		Object.seal(this);
		initialized = true;
	};
	obj.isInitialized = function(){
		return initialized;
	};
	obj.setStream = function(path){
		this.audioElement.src = path;
		if(playing)
			this.audioElement.play();
	};
	obj.play = function(){
			this.audioElement.play();
			playing = true;
	};
	obj.isPlaying = function(){
		return playing;
	};
	obj.pause = function(){
		this.audioElement.pause();
		playing = false;
	};
	obj.setVolume = function(volume){
			this.audioElement.volume = volume;
	};

	obj.getFrequencyData = function(){
		var frequencyData = new Uint8Array(NUM_SAMPLES/2); 
		this.analyserNode.getByteFrequencyData(frequencyData);
		return frequencyData;
	};

	obj.getWaveformData = function(){
		var waveformData = new Uint8Array(NUM_SAMPLES/2); 
		this.analyserNode.getByteTimeDomainData(waveformData);
		return waveformData;
	};

	return obj;
}();


// helper functions (if neccessary)

function changeGain(node, gain){
	gain = parseFloat(gain).toFixed(2);
	if(node){
		node.gain.cancelScheduledValues(0);
		node.gain.value = gain;
		node.gain.setValueAtTime(gain, 0);
	}

	return gain;
}