package com.muslimapp.mobile.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.muslimapp.mobile.receiver.AdzanAlarmReceiver

object AdzanAlarmScheduler {

    private const val REQUEST_CODE_BASE = 5000

    fun schedule(
        context: Context,
        triggerAtMillis: Long,
        prayerName: String,
        sound: String
    ) {

        val alarmManager =
            context.getSystemService(
                Context.ALARM_SERVICE
            ) as AlarmManager

        val requestCode =
            REQUEST_CODE_BASE + prayerName.hashCode()

        val intent = Intent(
            context,
            AdzanAlarmReceiver::class.java
        ).apply {
            putExtra(
                "prayer",
                prayerName
            )

            putExtra(
                "sound",
                sound
            )
        }

        val pendingIntent =
            PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or
                    PendingIntent.FLAG_IMMUTABLE
            )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {

            alarmManager.setExactAndAllowWhileIdle(
                AlarmManager.RTC_WAKEUP,
                triggerAtMillis,
                pendingIntent
            )

        } else {

            alarmManager.setExact(
                AlarmManager.RTC_WAKEUP,
                triggerAtMillis,
                pendingIntent
            )
        }
    }

    fun cancel(
        context: Context,
        prayerName: String
    ) {

        val alarmManager =
            context.getSystemService(
                Context.ALARM_SERVICE
            ) as AlarmManager

        val requestCode =
            REQUEST_CODE_BASE + prayerName.hashCode()

        val intent = Intent(
            context,
            AdzanAlarmReceiver::class.java
        )

        val pendingIntent =
            PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_NO_CREATE or
                    PendingIntent.FLAG_IMMUTABLE
            )

        if (pendingIntent != null) {

            alarmManager.cancel(
                pendingIntent
            )

            pendingIntent.cancel()
        }
    }

    fun cancelAll(
        context: Context
    ) {

        val prayers = listOf(
            "Subuh",
            "Dzuhur",
            "Ashar",
            "Maghrib",
            "Isya"
        )

        prayers.forEach { prayerName ->
            cancel(
                context,
                prayerName
            )
        }
    }
}