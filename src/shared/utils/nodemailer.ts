import nodemailer from 'nodemailer';
import { mail } from '@/config/env';

const config = {
  service: mail.nodemailer.mail,
  host: mail.nodemailer.host,
  port: Number(mail.nodemailer.port),
  secure: !!Number(mail.nodemailer.secure),
  auth: {
    user: mail.nodemailer.user,
    pass: mail.nodemailer.pass,
  },
};

const sendEmail = async (to: string | Array<string>, subject: string, html: string) => {
  const transporter = nodemailer.createTransport(config);
  try {
    const info = await transporter.sendMail({
      from: `"${config.auth.user}" <${config.service}>`,
      to,
      subject,
      html,
    });
    console.log(`mail sent to ${to}`);
    return info;
  } catch (error) {
    console.log('Email not sent 💀', error);
    return error;
  }
};

export default sendEmail;
