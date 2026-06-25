package com.parenting.guardian.plugin

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import io.dcloud.feature.uniapp.common.UniModule
import com.taobao.weex.annotation.JSMethod
import com.taobao.weex.bridge.JSCallback
import org.json.JSONObject

/**
 * 设备策略管理 Module
 * 继承 UniModule，实现远程锁屏/解锁
 */
class DevicePolicyModule : UniModule() {

    private val devicePolicyManager: DevicePolicyManager
        get() = mUniSDKInstance.context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager

    private val componentName: ComponentName
        get() = ComponentName(mUniSDKInstance.context, GuardDeviceAdminReceiver::class.java)

    /**
     * 检查是否是设备管理员
     */
    @JSMethod(uiThread = false)
    fun isAdminActive(callback: JSCallback) {
        val isActive = devicePolicyManager.isAdminActive(componentName)
        callback.invoke(JSONObject().apply {
            put("isActive", isActive)
            put("success", true)
        })
    }

    /**
     * 激活设备管理员
     */
    @JSMethod(uiThread = true)
    fun enableAdmin(callback: JSCallback) {
        if (!devicePolicyManager.isAdminActive(componentName)) {
            try {
                val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN)
                intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, componentName)
                intent.putExtra(
                    DevicePolicyManager.EXTRA_ADD_EXPLANATION,
                    "需要设备管理员权限来实现远程锁屏功能"
                )
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                mUniSDKInstance.context.startActivity(intent)
                callback.invoke(JSONObject().apply {
                    put("success", true)
                    put("message", "已打开设备管理员激活页面")
                })
            } catch (e: Exception) {
                callback.invoke(JSONObject().apply {
                    put("success", false)
                    put("error", e.message)
                })
            }
        } else {
            callback.invoke(JSONObject().apply {
                put("success", true)
                put("message", "已是设备管理员")
            })
        }
    }

    /**
     * 移除设备管理员
     */
    @JSMethod(uiThread = true)
    fun disableAdmin(callback: JSCallback) {
        try {
            if (devicePolicyManager.isAdminActive(componentName)) {
                devicePolicyManager.removeActiveAdmin(componentName)
            }
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
     * 锁屏
     */
    @JSMethod(uiThread = true)
    fun lockScreen(callback: JSCallback) {
        try {
            if (devicePolicyManager.isAdminActive(componentName)) {
                devicePolicyManager.lockNow()
                callback.invoke(JSONObject().apply {
                    put("success", true)
                    put("message", "锁屏成功")
                })
            } else {
                callback.invoke(JSONObject().apply {
                    put("success", false)
                    put("error", "需要先激活设备管理员权限")
                })
            }
        } catch (e: Exception) {
            callback.invoke(JSONObject().apply {
                put("success", false)
                put("error", e.message)
            })
        }
    }

    /**
     * 解锁（发送解锁广播，配合自定义锁屏Activity使用）
     */
    @JSMethod(uiThread = true)
    fun unlockScreen(callback: JSCallback) {
        try {
            // 发送广播通知自定义锁屏页面关闭
            val intent = Intent("com.parenting.guardian.action.UNLOCK")
            mUniSDKInstance.context.sendBroadcast(intent)
            callback.invoke(JSONObject().apply {
                put("success", true)
                put("message", "解锁广播已发送")
            })
        } catch (e: Exception) {
            callback.invoke(JSONObject().apply {
                put("success", false)
                put("error", e.message)
            })
        }
    }

    /**
     * 打开设置页面（用于引导用户设置）
     */
    @JSMethod(uiThread = true)
    fun openSettingPage(settingType: String, callback: JSCallback) {
        try {
            val intent = when (settingType) {
                "usage" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
                    } else {
                        null
                    }
                }
                "device_admin" -> {
                    Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                        putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, componentName)
                    }
                }
                "battery" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                    } else {
                        null
                    }
                }
                "overlay" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION)
                    } else {
                        null
                    }
                }
                else -> null
            }

            if (intent != null) {
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                mUniSDKInstance.context.startActivity(intent)
                callback.invoke(JSONObject().apply {
                    put("success", true)
                })
            } else {
                callback.invoke(JSONObject().apply {
                    put("success", false)
                    put("error", "不支持的设置类型或系统版本过低")
                })
            }
        } catch (e: Exception) {
            callback.invoke(JSONObject().apply {
                put("success", false)
                put("error", e.message)
            })
        }
    }

    /**
     * 设备管理员接收器
     */
    class GuardDeviceAdminReceiver : DeviceAdminReceiver() {
        // 空实现，主要用于声明管理员权限
    }
}
