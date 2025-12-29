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
      // Delete old verification codes for this email
      await db.delete(verificationCodes).where(eq(verificationCodes.contactInfo, email));
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
      // Delete old verification codes for this email
      await db.delete(verificationCodes).where(eq(verificationCodes.contactInfo, email));
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
