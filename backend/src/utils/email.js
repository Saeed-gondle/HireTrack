import nodemailer from 'nodemailer';
import pug from 'pug';
import { htmlToText } from 'html-to-text';

export default class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = process.env.EMAIL_FROM;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Check if using Mailtrap for production
      if (process.env.EMAIL_HOST_PROD === 'live.smtp.mailtrap.io') {
        // Production Mailtrap sending domains
        return nodemailer.createTransport({
          host: process.env.EMAIL_HOST_PROD,
          port: process.env.EMAIL_PORT_PROD,
          secure: false, // Use STARTTLS for port 587
          auth: {
            user: process.env.EMAIL_USERNAME_PROD,
            pass: process.env.EMAIL_PASSWORD_PROD,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });
      } else {
        // Production email server (huntingflex.com)
        const isSSL = process.env.EMAIL_PORT_PROD == 465;
        return nodemailer.createTransport({
          host: process.env.EMAIL_HOST_PROD,
          port: parseInt(process.env.EMAIL_PORT_PROD),
          secure: isSSL, // true for 465, false for other ports
          auth: {
            user: process.env.EMAIL_USERNAME_PROD,
            pass: process.env.EMAIL_PASSWORD_PROD,
          },
          tls: {
            rejectUnauthorized: false, // Allow self-signed certificates
            ciphers: 'SSLv3', // Try different cipher if needed
          },
          // Additional options for problematic servers
          requireTLS: !isSSL, // Require TLS for non-SSL connections
          debug: process.env.NODE_ENV === 'development', // Enable debug in dev mode
        });
      }
    }

    // Development Mailtrap SMTP (works for both live.smtp.mailtrap.io and sandbox.smtp.mailtrap.io)
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // Use STARTTLS (optional TLS for sandbox, required for live)
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  // Send the actual email
  async send(template, subject) {
    try {
      // 1) Render HTML based on a pug template
      const html = pug.renderFile(`Views/emails/${template}.pug`, {
        firstName: this.firstName,
        url: this.url,
        subject,
      });

      // 2) Define email options
      const mailOptions = {
        from: this.from,
        to: this.to,
        subject,
        html,
        text: htmlToText(html),
      };

      // 3) Create a transport and send email
      const result = await this.newTransport().sendMail(mailOptions);
      return result;
    } catch (error) {
      // Create a clean error without circular references
      const cleanError = new Error(`Email sending failed: ${error.message}`);
      cleanError.name = 'EmailError';
      throw cleanError;
    }
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }
}
