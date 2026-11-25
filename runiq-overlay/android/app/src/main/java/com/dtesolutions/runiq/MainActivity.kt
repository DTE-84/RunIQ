package com.dtesolutions.runiq

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.text.InputType
import android.view.Gravity
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.core.content.ContextCompat

/** Home screen: set your targets, grant overlay permission, turn the bubble on. */
class MainActivity : Activity() {

    private lateinit var status: TextView
    private lateinit var mainBtn: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val pad = (20 * resources.displayMetrics.density).toInt()

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(pad, pad * 2, pad, pad)
            setBackgroundColor(Color.parseColor("#111827"))
        }
        fun label(t: String, size: Float = 16f) = TextView(this).apply {
            text = t; textSize = size; setTextColor(Color.WHITE); setPadding(0, pad / 2, 0, pad / 4)
        }
        fun numField(value: Float) = EditText(this).apply {
            setText(if (value % 1f == 0f) value.toInt().toString() else value.toString())
            setTextColor(Color.WHITE); textSize = 20f
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_DECIMAL
        }

        root.addView(label("RunIQ", 28f))
        root.addView(label("Your minimums — offers below both show PASS"))
        root.addView(label("Min $ per mile (incl. return miles)"))
        val perMile = numField(Calc.minPerMile(this)); root.addView(perMile)
        root.addView(label("Min $ per hour"))
        val perHour = numField(Calc.minPerHour(this)); root.addView(perHour)

        val save = Button(this).apply { text = "Save targets" }
        save.setOnClickListener {
            val m = perMile.text.toString().toFloatOrNull()
            val h = perHour.text.toString().toFloatOrNull()
            if (m == null || h == null) {
                Toast.makeText(this, "Enter both numbers", Toast.LENGTH_SHORT).show()
            } else {
                Calc.saveTargets(this, m, h)
                Toast.makeText(this, "Saved", Toast.LENGTH_SHORT).show()
            }
        }
        root.addView(save)

        status = label("").apply { gravity = Gravity.CENTER; setPadding(0, pad, 0, pad / 2) }
        root.addView(status)
        mainBtn = Button(this)
        root.addView(mainBtn)

        val stopBtn = Button(this).apply { text = "Turn bubble off" }
        stopBtn.setOnClickListener { stopService(Intent(this, OverlayService::class.java)) }
        root.addView(stopBtn)

        setContentView(root)

        // Android 13+: ask for notifications so the "bubble is on / Turn off" notice shows
        if (Build.VERSION.SDK_INT >= 33) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1)
        }
    }

    override fun onResume() {
        super.onResume()
        // Re-check every time you come back from the Settings screen
        if (Settings.canDrawOverlays(this)) {
            status.text = "✅ Overlay allowed"
            mainBtn.text = "Turn on RunIQ bubble"
            mainBtn.setOnClickListener {
                ContextCompat.startForegroundService(this, Intent(this, OverlayService::class.java))
                moveTaskToBack(true)   // drop back to Spark with the bubble showing
            }
        } else {
            status.text = "Step 1: allow \"Display over other apps\""
            mainBtn.text = "Allow overlay"
            mainBtn.setOnClickListener {
                startActivity(
                    Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName"))
                )
            }
        }
    }
}
