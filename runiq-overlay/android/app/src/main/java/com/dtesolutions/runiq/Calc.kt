package com.dtesolutions.runiq

import android.content.Context

/** Offer math + your saved targets. Edit the estimate formula to match how you drive. */
object Calc {
    private const val PREFS = "runiq"
    const val KEY_MIN_PER_MILE = "minPerMile"
    const val KEY_MIN_PER_HOUR = "minPerHour"

    fun minPerMile(ctx: Context) = ctx.getSharedPreferences(PREFS, 0).getFloat(KEY_MIN_PER_MILE, 1.50f)
    fun minPerHour(ctx: Context) = ctx.getSharedPreferences(PREFS, 0).getFloat(KEY_MIN_PER_HOUR, 25f)

    fun saveTargets(ctx: Context, perMile: Float, perHour: Float) {
        ctx.getSharedPreferences(PREFS, 0).edit()
            .putFloat(KEY_MIN_PER_MILE, perMile)
            .putFloat(KEY_MIN_PER_HOUR, perHour)
            .apply()
    }

    data class Result(val perMile: Double, val perHour: Double, val minutes: Double, val verdict: Verdict)
    enum class Verdict { TAKE, MAYBE, PASS }

    /**
     * pay      = offer total ($)
     * miles    = offer miles
     * deadhead = miles back to your zone/store after the last drop
     * minutes  = optional; if blank we estimate ~1.8 min per mile + 7 min per stop
     */
    fun evaluate(
        ctx: Context, pay: Double, miles: Double, deadhead: Double, stops: Int, minutes: Double?
    ): Result? {
        if (pay <= 0 || miles + deadhead <= 0) return null
        val totalMiles = miles + deadhead
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
