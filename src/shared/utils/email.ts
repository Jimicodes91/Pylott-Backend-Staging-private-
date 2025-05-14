export const eventCreatedEmail = (userName: string, eventName: string, eventDate: string, eventLink: string) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { color: #2c3e50; font-size: 24px; margin-bottom: 20px; }
        .content { margin-bottom: 25px; }
        .event-name { font-weight: bold; color: #3498db; }
        .event-date { font-weight: bold; }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 15px 0;
        }
        .footer { margin-top: 30px; font-size: 14px; color: #7f8c8d; }
    </style>
</head>
<body>
    <div class="header">New Event Scheduled</div>
    
    <div class="content">
        <p>Dear ${userName},</p>
        
        <p>A new event, <span class="event-name">${eventName}</span>, 
        has been scheduled for <span class="event-date">${eventDate}</span>.</p>
        
        <a href="${eventLink}" class="button">View Event Details</a>
    </div>
    
    <div class="footer">
        <p>See you there!</p>
        <p>Best regards,<br>The Pylott Team</p>
    </div>
</body>
</html>
  `;
};

export const taskCompletedEmail = (userName: string, taskName: string, taskLink: string) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { color: #2c3e50; font-size: 24px; margin-bottom: 20px; }
        .content { margin-bottom: 25px; }
        .user-name { font-weight: bold; color: #3498db; }
        .task-name { font-weight: bold; color: #2ecc71; }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #2ecc71;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 15px 0;
        }
        .footer { margin-top: 30px; font-size: 14px; color: #7f8c8d; }
        .checkmark { color: #2ecc71; font-size: 20px; }
    </style>
</head>
<body>
    <div class="header">Task Completed <span class="checkmark">✅</span></div>
    
    <div class="content">
        <p>Dear ${userName},</p>
        
        <p><span class="user-name">${userName}</span> has marked the task 
        <span class="task-name">${taskName}</span> as completed.</p>
        
        <a href="${taskLink}" class="button">View Task Details</a>
    </div>
    
    <div class="footer">
        <p>Well done!</p>
        <p>Best regards,<br>The Pylott Team</p>
    </div>
</body>
</html>
  `;
};

export const newTaskAssignedEmail = (userName: string, taskName: string, projectName: string, dueDate: string, taskLink: string) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { color: #2c3e50; font-size: 24px; margin-bottom: 20px; }
        .content { margin-bottom: 25px; }
        .highlight { font-weight: bold; color: #3498db; }
        .task-name { font-weight: bold; color: #e67e22; }
        .due-date { 
            display: inline-block;
            background-color: #f5f5f5;
            padding: 8px 12px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 15px 0;
        }
        .footer { margin-top: 30px; font-size: 14px; color: #7f8c8d; }
        .icon { margin-right: 8px; }
    </style>
</head>
<body>
    <div class="header">New Task Assigned</div>
    
    <div class="content">
        <p>Dear <span class="highlight">${userName}</span>,</p>
        
        <p>You have been assigned a new task: <span class="task-name">${taskName}</span> 
        in <span class="highlight">${projectName}</span>.</p>
        
        <div class="due-date">
            <span class="icon">📅</span> Due Date: ${dueDate}
        </div>
        
        <br>
        <a href="${taskLink}" class="button">View Task Details</a>
    </div>
    
    <div class="footer">
        <p>Best regards,<br>The Pylott Team</p>
    </div>
</body>
</html>
  `;
};

export const documentRequestEmail = (recipientName: string, requesterName: string, projectName: string, documentName: string, description: string, requestLink: string) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { color: #2c3e50; font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .content { margin-bottom: 25px; }
        .highlight { color: #3498db; font-weight: bold; }
        .document-details {
            background-color: #f9f9f9;
            border-left: 4px solid #3498db;
            padding: 15px;
            margin: 20px 0;
        }
        .detail-label {
            font-weight: bold;
            color: #555;
            min-width: 120px;
            display: inline-block;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 15px 0;
            font-weight: bold;
        }
        .footer { margin-top: 30px; font-size: 14px; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 15px; }
        .urgent { color: #e74c3c; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">Document Request: ${documentName}</div>
    
    <div class="content">
        <p>Hello <span class="highlight">${recipientName}</span>,</p>
        
        <p><span class="highlight">${requesterName}</span> has requested a document from you for the project <span class="highlight">${projectName}</span>.</p>
        
        <div class="document-details">
            <div><span class="detail-label">Document Name:</span> ${documentName}</div>
            <div><span class="detail-label">Description:</span> ${description}</div>
        </div>
        
        <p>Please upload the document as soon as possible.</p>
        
        <a href="${requestLink}" class="button">Complete Document Request</a>
    </div>
    
    <div class="footer">
        <p>Best regards,<br>The Pylott Team</p>
    </div>
</body>
</html>
  `;
};

export const createProjectDueEmail = (projectName: string, totalDurationDays: number, overdueDuration: string) => {
  const body = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { color: #e74c3c; font-size: 20px; margin-bottom: 15px; }
        .content { margin-bottom: 20px; }
        .highlight { color: #e74c3c; font-weight: bold; }
        .footer { margin-top: 20px; font-size: 12px; color: #7f8c8d; }
    </style>
</head>
<body>
    <div class="header">Project Timeline Exceeded</div>
    
    <div class="content">
        <p>Project <span class="highlight">${projectName}</span> has exceeded its total duration:</p>
        <p><strong>Planned Duration:</strong> ${totalDurationDays} days</p>
        <p><strong>Overdue by:</strong> ${overdueDuration}</p>
    </div>
    
    <div class="footer">
        <p>Please review the project immediately.</p>
    </div>
</body>
</html>
    `;

  return body;
};

export const createMilestoneDueEmail = (projectName: string, milestoneName: string, overdueDuration: string, expectedDuration: number, url: string) => {
  return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { color: #e67e22; font-size: 24px; margin-bottom: 20px; border-bottom: 2px solid #f1c40f; padding-bottom: 10px; }
        .content { margin-bottom: 25px; }
        .highlight { color: #e74c3c; font-weight: bold; }
        .milestone-card {
            background-color: #fef9e7;
            border-left: 4px solid #f1c40f;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .detail-row {
            margin-bottom: 8px;
            display: flex;
        }
        .detail-label {
            font-weight: bold;
            color: #7f8c8d;
            min-width: 150px;
        }
        .detail-value { flex: 1; }
        .action-button {
            display: inline-block;
            background-color: #e67e22;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 15px;
        }
        .footer { margin-top: 30px; font-size: 14px; color: #95a5a6; border-top: 1px solid #ecf0f1; padding-top: 15px; }
    </style>
</head>
<body>
    <div class="header">Milestone Overdue Notification</div>
    
    <div class="content">
        <p>The following milestone in project <strong>${projectName}</strong> has exceeded its planned duration:</p>
        
        <div class="milestone-card">
            <div class="detail-row">
                <span class="detail-label">Milestone:</span>
                <span class="detail-value">${milestoneName}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Planned Duration:</span>
                <span class="detail-value">${expectedDuration} days</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Overdue By:</span>
                <span class="detail-value highlight">${overdueDuration}</span>
            </div>
        </div>
        
        <p>Please review the milestone progress and adjust the project timeline as needed.</p>
        
        <a href="${url}" class="action-button">
            View Project Details
        </a>
    </div>
    
    <div class="footer">
        <p>This is an automated notification. Please contact the project manager if you have any questions.</p>
        <p>© ${new Date().getFullYear()} Project Management System</p>
    </div>
</body>
</html>
    `;
};

export const createMilestoneTransitionEmail = (projectName: string, fromMilestone: string, toMilestone: string, overdueDuration: string) => {
  const body = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { color: #2c3e50; font-size: 20px; margin-bottom: 15px; }
        .content { margin-bottom: 20px; }
        .highlight { color: #3498db; font-weight: bold; }
        .footer { margin-top: 20px; font-size: 12px; color: #7f8c8d; }
    </style>
</head>
<body>
    <div class="header">Project Milestone Update</div>
    
    <div class="content">
        <p>Project <span class="highlight">${projectName}</span> has been moved:</p>
        <p><strong>From:</strong> ${fromMilestone}</p>
        <p><strong>To:</strong> ${toMilestone}</p>
        <p><strong>Overdue by:</strong> ${overdueDuration}</p>
    </div>
    
    <div class="footer">
        <p>This is an automated notification. Please check the project dashboard for details.</p>
    </div>
</body>
</html>
    `;

  return body;
};
