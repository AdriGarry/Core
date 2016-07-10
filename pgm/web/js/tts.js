/*
 * D�claration du controller de la page Home
 *
 * @param $scope : variable Angular pour faire le lien entre le controller et le HTML
 * @param $location : variable Angular permettant de modifier l'URL
  */
odiUI.controller('TTSController', [ '$scope', '$location', 'TTSService',
	function($scope, $location, TTSService) {

		$scope.logView = false;
		$scope.openMenu();

		$scope.ttsMessage = '';

		$scope.sendTTS = function(){
			console.log('sendTTS 1');
			TTSService.sendTTS();
		}
	}
]);



/* D�claration du service de constante pour stocker toutes les cha�nes de caract�res */
odiUI.factory('TTSService',function() { // A METTRE DANS UN OBJET JSON
	var TTSService = {};
	
	/** Fonction de remplassement des caracteres speciaux */
	TTSService.cleanText = function(){
		var message = document.getElementById('message').value;
		message = message.replace(/[��]/g,'a');
		message = message.replace(/[�]/g,'c');
		message = message.replace(/[����]/g,'e');
		message = message.replace(/[��]/g,'i');
		message = message.replace(/[���]/g,'o');
		message = message.replace(/[�]/g,'u');
		document.getElementById("message").value = message;
	};

	/** Fonction envoi message TTS */
	TTSService.sendTTS = function(){
		console.log('TTSService.sendTTS 2');
	};

	return TTSService;
});
