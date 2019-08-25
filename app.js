/* Angular Module Definition */
var myApp = angular.module('myModule', ["pubnub.angular.service"]);

/* Chat Bot Controller */
myApp.controller('chatbotController', function ($rootScope, $scope, $compile, $http, $filter, $window, Pubnub) {
  // DB Json Structure
  var dbData = {_id: '', userId: '', ticketId: '', ticketStatus:'', shortDescription:'', longDescription:'', priority: '', currentMsg: ''};
  $scope.dbData = dbData;
  // Web recognition started
  $scope.speak = function () {
      $scope.userText = "";
      var recognition = new webkitSpeechRecognition();
      recognition.onresult = function (event) {
        $scope.$apply(function() {
          for (var i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              $scope.userText  += event.results[i][0].transcript;
            }
          }
		  var time = new Date().getHours() +':'+ new Date().getMinutes();
		  $scope.dbData.currentMsg = $scope.userText;
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
				$scope.publish(response.data.reply);
            } else {
                alert("You have already applied for skill sets.");
                window.close();
            }
        });
    };

  // Create chat box window for user
  $scope.createUserChatBox = function (textData, time) {
	var elementToAdd = angular.element(document.querySelector('.boxnumber'));
	var html='<div class="container darker" style="width: 500px;"><img src="/img/user.png" alt="Avatar" class="right"/><p>'+textData.currentMsg+'</p><span class="time-left">'+time+'</span></div>' ;
	elementToAdd.append(html);
	$compile(elementToAdd)($scope);
	$scope.textToSpeech(textData);
  };

  // Create chat box window for bot
  $scope.createBotChatBox = function (textData, time) {
	var elementToAdd = angular.element(document.querySelector('.boxnumber'));
	var html='<div class="container" style="width: 500px;"><img src="/img/bot.png" alt="Avatar"/><p>'+textData+'</p><span class="time-right">'+time+'</span></div>' ;
	elementToAdd.append(html);
	$compile(elementToAdd)($scope);
  };

  // Speech synthesis for making bot speak
  $scope.messages     = [{data:"testing 1 2 3"}];
  $scope.msgChannel   = 'MySpeech';

  if (!$rootScope.initialized) {
    Pubnub.init({
      publish_key: 'pub-c-14ed0014-1d7a-4bf7-a0f1-b680987d4213',
      subscribe_key: 'sub-c-dd8126c2-c688-11e9-93da-dae13b67b174',
      ssl:true
    });
    $rootScope.initialized = true;
  }

  var msgCallback = function(payload) {
    $scope.$apply(function() {
      $scope.messages.push(payload);
    });
    $scope.sayIt(payload.data);
  };

  $scope.publish = function(data) {
    Pubnub.publish({
      channel: $scope.msgChannel,
      message: {data:data}
    });

    $scope.toSend = "";
  };

  Pubnub.subscribe({ channel: [$scope.msgChannel, $scope.prsChannel], message: msgCallback });
  
  $scope.sayIt = function (theText) {
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(theText));
	var time = new Date().getHours() +':'+ new Date().getMinutes();
	$scope.createBotChatBox(theText, time);
	$scope.speak();
  };

});