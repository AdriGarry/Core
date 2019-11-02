'use strict';
app.controller('UIController', function(
	$rootScope,
	$scope,
	$location,
	$http,
	$filter,
	$timeout,
	$interval,
	$sce,
	$window,
	$mdSidenav,
	$mdDialog,
	$mdBottomSheet,
	CONSTANTS,
	UIService
) {
	$scope.loading = false; /*true*/
	$scope.pauseUI = false;
	$rootScope.irda = false;
	$scope.menuOpen = false;

	$scope.logData;
	$scope.log = { fullLine: true };

	$scope.isVolumePersistent = false;

	$scope.volumeChange = function() {
		let command = {
			label: 'Volume ' + $scope.dashboard.runningData.volume.value + '%',
			url: '/flux/interface/sound/volume',
			value: { value: $scope.dashboard.runningData.volume.value }
		};
		if ($scope.isVolumePersistent) {
			command.label += ' #';
			command.value = {
				value: {
					volume: $scope.dashboard.runningData.volume.value,
					isPersistent: $scope.isVolumePersistent
				}
			};
		}
		UIService.sendCommand(command, () => {});
	};

	$scope.dashboard = {
		odiState: setOdiState(),
		run: null,
		// odiState: {},
		autoRefresh: true,
		loading: false,
		runningData: null
	};

	/** Function to refresh Dashboard **/
	$scope.readyToRefresh = true;
	var failedRefreshs = 0;
	$scope.connexionLost = false;
	$scope.refreshDashboard = function() {
		if ($scope.dashboard.autoRefresh && $scope.readyToRefresh) {
			$scope.dashboard.refreshing = true;
			UIService.refreshDashboard(function(data) {
				if (data) {
					$scope.dashboard.odiState = setOdiState(data);
					$scope.dashboard.run = data.run;
					$scope.dashboard.runningData = data;
					$scope.connexionLost = false;
					failedRefreshs = 0;
					$timeout(function() {
						$scope.dashboard.refreshing = false;
					}, 100);
				} else {
					failedRefreshs++;
					if (failedRefreshs >= 2) $scope.connexionLost = true;
					$scope.connexionLost = true;
				}
			});
			$scope.readyToRefresh = false;
			$timeout(function() {
				$scope.readyToRefresh = true;
				if ($scope.dashboard.refreshing) $scope.refreshDashboard();
			}, 2000);
		}
	};
	$scope.refreshDashboard();

	function setOdiState(data) {
		var odiState = {};
		if (data) {
			odiState = {
				value: data.mode.value.mode || 'unavailable',
				ready: data.mode.value.mode == 'Ready',
				sleep: data.mode.value.mode == 'Sleep',
				debug: data.debug.value,
				trace: data.trace.value,
				watcher: data.watcher.value
			};
		} else {
			odiState = {
				value: 'unavailable',
				ready: false,
				sleep: false
			};
		}
		console.log('setOdiState()', odiState);
		return odiState;
	}

	/** Function to reloadUI */
	$scope.reloadUI = function() {
		console.log('reloadUI');
		$timeout(function() {
			$window.location.reload();
		}, 300);
	};

	/** Function to show/hide menu */
	$scope.toggleMenu = function() {
		if (!$scope.menuOpen) {
			$scope.menuOpen = true;
			$mdSidenav('logs').close();
			$mdDialog.cancel();
			$timeout(function() {
				$mdSidenav('menu')
					.toggle()
					.then(function() {});
				$mdSidenav('menu').onClose(function() {
					$scope.menuOpen = false;
				});
			}, 200);
		} else {
			$scope.menuOpen = false;
			$mdSidenav('menu')
				.close()
				.then(function() {});
		}
	};

	/** Function to show logs */
	$scope.showLogs = function() {
		$mdSidenav('menu').close();
		$scope.logData = undefined;
		$timeout(function() {
			$mdSidenav('logs')
				.toggle()
				.then(function() {
					$scope.refreshLog();
				});
		}, 200);
	};

	/** Function to show logs */
	$scope.showErrors = function() {
		UIService.getRequest('https://odi.adrigarry.com/errors', function(data) {
			$mdDialog.show({
				controller: DialogController,
				templateUrl: 'templates/dialog.html',
				locals: {
					data: data,
					from: null
				},
				parent: angular.element(document.body),
				clickOutsideToClose: true,
				fullscreen: false // Only for -xs, -sm breakpoints
			});
		});
	};

	/** Function to hide logs */
	$scope.hideLogs = function() {
		$mdSidenav('logs')
			.close()
			.then(function() {});
	};

	/** Function to refresh logs */
	$scope.refreshLog = function() {
		UIService.updateLogs(function(logs) {
			$scope.logData = logs.split('\n');
		});
	};

	/** Function to action for header & fab buttons */
	$scope.action = function(action) {
		UIService.sendCommand(action, function(data) {
			$scope.refreshDashboard();
		});
	};

	/** Function to show fab buttons for 5 seconds */
	var timeout;
	$scope.showFabButtons = function() {
		if (timeout) {
			$timeout.cancel(timeout);
		}
		$scope.fabButtonsVisible = true;
		timeout = $timeout(function() {
			$scope.fabButtonsVisible = false;
		}, 4000);
	};
	$timeout(function() {
		$scope.showFabButtons();
	}, 2000);

	/** Function to inject HTML code */
	$scope.toHtml = function(html) {
		return $sce.trustAsHtml(html);
	};

	/** Function to expand Tile */
	$scope.expandTile = function(obj) {
		if (obj.hasOwnProperty('rowspan')) obj.rowspan = 2;
	};

	// /** Function to reduce Tile */ // Deprecated
	// $scope.reduceTile = function(obj) {
	// 	console.log(obj);
	// 	obj.rowspan = 1;
	// 	console.log(obj);
	// };

	$scope.toggleDebugMode = function() {
		var cmd = {
			label: '!Debug',
			url: '/toggleDebug'
		};
		console.log('toggleDebugMode()');
		UIService.sendCommand(cmd);
	};

	$scope.showDialog = function(modal) {
		$mdDialog.show({
			controller: DialogController,
			templateUrl: 'templates/dialog.html',
			locals: {
				modal: modal
			},
			parent: angular.element(document.body),
			clickOutsideToClose: true,
			fullscreen: false // Only for -xs, -sm breakpoints
		});
	};

	/** Function to toggle grant access */
	$scope.toggleGrant = function(ev) {
		$scope.toggleMenu();
		if (!$rootScope.irda) {
			$timeout(function() {
				$mdDialog
					.show({
						controller: AdminDialogController,
						templateUrl: 'templates/dialog-admin.html',
						parent: angular.element(document.body),
						targetEvent: ev,
						clickOutsideToClose: true,
						fullscreen: $scope.customFullscreen // Only for -xs, -sm breakpoints
					})
					.then(function(answer) {
						$scope.requireGrantAccess(answer);
					});
			}, 100);
		} else {
			$rootScope.irda = false;
		}
	};

	$scope.requireGrantAccess = function(param) {
		UIService.sendCommand({ url: '/grant', data: param }, function(data) {
			$rootScope.irda = data;
			if ($rootScope.irda) {
				// UIService.showToast('Access granted !');
			} else {
				// UIService.showErrorToast('Not granted !');
			}
		});
	};
	var param = $location.$$absUrl.split('?')[1];
	if (param) $scope.requireGrantAccess(param);

	/** Loading until app bootstrapped */
	angular.element(document).ready(function() {
		angular.element(document.querySelector('.loading')).removeClass('loading');
	});
});

function DialogController($scope, $mdDialog, data, from) {
	$scope.modal = {
		raw: data,
		from: from
	};
	if (typeof data == 'string') {
		$scope.modal.data = data.split('\n');
	} else {
		$scope.modal.data = data;
	}

	/** Function to test if number */
	$scope.isNumber = angular.isNumber;

	/** Function to close modal */
	$scope.close = function() {
		$mdDialog.cancel();
	};
}

function AdminDialogController($scope, $mdDialog) {
	/** Function to close modal */
	$scope.hide = function() {
		$mdDialog.hide();
	};

	/** Function to close modal */
	$scope.cancel = function() {
		$mdDialog.cancel();
	};

	/** Function to submit modal */
	$scope.answer = function(answer) {
		$mdDialog.hide(answer);
	};
}
