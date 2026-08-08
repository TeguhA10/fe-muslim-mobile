package com.muslimapp.mobile.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat
import com.muslimapp.mobile.service.AdzanPlayerService

class AdzanAlarmReceiver : BroadcastReceiver() {

    override fun onReceive(
        context: Context,
        intent: Intent
    ) {

        val serviceIntent =
            Intent(context, AdzanPlayerService::class.java)

        serviceIntent.putExtra(
            "prayer",
            intent.getStringExtra("prayer")
        )

        serviceIntent.putExtra(
            "sound",
            intent.getStringExtra("sound")
        )

        ContextCompat.startForegroundService(
            context,
            serviceIntent
        )

    }

}