export const NOTIFICATION_EMAIL_TEMPLATES = {
  incomplete_registration_1h: {
    subject: "{{displayName}}, complete your registration to start learning!",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background-color: #0C332C; padding: 30px 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .btn { display: inline-block; background: #0C332C; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { background: #1a1a1a; padding: 30px 40px; color: #999; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="EduFiliova" class="logo" />
    </div>
    <div class="content">
      <h1 style="color: #1a1a1a; margin: 0 0 20px;">Hey {{displayName}}!</h1>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        We noticed you started signing up but didn't finish. No worries – your spot is still waiting!
      </p>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        Complete your registration now to unlock:
      </p>
      <ul style="color: #666; font-size: 16px; line-height: 1.8;">
        <li>Access to thousands of lessons and courses</li>
        <li>Interactive learning tools</li>
        <li>Progress tracking and certificates</li>
      </ul>
      <div style="text-align: center;">
        <a href="{{completeUrl}}" class="btn">Complete Registration</a>
      </div>
      <p style="color: #999; font-size: 14px; margin-top: 30px;">
        If you have any questions, just reply to this email – we're here to help!
      </p>
    </div>
    <div class="footer">
      <p>© {{currentYear}} EduFiliova. All rights reserved.</p>
      <p><a href="{{unsubscribeLink}}" style="color: #999;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `,
  },

  incomplete_registration_24h: {
    subject: "{{displayName}}, your registration is expiring soon!",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background-color: #0C332C; padding: 30px 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .btn { display: inline-block; background: #0C332C; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .urgent-box { background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px 20px; margin: 20px 0; }
    .footer { background: #1a1a1a; padding: 30px 40px; color: #999; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="EduFiliova" class="logo" />
    </div>
    <div class="content">
      <h1 style="color: #1a1a1a; margin: 0 0 20px;">Time is running out, {{displayName}}!</h1>
      <div class="urgent-box">
        <p style="margin: 0; color: #e65100; font-weight: 600;">Your registration will expire in 24 hours!</p>
      </div>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        Don't miss out on your learning journey. Complete your registration now before your spot expires.
      </p>
      <div style="text-align: center;">
        <a href="{{completeUrl}}" class="btn">Complete Registration Now</a>
      </div>
      <p style="color: #999; font-size: 14px; margin-top: 30px;">
        Need help? Reply to this email and we'll assist you right away.
      </p>
    </div>
    <div class="footer">
      <p>© {{currentYear}} EduFiliova. All rights reserved.</p>
      <p><a href="{{unsubscribeLink}}" style="color: #999;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `,
  },

  freelancer_incomplete_registration_1h: {
    subject: "{{displayName}}, finish setting up your freelance profile!",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background-color: #0C332C; padding: 30px 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .btn { display: inline-block; background: #0C332C; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { background: #1a1a1a; padding: 30px 40px; color: #999; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="EduFiliova" class="logo" />
    </div>
    <div class="content">
      <h1 style="color: #1a1a1a; margin: 0 0 20px;">Welcome to the Freelance Community, {{displayName}}!</h1>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        You're almost done! Complete your freelance profile to start connecting with clients and earning on EduFiliova.
      </p>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        Complete your registration to:
      </p>
      <ul style="color: #666; font-size: 16px; line-height: 1.8;">
        <li>Showcase your portfolio and skills</li>
        <li>Connect with clients looking for your expertise</li>
        <li>Start earning from day one</li>
        <li>Build your professional reputation</li>
      </ul>
      <div style="text-align: center;">
        <a href="{{completeUrl}}" class="btn">Complete Your Profile</a>
      </div>
      <p style="color: #999; font-size: 14px; margin-top: 30px;">
        Questions? Reply to this email and our support team will help you get started!
      </p>
    </div>
    <div class="footer">
      <p>© {{currentYear}} EduFiliova. All rights reserved.</p>
      <p><a href="{{unsubscribeLink}}" style="color: #999;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `,
  },

  freelancer_incomplete_registration_24h: {
    subject: "{{displayName}}, your freelancer registration expires in 24 hours!",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background-color: #0C332C; padding: 30px 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .btn { display: inline-block; background: #0C332C; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .urgent-box { background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px 20px; margin: 20px 0; }
    .footer { background: #1a1a1a; padding: 30px 40px; color: #999; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="EduFiliova" class="logo" />
    </div>
    <div class="content">
      <h1 style="color: #1a1a1a; margin: 0 0 20px;">Don't miss out on client opportunities, {{displayName}}!</h1>
      <div class="urgent-box">
        <p style="margin: 0; color: #e65100; font-weight: 600;">Your freelancer profile registration expires in 24 hours!</p>
      </div>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        Complete your registration now to start earning with EduFiliova. Finish setting up your profile before your opportunity expires!
      </p>
      <div style="text-align: center;">
        <a href="{{completeUrl}}" class="btn">Activate Your Freelance Profile</a>
      </div>
      <p style="color: #999; font-size: 14px; margin-top: 30px;">
        Need support? We're here to help. Reply to this email anytime.
      </p>
    </div>
    <div class="footer">
      <p>© {{currentYear}} EduFiliova. All rights reserved.</p>
      <p><a href="{{unsubscribeLink}}" style="color: #999;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `,
  },

  welcome_day_0: {
    subject: "Welcome to EduFiliova, {{displayName}}!",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background-color: #0C332C; padding: 30px 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .btn { display: inline-block; background: #0C332C; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .feature-box { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 15px 0; }
    .footer { background: #1a1a1a; padding: 30px 40px; color: #999; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="EduFiliova" class="logo" />
    </div>
    <div class="content">
      <h1 style="color: #1a1a1a; margin: 0 0 20px;">Welcome aboard, {{displayName}}!</h1>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        We're thrilled to have you join the EduFiliova family! You've taken the first step towards an amazing learning journey.
      </p>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        Here's what you can do right now:
      </p>
      <div class="feature-box">
        <h3 style="color: #1a1a1a; margin: 0 0 10px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" fill="none" style="vertical-align: middle; margin-right: 8px;">
            <path d="M8 8C8 8 14 6 24 6C34 6 40 8 40 8V40C40 40 34 38 24 38C14 38 8 40 8 40V8Z" fill="#3B82F6"/>
            <path d="M24 6V38" stroke="white" stroke-width="2"/>
          </svg>
          Explore Courses
        </h3>
        <p style="color: #666; margin: 0;">Browse our library of courses tailored to your grade level.</p>
      </div>
      <div class="feature-box">
        <h3 style="color: #1a1a1a; margin: 0 0 10px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" fill="none" style="vertical-align: middle; margin-right: 8px;">
            <circle cx="24" cy="16" r="10" fill="#3B82F6"/>
            <path d="M10 44C10 34 16 28 24 28C32 28 38 34 38 44" stroke="#3B82F6" stroke-width="4"/>
          </svg>
          Complete Your Profile
        </h3>
        <p style="color: #666; margin: 0;">Set up your profile to get personalized recommendations.</p>
      </div>
      <div class="feature-box">
        <h3 style="color: #1a1a1a; margin: 0 0 10px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" fill="none" style="vertical-align: middle; margin-right: 8px;">
            <circle cx="24" cy="24" r="20" stroke="#0C332C" stroke-width="4"/>
            <circle cx="24" cy="24" r="12" stroke="#F59E0B" stroke-width="4"/>
            <circle cx="24" cy="24" r="4" fill="#10B981"/>
          </svg>
          Start Learning
        </h3>
        <p style="color: #666; margin: 0;">Jump into your first lesson and track your progress.</p>
      </div>
      <div style="text-align: center;">
        <a href="{{dashboardUrl}}" class="btn">Go to Dashboard</a>
      </div>
    </div>
    <div class="footer">
      <p>© {{currentYear}} EduFiliova. All rights reserved.</p>
      <p><a href="{{unsubscribeLink}}" style="color: #999;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `,
  },

  welcome_day_2: {
    subject: "{{displayName}}, have you explored these features yet?",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background-color: #0C332C; padding: 30px 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .btn { display: inline-block; background: #0C332C; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .feature-box { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 15px 0; }
    .tip-box { background: #0C332C; padding: 25px; border-radius: 12px; margin: 20px 0; color: #ffffff; }
    .footer { background: #1a1a1a; padding: 30px 40px; color: #999; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="EduFiliova" class="logo" />
    </div>
    <div class="content">
      <h1 style="color: #1a1a1a; margin: 0 0 20px;">How's your learning going, {{displayName}}?</h1>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        It's been a couple of days since you joined. Here are some tips to get the most out of EduFiliova:
      </p>
      <div class="tip-box">
        <h3 style="margin: 0 0 10px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" fill="none" style="vertical-align: middle; margin-right: 8px;">
            <path d="M24 4C16.268 4 10 10.268 10 18C10 23.5 14 28 18 32V36H30V32C34 28 38 23.5 38 18C38 10.268 31.732 4 24 4Z" fill="#FCD34D"/>
            <rect x="18" y="38" width="12" height="6" rx="2" fill="white"/>
          </svg>
          Pro Tip
        </h3>
        <p style="margin: 0;">Set a daily learning goal of just 15 minutes. Consistency beats intensity!</p>
      </div>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        <strong>Popular with students like you:</strong>
      </p>
      <ul style="color: #666; font-size: 16px; line-height: 1.8;">
        <li>Daily challenges to test your knowledge</li>
        <li>Interactive quizzes with instant feedback</li>
        <li>Study groups and community discussions</li>
      </ul>
      <div style="text-align: center;">
        <a href="{{dashboardUrl}}" class="btn">Continue Learning</a>
      </div>
    </div>
    <div class="footer">
      <p>© {{currentYear}} EduFiliova. All rights reserved.</p>
      <p><a href="{{unsubscribeLink}}" style="color: #999;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `,
  },

  welcome_day_5: {
    subject: "{{displayName}}, unlock your full potential with these resources",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background-color: #0C332C; padding: 30px 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .btn { display: inline-block; background: #0C332C; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .stats-box { background: #f0f9ff; border: 2px solid #0ea5e9; padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center; }
    .footer { background: #1a1a1a; padding: 30px 40px; color: #999; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="EduFiliova" class="logo" />
    </div>
    <div class="content">
      <h1 style="color: #1a1a1a; margin: 0 0 20px;">You're doing great, {{displayName}}!</h1>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        You've been with us for 5 days now. Here's what you've unlocked:
      </p>
      <div class="stats-box">
        <h2 style="color: #0ea5e9; margin: 0;">Your Learning Journey</h2>
        <p style="color: #666; margin: 10px 0 0;">Every expert was once a beginner. Keep going!</p>
      </div>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        <strong>Ready for more?</strong> Consider upgrading to unlock:
      </p>
      <ul style="color: #666; font-size: 16px; line-height: 1.8;">
        <li>Unlimited access to all courses</li>
        <li>Live tutoring sessions</li>
        <li>Downloadable study materials</li>
        <li>Certificates of completion</li>
      </ul>
      <div style="text-align: center;">
        <a href="{{pricingUrl}}" class="btn">View Plans</a>
      </div>
    </div>
    <div class="footer">
      <p>© {{currentYear}} EduFiliova. All rights reserved.</p>
      <p><a href="{{unsubscribeLink}}" style="color: #999;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `,
  },

  learning_inactivity_3d: {
    subject: "{{displayName}}, we miss you! Continue your learning streak",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background-color: #0C332C; padding: 30px 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .btn { display: inline-block; background: #0C332C; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .reminder-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; }
    .footer { background: #1a1a1a; padding: 30px 40px; color: #999; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="EduFiliova" class="logo" />
    </div>
    <div class="content">
      <h1 style="color: #1a1a1a; margin: 0 0 20px;">Hey {{displayName}}, we miss you!</h1>
      <div class="reminder-box">
        <p style="margin: 0; color: #92400e;">It's been 3 days since your last lesson. Don't break your learning streak!</p>
      </div>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        Just 10 minutes a day can make a huge difference. Your courses are waiting for you!
      </p>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        <strong>Quick tip:</strong> Pick up right where you left off – we saved your progress.
      </p>
      <div style="text-align: center;">
        <a href="{{dashboardUrl}}" class="btn">Resume Learning</a>
      </div>
    </div>
    <div class="footer">
      <p>© {{currentYear}} EduFiliova. All rights reserved.</p>
      <p><a href="{{unsubscribeLink}}" style="color: #999;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `,
  },

  course_not_started_3d: {
    subject: "{{displayName}}, your enrolled course is waiting!",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background-color: #0C332C; padding: 30px 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .btn { display: inline-block; background: #0C332C; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .course-card { background: #f9fafb; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e5e7eb; }
    .footer { background: #1a1a1a; padding: 30px 40px; color: #999; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="EduFiliova" class="logo" />
    </div>
    <div class="content">
      <h1 style="color: #1a1a1a; margin: 0 0 20px;">Your course is ready, {{displayName}}!</h1>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        You enrolled in a course 3 days ago but haven't started yet. The best time to start is now!
      </p>
      <div class="course-card">
        <h3 style="color: #1a1a1a; margin: 0 0 10px;">{{courseName}}</h3>
        <p style="color: #666; margin: 0;">Start your first lesson and see how fun learning can be!</p>
      </div>
      <div style="text-align: center;">
        <a href="{{courseUrl}}" class="btn">Start Course Now</a>
      </div>
    </div>
    <div class="footer">
      <p>© {{currentYear}} EduFiliova. All rights reserved.</p>
      <p><a href="{{unsubscribeLink}}" style="color: #999;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `,
  },

  download_reminder_24h: {
    subject: "{{displayName}}, don't forget to download your purchase!",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background-color: #0C332C; padding: 30px 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .btn { display: inline-block; background: #0C332C; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .product-box { background: #f0fdf4; border: 2px solid #22c55e; padding: 20px; border-radius: 12px; margin: 20px 0; }
    .footer { background: #1a1a1a; padding: 30px 40px; color: #999; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="EduFiliova" class="logo" />
    </div>
    <div class="content">
      <h1 style="color: #1a1a1a; margin: 0 0 20px;">Your download is ready!</h1>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        Hey {{displayName}}, you purchased something awesome but haven't downloaded it yet!
      </p>
      <div class="product-box">
        <h3 style="color: #15803d; margin: 0 0 10px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" fill="none" style="vertical-align: middle; margin-right: 8px;">
            <circle cx="24" cy="24" r="22" fill="#10B981"/>
            <path d="M15 24L21 30L33 18" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Ready for Download
        </h3>
        <p style="color: #666; margin: 0;">{{productName}}</p>
      </div>
      <div style="text-align: center;">
        <a href="{{downloadUrl}}" class="btn">Download Now</a>
      </div>
    </div>
    <div class="footer">
      <p>© {{currentYear}} EduFiliova. All rights reserved.</p>
      <p><a href="{{unsubscribeLink}}" style="color: #999;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `,
  },

  teacher_no_content_3d: {
    subject: "{{displayName}}, create your first course and start earning!",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background-color: #0C332C; padding: 30px 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .btn { display: inline-block; background: #0C332C; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .earnings-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 25px; border-radius: 12px; margin: 20px 0; color: #fff; text-align: center; }
    .footer { background: #1a1a1a; padding: 30px 40px; color: #999; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="EduFiliova" class="logo" />
    </div>
    <div class="content">
      <h1 style="color: #1a1a1a; margin: 0 0 20px;">Ready to start teaching, {{displayName}}?</h1>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        You joined as a teacher but haven't created any courses yet. Let's change that!
      </p>
      <div class="earnings-box">
        <h2 style="margin: 0;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48" fill="none" style="vertical-align: middle; margin-right: 8px;">
            <circle cx="24" cy="24" r="22" fill="#10B981"/>
            <path d="M24 12V36M18 20C18 17.791 20.686 16 24 16C27.314 16 30 17.791 30 20C30 22.209 27.314 24 24 24C20.686 24 18 25.791 18 28C18 30.209 20.686 32 24 32C27.314 32 30 30.209 30 28" stroke="white" stroke-width="3" stroke-linecap="round"/>
          </svg>
          Start Earning Today
        </h2>
        <p style="margin: 10px 0 0;">Teachers on EduFiliova earn up to $500/month</p>
      </div>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        <strong>Getting started is easy:</strong>
      </p>
      <ol style="color: #666; font-size: 16px; line-height: 1.8;">
        <li>Create your first course</li>
        <li>Add lessons and materials</li>
        <li>Publish and start earning</li>
      </ol>
      <div style="text-align: center;">
        <a href="{{createCourseUrl}}" class="btn">Create Your First Course</a>
      </div>
    </div>
    <div class="footer">
      <p>© {{currentYear}} EduFiliova. All rights reserved.</p>
      <p><a href="{{unsubscribeLink}}" style="color: #999;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `,
  },

  freelancer_no_content_5d: {
    subject: "{{displayName}}, showcase your work and get discovered!",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background-color: #0C332C; padding: 30px 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .btn { display: inline-block; background: #0C332C; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .showcase-box { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 25px; border-radius: 12px; margin: 20px 0; color: #fff; }
    .footer { background: #1a1a1a; padding: 30px 40px; color: #999; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="EduFiliova" class="logo" />
    </div>
    <div class="content">
      <h1 style="color: #1a1a1a; margin: 0 0 20px;">Time to shine, {{displayName}}!</h1>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        You've been a freelancer for 5 days but haven't uploaded any work yet. Let the world see your talent!
      </p>
      <div class="showcase-box">
        <h3 style="margin: 0 0 10px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" fill="none" style="vertical-align: middle; margin-right: 8px;">
            <path d="M24 4C12.954 4 4 12.954 4 24C4 35.046 12.954 44 24 44C25.657 44 27 42.657 27 41C27 40.209 26.679 39.497 26.167 38.985C25.666 38.484 25.357 37.787 25.357 37C25.357 35.343 26.7 34 28.357 34H32C38.627 34 44 28.627 44 22C44 11.507 35.046 4 24 4Z" fill="#E5E7EB"/>
            <circle cx="16" cy="18" r="4" fill="#0C332C"/>
            <circle cx="24" cy="12" r="4" fill="#FCD34D"/>
            <circle cx="32" cy="18" r="4" fill="#10B981"/>
            <circle cx="14" cy="28" r="4" fill="#3B82F6"/>
          </svg>
          Why Upload Your Work?
        </h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Get discovered by potential clients</li>
          <li>Build your professional portfolio</li>
          <li>Sell your designs and earn money</li>
        </ul>
      </div>
      <div style="text-align: center;">
        <a href="{{uploadWorkUrl}}" class="btn">Upload Your First Work</a>
      </div>
    </div>
    <div class="footer">
      <p>© {{currentYear}} EduFiliova. All rights reserved.</p>
      <p><a href="{{unsubscribeLink}}" style="color: #999;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `,
  },

  teacher_no_sales_14d: {
    subject: "{{displayName}}, tips to boost your course sales",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background-color: #0C332C; padding: 30px 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .btn { display: inline-block; background: #0C332C; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .tip-card { background: #f9fafb; padding: 15px 20px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #0C332C; }
    .footer { background: #1a1a1a; padding: 30px 40px; color: #999; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="EduFiliova" class="logo" />
    </div>
    <div class="content">
      <h1 style="color: #1a1a1a; margin: 0 0 20px;">Let's boost your sales, {{displayName}}!</h1>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        It's been 2 weeks since your last sale. Here are some proven tips to get more students:
      </p>
      <div class="tip-card">
        <h4 style="color: #1a1a1a; margin: 0 0 5px;">1. Update Your Course Preview</h4>
        <p style="color: #666; margin: 0; font-size: 14px;">A compelling preview video can increase enrollments by 50%.</p>
      </div>
      <div class="tip-card">
        <h4 style="color: #1a1a1a; margin: 0 0 5px;">2. Add More Content</h4>
        <p style="color: #666; margin: 0; font-size: 14px;">Courses with 10+ lessons perform 3x better.</p>
      </div>
      <div class="tip-card">
        <h4 style="color: #1a1a1a; margin: 0 0 5px;">3. Engage With Students</h4>
        <p style="color: #666; margin: 0; font-size: 14px;">Reply to questions to build trust and get better reviews.</p>
      </div>
      <div style="text-align: center;">
        <a href="{{dashboardUrl}}" class="btn">Go to Teacher Dashboard</a>
      </div>
    </div>
    <div class="footer">
      <p>© {{currentYear}} EduFiliova. All rights reserved.</p>
      <p><a href="{{unsubscribeLink}}" style="color: #999;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `,
  },

  customer_no_download_7d: {
    subject: "{{displayName}}, you have items waiting to be downloaded!",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background-color: #0C332C; padding: 30px 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .btn { display: inline-block; background: #0C332C; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { background: #1a1a1a; padding: 30px 40px; color: #999; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="EduFiliova" class="logo" />
    </div>
    <div class="content">
      <h1 style="color: #1a1a1a; margin: 0 0 20px;">Don't forget your downloads, {{displayName}}!</h1>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        You have items in your library that you haven't downloaded yet. They're ready and waiting for you!
      </p>
      <div style="text-align: center;">
        <a href="{{libraryUrl}}" class="btn">View My Library</a>
      </div>
    </div>
    <div class="footer">
      <p>© {{currentYear}} EduFiliova. All rights reserved.</p>
      <p><a href="{{unsubscribeLink}}" style="color: #999;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `,
  },

  reengagement_7d: {
    subject: "{{displayName}}, we haven't seen you in a while!",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background-color: #0C332C; padding: 30px 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .btn { display: inline-block; background: #0C332C; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { background: #1a1a1a; padding: 30px 40px; color: #999; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="EduFiliova" class="logo" />
    </div>
    <div class="content">
      <h1 style="color: #1a1a1a; margin: 0 0 20px;">We miss you, {{displayName}}!</h1>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        It's been a week since we last saw you. A lot has happened since then – new courses, new features, and more!
      </p>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        Come back and see what's new. Your learning journey awaits!
      </p>
      <div style="text-align: center;">
        <a href="{{dashboardUrl}}" class="btn">Come Back</a>
      </div>
    </div>
    <div class="footer">
      <p>© {{currentYear}} EduFiliova. All rights reserved.</p>
      <p><a href="{{unsubscribeLink}}" style="color: #999;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `,
  },

  reengagement_14d: {
    subject: "{{displayName}}, your account is waiting for you",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background-color: #0C332C; padding: 30px 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .btn { display: inline-block; background: #0C332C; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .offer-box { background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%); padding: 25px; border-radius: 12px; margin: 20px 0; color: #fff; text-align: center; }
    .footer { background: #1a1a1a; padding: 30px 40px; color: #999; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="EduFiliova" class="logo" />
    </div>
    <div class="content">
      <h1 style="color: #1a1a1a; margin: 0 0 20px;">It's been 2 weeks, {{displayName}}!</h1>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        Your progress is still saved and waiting for you. Don't let your hard work go to waste!
      </p>
      <div class="offer-box">
        <h2 style="margin: 0;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48" fill="none" style="vertical-align: middle; margin-right: 8px;">
            <rect x="6" y="18" width="36" height="26" rx="4" fill="#0C332C"/>
            <rect x="6" y="12" width="36" height="10" rx="2" fill="#E64A2A"/>
            <rect x="21" y="12" width="6" height="32" fill="#FCD34D"/>
            <path d="M24 12C24 12 18 6 14 10C10 14 16 18 24 12Z" fill="#FCD34D"/>
            <path d="M24 12C24 12 30 6 34 10C38 14 32 18 24 12Z" fill="#FCD34D"/>
          </svg>
          Welcome Back
        </h2>
        <p style="margin: 10px 0 0;">We've added new content just for you!</p>
      </div>
      <div style="text-align: center;">
        <a href="{{dashboardUrl}}" class="btn">Return to Dashboard</a>
      </div>
    </div>
    <div class="footer">
      <p>© {{currentYear}} EduFiliova. All rights reserved.</p>
      <p><a href="{{unsubscribeLink}}" style="color: #999;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `,
  },

  reengagement_30d: {
    subject: "{{displayName}}, we'd love to have you back!",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background-color: #0C332C; padding: 30px 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .btn { display: inline-block; background: #0C332C; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { background: #1a1a1a; padding: 30px 40px; color: #999; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="EduFiliova" class="logo" />
    </div>
    <div class="content">
      <h1 style="color: #1a1a1a; margin: 0 0 20px;">We'd love to have you back, {{displayName}}!</h1>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        It's been a month since your last visit. We've made lots of improvements and added new content!
      </p>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        Is there anything we can help you with? Reply to this email and let us know how we can make your experience better.
      </p>
      <div style="text-align: center;">
        <a href="{{dashboardUrl}}" class="btn">Explore What's New</a>
      </div>
    </div>
    <div class="footer">
      <p>© {{currentYear}} EduFiliova. All rights reserved.</p>
      <p><a href="{{unsubscribeLink}}" style="color: #999;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `,
  },

  course_completion: {
    subject: "Congratulations {{displayName}}! You completed a course!",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background-color: #0C332C; padding: 30px 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .btn { display: inline-block; background: #0C332C; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .celebration-box { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 30px; border-radius: 12px; margin: 20px 0; color: #1a1a1a; text-align: center; }
    .footer { background: #1a1a1a; padding: 30px 40px; color: #999; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="EduFiliova" class="logo" />
    </div>
    <div class="content">
      <div class="celebration-box">
        <div style="margin-bottom: 10px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="3" y="3" width="42" height="42" rx="8" fill="#0C332C"/>
            <path d="M24 10L26.5 19.5L36 22L26.5 24.5L24 34L21.5 24.5L12 22L21.5 19.5L24 10Z" fill="white"/>
            <circle cx="36" cy="12" r="3" fill="#FCD34D"/>
            <circle cx="12" cy="36" r="3" fill="#FCD34D"/>
            <circle cx="38" cy="36" r="2" fill="#FCD34D"/>
            <circle cx="10" cy="12" r="2" fill="#FCD34D"/>
          </svg>
        </div>
        <h2 style="margin: 10px 0 0;">Congratulations!</h2>
      </div>
      <h1 style="color: #1a1a1a; margin: 0 0 20px; text-align: center;">You completed "{{courseName}}"!</h1>
      <p style="color: #666; font-size: 16px; line-height: 1.6; text-align: center;">
        Amazing work, {{displayName}}! Your dedication has paid off.
      </p>
      <div style="text-align: center;">
        <a href="{{certificateUrl}}" class="btn">View Your Certificate</a>
      </div>
      <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
        Ready for your next challenge? Check out our recommended courses!
      </p>
    </div>
    <div class="footer">
      <p>© {{currentYear}} EduFiliova. All rights reserved.</p>
      <p><a href="{{unsubscribeLink}}" style="color: #999;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `,
  },

  new_enrollment_teacher: {
    subject: "New student enrolled in your course!",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background-color: #0C332C; padding: 30px 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .btn { display: inline-block; background: #0C332C; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .enrollment-box { background: #f0fdf4; border: 2px solid #22c55e; padding: 20px; border-radius: 12px; margin: 20px 0; }
    .footer { background: #1a1a1a; padding: 30px 40px; color: #999; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="EduFiliova" class="logo" />
    </div>
    <div class="content">
      <h1 style="color: #1a1a1a; margin: 0 0 20px;">Great news, {{displayName}}!</h1>
      <div class="enrollment-box">
        <h3 style="color: #15803d; margin: 0 0 10px;">New Student Enrollment</h3>
        <p style="color: #666; margin: 0;"><strong>{{studentName}}</strong> just enrolled in your course:</p>
        <p style="color: #1a1a1a; font-weight: 600; margin: 10px 0 0;">{{courseName}}</p>
      </div>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        Keep up the great work! Your courses are making a difference.
      </p>
      <div style="text-align: center;">
        <a href="{{dashboardUrl}}" class="btn">View Dashboard</a>
      </div>
    </div>
    <div class="footer">
      <p>© {{currentYear}} EduFiliova. All rights reserved.</p>
      <p><a href="{{unsubscribeLink}}" style="color: #999;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `,
  },

  payout_ready: {
    subject: "Your payout is ready for withdrawal!",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background-color: #0C332C; padding: 30px 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .btn { display: inline-block; background: #0C332C; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .payout-box { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px; margin: 20px 0; color: #fff; text-align: center; }
    .footer { background: #1a1a1a; padding: 30px 40px; color: #999; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="EduFiliova" class="logo" />
    </div>
    <div class="content">
      <h1 style="color: #1a1a1a; margin: 0 0 20px;">Your earnings are ready!</h1>
      <div class="payout-box">
        <h2 style="margin: 0; font-size: 36px;">\${{amount}}</h2>
        <p style="margin: 10px 0 0;">Available for withdrawal</p>
      </div>
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        Great work, {{displayName}}! You've earned this. Request your payout now to receive your funds.
      </p>
      <div style="text-align: center;">
        <a href="{{payoutUrl}}" class="btn">Request Payout</a>
      </div>
    </div>
    <div class="footer">
      <p>© {{currentYear}} EduFiliova. All rights reserved.</p>
      <p><a href="{{unsubscribeLink}}" style="color: #999;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
    `,
  },
};

export type NotificationTemplateKey = keyof typeof NOTIFICATION_EMAIL_TEMPLATES;
