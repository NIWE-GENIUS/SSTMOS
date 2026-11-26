// backend/src/services/emailService.js
'use strict';

const env = require('../config/env');
const logger = require('../utils/logger');

let brevoClient = null;
let brevoApi = null;

function getClient() {
    if (!env.email.brevoApiKey) {
        throw new Error('BREVO_API_KEY is not configured');
    }
    if (!brevoClient) {
        const SibApiV3Sdk = require('@getbrevo/brevo');
        brevoApi = new SibApiV3Sdk.TransactionalEmailsApi();
        brevoApi.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, env.email.brevoApiKey);
    }
    return brevoApi;
}

// ---------------------------------------------------------------------------
// CORE SEND FUNCTION
// ---------------------------------------------------------------------------
async function sendEmail({ to, toName, subject, htmlContent, textContent, replyTo, tags = [], attachments = [] }) {
    if (!env.email.brevoApiKey) {
        logger.warn('Email skipped — BREVO_API_KEY not configured', { to, subject });
        return { skipped: true, reason: 'no_api_key' };
    }

    try {
        const api = getClient();
        const sendSmtpEmail = new (require('@getbrevo/autobind')) ? null : null;

        // Build payload manually (SDK-agnostic)
        const payload = {
            sender: { email: env.email.senderEmail, name: env.email.senderName },
            to: [{ email: to, name: toName || to }],
            subject,
            htmlContent,
            textContent: textContent || undefined,
            replyTo: replyTo ? { email: replyTo } : undefined,
            tags,
            attachment: attachments.length > 0 ? attachments : undefined,
        };

        const result = await api.sendTransacEmail(payload);
        logger.info('Email sent', { to, subject, messageId: result?.body?.messageId });
        return { success: true, messageId: result?.body?.messageId };
    } catch (err) {
        const detail = err?.response?.body || err.message;
        logger.error('Email send failed', { to, subject, error: detail });
        return { success: false, error: detail };
    }
}

// ---------------------------------------------------------------------------
// TEMPLATES — Base layout
// ---------------------------------------------------------------------------
function baseLayout(title, bodyHtml, footerNote = '') {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
      <tr><td style="background:linear-gradient(135deg,#1d4ed8,#1e40af);padding:32px 40px;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">SSTMOS</h1>
        <p style="margin:8px 0 0;color:#c7d2fe;font-size:13px;">Smart School Timetable Management</p>
      </td></tr>
      <tr><td style="padding:40px;color:#1f2937;font-size:15px;line-height:1.6;">
        ${bodyHtml}
      </td></tr>
      <tr><td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
        ${footerNote}
        <p style="margin:16px 0 0;color:#6b7280;font-size:12px;line-height:1.5;">
          <strong>HABUMUGISHA YASSON</strong><br>
          Service Manager · Next Creatures Group Ltd<br>
          <a href="tel:0791798333" style="color:#1d4ed8;text-decoration:none;">0791798333</a> · 
          <a href="mailto:habumugishayasson5@gmail.com" style="color:#1d4ed8;text-decoration:none;">habumugishayasson5@gmail.com</a>
        </p>
        <p style="margin:16px 0 0;color:#9ca3af;font-size:11px;">
          © ${new Date().getFullYear()} SSTMOS. All rights reserved.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// PUBLIC TEMPLATES
// ---------------------------------------------------------------------------

async function sendContactConfirmation({ toName, toEmail, referenceNumber, subject }) {
    const html = baseLayout(
        'Message Received',
        `<p>Dear ${toName},</p>
         <p>Thank you for contacting SSTMOS.</p>
         <p>We have successfully received your message regarding <strong>${subject}</strong>.</p>
         <p>Our team will review your inquiry and respond to this email address.</p>
         <p style="margin:24px 0;padding:16px;background:#eff6ff;border-left:4px solid #1d4ed8;border-radius:4px;">
           <strong>Your reference number:</strong><br>
           <span style="font-family:monospace;font-size:16px;color:#1e40af;">${referenceNumber}</span>
         </p>
         <p>For questions about SSTMOS:</p>
         <p style="margin:8px 0;padding:16px;background:#f9fafb;border-radius:8px;font-size:13px;color:#4b5563;">
           SSTMOS is a multi-tenant SaaS platform for schools that automates timetable generation, avoids scheduling conflicts, manages trainers, classes, and modules, and produces professional print-ready timetables.<br><br>
           <strong>Want to onboard your school?</strong> Reply to this email and our team will guide you through registration.
         </p>
         <p>Kind regards,<br>SSTMOS Support Team</p>`
    );
    return sendEmail({
        to: toEmail,
        toName,
        subject: `We received your message – SSTMOS`,
        htmlContent: html,
        tags: ['contact-confirmation'],
    });
}

async function sendContactNotification({ referenceNumber, senderName, senderEmail, subject, message, priority = 'normal' }) {
    const priorityColors = { low: '#6b7280', normal: '#1d4ed8', high: '#f59e0b', urgent: '#dc2626' };
    const html = baseLayout(
        'New Contact Message',
        `<p>A new message was submitted via the Contact Us page.</p>
         <table cellpadding="0" cellspacing="0" style="margin:24px 0;width:100%;border-collapse:collapse;">
           <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;width:140px;"><strong>Reference</strong></td>
               <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-family:monospace;">${referenceNumber}</td></tr>
           <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;"><strong>From</strong></td>
               <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${senderName} &lt;${senderEmail}&gt;</td></tr>
           <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;"><strong>Subject</strong></td>
               <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${subject}</td></tr>
           <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;"><strong>Priority</strong></td>
               <td style="padding:8px;border-bottom:1px solid #e5e7eb;">
                 <span style="background:${priorityColors[priority]};color:#fff;padding:2px 8px;border-radius:12px;font-size:12px;text-transform:uppercase;">${priority}</span>
               </td></tr>
         </table>
         <p style="margin:24px 0;padding:20px;background:#f9fafb;border-radius:8px;border-left:4px solid #1d4ed8;color:#1f2937;white-space:pre-wrap;">${escapeHtml(message)}</p>
         <p style="margin:32px 0 0;">
           <a href="${env.email.adminUrl}" style="background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Open Admin Dashboard</a>
         </p>`
    );
    return sendEmail({
        to: env.email.contactReceiver,
        toName: 'SSTMOS Admin',
        subject: `[${referenceNumber}] New contact: ${subject}`,
        htmlContent: html,
        replyTo: senderEmail,
        tags: ['contact-notification'],
    });
}

async function sendContactReply({ toName, toEmail, referenceNumber, originalSubject, replyBody }) {
    const html = baseLayout(
        'Reply from SSTMOS',
        `<p>Dear ${toName},</p>
         <p>Our team has replied to your message (reference: <strong>${referenceNumber}</strong>).</p>
         <div style="margin:24px 0;padding:20px;background:#f0fdf4;border-left:4px solid #16a34a;border-radius:4px;white-space:pre-wrap;">${escapeHtml(replyBody)}</div>
         <p>If you have additional questions, reply to this email or submit a new message via our Contact page.</p>
         <p>Kind regards,<br>SSTMOS Support Team</p>`
    );
    return sendEmail({
        to: toEmail,
        toName,
        subject: `Re: ${originalSubject} [${referenceNumber}]`,
        htmlContent: html,
        replyTo: env.email.contactReceiver,
        tags: ['contact-reply'],
    });
}

async function sendPasswordReset({ toName, toEmail, resetUrl, expiryMinutes }) {
    const html = baseLayout(
        'Reset Your Password',
        `<p>Dear ${toName || 'User'},</p>
         <p>We received a request to reset the password for your SSTMOS account (<strong>${toEmail}</strong>).</p>
         <p>Click the button below to choose a new password. This link expires in <strong>${expiryMinutes} minutes</strong>.</p>
         <p style="margin:32px 0;text-align:center;">
           <a href="${resetUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Reset Password</a>
         </p>
         <p style="color:#6b7280;font-size:13px;">If the button doesn't work, copy this link into your browser:</p>
         <p style="color:#1d4ed8;font-size:12px;word-break:break-all;">${resetUrl}</p>
         <p style="margin-top:32px;padding:16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;font-size:13px;color:#78350f;">
           <strong>Security notice:</strong> If you did not request a password reset, ignore this email. Your password will not change.
         </p>
         <p>Kind regards,<br>SSTMOS Security Team</p>`
    );
    return sendEmail({
        to: toEmail,
        toName,
        subject: 'Reset your SSTMOS password',
        htmlContent: html,
        tags: ['password-reset'],
    });
}

async function sendSchoolRegistrationNotification({ schoolName, contactName, contactEmail, country, notes }) {
    const html = baseLayout(
        'New School Registration Request',
        `<p>A new school has requested registration on SSTMOS.</p>
         <table cellpadding="0" cellspacing="0" style="margin:24px 0;width:100%;border-collapse:collapse;">
           <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;width:140px;"><strong>School</strong></td>
               <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${schoolName}</td></tr>
           <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;"><strong>Contact</strong></td>
               <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${contactName} &lt;${contactEmail}&gt;</td></tr>
           <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;"><strong>Country</strong></td>
               <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${country}</td></tr>
         </table>
         ${notes ? `<p style="padding:16px;background:#f9fafb;border-radius:8px;font-size:14px;">${escapeHtml(notes)}</p>` : ''}
         <p style="margin:32px 0 0;">
           <a href="${env.email.adminUrl}/schools" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Review Registration</a>
         </p>`
    );
    return sendEmail({
        to: env.email.contactReceiver,
        toName: 'SSTMOS Admin',
        subject: `[Registration] ${schoolName}`,
        htmlContent: html,
        replyTo: contactEmail,
        tags: ['school-registration'],
    });
}

async function sendWelcomeEmail({ toName, toEmail, schoolName }) {
    const html = baseLayout(
        'Welcome to SSTMOS',
        `<p>Dear ${toName},</p>
         <p>Welcome to SSTMOS — <strong>${schoolName}</strong> has been approved and activated.</p>
         <p>You can now log in with the credentials you created during registration.</p>
         <p>Here's what your team can now do:</p>
         <ul style="line-height:1.8;">
           <li>Configure your school's academic structure (years, terms, classes)</li>
           <li>Register trainers and modules</li>
           <li>Generate conflict-free timetables with our scheduling engine</li>
           <li>Publish and share timetables with trainers and students</li>
           <li>Export professional PDF and Excel timetables</li>
         </ul>
         <p style="margin:32px 0;">
           <a href="https://sstmos.vercel.app/login" style="background:#1d4ed8;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Log in to SSTMOS</a>
         </p>
         <p>If you have questions, reply to this email — we're here to help.</p>
         <p>Kind regards,<br>SSTMOS Team</p>`
    );
    return sendEmail({
        to: toEmail,
        toName,
        subject: `Welcome to SSTMOS — ${schoolName} is ready`,
        htmlContent: html,
        tags: ['welcome'],
    });
}

async function addToSubscribers({ email, fullName, source = 'contact_form' }) {
    try {
        const { rawQuery } = require('../config/db');
        await rawQuery(
            `INSERT INTO email_subscribers (email, full_name, source)
             VALUES ($1, $2, $3)
             ON CONFLICT (email) DO UPDATE
             SET subscribed = true, unsubscribed_at = NULL
             WHERE email_subscribers.subscribed = false`,
            [email, fullName || null, source]
        );
    } catch (err) {
        // Table might not exist yet — silent fail
        logger.warn('Could not add to subscribers', { email, error: err.message });
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

module.exports = {
    sendEmail,
    sendContactConfirmation,
    sendContactNotification,
    sendContactReply,
    sendPasswordReset,
    sendSchoolRegistrationNotification,
    sendWelcomeEmail,
    addToSubscribers,
};