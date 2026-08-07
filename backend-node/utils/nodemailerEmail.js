const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: emailUser,
        pass: emailPass
    }
});

/**
 * Sends a verification OTP email via Nodemailer
 * @param {string} recipientEmail Target email
 * @param {string} otp 6-digit OTP code
 * @param {string} type 'signup' | 'reset'
 */
async function sendOtpEmail(recipientEmail, otp, type) {
    const subject = type === 'signup' 
        ? 'Verify Your NeuroCity Citizen Registration' 
        : 'Reset Your NeuroCity Password';

    const headerTitle = type === 'signup'
        ? 'NEUROCITY CITIZEN VERIFICATION'
        : 'NEUROCITY PASSWORD RESET';

    const actionText = type === 'signup'
        ? 'Thank you for joining the NeuroCity Digital Twin network. Please use the following 6-digit verification code to complete your citizenship registration:'
        : 'We received a request to reset your password on the NeuroCity network. Please use the following 6-digit reset code to define a new password:';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8FAFC; color: #1E293B; margin: 0; padding: 20px; }
            .card { max-width: 500px; margin: 30px auto; background: #ffffff; border: 1px solid #E2E8F0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: #03045E; padding: 25px; text-align: center; border-bottom: 2px solid #00B4D8; }
            .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; tracking-wide: true; text-transform: uppercase; font-family: monospace; }
            .content { padding: 30px; line-height: 1.6; }
            .content p { font-size: 14px; color: #334155; }
            .otp-container { background: #E6F7FF; border: 1px dashed #0077B6; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0; }
            .otp-code { font-size: 32px; font-weight: 900; color: #023E8A; letter-spacing: 6px; font-family: monospace; }
            .footer { background: #F1F5F9; padding: 15px 30px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; }
            .warning { font-size: 11px; color: #EF4444; margin-top: 15px; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="header">
                <h1>${headerTitle}</h1>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>${actionText}</p>
                <div class="otp-container">
                    <div class="otp-code">${otp}</div>
                </div>
                <p>This code will expire in 10 minutes. If you did not initiate this request, please ignore this email or contact support.</p>
                <p class="warning">⚠️ Never share your OTP verification code with anyone.</p>
            </div>
            <div class="footer">
                © 2026 NeuroCity Digital Twin Core Administration. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        const info = await transporter.sendMail({
            from: `"NeuroCity Admin" <${emailUser}>`,
            to: recipientEmail,
            subject: subject,
            html: html
        });
        return { success: true, data: info };
    } catch (error) {
        console.error("Nodemailer sendOtpEmail failed:", error.message);
        throw error;
    }
}

/**
 * Sends a welcome email to verified user
 * @param {string} recipientEmail Target email
 * @param {string} name User name
 */
async function sendWelcomeEmail(recipientEmail, name) {
    const subject = 'Welcome to the NeuroCity Digital Twin Platform!';
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8FAFC; color: #1E293B; margin: 0; padding: 20px; }
            .card { max-width: 500px; margin: 30px auto; background: #ffffff; border: 1px solid #E2E8F0; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: #03045E; padding: 25px; text-align: center; border-bottom: 2px solid #00B4D8; }
            .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; font-family: monospace; }
            .content { padding: 30px; line-height: 1.6; }
            .content p { font-size: 14px; color: #334155; }
            .action-box { background: #E6F7FF; border: 1px solid #CAF0F8; border-radius: 12px; padding: 15px; margin: 20px 0; }
            .action-title { font-weight: bold; color: #023E8A; font-size: 13px; margin-bottom: 5px; }
            .footer { background: #F1F5F9; padding: 15px 30px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="header">
                <h1>NEUROCITY CITIZEN ONLINE</h1>
            </div>
            <div class="content">
                <p>Hello <strong>${name}</strong>,</p>
                <p>Welcome! Your account has been verified, and your clearance is now active on the NeuroCity dashboard.</p>
                <p>The NeuroCity Digital Twin provides real-time climate monitoring, AI-driven energy dispatch, and smart traffic telemetry across all municipal sectors.</p>
                <div class="action-box">
                    <div class="action-title">🔐 Core Access Activated</div>
                    <p style="margin: 0; font-size: 12px; color: #555;">You can now log in to the NeuroCity command center, explore live Leaflet GIS layers, track particulate matters, and inspect city resources.</p>
                </div>
                <p>Thank you for contributing to our smart municipality network.</p>
            </div>
            <div class="footer">
                © 2026 NeuroCity Digital Twin Core Administration. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        const info = await transporter.sendMail({
            from: `"NeuroCity Admin" <${emailUser}>`,
            to: recipientEmail,
            subject: subject,
            html: html
        });
        return { success: true, data: info };
    } catch (error) {
        console.error("Nodemailer sendWelcomeEmail failed:", error.message);
        throw error;
    }
}

module.exports = {
    sendOtpEmail,
    sendWelcomeEmail
};
