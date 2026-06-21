import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.smtp.enabled) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

async function send({ to, subject, html }: MailOptions): Promise<void> {
  const tx = getTransporter();
  if (!tx) {
    logger.debug(`[email disabled] Would send "${subject}" to ${to}`);
    return;
  }
  try {
    await tx.sendMail({ from: env.smtp.from, to, subject, html });
  } catch (err) {
    logger.warn(`Email send failed: ${(err as Error).message}`);
  }
}

export const emailService = {
  async sendPasswordResetOtp(to: string, otp: string): Promise<void> {
    await send({
      to,
      subject: 'Your Planova password reset code',
      html: `<p>Your password reset code is:</p><h2 style="letter-spacing:4px">${otp}</h2><p>This code expires in 15 minutes.</p>`,
    });
  },

  async sendMentionEmail(to: string, actorName: string, issueKey: string, link: string): Promise<void> {
    await send({
      to,
      subject: `${actorName} mentioned you on ${issueKey}`,
      html: `<p><strong>${actorName}</strong> mentioned you on <a href="${link}">${issueKey}</a>.</p>`,
    });
  },

  async sendDigest(to: string, items: { message: string; link: string }[]): Promise<void> {
    if (!items.length) return;
    const list = items.map((i) => `<li><a href="${i.link}">${i.message}</a></li>`).join('');
    await send({
      to,
      subject: `You have ${items.length} unread notification(s)`,
      html: `<p>Here is your daily digest:</p><ul>${list}</ul>`,
    });
  },
};
