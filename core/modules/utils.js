#!/usr/bin/env node

// Module Utils

var fs = require('fs');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var os = require("os");
var hardware = require(CORE_PATH + 'modules/hardware.js');
var leds = require(CORE_PATH + 'modules/leds.js');
var exclamation = require(CORE_PATH + 'modules/exclamation.js');

module.exports = {
	formatedDate: formatedDate,
	now: now,
	logConfigArray: logConfigArray,
	setConfig: setConfig,
	resetConfig: resetConfig,
	prepareLogs: prepareLogs,
	getJsonFileContent: getJsonFileContent,
	appendJsonFile: appendJsonFile,
	testConnexion: testConnexion,
};

/** Function to get date & time (jj/mm hh:mm:ss) */
var date, month, day, hour, min, sec, now;
function formatedDate(){
	date = new Date();
	month = date.getMonth()+1;
	day = date.getDate();
	hour = date.getHours();
	min = date.getMinutes();
	sec = date.getSeconds();
	now = (day<10?'0':'') + day + '/' + (month<10?'0':'') + month + ' ';
	now += (hour<10?'0':'') + hour + ':' + (min<10?'0':'') + min + ':' + (sec<10?'0':'') + sec;
	return now;
};

/** Function to return date time. Pattern: 'DT' */
function now(param, date){
	if(typeof date === 'undefined') date = new Date();
	var D = date.getDate();
	var M = date.getMonth();
	var h = date.getHours();
	var m = date.getMinutes();
	var now = '';

	for(var i = 0; i < param.length; i++){

			switch(param[i]){
				case 'D':
					now += D + '/' + M;
					break;
				case 'T':
					now += h + ':' + (m<10 ? '0' : '') + m;
					break;
				case ' ':
					now += ' ';
					break;
				default:
					now += param[i];
			}
	}
	/*if(param.indexOf('d')){
		now += D + '/' + M + ' ';
	}
	if(param.indexOf('t')){
		now += (h<10 ? ' ' : '') + h + ':' + (m<10 ? '0' : '') + m + ' ';
	}*/
	return now;
};

/** Function to log CONFIG array */
function logConfigArray(){
	var col1 = 10, col2 = 15;
	var confArray = '\n|------------------------------|\n|            CONFIG            |' + '\n|------------------------------|\n';
	Object.keys(CONFIG).forEach(function(key,index){
		//if(typeof CONFIG[key] == 'Object'){
		if(key == 'alarms'){
			Object.keys(CONFIG[key]).forEach(function(key2,index2){
				if(key2 != 'd'){
					// confArray += '| ' + (index2>0 ? ' '.repeat(col1) : key + ' '.repeat(col1-key.toString().length)) + ' | ' + key2 + ' '
					// 	+ (CONFIG[key][key2].h<10?' ':'') + CONFIG[key][key2].h + ':' + (CONFIG[key][key2].m<10?'0':'') + CONFIG[key][key2].m
					// 	+ ' '.repeat(col2-(key2.toString().length+CONFIG[key][key2].h.toString().length+CONFIG[key][key2].m.toString().length+(CONFIG[key][key2].m<10?2:1))) + ' |\n';
					var c1 = (index2>0 ? ' '.repeat(col1) : key + ' '.repeat(col1-key.toString().length));
					var c2 = key2 + ' ' + (CONFIG[key][key2].h<10?' ':'') + CONFIG[key][key2].h + ':' + (CONFIG[key][key2].m<10?'0':'') + CONFIG[key][key2].m;
					confArray += '| ' + c1 + ' | ' + c2 + ' '.repeat(col2-c2.length) + ' |\n';
				}
			});
		}else{
			confArray += '| ' + key + ' '.repeat(col1-key.length) + ' | ' + CONFIG[key] + ' '.repeat(col2-CONFIG[key].toString().length) + ' |\n';
		}
	});
	console.log(confArray + '|------------------------------|');
};

/** Function to set/edit Odi's config */
function setConfig(newConf, restart){
	console.log('setConfig(newConf)', newConf);
	//logConfigArray();
	getJsonFileContent(CONFIG_FILE, function(data){
		var config = JSON.parse(data);
		Object.keys(newConf).forEach(function(key,index){
			config[key] = newConf[key];
		});
		config.update = now('T (D)');
		//console.log('now("dt")', now('dt'));
		global.CONFIG = config;
		fs.writeFile(CONFIG_FILE, JSON.stringify(CONFIG, null, 2));
		if(restart){
			hardware.restartOdi();
		}
		logConfigArray();
	});
};

/** Function to reset Odi's config */
function resetConfig(restart){
	console.log('resetConfig()', restart ? 'and restart' : '');
	logConfigArray();
//	config.update = now('dt');
	fs.createReadStream(DATA_PATH + 'defaultConf.json').pipe(fs.createWriteStream(ODI_PATH + 'conf.json'));
	if(restart){
		// setTimeout(function(){
			hardware.restartOdi();
		// }, 2000);
	}
};

/** Function to format logs */
function prepareLogs(lines, callback){
	var content = fs.readFileSync(LOG_PATH + 'odi.log', 'UTF-8').toString().split('\n');
	content = content.slice(-lines); //-120
	content = content.join('\n');
	callback(content);
	return content;
};

/** Function getJsonFileContent */
function getJsonFileContent(filePath, callback){
	console.debug('getJsonFileContent() ', filePath);
	fs.readFile(filePath, function(err, data){
		if(err && err.code === 'ENOENT'){
			console.error('No file : ' + filePath);
			callback(null);
		}else{
			callback(data);
		}
	});
};

/** Function to append object in JSON file */
var fileData;
function appendJsonFile(filePath, obj, callback){
	console.debug('appendJsonFile() ', filePath, obj);
	fs.exists(filePath, function(exists){
		if(exists){
			console.debug("Yes file exists");
			fs.readFile(filePath, function(err, data){
				if(err) console.log(err);
				else{
					fileData = JSON.parse(data);
					console.debug('obj', obj);
					console.debug('fileData', fileData);
					fileData.push(obj);
					fileData = JSON.stringify(fileData, null, 2).replace(/\\/g, "").replace(/\"{/g, "{").replace(/\}"/g, "}");
					console.debug(fileData);
					fs.writeFile(filePath, fileData);
				}
			});
		}else{
			console.debug("File not exists")
			fileData = [];
			console.debug('obj', obj);
			console.debug('fileData', fileData);
			fileData.push(obj);
			fileData = JSON.stringify(fileData, null, 2).replace(/\\/g, "").replace(/\"{/g, "{").replace(/\}"/g, "}");
			console.debug(fileData);
			fs.writeFile(filePath, fileData);
		}
	});
};

/** Function to test internet connexion */
function testConnexion(callback){
	//console.debug('testConnexion()...');
	require('dns').resolve('www.google.com', function(err) {
		if(err){
			// console.debug('Odi is not connected to internet (utils.testConnexion)   /!\\');
			callback(false);
		}else{
			//console.debug('Odi is online   :');
			callback(true);
		}
	});
};

/** Function to return last Odi's start/restart time */
const startHour = new Date().getHours();
const startMin = new Date().getMinutes();
const startTime = (startHour > 12 ? startHour-12 : startHour) + '.' + (startMin<10?'0':'') + startMin + ' ' + (startHour > 12  ? 'PM' : 'AM');
function getStartTime(){
	return startTime;
};

/** Function to repeat/concat a string */
String.prototype.repeat = function(num){
	return new Array(Math.abs(num) + 1).join(this);
};

/** Function to test if an array contains an element */
/*Array.prototype.contains = function(element){
	return this.indexOf(element) > -1;
};*/