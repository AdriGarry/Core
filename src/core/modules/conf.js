#!/usr/bin/env node
'use strict';

var Odi = require(ODI_PATH + 'src/core/Odi.js').Odi;
var log = new (require(Odi._CORE + 'Logger.js'))(__filename);

var Flux = require(Odi._CORE + 'Flux.js');
var spawn = require('child_process').spawn;

Flux.module.sound.subscribe({
	next: flux => {
		if (flux.id == 'update') {
		} else if (flux.id == 'updateDefault') {
		} else if (flux.id == 'reset') {
		}else Odi.error('unmapped flux in Time service', flux, false);
	},
	error: err => {
		Odi.error(flux);
	}
});

var muteTimer, delay;
/** Function to mute Odi (delay:min) */
function mute(args) {
	clearTimeout(muteTimer);
	if (!args) args = {};
	// console.log(args);
	if (args.hasOwnProperty('delay') && Number(args.delay)) {
		muteTimer = setTimeout(function() {
			spawn('sh', [Odi._SHELL + 'mute.sh', 'auto']);
			setTimeout(function() {
				stopAll(args.message || nul);
			}, 1600);
		}, Number(args.delay) * 1000);
	} else {
		stopAll(args.message || null);
	}
}

/** Function to stop all sounds & leds */
function stopAll(message) {
	Flux.next('module', 'tts', 'clearTTSQueue', null, null, null, 'hidden');
	Flux.next('service', 'music', 'stop', null, null, null, 'hidden'); // ODI.jukebox.stopFip();
	spawn('sh', [Odi._SHELL + 'mute.sh']);
	log.info('>> MUTE  -.-', message ? '"' + message + '"' : '');
	Flux.next('module', 'led', 'clearLeds', null, null, null, 'hidden');
	Flux.next('module', 'led', 'toggle', { leds: ['eye', 'belly'], value: 0 }, null, null, 'hidden');
}

function setVolume(volume) {}