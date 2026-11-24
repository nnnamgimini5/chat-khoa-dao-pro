package vn.daopro.chatkhoa;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import androidx.core.view.WindowCompat;
import androidx.webkit.WebViewAssetLoader;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/** Vỏ Android cho app web Chat Khóa: WebView + cầu nối vân tay, thông báo, lưu file, chia sẻ. */
public class MainActivity extends AppCompatActivity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String HOME = "https://" + HOST + "/assets/www/index.html";
    private static final String CHANNEL = "messages";

    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private PermissionRequest pendingCamera;
    private int notifId = 1;

    private final ActivityResultLauncher<Intent> fileLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(), result -> {
                if (fileCallback != null) {
                    fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result.getResultCode(), result.getData()));
                    fileCallback = null;
                }
            });

    private final ActivityResultLauncher<String> cameraLauncher = registerForActivityResult(
            new ActivityResultContracts.RequestPermission(), granted -> {
                if (pendingCamera != null) {
                    if (granted) pendingCamera.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                    else pendingCamera.deny();
                    pendingCamera = null;
                }
            });

    private final ActivityResultLauncher<String> notifyLauncher = registerForActivityResult(
            new ActivityResultContracts.RequestPermission(), granted -> { });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Không cho chụp màn hình và che nội dung trong danh sách app gần đây
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
        createChannel();

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#F2F5FB"));
        setContentView(web);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setTextZoom(100);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (HOST.equals(u.getHost())) return false;
                openExternal(u.toString());
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try {
                    fileLauncher.launch(params.createIntent());
                } catch (Exception e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }

            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    boolean wantsCamera = false;
                    for (String r : request.getResources()) {
                        if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)) wantsCamera = true;
                    }
                    if (!wantsCamera || !HOST.equals(request.getOrigin().getHost())) {
                        request.deny();
                        return;
                    }
                    if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                        request.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                    } else {
                        pendingCamera = request;
                        cameraLauncher.launch(Manifest.permission.CAMERA);
                    }
                });
            }
        });

        web.addJavascriptInterface(new Bridge(), "DaoNative");

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                web.evaluateJavascript("(window.DaoApp && window.DaoApp.onBack()) ? 'yes' : 'no'", value -> {
                    if (value == null || !value.contains("yes")) moveTaskToBack(true);
                });
            }
        });

        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl(HOME);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    protected void onDestroy() {
        if (web != null) web.destroy();
        super.onDestroy();
    }

    private void evalJs(final String js) {
        runOnUiThread(() -> web.evaluateJavascript(js, null));
    }

    private void openExternal(String url) {
        if (url == null || !(url.startsWith("https://") || url.startsWith("http://") || url.startsWith("mailto:"))) return;
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
        } catch (Exception ignored) {
        }
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, getString(R.string.notif_channel), NotificationManager.IMPORTANCE_HIGH);
            ch.setLockscreenVisibility(NotificationCompat.VISIBILITY_PRIVATE);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(ch);
        }
    }

    /** Các hàm JavaScript gọi được qua window.DaoNative */
    private class Bridge {
        @JavascriptInterface
        public boolean hasBiometric() {
            return BiometricManager.from(MainActivity.this)
                    .canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_WEAK) == BiometricManager.BIOMETRIC_SUCCESS;
        }

        @JavascriptInterface
        public void authenticate(final String rawId) {
            final String id = rawId == null ? "" : rawId.replaceAll("[^A-Za-z0-9]", "");
            runOnUiThread(() -> {
                BiometricPrompt prompt = new BiometricPrompt(MainActivity.this, ContextCompat.getMainExecutor(MainActivity.this),
                        new BiometricPrompt.AuthenticationCallback() {
                            @Override
                            public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                                evalJs("window.DaoBio && DaoBio.resolve('" + id + "', true)");
                            }

                            @Override
                            public void onAuthenticationError(int code, CharSequence msg) {
                                evalJs("window.DaoBio && DaoBio.resolve('" + id + "', false, 'cancel')");
                            }
                        });
                BiometricPrompt.PromptInfo info = new BiometricPrompt.PromptInfo.Builder()
                        .setTitle(getString(R.string.bio_title))
                        .setSubtitle(getString(R.string.bio_sub))
                        .setNegativeButtonText(getString(R.string.bio_cancel))
                        .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_WEAK)
                        .build();
                prompt.authenticate(info);
            });
        }

        @JavascriptInterface
        public void requestNotify() {
            if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                runOnUiThread(() -> notifyLauncher.launch(Manifest.permission.POST_NOTIFICATIONS));
            }
        }

        @JavascriptInterface
        public void notify(String title, String body) {
            if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return;
            Intent open = new Intent(MainActivity.this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent pi = PendingIntent.getActivity(MainActivity.this, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            NotificationCompat.Builder b = new NotificationCompat.Builder(MainActivity.this, CHANNEL)
                    .setSmallIcon(R.drawable.ic_notif)
                    .setColor(Color.parseColor("#1550E8"))
                    .setContentTitle(title)
                    .setContentText(body)
                    .setAutoCancel(true)
                    .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setContentIntent(pi);
            try {
                NotificationManagerCompat.from(MainActivity.this).notify(notifId++, b.build());
            } catch (SecurityException ignored) {
            }
        }

        @JavascriptInterface
        public void saveFile(String name, String base64, String mime) {
            String safe = (name == null ? "tep" : name).replaceAll("[\\\\/:*?\"<>|]", "_");
            try {
                byte[] data = Base64.decode(base64, Base64.DEFAULT);
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Downloads.DISPLAY_NAME, safe);
                    v.put(MediaStore.Downloads.MIME_TYPE, mime);
                    v.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/ChatKhoa");
                    Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                    if (uri == null) throw new Exception("insert");
                    try (OutputStream os = getContentResolver().openOutputStream(uri)) {
                        if (os == null) throw new Exception("open");
                        os.write(data);
                    }
                } else {
                    File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "ChatKhoa");
                    if (!dir.exists() && !dir.mkdirs()) throw new Exception("mkdir");
                    try (FileOutputStream os = new FileOutputStream(new File(dir, safe))) {
                        os.write(data);
                    }
                }
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Đã lưu vào Download/ChatKhoa/" + safe, Toast.LENGTH_LONG).show());
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Không lưu được file", Toast.LENGTH_LONG).show());
            }
        }

        @JavascriptInterface
        public void share(String text) {
            Intent i = new Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text);
            runOnUiThread(() -> startActivity(Intent.createChooser(i, "Chia sẻ Chat Khóa")));
        }

        @JavascriptInterface
        public void openUrl(String url) {
            runOnUiThread(() -> openExternal(url));
        }

        @JavascriptInterface
        public void setTheme(String mode) {
            final boolean dark = "dark".equals(mode);
            runOnUiThread(() -> {
                getWindow().setStatusBarColor(Color.parseColor(dark ? "#17378F" : "#1550E8"));
                if (Build.VERSION.SDK_INT >= 27) {
                    getWindow().setNavigationBarColor(Color.parseColor(dark ? "#172033" : "#FFFFFF"));
                    WindowCompat.getInsetsController(getWindow(), web).setAppearanceLightNavigationBars(!dark);
                }
                web.setBackgroundColor(Color.parseColor(dark ? "#0E1422" : "#F2F5FB"));
            });
        }
    }
}
