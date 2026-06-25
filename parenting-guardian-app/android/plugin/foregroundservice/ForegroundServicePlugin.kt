/**
 * 亲子守护 - 前台服务插件（后台保活）
 *
 * 功能：
 * 1. 启动前台服务
 * 2. 停止前台服务
 * 3. 更新通知
 */

package com.parenting.guardian.plugin.foregroundservice

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
import com.getui.sdk.GT
import io.dcloud.feature.uniapp.UniSDK
import io.dcloud.plugin.Extension
import io.dcloud.plugin.PluginHook
import io.dcloud.application.DCloudApplication
import org.json.JSONObject

class ForegroundServicePlugin : Extension() {

    private val context: Context
        get() = UniSDK.getInstance().getContext()

    private val notificationManager: NotificationManager
        get() = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    companion object {
        const val CHANNEL_ID = "parenting_guardian_service"
        const val NOTIFICATION_ID = 1001

        var isRunning = false
            private set

        fun startService(context: Context, title: String, content: String) {
            val intent = Intent(context, GuardianService::class.java).apply {
                putExtra("title", title)
                putExtra("content", content)
                putExtra("action", "start")
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopService(context: Context) {
            val intent = Intent(context, GuardianService::class.java).apply {
                putExtra("action", "stop")
            }
            context.startService(intent)
        }

        fun updateNotification(context: Context, title: String, content: String) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val notification = createNotification(context, title, content)
            notificationManager.notify(NOTIFICATION_ID, notification)
        }

        fun createNotification(context: Context, title: String, content: String): Notification {
            createNotificationChannel()

            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                context.packageManager.getLaunchIntentForPackage(context.packageName),
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )

            return NotificationCompat.Builder(context, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(content)
                .setSmallIcon(context.applicationInfo.icon)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .build()
        }

        private fun createNotificationChannel() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    "守护服务",
                    NotificationManager.IMPORTANCE_LOW
                ).apply {
                    description = "用于后台守护孩子手机"
                    setShowBadge(false)
                }
                notificationManager.createNotificationChannel(channel)
            }
        }
    }

    /**
     * 启动前台服务
     */
    fun startService(args: JSONObject, callback: PluginHook.Callback): Boolean {
        val title = args.optString("title", "亲子守护")
        val content = args.optString("content", "正在守护中...")

        try {
            startService(context, title, content)
            isRunning = true
            callback.onCallback(JSONObject().put("success", true))
        } catch (e: Exception) {
            callback.onCallback(JSONObject().put("success", false).put("error", e.message))
        }
        return true
    }

    /**
     * 停止前台服务
     */
    fun stopService(args: JSONObject, callback: PluginHook.Callback): Boolean {
        try {
            stopService(context)
            isRunning = false
            callback.onCallback(JSONObject().put("success", true))
        } catch (e: Exception) {
            callback.onCallback(JSONObject().put("success", false).put("error", e.message))
        }
        return true
    }

    /**
     * 更新通知
     */
    fun updateNotification(args: JSONObject, callback: PluginHook.Callback): Boolean {
        val title = args.optString("title", "亲子守护")
        val content = args.optString("content", "正在守护中...")

        try {
            updateNotification(context, title, content)
            callback.onCallback(JSONObject().put("success", true))
        } catch (e: Exception) {
            callback.onCallback(JSONObject().put("success", false).put("error", e.message))
        }
        return true
    }

    companion object {
        /**
         * 插件入口
         */
        @JvmStatic
        fun exec(method: String, args: JSONObject, callback: PluginHook.Callback): Boolean {
            val plugin = ForegroundServicePlugin()
            return when (method) {
                "startService" -> plugin.startService(args, callback)
                "stopService" -> plugin.stopService(args, callback)
                "updateNotification" -> plugin.updateNotification(args, callback)
                else -> false
            }
        }
    }
}

/**
 * 守护服务
 */
class GuardianService : Service() {

    private var wakeLock: PowerManager.WakeLock? = null

    override fun onCreate() {
        super.onCreate()

        // 获取 WakeLock 防止CPU休眠
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "ParentGuardian::GuardianWakeLock"
        ).apply {
            acquire(10 * 60 * 60 * 1000L) // 10小时
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.getStringExtra("action")) {
            "stop" -> {
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
            else -> {
                val title = intent?.getStringExtra("title") ?: "亲子守护"
                val content = intent?.getStringExtra("content") ?: "正在守护中..."

                val notification = ForegroundServicePlugin.createNotification(this, title, content)
                startForeground(ForegroundServicePlugin.NOTIFICATION_ID, notification)
                ForegroundServicePlugin.isRunning = true
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        wakeLock?.release()
        ForegroundServicePlugin.isRunning = false
    }
}
