import sgMail from '@sendgrid/mail';
import { app, mail } from '@/config/env';

sgMail.setApiKey(mail.sendgrid.api_key);

const sendEmail = async (to: string | Array<string>, subject: string, html: string) => {
	const msg = {
		to,
		from: app.email,
		subject,
		html,
	};

	try {
		const info = await sgMail.send(msg);
		console.log(`Email sent to ${to}`);
		return info;
	} catch (error) {
		console.error('Error sending email 💀', error);
		if (error.response) {
			console.error(error.response.body);
		}
		return error;
	}
};

export default sendEmail;
