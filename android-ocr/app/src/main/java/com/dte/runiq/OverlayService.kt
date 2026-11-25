package com.dte.runiq

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.text.Editable
import android.text.InputType
import android.text.TextWatcher
import android.view.inputmethod.EditorInfo
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.app.NotificationCompat
import kotlin.math.abs

/**
 * Floating RunIQ bubble. Tap = open the calculator panel, tap outside / ▾ = shrink back.
 * Drag the bubble anywhere. It never reads or touches other apps — it's just a window on top.
 */
class OverlayService : Service() {

    companion object {
        const val CHANNEL_ID = "runiq_overlay"
        const val ACTION_STOP = "com.dte.runiq.STOP_OVERLAY"
    }

    private lateinit var wm: WindowManager
    private var bubble: TextView? = null
    private var panel: LinearLayout? = null
    private var panelShowing = false
    private lateinit var bubbleParams: WindowManager.LayoutParams
    private lateinit var panelParams: WindowManager.LayoutParams

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            OverlayMode.set(this, OverlayMode.OFF)
            stopSelf()
            return START_NOT_STICKY
        }
        startAsForeground()
        wm = getSystemService(WINDOW_SERVICE) as WindowManager
        if (bubble == null) showBubble()
        return START_STICKY
    }

    private fun dp(v: Int): Int =
        TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v.toFloat(), resources.displayMetrics).toInt()

    private val overlayType: Int
        get() = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        else @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE

    // ---------- Bubble ----------

    @SuppressLint("ClickableViewAccessibility")
    private fun showBubble() {
        val b = TextView(this).apply {
            text = "IQ"
            setTextColor(Color.WHITE)
            textSize = 18f
            gravity = Gravity.CENTER
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#16A34A"))
                setStroke(dp(2), Color.WHITE)
            }
            elevation = dp(6).toFloat()
        }

        bubbleParams = WindowManager.LayoutParams(
            dp(56), dp(56), overlayType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = dp(8)
            y = dp(200)
        }

        var startX = 0; var startY = 0
        var touchX = 0f; var touchY = 0f
        var moved = false

        b.setOnTouchListener { _, e ->
            when (e.action) {
                MotionEvent.ACTION_DOWN -> {
                    startX = bubbleParams.x; startY = bubbleParams.y
                    touchX = e.rawX; touchY = e.rawY
                    moved = false; true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = (e.rawX - touchX).toInt()
                    val dy = (e.rawY - touchY).toInt()
                    if (abs(dx) > dp(6) || abs(dy) > dp(6)) moved = true
                    if (moved) {
                        bubbleParams.x = startX + dx
                        bubbleParams.y = startY + dy
                        wm.updateViewLayout(b, bubbleParams)
                    }
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (!moved) togglePanel()
                    true
                }
                else -> false
            }
        }

        wm.addView(b, bubbleParams)
        bubble = b
    }

    // ---------- Panel (calculator) ----------

    @SuppressLint("ClickableViewAccessibility")
    private fun buildPanel(): LinearLayout {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = GradientDrawable().apply {
                cornerRadius = dp(16).toFloat()
                setColor(Color.parseColor("#111827"))
            }
            elevation = dp(10).toFloat()
            clipToOutline = true
        }

        val header = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(dp(14), dp(8), dp(8), dp(8))
            gravity = Gravity.CENTER_VERTICAL
        }
        val title = TextView(this).apply {
            text = "RunIQ"
            setTextColor(Color.WHITE)
            textSize = 15f
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }
        fun headerBtn(label: String, onClick: () -> Unit) = TextView(this).apply {
            text = label
            setTextColor(Color.parseColor("#D1D5DB"))
            textSize = 18f
            setPadding(dp(12), dp(4), dp(12), dp(4))
            setOnClickListener { onClick() }
        }
        header.addView(title)
        header.addView(headerBtn("▾") { hidePanel() })     // minimize
        header.addView(headerBtn("✕") { OverlayMode.set(this, OverlayMode.OFF); stopSelf() })
        root.addView(header)

        // --- Inputs ---
        fun field(hint: String, decimal: Boolean = true) = EditText(this).apply {
            this.hint = hint
            setHintTextColor(Color.parseColor("#6B7280"))
            setTextColor(Color.WHITE)
            textSize = 18f
            inputType = if (decimal)
                InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_DECIMAL
            else InputType.TYPE_CLASS_NUMBER
            imeOptions = EditorInfo.IME_ACTION_NEXT
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }
        fun row(vararg views: View) = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(dp(14), 0, dp(14), 0)
            views.forEach { addView(it) }
        }

        val pay = field("Pay $")
        val miles = field("Miles")
        val deadhead = field("Return mi")
        val stops = field("Stops", decimal = false)
        val minutes = field("Min (opt)", decimal = false)
        root.addView(row(pay, miles))
        root.addView(row(deadhead, stops, minutes))

        // --- Result ---
        val verdict = TextView(this).apply {
            textSize = 26f
            gravity = Gravity.CENTER
            setTextColor(Color.WHITE)
            setPadding(0, dp(10), 0, 0)
        }
        val detail = TextView(this).apply {
            textSize = 15f
            gravity = Gravity.CENTER
            setTextColor(Color.parseColor("#D1D5DB"))
            setPadding(0, dp(4), 0, dp(8))
        }
        root.addView(verdict)
        root.addView(detail)

        val clear = TextView(this).apply {
            text = "Clear"
            setTextColor(Color.parseColor("#9CA3AF"))
            textSize = 14f
            gravity = Gravity.CENTER
            setPadding(0, dp(4), 0, dp(10))
        }
        root.addView(clear)

        fun num(e: EditText) = e.text.toString().toDoubleOrNull()
        fun recalc() {
            val r = Calc.evaluate(
                this, num(pay) ?: 0.0, num(miles) ?: 0.0, num(deadhead) ?: 0.0,
                num(stops)?.toInt() ?: 1, num(minutes)
            )
            if (r == null) {
                verdict.text = "Enter pay + miles"
                verdict.setTextColor(Color.parseColor("#9CA3AF"))
                detail.text = "Targets: $%.2f/mi · $%.0f/hr".format(
                    Calc.minPerMile(this), Calc.minPerHour(this))
                return
            }
            verdict.text = when (r.verdict) {
                Calc.Verdict.TAKE -> "TAKE IT"
                Calc.Verdict.MAYBE -> "MAYBE"
                Calc.Verdict.PASS -> "PASS"
            }
            verdict.setTextColor(Color.parseColor(when (r.verdict) {
                Calc.Verdict.TAKE -> "#22C55E"
                Calc.Verdict.MAYBE -> "#EAB308"
                Calc.Verdict.PASS -> "#EF4444"
            }))
            detail.text = "$%.2f/mi  ·  $%.0f/hr  ·  ~%.0f min".format(r.perMile, r.perHour, r.minutes)
        }
        val watcher = object : TextWatcher {
            override fun afterTextChanged(s: Editable?) = recalc()
            override fun beforeTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
            override fun onTextChanged(s: CharSequence?, a: Int, b: Int, c: Int) {}
        }
        listOf(pay, miles, deadhead, stops, minutes).forEach { it.addTextChangedListener(watcher) }
        clear.setOnClickListener {
            listOf(pay, miles, deadhead, stops, minutes).forEach { it.text.clear() }
            pay.requestFocus()
        }
        recalc()

        // Tap anywhere outside the panel = shrink back to bubble
        root.setOnTouchListener { _, e ->
            if (e.action == MotionEvent.ACTION_OUTSIDE) { hidePanel(); true } else false
        }
        return root
    }

    private fun togglePanel() = if (panelShowing) hidePanel() else showPanel()

    private fun showPanel() {
        if (panel == null) {
            panel = buildPanel()
            val screenW = resources.displayMetrics.widthPixels
            panelParams = WindowManager.LayoutParams(
                (screenW * 0.92).toInt(), WindowManager.LayoutParams.WRAP_CONTENT, overlayType,
                // Focusable so the keyboard works; NOT_TOUCH_MODAL lets taps outside go to Spark
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                    WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
                y = dp(60)
                softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
            }
        }
        if (!panelShowing) {
            wm.addView(panel, panelParams)
            panelShowing = true
            bubble?.visibility = View.GONE
        }
    }

    private fun hidePanel() {
        if (panelShowing) {
            wm.removeView(panel)   // view (and typed numbers) kept in memory
            panelShowing = false
            bubble?.visibility = View.VISIBLE
        }
    }

    // ---------- Foreground notification (keeps Android from killing it) ----------

    private fun startAsForeground() {
        val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            nm.createNotificationChannel(
                NotificationChannel(CHANNEL_ID, "RunIQ overlay", NotificationManager.IMPORTANCE_LOW)
            )
        }
        val stopIntent = PendingIntent.getService(
            this, 0,
            Intent(this, OverlayService::class.java).setAction(ACTION_STOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val n: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("RunIQ bubble is on")
            .setContentText("Tap the IQ bubble to check an offer")
            .addAction(0, "Turn off", stopIntent)
            .setOngoing(true)
            .build()

        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(1, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(1, n)
        }
    }

    override fun onDestroy() {
        if (panelShowing) wm.removeView(panel)
        bubble?.let { wm.removeView(it) }
        bubble = null; panel = null; panelShowing = false
        super.onDestroy()
    }
}
