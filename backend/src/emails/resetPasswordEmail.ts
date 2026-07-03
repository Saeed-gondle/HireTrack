export const resetPasswordEmail = (name: string, otp: string, expiryMinutes: number) => {
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
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
            background-color: #007bff;
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
            color: #007bff;
            margin-top: 0;
            font-size: 24px;
        }
        .otp-box {
            background-color: #e7f1ff;
            border: 2px dashed #007bff;
            padding: 30px;
            margin: 20px 0;
            text-align: center;
            border-radius: 8px;
        }
        .otp-code {
            font-size: 48px;
            font-weight: bold;
            color: #007bff;
            letter-spacing: 8px;
            margin: 0;
        }
        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .warning p {
            margin: 0;
            color: #856404;
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
            color: #007bff;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset the password for your account. To complete the password reset process, please use the One-Time Password (OTP) below:</p>
            
            <div class="otp-box">
                <p style="margin: 0 0 10px 0; color: #555;">Your OTP is:</p>
                <div class="otp-code">${otp}</div>
            </div>
            
            <p>This OTP will expire in <strong>${expiryMinutes} minutes</strong>. Please do not share this code with anyone.</p>
            
            <div class="warning">
                <p><strong>⚠️ If you did not request this password reset, please ignore this email.</strong></p>
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
    `
}