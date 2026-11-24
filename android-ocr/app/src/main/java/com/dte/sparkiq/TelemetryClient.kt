package com.dte.sparkiq

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
    // Shared secret gating this endpoint. Must match INGEST_SHARED_SECRET in Vercel.
    // Extractable from the APK like any client-embedded key — it stops opportunistic
    // spam of the offers table, not a determined attacker with the decompiled app.
    private const val SHARED_SECRET = "e55dadb602df5acca5ab6473b2573c74faf2bd9400f16e82d6bbe836f68c83cc"

    suspend fun dispatch(price: Double, miles: Double, items: Int, netPerHour: Double, dollarsPerMile: Double) {
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
                    .addHeader("x-runiq-secret", SHARED_SECRET)
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
