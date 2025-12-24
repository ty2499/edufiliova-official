package com.edufiliova.app;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.widget.ImageView;

public class SplashActivity extends Activity {
    private static final int SPLASH_DURATION = 3000; // 3 seconds

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.splash);

        try {
            // Get circle views
            ImageView circle1 = findViewById(R.id.circle1);
            ImageView circle2 = findViewById(R.id.circle2);
            ImageView circle3 = findViewById(R.id.circle3);
            ImageView circle4 = findViewById(R.id.circle4);

            // Load animations with staggered delays
            Animation anim1 = AnimationUtils.loadAnimation(this, R.anim.delay1);
            Animation anim2 = AnimationUtils.loadAnimation(this, R.anim.delay2);
            Animation anim3 = AnimationUtils.loadAnimation(this, R.anim.delay3);
            Animation anim4 = AnimationUtils.loadAnimation(this, R.anim.delay4);

            // Start animations
            if (circle1 != null && anim1 != null) circle1.startAnimation(anim1);
            if (circle2 != null && anim2 != null) circle2.startAnimation(anim2);
            if (circle3 != null && anim3 != null) circle3.startAnimation(anim3);
            if (circle4 != null && anim4 != null) circle4.startAnimation(anim4);

        } catch (Exception e) {
            e.printStackTrace();
        }

        // Navigate to MainActivity after splash
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            try {
                Intent intent = new Intent(SplashActivity.this, MainActivity.class);
                startActivity(intent);
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                finish();
            }
        }, SPLASH_DURATION);
    }
}
