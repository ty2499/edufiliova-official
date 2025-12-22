import express from 'express';
import { db } from './db.js';
import { communityPosts, communityReplies, communityReactions, friendships } from '../shared/schema.js';
import { profiles, users, userLoginSessions } from '../shared/schema.js';
import { eq, desc, asc, and, or, count, gt, inArray, sql } from 'drizzle-orm';
import { pushNotifications } from './services/push-notifications.js';

const router = express.Router();

// Helper function to get user from session
async function getUserFromSession(authHeader: string) {
  try {
    if (!authHeader) return null;
    
    const sessionId = authHeader.replace('Bearer ', '');
    if (!sessionId) return null;

    // Verify session
    const session = await db.select()
      .from(userLoginSessions)
      .where(and(
        eq(userLoginSessions.sessionId, sessionId),
        eq(userLoginSessions.isActive, true),
        gt(userLoginSessions.expiresAt, new Date())
      ))
      .limit(1);

    if (session.length === 0) return null;

    // Get user and profile data
    const userProfile = await db.select({
      id: users.id,
      userId: users.userId,
      email: users.email,
      name: profiles.name,
      role: profiles.role,
      avatarUrl: profiles.avatarUrl,
      educationLevel: profiles.educationLevel,
      subscriptionTier: profiles.subscriptionTier,
      legacyPlan: profiles.legacyPlan,
      planExpiry: profiles.planExpiry
    })
    .from(users)
    .innerJoin(profiles, eq(users.id, profiles.userId))
    .where(eq(users.id, session[0].userId))
    .limit(1);

    if (userProfile.length === 0) return null;

    return {
      id: userProfile[0].id,
      userId: userProfile[0].userId,
      email: userProfile[0].email,
      role: userProfile[0].role || 'user',
      profile: userProfile[0]
    };
  } catch (error) {
    console.error('Error getting user from session:', error);
    return null;
  }
}

// ==================== POSTS ENDPOINTS ====================

// GET /api/community/communityPosts - Get all communityPosts with author info, communityReplies, and communityReactions
router.get('/posts', async (req, res) => {
  try {
    const user = await getUserFromSession(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get all communityPosts with author information
    // Note: communityPosts.authorId (varchar) stores UUIDs, profiles.userId (uuid) - need to cast
    const communityPostsWithData = await db
      .select({
        id: communityPosts.id,
        title: communityPosts.title,
        content: communityPosts.content,
        subject: communityPosts.subject,
        createdAt: communityPosts.createdAt,
        authorId: communityPosts.authorId,
        // Author info - cast varchar authorId to uuid for join
        authorName: profiles.name,
        authorProfilePic: profiles.avatarUrl,
      })
      .from(communityPosts)
      .leftJoin(profiles, sql`${communityPosts.authorId}::uuid = ${profiles.userId}`)
      .orderBy(desc(communityPosts.createdAt))
      .limit(20);

    // Get reply counts for each post
    const postIds = communityPostsWithData.map(p => p.id);
    let replyCounts = [];
    let likeCounts = [];
    let userLikes = [];

    // Only run these queries if there are posts
    if (postIds.length > 0) {
      replyCounts = await db
        .select({
          postId: communityReplies.postId,
          count: count()
        })
        .from(communityReplies)
        .where(inArray(communityReplies.postId, postIds))
        .groupBy(communityReplies.postId);

      // Get like counts and user's like status
      likeCounts = await db
        .select({
          targetId: communityReactions.targetId,
          count: count(),
        })
        .from(communityReactions)
        .where(and(
          eq(communityReactions.targetType, 'post'),
          inArray(communityReactions.targetId, postIds)
        ))
        .groupBy(communityReactions.targetId);

      userLikes = await db
        .select({ targetId: communityReactions.targetId })
        .from(communityReactions)
        .where(and(
          eq(communityReactions.userId, user.id),
          eq(communityReactions.targetType, 'post'),
          inArray(communityReactions.targetId, postIds)
        ));
    }

    // Combine data
    const enrichedPosts = communityPostsWithData.map(post => {
      const replyCount = replyCounts.find(r => r.postId === post.id)?.count || 0;
      const likeCount = likeCounts.find(l => l.targetId === post.id)?.count || 0;
      const likedByCurrentUser = userLikes.some(ul => ul.targetId === post.id);

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        subject: post.subject,
        createdAt: post.createdAt,
        communityReactions: likeCount,
        replyCount,
        likedByCurrentUser,
        author: {
          id: post.authorId,
          name: post.authorName || 'Anonymous',
          profilePic: post.authorProfilePic
        }
      };
    });

    res.json({ success: true, data: enrichedPosts });

  } catch (error) {
    console.error('Get communityPosts error:', error);
    res.status(500).json({ error: 'Failed to fetch communityPosts' });
  }
});

// POST /api/community/communityPosts - Create new post
router.post('/posts', async (req, res) => {
  try {
    const user = await getUserFromSession(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { title, content, subject } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const [newPost] = await db.insert(communityPosts).values({
      authorId: user.id,
      title: title.trim(),
      content: content.trim(),
      subject: subject?.trim() || null,
    }).returning();

    // Get author info for response
    const authorInfo = await db
      .select({
        name: profiles.name,
        profilePic: profiles.avatarUrl,
      })
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    res.status(201).json({
      success: true,
      data: {
        ...newPost,
        communityReactions: 0,
        replyCount: 0,
        likedByCurrentUser: false,
        author: {
          id: user.id,
          name: authorInfo[0]?.name || 'Anonymous',
          profilePic: authorInfo[0]?.profilePic || null
        }
      }
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// PUT /api/community/posts/:id - Edit post (only author)
router.put('/posts/:id', async (req, res) => {
  try {
    const user = await getUserFromSession(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { title, content, subject } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Check if post exists and user owns it
    const post = await db
      .select({ authorId: communityPosts.authorId })
      .from(communityPosts)
      .where(eq(communityPosts.id, req.params.id))
      .limit(1);

    if (post.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post[0].authorId !== user.id) {
      return res.status(403).json({ error: 'You can only edit your own posts' });
    }

    const [updatedPost] = await db
      .update(communityPosts)
      .set({
        title: title.trim(),
        content: content.trim(),
        subject: subject?.trim() || null,
        updatedAt: new Date()
      })
      .where(eq(communityPosts.id, req.params.id))
      .returning();

    res.json({ success: true, data: updatedPost });

  } catch (error) {
    console.error('Edit post error:', error);
    res.status(500).json({ error: 'Failed to edit post' });
  }
});

// DELETE /api/community/posts/:id - Delete post (only author, cascades communityReplies + communityReactions)
router.delete('/posts/:id', async (req, res) => {
  try {
    const user = await getUserFromSession(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if post exists and user owns it
    const post = await db
      .select({ authorId: communityPosts.authorId })
      .from(communityPosts)
      .where(eq(communityPosts.id, req.params.id))
      .limit(1);

    if (post.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post[0].authorId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }

    // Delete post (communityReplies and communityReactions cascade automatically)
    await db.delete(communityPosts).where(eq(communityPosts.id, req.params.id));

    res.status(204).send();

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// ==================== LIKES ENDPOINT ====================

// POST /api/community/posts/:id/like - Toggle like
router.post('/posts/:id/like', async (req, res) => {
  try {
    const user = await getUserFromSession(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if post exists
    const postExists = await db
      .select({ id: communityPosts.id })
      .from(communityPosts)
      .where(eq(communityPosts.id, req.params.id))
      .limit(1);

    if (postExists.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user already liked this post
    const existingLike = await db
      .select()
      .from(communityReactions)
      .where(and(
        eq(communityReactions.targetId, req.params.id),
        eq(communityReactions.targetType, 'post'),
        eq(communityReactions.userId, user.id)
      ))
      .limit(1);

    let liked: boolean;
    if (existingLike.length > 0) {
      // Unlike
      await db.delete(communityReactions).where(and(
        eq(communityReactions.targetId, req.params.id),
        eq(communityReactions.targetType, 'post'),
        eq(communityReactions.userId, user.id)
      ));
      liked = false;
    } else {
      // Like
      await db.insert(communityReactions).values({
        targetId: req.params.id,
        targetType: 'post',
        userId: user.userId,
        emoji: '👍'
      });
      liked = true;
    }

    // Get updated like count
    const likeCount = await db
      .select({ count: count() })
      .from(communityReactions)
      .where(and(
        eq(communityReactions.targetId, req.params.id),
        eq(communityReactions.targetType, 'post')
      ));

    res.json({
      success: true,
      data: {
        liked,
        likeCount: likeCount[0]?.count || 0
      }
    });

  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// POST /api/community/replies/:id/like - Toggle like for reply
router.post('/replies/:id/like', async (req, res) => {
  try {
    const user = await getUserFromSession(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if reply exists
    const replyExists = await db
      .select({ id: communityReplies.id })
      .from(communityReplies)
      .where(eq(communityReplies.id, req.params.id))
      .limit(1);

    if (replyExists.length === 0) {
      return res.status(404).json({ error: 'Reply not found' });
    }

    // Check if user already liked this reply
    const existingLike = await db
      .select()
      .from(communityReactions)
      .where(and(
        eq(communityReactions.targetId, req.params.id),
        eq(communityReactions.targetType, 'reply'),
        eq(communityReactions.userId, user.id)
      ))
      .limit(1);

    let liked: boolean;
    if (existingLike.length > 0) {
      // Unlike
      await db.delete(communityReactions).where(and(
        eq(communityReactions.targetId, req.params.id),
        eq(communityReactions.targetType, 'reply'),
        eq(communityReactions.userId, user.id)
      ));
      liked = false;
    } else {
      // Like
      await db.insert(communityReactions).values({
        targetId: req.params.id,
        targetType: 'reply',
        userId: user.userId,
        emoji: '👍'
      });
      liked = true;
    }

    // Get updated like count
    const likeCount = await db
      .select({ count: count() })
      .from(communityReactions)
      .where(and(
        eq(communityReactions.targetId, req.params.id),
        eq(communityReactions.targetType, 'reply')
      ));

    res.json({
      success: true,
      data: {
        liked,
        likeCount: likeCount[0]?.count || 0
      }
    });

  } catch (error) {
    console.error('Toggle reply like error:', error);
    res.status(500).json({ error: 'Failed to toggle reply like' });
  }
});

// ==================== REPLIES ENDPOINTS ====================

// POST /api/community/replies - Create reply
router.post('/replies', async (req, res) => {
  try {
    const user = await getUserFromSession(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { postId, content } = req.body;
    if (!postId || !content?.trim()) {
      return res.status(400).json({ error: 'Post ID and content are required' });
    }

    // Check if post exists and get post author
    const postData = await db
      .select({ 
        id: communityPosts.id,
        authorId: communityPosts.authorId 
      })
      .from(communityPosts)
      .where(eq(communityPosts.id, postId))
      .limit(1);

    if (postData.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const [newReply] = await db.insert(communityReplies).values({
      postId,
      authorId: user.id,
      content: content.trim(),
    }).returning();

    // Get author info
    const authorInfo = await db
      .select({
        name: profiles.name,
        profilePic: profiles.avatarUrl,
      })
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    const replierName = authorInfo[0]?.name || 'Someone';

    // Send push notification to post owner (if not replying to own post)
    if (postData[0].authorId && postData[0].authorId !== user.id) {
      pushNotifications.notifyCommunityReply(
        postData[0].authorId,
        replierName,
        content.trim(),
        postId
      ).catch(err => console.log('Push notification failed:', err));
    }

    res.status(201).json({
      success: true,
      data: {
        ...newReply,
        author: {
          id: user.id,
          name: replierName,
          profilePic: authorInfo[0]?.profilePic || null
        }
      }
    });

  } catch (error) {
    console.error('Create reply error:', error);
    res.status(500).json({ error: 'Failed to create reply' });
  }
});

// GET /api/community/posts/:id/replies - Get replies for a post
router.get('/posts/:id/replies', async (req, res) => {
  try {
    const user = await getUserFromSession(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const communityRepliesWithAuthors = await db
      .select({
        id: communityReplies.id,
        postId: communityReplies.postId,
        content: communityReplies.content,
        createdAt: communityReplies.createdAt,
        authorId: communityReplies.authorId,
        authorName: profiles.name,
        authorProfilePic: profiles.avatarUrl,
      })
      .from(communityReplies)
      .leftJoin(users, eq(communityReplies.authorId, users.userId))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(eq(communityReplies.postId, req.params.id))
      .orderBy(asc(communityReplies.createdAt));

    // Get like counts and user's like status for replies
    const replyIds = communityRepliesWithAuthors.map(r => r.id);
    let likeCounts = [];
    let userLikes = [];

    if (replyIds.length > 0) {
      likeCounts = await db
        .select({
          targetId: communityReactions.targetId,
          count: count(),
        })
        .from(communityReactions)
        .where(and(
          eq(communityReactions.targetType, 'reply'),
          inArray(communityReactions.targetId, replyIds)
        ))
        .groupBy(communityReactions.targetId);

      userLikes = await db
        .select({ targetId: communityReactions.targetId })
        .from(communityReactions)
        .where(and(
          eq(communityReactions.userId, user.id),
          eq(communityReactions.targetType, 'reply'),
          inArray(communityReactions.targetId, replyIds)
        ));
    }

    const enrichedReplies = communityRepliesWithAuthors.map(reply => ({
      id: reply.id,
      postId: reply.postId,
      content: reply.content,
      createdAt: reply.createdAt,
      likes: likeCounts.find(lc => lc.targetId === reply.id)?.count || 0,
      isLiked: userLikes.some(ul => ul.targetId === reply.id),
      author: {
        id: reply.authorId,
        name: reply.authorName || 'Anonymous',
        profilePic: reply.authorProfilePic
      }
    }));

    res.json({ success: true, data: enrichedReplies });

  } catch (error) {
    console.error('Get communityReplies error:', error);
    res.status(500).json({ error: 'Failed to fetch communityReplies' });
  }
});

// PUT /api/community/replies/:id - Edit reply (only author)
router.put('/replies/:id', async (req, res) => {
  try {
    const user = await getUserFromSession(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Check if reply exists and user owns it
    const reply = await db
      .select({ authorId: communityReplies.authorId })
      .from(communityReplies)
      .where(eq(communityReplies.id, req.params.id))
      .limit(1);

    if (reply.length === 0) {
      return res.status(404).json({ error: 'Reply not found' });
    }

    if (reply[0].authorId !== user.id) {
      return res.status(403).json({ error: 'You can only edit your own replies' });
    }

    const [updatedReply] = await db
      .update(communityReplies)
      .set({
        content: content.trim(),
        updatedAt: new Date()
      })
      .where(eq(communityReplies.id, req.params.id))
      .returning();

    res.json({ success: true, data: updatedReply });

  } catch (error) {
    console.error('Edit reply error:', error);
    res.status(500).json({ error: 'Failed to edit reply' });
  }
});

// DELETE /api/community/replies/:id - Delete reply (only author)
router.delete('/replies/:id', async (req, res) => {
  try {
    const user = await getUserFromSession(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if reply exists and user owns it
    const reply = await db
      .select({ authorId: communityReplies.authorId })
      .from(communityReplies)
      .where(eq(communityReplies.id, req.params.id))
      .limit(1);

    if (reply.length === 0) {
      return res.status(404).json({ error: 'Reply not found' });
    }

    if (reply[0].authorId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only delete your own replies' });
    }

    // Delete reply
    await db.delete(communityReplies).where(eq(communityReplies.id, req.params.id));

    res.status(204).send();

  } catch (error) {
    console.error('Delete reply error:', error);
    res.status(500).json({ error: 'Failed to delete reply' });
  }
});

// ==================== FRIENDS ENDPOINTS ====================

// POST /api/friends/request - Create pending friendship
router.post('/request', async (req, res) => {
  try {
    const user = await getUserFromSession(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { receiverId } = req.body;
    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver ID is required' });
    }

    if (receiverId === user.id) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if friendship already exists
    const existingFriendship = await db
      .select()
      .from(friendships)
      .where(or(
        and(eq(friendships.requesterId, user.id), eq(friendships.receiverId, receiverId)),
        and(eq(friendships.requesterId, receiverId), eq(friendships.receiverId, user.id))
      ))
      .limit(1);

    if (existingFriendship.length > 0) {
      // Return existing friendship (idempotent)
      return res.json({
        success: true,
        data: existingFriendship[0],
        message: 'Friend request already exists'
      });
    }

    const [newFriendship] = await db.insert(friendships).values({
      requesterId: user.id,
      receiverId,
      status: 'pending'
    }).returning();

    // Send real-time friend request notification via WebSocket
    try {
      const wss = (global as any).wss;
      if (wss) {
        // Get requester's profile information for the notification
        const requesterProfile = await db.select({
          name: profiles.name,
          userId: users.userId
        })
        .from(users)
        .innerJoin(profiles, eq(users.id, profiles.userId))
        .where(eq(users.id, user.id))
        .limit(1);

        const receiverProfile = await db.select({
          userId: users.userId
        })
        .from(users)
        .where(eq(users.id, receiverId))
        .limit(1);

        if (requesterProfile.length > 0 && receiverProfile.length > 0) {
          const receiverWs = wss.userConnections.get(receiverProfile[0].userId);
          if (receiverWs && receiverWs.readyState === 1) { // WebSocket.OPEN = 1
            receiverWs.send(JSON.stringify({
              type: 'friend_request_received',
              requesterId: requesterProfile[0].userId,
              requesterName: requesterProfile[0].name,
              message: `${requesterProfile[0].name} sent you a friend request`,
              friendshipId: newFriendship.id
            }));
            console.log(`👥 Real-time friend request notification sent to ${receiverProfile[0].userId}`);
          }
        }
      }
    } catch (notificationError) {
      console.error('Failed to send friend request notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({ success: true, data: newFriendship });

  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// POST /api/friends/accept/:id - Accept friendship
router.post('/accept/:id', async (req, res) => {
  try {
    const user = await getUserFromSession(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if friendship exists and user is the receiver
    const friendship = await db
      .select()
      .from(friendships)
      .where(and(
        eq(friendships.id, req.params.id),
        eq(friendships.receiverId, user.id),
        eq(friendships.status, 'pending')
      ))
      .limit(1);

    if (friendship.length === 0) {
      return res.status(404).json({ error: 'Pending friend request not found' });
    }

    const [updatedFriendship] = await db
      .update(friendships)
      .set({ status: 'accepted' })
      .where(eq(friendships.id, req.params.id))
      .returning();

    // Send real-time acceptance notification via WebSocket
    try {
      const wss = (global as any).wss;
      if (wss && updatedFriendship) {
        // Get responder's (accepter's) profile information
        const responderProfile = await db.select({
          name: profiles.name,
          userId: users.userId
        })
        .from(users)
        .innerJoin(profiles, eq(users.id, profiles.userId))
        .where(eq(users.id, user.id))
        .limit(1);

        // Get original requester's profile information
        const requesterProfile = await db.select({
          userId: users.userId
        })
        .from(users)
        .where(eq(users.id, updatedFriendship.requesterId))
        .limit(1);

        if (responderProfile.length > 0 && requesterProfile.length > 0) {
          const requesterWs = wss.userConnections.get(requesterProfile[0].userId);
          if (requesterWs && requesterWs.readyState === 1) { // WebSocket.OPEN = 1
            requesterWs.send(JSON.stringify({
              type: 'friend_request_response',
              responderId: responderProfile[0].userId,
              responderName: responderProfile[0].name,
              action: 'accepted',
              message: `${responderProfile[0].name} accepted your friend request`,
              friendshipId: updatedFriendship.id
            }));
            console.log(`👥 Real-time friend request acceptance notification sent to ${requesterProfile[0].userId}`);
          }
        }
      }
    } catch (notificationError) {
      console.error('Failed to send friend request acceptance notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.json({ success: true, data: updatedFriendship });

  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

// GET /api/friends?userId= - Get accepted friends
router.get('/', async (req, res) => {
  try {
    const user = await getUserFromSession(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.query.userId as string || user.id;

    const acceptedFriends = await db
      .select({
        id: friendships.id,
        friendId: profiles.userId,
        friendName: profiles.name,
        friendProfilePic: profiles.avatarUrl,
      })
      .from(friendships)
      .leftJoin(profiles, or(
        and(eq(friendships.requesterId, userId), eq(profiles.userId, friendships.receiverId)),
        and(eq(friendships.receiverId, userId), eq(profiles.userId, friendships.requesterId))
      ))
      .where(and(
        or(
          eq(friendships.requesterId, userId),
          eq(friendships.receiverId, userId)
        ),
        eq(friendships.status, 'accepted')
      ));

    res.json({ success: true, data: acceptedFriends });

  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// GET /api/friends/pending?userId= - Get pending requests
router.get('/pending', async (req, res) => {
  try {
    const user = await getUserFromSession(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userId = req.query.userId as string || user.id;

    const pendingRequests = await db
      .select({
        id: friendships.id,
        requesterId: friendships.requesterId,
        receiverId: friendships.receiverId,
        createdAt: friendships.createdAt,
        requesterName: profiles.name,
        requesterProfilePic: profiles.avatarUrl,
      })
      .from(friendships)
      .leftJoin(profiles, eq(profiles.userId, friendships.requesterId))
      .where(and(
        eq(friendships.receiverId, userId),
        eq(friendships.status, 'pending')
      ));

    res.json({ success: true, data: pendingRequests });

  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

// POST /api/community/friend-requests - Alternative endpoint for frontend compatibility
router.post('/friend-requests', async (req, res) => {
  try {
    const user = await getUserFromSession(req.headers.authorization as string);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required' });
    }

    if (targetUserId === user.id) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if friendship already exists
    const existingFriendship = await db
      .select()
      .from(friendships)
      .where(or(
        and(eq(friendships.requesterId, user.id), eq(friendships.receiverId, targetUserId)),
        and(eq(friendships.requesterId, targetUserId), eq(friendships.receiverId, user.id))
      ))
      .limit(1);

    if (existingFriendship.length > 0) {
      // Return existing friendship (idempotent)
      return res.json({
        success: true,
        data: existingFriendship[0],
        message: 'Friend request already exists'
      });
    }

    const [newFriendship] = await db.insert(friendships).values({
      requesterId: user.id,
      receiverId: targetUserId,
      status: 'pending'
    }).returning();

    res.status(201).json({ success: true, data: newFriendship });

  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

export default router;