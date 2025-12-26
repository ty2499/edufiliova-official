import type { Express, Request, Response } from "express";
import { db } from "./db";
import { 
  meetings, 
  meetingParticipants, 
  meetingChatMessages, 
  meetingNotifications,
  profiles,
  users
} from "@shared/schema";
import { eq, and, or, gte, lte, inArray, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { insertMeetingSchema } from "@shared/schema";
import crypto from "crypto";
import { requireAuth, type AuthenticatedRequest } from "./middleware/auth.js";

// Agora configuration
const AGORA_APP_ID = process.env.AGORA_APP_ID || "";
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || "";

// Helper: Generate unique Agora channel name
function generateChannelName(): string {
  return `meeting_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

// Helper: Generate Agora RTC token (using dynamic import for CommonJS compatibility)
async function generateAgoraToken(channelName: string, uidAccount: string, role: 'publisher' | 'subscriber'): Promise<string> {
  if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
    throw new Error('Agora credentials not configured');
  }

  // Expect pre-sanitized UID from caller
  if (!uidAccount || uidAccount.length === 0 || uidAccount.length > 255) {
    throw new Error('Invalid UID: must be 1-255 characters');
  }

  // Dynamic import for CommonJS package
  const agoraModule = await import('agora-access-token');
  const { RtcTokenBuilder, RtcRole } = agoraModule.default || agoraModule;

  const expirationTimeInSeconds = 3600; // 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

  return RtcTokenBuilder.buildTokenWithAccount(
    AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channelName,
    uidAccount,
    agoraRole,
    privilegeExpiredTs
  );
}

// Helper: Check if user is authorized to access a meeting
async function isUserAuthorizedForMeeting(meetingId: string, userId: string): Promise<boolean> {
  const [meeting] = await db.select().from(meetings).where(eq(meetings.id, meetingId));

  if (!meeting) return false;

  // Teacher who created it can access
  if (meeting.teacherId === userId) return true;

  // Check if student's grade matches target grades
  const [userProfile] = await db.select().from(profiles).where(eq(profiles.userId, userId));

  if (!userProfile) return false;

  const userGrade = userProfile.gradeLevel || userProfile.grade?.toString();
  if (userGrade && meeting.targetGrades.includes(userGrade)) {
    return true;
  }

  return false;
}

export function registerMeetingRoutes(app: Express) {
  
  // Get student counts by grade (Teachers only)
  app.get("/api/stats/grade-counts", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      // Check if user is a teacher
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, userId)
      });

      if (!profile || profile.role !== 'teacher') {
        return res.status(403).json({ error: "Only teachers can access grade statistics" });
      }

      // Get student counts per grade level
      const gradeCounts = await db
        .select({
          gradeLevel: profiles.gradeLevel,
          count: sql<number>`count(*)::int`,
        })
        .from(profiles)
        .where(
          and(
            eq(profiles.role, 'student'),
            eq(profiles.status, 'active')
          )
        )
        .groupBy(profiles.gradeLevel);

      // Transform to object format for easier lookup
      const counts: Record<string, number> = {};
      gradeCounts.forEach((item: { gradeLevel: string | null; count: number }) => {
        if (item.gradeLevel) {
          counts[item.gradeLevel] = item.count;
        }
      });

      res.json({ gradeCounts: counts });

    } catch (error) {
      console.error('Error fetching grade counts:', error);
      res.status(500).json({ error: "Failed to fetch grade counts" });
    }
  });
  
  // Create a new meeting (Teachers only)
  app.post("/api/meetings", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      // Check if user is a teacher
      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, userId)
      });

      if (!profile || profile.role !== 'teacher') {
        return res.status(403).json({ error: "Only teachers can create meetings" });
      }

      // Transform scheduledTime from string to Date if necessary
      const requestBody = {
        ...req.body,
        scheduledTime: typeof req.body.scheduledTime === 'string' 
          ? new Date(req.body.scheduledTime) 
          : req.body.scheduledTime
      };

      // Validate request body
      const validationResult = insertMeetingSchema.safeParse(requestBody);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Invalid meeting data", details: validationResult.error });
      }

      const { title, lessonDescription, scheduledTime, duration, targetGrades, mode, maxParticipants } = validationResult.data;

      // Calculate end time
      const scheduledTimeDate = new Date(scheduledTime);
      const endTime = new Date(scheduledTimeDate.getTime() + (duration || 45) * 60000);

      // Generate unique Agora channel
      const agoraChannel = generateChannelName();

      // Determine max participants: use provided value for interactive, or 10000 for broadcast
      const finalMaxParticipants = mode === 'broadcast' ? 10000 : (maxParticipants || 50);

      // Create meeting
      const [newMeeting] = await db.insert(meetings).values({
        teacherId: userId,
        title,
        lessonDescription,
        scheduledTime: scheduledTimeDate,
        duration: duration || 45,
        endTime,
        targetGrades,
        mode: mode || 'interactive',
        maxParticipants: finalMaxParticipants,
        agoraChannel,
        agoraAppId: AGORA_APP_ID,
        status: 'scheduled',
      }).returning();

      // Schedule notifications for eligible students
      const eligibleStudents = await db.query.profiles.findMany({
        where: and(
          eq(profiles.role, 'student'),
          sql`${profiles.gradeLevel}::text = ANY(ARRAY[${sql.raw(targetGrades.map(g => `'${g}'`).join(','))}]::text[])`
        )
      });

      // Create notification records (email 15 min before, SMS 5 min before)
      const notificationPromises = eligibleStudents.flatMap(student => {
        const email15MinBefore = new Date(scheduledTimeDate.getTime() - 15 * 60000);
        const sms5MinBefore = new Date(scheduledTimeDate.getTime() - 5 * 60000);

        return [
          db.insert(meetingNotifications).values({
            meetingId: newMeeting.id,
            userId: student.userId,
            notificationType: 'email_15min',
            scheduledFor: email15MinBefore,
            status: 'pending',
          }),
          db.insert(meetingNotifications).values({
            meetingId: newMeeting.id,
            userId: student.userId,
            notificationType: 'sms_5min',
            scheduledFor: sms5MinBefore,
            status: 'pending',
          })
        ];
      });

      await Promise.all(notificationPromises);

      res.json({ 
        success: true, 
        meeting: newMeeting,
        eligibleStudentsCount: eligibleStudents.length 
      });

    } catch (error) {
      console.error('Error creating meeting:', error);
      res.status(500).json({ error: "Failed to create meeting" });
    }
  });

  // Get meetings for current user (teacher or student)
  app.get("/api/meetings", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, userId)
      });

      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      let userMeetings: (typeof meetings.$inferSelect)[] = [];

      if (profile.role === 'teacher') {
        // Teachers see meetings they created
        userMeetings = await db.query.meetings.findMany({
          where: eq(meetings.teacherId, userId),
          orderBy: [desc(meetings.scheduledTime)],
        });
      } else if (profile.role === 'student') {
        // Students see meetings for their grade
        const userGrade = profile.gradeLevel || profile.grade?.toString();
        
        if (userGrade) {
          userMeetings = await db.query.meetings.findMany({
            where: and(
              sql`${sql.raw(`'${userGrade}'::text`)} = ANY(${meetings.targetGrades})`,
              or(
                eq(meetings.status, 'scheduled'),
                eq(meetings.status, 'live')
              )
            ),
            orderBy: [desc(meetings.scheduledTime)],
          });
        }
      }

      res.json({ meetings: userMeetings });

    } catch (error) {
      console.error('Error fetching meetings:', error);
      res.status(500).json({ error: "Failed to fetch meetings" });
    }
  });

  // Get single meeting details
  app.get("/api/meetings/:id", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      const meetingId = req.params.id;

      // Check authorization
      const authorized = await isUserAuthorizedForMeeting(meetingId, userId);
      if (!authorized) {
        return res.status(403).json({ error: "Not authorized to view this meeting" });
      }

      // Explicitly select only columns from meetings table to avoid confusion with meetingParticipants.duration
      const [meeting] = await db
        .select({
          id: meetings.id,
          teacherId: meetings.teacherId,
          title: meetings.title,
          lessonDescription: meetings.lessonDescription,
          scheduledTime: meetings.scheduledTime,
          duration: meetings.duration,
          endTime: meetings.endTime,
          targetGrades: meetings.targetGrades,
          mode: meetings.mode,
          maxParticipants: meetings.maxParticipants,
          agoraChannel: meetings.agoraChannel,
          agoraAppId: meetings.agoraAppId,
          status: meetings.status,
          actualStartTime: meetings.actualStartTime,
          actualEndTime: meetings.actualEndTime,
          participantCount: meetings.participantCount,
          notificationsSent: meetings.notificationsSent,
          createdAt: meetings.createdAt,
          updatedAt: meetings.updatedAt,
        })
        .from(meetings)
        .where(eq(meetings.id, meetingId));

      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }

      // Get participant count
      const participantsList = await db.select().from(meetingParticipants).where(eq(meetingParticipants.meetingId, meetingId));

      res.json({ 
        meeting: {
          ...meeting,
          participantCount: participantsList.length
        }
      });

    } catch (error) {
      console.error('Error fetching meeting:', error);
      res.status(500).json({ error: "Failed to fetch meeting" });
    }
  });

  // Join a meeting (get Agora token)
  app.post("/api/meetings/:id/join", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      const meetingId = req.params.id;

      // Check authorization
      const authorized = await isUserAuthorizedForMeeting(meetingId, userId);
      if (!authorized) {
        return res.status(403).json({ error: "Not authorized to join this meeting" });
      }

      const [meeting] = await db.select().from(meetings).where(eq(meetings.id, meetingId));

      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }

      const isTeacher = meeting.teacherId === userId;
      const now = new Date();

      if (meeting.status === 'completed' || meeting.status === 'cancelled') {
        return res.status(400).json({ error: "This meeting has ended" });
      }

      const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));

      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      // Check participant limit
      const currentParticipants = await db.query.meetingParticipants.findMany({
        where: and(
          eq(meetingParticipants.meetingId, meetingId),
          eq(meetingParticipants.leftAt, null as any)
        )
      });

      const role = isTeacher ? 'teacher' : 'student';
      
      let hasVideo = true;
      let hasAudio = true;
      let isViewOnly = false;

      // In interactive mode, limit active video participants
      if (meeting.mode === 'interactive' && meeting.maxParticipants && currentParticipants.length >= meeting.maxParticipants && !isTeacher) {
        isViewOnly = true;
        hasVideo = false;
        hasAudio = false;
      }

      // Generate Agora token with string UID (userId)
      // Validate UID: must be ASCII-only, trimmed, and within length limits
      const trimmedUid = userId.trim();
      const hasNonAscii = /[^\x20-\x7E]/.test(trimmedUid);
      
      if (hasNonAscii) {
        return res.status(400).json({ error: 'User ID contains invalid characters. Only ASCII characters are allowed.' });
      }
      
      if (!trimmedUid || trimmedUid.length === 0 || trimmedUid.length > 255) {
        return res.status(400).json({ error: 'User ID must be between 1-255 characters' });
      }
      
      const tokenRole = isViewOnly ? 'subscriber' : 'publisher';
      const agoraToken = await generateAgoraToken(meeting.agoraChannel, trimmedUid, tokenRole);

      // Record participant joining
      const existingParticipant = await db.query.meetingParticipants.findFirst({
        where: and(
          eq(meetingParticipants.meetingId, meetingId),
          eq(meetingParticipants.userId, userId)
        )
      });

      if (!existingParticipant) {
        await db.insert(meetingParticipants).values({
          meetingId,
          userId,
          role,
          hasVideo,
          hasAudio,
          isViewOnly,
        });
      }

      // Update meeting status to live if teacher is joining
      if (isTeacher && meeting.status === 'scheduled') {
        await db.update(meetings)
          .set({ status: 'live', actualStartTime: now })
          .where(eq(meetings.id, meetingId));
      }

      res.json({
        success: true,
        agoraToken,
        agoraAppId: AGORA_APP_ID,
        channelName: meeting.agoraChannel,
        uid: trimmedUid, // Return trimmed UID to match the token
        role,
        isViewOnly,
        meeting: {
          ...meeting,
          status: isTeacher && meeting.status === 'scheduled' ? 'live' : meeting.status
        }
      });

    } catch (error) {
      console.error('Error joining meeting:', error);
      res.status(500).json({ error: "Failed to join meeting" });
    }
  });

  // Leave a meeting
  app.post("/api/meetings/:id/leave", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      const meetingId = req.params.id;

      // Find participant record
      const participant = await db.query.meetingParticipants.findFirst({
        where: and(
          eq(meetingParticipants.meetingId, meetingId),
          eq(meetingParticipants.userId, userId)
        )
      });

      if (participant) {
        const now = new Date();
        const sessionDuration = Math.floor((now.getTime() - new Date(participant.joinedAt).getTime()) / 1000);

        await db.update(meetingParticipants)
          .set({ leftAt: now, sessionDuration })
          .where(eq(meetingParticipants.id, participant.id));
      }

      res.json({ success: true });

    } catch (error) {
      console.error('Error leaving meeting:', error);
      res.status(500).json({ error: "Failed to leave meeting" });
    }
  });

  // Cancel a meeting (Teacher only)
  app.post("/api/meetings/:id/cancel", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      const meetingId = req.params.id;

      const [meeting] = await db.select().from(meetings).where(eq(meetings.id, meetingId));

      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }

      if (meeting.teacherId !== userId) {
        return res.status(403).json({ error: "Only the meeting creator can cancel it" });
      }

      await db.update(meetings)
        .set({ status: 'cancelled' })
        .where(eq(meetings.id, meetingId));

      res.json({ success: true });

    } catch (error) {
      console.error('Error cancelling meeting:', error);
      res.status(500).json({ error: "Failed to cancel meeting" });
    }
  });

  // Get meeting chat messages
  app.get("/api/meetings/:id/chat", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('📨 Fetching chat messages for meeting:', req.params.id);

      const userId = req.user?.id;
      if (!userId) {
        console.log('❌ Chat: User ID not found');
        return res.status(401).json({ error: "User ID not found" });
      }

      const meetingId = req.params.id;

      // Check authorization
      console.log('🔐 Checking authorization for user:', userId);
      const authorized = await isUserAuthorizedForMeeting(meetingId, userId);
      if (!authorized) {
        console.log('❌ Chat: User not authorized');
        return res.status(403).json({ error: "Not authorized" });
      }

      console.log('✅ User authorized, fetching messages');
      const chatMessages = await db.query.meetingChatMessages.findMany({
        where: eq(meetingChatMessages.meetingId, meetingId),
        orderBy: [desc(meetingChatMessages.createdAt)],
        limit: 100,
      });

      console.log(`✅ Found ${chatMessages.length} chat messages`);
      res.json({ messages: chatMessages.reverse() });

    } catch (error) {
      console.error('❌ Error fetching chat messages:', error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send chat message
  app.post("/api/meetings/:id/chat", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      const meetingId = req.params.id;
      const { message } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }

      // Check authorization
      const authorized = await isUserAuthorizedForMeeting(meetingId, userId);
      if (!authorized) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const profile = await db.query.profiles.findFirst({
        where: eq(profiles.userId, userId)
      });

      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const [newMessage] = await db.insert(meetingChatMessages).values({
        meetingId,
        senderId: userId,
        senderName: profile.name,
        senderRole: profile.role || 'student',
        message,
        messageType: 'text',
      }).returning();

      res.json({ success: true, message: newMessage });

    } catch (error) {
      console.error('Error sending chat message:', error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // End meeting (Teacher only)
  app.post("/api/meetings/:id/end", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      const meetingId = req.params.id;

      const [meeting] = await db.select().from(meetings).where(eq(meetings.id, meetingId));

      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }

      if (meeting.teacherId !== userId) {
        return res.status(403).json({ error: "Only the meeting creator can end it" });
      }

      await db.update(meetings)
        .set({ status: 'completed', actualEndTime: new Date() })
        .where(eq(meetings.id, meetingId));

      res.json({ success: true });

    } catch (error) {
      console.error('Error ending meeting:', error);
      res.status(500).json({ error: "Failed to end meeting" });
    }
  });

  // Get participants with their names and roles
  app.get("/api/meetings/:id/participants", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "User ID not found" });
      }

      const meetingId = req.params.id;

      // Check authorization
      const authorized = await isUserAuthorizedForMeeting(meetingId, userId);
      if (!authorized) {
        return res.status(403).json({ error: "Not authorized" });
      }

      // Get meeting to find teacher
      const [meeting] = await db.select().from(meetings).where(eq(meetings.id, meetingId));
      
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }

      // Get teacher profile
      const [teacherProfile] = await db.select().from(profiles).where(eq(profiles.userId, meeting.teacherId));

      // Get active participants (those who haven't left yet)
      const activeParticipants = await db.query.meetingParticipants.findMany({
        where: and(
          eq(meetingParticipants.meetingId, meetingId),
          eq(meetingParticipants.leftAt, null as any)
        )
      });

      // Fetch profiles for all active participants
      const participantUserIds = activeParticipants.map(p => p.userId);
      const participantProfiles = participantUserIds.length > 0 
        ? await db.select().from(profiles).where(inArray(profiles.userId, participantUserIds))
        : [];

      // Create a map of userId to profile
      const profileMap = new Map(participantProfiles.map(p => [p.userId, p]));

      // Build participant list with names
      const participants = activeParticipants.map(participant => {
        const profile = profileMap.get(participant.userId);
        return {
          uid: participant.userId,
          name: profile?.displayName || profile?.name || 'Unknown',
          role: participant.role,
          isTeacher: participant.role === 'teacher',
          hasVideo: participant.hasVideo,
          hasAudio: participant.hasAudio,
          isViewOnly: participant.isViewOnly
        };
      });

      // Always include teacher in the list
      const teacherInList = participants.some(p => p.uid === meeting.teacherId);
      if (!teacherInList && teacherProfile) {
        participants.unshift({
          uid: meeting.teacherId,
          name: teacherProfile.displayName || teacherProfile.name || 'Teacher',
          role: 'teacher',
          isTeacher: true,
          hasVideo: true,
          hasAudio: true,
          isViewOnly: false
        });
      }

      res.json({ 
        participants,
        teacher: {
          uid: meeting.teacherId,
          name: teacherProfile?.displayName || teacherProfile?.name || 'Teacher'
        }
      });

    } catch (error) {
      console.error('Error fetching participants:', error);
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });
}
