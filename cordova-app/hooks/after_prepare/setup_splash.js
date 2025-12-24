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
    
    // Check if MainActivity has the LAUNCHER intent
    const hasMainActivityLauncher = manifest.includes('android:name="MainActivity"') && 
                                    manifest.includes('android.intent.action.MAIN');
    
    if (hasMainActivityLauncher) {
        // Remove MAIN/LAUNCHER from MainActivity
        manifest = manifest.replace(
            /(<activity[^>]*android:name="MainActivity"[^>]*>[\s\S]*?)<intent-filter[\s\S]*?android\.intent\.action\.MAIN[\s\S]*?<\/intent-filter>/,
            '$1'
        );
        
        // Add SplashActivity with MAIN/LAUNCHER if not already there
        if (!manifest.includes('com.edufiliova.app.SplashActivity')) {
            const applicationEndTag = '</application>';
            const splashActivityXml = `        <activity android:name="com.edufiliova.app.SplashActivity" android:exported="true" android:theme="@android:style/Theme.NoTitleBar.Fullscreen" android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>\n    `;
            
            manifest = manifest.replace(applicationEndTag, splashActivityXml + applicationEndTag);
            fs.writeFileSync(manifestPath, manifest, 'utf-8');
            console.log('✓ SplashActivity configured as LAUNCHER');
        }
    }
};
