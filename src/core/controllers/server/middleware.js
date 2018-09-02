#!/usr/bin/env node

// Middleware sub-module (server)

var Core = require(_PATH + 'src/core/Core.js').Core;
const log = new (require(Core._CORE + 'Logger.js'))(__filename.match(/(\w*).js/g)[0]);
const Flux = require(Core._CORE + 'Flux.js');
const Utils = require(_PATH + 'src/core/Utils.js');
const fs = require('fs');

const FILE_REQUEST_HISTORY = _PATH + 'log/requestHistory.log';
const noSoundUrl = ['/dashboard', '/log'];
const BAD_REQUEST_TIMEOUT = 5000;
const BAD_REQUEST_CP_LIMIT = 5;
var badRequestCount = 0;
var canTTSBadRequest = true;

module.exports = {
	security: function() {
		return securityMiddleware;
	}
};

var securityMiddleware = function(req, res, next) {
	Flux.next('interface|led|blink', { leds: ['satellite'], speed: 80, loop: 3 }, { hidden: true });
	if (!Utils.searchStringInArray(req.url, noSoundUrl)) Flux.next('interface|sound|UI', null, { hidden: true });

	let requestData = getRequestData(req);

	if (!requestData.ip) {
		if (req.isSocket) {
			log.INFO('..............This is a socket (search: "req.isSocket")!!');
		} else {
			log.INFO('..............This is NOT a socket (search: "req.isSocket")!!');
		}
		log.error('Incoming socket /!\\ /!\\');
		log.info(req); // TODO revoir cette sécurité...
		rejectUnauthorizedRequest(res);
	}

	if (!requestData.isLocalIp) {
		logNotLocalRequest(requestData);
	}

	if (requestData.ui !== 'UIv5') {
		// Not allowed requests
		if (canTTSBadRequest && Core.isAwake()) {
			canTTSBadRequest = false;
			Flux.next('interface|tts|speak', { voice: 'espeak', lg: 'en', msg: 'Bad request' }, { delay: 0.5, hidden: true });
			setTimeout(() => {
				canTTSBadRequest = true;
			}, BAD_REQUEST_TIMEOUT);
		}
		Core.error('Bad request', '401 ' + decodeURI(req.url) + ' ' + requestData.log, false);
		rejectUnauthorizedRequest(res);
		return;
	}

	log.info(requestData.ui + ' ' + decodeURI(req.url), requestData.log);
	res.statusCode = 200;
	next();
};

function getRequestData(req) {
	let position,
		requestData = {}; // { ip, isLocalIp, position, log }

	requestData.url = req.url;
	requestData.ip = req.connection.remoteAddress;
	requestData.isLocalIp = requestData.ip.indexOf('192.168') > -1;

	try {
		position = JSON.parse(req.headers['user-position']);
		if (position && typeof position == 'object') {
			requestData.position = {};
			requestData.position.latitude = position.latitude;
			requestData.position.longitude = position.longitude;
		}
	} catch (err) {
		log.debug('position not retrieved!', position);
	}

	requestData.ui = req.headers['user-interface'];
	requestData.log = 'from [' + formatIp(requestData) + formatPosition(requestData) + ']';
	return requestData;
}

function formatIp(requestData) {
	return requestData.isLocalIp ? '' : requestData.ip;
}

function formatPosition(requestData) {
	let log = requestData.isLocalIp ? '' : '_';
	log += requestData.position
		? 'lat:' + requestData.position.latitude + '|lon:' + requestData.position.longitude
		: 'noPos';
	return log;
}

function logNotLocalRequest(requestData) {
	let requestToLog = Utils.logTime('D/M h:m:s ') + requestData.url + requestData.log + '\r\n';
	fs.appendFile(FILE_REQUEST_HISTORY, requestToLog, function(err) {
		if (err) return Core.error(err);
	});
}

function rejectUnauthorizedRequest(res) {
	res.status(401); // Unauthorized
	res.end();
	// badRequestCount++;
	// if (badRequestCount >= BAD_REQUEST_CP_LIMIT) {
	// 	closingServerTemporary(5000);
	// }
}

function closingServerTemporary(breakDuration) {
	Flux.next('controller|server|closeUIServer', breakDuration);
	setTimeout(function() {
		log.INFO('restarting UI server...');
		badRequestCount = 0;
		Flux.next('controller|server|startUIServer');
	}, breakDuration);
}