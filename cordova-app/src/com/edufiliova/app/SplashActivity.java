package com.edufiliova.app;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.LinearLayout;
import android.view.animation.AnimationUtils;

public class SplashActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.splash);
        
        // Animate the circles
        try {
            View circle1 = findViewById(R.id.circle1);
            View circle2 = findViewById(R.id.circle2);
            View circle3 = findViewById(R.id.circle3);
            View circle4 = findViewById(R.id.circle4);
            
            if (circle1 != null) {
                circle1.startAnimation(AnimationUtils.loadAnimation(this, R.anim.bounce_up));
            }
            if (circle2 != null) {
                android.view.animation.Animation anim2 = AnimationUtils.loadAnimation(this, R.anim.bounce_up);
                anim2.setStartOffset(100);
                circle2.startAnimation(anim2);
            }
            if (circle3 != null) {
                android.view.animation.Animation anim3 = AnimationUtils.loadAnimation(this, R.anim.bounce_up);
                anim3.setStartOffset(200);
                circle3.startAnimation(anim3);
            }
            if (circle4 != null) {
                android.view.animation.Animation anim4 = AnimationUtils.loadAnimation(this, R.anim.bounce_up);
                anim4.setStartOffset(300);
                circle4.startAnimation(anim4);
            }
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
}
