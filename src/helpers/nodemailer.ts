import { createTransport, SendMailOptions } from 'nodemailer';

export const transport = createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    type: 'OAuth2',
    user: 'edboxapp@gmail.com',
    clientId:
      '412395520452-ijv3eng1ah7idevchhkkhknbefkp8oj5.apps.googleusercontent.com',
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

export const sendEmail = (args: SendMailOptions) =>
  transport.sendMail({
    from: '"EdBox"<edboxapp@gmail.com>',
    ...args,
  });
