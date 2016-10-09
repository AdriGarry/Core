'use strict'
app.controller('UIController', function($rootScope, $scope, $timeout, $interval, $sce, $window, $mdSidenav,
		$mdBottomSheet, $mdToast, CONSTANTS, UIService){
	$scope.loading = false;/*true*/
	$scope.pauseUI = false;
	$scope.irda = false;

	$scope.logData;
	$scope.showLogs = showLogs();

	$scope.dashboard = {
		mode: '',
		loading: false,
		ttsTile: {
			label: 'TTS - Voice synthesizing',
			color: 'grey',/*lightBlue*/
			rowspan : 1,
			colspan: 3,
			voice: ':3',
			lg: 'fr',
			msg: '',
			voicemail: false,
			error: '',
			conf: {
				languageList: [{code: 'fr', label: 'French'}, {code: 'en', label: 'English'}, {code: 'ru', label: 'Russian'},
					{code: 'es', label: 'Spanish'}, {code: 'it', label: 'Italian'}, {code: 'de', label: 'German'}],
				voiceList: [{code: ':3', label: 'Nice voice'}, {code: ':1', label: 'Robot voice'}]
			},
			cleanText: function(){
				var message = $scope.dashboard.ttsTile.msg || '';
				message = message.replace(/[àâ]/g,'a');
				message = message.replace(/[ç]/g,'c');
				message = message.replace(/[èéêë]/g,'e');
				message = message.replace(/[îï]/g,'i');
				message = message.replace(/[ôóö]/g,'o');
				message = message.replace(/[ù]/g,'u');
				$scope.dashboard.ttsTile.msg = message;
			},
			submit: function(){
				if($scope.dashboard.ttsTile.msg != ''){
					$scope.showToast($scope.dashboard.ttsTile.msg);
					// LIMITER / TRONQUER la longueur du message !!! WWWWWWWW => 200

					UIService.sendTTS($scope.dashboard.ttsTile, function(callback){
						if(callback.status != 200) $scope.dashboard.ttsTile.error = 'UNE ERREUR EST SURVENUE';
						// console.log(callback);
					});
					$scope.dashboard.ttsTile.msg = ''; $scope.dashboard.ttsTile.error = ''; // Reinit TTS
				}
			}
		},
		tileList: UIService.initDashboardTiles
	};

	/** Function to refresh Dashboard **/
	$scope.refreshDashboard = function(){
		console.log('refreshDashboard()');
		$scope.dashboard.loading = true;
		UIService.refreshDashboard(function(data){
			angular.forEach(data, function(tile, key){
				$scope.dashboard.tileList[key].value = data[key].value;
				$scope.dashboard.tileList[key].bindHTML(key);
			});
			$timeout(function(){$scope.dashboard.loading = false;}, 100);
		});
	}

	/** Function to pop down toast */
	$scope.showToast = function(label) {
		$mdToast.show($mdToast.simple().textContent(label).position('top right').hideDelay(1500));
	};

	/** Function to show Logs */
	function showLogs(){
		$scope.logData = undefined;
		return function(){
			$mdSidenav('logs').toggle().then(function(){
				$scope.refreshLog();
			});
		}
	};
	/** Function to hide Logs */
	$scope.hideLogs = function(){
		$mdSidenav('logs').close().then(function(){});
	};
	/** Function to refresh logs */
	$scope.refreshLog = function(){
		// console.log('refreshing logs');
		//$scope.logData = undefined;
		var ipRegex = '^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$';
		UIService.updateLogs(function(logs){
			logs = logs.replace(/\[([0-9]{1,3}\.){3}([0-9]{1,3})\]/g, function(match, capture){
				var ip = match.substr(1,match.length-2);
				if(ip.search(/(^192\.168\.)/g)){
					return '[<a href="'+ CONSTANTS.URL_IP_LOCALIZATOR + ip + '" title="Localize this IP" target="_blank">' + ip + '</a>]';
				}else{
					return '[' + ip + ']';
				}
			});
			$scope.logData = logs.split('\n');
		});
	};


	/** Function to send action **/
	$scope.action = function(button){
		// console.log(button);
		if(button.url.indexOf('http://') > -1){
			$window.open(button.url);
		}else{
			$scope.showToast(button.label);
			UIService.sendCommand(button);
		}
	};
	/** Function on click on Tile **/
	$scope.tileAction = function(tile){
		if($scope.irda){
			if(tile.actionList.length>1){
				$scope.openBottomSheet(tile.actionList);
			}else{
				$scope.action(tile.actionList[0]);
			}
		}
	}
	/** Function to open bottom sheet **/
	$scope.openBottomSheet = function(bottomSheetList){
		if($scope.irda){
			$rootScope.bottomSheetButtonList = bottomSheetList;
			$scope.alert = '';
			$mdBottomSheet.show({
				templateUrl: 'templates/bottom-sheet.html',
				controller: 'UIController',
				clickOutsideToClose: true
			}).then(function(action){
				// $scope.showToast(action.label);
			});
		}
	};
	/** Function on click on bottom sheet **/
	$scope.bottomSheetAction = function(button){
		$scope.action(button);
		$mdBottomSheet.hide(button);
	};

	/** Function to inject HTML code */
	$scope.toHtml = function(html){
		// console.log(html);
		return $sce.trustAsHtml(html);
	};

	/** Start auto update Dashboard (10s) **/
	$scope.refreshDashboard();
	$interval(function(){
		$scope.refreshDashboard();
	}, 10000);

	/** Function to expand Tile */
	$scope.expandTile = function(obj){
		if(obj.hasOwnProperty('rowspan')) obj.rowspan = 2;
	};
	/** Function to reduce Tile */
	$scope.reduceTile = function(obj){
		console.log(obj);
		obj.rowspan = 1;
		console.log(obj);
	};

	/*var setAdminCp = 0;
	$scope.tryAdmin = function(){
		setAdminCp++;
		if(setAdminCp > 2) $scope.irda = true;
	}*/
});