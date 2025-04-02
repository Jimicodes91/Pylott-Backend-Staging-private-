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
