import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
	private transporter;

	constructor(private configService: ConfigService) {
		this.transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: this.configService.get<string>('SMTP_USER'),
				pass: this.configService.get<string>('SMTP_PASS'),
			},
			logger: true,
			debug: true,
		});
	}

	async sendVerificationEmail(email: string, token: string) {
		const url = `${this.configService.get<string>('FRONTEND_URL')}/verify-email?token=${token}`;
		await this.transporter.sendMail({
			from: `"No Reply" <${this.configService.get<string>('SMTP_USER')}>`,
			to: email,
			subject: 'Verify your email',
			html: `Click <a href="${url}">here</a> to verify your email.`,
		});
	}

	async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
		const subject = 'Password Reset Request';
		const html = `
      <p>Hello,</p>
      <p>You requested to reset your password. Click the link below to set a new one:</p>
      <p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p>
      <p>If you didn’t request this, you can safely ignore this email.</p>
      <br/>
      <p>— The YourApp Team</p>
    `; await this.transporter.sendMail({
			from: `"No Reply" <${this.configService.get<string>('SMTP_USER')}>`,
			to,
			subject,
			html,
		});
	}
}
