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
}
