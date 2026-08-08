package com.muslimapp.mobile.service

import android.content.Context
import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.muslimapp.mobile.alarm.AdzanAlarmScheduler
import com.facebook.react.bridge.Promise
import android.util.Log
import com.muslimapp.mobile.service.AdzanPlayerService

class PrayerForegroundModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "ADZAN"
    }

    override fun getName(): String {
        return "PrayerForegroundNativeService"
    }

    @ReactMethod
    fun startService(prayersJson: String, city: String) {
        try {
            val context = reactApplicationContext
            val prefs = context.getSharedPreferences("prayer_service_prefs", Context.MODE_PRIVATE)
            prefs.edit()
                .putString("prayers_json", prayersJson)
                .putString("city_name", city)
                .commit()

            val intent = Intent(context, PrayerForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Schedule semua alarm adzan.
     *
     * prayersJson:
     * [
     *   {
     *     "name": "Subuh",
     *     "time": "04:42",
     *     "sound": "adzan_subuh_makkah"
     *   }
     * ]
     */
    @ReactMethod
    fun scheduleAdzan(prayersJson: String, promise: Promise) {
        try {

            val context = reactApplicationContext

            val prayers = org.json.JSONArray(prayersJson)

            // Bersihkan schedule lama terlebih dahulu
            AdzanAlarmScheduler.cancelAll(context)

            for (i in 0 until prayers.length()) {

                val prayer = prayers.getJSONObject(i)

                val name = prayer.optString("name")

                val time = prayer.optString("time")

                val sound = prayer.optString("sound","adzan_makkah")

                if (name.isEmpty() || time.isEmpty()) {
                    continue
                }

                val triggerAtMillis = calculateNextTriggerTime(time)

                Log.d(TAG, "Schedule adzan: $name $time sound=$sound")

                AdzanAlarmScheduler.schedule(
                    context,
                    triggerAtMillis,
                    name,
                    sound
                )
            }

            promise.resolve(true)

        } catch (e: Exception) {

            Log.e(TAG,"Gagal schedule adzan", e)

            promise.reject("ADZAN_SCHEDULE_ERROR", e.message, e)
        }
    }

    /**
     * Cancel seluruh alarm adzan.
     */
    @ReactMethod
    fun cancelAllAdzan(promise: Promise) {
        try {

            AdzanAlarmScheduler.cancelAll(reactApplicationContext)

            Log.d(TAG, "Semua alarm adzan dibatalkan")

            promise.resolve(true)

        } catch (e: Exception) {

            Log.e(TAG,"Gagal cancel alarm adzan", e)

            promise.reject("ADZAN_CANCEL_ERROR", e.message, e)
        }
    }

    /**
     * Hitung waktu alarm berikutnya berdasarkan HH:mm.
     */
    private fun calculateNextTriggerTime(time: String): Long {

        val parts = time.split(":")

        if (parts.size < 2) {
            throw IllegalArgumentException("Format waktu tidak valid: $time")
        }

        val hour = parts[0].toInt()

        val minute = parts[1].toInt()

        val calendar = java.util.Calendar.getInstance()

        calendar.set(java.util.Calendar.HOUR_OF_DAY, hour)

        calendar.set(java.util.Calendar.MINUTE, minute)

        calendar.set(java.util.Calendar.SECOND,0)

        calendar.set(java.util.Calendar.MILLISECOND,0)

        // Kalau waktu hari ini sudah lewat,
        // jadwalkan besok.
        if (calendar.timeInMillis <= System.currentTimeMillis()) {
            calendar.add(java.util.Calendar.DAY_OF_YEAR,1)
        }

        return calendar.timeInMillis
    }

    @ReactMethod
    fun stopPlayingAdzan() {
        try {
            val context = reactApplicationContext

            val intent = Intent(
                context,
                AdzanPlayerService::class.java
            ).apply {
                action = AdzanPlayerService.ACTION_STOP_ADZAN
            }

            context.startService(intent)

            Log.d("ADZAN", "Perintah stop playing adzan dikirim")

        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun stopService() {
        try {
            val context = reactApplicationContext
            val intent = Intent(context, PrayerForegroundService::class.java).apply {
                action = "ACTION_STOP"
            }
            context.startService(intent)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
