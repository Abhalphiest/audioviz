"use strict"
var application = application || {};

application.input=function(){

}();


application.particlesystem=function(){

	function particlesystem(){
		// public
		this.numParticles = 25;
		this.useCircles = true;
		this.useSquares = false;
		this.xRange = 4;
		this.yRange = 4;
		this.minXspeed = -1;
		this.maxXspeed = 1;
		this.minYspeed = 2;
		this.maxYspeed = 4;
		this.startRadius = 4;
		this.expansionRate = 0.3
		this.decayRate = 2.5;
		this.lifetime = 100;
		this.fillStyle = "black";
		
		// private
		this._particles = undefined;
	};
	
	
	// "public" methods
	var p=particlesystem.prototype;
	
	p.createParticles = function(particlesystemPoint){
		// initialize particle array
		this._particles = [];
				
		// create exhaust particles
		for(var i=0; i< this.numParticles; i++){
			// create a particle object and add to array
			var p = {};
			this._particles.push(_initParticle(this, p, particlesystemPoint));
		}

	};
	
	p.updateAndDraw = function(ctx, particlesystemPoint){
			/* move and draw particles */
			// each frame, loop through particles array
			// move each particle down screen, and slightly left or right
			// make it bigger, and fade it out
			// increase its age so we know when to recycle it
			
			for(var i=0;i<this._particles.length;i++){
				var p = this._particles[i];
							
				p.age += this.decayRate;
				p.r += this.expansionRate;
				p.x += p.xSpeed
				p.y += p.ySpeed
				var alpha = 1 - p.age/this.lifetime;
				
				if(this.useSquares){
					// fill a rectangle	
					ctx.fillStyle = "rgba(" + this.red + "," + this.green + "," + 			
					this.blue + "," + alpha + ")"; 
					ctx.fillRect(p.x, p.y, p.r, p.r);
					// note: this code is easily modified to draw images
				}
				
				if(this.useCircles){
					// fill a circle
					ctx.fillStyle = "rgba(" + this.red + "," + this.green + "," + 			
					this.blue + "," + alpha + ")"; 
			
					ctx.beginPath();
					ctx.arc(p.x, p.y, p.r, Math.PI * 2, false);
					ctx.closePath();
					ctx.fill();
				}
							
				// if the particle is too old, recycle it
				if(p.age >= this.lifetime){
					_initParticle(this, p, particlesystemPoint);
				}		
			} // end for loop of this._particles
	} // end updateAndDraw()
			
	// "private" method
	function _initParticle(obj, p, particlesystemPoint){
		
		// give it a random age when first created
		p.age = getRandom(0,obj.lifetime);
				
		p.x = particlesystemPoint.x + getRandom(-obj.xRange, obj.xRange);
		p.y = particlesystemPoint.y + getRandom(0, obj.yRange);
		p.r = getRandom(obj.startRadius/2, obj.startRadius); // radius
		p.xSpeed = getRandom(obj.minXspeed, obj.maxXspeed);
		p.ySpeed = getRandom(obj.minYspeed, obj.maxYspeed);
		return p;
	};
	
	
	return particlesystem;
}();