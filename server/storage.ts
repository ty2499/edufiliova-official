import { db } from './db';
import { eq, desc, asc, and, sql, lt, isNull, isNotNull, inArray, notInArray } from 'drizzle-orm';
import { 
  supportAgents, 
  helpChatSettings, 
  quickResponses, 
  supportChatSessions,
  chatThreads,
  chatParticipants,
  messages,
  categories,
  carts,
  cartItems,
  orderItems,
  replitUsers,
  users,
  shopCategories,
  categoryFilters,
  categoryFilterOptions,
  works,
  workMedia,
  workLikes,
  workComments,
  workViews,
  profiles,
  profileViews,
  profileLikes,
  profileFollows,
  profileBoostLikes,
  profileBoostFollowers,
  products,
  productLikes,
  productFollows,
  pendingShopSignups,
  shopCustomers,
  shopPurchases,
  shopAds,
  shopMemberships,
  shopMembershipPlans,
  shopTransactions,
  shopSupportTickets,
  shopVouchers,
  shopVoucherRedemptions,
  shopVoucherFailedAttempts,
  adsBanners,
  adminSettings,
  paymentGateways,
  notifications,
  apiKeys,
  appDownloadLinks,
  socialMediaLinks,
  certificates,
  courses,
  courseEnrollments,
  coursePurchases,
  systemSettings,
  InsertSupportAgent,
  InsertHelpChatSetting,
  InsertQuickResponse,
  InsertSupportChatSession,
  InsertChatThread,
  InsertChatParticipant,
  InsertMessage,
  SupportAgent,
  HelpChatSetting,
  QuickResponse,
  SupportChatSession,
  ChatThread,
  ChatParticipant,
  Message,
  Category,
  Cart,
  CartItem,
  OrderItem,
  ReplitUser,
  UpsertReplitUser,
  ShopCategory,
  InsertShopCategory,
  CategoryFilter,
  InsertCategoryFilter,
  CategoryFilterOption,
  InsertCategoryFilterOption,
  Work,
  InsertWork,
  WorkMedia,
  InsertWorkMedia,
  WorkLike,
  InsertWorkLike,
  WorkComment,
  InsertWorkComment,
  WorkView,
  InsertWorkView,
  Product,
  ProductLike,
  InsertProductLike,
  ProductFollow,
  InsertProductFollow,
  ShopCustomer,
  InsertShopCustomer,
  ShopPurchase,
  InsertShopPurchase,
  ShopAd,
  InsertShopAd,
  ShopMembership,
  InsertShopMembership,
  ShopTransaction,
  InsertShopTransaction,
  ShopSupportTicket,
  InsertShopSupportTicket,
  ShopVoucher,
  InsertShopVoucher,
  ShopVoucherRedemption,
  InsertShopVoucherRedemption,
  AdminSetting,
  InsertAdminSetting,
  PaymentGateway,
  InsertPaymentGateway,
  InsertNotification,
  InsertApiKey,
  ApiKey,
  Certificate,
  InsertCertificate,
  Course,
  CourseEnrollment,
  emailAccounts,
  emailMessages,
  emailReplies,
  emailFolders,
  emailLabels,
  emailLabelAssignments,
  sentEmails,
  EmailAccount,
  InsertEmailAccount,
  EmailMessage,
  InsertEmailMessage,
  EmailReply,
  InsertEmailReply,
  EmailFolder,
  InsertEmailFolder,
  EmailLabel,
  InsertEmailLabel,
  EmailLabelAssignment,
  InsertEmailLabelAssignment,
  SentEmail,
  InsertSentEmail,
  ProfileBoostLike,
  InsertProfileBoostLike,
  ProfileBoostFollower,
  InsertProfileBoostFollower,
  showcaseProjects,
  showcaseProjectBoostLikes,
  showcaseProjectBoostComments,
  ShowcaseProject,
  InsertShowcaseProjectBoostLike,
  InsertShowcaseProjectBoostComment,
  emailVerifications,
  EmailVerification,
  InsertEmailVerification,
  teacherApplications,
  TeacherApplication,
  InsertTeacherApplication,
  emailMarketingTemplates,
  EmailMarketingTemplate,
  InsertEmailMarketingTemplate,
  emailCampaigns,
  EmailCampaign,
  InsertEmailCampaign,
  emailPreferences,
  EmailPreference,
  InsertEmailPreference,
  campaignDeliveries,
  CampaignDelivery,
  InsertCampaignDelivery,
  campaignSegments,
  CampaignSegment,
  InsertCampaignSegment,
  SegmentFilters
} from '@shared/schema';

// Storage interface for support chat features
export interface IStorage {
  // Support Agents
  createSupportAgent(agent: InsertSupportAgent): Promise<SupportAgent>;
  getSupportAgents(): Promise<SupportAgent[]>;
  getSupportAgentById(id: number): Promise<SupportAgent | null>;
  updateSupportAgent(id: number, updates: Partial<InsertSupportAgent>): Promise<SupportAgent | null>;
  deleteSupportAgent(id: number): Promise<boolean>;
  getActiveSupportAgents(): Promise<SupportAgent[]>;
  
  // Help Chat Settings
  createHelpChatSetting(setting: InsertHelpChatSetting): Promise<HelpChatSetting>;
  getHelpChatSettings(): Promise<HelpChatSetting[]>;
  getHelpChatSetting(key: string): Promise<HelpChatSetting | null>;
  updateHelpChatSetting(key: string, value: string, updatedBy?: string): Promise<HelpChatSetting | null>;
  deleteHelpChatSetting(key: string): Promise<boolean>;
  
  // Quick Responses
  createQuickResponse(response: InsertQuickResponse): Promise<QuickResponse>;
  getQuickResponses(): Promise<QuickResponse[]>;
  getQuickResponseById(id: number): Promise<QuickResponse | null>;
  updateQuickResponse(id: number, updates: Partial<InsertQuickResponse>): Promise<QuickResponse | null>;
  deleteQuickResponse(id: number): Promise<boolean>;
  getActiveQuickResponses(): Promise<QuickResponse[]>;
  getQuickResponsesByCategory(category: string): Promise<QuickResponse[]>;
  
  // Support Chat Sessions
  createSupportChatSession(session: InsertSupportChatSession): Promise<SupportChatSession>;
  getSupportChatSession(guestId: string): Promise<SupportChatSession | null>;
  updateSupportChatSession(guestId: string, updates: Partial<InsertSupportChatSession>): Promise<SupportChatSession | null>;
  assignAgentToSession(guestId: string, agentId: number): Promise<SupportChatSession | null>;
  adminTakeOverSession(guestId: string, adminUserId: string): Promise<SupportChatSession | null>;
  getActiveSessions(): Promise<SupportChatSession[]>;
  
  // Additional session management methods
  closeSupportChatSession(guestId: string): Promise<SupportChatSession | null>;
  getSessionsByAgent(agentId: number, options?: { activeOnly?: boolean }): Promise<SupportChatSession[]>;
  getOrCreateSupportChatSession(guestId: string, defaults: Partial<InsertSupportChatSession>): Promise<SupportChatSession>;
  
  // Chat Threads - Freelancer-customer conversations
  createChatThread(thread: InsertChatThread): Promise<ChatThread>;
  getChatThreadById(id: string): Promise<ChatThread | null>;
  getChatThreadByParticipants(freelancerId: string, customerId: string, projectId?: string): Promise<ChatThread | null>;
  getChatThreadsByUser(userId: string): Promise<ChatThread[]>;
  updateChatThread(id: string, updates: Partial<InsertChatThread>): Promise<ChatThread | null>;
  updateChatThreadLastMessage(id: string, messageAt: Date): Promise<ChatThread | null>;
  getOrCreateChatThread(freelancerId: string, customerId: string, projectId?: string): Promise<ChatThread>;
  
  // Chat Participants - Thread membership management
  createChatParticipant(participant: InsertChatParticipant): Promise<ChatParticipant>;
  getChatParticipantById(id: string): Promise<ChatParticipant | null>;
  getChatParticipantsByThread(threadId: string): Promise<ChatParticipant[]>;
  getChatParticipantByThreadAndUser(threadId: string, userId: string): Promise<ChatParticipant | null>;
  updateChatParticipant(id: string, updates: Partial<InsertChatParticipant>): Promise<ChatParticipant | null>;
  deleteChatParticipant(id: string): Promise<boolean>;
  isUserInThread(threadId: string, userId: string): Promise<boolean>;
  
  // Messages - Thread-based messaging (extending existing messages table)
  createMessage(message: InsertMessage): Promise<Message>;
  getMessageById(id: string): Promise<Message | null>;
  getMessagesByThread(threadId: string, options?: { limit?: number; before?: string }): Promise<Message[]>;
  updateMessage(id: string, updates: Partial<InsertMessage>): Promise<Message | null>;
  deleteMessage(id: string): Promise<boolean>;
  getMessageCount(threadId: string): Promise<number>;
  
  // Usage Analytics - for subscription limits
  getTodayThreadCount(userId: string): Promise<number>;
  getTodayMessageCount(userId: string): Promise<number>;
  getUserActiveSubscription(userId: string): Promise<{ planName: string } | null>;
  
  // Email Accounts - Multi-email account management
  createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount>;
  getEmailAccounts(activeOnly?: boolean): Promise<EmailAccount[]>;
  getEmailAccountById(id: string): Promise<EmailAccount | null>;
  getEmailAccountByEmail(email: string): Promise<EmailAccount | null>;
  updateEmailAccount(id: string, updates: Partial<InsertEmailAccount>): Promise<EmailAccount | null>;
  deleteEmailAccount(id: string): Promise<boolean>;
  updateEmailAccountSyncStatus(id: string, status: string, error?: string): Promise<EmailAccount | null>;
  
  // Email Messages - Fetched emails from all accounts
  createEmailMessage(message: InsertEmailMessage): Promise<EmailMessage>;
  getEmailMessages(options?: { accountId?: string; limit?: number; offset?: number; unreadOnly?: boolean }): Promise<EmailMessage[]>;
  getEmailMessageById(id: string): Promise<EmailMessage | null>;
  getEmailMessageByMessageId(messageId: string): Promise<EmailMessage | null>;
  updateEmailMessage(id: string, updates: Partial<InsertEmailMessage>): Promise<EmailMessage | null>;
  deleteEmailMessage(id: string): Promise<boolean>;
  markEmailAsRead(id: string, isRead: boolean): Promise<EmailMessage | null>;
  markEmailAsReplied(id: string): Promise<EmailMessage | null>;
  markEmailAsSpam(id: string, isSpam: boolean): Promise<EmailMessage | null>;
  markEmailAsArchived(id: string, isArchived: boolean): Promise<EmailMessage | null>;
  markEmailAsTrashed(id: string, isTrashed: boolean): Promise<EmailMessage | null>;
  getUnreadEmailCount(accountId?: string): Promise<number>;
  
  // Email Replies - Sent replies to emails
  createEmailReply(reply: InsertEmailReply): Promise<EmailReply>;
  getEmailReplies(emailMessageId: string): Promise<EmailReply[]>;
  getEmailRepliesBatch(emailMessageIds: string[]): Promise<EmailReply[]>;
  getEmailReplyById(id: string): Promise<EmailReply | null>;
  deleteEmailReplies(emailMessageId: string): Promise<boolean>;
  
  // Email Folders - Organize emails into folders
  createEmailFolder(folder: InsertEmailFolder): Promise<EmailFolder>;
  getEmailFolders(accountId: string): Promise<EmailFolder[]>;
  getEmailFolderById(id: string): Promise<EmailFolder | null>;
  updateEmailFolder(id: string, updates: Partial<InsertEmailFolder>): Promise<EmailFolder | null>;
  deleteEmailFolder(id: string): Promise<boolean>;
  
  // Email Labels - Tag emails with labels
  createEmailLabel(label: InsertEmailLabel): Promise<EmailLabel>;
  getEmailLabels(accountId: string): Promise<EmailLabel[]>;
  getEmailLabelById(id: string): Promise<EmailLabel | null>;
  updateEmailLabel(id: string, updates: Partial<InsertEmailLabel>): Promise<EmailLabel | null>;
  deleteEmailLabel(id: string): Promise<boolean>;
  
  // Email Label Assignments - Assign labels to emails
  assignLabelToEmail(emailMessageId: string, labelId: string): Promise<EmailLabelAssignment>;
  removeLabelFromEmail(emailMessageId: string, labelId: string): Promise<boolean>;
  getEmailLabelsForMessage(emailMessageId: string): Promise<EmailLabel[]>;
  
  // Sent Emails - Composed and sent messages
  createSentEmail(email: InsertSentEmail): Promise<SentEmail>;
  getSentEmails(options?: { accountId?: string; status?: string; limit?: number; offset?: number }): Promise<SentEmail[]>;
  getSentEmailById(id: string): Promise<SentEmail | null>;
  updateSentEmail(id: string, updates: Partial<InsertSentEmail>): Promise<SentEmail | null>;
  deleteSentEmail(id: string): Promise<boolean>;
  
  // User queries by role for group email sending
  getUsersByRole(role: string): Promise<Array<{ id: string; email: string; username: string }>>;
  
  // Email Verifications - For teacher application flow
  createEmailVerification(verification: InsertEmailVerification): Promise<EmailVerification>;
  getEmailVerificationByToken(token: string): Promise<EmailVerification | null>;
  getEmailVerificationByEmail(email: string): Promise<EmailVerification | null>;
  markEmailVerificationAsVerified(token: string): Promise<EmailVerification | null>;
  updateEmailVerificationCode(email: string, newToken: string, expiresAt: Date): Promise<EmailVerification | null>;
  deleteEmailVerification(id: string): Promise<boolean>;
  
  // Teacher Applications - Enhanced for proper auth flow
  createTeacherApplication(application: InsertTeacherApplication): Promise<TeacherApplication>;
  getTeacherApplicationById(id: string): Promise<TeacherApplication | null>;
  getTeacherApplicationByUserId(userId: string): Promise<TeacherApplication | null>;
  getTeacherApplicationByEmail(email: string): Promise<TeacherApplication | null>;
  updateTeacherApplication(id: string, updates: Partial<InsertTeacherApplication>): Promise<TeacherApplication | null>;
  
  // Profile Picture Upload
  updateProfilePicture(userId: string, pictureUrl: string): Promise<boolean>;
  
  // Categories - Product categorization (legacy)
  createCategory(category: { name: string; description?: string }): Promise<Category>;
  getCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | null>;
  updateCategory(id: string, updates: Partial<{ name: string; description: string }>): Promise<Category | null>;
  deleteCategory(id: string): Promise<boolean>;
  
  // Shop Categories - Multi-role category management with scoping
  createShopCategory(category: InsertShopCategory): Promise<ShopCategory>;
  getShopCategories(options?: { userId?: string; userRole?: string; visibility?: 'all' | 'global' | 'mine' }): Promise<ShopCategory[]>;
  getShopCategoryById(id: string): Promise<ShopCategory | null>;
  updateShopCategory(id: string, updates: Partial<InsertShopCategory>): Promise<ShopCategory | null>;
  deleteShopCategory(id: string): Promise<boolean>;
  canUserAccessShopCategory(categoryId: string, userId: string, userRole: string): Promise<boolean>;
  
  // Category Filters - Dynamic filtering system
  createCategoryFilter(filter: InsertCategoryFilter): Promise<CategoryFilter>;
  getCategoryFilters(categoryId: string): Promise<CategoryFilter[]>;
  getCategoryFilterById(id: string): Promise<CategoryFilter | null>;
  updateCategoryFilter(id: string, updates: Partial<InsertCategoryFilter>): Promise<CategoryFilter | null>;
  deleteCategoryFilter(id: string): Promise<boolean>;
  
  // Category Filter Options - Filter value options
  createCategoryFilterOption(option: InsertCategoryFilterOption): Promise<CategoryFilterOption>;
  getCategoryFilterOptions(filterId: string): Promise<CategoryFilterOption[]>;
  getCategoryFilterOptionById(id: string): Promise<CategoryFilterOption | null>;
  updateCategoryFilterOption(id: string, updates: Partial<InsertCategoryFilterOption>): Promise<CategoryFilterOption | null>;
  deleteCategoryFilterOption(id: string): Promise<boolean>;
  
  // Carts - User shopping carts
  createCart(cart: { userId: string }): Promise<Cart>;
  getCartByUserId(userId: string): Promise<Cart | null>;
  getCartById(id: string): Promise<Cart | null>;
  getOrCreateCartByUserId(userId: string): Promise<Cart>;
  clearCart(cartId: string): Promise<boolean>;
  deleteCart(cartId: string): Promise<boolean>;
  
  // Cart Items - Items within shopping carts
  addCartItem(cartItem: { cartId: string; productId: string; quantity: number }): Promise<CartItem>;
  getCartItems(cartId: string): Promise<CartItem[]>;
  getCartItem(cartId: string, productId: string): Promise<CartItem | null>;
  updateCartItemQuantity(cartId: string, productId: string, quantity: number): Promise<CartItem | null>;
  removeCartItem(cartId: string, productId: string): Promise<boolean>;
  getCartItemCount(cartId: string): Promise<number>;
  
  // Order Items - Individual items within orders (for multi-item orders)
  createOrderItem(orderItem: { orderId: string; productId: string; quantity: number; unitPrice: number }): Promise<OrderItem>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  getOrderItem(orderItemId: string): Promise<OrderItem | null>;
  updateOrderItem(orderItemId: string, updates: Partial<{ quantity: number; unitPrice: number }>): Promise<OrderItem | null>;
  deleteOrderItem(orderItemId: string): Promise<boolean>;
  
  // Replit Auth User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getReplitUser(id: string): Promise<ReplitUser | undefined>;
  upsertReplitUser(user: UpsertReplitUser): Promise<ReplitUser>;

  // Portfolio Works - Behance-like showcase system
  createWork(work: InsertWork): Promise<Work>;
  getWorks(options?: { userId?: string; page?: number; limit?: number; tags?: string[]; search?: string; visibility?: 'public' | 'unlisted' | 'private'; category?: string }): Promise<{ works: Work[]; total: number }>;
  getWorkById(id: string): Promise<Work | null>;
  getWorkWithMedia(id: string): Promise<{ work: Work; media: WorkMedia[]; owner: { name: string; avatarUrl?: string } } | null>;
  updateWork(id: string, updates: Partial<InsertWork>): Promise<Work | null>;
  deleteWork(id: string): Promise<boolean>;
  
  // Work Media - Images, videos, YouTube embeds
  createWorkMedia(media: InsertWorkMedia[]): Promise<WorkMedia[]>;
  getWorkMedia(workId: string): Promise<WorkMedia[]>;
  updateWorkMedia(id: string, updates: Partial<InsertWorkMedia>): Promise<WorkMedia | null>;
  deleteWorkMedia(id: string): Promise<boolean>;
  
  // Work Likes - Heart/like functionality
  toggleWorkLike(workId: string, userId: string): Promise<{ liked: boolean; likesCount: number }>;
  getWorkLikes(workId: string, options?: { limit?: number; offset?: number }): Promise<WorkLike[]>;
  getUserLikedWorks(userId: string, options?: { limit?: number; offset?: number }): Promise<Work[]>;
  
  // Work Comments - Comment and reply system
  createWorkComment(comment: InsertWorkComment): Promise<WorkComment>;
  getWorkComments(workId: string, options?: { limit?: number; offset?: number; parentId?: string }): Promise<WorkComment[]>;
  updateWorkComment(id: string, updates: Partial<InsertWorkComment>): Promise<WorkComment | null>;
  deleteWorkComment(id: string): Promise<boolean>;
  
  // Work Views - View tracking and analytics
  recordWorkView(workId: string, userId?: string, sessionId?: string, ipHash?: string): Promise<boolean>;
  getWorkViews(workId: string): Promise<number>;
  getWorkViewsAnalytics(workId: string, period?: 'day' | 'week' | 'month'): Promise<{ views: number; uniqueViews: number }>;
  
  // Profile Statistics - Views, likes, follows tracking
  getProfileStats(profileId: string, viewerUserId?: string): Promise<{ views: number; likes: number; followers: number; likedByMe?: boolean; followingByMe?: boolean }>;
  recordProfileView(profileId: string, viewData: { viewerUserId?: string; visitorId?: string; sessionId?: string; ipHash?: string; uaHash?: string; referer?: string }): Promise<boolean>;
  toggleProfileLike(profileId: string, userId: string): Promise<{ liked: boolean; likesCount: number }>;
  toggleProfileFollow(profileId: string, followerUserId: string): Promise<{ following: boolean; followersCount: number }>;
  
  // Profile Boost - Admin-controlled vanity metrics (fake likes/followers)
  addProfileBoostLikes(profileId: string, count: number): Promise<{ added: number }>;
  addProfileBoostFollowers(profileId: string, count: number): Promise<{ added: number }>;
  getProfileBoostLikesCount(profileId: string): Promise<number>;
  getProfileBoostFollowersCount(profileId: string): Promise<number>;
  getProfileBoostLikes(profileId: string, options?: { limit?: number; offset?: number }): Promise<ProfileBoostLike[]>;
  getProfileBoostFollowers(profileId: string, options?: { limit?: number; offset?: number }): Promise<ProfileBoostFollower[]>;
  
  // Showcase Project Boost - Admin-controlled vanity likes for individual portfolio works
  addShowcaseProjectBoostLikes(showcaseProjectId: string, count: number): Promise<{ added: number }>;
  getShowcaseProjectBoostLikesCount(showcaseProjectId: string): Promise<number>;
  addShowcaseProjectBoostComments(showcaseProjectId: string, count: number): Promise<{ added: number }>;
  getShowcaseProjectBoostCommentsCount(showcaseProjectId: string): Promise<number>;
  getShowcaseProjects(freelancerId: string): Promise<ShowcaseProject[]>;
  
  // Work Boost - Admin-controlled vanity metrics for portfolio works
  addWorkBoostLikes(workId: string, count: number): Promise<{ added: number; boostLikesCount: number; boostViewsCount: number }>;
  getWorkBoostStats(workId: string): Promise<{ boostLikesCount: number; boostViewsCount: number }>;
  
  // Featured Users - Admin-controlled featured creators
  toggleFeaturedStatus(userId: string, adminUserId: string): Promise<{ isFeatured: boolean }>;
  getFeaturedUsers(limit?: number): Promise<any[]>;

  // Product Likes - Heart/like functionality for products
  toggleProductLike(productId: string, userId: string): Promise<{ liked: boolean; likesCount: number }>;
  getProductLikes(productId: string, options?: { limit?: number; offset?: number }): Promise<Array<{ userId: string; userName: string; avatarUrl?: string; createdAt: Date }>>;
  getUserLikedProducts(userId: string, options?: { limit?: number; offset?: number }): Promise<string[]>; // Returns product IDs
  getProductLikeStats(productId: string, viewerUserId?: string): Promise<{ likesCount: number; likedByMe: boolean; likedBy: Array<{ userId: string; userName: string; avatarUrl?: string }> }>;

  // Product Follows - Follow the product seller/creator
  toggleProductFollow(sellerId: string, followerId: string): Promise<{ following: boolean; followersCount: number }>;
  getProductFollows(sellerId: string, options?: { limit?: number; offset?: number }): Promise<Array<{ userId: string; userName: string; avatarUrl?: string; createdAt: Date }>>;
  getUserFollowedSellers(userId: string, options?: { limit?: number; offset?: number }): Promise<string[]>; // Returns seller IDs
  getSellerFollowStats(sellerId: string, viewerUserId?: string): Promise<{ followersCount: number; followingByMe: boolean; followers: Array<{ userId: string; userName: string; avatarUrl?: string }> }>;

  // Featured Products - Admin-controlled featured products for landing page
  getFeaturedProducts(limit?: number): Promise<Product[]>;
  toggleProductFeaturedStatus(productId: string, isFeatured: boolean, adminUserId?: string): Promise<Product | null>;

  // Pending Shop Signups - Email verification before account creation
  createPendingShopSignup(data: { email: string; fullName: string; passwordHash: string; verificationCode: string; expiresAt: Date }): Promise<any>;
  getPendingShopSignup(email: string): Promise<any>;
  getPendingShopSignupByToken(token: string): Promise<any>;
  updatePendingShopSignupCode(email: string, verificationCode: string, expiresAt: Date): Promise<any>;
  deletePendingShopSignup(email: string): Promise<boolean>;

  // Customer Dashboard - Shop customers
  createShopCustomer(customer: { userId: string; fullName: string; email: string }): Promise<any>;
  getShopCustomerByUserId(userId: string): Promise<any>;
  updateShopCustomer(customerId: string, updates: any): Promise<any>;
  updateWalletBalance(customerId: string, amount: number): Promise<any>;

  // Customer Dashboard - Purchases
  createShopPurchase(purchase: any): Promise<any>;
  getShopPurchasesByCustomerId(customerId: string): Promise<any[]>;
  getShopPurchaseById(id: string): Promise<any>;

  // Customer Dashboard - Ads
  createShopAd(ad: any): Promise<any>;
  getShopAdsByCustomerId(customerId: string): Promise<any[]>;
  getShopAdById(id: string): Promise<any>;
  updateShopAd(id: string, updates: any): Promise<any>;
  deleteShopAd(id: string): Promise<boolean>;

  // Customer Dashboard - Memberships
  createShopMembership(membership: any): Promise<any>;
  getShopMembershipByCustomerId(customerId: string): Promise<any>;
  updateShopMembership(id: string, updates: any): Promise<any>;

  // Customer Dashboard - Transactions
  createShopTransaction(transaction: any): Promise<any>;
  getShopTransactionsByCustomerId(customerId: string): Promise<any[]>;
  getShopTransactionById(id: string): Promise<any>;

  // Customer Dashboard - Support Tickets
  createShopSupportTicket(ticket: any): Promise<any>;
  getShopSupportTicketsByCustomerId(customerId: string): Promise<any[]>;
  getAllShopSupportTickets(): Promise<any[]>;
  getShopSupportTicketById(id: string): Promise<any>;
  updateShopSupportTicket(id: string, updates: any): Promise<any>;
  deleteShopSupportTicket(id: string): Promise<boolean>;

  // Customer Dashboard - Vouchers
  createVoucher(voucher: any): Promise<any>;
  createBulkVouchers(vouchers: any[]): Promise<any[]>;
  getVouchers(): Promise<any[]>;
  getVoucherByCode(code: string): Promise<any | null>;
  deleteVoucher(id: string): Promise<boolean>;
  deleteAllVouchers(): Promise<number>;
  redeemVoucher(voucherId: string, customerId: string, amount: string): Promise<any>;
  getVoucherRedemptions(voucherId?: string): Promise<any[]>;
  updateVoucherEmailStatus(voucherId: string, emailSent: boolean): Promise<void>;
  
  // Voucher fraud prevention
  recordFailedVoucherAttempt(customerId: string, userId: string, attemptedCode: string, ipAddress?: string): Promise<void>;
  getRecentFailedAttempts(customerId: string, hoursBack: number): Promise<number>;
  isUserBlockedFromVouchers(customerId: string): Promise<boolean>;

  // Customer Dashboard - Statistics
  getCustomerDashboardStats(customerId: string): Promise<{ totalPurchases: number; activeAds: number; walletBalance: string; membership: any | null }>;

  // Admin Settings - API Keys and configurations
  createAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting>;
  getAdminSettings(category?: string): Promise<AdminSetting[]>;
  getAdminSetting(key: string): Promise<AdminSetting | null>;
  updateAdminSetting(key: string, value: string, updatedBy?: string): Promise<AdminSetting | null>;
  deleteAdminSetting(key: string): Promise<boolean>;

  // Payment Gateways - Payment provider configurations
  createPaymentGateway(gateway: InsertPaymentGateway): Promise<PaymentGateway>;
  getPaymentGateways(enabledOnly?: boolean): Promise<PaymentGateway[]>;
  getPaymentGateway(gatewayId: string): Promise<PaymentGateway | null>;
  updatePaymentGateway(gatewayId: string, updates: Partial<InsertPaymentGateway>, updatedBy?: string): Promise<PaymentGateway | null>;
  deletePaymentGateway(gatewayId: string): Promise<boolean>;
  getPrimaryPaymentGateway(): Promise<PaymentGateway | null>;
  setPrimaryPaymentGateway(gatewayId: string): Promise<PaymentGateway | null>;

  // Certificates - Course completion certificates
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  getCertificateById(id: string): Promise<Certificate | null>;
  getCertificateByVerificationCode(code: string): Promise<Certificate | null>;
  getCertificatesByUserId(userId: string): Promise<Certificate[]>;
  getCertificatesByCourseId(courseId: string): Promise<Certificate[]>;
  updateCertificate(id: string, updates: Partial<InsertCertificate>): Promise<Certificate | null>;
  revokeCertificate(id: string, reason: string): Promise<Certificate | null>;
  checkCourseCompletion(userId: string, courseId: string): Promise<{ completed: boolean; progress: number; finalScore?: number }>;
  getCourseWithInstructor(courseId: string): Promise<{ title: string; description?: string; instructorName?: string; certificateType?: string } | null>;
  
  // Featured Courses - Admin-controlled featured courses for landing page
  getFeaturedCourses(limit?: number): Promise<any[]>;
  setCourseFeatured(courseId: string, isFeatured: boolean): Promise<any | null>;
  
  // API Keys - Marketplace API access management
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  getApiKeysByUserId(userId: string): Promise<ApiKey[]>;
  getApiKeyByKeyHash(keyHash: string): Promise<ApiKey | null>;
  revokeApiKey(id: string): Promise<ApiKey | null>;
  updateApiKeyLastUsed(keyHash: string): Promise<void>;
  validateApiKey(key: string): Promise<ApiKey | null>;

  // App Download Links - Mobile app store links
  getAppDownloadLinks(): Promise<{ 
    appStoreUrl: string | null; 
    appStoreText: string | null;
    googlePlayUrl: string | null; 
    googlePlayText: string | null;
    huaweiGalleryUrl: string | null;
    huaweiGalleryText: string | null;
  }>;
  updateAppDownloadLinks(
    appStoreUrl: string, 
    appStoreText: string,
    googlePlayUrl: string, 
    googlePlayText: string,
    huaweiGalleryUrl: string,
    huaweiGalleryText: string
  ): Promise<{ 
    appStoreUrl: string; 
    appStoreText: string;
    googlePlayUrl: string; 
    googlePlayText: string;
    huaweiGalleryUrl: string;
    huaweiGalleryText: string;
  }>;

  // Social Media Links - Social media profile links
  getSocialMediaLinks(): Promise<{ 
    whatsappUrl: string | null; 
    linkedinUrl: string | null;
    instagramUrl: string | null; 
    threadsUrl: string | null;
    tiktokUrl: string | null;
    dribbbleUrl: string | null;
    facebookUrl: string | null;
    xUrl: string | null;
    pinterestUrl: string | null;
    behanceUrl: string | null;
    telegramUrl: string | null;
  }>;
  updateSocialMediaLinks(
    whatsappUrl: string, 
    linkedinUrl: string,
    instagramUrl: string, 
    threadsUrl: string,
    tiktokUrl: string,
    dribbbleUrl: string,
    facebookUrl: string,
    xUrl: string,
    pinterestUrl: string,
    behanceUrl: string,
    telegramUrl: string
  ): Promise<{ 
    whatsappUrl: string; 
    linkedinUrl: string;
    instagramUrl: string; 
    threadsUrl: string;
    tiktokUrl: string;
    dribbbleUrl: string;
    facebookUrl: string;
    xUrl: string;
    pinterestUrl: string;
    behanceUrl: string;
    telegramUrl: string;
  }>;

  // Payment Processing - Course purchases via payment gateways
  getAllAuthUsers(): Promise<any[]>;
  recordPurchase(purchase: {
    userId: string;
    courseId: string;
    paymentIntentId: string;
    amount: number;
    paymentMethod: string;
  }): Promise<void>;

  
  // WhatsApp Bot
  getWhatsAppConversations(): Promise<any[]>;
  getWhatsAppMessages(conversationId: string): Promise<any[]>;
  
  // =====================================================
  // EMAIL MARKETING SYSTEM
  // =====================================================
  
  // Email Marketing Templates
  createEmailMarketingTemplate(template: InsertEmailMarketingTemplate): Promise<EmailMarketingTemplate>;
  getEmailMarketingTemplates(options?: { category?: string; activeOnly?: boolean }): Promise<EmailMarketingTemplate[]>;
  getEmailMarketingTemplateById(id: string): Promise<EmailMarketingTemplate | null>;
  updateEmailMarketingTemplate(id: string, updates: Partial<InsertEmailMarketingTemplate>): Promise<EmailMarketingTemplate | null>;
  deleteEmailMarketingTemplate(id: string): Promise<boolean>;
  
  // Email Campaigns
  createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign>;
  getEmailCampaigns(options?: { status?: string; limit?: number; offset?: number }): Promise<EmailCampaign[]>;
  getEmailCampaignById(id: string): Promise<EmailCampaign | null>;
  updateEmailCampaign(id: string, updates: Partial<InsertEmailCampaign>): Promise<EmailCampaign | null>;
  deleteEmailCampaign(id: string): Promise<boolean>;
  updateCampaignStats(campaignId: string, stats: { sentCount?: number; deliveredCount?: number; openedCount?: number; clickedCount?: number; bouncedCount?: number; failedCount?: number }): Promise<EmailCampaign | null>;
  
  // Email Preferences
  createOrUpdateEmailPreference(preference: InsertEmailPreference): Promise<EmailPreference>;
  getEmailPreferenceByUserId(userId: string): Promise<EmailPreference | null>;
  getEmailPreferenceByToken(token: string): Promise<EmailPreference | null>;
  updateEmailPreference(id: string, updates: Partial<InsertEmailPreference>): Promise<EmailPreference | null>;
  unsubscribeByToken(token: string, reason?: string): Promise<EmailPreference | null>;
  
  // Campaign Deliveries
  createCampaignDelivery(delivery: InsertCampaignDelivery): Promise<CampaignDelivery>;
  createBulkCampaignDeliveries(deliveries: InsertCampaignDelivery[]): Promise<CampaignDelivery[]>;
  getCampaignDeliveries(campaignId: string, options?: { status?: string; limit?: number; offset?: number }): Promise<CampaignDelivery[]>;
  updateCampaignDelivery(id: string, updates: Partial<CampaignDelivery>): Promise<CampaignDelivery | null>;
  markDeliveryAsSent(id: string): Promise<CampaignDelivery | null>;
  markDeliveryAsDelivered(id: string): Promise<CampaignDelivery | null>;
  markDeliveryAsOpened(id: string): Promise<CampaignDelivery | null>;
  markDeliveryAsClicked(id: string): Promise<CampaignDelivery | null>;
  markDeliveryAsBounced(id: string, reason: string): Promise<CampaignDelivery | null>;
  markDeliveryAsFailed(id: string, error: string): Promise<CampaignDelivery | null>;
  
  // Campaign Segments
  createCampaignSegment(segment: InsertCampaignSegment): Promise<CampaignSegment>;
  getCampaignSegments(activeOnly?: boolean): Promise<CampaignSegment[]>;
  getCampaignSegmentById(id: string): Promise<CampaignSegment | null>;
  updateCampaignSegment(id: string, updates: Partial<InsertCampaignSegment>): Promise<CampaignSegment | null>;
  deleteCampaignSegment(id: string): Promise<boolean>;
  
  // Segmentation Queries - Get users by filters for targeting
  getEmailableUsers(filters: SegmentFilters): Promise<Array<{ userId: string; email: string; name: string; role?: string; grade?: number; subscriptionTier?: string }>>;
  getSegmentEstimatedSize(filters: SegmentFilters): Promise<number>;
}

// Database-backed implementation
export class DatabaseStorage implements IStorage {
  // Support Agents
  async createSupportAgent(agent: InsertSupportAgent): Promise<SupportAgent> {
    const [newAgent] = await db.insert(supportAgents).values({
      ...agent,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newAgent;
  }

  async getSupportAgents(): Promise<SupportAgent[]> {
    return await db.select().from(supportAgents).orderBy(asc(supportAgents.sortOrder), asc(supportAgents.name));
  }

  async getSupportAgentById(id: number): Promise<SupportAgent | null> {
    const [agent] = await db.select().from(supportAgents).where(eq(supportAgents.id, id)).limit(1);
    return agent || null;
  }

  async updateSupportAgent(id: number, updates: Partial<InsertSupportAgent>): Promise<SupportAgent | null> {
    const [updatedAgent] = await db.update(supportAgents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(supportAgents.id, id))
      .returning();
    return updatedAgent || null;
  }

  async deleteSupportAgent(id: number): Promise<boolean> {
    const result = await db.delete(supportAgents).where(eq(supportAgents.id, id)).returning();
    return result.length > 0;
  }

  async getActiveSupportAgents(): Promise<SupportAgent[]> {
    const agents = await db.select().from(supportAgents)
      .where(eq(supportAgents.isActive, true))
      .orderBy(asc(supportAgents.sortOrder), asc(supportAgents.name));
    
    // Sort to show customer_service agents first
    return agents.sort((a, b) => {
      const aIsCS = a.role === 'customer_service';
      const bIsCS = b.role === 'customer_service';
      if (aIsCS && !bIsCS) return -1;
      if (!aIsCS && bIsCS) return 1;
      // If both are same type, maintain sortOrder/name order from DB
      return 0;
    });
  }

  // Help Chat Settings
  async createHelpChatSetting(setting: InsertHelpChatSetting): Promise<HelpChatSetting> {
    const [newSetting] = await db.insert(helpChatSettings).values({
      ...setting,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newSetting;
  }

  async getHelpChatSettings(): Promise<HelpChatSetting[]> {
    return await db.select().from(helpChatSettings).orderBy(asc(helpChatSettings.settingKey));
  }

  async getHelpChatSetting(key: string): Promise<HelpChatSetting | null> {
    const [setting] = await db.select().from(helpChatSettings)
      .where(eq(helpChatSettings.settingKey, key))
      .limit(1);
    return setting || null;
  }

  async updateHelpChatSetting(key: string, value: string, updatedBy?: string): Promise<HelpChatSetting | null> {
    const [updatedSetting] = await db.update(helpChatSettings)
      .set({ 
        settingValue: value, 
        updatedBy: updatedBy || null,
        updatedAt: new Date() 
      })
      .where(eq(helpChatSettings.settingKey, key))
      .returning();
    return updatedSetting || null;
  }

  async deleteHelpChatSetting(key: string): Promise<boolean> {
    const result = await db.delete(helpChatSettings).where(eq(helpChatSettings.settingKey, key)).returning();
    return result.length > 0;
  }

  // Quick Responses
  async createQuickResponse(response: InsertQuickResponse): Promise<QuickResponse> {
    const [newResponse] = await db.insert(quickResponses).values({
      ...response,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newResponse;
  }

  async getQuickResponses(): Promise<QuickResponse[]> {
    return await db.select().from(quickResponses)
      .orderBy(asc(quickResponses.category), asc(quickResponses.sortOrder), asc(quickResponses.title));
  }

  async getQuickResponseById(id: number): Promise<QuickResponse | null> {
    const [response] = await db.select().from(quickResponses).where(eq(quickResponses.id, id)).limit(1);
    return response || null;
  }

  async updateQuickResponse(id: number, updates: Partial<InsertQuickResponse>): Promise<QuickResponse | null> {
    const [updatedResponse] = await db.update(quickResponses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(quickResponses.id, id))
      .returning();
    return updatedResponse || null;
  }

  async deleteQuickResponse(id: number): Promise<boolean> {
    const result = await db.delete(quickResponses).where(eq(quickResponses.id, id)).returning();
    return result.length > 0;
  }

  async getActiveQuickResponses(): Promise<QuickResponse[]> {
    return await db.select().from(quickResponses)
      .where(eq(quickResponses.isActive, true))
      .orderBy(asc(quickResponses.category), asc(quickResponses.sortOrder), asc(quickResponses.title));
  }

  async getQuickResponsesByCategory(category: string): Promise<QuickResponse[]> {
    return await db.select().from(quickResponses)
      .where(eq(quickResponses.category, category))
      .orderBy(asc(quickResponses.sortOrder), asc(quickResponses.title));
  }

  // Support Chat Sessions
  async createSupportChatSession(session: InsertSupportChatSession): Promise<SupportChatSession> {
    const [newSession] = await db.insert(supportChatSessions).values({
      ...session,
      sessionStartedAt: new Date(),
      lastActivityAt: new Date(),
    }).returning();
    return newSession;
  }

  async getSupportChatSession(guestId: string): Promise<SupportChatSession | null> {
    const [session] = await db.select().from(supportChatSessions)
      .where(eq(supportChatSessions.guestId, guestId))
      .limit(1);
    return session || null;
  }

  async updateSupportChatSession(guestId: string, updates: Partial<InsertSupportChatSession>): Promise<SupportChatSession | null> {
    const [updatedSession] = await db.update(supportChatSessions)
      .set({ ...updates, lastActivityAt: new Date() })
      .where(eq(supportChatSessions.guestId, guestId))
      .returning();
    return updatedSession || null;
  }

  async assignAgentToSession(guestId: string, agentId: number): Promise<SupportChatSession | null> {
    return await this.updateSupportChatSession(guestId, { assignedAgentId: agentId });
  }

  async adminTakeOverSession(guestId: string, adminUserId: string): Promise<SupportChatSession | null> {
    return await this.updateSupportChatSession(guestId, { 
      adminTakenOver: true,
      adminUserId: adminUserId
    });
  }

  async getActiveSessions(): Promise<SupportChatSession[]> {
    return await db.select().from(supportChatSessions)
      .where(eq(supportChatSessions.isActive, true))
      .orderBy(desc(supportChatSessions.lastActivityAt));
  }
  
  async closeSupportChatSession(guestId: string): Promise<SupportChatSession | null> {
    const [closedSession] = await db.update(supportChatSessions)
      .set({ isActive: false, lastActivityAt: new Date() })
      .where(eq(supportChatSessions.guestId, guestId))
      .returning();
    return closedSession || null;
  }
  
  async getSessionsByAgent(agentId: number, options: { activeOnly?: boolean } = {}): Promise<SupportChatSession[]> {
    const conditions = [eq(supportChatSessions.assignedAgentId, agentId)];
    
    if (options.activeOnly) {
      conditions.push(eq(supportChatSessions.isActive, true));
    }
    
    return await db.select().from(supportChatSessions)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(supportChatSessions.lastActivityAt));
  }
  
  async getOrCreateSupportChatSession(guestId: string, defaults: Partial<InsertSupportChatSession>): Promise<SupportChatSession> {
    // Try to get existing session first
    const existing = await this.getSupportChatSession(guestId);
    if (existing) return existing;
    
    // Create new session with defaults
    return await this.createSupportChatSession({
      guestId,
      ...defaults
    } as InsertSupportChatSession);
  }

  // Chat Threads - Freelancer-customer conversations
  async createChatThread(thread: InsertChatThread): Promise<ChatThread> {
    const [newThread] = await db.insert(chatThreads).values({
      ...thread,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessageAt: new Date(),
    }).returning();
    return newThread;
  }

  async getChatThreadById(id: string): Promise<ChatThread | null> {
    const [thread] = await db.select().from(chatThreads).where(eq(chatThreads.id, id)).limit(1);
    return thread || null;
  }

  async getChatThreadByParticipants(freelancerId: string, customerId: string, projectId?: string): Promise<ChatThread | null> {
    const conditions = [
      eq(chatThreads.freelancerId, freelancerId),
      eq(chatThreads.customerId, customerId)
    ];
    
    if (projectId) {
      conditions.push(eq(chatThreads.projectId, projectId));
    } else {
      // Check for threads with null projectId for general conversations
      conditions.push(isNull(chatThreads.projectId));
    }

    const [thread] = await db.select().from(chatThreads)
      .where(and(...conditions))
      .limit(1);
    return thread || null;
  }

  async getChatThreadsByUser(userId: string): Promise<ChatThread[]> {
    // Get threads where user is a participant - select only chatThreads fields to avoid duplicates
    const results = await db.select({
      id: chatThreads.id,
      freelancerId: chatThreads.freelancerId,
      customerId: chatThreads.customerId,
      projectId: chatThreads.projectId,
      status: chatThreads.status,
      lastMessageAt: chatThreads.lastMessageAt,
      lastMessagePreview: chatThreads.lastMessagePreview,
      createdAt: chatThreads.createdAt,
      updatedAt: chatThreads.updatedAt,
    }).from(chatThreads)
      .innerJoin(chatParticipants, eq(chatParticipants.threadId, chatThreads.id))
      .where(eq(chatParticipants.userId, userId))
      .orderBy(desc(chatThreads.lastMessageAt));
    
    // Return as ChatThread[] with proper typing
    return results as ChatThread[];
  }

  async updateChatThread(id: string, updates: Partial<InsertChatThread>): Promise<ChatThread | null> {
    const [updatedThread] = await db.update(chatThreads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chatThreads.id, id))
      .returning();
    return updatedThread || null;
  }

  async updateChatThreadLastMessage(id: string, messageAt: Date): Promise<ChatThread | null> {
    return await this.updateChatThread(id, { lastMessageAt: messageAt });
  }

  async getOrCreateChatThread(freelancerId: string, customerId: string, projectId?: string): Promise<ChatThread> {
    // Try to get existing thread first
    const existing = await this.getChatThreadByParticipants(freelancerId, customerId, projectId);
    if (existing) return existing;
    
    // Create new thread
    const newThread = await this.createChatThread({
      freelancerId,
      customerId,
      projectId: projectId || null,
      status: 'open'
    } as InsertChatThread);

    // Add participants
    await this.createChatParticipant({
      threadId: newThread.id,
      userId: freelancerId,
      role: 'freelancer'
    } as InsertChatParticipant);

    await this.createChatParticipant({
      threadId: newThread.id,
      userId: customerId,
      role: 'customer'
    } as InsertChatParticipant);

    return newThread;
  }

  // Chat Participants - Thread membership management
  async createChatParticipant(participant: InsertChatParticipant): Promise<ChatParticipant> {
    const [newParticipant] = await db.insert(chatParticipants).values({
      ...participant,
      joinedAt: new Date(),
    }).returning();
    return newParticipant;
  }

  async getChatParticipantById(id: string): Promise<ChatParticipant | null> {
    const [participant] = await db.select().from(chatParticipants).where(eq(chatParticipants.id, id)).limit(1);
    return participant || null;
  }

  async getChatParticipantsByThread(threadId: string): Promise<ChatParticipant[]> {
    return await db.select().from(chatParticipants)
      .where(eq(chatParticipants.threadId, threadId))
      .orderBy(asc(chatParticipants.joinedAt));
  }

  async getChatParticipantByThreadAndUser(threadId: string, userId: string): Promise<ChatParticipant | null> {
    const [participant] = await db.select().from(chatParticipants)
      .where(and(eq(chatParticipants.threadId, threadId), eq(chatParticipants.userId, userId)))
      .limit(1);
    return participant || null;
  }

  async updateChatParticipant(id: string, updates: Partial<InsertChatParticipant>): Promise<ChatParticipant | null> {
    const [updatedParticipant] = await db.update(chatParticipants)
      .set(updates)
      .where(eq(chatParticipants.id, id))
      .returning();
    return updatedParticipant || null;
  }

  async deleteChatParticipant(id: string): Promise<boolean> {
    const result = await db.delete(chatParticipants).where(eq(chatParticipants.id, id)).returning();
    return result.length > 0;
  }

  async isUserInThread(threadId: string, userId: string): Promise<boolean> {
    const participant = await this.getChatParticipantByThreadAndUser(threadId, userId);
    return participant !== null;
  }

  // Messages - Thread-based messaging (extending existing messages table)
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values({
      ...message,
    }).returning();
    
    // Update thread's last message time if this is a thread message
    if (newMessage.threadId) {
      await this.updateChatThreadLastMessage(newMessage.threadId, newMessage.createdAt);
    }
    
    return newMessage;
  }

  async getMessageById(id: string): Promise<Message | null> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
    return message || null;
  }

  async getMessagesByThread(threadId: string, options: { limit?: number; before?: string } = {}): Promise<Message[]> {
    const { limit = 50, before } = options;
    const conditions = [eq(messages.threadId, threadId)];
    
    if (before) {
      // Add condition to get messages before a specific message ID (for pagination)
      const [beforeMessage] = await db.select().from(messages).where(eq(messages.id, before)).limit(1);
      if (beforeMessage) {
        conditions.push(lt(messages.createdAt, beforeMessage.createdAt));
      }
    }

    return await db.select().from(messages)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }

  async updateMessage(id: string, updates: Partial<InsertMessage>): Promise<Message | null> {
    const [updatedMessage] = await db.update(messages)
      .set({ ...updates })
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage || null;
  }

  async deleteMessage(id: string): Promise<boolean> {
    const result = await db.delete(messages).where(eq(messages.id, id)).returning();
    return result.length > 0;
  }

  async getMessageCount(threadId: string): Promise<number> {
    const [result] = await db.select({ count: sql`count(*)` }).from(messages)
      .where(eq(messages.threadId, threadId));
    return Number(result.count) || 0;
  }
  
  // Usage Analytics - for subscription limits
  async getTodayThreadCount(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [result] = await db
      .select({ count: sql`count(*)` })
      .from(chatThreads)
      .where(and(
        eq(chatThreads.customerId, userId),
        sql`${chatThreads.createdAt} >= ${today}`
      ));
    return Number(result.count) || 0;
  }
  
  async getTodayMessageCount(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [result] = await db
      .select({ count: sql`count(*)` })
      .from(messages)
      .where(and(
        eq(messages.senderId, userId),
        isNotNull(messages.threadId),
        sql`${messages.createdAt} >= ${today}`
      ));
    return Number(result.count) || 0;
  }
  
  async getUserActiveSubscription(userId: string): Promise<{ planName: string } | null> {
    const { userSubscriptions, pricingPlans } = await import('../shared/schema.js');
    
    const [result] = await db
      .select({ planName: pricingPlans.name })
      .from(userSubscriptions)
      .innerJoin(pricingPlans, eq(userSubscriptions.planId, pricingPlans.id))
      .where(and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.subscriptionStatus, 'pending')
      ))
      .limit(1);
    
    return result || null;
  }

  // Email Accounts - Multi-email account management
  async createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount> {
    const [newAccount] = await db.insert(emailAccounts).values(account).returning();
    return newAccount;
  }

  async getEmailAccounts(activeOnly: boolean = false): Promise<EmailAccount[]> {
    if (activeOnly) {
      return db.select().from(emailAccounts).where(eq(emailAccounts.isActive, true));
    }
    return db.select().from(emailAccounts);
  }

  async getEmailAccountById(id: string): Promise<EmailAccount | null> {
    const [account] = await db.select().from(emailAccounts).where(eq(emailAccounts.id, id));
    return account || null;
  }

  async getEmailAccountByEmail(email: string): Promise<EmailAccount | null> {
    const [account] = await db.select().from(emailAccounts).where(eq(emailAccounts.email, email));
    return account || null;
  }

  async updateEmailAccount(id: string, updates: Partial<InsertEmailAccount>): Promise<EmailAccount | null> {
    const cleanUpdates: Partial<InsertEmailAccount> = { ...updates };
    
    if ('imapPassword' in cleanUpdates && (!cleanUpdates.imapPassword || cleanUpdates.imapPassword.trim() === '')) {
      delete cleanUpdates.imapPassword;
    }
    
    if ('smtpPassword' in cleanUpdates && (!cleanUpdates.smtpPassword || cleanUpdates.smtpPassword.trim() === '')) {
      delete cleanUpdates.smtpPassword;
    }
    
    const [updated] = await db
      .update(emailAccounts)
      .set({ ...cleanUpdates, updatedAt: new Date() })
      .where(eq(emailAccounts.id, id))
      .returning();
    return updated || null;
  }

  async deleteEmailAccount(id: string): Promise<boolean> {
    const deleted = await db.delete(emailAccounts).where(eq(emailAccounts.id, id)).returning({ id: emailAccounts.id });
    return deleted.length > 0;
  }

  async updateEmailAccountSyncStatus(id: string, status: string, error?: string): Promise<EmailAccount | null> {
    const [updated] = await db
      .update(emailAccounts)
      .set({
        syncStatus: status,
        syncError: error || null,
        lastSyncedAt: status === 'syncing' || status === 'idle' ? new Date() : undefined,
        updatedAt: new Date()
      })
      .where(eq(emailAccounts.id, id))
      .returning();
    return updated || null;
  }

  // Email Messages - Fetched emails from all accounts
  async createEmailMessage(message: InsertEmailMessage): Promise<EmailMessage> {
    const [newMessage] = await db.insert(emailMessages).values(message).returning();
    return newMessage;
  }

  async getEmailMessages(options: { accountId?: string; limit?: number; offset?: number; unreadOnly?: boolean } = {}): Promise<EmailMessage[]> {
    const { accountId, limit = 50, offset = 0, unreadOnly = false } = options;
    
    let query = db.select().from(emailMessages);
    
    const conditions = [];
    
    // Always exclude trashed messages by default
    conditions.push(eq(emailMessages.isTrashed, false));
    
    if (accountId) {
      conditions.push(eq(emailMessages.emailAccountId, accountId));
    }
    if (unreadOnly) {
      conditions.push(eq(emailMessages.isRead, false));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return query
      .orderBy(desc(emailMessages.receivedAt))
      .limit(limit)
      .offset(offset);
  }

  async getEmailMessageById(id: string): Promise<EmailMessage | null> {
    const [message] = await db.select().from(emailMessages).where(eq(emailMessages.id, id));
    return message || null;
  }

  async getEmailMessageByMessageId(messageId: string): Promise<EmailMessage | null> {
    const [message] = await db.select().from(emailMessages).where(eq(emailMessages.messageId, messageId));
    return message || null;
  }

  async updateEmailMessage(id: string, updates: Partial<InsertEmailMessage>): Promise<EmailMessage | null> {
    const [updated] = await db
      .update(emailMessages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailMessages.id, id))
      .returning();
    return updated || null;
  }

  async deleteEmailMessage(id: string): Promise<boolean> {
    const result = await db.delete(emailMessages).where(eq(emailMessages.id, id)).returning({ id: emailMessages.id });
    return result.length > 0;
  }

  async markEmailAsRead(id: string, isRead: boolean): Promise<EmailMessage | null> {
    const [updated] = await db
      .update(emailMessages)
      .set({ isRead, updatedAt: new Date() })
      .where(eq(emailMessages.id, id))
      .returning();
    return updated || null;
  }

  async markEmailAsReplied(id: string): Promise<EmailMessage | null> {
    const [updated] = await db
      .update(emailMessages)
      .set({ isReplied: true, updatedAt: new Date() })
      .where(eq(emailMessages.id, id))
      .returning();
    return updated || null;
  }

  async markEmailAsSpam(id: string, isSpam: boolean): Promise<EmailMessage | null> {
    const [updated] = await db
      .update(emailMessages)
      .set({ isSpam, updatedAt: new Date() })
      .where(eq(emailMessages.id, id))
      .returning();
    return updated || null;
  }

  async markEmailAsArchived(id: string, isArchived: boolean): Promise<EmailMessage | null> {
    const [updated] = await db
      .update(emailMessages)
      .set({ isArchived, updatedAt: new Date() })
      .where(eq(emailMessages.id, id))
      .returning();
    return updated || null;
  }

  async markEmailAsTrashed(id: string, isTrashed: boolean): Promise<EmailMessage | null> {
    const [updated] = await db
      .update(emailMessages)
      .set({ isTrashed, updatedAt: new Date() })
      .where(eq(emailMessages.id, id))
      .returning();
    return updated || null;
  }

  async getUnreadEmailCount(accountId?: string): Promise<number> {
    const conditions = [eq(emailMessages.isRead, false)];
    if (accountId) {
      conditions.push(eq(emailMessages.emailAccountId, accountId));
    }
    
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailMessages)
      .where(and(...conditions));
    
    return Number(result?.count || 0);
  }

  // Email Replies - Sent replies to emails
  async createEmailReply(reply: InsertEmailReply): Promise<EmailReply> {
    const [newReply] = await db.insert(emailReplies).values(reply).returning();
    return newReply;
  }

  async getEmailReplies(emailMessageId: string): Promise<EmailReply[]> {
    return db
      .select()
      .from(emailReplies)
      .where(eq(emailReplies.emailMessageId, emailMessageId))
      .orderBy(asc(emailReplies.sentAt));
  }

  async getEmailRepliesBatch(emailMessageIds: string[]): Promise<EmailReply[]> {
    if (emailMessageIds.length === 0) {
      return [];
    }
    return db
      .select()
      .from(emailReplies)
      .where(inArray(emailReplies.emailMessageId, emailMessageIds))
      .orderBy(asc(emailReplies.sentAt));
  }

  async getEmailReplyById(id: string): Promise<EmailReply | null> {
    const [reply] = await db.select().from(emailReplies).where(eq(emailReplies.id, id));
    return reply || null;
  }

  async deleteEmailReplies(emailMessageId: string): Promise<boolean> {
    const result = await db.delete(emailReplies).where(eq(emailReplies.emailMessageId, emailMessageId)).returning({ id: emailReplies.id });
    return result.length > 0;
  }

  // Email Folders - Organize emails into folders
  async createEmailFolder(folder: InsertEmailFolder): Promise<EmailFolder> {
    const [newFolder] = await db.insert(emailFolders).values(folder).returning();
    return newFolder;
  }

  async getEmailFolders(accountId: string): Promise<EmailFolder[]> {
    return db
      .select()
      .from(emailFolders)
      .where(eq(emailFolders.emailAccountId, accountId))
      .orderBy(asc(emailFolders.sortOrder), asc(emailFolders.name));
  }

  async getEmailFolderById(id: string): Promise<EmailFolder | null> {
    const [folder] = await db.select().from(emailFolders).where(eq(emailFolders.id, id));
    return folder || null;
  }

  async updateEmailFolder(id: string, updates: Partial<InsertEmailFolder>): Promise<EmailFolder | null> {
    const [updated] = await db
      .update(emailFolders)
      .set(updates)
      .where(eq(emailFolders.id, id))
      .returning();
    return updated || null;
  }

  async deleteEmailFolder(id: string): Promise<boolean> {
    const result = await db.delete(emailFolders).where(eq(emailFolders.id, id)).returning({ id: emailFolders.id });
    return result.length > 0;
  }

  // Email Labels - Tag emails with labels
  async createEmailLabel(label: InsertEmailLabel): Promise<EmailLabel> {
    const [newLabel] = await db.insert(emailLabels).values(label).returning();
    return newLabel;
  }

  async getEmailLabels(accountId: string): Promise<EmailLabel[]> {
    return db
      .select()
      .from(emailLabels)
      .where(eq(emailLabels.emailAccountId, accountId))
      .orderBy(asc(emailLabels.name));
  }

  async getEmailLabelById(id: string): Promise<EmailLabel | null> {
    const [label] = await db.select().from(emailLabels).where(eq(emailLabels.id, id));
    return label || null;
  }

  async updateEmailLabel(id: string, updates: Partial<InsertEmailLabel>): Promise<EmailLabel | null> {
    const [updated] = await db
      .update(emailLabels)
      .set(updates)
      .where(eq(emailLabels.id, id))
      .returning();
    return updated || null;
  }

  async deleteEmailLabel(id: string): Promise<boolean> {
    const result = await db.delete(emailLabels).where(eq(emailLabels.id, id)).returning({ id: emailLabels.id });
    return result.length > 0;
  }

  // Email Label Assignments - Assign labels to emails
  async assignLabelToEmail(emailMessageId: string, labelId: string): Promise<EmailLabelAssignment> {
    const [assignment] = await db
      .insert(emailLabelAssignments)
      .values({ emailMessageId, emailLabelId: labelId })
      .onConflictDoNothing()
      .returning();
    return assignment;
  }

  async removeLabelFromEmail(emailMessageId: string, labelId: string): Promise<boolean> {
    const result = await db
      .delete(emailLabelAssignments)
      .where(
        and(
          eq(emailLabelAssignments.emailMessageId, emailMessageId),
          eq(emailLabelAssignments.emailLabelId, labelId)
        )
      )
      .returning({ id: emailLabelAssignments.id });
    return result.length > 0;
  }

  async getEmailLabelsForMessage(emailMessageId: string): Promise<EmailLabel[]> {
    const result = await db
      .select({ label: emailLabels })
      .from(emailLabelAssignments)
      .innerJoin(emailLabels, eq(emailLabelAssignments.emailLabelId, emailLabels.id))
      .where(eq(emailLabelAssignments.emailMessageId, emailMessageId));
    
    return result.map(r => r.label);
  }

  // Sent Emails - Composed and sent messages
  async createSentEmail(email: InsertSentEmail): Promise<SentEmail> {
    const [newEmail] = await db.insert(sentEmails).values(email).returning();
    return newEmail;
  }

  async getSentEmails(options: { accountId?: string; status?: string; limit?: number; offset?: number } = {}): Promise<SentEmail[]> {
    const { accountId, status, limit = 50, offset = 0 } = options;
    
    const conditions = [];
    if (accountId) conditions.push(eq(sentEmails.emailAccountId, accountId));
    if (status) conditions.push(eq(sentEmails.status, status));
    
    let query = db.select().from(sentEmails);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return query
      .orderBy(desc(sentEmails.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getSentEmailById(id: string): Promise<SentEmail | null> {
    const [email] = await db.select().from(sentEmails).where(eq(sentEmails.id, id));
    return email || null;
  }

  async updateSentEmail(id: string, updates: Partial<InsertSentEmail>): Promise<SentEmail | null> {
    const [updated] = await db
      .update(sentEmails)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sentEmails.id, id))
      .returning();
    return updated || null;
  }

  async deleteSentEmail(id: string): Promise<boolean> {
    const result = await db.delete(sentEmails).where(eq(sentEmails.id, id)).returning({ id: sentEmails.id });
    return result.length > 0;
  }

  // User queries by role for group email sending
  async getUsersByRole(role: string): Promise<Array<{ id: string; email: string; username: string }>> {
    const results = await db
      .select({
        id: users.id,
        email: users.email
      })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(profiles.role, role));
    
    return results.map(u => ({
      id: u.id.toString(),
      email: u.email,
      username: u.email.split('@')[0] || 'User'
    }));
  }

  // Email Verifications - For teacher application flow
  async createEmailVerification(verification: InsertEmailVerification): Promise<EmailVerification> {
    const [newVerification] = await db.insert(emailVerifications).values(verification).returning();
    return newVerification;
  }

  async getEmailVerificationByToken(token: string): Promise<EmailVerification | null> {
    const [verification] = await db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.token, token))
      .limit(1);
    return verification || null;
  }

  async getEmailVerificationByEmail(email: string): Promise<EmailVerification | null> {
    const [verification] = await db
      .select()
      .from(emailVerifications)
      .where(eq(emailVerifications.email, email))
      .orderBy(desc(emailVerifications.createdAt))
      .limit(1);
    return verification || null;
  }

  async markEmailVerificationAsVerified(token: string): Promise<EmailVerification | null> {
    const [updated] = await db
      .update(emailVerifications)
      .set({ isVerified: true, verifiedAt: new Date() })
      .where(eq(emailVerifications.token, token))
      .returning();
    return updated || null;
  }

  async updateEmailVerificationCode(email: string, newToken: string, expiresAt: Date): Promise<EmailVerification | null> {
    const [updated] = await db
      .update(emailVerifications)
      .set({ token: newToken, expiresAt })
      .where(eq(emailVerifications.email, email))
      .returning();
    return updated || null;
  }

  async deleteEmailVerification(id: string): Promise<boolean> {
    const result = await db.delete(emailVerifications).where(eq(emailVerifications.id, id)).returning({ id: emailVerifications.id });
    return result.length > 0;
  }

  // Teacher Applications - Enhanced for proper auth flow
  async createTeacherApplication(application: InsertTeacherApplication): Promise<TeacherApplication> {
    const [newApplication] = await db.insert(teacherApplications).values(application).returning();
    return newApplication;
  }

  async getTeacherApplicationById(id: string): Promise<TeacherApplication | null> {
    const [application] = await db
      .select()
      .from(teacherApplications)
      .where(eq(teacherApplications.id, id))
      .limit(1);
    return application || null;
  }

  async getTeacherApplicationByUserId(userId: string): Promise<TeacherApplication | null> {
    const [application] = await db
      .select()
      .from(teacherApplications)
      .where(eq(teacherApplications.userId, userId))
      .orderBy(desc(teacherApplications.createdAt))
      .limit(1);
    return application || null;
  }

  async getTeacherApplicationByEmail(email: string): Promise<TeacherApplication | null> {
    const [application] = await db
      .select()
      .from(teacherApplications)
      .where(eq(teacherApplications.email, email))
      .orderBy(desc(teacherApplications.createdAt))
      .limit(1);
    return application || null;
  }

  async updateTeacherApplication(id: string, updates: Partial<InsertTeacherApplication>): Promise<TeacherApplication | null> {
    const [updated] = await db
      .update(teacherApplications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(teacherApplications.id, id))
      .returning();
    return updated || null;
  }

  // Profile Picture Upload
  async updateProfilePicture(userId: string, pictureUrl: string): Promise<boolean> {
    const result = await db
      .update(profiles)
      .set({ profilePicture: pictureUrl, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();
    return result.length > 0;
  }

  // Categories - Product categorization
  async createCategory(category: { name: string; description?: string }): Promise<Category> {
    const [newCategory] = await db.insert(categories).values({
      name: category.name,
      description: category.description || null,
    }).returning();
    return newCategory;
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async getCategoryById(id: string): Promise<Category | null> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return category || null;
  }

  async updateCategory(id: string, updates: Partial<{ name: string; description: string }>): Promise<Category | null> {
    const [updatedCategory] = await db.update(categories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory || null;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }

  // Shop Categories - Multi-role category management with scoping
  async createShopCategory(category: InsertShopCategory): Promise<ShopCategory> {
    const [newCategory] = await db.insert(shopCategories).values({
      ...category,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newCategory;
  }

  async getShopCategories(options?: { userId?: string; userRole?: string; visibility?: 'all' | 'global' | 'mine' }): Promise<ShopCategory[]> {
    const { userId, userRole, visibility = 'all' } = options || {};
    
    const conditions: any[] = [eq(shopCategories.isActive, true)];
    
    if (visibility === 'global') {
      conditions.push(eq(shopCategories.scope, 'global'));
    } else if (visibility === 'mine' && userId) {
      conditions.push(eq(shopCategories.createdBy, userId));
    }
    
    return db.select().from(shopCategories)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .orderBy(asc(shopCategories.sortOrder), asc(shopCategories.name));
  }

  async getShopCategoryById(id: string): Promise<ShopCategory | null> {
    const [category] = await db.select().from(shopCategories).where(eq(shopCategories.id, id)).limit(1);
    return category || null;
  }

  async updateShopCategory(id: string, updates: Partial<InsertShopCategory>): Promise<ShopCategory | null> {
    const [updated] = await db.update(shopCategories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(shopCategories.id, id))
      .returning();
    return updated || null;
  }

  async deleteShopCategory(id: string): Promise<boolean> {
    const result = await db.delete(shopCategories).where(eq(shopCategories.id, id)).returning();
    return result.length > 0;
  }

  async canUserAccessShopCategory(categoryId: string, userId: string, userRole: string): Promise<boolean> {
    const category = await this.getShopCategoryById(categoryId);
    if (!category) return false;
    if (category.scope === 'global') return true;
    return category.createdBy === userId;
  }

  // Category Filters - Dynamic filtering system
  async createCategoryFilter(filter: InsertCategoryFilter): Promise<CategoryFilter> {
    const [newFilter] = await db.insert(categoryFilters).values({
      ...filter,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newFilter;
  }

  async getCategoryFilters(categoryId: string): Promise<CategoryFilter[]> {
    return db.select().from(categoryFilters)
      .where(and(eq(categoryFilters.categoryId, categoryId), eq(categoryFilters.isActive, true)))
      .orderBy(asc(categoryFilters.sortOrder));
  }

  async getCategoryFilterById(id: string): Promise<CategoryFilter | null> {
    const [filter] = await db.select().from(categoryFilters).where(eq(categoryFilters.id, id)).limit(1);
    return filter || null;
  }

  async updateCategoryFilter(id: string, updates: Partial<InsertCategoryFilter>): Promise<CategoryFilter | null> {
    const [updated] = await db.update(categoryFilters)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(categoryFilters.id, id))
      .returning();
    return updated || null;
  }

  async deleteCategoryFilter(id: string): Promise<boolean> {
    const result = await db.delete(categoryFilters).where(eq(categoryFilters.id, id)).returning();
    return result.length > 0;
  }

  // Category Filter Options - Filter value options
  async createCategoryFilterOption(option: InsertCategoryFilterOption): Promise<CategoryFilterOption> {
    const [newOption] = await db.insert(categoryFilterOptions).values({
      ...option,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newOption;
  }

  async getCategoryFilterOptions(filterId: string): Promise<CategoryFilterOption[]> {
    return db.select().from(categoryFilterOptions)
      .where(and(eq(categoryFilterOptions.filterId, filterId), eq(categoryFilterOptions.isActive, true)))
      .orderBy(asc(categoryFilterOptions.sortOrder));
  }

  async getCategoryFilterOptionById(id: string): Promise<CategoryFilterOption | null> {
    const [option] = await db.select().from(categoryFilterOptions).where(eq(categoryFilterOptions.id, id)).limit(1);
    return option || null;
  }

  async updateCategoryFilterOption(id: string, updates: Partial<InsertCategoryFilterOption>): Promise<CategoryFilterOption | null> {
    const [updated] = await db.update(categoryFilterOptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(categoryFilterOptions.id, id))
      .returning();
    return updated || null;
  }

  async deleteCategoryFilterOption(id: string): Promise<boolean> {
    const result = await db.delete(categoryFilterOptions).where(eq(categoryFilterOptions.id, id)).returning();
    return result.length > 0;
  }

  // Carts - User shopping carts
  async createCart(cart: { userId: string }): Promise<Cart> {
    const [newCart] = await db.insert(carts).values({
      userId: cart.userId,
    }).returning();
    return newCart;
  }

  async getCartByUserId(userId: string): Promise<Cart | null> {
    const [cart] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
    return cart || null;
  }

  async getCartById(id: string): Promise<Cart | null> {
    const [cart] = await db.select().from(carts).where(eq(carts.id, id)).limit(1);
    return cart || null;
  }

  async getOrCreateCartByUserId(userId: string): Promise<Cart> {
    const existing = await this.getCartByUserId(userId);
    if (existing) return existing;
    return await this.createCart({ userId });
  }

  async clearCart(cartId: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.cartId, cartId)).returning();
    return result.length > 0;
  }

  async deleteCart(cartId: string): Promise<boolean> {
    // First delete all cart items
    await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
    // Then delete the cart
    const result = await db.delete(carts).where(eq(carts.id, cartId)).returning();
    return result.length > 0;
  }

  // Cart Items - Items within shopping carts
  async addCartItem(cartItem: { cartId: string; productId: string; quantity: number }): Promise<CartItem> {
    // Get product price for priceAtAdd
    const { products } = await import('../shared/schema.js');
    const [product] = await db.select({ price: products.price }).from(products).where(eq(products.id, cartItem.productId)).limit(1);
    
    if (!product) {
      throw new Error('Product not found');
    }

    // Check if item already exists in cart
    const existing = await this.getCartItem(cartItem.cartId, cartItem.productId);
    
    if (existing) {
      // Update quantity instead of creating new item
      const updated = await this.updateCartItemQuantity(cartItem.cartId, cartItem.productId, existing.quantity + cartItem.quantity);
      return updated!;
    }

    const [newCartItem] = await db.insert(cartItems).values({
      cartId: cartItem.cartId,
      productId: cartItem.productId,
      quantity: cartItem.quantity,
      priceAtAdd: product.price,
    }).returning();
    return newCartItem;
  }

  async getCartItems(cartId: string): Promise<CartItem[]> {
    return await db.select().from(cartItems).where(eq(cartItems.cartId, cartId)).orderBy(desc(cartItems.createdAt));
  }

  async getCartItem(cartId: string, productId: string): Promise<CartItem | null> {
    const [item] = await db.select().from(cartItems)
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)))
      .limit(1);
    return item || null;
  }

  async updateCartItemQuantity(cartId: string, productId: string, quantity: number): Promise<CartItem | null> {
    if (quantity <= 0) {
      await this.removeCartItem(cartId, productId);
      return null;
    }

    const [updatedItem] = await db.update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)))
      .returning();
    return updatedItem || null;
  }

  async removeCartItem(cartId: string, productId: string): Promise<boolean> {
    const result = await db.delete(cartItems)
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)))
      .returning();
    return result.length > 0;
  }

  async getCartItemCount(cartId: string): Promise<number> {
    const [result] = await db.select({ count: sql`sum(${cartItems.quantity})` })
      .from(cartItems)
      .where(eq(cartItems.cartId, cartId));
    return Number(result.count) || 0;
  }

  // Order Items - Individual items within orders (for multi-item orders)
  async createOrderItem(orderItem: { orderId: string; productId: string; quantity: number; unitPrice: number }): Promise<OrderItem> {
    const totalPrice = (orderItem.unitPrice * orderItem.quantity).toString();
    const [newOrderItem] = await db.insert(orderItems).values({
      orderId: orderItem.orderId,
      productId: orderItem.productId,
      quantity: orderItem.quantity,
      unitPrice: orderItem.unitPrice.toString(),
      totalPrice: totalPrice,
      price: orderItem.unitPrice.toString(),
    }).returning();
    return newOrderItem;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async getOrderItem(orderItemId: string): Promise<OrderItem | null> {
    const [item] = await db.select().from(orderItems).where(eq(orderItems.id, orderItemId)).limit(1);
    return item || null;
  }

  async updateOrderItem(orderItemId: string, updates: Partial<{ quantity: number; unitPrice: number }>): Promise<OrderItem | null> {
    const updateData: any = {};
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
    if (updates.unitPrice !== undefined) updateData.price = updates.unitPrice.toString();
    
    const [updatedItem] = await db.update(orderItems)
      .set(updateData)
      .where(eq(orderItems.id, orderItemId))
      .returning();
    return updatedItem || null;
  }

  async deleteOrderItem(orderItemId: string): Promise<boolean> {
    const result = await db.delete(orderItems).where(eq(orderItems.id, orderItemId)).returning();
    return result.length > 0;
  }

  // Replit Auth User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  async getReplitUser(id: string): Promise<ReplitUser | undefined> {
    const [user] = await db.select().from(replitUsers).where(eq(replitUsers.id, id));
    return user;
  }

  async upsertReplitUser(userData: UpsertReplitUser): Promise<ReplitUser> {
    const [user] = await db
      .insert(replitUsers)
      .values(userData)
      .onConflictDoUpdate({
        target: replitUsers.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Portfolio Works - Behance-like showcase system
  async createWork(work: InsertWork): Promise<Work> {
    const [newWork] = await db.insert(works).values({
      ...work,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newWork;
  }

  async getWorks(options: { userId?: string; page?: number; limit?: number; tags?: string[]; search?: string; visibility?: 'public' | 'unlisted' | 'private'; category?: string } = {}): Promise<{ works: any[]; total: number }> {
    const { userId, page = 1, limit = 20, tags, search, visibility, category } = options;
    const conditions = [];

    if (userId) {
      conditions.push(eq(works.userId, userId));
    }

    if (visibility) {
      conditions.push(eq(works.visibility, visibility));
    } else {
      // Default to only public works if no specific visibility filter
      conditions.push(eq(works.visibility, 'public'));
    }

    if (category) {
      conditions.push(eq(works.category, category));
    }

    if (tags && tags.length > 0) {
      // Filter by tags array overlap
      conditions.push(sql`${works.tags} && ${tags}`);
    }

    if (search) {
      conditions.push(sql`(${works.title} ILIKE ${`%${search}%`} OR ${works.description} ILIKE ${`%${search}%`})`);
    }

    const offset = (page - 1) * limit;
    
    console.log('🔍 Portfolio query filters:', { userId, category, tags, search, visibility, conditionsCount: conditions.length });
    
    const [workResults, countResult] = await Promise.all([
      db.select({
        id: works.id,
        userId: works.userId,
        title: works.title,
        description: works.description,
        category: works.category,
        tags: works.tags,
        visibility: works.visibility,
        viewsCount: works.viewsCount,
        likesCount: works.likesCount,
        createdAt: works.createdAt,
        updatedAt: works.updatedAt,
        user: {
          id: profiles.userId,
          name: profiles.name,
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
          bio: profiles.bio,
          rating: sql<number>`0`,
          reviewCount: sql<number>`0`,
          verificationBadge: profiles.verificationBadge,
        }
      })
        .from(works)
        .leftJoin(profiles, eq(works.userId, profiles.userId))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(works.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(works)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
    ]);

    console.log('🔍 Portfolio query results:', { count: workResults.length, total: countResult[0].count, firstWorkCategory: workResults[0]?.category });

    return {
      works: workResults,
      total: countResult[0].count
    };
  }

  async getWorkById(id: string): Promise<Work | null> {
    const [work] = await db.select().from(works).where(eq(works.id, id)).limit(1);
    return work || null;
  }

  async getWorkWithMedia(id: string): Promise<{ work: Work; media: WorkMedia[]; owner: { name: string; avatarUrl?: string } } | null> {
    const work = await this.getWorkById(id);
    if (!work) return null;

    const [media, ownerResult] = await Promise.all([
      this.getWorkMedia(id),
      db.select({ name: sql<string>`name`, avatarUrl: sql<string>`avatar_url` })
        .from(sql`profiles`)
        .where(sql`user_id = ${work.userId}`)
        .limit(1)
    ]);

    const owner = ownerResult[0] || { name: 'Unknown User' };

    return { work, media, owner };
  }

  async updateWork(id: string, updates: Partial<InsertWork>): Promise<Work | null> {
    const [updatedWork] = await db.update(works)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(works.id, id))
      .returning();
    return updatedWork || null;
  }

  async deleteWork(id: string): Promise<boolean> {
    const result = await db.delete(works).where(eq(works.id, id)).returning();
    return result.length > 0;
  }

  // Work Media - Images, videos, YouTube embeds
  async createWorkMedia(media: InsertWorkMedia[]): Promise<WorkMedia[]> {
    if (media.length === 0) return [];
    const results = await db.insert(workMedia).values(media.map(m => ({ 
      ...m, 
      createdAt: new Date() 
    }))).returning();
    return results;
  }

  async getWorkMedia(workId: string): Promise<WorkMedia[]> {
    return await db.select().from(workMedia)
      .where(eq(workMedia.workId, workId))
      .orderBy(asc(workMedia.sortOrder), asc(workMedia.createdAt));
  }

  async updateWorkMedia(id: string, updates: Partial<InsertWorkMedia>): Promise<WorkMedia | null> {
    const [updated] = await db.update(workMedia)
      .set(updates)
      .where(eq(workMedia.id, id))
      .returning();
    return updated || null;
  }

  async deleteWorkMedia(id: string): Promise<boolean> {
    const result = await db.delete(workMedia).where(eq(workMedia.id, id)).returning();
    return result.length > 0;
  }

  // Work Likes - Heart/like functionality
  async toggleWorkLike(workId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    // Get work owner info
    const [work] = await db.select({ 
      userId: works.userId, 
      title: works.title 
    })
      .from(works)
      .where(eq(works.id, workId))
      .limit(1);

    // Check if like already exists
    const [existingLike] = await db.select().from(workLikes)
      .where(and(eq(workLikes.workId, workId), eq(workLikes.userId, userId)))
      .limit(1);

    if (existingLike) {
      // Remove like
      await db.delete(workLikes)
        .where(and(eq(workLikes.workId, workId), eq(workLikes.userId, userId)));
      
      // Decrement count
      await db.update(works)
        .set({ likesCount: sql`${works.likesCount} - 1` })
        .where(eq(works.id, workId));

      const [updatedWork] = await db.select({ likesCount: works.likesCount }).from(works)
        .where(eq(works.id, workId)).limit(1);

      return { liked: false, likesCount: updatedWork?.likesCount || 0 };
    } else {
      // Add like
      await db.insert(workLikes).values({
        workId,
        userId,
        createdAt: new Date()
      });

      // Increment count
      await db.update(works)
        .set({ likesCount: sql`${works.likesCount} + 1` })
        .where(eq(works.id, workId));

      const [updatedWork] = await db.select({ likesCount: works.likesCount }).from(works)
        .where(eq(works.id, workId)).limit(1);

      // Create notification for work owner (only when liking, not unliking)
      if (work && work.userId !== userId) {
        // Get liker's name
        const [liker] = await db.select({ name: profiles.name })
          .from(profiles)
          .where(eq(profiles.userId, userId))
          .limit(1);

        await db.insert(notifications).values({
          userId: work.userId,
          title: 'New Like',
          message: `${liker?.name || 'Someone'} liked your work "${work.title}"`,
          type: 'info',
          actionUrl: `/work/${workId}`,
          isRead: false,
          createdAt: new Date()
        });
      }

      return { liked: true, likesCount: updatedWork?.likesCount || 1 };
    }
  }

  async getWorkLikes(workId: string, options: { limit?: number; offset?: number } = {}): Promise<WorkLike[]> {
    const { limit = 50, offset = 0 } = options;
    return await db.select().from(workLikes)
      .where(eq(workLikes.workId, workId))
      .orderBy(desc(workLikes.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getUserLikedWorks(userId: string, options: { limit?: number; offset?: number } = {}): Promise<Work[]> {
    const { limit = 20, offset = 0 } = options;
    const results = await db.select({
      id: works.id,
      userId: works.userId,
      title: works.title,
      description: works.description,
      tags: works.tags,
      coverMediaId: works.coverMediaId,
      visibility: works.visibility,
      likesCount: works.likesCount,
      commentsCount: works.commentsCount,
      viewsCount: works.viewsCount,
      createdAt: works.createdAt,
      updatedAt: works.updatedAt,
    })
      .from(works)
      .innerJoin(workLikes, eq(workLikes.workId, works.id))
      .where(eq(workLikes.userId, userId))
      .orderBy(desc(workLikes.createdAt))
      .limit(limit)
      .offset(offset);

    return results as Work[];
  }

  // Work Comments - Comment and reply system
  async createWorkComment(comment: InsertWorkComment): Promise<WorkComment> {
    // Get work owner info
    const [work] = await db.select({ 
      userId: works.userId, 
      title: works.title 
    })
      .from(works)
      .where(eq(works.id, comment.workId))
      .limit(1);

    const [newComment] = await db.insert(workComments).values({
      ...comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Increment comments count
    await db.update(works)
      .set({ commentsCount: sql`${works.commentsCount} + 1` })
      .where(eq(works.id, comment.workId));

    // Create notification for work owner (don't notify yourself)
    if (work && work.userId !== comment.userId) {
      // Get commenter's name
      const [commenter] = await db.select({ name: profiles.name })
        .from(profiles)
        .where(eq(profiles.userId, comment.userId))
        .limit(1);

      await db.insert(notifications).values({
        userId: work.userId,
        title: 'New Comment',
        message: `${commenter?.name || 'Someone'} commented on your work "${work.title}"`,
        type: 'info',
        actionUrl: `/work/${comment.workId}`,
        isRead: false,
        createdAt: new Date()
      });
    }

    return newComment;
  }

  async getWorkComments(workId: string, options: { limit?: number; offset?: number; parentId?: string } = {}): Promise<WorkComment[]> {
    const { limit = 50, offset = 0, parentId } = options;
    const conditions = [eq(workComments.workId, workId)];

    if (parentId) {
      conditions.push(eq(workComments.parentId, parentId));
    } else {
      conditions.push(isNull(workComments.parentId));
    }

    return await db.select().from(workComments)
      .where(and(...conditions))
      .orderBy(asc(workComments.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updateWorkComment(id: string, updates: Partial<InsertWorkComment>): Promise<WorkComment | null> {
    const [updated] = await db.update(workComments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workComments.id, id))
      .returning();
    return updated || null;
  }

  async deleteWorkComment(id: string): Promise<boolean> {
    const [comment] = await db.select().from(workComments).where(eq(workComments.id, id)).limit(1);
    if (!comment) return false;

    const result = await db.delete(workComments).where(eq(workComments.id, id)).returning();
    
    if (result.length > 0) {
      // Decrement comments count
      await db.update(works)
        .set({ commentsCount: sql`${works.commentsCount} - 1` })
        .where(eq(works.id, comment.workId));
      return true;
    }
    return false;
  }

  // Work Views - View tracking and analytics
  async recordWorkView(workId: string, userId?: string, sessionId?: string, ipHash?: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    try {
      // Try to insert view record - will fail if duplicate due to unique constraints
      await db.insert(workViews).values({
        workId,
        userId: userId || null,
        sessionId: sessionId || null,
        ipHash: ipHash || null,
        viewDate: today,
        createdAt: new Date()
      });

      // Increment view count
      await db.update(works)
        .set({ viewsCount: sql`${works.viewsCount} + 1` })
        .where(eq(works.id, workId));

      return true;
    } catch (error) {
      // View already recorded for today - ignore duplicate
      return false;
    }
  }

  async getWorkViews(workId: string): Promise<number> {
    const [result] = await db.select({ viewsCount: works.viewsCount })
      .from(works)
      .where(eq(works.id, workId))
      .limit(1);
    return result?.viewsCount || 0;
  }

  async getWorkViewsAnalytics(workId: string, period: 'day' | 'week' | 'month' = 'week'): Promise<{ views: number; uniqueViews: number }> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const [result] = await db.select({
      views: sql<number>`count(*)`,
      uniqueViews: sql<number>`count(distinct coalesce(${workViews.userId}, ${workViews.sessionId}))`
    })
      .from(workViews)
      .where(and(
        eq(workViews.workId, workId),
        sql`${workViews.createdAt} >= ${startDate}`
      ));

    return {
      views: result?.views || 0,
      uniqueViews: result?.uniqueViews || 0
    };
  }

  // Profile Statistics - Views, likes, follows tracking
  async getProfileStats(profileId: string, viewerUserId?: string): Promise<{ views: number; likes: number; followers: number; likedByMe?: boolean; followingByMe?: boolean }> {
    // Get profile user ID
    const [profile] = await db.select({
      userId: profiles.userId
    }).from(profiles).where(eq(profiles.id, profileId)).limit(1);

    if (!profile) {
      return { views: 0, likes: 0, followers: 0 };
    }

    // Count ONLY real data from tracking tables using raw SQL
    const result = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM profile_views WHERE profile_id = ${profileId})::int as "profileViews",
        (SELECT COUNT(*) FROM profile_likes WHERE profile_id = ${profileId})::int as "realProfileLikes",
        (SELECT COUNT(*) FROM profile_boost_likes WHERE profile_id = ${profileId})::int as "boostedProfileLikes",
        (SELECT COUNT(*) FROM profile_follows WHERE profile_id = ${profileId})::int as "realFollowers",
        (SELECT COUNT(*) FROM profile_boost_followers WHERE profile_id = ${profileId})::int as "boostedFollowers",
        (SELECT COUNT(DISTINCT wv.id) FROM work_views wv 
         INNER JOIN works w ON w.id = wv.work_id 
         WHERE w.user_id = ${profile.userId})::int as "portfolioViews",
        (SELECT COUNT(*) FROM work_likes wl 
         INNER JOIN works w ON w.id = wl.work_id 
         WHERE w.user_id = ${profile.userId})::int as "portfolioLikes",
        (SELECT COUNT(*) FROM showcase_project_boost_likes spbl
         INNER JOIN works w ON w.id = spbl.showcase_project_id
         WHERE w.user_id = ${profile.userId})::int as "portfolioBoostLikes",
        (SELECT COALESCE(boost_views_count, 0) FROM profiles WHERE id = ${profileId})::int as "boostViews"
    `);
    
    const counts = (result as any)[0] as any;

    // Calculate totals from ONLY real tracking data + admin boosts
    const stats: any = {
      views: (Number(counts?.profileViews) || 0) + (Number(counts?.portfolioViews) || 0) + (Number(counts?.boostViews) || 0),
      likes: (Number(counts?.realProfileLikes) || 0) + (Number(counts?.boostedProfileLikes) || 0) + (Number(counts?.portfolioLikes) || 0) + (Number(counts?.portfolioBoostLikes) || 0),
      followers: (Number(counts?.realFollowers) || 0) + (Number(counts?.boostedFollowers) || 0)
    };

    // Check if viewer has liked/followed this profile
    if (viewerUserId) {
      const [likeStatus, followStatus] = await Promise.all([
        db.select().from(profileLikes).where(and(
          eq(profileLikes.profileId, profileId),
          eq(profileLikes.userId, viewerUserId)
        )).limit(1),
        db.select().from(profileFollows).where(and(
          eq(profileFollows.profileId, profileId),
          eq(profileFollows.followerUserId, viewerUserId)
        )).limit(1)
      ]);

      stats.likedByMe = likeStatus.length > 0;
      stats.followingByMe = followStatus.length > 0;
    }

    return stats;
  }

  async recordProfileView(profileId: string, viewData: { viewerUserId?: string; visitorId?: string; sessionId?: string; ipHash?: string; uaHash?: string; referer?: string }): Promise<boolean> {
    try {
      // For deduplication - check if this view was already recorded in the last 30 minutes
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      // Check for existing recent view based on available identifiers
      let existingView = null;
      if (viewData.viewerUserId) {
        // Authenticated user - dedupe by user
        [existingView] = await db.select().from(profileViews).where(and(
          eq(profileViews.profileId, profileId),
          eq(profileViews.viewerUserId, viewData.viewerUserId),
          sql`created_at > ${thirtyMinutesAgo.toISOString()}`
        )).limit(1);
      } else if (viewData.visitorId) {
        // Anonymous user with visitor ID
        [existingView] = await db.select().from(profileViews).where(and(
          eq(profileViews.profileId, profileId),
          eq(profileViews.visitorId, viewData.visitorId),
          sql`created_at > ${thirtyMinutesAgo.toISOString()}`
        )).limit(1);
      } else if (viewData.ipHash) {
        // Fallback to IP hash
        [existingView] = await db.select().from(profileViews).where(and(
          eq(profileViews.profileId, profileId),
          eq(profileViews.ipHash, viewData.ipHash),
          sql`created_at > ${thirtyMinutesAgo.toISOString()}`
        )).limit(1);
      }

      // If recent view exists, don't record again
      if (existingView) {
        return false;
      }

      // Record the view in a transaction to ensure consistency
      await db.transaction(async (tx) => {
        // Insert view record
        await tx.insert(profileViews).values({
          profileId,
          viewerUserId: viewData.viewerUserId || null,
          visitorId: viewData.visitorId || null,
          sessionId: viewData.sessionId || null,
          ipHash: viewData.ipHash || null,
          uaHash: viewData.uaHash || null,
          referer: viewData.referer || null,
          createdAt: sql`now()`
        });

        // Increment profile view count
        await tx.update(profiles)
          .set({ 
            profileViews: sql`COALESCE(profile_views, 0) + 1`,
            updatedAt: sql`now()`
          })
          .where(eq(profiles.id, profileId));
      });

      return true;
    } catch (error) {
      console.error('Error recording profile view:', error);
      return false;
    }
  }

  async toggleProfileLike(profileId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    return await db.transaction(async (tx) => {
      // Get profile owner info
      const [targetProfile] = await tx.select({ 
        userId: profiles.userId, 
        name: profiles.name 
      })
        .from(profiles)
        .where(eq(profiles.id, profileId))
        .limit(1);

      // Check if like exists
      const [existingLike] = await tx.select().from(profileLikes).where(and(
        eq(profileLikes.profileId, profileId),
        eq(profileLikes.userId, userId)
      )).limit(1);

      let liked: boolean;
      let likesCount: number;

      if (existingLike) {
        // Remove like
        await tx.delete(profileLikes).where(and(
          eq(profileLikes.profileId, profileId),
          eq(profileLikes.userId, userId)
        ));

        // Decrement count
        await tx.update(profiles)
          .set({ 
            likesCount: sql`GREATEST(COALESCE(likes_count, 0) - 1, 0)`,
            updatedAt: sql`now()`
          })
          .where(eq(profiles.id, profileId));

        liked = false;
      } else {
        // Add like
        await tx.insert(profileLikes).values({
          profileId,
          userId,
          createdAt: sql`now()`
        });

        // Increment count
        await tx.update(profiles)
          .set({ 
            likesCount: sql`COALESCE(likes_count, 0) + 1`,
            updatedAt: sql`now()`
          })
          .where(eq(profiles.id, profileId));

        liked = true;

        // Create notification for profile owner (only when liking, not unliking)
        if (targetProfile && targetProfile.userId !== userId) {
          // Get liker's name
          const [liker] = await tx.select({ name: profiles.name })
            .from(profiles)
            .where(eq(profiles.userId, userId))
            .limit(1);

          await tx.insert(notifications).values({
            userId: targetProfile.userId,
            title: 'New Like',
            message: `${liker?.name || 'Someone'} liked your profile`,
            type: 'info',
            actionUrl: `/freelancer/${targetProfile.userId}`,
            isRead: false,
            createdAt: new Date()
          });
        }
      }

      // Get updated count
      const [profile] = await tx.select({ likesCount: profiles.likesCount })
        .from(profiles)
        .where(eq(profiles.id, profileId))
        .limit(1);

      likesCount = profile?.likesCount || 0;

      return { liked, likesCount };
    });
  }

  async toggleProfileFollow(profileId: string, followerUserId: string): Promise<{ following: boolean; followersCount: number }> {
    return await db.transaction(async (tx) => {
      // Get profile owner info
      const [targetProfile] = await tx.select({ 
        userId: profiles.userId, 
        name: profiles.name 
      })
        .from(profiles)
        .where(eq(profiles.id, profileId))
        .limit(1);

      // Check if follow exists
      const [existingFollow] = await tx.select().from(profileFollows).where(and(
        eq(profileFollows.profileId, profileId),
        eq(profileFollows.followerUserId, followerUserId)
      )).limit(1);

      let following: boolean;
      let followersCount: number;

      if (existingFollow) {
        // Remove follow
        await tx.delete(profileFollows).where(and(
          eq(profileFollows.profileId, profileId),
          eq(profileFollows.followerUserId, followerUserId)
        ));

        // Decrement count
        await tx.update(profiles)
          .set({ 
            followersCount: sql`GREATEST(COALESCE(followers_count, 0) - 1, 0)`,
            updatedAt: sql`now()`
          })
          .where(eq(profiles.id, profileId));

        following = false;
      } else {
        // Add follow
        await tx.insert(profileFollows).values({
          profileId,
          followerUserId,
          createdAt: sql`now()`
        });

        // Increment count
        await tx.update(profiles)
          .set({ 
            followersCount: sql`COALESCE(followers_count, 0) + 1`,
            updatedAt: sql`now()`
          })
          .where(eq(profiles.id, profileId));

        following = true;

        // Create notification for profile owner (only when following, not unfollowing)
        if (targetProfile && targetProfile.userId !== followerUserId) {
          // Get follower's name
          const [follower] = await tx.select({ name: profiles.name })
            .from(profiles)
            .where(eq(profiles.userId, followerUserId))
            .limit(1);

          await tx.insert(notifications).values({
            userId: targetProfile.userId,
            title: 'New Follower',
            message: `${follower?.name || 'Someone'} started following you`,
            type: 'info',
            actionUrl: `/freelancer/${targetProfile.userId}`,
            isRead: false,
            createdAt: new Date()
          });
        }
      }

      // Get updated count
      const [profile] = await tx.select({ followersCount: profiles.followersCount })
        .from(profiles)
        .where(eq(profiles.id, profileId))
        .limit(1);

      followersCount = profile?.followersCount || 0;

      return { following, followersCount };
    });
  }

  // Featured Users - Admin-controlled featured creators
  async toggleFeaturedStatus(userId: string, adminUserId: string): Promise<{ isFeatured: boolean }> {
    return await db.transaction(async (tx) => {
      // Get current profile
      const [profile] = await tx.select({ 
        id: profiles.id, 
        isFeatured: profiles.isFeatured 
      })
        .from(profiles)
        .where(eq(profiles.userId, userId))
        .limit(1);

      if (!profile) {
        throw new Error('Profile not found');
      }

      const newFeaturedStatus = !profile.isFeatured;

      // Update featured status
      await tx.update(profiles)
        .set({ 
          isFeatured: newFeaturedStatus,
          featuredAt: newFeaturedStatus ? sql`now()` : null,
          updatedAt: sql`now()`
        })
        .where(eq(profiles.id, profile.id));

      return { isFeatured: newFeaturedStatus };
    });
  }

  // Profile Boost - Admin vanity metrics
  async addProfileBoostLikes(profileId: string, count: number): Promise<{ added: number }> {
    const randomNames = [
      'Alex Johnson', 'Sarah Williams', 'Michael Chen', 'Emily Davis', 'James Martinez',
      'Jessica Brown', 'David Lee', 'Lisa Anderson', 'Robert Taylor', 'Maria Garcia',
      'John Wilson', 'Ashley Moore', 'William Jackson', 'Jennifer Thompson', 'Christopher White',
      'Amanda Harris', 'Daniel Martin', 'Michelle Robinson', 'Matthew Clark', 'Laura Lewis',
      'Andrew Walker', 'Stephanie Hall', 'Joshua Allen', 'Karen Young', 'Ryan King',
      'Elizabeth Wright', 'Brandon Lopez', 'Rebecca Hill', 'Nicholas Scott', 'Nicole Green',
      'Tyler Adams', 'Samantha Baker', 'Kevin Nelson', 'Rachel Carter', 'Eric Mitchell',
      'Hannah Perez', 'Austin Roberts', 'Lauren Turner', 'Jacob Phillips', 'Megan Campbell',
      'Alexander Parker', 'Brittany Evans', 'Jonathan Edwards', 'Katherine Collins', 'Justin Stewart',
      'Victoria Sanchez', 'Aaron Morris', 'Danielle Rogers', 'Benjamin Reed', 'Kimberly Cook'
    ];

    // Get the userId for this profile
    const [profile] = await db.select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.id, profileId))
      .limit(1);

    if (!profile) {
      throw new Error('Profile not found');
    }

    const boostLikes: InsertProfileBoostLike[] = [];
    for (let i = 0; i < count; i++) {
      const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
      boostLikes.push({
        profileId,
        displayName: randomName,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(randomName)}&background=random`
      });
    }

    await db.insert(profileBoostLikes).values(boostLikes);

    // Calculate boost views - 80% more views than likes (1.8x multiplier)
    const viewsBoost = Math.ceil(count * 1.8);

    await db.update(profiles)
      .set({
        likesCount: sql`COALESCE(likes_count, 0) + ${count}`,
        boostViewsCount: sql`COALESCE(boost_views_count, 0) + ${viewsBoost}`,
        updatedAt: sql`now()`
      })
      .where(eq(profiles.id, profileId));

    // Create notification for the freelancer using the first actual boost entry
    if (count > 0 && boostLikes.length > 0) {
      const firstPersonName = boostLikes[0].displayName;
      let notificationMessage = '';
      
      if (count === 1) {
        notificationMessage = `${firstPersonName} liked your profile`;
      } else if (count === 2) {
        notificationMessage = `${firstPersonName} and 1 other liked your profile`;
      } else {
        notificationMessage = `${firstPersonName} and ${(count - 1).toLocaleString()} others liked your profile`;
      }

      await db.insert(notifications).values({
        userId: profile.userId,
        title: 'Profile Likes',
        message: notificationMessage,
        type: 'info',
        isRead: false
      });
    }

    return { added: count };
  }

  async addProfileBoostFollowers(profileId: string, count: number): Promise<{ added: number }> {
    const randomNames = [
      'Alex Johnson', 'Sarah Williams', 'Michael Chen', 'Emily Davis', 'James Martinez',
      'Jessica Brown', 'David Lee', 'Lisa Anderson', 'Robert Taylor', 'Maria Garcia',
      'John Wilson', 'Ashley Moore', 'William Jackson', 'Jennifer Thompson', 'Christopher White',
      'Amanda Harris', 'Daniel Martin', 'Michelle Robinson', 'Matthew Clark', 'Laura Lewis',
      'Andrew Walker', 'Stephanie Hall', 'Joshua Allen', 'Karen Young', 'Ryan King',
      'Elizabeth Wright', 'Brandon Lopez', 'Rebecca Hill', 'Nicholas Scott', 'Nicole Green',
      'Tyler Adams', 'Samantha Baker', 'Kevin Nelson', 'Rachel Carter', 'Eric Mitchell',
      'Hannah Perez', 'Austin Roberts', 'Lauren Turner', 'Jacob Phillips', 'Megan Campbell',
      'Alexander Parker', 'Brittany Evans', 'Jonathan Edwards', 'Katherine Collins', 'Justin Stewart',
      'Victoria Sanchez', 'Aaron Morris', 'Danielle Rogers', 'Benjamin Reed', 'Kimberly Cook'
    ];

    // Get the userId for this profile
    const [profile] = await db.select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.id, profileId))
      .limit(1);

    if (!profile) {
      throw new Error('Profile not found');
    }

    const boostFollowers: InsertProfileBoostFollower[] = [];
    for (let i = 0; i < count; i++) {
      const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
      boostFollowers.push({
        profileId,
        displayName: randomName,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(randomName)}&background=random`
      });
    }

    await db.insert(profileBoostFollowers).values(boostFollowers);

    await db.update(profiles)
      .set({
        followersCount: sql`COALESCE(followers_count, 0) + ${count}`,
        updatedAt: sql`now()`
      })
      .where(eq(profiles.id, profileId));

    // Create notification for the freelancer using the first actual boost entry
    if (count > 0 && boostFollowers.length > 0) {
      const firstPersonName = boostFollowers[0].displayName;
      let notificationMessage = '';
      
      if (count === 1) {
        notificationMessage = `${firstPersonName} followed you`;
      } else if (count === 2) {
        notificationMessage = `${firstPersonName} and 1 other followed you`;
      } else {
        notificationMessage = `${firstPersonName} and ${(count - 1).toLocaleString()} others followed you`;
      }

      await db.insert(notifications).values({
        userId: profile.userId,
        title: 'New Followers',
        message: notificationMessage,
        type: 'info',
        isRead: false
      });
    }

    return { added: count };
  }

  async getProfileBoostLikesCount(profileId: string): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)::int` })
      .from(profileBoostLikes)
      .where(eq(profileBoostLikes.profileId, profileId));
    return result?.count || 0;
  }

  async getProfileBoostFollowersCount(profileId: string): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)::int` })
      .from(profileBoostFollowers)
      .where(eq(profileBoostFollowers.profileId, profileId));
    return result?.count || 0;
  }

  async getProfileBoostLikes(profileId: string, options?: { limit?: number; offset?: number }): Promise<ProfileBoostLike[]> {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    return await db.select()
      .from(profileBoostLikes)
      .where(eq(profileBoostLikes.profileId, profileId))
      .orderBy(desc(profileBoostLikes.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getProfileBoostFollowers(profileId: string, options?: { limit?: number; offset?: number }): Promise<ProfileBoostFollower[]> {
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    return await db.select()
      .from(profileBoostFollowers)
      .where(eq(profileBoostFollowers.profileId, profileId))
      .orderBy(desc(profileBoostFollowers.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // Showcase Project Boost - Admin vanity metrics for individual works
  async addShowcaseProjectBoostLikes(showcaseProjectId: string, count: number): Promise<{ added: number }> {
    const randomNames = [
      'Alex Johnson', 'Sarah Williams', 'Michael Chen', 'Emily Davis', 'James Martinez',
      'Jessica Brown', 'David Lee', 'Lisa Anderson', 'Robert Taylor', 'Maria Garcia',
      'John Wilson', 'Ashley Moore', 'William Jackson', 'Jennifer Thompson', 'Christopher White',
      'Amanda Harris', 'Daniel Martin', 'Michelle Robinson', 'Matthew Clark', 'Laura Lewis',
      'Andrew Walker', 'Stephanie Hall', 'Joshua Allen', 'Karen Young', 'Ryan King',
      'Elizabeth Wright', 'Brandon Lopez', 'Rebecca Hill', 'Nicholas Scott', 'Nicole Green',
      'Tyler Adams', 'Samantha Baker', 'Kevin Nelson', 'Rachel Carter', 'Eric Mitchell',
      'Hannah Perez', 'Austin Roberts', 'Lauren Turner', 'Jacob Phillips', 'Megan Campbell',
      'Alexander Parker', 'Brittany Evans', 'Jonathan Edwards', 'Katherine Collins', 'Justin Stewart',
      'Victoria Sanchez', 'Aaron Morris', 'Danielle Rogers', 'Benjamin Reed', 'Kimberly Cook'
    ];

    const boostLikes: InsertShowcaseProjectBoostLike[] = [];
    for (let i = 0; i < count; i++) {
      const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
      boostLikes.push({
        showcaseProjectId,
        displayName: randomName,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(randomName)}&background=random`
      });
    }

    await db.insert(showcaseProjectBoostLikes).values(boostLikes);

    // Calculate views boost - 50% more views than likes (1.5x multiplier for realistic ratios)
    const viewsBoost = Math.ceil(count * 1.5);

    await db.update(works)
      .set({
        likesCount: sql`COALESCE(likes_count, 0) + ${count}`,
        viewsCount: sql`COALESCE(views_count, 0) + ${viewsBoost}`,
        updatedAt: sql`now()`
      })
      .where(eq(works.id, showcaseProjectId));

    return { added: count };
  }

  async getShowcaseProjectBoostLikesCount(showcaseProjectId: string): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)::int` })
      .from(showcaseProjectBoostLikes)
      .where(eq(showcaseProjectBoostLikes.showcaseProjectId, showcaseProjectId));
    return result?.count || 0;
  }

  async addShowcaseProjectBoostComments(showcaseProjectId: string, count: number): Promise<{ added: number }> {
    const syntheticCommenters = [
      { name: 'Wei Zhang 张伟', role: 'Designer' },
      { name: 'Yuki Tanaka 田中ゆき', role: 'Art Director' },
      { name: 'Mohammed Al-Rashid محمد', role: 'Creative Lead' },
      { name: 'Ana Silva', role: 'Brand Strategist' },
      { name: 'Олександр Петренко', role: 'Visual Artist' },
      { name: 'Pierre Dubois', role: 'UX Designer' },
      { name: 'Priya Sharma प्रिया', role: 'Illustrator' },
      { name: 'Carlos Mendoza', role: 'Graphic Designer' },
      { name: 'Fatima Hassan فاطمة', role: 'Product Designer' },
      { name: 'Lars Nielsen', role: 'Creative Director' },
      { name: 'Mei Lin 林美', role: 'Motion Designer' },
      { name: 'Ahmed Khalil أحمد', role: 'Web Designer' },
      { name: 'Isabella Rossi', role: 'Brand Designer' },
      { name: 'Hiroshi Sato 佐藤浩', role: 'Art Director' },
      { name: 'Sofía García', role: 'UI Designer' },
      { name: 'Dmitry Ivanov Дмитрий', role: '3D Artist' },
      { name: 'Nina Müller', role: 'Photographer' },
      { name: 'João Santos', role: 'Creative' },
      { name: 'Aisha Osman عائشة', role: 'Illustrator' },
      { name: 'Luca Ferrari', role: 'Designer' },
      { name: 'Anastasia Volkov Анастасия', role: 'Animator' },
      { name: 'Kenji Yamamoto 山本健二', role: 'Art Director' },
      { name: 'Camila Fernández', role: 'Visual Designer' },
      { name: 'Raj Patel राज', role: 'Creative Lead' },
      { name: 'Emma Andersson', role: 'Brand Strategist' },
      { name: 'Li Na 李娜', role: 'Designer' },
      { name: 'Miguel Torres', role: 'UX Designer' },
      { name: 'Youssef Ben Ali يوسف', role: 'Illustrator' },
      { name: 'Karolina Nowak', role: 'Graphic Designer' },
      { name: 'Park Min-Jun 박민준', role: 'Creative Director' },
      { name: 'Gabriela Santos', role: 'Motion Designer' },
      { name: 'Anton Schmidt', role: 'Web Designer' },
      { name: 'Sakura Takahashi 高橋さくら', role: 'Brand Designer' },
      { name: 'Hassan Ali حسن', role: 'Art Director' },
      { name: 'Julia Kowalski', role: 'UI Designer' },
      { name: 'Chen Wei 陈伟', role: '3D Artist' },
      { name: 'Natasha Sokolov Наташа', role: 'Photographer' },
      { name: 'Diego Ramírez', role: 'Creative' },
      { name: 'Kim Ji-Woo 김지우', role: 'Illustrator' },
      { name: 'Marco Bianchi', role: 'Designer' }
    ];

    const realisticComments = [
      // Enthusiastic (with !)
      "Incredible work! The attention to detail is outstanding.",
      "Amazing execution!",
      "Love the composition.",
      "Perfect color palette.",
      "Really inspiring work.",
      "Outstanding quality.",
      "Love every detail.",
      "So clean and polished.",
      "This deserves more recognition.",
      "The creativity shines through.",
      "Absolutely stunning work.",
      "Great job on this!",
      "The technical skill is evident.",
      "Love the modern aesthetic.",
      "This stands out.",
      "Top tier quality!",
      "The vision is crystal clear.",
      "Beautiful execution!",
      
      // Questions (engaging)
      "What software did you use for this?",
      "How long did this take?",
      "Is this available for purchase?",
      "Can I hire you for a project?",
      "What inspired this design?",
      "Are you available for freelance work?",
      "Do you have a tutorial for this?",
      "What fonts are these?",
      "Where can I see more of your work?",
      "Is this part of a larger project?",
      "How did you achieve this effect?",
      "What's your design process like?",
      
      // Short statements (no !)
      "Love this",
      "So good",
      "Beautiful work",
      "Very clean",
      "Nice touch",
      "Well done",
      "Impressive",
      "Clean design",
      "Great use of color",
      "Perfect balance",
      "Love the typography",
      "Nice composition",
      "Really well executed",
      "Solid work",
      "Great concept",
      "Love the details",
      "Very professional",
      "Beautifully done",
      "Amazing work",
      "So inspiring",
      
      // Longer thoughtful comments
      "The attention to detail here is remarkable. Every element feels intentional.",
      "This is exactly the kind of work that pushes the industry forward. Well done.",
      "Really appreciate how you balanced creativity with functionality here.",
      "The color harmony is perfect. This is going straight into my inspiration folder.",
      "Love how cohesive everything feels. You clearly have a strong visual identity.",
      "This captures the mood perfectly. The lighting choices are spot on.",
      "The composition guides the eye beautifully through the entire piece.",
      "Phenomenal execution. The professionalism really shows.",
      "This is portfolio worthy material. Impressive craftsmanship.",
      "Beautiful storytelling through design. Each element serves a purpose.",
      
      // Multilingual (shorter)
      "太棒了",
      "素晴らしい",
      "Bellissimo",
      "Très bien",
      "Excelente",
      "Perfekt",
      "Прекрасно",
      "رائع",
      "完美",
      "Maravilhoso",
      "멋져요",
      "Ottimo",
      "Hermoso",
      "Fantastisch",
      "Wunderbar"
    ];

    const boostComments: InsertShowcaseProjectBoostComment[] = [];
    const nowMs = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    
    // Queue-based comment selection to guarantee no duplicates until pool exhausted
    let commentPool = [...realisticComments];
    
    // Shuffle the comment pool for variety
    for (let i = commentPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [commentPool[i], commentPool[j]] = [commentPool[j], commentPool[i]];
    }
    
    for (let i = 0; i < count; i++) {
      // Random commenter from synthetic pool
      const commenter = syntheticCommenters[Math.floor(Math.random() * syntheticCommenters.length)];
      
      // Draw next comment from pool, refill and shuffle when depleted
      if (commentPool.length === 0) {
        commentPool = [...realisticComments];
        // Reshuffle
        for (let j = commentPool.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [commentPool[j], commentPool[k]] = [commentPool[k], commentPool[j]];
        }
      }
      const comment = commentPool.pop()!;
      
      // Generate random timestamp within last 30 days using millisecond offset
      const randomOffsetMs = Math.floor(Math.random() * thirtyDaysMs);
      const randomTimestamp = new Date(nowMs - randomOffsetMs);
      
      // 60% chance of having avatar, 40% no avatar for variety
      const hasAvatar = Math.random() > 0.4;
      const avatarUrl = hasAvatar 
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(commenter.name)}&background=random`
        : null;
      
      boostComments.push({
        showcaseProjectId,
        displayName: commenter.name,
        avatarUrl,
        content: comment,
        boostFlag: true,
        createdAt: randomTimestamp
      });
    }

    // Insert boost comments
    await db.insert(showcaseProjectBoostComments).values(boostComments);

    // Update work comments count
    await db.update(works)
      .set({
        commentsCount: sql`COALESCE(comments_count, 0) + ${count}`,
        updatedAt: sql`now()`
      })
      .where(eq(works.id, showcaseProjectId));

    return { added: count };
  }

  async getShowcaseProjectBoostCommentsCount(showcaseProjectId: string): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)::int` })
      .from(showcaseProjectBoostComments)
      .where(eq(showcaseProjectBoostComments.showcaseProjectId, showcaseProjectId));
    return result?.count || 0;
  }

  async getShowcaseProjects(freelancerId: string): Promise<ShowcaseProject[]> {
    const worksData = await db.select()
      .from(works)
      .where(eq(works.userId, freelancerId))
      .orderBy(desc(works.createdAt));
    
    return worksData.map(work => ({
      id: work.id,
      freelancerId: work.userId,
      title: work.title,
      description: work.description || '',
      media: null,
      tags: work.tags || [],
      status: 'approved' as const,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      viewCount: work.viewsCount,
      likeCount: work.likesCount,
      createdAt: work.createdAt,
      updatedAt: work.updatedAt
    }));
  }

  async addWorkBoostLikes(workId: string, count: number): Promise<{ added: number; boostLikesCount: number; boostViewsCount: number }> {
    const randomNames = [
      'Alex Johnson', 'Sarah Williams', 'Michael Chen', 'Emily Davis', 'James Martinez',
      'Jessica Brown', 'David Lee', 'Lisa Anderson', 'Robert Taylor', 'Maria Garcia',
      'John Wilson', 'Ashley Moore', 'William Jackson', 'Jennifer Thompson', 'Christopher White',
      'Amanda Harris', 'Daniel Martin', 'Michelle Robinson', 'Matthew Clark', 'Laura Lewis',
      'Andrew Walker', 'Stephanie Hall', 'Joshua Allen', 'Karen Young', 'Ryan King'
    ];

    const viewsBoost = Math.round(count * 1.8);

    // Get work details including userId and title
    const [work] = await db.select({
      userId: works.userId,
      title: works.title
    })
      .from(works)
      .where(eq(works.id, workId))
      .limit(1);

    if (!work) {
      throw new Error('Work not found');
    }

    const [result] = await db
      .update(works)
      .set({
        boostLikesCount: sql`COALESCE(${works.boostLikesCount}, 0) + ${count}`,
        boostViewsCount: sql`COALESCE(${works.boostViewsCount}, 0) + ${viewsBoost}`,
        updatedAt: sql`now()`
      })
      .where(eq(works.id, workId))
      .returning({
        boostLikesCount: works.boostLikesCount,
        boostViewsCount: works.boostViewsCount,
      });

    if (!result) {
      throw new Error('Work not found');
    }

    // Create notification for the freelancer using a realistic name
    if (count > 0) {
      const firstPersonName = randomNames[Math.floor(Math.random() * randomNames.length)];
      let notificationMessage = '';
      
      if (count === 1) {
        notificationMessage = `${firstPersonName} liked your work "${work.title}"`;
      } else if (count === 2) {
        notificationMessage = `${firstPersonName} and 1 other liked your work "${work.title}"`;
      } else {
        notificationMessage = `${firstPersonName} and ${(count - 1).toLocaleString()} others liked your work "${work.title}"`;
      }

      await db.insert(notifications).values({
        userId: work.userId,
        title: 'Work Likes',
        message: notificationMessage,
        type: 'info',
        isRead: false
      });
    }

    return {
      added: count,
      boostLikesCount: result.boostLikesCount,
      boostViewsCount: result.boostViewsCount,
    };
  }

  async getWorkBoostStats(workId: string): Promise<{ boostLikesCount: number; boostViewsCount: number }> {
    const [result] = await db
      .select({
        boostLikesCount: works.boostLikesCount,
        boostViewsCount: works.boostViewsCount,
      })
      .from(works)
      .where(eq(works.id, workId))
      .limit(1);

    if (!result) {
      throw new Error('Work not found');
    }

    return {
      boostLikesCount: result.boostLikesCount || 0,
      boostViewsCount: result.boostViewsCount || 0,
    };
  }

  async getFeaturedUsers(limit: number = 10): Promise<any[]> {
    const featuredProfiles = await db.select({
      id: profiles.id,
      userId: users.userId,
      name: profiles.name,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      coverImageUrl: profiles.coverImageUrl,
      professionalTitle: profiles.professionalTitle,
      tagline: profiles.tagline,
      location: profiles.location,
      skills: profiles.skills,
      yearsOfExperience: profiles.yearsOfExperience,
      averageRating: profiles.averageRating,
      completedProjects: profiles.completedProjects,
      clientReviews: profiles.clientReviews,
      verificationBadge: profiles.verificationBadge,
      featuredAt: profiles.featuredAt,
      profileViews: profiles.profileViews,
      likesCount: profiles.likesCount,
      followersCount: profiles.followersCount,
    })
      .from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(eq(profiles.isFeatured, true))
      .orderBy(desc(profiles.featuredAt))
      .limit(limit);

    return featuredProfiles;
  }

  // Product Likes - Heart/like functionality for products
  async toggleProductLike(productId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    try {
      // Verify product exists and get owner info
      const [product] = await db.select({ 
        id: products.id, 
        sellerId: products.sellerId,
        name: products.name 
      })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);
      
      if (!product) {
        throw new Error(`Product with id ${productId} not found`);
      }

      return await db.transaction(async (tx) => {
        // Use INSERT ON CONFLICT for atomic toggle
        const insertResult = await tx.insert(productLikes)
          .values({ productId, userId, createdAt: new Date() })
          .onConflictDoNothing({ target: [productLikes.productId, productLikes.userId] })
          .returning({ id: productLikes.id });

        const wasInserted = insertResult.length > 0;
        
        if (!wasInserted) {
          // Already existed, so remove it (unlike)
          await tx.delete(productLikes)
            .where(and(eq(productLikes.productId, productId), eq(productLikes.userId, userId)));
        }

        // Update count atomically using current count from database
        const [updatedProduct] = await tx.update(products)
          .set({ 
            likesCount: wasInserted 
              ? sql`${products.likesCount} + 1`
              : sql`GREATEST(${products.likesCount} - 1, 0)` // Prevent negative counts
          })
          .where(eq(products.id, productId))
          .returning({ likesCount: products.likesCount });

        // Create notification for product owner (only when liking, not unliking)
        if (wasInserted && product.sellerId !== userId) {
          // Get liker's name
          const [liker] = await tx.select({ name: profiles.name })
            .from(profiles)
            .where(eq(profiles.userId, userId))
            .limit(1);

          await tx.insert(notifications).values({
            userId: product.sellerId,
            title: 'New Like',
            message: `${liker?.name || 'Someone'} liked your product "${product.name}"`,
            type: 'info',
            actionUrl: `/product/${productId}`,
            isRead: false,
            createdAt: new Date()
          });
        }

        return { 
          liked: wasInserted, 
          likesCount: updatedProduct?.likesCount || 0 
        };
      });
    } catch (error) {
      console.error('Error toggling product like:', error);
      throw error;
    }
  }

  async getProductLikes(productId: string, options: { limit?: number; offset?: number } = {}): Promise<Array<{ userId: string; userName: string; avatarUrl?: string; createdAt: Date }>> {
    const { limit = 50, offset = 0 } = options;
    
    const likes = await db.select({
      userId: productLikes.userId,
      userName: profiles.name,
      avatarUrl: profiles.avatarUrl,
      createdAt: productLikes.createdAt,
    })
      .from(productLikes)
      .innerJoin(profiles, eq(productLikes.userId, profiles.userId))
      .where(eq(productLikes.productId, productId))
      .orderBy(desc(productLikes.createdAt))
      .limit(limit)
      .offset(offset);

    return likes.map(like => ({
      ...like,
      avatarUrl: like.avatarUrl || undefined,
    }));
  }

  async getUserLikedProducts(userId: string, options: { limit?: number; offset?: number } = {}): Promise<string[]> {
    const { limit = 50, offset = 0 } = options;
    
    const likes = await db.select({ productId: productLikes.productId })
      .from(productLikes)
      .where(eq(productLikes.userId, userId))
      .orderBy(desc(productLikes.createdAt))
      .limit(limit)
      .offset(offset);

    return likes.map(like => like.productId);
  }

  async getProductLikeStats(productId: string, viewerUserId?: string): Promise<{ likesCount: number; likedByMe: boolean; likedBy: Array<{ userId: string; userName: string; avatarUrl?: string }> }> {
    try {
      // Get actual count from likes table to ensure accuracy
      const [countResult] = await db.select({ count: sql<number>`count(*)::int` })
        .from(productLikes)
        .where(eq(productLikes.productId, productId));

      const likesCount = countResult?.count || 0;

      // Check if viewer liked this product
      let likedByMe = false;
      if (viewerUserId) {
        const [viewerLike] = await db.select()
          .from(productLikes)
          .where(and(eq(productLikes.productId, productId), eq(productLikes.userId, viewerUserId)))
          .limit(1);
        likedByMe = !!viewerLike;
      }

      // Get recent likers (first 5)
      const likedBy = await this.getProductLikes(productId, { limit: 5 });

      return {
        likesCount,
        likedByMe,
        likedBy: likedBy.map(like => ({
          userId: like.userId,
          userName: like.userName,
          avatarUrl: like.avatarUrl,
        })),
      };
    } catch (error) {
      console.error('Error getting product like stats:', error);
      throw error;
    }
  }

  // Product Follows - Follow the product seller/creator
  async toggleProductFollow(sellerId: string, followerId: string): Promise<{ following: boolean; followersCount: number }> {
    try {
      // Verify seller profile exists
      const [sellerProfile] = await db.select({ userId: profiles.userId })
        .from(profiles)
        .where(eq(profiles.userId, sellerId))
        .limit(1);
      
      if (!sellerProfile) {
        throw new Error(`Seller profile with id ${sellerId} not found`);
      }

      return await db.transaction(async (tx) => {
        // Use INSERT ON CONFLICT for atomic toggle
        const insertResult = await tx.insert(productFollows)
          .values({ sellerId, followerId, createdAt: new Date() })
          .onConflictDoNothing({ target: [productFollows.sellerId, productFollows.followerId] })
          .returning({ id: productFollows.id });

        const wasInserted = insertResult.length > 0;
        
        if (!wasInserted) {
          // Already existed, so remove it (unfollow)
          await tx.delete(productFollows)
            .where(and(eq(productFollows.sellerId, sellerId), eq(productFollows.followerId, followerId)));
        }

        // Update count atomically using current count from database
        const [updatedProfile] = await tx.update(profiles)
          .set({ 
            followersCount: wasInserted 
              ? sql`${profiles.followersCount} + 1`
              : sql`GREATEST(${profiles.followersCount} - 1, 0)` // Prevent negative counts
          })
          .where(eq(profiles.userId, sellerId))
          .returning({ followersCount: profiles.followersCount });

        return { 
          following: wasInserted, 
          followersCount: updatedProfile?.followersCount || 0 
        };
      });
    } catch (error) {
      console.error('Error toggling product follow:', error);
      throw error;
    }
  }

  async getProductFollows(sellerId: string, options: { limit?: number; offset?: number } = {}): Promise<Array<{ userId: string; userName: string; avatarUrl?: string; createdAt: Date }>> {
    const { limit = 50, offset = 0 } = options;
    
    const follows = await db.select({
      userId: productFollows.followerId,
      userName: profiles.name,
      avatarUrl: profiles.avatarUrl,
      createdAt: productFollows.createdAt,
    })
      .from(productFollows)
      .innerJoin(profiles, eq(productFollows.followerId, profiles.userId))
      .where(eq(productFollows.sellerId, sellerId))
      .orderBy(desc(productFollows.createdAt))
      .limit(limit)
      .offset(offset);

    return follows.map(follow => ({
      ...follow,
      avatarUrl: follow.avatarUrl || undefined,
    }));
  }

  async getUserFollowedSellers(userId: string, options: { limit?: number; offset?: number } = {}): Promise<string[]> {
    const { limit = 50, offset = 0 } = options;
    
    const follows = await db.select({ sellerId: productFollows.sellerId })
      .from(productFollows)
      .where(eq(productFollows.followerId, userId))
      .orderBy(desc(productFollows.createdAt))
      .limit(limit)
      .offset(offset);

    return follows.map(follow => follow.sellerId);
  }

  async getSellerFollowStats(sellerId: string, viewerUserId?: string): Promise<{ followersCount: number; followingByMe: boolean; followers: Array<{ userId: string; userName: string; avatarUrl?: string }> }> {
    try {
      // Get actual count from follows table to ensure accuracy
      const [countResult] = await db.select({ count: sql<number>`count(*)::int` })
        .from(productFollows)
        .where(eq(productFollows.sellerId, sellerId));

      const followersCount = countResult?.count || 0;

      // Check if viewer follows this seller
      let followingByMe = false;
      if (viewerUserId) {
        const [viewerFollow] = await db.select()
          .from(productFollows)
          .where(and(eq(productFollows.sellerId, sellerId), eq(productFollows.followerId, viewerUserId)))
          .limit(1);
        followingByMe = !!viewerFollow;
      }

      // Get recent followers (first 5)
      const followers = await this.getProductFollows(sellerId, { limit: 5 });

      return {
        followersCount,
        followingByMe,
        followers: followers.map(follow => ({
          userId: follow.userId,
          userName: follow.userName,
          avatarUrl: follow.avatarUrl,
        })),
      };
    } catch (error) {
      console.error('Error getting seller follow stats:', error);
      throw error;
    }
  }

  // Featured Products - Admin-controlled featured products for landing page
  async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    try {
      const featuredProducts = await db.select()
        .from(products)
        .where(and(eq(products.featured, true), eq(products.status, 'approved')))
        .orderBy(desc(products.featuredAt))
        .limit(limit);
      
      return featuredProducts;
    } catch (error) {
      console.error('Error getting featured products:', error);
      throw error;
    }
  }

  async toggleProductFeaturedStatus(productId: string, isFeatured: boolean, adminUserId?: string): Promise<Product | null> {
    try {
      const updateData: any = {
        featured: isFeatured,
        updatedAt: new Date(),
      };

      if (isFeatured) {
        updateData.featuredAt = new Date();
      } else {
        updateData.featuredAt = null;
      }

      const [updatedProduct] = await db.update(products)
        .set(updateData)
        .where(eq(products.id, productId))
        .returning();

      return updatedProduct || null;
    } catch (error) {
      console.error('Error toggling product featured status:', error);
      throw error;
    }
  }

  // Pending Shop Signups - Email verification before account creation
  async createPendingShopSignup(data: { email: string; fullName: string; passwordHash: string; verificationCode: string; expiresAt: Date }) {
    const [newSignup] = await db.insert(pendingShopSignups).values(data).returning();
    return newSignup;
  }

  async getPendingShopSignup(email: string) {
    const [signup] = await db.select().from(pendingShopSignups).where(eq(pendingShopSignups.email, email)).limit(1);
    return signup || null;
  }

  async getPendingShopSignupByToken(token: string) {
    const [signup] = await db.select().from(pendingShopSignups).where(eq(pendingShopSignups.verificationCode, token)).limit(1);
    return signup || null;
  }

  async updatePendingShopSignupCode(email: string, verificationCode: string, expiresAt: Date) {
    const [updated] = await db.update(pendingShopSignups)
      .set({ verificationCode, expiresAt })
      .where(eq(pendingShopSignups.email, email))
      .returning();
    return updated || null;
  }

  async deletePendingShopSignup(email: string): Promise<boolean> {
    const result = await db.delete(pendingShopSignups).where(eq(pendingShopSignups.email, email));
    return true;
  }

  // Customer Dashboard - Shop customers
  async createShopCustomer(customer: { userId: string; fullName: string; email: string }) {
    const [newCustomer] = await db.insert(shopCustomers).values({
      userId: customer.userId,
      fullName: customer.fullName,
      email: customer.email,
      accountType: 'free',
      walletBalance: '0.00',
    }).returning();
    return newCustomer;
  }

  async getShopCustomerByUserId(userId: string) {
    const [customer] = await db.select().from(shopCustomers).where(eq(shopCustomers.userId, userId)).limit(1);
    return customer || null;
  }

  async updateShopCustomer(customerId: string, updates: any) {
    const [updated] = await db.update(shopCustomers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(shopCustomers.id, customerId))
      .returning();
    return updated || null;
  }

  async updateWalletBalance(customerId: string, amount: number) {
    const [updated] = await db.update(shopCustomers)
      .set({ 
        walletBalance: sql`${shopCustomers.walletBalance} + ${amount}`,
        updatedAt: new Date() 
      })
      .where(eq(shopCustomers.id, customerId))
      .returning();
    return updated || null;
  }

  // Customer Dashboard - Purchases
  async createShopPurchase(purchase: any) {
    const [newPurchase] = await db.insert(shopPurchases).values(purchase).returning();
    return newPurchase;
  }

  async getShopPurchasesByCustomerId(customerId: string) {
    return await db.select().from(shopPurchases)
      .where(eq(shopPurchases.customerId, customerId))
      .orderBy(desc(shopPurchases.createdAt));
  }

  async getShopPurchaseById(id: string) {
    const [purchase] = await db.select().from(shopPurchases).where(eq(shopPurchases.id, id)).limit(1);
    return purchase || null;
  }

  // Customer Dashboard - Ads
  async createShopAd(ad: any) {
    const [newAd] = await db.insert(shopAds).values(ad).returning();
    return newAd;
  }

  async getShopAdsByCustomerId(customerId: string) {
    return await db.select().from(shopAds)
      .where(eq(shopAds.customerId, customerId))
      .orderBy(desc(shopAds.createdAt));
  }

  async getShopAdById(id: string) {
    const [ad] = await db.select().from(shopAds).where(eq(shopAds.id, id)).limit(1);
    return ad || null;
  }

  async updateShopAd(id: string, updates: any) {
    const [updated] = await db.update(shopAds)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(shopAds.id, id))
      .returning();
    return updated || null;
  }

  async deleteShopAd(id: string): Promise<boolean> {
    const result = await db.delete(shopAds).where(eq(shopAds.id, id)).returning();
    return result.length > 0;
  }

  // Customer Dashboard - Memberships
  async createShopMembership(membership: any) {
    const [newMembership] = await db.insert(shopMemberships).values(membership).returning();
    return newMembership;
  }

  async getShopMembershipByCustomerId(customerId: string) {
    const [membership] = await db.select().from(shopMemberships)
      .where(eq(shopMemberships.customerId, customerId))
      .limit(1);
    return membership || null;
  }

  async updateShopMembership(id: string, updates: any) {
    const [updated] = await db.update(shopMemberships)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(shopMemberships.id, id))
      .returning();
    return updated || null;
  }

  // Customer Dashboard - Transactions
  async createShopTransaction(transaction: any) {
    const [newTransaction] = await db.insert(shopTransactions).values(transaction).returning();
    return newTransaction;
  }

  async getShopTransactionsByCustomerId(customerId: string) {
    return await db.select().from(shopTransactions)
      .where(eq(shopTransactions.customerId, customerId))
      .orderBy(desc(shopTransactions.createdAt));
  }

  async getShopTransactionById(id: string) {
    const [transaction] = await db.select().from(shopTransactions).where(eq(shopTransactions.id, id)).limit(1);
    return transaction || null;
  }

  // Customer Dashboard - Support Tickets
  async createShopSupportTicket(ticket: any) {
    const [newTicket] = await db.insert(shopSupportTickets).values(ticket).returning();
    return newTicket;
  }

  async getShopSupportTicketsByCustomerId(customerId: string) {
    return await db.select().from(shopSupportTickets)
      .where(eq(shopSupportTickets.customerId, customerId))
      .orderBy(desc(shopSupportTickets.createdAt));
  }

  async getAllShopSupportTickets() {
    return await db.select().from(shopSupportTickets)
      .orderBy(desc(shopSupportTickets.createdAt));
  }

  async getShopSupportTicketById(id: string) {
    const [ticket] = await db.select().from(shopSupportTickets).where(eq(shopSupportTickets.id, id)).limit(1);
    return ticket || null;
  }

  async updateShopSupportTicket(id: string, updates: any) {
    const [updated] = await db.update(shopSupportTickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(shopSupportTickets.id, id))
      .returning();
    return updated || null;
  }

  async deleteShopSupportTicket(id: string): Promise<boolean> {
    const result = await db.delete(shopSupportTickets).where(eq(shopSupportTickets.id, id)).returning();
    return result.length > 0;
  }

  // Customer Dashboard - Vouchers
  async createVoucher(voucher: any) {
    const [newVoucher] = await db.insert(shopVouchers).values({
      ...voucher,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newVoucher;
  }

  async createBulkVouchers(vouchers: any[]) {
    const vouchersWithTimestamps = vouchers.map(v => ({
      ...v,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    const newVouchers = await db.insert(shopVouchers).values(vouchersWithTimestamps).returning();
    return newVouchers;
  }

  async updateVoucherEmailStatus(voucherId: string, emailSent: boolean) {
    await db.update(shopVouchers)
      .set({ 
        emailSent,
        emailSentAt: emailSent ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(shopVouchers.id, voucherId));
  }

  async getVouchers() {
    return await db.select().from(shopVouchers)
      .orderBy(desc(shopVouchers.createdAt));
  }

  async getVoucherByCode(code: string) {
    const [voucher] = await db.select().from(shopVouchers)
      .where(eq(shopVouchers.code, code))
      .limit(1);
    return voucher || null;
  }

  async deleteVoucher(id: string): Promise<boolean> {
    const result = await db.delete(shopVouchers).where(eq(shopVouchers.id, id)).returning();
    return result.length > 0;
  }

  async deleteAllVouchers(): Promise<number> {
    const result = await db.delete(shopVouchers).returning();
    return result.length;
  }

  async redeemVoucher(voucherId: string, customerId: string, amount: string) {
    const [redemption] = await db.insert(shopVoucherRedemptions).values({
      voucherId,
      customerId,
      amount,
      redeemedAt: new Date(),
    }).returning();
    
    // Get the voucher to check if it should be deactivated
    const [voucher] = await db.select().from(shopVouchers)
      .where(eq(shopVouchers.id, voucherId))
      .limit(1);
    
    if (voucher) {
      const newRedemptionCount = (voucher.currentRedemptions || 0) + 1;
      const shouldDeactivate = voucher.maxRedemptions && newRedemptionCount >= voucher.maxRedemptions;
      
      await db.update(shopVouchers)
        .set({ 
          currentRedemptions: newRedemptionCount,
          isActive: shouldDeactivate ? false : voucher.isActive,
          updatedAt: new Date()
        })
        .where(eq(shopVouchers.id, voucherId));
    }
    
    return redemption;
  }

  async getVoucherRedemptions(voucherId?: string) {
    if (voucherId) {
      return await db.select().from(shopVoucherRedemptions)
        .where(eq(shopVoucherRedemptions.voucherId, voucherId))
        .orderBy(desc(shopVoucherRedemptions.redeemedAt));
    }
    return await db.select().from(shopVoucherRedemptions)
      .orderBy(desc(shopVoucherRedemptions.redeemedAt));
  }

  // Voucher fraud prevention
  async recordFailedVoucherAttempt(customerId: string, userId: string, attemptedCode: string, ipAddress?: string) {
    await db.insert(shopVoucherFailedAttempts).values({
      customerId,
      userId,
      attemptedCode,
      ipAddress: ipAddress || null,
    });
  }

  async getRecentFailedAttempts(customerId: string, hoursBack: number): Promise<number> {
    const hoursAgo = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
    const result = await db.select({ count: sql<number>`count(*)::int` })
      .from(shopVoucherFailedAttempts)
      .where(and(
        eq(shopVoucherFailedAttempts.customerId, customerId),
        sql`${shopVoucherFailedAttempts.attemptedAt} >= ${hoursAgo}`
      ));
    return result[0]?.count || 0;
  }

  async isUserBlockedFromVouchers(customerId: string): Promise<boolean> {
    const recentAttempts = await this.getRecentFailedAttempts(customerId, 3);
    return recentAttempts >= 3;
  }

  // Customer Dashboard - Statistics
  async getCustomerDashboardStats(customerId: string) {
    // First, get the customer to find their userId
    const [customer] = await db.select().from(shopCustomers)
      .where(eq(shopCustomers.id, customerId))
      .limit(1);
    
    if (!customer) {
      return {
        totalPurchases: 0,
        activeAds: 0,
        walletBalance: '0.00',
        membership: null
      };
    }
    
    // Run all queries in parallel for better performance
    const [purchaseResult, shopAdsResult, bannerAdsResult, membershipResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` })
        .from(shopPurchases)
        .where(eq(shopPurchases.customerId, customerId)),
      
      db.select({ count: sql<number>`count(*)::int` })
        .from(shopAds)
        .where(and(
          eq(shopAds.customerId, customerId),
          eq(shopAds.status, 'running')
        )),
      
      // Also count banner ads linked to this user's userId
      db.select({ count: sql<number>`count(*)::int` })
        .from(adsBanners)
        .where(and(
          eq(adsBanners.userId, customer.userId),
          sql`${adsBanners.status} IN ('approved', 'pending')`
        )),
      
      // Get membership information
      db.select()
        .from(shopMemberships)
        .leftJoin(shopMembershipPlans, eq(shopMemberships.plan, shopMembershipPlans.planId))
        .where(eq(shopMemberships.customerId, customerId))
        .limit(1)
    ]);
    
    const [purchaseCount] = purchaseResult;
    const [shopAdsCount] = shopAdsResult;
    const [bannerAdsCount] = bannerAdsResult;
    const membershipData = membershipResult[0];
    
    // Combine shop ads and banner ads counts
    const totalActiveAds = (shopAdsCount?.count || 0) + (bannerAdsCount?.count || 0);
    
    let membershipInfo = null;
    if (membershipData && membershipData.shop_memberships && membershipData.shop_membership_plans) {
      const membership = membershipData.shop_memberships;
      const plan = membershipData.shop_membership_plans;
      
      membershipInfo = {
        plan: membership.plan,
        planName: plan.name,
        billingCycle: membership.billingCycle,
        dailyDownloadsUsed: membership.dailyDownloadsUsed || 0,
        dailyDownloadLimit: plan.dailyDownloadLimit,
        monthlyPaidDownloadsUsed: membership.monthlyPaidDownloadsUsed || 0,
        monthlyPaidDownloadLimit: plan.monthlyPaidDownloadLimit,
        adsCreatedThisMonth: membership.adsCreatedThisMonth || 0,
        adLimit: plan.annualAdLimit,
        adDurations: plan.adDurations
      };
    }
    
    return {
      totalPurchases: purchaseCount?.count || 0,
      activeAds: totalActiveAds,
      walletBalance: customer?.walletBalance || '0.00',
      membership: membershipInfo
    };
  }

  // Admin Settings - API Keys and configurations
  async createAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting> {
    const [newSetting] = await db.insert(adminSettings).values({
      ...setting,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newSetting;
  }

  async getAdminSettings(category?: string): Promise<AdminSetting[]> {
    if (category) {
      return await db.select().from(adminSettings)
        .where(eq(adminSettings.category, category))
        .orderBy(asc(adminSettings.settingKey));
    }
    return await db.select().from(adminSettings)
      .orderBy(asc(adminSettings.category), asc(adminSettings.settingKey));
  }

  async getAdminSetting(key: string): Promise<AdminSetting | null> {
    const [setting] = await db.select().from(adminSettings)
      .where(eq(adminSettings.settingKey, key))
      .limit(1);
    return setting || null;
  }

  async updateAdminSetting(key: string, value: string, updatedBy?: string): Promise<AdminSetting | null> {
    const [updated] = await db.update(adminSettings)
      .set({ 
        settingValue: value,
        updatedBy: updatedBy,
        updatedAt: new Date()
      })
      .where(eq(adminSettings.settingKey, key))
      .returning();
    return updated || null;
  }

  async deleteAdminSetting(key: string): Promise<boolean> {
    const result = await db.delete(adminSettings)
      .where(eq(adminSettings.settingKey, key))
      .returning();
    return result.length > 0;
  }

  // Payment Gateways - Payment provider configurations
  async createPaymentGateway(gateway: InsertPaymentGateway): Promise<PaymentGateway> {
    const [newGateway] = await db.insert(paymentGateways).values({
      ...gateway,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newGateway;
  }

  async getPaymentGateways(enabledOnly?: boolean): Promise<PaymentGateway[]> {
    if (enabledOnly) {
      return await db.select().from(paymentGateways)
        .where(eq(paymentGateways.isEnabled, true))
        .orderBy(desc(paymentGateways.isPrimary), asc(paymentGateways.gatewayName));
    }
    return await db.select().from(paymentGateways)
      .orderBy(desc(paymentGateways.isPrimary), asc(paymentGateways.gatewayName));
  }

  async getPaymentGateway(gatewayId: string): Promise<PaymentGateway | null> {
    const [gateway] = await db.select().from(paymentGateways)
      .where(eq(paymentGateways.gatewayId, gatewayId))
      .limit(1);
    return gateway || null;
  }

  async updatePaymentGateway(gatewayId: string, updates: Partial<InsertPaymentGateway>, updatedBy?: string): Promise<PaymentGateway | null> {
    const [updated] = await db.update(paymentGateways)
      .set({ 
        ...updates,
        updatedBy: updatedBy,
        updatedAt: new Date()
      })
      .where(eq(paymentGateways.gatewayId, gatewayId))
      .returning();
    return updated || null;
  }

  async deletePaymentGateway(gatewayId: string): Promise<boolean> {
    const result = await db.delete(paymentGateways)
      .where(eq(paymentGateways.gatewayId, gatewayId))
      .returning();
    return result.length > 0;
  }

  async getPrimaryPaymentGateway(): Promise<PaymentGateway | null> {
    const [gateway] = await db.select().from(paymentGateways)
      .where(and(
        eq(paymentGateways.isPrimary, true),
        eq(paymentGateways.isEnabled, true)
      ))
      .limit(1);
    return gateway || null;
  }

  async setPrimaryPaymentGateway(gatewayId: string): Promise<PaymentGateway | null> {
    // First, set all gateways to non-primary
    await db.update(paymentGateways)
      .set({ isPrimary: false, updatedAt: new Date() });
    
    // Then set the specified gateway as primary
    const [updated] = await db.update(paymentGateways)
      .set({ isPrimary: true, updatedAt: new Date() })
      .where(eq(paymentGateways.gatewayId, gatewayId))
      .returning();
    return updated || null;
  }

  // Certificates - Course completion certificates
  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const [newCertificate] = await db.insert(certificates).values({
      ...certificate,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newCertificate;
  }

  async getCertificateById(id: string): Promise<Certificate | null> {
    const [certificate] = await db.select().from(certificates)
      .where(eq(certificates.id, id))
      .limit(1);
    return certificate || null;
  }

  async getCertificateByVerificationCode(code: string): Promise<Certificate | null> {
    const [certificate] = await db.select().from(certificates)
      .where(eq(certificates.verificationCode, code))
      .limit(1);
    return certificate || null;
  }

  async getCertificatesByUserId(userId: string): Promise<Certificate[]> {
    return await db.select().from(certificates)
      .where(and(
        eq(certificates.userId, userId),
        eq(certificates.isRevoked, false)
      ))
      .orderBy(desc(certificates.issueDate));
  }

  async getCertificatesByCourseId(courseId: string): Promise<Certificate[]> {
    return await db.select().from(certificates)
      .where(and(
        eq(certificates.courseId, courseId),
        eq(certificates.isRevoked, false)
      ))
      .orderBy(desc(certificates.issueDate));
  }

  async updateCertificate(id: string, updates: Partial<InsertCertificate>): Promise<Certificate | null> {
    const [updated] = await db.update(certificates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(certificates.id, id))
      .returning();
    return updated || null;
  }

  async revokeCertificate(id: string, reason: string): Promise<Certificate | null> {
    const [revoked] = await db.update(certificates)
      .set({ 
        isRevoked: true, 
        revokedAt: new Date(), 
        revokedReason: reason,
        updatedAt: new Date() 
      })
      .where(eq(certificates.id, id))
      .returning();
    return revoked || null;
  }

  async checkCourseCompletion(userId: string, courseId: string): Promise<{ completed: boolean; progress: number; finalScore?: number }> {
    // Get course enrollment
    const [enrollment] = await db.select().from(courseEnrollments)
      .where(and(
        eq(courseEnrollments.userId, userId),
        eq(courseEnrollments.courseId, courseId)
      ))
      .limit(1);

    if (!enrollment) {
      return { completed: false, progress: 0 };
    }

    return {
      completed: enrollment.completedAt !== null,
      progress: enrollment.progress || 0,
      finalScore: enrollment.grade ? parseInt(enrollment.grade) : undefined
    };
  }

  async getCourseWithInstructor(courseId: string): Promise<{ title: string; description?: string; instructorName?: string; certificateType?: string } | null> {
    const [course] = await db.select().from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!course) return null;

    return {
      title: course.title,
      description: course.description || undefined,
      instructorName: course.publisherName || undefined,
      certificateType: course.certificationType || undefined
    };
  }

  async getFeaturedCourses(limit: number = 8): Promise<any[]> {
    const featuredCourses = await db.select({
      id: courses.id,
      title: courses.title,
      description: courses.description,
      thumbnailUrl: courses.thumbnailUrl,
      price: courses.price,
      difficulty: courses.difficulty,
      isFeatured: courses.isFeatured,
      authorName: profiles.name
    })
      .from(courses)
      .leftJoin(users, eq(courses.createdBy, users.id))
      .leftJoin(profiles, eq(users.id, profiles.userId))
      .where(and(
        eq(courses.isFeatured, true),
        eq(courses.isActive, true),
        eq(courses.approvalStatus, 'approved')
      ))
      .orderBy(desc(courses.featuredAt))
      .limit(limit);
    
    return featuredCourses;
  }

  async setCourseFeatured(courseId: string, isFeatured: boolean): Promise<any | null> {
    const [updatedCourse] = await db.update(courses)
      .set({
        isFeatured,
        featuredAt: isFeatured ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(courses.id, courseId))
      .returning();
    
    return updatedCourse || null;
  }
  
  // API Keys - Marketplace API access management
  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    // Note: apiKey.keyHash should already be hashed by the caller
    // apiKey.keyPreview should be the first 10 chars of the original key
    const [newKey] = await db.insert(apiKeys).values({
      ...apiKey,
      createdAt: new Date()
    }).returning();
    return newKey;
  }

  async getApiKeysByUserId(userId: string): Promise<ApiKey[]> {
    return await db.select().from(apiKeys)
      .where(and(
        eq(apiKeys.userId, userId),
        eq(apiKeys.isActive, true),
        isNull(apiKeys.revokedAt)
      ))
      .orderBy(desc(apiKeys.createdAt));
  }

  async getApiKeyByKeyHash(keyHash: string): Promise<ApiKey | null> {
    const [apiKey] = await db.select().from(apiKeys)
      .where(eq(apiKeys.keyHash, keyHash))
      .limit(1);
    return apiKey || null;
  }

  async revokeApiKey(id: string): Promise<ApiKey | null> {
    const [revokedKey] = await db.update(apiKeys)
      .set({ isActive: false, revokedAt: new Date() })
      .where(eq(apiKeys.id, id))
      .returning();
    return revokedKey || null;
  }

  async updateApiKeyLastUsed(keyHash: string): Promise<void> {
    await db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.keyHash, keyHash));
  }

  async validateApiKey(key: string): Promise<ApiKey | null> {
    // Import bcrypt for hashing
    const bcrypt = await import('bcrypt');
    
    // Get all active API keys for comparison
    const activeKeys = await db.select().from(apiKeys)
      .where(and(
        eq(apiKeys.isActive, true),
        isNull(apiKeys.revokedAt)
      ));
    
    // Find the matching key by comparing hashes
    for (const apiKey of activeKeys) {
      const isMatch = await bcrypt.compare(key, apiKey.keyHash);
      if (isMatch) {
        // Check if key is expired
        if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
          return null;
        }
        
        // Update last used timestamp
        await this.updateApiKeyLastUsed(apiKey.keyHash);
        
        return apiKey;
      }
    }
    
    return null;
  }

  // App Download Links - Mobile app store links
  async getAppDownloadLinks(): Promise<{ 
    appStoreUrl: string | null; 
    appStoreText: string | null;
    googlePlayUrl: string | null; 
    googlePlayText: string | null;
    huaweiGalleryUrl: string | null;
    huaweiGalleryText: string | null;
  }> {
    const result = await db.select().from(appDownloadLinks).where(eq(appDownloadLinks.id, 1)).limit(1);
    const row = result.length > 0 ? result[0] : null;
    
    if (!row) {
      return {
        appStoreUrl: null,
        appStoreText: 'Download on the',
        googlePlayUrl: null,
        googlePlayText: 'Get it on',
        huaweiGalleryUrl: null,
        huaweiGalleryText: 'Explore it on'
      };
    }
    
    return {
      appStoreUrl: row.appStoreUrl || null,
      appStoreText: row.appStoreText || 'Download on the',
      googlePlayUrl: row.googlePlayUrl || null,
      googlePlayText: row.googlePlayText || 'Get it on',
      huaweiGalleryUrl: row.huaweiGalleryUrl || null,
      huaweiGalleryText: row.huaweiGalleryText || 'Explore it on'
    };
  }

  async updateAppDownloadLinks(
    appStoreUrl: string, 
    appStoreText: string,
    googlePlayUrl: string, 
    googlePlayText: string,
    huaweiGalleryUrl: string,
    huaweiGalleryText: string
  ): Promise<{ 
    appStoreUrl: string; 
    appStoreText: string;
    googlePlayUrl: string; 
    googlePlayText: string;
    huaweiGalleryUrl: string;
    huaweiGalleryText: string;
  }> {
    console.log('🔄 updateAppDownloadLinks called with:', {
      appStoreUrl,
      appStoreText,
      googlePlayUrl,
      googlePlayText,
      huaweiGalleryUrl,
      huaweiGalleryText
    });
    
    try {
      await db.insert(appDownloadLinks)
        .values({
          id: 1,
          appStoreUrl,
          appStoreText,
          googlePlayUrl,
          googlePlayText,
          huaweiGalleryUrl,
          huaweiGalleryText,
        })
        .onConflictDoUpdate({
          target: appDownloadLinks.id,
          set: {
            appStoreUrl,
            appStoreText,
            googlePlayUrl,
            googlePlayText,
            huaweiGalleryUrl,
            huaweiGalleryText,
            updatedAt: new Date(),
          }
        });
      console.log('✅ Upsert successful');
    } catch (error) {
      console.error('❌ Error updating app download links:', error);
      throw error;
    }
    
    return { 
      appStoreUrl, 
      appStoreText,
      googlePlayUrl, 
      googlePlayText,
      huaweiGalleryUrl,
      huaweiGalleryText
    };
  }

  // Social Media Links - Social media profile links
  async getSocialMediaLinks(): Promise<{ 
    whatsappUrl: string | null; 
    linkedinUrl: string | null;
    instagramUrl: string | null; 
    threadsUrl: string | null;
    tiktokUrl: string | null;
    dribbbleUrl: string | null;
    facebookUrl: string | null;
    xUrl: string | null;
    pinterestUrl: string | null;
    behanceUrl: string | null;
    telegramUrl: string | null;
  }> {
    const result = await db.select().from(socialMediaLinks).where(eq(socialMediaLinks.id, 1)).limit(1);
    const row = result.length > 0 ? result[0] : null;
    
    if (!row) {
      return {
        whatsappUrl: null,
        linkedinUrl: null,
        instagramUrl: null,
        threadsUrl: null,
        tiktokUrl: null,
        dribbbleUrl: null,
        facebookUrl: null,
        xUrl: null,
        pinterestUrl: null,
        behanceUrl: null,
        telegramUrl: null
      };
    }
    
    return {
      whatsappUrl: row.whatsappUrl || null,
      linkedinUrl: row.linkedinUrl || null,
      instagramUrl: row.instagramUrl || null,
      threadsUrl: row.threadsUrl || null,
      tiktokUrl: row.tiktokUrl || null,
      dribbbleUrl: row.dribbbleUrl || null,
      facebookUrl: row.facebookUrl || null,
      xUrl: row.xUrl || null,
      pinterestUrl: row.pinterestUrl || null,
      behanceUrl: row.behanceUrl || null,
      telegramUrl: row.telegramUrl || null
    };
  }

  async updateSocialMediaLinks(
    whatsappUrl: string, 
    linkedinUrl: string,
    instagramUrl: string, 
    threadsUrl: string,
    tiktokUrl: string,
    dribbbleUrl: string,
    facebookUrl: string,
    xUrl: string,
    pinterestUrl: string,
    behanceUrl: string,
    telegramUrl: string
  ): Promise<{ 
    whatsappUrl: string; 
    linkedinUrl: string;
    instagramUrl: string; 
    threadsUrl: string;
    tiktokUrl: string;
    dribbbleUrl: string;
    facebookUrl: string;
    xUrl: string;
    pinterestUrl: string;
    behanceUrl: string;
    telegramUrl: string;
  }> {
    try {
      await db.insert(socialMediaLinks)
        .values({
          id: 1,
          whatsappUrl,
          linkedinUrl,
          instagramUrl,
          threadsUrl,
          tiktokUrl,
          dribbbleUrl,
          facebookUrl,
          xUrl,
          pinterestUrl,
          behanceUrl,
          telegramUrl,
        })
        .onConflictDoUpdate({
          target: socialMediaLinks.id,
          set: {
            whatsappUrl,
            linkedinUrl,
            instagramUrl,
            threadsUrl,
            tiktokUrl,
            dribbbleUrl,
            facebookUrl,
            xUrl,
            pinterestUrl,
            behanceUrl,
            telegramUrl,
            updatedAt: new Date(),
          }
        });
    } catch (error) {
      console.error('❌ Error updating social media links:', error);
      throw error;
    }
    
    return { 
      whatsappUrl, 
      linkedinUrl,
      instagramUrl, 
      threadsUrl,
      tiktokUrl,
      dribbbleUrl,
      facebookUrl,
      xUrl,
      pinterestUrl,
      behanceUrl,
      telegramUrl
    };
  }

  // Payment Processing - Course purchases via payment gateways
  async getAllAuthUsers(): Promise<any[]> {
    return await db.select().from(users);
  }

  async recordPurchase(purchase: {
    userId: string;
    courseId: string;
    paymentIntentId: string;
    amount: number;
    paymentMethod: string;
  }): Promise<void> {
    await db.insert(coursePurchases).values({
      userId: purchase.userId,
      courseId: purchase.courseId,
      paymentIntentId: purchase.paymentIntentId,
      amount: purchase.amount.toString(),
      currency: 'USD',
      paymentMethod: purchase.paymentMethod,
      paymentStatus: 'completed',
      purchasedAt: new Date(),
      createdAt: new Date(),
    });

    await db.insert(courseEnrollments).values({
      userId: purchase.userId,
      courseId: purchase.courseId,
      enrolledAt: new Date(),
      progress: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing();
  }

  // WhatsApp Bot
  async getWhatsAppConversations(): Promise<any[]> {
    const conversations = await db.query.whatsappConversations.findMany({
      with: {
        user: {
          with: {
            profile: true
          }
        }
      },
      orderBy: (conversations, { desc }) => [desc(conversations.updatedAt)]
    });
    return conversations;
  }

  async getWhatsAppMessages(conversationId: string): Promise<any[]> {
    const messages = await db.query.whatsappMessageLogs.findMany({
      where: (logs, { eq }) => eq(logs.conversationId, conversationId),
      orderBy: (logs, { asc }) => [asc(logs.createdAt)]
    });
    return messages;
  }

  // =====================================================
  // EMAIL MARKETING SYSTEM IMPLEMENTATIONS
  // =====================================================

  // Email Marketing Templates
  async createEmailMarketingTemplate(template: InsertEmailMarketingTemplate): Promise<EmailMarketingTemplate> {
    const [newTemplate] = await db.insert(emailMarketingTemplates).values({
      ...template,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newTemplate;
  }

  async getEmailMarketingTemplates(options?: { category?: string; activeOnly?: boolean }): Promise<EmailMarketingTemplate[]> {
    const conditions = [];
    if (options?.activeOnly) {
      conditions.push(eq(emailMarketingTemplates.isActive, true));
    }
    if (options?.category) {
      conditions.push(eq(emailMarketingTemplates.category, options.category));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(emailMarketingTemplates)
        .where(and(...conditions))
        .orderBy(desc(emailMarketingTemplates.createdAt));
    }
    return await db.select().from(emailMarketingTemplates)
      .orderBy(desc(emailMarketingTemplates.createdAt));
  }

  async getEmailMarketingTemplateById(id: string): Promise<EmailMarketingTemplate | null> {
    const [template] = await db.select().from(emailMarketingTemplates)
      .where(eq(emailMarketingTemplates.id, id)).limit(1);
    return template || null;
  }

  async updateEmailMarketingTemplate(id: string, updates: Partial<InsertEmailMarketingTemplate>): Promise<EmailMarketingTemplate | null> {
    const [updated] = await db.update(emailMarketingTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailMarketingTemplates.id, id))
      .returning();
    return updated || null;
  }

  async deleteEmailMarketingTemplate(id: string): Promise<boolean> {
    const result = await db.delete(emailMarketingTemplates)
      .where(eq(emailMarketingTemplates.id, id)).returning();
    return result.length > 0;
  }

  // Email Campaigns
  async createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign> {
    const [newCampaign] = await db.insert(emailCampaigns).values({
      ...campaign,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newCampaign;
  }

  async getEmailCampaigns(options?: { status?: string; limit?: number; offset?: number }): Promise<EmailCampaign[]> {
    let query = db.select().from(emailCampaigns);
    
    if (options?.status) {
      query = query.where(eq(emailCampaigns.status, options.status as any)) as any;
    }
    
    query = query.orderBy(desc(emailCampaigns.createdAt)) as any;
    
    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as any;
    }
    
    return await query;
  }

  async getEmailCampaignById(id: string): Promise<EmailCampaign | null> {
    const [campaign] = await db.select().from(emailCampaigns)
      .where(eq(emailCampaigns.id, id)).limit(1);
    return campaign || null;
  }

  async updateEmailCampaign(id: string, updates: Partial<InsertEmailCampaign>): Promise<EmailCampaign | null> {
    const [updated] = await db.update(emailCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailCampaigns.id, id))
      .returning();
    return updated || null;
  }

  async deleteEmailCampaign(id: string): Promise<boolean> {
    const result = await db.delete(emailCampaigns)
      .where(eq(emailCampaigns.id, id)).returning();
    return result.length > 0;
  }

  async updateCampaignStats(campaignId: string, stats: { sentCount?: number; deliveredCount?: number; openedCount?: number; clickedCount?: number; bouncedCount?: number; failedCount?: number }): Promise<EmailCampaign | null> {
    const [updated] = await db.update(emailCampaigns)
      .set({ ...stats, updatedAt: new Date() })
      .where(eq(emailCampaigns.id, campaignId))
      .returning();
    return updated || null;
  }

  // Email Preferences
  async createOrUpdateEmailPreference(preference: InsertEmailPreference): Promise<EmailPreference> {
    const existing = await this.getEmailPreferenceByUserId(preference.userId);
    
    if (existing) {
      const [updated] = await db.update(emailPreferences)
        .set({ ...preference, updatedAt: new Date() })
        .where(eq(emailPreferences.id, existing.id))
        .returning();
      return updated;
    }
    
    const [newPref] = await db.insert(emailPreferences).values({
      ...preference,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newPref;
  }

  async getEmailPreferenceByUserId(userId: string): Promise<EmailPreference | null> {
    const [pref] = await db.select().from(emailPreferences)
      .where(eq(emailPreferences.userId, userId)).limit(1);
    return pref || null;
  }

  async getEmailPreferenceByToken(token: string): Promise<EmailPreference | null> {
    const [pref] = await db.select().from(emailPreferences)
      .where(eq(emailPreferences.unsubscribeToken, token)).limit(1);
    return pref || null;
  }

  async updateEmailPreference(id: string, updates: Partial<InsertEmailPreference>): Promise<EmailPreference | null> {
    const [updated] = await db.update(emailPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailPreferences.id, id))
      .returning();
    return updated || null;
  }

  async unsubscribeByToken(token: string, reason?: string): Promise<EmailPreference | null> {
    const [updated] = await db.update(emailPreferences)
      .set({ 
        marketingOptIn: false, 
        newsletterOptIn: false, 
        productUpdatesOptIn: false, 
        promotionsOptIn: false,
        unsubscribedAt: new Date(),
        unsubscribeReason: reason,
        updatedAt: new Date() 
      })
      .where(eq(emailPreferences.unsubscribeToken, token))
      .returning();
    return updated || null;
  }

  // Campaign Deliveries
  async createCampaignDelivery(delivery: InsertCampaignDelivery): Promise<CampaignDelivery> {
    const [newDelivery] = await db.insert(campaignDeliveries).values({
      ...delivery,
      createdAt: new Date(),
    }).returning();
    return newDelivery;
  }

  async createBulkCampaignDeliveries(deliveries: InsertCampaignDelivery[]): Promise<CampaignDelivery[]> {
    if (deliveries.length === 0) return [];
    
    const deliveriesWithTimestamp = deliveries.map(d => ({
      ...d,
      createdAt: new Date(),
    }));
    
    return await db.insert(campaignDeliveries).values(deliveriesWithTimestamp).returning();
  }

  async getCampaignDeliveries(campaignId: string, options?: { status?: string; limit?: number; offset?: number }): Promise<CampaignDelivery[]> {
    const conditions = [eq(campaignDeliveries.campaignId, campaignId)];
    
    if (options?.status) {
      conditions.push(eq(campaignDeliveries.status, options.status as any));
    }
    
    let query = db.select().from(campaignDeliveries)
      .where(and(...conditions))
      .orderBy(desc(campaignDeliveries.createdAt));
    
    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }
    if (options?.offset) {
      query = query.offset(options.offset) as any;
    }
    
    return await query;
  }

  async updateCampaignDelivery(id: string, updates: Partial<CampaignDelivery>): Promise<CampaignDelivery | null> {
    const [updated] = await db.update(campaignDeliveries)
      .set(updates)
      .where(eq(campaignDeliveries.id, id))
      .returning();
    return updated || null;
  }

  async markDeliveryAsSent(id: string): Promise<CampaignDelivery | null> {
    const [updated] = await db.update(campaignDeliveries)
      .set({ status: 'sent', sentAt: new Date() })
      .where(eq(campaignDeliveries.id, id))
      .returning();
    return updated || null;
  }

  async markDeliveryAsDelivered(id: string): Promise<CampaignDelivery | null> {
    const [updated] = await db.update(campaignDeliveries)
      .set({ status: 'delivered', deliveredAt: new Date() })
      .where(eq(campaignDeliveries.id, id))
      .returning();
    return updated || null;
  }

  async markDeliveryAsOpened(id: string): Promise<CampaignDelivery | null> {
    const [updated] = await db.update(campaignDeliveries)
      .set({ openedAt: new Date() })
      .where(eq(campaignDeliveries.id, id))
      .returning();
    return updated || null;
  }

  async markDeliveryAsClicked(id: string): Promise<CampaignDelivery | null> {
    const [updated] = await db.update(campaignDeliveries)
      .set({ clickedAt: new Date() })
      .where(eq(campaignDeliveries.id, id))
      .returning();
    return updated || null;
  }

  async markDeliveryAsBounced(id: string, reason: string): Promise<CampaignDelivery | null> {
    const [updated] = await db.update(campaignDeliveries)
      .set({ status: 'bounced', bouncedAt: new Date(), bounceReason: reason })
      .where(eq(campaignDeliveries.id, id))
      .returning();
    return updated || null;
  }

  async markDeliveryAsFailed(id: string, error: string): Promise<CampaignDelivery | null> {
    const [updated] = await db.update(campaignDeliveries)
      .set({ status: 'failed', errorMessage: error })
      .where(eq(campaignDeliveries.id, id))
      .returning();
    return updated || null;
  }

  // Campaign Segments
  async createCampaignSegment(segment: InsertCampaignSegment): Promise<CampaignSegment> {
    const [newSegment] = await db.insert(campaignSegments).values({
      ...segment,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return newSegment;
  }

  async getCampaignSegments(activeOnly?: boolean): Promise<CampaignSegment[]> {
    if (activeOnly) {
      return await db.select().from(campaignSegments)
        .where(eq(campaignSegments.isActive, true))
        .orderBy(desc(campaignSegments.createdAt));
    }
    return await db.select().from(campaignSegments)
      .orderBy(desc(campaignSegments.createdAt));
  }

  async getCampaignSegmentById(id: string): Promise<CampaignSegment | null> {
    const [segment] = await db.select().from(campaignSegments)
      .where(eq(campaignSegments.id, id)).limit(1);
    return segment || null;
  }

  async updateCampaignSegment(id: string, updates: Partial<InsertCampaignSegment>): Promise<CampaignSegment | null> {
    const [updated] = await db.update(campaignSegments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(campaignSegments.id, id))
      .returning();
    return updated || null;
  }

  async deleteCampaignSegment(id: string): Promise<boolean> {
    const result = await db.delete(campaignSegments)
      .where(eq(campaignSegments.id, id)).returning();
    return result.length > 0;
  }

  // Segmentation Queries - Get users by filters for targeting
  async getEmailableUsers(filters: SegmentFilters): Promise<Array<{ userId: string; email: string; name: string; role?: string; grade?: number; subscriptionTier?: string }>> {
    const conditions: any[] = [];
    
    // Filter by roles
    if (filters.roles && filters.roles.length > 0) {
      conditions.push(inArray(profiles.role, filters.roles));
    }
    
    // Filter by grade range
    if (filters.gradeMin !== undefined) {
      conditions.push(sql`${profiles.grade} >= ${filters.gradeMin}`);
    }
    if (filters.gradeMax !== undefined) {
      conditions.push(sql`${profiles.grade} <= ${filters.gradeMax}`);
    }
    
    // Filter by subscription tiers
    if (filters.subscriptionTiers && filters.subscriptionTiers.length > 0) {
      conditions.push(inArray(profiles.subscriptionTier, filters.subscriptionTiers));
    }
    
    // Filter by countries
    if (filters.countries && filters.countries.length > 0) {
      conditions.push(inArray(profiles.country, filters.countries));
    }
    
    // Filter by completed profile
    if (filters.hasCompletedProfile !== undefined) {
      conditions.push(eq(users.hasCompletedProfile, filters.hasCompletedProfile));
    }
    
    // Exclude specific users (using parameterized query to prevent SQL injection)
    if (filters.excludeUserIds && filters.excludeUserIds.length > 0) {
      conditions.push(notInArray(users.userId, filters.excludeUserIds));
    }
    
    // Build the query
    const result = await db
      .select({
        userId: users.userId,
        email: users.email,
        name: profiles.name,
        role: profiles.role,
        grade: profiles.grade,
        subscriptionTier: profiles.subscriptionTier,
      })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(10000);
    
    return result.map(r => ({
      userId: r.userId,
      email: r.email,
      name: r.name,
      role: r.role || undefined,
      grade: r.grade,
      subscriptionTier: r.subscriptionTier || undefined,
    }));
  }

  async getSegmentEstimatedSize(filters: SegmentFilters): Promise<number> {
    const users = await this.getEmailableUsers(filters);
    return users.length;
  }
}

// In-Memory implementation for development/testing
export class MemStorage implements IStorage {
  private supportAgentsStore: Map<number, SupportAgent> = new Map();
  private helpChatSettingsStore: Map<string, HelpChatSetting> = new Map();
  private quickResponsesStore: Map<number, QuickResponse> = new Map();
  private supportChatSessionsStore: Map<string, SupportChatSession> = new Map();
  private chatThreadsStore: Map<string, ChatThread> = new Map();
  private chatParticipantsStore: Map<string, ChatParticipant> = new Map();
  private messagesStore: Map<string, Message> = new Map();
  
  private nextSupportAgentId = 1;
  private nextQuickResponseId = 1;
  private nextSettingId = 1;
  private nextSessionId = 1;

  // Support Agents
  async createSupportAgent(agent: InsertSupportAgent): Promise<SupportAgent> {
    const newAgent: SupportAgent = {
      id: this.nextSupportAgentId++,
      name: agent.name,
      avatarUrl: agent.avatarUrl ?? null,
      role: agent.role ?? null,
      description: agent.description ?? null,
      isActive: agent.isActive ?? true,
      sortOrder: agent.sortOrder ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.supportAgentsStore.set(newAgent.id, newAgent);
    return newAgent;
  }

  async getSupportAgents(): Promise<SupportAgent[]> {
    return Array.from(this.supportAgentsStore.values())
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name));
  }

  async getSupportAgentById(id: number): Promise<SupportAgent | null> {
    return this.supportAgentsStore.get(id) || null;
  }

  async updateSupportAgent(id: number, updates: Partial<InsertSupportAgent>): Promise<SupportAgent | null> {
    const existing = this.supportAgentsStore.get(id);
    if (!existing) return null;
    
    const updated: SupportAgent = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.supportAgentsStore.set(id, updated);
    return updated;
  }

  async deleteSupportAgent(id: number): Promise<boolean> {
    return this.supportAgentsStore.delete(id);
  }

  async getActiveSupportAgents(): Promise<SupportAgent[]> {
    const agents = Array.from(this.supportAgentsStore.values())
      .filter(agent => agent.isActive)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.name.localeCompare(b.name));
    
    // Sort to show customer_service agents first
    return agents.sort((a, b) => {
      const aIsCS = a.role === 'customer_service';
      const bIsCS = b.role === 'customer_service';
      if (aIsCS && !bIsCS) return -1;
      if (!aIsCS && bIsCS) return 1;
      // If both are same type, maintain sortOrder/name order
      return 0;
    });
  }

  // Help Chat Settings
  async createHelpChatSetting(setting: InsertHelpChatSetting): Promise<HelpChatSetting> {
    const newSetting: HelpChatSetting = {
      id: this.nextSettingId++,
      settingKey: setting.settingKey,
      settingValue: setting.settingValue,
      description: setting.description ?? null,
      updatedBy: setting.updatedBy ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.helpChatSettingsStore.set(setting.settingKey, newSetting);
    return newSetting;
  }

  async getHelpChatSettings(): Promise<HelpChatSetting[]> {
    return Array.from(this.helpChatSettingsStore.values())
      .sort((a, b) => a.settingKey.localeCompare(b.settingKey));
  }

  async getHelpChatSetting(key: string): Promise<HelpChatSetting | null> {
    return this.helpChatSettingsStore.get(key) || null;
  }

  async updateHelpChatSetting(key: string, value: string, updatedBy?: string): Promise<HelpChatSetting | null> {
    const existing = this.helpChatSettingsStore.get(key);
    if (!existing) return null;

    const updated: HelpChatSetting = {
      ...existing,
      settingValue: value,
      updatedBy: updatedBy || null,
      updatedAt: new Date(),
    };
    this.helpChatSettingsStore.set(key, updated);
    return updated;
  }

  async deleteHelpChatSetting(key: string): Promise<boolean> {
    return this.helpChatSettingsStore.delete(key);
  }

  // Quick Responses
  async createQuickResponse(response: InsertQuickResponse): Promise<QuickResponse> {
    const newResponse: QuickResponse = {
      id: this.nextQuickResponseId++,
      title: response.title,
      content: response.content,
      shortcut: response.shortcut ?? null,
      category: response.category ?? 'general',
      isActive: response.isActive ?? true,
      sortOrder: response.sortOrder ?? 0,
      createdBy: response.createdBy ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.quickResponsesStore.set(newResponse.id, newResponse);
    return newResponse;
  }

  async getQuickResponses(): Promise<QuickResponse[]> {
    return Array.from(this.quickResponsesStore.values())
      .sort((a, b) => {
        if (a.category !== b.category) return (a.category || '').localeCompare(b.category || '');
        if ((a.sortOrder || 0) !== (b.sortOrder || 0)) return (a.sortOrder || 0) - (b.sortOrder || 0);
        return a.title.localeCompare(b.title);
      });
  }

  async getQuickResponseById(id: number): Promise<QuickResponse | null> {
    return this.quickResponsesStore.get(id) || null;
  }

  async updateQuickResponse(id: number, updates: Partial<InsertQuickResponse>): Promise<QuickResponse | null> {
    const existing = this.quickResponsesStore.get(id);
    if (!existing) return null;

    const updated: QuickResponse = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.quickResponsesStore.set(id, updated);
    return updated;
  }

  async deleteQuickResponse(id: number): Promise<boolean> {
    return this.quickResponsesStore.delete(id);
  }

  async getActiveQuickResponses(): Promise<QuickResponse[]> {
    return Array.from(this.quickResponsesStore.values())
      .filter(response => response.isActive)
      .sort((a, b) => {
        if (a.category !== b.category) return (a.category || '').localeCompare(b.category || '');
        if ((a.sortOrder || 0) !== (b.sortOrder || 0)) return (a.sortOrder || 0) - (b.sortOrder || 0);
        return a.title.localeCompare(b.title);
      });
  }

  async getQuickResponsesByCategory(category: string): Promise<QuickResponse[]> {
    return Array.from(this.quickResponsesStore.values())
      .filter(response => response.category === category)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.title.localeCompare(b.title));
  }

  // Support Chat Sessions
  async createSupportChatSession(session: InsertSupportChatSession): Promise<SupportChatSession> {
    const newSession: SupportChatSession = {
      id: this.nextSessionId++,
      guestId: session.guestId,
      assignedAgentId: session.assignedAgentId ?? null,
      adminTakenOver: session.adminTakenOver ?? false,
      adminUserId: session.adminUserId ?? null,
      userLocation: session.userLocation ?? null,
      userDevice: session.userDevice ?? null,
      firstMessageSent: session.firstMessageSent ?? false,
      welcomeMessageSent: session.welcomeMessageSent ?? false,
      isActive: session.isActive ?? true,
      sessionStartedAt: new Date(),
      lastActivityAt: new Date(),
    };
    this.supportChatSessionsStore.set(session.guestId, newSession);
    return newSession;
  }

  async getSupportChatSession(guestId: string): Promise<SupportChatSession | null> {
    return this.supportChatSessionsStore.get(guestId) || null;
  }

  async updateSupportChatSession(guestId: string, updates: Partial<InsertSupportChatSession>): Promise<SupportChatSession | null> {
    const existing = this.supportChatSessionsStore.get(guestId);
    if (!existing) return null;

    const updated: SupportChatSession = {
      ...existing,
      ...updates,
      lastActivityAt: new Date(),
    };
    this.supportChatSessionsStore.set(guestId, updated);
    return updated;
  }

  async assignAgentToSession(guestId: string, agentId: number): Promise<SupportChatSession | null> {
    return await this.updateSupportChatSession(guestId, { assignedAgentId: agentId });
  }

  async adminTakeOverSession(guestId: string, adminUserId: string): Promise<SupportChatSession | null> {
    return await this.updateSupportChatSession(guestId, {
      adminTakenOver: true,
      adminUserId: adminUserId
    });
  }

  async getActiveSessions(): Promise<SupportChatSession[]> {
    return Array.from(this.supportChatSessionsStore.values())
      .filter(session => session.isActive)
      .sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
  }
  
  async closeSupportChatSession(guestId: string): Promise<SupportChatSession | null> {
    return await this.updateSupportChatSession(guestId, { isActive: false });
  }
  
  async getSessionsByAgent(agentId: number, options: { activeOnly?: boolean } = {}): Promise<SupportChatSession[]> {
    return Array.from(this.supportChatSessionsStore.values())
      .filter(session => {
        if (session.assignedAgentId !== agentId) return false;
        if (options.activeOnly && !session.isActive) return false;
        return true;
      })
      .sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
  }
  
  async getOrCreateSupportChatSession(guestId: string, defaults: Partial<InsertSupportChatSession>): Promise<SupportChatSession> {
    const existing = this.supportChatSessionsStore.get(guestId);
    if (existing) return existing;
    
    return await this.createSupportChatSession({
      guestId,
      ...defaults
    } as InsertSupportChatSession);
  }

  // Chat Threads - Freelancer-customer conversations
  async createChatThread(thread: InsertChatThread): Promise<ChatThread> {
    const newThread: ChatThread = {
      id: crypto.randomUUID(),
      freelancerId: thread.freelancerId,
      customerId: thread.customerId,
      projectId: thread.projectId ?? null,
      status: thread.status ?? 'open',
      lastMessageAt: null,
      lastMessagePreview: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.chatThreadsStore.set(newThread.id, newThread);
    return newThread;
  }

  async getChatThreadById(id: string): Promise<ChatThread | null> {
    return this.chatThreadsStore.get(id) || null;
  }

  async getChatThreadByParticipants(freelancerId: string, customerId: string, projectId?: string): Promise<ChatThread | null> {
    return Array.from(this.chatThreadsStore.values()).find(thread => 
      thread.freelancerId === freelancerId && 
      thread.customerId === customerId && 
      thread.projectId === (projectId || null)
    ) || null;
  }

  async getChatThreadsByUser(userId: string): Promise<ChatThread[]> {
    // Find threads where user is a participant
    const userParticipants = Array.from(this.chatParticipantsStore.values())
      .filter(p => p.userId === userId);
    
    const threadIds = userParticipants.map(p => p.threadId);
    
    return Array.from(this.chatThreadsStore.values())
      .filter(thread => threadIds.includes(thread.id))
      .sort((a, b) => {
        const aTime = a.lastMessageAt?.getTime() ?? 0;
        const bTime = b.lastMessageAt?.getTime() ?? 0;
        return bTime - aTime;
      });
  }

  async updateChatThread(id: string, updates: Partial<InsertChatThread>): Promise<ChatThread | null> {
    const existing = this.chatThreadsStore.get(id);
    if (!existing) return null;

    const updated: ChatThread = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.chatThreadsStore.set(id, updated);
    return updated;
  }

  async updateChatThreadLastMessage(id: string, messageAt: Date): Promise<ChatThread | null> {
    return await this.updateChatThread(id, { lastMessageAt: messageAt });
  }

  async getOrCreateChatThread(freelancerId: string, customerId: string, projectId?: string): Promise<ChatThread> {
    // Try to get existing thread first
    const existing = await this.getChatThreadByParticipants(freelancerId, customerId, projectId);
    if (existing) return existing;
    
    // Create new thread
    const newThread = await this.createChatThread({
      freelancerId,
      customerId,
      projectId: projectId || null,
      status: 'open'
    } as InsertChatThread);

    // Add participants
    await this.createChatParticipant({
      threadId: newThread.id,
      userId: freelancerId,
      role: 'freelancer'
    } as InsertChatParticipant);

    await this.createChatParticipant({
      threadId: newThread.id,
      userId: customerId,
      role: 'customer'
    } as InsertChatParticipant);

    return newThread;
  }

  // Chat Participants - Thread membership management
  async createChatParticipant(participant: InsertChatParticipant): Promise<ChatParticipant> {
    const newParticipant: ChatParticipant = {
      id: crypto.randomUUID(),
      threadId: participant.threadId,
      userId: participant.userId,
      role: participant.role,
      muted: participant.muted ?? false,
      joinedAt: new Date(),
    };
    this.chatParticipantsStore.set(newParticipant.id, newParticipant);
    return newParticipant;
  }

  async getChatParticipantById(id: string): Promise<ChatParticipant | null> {
    return this.chatParticipantsStore.get(id) || null;
  }

  async getChatParticipantsByThread(threadId: string): Promise<ChatParticipant[]> {
    return Array.from(this.chatParticipantsStore.values())
      .filter(participant => participant.threadId === threadId)
      .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
  }

  async getChatParticipantByThreadAndUser(threadId: string, userId: string): Promise<ChatParticipant | null> {
    return Array.from(this.chatParticipantsStore.values()).find(
      participant => participant.threadId === threadId && participant.userId === userId
    ) || null;
  }

  async updateChatParticipant(id: string, updates: Partial<InsertChatParticipant>): Promise<ChatParticipant | null> {
    const existing = this.chatParticipantsStore.get(id);
    if (!existing) return null;

    const updated: ChatParticipant = {
      ...existing,
      ...updates,
    };
    this.chatParticipantsStore.set(id, updated);
    return updated;
  }

  async deleteChatParticipant(id: string): Promise<boolean> {
    return this.chatParticipantsStore.delete(id);
  }

  async isUserInThread(threadId: string, userId: string): Promise<boolean> {
    const participant = await this.getChatParticipantByThreadAndUser(threadId, userId);
    return participant !== null;
  }

  // Messages - Thread-based messaging (extending existing messages table)
  async createMessage(message: InsertMessage): Promise<Message> {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      senderId: message.senderId || '',
      receiverId: message.receiverId ?? null,
      threadId: message.threadId ?? null,
      content: message.content ?? '',
      isRead: message.isRead ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.messagesStore.set(newMessage.id, newMessage);
    
    // Update thread's last message time if this is a thread message
    if (newMessage.threadId) {
      await this.updateChatThreadLastMessage(newMessage.threadId, newMessage.createdAt);
    }
    
    return newMessage;
  }

  async getMessageById(id: string): Promise<Message | null> {
    return this.messagesStore.get(id) || null;
  }

  async getMessagesByThread(threadId: string, options: { limit?: number; before?: string } = {}): Promise<Message[]> {
    const { limit = 50, before } = options;
    
    let messages = Array.from(this.messagesStore.values())
      .filter(message => message.threadId === threadId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (before) {
      const beforeMessage = this.messagesStore.get(before);
      if (beforeMessage) {
        messages = messages.filter(message => message.createdAt > beforeMessage.createdAt);
      }
    }
    
    return messages.slice(0, limit);
  }

  async updateMessage(id: string, updates: Partial<InsertMessage>): Promise<Message | null> {
    const existing = this.messagesStore.get(id);
    if (!existing) return null;

    const updated: Message = {
      ...existing,
      ...updates,
    };
    this.messagesStore.set(id, updated);
    return updated;
  }

  async deleteMessage(id: string): Promise<boolean> {
    return this.messagesStore.delete(id);
  }

  async getMessageCount(threadId: string): Promise<number> {
    return Array.from(this.messagesStore.values())
      .filter(message => message.threadId === threadId).length;
  }
  
  // Usage Analytics - for subscription limits (in-memory implementation)
  async getTodayThreadCount(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.chatThreadsStore.values())
      .filter(thread => 
        thread.customerId === userId && 
        thread.createdAt >= today
      ).length;
  }
  
  async getTodayMessageCount(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.messagesStore.values())
      .filter(message => 
        message.senderId === userId && 
        message.threadId !== null &&
        message.createdAt >= today
      ).length;
  }
  
  async getUserActiveSubscription(userId: string): Promise<{ planName: string } | null> {
    // In-memory implementation - return basic plan for now
    return { planName: 'free' };
  }
  
  // Email Accounts - Stub implementations (require database)
  async createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount> {
    throw new Error('Email account methods require database storage');
  }
  async getEmailAccounts(activeOnly?: boolean): Promise<EmailAccount[]> { return []; }
  async getEmailAccountById(id: string): Promise<EmailAccount | null> { return null; }
  async getEmailAccountByEmail(email: string): Promise<EmailAccount | null> { return null; }
  async updateEmailAccount(id: string, updates: Partial<InsertEmailAccount>): Promise<EmailAccount | null> { return null; }
  async deleteEmailAccount(id: string): Promise<boolean> { return false; }
  async updateEmailAccountSyncStatus(id: string, status: string, error?: string): Promise<EmailAccount | null> { return null; }
  
  // Email Messages - Stub implementations (require database)
  async createEmailMessage(message: InsertEmailMessage): Promise<EmailMessage> {
    throw new Error('Email message methods require database storage');
  }
  async getEmailMessages(options?: { accountId?: string; limit?: number; offset?: number; unreadOnly?: boolean }): Promise<EmailMessage[]> { return []; }
  async getEmailMessageById(id: string): Promise<EmailMessage | null> { return null; }
  async getEmailMessageByMessageId(messageId: string): Promise<EmailMessage | null> { return null; }
  async updateEmailMessage(id: string, updates: Partial<InsertEmailMessage>): Promise<EmailMessage | null> { return null; }
  async deleteEmailMessage(id: string): Promise<boolean> { return false; }
  async markEmailAsRead(id: string, isRead: boolean): Promise<EmailMessage | null> { return null; }
  async markEmailAsReplied(id: string): Promise<EmailMessage | null> { return null; }
  async markEmailAsSpam(id: string, isSpam: boolean): Promise<EmailMessage | null> { return null; }
  async markEmailAsArchived(id: string, isArchived: boolean): Promise<EmailMessage | null> { return null; }
  async markEmailAsTrashed(id: string, isTrashed: boolean): Promise<EmailMessage | null> { return null; }
  async getUnreadEmailCount(accountId?: string): Promise<number> { return 0; }
  
  // Email Replies - Stub implementations (require database)
  async createEmailReply(reply: InsertEmailReply): Promise<EmailReply> {
    throw new Error('Email reply methods require database storage');
  }
  async getEmailReplies(emailMessageId: string): Promise<EmailReply[]> { return []; }
  async getEmailRepliesBatch(emailMessageIds: string[]): Promise<EmailReply[]> { return []; }
  async getEmailReplyById(id: string): Promise<EmailReply | null> { return null; }
  async deleteEmailReplies(emailMessageId: string): Promise<boolean> { return false; }
  
  // Email Folders - Stub implementations (require database)
  async createEmailFolder(folder: InsertEmailFolder): Promise<EmailFolder> {
    throw new Error('Email folder methods require database storage');
  }
  async getEmailFolders(accountId: string): Promise<EmailFolder[]> { return []; }
  async getEmailFolderById(id: string): Promise<EmailFolder | null> { return null; }
  async updateEmailFolder(id: string, updates: Partial<InsertEmailFolder>): Promise<EmailFolder | null> { return null; }
  async deleteEmailFolder(id: string): Promise<boolean> { return false; }
  
  // Email Labels - Stub implementations (require database)
  async createEmailLabel(label: InsertEmailLabel): Promise<EmailLabel> {
    throw new Error('Email label methods require database storage');
  }
  async getEmailLabels(accountId: string): Promise<EmailLabel[]> { return []; }
  async getEmailLabelById(id: string): Promise<EmailLabel | null> { return null; }
  async updateEmailLabel(id: string, updates: Partial<InsertEmailLabel>): Promise<EmailLabel | null> { return null; }
  async deleteEmailLabel(id: string): Promise<boolean> { return false; }
  
  // Email Label Assignments - Stub implementations (require database)
  async assignLabelToEmail(emailMessageId: string, labelId: string): Promise<EmailLabelAssignment> {
    throw new Error('Email label assignment methods require database storage');
  }
  async removeLabelFromEmail(emailMessageId: string, labelId: string): Promise<boolean> { return false; }
  async getEmailLabelsForMessage(emailMessageId: string): Promise<EmailLabel[]> { return []; }
  
  // Sent Emails - Stub implementations (require database)
  async createSentEmail(email: InsertSentEmail): Promise<SentEmail> {
    throw new Error('Sent email methods require database storage');
  }
  async getSentEmails(options?: { accountId?: string; status?: string; limit?: number; offset?: number }): Promise<SentEmail[]> { return []; }
  async getSentEmailById(id: string): Promise<SentEmail | null> { return null; }
  async updateSentEmail(id: string, updates: Partial<InsertSentEmail>): Promise<SentEmail | null> { return null; }
  async deleteSentEmail(id: string): Promise<boolean> { return false; }
  
  // User queries by role for group email sending
  async getUsersByRole(role: string): Promise<Array<{ id: string; email: string; username: string }>> {
    return [];
  }
  
  // Profile Picture Upload - Stub implementation
  async updateProfilePicture(userId: string, pictureUrl: string): Promise<boolean> { return false; }
  
  // Categories - Product categorization (in-memory implementation)
  private categoriesStore = new Map<string, Category>();
  
  async createCategory(category: { name: string; description?: string }): Promise<Category> {
    const newCategory: Category = {
      id: crypto.randomUUID(),
      name: category.name,
      description: category.description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.categoriesStore.set(newCategory.id, newCategory);
    return newCategory;
  }
  
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categoriesStore.values()).sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async getCategoryById(id: string): Promise<Category | null> {
    return this.categoriesStore.get(id) || null;
  }
  
  async updateCategory(id: string, updates: Partial<{ name: string; description: string }>): Promise<Category | null> {
    const existing = this.categoriesStore.get(id);
    if (!existing) return null;
    
    const updated: Category = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.categoriesStore.set(id, updated);
    return updated;
  }
  
  async deleteCategory(id: string): Promise<boolean> {
    return this.categoriesStore.delete(id);
  }
  
  // Carts - User shopping carts (in-memory implementation)
  private cartsStore = new Map<string, Cart>();
  
  async createCart(cart: { userId: string }): Promise<Cart> {
    const newCart: Cart = {
      id: crypto.randomUUID(),
      userId: cart.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.cartsStore.set(newCart.id, newCart);
    return newCart;
  }
  
  async getCartByUserId(userId: string): Promise<Cart | null> {
    const carts = Array.from(this.cartsStore.values());
    return carts.find(cart => cart.userId === userId) || null;
  }
  
  async getCartById(id: string): Promise<Cart | null> {
    return this.cartsStore.get(id) || null;
  }
  
  async getOrCreateCartByUserId(userId: string): Promise<Cart> {
    const existingCart = await this.getCartByUserId(userId);
    if (existingCart) {
      return existingCart;
    }
    return await this.createCart({ userId });
  }
  
  async clearCart(cartId: string): Promise<boolean> {
    // Remove all cart items for this cart
    Array.from(this.cartItemsStore.entries()).forEach(([id, item]) => {
      if (item.cartId === cartId) {
        this.cartItemsStore.delete(id);
      }
    });
    return true;
  }
  
  async deleteCart(cartId: string): Promise<boolean> {
    await this.clearCart(cartId);
    return this.cartsStore.delete(cartId);
  }
  
  // Cart Items - Items within shopping carts (in-memory implementation)
  private cartItemsStore = new Map<string, CartItem>();
  
  async addCartItem(cartItem: { cartId: string; productId: string; quantity: number }): Promise<CartItem> {
    // Verify cart exists
    const cart = await this.getCartById(cartItem.cartId);
    if (!cart) {
      throw new Error(`Cart with id ${cartItem.cartId} not found`);
    }
    
    // Check if item already exists in cart
    const existingItem = await this.getCartItem(cartItem.cartId, cartItem.productId);
    
    if (existingItem) {
      // Update quantity if item already exists (merge behavior)
      const updated = await this.updateCartItemQuantity(cartItem.cartId, cartItem.productId, existingItem.quantity + cartItem.quantity);
      if (updated) return updated;
    }
    
    const newCartItem: CartItem = {
      id: crypto.randomUUID(),
      cartId: cartItem.cartId,
      productId: cartItem.productId,
      quantity: cartItem.quantity,
      priceAtAdd: '0.00',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.cartItemsStore.set(newCartItem.id, newCartItem);
    return newCartItem;
  }
  
  async getCartItems(cartId: string): Promise<CartItem[]> {
    return Array.from(this.cartItemsStore.values())
      .filter(item => item.cartId === cartId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async getCartItem(cartId: string, productId: string): Promise<CartItem | null> {
    const items = Array.from(this.cartItemsStore.values());
    return items.find(item => item.cartId === cartId && item.productId === productId) || null;
  }
  
  async updateCartItemQuantity(cartId: string, productId: string, quantity: number): Promise<CartItem | null> {
    const existingItem = await this.getCartItem(cartId, productId);
    if (!existingItem) return null;
    
    // Remove item if quantity is 0 or negative
    if (quantity <= 0) {
      await this.removeCartItem(cartId, productId);
      return null;
    }
    
    const updated: CartItem = {
      ...existingItem,
      quantity,
      updatedAt: new Date(),
    };
    this.cartItemsStore.set(existingItem.id, updated);
    return updated;
  }
  
  async removeCartItem(cartId: string, productId: string): Promise<boolean> {
    const existingItem = await this.getCartItem(cartId, productId);
    if (!existingItem) return false;
    
    return this.cartItemsStore.delete(existingItem.id);
  }
  
  async getCartItemCount(cartId: string): Promise<number> {
    // Return sum of quantities for cart icon display
    return Array.from(this.cartItemsStore.values())
      .filter(item => item.cartId === cartId)
      .reduce((total, item) => total + item.quantity, 0);
  }
  
  // Order Items - Individual items within orders (in-memory implementation)
  private orderItemsStore = new Map<string, OrderItem>();
  
  async createOrderItem(orderItem: { orderId: string; productId: string; quantity: number; unitPrice: number }): Promise<OrderItem> {
    const unitPrice = orderItem.unitPrice.toString();
    const totalPrice = (orderItem.unitPrice * orderItem.quantity).toString();
    const newOrderItem: OrderItem = {
      id: crypto.randomUUID(),
      orderId: orderItem.orderId,
      productId: orderItem.productId,
      quantity: orderItem.quantity,
      unitPrice,
      totalPrice,
      price: unitPrice,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orderItemsStore.set(newOrderItem.id, newOrderItem);
    return newOrderItem;
  }
  
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return Array.from(this.orderItemsStore.values())
      .filter(item => item.orderId === orderId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async getOrderItem(orderItemId: string): Promise<OrderItem | null> {
    return this.orderItemsStore.get(orderItemId) || null;
  }
  
  async updateOrderItem(orderItemId: string, updates: Partial<{ quantity: number; unitPrice: number }>): Promise<OrderItem | null> {
    const existing = this.orderItemsStore.get(orderItemId);
    if (!existing) return null;
    
    const updateData: Partial<OrderItem> = { updatedAt: new Date() };
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
    if (updates.unitPrice !== undefined) {
      updateData.unitPrice = updates.unitPrice.toString();
      updateData.price = updates.unitPrice.toString();
    }
    if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
      const quantity = updates.quantity ?? existing.quantity;
      const unitPrice = updates.unitPrice ?? parseFloat(existing.unitPrice);
      updateData.totalPrice = (quantity * unitPrice).toString();
    }
    
    const updated: OrderItem = {
      ...existing,
      ...updateData,
    };
    this.orderItemsStore.set(orderItemId, updated);
    return updated;
  }
  
  async deleteOrderItem(orderItemId: string): Promise<boolean> {
    return this.orderItemsStore.delete(orderItemId);
  }

  // Customer Dashboard methods - stub implementations for MemStorage
  async createPendingShopSignup(data: { email: string; fullName: string; passwordHash: string; verificationCode: string; expiresAt: Date }) {
    throw new Error('Pending shop signup methods require database storage');
  }
  async getPendingShopSignup(email: string) { return null; }
  async getPendingShopSignupByToken(token: string) { return null; }
  async updatePendingShopSignupCode(email: string, verificationCode: string, expiresAt: Date) { return null; }
  async deletePendingShopSignup(email: string): Promise<boolean> { return false; }

  async createShopCustomer(customer: { userId: string; fullName: string; email: string }) {
    throw new Error('Shop customer methods require database storage');
  }
  async getShopCustomerByUserId(userId: string) { return null; }
  async updateShopCustomer(customerId: string, updates: any) { return null; }
  async updateWalletBalance(customerId: string, amount: number) { return null; }
  async createShopPurchase(purchase: any) { throw new Error('Shop purchase methods require database storage'); }
  async getShopPurchasesByCustomerId(customerId: string) { return []; }
  async getShopPurchaseById(id: string) { return null; }
  async createShopAd(ad: any) { throw new Error('Shop ad methods require database storage'); }
  async getShopAdsByCustomerId(customerId: string) { return []; }
  async getShopAdById(id: string) { return null; }
  async updateShopAd(id: string, updates: any) { return null; }
  async deleteShopAd(id: string): Promise<boolean> { return false; }
  async createShopMembership(membership: any) { throw new Error('Shop membership methods require database storage'); }
  async getShopMembershipByCustomerId(customerId: string) { return null; }
  async updateShopMembership(id: string, updates: any) { return null; }
  async createShopTransaction(transaction: any) { throw new Error('Shop transaction methods require database storage'); }
  async getShopTransactionsByCustomerId(customerId: string) { return []; }
  async getShopTransactionById(id: string) { return null; }
  async createShopSupportTicket(ticket: any) { throw new Error('Shop support ticket methods require database storage'); }
  async getShopSupportTicketsByCustomerId(customerId: string) { return []; }
  async getAllShopSupportTickets() { return []; }
  async getShopSupportTicketById(id: string) { return null; }
  async updateShopSupportTicket(id: string, updates: any) { return null; }
  async deleteShopSupportTicket(id: string): Promise<boolean> { return false; }
  async createVoucher(voucher: any) { throw new Error('Shop voucher methods require database storage'); }
  async createBulkVouchers(vouchers: any[]): Promise<any[]> { throw new Error('Shop voucher methods require database storage'); }
  async getVouchers() { return []; }
  async getVoucherByCode(code: string) { return null; }
  async deleteVoucher(id: string): Promise<boolean> { return false; }
  async deleteAllVouchers(): Promise<number> { return 0; }
  async redeemVoucher(voucherId: string, customerId: string, amount: string) { throw new Error('Shop voucher methods require database storage'); }
  async getVoucherRedemptions(voucherId?: string) { return []; }
  async updateVoucherEmailStatus(voucherId: string, emailSent: boolean) { throw new Error('Shop voucher methods require database storage'); }
  async recordFailedVoucherAttempt(customerId: string, userId: string, attemptedCode: string, ipAddress?: string) { throw new Error('Fraud prevention methods require database storage'); }
  async getRecentFailedAttempts(customerId: string, hoursBack: number): Promise<number> { return 0; }
  async isUserBlockedFromVouchers(customerId: string): Promise<boolean> { return false; }
  async getCustomerDashboardStats(customerId: string) {
    return { totalPurchases: 0, activeAds: 0, walletBalance: '0.00', membership: null };
  }

  // Admin Settings - Stub implementations
  async createAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting> {
    throw new Error('Admin settings require database storage');
  }
  async getAdminSettings(category?: string): Promise<AdminSetting[]> { return []; }
  async getAdminSetting(key: string): Promise<AdminSetting | null> { return null; }
  async updateAdminSetting(key: string, value: string, updatedBy?: string): Promise<AdminSetting | null> { return null; }
  async deleteAdminSetting(key: string): Promise<boolean> { return false; }

  // Payment Gateways - Stub implementations
  async createPaymentGateway(gateway: InsertPaymentGateway): Promise<PaymentGateway> {
    throw new Error('Payment gateways require database storage');
  }
  async getPaymentGateways(enabledOnly?: boolean): Promise<PaymentGateway[]> { return []; }
  async getPaymentGateway(gatewayId: string): Promise<PaymentGateway | null> { return null; }
  async updatePaymentGateway(gatewayId: string, updates: Partial<InsertPaymentGateway>, updatedBy?: string): Promise<PaymentGateway | null> { return null; }
  async deletePaymentGateway(gatewayId: string): Promise<boolean> { return false; }
  async getPrimaryPaymentGateway(): Promise<PaymentGateway | null> { return null; }
  async setPrimaryPaymentGateway(gatewayId: string): Promise<PaymentGateway | null> { return null; }

  // Certificates - Stub implementations
  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    throw new Error('Certificates require database storage');
  }
  async getCertificateById(id: string): Promise<Certificate | null> { return null; }
  async getCertificateByVerificationCode(code: string): Promise<Certificate | null> { return null; }
  async getCertificatesByUserId(userId: string): Promise<Certificate[]> { return []; }
  async getCertificatesByCourseId(courseId: string): Promise<Certificate[]> { return []; }
  async updateCertificate(id: string, updates: Partial<InsertCertificate>): Promise<Certificate | null> { return null; }
  async revokeCertificate(id: string, reason: string): Promise<Certificate | null> { return null; }
  async checkCourseCompletion(userId: string, courseId: string): Promise<{ completed: boolean; progress: number; finalScore?: number }> {
    return { completed: false, progress: 0 };
  }
  async getCourseWithInstructor(courseId: string): Promise<{ title: string; description?: string; instructorName?: string; certificateType?: string } | null> {
    return null;
  }
  
  // Featured Courses - stub implementations
  async getFeaturedCourses(limit?: number): Promise<any[]> { return []; }
  async setCourseFeatured(courseId: string, isFeatured: boolean): Promise<any | null> { return null; }
  
  // Featured Users - stub implementations
  async toggleFeaturedStatus(userId: string, adminUserId: string): Promise<{ isFeatured: boolean }> { 
    throw new Error('Featured user methods require database storage');
  }
  async getFeaturedUsers(limit?: number): Promise<any[]> { return []; }
  
  // Profile Stats - stub implementations
  async getProfileStats(profileId: string, viewerUserId?: string): Promise<{ views: number; likes: number; followers: number; likedByMe?: boolean; followingByMe?: boolean }> {
    return { views: 0, likes: 0, followers: 0, likedByMe: false, followingByMe: false };
  }
  async recordProfileView(profileId: string, viewData: any): Promise<boolean> { return false; }
  async toggleProfileLike(profileId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    return { liked: false, likesCount: 0 };
  }
  async toggleProfileFollow(profileId: string, followerUserId: string): Promise<{ following: boolean; followersCount: number }> {
    return { following: false, followersCount: 0 };
  }
  
  // API Keys - stub implementations
  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    throw new Error("API Keys not supported in MemStorage - use DatabaseStorage");
  }
  async getApiKeysByUserId(userId: string): Promise<ApiKey[]> { return []; }
  async getApiKeyByKeyHash(keyHash: string): Promise<ApiKey | null> { return null; }
  async revokeApiKey(id: string): Promise<ApiKey | null> { return null; }
  async updateApiKeyLastUsed(keyHash: string): Promise<void> { }
  async validateApiKey(key: string): Promise<ApiKey | null> { return null; }

  // App Download Links - stub implementations
  async getAppDownloadLinks(): Promise<{ 
    appStoreUrl: string | null; 
    appStoreText: string | null;
    googlePlayUrl: string | null; 
    googlePlayText: string | null;
    huaweiGalleryUrl: string | null;
    huaweiGalleryText: string | null;
  }> {
    return { 
      appStoreUrl: null, 
      appStoreText: 'Download on the',
      googlePlayUrl: null, 
      googlePlayText: 'Get it on',
      huaweiGalleryUrl: null,
      huaweiGalleryText: 'Explore it on'
    };
  }
  async updateAppDownloadLinks(
    appStoreUrl: string, 
    appStoreText: string,
    googlePlayUrl: string, 
    googlePlayText: string,
    huaweiGalleryUrl: string,
    huaweiGalleryText: string
  ): Promise<{ 
    appStoreUrl: string; 
    appStoreText: string;
    googlePlayUrl: string; 
    googlePlayText: string;
    huaweiGalleryUrl: string;
    huaweiGalleryText: string;
  }> {
    return { 
      appStoreUrl, 
      appStoreText,
      googlePlayUrl, 
      googlePlayText,
      huaweiGalleryUrl,
      huaweiGalleryText
    };
  }

  // Payment Processing - stub implementations
  async getAllAuthUsers(): Promise<any[]> { return []; }
  async recordPurchase(purchase: {
    userId: string;
    courseId: string;
    paymentIntentId: string;
    amount: number;
    paymentMethod: string;
  }): Promise<void> { }

  // WhatsApp Bot
  async getWhatsAppConversations(): Promise<any[]> {
    return [];
  }

  async getWhatsAppMessages(conversationId: string): Promise<any[]> {
    return [];
  }

  // =====================================================
  // EMAIL MARKETING SYSTEM - Stub implementations
  // =====================================================
  
  // Email Marketing Templates
  async createEmailMarketingTemplate(template: InsertEmailMarketingTemplate): Promise<EmailMarketingTemplate> {
    throw new Error('Email marketing templates require database storage');
  }
  async getEmailMarketingTemplates(options?: { category?: string; activeOnly?: boolean }): Promise<EmailMarketingTemplate[]> { return []; }
  async getEmailMarketingTemplateById(id: string): Promise<EmailMarketingTemplate | null> { return null; }
  async updateEmailMarketingTemplate(id: string, updates: Partial<InsertEmailMarketingTemplate>): Promise<EmailMarketingTemplate | null> { return null; }
  async deleteEmailMarketingTemplate(id: string): Promise<boolean> { return false; }
  
  // Email Campaigns
  async createEmailCampaign(campaign: InsertEmailCampaign): Promise<EmailCampaign> {
    throw new Error('Email campaigns require database storage');
  }
  async getEmailCampaigns(options?: { status?: string; limit?: number; offset?: number }): Promise<EmailCampaign[]> { return []; }
  async getEmailCampaignById(id: string): Promise<EmailCampaign | null> { return null; }
  async updateEmailCampaign(id: string, updates: Partial<InsertEmailCampaign>): Promise<EmailCampaign | null> { return null; }
  async deleteEmailCampaign(id: string): Promise<boolean> { return false; }
  async updateCampaignStats(campaignId: string, stats: { sentCount?: number; deliveredCount?: number; openedCount?: number; clickedCount?: number; bouncedCount?: number; failedCount?: number }): Promise<EmailCampaign | null> { return null; }
  
  // Email Preferences
  async createOrUpdateEmailPreference(preference: InsertEmailPreference): Promise<EmailPreference> {
    throw new Error('Email preferences require database storage');
  }
  async getEmailPreferenceByUserId(userId: string): Promise<EmailPreference | null> { return null; }
  async getEmailPreferenceByToken(token: string): Promise<EmailPreference | null> { return null; }
  async updateEmailPreference(id: string, updates: Partial<InsertEmailPreference>): Promise<EmailPreference | null> { return null; }
  async unsubscribeByToken(token: string, reason?: string): Promise<EmailPreference | null> { return null; }
  
  // Campaign Deliveries
  async createCampaignDelivery(delivery: InsertCampaignDelivery): Promise<CampaignDelivery> {
    throw new Error('Campaign deliveries require database storage');
  }
  async createBulkCampaignDeliveries(deliveries: InsertCampaignDelivery[]): Promise<CampaignDelivery[]> { return []; }
  async getCampaignDeliveries(campaignId: string, options?: { status?: string; limit?: number; offset?: number }): Promise<CampaignDelivery[]> { return []; }
  async updateCampaignDelivery(id: string, updates: Partial<CampaignDelivery>): Promise<CampaignDelivery | null> { return null; }
  async markDeliveryAsSent(id: string): Promise<CampaignDelivery | null> { return null; }
  async markDeliveryAsDelivered(id: string): Promise<CampaignDelivery | null> { return null; }
  async markDeliveryAsOpened(id: string): Promise<CampaignDelivery | null> { return null; }
  async markDeliveryAsClicked(id: string): Promise<CampaignDelivery | null> { return null; }
  async markDeliveryAsBounced(id: string, reason: string): Promise<CampaignDelivery | null> { return null; }
  async markDeliveryAsFailed(id: string, error: string): Promise<CampaignDelivery | null> { return null; }
  
  // Campaign Segments
  async createCampaignSegment(segment: InsertCampaignSegment): Promise<CampaignSegment> {
    throw new Error('Campaign segments require database storage');
  }
  async getCampaignSegments(activeOnly?: boolean): Promise<CampaignSegment[]> { return []; }
  async getCampaignSegmentById(id: string): Promise<CampaignSegment | null> { return null; }
  async updateCampaignSegment(id: string, updates: Partial<InsertCampaignSegment>): Promise<CampaignSegment | null> { return null; }
  async deleteCampaignSegment(id: string): Promise<boolean> { return false; }
  
  // Segmentation Queries
  async getEmailableUsers(filters: SegmentFilters): Promise<Array<{ userId: string; email: string; name: string; role?: string; grade?: number; subscriptionTier?: string }>> { return []; }
  async getSegmentEstimatedSize(filters: SegmentFilters): Promise<number> { return 0; }
}

// Default storage instance - use DatabaseStorage to access existing support agents

// Note: Using DatabaseStorage to access the existing 5 support agents in the database
export const storage = process.env.USE_DATABASE_STORAGE === 'false' ? (new MemStorage() as unknown as IStorage) : (new DatabaseStorage() as unknown as IStorage);
