#!/usr/bin/env node
// Module server

var _express = require('express');
var _path = require("path");
var _spawn = require('child_process').spawn;
var _utils = require('./utils.js');
var _tts = require('./tts.js');
var _voiceMail = require('./voiceMail.js');
var _service = require('./service.js');
var _timer = require('./timer.js');
var _fip = require('./fip.js');
var _jukebox = require('./jukebox.js');
var _exclamation = require('./exclamation.js');
var _party = require('./party.js');
var self = this;

var DIR_NAME = '/home/pi/odi/pgm/';
var DIR_NAME_WEB = '/home/pi/odi/pgm/web/';

exports.startUI = function startUI(mode){
	var ui = _express();
	var params;
	var ipClient;

	ui.get('/', function (req, res) { // Init UI
		res.sendFile(_path.join(DIR_NAME_WEB + '/index.html'));
		ipClient = req.connection.remoteAddress;
		console.log('UI initilized [ip: ' + ipClient + ']');
	});

	ui.use(_express.static(DIR_NAME_WEB)); // Pour fichiers statiques


	/** GET SECTION */
	/** GET SECTION */
	ui.get('/log', function (req, res) { // Send Logs to UI
		console.log('UI < Logs');
		_utils.prepareLogs(200, function(log){
			res.end(log);
		});
	});

	ui.get('/cpuTemp', function (req, res) { // Send CPU Temp to UI
		var temp = _utils.getCPUTemp();
		console.log('UI < CPU Temp ' + temp);
		res.end(temp);
	});



	/** POST SECTION */
	/** POST SECTION */
	ui.post('/odi', function (req, res) { // Restart Odi
		console.log('UI > restart Odi');
		_utils.restartOdi();
		res.writeHead(200);res.end();
	});

	ui.post('/sleep', function (req, res) { // Restart Odi
		params = req.query;
		console.log(params);
		var sleepTime;
		if(params.hasOwnProperty('sleepTime')){
			sleepTime = params.sleepTime;
		}else{
			sleepTime = 255;
		}
		console.log('UI > sleep ...' + sleepTime);
		_utils.restartOdi(sleepTime);//255
		res.writeHead(200);res.end();
	});

	ui.post('/reboot', function (req, res) { // Reboot Odi
		console.log('UI > reboot Odi');
		_utils.reboot();
		res.writeHead(200);res.end();
	});

	ui.post('/shutdown', function (req, res) { // Shutdown Odi
		console.log('UI > shutdown Odi');
		_utils.shutdown();
		res.writeHead(200);res.end();
	});

	ui.post('/mute', function (req, res) { // Mute Odi
		console.log('UI > mute');
		_utils.mute();
		res.writeHead(200);res.end();
	});

	if(mode.indexOf('sleep') == -1){ /////// WHEN ALIVE

		ui.post('/tts', function (req, res) { // TTS ou Add Voice Mail Message
			var params = [];
			console.log('UI > tts ' + params);
			if(params){
				//_voiceMail.addVoiceMailMessage(lg,txt.substring(3));
				//_voiceMail.addVoiceMailMessage(lg,txt);
			}else{
				//_tts.speak(params);
				//_tts.speak(lg,txt);
			}
			res.writeHead(200);res.end();
		});

		ui.post('/lastTTS', function (req, res) { // Restart Odi
			console.log('UI > restartOdi');
			_tts.lastTTS();
			res.writeHead(200);res.end();
		});

		ui.post('/checkVoiceMail', function (req, res) { // Check Voice Mail
			console.log('UI > Check Voice Mail');
			if(!_voiceMail.checkVoiceMail()){
				_tts.speak('en', 'No voicemail message:1');			
			}
			res.writeHead(200);res.end();
		});

		ui.post('/clearVoiceMail', function (req, res) { // Clear Voice Mail
			console.log('UI > Clear Voice Mail');
			voiceMail.clearVoiceMail();
			res.writeHead(200);res.end();
		});

		ui.post('/conversation', function (req, res) { // Conversation
			if(/\d/.test(txt)){
				var rdmNb = txt.replace(/[^\d.]/g, '');
				var rdmNb = parseInt(rdmNb, 10);
				console.log('UI >  conversation random param : ' + rdmNb);
				_tts.conversation(rdmNb);
			}else{
				console.log('UI >  conversation random ');
				_tts.conversation('random');
			}
			res.writeHead(200);res.end();
		});

		ui.post('/exclamation', function (req, res) { // Exclamation
			console.log('UI > Exclamation');
			_exclamation.exclamation();
			res.writeHead(200);res.end();
		});

		ui.post('/exclamationLoop', function (req, res) { // Exclamation Loop
			console.log('UI > Exclamation Loop');
			_exclamation.exclamationLoop();
			res.writeHead(200);res.end();
		});

		ui.post('/fip', function (req, res) { // FIP Radio
			console.log('UI > FIP Radio');
			_fip.playFip();
			res.writeHead(200);res.end();
		});

		ui.post('/music/*', function (req, res) { // 
			var song; // RECUPERER LE NOM DE LA CHANSON
			if(!song) song = 'mouthTrick';
			console.log('UI > Music : ' + song);
			_deploy = _spawn('sh', ['/home/pi/odi/pgm/sh/music.sh', song]);
			res.writeHead(200);res.end();
		});

		ui.post('/jukebox', function (req, res) { // Jukebox
			console.log('UI > restartOdi');
			_jukebox.loop();
			res.writeHead(200);res.end();
		});

		ui.post('/medley', function (req, res) { // Medley
			console.log('UI > restartOdi');
			_jukebox.medley();
			res.writeHead(200);res.end();
		});

		ui.post('/date', function (req, res) { // Date
			console.log('UI > Date');
			_service.date();
			res.writeHead(200);res.end();
		});

		ui.post('/time', function (req, res) { // Time
			console.log('UI > Time');
			_service.time();
			res.writeHead(200);res.end();
		});

		ui.post('/timer', function (req, res) { // Timer
			if(/\d/.test(txt)){
				var min = parseInt(txt.replace(/[^\d.]/g, ''), 10);
				console.log('UI > Timer for ' + min + ' minutes');
				_timer.setTimer(min);
			}else{
				//_timer.setTimer();
			}
			res.writeHead(200);res.end();
		});

		ui.post('/meteo', function (req, res) { // Weather
			console.log('UI > Meteo');
			_service.weather();
			res.writeHead(200);res.end();
		});

		ui.post('/info', function (req, res) { // Info
			console.log('UI > Info');
			_service.info();
			res.writeHead(200);res.end();
		});

		ui.post('/cpuTemp', function (req, res) { // TTS CPU Temp
			console.log('UI > FIP');
			_service.cpuTemp();
			res.writeHead(200);res.end();
		});

		ui.post('/cigales', function (req, res) { // Cigales
			console.log('UI > Cigales');
			_deploy = _spawn('sh', ['/home/pi/odi/pgm/sh/sounds.sh', 'cigales']);
			res.writeHead(200);res.end();
		});

		ui.post('/setParty', function (req, res) { // Set Party Mode
			console.log('UI > Set Party Mode !!');
			_party.setParty();
			res.writeHead(200);res.end();
		});

		ui.post('/*', function (req, res) { // Redirect Error
			console.error('UI > Not Implemented	: ');
			res.writeHead(501);res.end();
		});

	}
	console.log('Odi not allowed to interact  -.-');

	ui.listen(8080, function () { // Listen port 8080
		console.log('Odi\'s UI server started');
	});

}