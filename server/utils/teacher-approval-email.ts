  // Send Teacher Approval Email - Uses Your Custom HTML Template
  async sendTeacherApprovalEmail(
    email: string,
    data: {
      fullName: string;
      displayName: string;
    }
  ): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f0f1f5; color: #333; }
  .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
  .header { background-color: #0C332C; padding: 40px 20px; text-align: center; color: white; }
  .content { padding: 40px; line-height: 1.6; }
  .footer { background-color: #0C332C; padding: 20px; text-align: center; color: rgba(255,255,255,0.7); font-size: 12px; }
  .button { display: inline-block; padding: 12px 30px; background-color: #e84a2a; color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
  .hero-image { width: 100%; max-width: 600px; height: auto; display: block; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <img src="${baseUrl}/email-assets/bbe5722d1ffd3c84888e18335965d5e5.png" alt="EduFiliova Logo" style="max-width: 150px; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 24px;">Welcome to the Team!</h1>
  </div>
  <img src="${baseUrl}/email-assets/e4d45170731072cbb168266fca3fd470.png" alt="Welcome" class="hero-image">
  <div class="content">
    <h2 style="color: #0C332C;">Congratulations ${data.fullName}!</h2>
    <p>We are thrilled to inform you that your teacher application for <strong>EduFiliova</strong> has been officially <strong>APPROVED</strong>.</p>
    <p>Your expertise and passion for education are exactly what we look for, and we can't wait to see the impact you'll make on our students.</p>
    <div style="text-align: center;">
      <a href="${baseUrl}/teacher-login" class="button">Access Your Dashboard</a>
    </div>
    <p>Getting started is easy:</p>
    <ul style="padding-left: 20px;">
      <li>Log in to your teacher portal</li>
      <li>Complete your professional profile</li>
      <li>Start creating and listing your first courses</li>
    </ul>
    <p>If you have any questions, our support team is always here to help.</p>
    <p>Best regards,<br>The EduFiliova Team</p>
  </div>
  <div class="footer">
    <div style="margin-bottom: 15px;">
      <img src="${baseUrl}/email-assets/9f7291948d8486bdd26690d0c32796e0.png" alt="Social" style="width: 24px; margin: 0 5px;">
    </div>
    <p>© ${new Date().getFullYear()} EduFiliova. All rights reserved.</p>
    <p>Creativity, Learning, and Growth in One Place</p>
  </div>
</div>
</body>
</html>`;

    return this.sendEmail({
      to: email,
      subject: 'Congratulations! Your Teacher Application is Approved - EduFiliova',
      html,
      from: `"EduFiliova Support" <support@edufiliova.com>`,
    });
  }
