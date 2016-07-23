/** Déclaration du controller de la vue Home/TTS */
odiUI.controller('TTSController', [ '$scope', '$location', 'TTSService',
	function($scope, $location, TTSService) {

		$scope.logView = false;
		$scope.openMenu();

		$scope.tts = { // Initialisation objet TTS
			voice: ':3',
			lg: 'fr',
			msg: '',
			voicemail: false,
			error: '',
			cleanText: function(){
				var message = $scope.tts.msg || '';
				message = message.replace(/[àâ]/g,'a');
				message = message.replace(/[ç]/g,'c');
				message = message.replace(/[èéêë]/g,'e');
				message = message.replace(/[îï]/g,'i');
				message = message.replace(/[ôóö]/g,'o');
				message = message.replace(/[ù]/g,'u');
				$scope.tts.msg = message;
			},
			submit: function(){
				// console.log($scope.tts);
				TTSService.sendTTS($scope.tts, function(callback){
					if(callback.status != 200) $scope.tts.error = 'UNE ERREUR EST SURVENUE';
					console.log(callback);
				});
				$scope.resetTTS();
			}
		};


		/** Fonction init TTS object */
		$scope.resetTTS = function(){
			$scope.tts.msg = ''; $scope.tts.error = '';
		};
	}
]);


/* Sercice TTS */
odiUI.factory('TTSService',['$http', function($http){
	var TTSService = {};
	
	/** Fonction envoi message TTS */
	TTSService.sendTTS = function(tts, callback){
		$http({
			method: 'POST',
			url: 'http://odi.adrigarry.com/tts?voice=' + tts.voice + '&lg=' + tts.lg 
				+ '&msg=' + tts.msg + (tts.voicemail ? '&voicemail' : '')
		}).then(function successCallback(res){
			callback(res);
		}, function errorCallback(res){
			console.error(res);
			callback(res);
		});
	};

	return TTSService;
}]);
