export const magicLinkEmail = (name: string, subject: string, link: string) => {
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
            margin-top: 20px;
            margin-bottom: 20px;
        }
        .header {
            background-color: #6f42c1;
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            letter-spacing: 1px;
        }
        .content {
            padding: 40px 30px;
            color: #333333;
            line-height: 1.6;
        }
        .content h2 {
            color: #6f42c1;
            margin-top: 0;
            font-size: 24px;
        }
        .button-container {
            text-align: center;
            margin: 35px 0;
        }
        .action-button {
            background-color: #6f42c1;
            color: #ffffff;
            text-decoration: none;
            padding: 15px 30px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 6px;
            display: inline-block;
            transition: background-color 0.3s ease;
        }
        .action-button:hover {
            background-color: #5a32a3;
        }
        .link-text {
            word-break: break-all;
            color: #6f42c1;
            font-size: 14px;
            text-align: center;
            margin-top: 10px;
        }
        .info {
            background-color: #f3f0f9;
            border-left: 4px solid #6f42c1;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info p {
            margin: 0;
            color: #493b61;
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
            color: #6f42c1;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Toolify Magic Link</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>You requested a magic link to securely sign in to your Toolify account without a password. Please click the button below to complete your login:</p>
            
            <div class="button-container">
                <a href="${link}" class="action-button">Sign In to Your Account</a>
            </div>
            
            <p style="font-size: 14px; text-align: center;">Or copy and paste this link into your browser:</p>
            <p class="link-text"><a href="${link}">${link}</a></p>
            
            <div class="info">
                <p>This link is only valid for a limited time and will expire soon. If you did not request this login link, please safely ignore this email.</p>
            </div>
            
            <p>If you need further assistance, please contact our support team at <a href="mailto:support@toolify.com">support@toolify.com</a></p>
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
