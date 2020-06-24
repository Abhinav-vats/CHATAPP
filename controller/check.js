var models = require('../model/model.js');
var path = require('path');
var bodyParser = require('body-parser');
var async = require('async');
const otp = require('otp-generator');
const mailer = require('./mailer.js');
var localStorage = require('localStorage');



models.user.find({"handle":"kjsdhgkj"}, function(err, doc){
           if(err)
                console.log(err);
           else
            console.log(doc[0].email);
                    
       }) 