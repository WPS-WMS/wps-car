import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {}

  async send(input: SendMailInput): Promise<boolean> {
    const enabled = this.config.get<boolean>('mail.enabled');
    const defaultFrom = this.config.get<string>('mail.from') ?? 'noreply@wpscar.com.br';
    const from = input.from || defaultFrom;

    if (!enabled) {
      this.logger.warn(
        `[MAIL DISABLED] Para: ${input.to} | Assunto: ${input.subject}`,
      );
      return true;
    }

    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.error('SMTP não configurado. Defina SMTP_HOST e credenciais.');
      return false;
    }

    try {
      await transporter.sendMail({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
      });
      return true;
    } catch (error) {
      this.logger.error(`Falha ao enviar e-mail para ${input.to}`, error);
      return false;
    }
  }

  private getTransporter() {
    if (this.transporter) return this.transporter;

    const host = this.config.get<string>('mail.host');
    if (!host) return null;

    this.transporter = nodemailer.createTransport({
      host,
      port: this.config.get<number>('mail.port'),
      secure: this.config.get<boolean>('mail.secure'),
      auth: {
        user: this.config.get<string>('mail.user'),
        pass: this.config.get<string>('mail.pass'),
      },
    });

    return this.transporter;
  }
}
