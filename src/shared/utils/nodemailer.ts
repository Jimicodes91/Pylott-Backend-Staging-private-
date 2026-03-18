import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import { app, mail } from '@/config/env';

const useSendGrid = !!mail.sendgrid.api_key;

if (useSendGrid) {
  sgMail.setApiKey(mail.sendgrid.api_key);
}

// Gmail SMTP transporter (used when SendGrid API key is not available)
const smtpTransporter = useSendGrid
  ? null
  : nodemailer.createTransport({
      host: mail.nodemailer.host,
      port: Number(mail.nodemailer.port),
      secure: Number(mail.nodemailer.port) === 465,
      auth: {
        user: mail.nodemailer.user,
        pass: mail.nodemailer.pass,
      },
    });

const sendEmail = async (to: string | Array<string>, subject: string, html: string) => {
  if (useSendGrid) {
    const msg = {
      to,
      from: `Pylott Support <${app.email}>`,
      subject,
      html,
    };

    try {
      const info = await sgMail.send(msg);
      console.log(`Email sent to ${to} via SendGrid`);
      return info;
    } catch (error) {
      console.error('Error sending email via SendGrid 💀', error);
      if (error.response) {
        console.error('SendGrid error body:', JSON.stringify(error.response.body));
      }
      throw new Error(`Failed to send email to ${to}: ${error.message || 'Unknown SendGrid error'}`);
    }
  } else {
    // Use Gmail SMTP via nodemailer
    const recipient = Array.isArray(to) ? to.join(', ') : to;
    const msgOptions = {
      from: `Pylott Support <${mail.nodemailer.user}>`,
      to: recipient,
      subject,
      html,
    };

    try {
      const info = await smtpTransporter.sendMail(msgOptions);
      console.log(`Email sent to ${to} via SMTP`, info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email via SMTP 💀', error);
      throw new Error(`Failed to send email to ${to}: ${error.message || 'Unknown SMTP error'}`);
    }
  }
};

export default sendEmail;
