var models = require('../model/model.js');
var path = require('path');
var bodyParser = require('body-parser');
var async = require('async');
const otp = require('otp-generator');
const date = require('date-and-time');
const mailer = require('./mailer.js');
var localStorage = require('localStorage')



module.exports = function (app,io){
    app.use( bodyParser.json() );

    app.use(bodyParser.urlencoded({     
        extended: true
    }));
    
    app.get('/',function(req,res){
        res.sendFile(path.resolve(__dirname+"/../views/index.html"));
    });
    
    app.post('/register',async function(req,res){
        res.setHeader('Access-Control-Allow-Origin', '*');

        res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
        console.log("Abhi");
        var user={
            "name":req.body.name,
            "utype":req.body.type,                                //editing done
            "handle":req.body.handle,             
            "password":req.body.password,
            "phone":req.body.phone,
            "email":req.body.email,
            "isBlocked": false
        };
        console.log(user);
        var textOtp = otp.generate(6, { upperCase: true, specialChars: true });
        var message = 'This is verification otp:-  '+textOtp;
        mailer(user.email, message);
        
        localStorage.setItem("user",JSON.stringify(user));
        localStorage.setItem("otp", textOtp);
        res.send('Done');


    });
     app.post('/otp', function(req, res){
         res.setHeader('Access-Control-Allow-Origin', '*');
         res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
         console.log(localStorage.getItem('otp'));
         console.log(JSON.stringify(localStorage.getItem('otp')));
         var otp = localStorage.getItem('otp');
         if (req.body.otp == otp){
             var user = JSON.parse(localStorage.getItem('user')); 
             models.report.findOne({"issuer_email": user.email}, function(err, coll){
                if(err)
                {
                    res.json(err);
                    console.log("Error occured while matching email in reports.....");
                }
                else
                {
                    console.log("Document Found!!: ",coll);
                    if(coll==null)
                    {
                        models.user.findOne({"handle":user.handle},function(err,doc){
                            if(err){
                                res.json(err); 
                                console.log(err);
                            }
                            if(doc == null){
                                models.user.create(user,function(err,doc){
                                    if(err) {
                                        res.json(err);
                                        console.log(err);
                                    }
                                    else{
                                        console.log("Success ..... Winner winner chicken dinner!!!");
                                        res.send("success");                      // editing required 
                                    }
                                });
                            }
                            else{
                                res.send("User already found");
                                console.log("User already found");
                            }
                            
                            });
                    }
                    else
                    {
                        res.status(400).send("User's Email is Blocked. Please Contact admin on this Email id: example@abc.com");
                        res.send("User's Email Id is Blocked by Some teacher");
                        console.log("User's Email Id is Blocked by Some teacher");

                    }
                } 
             });
         }
         else
         {
             res.send("OTP not matched!!");
             localStorage.clear();
         }
        
    });
    
    
    var handle=null;
    var private=null;
    var users={};
    var keys={};
    
    app.post('/login',function(req,res){
        console.log(req.body.handle);
        console.log(req.body.password);
        console.log(req.body.usrtype);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
        handle = req.body.handle;
        models.user.findOne({"handle":req.body.handle, "password":req.body.password, "utype":req.body.usrtype},function(err,doc){   //editing done
            if(err){
				
                res.send(err); 
            }
            if(doc==null){
                res.status(500).send("User has not registered");
				
                console.log("User has not registered");
                
            }
			else if(doc.isBlocked)
			{
				
				res.status(400).send("User is Blocked");
			}
            else{
				console.log("Blocking Status: ",doc.isBlocked)
                console.log("Path: "+__dirname);
				console.log("It is the User Data: ",doc);
//                res.sendFile(path.resolve(__dirname+"/../views/chat.html"));
                res.send("success");
            }
            
    });
    });
    
    io.on('connection',function(socket){
        console.log("Connection :User is connected  "+handle);
        console.log("Connection : " +socket.id);
        io.to(socket.id).emit('handle', handle);
        users[handle]=socket.id;
        keys[socket.id]=handle;
        console.log("Users list : "+JSON.stringify(users));
        console.log("keys list : "+JSON.stringify(keys));
        models.user.find({"handle" : handle},{friends:1,_id:0},function(err,doc){
            if(err){res.json(err);}
            else{
                friends=[];
                pending=[];
                all_friends=[];
                console.log("friends list: ",doc, err);
                list=doc[0].friends.slice();
                console.log(list);
                
                for(var i in list){
                    if(list[i].status=="Friend"){
                        friends.push(list[i].name);
                    }
                    else if (list[i].status=="Pending"){
                        pending.push(list[i].name);
                    }
                    else{
                        continue;
                    }
                }
                console.log("pending list: "+pending);
                console.log("friends list: "+friends);
                io.to(socket.id).emit('friend_list', friends);
                io.to(socket.id).emit('pending_list', pending);
                io.emit('users',users);
            }
        });
        
        
        socket.on('group message',function(msg){
            console.log(msg);
            io.emit('group',msg);
        });
        
        socket.on('private message',function(msg){
            console.log('message  :'+msg.split("#*@")[0]);
            models.messages.create({
                "message":msg.split("#*@")[1],
                "sender" :msg.split("#*@")[2],
                "reciever":msg.split("#*@")[0],
                "date" : new Date()});
            io.to(users[msg.split("#*@")[0]]).emit('private message', msg);
        });
        
        socket.on('disconnect', function(){
            delete users[keys[socket.id]];
            delete keys[socket.id];
            io.emit('users',users);
            console.log(users);
        });
    });
    
    app.post('/friend_request',function(req,res){
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
        friend=true;
        models.user.find({"handle" : req.body.my_handle,"friends.name":req.body.friend_handle},function(err,doc){
            if(err){res.json(err);}
            else if(doc.length!=0){
                console.log("Friend request : "+doc.length);
                console.log("Friend request : friend request already sent "+doc);
                res.send("Friend request already sent ");
            }
            else{
                console.log("Friend request : "+doc.length);
                models.user.update({
                    handle:req.body.my_handle
                },{
                    $push:{
                        friends:{
                            name: req.body.friend_handle,
                            status: "Pending"
                        }
                    }
                },{
                    upsert:true
                },function(err,doc){
                    if(err){res.json(err);}
                    //            else{
                    //                console.log(doc);
                    //            }
                });
                io.to(users[req.body.friend_handle]).emit('message', req.body);
            }
        });
    });

    app.post('/teacher-login/report', function(req,res){
        res.setHeader('Access-Control-Allow-Origin', '*');

        res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
        console.log("I am Fine!!");
        const now = new Date();
        var dt = date.format(now, 'YYYY/MM/DD HH:mm:ss');
        
      // console.log(typeof(repo.report_against));
       models.user.find({"handle":req.body.chandle}, function(err, doc){
        var repo  = {
            "reporter" : req.body.yhandle,
            "report_against": req.body.chandle,
            "issuer_email": doc[0].email,
            "issue" : req.body.issue,
            "date" : dt
        }
           if(err)
                console.log(err);
           else{
            //console.log(doc[0].email);
            
            models.report.create(repo, function(err, doc){
                if(err) {res.json(err);
                    console.log(err);}
                    else{
                        models.user.update({"handle":req.body.chandle}, {'$set':{"isBlocked": true}}, function(err, doc){
                        if(err)
                        {
                            console.log("Error Occured", err);
                            res.json(err);
                        }
                        else
                        {
                            console.log("Success ..... Winner winner chicken dinner!!!");
                            res.send("success");                      // editing required 
                        }
                    });                }
            });
        }
                    
       });      
    
       
            
       
        
    });
    
    app.post('/friend_request/confirmed',function(req,res){
        console.log("friend request confirmed : "+req.body);
        if(req.body.confirm=="Yes"){
            models.user.find({
                "handle" : req.body.friend_handle,
                "friends.name":req.body.my_handle
            },function(err,doc){
                if(err){
                    res.json(err);
                }
                else if(doc.length!=0){
                    console.log("Friend request confirmed : "+doc.length);
                    console.log("Friend request confirmed : friend request already sent "+doc);
                    res.send("Friend request already accepted");
                }
                else{
                    models.user.update({
                        "handle":req.body.my_handle,
                        "friends.name":req.body.friend_handle
                    },{
                        '$set':{
                            "friends.$.status":"Friend"
                        }
                    },function(err,doc){
                        if(err){res.json(err);}
                        else{

                            console.log("friend request confirmed : Inside yes confirmed");
                            io.to(users[req.body.friend_handle]).emit('friend', req.body.my_handle);
                            io.to(users[req.body.my_handle]).emit('friend', req.body.friend_handle);
                        }
                    });
                    models.user.update({
                        handle:req.body.friend_handle
                    },{
                        $push:{
                            friends:{
                                name: req.body.my_handle,
                                status: "Friend"
                            }
                        }
                    },{upsert:true},function(err,doc){
                        if(err){res.json(err);}
                        //            else{
                        //                console.log(doc);
                        //            }
                    });
                }
            });
        }
        else{
            
            console.log("friend request confirmed : Inside No confirmed");
            models.user.update({
                "handle":req.body.my_handle
            },{
                '$pull':{
                    'friends':{
                        "name":req.body.friend_handle,
                    }
                }
            },function(err,doc){
            if(err){res.json(err);}
            else{
                console.log("No");
            }
        });
        }
    });
    
}