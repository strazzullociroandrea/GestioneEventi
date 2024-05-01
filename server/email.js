const nodemailer = require('nodemailer');

const result = {
   send: async (conf,email, from, subject, text) => {
      try {
         const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: conf.mailFrom,
              pass: conf.mailSecret,
            },
          });
         return await transporter.sendMail({
            from: from,
            to: email,
            subject: subject,
            text: text 
          })
      } catch (error) {
         throw(e);
      } 
   },
   test: async () => {
      return transporter.verify();
   }
}

module.exports = result;