var mongoose = require('mongoose');

var Schema = mongoose.Schema;

mongoose.connect("mongodb://localhost:27017/chat");

mongoose.connection.on('open', function (ref) {
    console.log('Connected to mongo server.');
});
mongoose.connection.on('error', function (err) {
    console.log('Could not connect to mongo server!');
    console.log(err);
});

mongoose.connect('mongodb://localhost/mongodb');

module.exports.user=mongoose.model('Users',new Schema({
    name:String,
    utype:String,
    handle: {type: String, unique: true},
    password: String,
    phone:String,
    email:String,
    isBlocked:Boolean,
    friends:[]
},{strict: false}));
module.exports.online=mongoose.model('online',new Schema({
    handle:String,
    connection_id:String
}));
module.exports.messages=mongoose.model('message',new Schema({
    message : String,
    sender  : String,
    reciever: String,
    date    : Date
}));
module.exports.report=mongoose.model('report',new Schema({
    reporter : String,
    report_against: String,
    issuer_email:String,
    issue : String,
    date    : Date
}));

