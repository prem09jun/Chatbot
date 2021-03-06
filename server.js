var express = require('express');
var https = require('https');
var fs = require('fs');
var path = require('path');
var AssistantV1 = require('ibm-watson/assistant/v1');
var bodyParser = require('body-parser');
var host = process.env.VCAP_APP_HOST || 'localhost';
var port = process.env.PORT || process.env.VCAP_APP_PORT || '8080';
var nano = require('nano')('http://localhost:'+port);
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', express.static(__dirname + '/'));

var service = new AssistantV1({
  version: '2019-02-28',
  username: 'd3574667-bbb3-48aa-b1cc-5e32973bac1f',
  password: 'BcvVAEGUL0Zw',
  url: 'https://gateway.watsonplatform.net/conversation/api'
});

var Cloudant = require('@cloudant/cloudant');
app.use('/', express.static(__dirname + '/'));
app.use('/', express.static(__dirname + '/img'));
app.use('/', express.static(__dirname + '/scripts'));

var cloudantUserName = "dcec4c16-dd63-4ad0-af56-ba4480efc5c7-bluemix";
var cloudantPassword = "86736376945fb14db6457536973fb85057186e00dc0710acdb7c243b7cdd90c7";
var cloudant_url = "https://" + cloudantUserName + ":" + cloudantPassword + "@" + cloudantUserName + ".cloudant.com";

var cloudant = Cloudant(cloudant_url);
var dbForChatBot = cloudant.db.use("chatbot-ticket-status");

//create index on chatbot db if not existing
var ticket = {
    name: 'ticketId',
    type: 'json',
    index: {
        fields: ['ticketId']
    }
};
dbForChatBot.index(ticket, function(er, response) {
    if (er) {
        console.log("Error creating index on ticket Id :" + er);
    } else {
        console.log('Index creation result on ticket Id :' + response.result);
    }
});

//create index on chatbot db if not existing
var user = {
    name: 'userId',
    type: 'json',
    index: {
        fields: ['userId']
    }
};
dbForChatBot.index(user, function(er, response) {
    if (er) {
        console.log("Error creating index on user Id :" + er);
    } else {
        console.log('Index creation result on user Id :' + response.result);
    }
});

// viewed at http://localhost:8080
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

//Conversation Service Call (This needs to be integrated, depending on which we have to use cloudant functions written below)
app.post('/textToSpeech', function (req, res) {
    console.log('Inside Express api to make a text to speech call');
	var inputFromUser = req.body.msg.currentMsg;
	var responseForBot = '';
	service.message({
	  workspace_id: '5326febc-dff2-48e8-a927-900e12a0c9e8',
	  input: {'text': 'Hi Maya'}
	  })
	  .then(response => {
		//console.log(JSON.stringify(res, null, 2));
		res.json ({
			success: true,
			message: 'Ticket data updation issue !',
			reply: response.output.generic[0].text
		});
	  })
	  .catch(err => {
		console.log(err)
	  });	
/* 	if(inputFromUser.indexOf('Maya') >= 0){
		responseForBot = 'Hi, how can i help you?';
	}else if(inputFromUser.indexOf('Create Ticket') >= 0){
		responseForBot = 'Ok what is userid for which i should create a ticket?';
	}else if(inputFromUser.indexOf('Current status of my ticket')){
		responseForBot = 'For sure can u tell me ur ticket number';
	}else if(inputFromUser.indexOf('user id is 493590')){
		responseForBot = 'Give me a min before i fetch ur updates';
	}else if(inputFromUser.indexOf('ticket number is ')){
		responseForBot = 'Give me a min before i fetch the ticket details';
	}else{
		responseForBot = 'I could not understand you.';
	} */
});

// Update existence record in cloudant DB
var updateCloudantData = async(data) => {
    try {
        var response = await dbForChatBot.insert(data);
        console.log('Ticket data updated successfully ! ');
        return ({
            success: true,
            message: 'Ticket data updated successfully ! '
        });
    } catch (err) {
        console.log('Ticket data updation issue ! ' + err);
        return ({
            success: false,
            message: 'Ticket data updation issue !'
        });
    }
}

// Insert data/record in cloudant DB
var insertCloudantData = async(data) => {
    try {
		var data = await dbForChatBot.insert(data);
		console.log('Ticket Data Inserted !');
		return ({
			success: true,
			message: 'Ticket Data Inserted Successfully !'
		});
        }catch (err) {
        console.log('Issue fetching/inserting data from DB ! ' + err);
        return ({
            success: false,
            message: 'Issue fetching/inserting data from DB !'
        });
    }
}

//Fetch specific ticket id from cloudant DB
var getTicketIdFromCloudant = async (ticketId) => {
    try {
        var response = await dbForChatBot.find({
            selector: {
                _id: ticketId
            }
        });
        console.log('Applicant data found successfully ! ');
        return ({
            success: true,
            message: 'Applicant data found successfully ! ',
            response: response,
        });
    } catch (err) {
        console.log('Applicant data not present/DB issue ! ' + err);
        return ({
            success: false,
            message: 'Applicant data not present/DB issue !'
        });
    }
}

//Fetch all ticket from cloudant DB for the userId
var getTicketForUserIdFromCloudant = async (userId) => {
    try {
        var response = await dbForChatBot.find({
            selector: {
                _id: userId
            }
        });
        console.log('Applicant data found successfully ! ');
        return ({
            success: true,
            message: 'Applicant data found successfully ! ',
            response: response,
        });
    } catch (err) {
        console.log('Applicant data not present/DB issue ! ' + err);
        return ({
            success: false,
            message: 'Applicant data not present/DB issue !'
        });
    }
}

https.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
}, app).listen(8080, () => {
  console.log('Listening...')
});
