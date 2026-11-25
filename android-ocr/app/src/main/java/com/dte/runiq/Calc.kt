package com.dte.runiq

import android.content.Context

/** Offer math + the driver's saved minimums. */
object Calc {
    private const val PREFS = "runiq"
    private const val KEY_MIN_PER_MILE = "minPerMile"
    private const val KEY_MIN_PER_HOUR = "minPerHour"

    fun minPerMile(ctx: Context) = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getFloat(KEY_MIN_PER_MILE, 1.50f)
    fun minPerHour(ctx: Context) = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getFloat(KEY_MIN_PER_HOUR, 25f)

    fun saveTargets(ctx: Context, perMile: Float, perHour: Float) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putFloat(KEY_MIN_PER_MILE, perMile)
            .putFloat(KEY_MIN_PER_HOUR, perHour)
            .apply()
    }

    enum class Verdict { TAKE, MAYBE, PASS }
    data class Result(val perMile: Double, val perHour: Double, val minutes: Double, val verdict: Verdict)

    /** Time is estimated (about 1.8 min per mile plus 7 min per stop) because offers rarely show it. */
    fun evaluate(
        ctx: Context, pay: Double, miles: Double, deadhead: Double = 0.0, stops: Int = 1, minutes: Double? = null
    ): Result? {
        val totalMiles = miles + deadhead
        if (pay <= 0 || totalMiles <= 0) return null
        val mins = minutes ?: (totalMiles * 1.8 + stops.coerceAtLeast(1) * 7)
        val perMile = pay / totalMiles
        val perHour = pay / (mins / 60.0)

        val okMile = perMile >= minPerMile(ctx)
        val okHour = perHour >= minPerHour(ctx)
        val verdict = when {
            okMile && okHour -> Verdict.TAKE
            okMile || okHour -> Verdict.MAYBE
            else -> Verdict.PASS
        }
        return Result(perMile, perHour, mins, verdict)
    }
}
