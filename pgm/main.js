#!/usr/bin/env node

console.log(' -> Main Manager');

var Gpio = require('onoff').Gpio;
var spawn = require('child_process').spawn;
var gpioPins = require('./lib/gpioPins.js');
var fs = require('fs');
var request = require('request');
var utils = require('./lib/utils.js');
var tts = require('./lib/tts.js');
var remote = require('./lib/remote.js');

var odiPgm;
var odiState = false;
var mute;

/*utils.getMsgLastGitCommit(function(commitMsg){
	setTimeout(function(){
		utils.recordLog('Last Commit Title : ' + commitMsg);
		commitMsg = commitMsg.replace('.',' point ');
		tts.speak('fr', commitMsg.trim());
	}, 1000);
});*/

startOdi();

ok.watch(function(err, value){
	if(!odiState){
		startOdi();
	}
});

setInterval(function(){
	led.write(0);
}, 10*1000);

function startOdi(){
	//ok.unwatch();
	mute = spawn('sh', ['/home/pi/odi/pgm/sh/mute.sh']);
	var logo = fs.readFileSync('/home/pi/odi/pgm/data/logoLarry.properties', 'utf8').toString().split('\n');
	logo = '\n\n' + logo.join('\n') + '\n';
	console.log(logo);
	utils.recordLog(logo);
	remote.check();
	// utils.sleepNode(4,1.5);

	odiPgm = spawn('node', ['/home/pi/odi/pgm/odi.js']);
	odiState = true;
	var date;
	var hour;
	var min;
	var sec;
	var logDate;
	odiPgm.stdout.on('data', function(data){
		date = new Date();
		hour = date.getHours();
		min = date.getMinutes();
		sec = date.getSeconds();
		logDate = (hour<10?'0':'') + hour + ':' + (min<10?'0':'') + min + ':' + (sec<10?'0':'') + sec;
		console.log(logDate + ' Odi/ ' + data);
		utils.recordLog(logDate + ' Odi/ ' + data);
	});

	odiPgm.stderr.on('data', function(data){
		date = new Date();
		hour = date.getHours();
		min = date.getMinutes();
		sec = date.getMinutes();
		logDate = (hour<10?'0':'') + hour + ':' + (min<10?'0':'') + min + ':' + (sec<10?'0':'') + sec;
		console.log(logDate + ' O/!\\ ' + data);
		utils.recordLog(hour + ':' + min + ':' + sec + ' O/!\\ ' + data);
	});
	
	odiPgm.on('exit', function(code){
		mute = spawn('sh', ['/home/pi/odi/pgm/sh/mute.sh']);
		//var mute = spawn('omxplayer', ['/home/pi/odi/mp3/sounds/shutdown.mp3']);
		odiState = false;
		console.log('\r\n>> Odi pgm KILLED  /!\\  /!\\');
		console.log('***************************\r\n\r\n');
		startOdi();
	});
}