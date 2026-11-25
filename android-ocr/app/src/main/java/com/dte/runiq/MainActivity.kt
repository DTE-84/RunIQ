package com.dte.runiq

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.text.InputType
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var overlayStatus: TextView
    private lateinit var serviceStatus: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val pad = (24 * resources.displayMetrics.density).toInt()
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(pad, pad, pad, pad)
        }

        fun label(t: String, size: Float = 16f) = TextView(this).apply {
            text = t; textSize = size; setPadding(0, pad / 2, 0, 0)
        }
        fun numField(value: Float) = EditText(this).apply {
            setText(if (value % 1f == 0f) value.toInt().toString() else value.toString())
            inputType = InputType.TYPE_CLASS_NUMBER or InputType.TYPE_NUMBER_FLAG_DECIMAL
            setSingleLine(true)
        }

        root.addView(label("RunIQ setup", 24f))
        root.addView(label("Reads the offer on Spark's screen and shows TAKE IT / MAYBE / PASS."))

        // 1. Overlay permission
        overlayStatus = label("")
        root.addView(overlayStatus)
        root.addView(Button(this).apply {
            text = "1. Allow display over other apps"
            setOnClickListener {
                startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName")))
            }
        })

        // 2. Accessibility
        serviceStatus = label("")
        root.addView(serviceStatus)
        root.addView(Button(this).apply {
            text = "2. Turn on RunIQ Offer Reader in Accessibility"
            setOnClickListener { startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) }
        })

        // 3. Minimums
        root.addView(label("3. Your minimums (below both = PASS)"))
        root.addView(label("Min $ per mile", 14f))
        val perMile = numField(Calc.minPerMile(this)); root.addView(perMile)
        root.addView(label("Min $ per hour", 14f))
        val perHour = numField(Calc.minPerHour(this)); root.addView(perHour)
        root.addView(Button(this).apply {
            text = "Save minimums"
            setOnClickListener {
                val m = perMile.text.toString().toFloatOrNull()
                val h = perHour.text.toString().toFloatOrNull()
                if (m == null || h == null) {
                    Toast.makeText(this@MainActivity, "Enter both numbers", Toast.LENGTH_SHORT).show()
                } else {
                    Calc.saveTargets(this@MainActivity, m, h)
                    Toast.makeText(this@MainActivity, "Saved", Toast.LENGTH_SHORT).show()
                }
            }
        })

        // 4. Optional: link to your RunIQ account so offers save to your history
        root.addView(label("4. Optional: save offers to your RunIQ history. Paste your key (RunIQ app > Settings > Phone Connection Key)"))
        val keyInput = EditText(this).apply {
            hint = "riq_..."
            setText(TelemetryClient.loadKey(this@MainActivity))
            setSingleLine(true)
        }
        root.addView(keyInput)
        root.addView(Button(this).apply {
            text = "Save key"
            setOnClickListener {
                TelemetryClient.saveKey(this@MainActivity, keyInput.text.toString())
                Toast.makeText(this@MainActivity, "Key saved", Toast.LENGTH_SHORT).show()
            }
        })

        setContentView(ScrollView(this).apply { addView(root) })
    }

    override fun onResume() {
        super.onResume()
        overlayStatus.text = "Overlay permission: " + if (Settings.canDrawOverlays(this)) "granted" else "NOT granted"

        val enabled = Settings.Secure.getString(contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
            ?.contains("$packageName/") == true
        serviceStatus.text = "Offer Reader: " + if (enabled) "ON" else "OFF"
    }
}
