"use strict";
var application = application || {};

application.visualizer = function(){
	var obj = {};
	var initialized = false;
	var canvas;
	var ctx;
	obj.initializeVisualizer = function(){

		if(initialized)
			return;

		// set up canvas stuff
		canvas = document.querySelector("#mainCanvas");
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		ctx = canvas.getContext("2d");

		// topmost layer, for overlays
		var foreground ={};
		foreground.canvas = document.querySelector("#foregroundCanvas");
		foreground.ctx = foreground.canvas.getContext('2d');

		// bottom-most layer, for background effects
		var background = {};
		background.canvas = document.querySelector("#backgroundCanvas");
		background.ctx = background.canvas.getContext('2d');

		// between main canvas and background, for trail effect
		var midground = {}
		midground.canvas = document.querySelector("#midgroundCanvas");
		midground.ctx = midground.canvas.getContext('2d');

		this.resizeCanvas = function(width,height){
			canvas.width = width;
			canvas.height = height;
			foreground.canvas.width = width;
			foreground.canvas.height = height;
			midground.canvas.width = width;
			midground.canvas.height = height;
			background.canvas.width = width;
			background.canvas.height = height;
		};

		// visualization components
		this.visualization = {
			bezierCurves:{
				draw: function(frequencyData){
					if(!this.enabled)
						return;

					ctx.save();
					for(var i = 0; i < frequencyData.length; i++){
					var scale = frequencyData[i]/255.0;

					// draw quadratic bezier curves
					// possible options - max curve height,control point offset (horizontal), visible, color
					drawQuadCurve(ctx, -canvas.width/2, canvas.height/2, canvas.width/4+ this.controlPointOffset, 
									canvas.height/2 + scale*this.maxCurveHeight, canvas.width/2, canvas.height/2, this.color, false);
					drawQuadCurve(ctx, -canvas.width/2, canvas.height/2, canvas.width/4+ this.controlPointOffset, 
									canvas.height/2 - scale*this.maxCurveHeight, canvas.width/2, canvas.height/2, this.color, false);
					drawQuadCurve(ctx, canvas.width/2, canvas.height/2, 3*canvas.width/4- this.controlPointOffset, 
									canvas.height/2 + scale*this.maxCurveHeight, 3*canvas.width/2, canvas.height/2, this.color, false);
					drawQuadCurve(ctx, canvas.width/2, canvas.height/2, 3*canvas.width/4- this.controlPointOffset, 
									canvas.height/2 - scale*this.maxCurveHeight, 3*canvas.width/2, canvas.height/2, this.color, false);
					}
					ctx.restore();

				},
				color: "red",
				maxCurveHeight: 1000,
				controlPointOffset: 1000,
				trailEffect: false,
				enabled: true,
			},
			particles:{
				draw: function(){
					if(!this.enabled)
						return;


				},
				enabled:false,
				type: "type",
				maxParticles: 100,
				lifetime: 100,
				colors: [],
				// TODO: figure out what to do here before continuing to code
			},
			waveformLines:{
				draw: function(waveformData){

					if(!this.enabled)
						return;

					switch(this.location){
						case "Background":
							ctx.save();
							ctx.strokeStyle = this.color;
							ctx.lineWidth = 2;
							ctx.beginPath();
							var sliceWidth = canvas.width * (1.0/waveformData.length);
							var x = 0;
							for (var i = 0; i < waveformData.length; i++){
								var v = waveformData[i]; 
								var y = v+canvas.height/2;

								if( i === 0 ){
									ctx.moveTo(x, y);
								}
								else{
									ctx.lineTo(x,y);
								}

								x++;
							}
							ctx.lineTo(canvas.width, canvas.height/2);
							ctx.stroke();
							ctx.restore();
						break;
						case "Center":
							// wiggly circle thing
							var angleStep = (Math.PI*2)/waveformData.length;
							var theta = angleStep;
							var radius = 50;
							ctx.strokeStyle = "white";
							ctx.beginPath();
							var x,y;

							for(var i = 0; i < waveformData.length; i++){
								var scale = waveformData[i]/128;
								x = canvas.width/2+Math.cos(theta)*radius*scale*2;
								y = canvas.height/2+Math.sin(theta)*radius*scale*2;

								if(i === 0)
									ctx.moveTo(x,y);
								else
									ctx.lineTo(x,y);
								theta+=angleStep;
							}
							ctx.lineTo(canvas.width/2+radius*2*waveformData[0]/128,canvas.height/2);
							ctx.stroke();
							ctx.closePath();
						break;
						case "Overlay":


						break;
				}

				},
				enabled:false,
				scale: 1,
				location: "Center", // Center (wrapped around circle), Background, Overlay
				color: "white",

			},
			eqBars:{
				draw: function(){
					if(!this.enabled)
						return;

				},
				enabled:false,
				location: "Center", // Center (wrapped around circle), Bottom, Top, Background, Overlay
				height: 300,
				width: 10,
				appearance: "Rectangular", // Rectangular, Rounded, Line
				color: "black",

			},
			dynamicBG:{
				draw: function(frequencyData){
					if(!this.enabled)
						return;

					switch(type)
					{
						case "Gradient":

							break;
						case "Video":

							break;
						case "Spectogram":
							var spectOffset = 0;
							var slice = ctx.getImageData(0,spectOffset, canvas.width, 1);
							for(var i = 0; i < frequencyData.length; i++)
							{
								slice.data[4* i+0] = frequencyData[i]; // R
								slice.data[4 * i + 1] = frequencyData[i] // G
    							slice.data[4 * i + 2] = frequencyData[i] // B
    							slice.data[4 * i + 3] = 255         // A
							}
							ctx.putImageData(slice, 0, spectOffset);
							spectOffset++;
							spectOffset%= canvas.height;
							break;
					}
				},
				enabled:false,
				type: "Gradient", // Gradient, Video, Spectogram
			},

			// post processing effects
			invert: false,
			greyscale: false,
			//lyrics : false, // stretch goal.. 
			

		};

		// prevent things from being added after initialization
		Object.seal(this);
		initialized = true;

	};
	obj.isInitialized = function(){
		return initialized;
	};

	obj.update = function(){

		if(!application.audio.isInitialized())
			return;

		var frequencyData = application.audio.getFrequencyData();
		var waveformData = application.audio.getWaveformData();

		// clear the screen for drawing
		ctx.clearRect(0,0,canvas.width,canvas.width);  
		
		this.visualization.bezierCurves.draw(frequencyData);
		for(var i = 0; i < frequencyData.length; i++){
			var scale = frequencyData[i]/255.0;

			//draw center circles
			ctx.beginPath();
			ctx.fillStyle = makeColor(0, 0, 0, .50 - scale/10.0);
			ctx.arc(canvas.width/2, canvas.height/2, 100+ 100*scale, 0, 2*Math.PI, false);
			ctx.fill();
			ctx.closePath();

		}	

		this.visualization.waveformLines.draw(waveformData);

		//draw top circle
		ctx.beginPath();
		ctx.fillStyle = "black";
		ctx.arc(canvas.width/2, canvas.height/2, 50, 0, 2*Math.PI, false);
		ctx.fill();
		ctx.closePath();
	};

	return obj;
}();

	// HELPER
	function makeColor(red, green, blue, alpha){
   		var color='rgba('+red+','+green+','+blue+', '+alpha+')';
   		return color;
	}

			//function to draw our curves
	function drawQuadCurve(ctx,x1,y1,cpX,cpY,x2,y2,color){
		ctx.strokeStyle = color; //set the color
		ctx.lineWidth = 1; //set the line width

		ctx.beginPath(); //start a new path. This will clear the old drawing path shape
		ctx.moveTo(x1,y1); //move our cursor to the point to draw from. This does NOT draw, just moves
		ctx.quadraticCurveTo(cpX, cpY, x2, y2); 
			
		//draw the path
		ctx.stroke();
	}



