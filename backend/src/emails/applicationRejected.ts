export const applicationRejectionEmail = (name: string, companyName: string, jobTitle: string) => {
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Rejected - ${companyName}</title>
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
            background-color: #dc2626;
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            letter-spacing: 0.5px;
        }
        .content {
            padding: 40px 30px;
            color: #333333;
            line-height: 1.6;
        }
        .content h2 {
            color: #dc2626;
            margin-top: 0;
            font-size: 24px;
        }
        .details-box {
            background-color: #fee2e2;
            border-left: 4px solid #dc2626;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .details-box p {
            margin: 10px 0;
            font-size: 16px;
        }
        .details-box strong {
            color: #991b1b;
            display: inline-block;
            width: 140px;
        }
        .info {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info p {
            margin: 0;
            color: #495057;
            font-size: 15px;
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
            color: #dc2626;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Application Update</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for your interest in the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>. We appreciate you taking the time to apply.</p>
            
            <div class="details-box">
                <p><strong>Status:</strong> Application Rejected</p>
            </div>
            
            <p>We received a large number of qualified applications, and after careful review, we have decided to move forward with other candidates whose qualifications and experience more closely align with the specific requirements of this role.</p>
            
            <div class="info">
                <p>💡 Tip: We encourage you to keep an eye on our careers page for future opportunities that may be a better fit for your skills and interests. Your experience is valuable, and we may reach out if another suitable position opens up.</p>
            </div>
            
            <p>We wish you the best of luck in your job search!</p>
            <p>Best regards,<br><strong>The HireTrack Team</strong></p>
        </div>
        <div class="footer">
            <p>This is an automated email, please do not reply.</p>
            <p>HireTrack © ${new Date().getFullYear()}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
}