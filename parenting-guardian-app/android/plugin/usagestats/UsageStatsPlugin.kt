/**
 * 亲子守护 - 使用统计插件
 *
 * 功能：
 * 1. 检查使用统计权限
 * 2. 获取前台应用
 * 3. 获取应用使用统计
 * 4. 获取已安装应用列表
 */

package com.parenting.guardian.plugin.usagestats

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import android.app.ActivityManager
import com.getui.sdk.GT"
import io.dcloud.feature.uniapp.UniSDK
import io.dcloud.plugin.Extension
import io.dcloud.plugin.PluginHook
import org.json.JSONArray
import org.json.JSONObject

class UsageStatsPlugin : Extension() {

    private val context: Context
        get() = UniSDK.getInstance().getContext()

    /**
     * 检查使用统计权限
     */
    fun checkPermission(args: JSONObject, callback: PluginHook.Callback): Boolean {
        val hasPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                context.packageName
            )
            mode == AppOpsManager.MODE_ALLOWED
        } else {
            false
        }

        callback.onCallback(JSONObject().put("hasPermission", hasPermission))
        return true
    }

    /**
     * 请求使用统计权限
     */
    fun requestPermission(args: JSONObject, callback: PluginHook.Callback): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            context.startActivity(intent)
        }
        callback.onCallback(JSONObject().put("granted", true))
        return true
    }

    /**
     * 获取前台应用
     */
    fun getForegroundApp(args: JSONObject, callback: PluginHook.Callback): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
            callback.onCallback(JSONObject().put("packageName", "").put("appName", ""))
            return true
        }

        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val endTime = System.currentTimeMillis()
        val beginTime = endTime - 1000 * 60 // 最近1分钟

        val usageEvents = usageStatsManager.queryEvents(beginTime, endTime)
        var foregroundPackage = ""
        var foregroundAppName = ""
        var lastEventTime = 0L

        while (usageEvents.hasNextEvent()) {
            val event = UsageEvents.Event()
            usageEvents.getNextEvent(event)

            if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED ||
                event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                if (event.timeStamp > lastEventTime) {
                    lastEventTime = event.timeStamp
                    foregroundPackage = event.packageName
                }
            }
        }

        if (foregroundPackage.isNotEmpty()) {
            foregroundAppName = getAppName(foregroundPackage)
        }

        val result = JSONObject().apply {
            put("packageName", foregroundPackage)
            put("appName", foregroundAppName)
        }
        callback.onCallback(result)
        return true
    }

    /**
     * 获取应用使用统计
     */
    fun getAppUsageStats(args: JSONObject, callback: PluginHook.Callback): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
            callback.onCallback(JSONObject().put("appList", JSONArray()))
            return true
        }

        val startTime = args.optLong("startTime", System.currentTimeMillis() - 86400000)
        val endTime = args.optLong("endTime", System.currentTimeMillis())

        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val usageStats = usageStatsManager.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            startTime,
            endTime
        )

        val appList = JSONArray()
        if (usageStats != null) {
            for (stats in usageStats) {
                if (stats.totalTimeInForeground > 0) {
                    val appInfo = JSONObject().apply {
                        put("packageName", stats.packageName)
                        put("appName", getAppName(stats.packageName))
                        put("duration", stats.totalTimeInForeground / 1000) // 转换为秒
                        put("lastTimeUsed", stats.lastTimeUsed)
                        put("firstTimeStamp", stats.getFirstTimeStamp())
                    }
                    appList.put(appInfo)
                }
            }
        }

        callback.onCallback(JSONObject().put("appList", appList))
        return true
    }

    /**
     * 获取已安装应用列表
     */
    fun getInstalledApps(args: JSONObject, callback: PluginHook.Callback): Boolean {
        val pm = context.packageManager
        val packages = pm.getInstalledApplications(PackageManager.GET_META_DATA)

        val appList = JSONArray()
        for (packageInfo in packages) {
            // 过滤系统应用，只保留可启动的应用
            if (pm.getLaunchIntentForPackage(packageInfo.packageName) != null &&
                packageInfo.packageName != context.packageName) {

                val appInfo = JSONObject().apply {
                    put("packageName", packageInfo.packageName)
                    put("appName", packageInfo.loadLabel(pm).toString())
                    put("versionName", pm.getPackageInfo(packageInfo.packageName, 0).versionName)
                    put("isSystem", (packageInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0)
                }
                appList.put(appInfo)
            }
        }

        callback.onCallback(JSONObject().put("appList", appList))
        return true
    }

    /**
     * 获取应用名称
     */
    private fun getAppName(packageName: String): String {
        return try {
            val pm = context.packageManager
            val appInfo = pm.getApplicationInfo(packageName, 0)
            appInfo.loadLabel(pm).toString()
        } catch (e: Exception) {
            packageName
        }
    }

    companion object {
        /**
         * 插件入口
         */
        @JvmStatic
        fun exec(method: String, args: JSONObject, callback: PluginHook.Callback): Boolean {
            val plugin = UsageStatsPlugin()
            return when (method) {
                "checkPermission" -> plugin.checkPermission(args, callback)
                "requestPermission" -> plugin.requestPermission(args, callback)
                "getForegroundApp" -> plugin.getForegroundApp(args, callback)
                "getAppUsageStats" -> plugin.getAppUsageStats(args, callback)
                "getInstalledApps" -> plugin.getInstalledApps(args, callback)
                else -> false
            }
        }
    }
}
