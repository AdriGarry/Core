#!/usr/bin/env node

// Module de gestion des leds

var Gpio = require('onoff').Gpio;
var CronJob = require('cron').CronJob;

var self = this;

/** Fonction clignotement
 * @param config : {
 * 		leds : ['eye', 'satellite'...]
 *		speed : number (50 - 200)
 *		loop : number (<1)
 }
 */
var blink = function(config){
	// console.info(config);
	try{
		var etat = 1, loop;
		if(config.hasOwnProperty('leds')){
			// config.hasOwnProperty('loop')
			setTimeout(function(){
				for(var led in config.leds){
					// console.log(config.leds[led] + '  => END');
					eval(config.leds[led]).write(0);
				}
			}, config.speed * config.loop * 2 +50);
			for(loop = config.loop * 2; loop > 0; loop--){
				setTimeout(function(leds){
					for(var i in leds){
						var led = leds[i]
						// console.log('led : ' + led);
						eval(led).write(etat);
					}
					etat = 1 - etat; // VOIR POUR ALTERNER ??
				}, config.speed * loop, config.leds);
			}
		}
	}catch(e){
		console.error(e);
	}
};
exports.blink = blink;

/** Function to toggle a led
 * @param config : {
 * 		led : 'eye'
 *		mode : true/false
 }
 */
var toggle = function(config){
	// console.info('toogle() ' + config.led + (config.mode ? ' on':' off'));
	if(['nose', 'eye', 'satellite', 'belly'].indexOf(config.led) > -1){
		eval(config.led).write(config.mode? 1 : 0);
	}
	/*try{
	}catch(e){
		console.error(e);
	}*/

};
exports.toggle = toggle;


/** Fonction activity : temoin mode programme (normal/veille) */
var activity = function(mode){
	if(typeof mode === 'undefined') mode = 'awake';
	console.log('Led Activity initialised [' + mode + ']');
	mode = parseInt(mode, 10);
	if(mode > 0){
		mode = 0;
	}else{
		
		mode = 1;
	}
	setInterval(function(){
		led.write(mode);
	}, 1000);

	new CronJob('*/3 * * * * *', function(){
		// leds.blinkLed(300, 1); // Initialisation du temoin d'activite 2/2
		self.blink({leds: ['nose'], speed: 200, loop: 1}); // Initialisation du temoin d'activite 2/2
	}, null, 1, 'Europe/Paris');
};
exports.activity = activity;


var timer;
/** Fonction verification de la config blink LEDS  */
var findOne = function (haystack, arr){
	return arr.some(function (v){
		return haystack.indexOf(v) >= 0;
	});
};


/** Fonction clignotement alterne Oeil/Ventre */
var altLeds = function(speed, duration){
	clearInterval(timer);
	var etat = 1;
	timer = setInterval(function(){
			eye.write(etat);
			etat = 1 - etat;
			belly.write(etat);
	}, speed);
	var stopTimer = setTimeout(function(){
		clearInterval(timer);
		eye.write(0);
		belly.write(0);
	}, duration*1000);
};
exports.altLeds = altLeds;

/** Fonction annulation clignotements */
var clearLeds = function(){
	clearInterval(timer);
};
exports.clearLeds = clearLeds;

/** Fonction temoin pression bouton */
var buttonPush = function(param){
	if(param == 'stop'){
		belly.write(0);
	}else{
		belly.write(1);
		setInterval(function(){
			belly.write(1);
		}, 300);
		setTimeout(function(){
			belly.write(1);
		}, 1000);		
	}
};
exports.buttonPush = buttonPush;

/** Fonction allumage Led */
var ledOn = function(led){
	if(led == 'led'){
		led.write(1);
	}else if(led == 'eye'){
		eye.write(1);
	}else if(led == 'belly'){
		belly.write(1);
	}else if(led == 'satellite'){
		satellite.write(1);
	}
};
exports.ledOn = ledOn;

/** Fonction extinction Led */
var ledOff = function(led){
	if(led == 'led'){
		led.write(0);
	}else if(led == 'eye'){
		eye.write(0);
	}else if(led == 'belly'){
		belly.write(0);
	}else if(led == 'satellite'){
		satellite.write(0);
	}
};
exports.ledOff = ledOff;

/** Fonction extinction all Leds */
var allLedsOff = function(){
	eye.write(0);
	belly.write(0);
	satellite.write(0);
	led.write(0);
};
exports.allLedsOff = allLedsOff;

/** Fonction allumage all Leds */
var allLedsOn = function(){
	eye.write(1);
	belly.write(1);
	satellite.write(1);
	led.write(1);
};
exports.allLedsOn = allLedsOn;