#!/usr/bin/env node

/** Params detection */
const argv = process.argv.splice(2);

var fs = require('fs');
var spawn = require('child_process').spawn;

/** Odi's global variables */
global.ODI_PATH = __filename.match(/\/.*\//g)[0];

/** Function to start up Odi */
(function startOdi(exitCode) {
	// ODI.leds.blink({ leds: ['nose'], speed: 2000, loop: 1 });
	// global.CONFIG = JSON.parse(fs.readFileSync(ODI_PATH + 'conf.json', 'utf8'));
	// var odiCore, logMode = getLogMode();
	// spawn('sh', [CORE_PATH + 'sh/mute.sh']); // Mute

	// if (CONFIG.mode == 'sleep' || typeof exitCode === 'number' && exitCode > 0) {
	// 	odiCore = spawn('node', [CORE_PATH + 'odiSleep.js'/*, mode*/]);
	// } else {
	// 	odiCore = spawn('node', [CORE_PATH + 'odi.js'/*, exitCode*/]);
	// }
	// console.log('.', forcedDebug || '', test || '');
	console.log(argv);
	// odiCore = spawn('node', [ODI_PATH + 'initializer.js', forcedDebug, test]);
	var odiProgramWithParams = [ODI_PATH + 'main.js'];
	for (var i = 0; i < argv.length; i++) {
		odiProgramWithParams.push(argv[i]);
	}
	odiCore = spawn('node', odiProgramWithParams);

	odiCore.stdout.on('data', function(data) {
		process.stdout.write(data);
	});

	odiCore.stderr.on('data', function(data) {
		process.stdout.write(data);
	});

	odiCore.on('exit', function(code) {
		// spawn('sh', [ODI_PATH + 'shell/mute.sh']);  // Mute // + LEDS ???
		// console.log('\r\n-----------------------------------' + (code > 10 ? (code > 100 ? '---' : '--') : '-'));
		console.log(">> Odi's CORE restarting... [code:" + code + ']');
		argv.remove('test'); // Removing test param before relaunching
		startOdi(code);
	});
})();

Array.prototype.remove = function() {
	var what,
		a = arguments,
		L = a.length,
		ax;
	while (L && this.length) {
		what = a[--L];
		while ((ax = this.indexOf(what)) !== -1) {
			this.splice(ax, 1);
		}
	}
	return this;
};

/*function getLogMode() {
	value = etat.readSync();
	if (value != etat.readSync()) {
		getLogMode();
	}
	if (value) return CONFIG.mode == 'sleep' ? ' O.' : ' ODI';
	else return CONFIG.mode == 'sleep' ? ' O' : ' Odi';
};*/