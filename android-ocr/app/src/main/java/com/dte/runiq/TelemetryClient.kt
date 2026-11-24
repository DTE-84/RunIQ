package com.dte.runiq

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

object TelemetryClient {
    private val client = OkHttpClient()
    private val JSON = "application/json; charset=utf-8".toMediaType()

    // RunIQ's own backend. The service role key stays server-side in Vercel env vars
    // (see api/ingest-offer.js) and is never shipped inside the app.
    private const val BACKEND_URL = "https://runiq-ashen.vercel.app/api/ingest-offer"
    private const val PREFS = "runiq"
    private const val KEY_PREF = "device_key"

    fun saveKey(context: Context, key: String) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY_PREF, key.trim()).apply()
    }

    fun loadKey(context: Context): String =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_PREF, "") ?: ""

    suspend fun dispatch(context: Context, price: Double, miles: Double, items: Int, netPerHour: Double, dollarsPerMile: Double) {
        val deviceKey = loadKey(context)
        if (deviceKey.isEmpty()) {
            Log.w("SparkIQ_OCR", "No device key set. Open the RunIQ app and paste your key.")
            return
        }
        withContext(Dispatchers.IO) {
            try {
                // Formatting payload to match the 'offers' table schema
                val jsonPayload = JSONObject().apply {
                    put("platform", "Spark")
                    put("pay", price)
                    put("tips", 0.0) // OCR might not split tips reliably yet
                    put("miles", miles)
                    put("miles_back", 0.0)
                    put("time_minutes", if (netPerHour > 0) ((price / netPerHour) * 60).toInt() else 30)
                    put("items", items)
                    put("dropoff_zone", "Unknown")
                    put("rating", "Pending")
                    put("net_profit", price)
                    put("hourly_rate", netPerHour)
                    put("per_mile_rate", dollarsPerMile)
                    put("gas_cost", 0.0)
                }

                val body = jsonPayload.toString().toRequestBody(JSON)
                
                val request = Request.Builder()
                    .url(BACKEND_URL)
                    .addHeader("Content-Type", "application/json")
                    .addHeader("x-runiq-key", deviceKey)
                    .post(body)
                    .build()

                val response = client.newCall(request).execute()
                if (response.isSuccessful) {
                    Log.d("SparkIQ_OCR", "Telemetry Uplink Successful. Data integrity secured.")
                } else {
                    Log.e("SparkIQ_OCR", "Telemetry Uplink Failed: ${response.code} ${response.message}")
                }
                response.close()
            } catch (e: Exception) {
                Log.e("SparkIQ_OCR", "Exception during Telemetry Uplink", e)
            }
        }
    }
}
