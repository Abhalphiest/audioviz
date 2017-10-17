"use strict"

function getRandom(min, max) {
  	return Math.random() * (max - min) + min;
}

function makeColor(red, green, blue, alpha){
   	var color='rgba('+red+','+green+','+blue+', '+alpha+')';
   	return color;
}

function maxArrayValue(array){
	var max = array.reduce(function(a,b){
		return Math.max(a,b);
	});

	return max;
}

function minArrayValue(array){
	var min = array.reduce(function(a,b){
		return Math.min(a,b);
	});

	return min;
}

function avgArrayValue(array){
	if(array.length === 0)
		return 0;
	var sum = array.reduce(function(a,b){
		return a+b;
	});
	sum /= array.length;
	return sum;
}

function trimTrailingZeroes(array){
	arr = array.slice();
	var populatedLength = Number(arr.slice().reverse().join("")).toString().length;
	arr.length = populatedLength;
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