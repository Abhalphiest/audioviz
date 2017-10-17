"use strict";
var application = application || {};

application.visualizer = function(){
	var obj = {};
	var initialized = false;
	var canvas, midground, foreground, background;
	var ctx;
	obj.initializeVisualizer = function(){

		if(initialized)
			return;

		// set up canvas stuff
		canvas = document.querySelector("#mainCanvas");
		ctx = canvas.getContext("2d");

		// // topmost layer, for overlays
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

						if(this.trailEffect){
							//console.log('drawing trails');
							midground.ctx.lineWidth = 100;
							drawQuadCurve(midground.ctx, -canvas.width/2, canvas.height/2, canvas.width/4+ this.controlPointOffset, 
									canvas.height/2 + scale*this.maxCurveHeight, canvas.width/2, canvas.height/2, this.color, false);
							drawQuadCurve(midground.ctx, -canvas.width/2, canvas.height/2, canvas.width/4+ this.controlPointOffset, 
									canvas.height/2 - scale*this.maxCurveHeight, canvas.width/2, canvas.height/2, this.color, false);
							drawQuadCurve(midground.ctx, canvas.width/2, canvas.height/2, 3*canvas.width/4- this.controlPointOffset, 
									canvas.height/2 + scale*this.maxCurveHeight, 3*canvas.width/2, canvas.height/2, this.color, false);
							drawQuadCurve(midground.ctx, canvas.width/2, canvas.height/2, 3*canvas.width/4- this.controlPointOffset, 
									canvas.height/2 - scale*this.maxCurveHeight, 3*canvas.width/2, canvas.height/2, this.color, false);
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
			particles:{
				draw: function(frequencyData){
					if(!this.enabled)
						return;
					var r1 = frequencyData.slice(0, 31);
					var r2 = frequencyData.slice(31, 81);
					var r3 = frequencyData.slice(100, 121);
					var newAvg1= avgArrayValue(r1);
					var newAvg2= avgArrayValue(r2);
					var newAvg3= avgArrayValue(r3);
					var commonfrequences = frequencyData.slice(0, 121);
					var avgfreq= avgArrayValue(commonfrequences);

					var newAvg = Math.max(newAvg1, newAvg2, newAvg3);
					var diff, color;

					if(newAvg === newAvg1){
						diff = newAvg1 - this.prevAvg1;
						color = this.colors[0];
					}else if(newAvg === newAvg2){
						diff = newAvg2 - this.prevAvg2;
						color = this.colors[1];
					}else{
						diff = newAvg3 - this.prevAvg3;
						color = this.colors[2];
					}
					//console.dir(frequencyData);
					//console.log(newAvg + " " + diff);
					if(diff >= 5 && (newAvg > avgfreq + 50 || newAvg > 100)){
						let i = 0;
						for(; i < this.particleSystems.length; i++){

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
					this.prevAvg1 = newAvg1;
					this.prevAvg2 = newAvg2;
					this.prevAvg3 = newAvg3;
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
				prevAvg1: 0,
				prevAvg2: 0,
				prevAvg3: 0,
			},
			waveformLines:{
				draw: function(waveformData){
					foreground.ctx.clearRect(0,0, foreground.canvas.width, foreground.canvas.height);
					if(!this.enabled)
						return;

					var x,y;
					var offset, reverseoffset, angleStep, theta, radius;
					offset = [];
					reverseoffset = [];
					for (var i = 0; i < waveformData.length; i++){
								
						// average with previous data to smooth the value
						offset[i] = ((waveformData[i]/128.0 - 1) + this.prevOffset[i])/2;
					}

					this.prevOffset = offset;
					reverseoffset = offset.slice().reverse();
					offset=offset.concat(reverseoffset);
					switch(this.location){
						case "Background":
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
						case "Center":
							// wiggly circle thing
							ctx.save();
							angleStep = Math.PI/waveformData.length;
							theta = 0;
							radius = 250;
							ctx.fillStyle = this.color;
							ctx.beginPath();
							for(var i = 0; i < waveformData.length; i++){
								// average with previous data to smooth the value
								offset[i] = ((waveformData[i]/128.0 - 1) + this.prevOffset[i])/2;
							}
							for(var i = 0; i < offset.length; i++){
								x = canvas.width/2+Math.cos(theta)*(radius + offset[i]*this.scale);
								y = canvas.height/2+Math.sin(theta)*(radius +offset[i]*this.scale);

								if(i === 0)
									ctx.moveTo(x,y);
								else
									ctx.lineTo(x,y);
								theta+=angleStep;
							}
							ctx.fill();
							ctx.closePath();
							ctx.restore();
						break;
						case "Overlay":
							foreground.ctx.save();
							// wiggly circle thing
							angleStep = Math.PI/waveformData.length;
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
							foreground.ctx.lineTo(canvas.width/2+radius+ offset[i]*this.scale, canvas.height/2);
							foreground.ctx.stroke();
							foreground.ctx.closePath();
							foreground.ctx.restore();
						break;
				}

				},
				enabled:false,
				scale: 300,
				location: "Background", // Center (wrapped around circle), Background, Overlay
				color: "blue",
				prevOffset: new Array(128).fill(0),

			},
			eqBars:{
				draw: function(frequencyData){
					if(!this.enabled)
						return;

					var barWidth;
					var barSpacing;

					if(this.location === "Center"){

					}
					else if(this.location === "Background"){
						background.ctx.save();
						background.ctx.fillStyle = this.color;
						var verticalSpacing = canvas.height/2 - this.height;
						var truncatedArray = [].slice.call(frequencyData);
						truncatedArray.length = frequencyData.length/2;

						barWidth = canvas.width/truncatedArray.length;
						barSpacing = 1;	
						//console.log(barWidth);		
						for(var i = 0; i < truncatedArray.length; i++){
							var heightScale = truncatedArray[i]/255.0;
							switch(this.appearance){
								case "Rectangular":
									background.ctx.fillRect(background.canvas.width/2 + i*(barWidth + barSpacing), verticalSpacing + this.height - this.height*heightScale, barWidth, 2*this.height*heightScale);
									background.ctx.fillRect(background.canvas.width/2 - i*(barWidth + barSpacing), verticalSpacing + this.height - this.height*heightScale, barWidth, 2*this.height*heightScale);
								break;

								case "Rounded" :
									fillEllipse(background.canvas.width/2 + i*(barWidth + barSpacing), verticalSpacing + this.height - this.height*heightScale, barWidth, 2*this.height*heightScale, background.ctx);
									fillEllipse(background.canvas.width/2 - i*(barWidth + barSpacing), verticalSpacing + this.height - this.height*heightScale, barWidth, 2*this.height*heightScale, background.ctx); 
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
							if(this.location === "Bottom"){
								y = canvas.height - this.height*heightScale;
							}

							switch(this.appearance){
								case "Rectangular":
									ctx.fillRect(i*(barWidth + barSpacing), y, barWidth, this.height*heightScale);
								break;

								case "Rounded" :
									fillEllipse(i*(barWidth + barSpacing), y, barWidth, this.height*heightScale, ctx); 
								break;

								case "Line":
									ctx.fillRect(i*(barWidth + barSpacing), y, 2, this.height*heightScale);
								break;
							}
						}
							ctx.restore();		
					}

					function fillEllipse(x,y,width,height, context){
						context.beginPath();
						context.ellipse(x+width/2,y+height/2,width,height,0, 0, Math.PI*2, false);
						context.fill();
						context.closePath();
					}			

				},
				enabled:true,
				location: "Background", // Center (wrapped around circle), Bottom, Top, Background
				height: 300,
				appearance: "Rectangular", // Rectangular, Rounded, Line
				color: "black",

			},
			dynamicBG:{
				draw: function(frequencyData){
					background.ctx.clearRect(0,0,background.canvas.width, background.canvas.height);
					if(!this.enabled)
						return;

					switch(this.type)
					{
						case "Gradient":

							break;
						case "Video":

							break;
						case "Spectogram":
							// var spectOffset = 0;
							// var slice = ctx.getImageData(0,spectOffset, canvas.width, 1);
							// for(var i = 0; i < frequencyData.length; i++)
							// {
							// 	slice.data[4* i+0] = frequencyData[i]; // R
							// 	slice.data[4 * i + 1] = frequencyData[i] // G
    			// 				slice.data[4 * i + 2] = frequencyData[i] // B
    			// 				slice.data[4 * i + 3] = 255         // A
							// }
							// ctx.putImageData(slice, 0, spectOffset);
							// spectOffset++;
							// spectOffset%= canvas.height;
							break;
					}
				},
				enabled:false,
				type: "Spectogram", // Gradient, Video, Spectogram
			},

			// post processing effects
			invert: false,
			greyscale: false,
			//lyrics : false, // stretch goal.. 
			postprocess: function(){
				var mainImageData = ctx.getImageData(0,0,canvas.width,canvas.height);
				var midgroundImageData = midground.ctx.getImageData(0,0,canvas.width,canvas.height);

				var data = mainImageData.data;
				var middata = midgroundImageData.data;
				for(var i = 0; i < data.length; i+=4){
					if(this.greyscale){
						var value = data[i]*0.2989 + data[i+1]*.970 + data[i+2]*0.1140;
						data[i] = data[i+1] = data[i+2] = data[i+3] = value;

						value = middata[i]*0.2989 + middata[i+1]*.970 + middata[i+2]*0.1140;
						middata[i] = middata[i+1] = middata[i+2] = middata[i+3] = value;
					}
					if(this.invert){
						var red = data[i], green = data[i+1], blue = data[i+2];
						data[i] = 255 - red;	// set red value
						data[i+1] = 255 - green; // set green value
						data[i+2] = 255 - blue; // set blue value

						red = middata[i], green = middata[i+1], blue = middata[i+2];
						middata[i] = 255 - red;	// set red value
						middata[i+1] = 255 - green; // set green value
						middata[i+2] = 255 - blue; // set blue value
					}

				}

				ctx.putImageData(mainImageData,0,0);
				midground.ctx.putImageData(midgroundImageData,0,0);
			}
			

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

		//console.log("max: " + maxArrayValue(frequencyData) + " min: " + minArrayValue(frequencyData) + " avg: " + avgArrayValue(frequencyData));

		// clear the screen for drawing
		ctx.clearRect(0,0,canvas.width,canvas.width);
		var middata = midground.ctx.getImageData(0,0, midground.canvas.width, midground.canvas.height);
		//console.log(middata);
		for(var i = 3; i < middata.data.length; i+=4){
			middata.data[i] *= .8;
			//console.log(middata.data[i]);
		}
		//console.dir(middata);
		midground.ctx.putImageData(middata, 0, 0);

		this.visualization.dynamicBG.draw(frequencyData);
		this.visualization.particles.draw(frequencyData);
		this.visualization.bezierCurves.draw(frequencyData);
		this.visualization.waveformLines.draw(waveformData);
		this.visualization.eqBars.draw(frequencyData);

		for(var i = 0; i < frequencyData.length; i++){
			var scale = frequencyData[i]/255.0;
			//draw center circles
			ctx.beginPath();
			ctx.fillStyle = makeColor(0, 0, 0, .50 - scale/10.0);
			ctx.arc(canvas.width/2, canvas.height/2, 100+ 100*scale, 0, 2*Math.PI, false);
			ctx.fill();
			ctx.closePath();

		}
		//draw top circle
		ctx.beginPath();
		ctx.fillStyle = "black";
		ctx.arc(canvas.width/2, canvas.height/2, 50, 0, 2*Math.PI, false);
		ctx.fill();
		ctx.closePath();

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
	// adapted from the particle system from boomshine

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
			this.dead = false;

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
			// this.particles is undefined?
			// console.dir(this.particles);
			// debugger;
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


