package com.wordgame.english;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.WebViewListener;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import android.util.Log;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppUpdatePlugin.class);
        bridgeBuilder.addWebViewListener(new WebViewListener() {
            private boolean cacheCleared = false;
            private boolean cleanupStarted = false;

            @Override
            public void onPageStarted(WebView view) {
                if (!cacheCleared) {
                    cacheCleared = true;
                    view.clearCache(true);
                }
            }

            @Override
            public void onPageLoaded(WebView view) {
                if (cleanupStarted) return;
                cleanupStarted = true;
                try (InputStream input = getAssets().open("native-cache-cleanup.js")) {
                    ByteArrayOutputStream output = new ByteArrayOutputStream();
                    byte[] buffer = new byte[4096];
                    int count;
                    while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
                    String script = new String(output.toByteArray(), StandardCharsets.UTF_8);
                    view.evaluateJavascript(script, null);
                } catch (Exception error) {
                    Log.e("AppUpdate", "Unable to clean legacy resource cache", error);
                }
            }
        });
        super.onCreate(savedInstanceState);
    }
}
