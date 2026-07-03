export const recruiterDigestEmail = (
    name: string,
    newApplicationsCount: number,
    upcomingInterviewsCount: number,
    summaryHtml: string
) => {
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Weekly Recruiter Digest</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7f6; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background-color: #10b981; padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
        .content h2 { color: #10b981; margin-top: 0; font-size: 24px; }
        .stats { display: flex; justify-content: space-around; margin: 25px 0; }
        .stat-box { background-color: #ecfdf5; padding: 15px; border-radius: 8px; text-align: center; width: 45%; }
        .stat-num { font-size: 32px; font-weight: bold; color: #047857; margin: 0; }
        .stat-label { color: #10b981; margin: 5px 0 0 0; font-size: 14px; }
        .summary-list { margin: 20px 0; padding: 0; list-style-type: none; }
        .summary-list li { background: #f8fafc; margin-bottom: 10px; padding: 15px; border-radius: 4px; border-left: 4px solid #10b981; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; }
        .footer p { margin: 5px 0; color: #6c757d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Weekly Hiring Update 📈</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>Here is your weekly summary of hiring activities across your active job postings:</p>
            
            <div class="stats">
                <div class="stat-box">
                    <p class="stat-num">${newApplicationsCount}</p>
                    <p class="stat-label">New Applications</p>
                </div>
                <div class="stat-box">
                    <p class="stat-num">${upcomingInterviewsCount}</p>
                    <p class="stat-label">Scheduled Interviews</p>
                </div>
            </div>
            
            <h3>Activity Summary:</h3>
            <ul class="summary-list">
                ${summaryHtml || "<li>No major activities this week.</li>"}
            </ul>
            
            <p>Log in to your dashboard to review candidates and manage interviews.</p>
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
