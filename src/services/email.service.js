console.log('email.service.js loaded');
require('dotenv').config();
const nodemailer = require('nodemailer');

const sanitizeEnvValue = (value = '') => value.toString().trim().replace(/^['\"]|['\"]$/g, '').replace(/;\s*$/, '');

const emailUser = sanitizeEnvValue(process.env.EMAIL_USER || '');
const clientId = sanitizeEnvValue(process.env.CLIENT_ID || '');
const clientSecret = sanitizeEnvValue(process.env.CLIENT_SECRET || '');
const refreshToken = sanitizeEnvValue(process.env.REFRESH_TOKEN || '');
const smtpHost = sanitizeEnvValue(process.env.SMTP_HOST || 'smtp.gmail.com');
const smtpPort = Number.parseInt(sanitizeEnvValue(process.env.SMTP_PORT || '587'), 10) || 587;
const smtpSecure = sanitizeEnvValue(process.env.SMTP_SECURE || (smtpPort === 465 ? 'true' : 'false')) === 'true';

const emailEnabled = Boolean(emailUser && clientId && clientSecret && refreshToken);

let transporter = null;
if (emailEnabled) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    requireTLS: !smtpSecure,
    auth: {
      type: 'OAuth2',
      user: emailUser,
      clientId: clientId,
      clientSecret: clientSecret,
      refreshToken: refreshToken,
    },
  });

  transporter.verify((error) => {
    if (error) {
      console.error('Error connecting to email server:', error.message || error);
    } else {
      console.log('Email server is ready to send messages');
    }
  });
} else {
  console.warn('Email service disabled: missing EMAIL_USER/CLIENT_ID/CLIENT_SECRET/REFRESH_TOKEN env vars.');
}

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  if (!transporter) {
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Backend Ledger" <${emailUser}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

async function sendRegistrationEmail(userEmail, userName) {
  const subject = 'Welcome to Backend Ledger!';
  const text = `Hi ${userName},\n\nThank you for registering at Backend Ledger. We're excited to have you on board!`;
  const html = `<p>Hi <b>${userName}</b>,</p><p>Thank you for registering at <b>Backend Ledger</b>. We're excited to have you on board!</p>`;
  return sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, userName, transactionDetails) {
  const subject = 'Transaction Notification';
  const text = `Hi ${userName},\n\nYour transaction has been processed. Details: ${transactionDetails}`;
  const html = `<p>Hi <b>${userName}</b>,</p><p>Your transaction has been processed. Details: ${transactionDetails}</p>`;
  return sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailedEmail(userEmail, userName, transactionDetails) {
  const subject = 'Transaction Failed';
  const text = `Hi ${userName},\n\nYour transaction has failed. Details: ${transactionDetails}`;
  const html = `<p>Hi <b>${userName}</b>,</p><p>Your transaction has failed. Details: ${transactionDetails}</p>`;
  return sendEmail(userEmail, subject, text, html);
}

module.exports = {
  sendEmail,
  sendRegistrationEmail,
  sendTransactionEmail,
  sendTransactionFailedEmail,
};