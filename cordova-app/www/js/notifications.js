/**
 * EduFiliova Notification Manager
 * Handles local and push notifications with sounds and popups
 */

var EduNotifications = {
    // Use phone's default system sounds (not custom)
    sounds: {
        message: 'default',
        lesson: 'default',
        achievement: 'default',
        reminder: 'default',
        default: 'default'
    },

    // Initialize notifications
    init: function() {
        console.log('Initializing EduFiliova Notifications...');
        
        // Request permission for local notifications
        if (cordova.plugins && cordova.plugins.notification) {
            cordova.plugins.notification.local.requestPermission(function(granted) {
                console.log('Local notification permission:', granted);
            });

            // Handle notification click
            cordova.plugins.notification.local.on('click', function(notification) {
                console.log('Notification clicked:', notification);
                EduNotifications.handleNotificationClick(notification);
            });
        }

        // Initialize push notifications
        this.initPushNotifications();
    },

    // Initialize Firebase Push Notifications
    initPushNotifications: function() {
        if (typeof PushNotification === 'undefined') {
            console.log('Push plugin not available');
            return;
        }

        var push = PushNotification.init({
            android: {
                sound: true,
                vibrate: true,
                forceShow: true,
                icon: 'notification_icon',
                iconColor: '#d44472',
                clearBadge: true
            },
            ios: {
                sound: true,
                vibration: true,
                badge: true,
                alert: true
            }
        });

        push.on('registration', function(data) {
            console.log('Push registration token:', data.registrationId);
            // Send token to your server
            EduNotifications.sendTokenToServer(data.registrationId);
        });

        push.on('notification', function(data) {
            console.log('Push notification received:', data);
            // Show notification popup
            EduNotifications.showNotification({
                title: data.title,
                message: data.message,
                type: data.additionalData?.type || 'default',
                data: data.additionalData
            });
        });

        push.on('error', function(e) {
            console.error('Push notification error:', e);
        });
    },

    // Send FCM token to server
    sendTokenToServer: function(token) {
        fetch('https://edufiliova.com/api/notifications/register-device', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token, platform: device.platform }),
            credentials: 'include'
        }).catch(function(err) {
            console.log('Failed to register device:', err);
        });
    },

    // Show local notification with sound and popup
    showNotification: function(options) {
        if (!cordova.plugins || !cordova.plugins.notification) {
            console.log('Local notification plugin not available');
            return;
        }

        var sound = this.sounds[options.type] || this.sounds.default;
        var notificationId = Date.now();

        cordova.plugins.notification.local.schedule({
            id: notificationId,
            title: options.title || 'EduFiliova',
            text: options.message || '',
            icon: 'res://icon',
            smallIcon: 'res://notification_icon',
            color: '#d44472',
            sound: sound,
            vibrate: true,
            priority: 2, // High priority for popup
            foreground: true, // Show even when app is in foreground
            wakeup: true,
            data: options.data || {},
            channel: 'edufiliova_channel',
            led: { color: '#d44472', on: 500, off: 500 }
        });

        // Also vibrate the device
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }

        // Update badge count
        this.incrementBadge();
    },

    // Notification types
    showMessageNotification: function(senderName, message) {
        this.showNotification({
            title: 'New message from ' + senderName,
            message: message,
            type: 'message',
            data: { type: 'message', sender: senderName }
        });
    },

    showLessonNotification: function(lessonTitle) {
        this.showNotification({
            title: 'Lesson Available',
            message: 'Your lesson "' + lessonTitle + '" is ready to start!',
            type: 'lesson',
            data: { type: 'lesson', lesson: lessonTitle }
        });
    },

    showAchievementNotification: function(achievement) {
        this.showNotification({
            title: 'Achievement Unlocked!',
            message: achievement,
            type: 'achievement',
            data: { type: 'achievement' }
        });
    },

    showReminderNotification: function(reminderText) {
        this.showNotification({
            title: 'Study Reminder',
            message: reminderText,
            type: 'reminder',
            data: { type: 'reminder' }
        });
    },

    showPaymentNotification: function(message) {
        this.showNotification({
            title: 'Payment Update',
            message: message,
            type: 'default',
            data: { type: 'payment' }
        });
    },

    // Handle notification click - navigate to appropriate screen
    handleNotificationClick: function(notification) {
        var data = notification.data || {};
        var type = data.type || 'default';

        switch(type) {
            case 'message':
                window.location.href = 'https://edufiliova.com/app#messages';
                break;
            case 'lesson':
                window.location.href = 'https://edufiliova.com/app#lessons';
                break;
            case 'achievement':
                window.location.href = 'https://edufiliova.com/app#achievements';
                break;
            case 'payment':
                window.location.href = 'https://edufiliova.com/app#payments';
                break;
            default:
                window.location.href = 'https://edufiliova.com/app';
        }
    },

    // Badge management
    incrementBadge: function() {
        if (cordova.plugins && cordova.plugins.notification && cordova.plugins.notification.badge) {
            cordova.plugins.notification.badge.increase(1);
        }
    },

    clearBadge: function() {
        if (cordova.plugins && cordova.plugins.notification && cordova.plugins.notification.badge) {
            cordova.plugins.notification.badge.clear();
        }
    },

    setBadge: function(count) {
        if (cordova.plugins && cordova.plugins.notification && cordova.plugins.notification.badge) {
            cordova.plugins.notification.badge.set(count);
        }
    },

    // Schedule a future notification
    scheduleNotification: function(options, triggerDate) {
        if (!cordova.plugins || !cordova.plugins.notification) {
            return;
        }

        cordova.plugins.notification.local.schedule({
            id: Date.now(),
            title: options.title || 'EduFiliova',
            text: options.message || '',
            icon: 'res://icon',
            smallIcon: 'res://notification_icon',
            color: '#d44472',
            sound: this.sounds[options.type] || this.sounds.default,
            trigger: { at: triggerDate },
            foreground: true,
            wakeup: true
        });
    },

    // Cancel all scheduled notifications
    cancelAll: function() {
        if (cordova.plugins && cordova.plugins.notification) {
            cordova.plugins.notification.local.cancelAll();
        }
    }
};

// Initialize when device is ready
document.addEventListener('deviceready', function() {
    EduNotifications.init();
}, false);

// Expose to window for web app communication
window.EduNotifications = EduNotifications;
