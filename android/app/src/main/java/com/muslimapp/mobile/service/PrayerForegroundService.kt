package com.muslimapp.mobile.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import com.muslimapp.mobile.MainActivity
import com.muslimapp.mobile.widget.PrayerWidget
import org.json.JSONArray
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

class PrayerForegroundService : Service() {

    private val NOTIFICATION_ID = 1001
    private val CHANNEL_ID = "prayer_ongoing_channel_v2"
    private val handler = Handler(Looper.getMainLooper())
    private var isRunning = false
    private var lastWidgetBroadcastMs: Long = 0

    private val updateRunnable = object : Runnable {
        override fun run() {
            if (isRunning) {
                updateNotification()
                handler.postDelayed(this, 1000) // 1-second native ticker
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action
        if (action == "ACTION_STOP") {
            stopForegroundService()
            return START_NOT_STICKY
        }

        // Calculate actual notification content FIRST so "Memuat..." is never displayed
        val (title, body) = calculateNotificationContent()
        val notification = buildNotification(title, body)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val fgsType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            } else {
                0
            }
            startForeground(NOTIFICATION_ID, notification, fgsType)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        if (!isRunning) {
            isRunning = true
            handler.removeCallbacks(updateRunnable)
            handler.post(updateRunnable)
        } else {
            updateNotification()
        }

        return START_STICKY
    }

    private fun stopForegroundService() {
        isRunning = false
        handler.removeCallbacks(updateRunnable)
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "Jadwal Sholat Menerus"
            val descriptionText = "Menampilkan hitung mundur adzan di status bar"
            val importance = NotificationManager.IMPORTANCE_LOW
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
                setShowBadge(false)
            }
            val notificationManager: NotificationManager =
                getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(title: String, body: String): Notification {
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val smallIconResId = resources.getIdentifier("ic_launcher", "mipmap", packageName)

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(if (smallIconResId != 0) smallIconResId else android.R.drawable.ic_popup_reminder)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(pendingIntent)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build()
    }

    private fun calculateNotificationContent(): Pair<String, String> {
        val prefs = getSharedPreferences("prayer_service_prefs", Context.MODE_PRIVATE)
        val scheduleJsonStr = prefs.getString("prayers_json", null)
        val city = prefs.getString("city_name", "Jakarta") ?: "Jakarta"

        if (scheduleJsonStr.isNullOrEmpty()) {
            return Pair("🕌 Muslim App", "📍 $city • Penjadwalan Sholat")
        }

        try {
            val jsonArray = JSONArray(scheduleJsonStr)
            val now = Calendar.getInstance()
            var upcomingName: String? = null
            var upcomingTimeStr: String? = null
            var upcomingTargetCal: Calendar? = null

            for (i in 0 until jsonArray.length()) {
                val item = jsonArray.getJSONObject(i)
                val pName = item.optString("name")
                val pTime = item.optString("time")
                if (pTime.isEmpty()) continue

                val parts = pTime.split(":")
                if (parts.size < 2) continue

                val target = Calendar.getInstance().apply {
                    set(Calendar.HOUR_OF_DAY, parts[0].toInt())
                    set(Calendar.MINUTE, parts[1].toInt())
                    set(Calendar.SECOND, 0)
                    set(Calendar.MILLISECOND, 0)
                }

                if (target.after(now)) {
                    upcomingName = pName
                    upcomingTimeStr = pTime
                    upcomingTargetCal = target
                    break
                }
            }

            if (upcomingTargetCal == null && jsonArray.length() > 0) {
                val firstItem = jsonArray.getJSONObject(0)
                val pName = firstItem.optString("name")
                val pTime = firstItem.optString("time")
                if (pTime.isNotEmpty()) {
                    val parts = pTime.split(":")
                    if (parts.size >= 2) {
                        upcomingName = pName
                        upcomingTimeStr = pTime
                        upcomingTargetCal = Calendar.getInstance().apply {
                            add(Calendar.DAY_OF_YEAR, 1)
                            set(Calendar.HOUR_OF_DAY, parts[0].toInt())
                            set(Calendar.MINUTE, parts[1].toInt())
                            set(Calendar.SECOND, 0)
                            set(Calendar.MILLISECOND, 0)
                        }
                    }
                }
            }

            if (upcomingName != null && upcomingTargetCal != null && upcomingTimeStr != null) {
                val diffMs = upcomingTargetCal.timeInMillis - now.timeInMillis
                val totalSec = Math.max(0L, diffMs / 1000)
                val hours = totalSec / 3600
                val mins = (totalSec % 3600) / 60
                val secs = totalSec % 60

                val countdownStr = String.format(Locale.US, "%02d:%02d:%02d", hours, mins, secs)
                val tz = TimeZone.getDefault()
                val tzName = tz.id
                val tzSuffix = if (tzName.contains("Makassar") || tzName.contains("Jayapura")) "WITA/WIT" else "WIB"

                val title = "🕌 Menuju Sholat $upcomingName"
                val body = "Waktu: $upcomingTimeStr $tzSuffix • Sisa: $countdownStr (📍 $city)"

                return Pair(title, body)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return Pair("🕌 Muslim App", "📍 $city • Penjadwalan Sholat")
    }

    private fun updateNotification() {
        val (title, body) = calculateNotificationContent()
        val notification = buildNotification(title, body)
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, notification)

        // Broadcast update to Android Home Screen Widget every 60 seconds (smooth per-minute update)
        val nowMs = System.currentTimeMillis()
        if (nowMs - lastWidgetBroadcastMs >= 60000) {
            lastWidgetBroadcastMs = nowMs
            triggerWidgetUpdate()
        }
    }

    private fun triggerWidgetUpdate() {
        try {
            val intent = Intent(applicationContext, PrayerWidget::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                val ids = AppWidgetManager.getInstance(applicationContext).getAppWidgetIds(
                    ComponentName(applicationContext, PrayerWidget::class.java)
                )
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
            }
            sendBroadcast(intent)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
