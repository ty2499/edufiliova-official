#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

module.exports = function(ctx) {
    console.log('Setting up custom splash screen...');
    
    // Path to AndroidManifest.xml
    const manifestPath = path.join(
        ctx.opts.projectRoot,
        'platforms/android/app/src/main/AndroidManifest.xml'
    );
    
    if (!fs.existsSync(manifestPath)) {
        console.log('AndroidManifest.xml not found, skipping splash setup');
        return;
    }
    
    let manifest = fs.readFileSync(manifestPath, 'utf-8');
    
    // Check if our custom splash activity already exists
    if (manifest.includes('com.edufiliova.app.SplashActivity')) {
        console.log('Custom splash activity already configured');
        return;
    }
    
    // Find the MainActivity activity and move MAIN/LAUNCHER to SplashActivity
    const splashActivityXml = `
        <activity
            android:name="com.edufiliova.app.SplashActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale"
            android:label="@string/activity_name"
            android:theme="@android:style/Theme.NoTitleBar.Fullscreen"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        <activity
            android:name="com.edufiliova.app.MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale"
            android:label="@string/activity_name"
            android:theme="@android:style/Theme.Black.NoTitleBar"
            android:exported="true">
        </activity>`;
    
    // Remove old MainActivity LAUNCHER intent filter
    manifest = manifest.replace(
        /<activity[\s\S]*?android:name=".*MainActivity"[\s\S]*?<\/activity>/,
        splashActivityXml
    );
    
    fs.writeFileSync(manifestPath, manifest, 'utf-8');
    console.log('✓ Custom splash activity configured in AndroidManifest.xml');
};
