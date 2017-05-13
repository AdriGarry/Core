#!/usr/bin/env node

// Module Jobs [clock, alarms & background tasks]

var spawn = require('child_process').spawn;
var fs = require('fs');
var CronJob = require('cron').CronJob;

var date = new Date();
var hour = date.getHours();
var pastHour = hour;

module.exports = {
	startClock: startClock,
	setInteractiveJobs: setInteractiveJobs,
	setAutoSleep: setAutoSleep,
	setBackgroundJobs: setBackgroundJobs
};

/** Function to init clock  */
function startClock(modeInit){
	if(!modeInit){ // Mode work
		// new CronJob('0 0,30 8-23 * * 1-5', function(){
		new CronJob('0 0,30 8-23 * * 1-5', function(){
			ODI.time.now();
		}, null, true, 'Europe/Paris');
		new CronJob('0 0,30 12-23 * * 0,7', function(){
			ODI.time.now();
		}, null, true, 'Europe/Paris');
		console.log('Clock jobs initialised in regular mode');
	}else{ // Mode any time
		new CronJob('0 0,30 * * * *', function(){
			ODI.time.now();
		}, null, true, 'Europe/Paris');
		console.log('Clock jobs initialised in any time mode !');
	}
};

/** Function to set alarms */
function setInteractiveJobs(){
	// WEEKDAY
	new CronJob('0 20,22-25 8 * * 1-5', function(){
		if(Math.floor(Math.random()*2)) ODI.tts.speak({lg:'fr', voice: 'espeak', msg:'Go go go, allez au boulot'});
		else ODI.tts.speak({lg:'fr', voice: 'espeak', msg:'Allez allez, Maitro boulot dodo'});
	}, null, true, 'Europe/Paris');

	new CronJob('0 30 18 * * 1-5', function(){
		ODI.utils.testConnexion(function(connexion){
			setTimeout(function(){
				if(connexion == true){
					ODI.jukebox.playFip();
				}else{
					ODI.jukebox.loop();
				}
			}, 3000);
		});
	}, null, true, 'Europe/Paris');

	// ALL DAYS
	new CronJob('0 1 13 * * *', function(){
		console.log('Il est 13 heures et tout va bien !');
		spawn('sh', ['/home/pi/odi/core/sh/sounds.sh', '13Heures']);
	}, null, true, 'Europe/Paris');

	new CronJob('13 13,25,40,51 17-22 * * *', function(){
		ODI.service.randomAction();
	}, null, true, 'Europe/Paris');
	console.log('Interactive jobs initialised');
};

/** Function to set auto sleep life cycles */
function setAutoSleep(){
	new CronJob('3 0 0 * * 1-5', function(){
		console.log('AutoLifeCycle go to sleep !');
		ODI.hardware.restartOdi(255);
	}, null, true, 'Europe/Paris');

	new CronJob('3 0 2 * * 0,6', function(){
		console.log('AutoLifeCycle go to sleep !');
		ODI.hardware.restartOdi(255);
	}, null, true, 'Europe/Paris');
	console.log('Auto Sleep Life Cycle jobs initialised');
};

/** Function to set background tasks */
function setBackgroundJobs(){
	new CronJob('13 13 13 * * 1-6', function(){
		ODI.tts.speak({voice:'espeak', lg:'en', msg:'Auto restart'}); // Daily restart Odi's core
		setTimeout(function(){
			ODI.hardware.restartOdi();
		}, 3000);
	}, null, true, 'Europe/Paris');

	new CronJob('13 13 13 * * 0', function(){
		ODI.tts.speak({voice:'espeak', lg:'en', msg:'Reset config'}); // Weekly RPI reboot
		setTimeout(function(){
			ODI.config.resetCfg();
		}, 3000);
	}, null, true, 'Europe/Paris');

	new CronJob('15 15 13 * * 0', function(){
		ODI.tts.speak({voice:'espeak', lg:'en', msg:'Auto reboot'}); // Weekly RPI reboot
		setTimeout(function(){
			ODI.hardware.reboot();
		}, 3000);
	}, null, true, 'Europe/Paris');

	new CronJob('0 0 5 * * 1', function(){
		console.log('Clean log files  /!\\'); // Weekly cleaning of logs
		ODI.hardware.cleanLog();
	}, null, true, 'Europe/Paris');

	// new CronJob('5 5 5 * * *', function(){
	new CronJob('*/10 * * * * *', function(){
		console.log('Get last update date & time'); // Daily
		ODI.config.getLastModifiedDate([CORE_PATH, WEB_PATH], function(lastUpdate){ // DATA_PATH
			if(CONFIG.update != lastUpdate){
				ODI.config.updateDefault({update: lastUpdate}, false);
				ODI.config.update({update: lastUpdate}, false);
			}
		});
	}, null, true, 'Europe/Paris');

	// new CronJob('5 5 5 * * *', function(){
	// new CronJob('*/5 * * * * *', function(){
	// 	console.log('update Odi\'s software params (last date & time, totalLines)'); // Daily
	// 	ODI.config.getLastModifiedDate([CORE_PATH, WEB_PATH], function(lastUpdate){ // DATA_PATH
	// 		console.debug('lastUpdate', lastUpdate);
	// 		ODI.config.countSoftwareLines(function(totalLines){
	// 			console.debug('totalLines', totalLines);
	// 			if(CONFIG.totalLines != totalLines || CONFIG.update != lastUpdate){
	// 				ODI.config.updateDefault({update: lastUpdate, totalLines: totalLines}, false);
	// 				ODI.config.update({update: lastUpdate, totalLines: totalLines}, false);
	// 			}
	// 		});
	// 	});
	// }, null, true, 'Europe/Paris');
	// console.log('Background jobs initialised');
};
