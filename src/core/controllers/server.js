#!/usr/bin/env node

/** http codes
 *		200 : OK
 *		401 : Unauthorized (sleep)
 *		418 : I'm a teapot ! (other POST request)
 */

var Odi = require(ODI_PATH + 'src/core/Odi.js').Odi;
const log = new (require(Odi._CORE + 'Logger.js'))(__filename.match(/(\w*).js/g)[0]);
const Flux = require(Odi._CORE + 'Flux.js');
const http = require('http');
const https = require('https');
const express = require('express');
const fs = require('fs');
const compression = require('compression');
const bodyParser = require('body-parser');

const MIDDLEWARE = require(Odi._CORE + 'controllers/server/middleware.js');
const HTTP_SERVER_PORT = 3210;
const HTTPS_SERVER_PORT = 4321;

var credentials = {
	key: fs.readFileSync(Odi._SECURITY + 'key.pem'),
	cert: fs.readFileSync(Odi._SECURITY + 'cert.pem')
};

var ui = express(),
	uiHttps = express();

Flux.controller.server.subscribe({
	next: flux => {
		if (flux.id == 'startUIServer') {
			startUIServer();
		} else if (flux.id == 'closeUIServer') {
			closeUIServer(flux.value);
		} else Odi.error('unmapped flux in Server controller', flux, false);
	},
	error: err => {
		Odi.error(flux);
	}
});

var httpServer, httpsServer;
startUIServer();
function startUIServer() {
	// CORS
	// ui.use(function(request, response, next) {
	// 	response.header('Access-Control-Allow-Origin', '*');
	// 	response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	// 	next();
	// });
	// ui.options('/*', function(request, response, next) {
	// 	response.header('Access-Control-Allow-Methods', 'GET, POST'); //'GET, PUT, POST, DELETE, OPTIONS'
	// 	response.send();
	// });

	httpServer = http.createServer(ui);
	ui.get('*', function(req, res) {
		if (req.isSocket) return res.redirect('wss://' + req.headers.host + req.url);
		log.debug('Redirecting http to https');
		return res.redirect('https://' + req.headers.host + req.url);
	}).listen(HTTP_SERVER_PORT);

	uiHttps.use(compression()); // Compression web
	uiHttps.use(express.static(Odi._WEB)); // For static files
	uiHttps.use(bodyParser.json()); // to support JSON-encoded bodies
	uiHttps.use(
		bodyParser.urlencoded({
			extended: true // to support URL-encoded bodies
		})
	);
	uiHttps.use(MIDDLEWARE.security());

	require(Odi._CORE + 'controllers/server/routes.js').attachRoutes(uiHttps);

	// servor = ui.listen(HTTP_SERVER_PORT, function() {
	// 	log.info('UI server started [' + Odi.conf('mode') + ']');
	// 	Flux.next('interface|led|blink', { leds: ['satellite'], speed: 120, loop: 3 }, { hidden: true });
	// });

	// https.createServer(credentials, ui).listen(HTTPS_SERVER_PORT);

	// httpServer = http.createServer(ui);
	httpsServer = https.createServer(credentials, uiHttps).listen(HTTPS_SERVER_PORT, function() {
		log.info('UI server started [' + Odi.conf('mode') + ']');
		Flux.next('interface|led|blink', { leds: ['satellite'], speed: 120, loop: 3 }, { hidden: true });
	});

	// httpServer.listen(HTTP_SERVER_PORT);
	// httpsServer.listen(HTTPS_SERVER_PORT);
}

function closeUIServer(breakDuration) {
	log.INFO('closing UI server for', breakDuration / 1000, 'seconds');
	// ui.close();
	servor.close();
	ui = null;
}
