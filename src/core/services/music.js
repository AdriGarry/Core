#!/usr/bin/env node
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');

const Core = require(_PATH + 'src/core/Core.js').Core,
	log = new (require(Core._CORE + 'Logger.js'))(__filename),
	Utils = require(Core._CORE + 'Utils.js'),
	RandomBox = require('randombox').RandomBox;

Core.flux.service.music.subscribe({
	next: flux => {
		if (flux.id == 'jukebox') {
			jukebox();
		} else if (flux.id == 'fip') {
			playFip();
		} else if (flux.id == 'fipOrJukebox') {
			playFipOrJukebox();
		} else if (flux.id == 'story') {
			playStory(flux.value);
		} else if (flux.id == 'stop') {
			stop();
		} else Core.error('unmapped flux in Music service', flux, false);
	},
	error: err => {
		Core.error(flux);
	}
});

// var ledMusicFlag;
// function ledFlag() {
// 	Core.do('interface|led|altLeds', { speed: 100, duration: 1.3 });
// 	ledMusicFlag = setInterval(function() {
// 		if (Core.run('music')) {
// 			Core.do('interface|led|altLeds', { speed: 100, duration: 1.3 }, { hidden: true });
// 		} else {
// 			clearInterval(ledMusicFlag);
// 		}
// 	}, 13 * 1000);
// }

/** Function jukebox (repeat for one hour) */
function jukebox(message) {
	stop();
	log.info('Jukebox in loop mode !');
	Core.run('music', 'jukebox');
	ledFlag();
	repeatSong();
	Core.do('interface|sound|mute', { message: 'Auto mute jukebox !', delay: 2 }, { delay: 60 * 60 });
}

var jukeboxTimeout, jukeboxRandomBox;

// var JUKEBOX_SONGS;
fs.readdir(Core._MP3 + 'jukebox', (err, files) => {
	// JUKEBOX_SONGS = files;
	jukeboxRandomBox = new RandomBox(files);
	// console.log('JUKEBOX_SONGS', JUKEBOX_SONGS);
});

function repeatSong() {
	log.info('next song...');
	// let song = Utils.randomItem(JUKEBOX_SONGS);
	let song = jukeboxRandomBox.next();
	let ttime = new Date();
	Utils.getMp3Duration(Core._MP3 + 'jukebox/' + song, function(duration) {
		console.log(Utils.executionTime(ttime));
		// log.INFO('duration=' + duration);
		Core.do('interface|sound|play', { mp3: 'jukebox/' + song, duration: duration });
		jukeboxTimeout = setTimeout(function() {
			// log.INFO('Next song !!!', 'duration=' + duration);
			repeatSong();
		}, duration * 1000);
	});
}

/** Function to play FIP radio */
function playFip() {
	stop();
	log.info('Play FIP RADIO...');
	Core.do('interface|sound|play', { url: 'http://chai5she.cdn.dvmr.fr/fip-midfi.mp3' });
	Core.run('music', 'fip');
	// ledFlag(); // TODO ...?
	Core.do('interface|sound|mute', { message: 'Auto Mute FIP', delay: 2 }, { delay: 60 * 60 });
}

/** Function to stop music */
function stop() {
	console.log(Core.run('music'));
	if (Core.run('music')) {
		log.debug('Stop music');
		clearTimeout(jukeboxTimeout);
		// clearInterval(ledMusicFlag);
		// Core.do('interface|sound|mute');
		Core.run('music', false);
		Core.do('interface|led|toggle', { leds: ['eye', 'belly'], value: 0 }, { hidden: true });
		Core.do('interface|led|clearLeds', { speed: 100, duration: 1.3 }, { hidden: true });
	} else {
		log.debug('No music playing');
	}
}

function playFipOrJukebox() {
	log.info('playFipOrJukebox...');
	Utils.testConnexion(function(connexion) {
		setTimeout(function() {
			if (connexion == true) {
				playFip();
			} else {
				jukebox();
			}
		}, 3000);
	});
}

/** Function to play a story */
const STORIES = ['stories/Donjon-De-Naheulbeuk.mp3', 'stories/Aventuriers-Du-Survivaure.mp3'];
function playStory(story) {
	Core.do('interface|tts|speak', { lg: 'en', msg: 'story' });
	log.debug('Play story...', story);
	let storyToPlay = Utils.searchStringInArray(story, STORIES);
	if (storyToPlay) {
		Core.do('interface|sound|mute');
		Core.run('music', 'story');
		// ledFlag();
		Core.do('interface|sound|playRandom', { mp3: storyToPlay });
	} else {
		Core.do('interface|tts|speak', { lg: 'en', msg: 'error story' });
	}
}
