#!/usr/bin/env node
'use strict';

var Odi = require(ODI_PATH + 'src/core/Odi.js').Odi;
var log = new (require(Odi._CORE + 'Logger.js'))(__filename);
var Flux = require(Odi._CORE + 'Flux.js');
var spawn = require('child_process').spawn;

Flux.service.music.subscribe({
	next: flux => {
		if(flux.id == 'jukebox'){
			jukebox();
		}else if(flux.id == 'fip'){
			playFip();
		}else if(flux.id == 'stop'){
			stop();
		}else Odi.error('unmapped flux in Time service', flux, false);
	},
	error: err => {
		Odi.error(flux);
	}
});

var playing, ledMusicFlag;
function ledFlag(){
	ledMusicFlag = setInterval(function(){
		if(playing){
			Flux.next('module', 'led', 'altLeds', {speed: 100, duration: 1.3});
		}
	}, 13*1000);
}

/** Function jukebox (repeat) */
function jukebox(message){
	Flux.next('module', 'sound', 'mute');
	setTimeout(function(){
		log.info('Jukebox in loop mode !');
		spawn('sh', [Odi._SHELL + 'jukebox.sh']);
		Flux.next('module', 'sound', 'mute', {message: 'Auto mute jukebox !'}, 60*60)
	}, 500);
};

/** Function medley jukebox (repeat) */
function medley(message){
	Flux.next('module', 'sound', 'mute');
	setTimeout(function(){
		log.info('Jukebox in medley mode !');
		spawn('sh', [Odi._SHELL + 'jukebox.sh', 'medley']);
		Flux.next('module', 'sound', 'mute', {message: 'Auto mute jukebox !'}, 60*60)
	}, 300);
};

var playingFip = false, fipInterval;
/** Function to play FIP radio */
function playFip(){
	if(!playingFip){
		log.info('Play FIP RADIO...');
		// spawn('sh', ['/home/pi/odi/core/sh/fip.sh']);
		spawn('sh', [Odi._SHELL + 'fip.sh']);
		playingFip = true;
		Flux.next('module', 'led', 'altLeds', {speed: 100, duration: 1.3});

		// log.info('playFip()> playingFip', playingFip);

		//cancel.watch(function(err, value){ // TODO : remove ???
			//clearInterval(fipInterval);
		// 	playingFip = false;
		// });
	}else{
		log.info('Already playing FIP');
	}

	setTimeout(function(){
		stopFip();
	}, 60*60*1000);
	Flux.next('module', 'sound', 'mute', {message: 'Auto Mute FIP'}, 60*60)
};

/** Function to stop FIP radio */
function stop(message){
	if(playingFip){
		// log.info('playFip()> playingFip', playingFip);
		log.info('Stop FIP RADIO.');
		log.debug(message || 'Stoping FIP RADIO.');
	}
	playingFip = false;
	clearInterval(fipInterval);
	Flux.next('module', 'led', 'toggle', {leds: ['eye', 'belly'], value: 0}, null, null, true);
	Flux.next('module', 'led', 'clearLeds', {speed: 100, duration: 1.3}, null, null, true);
};
