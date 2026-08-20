package world.onelev1.app

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.core.content.ContextCompat
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : TauriActivity() {
  private val handler = Handler(Looper.getMainLooper())

  /**
   * ה-WebView טוען אתר מרוחק (www.1lev1.com), ולא נכסים מקומיים. בלי ההחזקה
   * הזאת רואים מסך ריק בין ירידת ה-splash לבין הציור הראשון של האתר. מסך
   * הפתיחה נשאר עד שהאתר צויר בפועל, ולכל היותר SPLASH_TIMEOUT_MS — כדי שרשת
   * איטית או נפילה לא ינעלו את המשתמש על ה-splash.
   */
  private var siteReady = false
  private var awaitingPaint = false
  private var started = 0L

  override fun onCreate(savedInstanceState: Bundle?) {
    installSplashScreen().setKeepOnScreenCondition { !siteReady }
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
    started = System.currentTimeMillis()
    handler.postDelayed({
      if (!siteReady) Log.i(TAG, "splash released by TIMEOUT at ${elapsed()}ms")
      siteReady = true
    }, SPLASH_TIMEOUT_MS)
  }

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    // ברירת המחדל של WebView לבנה (ובמצב לילה — שחורה). אם ה-timeout בכל זאת
    // קפץ לפני שהאתר צויר, שיראו את צבע המותג ולא מסך לבן או שחור.
    val chrome = ContextCompat.getColor(this, R.color.splash_background)
    webView.setBackgroundColor(chrome)
    applyBarInsets(webView, chrome)
    handler.post(object : Runnable {
      override fun run() {
        if (siteReady) return
        // אי אפשר להסתמך על webView.progress: הוא כבר 100 על המסמך הריק, לפני
        // שהאתר המרוחק התחיל להיטען. לכן שואלים את המסמך עצמו.
        webView.evaluateJavascript(CONTENT_PROBE) { result ->
          if (hasContent(result) && !awaitingPaint) {
            awaitingPaint = true
            Log.i(TAG, "content ready at ${elapsed()}ms")
            // יש תוכן — להמתין גם לפריים עצמו, לא רק ל-DOM.
            webView.postVisualStateCallback(
              VISUAL_STATE_REQUEST_ID,
              object : WebView.VisualStateCallback() {
                override fun onComplete(requestId: Long) {
                  Log.i(TAG, "first paint at ${elapsed()}ms")
                  siteReady = true
                }
              }
            )
          }
        }
        // הפולינג נמשך ללא תלות ב-callback: כשאין עדיין מסמך, WebView פשוט לא
        // קורא לו — ואם היינו משרשרים דרכו, הבדיקה הייתה מתה בניסיון הראשון.
        handler.postDelayed(this, POLL_INTERVAL_MS)
      }
    })
  }

  override fun onDestroy() {
    handler.removeCallbacksAndMessages(null)
    super.onDestroy()
  }

  /**
   * האתר לא מודע ל-safe-area: ה-viewport meta שלו הוא `width=device-width`
   * בלי `viewport-fit=cover`, ולכן `env(safe-area-inset-*)` הוא 0 גם ב-WebView
   * שפרוש מקצה לקצה — והכותרת נמשכת אל מתחת לשעון ולסמלי הרשת.
   *
   * לכבות `enableEdgeToEdge()` לא יעזור: מ-API 35 המערכת כופה edge-to-edge על
   * `targetSdk` שלנו בכל מקרה (ומ-36 גם דגל ה-opt-out כבר לא נשמע). לכן
   * ה-WebView מוקטן בעצמו לפי ה-insets, וזה עובד זהה בכל הגרסאות. הרצועות
   * שנשארות מסביבו צבועות בצבע המותג דרך windowBackground.
   *
   * `adb logcat -s Lev1Splash:I` מדפיס את ערכי ה-insets שהתקבלו בפועל — אם
   * שורת ה-`insets` לא מופיעה, ה-listener לא נקרא; אם היא מופיעה עם אפסים,
   * מישהו בשרשרת צרך אותם לפנינו.
   */
  private fun applyBarInsets(webView: WebView, chrome: Int) {
    // הרצועות שנפתחות מתחת לסרגלים הן שטח של החלון, לא של ה-WebView, ולכן
    // הרקע שנראה בהן הוא windowBackground.
    window.setBackgroundDrawable(ColorDrawable(chrome))

    ViewCompat.setOnApplyWindowInsetsListener(webView) { view, insets ->
      // ה-insets שמגיעים בשרשרת הדיספאץ' עלולים להגיע כבר צרוכים: מעל
      // ה-WebView יושב ה-sub-decor של AppCompat‏ (FitWindowsLinearLayout עם
      // fitsSystemWindows="true"), ומי שמרפד את עצמו גם צורך. לכן המקור הוא
      // getRootWindowInsets — מה שהחלון באמת מקבל — ומה שהגיע בשרשרת משמש רק
      // כגיבוי אם אין root insets עדיין.
      val source = ViewCompat.getRootWindowInsets(view) ?: insets
      val bars = source.getInsets(
        WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
      )
      Log.i(TAG, "insets l=${bars.left} t=${bars.top} r=${bars.right} b=${bars.bottom}")

      // מרג'ין ולא padding: הוא מקטין את ה-View עצמו, ולכן ה-viewport של
      // ה-WebView מתעדכן ודאית. ההשוואה לפני ההשמה חוסמת לולאת layout
      // אינסופית — כל השמה של layoutParams מזמינה דיספאץ' חדש של insets.
      val lp = view.layoutParams as? ViewGroup.MarginLayoutParams
      if (lp == null) {
        view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
      } else if (lp.leftMargin != bars.left || lp.topMargin != bars.top ||
        lp.rightMargin != bars.right || lp.bottomMargin != bars.bottom
      ) {
        lp.setMargins(bars.left, bars.top, bars.right, bars.bottom)
        view.layoutParams = lp
      }
      insets
    }
    // ה-listener נרשם ב-onWebViewCreate, לפני ש-wry מצרף את ה-WebView לחלון;
    // בקשה מפורשת ברגע החיבור מבטיחה שהוא ייקרא גם אם הדיספאץ' הראשון חלף.
    webView.addOnAttachStateChangeListener(object : View.OnAttachStateChangeListener {
      override fun onViewAttachedToWindow(v: View) {
        ViewCompat.requestApplyInsets(v)
      }

      override fun onViewDetachedFromWindow(v: View) {}
    })
    if (webView.isAttachedToWindow) ViewCompat.requestApplyInsets(webView)
    // סמלי שורת הסטטוס: כהים על רקע בהיר, בהירים על כהה. הצבע מגיע
    // מ-values/ או מ-values-night/ ולכן החישוב תופס את שני המצבים.
    val light = (0.299 * Color.red(chrome) + 0.587 * Color.green(chrome) +
      0.114 * Color.blue(chrome)) > 140
    WindowInsetsControllerCompat(window, webView).apply {
      isAppearanceLightStatusBars = light
      isAppearanceLightNavigationBars = light
    }
  }

  /**
   * `evaluateJavascript` מחזיר JSON, ולכן מחרוזת חוזרת עטופה במרכאות — השוואה
   * ישירה ל-"true" של ביטוי בוליאני ב-JS פשוט לא עובדת. הרצף הצפוי הוא
   * `about:|complete|0` (המסמך הריק) → `https:|loading|N` → `https:|complete|N`.
   */
  private fun hasContent(result: String?): Boolean {
    val parts = result?.trim('"')?.split('|') ?: return false
    if (parts.size != 3) return false
    return parts[0].startsWith("http") &&
      parts[1] != "loading" &&
      (parts[2].toIntOrNull() ?: 0) > 0
  }

  private fun elapsed() = System.currentTimeMillis() - started

  private companion object {
    /** `adb logcat -s Lev1Splash:I` נותן את התזמון המדויק בלי לבנות מחדש. */
    const val TAG = "Lev1Splash"

    /** מחזיר `protocol|readyState|מספר הילדים של body` — ראה [hasContent]. */
    const val CONTENT_PROBE =
      "location.protocol + '|' + document.readyState + '|' + " +
        "(document.body ? document.body.children.length : -1)"
    const val SPLASH_TIMEOUT_MS = 10000L
    const val POLL_INTERVAL_MS = 100L
    const val VISUAL_STATE_REQUEST_ID = 1L
  }
}
