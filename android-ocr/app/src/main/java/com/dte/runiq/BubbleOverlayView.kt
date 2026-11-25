package com.dte.runiq

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.MotionEvent
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import kotlin.math.abs

/** The floating verdict pill shown over Spark. Call every method on the main thread. */
class BubbleOverlayView(private val context: Context) {
    private val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    private var root: LinearLayout? = null
    private var verdictText: TextView? = null
    private var detailText: TextView? = null
    private var background: GradientDrawable? = null
    private var params: WindowManager.LayoutParams? = null

    private fun dp(v: Int) = (v * context.resources.displayMetrics.density).toInt()

    fun show(result: Calc.Result) {
        if (root == null) create()
        update(result)
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun create() {
        val bg = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = dp(18).toFloat()
            setStroke(dp(2), Color.WHITE)
        }
        val verdict = TextView(context).apply {
            textSize = 22f
            setTypeface(null, android.graphics.Typeface.BOLD)
            gravity = Gravity.CENTER
        }
        val detail = TextView(context).apply {
            textSize = 13f
            gravity = Gravity.CENTER
        }
        val container = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(8), dp(16), dp(8))
            background = bg
            addView(verdict)
            addView(detail)
        }

        val lp = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            y = dp(90)
        }

        // Drag to move
        var startX = 0; var startY = 0; var touchX = 0f; var touchY = 0f
        container.setOnTouchListener { _, e ->
            when (e.action) {
                MotionEvent.ACTION_DOWN -> {
                    startX = lp.x; startY = lp.y; touchX = e.rawX; touchY = e.rawY; true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = (e.rawX - touchX).toInt()
                    val dy = (e.rawY - touchY).toInt()
                    if (abs(dx) > dp(4) || abs(dy) > dp(4)) {
                        lp.x = startX + dx
                        lp.y = startY + dy
                        windowManager.updateViewLayout(container, lp)
                    }
                    true
                }
                else -> false
            }
        }

        windowManager.addView(container, lp)
        root = container; verdictText = verdict; detailText = detail; background = bg; params = lp
    }

    private fun update(r: Calc.Result) {
        val (label, fill, text) = when (r.verdict) {
            Calc.Verdict.TAKE -> Triple("TAKE IT", "#22C55E", "#052E16")
            Calc.Verdict.MAYBE -> Triple("MAYBE", "#EAB308", "#422006")
            Calc.Verdict.PASS -> Triple("PASS", "#EF4444", "#FFFFFF")
        }
        background?.setColor(Color.parseColor(fill))
        verdictText?.apply { this.text = label; setTextColor(Color.parseColor(text)) }
        detailText?.apply {
            this.text = "$%.2f/mi  ·  $%.0f/hr (est.)".format(r.perMile, r.perHour)
            setTextColor(Color.parseColor(text))
        }
    }

    fun remove() {
        root?.let { runCatching { windowManager.removeView(it) } }
        root = null; verdictText = null; detailText = null; background = null; params = null
    }
}
