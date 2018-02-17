#!/usr/bin/env node
'use strict';

var Odi = require(ODI_PATH + 'src/core/Odi.js').Odi;
var log = new (require(Odi._CORE + 'Logger.js'))(__filename);
var Flux = require(Odi._CORE + 'Flux.js');
var Utils = require(ODI_PATH + 'src/core/Utils.js');
var spawn = require('child_process').spawn;
var fs = require('fs');
var os = require('os');

Flux.service.system.subscribe({
	next: flux => {
		if (flux.id == 'restart') {
			/* || flux.id == 'restartOdi'*/
			restartOdi(flux.value);
		} else if (flux.id == 'reboot') {
			reboot();
		} else if (flux.id == 'shutdown') {
			shutdown();
		} else Odi.error('unmapped flux in System service', flux, false);
	},
	error: err => {
		Odi.error(flux);
	}
});

/** Function to restart/sleep Odi's core */
function restartOdi(mode) {
	log.info('restarting Odi...', mode || '');
	Flux.next('module', 'conf', 'updateRestart', { mode: mode || 'ready' });
}

/** Function to reboot RPI */
function reboot() {
	if (Odi.conf.mode == 'ready') {
		Flux.next('module', 'sound', 'mute');
		Flux.next('module', 'tts', 'speak', { msg: 'Je redaimarre' });
	}
	console.log('_/!\\__REBOOTING RASPBERRY PI !!');
	setTimeout(function() {
		spawn('sh', [Odi._SHELL + 'power.sh', 'reboot']);
	}, 2000);
}

/** Function to shutdown RPI */
function shutdown() {
	if (Odi.conf.mode == 'ready') {
		Flux.next('module', 'sound', 'mute');
		Flux.next('module', 'tts', 'speak', { msg: 'Arret system' });
	}
	setTimeout(function() {
		console.log("\n\n /!\\  SHUTING DOWN RASPBERRY PI - DON'T FORGET TO SWITCH OFF POWER SUPPLY !!");
		spawn('sh', [Odi._SHELL + 'power.sh']);
	}, 2000);
}
