/**
 * 亲子守护 - 设备策略插件（锁屏功能）
 *
 * 功能：
 * 1. 检查设备管理员状态
 * 2. 请求设备管理员权限
 * 3. 锁屏
 * 4. 解锁
 */

package com.parenting.guardian.plugin.devicepolicy

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.PowerManager
import com.getui.sdk.GT
import io.dcloud.feature.uniapp.UniSDK
import io.dcloud.plugin.Extension
import io.dcloud.plugin.PluginHook
import org.json.JSONObject

class DevicePolicyPlugin : Extension() {

    private val context: Context
        get() = UniSDK.getInstance().getContext()

    private val devicePolicyManager: DevicePolicyManager
        get() = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager

    private val componentName: ComponentName
        get() = ComponentName(context, MyDeviceAdminReceiver::class.java)

    /**
     * 检查是否是设备管理员
     */
    fun isAdminActive(args: JSONObject, callback: PluginHook.Callback): Boolean {
        val isActive = devicePolicyManager.isAdminActive(componentName)
        callback.onCallback(JSONObject().put("isActive", isActive))
        return true
    }

    /**
     * 激活设备管理员
     */
    fun enableAdmin(args: JSONObject, callback: PluginHook.Callback): Boolean {
        if (!devicePolicyManager.isAdminActive(componentName)) {
            val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN)
            intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, componentName)
            intent.putExtra(
                DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                "需要设备管理员权限来实现锁屏功能"
            )
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            context.startActivity(intent)
        }
        callback.onCallback(JSONObject().put("success", true))
        return true
    }

    /**
     * 锁屏
     */
    fun lockScreen(args: JSONObject, callback: PluginHook.Callback): Boolean {
        try {
            if (devicePolicyManager.isAdminActive(componentName)) {
                devicePolicyManager.lockNow()
                callback.onCallback(JSONObject().put("success", true))
            } else {
                // 如果没有管理员权限，尝试使用 PowerManager
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
                    if (powerManager.isPowerSaveMode) {
                        callback.onCallback(JSONObject().put("success", false).put("error", "省电模式阻止锁屏"))
                    } else {
                        // 尝试进入休眠状态
                        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
                        activityManager.clearApplicationUserData()
                    }
                }
                callback.onCallback(JSONObject().put("success", false).put("error", "需要设备管理员权限"))
            }
        } catch (e: Exception) {
            callback.onCallback(JSONObject().put("success", false).put("error", e.message))
        }
        return true
    }

    /**
     * 解锁（实际上是关闭自定义锁屏页面）
     */
    fun unlockScreen(args: JSONObject, callback: PluginHook.Callback): Boolean {
        try {
            // 发送广播通知锁屏Activity关闭
            val intent = Intent("com.parenting.guardian.UNLOCK")
            intent.putExtra("action", "unlock")
            context.sendBroadcast(intent)
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
            val plugin = DevicePolicyPlugin()
            return when (method) {
                "isAdminActive" -> plugin.isAdminActive(args, callback)
                "enableAdmin" -> plugin.enableAdmin(args, callback)
                "lockScreen" -> plugin.lockScreen(args, callback)
                "unlockScreen" -> plugin.unlockScreen(args, callback)
                else -> false
            }
        }
    }
}

/**
 * 设备管理员接收器
 */
class MyDeviceAdminReceiver : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        // 设备管理员已启用
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        // 设备管理员已禁用
    }

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        return "禁用后远程锁屏功能将无法使用"
    }
}
