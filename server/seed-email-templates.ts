import { storage } from './storage';

const emailTemplates = [
  {
    name: 'Welcome New User',
    subject: 'Welcome to Edufiliova - Your Learning Journey Begins! 🎓',
    category: 'welcome',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #0C332C; padding: 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .title { color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 20px 0; }
    .message { color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0; }
    .button { display: inline-block; background-color: #0C332C; color: #ffffff !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .features { background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 25px 0; }
    .feature { padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
    .feature:last-child { border-bottom: none; }
    .feature-icon { color: #0C332C; font-size: 18px; margin-right: 10px; }
    .footer { background-color: #0C332C; padding: 30px; text-align: center; color: #ffffff; }
    .footer a { color: #ffffff; text-decoration: none; margin: 0 10px; }
    .social-links { margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png" alt="Edufiliova" class="logo" />
    </div>
    <div class="content">
      <h1 class="title">Welcome to Edufiliova, {{recipientName}}! 🎉</h1>
      <p class="message">
        We're thrilled to have you join our community of learners and creators. You've just taken the first step towards an amazing learning journey!
      </p>
      
      <div class="features">
        <div class="feature"><span class="feature-icon">📚</span> Access to thousands of courses and lessons</div>
        <div class="feature"><span class="feature-icon">🎨</span> Creative tools and resources</div>
        <div class="feature"><span class="feature-icon">👥</span> Connect with expert instructors</div>
        <div class="feature"><span class="feature-icon">📜</span> Earn certificates upon completion</div>
        <div class="feature"><span class="feature-icon">🌍</span> Learn at your own pace, anywhere</div>
      </div>
      
      <p class="message">
        Ready to start exploring? Browse our catalog and find your first course!
      </p>
      
      <center>
        <a href="https://edufiliova.com/courses" class="button">Explore Courses</a>
      </center>
      
      <p class="message" style="margin-top: 30px;">
        If you have any questions, our support team is always here to help at <a href="mailto:support@edufiliova.com" style="color: #0C332C;">support@edufiliova.com</a>
      </p>
    </div>
    <div class="footer">
      <p>© 2024 Edufiliova. All rights reserved.</p>
      <p>Creativity, Learning, and Growth in One Place</p>
      <p style="margin-top: 15px; font-size: 12px;">
        <a href="{{unsubscribeLink}}">Unsubscribe</a> | 
        <a href="https://edufiliova.com/privacy-policy">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    textContent: `Welcome to Edufiliova, {{recipientName}}!

We're thrilled to have you join our community of learners and creators.

Here's what you can do:
- Access thousands of courses and lessons
- Use creative tools and resources
- Connect with expert instructors
- Earn certificates upon completion
- Learn at your own pace, anywhere

Start exploring: https://edufiliova.com/courses

Need help? Contact us at support@edufiliova.com

Unsubscribe: {{unsubscribeLink}}`,
    variables: JSON.stringify(['recipientName', 'recipientEmail', 'unsubscribeLink']),
    isActive: true,
  },
  {
    name: 'Newsletter',
    subject: 'What\'s New at Edufiliova This Month 📰',
    category: 'newsletter',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #0C332C; padding: 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .title { color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 20px 0; }
    .subtitle { color: #0C332C; font-size: 20px; font-weight: 600; margin: 30px 0 15px 0; }
    .message { color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0; }
    .button { display: inline-block; background-color: #0C332C; color: #ffffff !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .card { background-color: #f9fafb; border-radius: 12px; padding: 20px; margin: 15px 0; border-left: 4px solid #0C332C; }
    .card-title { color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 10px 0; }
    .card-text { color: #6b7280; font-size: 14px; margin: 0; }
    .footer { background-color: #0C332C; padding: 30px; text-align: center; color: #ffffff; }
    .footer a { color: #ffffff; text-decoration: none; margin: 0 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png" alt="Edufiliova" class="logo" />
    </div>
    <div class="content">
      <h1 class="title">Hey {{recipientName}}! 👋</h1>
      <p class="message">
        Here's what's happening at Edufiliova this month. We've been working hard to bring you new courses, features, and opportunities to grow!
      </p>
      
      <h2 class="subtitle">🆕 New Courses This Month</h2>
      <div class="card">
        <h3 class="card-title">Featured Course Title</h3>
        <p class="card-text">Brief description of the featured course and what students will learn.</p>
      </div>
      
      <h2 class="subtitle">💡 Tips & Resources</h2>
      <p class="message">
        Check out our latest blog posts and tutorials to enhance your learning experience.
      </p>
      
      <h2 class="subtitle">🎯 What's Coming Next</h2>
      <p class="message">
        Stay tuned for exciting new features and courses launching soon!
      </p>
      
      <center>
        <a href="https://edufiliova.com" class="button">Visit Edufiliova</a>
      </center>
    </div>
    <div class="footer">
      <p>© 2024 Edufiliova. All rights reserved.</p>
      <p>Creativity, Learning, and Growth in One Place</p>
      <p style="margin-top: 15px; font-size: 12px;">
        <a href="{{unsubscribeLink}}">Unsubscribe</a> | 
        <a href="https://edufiliova.com/privacy-policy">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    textContent: `Hey {{recipientName}}!

Here's what's happening at Edufiliova this month.

NEW COURSES THIS MONTH
Check out our latest additions to the course catalog.

TIPS & RESOURCES
We've published new blog posts and tutorials to help you succeed.

WHAT'S COMING NEXT
Stay tuned for exciting new features!

Visit: https://edufiliova.com

Unsubscribe: {{unsubscribeLink}}`,
    variables: JSON.stringify(['recipientName', 'recipientEmail', 'unsubscribeLink']),
    isActive: true,
  },
  {
    name: 'Special Promotion',
    subject: '🔥 Limited Time Offer - Save Up to 50% on Courses!',
    category: 'promotion',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #0C332C; padding: 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .promo-banner { background: linear-gradient(135deg, #0C332C 0%, #e64520 100%); padding: 30px; text-align: center; }
    .promo-text { color: #ffffff; font-size: 42px; font-weight: 800; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
    .promo-subtext { color: #ffffff; font-size: 18px; margin: 10px 0 0 0; opacity: 0.9; }
    .content { padding: 40px; }
    .title { color: #1a1a1a; font-size: 26px; font-weight: 700; margin: 0 0 20px 0; }
    .message { color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0; }
    .button { display: inline-block; background-color: #0C332C; color: #ffffff !important; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; margin: 20px 0; box-shadow: 0 4px 14px rgba(255, 88, 52, 0.4); }
    .countdown { background-color: #fff4ed; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center; }
    .countdown-text { color: #e64520; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    .offer-box { background-color: #f9fafb; border: 2px dashed #0C332C; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
    .code { background-color: #0C332C; color: #ffffff; padding: 10px 20px; border-radius: 6px; font-size: 20px; font-weight: 700; letter-spacing: 2px; display: inline-block; }
    .footer { background-color: #0C332C; padding: 30px; text-align: center; color: #ffffff; }
    .footer a { color: #ffffff; text-decoration: none; margin: 0 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png" alt="Edufiliova" class="logo" />
    </div>
    <div class="promo-banner">
      <p class="promo-text">SAVE 50%</p>
      <p class="promo-subtext">On All Premium Courses</p>
    </div>
    <div class="content">
      <h1 class="title">Don't Miss Out, {{recipientName}}! 🚀</h1>
      <p class="message">
        For a limited time only, we're offering an incredible 50% discount on all our premium courses. This is your chance to upskill, learn something new, or advance your career at half the price!
      </p>
      
      <div class="countdown">
        <p class="countdown-text">⏰ Offer ends soon - Don't wait!</p>
      </div>
      
      <div class="offer-box">
        <p style="margin: 0 0 10px 0; color: #6b7280;">Use promo code:</p>
        <span class="code">LEARN50</span>
      </div>
      
      <center>
        <a href="https://edufiliova.com/courses" class="button">Shop Now & Save</a>
      </center>
      
      <p class="message" style="font-size: 14px; color: #9ca3af; margin-top: 30px;">
        *Offer valid on selected courses. Cannot be combined with other promotions.
      </p>
    </div>
    <div class="footer">
      <p>© 2024 Edufiliova. All rights reserved.</p>
      <p style="margin-top: 15px; font-size: 12px;">
        <a href="{{unsubscribeLink}}">Unsubscribe</a> | 
        <a href="https://edufiliova.com/privacy-policy">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    textContent: `SAVE 50% - Limited Time Offer!

Hey {{recipientName}}!

For a limited time, get 50% off all premium courses at Edufiliova.

Use promo code: LEARN50

Shop now: https://edufiliova.com/courses

*Offer valid on selected courses. Cannot be combined with other promotions.

Unsubscribe: {{unsubscribeLink}}`,
    variables: JSON.stringify(['recipientName', 'recipientEmail', 'unsubscribeLink']),
    isActive: true,
  },
  {
    name: 'Course Completion Congratulations',
    subject: 'Congratulations on Completing Your Course! 🎓',
    category: 'engagement',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #0C332C; padding: 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .celebration { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; }
    .trophy { font-size: 60px; margin-bottom: 15px; }
    .congrats-text { color: #ffffff; font-size: 28px; font-weight: 700; margin: 0; }
    .content { padding: 40px; }
    .title { color: #1a1a1a; font-size: 24px; font-weight: 700; margin: 0 0 20px 0; }
    .message { color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0; }
    .button { display: inline-block; background-color: #0C332C; color: #ffffff !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .stats-box { background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 25px 0; display: flex; justify-content: space-around; text-align: center; }
    .stat { flex: 1; }
    .stat-value { color: #0C332C; font-size: 32px; font-weight: 700; }
    .stat-label { color: #6b7280; font-size: 14px; margin-top: 5px; }
    .next-steps { background-color: #eff6ff; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .next-steps h3 { color: #1e40af; margin: 0 0 15px 0; font-size: 18px; }
    .footer { background-color: #0C332C; padding: 30px; text-align: center; color: #ffffff; }
    .footer a { color: #ffffff; text-decoration: none; margin: 0 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png" alt="Edufiliova" class="logo" />
    </div>
    <div class="celebration">
      <div class="trophy">🏆</div>
      <p class="congrats-text">Congratulations!</p>
    </div>
    <div class="content">
      <h1 class="title">Well done, {{recipientName}}! 🎉</h1>
      <p class="message">
        You've successfully completed your course! This is a fantastic achievement, and we're so proud of your dedication to learning.
      </p>
      
      <table class="stats-box" style="width: 100%; background-color: #f9fafb; border-radius: 12px; padding: 25px;">
        <tr>
          <td style="text-align: center; padding: 15px;">
            <div class="stat-value">100%</div>
            <div class="stat-label">Completed</div>
          </td>
          <td style="text-align: center; padding: 15px;">
            <div class="stat-value">🎓</div>
            <div class="stat-label">Certificate</div>
          </td>
          <td style="text-align: center; padding: 15px;">
            <div class="stat-value">✓</div>
            <div class="stat-label">Achievement</div>
          </td>
        </tr>
      </table>
      
      <div class="next-steps">
        <h3>What's Next?</h3>
        <p style="margin: 0; color: #4b5563;">Continue your learning journey with recommended courses based on your interests!</p>
      </div>
      
      <center>
        <a href="https://edufiliova.com/certificates" class="button">View Your Certificate</a>
      </center>
    </div>
    <div class="footer">
      <p>© 2024 Edufiliova. All rights reserved.</p>
      <p style="margin-top: 15px; font-size: 12px;">
        <a href="{{unsubscribeLink}}">Unsubscribe</a> | 
        <a href="https://edufiliova.com/privacy-policy">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    textContent: `Congratulations, {{recipientName}}! 🏆

You've successfully completed your course! This is a fantastic achievement.

YOUR ACHIEVEMENT:
✓ 100% Course Completed
✓ Certificate Earned
✓ New Skills Unlocked

WHAT'S NEXT?
Continue your learning journey with recommended courses!

View your certificate: https://edufiliova.com/certificates

Unsubscribe: {{unsubscribeLink}}`,
    variables: JSON.stringify(['recipientName', 'recipientEmail', 'unsubscribeLink']),
    isActive: true,
  },
  {
    name: 'Re-engagement Campaign',
    subject: 'We Miss You! Come Back and Continue Learning 💫',
    category: 'reengagement',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #0C332C; padding: 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .emoji-header { font-size: 50px; text-align: center; margin-bottom: 20px; }
    .title { color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 20px 0; text-align: center; }
    .message { color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0; }
    .button { display: inline-block; background-color: #0C332C; color: #ffffff !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .reasons { background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 25px 0; }
    .reason { padding: 15px 0; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; }
    .reason:last-child { border-bottom: none; }
    .reason-icon { font-size: 24px; margin-right: 15px; }
    .reason-text { color: #4b5563; font-size: 15px; }
    .offer { background: linear-gradient(135deg, #0C332C 0%, #e64520 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; color: #ffffff; }
    .footer { background-color: #0C332C; padding: 30px; text-align: center; color: #ffffff; }
    .footer a { color: #ffffff; text-decoration: none; margin: 0 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png" alt="Edufiliova" class="logo" />
    </div>
    <div class="content">
      <div class="emoji-header">👋💫</div>
      <h1 class="title">We Miss You, {{recipientName}}!</h1>
      <p class="message">
        It's been a while since we've seen you on Edufiliova. Your learning journey is waiting for you, and there's so much new content to explore!
      </p>
      
      <div class="reasons">
        <div class="reason">
          <span class="reason-icon">🆕</span>
          <span class="reason-text">New courses added to our catalog</span>
        </div>
        <div class="reason">
          <span class="reason-icon">🎯</span>
          <span class="reason-text">Continue where you left off</span>
        </div>
        <div class="reason">
          <span class="reason-icon">🏆</span>
          <span class="reason-text">Earn certificates and achievements</span>
        </div>
        <div class="reason">
          <span class="reason-icon">👥</span>
          <span class="reason-text">Join our growing community</span>
        </div>
      </div>
      
      <div class="offer">
        <p style="margin: 0; font-size: 18px; font-weight: 600;">Special Welcome Back Offer!</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Get 20% off your next purchase</p>
      </div>
      
      <center>
        <a href="https://edufiliova.com" class="button">Come Back & Learn</a>
      </center>
    </div>
    <div class="footer">
      <p>© 2024 Edufiliova. All rights reserved.</p>
      <p style="margin-top: 15px; font-size: 12px;">
        <a href="{{unsubscribeLink}}">Unsubscribe</a> | 
        <a href="https://edufiliova.com/privacy-policy">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    textContent: `We Miss You, {{recipientName}}! 👋

It's been a while since we've seen you. Your learning journey is waiting!

WHAT'S NEW:
🆕 New courses added
🎯 Continue where you left off
🏆 Earn certificates
👥 Join our community

SPECIAL OFFER: Get 20% off your next purchase!

Come back: https://edufiliova.com

Unsubscribe: {{unsubscribeLink}}`,
    variables: JSON.stringify(['recipientName', 'recipientEmail', 'unsubscribeLink']),
    isActive: true,
  },
  {
    name: 'New Course Announcement',
    subject: '🎉 New Course Alert: Check Out What\'s New!',
    category: 'announcement',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #0C332C; padding: 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .badge { background-color: #10b981; color: #ffffff; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; display: inline-block; margin-bottom: 20px; }
    .content { padding: 40px; }
    .title { color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 20px 0; }
    .message { color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0; }
    .button { display: inline-block; background-color: #0C332C; color: #ffffff !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .course-card { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin: 25px 0; }
    .course-image { width: 100%; height: 200px; background-color: #f3f4f6; background-size: cover; background-position: center; }
    .course-details { padding: 20px; }
    .course-title { color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 10px 0; }
    .course-desc { color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0; }
    .course-meta { display: flex; gap: 15px; color: #9ca3af; font-size: 13px; }
    .footer { background-color: #0C332C; padding: 30px; text-align: center; color: #ffffff; }
    .footer a { color: #ffffff; text-decoration: none; margin: 0 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png" alt="Edufiliova" class="logo" />
    </div>
    <div class="content">
      <center><span class="badge">✨ Just Launched</span></center>
      <h1 class="title">New Course Alert, {{recipientName}}!</h1>
      <p class="message">
        We're excited to announce a brand new course has just been added to our catalog. This is something we think you'll love based on your interests!
      </p>
      
      <div class="course-card">
        <div class="course-image" style="background-image: url('https://via.placeholder.com/600x200');"></div>
        <div class="course-details">
          <h2 class="course-title">[Course Name]</h2>
          <p class="course-desc">[Brief course description that highlights key learning outcomes and benefits]</p>
          <div class="course-meta">
            <span>📚 [X] Lessons</span>
            <span>⏱️ [X] Hours</span>
            <span>🎯 [Skill Level]</span>
          </div>
        </div>
      </div>
      
      <center>
        <a href="https://edufiliova.com/courses" class="button">Explore This Course</a>
      </center>
      
      <p class="message" style="margin-top: 30px; font-size: 14px;">
        Early birds get the best deals! Enroll now and start your learning journey today.
      </p>
    </div>
    <div class="footer">
      <p>© 2024 Edufiliova. All rights reserved.</p>
      <p style="margin-top: 15px; font-size: 12px;">
        <a href="{{unsubscribeLink}}">Unsubscribe</a> | 
        <a href="https://edufiliova.com/privacy-policy">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    textContent: `NEW COURSE ALERT! 🎉

Hey {{recipientName}},

We're excited to announce a brand new course!

[Course Name]
[Brief course description]

📚 [X] Lessons | ⏱️ [X] Hours | 🎯 [Skill Level]

Explore now: https://edufiliova.com/courses

Early birds get the best deals!

Unsubscribe: {{unsubscribeLink}}`,
    variables: JSON.stringify(['recipientName', 'recipientEmail', 'unsubscribeLink']),
    isActive: true,
  },
  {
    name: 'Order Confirmation',
    subject: 'Your Order is Confirmed! 🛒 Order #{{orderNumber}}',
    category: 'transactional',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #0C332C; padding: 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .success-banner { background-color: #10b981; padding: 20px; text-align: center; }
    .success-icon { font-size: 40px; margin-bottom: 10px; }
    .success-text { color: #ffffff; font-size: 20px; font-weight: 600; margin: 0; }
    .content { padding: 40px; }
    .title { color: #1a1a1a; font-size: 24px; font-weight: 700; margin: 0 0 20px 0; }
    .message { color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0; }
    .order-box { background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 25px 0; }
    .order-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
    .order-row:last-child { border-bottom: none; font-weight: 600; }
    .order-label { color: #6b7280; }
    .order-value { color: #1a1a1a; font-weight: 500; }
    .button { display: inline-block; background-color: #0C332C; color: #ffffff !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background-color: #0C332C; padding: 30px; text-align: center; color: #ffffff; }
    .footer a { color: #ffffff; text-decoration: none; margin: 0 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png" alt="Edufiliova" class="logo" />
    </div>
    <div class="success-banner">
      <div class="success-icon">✓</div>
      <p class="success-text">Order Confirmed!</p>
    </div>
    <div class="content">
      <h1 class="title">Thank you for your order, {{recipientName}}!</h1>
      <p class="message">
        We've received your order and it's being processed. You'll receive access to your purchased items shortly.
      </p>
      
      <div class="order-box">
        <table style="width: 100%;">
          <tr class="order-row">
            <td class="order-label">Order Number</td>
            <td class="order-value" style="text-align: right;">#{{orderNumber}}</td>
          </tr>
          <tr class="order-row">
            <td class="order-label">Order Date</td>
            <td class="order-value" style="text-align: right;">{{orderDate}}</td>
          </tr>
          <tr class="order-row">
            <td class="order-label">Items</td>
            <td class="order-value" style="text-align: right;">{{itemCount}} item(s)</td>
          </tr>
          <tr class="order-row">
            <td class="order-label" style="font-weight: 600;">Total Amount</td>
            <td class="order-value" style="text-align: right; color: #0C332C; font-weight: 700;">{{totalAmount}}</td>
          </tr>
        </table>
      </div>
      
      <center>
        <a href="https://edufiliova.com/orders" class="button">View Order Details</a>
      </center>
      
      <p class="message" style="margin-top: 30px; font-size: 14px; color: #9ca3af;">
        If you have any questions about your order, please contact our support team at support@edufiliova.com
      </p>
    </div>
    <div class="footer">
      <p>© 2024 Edufiliova. All rights reserved.</p>
      <p style="margin-top: 15px; font-size: 12px;">
        <a href="{{unsubscribeLink}}">Unsubscribe</a> | 
        <a href="https://edufiliova.com/privacy-policy">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    textContent: `ORDER CONFIRMED ✓

Thank you for your order, {{recipientName}}!

ORDER DETAILS:
Order Number: #{{orderNumber}}
Order Date: {{orderDate}}
Items: {{itemCount}} item(s)
Total Amount: {{totalAmount}}

View order: https://edufiliova.com/orders

Questions? Contact support@edufiliova.com

Unsubscribe: {{unsubscribeLink}}`,
    variables: JSON.stringify(['recipientName', 'recipientEmail', 'orderNumber', 'orderDate', 'itemCount', 'totalAmount', 'unsubscribeLink']),
    isActive: true,
  },
  {
    name: 'Payment Receipt',
    subject: 'Payment Receipt - Transaction #{{transactionId}} 💳',
    category: 'transactional',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #0C332C; padding: 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .receipt-header { text-align: center; margin-bottom: 30px; }
    .receipt-icon { font-size: 48px; margin-bottom: 15px; }
    .title { color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0; }
    .subtitle { color: #6b7280; font-size: 14px; margin: 0; }
    .receipt-box { border: 2px solid #e5e7eb; border-radius: 12px; padding: 30px; margin: 25px 0; }
    .amount-box { background-color: #f9fafb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .amount { color: #10b981; font-size: 36px; font-weight: 700; margin: 0; }
    .amount-label { color: #6b7280; font-size: 14px; margin-top: 5px; }
    .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; font-size: 14px; }
    .detail-value { color: #1a1a1a; font-size: 14px; font-weight: 500; }
    .button { display: inline-block; background-color: #0C332C; color: #ffffff !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background-color: #0C332C; padding: 30px; text-align: center; color: #ffffff; }
    .footer a { color: #ffffff; text-decoration: none; margin: 0 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png" alt="Edufiliova" class="logo" />
    </div>
    <div class="content">
      <div class="receipt-header">
        <div class="receipt-icon">🧾</div>
        <h1 class="title">Payment Receipt</h1>
        <p class="subtitle">Transaction #{{transactionId}}</p>
      </div>
      
      <div class="receipt-box">
        <div class="amount-box">
          <p class="amount">{{amount}}</p>
          <p class="amount-label">Payment Successful</p>
        </div>
        
        <table style="width: 100%;">
          <tr class="detail-row">
            <td class="detail-label">Transaction ID</td>
            <td class="detail-value" style="text-align: right;">{{transactionId}}</td>
          </tr>
          <tr class="detail-row">
            <td class="detail-label">Date & Time</td>
            <td class="detail-value" style="text-align: right;">{{transactionDate}}</td>
          </tr>
          <tr class="detail-row">
            <td class="detail-label">Payment Method</td>
            <td class="detail-value" style="text-align: right;">{{paymentMethod}}</td>
          </tr>
          <tr class="detail-row">
            <td class="detail-label">Description</td>
            <td class="detail-value" style="text-align: right;">{{description}}</td>
          </tr>
        </table>
      </div>
      
      <center>
        <a href="https://edufiliova.com/billing" class="button">View Billing History</a>
      </center>
      
      <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px;">
        This is an automated receipt. Please keep it for your records.
      </p>
    </div>
    <div class="footer">
      <p>© 2024 Edufiliova. All rights reserved.</p>
      <p style="margin-top: 15px; font-size: 12px;">
        <a href="{{unsubscribeLink}}">Unsubscribe</a> | 
        <a href="https://edufiliova.com/privacy-policy">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    textContent: `PAYMENT RECEIPT 🧾

Transaction #{{transactionId}}

AMOUNT PAID: {{amount}}
Status: Payment Successful

TRANSACTION DETAILS:
- Transaction ID: {{transactionId}}
- Date & Time: {{transactionDate}}
- Payment Method: {{paymentMethod}}
- Description: {{description}}

View billing history: https://edufiliova.com/billing

This is an automated receipt. Please keep it for your records.

Unsubscribe: {{unsubscribeLink}}`,
    variables: JSON.stringify(['recipientName', 'recipientEmail', 'transactionId', 'transactionDate', 'amount', 'paymentMethod', 'description', 'unsubscribeLink']),
    isActive: true,
  },
  {
    name: 'Teacher Welcome',
    subject: 'Welcome to Our Teaching Community! 👨‍🏫',
    category: 'onboarding',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #0C332C; padding: 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .welcome-banner { background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); padding: 40px; text-align: center; }
    .welcome-icon { font-size: 50px; margin-bottom: 15px; }
    .welcome-text { color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; }
    .content { padding: 40px; }
    .title { color: #1a1a1a; font-size: 24px; font-weight: 700; margin: 0 0 20px 0; }
    .message { color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0; }
    .steps { background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 25px 0; }
    .step { padding: 15px 0; border-bottom: 1px solid #e5e7eb; display: flex; align-items: flex-start; }
    .step:last-child { border-bottom: none; }
    .step-number { background-color: #0C332C; color: #ffffff; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; margin-right: 15px; flex-shrink: 0; }
    .step-content { flex: 1; }
    .step-title { color: #1a1a1a; font-weight: 600; margin: 0 0 5px 0; }
    .step-desc { color: #6b7280; font-size: 14px; margin: 0; }
    .button { display: inline-block; background-color: #0C332C; color: #ffffff !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background-color: #0C332C; padding: 30px; text-align: center; color: #ffffff; }
    .footer a { color: #ffffff; text-decoration: none; margin: 0 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png" alt="Edufiliova" class="logo" />
    </div>
    <div class="welcome-banner">
      <div class="welcome-icon">👨‍🏫</div>
      <p class="welcome-text">Welcome, Teacher!</p>
    </div>
    <div class="content">
      <h1 class="title">Hello {{recipientName}}! 🎓</h1>
      <p class="message">
        Welcome to the Edufiliova teaching community! We're excited to have you join our platform where you can share your knowledge and impact students' lives.
      </p>
      
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <p class="step-title">Complete Your Profile</p>
            <p class="step-desc">Add your qualifications, experience, and a professional photo to build trust with students.</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <p class="step-title">Set Your Availability</p>
            <p class="step-desc">Configure your teaching schedule and availability for live sessions.</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <p class="step-title">Create Your First Course</p>
            <p class="step-desc">Use our easy course builder to create engaging content for your students.</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">4</div>
          <div class="step-content">
            <p class="step-title">Start Teaching!</p>
            <p class="step-desc">Connect with students and begin your teaching journey on Edufiliova.</p>
          </div>
        </div>
      </div>
      
      <center>
        <a href="https://edufiliova.com/teacher-dashboard" class="button">Go to Teacher Dashboard</a>
      </center>
    </div>
    <div class="footer">
      <p>© 2024 Edufiliova. All rights reserved.</p>
      <p style="margin-top: 15px; font-size: 12px;">
        <a href="{{unsubscribeLink}}">Unsubscribe</a> | 
        <a href="https://edufiliova.com/privacy-policy">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    textContent: `WELCOME, TEACHER! 👨‍🏫

Hello {{recipientName}}!

Welcome to the Edufiliova teaching community! We're excited to have you.

GET STARTED IN 4 STEPS:

1. COMPLETE YOUR PROFILE
   Add qualifications, experience, and a professional photo.

2. SET YOUR AVAILABILITY
   Configure your teaching schedule for live sessions.

3. CREATE YOUR FIRST COURSE
   Use our easy course builder to create engaging content.

4. START TEACHING!
   Connect with students and begin your journey.

Go to dashboard: https://edufiliova.com/teacher-dashboard

Unsubscribe: {{unsubscribeLink}}`,
    variables: JSON.stringify(['recipientName', 'recipientEmail', 'unsubscribeLink']),
    isActive: true,
  },
  {
    name: 'Freelancer Welcome',
    subject: 'Welcome to the Freelancer Network! 💼',
    category: 'onboarding',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #0C332C; padding: 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .welcome-banner { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px; text-align: center; }
    .welcome-icon { font-size: 50px; margin-bottom: 15px; }
    .welcome-text { color: #ffffff; font-size: 24px; font-weight: 700; margin: 0; }
    .content { padding: 40px; }
    .title { color: #1a1a1a; font-size: 24px; font-weight: 700; margin: 0 0 20px 0; }
    .message { color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0; }
    .benefits { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
    .benefit { background-color: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; }
    .benefit-icon { font-size: 32px; margin-bottom: 10px; }
    .benefit-title { color: #1a1a1a; font-weight: 600; font-size: 14px; margin: 0; }
    .button { display: inline-block; background-color: #0C332C; color: #ffffff !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .tip-box { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 0 12px 12px 0; }
    .tip-title { color: #1e40af; font-weight: 600; margin: 0 0 10px 0; }
    .tip-text { color: #4b5563; font-size: 14px; margin: 0; }
    .footer { background-color: #0C332C; padding: 30px; text-align: center; color: #ffffff; }
    .footer a { color: #ffffff; text-decoration: none; margin: 0 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png" alt="Edufiliova" class="logo" />
    </div>
    <div class="welcome-banner">
      <div class="welcome-icon">💼</div>
      <p class="welcome-text">Welcome, Freelancer!</p>
    </div>
    <div class="content">
      <h1 class="title">Hello {{recipientName}}! 🚀</h1>
      <p class="message">
        Congratulations on joining Edufiliova's freelancer network! You're now part of a community of skilled professionals ready to take on exciting projects.
      </p>
      
      <table style="width: 100%;">
        <tr>
          <td style="padding: 10px; text-align: center; background-color: #f9fafb; border-radius: 12px; margin: 5px;">
            <div style="font-size: 32px; margin-bottom: 10px;">🎯</div>
            <div style="color: #1a1a1a; font-weight: 600; font-size: 14px;">Find Projects</div>
          </td>
          <td style="width: 10px;"></td>
          <td style="padding: 10px; text-align: center; background-color: #f9fafb; border-radius: 12px; margin: 5px;">
            <div style="font-size: 32px; margin-bottom: 10px;">💰</div>
            <div style="color: #1a1a1a; font-weight: 600; font-size: 14px;">Secure Payments</div>
          </td>
        </tr>
        <tr><td colspan="3" style="height: 10px;"></td></tr>
        <tr>
          <td style="padding: 10px; text-align: center; background-color: #f9fafb; border-radius: 12px; margin: 5px;">
            <div style="font-size: 32px; margin-bottom: 10px;">⭐</div>
            <div style="color: #1a1a1a; font-weight: 600; font-size: 14px;">Build Reviews</div>
          </td>
          <td style="width: 10px;"></td>
          <td style="padding: 10px; text-align: center; background-color: #f9fafb; border-radius: 12px; margin: 5px;">
            <div style="font-size: 32px; margin-bottom: 10px;">📈</div>
            <div style="color: #1a1a1a; font-weight: 600; font-size: 14px;">Grow Career</div>
          </td>
        </tr>
      </table>
      
      <div class="tip-box">
        <p class="tip-title">💡 Pro Tip</p>
        <p class="tip-text">Complete your profile with a portfolio and detailed skills to attract more clients. Freelancers with complete profiles get 3x more project invitations!</p>
      </div>
      
      <center>
        <a href="https://edufiliova.com/freelancer-dashboard" class="button">Go to Freelancer Dashboard</a>
      </center>
    </div>
    <div class="footer">
      <p>© 2024 Edufiliova. All rights reserved.</p>
      <p style="margin-top: 15px; font-size: 12px;">
        <a href="{{unsubscribeLink}}">Unsubscribe</a> | 
        <a href="https://edufiliova.com/privacy-policy">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    textContent: `WELCOME, FREELANCER! 💼

Hello {{recipientName}}!

Congratulations on joining Edufiliova's freelancer network!

WHAT YOU CAN DO:
🎯 Find Projects - Browse and apply for exciting opportunities
💰 Secure Payments - Get paid safely through our platform
⭐ Build Reviews - Showcase your work and build reputation
📈 Grow Career - Access tools and resources for growth

💡 PRO TIP: Complete your profile with a portfolio to attract more clients!

Go to dashboard: https://edufiliova.com/freelancer-dashboard

Unsubscribe: {{unsubscribeLink}}`,
    variables: JSON.stringify(['recipientName', 'recipientEmail', 'unsubscribeLink']),
    isActive: true,
  },
  {
    name: 'Grade Update for Students',
    subject: '📊 New Grades Available - Check Your Progress!',
    category: 'notification',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #0C332C; padding: 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .title { color: #1a1a1a; font-size: 26px; font-weight: 700; margin: 0 0 20px 0; }
    .message { color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0; }
    .grade-card { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 16px; padding: 30px; margin: 25px 0; color: #ffffff; text-align: center; }
    .grade-label { font-size: 14px; opacity: 0.9; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; }
    .grade-value { font-size: 48px; font-weight: 800; margin: 0; }
    .subject { font-size: 18px; margin-top: 15px; font-weight: 600; }
    .stats { display: flex; justify-content: space-around; margin: 25px 0; }
    .stat { text-align: center; }
    .stat-value { color: #1a1a1a; font-size: 24px; font-weight: 700; }
    .stat-label { color: #6b7280; font-size: 12px; margin-top: 5px; }
    .button { display: inline-block; background-color: #0C332C; color: #ffffff !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .motivation { background-color: #fef3c7; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center; }
    .motivation-icon { font-size: 32px; margin-bottom: 10px; }
    .motivation-text { color: #92400e; font-size: 16px; font-weight: 500; margin: 0; }
    .footer { background-color: #0C332C; padding: 30px; text-align: center; color: #ffffff; }
    .footer a { color: #ffffff; text-decoration: none; margin: 0 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png" alt="Edufiliova" class="logo" />
    </div>
    <div class="content">
      <h1 class="title">Hello {{recipientName}}! 📊</h1>
      <p class="message">
        Great news! Your teacher has updated your grades. Here's a summary of your recent performance.
      </p>
      
      <div class="grade-card">
        <p class="grade-label">Your Latest Grade</p>
        <p class="grade-value">A+</p>
        <p class="subject">Mathematics - Grade {{gradeLevel}}</p>
      </div>
      
      <table style="width: 100%;">
        <tr>
          <td style="text-align: center; padding: 15px;">
            <div style="color: #1a1a1a; font-size: 24px; font-weight: 700;">85%</div>
            <div style="color: #6b7280; font-size: 12px; margin-top: 5px;">Average Score</div>
          </td>
          <td style="text-align: center; padding: 15px;">
            <div style="color: #1a1a1a; font-size: 24px; font-weight: 700;">12</div>
            <div style="color: #6b7280; font-size: 12px; margin-top: 5px;">Completed</div>
          </td>
          <td style="text-align: center; padding: 15px;">
            <div style="color: #1a1a1a; font-size: 24px; font-weight: 700;">#5</div>
            <div style="color: #6b7280; font-size: 12px; margin-top: 5px;">Class Rank</div>
          </td>
        </tr>
      </table>
      
      <div class="motivation">
        <div class="motivation-icon">🌟</div>
        <p class="motivation-text">Keep up the excellent work! You're making great progress!</p>
      </div>
      
      <center>
        <a href="https://edufiliova.com/grades" class="button">View All Grades</a>
      </center>
    </div>
    <div class="footer">
      <p>© 2024 Edufiliova. All rights reserved.</p>
      <p style="margin-top: 15px; font-size: 12px;">
        <a href="{{unsubscribeLink}}">Unsubscribe</a> | 
        <a href="https://edufiliova.com/privacy-policy">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    textContent: `GRADE UPDATE 📊

Hello {{recipientName}}!

Great news! Your teacher has updated your grades.

YOUR PERFORMANCE:
Subject: Mathematics - Grade {{gradeLevel}}
Latest Grade: A+
Average Score: 85%
Assignments Completed: 12
Class Rank: #5

🌟 Keep up the excellent work!

View all grades: https://edufiliova.com/grades

Unsubscribe: {{unsubscribeLink}}`,
    variables: JSON.stringify(['recipientName', 'recipientEmail', 'gradeLevel', 'unsubscribeLink']),
    isActive: true,
  },
  {
    name: 'Feedback Request',
    subject: 'We Value Your Feedback! 💬 Share Your Experience',
    category: 'engagement',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #0C332C; padding: 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .content { padding: 40px; }
    .emoji-header { font-size: 60px; text-align: center; margin-bottom: 20px; }
    .title { color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 20px 0; text-align: center; }
    .message { color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0; text-align: center; }
    .rating-box { background-color: #f9fafb; border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center; }
    .rating-label { color: #6b7280; font-size: 14px; margin: 0 0 15px 0; }
    .stars { font-size: 36px; letter-spacing: 8px; }
    .button { display: inline-block; background-color: #0C332C; color: #ffffff !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .button-secondary { display: inline-block; background-color: #e5e7eb; color: #4b5563 !important; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px; }
    .promise { background-color: #eff6ff; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center; }
    .promise-icon { font-size: 24px; margin-bottom: 10px; }
    .promise-text { color: #1e40af; font-size: 14px; margin: 0; }
    .footer { background-color: #0C332C; padding: 30px; text-align: center; color: #ffffff; }
    .footer a { color: #ffffff; text-decoration: none; margin: 0 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png" alt="Edufiliova" class="logo" />
    </div>
    <div class="content">
      <div class="emoji-header">💬</div>
      <h1 class="title">How Are We Doing?</h1>
      <p class="message">
        Hi {{recipientName}}, your opinion matters to us! We'd love to hear about your experience with Edufiliova.
      </p>
      
      <div class="rating-box">
        <p class="rating-label">Rate your experience</p>
        <div class="stars">⭐⭐⭐⭐⭐</div>
      </div>
      
      <center>
        <a href="https://edufiliova.com/feedback" class="button">Share Your Feedback</a>
      </center>
      
      <div class="promise">
        <div class="promise-icon">🔒</div>
        <p class="promise-text">Your feedback is confidential and helps us improve our platform for everyone.</p>
      </div>
      
      <p class="message" style="font-size: 14px; color: #9ca3af;">
        This survey takes less than 2 minutes to complete. Thank you for your time!
      </p>
    </div>
    <div class="footer">
      <p>© 2024 Edufiliova. All rights reserved.</p>
      <p style="margin-top: 15px; font-size: 12px;">
        <a href="{{unsubscribeLink}}">Unsubscribe</a> | 
        <a href="https://edufiliova.com/privacy-policy">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    textContent: `WE VALUE YOUR FEEDBACK! 💬

Hi {{recipientName}},

Your opinion matters to us! We'd love to hear about your experience with Edufiliova.

Share your feedback: https://edufiliova.com/feedback

🔒 Your feedback is confidential and helps us improve.

This survey takes less than 2 minutes. Thank you!

Unsubscribe: {{unsubscribeLink}}`,
    variables: JSON.stringify(['recipientName', 'recipientEmail', 'unsubscribeLink']),
    isActive: true,
  },
  {
    name: 'Seasonal Sale',
    subject: '🎄 Holiday Special - Up to 70% Off All Courses!',
    category: 'promotion',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #0C332C; padding: 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .hero { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 50px; text-align: center; }
    .snowflakes { font-size: 24px; margin-bottom: 15px; }
    .sale-text { color: #ffffff; font-size: 48px; font-weight: 800; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
    .sale-subtext { color: #ffffff; font-size: 20px; margin: 15px 0 0 0; opacity: 0.9; }
    .content { padding: 40px; }
    .title { color: #1a1a1a; font-size: 26px; font-weight: 700; margin: 0 0 20px 0; text-align: center; }
    .message { color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0; text-align: center; }
    .deals { margin: 25px 0; }
    .deal { background-color: #f9fafb; border-radius: 12px; padding: 20px; margin: 15px 0; display: flex; align-items: center; }
    .deal-badge { background-color: #dc2626; color: #ffffff; padding: 8px 16px; border-radius: 6px; font-weight: 700; font-size: 18px; margin-right: 20px; }
    .deal-text { flex: 1; }
    .deal-title { color: #1a1a1a; font-weight: 600; margin: 0 0 5px 0; }
    .deal-desc { color: #6b7280; font-size: 14px; margin: 0; }
    .button { display: inline-block; background-color: #dc2626; color: #ffffff !important; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; margin: 20px 0; }
    .timer { background-color: #fef2f2; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center; }
    .timer-text { color: #991b1b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0; }
    .footer { background-color: #0C332C; padding: 30px; text-align: center; color: #ffffff; }
    .footer a { color: #ffffff; text-decoration: none; margin: 0 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png" alt="Edufiliova" class="logo" />
    </div>
    <div class="hero">
      <div class="snowflakes">❄️ 🎄 ❄️</div>
      <p class="sale-text">UP TO 70% OFF</p>
      <p class="sale-subtext">Holiday Learning Sale</p>
    </div>
    <div class="content">
      <h1 class="title">Happy Holidays, {{recipientName}}! 🎁</h1>
      <p class="message">
        'Tis the season to learn something new! Take advantage of our biggest sale of the year and invest in your education.
      </p>
      
      <div class="deals">
        <div class="deal">
          <span class="deal-badge">70%</span>
          <div class="deal-text">
            <p class="deal-title">Premium Course Bundles</p>
            <p class="deal-desc">Get multiple courses at an unbeatable price</p>
          </div>
        </div>
        <div class="deal">
          <span class="deal-badge">50%</span>
          <div class="deal-text">
            <p class="deal-title">Individual Courses</p>
            <p class="deal-desc">Learn any skill you've been wanting to master</p>
          </div>
        </div>
        <div class="deal">
          <span class="deal-badge">30%</span>
          <div class="deal-text">
            <p class="deal-title">Annual Memberships</p>
            <p class="deal-desc">Unlimited access to all courses for one year</p>
          </div>
        </div>
      </div>
      
      <div class="timer">
        <p class="timer-text">⏰ Sale ends December 31st - Don't miss out!</p>
      </div>
      
      <center>
        <a href="https://edufiliova.com/sale" class="button">🎄 Shop the Sale</a>
      </center>
    </div>
    <div class="footer">
      <p>© 2024 Edufiliova. All rights reserved.</p>
      <p style="margin-top: 15px; font-size: 12px;">
        <a href="{{unsubscribeLink}}">Unsubscribe</a> | 
        <a href="https://edufiliova.com/privacy-policy">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    textContent: `🎄 HOLIDAY SALE - UP TO 70% OFF!

Happy Holidays, {{recipientName}}!

Our biggest sale of the year is here!

DEALS:
• 70% OFF - Premium Course Bundles
• 50% OFF - Individual Courses
• 30% OFF - Annual Memberships

⏰ Sale ends December 31st!

Shop now: https://edufiliova.com/sale

Unsubscribe: {{unsubscribeLink}}`,
    variables: JSON.stringify(['recipientName', 'recipientEmail', 'unsubscribeLink']),
    isActive: true,
  },
  {
    name: 'Subscription Expiring',
    subject: '⚠️ Your Subscription Expires Soon - Renew Now!',
    category: 'notification',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #0C332C; padding: 40px; text-align: center; }
    .logo { max-width: 180px; height: auto; }
    .alert-banner { background-color: #fef3c7; padding: 20px; text-align: center; border-bottom: 3px solid #f59e0b; }
    .alert-icon { font-size: 32px; margin-bottom: 10px; }
    .alert-text { color: #92400e; font-size: 16px; font-weight: 600; margin: 0; }
    .content { padding: 40px; }
    .title { color: #1a1a1a; font-size: 26px; font-weight: 700; margin: 0 0 20px 0; }
    .message { color: #4a5568; font-size: 16px; line-height: 1.7; margin: 0 0 20px 0; }
    .expiry-box { background-color: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
    .expiry-label { color: #991b1b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0; }
    .expiry-date { color: #dc2626; font-size: 28px; font-weight: 700; margin: 0; }
    .benefits { background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 25px 0; }
    .benefit { padding: 10px 0; display: flex; align-items: center; }
    .benefit-icon { color: #10b981; font-size: 18px; margin-right: 12px; }
    .benefit-text { color: #4b5563; font-size: 15px; }
    .button { display: inline-block; background-color: #0C332C; color: #ffffff !important; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 18px; margin: 20px 0; }
    .footer { background-color: #0C332C; padding: 30px; text-align: center; color: #ffffff; }
    .footer a { color: #ffffff; text-decoration: none; margin: 0 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://res.cloudinary.com/dl2lomrhp/image/upload/v1763935567/edufiliova/edufiliova-white-logo.png" alt="Edufiliova" class="logo" />
    </div>
    <div class="alert-banner">
      <div class="alert-icon">⚠️</div>
      <p class="alert-text">Your subscription is expiring soon!</p>
    </div>
    <div class="content">
      <h1 class="title">Don't Lose Access, {{recipientName}}!</h1>
      <p class="message">
        Your Edufiliova subscription is about to expire. Renew now to continue enjoying all the benefits of your premium membership.
      </p>
      
      <div class="expiry-box">
        <p class="expiry-label">Subscription Expires</p>
        <p class="expiry-date">{{expiryDate}}</p>
      </div>
      
      <div class="benefits">
        <p style="color: #1a1a1a; font-weight: 600; margin: 0 0 15px 0;">Keep these benefits:</p>
        <div class="benefit">
          <span class="benefit-icon">✓</span>
          <span class="benefit-text">Unlimited access to all courses</span>
        </div>
        <div class="benefit">
          <span class="benefit-icon">✓</span>
          <span class="benefit-text">Download lessons for offline learning</span>
        </div>
        <div class="benefit">
          <span class="benefit-icon">✓</span>
          <span class="benefit-text">Certificates upon completion</span>
        </div>
        <div class="benefit">
          <span class="benefit-icon">✓</span>
          <span class="benefit-text">Priority support</span>
        </div>
      </div>
      
      <center>
        <a href="https://edufiliova.com/subscription/renew" class="button">Renew Now</a>
      </center>
      
      <p class="message" style="font-size: 14px; color: #9ca3af; text-align: center;">
        Questions? Contact us at support@edufiliova.com
      </p>
    </div>
    <div class="footer">
      <p>© 2024 Edufiliova. All rights reserved.</p>
      <p style="margin-top: 15px; font-size: 12px;">
        <a href="{{unsubscribeLink}}">Unsubscribe</a> | 
        <a href="https://edufiliova.com/privacy-policy">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    textContent: `⚠️ SUBSCRIPTION EXPIRING SOON

Don't Lose Access, {{recipientName}}!

Your subscription expires on: {{expiryDate}}

KEEP THESE BENEFITS:
✓ Unlimited access to all courses
✓ Download lessons for offline learning
✓ Certificates upon completion
✓ Priority support

Renew now: https://edufiliova.com/subscription/renew

Questions? Contact support@edufiliova.com

Unsubscribe: {{unsubscribeLink}}`,
    variables: JSON.stringify(['recipientName', 'recipientEmail', 'expiryDate', 'unsubscribeLink']),
    isActive: true,
  },
];

export async function seedEmailTemplates() {
  console.log('📧 Seeding email marketing templates...');
  
  let seededCount = 0;
  let skippedCount = 0;
  
  for (const template of emailTemplates) {
    try {
      const existing = await storage.getEmailMarketingTemplates({ category: template.category });
      const alreadyExists = existing.some(t => t.name === template.name);
      
      if (alreadyExists) {
        console.log(`  ⏭️  Template "${template.name}" already exists, skipping...`);
        skippedCount++;
        continue;
      }
      
      await storage.createEmailMarketingTemplate({
        name: template.name,
        subject: template.subject,
        category: template.category,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
        variables: template.variables as any,
        isActive: template.isActive,
      });
      
      console.log(`  ✅ Created template: ${template.name}`);
      seededCount++;
    } catch (error) {
      console.error(`  ❌ Error seeding template "${template.name}":`, error instanceof Error ? error.message : error);
    }
  }
  
  console.log(`📧 Email template seeding complete: ${seededCount} created, ${skippedCount} skipped`);
}
