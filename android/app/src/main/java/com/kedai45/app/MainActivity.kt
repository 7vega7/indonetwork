package com.kedai45.app

import android.annotation.SuppressLint
import android.os.Bundle
import android.provider.Settings
import android.webkit.*
import android.widget.ProgressBar
import android.widget.RelativeLayout
import androidx.appcompat.app.AppCompatActivity
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var progressBar: ProgressBar

    companion object {
        const val BASE_URL = "https://indonetwork.pages.dev"
        const val REGISTER_PATH = "/daftar"
        const val REF_CODE = "app"
    }

    @SuppressLint("SetJavaScriptEnabled", "HardwareIds")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Get ANDROID_ID
        val androidId = Settings.Secure.getString(
            contentResolver,
            Settings.Secure.ANDROID_ID
        ) ?: "unknown"

        // Setup layout
        val layout = RelativeLayout(this)
        setContentView(layout)

        // SwipeRefresh
        swipeRefresh = SwipeRefreshLayout(this)
        val swipeParams = RelativeLayout.LayoutParams(
            RelativeLayout.LayoutParams.MATCH_PARENT,
            RelativeLayout.LayoutParams.MATCH_PARENT
        )
        layout.addView(swipeRefresh, swipeParams)

        // WebView
        webView = WebView(this)
        swipeRefresh.addView(webView)

        // ProgressBar
        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal)
        progressBar.layoutParams = RelativeLayout.LayoutParams(
            RelativeLayout.LayoutParams.MATCH_PARENT, 8
        )
        progressBar.max = 100
        layout.addView(progressBar)

        // WebView settings
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            builtInZoomControls = false
            displayZoomControls = false
            setSupportZoom(false)
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            cacheMode = WebSettings.LOAD_DEFAULT
            userAgentString = userAgentString + " Kedai45App/1.0"
        }

        // WebViewClient
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                swipeRefresh.isRefreshing = false

                // Inject ANDROID_ID ke localStorage
                val js = """
                    (function() {
                        localStorage.setItem('device_id', '$androidId');
                        localStorage.setItem('is_app', 'true');
                        
                        // Jika di halaman daftar, tambah parameter did
                        if (window.location.pathname === '$REGISTER_PATH' || 
                            window.location.pathname.includes('daftar')) {
                            var url = new URL(window.location.href);
                            if (!url.searchParams.get('did')) {
                                url.searchParams.set('did', '$androidId');
                                if (!url.searchParams.get('ref')) {
                                    url.searchParams.set('ref', '$REF_CODE');
                                }
                                window.history.replaceState({}, '', url.toString());
                            }
                        }
                    })();
                """.trimIndent()
                view?.evaluateJavascript(js, null)
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                // Hanya izinkan URL dari domain kita
                if (url.startsWith(BASE_URL) || url.startsWith("https://kedai45.com")) {
                    return false
                }
                return true
            }
        }

        // WebChromeClient untuk progress
        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.progress = newProgress
                progressBar.visibility = if (newProgress == 100) 
                    android.view.View.GONE else android.view.View.VISIBLE
            }
        }

        // SwipeRefresh
        swipeRefresh.setOnRefreshListener {
            webView.reload()
        }
        swipeRefresh.setColorSchemeColors(
            0xFF00C8FF.toInt(),
            0xFF7B2FFF.toInt(),
            0xFFFF2D78.toInt()
        )

        // Load URL - langsung ke halaman daftar dengan ref dan did
        val startUrl = "$BASE_URL$REGISTER_PATH?ref=$REF_CODE&did=$androidId"
        webView.loadUrl(startUrl)
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }
}
