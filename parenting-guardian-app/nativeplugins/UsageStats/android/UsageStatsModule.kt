package com.parenting.guardian.plugin

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import io.dcloud.feature.uniapp.common.UniModule
import com.taobao.weex.annotation.JSMethod
import com.taobao.weex.bridge.JSCallback
import org.json.JSONArray
import org.json.JSONObject

/**
 * 应用使用统计 Module
 * 继承 UniModule，通过 uni.requireNativePlugin 调用
 */
class UsageStatsModule : UniModule() {

    /**
     * 检查使用统计权限
     */
    @JSMethod(uiThread = false)
    fun checkPermission(callback: JSCallback) {
        val hasPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            val appOps = mUniSDKInstance.context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
            val mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                mUniSDKInstance.context.packageName
            )
            mode == AppOpsManager.MODE_ALLOWED
        } else {
            false
        }

        callback.invoke(JSONObject().apply {
            put("hasPermission", hasPermission)
        })
    }

    /**
     * 请求使用统计权限
     */
    @JSMethod(uiThread = true)
    fun requestPermission(callback: JSCallback) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            try {
                val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                mUniSDKInstance.context.startActivity(intent)
                callback.invoke(JSONObject().apply {
                    put("success", true)
                    put("message", "已打开使用统计权限设置页面")
                })
            } catch (e: Exception) {
                callback.invoke(JSONObject().apply {
                    put("success", false)
                    put("error", e.message)
                })
            }
        } else {
            callback.invoke(JSONObject().apply {
                put("success", false)
                put("error", "系统版本不支持")
            })
        }
    }

    /**
     * 获取前台应用
     */
    @JSMethod(uiThread = false)
    fun getForegroundApp(callback: JSCallback) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
            callback.invoke(JSONObject().apply {
                put("packageName", "")
                put("appName", "")
            })
            return
        }

        try {
            val usageStatsManager = mUniSDKInstance.context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
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

            callback.invoke(JSONObject().apply {
                put("packageName", foregroundPackage)
                put("appName", foregroundAppName)
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
     * 获取应用使用统计
     * @param startTime 开始时间戳（毫秒）
     * @param endTime 结束时间戳（毫秒）
     */
    @JSMethod(uiThread = false)
    fun getAppUsageStats(startTime: Double, endTime: Double, callback: JSCallback) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
            callback.invoke(JSONObject().apply {
                put("appList", JSONArray())
                put("success", false)
                put("error", "系统版本不支持")
            })
            return
        }

        try {
            val usageStatsManager = mUniSDKInstance.context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val usageStats = usageStatsManager.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                startTime.toLong(),
                endTime.toLong()
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
                        }
                        appList.put(appInfo)
                    }
                }
            }

            callback.invoke(JSONObject().apply {
                put("appList", appList)
                put("success", true)
            })
        } catch (e: Exception) {
            callback.invoke(JSONObject().apply {
                put("success", false)
                put("error", e.message)
                put("appList", JSONArray())
            })
        }
    }

    /**
     * 获取已安装应用列表
     */
    @JSMethod(uiThread = false)
    fun getInstalledApps(callback: JSCallback) {
        try {
            val pm = mUniSDKInstance.context.packageManager
            val packages = pm.getInstalledApplications(PackageManager.GET_META_DATA)

            val appList = JSONArray()
            for (packageInfo in packages) {
                // 过滤系统应用，只保留可启动的应用
                val launchIntent = pm.getLaunchIntentForPackage(packageInfo.packageName)
                if (launchIntent != null && packageInfo.packageName != mUniSDKInstance.context.packageName) {
                    val appInfo = JSONObject().apply {
                        put("packageName", packageInfo.packageName)
                        put("appName", packageInfo.loadLabel(pm).toString())
                        put("isSystem", (packageInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0)
                    }
                    appList.put(appInfo)
                }
            }

            callback.invoke(JSONObject().apply {
                put("appList", appList)
                put("success", true)
            })
        } catch (e: Exception) {
            callback.invoke(JSONObject().apply {
                put("success", false)
                put("error", e.message)
                put("appList", JSONArray())
            })
        }
    }

    /**
     * 获取应用名称
     */
    private fun getAppName(packageName: String): String {
        return try {
            val pm = mUniSDKInstance.context.packageManager
            val appInfo = pm.getApplicationInfo(packageName, 0)
            appInfo.loadLabel(pm).toString()
        } catch (e: Exception) {
            packageName
        }
    }
}
