var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '500054144@stu.upes.ac.in',
    pass: 'upes@123'
  }
});

var mailOptions = {
  from: '500054144@stu.upes.ac.in',
  to: 'abhi123up@gmail.com',
  subject: 'Sending Email using Node.js',
  text: 'That was easy!'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});