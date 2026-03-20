export const newEventScheduledEmail = (userName: string, eventName: string, eventDate: string, eventLink: string) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
      <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { color: #2c3e50; font-size: 24px; margin-bottom: 20px; }
          .content { margin-bottom: 25px; }
          .highlight { font-weight: bold; color: #3498db; }
          .event-name { font-weight: bold; color: #9b59b6; }
          .event-date { 
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
      <div class="header">📅 New Event Scheduled</div>
      
      <div class="content">
          <p>Dear <span class="highlight">${userName}</span>,</p>
          
          <p><span class="event-name">${eventName}</span> has been scheduled.</p>
          
          <div class="event-date">
              <span class="icon">⏰</span> Date: ${eventDate}
          </div>
          
          <br>
          <a href="${eventLink}" class="button">View Event Details</a>
      </div>
      
      <div class="footer">
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

export const newNoteAddedEmail = (userName: string, projectName: string, noteLink: string) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
      <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { color: #2c3e50; font-size: 24px; margin-bottom: 20px; }
          .content { margin-bottom: 25px; }
          .highlight { font-weight: bold; color: #3498db; }
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
      <div class="header">📝 New Note Added</div>
      
      <div class="content">
          <p>Dear <span class="highlight">${userName}</span>,</p>
          
          <p>A new note has been added to <span class="highlight">${projectName}</span>.</p>
          
          <br>
          <a href="${noteLink}" class="button">View Note</a>
      </div>
      
      <div class="footer">
          <p>Best regards,<br>The Pylott Team</p>
      </div>
  </body>
  </html>
    `;
};

export const newMilestoneAddedEmail = (userName: string, milestoneName: string, projectName: string, milestoneLink: string) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
      <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { color: #2c3e50; font-size: 24px; margin-bottom: 20px; }
          .content { margin-bottom: 25px; }
          .highlight { font-weight: bold; color: #3498db; }
          .milestone-name { 
              font-weight: bold; 
              color: #e74c3c;
              background-color: #fdeaea;
              padding: 2px 6px;
              border-radius: 4px;
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
      <div class="header">📌 New Milestone Added</div>
      
      <div class="content">
          <p>Dear <span class="highlight">${userName}</span>,</p>
          
          <p>A new milestone, <span class="milestone-name">${milestoneName}</span>, has been added to <span class="highlight">${projectName}</span>.</p>
          
          <br>
          <a href="${milestoneLink}" class="button">View Milestone</a>
      </div>
      
      <div class="footer">
          <p>Best regards,<br>The Pylott Team</p>
      </div>
  </body>
  </html>
    `;
};

export const newProjectCreatedEmail = (userName: string, projectName: string, projectLink: string) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Project Created - ${projectName}</title>
      <style>
          body { 
              font-family: 'Arial', sans-serif; 
              line-height: 1.6; 
              color: #333333; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px;
              background-color: #f9f9f9;
          }
          .email-container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          }
          .header {
              color: #2c3e50;
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 25px;
              border-bottom: 2px solid #f0f0f0;
              padding-bottom: 15px;
          }
          .content {
              margin-bottom: 25px;
          }
          .project-name {
              font-weight: bold;
              color: #3498db;
              background-color: #f0f8ff;
              padding: 3px 6px;
              border-radius: 4px;
          }
          .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #3498db;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: bold;
              text-align: center;
          }
          .footer {
              margin-top: 30px;
              font-size: 14px;
              color: #7f8c8d;
              border-top: 1px solid #eeeeee;
              padding-top: 20px;
          }
          .link {
              color: #3498db;
              text-decoration: none;
          }
      </style>
  </head>
  <body>
      <div class="email-container">
          <div class="header">New Project Created</div>
          
          <div class="content">
              <p>Dear <strong>${userName}</strong>,</p>
              
              <p>A new project, <span class="project-name">${projectName}</span>, has been successfully created.</p>
              
              <a href="${projectLink}" class="button">View Project</a>
              
              <p>Start collaborating now!</p>
          </div>
          
          <div class="footer">
              <p>Best regards,<br><strong>The Pylott Team</strong></p>
              <p style="font-size: 12px; margin-top: 15px; color: #95a5a6;">
                  <a href="https://pylott.com" class="link">Pylott</a> | 
                  <a href="https://pylott.com/support" class="link">Help Center</a>
              </p>
          </div>
      </div>
  </body>
  </html>
    `;
};

/**
 * Generates the HTML for auth-related emails (verification, invite, etc.) using the new template.
 * @param params Object containing all dynamic values for the template.
 */
export function authEmailTemplate({
  userName,
  mainTitle = 'Verify email address',
  message = 'Thank you for signing up with us! To complete your registration and get started, we just need to verify your email address.',
  actionText = 'Verify Email',
  actionLink,
  supportEmail = 'ava@pylott.io',
  websiteLink = 'https://pylott.io',
  logoUrl = 'https://www.pylott.io/assets/logo-DabAzhJ7.svg',
  companyName = 'Pylott Team',
  copyright = 'Copyright © 2025 Pylott Technologies, All rights reserved.',
}: {
  userName: string;
  mainTitle?: string;
  message?: string;
  actionText?: string;
  actionLink: string;
  supportEmail?: string;
  websiteLink?: string;
  logoUrl?: string;
  companyName?: string;
  copyright?: string;
  otp?: string;
}) {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta name="viewport" content="width=device-width" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${mainTitle}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
      rel="stylesheet"
    />
  </head>
  <body
    style="
      font-family: 'DM Sans', sans-serif;
      font-optical-sizing: auto;
      font-style: normal;
    "
  >
    <div>
      <table
        width="100%"
        border="0"
        cellpadding="0"
        cellspacing="0"
        style="background-color: #092327; padding-top: 20px; position: relative"
        bgcolor="#092327"
      >
        <tbody>
          <tr>
            <td
              align="center"
              style="background-color: #092327; margin-top: 0"
              bgcolor="#092327"
            >
              <a
                href="${websiteLink}"
                style="color: inherit"
                target="_blank"
                ><table width="100%" cellpadding="0" cellspacing="0">
                  <tbody>
                    <tr>
                      <td
                        align="center"
                        style="
                          padding-left: 20px;
                          padding-right: 20px;
                          padding-top: 40px;
                          padding-bottom: 60px;
                          color: #fff;
                        "
                      >
                        <img
                          src="${logoUrl}"
                          alt="Pylott"
                          width="100"
                          border="0"
                          style="
                            border: none;
                            outline: none;
                            border-collapse: collapse;
                            display: block;
                            border-style: none;
                          "
                        />
                      </td>
                    </tr>
                  </tbody></table
              ></a>
            </td>
          </tr>
          <tr>
            <td
              align="center"
              style="margin-top: 0; padding-bottom: 20px"
              bgcolor="#092327"
            >
              <table
                align="center"
                border="0"
                cellpadding="0"
                cellspacing="0"
                style="
                  background-color: #ffffff;
                  width: 600px;
                  position: relative;
                  border-radius: 16px;
                "
                width="600"
                bgcolor="#ffffff"
              >
                <tbody>
                  <tr>
                    <td align="center">
                      <table>
                        <tr>
                          <td align="center">
                            <table
                              align="left"
                              width="100%"
                              cellpadding="0"
                              cellspacing="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    align="left"
                                    style="
                                      padding-left: 20px;
                                      padding-right: 20px;
                                      font-family: DM Sans, Roboto, Segoe UI,
                                        sans-serif;
                                      font-weight: 700;
                                      font-size: 22px;
                                      line-height: 22px;
                                      letter-spacing: -0.35px;
                                      padding-top: 32px;
                                      padding-bottom: 32px;
                                      color: #383838;
                                    "
                                  >
                                    ${mainTitle}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <table
                              border="0"
                              width="100%"
                              cellpadding="0"
                              cellspacing="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    align="left"
                                    style="
                                      padding-left: 20px;
                                      padding-right: 20px;
                                      padding-top: 8px;
                                      color: #383838;
                                      font-size: 16px;
                                      font-weight: 300;
                                    "
                                  >
                                    Dear ${userName},
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <table
                              border="0"
                              width="100%"
                              cellpadding="0"
                              cellspacing="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    align="left"
                                    style="
                                      padding-left: 20px;
                                      padding-right: 20px;
                                      padding-top: 20px;
                                      color: #383838;
                                      font-size: 16px;
                                      font-weight: 300;
                                    "
                                  >
                                    ${message}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <table
                              border="0"
                              width="100%"
                              cellpadding="0"
                              cellspacing="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    align="left"
                                    style="
                                      padding-left: 20px;
                                      padding-right: 20px;
                                      padding-top: 20px;
                                      color: #383838;
                                      font-size: 16px;
                                      font-weight: 300;
                                    "
                                  >
                                    Please click the link below to confirm your
                                    email address: <br />
                                    <a href="${actionLink}">${actionLink}</a>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <table
                              border="0"
                              width="100%"
                              cellpadding="0"
                              cellspacing="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    align="left"
                                    style="
                                      padding-left: 20px;
                                      padding-right: 20px;
                                      padding-top: 20px;
                                      color: #383838;
                                      font-size: 16px;
                                      font-weight: 300;
                                    "
                                  >
                                    If you did not sign up for an account with
                                    us, please ignore this message. Your account
                                    will not be activated.
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <table
                              border="0"
                              width="100%"
                              cellpadding="0"
                              cellspacing="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    align="left"
                                    style="
                                      padding-left: 20px;
                                      padding-right: 20px;
                                      padding-top: 20px;
                                      color: #383838;
                                      font-size: 16px;
                                      font-weight: 300;
                                    "
                                  >
                                    If you have any questions or need
                                    assistance, feel free to reach out to our
                                    support team at <a href="mailto:${supportEmail}">${supportEmail}</a>.
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <table
                              border="0"
                              width="100%"
                              cellpadding="0"
                              cellspacing="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    align="left"
                                    style="
                                      padding-left: 20px;
                                      padding-right: 20px;
                                      padding-top: 40px;
                                      color: #383838;
                                      font-size: 16px;
                                      font-weight: 300;
                                    "
                                  >
                                    Thank you,
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <table
                              border="0"
                              width="100%"
                              cellpadding="0"
                              cellspacing="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    align="left"
                                    style="
                                      padding-left: 20px;
                                      padding-right: 20px;
                                      padding-top: 0px;
                                      color: #383838;
                                      font-size: 16px;
                                      font-weight: 300;
                                    "
                                  >
                                    ${companyName}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <table
                              border="0"
                              width="100%"
                              cellpadding="0"
                              cellspacing="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    align="left"
                                    style="
                                      padding-left: 20px;
                                      padding-right: 20px;
                                      padding-top: 100px;
                                      padding-bottom: 80px;
                                      color: #383838;
                                      font-size: 16px;
                                      font-weight: 300;
                                    "
                                  >
                                    <!--[if mso]>
                                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${actionLink}" style="height:50px;v-text-anchor:middle;width:300px;" arcsize="60%" fillcolor="#191819">
                                      <w:anchorlock/>
                                      <center style="color:#ffffff;font-family:'DM Sans',sans-serif;font-size:16px;">${actionText}</center>
                                    </v:roundrect>
                                    <![endif]-->
                                    <!--[if !mso]><!-->
                                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                      <tr>
                                        <td align="center" bgcolor="#191819" style="border-radius:30px;">
                                          <a href="${actionLink}" target="_blank" style="display:block;padding:15px 30px;font-size:16px;color:#ffffff;text-decoration:none;border-radius:30px;background-color:#191819;font-family:'DM Sans',sans-serif;text-align:center;mso-hide:all;">${actionText}</a>
                                        </td>
                                      </tr>
                                    </table>
                                    <!--<![endif]-->
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
              <table
                align="center"
                border="0"
                cellpadding="0"
                cellspacing="0"
                style="
                  background-color: transparent;
                  width: 600px;
                  padding-top: 40px;
                  padding-bottom: 100px;
                "
                width="600"
                bgcolor="transparent"
              >
                <tbody>
                  <tr>
                    <td align="center" style="color: #fff; font-weight: 300;">
                      <span>${copyright}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </body>
</html>
  `;
}

export function otpEmailTemplate({
  userName,
  otp,
  mainTitle = 'Email Verification',
  message = 'Please use the verification code below to complete your email verification.',
  expiryMinutes = 10,
  supportEmail = 'ava@pylott.io',
  websiteLink = 'https://pylott.io',
  logoUrl = 'https://www.pylott.io/assets/logo-DabAzhJ7.svg',

  copyright = 'Copyright © 2025 Pylott Technologies, All rights reserved.',
}: {
  userName: string;
  otp: string;
  mainTitle?: string;
  message?: string;
  expiryMinutes?: number;
  supportEmail?: string;
  websiteLink?: string;
  logoUrl?: string;
  companyName?: string;
  copyright?: string;
}) {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta name="viewport" content="width=device-width" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${mainTitle}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
      rel="stylesheet"
    />
  </head>
  <body
    style="
      font-family: 'DM Sans', sans-serif;
      font-optical-sizing: auto;
      font-style: normal;
    "
  >
    <div>
      <table
        width="100%"
        border="0"
        cellpadding="0"
        cellspacing="0"
        style="background-color: #092327; padding-top: 20px; position: relative"
        bgcolor="#092327"
      >
        <tbody>
          <tr>
            <td
              align="center"
              style="background-color: #092327; margin-top: 0"
              bgcolor="#092327"
            >
              <a
                href="${websiteLink}"
                style="color: inherit"
                target="_blank"
                ><table width="100%" cellpadding="0" cellspacing="0">
                  <tbody>
                    <tr>
                      <td
                        align="center"
                        style="
                          padding-left: 20px;
                          padding-right: 20px;
                          padding-top: 40px;
                          padding-bottom: 60px;
                          color: #fff;
                        "
                      >
                        <img
                          src="${logoUrl}"
                          alt="Pylott"
                          width="100"
                          border="0"
                          style="
                            border: none;
                            outline: none;
                            border-collapse: collapse;
                            display: block;
                            border-style: none;
                          "
                        />
                      </td>
                    </tr>
                  </tbody></table
              ></a>
            </td>
          </tr>
          <tr>
            <td
              align="center"
              style="margin-top: 0; padding-bottom: 20px"
              bgcolor="#092327"
            >
              <table
                align="center"
                border="0"
                cellpadding="0"
                cellspacing="0"
                style="
                  background-color: #ffffff;
                  width: 600px;
                  position: relative;
                  border-radius: 16px;
                "
                width="600"
                bgcolor="#ffffff"
              >
                <tbody>
                  <tr>
                    <td align="center">
                      <table>
                        <tr>
                          <td align="center">
                            <table
                              align="left"
                              width="100%"
                              cellpadding="0"
                              cellspacing="0"
                            >
                              <tbody>
                                <tr>
                                  <td
                                    align="left"
                                    style="
                                      padding-left: 20px;
                                      padding-right: 20px;
                                      font-family: DM Sans, Roboto, Segoe UI,
                                        sans-serif;
                                      font-weight: 700;
                                      font-size: 22px;
                                      line-height: 22px;
                                      letter-spacing: -0.35px;
                                      padding-top: 32px;
                                      padding-bottom: 32px;
                                      color: #383838;
                                    "
                                  >
                                    ${mainTitle}
                                  </td>
                                </tr>
                                <tr>
                                  <td
                                    align="left"
                                    style="
                                      padding-left: 20px;
                                      padding-right: 20px;
                                      font-family: DM Sans, Roboto, Segoe UI,
                                        sans-serif;
                                      font-weight: 400;
                                      font-size: 16px;
                                      line-height: 24px;
                                      letter-spacing: -0.25px;
                                      color: #383838;
                                      padding-bottom: 24px;
                                    "
                                  >
                                    Hi ${userName},
                                  </td>
                                </tr>
                                <tr>
                                  <td
                                    align="left"
                                    style="
                                      padding-left: 20px;
                                      padding-right: 20px;
                                      font-family: DM Sans, Roboto, Segoe UI,
                                        sans-serif;
                                      font-weight: 400;
                                      font-size: 16px;
                                      line-height: 24px;
                                      letter-spacing: -0.25px;
                                      color: #383838;
                                      padding-bottom: 32px;
                                    "
                                  >
                                    ${message}
                                  </td>
                                </tr>
                                <tr>
                                  <td align="center" style="padding-bottom: 32px;">
                                    <div
                                      style="
                                        background-color: #f8f9fa;
                                        border: 2px dashed #e9ecef;
                                        border-radius: 12px;
                                        padding: 24px;
                                        margin: 0 20px;
                                        text-align: center;
                                      "
                                    >
                                      <div
                                        style="
                                          font-family: DM Sans, Roboto, Segoe UI, sans-serif;
                                          font-weight: 700;
                                          font-size: 32px;
                                          line-height: 1;
                                          letter-spacing: 8px;
                                          color: #092327;
                                          margin-bottom: 8px;
                                        "
                                      >
                                        ${otp}
                                      </div>
                                      <div
                                        style="
                                          font-family: DM Sans, Roboto, Segoe UI, sans-serif;
                                          font-weight: 400;
                                          font-size: 14px;
                                          line-height: 1.4;
                                          color: #6c757d;
                                        "
                                      >
                                        This code expires in ${expiryMinutes} minutes
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                                <tr>
                                  <td
                                    align="left"
                                    style="
                                      padding-left: 20px;
                                      padding-right: 20px;
                                      font-family: DM Sans, Roboto, Segoe UI,
                                        sans-serif;
                                      font-weight: 400;
                                      font-size: 14px;
                                      line-height: 20px;
                                      letter-spacing: -0.2px;
                                      color: #6c757d;
                                      padding-bottom: 32px;
                                    "
                                  >
                                    If you didn't request this verification code, please ignore this email or contact our support team if you have concerns.
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td
              align="center"
              style="padding-bottom: 40px; padding-left: 20px; padding-right: 20px"
              bgcolor="#092327"
            >
              <table
                align="center"
                border="0"
                cellpadding="0"
                cellspacing="0"
                style="width: 600px"
                width="600"
              >
                <tbody>
                  <tr>
                    <td
                      align="center"
                      style="
                        font-family: DM Sans, Roboto, Segoe UI, sans-serif;
                        font-weight: 400;
                        font-size: 14px;
                        line-height: 20px;
                        letter-spacing: -0.2px;
                        color: #ffffff;
                        padding-bottom: 16px;
                      "
                    >
                      Need help? Contact us at
                      <a
                        href="mailto:${supportEmail}"
                        style="color: #ffffff; text-decoration: underline"
                        >${supportEmail}</a
                      >
                    </td>
                  </tr>
                  <tr>
                    <td
                      align="center"
                      style="
                        font-family: DM Sans, Roboto, Segoe UI, sans-serif;
                        font-weight: 400;
                        font-size: 12px;
                        line-height: 16px;
                        letter-spacing: -0.15px;
                        color: #ffffff;
                        opacity: 0.7;
                      "
                    >
                      ${copyright}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </body>
</html>
  `;
}
