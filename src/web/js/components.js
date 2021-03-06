/** TTS component */
app.component('tts', {
	bindings: {
		data: '<',
		coreData: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function ($window, DefaultTile, UIService, $timeout) {
		let ctrl = this;
		let tileParams = {
			label: 'Text To Speech',
			actionList: [],
			expanded: false
		};
		ctrl.access = true;
		ctrl.tile = new DefaultTile(tileParams, true);

		ctrl.$onChanges = function (changes) {
			if (changes.coreData && ctrl.coreData) ctrl.options = initTextInputOptions(ctrl.coreData);
		};

		/** Overwrite tile action */
		ctrl.tile.click = function ($event) {
			if (!ctrl.tile.expanded) {
				ctrl.toggleTileHeight();
				focusOnTtsInput();
			}
			return false;
		};

		ctrl.cssClass = function () {
			return (ctrl.tile.expanded ? 'expanded' : '') + ' ' + ctrl.tile.id;
		};

		ctrl.toggleTileHeight = function () {
			ctrl.tile.expanded = !ctrl.tile.expanded;
		};

		function focusOnTtsInput() {
			let autocompleteElement = $window.document.getElementById('textInput');
			let autocompleteInputElement = autocompleteElement.getElementsByTagName('input')[0];
			if (autocompleteInputElement) autocompleteInputElement.focus();
		}

		ctrl.tts = {
			voice: 'espeak',
			lg: 'fr',
			msg: '',
			voicemail: false,
			error: '',
			conf: {
				languageList: [
					{ code: 'fr', label: 'French' },
					{ code: 'en', label: 'English' },
					{ code: 'ru', label: 'Russian' },
					{ code: 'es', label: 'Spanish' },
					{ code: 'it', label: 'Italian' },
					{ code: 'de', label: 'German' }
				],
				voiceList: [
					{ code: 'espeak', label: 'Espeak' },
					{ code: 'mbrolaFr1', label: 'MbrolaFr1' },
					{ code: 'mbrolaFr4', label: 'MbrolaFr4' },
					{ code: 'google', label: 'Google' },
					{ code: 'pico', label: 'Pico' }
				]
			},
			// cleanText() {
			// 	console.log('cleanText');
			// 	let message = ctrl.tts.msg || '';
			// 	message = message
			// 		.replace(/[àáâãäå]/g, 'a')
			// 		.replace(/[ç]/g, 'c')
			// 		.replace(/[èéêë]/g, 'e')
			// 		.replace(/[îï]/g, 'i')
			// 		.replace(/[ôóö]/g, 'o')
			// 		.replace(/[ûüù]/g, 'u');
			// 	//message = message.replace(/[<>]/g,''); // Others characters
			// 	ctrl.tts.msg = message;
			// },
			submit() {
				console.log('[deprecated?] submit', ctrl.tts);
				if (ctrl.tts.msg != '') {
					UIService.sendTTS(ctrl.tts, function (callback) {
						if (callback.status == 200) {
							ctrl.tts.msg = '';
							ctrl.tts.error = ''; // Reinit TTS
						}
					});
				} else {
					focusOnTtsInput();
				}
			}
		};

		function initTextInputOptions(coreData) {
			let options = [];
			angular.forEach(coreData.playlists, (playlist, playListId) => {
				angular.forEach(playlist, (song) => {
					options.push({ label: song.slice(0, -4), type: 'song', value: 'playlists/' + playListId + '/' + song, icon: 'fas fa-music' });
				})
			});
			angular.forEach(coreData.stories, (story) => {
				options.push({ label: story.slice(8, -4), type: 'story', value: story, icon: 'fas fa-book' });
			});
			return options;
		}

		ctrl.getMatchingOptions = function (input) {
			let matchingOptions = input ? ctrl.options.filter(createStrictFilterFor(input)) : ctrl.options;
			let othersMatchingOptions = input ? ctrl.options.filter(createFilterFor(input)) : [];
			angular.forEach(othersMatchingOptions, (option) => {
				if (!matchingOptions.includes(option)) {
					matchingOptions.push(option);
				}
			});
			let ttsOption = ctrl.data.value.mode === 'Sleep' ? [] : { label: input, type: 'tts', icon: 'far fa-comment-dots' };
			let voicemailOption = { label: input, type: 'voicemail', icon: 'far fa-envelope' };
			let clearInputOption = { label: 'Clear "' + input + '"', type: 'clear', icon: 'fas fa-backspace' };
			let rawTextOption = { label: input, type: 'text', icon: 'fas fa-i-cursor' };
			return matchingOptions.concat(ttsOption, voicemailOption, clearInputOption, rawTextOption);
		};

		ctrl.selectedOptionChange = function (option) {
			if (option) {
				ctrl.tts.msg = ctrl.textInput;
				if (option.type === 'song') {
					ctrl.tile.action({ label: 'Mute', url: '/flux/interface/sound/mute' });
					ctrl.tile.action({
						label: 'Play ' + option.label,
						url: '/flux/interface/sound/play',
						value: { mp3: option.value }
					});
					resetAutocomplete();
				} else if (option.type === 'story') {
					ctrl.tile.action({ label: 'Mute', url: '/flux/interface/sound/mute' });
					if (option.label.indexOf('Survivaure') > -1) {
						ctrl.tile.action({ label: option.label, url: '/flux/service/music/story', value: 'survivaure' });
					} else if (option.label.indexOf('Naheulbeuk') > -1) {
						ctrl.tile.action({ label: option.label, url: '/flux/service/music/story', value: 'naheulbeuk' });
					}
					resetAutocomplete();
				} else if (option.type === 'tts') {
					ctrl.tts.submit();
					resetAutocomplete();
				} else if (option.type === 'voicemail') {
					ctrl.tts.voicemail = true;
					ctrl.tts.submit();
					ctrl.tts.voicemail = false;
					resetAutocomplete();
				} else if (option.type === 'clear') {
					resetAutocomplete();
				}
			}
		};

		ctrl.onFocus = function () {
			let textInputOriginalValue = ctrl.textInput;
			ctrl.textInput = angular.copy(ctrl.textInput.slice(0, -1));
			$timeout(() => {
				ctrl.selectedOption = null;
				ctrl.textInput = angular.copy(textInputOriginalValue);
			}, 100);
		}

		function resetAutocomplete() {
			ctrl.textInput = null;
			ctrl.selectedOption = null;
		}

		function createStrictFilterFor(input) {
			return function filterFn(option) {
				return (option.label.toLowerCase().indexOf(input.toLowerCase()) === 0);
			};
		}
		function createFilterFor(input) {
			return function filterFn(option) {
				return (option.label.toLowerCase().indexOf(input.toLowerCase()) > -1);
			};
		}

	}
});

/** Mode component */
app.component('mode', {
	bindings: {
		data: '<',
		access: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile, $rootScope, UIService) {
		let ctrl = this;
		let tileParams = {
			label: 'Mode',
			actionList: [
				{ label: 'Mood', icon: 'far fa-grin-alt', value: { continu: true } },
				{ label: 'Sleep', icon: 'far fa-moon', url: '/flux/service/context/sleep' },
				{ label: 'Reset', icon: 'fas fa-retweet', url: '/flux/service/context/reset' },
				{ label: 'Restart', icon: 'fas fa-bolt', url: '/flux/service/context/restart' }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);

		/** Overwrite tile action */
		ctrl.tile.click = function () {
			if (!$rootScope.irda) {
				UIService.showErrorToast('Unauthorized action.');
			} else {
				ctrl.tile.openBottomSheet(this.actionList, specificMoodActions);
			}
		};

		const PLUG_FLUX_URL = '/flux/service/mood/set';
		let specificMoodActions = function (action) {
			if (action.label === 'Mood') {
				let actionList = [
					{ label: 'Mood 0', icon: 'far fa-meh-blank', url: PLUG_FLUX_URL, value: 0 },
					{ label: 'Mood 1', icon: 'far fa-meh', url: PLUG_FLUX_URL, value: 1 },
					{ label: 'Mood 2', icon: 'far fa-smile', url: PLUG_FLUX_URL, value: 2 },
					{ label: 'Mood 3', icon: 'far fa-grin-beam', url: PLUG_FLUX_URL, value: 3 },
					{ label: 'Mood 4', icon: 'far fa-grin-squint', url: PLUG_FLUX_URL, value: 4 },
					{ label: 'Mood 5', icon: 'far fa-grin-squint-tears', url: PLUG_FLUX_URL, value: 5 }
				];
				ctrl.tile.openBottomSheet(actionList, ctrl.tile.action);
			} else {
				ctrl.tile.action(action);
			}
		};
	}
});

/** Options component */
app.component('options', {
	bindings: {
		data: '<',
		access: '<'
		// odiState: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile) {
		let ctrl = this;
		let tileParams = {
			label: 'Options',
			actionList: [
				{ label: '!Trace', icon: 'far fa-dot-circle', url: '/toggleTrace' },
				{ label: '!Debug', icon: 'fas fa-circle', url: '/toggleDebug' },
				{ label: 'Watcher', icon: 'fas fa-eye', url: '/flux/interface/watcher/toggle' },
				{
					label: 'Test',
					icon: 'far fa-caret-square-right',
					url: '/flux/service/context/updateRestart',
					value: { mode: 'test' }
				},
				{ label: 'Demo', icon: 'fas fa-play', url: '/flux/service/interaction/demo' },
				{ label: 'Data', icon: 'fas fa-database', url: 'https://odi.adrigarry.com/data' },
				{ label: 'Config', icon: 'fab fa-whmcs', url: 'https://odi.adrigarry.com/config.json' },
				{ label: 'Runtime', icon: 'fab fa-buffer', url: 'https://odi.adrigarry.com/runtime' }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);
	}
});

/** Volume component */
app.component('volume', {
	bindings: {
		data: '<',
		access: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function ($rootScope, DefaultTile) {
		let ctrl = this;
		let tileParams = {
			label: 'Volume',
			actionList: []
		};
		ctrl.tile = new DefaultTile(tileParams);
		ctrl.odiState = ctrl.odiState;

		ctrl.getVolumeIcon = function () {
			let fontAwesomeIcon = 'fa-volume-';
			fontAwesomeIcon += ctrl.data.volume ? '' : '';
			switch (ctrl.data.volume.value) {
				case 10: case 20: case 30:
					fontAwesomeIcon += 'off';
					break;
				case 40: case 50: case 60:
					fontAwesomeIcon += 'down';
					break;
				case 70: case 80: case 90: case 100:
					fontAwesomeIcon += 'up';
					break;
				default:
					fontAwesomeIcon += 'mute';
					break;
			}
			return fontAwesomeIcon;
		};

		/** Overwrite tile action */
		ctrl.tile.click = function () {
			if (!$rootScope.irda) {
				UIService.showErrorToast('Unauthorized action.');
			} else {
				let slider = {
					label: 'Volume',
					url: '/flux/interface/sound/volume',
					legend: '%',
					min: 0,
					max: 100,
					step: 10,
					value: ctrl.data.volume.value,
					action: null,
					formatTime: false
				};
				ctrl.tile.openSliderBottomSheet(slider);
			}
		};
	}
});

/** Alarms component */
app.component('alarms', {
	bindings: {
		data: '<',
		access: '<',
		odiState: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile, $rootScope, UIService, $mdpTimePicker) {
		let ctrl = this;
		let tileParams = {
			label: 'Alarms',
			actionList: [
				{ label: 'Sleep forever', icon: 'fas fa-moon', url: '/flux/service/context/sleepForever' },
				{ label: 'Disable all', icon: 'fas fa-ban', url: '/flux/service/alarm/off' },
				{ label: 'weekDay', icon: 'far fa-frown', url: '/flux/service/alarm/set', continu: true },
				{ label: 'weekEnd', icon: 'far fa-smile', url: '/flux/service/alarm/set', continu: true }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);
		ctrl.odiState = ctrl.odiState;

		ctrl.$onChanges = function (changes) {
			updateNextAlarm();
		};

		/** Overwrite tile action */
		ctrl.tile.click = function () {
			if (!$rootScope.irda) {
				UIService.showErrorToast('Unauthorized action.');
			} else {
				ctrl.tile.openBottomSheet(this.actionList, specificActions);
			}
		};

		let showTimePicker = function (ev) {
			// A déplacer dans Tile.js ?
			$mdpTimePicker(new Date(), {
				targetEvent: ev,
				autoSwitch: true
			}).then(function (selectedDate) {
				ctrl.newAlarm.value = {
					when: ctrl.newAlarm.label,
					h: selectedDate.getHours(),
					m: selectedDate.getMinutes()
				};
				ctrl.newAlarm.toast =
					ctrl.newAlarm.label + ' alarm set to ' + ctrl.newAlarm.value.h + ':' + ctrl.newAlarm.value.m;
				UIService.sendCommand(ctrl.newAlarm);
			});
		};

		let specificActions = function (button) {
			if (button.label !== 'Disable all' && button.label !== 'Sleep forever') {
				ctrl.newAlarm = button;
				showTimePicker();
			} else {
				ctrl.tile.action(button);
			}
		};

		const DAYS = { weekDay: [1, 2, 3, 4, 5], weekEnd: [6, 0] };
		let updateNextAlarm = function () {
			let ALARMS = ctrl.data.value;
			if (ALARMS.weekDay || ALARMS.weekEnd) {
				let now = new Date(),
					nextAlarms = {};
				Object.keys(ALARMS).forEach(key => {
					let nextAlarm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), ALARMS[key].h, ALARMS[key].m);
					while (!DAYS[key].includes(nextAlarm.getDay()) || nextAlarm < now) {
						nextAlarm = _incrementDay(nextAlarm, ALARMS[key]);
					}
					nextAlarms[key] = nextAlarm;
				});
				let alarmToReturn;
				if (nextAlarms.weekDay < nextAlarms.weekEnd) alarmToReturn = nextAlarms.weekDay;
				else alarmToReturn = nextAlarms.weekEnd;
				ctrl.nextAlarm = { h: alarmToReturn.getHours(), m: alarmToReturn.getMinutes() };
			} else ctrl.nextAlarm = false;
		};

		let _incrementDay = function (date, time) {
			return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, time.h, time.m);
		};
	}
});

/** Voicemail component */
app.component('voicemail', {
	bindings: {
		data: '<',
		access: '<',
		odiState: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile) {
		let ctrl = this;
		let tileParams = {
			label: 'Voicemail',
			actionList: [
				{ label: 'Clear', icon: 'far fa-trash-alt', url: '/flux/service/voicemail/clear' },
				{ label: 'Play', icon: 'fas fa-play', url: '/flux/service/voicemail/check' }
			]
		};

		ctrl.tile = new DefaultTile(tileParams);
		ctrl.odiState = ctrl.odiState;
	}
});

/** CPU component */
app.component('hardware', {
	bindings: {
		data: '<',
		access: '<',
		odiState: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile) {
		let ctrl = this;
		let tileParams = {
			label: 'Hardware',
			//disableOnSleep: true,
			actionList: [
				{ label: 'Disk Space', icon: 'fas fa-3x fa-chart-pie', url: '/flux/interface/hardware/diskSpaceTTS' },
				{ label: 'CPU', icon: 'fab fa-3x fa-empire', url: '/flux/interface/hardware/cpuTTS' },
				{ label: 'Memory', icon: 'fas fa-3x fa-microchip', url: '/flux/interface/hardware/soulTTS' }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);
		ctrl.odiState = ctrl.odiState;

		const MEMORY_REGEX = /([\d]+)\/([\d]+)/;
		ctrl.getMemoryPerCent = function () {
			let memory = ctrl.data.value.memory.system;
			let regexResult = memory.match(MEMORY_REGEX);
			return ((regexResult[1] / regexResult[2]) * 100).toFixed(0);
		};
	}
});

/** Exclamation component */
app.component('exclamation', {
	bindings: {
		data: '<',
		access: '<',
		odiState: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile) {
		let ctrl = this;
		let tileParams = {
			label: 'Exclamation',
			actionList: [
				{ label: 'HomeWork', icon: 'fas fa-briefcase', url: '/flux/service/interaction/homeWork' },
				{ label: 'Exclamation', icon: 'fas fa-bullhorn', url: '/flux/service/interaction/exclamation' },
				{ label: 'TTS', icon: 'far fa-comment-dots', url: '/flux/interface/tts/random' },
				{ label: 'Last TTS', icon: 'fas fa-undo', url: '/flux/interface/tts/lastTTS' }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);
		ctrl.odiState = ctrl.odiState;
	}
});

/** Music component */
app.component('music', {
	bindings: {
		data: '<',
		access: '<',
		odiState: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile) {
		let ctrl = this;
		let tileParams = {
			label: 'Music',
			actionList: [
				{ label: 'Low', icon: 'fas fa-kiwi-bird', url: '/flux/service/music/playlist', value: 'low' },
				{ label: 'Jukebox', icon: 'fas fa-compact-disc', url: '/flux/service/music/playlist' },
				{ label: 'Radio BAM', icon: 'fas fa-broadcast-tower', url: '/flux/service/music/radio', value: 'bam' },
				{ label: 'FIP Radio', icon: 'fas fa-globe-europe', url: '/flux/service/music/radio', value: 'fip' }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);
		ctrl.odiState = ctrl.odiState;

		ctrl.getIconClass = function () {
			if (ctrl.data.value === 'jukebox') {
				return 'fas fa-compact-disc';
			} else if (ctrl.data.value === 'fip') {
				return 'fas fa-globe-europe';
			} else if (ctrl.data.value === 'bam') {
				return 'fab fa-suse';
			} else if (ctrl.data.value === 'low') {
				return 'fas fa-kiwi-bird';
			} else {
				return 'fas fa-music';
			}
		};
	}
});

/** Audio recorder component */
app.component('audioRecorder', {
	bindings: {
		data: '<',
		access: '<',
		odiState: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile, $rootScope, UIService) {
		let ctrl = this;
		let tileParams = {
			label: 'Audio recorder',
			actionList: [
				{ label: 'Clear', icon: 'fas fa-trash', url: '/flux/service/audioRecord/clear' },
				{ label: 'All', icon: 'fas fa-play', url: '/flux/service/audioRecord/check' },
				{ label: 'Last', icon: 'fas fa-undo', url: '/flux/service/audioRecord/last' }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);
		ctrl.odiState = ctrl.odiState;

		/** Overwrite tile action */
		ctrl.tile.click = function () {
			ctrl.tile.openCustomBottomSheet(bottomSheetController, bottomSheetTemplate, this.actionList, bottomSheetCatch);
		};

		let bottomSheetCatch = function (audioService) {
			audioService.cancelRecord();
		};

		const bottomSheetTemplate = `
		<md-bottom-sheet class="md-grid" layout="column">
			<md-subheader data-ng-cloak>
				<span data-ng-show="!recording">Audio recorder</span>
				<span data-ng-show="recording">Speak now... <i>-{{countDown}}s</i></span>
			</md-subheader>
			<div data-ng-cloak>
				<span data-ng-if="$root.irda">
					<md-button data-ng-repeat="button in bottomSheetButtonList track by $index" data-ng-click="action(button)" class="md-grid-item-content">
						<i class="{{button.icon}} fa-2x"></i>
						<div class="md-grid-text">{{button.label}}</div>
					</md-button>
				</span>
				<md-button class="md-raised md-grid-item-content" data-ng-class="recording?'md-warn':'md-primary'" data-ng-click="toggleRecord()" title="ToggleRecord">
					<br>
					<i class="fas fa-2x {{waitRecording?'fa-circle-notch fa-spin':'fa-microphone'}}"></i>
					<br>{{recording ? 'Send':'Start'}}
				</md-button>
				<br>
			</div>
		</md-bottom-sheet>`;

		let bottomSheetController = function (
			$rootScope,
			$scope,
			$timeout,
			$interval,
			$mdBottomSheet,
			UIService,
			audioService
		) {
			let ctrl = $scope;
			ctrl.recording = false;
			ctrl.waitRecording = false;

			ctrl.action = function (cmd) {
				UIService.sendCommand(cmd, () => {
					$mdBottomSheet.hide(cmd);
				});
			};

			ctrl.toggleRecord = function () {
				if (!ctrl.recording) {
					ctrl.waitRecording = true;
					audioService.startRecord(isRecording => {
						$timeout(() => {
							ctrl.waitRecording = false;
							ctrl.recording = isRecording;
							startCountDown();
						}, 1000);
					});
				} else {
					ctrl.waitRecording = true;
					$timeout(() => {
						audioService.stopRecord(isRecording => {
							ctrl.waitRecording = false;
							ctrl.recording = isRecording;
							ctrl.countDown = 0;
						});
					}, 1000);
				}
			};

			function startCountDown() {
				ctrl.countDown = $rootScope.irda ? 30 : 10;
				ctrl.countDownInterval = $interval(() => {
					ctrl.countDown--;
					if (!ctrl.countDown || !ctrl.recording) {
						$interval.cancel(ctrl.countDownInterval);
						if (ctrl.recording) {
							ctrl.toggleRecord();
						}
					}
				}, 1000);
			}
		};
	}
});

/** Timer component */
app.component('timer', {
	bindings: {
		data: '<',
		access: '<',
		odiState: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile, $rootScope, UIService) {
		let ctrl = this;
		let tileParams = {
			label: 'Timer',
			actionList: [
				{ label: 'Stop timer', icon: 'fas fa-stop', url: '/flux/service/timer/stop' },
				{
					label: 'Manual',
					icon: 'fas fa-hourglass-half',
					url: '/flux/service/timer/increase',
					value: 3,
					continu: true
				},
				{ label: 'Timer +3', icon: 'fas fa-plus', url: '/flux/service/timer/increase', value: 3 },
				{ label: 'Timer +1', icon: 'fas fa-plus', url: '/flux/service/timer/increase', value: 1 }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);
		ctrl.odiState = ctrl.odiState;

		/** Overwrite tile action */
		ctrl.tile.click = function () {
			if (!$rootScope.irda) {
				UIService.showErrorToast('Unauthorized action.');
			} else {
				ctrl.tile.openBottomSheet(this.actionList, specificActions);
			}
		};

		let specificActions = function (button) {
			if (button.label.indexOf('Manual') != -1) {
				let slider = {
					label: 'Manual timer',
					url: '/flux/service/timer/increase',
					legend: 'min',
					min: 2,
					max: 30,
					step: 1,
					value: 10,
					action: null,
					formatTime: false
				};
				ctrl.tile.openSliderBottomSheet(slider);
			} else {
				ctrl.tile.action(button);
			}
		};
	}
});

/** Time component */
app.component('time', {
	bindings: {
		data: '<',
		access: '<',
		odiState: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile) {
		let ctrl = this;
		let tileParams = {
			label: 'Time',
			// actionList:[{url: '/time'}]
			actionList: [
				{ label: 'Bot age', icon: 'fas fa-birthday-cake', url: '/flux/service/time/age' },
				{ label: 'Today', icon: 'fas fa-calendar-alt', url: '/flux/service/time/today' },
				{ label: 'Time', icon: 'far fa-clock', url: '/flux/service/time/now' }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);
		ctrl.odiState = ctrl.odiState;
	}
});

/** Weather component */
app.component('weather', {
	bindings: {
		data: '<',
		access: '<',
		odiState: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile) {
		let ctrl = this;
		let tileParams = {
			label: 'Weather',
			actionList: [
				{ label: 'Refresh report', icon: 'fas fa-sync', url: '/flux/service/weather/refresh' },
				{ label: 'Astronomy', icon: 'far fa-sun', url: '/flux/service/weather/astronomy' },
				{ label: 'Official weather', icon: 'fas fa-cloud-sun', url: '/flux/service/weather/report' },
				{ label: 'Alternative weather', icon: 'fas fa-cloud-sun-rain', url: '/flux/service/weather/alternative' }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);
		ctrl.odiState = ctrl.odiState;
	}
});

/** Maya component */
app.component('maya', {
	bindings: {
		data: '<',
		access: '<',
		odiState: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile) {
		let ctrl = this;
		let tileParams = {
			label: 'Maya',
			actionList: [
				{ label: 'Animals', icon: 'fas fa-cat', url: '/flux/service/maya/animals' },
				{ label: 'Bonne nuit', icon: 'fas fa-moon', url: '/flux/service/maya/bonneNuit' },
				{ label: 'Playlist Maya', icon: 'fas fa-music', url: '/flux/service/maya/playlist' },
				{ label: 'Comptines', icon: 'fas fa-music', url: '/flux/service/music/playlist', value: 'comptines' }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);
		ctrl.odiState = ctrl.odiState;
	}
});

/** Idea component */
app.component('idea', {
	bindings: {
		data: '<',
		access: '<',
		odiState: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile) {
		let ctrl = this;
		let tileParams = {
			label: 'Idea',
			actionList: [
				{ label: 'Total lines', icon: 'far fa-file-code', url: '/flux/interface/hardware/totalLinesTTS' },
				{
					label: 'Cigales',
					icon: 'fas fa-bug',
					url: '/flux/interface/sound/play',
					value: { mp3: 'system/cigales.mp3' }
				},
				{
					label: 'Idea',
					icon: 'far fa-lightbulb',
					url: '/flux/interface/tts/speak',
					value: { lg: 'en', msg: "I've got an idea !" }
				},
				{ label: 'Test', icon: 'fas fa-flag-checkered', url: '/test' }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);
		ctrl.odiState = ctrl.odiState;
	}
});

/** Stories component */
app.component('stories', {
	bindings: {
		data: '<',
		access: '<',
		odiState: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile) {
		let ctrl = this;
		let tileParams = {
			label: 'Stories',
			actionList: [
				{ label: 'Naheulbeuk', icon: 'fab fa-fort-awesome', url: '/flux/service/music/story', value: 'naheulbeuk' },
				{ label: 'Survivaure', icon: 'fas fa-space-shuttle', url: '/flux/service/music/story', value: 'survivaure' }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);
		ctrl.odiState = ctrl.odiState;
	}
});

/** Bad boy component */
app.component('badBoy', {
	bindings: {
		data: '<',
		access: '<',
		odiState: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile, $rootScope, UIService) {
		let ctrl = this;
		let tileParams = {
			label: 'Bad boy',
			actionList: [
				{ label: 'Java', icon: 'fas fa-grin-squint-tears', url: '/flux/service/party/java' },
				{ label: 'BadBoy Mode', icon: 'fas fa-hand-middle-finger', url: '/flux/service/party/badBoy', continu: true },
				{ label: 'BadBoy TTS', icon: 'fas fa-hand-middle-finger', url: '/flux/service/party/badBoy' }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);
		ctrl.odiState = ctrl.odiState;

		/** Overwrite tile action */
		ctrl.tile.click = function () {
			if (!$rootScope.irda) {
				UIService.showErrorToast('Unauthorized action.');
			} else {
				ctrl.tile.openBottomSheet(this.actionList, specificActions);
			}
		};

		let specificActions = function (button) {
			if (button.label.toUpperCase().indexOf('BADBOY MODE') != -1) {
				let slider = {
					label: 'Bad boy interval',
					url: '/flux/service/party/badBoy',
					legend: 'min',
					min: 10,
					max: 300,
					step: 1,
					value: 60,
					action: null,
					formatTime: true
				};
				ctrl.tile.openSliderBottomSheet(slider);
			} else {
				ctrl.tile.action(button);
			}
		};
	}
});

/** Party component */
app.component('party', {
	bindings: {
		data: '<',
		access: '<',
		odiState: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile) {
		let ctrl = this;
		let tileParams = {
			label: 'Party',
			actionList: [
				{ label: 'Birthday song', icon: 'fas fa-birthday-cake', url: '/flux/service/party/birthdaySong' },
				{ label: 'Party mode', icon: 'far fa-grin-tongue', url: '/flux/service/party/start' },
				{ label: 'Pirate', icon: 'fas fa-beer', url: '/flux/service/party/pirate' },
				{ label: 'TTS', icon: 'far fa-comment-dots', url: '/flux/service/party/tts' }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);
		ctrl.odiState = ctrl.odiState;
	}
});

/** Russia component */
app.component('russia', {
	bindings: {
		data: '<',
		access: '<',
		odiState: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile) {
		let ctrl = this;
		let tileParams = {
			label: 'Russia',
			actionList: [
				{ label: 'Civil Horn', icon: 'fas fa-bullhorn', url: '/flux/service/interaction/civilHorn' },
				{ label: 'Subway / Street', icon: 'fas fa-subway', url: '/flux/service/interaction/russia' },
				{ label: 'Hymn', icon: 'fas fa-star', url: '/flux/service/interaction/russiaHymn' }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);
		ctrl.odiState = ctrl.odiState;
	}
});

/** Video component */
app.component('videos', {
	bindings: {
		data: '<',
		access: '<',
		odiState: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile) {
		let ctrl = this;
		let tileParams = {
			label: 'Video',
			actionList: [
				{ label: 'Off', icon: 'fas fa-toggle-off', url: '/flux/interface/hdmi/off' },
				{ label: 'On', icon: 'fas fa-toggle-on', url: '/flux/interface/hdmi/on' },
				{ label: 'Loop', icon: 'fas fa-film', url: '/flux/service/video/loop' }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);
	}
});

/** Max component */
app.component('max', {
	bindings: {
		data: '<',
		access: '<',
		odiState: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile) {
		let ctrl = this;
		let tileParams = {
			label: 'Max',
			actionList: [
				{ label: 'RDM Led', icon: 'far fa-sun', url: '/flux/service/max/blinkRdmLed' },
				{ label: 'All Led', icon: 'fas fa-sun', url: '/flux/service/max/blinkAllLed' },
				{ label: 'Melody', icon: 'fas fa-music', url: '/flux/service/max/playOneMelody' },
				{ label: 'RDM Melody', icon: 'fas fa-exchange-alt', url: '/flux/service/max/playRdmMelody' },
				{ label: 'Horn', icon: 'fas fa-bullhorn', url: '/flux/service/max/hornRdm' },
				{ label: 'Turn', icon: 'fas fa-sync', url: '/flux/service/max/turn' }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);
	}
});

/** Radiator component */
app.component('radiator', {
	bindings: {
		data: '<',
		access: '<',
		odiState: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile, $rootScope, UIService) {
		let ctrl = this;
		let tileParams = {
			label: 'Radiator',
			actionList: [
				{
					label: 'On Timeout',
					icon: 'fas fa-clock',
					url: '/flux/service/radiator/timeout',
					value: { mode: 'on' },
					continu: true
				},
				{
					label: 'Off Timeout',
					icon: 'fas fa-clock',
					url: '/flux/service/radiator/timeout',
					value: { mode: 'off' },
					continu: true
				},
				{
					label: 'Radiator on',
					icon: 'fas fa-toggle-on',
					url: '/flux/service/radiator/manual',
					value: 'on'
				},
				{
					label: 'Radiator off',
					icon: 'fas fa-toggle-off',
					url: '/flux/service/radiator/manual',
					value: 'off'
				}
			]
		};
		ctrl.tile = new DefaultTile(tileParams);

		ctrl.isTimeout = function () {
			let obj = ctrl.data.config.radiator;
			return typeof obj === 'object';
			//return !isNaN(ctrl.data.config.radiator);
		};

		/** Overwrite tile action */
		ctrl.tile.click = function () {
			if (!$rootScope.irda) {
				UIService.showErrorToast('Unauthorized action.');
			} else {
				ctrl.tile.openBottomSheet(this.actionList, specificActions);
			}
		};

		let specificActions = function (button) {
			if (button.label.toUpperCase().indexOf('TIMEOUT') != -1) {
				let slider = {
					label: button.label,
					url: '/flux/service/radiator/timeout',
					legend: 'h',
					min: 10,
					max: 360,
					step: 10,
					value: 120,
					action: null,
					formatTime: true,
					data: button.value
				};
				ctrl.tile.openSliderBottomSheet(slider, specificEndAction);
			} else {
				ctrl.tile.action(button);
			}
		};

		let specificEndAction = function (button) {
			button.value = { mode: button.label.toUpperCase().indexOf('ON') > -1 ? 'on' : 'off', timeout: button.value };
			ctrl.tile.action(button);
		};
	}
});

/** Power plug component */
app.component('powerPlug', {
	bindings: {
		data: '<',
		access: '<',
		odiState: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile, $rootScope) {
		let ctrl = this;
		let tileParams = {
			label: 'Power plug',
			actionList: [
				{ label: 'plug A', icon: 'fas fa-plug', value: { device: 'plugA', continu: true } },
				{ label: 'plug B', icon: 'fas fa-plug', value: { device: 'plugB', continu: true } },
				{ label: 'plug C', icon: 'fas fa-plug', value: { device: 'plugC', continu: true } }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);
		ctrl.odiState = ctrl.odiState;

		ctrl.getPlugStatus = function (plugId) {
			let plugStatus = ctrl.data.value[plugId].status;
			if (plugStatus === 'on') return 'fa-plug';
			else if (plugStatus === 'off') return 'fa-plug opacity50';
			else return 'fa-question opacity20';
		};

		/** Overwrite tile action */
		ctrl.tile.click = function () {
			if (!$rootScope.irda) {
				UIService.showErrorToast('Unauthorized action.');
			} else {
				ctrl.tile.openBottomSheet(this.actionList, specificPlugActions);
			}
		};

		const PLUG_FLUX_URL = '/flux/interface/rfxcom/send';
		let specificPlugActions = function (action) {
			let actionList = [
				{
					label: action.label + ' on',
					icon: 'fas fa-toggle-on',
					url: PLUG_FLUX_URL,
					value: { device: action.value.device, value: true }
				},
				{
					label: action.label + ' off',
					icon: 'fas fa-toggle-off',
					url: PLUG_FLUX_URL,
					value: { device: action.value.device, value: false }
				}
			];

			ctrl.tile.openBottomSheet(actionList, ctrl.tile.action);
		};
	}
});

/** Arduino component */
app.component('arduino', {
	bindings: {
		data: '<',
		access: '<',
		odiState: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile) {
		let ctrl = this;
		let tileParams = {
			label: 'Arduino',
			actionList: [
				{ label: 'Off', icon: 'fas fa-toggle-off', url: '/flux/interface/arduino/disconnect' },
				{ label: 'On', icon: 'fas fa-toggle-on', url: '/flux/interface/arduino/connect' }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);
	}
});

/** Rfxcom component */
app.component('rfxcom', {
	bindings: {
		data: '<',
		access: '<',
		odiState: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile) {
		let ctrl = this;
		let tileParams = {
			label: 'Rfxcom',
			actionList: [
				{ label: 'Off', icon: 'fas fa-toggle-off', url: '/flux/interface/rfxcom/toggleLock', value: false },
				{ label: 'On', icon: 'fas fa-toggle-on', url: '/flux/interface/rfxcom/toggleLock', value: true }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);
		ctrl.odiState = ctrl.odiState;
	}
});

/** Tasks component */
app.component('tasks', {
	bindings: {
		data: '<',
		access: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile) {
		let ctrl = this;
		let tileParams = {
			label: 'Tasks',
			actionList: [
				{ label: 'Renew Certbot', icon: 'fas fa-tools', url: '/flux/service/task/certbot' },
				{ label: 'Mosquito', icon: 'fas fa-spider', url: '/flux/service/mosquitoRepellent/toggle' },
				{ label: 'goToSleep', icon: 'fas fa-bed', url: '/flux/service/task/goToSleep' }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);
	}
});

/** Logs component */
app.component('history', {
	bindings: {
		data: '<',
		access: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile) {
		let ctrl = this;
		let tileParams = {
			label: 'History',
			actionList: [
				{ label: 'Trash uploads', icon: 'fas fa-microphone', url: '/audio/trash' },
				{ label: 'Archive logs', icon: 'fas fa-file-archive', url: '/flux/interface/hardware/archiveLogs' },
				{ label: 'TTS', icon: 'far fa-comment-dots', url: 'https://odi.adrigarry.com/ttsUIHistory' },
				{ label: 'Voicemail', icon: 'far fa-envelope', url: 'https://odi.adrigarry.com/voicemailHistory' },
				{ label: 'Request', icon: 'fas fa-exchange-alt', url: 'https://odi.adrigarry.com/requestHistory' },
				{ label: 'Errors', icon: 'fab fa-sith', url: 'https://odi.adrigarry.com/errorHistory' }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);
	}
});

/** System component */
app.component('system', {
	bindings: {
		data: '<',
		access: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile) {
		let ctrl = this;
		let tileParams = {
			label: 'System',
			actionList: [
				{ label: 'Light', icon: 'far fa-sun', url: '/flux/interface/hardware/light', value: 120 },
				{ label: 'Shutdown', icon: 'fas fa-power-off', url: '/flux/interface/hardware/shutdown' },
				{ label: 'Reboot', icon: 'fas fa-sync', url: '/flux/interface/hardware/reboot' }
			]
		};
		ctrl.tile = new DefaultTile(tileParams);
	}
});

/** About component */
app.component('about', {
	bindings: {
		data: '<'
	},
	templateUrl: 'templates/tiles.html',
	controller: function (DefaultTile) {
		let ctrl = this;
		let tileParams = {
			label: 'About',
			actionList: [{ url: 'https://odi.adrigarry.com/about' }]
		};
		ctrl.access = true;
		ctrl.tile = new DefaultTile(tileParams, true);
	}
});
