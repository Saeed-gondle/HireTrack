export const newApplicationEmail=(companyName:string,candidateName:string,jobTitle:string,dateApplied:string,currentStage:string)=>{
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Application Received - ${companyName}</title>
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
            background-color: #4f46e5;
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
            color: #4f46e5;
            margin-top: 0;
            font-size: 24px;
        }
        .details-box {
            background-color: #eef2ff;
            border-left: 4px solid #4f46e5;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .details-box p {
            margin: 10px 0;
            font-size: 16px;
        }
        .details-box strong {
            color: #3730a3;
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
            color: #4f46e5;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Application Received! 🎉</h1>
        </div>
        <div class="content">
            <h2>Hello ${companyName},</h2>
            <p>Great news! We've received a new application for the <strong>${jobTitle}</strong> position.</p>
            
            <div class="details-box">
                <p><strong>Candidate:</strong> ${candidateName}</p>
                <p><strong>Date Applied:</strong> ${dateApplied}</p>
                <p><strong>Current Stage:</strong> ${currentStage}</p>
            </div>
            
            <p>The candidate has submitted their resume and is ready for review. You can now proceed with the next steps in your hiring process.</p>
            
            <div class="info">
                <p>💡 Tip: Take a moment to review the candidate's qualifications and see if they're a great match for your team!</p>
            </div>
            
            <p>We're excited to help you find the perfect addition to your team!</p>
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
