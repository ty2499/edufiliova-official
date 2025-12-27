          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          userData: { 
            // User data
            userId: userIdString,
            email,
            passwordHash: hashedPassword,
            educationLevel: 'other',
            // Profile data
            fullName,
            age: 25,
            grade: 12,
            country: 'Unknown',
            countryId: null,
            role: 'freelancer',
            bio: bio || '',
            experience: experience || '',
            hourlyRate: hourlyRate || null,
            qualifications: specializations ? specializations.join(', ') : null,
            availableHours: 'Flexible',
            // Additional freelancer data
            skills, 
            portfolio, 
            phoneNumber,
            specializations,
            userType: 'freelancer' 
          }
        });

      // Send verification email
      if (contactType === 'email') {
        try {
          const emailTemplate = getEmailTemplate('verification', {
            name: fullName,
            code: verificationCode,
            expiryMinutes: 15
          });

          const transporter = await createEmailTransporter('verify@edufiliova.com');
          await transporter.sendMail({
            from: '"EduFiliova Freelancer Platform" <verify@edufiliova.com>',
            to: email,
            subject: 'Verify Your Freelancer Account - EduFiliova',
            html: emailTemplate
          });
          console.log('✅ Verification email sent successfully to:', email);
        } catch (emailError) {
          console.error('❌ Failed to send verification email:', {
            error: emailError instanceof Error ? emailError.message : 'Unknown error',
            code: (emailError as any)?.code,
            response: (emailError as any)?.response,
            responseCode: (emailError as any)?.responseCode,
            to: email,
            timestamp: new Date().toISOString()
          });
          
          // Clean up verification code since email failed
          await db
            .delete(verificationCodes)
            .where(eq(verificationCodes.contactInfo, email));

          return res.status(500).json({
            success: false,
            error: 'Failed to send verification email. Please try again.'
          });
        }
      }

      res.status(201).json({
        success: true,
        message: "Verification email sent successfully. Please check your email to complete registration.",
        data: {
          email: email,
          message: "Account will be created after email verification"
        }
      });

    } catch (error: any) {
      console.error('Freelancer registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed. Please try again.'
      });
    }
  });

  // Resend verification code endpoint
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: "Email is required"
        });
      }

      // Find verification code for this email
      const existingCode = await db
        .select()
        .from(verificationCodes)
        .where(eq(verificationCodes.contactInfo, email))
        .orderBy(desc(verificationCodes.createdAt))
        .limit(1);

      if (existingCode.length === 0) {
        return res.status(404).json({
          success: false,
          error: "No verification code found for this email"
        });
      }

      const code = existingCode[0].code;

      // Resend verification email
      try {
        const emailTemplate = getEmailTemplate('verification', {
          name: 'User',
          code: code,
          expiryMinutes: 15
        });

        const transporter = await createEmailTransporter('verify@edufiliova.com');
        await transporter.sendMail({
          from: '"EduFiliova Platform" <verify@edufiliova.com>',
          to: email,
          subject: 'Verification Code - EduFiliova',
          html: emailTemplate
        });

        console.log('✅ Verification email resent successfully to:', email);

        res.status(200).json({
          success: true,
          message: "Verification code resent successfully"
        });

      } catch (emailError) {
        console.error('❌ Failed to resend verification email:', {
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
          code: (emailError as any)?.code,
          response: (emailError as any)?.response,
          responseCode: (emailError as any)?.responseCode,
          to: email,
          timestamp: new Date().toISOString()
        });

        res.status(500).json({
          success: false,
          error: 'Failed to resend verification email. Please try again.'
        });
      }

    } catch (error: any) {
      console.error('Resend verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resend verification code. Please try again.'
      });
    }
  });

  // Admin Freelancer Management Routes
  app.get("/api/admin/freelancers", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { status, search } = req.query;
      
      console.log('🔍 Freelancer search request:', { status, search });
      
      // Build conditions array
      const conditions = [eq(profiles.role, 'freelancer')];
      
      if (status) {
        conditions.push(eq(profiles.approvalStatus, status as any));
      }

      if (search && typeof search === 'string') {
        const searchPattern = `%${search}%`;
        console.log('🔍 Search pattern:', searchPattern);
        conditions.push(
          or(
            ilike(profiles.name, searchPattern),
            ilike(profiles.displayName, searchPattern),
            ilike(profiles.email, searchPattern)
          )
        );
      }

      const freelancers = await db
        .select({
          id: profiles.id,
          userId: profiles.userId,
          name: profiles.name,
          displayName: profiles.displayName,
          email: profiles.email,
          avatarUrl: profiles.avatarUrl,
          country: profiles.country,
          experience: profiles.experience,
          hourlyRate: profiles.hourlyRate,
          bio: profiles.bio,
          qualifications: profiles.qualifications,
          approvalStatus: profiles.approvalStatus,
          approvedBy: profiles.approvedBy,
          approvedAt: profiles.approvedAt,
          rejectionReason: profiles.rejectionReason,
          adminNotes: profiles.adminNotes,
          likesCount: profiles.likesCount,
          followersCount: profiles.followersCount,
          role: profiles.role,
          createdAt: profiles.createdAt
        })
        .from(profiles)
        .where(and(...conditions))
        .orderBy(profiles.createdAt);

      console.log('🔍 Found freelancers:', freelancers.length);
      console.log('🔍 Freelancer names:', freelancers.map(f => f.name));

      res.json({ success: true,
        success: true,
        data: freelancers
      });
    } catch (error: any) {
      console.error('❌ Error fetching freelancers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch freelancers'
      });
    }
  });

  app.post("/api/admin/freelancers/:userId/approve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { notes } = req.body;
      const adminUserId = req.user?.id;

      // Check if freelancer profile exists and is pending
      const [freelancerProfile] = await db
        .select()
        .from(profiles)
        .where(and(
          eq(profiles.userId, userId),
          eq(profiles.role, 'freelancer')
        ))
        .limit(1);

      if (!freelancerProfile) {
        return res.status(404).json({
          success: false,
          error: 'Freelancer profile not found'
        });
      }

      if (freelancerProfile.approvalStatus === 'approved') {
        return res.json({ success: true,
          success: true,
          message: 'Freelancer already approved'
        });
      }

      // Update approval status
      await db
        .update(profiles)
        .set({
          approvalStatus: 'approved',
          approvedBy: adminUserId,
          approvedAt: new Date(),
          adminNotes: notes || null,
          rejectionReason: null
        })
        .where(eq(profiles.userId, userId));

      // Send approval email notification
      try {
        const emailTemplate = getEmailTemplate('welcome', {
          name: freelancerProfile.name,
          notes: notes || 'Your freelancer application has been approved!'
        });

        const transporter = await createEmailTransporter('support@edufiliova.com');
        await transporter.sendMail({
          from: '"EduFiliova Support" <support@edufiliova.com>',
          to: freelancerProfile.email || '',
          subject: 'Congratulations! Your Freelancer Application Approved - EduFiliova',
          html: emailTemplate
        });
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
      }

      res.json({ success: true,
        success: true,
        message: 'Freelancer approved successfully'
      });

    } catch (error: any) {
      console.error('Error approving freelancer:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to approve freelancer'
      });
    }
  });

  app.post("/api/admin/freelancers/:userId/reject", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { reason, notes } = req.body;
      const adminUserId = req.user?.id;

      if (!reason || reason.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Rejection reason is required'
        });
      }

      // Check if freelancer profile exists
      const [freelancerProfile] = await db
        .select()
        .from(profiles)
        .where(and(
          eq(profiles.userId, userId),
          eq(profiles.role, 'freelancer')
        ))
        .limit(1);

      if (!freelancerProfile) {
        return res.status(404).json({
          success: false,
          error: 'Freelancer profile not found'
        });
      }

      if (freelancerProfile.approvalStatus === 'rejected') {
        return res.json({ success: true,
          success: true,
          message: 'Freelancer already rejected'
        });
      }

      // Update rejection status
      await db
        .update(profiles)
        .set({
          approvalStatus: 'rejected',
          approvedBy: adminUserId,
          approvedAt: new Date(),
          rejectionReason: reason,
          adminNotes: notes || null
        })
        .where(eq(profiles.userId, userId));

      // Send rejection email notification
      try {
        const emailTemplate = getEmailTemplate('freelancerRejection', {
          name: freelancerProfile.name,
          reason: reason,
          notes: notes
        });

        const transporter = await createEmailTransporter('support@edufiliova.com');
        await transporter.sendMail({
          from: '"EduFiliova Support" <support@edufiliova.com>',
          to: freelancerProfile.email || '',
          subject: 'Update on Your Freelancer Application - EduFiliova',
          html: emailTemplate
        });
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
      }

      res.json({ success: true,
        success: true,
        message: 'Freelancer rejected successfully'
      });

    } catch (error: any) {
      console.error('Error rejecting freelancer:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reject freelancer'
      });
    }
  });

  // Featured Users Management (Admin only)
  app.get("/api/admin/featured-users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const featuredUsers = await storage.getFeaturedUsers(limit);
      
      res.json({ success: true,
        success: true,
        data: featuredUsers
      });
    } catch (error: any) {
      console.error('Error fetching featured users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch featured users'
      });
    }
  });

  app.post("/api/admin/users/:userId/toggle-featured", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId: textUserId } = req.params;
      const adminUserId = req.user?.id;

      if (!adminUserId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Look up the user's UUID by their text userId
      const user = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.userId, textUserId))
        .limit(1);

      if (user.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const userUuid = user[0].id;
      const result = await storage.toggleFeaturedStatus(userUuid, adminUserId);
      
      res.json({ success: true,
        success: true,
        data: result,
        message: result.isFeatured ? 'User marked as featured' : 'User removed from featured'
      });
    } catch (error: any) {
      console.error('Error toggling featured status:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle featured status'
      });
    }
  });

  // Public endpoint to get featured creators
  app.get("/api/featured-creators", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const featuredUsers = await storage.getFeaturedUsers(limit);
      
      res.json({ success: true,
        success: true,
        data: featuredUsers
      });
    } catch (error: any) {
      console.error('Error fetching featured creators:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch featured creators'
      });
    }
  });

  // User Registration with Dual Verification
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, age, grade, educationLevel, country, email, phone, password, whatsappOptIn } = req.body;

      // Validation
      if (!name || !age || !grade || !country || !email || !password) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
      }

      if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, error: "Invalid email format" });
      }

      if (phone && !isValidPhone(phone)) {
        return res.status(400).json({ success: false, error: "Invalid phone number format" });
      }

      // Check for existing verification request (don't check users table before verification)
      const existingVerification = await db
        .select()
        .from(verificationCodes)
        .where(eq(verificationCodes.contactInfo, email))
        .limit(1);

      if (existingVerification.length > 0 && !existingVerification[0].isUsed) {
        return res.status(400).json({ 
          success: false, 
          error: "A verification request is already pending for this email. Please check your email or wait a few minutes." 
        });
      }

      // Clean up any expired verification codes
      await db.delete(verificationCodes).where(eq(verificationCodes.contactInfo, email));

      // Store registration data temporarily and send verification
      const emailCode = generateVerificationCode();
      const smsCode = phone ? generateVerificationCode() : null;

      const registrationData = {
        name,
        age: parseInt(age),
        grade: parseInt(grade),
        educationLevel: educationLevel || 'grade',
        country,
        email,
        phone: phone || null,
        passwordHash: await bcrypt.hash(password, 10),
        emailCode,
        smsCode,
        emailVerified: false,
        smsVerified: !phone // If no phone, consider SMS verified
      };

      // Determine verification method based on whatsappOptIn
      let emailResult = { success: true, error: undefined as string | undefined };
      let whatsappResult = { success: true, messageId: undefined as string | undefined, error: undefined as string | undefined };
      
      if (whatsappOptIn && phone && smsCode) {
        // WhatsApp opted in: Send ONLY WhatsApp OTP (no email)
        if (isWhatsAppConfigured()) {
          whatsappResult = await sendWhatsAppOTP(phone, smsCode);
          if (whatsappResult.success) {
            console.log('✅ WhatsApp OTP sent successfully to:', phone);
          } else {
            console.error('❌ WhatsApp OTP failed:', whatsappResult.error);
            return res.status(500).json({
              success: false,
              error: "Failed to send WhatsApp verification. Please try again or uncheck WhatsApp option.",
              details: whatsappResult.error
            });
          }
        } else {
          console.error('❌ WhatsApp not configured but user opted in');
          return res.status(500).json({
            success: false,
            error: "WhatsApp verification is not available. Please uncheck the WhatsApp option and try again."
          });
        }
      } else {
        // No WhatsApp opt-in: Send email verification only using new HTML template
        try {
          const { sendStudentVerificationEmail } = await import('./utils/email-templates.js');
          await sendStudentVerificationEmail(email, name, emailCode, 15);
          console.log('✅ Student verification email sent successfully to:', email);
        } catch (emailError) {
          console.error('❌ Failed to send student verification email:', emailError);
          return res.status(500).json({
            success: false,
            error: "Failed to send verification email. Please try again."
          });
        }
      }

      // Clean up any existing verification codes for this email/phone
      await db.delete(verificationCodes).where(eq(verificationCodes.contactInfo, email));
      if (phone) {
        await db.delete(verificationCodes).where(eq(verificationCodes.contactInfo, phone));
      }

      if (whatsappOptIn && phone && whatsappResult.success) {
        // WhatsApp flow: Only store phone verification (email will be auto-verified)
        await db.insert(verificationCodes).values({
          contactInfo: phone,
          type: 'phone',
          code: smsCode,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          userData: registrationData
        });

        res.json({ success: true,
          success: true,
          message: "WhatsApp verification code sent",
          requiresEmailVerification: false,
          requiresPhoneVerification: true,
          emailSent: false,
          whatsappSent: true
        });
      } else {
        // Email flow: Only store email verification
        await db.insert(verificationCodes).values({
          contactInfo: email,
          type: 'email',
          code: emailCode,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          userData: registrationData
        });

        res.json({ success: true,
          success: true,
          message: "Email verification code sent",
          requiresEmailVerification: true,
          requiresPhoneVerification: false,
          emailSent: true,
          whatsappSent: false
        });
      }

    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Provide specific error messages for better user experience
      if (error instanceof Error) {
        if (error.message.includes('duplicate key value violates unique constraint')) {
          if (error.message.includes('verification_codes_contact_info_unique')) {
            return res.status(400).json({ 
              success: false, 
              error: "A verification request is already pending for this email. Please check your email or try again in a few minutes." 
            });
          }
          if (error.message.includes('auth_users_email_unique')) {
            return res.status(400).json({ 
              success: false, 
              error: "An account with this email already exists. Please try logging in instead." 
            });
          }
        }
        if (error.message.includes('Connection') || error.message.includes('timeout')) {
          return res.status(503).json({ 
            success: false, 
            error: "Service temporarily unavailable. Please try again in a few minutes." 
          });
        }
      }
      
      res.status(500).json({ success: false, error: "Registration failed. Please try again." });
    }
  });

  // Verify Registration Codes
  app.post("/api/auth/verify-registration", async (req, res) => {
    try {
      const { email, emailCode, smsCode, contactInfo, code, contactType } = req.body;

      let userData: any;
      let verificationRecordId: number;

      // Handle WhatsApp/phone verification (contactType: 'phone')
      if (contactType === 'phone' && contactInfo && code) {
        // Get phone verification record
        const phoneVerification = await db
          .select()
          .from(verificationCodes)
          .where(and(
            eq(verificationCodes.contactInfo, contactInfo),
            eq(verificationCodes.type, 'phone'),
            eq(verificationCodes.isUsed, false)
          ))
          .limit(1);

        if (phoneVerification.length === 0) {
          return res.status(400).json({ success: false, error: "Invalid or expired verification code" });
        }

        const phoneRecord = phoneVerification[0];

        // Check phone code and expiration
        if (phoneRecord.code !== code || new Date() > phoneRecord.expiresAt) {
          return res.status(400).json({ success: false, error: "Invalid or expired verification code" });
        }

        userData = phoneRecord.userData as any;
        verificationRecordId = phoneRecord.id;

        // Mark phone verification as used
        await db
          .update(verificationCodes)
          .set({ isUsed: true })
          .where(eq(verificationCodes.id, phoneRecord.id));

        // Also mark email verification as used (auto-verify email when WhatsApp is verified)
        if (userData.email) {
          await db
            .update(verificationCodes)
            .set({ isUsed: true })
            .where(and(
              eq(verificationCodes.contactInfo, userData.email),
              eq(verificationCodes.type, 'email'),
              eq(verificationCodes.isUsed, false)
            ));
        }
      } 
      // Handle email verification (contactType: 'email' or legacy flow)
      else if ((contactType === 'email' && email && emailCode) || (email && emailCode)) {
        // Get email verification record
        const emailVerification = await db
          .select()
          .from(verificationCodes)
          .where(and(
            eq(verificationCodes.contactInfo, email),
            eq(verificationCodes.type, 'email'),
            eq(verificationCodes.isUsed, false)
          ))
          .limit(1);

        if (emailVerification.length === 0) {
          return res.status(400).json({ success: false, error: "Invalid or expired email verification code" });
        }

        const emailRecord = emailVerification[0];

        // Check email code and expiration
        if (emailRecord.code !== emailCode || new Date() > emailRecord.expiresAt) {
          return res.status(400).json({ success: false, error: "Invalid or expired email verification code" });
        }

        userData = emailRecord.userData as any;
        verificationRecordId = emailRecord.id;

        // Mark email verification as used
        await db
          .update(verificationCodes)
          .set({ isUsed: true })
          .where(eq(verificationCodes.id, emailRecord.id));

        // Check SMS verification if phone was provided and smsCode is given
        if (userData.phone && smsCode) {
          const smsVerification = await db
            .select()
            .from(verificationCodes)
            .where(and(
              eq(verificationCodes.contactInfo, userData.phone),
              eq(verificationCodes.type, 'phone'),
              eq(verificationCodes.isUsed, false)
            ))
            .limit(1);

          if (smsVerification.length === 0 || smsVerification[0].code !== smsCode || new Date() > smsVerification[0].expiresAt) {
            return res.status(400).json({ success: false, error: "Invalid or expired SMS verification code" });
          }

          // Mark SMS verification as used
          await db
            .update(verificationCodes)
            .set({ isUsed: true })
            .where(eq(verificationCodes.id, smsVerification[0].id));
        }
        // Note: If phone was provided but smsCode is missing, we don't block - email verification is sufficient
      } else {
        return res.status(400).json({ success: false, error: "Verification code required" });
      }

      // Check if user already exists (in case verification is retried)
      const existingUser = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);
      if (existingUser.length > 0) {
        return res.status(400).json({ success: false, error: "An account with this email already exists. Please try logging in instead." });
      }

      // Create user account
      const userId = generateUserId();
      
      const newUser = await db.insert(users).values({
        userId,
        email: userData.email,
        passwordHash: userData.passwordHash
      }).returning();

      // Find country ID
      const countryRecord = await db
        .select()
        .from(countries)
        .where(eq(countries.name, userData.country))
        .limit(1);

      // Get detected location from IP
      const detectedLocation = req.userLocation;
      const locationStr = detectedLocation 
        ? `${detectedLocation.city || ''}, ${detectedLocation.country || ''}`.trim() 
        : null;

      // Create profile with location data
      const newProfile = await db.insert(profiles).values({
        userId: newUser[0].id,
        name: userData.name || userData.fullName, // Handle freelancer fullName
        email: userData.email, // Add email to profile
        age: userData.age || 25, // Default age for freelancers
        grade: userData.grade || 12, // Add required grade field with default
        educationLevel: userData.educationLevel || "other", // Default education level
        country: userData.country || (detectedLocation?.country) || "Unknown", // Add country
        countryId: countryRecord.length > 0 ? countryRecord[0].id : null, // Add country ID
        location: locationStr, // Add detected location
      });
      const loginEmail = userData.email;
      const loginPhone = userData.phone || undefined;
      const welcomeHtml = `
        ${getEmailTemplate('blue', {})}
        <div class="content">
          <h2 class="title">Welcome to EduFiliova!</h2>
          <p class="message">Hi ${userData.name},<br><br>Thank you for joining EduFiliova! We're excited to have you as part of our learning community.</p>
          <div class="alert-success" style="text-align: center; padding: 30px;"><div style="margin-bottom: 10px;"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><div style="color: #065f46; font-size: 18px; font-weight: bold; margin-bottom: 8px;">Account Created Successfully</div><div style="color: #047857; font-size: 14px;">You're all set to start your journey with us!</div></div>
          <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;"><div style="color: #1f2937; font-size: 16px; font-weight: 600; margin-bottom: 15px;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Your Login Credentials</div><div style="background-color: #ffffff; border: 1px solid #d1d5db; border-radius: 6px; padding: 15px; margin-bottom: 12px;"><div style="color: #6b7280; font-size: 12px; font-weight: 600; margin-bottom: 5px; text-transform: uppercase;">Email</div><div style="color: #1f2937; font-size: 14px; font-family: 'Monaco', 'Courier New', monospace; word-break: break-all;">${loginEmail}</div></div>${loginPhone ? `<div style="background-color: #ffffff; border: 1px solid #d1d5db; border-radius: 6px; padding: 15px; margin-bottom: 12px;"><div style="color: #6b7280; font-size: 12px; font-weight: 600; margin-bottom: 5px; text-transform: uppercase;">Phone</div><div style="color: #1f2937; font-size: 14px; font-family: 'Monaco', 'Courier New', monospace;">${loginPhone}</div></div>` : ''}<div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 12px; margin-top: 12px;"><div style="color: #92400e; font-size: 13px; line-height: 1.6;"><strong>🔒 Security Reminder:</strong> Please keep your login credentials safe and secure. Never share them with anyone, including EduFiliova staff members. Always use the official login page to sign in.</div></div></div><div style="text-align: center; margin: 30px 0;"><a href="${req.protocol}://${req.get('host')}/login" class="button">Go to Dashboard</a></div><p class="message" style="font-size: 14px;">Need help? Check out our <a href="${req.protocol}://${req.get('host')}/help" style="color: #2d5ddd; text-decoration: none;">Help Center</a> or contact us at support@edufiliova.com</p>
        </div>
      `;
      // Send welcome email using new HTML template
      try {
        const { sendStudentWelcomeEmail } = await import('./utils/email-templates.js');
        await sendStudentWelcomeEmail(userData.email, userData.name);
        console.log('✅ Student welcome email sent successfully to:', userData.email);
      } catch (welcomeEmailError) {
        console.error('❌ Failed to send student welcome email:', welcomeEmailError);
        // Don't fail the registration if welcome email fails
      }

      res.json({ success: true,
        success: true,
        message: "Account created successfully!",
        user: {
          userId: newUser[0].userId,
          email: newUser[0].email
        },
        profile: newProfile[0]
      });

    } catch (error: any) {
      console.error('Verification error:', error);
      res.status(500).json({ success: false, error: "Verification failed" });
    }
  });

  // User Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { loginId, password } = req.body;

      if (!loginId || !password) {
        return res.status(400).json({ success: false, error: "Login ID and password are required" });
      }

      // Find user by email, userId, or phone number (including profiles join)
      let user = await db
        .select()
        .from(users)
        .where(or(
          eq(users.email, loginId),
          eq(users.userId, loginId)
        ))
        .limit(1);

      // If not found by email or userId, search by phone in profiles
      if (user.length === 0) {
        const normalizedPhone = loginId.replace(/\+/g, '');
        const profilesWithPhone = await db
          .select({ userId: profiles.userId })
          .from(profiles)
          .where(or(
            eq(profiles.phoneNumber, loginId),
            eq(profiles.phoneNumber, `+${normalizedPhone}`),
            eq(profiles.phoneNumber, normalizedPhone)
          ))
          .limit(1);

        if (profilesWithPhone.length > 0) {
          user = await db
            .select()
            .from(users)
            .where(eq(users.id, profilesWithPhone[0].userId))
            .limit(1);
        }
      }

      if (user.length === 0) {
        return res.status(401).json({ success: false, error: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user[0].passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ success: false, error: "Invalid credentials" });
      }

      // Get user profile
      const profile = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, user[0].id))
        .limit(1);

      if (profile.length === 0) {
        return res.status(401).json({ success: false, error: "User profile not found" });
      }

      // Check if user is banned or suspended
      if (profile[0].status === 'banned') {
        return res.status(403).json({ 
          success: false, 
          error: 'Account has been banned. Please contact support if you believe this is an error.' 
        });
      }

      if (profile[0].status === 'suspended') {
        return res.status(403).json({ 
          success: false, 
          error: 'Account has been temporarily suspended. Please contact support for more information.' 
        });
      }

      // Create session
      const sessionId = uuidv4();
      await db.insert(userLoginSessions).values({
        userId: user[0].id,
        sessionId,
        userAgent: req.headers['user-agent'] || 'Unknown',
        ipAddress: req.ip || 'Unknown',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      // Fetch application status for teachers and freelancers
      let teacherApplicationStatus = null;
      let freelancerApplicationStatus = null;
      
      console.log('🔍 Fetching application status - role:', profile[0].role, 'userId:', user[0].id);
      
      if (profile[0].role === 'teacher') {
        try {
          const teacherApp = await db.select({
            id: teacherApplications.id,
            status: teacherApplications.status,
            submittedAt: teacherApplications.createdAt
          })
            .from(teacherApplications)
            .where(eq(teacherApplications.userId, user[0].id))
            .limit(1);
          
          console.log('🔍 Teacher application query result:', teacherApp);
          
          if (teacherApp.length > 0) {
            teacherApplicationStatus = {
              id: teacherApp[0].id,
              status: teacherApp[0].status,
              submittedAt: teacherApp[0].submittedAt
            };
          }
        } catch (error: any) {
          console.error('❌ Error fetching teacher application:', error);
        }
      } else if (profile[0].role === 'freelancer') {
        const freelancerApp = await db.select({
          id: freelancerApplications.id,
          status: freelancerApplications.status,
          createdAt: freelancerApplications.createdAt,
          approvedAt: freelancerApplications.approvedAt
        })
          .from(freelancerApplications)
          .where(eq(freelancerApplications.userId, user[0].id))
          .limit(1);
        
        if (freelancerApp.length > 0) {
          freelancerApplicationStatus = {
            id: freelancerApp[0].id,
            status: freelancerApp[0].status,
            createdAt: freelancerApp[0].createdAt,
            approvedAt: freelancerApp[0].approvedAt
          };
        }
      }

      // Set session cookie for cross-subdomain auth
      const requestHost = req.get('host') || '';
      const originHeader = req.get('origin') || '';
      
      // Detect production based on NODE_ENV OR hostname (Replit deployments may run with NODE_ENV=development)
      const isEdufiliovaRequest = requestHost.includes('edufiliova.com') || originHeader.includes('edufiliova.com');
      const isProductionHost = isEdufiliovaRequest || requestHost.includes('.replit.app');
      const isProduction = process.env.NODE_ENV === 'production' || isProductionHost;
      
      // Determine cookie domain based on request host OR origin
      // This handles cross-subdomain requests (e.g., app.edufiliova.com -> edufiliova.com)
      // For Replit subdomains (.replit.app, .repl.co), don't set domain to let browser use current host
      let cookieDomain: string | undefined = undefined;
      
      if (isEdufiliovaRequest) {
        cookieDomain = '.edufiliova.com';
      }
      
      // Use sameSite: 'none' for cross-origin requests to allow cookie sharing between subdomains
      // This is required when app.edufiliova.com makes requests to edufiliova.com API
      const isCrossOrigin = originHeader && !originHeader.includes(requestHost);
      
      console.log('🍪 Cookie settings:', { 
        requestHost, 
        originHeader, 
        isProduction, 
        isEdufiliovaRequest, 
        isCrossOrigin, 
        cookieDomain,
        sameSite: isEdufiliovaRequest && isCrossOrigin ? 'none' : 'lax'
      });
      
      // New device/location detection and security email
      try {
        const currentIp = req.ip || req.connection.remoteAddress || 'Unknown';
        const currentUserAgent = req.headers['user-agent'] || 'Unknown';
        
