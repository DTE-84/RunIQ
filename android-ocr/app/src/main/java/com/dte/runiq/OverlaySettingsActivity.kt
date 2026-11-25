package com.dte.runiq

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.text.InputType
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat

/** Native screen for the overlay: pick Auto-fill, Manual or Off and grant what that mode needs. */
class OverlaySettingsActivity : AppCompatActivity() {

    private lateinit var overlayStatus: TextView
    private lateinit var serviceStatus: TextView
    private lateinit var modeGroup: RadioGroup
    private lateinit var autoBtn: RadioButton
    private lateinit var manualBtn: RadioButton
    private lateinit var offBtn: RadioButton
    private var applying = false

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

        root.addView(label("Floating overlay", 24f))
        root.addView(label("Choose how RunIQ helps while you look at an offer in Spark."))

        autoBtn = RadioButton(this).apply {
            text = "Auto-fill: reads the offer on Spark's screen and shows TAKE IT / MAYBE / PASS"
            id = View.generateViewId()
        }
        manualBtn = RadioButton(this).apply {
            text = "Manual: a floating bubble you tap and type pay and miles into"
            id = View.generateViewId()
        }
        offBtn = RadioButton(this).apply { text = "Off"; id = View.generateViewId() }
        modeGroup = RadioGroup(this).apply {
            addView(autoBtn); addView(manualBtn); addView(offBtn)
            setOnCheckedChangeListener { _, checkedId ->
                if (applying) return@setOnCheckedChangeListener
                when (checkedId) {
                    autoBtn.id -> chooseMode(OverlayMode.AUTOFILL)
                    manualBtn.id -> chooseMode(OverlayMode.MANUAL)
                    else -> chooseMode(OverlayMode.OFF)
                }
            }
        }
        root.addView(modeGroup)

        overlayStatus = label("")
        root.addView(overlayStatus)
        root.addView(Button(this).apply {
            text = "Allow display over other apps"
            setOnClickListener {
                startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName")))
            }
        })

        serviceStatus = label("")
        root.addView(serviceStatus)
        root.addView(Button(this).apply {
            text = "Turn on RunIQ Offer Reader (Auto-fill only)"
            setOnClickListener { startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) }
        })

        root.addView(label("Your minimums (below both = PASS)"))
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
                    Toast.makeText(this@OverlaySettingsActivity, "Enter both numbers", Toast.LENGTH_SHORT).show()
                } else {
                    Calc.saveTargets(this@OverlaySettingsActivity, m, h)
                    Toast.makeText(this@OverlaySettingsActivity, "Saved", Toast.LENGTH_SHORT).show()
                }
            }
        })

        root.addView(label("Optional: save auto-filled offers to your RunIQ history. Paste your key (RunIQ > Settings > Phone Connection Key)."))
        val keyInput = EditText(this).apply {
            hint = "riq_..."
            setText(TelemetryClient.loadKey(this@OverlaySettingsActivity))
            setSingleLine(true)
        }
        root.addView(keyInput)
        root.addView(Button(this).apply {
            text = "Save key"
            setOnClickListener {
                TelemetryClient.saveKey(this@OverlaySettingsActivity, keyInput.text.toString())
                Toast.makeText(this@OverlaySettingsActivity, "Key saved", Toast.LENGTH_SHORT).show()
            }
        })

        root.addView(Button(this).apply {
            text = "Back to RunIQ"
            setOnClickListener {
                startActivity(Intent(this@OverlaySettingsActivity, com.google.androidbrowserhelper.trusted.LauncherActivity::class.java))
                finish()
            }
        })

        setContentView(ScrollView(this).apply { addView(root) })

        if (Build.VERSION.SDK_INT >= 33) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1)
        }
    }

    private fun chooseMode(mode: OverlayMode) {
        OverlayMode.set(this, mode)
        when (mode) {
            OverlayMode.MANUAL -> {
                if (Settings.canDrawOverlays(this)) {
                    ContextCompat.startForegroundService(this, Intent(this, OverlayService::class.java))
                } else {
                    Toast.makeText(this, "Allow display over other apps first", Toast.LENGTH_LONG).show()
                }
            }
            else -> stopService(Intent(this, OverlayService::class.java))
        }
        refresh()
    }

    override fun onResume() {
        super.onResume()
        refresh()
    }

    private fun refresh() {
        applying = true
        when (OverlayMode.get(this)) {
            OverlayMode.AUTOFILL -> autoBtn.isChecked = true
            OverlayMode.MANUAL -> manualBtn.isChecked = true
            OverlayMode.OFF -> offBtn.isChecked = true
        }
        applying = false

        overlayStatus.text = "Display over other apps: " + if (Settings.canDrawOverlays(this)) "allowed" else "NOT allowed"
        val enabled = Settings.Secure.getString(contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
            ?.contains("$packageName/") == true
        serviceStatus.text = "Offer Reader (Accessibility): " + if (enabled) "ON" else "OFF"
    }
}
