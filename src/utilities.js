"use strict"

// wrapper for random function
function getRandom(min, max) {
  	return Math.random() * (max - min) + min;
}

// makes css syntax rgba color from values
function makeColor(red, green, blue, alpha){
   	var color='rgba('+red+','+green+','+blue+', '+alpha+')';
   	return color;
}

// takes a css color in rgb, hsl, or hex format
// and returns a {r,g,b} object
// this function is the opposite of robust, but only I'm using it
// and can't justify the time in making it perfect
function parseToRGBValues(cssColor){
	var firstChar = cssColor.charAt(0);
	var scratchString;
	var result = {r:0, g: 0, b: 0};
	switch(firstChar){
		case 'r': // rgb
			// r - g - b - (
			// 0 - 1 - 2 - 3
			scratchString =  cssColor.substring(4, cssColor.length - 1); // from past the open parenthesis to up to 
			var values = scratchString.split(',')						 // but not including the closing parenthesis
			result.r = parseInt(values[0],10);
			result.g = parseInt(values[1],10);
			result.b = parseInt(values[2],10);
		break;

		case 'h': // hsl
			// h - s - l - (
			// 0 - 1 - 2 - 3
			scratchString =  cssColor.substring(4, cssColor.length - 1); // from past the open parenthesis to up to 
			var values = scratchString.split(',')						 // but not including the closing parenthesis

			values[0] = parseInt(values[0], 10)/360.0;
			values[1] = parseInt(values[1], 10)/100.0;
			values[2] = parseInt(values[2], 10)/100.0;

			result = hslToRgb(values[0], values[1], values[2]);
			result.r = Math.round(result.r);
			result.g = Math.round(result.g);
			result.b = Math.round(result.b);

    		function hslToRgb(h, s, l){ // from this cool person
    									// https://gist.github.com/mjackson/5311256
    			var r, g, b;

  				if (s == 0) {
    				r = g = b = l; // achromatic
  				} else {
    				function hue2rgb(p, q, t) {
      					if (t < 0) t += 1;
      					if (t > 1) t -= 1;
      					if (t < 1/6) return p + (q - p) * 6 * t;
      					if (t < 1/2) return q;
      					if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      					return p;
    				}

    				var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    				var p = 2 * l - q;

    				r = hue2rgb(p, q, h + 1/3);
   					g = hue2rgb(p, q, h);
    				b = hue2rgb(p, q, h - 1/3);
  					}

  				return { r: r * 255, g:  g * 255, b: b * 255 };
        	}
    
		break;

		case '#': // hex
			scratchString = css.Color.substring(1, cssColor.length); // leave out the octothorpe
			if(scratchString.length === 3){ // short hex
				result.r = parseInt(scratchString.charAt(0) + scratchString.charAt(0), 16);
				result.g = parseInt(scratchString.charAt(1) + scratchString.charAt(1),16);
				result.b = parseInt(scratchString.charAt(2) + scratchString.charAt(2),16);
			}
			else{ // long hex
				result.r = parseInt(scratchString.substring(0,2), 16);
				result.g = parseInt(scratchString.substring(2,4),16);
				result.b = parseInt(scratchString.substring(4,6),16);
			}

		break;
	}
		
	return result;			
}

// returns the maximum value in a numeric array
function maxArrayValue(array){
	var max = array.reduce(function(a,b){
		return Math.max(a,b);
	});

	return max;
}

// returns the minimum value in a numeric array
function minArrayValue(array){
	var min = array.reduce(function(a,b){
		return Math.min(a,b);
	});

	return min;
}

// returns the average of all values in a numeric array
function avgArrayValue(array){
	if(array.length === 0)
		return 0;
	var sum = array.reduce(function(a,b){
		return a+b;
	});
	sum /= array.length;
	return sum;
}

// truncates an array to remove trailing 0 values
// (ex: if an array is [1,1,0,2,0,1,0,0,0,0] this function returns [1,1,0,2,0,1])
function trimTrailingZeroes(array){
	// don't modify original array
	var arr = array.slice();
	// reverses the array then converts it to a number, which will remove *leading* zeroes (which used to be trailing zeroes)
	// then makes it a string and gets the length, so we know how many non-trailing zero elements we have to resize the original array
	// listen, I'm an assembly programmer, this is what passes as sanity. shhh.
	var populatedLength = parseInt(arr.slice().reverse().join(""),10).toString().length;
	arr.length = populatedLength;
	return arr;
}

function getRandomUnitVector(){
	var x = getRandom(-1,1);
	var y = getRandom(-1,1);
	var length = Math.sqrt(x*x + y*y);
	if(length == 0){ // very unlikely
		x=1; // point right
		y=0;
		length = 1;
	} else{
		x /= length;
		y /= length;
	}
	
	return {x:x, y:y};
}

// simple timeout 
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

// not even going to touch this one
function browserRagequit(){
	alert("Your browser has angered me, begone!");
}