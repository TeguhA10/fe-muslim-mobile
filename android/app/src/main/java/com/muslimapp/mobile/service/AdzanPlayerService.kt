package com.muslimapp.mobile.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log

import androidx.core.app.NotificationCompat
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer

import com.muslimapp.mobile.MainActivity
import com.muslimapp.mobile.R

class AdzanPlayerService : Service() {

    companion object {
        private const val TAG = "ADZAN"
        private const val CHANNEL_ID = "adzan_playback_channel"
        private const val NOTIFICATION_ID = 2001
        const val ACTION_STOP_ADZAN = "com.muslimapp.mobile.ACTION_STOP_ADZAN"
    }

    private var player: ExoPlayer? = null

    override fun onCreate() {
        super.onCreate()

        createNotificationChannel()

        Log.d(TAG, "AdzanPlayerService dibuat")
    }

    override fun onStartCommand(
        intent: Intent?,
        flags: Int,
        startId: Int
    ): Int {

        val prayerName =
            intent?.getStringExtra("prayer") ?: "Adzan"

        val sound =
            intent?.getStringExtra("sound") ?: "adzan_makkah"

        Log.d(
            TAG,
            "Service jalan - prayer=$prayerName sound=$sound"
        )

        when (intent?.action) {

            ACTION_STOP_ADZAN -> {
                Log.d(TAG, "Perintah STOP_ADZAN diterima")
                stopAdzanService()
                return START_NOT_STICKY
            }
        }

        // Wajib startForeground sebelum melakukan pekerjaan background.
        startForeground(
            NOTIFICATION_ID,
            buildNotification(prayerName)
        )

        playAdzan(sound)

        return START_NOT_STICKY
    }

    private fun playAdzan(sound: String) {

        // Hentikan player sebelumnya jika ada.
        player?.release()
        player = null

        val resourceId = getSoundResource(sound)

        if (resourceId == 0) {
            Log.e(
                TAG,
                "File adzan tidak ditemukan untuk sound=$sound"
            )

            stopSelf()
            return
        }

        val uri =
            "android.resource://$packageName/$resourceId"

        Log.d(
            TAG,
            "Memutar audio: $uri"
        )

        val mediaItem =
            MediaItem.fromUri(uri)

        val newPlayer =
            ExoPlayer.Builder(this).build()

        player = newPlayer

        newPlayer.setMediaItem(mediaItem)

        newPlayer.prepare()

        newPlayer.play()

        newPlayer.addListener(
            object : androidx.media3.common.Player.Listener {

                override fun onPlaybackStateChanged(
                    playbackState: Int
                ) {

                    when (playbackState) {

                        androidx.media3.common.Player.STATE_READY -> {
                            Log.d(
                                TAG,
                                "Adzan siap diputar"
                            )
                        }

                        androidx.media3.common.Player.STATE_ENDED -> {

                            Log.d(
                                TAG,
                                "Adzan selesai"
                            )

                            stopAdzanService()
                        }
                    }
                }

                override fun onPlayerError(
                    error: androidx.media3.common.PlaybackException
                ) {

                    Log.e(
                        TAG,
                        "Error memutar adzan: ${error.message}",
                        error
                    )

                    stopAdzanService()
                }
            }
        )
    }

    private fun getSoundResource(sound: String): Int {

        return when (sound) {

            "adzan_makkah" ->
                R.raw.adzan_makkah

            "adzan_madinah" ->
                R.raw.adzan_madinah

            "adzan_subuh_makkah" ->
                R.raw.adzan_subuh_makkah

            "adzan_soft" ->
                R.raw.adzan_soft

            "chime_short" ->
                R.raw.short_chime

            else ->
                R.raw.adzan_makkah
        }
    }

    private fun stopAdzanService() {

        Log.d(
            TAG,
            "Menghentikan AdzanPlayerService"
        )

        player?.stop()
        player?.release()
        player = null

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            @Suppress("DEPRECATION")
            stopForeground(true)
        }

        stopSelf()
    }

    override fun onDestroy() {

        Log.d(
            TAG,
            "AdzanPlayerService dihentikan"
        )

        player?.stop()
        player?.release()
        player = null

        super.onDestroy()
    }

    override fun onBind(
        intent: Intent?
    ): IBinder? {
        return null
    }

    private fun createNotificationChannel() {

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            val channel = NotificationChannel(
                CHANNEL_ID,
                "Adzan",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {

                description =
                    "Pemutaran suara adzan"

                setSound(
                    null,
                    null
                )

                setShowBadge(false)
            }

            val manager =
                getSystemService(
                    Context.NOTIFICATION_SERVICE
                ) as NotificationManager

            manager.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(
        prayerName: String
    ): Notification {

        // Tombol buka aplikasi
        val openAppIntent =
            Intent(
                this,
                MainActivity::class.java
            ).apply {

                flags =
                    Intent.FLAG_ACTIVITY_SINGLE_TOP or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP
            }

        val pendingIntent =
            PendingIntent.getActivity(
                this,
                2001,
                openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or
                    PendingIntent.FLAG_IMMUTABLE
            )

        // Tombol "Hentikan Adzan"
        val stopIntent =
            Intent(
                this,
                AdzanPlayerService::class.java
            ).apply {
                action = ACTION_STOP_ADZAN
            }

        val stopPendingIntent =
            PendingIntent.getService(
                this,
                2002,
                stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or
                    PendingIntent.FLAG_IMMUTABLE
            )

        return NotificationCompat.Builder(
            this,
            CHANNEL_ID
        )
            .setSmallIcon(
                R.mipmap.ic_launcher
            )
            .setContentTitle(
                "🕌 Waktu $prayerName"
            )
            .setContentText(
                "Sedang memutar adzan"
            )
            .setOngoing(true)
            .setPriority(
                NotificationCompat.PRIORITY_HIGH
            )
            .setCategory(
                NotificationCompat.CATEGORY_ALARM
            )
            .setContentIntent(
                pendingIntent
            )

            // Tombol stop
            .addAction(
                NotificationCompat.Action(
                    android.R.drawable.ic_media_pause,
                    "Hentikan Adzan",
                    stopPendingIntent
                )
            )

            .build()
    }
}