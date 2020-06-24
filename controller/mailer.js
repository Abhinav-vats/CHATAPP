const nodemailer = require('nodemailer');


module.exports = function(id, msg){

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '500054144@stu.upes.ac.in',
    pass: 'upes@123'
  }
});

var mailOptions = {
  from: '500054144@stu.upes.ac.in',
  to: id,
  subject: 'Sending Email for Anonymous Chat Application',
  text: msg  
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent succesfully.....');
  }
});

}