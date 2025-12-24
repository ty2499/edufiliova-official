package com.edufiliova.app;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.widget.FrameLayout;
import android.view.LayoutInflater;
import android.view.View;
import android.webkit.WebView;
import org.json.JSONObject;
import java.io.InputStream;

public class SplashActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.splash);
        
        // Try to load JSON animation
        try {
            loadJsonAnimation();
        } catch (Exception e) {
            android.util.Log.e("SplashActivity", "Animation error: " + e.getMessage());
        }
        
        // Navigate to MainActivity after 3 seconds
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            try {
                Intent intent = new Intent(SplashActivity.this, MainActivity.class);
                startActivity(intent);
            } catch (Exception e) {
                android.util.Log.e("SplashActivity", "Navigation error: " + e.getMessage());
            } finally {
                finish();
            }
        }, 3000);
    }
    
    private void loadJsonAnimation() {
        try {
            FrameLayout container = findViewById(R.id.animation_container);
            if (container != null) {
                // Create a WebView to render the animation
                WebView webView = new WebView(this);
                container.addView(webView);
                
                // Load HTML with animation
                String html = "<!DOCTYPE html><html><head><style>" +
                    "body { margin: 0; padding: 0; background: #0c332c; display: flex; align-items: center; justify-content: center; height: 100vh; }" +
                    "</style></head><body>" +
                    "<svg viewBox='0 0 400 400' width='200' height='200' xmlns='http://www.w3.org/2000/svg'>" +
                    "<circle cx='80' cy='200' r='20' fill='#a0fab2'><animate attributeName='cy' values='200;100;200' dur='0.6s' repeatCount='indefinite'/></circle>" +
                    "<circle cx='160' cy='200' r='20' fill='#a0fab2'><animate attributeName='cy' values='200;100;200' dur='0.6s' repeatCount='indefinite' begin='0.1s'/></circle>" +
                    "<circle cx='240' cy='200' r='20' fill='#a0fab2'><animate attributeName='cy' values='200;100;200' dur='0.6s' repeatCount='indefinite' begin='0.2s'/></circle>" +
                    "<circle cx='320' cy='200' r='20' fill='#a0fab2'><animate attributeName='cy' values='200;100;200' dur='0.6s' repeatCount='indefinite' begin='0.3s'/></circle>" +
                    "</svg>" +
                    "</body></html>";
                
                webView.loadData(html, "text/html", "utf-8");
            }
        } catch (Exception e) {
            android.util.Log.e("SplashActivity", "JSON Animation load error: " + e.getMessage());
        }
    }
}
