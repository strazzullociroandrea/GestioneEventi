import nodemailer from 'nodemailer';

const emailer = {
   send: async (conf, email, subject, text) => {
      try {
         const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: conf.mailFrom,
              pass: conf.mailSecret,
            },
          });
         return await transporter.sendMail({
            from: conf.mailFrom,
            to: email,
            subject: subject,
            html: text 
          })
      } catch (error) {
         throw(e);
      } 
   },
   test: async () => {
      return transporter.verify();
   }
}

export default emailer;
