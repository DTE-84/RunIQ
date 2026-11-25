package com.dte.runiq

import android.content.Context

/** Which overlay the driver picked: nothing, auto-read Spark's screen, or the type-it-in bubble. */
enum class OverlayMode {
    OFF, AUTOFILL, MANUAL;

    companion object {
        private const val PREFS = "runiq"
        private const val KEY = "overlayMode"

        fun get(ctx: Context): OverlayMode = runCatching {
            valueOf(ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, OFF.name)!!)
        }.getOrDefault(OFF)

        fun set(ctx: Context, mode: OverlayMode) {
            ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, mode.name).apply()
        }
    }
}
