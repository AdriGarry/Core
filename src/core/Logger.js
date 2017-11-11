#!/usr/bin/env node
'use strict';

var util = require('util');

module.exports = Logger;

const dateTimeDefaultPattern = 'D/M h:m:s';
var Odi, Utils, modeDebug = false;

function Logger(filename, debugMode, dateTimePattern) {
	Utils = require(ODI_PATH + 'src/core/Utils.js');
	//Odi = require(ODI_PATH + 'src/core/Odi.js');
	modeDebug = debugMode || modeDebug;
	// dateTimePattern = dateTimePattern || dateTimeDefaultPattern;
	filename = filename.match(/(\w*).js/g)[0];
	// debug("Logger init [" + filename + "]");

	this.info = info;
	this.INFO = INFO;
	this.enableDebug = enableDebug;
	this.debug = debug;
	this.DEBUG = DEBUG;
	this.array = logArray;
	this.error = error;
	return this;

	function enableDebug() {
		modeDebug = true;
	}

	function formatLog(args) {
		if (typeof args === 'string') {
			return args;
		}
		var log = '';
		if (args[0] == '\n') {
			console.log('');
			delete args[0];
		}
		for (var i in args) {
			if (typeof args[i] == 'object') {
				log = log + util.format(util.inspect(args[i]) + ' ');
			} else {
				log = log + args[i] + ' ';
			}
		}
		return log;
	}

	function info() {
		console.log(Utils.logTime(), '[' + filename + ']', formatLog(arguments));
	}

	function INFO() {
		console.log(Utils.logTime(), '[' + filename.toUpperCase() + ']', formatLog(arguments).toUpperCase());
	}

	function debug() {
		if (!modeDebug) return;
		console.log(Utils.logTime(), '[' + filename + ']\u2022', formatLog(arguments));
	}

	function DEBUG() {
		if (!modeDebug) return;
		console.log(Utils.logTime(), '[' + filename.toUpperCase() + ']\u2022', formatLog(arguments).toUpperCase());
	}

	function error() {
		console.log('___________________');
		console.error(Utils.logTime(), '[' + filename + ']', 'ERR >>', formatLog(arguments));
	}

	/** Function to log conf to array */
	function logArray(src, updatedEntries, executionTime) {
		var col1 = 11,
			col2 = 16;
		// log.info();
		var logArrayMode = updatedEntries
			? '|         CONFIG UPDATE   ' + executionTime + 'ms' + ' |'
			: '|             CONFIG             |';
		var confArray = '|--------------------------------|\n' + logArrayMode + '\n|--------------------------------|\n';
		Object.keys(src).forEach(function(key, index) {
			if (key == 'alarms') {
				Object.keys(src[key]).forEach(function(key2, index2) {
					if (key2 != 'd') {
						var c1 = index2 > 0 ? ' '.repeat(col1) : key + ' '.repeat(col1 - key.toString().length);
						var c2 = key2 + ' ' + (src[key][key2].h < 10 ? ' ' : '') + src[key][key2].h + ':';
						c2 += (src[key][key2].m < 10 ? '0' : '') + src[key][key2].m;
						if (typeof src[key][key2].mode === 'string') c2 += ' ' + src[key][key2].mode.charAt(0); //String(src[key][key2].mode).charAt(0)
						confArray += '| ' + c1 + ' | ' + c2 + ' '.repeat(col2 - c2.length) + ' |\n';
					}
				});
			} else {
				var updated = updatedEntries && Utils.searchStringInArray(key, updatedEntries) ? true : false;
				confArray +=
					'| ' +
					(!updated ? '' : '*') +
					key +
					' '.repeat(col1 - key.length - updated) /*(updatedEntries.indexOf(key) == -1 ? ' ' : '*')*/ +
					' | ' +
					src[key] +
					' '.repeat(col2 - src[key].toString().length) +
					' |\n';
			}
		});
		console.log(confArray + '|--------------------------------|');
	}
}

