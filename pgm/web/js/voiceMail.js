/*
 * Declaration du controller de la page VoiceMail
 *
 * @param $scope : variable Angular pour faire le lien entre le controller et le HTML
 * @param $location : variable Angular permettant de modifier l'URL
  */
odiUI.controller('VoiceMailController', [ '$scope', '$location',
	function($scope, $location) {
		
		$scope.logView = false;
		$scope.openMenu();
	}
 ]);