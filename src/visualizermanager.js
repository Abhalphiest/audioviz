"use strict";
var application = application || {};

// ----------------------------------------------------------------------------
//
// This module handles canvas rendering of the audio visualization,
// based on data from the audio module
//
// ----------------------------------------------------------------------------

application.visualizer = function(){
	var obj = {};
	var initialized = false; // prevents reinitialization, verifies success
	var canvas, midground, foreground, background;
	var ctx;
	obj.initializeVisualizer = function(){

		if(initialized)
			return;

		// set up canvas stuff
		// There are multiple canvases, to allow for distinct layers independent of draw order
		// (different settings require visualizations to be drawn at different depths, and this allows for that)
		canvas = document.querySelector("#mainCanvas");
		ctx = canvas.getContext("2d");

		// topmost layer, for overlays
		foreground ={};
		foreground.canvas = document.querySelector("#foregroundCanvas");
		foreground.ctx = foreground.canvas.getContext('2d');

		// // bottom-most layer, for background effects
		background = {};
		background.canvas = document.querySelector("#backgroundCanvas");
		background.ctx = background.canvas.getContext('2d');

		// between main canvas and background, for trail effect
		midground = {}
		midground.canvas = document.querySelector("#midgroundCanvas");
		midground.ctx = midground.canvas.getContext('2d');

		// used for window resizing and initialization
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

		// make canvas(es) the full size of the display area of the window
		this.resizeCanvas(window.innerWidth, window.innerHeight);

		// visualization components
		this.visualization = {
			// quadratic bezier curves with control points based on frequency data
			// there is 1 curve per frequency bucket, with height determined by the value of that frequency
			bezierCurves:{
				draw: function(frequencyData){
					if(!this.enabled)
						return;

					ctx.save();
					for(var i = 0; i < frequencyData.length; i++){
						var scale = frequencyData[i]/255.0;

						// draw quadratic bezier curves
						drawQuadCurve(ctx, -canvas.width/2, canvas.height/2, canvas.width/4+ this.controlPointOffset, 
									canvas.height/2 + scale*this.maxCurveHeight, canvas.width/2, canvas.height/2, this.color, false);
						drawQuadCurve(ctx, -canvas.width/2, canvas.height/2, canvas.width/4+ this.controlPointOffset, 
									canvas.height/2 - scale*this.maxCurveHeight, canvas.width/2, canvas.height/2, this.color, false);
						drawQuadCurve(ctx, canvas.width/2, canvas.height/2, 3*canvas.width/4- this.controlPointOffset, 
									canvas.height/2 + scale*this.maxCurveHeight, 3*canvas.width/2, canvas.height/2, this.color, false);
						drawQuadCurve(ctx, canvas.width/2, canvas.height/2, 3*canvas.width/4- this.controlPointOffset, 
									canvas.height/2 - scale*this.maxCurveHeight, 3*canvas.width/2, canvas.height/2, this.color, false);

						if(this.trailEffect){
							midground.ctx.save();
							midground.ctx.lineWidth = 100;
							drawQuadCurve(midground.ctx, -canvas.width/2, canvas.height/2, canvas.width/4+ this.controlPointOffset, 
									canvas.height/2 + scale*this.maxCurveHeight, canvas.width/2, canvas.height/2, this.color, false);
							drawQuadCurve(midground.ctx, -canvas.width/2, canvas.height/2, canvas.width/4+ this.controlPointOffset, 
									canvas.height/2 - scale*this.maxCurveHeight, canvas.width/2, canvas.height/2, this.color, false);
							drawQuadCurve(midground.ctx, canvas.width/2, canvas.height/2, 3*canvas.width/4- this.controlPointOffset, 
									canvas.height/2 + scale*this.maxCurveHeight, 3*canvas.width/2, canvas.height/2, this.color, false);
							drawQuadCurve(midground.ctx, canvas.width/2, canvas.height/2, 3*canvas.width/4- this.controlPointOffset, 
									canvas.height/2 - scale*this.maxCurveHeight, 3*canvas.width/2, canvas.height/2, this.color, false);
							midground.ctx.restore();
						}
					}
					ctx.restore();

				},
				color: "red",
				maxCurveHeight: 1000,
				controlPointOffset: 1000,
				trailEffect: true,
				enabled: false,
			},
			// particle effect that fires when there is a significant change in certain
			// frequency ranges, with a different color for each range
			// see the particle system object at the bottom of this file
			particles:{
				draw: function(frequencyData){
					if(!this.enabled)
						return;

					
					//get our ranges
					var r1 = frequencyData.slice(0, 31);
					var r2 = frequencyData.slice(31, 81);
					var r3 = frequencyData.slice(81, 121);
					var r4 = frequencyData.slice(121, 151);
					var newAvgs= [avgArrayValue(r1), avgArrayValue(r2), avgArrayValue(r3), avgArrayValue(r4)];

					// average frequency across all that are in an "active range" 
					// (there are a large amount of zeroes in the upper frequencies that will skew an average down)

					// the [].slice.call() is to get an array from UintArray8 or whatever it's called
					// honestly the most attractive, readable thing I've ever written
					var commonfrequencies = [].slice.call(frequencyData);
					commonfrequencies = trimTrailingZeroes(commonfrequencies);
					var avgfreq= avgArrayValue(commonfrequencies);

					var newAvg = Math.max(newAvgs[0], newAvgs[1], newAvgs[2], newAvgs[3]);
					var diff, color;

					// choose our color and calculate the delta
					if(newAvg === newAvgs[0]){
						diff = newAvgs[0] - this.prevAvgs[0];
						color = this.colors[0];
					}else if(newAvg === newAvgs[1]){
						diff = newAvgs[1] - this.prevAvgs[1];
						color = this.colors[1];
					}else if(newAvg === newAvgs[2]){
						diff = newAvgs[2] - this.prevAvgs[2];
						color = this.colors[2];
					}else{
						diff = newAvgs[3] - this.prevAvgs[3];
						color = this.colors[3];
					}
					
					// compare the intensity to the average of the track, so that particles still fire even for
					// relatively soft sounds.
					// a change of >= 5 indicates a significant event in that frequency range, usually (usually changes are between -1 and 1)
					// and requiring it to be positive means that we fire on suddenly becoming louder, not quieter
					if(diff >= 5 && (newAvg > avgfreq + 50 || newAvg > 100)){
						let i = 0;

						for(; i < this.particleSystems.length; i++){

							// if we have a pre-existing dead particle system, we recycle it
							if(this.particleSystems[i].dead){
								this.particleSystems[i].createParticles({x: canvas.width/2, y: canvas.height/2});
								// set color here
								this.particleSystems[i].red = color.r;
								this.particleSystems[i].green = color.g;
								this.particleSystems[i].blue = color.b;
								this.particleSystems[i].numParticles = this.maxParticles;
								this.particleSystems[i].lifetime = this.lifetime;
								break;
							}
						}

						// if we didn't break out of the loop, and we can afford to have more particles on the screen, or there are no particle systems yet
						// we make a new particle system to fire
						if(this.particleSystems.length*this.maxParticles < 2500 && (i >= this.particleSystems.length || this.particleSystems.length == 0)){ // we didn't find a dead one
							var ps = new particlesystem();

							ps.red = color.r;
							ps.green = color.g;
							ps.blue = color.b;
							ps.numParticles = this.maxParticles;
							ps.lifetime = this.lifetime;
							ps.createParticles({x:canvas.width/2, y: canvas.height/2});
							this.particleSystems.push(ps);
						}

					}
					// update averages for comparison
					this.prevAvgs = newAvgs;

					// draw all our particles
					this.particleSystems.forEach(function(ps){
						ps.update({x: canvas.width/2, y: canvas.height/2});
						ps.draw(ctx);
					});


				},
				enabled:false,
				maxParticles: 200,
				lifetime: 100,
				colors: [{r:255, g: 0, b: 0},{r:120, g:120, b:120}, {r:0, g:0, b:0}],
				particleSystems: [],
				prevAvgs: [0,0,0,0],
			},
			// draws either a line or shapes with borders defined by a line determined by waveform data
			// think oscilloscope
			waveformLines:{
				draw: function(waveformData){
					if(!this.enabled)
						return;

					var x,y;
					var offset, reverseoffset, angleStep, theta, radius;
					// concatenating with its reverse ensures that it loops/repeats smoothly
					// because the circumferences of the circles/width of the screen are so large in comparison to the
					// size of the waveform data, we repeat the data to fill the space while keeping fine enough detail
					// to be aesthetically pleasing
					offset = [];
					reverseoffset = [];
					for (var i = 0; i < waveformData.length; i++){
								
						// average with previous data to smooth the value and make the line less jumpy and fragmented
						offset[i] = ((waveformData[i]/128.0 - 1) + this.prevOffset[i])/2;
					}

					this.prevOffset = offset;
					reverseoffset = offset.slice().reverse();
					offset=offset.concat(reverseoffset);
					switch(this.location){
						case "Background": // segment of a sine curve (to make it larger in the middle) across the horizontal midline
							background.ctx.save();
							background.ctx.fillStyle = this.color;
							background.ctx.beginPath();
							x = 0;
							
							var bigOffset = offset.slice();
							while(bigOffset.length < canvas.width){
								bigOffset = bigOffset.concat(offset);
							}
							
							y = canvas.height/2;
							background.ctx.moveTo(-1, y);
							for(var i = 0; i < bigOffset.length; i++){
								y = canvas.height/2 - 30*Math.sin(i*(Math.PI/bigOffset.length));
								background.ctx.lineTo(x, y+this.scale*bigOffset[i]);
								x++;
							}
							for(var i = bigOffset.length - 1; i >= 0; i--){
								y = canvas.height/2 + 30*Math.sin(i*Math.PI/bigOffset.length);
								background.ctx.lineTo(x, y-this.scale*bigOffset[i]);
								x--;
							}
							background.ctx.lineTo(-1,canvas.height/2);
							background.ctx.closePath();
							background.ctx.fill();
							background.ctx.restore();
						break;
						case "Center": // filled circle surrounding the center circles
							ctx.save();
							angleStep = Math.PI/offset.length;
							theta = 0;
							radius = 250;
							var grd = background.ctx.createRadialGradient(background.canvas.width/2, background.canvas.height/2, 100, background.canvas.width/2, background.canvas.height/2, 300);
							grd.addColorStop(0, "black");
							grd.addColorStop(1, this.color);
							ctx.fillStyle = grd;
							ctx.beginPath();
							for(var i = 0; i < offset.length; i++){
								x = canvas.width/2+Math.cos(theta)*(radius + offset[i]*this.scale);
								y = canvas.height/2+Math.sin(theta)*(radius +offset[i]*this.scale);

								if(i === 0)
									ctx.moveTo(x,y);
								else
									ctx.lineTo(x,y);
								theta+=angleStep;
							}
							for(var i = 0; i < offset.length; i++){
								x = canvas.width/2+Math.cos(theta)*(radius + offset[i]*this.scale);
								y = canvas.height/2+Math.sin(theta)*(radius +offset[i]*this.scale);

								ctx.lineTo(x,y);
								theta+=angleStep;
							}
							ctx.closePath();
							ctx.fill();
							ctx.restore();
						break;
						case "Overlay": // line circle overlaying the center circles, kind of a speaker effect?
							foreground.ctx.save();
							// wiggly circle thing
							angleStep = Math.PI/offset.length;
							theta = 0;
							radius = 100;
							foreground.ctx.strokeStyle = this.color;
							foreground.ctx.beginPath();

							for(var i = 0; i < offset.length; i++){
								x = canvas.width/2+Math.cos(theta)*(radius+offset[i]*this.scale);
								y = canvas.height/2+Math.sin(theta)*(radius+offset[i]*this.scale);

								if(i === 0)
									foreground.ctx.moveTo(x,y);
								else
									foreground.ctx.lineTo(x,y);
								theta+=angleStep;
							}
							for(var i = 0; i < offset.length; i++){
								x = canvas.width/2+Math.cos(theta)*(radius+offset[i]*this.scale);
								y = canvas.height/2+Math.sin(theta)*(radius+offset[i]*this.scale);

								foreground.ctx.lineTo(x,y);
								theta+=angleStep;
							}
							foreground.ctx.lineTo(canvas.width/2+radius+ offset[i]*this.scale, canvas.height/2);
							foreground.ctx.closePath();
							foreground.ctx.stroke();
							foreground.ctx.restore();
						break;
				}

				},
				enabled:false,
				scale: 300, // factor for the waveform data - it doesn't make it signifiantly bigger, mostly just amplifies behavior
				location: "Background", // Center (wrapped around circle), Background, Overlay
				color: "blue",
				prevOffset: new Array(128).fill(0), // fill the array with 0s for first comparison

			},
			// frequency bars, called EQ bars because it's the kind of thing you'd see in an equalizer I guess, and it sounds
			// cooler than frequency bars
			eqBars:{
				draw: function(frequencyData){
					if(!this.enabled)
						return;

					var barWidth;
					var barSpacing;

					// wrapped around the center circle
					if(this.location === "Center"){ // hoo boy
						var radius = 200;
						var truncArray = [].slice.call(frequencyData);
						truncArray.length = Math.floor(250*Math.PI/5); // circumference 2pi*r divided by 10
						var angleStep = 250*2/5;
						
						
						ctx.save();
						ctx.fillStyle = this.color;
						for(var i = 0; i < truncArray.length; i++){
							var scale = truncArray[i]/255;

							switch(this.appearance){
								case "Line": ctx.fillRect(canvas.width/2, canvas.height/2, radius + this.height*scale, 2); break;
								case "Rectangular": ctx.fillRect(canvas.width/2, canvas.height/2, radius + this.height*scale, 10); break;
								case "Rounded": fillRoundedRect(canvas.width/2, canvas.height/2, radius + this.height*scale, 10, ctx); break;

							}
								
							ctx.translate(canvas.width/2, canvas.height/2);			
							ctx.rotate(angleStep);
							ctx.translate(-canvas.width/2, -canvas.height/2);
						}
						ctx.restore();
					}

					// centered on the horizontal midline as a background graphic (mirrored vertically and horizontally for visual effect)
					else if(this.location === "Background"){
						background.ctx.save();
						background.ctx.fillStyle = this.color;
						var verticalSpacing = canvas.height/2 - this.height;

						// take only the first half (the most used) so we can mirror it horizontally for symmetry
						var truncatedArray = [].slice.call(frequencyData);
						truncatedArray.length = frequencyData.length/2;

						barWidth = canvas.width/truncatedArray.length;
						barSpacing = 1;	
						for(var i = 0; i < truncatedArray.length; i++){
							var heightScale = truncatedArray[i]/255.0;
							switch(this.appearance){
								case "Rectangular":
									background.ctx.fillRect(background.canvas.width/2 + i*(barWidth + barSpacing), verticalSpacing + this.height - this.height*heightScale, barWidth, 2*this.height*heightScale);
									background.ctx.fillRect(background.canvas.width/2 - i*(barWidth + barSpacing), verticalSpacing + this.height - this.height*heightScale, barWidth, 2*this.height*heightScale);
								break;

								case "Rounded" :
									fillRoundedRect(background.canvas.width/2 + i*(barWidth + barSpacing), verticalSpacing + this.height - this.height*heightScale, barWidth, 2*this.height*heightScale, background.ctx);
									fillRoundedRect(background.canvas.width/2 - i*(barWidth + barSpacing), verticalSpacing + this.height - this.height*heightScale, barWidth, 2*this.height*heightScale, background.ctx); 
								break;

								case "Line":
									background.ctx.fillRect(background.canvas.width/2 + i*(barWidth + barSpacing), verticalSpacing + this.height - this.height*heightScale, 2, 2*this.height*heightScale);
									background.ctx.fillRect(background.canvas.width/2 - i*(barWidth + barSpacing), verticalSpacing + this.height - this.height*heightScale, 2, 2*this.height*heightScale);
								break;
							}
						}
						background.ctx.restore();
					}
					else{
						barWidth = canvas.width/frequencyData.length;
						barSpacing = 1;
						var y = 0;

						ctx.save();
						ctx.fillStyle = this.color;

						for(var i=0; i<frequencyData.length; i++) { 
							var heightScale = frequencyData[i]/255.0;

							// need to draw top to bottom still, so we move our top in reaction to the height of each bar
							if(this.location === "Bottom"){
								y = canvas.height - this.height*heightScale;
							}

							switch(this.appearance){
								case "Rectangular":
									ctx.fillRect(i*(barWidth + barSpacing), y, barWidth, this.height*heightScale);
								break;

								case "Rounded" :
									fillRoundedRect(i*(barWidth + barSpacing), y, barWidth, this.height*heightScale, ctx); 
								break;

								case "Line":
									ctx.fillRect(i*(barWidth + barSpacing), y, 2, this.height*heightScale);
								break;
							}
						}
							ctx.restore();		
					}

					// essentially a draw rect with a border radius
					// I could have used arcTo instead of quadraticCurveTo, but.. meh?
					function fillRoundedRect(x, y, width, height, ctx) {
						if(height === 0 || width === 0)
							return;    					
    					var radius = 5;

  						ctx.beginPath();
  						ctx.moveTo(x + radius, y);
  						ctx.lineTo(x + width - radius, y);
  						ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  						ctx.lineTo(x + width, y + height - radius);
  						ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  						ctx.lineTo(x + radius, y + height);
  						ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  						ctx.lineTo(x, y + radius);
  						ctx.quadraticCurveTo(x, y, x + radius, y);
  						ctx.closePath();
  						ctx.fill();
					}		

				},
				enabled:true,
				location: "Background", // Center (wrapped around circle), Bottom, Top, Background
				height: 300,
				appearance: "Rounded", // Rectangular, Rounded, Line
				color: "black",

			},
			
			// post processing effects
			invert: false,
			greyscale: false,
			//lyrics : false, // stretch goal.

			// draws all the postprocessing effects that impact all canvases
			// fortunately we can process them all in the same loop since they're identical
			postprocess: function(){
				var mainImageData = ctx.getImageData(0,0,canvas.width,canvas.height);
				var midgroundImageData = midground.ctx.getImageData(0,0,canvas.width,canvas.height);
				var foregroundImageData = foreground.ctx.getImageData(0,0,canvas.width,canvas.height);
				var backgroundImageData = background.ctx.getImageData(0,0,canvas.width, canvas.height);
				
				
				for(var i = 0; i < mainImageData.data.length; i+=4){

					// these are pretty straightforward, but the greyscale code creates a single aggregate value
					// to set r,g,b to to form a corresponding shade of grey
					// and invert flips r,g,b within the [0,255] range
					if(this.greyscale){
						var value = mainImageData.data[i]*0.2989 + mainImageData.data[i+1]*.970 + mainImageData.data[i+2]*0.1140;
						mainImageData.data[i] = mainImageData.data[i+1] = mainImageData.data[i+2] = mainImageData.data[i+3] = value;

						value = midgroundImageData.data[i]*0.2989 + midgroundImageData.data[i+1]*.970 + midgroundImageData.data[i+2]*0.1140;
						midgroundImageData.data[i] = midgroundImageData.data[i+1] = midgroundImageData.data[i+2] = midgroundImageData.data[i+3] = value;

						value = backgroundImageData.data[i]*0.2989 + backgroundImageData.data[i+1]*.970 + backgroundImageData.data[i+2]*0.1140;
						backgroundImageData.data[i] = backgroundImageData.data[i+1] = backgroundImageData.data[i+2] = backgroundImageData.data[i+3] = value;

						value = foregroundImageData.data[i]*0.2989 + foregroundImageData.data[i+1]*.970 + foregroundImageData.data[i+2]*0.1140;
						foregroundImageData.data[i] = foregroundImageData.data[i+1] = foregroundImageData.data[i+2] = foregroundImageData.data[i+3] = value;
					}
					if(this.invert){
						var red = mainImageData.data[i], green = mainImageData.data[i+1], blue = mainImageData.data[i+2];
						mainImageData.data[i] = 255 - red;	// set red value
						mainImageData.data[i+1] = 255 - green; // set green value
						mainImageData.data[i+2] = 255 - blue; // set blue value

						red = midgroundImageData.data[i], green = midgroundImageData.data[i+1], blue = midgroundImageData.data[i+2];
						midgroundImageData.data[i] = 255 - red;	// set red value
						midgroundImageData.data[i+1] = 255 - green; // set green value
						midgroundImageData.data[i+2] = 255 - blue; // set blue value

						red = foregroundImageData.data[i], green = foregroundImageData.data[i+1], blue = foregroundImageData.data[i+2];
						foregroundImageData.data[i] = 255 - red;	// set red value
						foregroundImageData.data[i+1] = 255 - green; // set green value
						foregroundImageData.data[i+2] = 255 - blue; // set blue value

						red = backgroundImageData.data[i], green = backgroundImageData.data[i+1], blue = backgroundImageData.data[i+2];
						backgroundImageData.data[i] = 255 - red;	// set red value
						backgroundImageData.data[i+1] = 255 - green; // set green value
						backgroundImageData.data[i+2] = 255 - blue; // set blue value
					}

				}


				ctx.putImageData(mainImageData,0,0);
				midground.ctx.putImageData(midgroundImageData,0,0);
				background.ctx.putImageData(backgroundImageData,0,0);
				foreground.ctx.putImageData(foregroundImageData,0,0);
			}
			

		};

		// prevent things from being added after initialization
		Object.seal(this);
		initialized = true;

	};

	obj.isInitialized = function(){
		return initialized;
	};

	// main rendering update
	obj.update = function(){

		var frequencyData = application.audio.getFrequencyData();
		var waveformData = application.audio.getWaveformData();

		// clear the canvases for drawing
		// the midground canvas fades slowly instead of clearing
		ctx.clearRect(0,0,canvas.width,canvas.width);
		background.ctx.clearRect(0,0,background.canvas.width, background.canvas.height);
		foreground.ctx.clearRect(0,0,background.canvas.width, background.canvas.height);
		var middata = midground.ctx.getImageData(0,0, midground.canvas.width, midground.canvas.height);
		for(var i = 3; i < middata.data.length; i+=4){
			middata.data[i] *= .8;
		}
		midground.ctx.putImageData(middata, 0, 0);


		// draw our visualizations
		this.visualization.particles.draw(frequencyData);
		this.visualization.bezierCurves.draw(frequencyData);
		this.visualization.waveformLines.draw(waveformData);
		this.visualization.eqBars.draw(frequencyData);

		// center frequency circles
		for(var i = 0; i < frequencyData.length; i++){
			var scale = frequencyData[i]/255.0;
			//draw center circles
			ctx.beginPath();
			ctx.fillStyle = makeColor(0, 0, 0, .50 - scale/10.0);
			ctx.arc(canvas.width/2, canvas.height/2, 100+ 100*scale, 0, 2*Math.PI, false);
			ctx.fill();
			ctx.closePath();

		}
		
		// top circle that always remains
		ctx.beginPath();
		ctx.fillStyle = "black";
		ctx.arc(canvas.width/2, canvas.height/2, 50, 0, 2*Math.PI, false);
		ctx.fill();
		ctx.closePath();

		// postprocessing
		this.visualization.postprocess();
	};

	return obj;
}();

	// HELPERS

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

	// particle system constructor & such
	// adapted from the particle system from boomshine, sort of?

	var particlesystem = (function(){

		var particleSystem = function(){
			this.numParticles = 500;
			this.xRange = 4;
			this.yRange = 4;
			this.minXspeed = 1;
			this.maxXspeed = 30;
			this.minYspeed = 1;
			this.maxYspeed = 30;
			this.startRadius = 1;
			this.expansionRate = 0.05;
			this.decayRate = 1.5;
			this.lifetime = 300;
			this.red = 0;
			this.green = 0;
			this.blue =255;
			this.dead = false; 	// if all of our particles have reached the end of their lifetime
								// this system can safely be recycled or destroyed

			this.particles = undefined;

			Object.seal(this);
		}

		var p = particleSystem.prototype;

		p.createParticles = function(particleSystemPoint){
			this.particles = [];
			for(var i = 0; i < this.numParticles; i++){
				// create a particle object and add to array
				var p = {};
				this.particles.push(initParticle(this,p,particleSystemPoint));
			}
			this.dead = false;
		};

		p.update = function(particleSystemPoint){
			if(this.dead)
				return;
			var dead = true;
		
			this.particles.forEach(function(p){
				p.age += this.decayRate;
				p.r += this.expansionRate;
				p.x += p.xSpeed *(1- p.age/this.lifetime); // slowdown as aging
				p.y += p.ySpeed *(1- p.age/this.lifetime);

				// if the particle is still alive, not dead yet
				if(p.age < this.lifetime){
					dead = false;
				}
			}.bind(this));

			if(dead){
				this.dead = true;
				// kill our particles, we don't need 'em where we're going..
				this.particles = [];
			}					
		};


		p.draw = function(ctx){

			ctx.save();
			this.particles.forEach(function(p){
				var alpha = 1;
				if(p.age > 50)
					alpha = 1 - (p.age-50)/(this.lifetime-50);
				ctx.fillStyle = makeColor(this.red, this.green, this.blue, alpha); 
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.r, Math.PI * 2, false);
				ctx.closePath();
				ctx.fill();
			}.bind(this));
			ctx.restore();

		};

		var initParticle = function(obj, p, particleSystemPoint){

			// give it a random age when first created
			p.age = getRandom(0,obj.lifetime);
				
			p.x = particleSystemPoint.x + getRandom(-obj.xRange, obj.xRange);
			p.y = particleSystemPoint.y + getRandom(0, obj.yRange);
			p.r = getRandom(obj.startRadius/2, obj.startRadius); // radius
			// expand in a circle
			var vec = getRandomUnitVector();
			p.xSpeed = vec.x*getRandom(obj.minXspeed, obj.maxXspeed);
			p.ySpeed = vec.y*getRandom(obj.minYspeed, obj.maxYspeed);
			return p;

		};

		return particleSystem;

	}());


