export const interviewScheduledEmail = (
    name: string,
    companyName: string,
    jobTitle: string,
    scheduledDate: string,
    interviewLink: string,
    interviewType: string,
    type: "SCHEDULED" | "RESCHEDULED"
) => {
    const title = type === "SCHEDULED" ? "Interview Scheduled! 🎉" : "Interview Rescheduled! 🔄";
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Scheduled - ${companyName}</title>
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
            <h1>${title}</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>Great news! <strong>${companyName}</strong> has ${type === "SCHEDULED" ? "scheduled" : "rescheduled"} your interview for the <strong>${jobTitle}</strong> position.</p>
            
            <div class="details-box">
                <p><strong>📅 Date & Time:</strong> ${scheduledDate}</p>
                <p><strong>📍 Interview Type:</strong> ${interviewType}</p>
            </div>
            
            <p>Please ensure you are ready and available at the scheduled time. The recruiter will reach out with any additional meeting links, location details, or further instructions prior to the interview.</p>
            
            <div class="info">
                <p>💡 Tip: It's always great to review the job description, do a bit of research on the company, and prepare a couple of questions for your interviewer. You've got this!</p>
            </div>
            
            <p>We wish you the absolute best of luck!</p>
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
};
