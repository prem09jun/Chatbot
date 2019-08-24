/* Angular Module Definition */
var myApp = angular.module('myModule', ["pubnub.angular.service"]);

/* Chat Bot Controller */
myApp.controller('chatbotController', function ($scope, $compile, $http, $filter, $window, Pubnub) {
  // DB Json Structure
  var dbData = {_id: '', userId: '', ticketId: '', ticketStatus:'', shortDescription:'', longDescription:'', priority: '', currentMsg: ''};
  $scope.dbData = dbData;
  $scope.theText = "";
  // Web recognition started
  $scope.speak = function () {
      $scope.theText = "";
      var recognition = new webkitSpeechRecognition();
      recognition.onresult = function (event) {
        $scope.$apply(function() {
          for (var i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              $scope.theText  += event.results[i][0].transcript;
            }
          }
		  var time = new Date().getHours() +':'+ new Date().getMinutes();
		  $scope.dbData.currentMsg = $scope.theText;
		  $scope.createUserChatBox($scope.dbData, time);
        });
      };
      recognition.start();
  };

	// Call to conversation api to fetch what data to spoke out via bot
    $scope.textToSpeech = function (data) {
        var data = {
            msg: data
        }
        $http({
            method: 'POST',
            url: '/textToSpeech',
            data: data
        }).then(function successCallback(response) {
            if (response.data.success == true) {
				$scope.sayIt('Hello World');				
            } else {
                alert("You have already applied for skill sets.");
                window.close();
            }
        });
    };

  // Create chat box window for user
  $scope.createUserChatBox = function (textData, time) {
	var elementToAdd = angular.element(document.querySelector('.box'));
	var html='<div class="container darker"><img src="/img/user.png" alt="Avatar" class="right"/><p>'+textData+'</p><span class="time-left">'+time+'</span></div>' ;
	elementToAdd.append(html);
	$compile(elementToAdd)($scope);
	$scope.textToSpeech(textData);
  };

  // Create chat box window for bot
  $scope.createBotChatBox = function (textData, time) {
	var elementToAdd = angular.element(document.querySelector('.box'));
	var html='<div class="container"><img src="/img/bot.png" alt="Avatar"/><p>'+textData+'</p><span class="time-right">'+time+'</span></div>' ;
	elementToAdd.append(html);
	$compile(elementToAdd)($scope);
  };

  // Speech synthesis for making bot speak
  $scope.sayIt = function (voiceMsg){
	window.speechSynthesis.speak(new SpeechSynthesisUtterance(voiceMsg));
	var time = new Date().getHours() +':'+ new Date().getMinutes();
	$scope.createBotChatBox(voiceMsg, time);
	$scope.speak();
  };

});