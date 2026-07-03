export const applicationStatusChangeEmail=(companyName:string,jobTitle:string,candidateName:string,newStage:string)=>{
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Status Update</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background-color: #007bff;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 30px;
            text-align: left;
            color: #333333;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
        }
        .highlight {
            color: #007bff;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Application Status Update</h1>
        </div>
        <div class="content">
            <p>Dear ${candidateName},</p>
            <p>We hope this email finds you well.</p>
            <p>We are writing to inform you about the status of your application for the position of <span class="highlight">${jobTitle}</span> at <span class="highlight">${companyName}</span>.</p>
            <p>Your application has been updated to the following stage: <span class="highlight">${newStage}</span>.</p>
            <p>We appreciate your patience and interest in joining our team. Our hiring team will review your profile and get back to you if your qualifications match our requirements.</p>
            <p>You can view your updated application status by logging into your account.</p>
            <p>Thank you for your time and consideration.</p>
            <p>Best regards,</p>
            <p><strong>${companyName}</strong></p>
        </div>
        <div class="footer">
            <p>&copy; 2024 ${companyName}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>

    
    `
}