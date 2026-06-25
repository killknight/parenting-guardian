package com.parenting.guardian.plugin

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import io.dcloud.feature.uniapp.common.UniModule
import com.taobao.weex.annotation.JSMethod
import com.taobao.weex.bridge.JSCallback
import org.json.JSONObject

/**
 * 前台服务 Module
 * 继承 UniModule，实现后台保活
 */
class ForegroundServiceModule : UniModule() {

    companion object {
        private var isServiceRunning = false

        fun startService(context: Context, title: String, content: String) {
            val intent = Intent(context, GuardForegroundService::class.java).apply {
                putExtra("title", title)
                putExtra("content", content)
                putExtra("action", "start")
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
            isServiceRunning = true
        }

        fun stopService(context: Context) {
            val intent = Intent(context, GuardForegroundService::class.java).apply {
                putExtra("action", "stop")
            }
            context.startService(intent)
            isServiceRunning = false
        }

        fun updateNotification(context: Context, title: String, content: String) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val notification = createNotification(context, title, content)
            notificationManager.notify(GuardForegroundService.NOTIFICATION_ID, notification)
        }

        fun createNotification(context: Context, title: String, content: String): Notification {
            createNotificationChannel(context)

            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                context.packageManager.getLaunchIntentForPackage(context.packageName),
                getPendingIntentFlags()
            )

            return NotificationCompat.Builder(context, GuardForegroundService.CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(content)
                .setSmallIcon(android.R.drawable.ic_menu_info_details)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .build()
        }

        private fun createNotificationChannel(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                val channel = NotificationChannel(
                    GuardForegroundService.CHANNEL_ID,
                    "守护服务",
                    NotificationManager.IMPORTANCE_LOW
                ).apply {
                    description = "用于后台守护孩子手机"
                    setShowBadge(false)
                }
                notificationManager.createNotificationChannel(channel)
            }
        }

        private fun getPendingIntentFlags(): Int {
            return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
        }
    }

    /**
     * 启动前台服务
     */
    @JSMethod(uiThread = true)
    fun startService(title: String, content: String, callback: JSCallback) {
        try {
            startService(mUniSDKInstance.context, title, content)
            isServiceRunning = true
            callback.invoke(JSONObject().apply {
                put("success", true)
                put("message", "服务已启动")
            })
        } catch (e: Exception) {
            callback.invoke(JSONObject().apply {
                put("success", false)
                put("error", e.message)
            })
        }
    }

    /**
     * 停止前台服务
     */
    @JSMethod(uiThread = true)
    fun stopService(callback: JSCallback) {
        try {
            stopService(mUniSDKInstance.context)
            isServiceRunning = false
            callback.invoke(JSONObject().apply {
                put("success", true)
                put("message", "服务已停止")
            })
        } catch (e: Exception) {
            callback.invoke(JSONObject().apply {
                put("success", false)
                put("error", e.message)
            })
        }
    }

    /**
     * 更新通知
     */
    @JSMethod(uiThread = true)
    fun updateNotification(title: String, content: String, callback: JSCallback) {
        try {
            updateNotification(mUniSDKInstance.context, title, content)
            callback.invoke(JSONObject().apply {
                put("success", true)
            })
        } catch (e: Exception) {
            callback.invoke(JSONObject().apply {
                put("success", false)
                put("error", e.message)
            })
        }
    }

    /**
     * 检查服务是否运行
     */
    @JSMethod(uiThread = false)
    fun isRunning(callback: JSCallback) {
        callback.invoke(JSONObject().apply {
            put("isRunning", isServiceRunning)
            put("success", true)
        })
    }

    /**
     * 获取WakeLock（防止CPU休眠）
     */
    @JSMethod(uiThread = true)
    fun acquireWakeLock(callback: JSCallback) {
        try {
            GuardForegroundService.acquireWakeLock(mUniSDKInstance.context)
            callback.invoke(JSONObject().apply {
                put("success", true)
            })
        } catch (e: Exception) {
            callback.invoke(JSONObject().apply {
                put("success", false)
                put("error", e.message)
            })
        }
    }

    /**
     * 释放WakeLock
     */
    @JSMethod(uiThread = true)
    fun releaseWakeLock(callback: JSCallback) {
        try {
            GuardForegroundService.releaseWakeLock()
            callback.invoke(JSONObject().apply {
                put("success", true)
            })
        } catch (e: Exception) {
            callback.invoke(JSONObject().apply {
                put("success", false)
                put("error", e.message)
            })
        }
    }
}

/**
 * 守护前台服务
 */
class GuardForegroundService : Service() {

    private var wakeLock: PowerManager.WakeLock? = null

    companion object {
        const val CHANNEL_ID = "parenting_guardian_service"
        const val NOTIFICATION_ID = 1001

        private var instance: GuardForegroundService? = null

        fun acquireWakeLock(context: Context) {
            instance?.let {
                if (it.wakeLock == null || !it.wakeLock!!.isHeld) {
                    val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
                    it.wakeLock = powerManager.newWakeLock(
                        PowerManager.PARTIAL_WAKE_LOCK,
                        "ParentGuardian::GuardianWakeLock"
                    ).apply {
                        acquire(10 * 60 * 60 * 1000L) // 10小时
                    }
                }
            }
        }

        fun releaseWakeLock() {
            instance?.wakeLock?.let {
                if (it.isHeld) {
                    try {
                        it.release()
                    } catch (_: Exception) {}
                }
            }
            instance?.wakeLock = null
        }
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.getStringExtra("action")) {
            "stop" -> {
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
                ForegroundServiceModule.isServiceRunning = false
            }
            else -> {
                val title = intent?.getStringExtra("title") ?: "亲子守护"
                val content = intent?.getStringExtra("content") ?: "正在守护中..."

                val notification = ForegroundServiceModule.createNotification(this, title, content)
                startForeground(NOTIFICATION_ID, notification)
                ForegroundServiceModule.isServiceRunning = true

                // 获取WakeLock
                val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
                wakeLock = powerManager.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    "ParentGuardian::GuardianWakeLock"
                ).apply {
                    acquire(10 * 60 * 60 * 1000L) // 10小时
                }
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        try {
            wakeLock?.let {
                if (it.isHeld) it.release()
            }
        } catch (_: Exception) {}
        wakeLock = null
        instance = null
        ForegroundServiceModule.isServiceRunning = false
    }
}
