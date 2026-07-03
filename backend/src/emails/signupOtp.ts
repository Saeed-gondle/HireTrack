export const signupOtpEmail = (name: string, subject: string, otp: string, expiryMinutes: number) => {
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f7f6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #28a745;
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
        }
        .content {
            padding: 40px 30px;
            color: #333333;
            line-height: 1.6;
        }
        .content h2 {
            color: #28a745;
            margin-top: 0;
            font-size: 24px;
        }
        .otp-box {
            background-color: #e8f5e9;
            border: 2px dashed #28a745;
            padding: 30px;
            margin: 20px 0;
            text-align: center;
            border-radius: 8px;
        }
        .otp-code {
            font-size: 48px;
            font-weight: bold;
            color: #28a745;
            letter-spacing: 8px;
            margin: 0;
        }
        .info {
            background-color: #e2e3e5;
            border-left: 4px solid #6c757d;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info p {
            margin: 0;
            color: #383d41;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer p {
            margin: 5px 0;
            color: #6c757d;
            font-size: 14px;
        }
        .footer a {
            color: #28a745;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to HireTrack!</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for signing up with HireTrack! To complete your registration and verify your email address, please use the One-Time Password (OTP) below:</p>
            
            <div class="otp-box">
                <p style="margin: 0 0 10px 0; color: #555;">Your Verification Code is:</p>
                <div class="otp-code">${otp}</div>
            </div>
            
            <p>This OTP will expire in <strong>${expiryMinutes} minutes</strong>. Please do not share this code with anyone.</p>
            
            <div class="info">
                <p>If you did not sign up for a HireTrack account, please ignore this email.</p>
            </div>
            
            <p>If you have any questions or need assistance, please contact our support team at <a href="mailto:[EMAIL_ADDRESS]">[EMAIL_ADDRESS]</a></p>
        </div>
        <div class="footer">
            <p>This is an automated email, please do not reply.</p>
            <p>Toolify © ${new Date().getFullYear()}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
};
