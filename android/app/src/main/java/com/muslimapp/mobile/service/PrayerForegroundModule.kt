package com.muslimapp.mobile.service

import android.content.Context
import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class PrayerForegroundModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

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
