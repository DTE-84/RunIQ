package com.dte.runiq

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import android.widget.LinearLayout
import android.widget.TextView
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

        root.addView(TextView(this).apply {
            text = "RunIQ setup"
            textSize = 24f
        })

        overlayStatus = TextView(this).apply { textSize = 16f; setPadding(0, pad, 0, 0) }
        root.addView(overlayStatus)
        root.addView(Button(this).apply {
            text = "1. Allow display over other apps"
            setOnClickListener {
                startActivity(
                    Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName"))
                )
            }
        })

        serviceStatus = TextView(this).apply { textSize = 16f; setPadding(0, pad, 0, 0) }
        root.addView(serviceStatus)
        root.addView(Button(this).apply {
            text = "2. Turn on RunIQ Offer Reader in Accessibility"
            setOnClickListener { startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) }
        })

        root.addView(TextView(this).apply {
            text = "3. Paste your connection key (RunIQ app > Settings > Phone Connection Key)"
            textSize = 16f
            setPadding(0, pad, 0, 0)
        })
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

        setContentView(root)
    }

    override fun onResume() {
        super.onResume()
        val overlayOk = Settings.canDrawOverlays(this)
        overlayStatus.text = "Overlay permission: " + if (overlayOk) "granted" else "NOT granted"

        val enabled = Settings.Secure.getString(contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
            ?.contains("$packageName/") == true
        serviceStatus.text = "Accessibility service: " + if (enabled) "ON" else "OFF"
    }
}
