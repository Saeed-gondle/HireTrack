export const candidateDigestEmail = (
    name: string,
    applicationsCount: number,
    interviewsCount: number,
    summaryHtml: string
) => {
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Weekly HireTrack Digest</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7f6; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background-color: #3b82f6; padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
        .content h2 { color: #3b82f6; margin-top: 0; font-size: 24px; }
        .stats { display: flex; justify-content: space-around; margin: 25px 0; }
        .stat-box { background-color: #eff6ff; padding: 15px; border-radius: 8px; text-align: center; width: 45%; }
        .stat-num { font-size: 32px; font-weight: bold; color: #1d4ed8; margin: 0; }
        .stat-label { color: #3b82f6; margin: 5px 0 0 0; font-size: 14px; }
        .summary-list { margin: 20px 0; padding: 0; list-style-type: none; }
        .summary-list li { background: #f8fafc; margin-bottom: 10px; padding: 15px; border-radius: 4px; border-left: 4px solid #3b82f6; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; }
        .footer p { margin: 5px 0; color: #6c757d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Your Weekly Update 📊</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>Here is your weekly summary of your job applications and upcoming interviews on HireTrack:</p>
            
            <div class="stats">
                <div class="stat-box">
                    <p class="stat-num">${applicationsCount}</p>
                    <p class="stat-label">Total Applications</p>
                </div>
                <div class="stat-box">
                    <p class="stat-num">${interviewsCount}</p>
                    <p class="stat-label">Upcoming Interviews</p>
                </div>
            </div>
            
            <h3>Recent Highlights:</h3>
            <ul class="summary-list">
                ${summaryHtml || "<li>No major updates this week. Keep applying!</li>"}
            </ul>
            
            <p>Ready for your next opportunity? Check out new job postings!</p>
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
