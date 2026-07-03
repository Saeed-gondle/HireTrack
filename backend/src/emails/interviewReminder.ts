export const interviewReminderEmail = (
    name: string,
    companyName: string,
    jobTitle: string,
    scheduledDate: string,
    interviewType: string
) => {
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Reminder - ${companyName}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7f6; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background-color: #f59e0b; padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; color: #333333; line-height: 1.6; }
        .content h2 { color: #f59e0b; margin-top: 0; font-size: 24px; }
        .details-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 4px; }
        .details-box p { margin: 10px 0; font-size: 16px; }
        .details-box strong { color: #b45309; display: inline-block; width: 140px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; }
        .footer p { margin: 5px 0; color: #6c757d; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Interview Reminder! ⏰</h1>
        </div>
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>This is a friendly reminder that you have an upcoming interview with <strong>${companyName}</strong> for the <strong>${jobTitle}</strong> position tomorrow.</p>
            
            <div class="details-box">
                <p><strong>📅 Date & Time:</strong> ${scheduledDate}</p>
                <p><strong>📍 Interview Type:</strong> ${interviewType}</p>
            </div>
            
            <p>Make sure you are prepared and ready! Good luck!</p>
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
