#!/usr/bin/env node
'use strict';

var Odi = require(ODI_PATH + 'src/core/Odi.js').Odi;
var log = new (require(Odi.CORE_PATH + 'Logger.js'))(__filename);

var Flux = require(Odi.CORE_PATH + 'Flux.js');

Flux.service.music.subscribe({
	next: flux => {
		// if (!Flux.inspect(flux, subject)) return;
		log.info('Music flux!', flux);
	},
	error: err => {
		Odi.error(flux);
	}
});
