package com.edufiliova.app;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.LinearLayout;

public class SplashActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Create custom splash view programmatically
        LinearLayout splashLayout = new LinearLayout(this);
        splashLayout.setLayoutParams(new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.MATCH_PARENT));
        splashLayout.setBackgroundColor(0x0c332c); // Dark background
        splashLayout.setGravity(android.view.Gravity.CENTER);
        
        // Create circle views
        LinearLayout circleContainer = new LinearLayout(this);
        circleContainer.setLayoutParams(new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT));
        circleContainer.setOrientation(LinearLayout.HORIZONTAL);
        circleContainer.setGravity(android.view.Gravity.CENTER);
        
        int[] delays = {0, 200, 400, 600};
        for (int i = 0; i < 4; i++) {
            View circle = new View(this);
            LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(40, 40);
            params.setMargins(15, 0, 15, 0);
            circle.setLayoutParams(params);
            circle.setBackgroundColor(0xa0fab2); // Mint green
            
            // Set shape to circle using drawable
            circle.setBackground(getResources().getDrawable(R.drawable.circle));
            
            circleContainer.addView(circle);
        }
        
        splashLayout.addView(circleContainer);
        setContentView(splashLayout);
        
        // Navigate to MainActivity after 3 seconds
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            try {
                Intent intent = new Intent(SplashActivity.this, MainActivity.class);
                startActivity(intent);
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                finish();
            }
        }, 3000);
    }
}
