/**
 * 原生插件桥接层
 *
 * 集成方式：uni.requireNativePlugin
 * 插件列表：
 *   - UsageStats      应用使用统计
 *   - DevicePolicy    设备策略（锁屏/管理员）
 *   - ForegroundService 前台服务
 *
 * 使用方式：
 *   import { UsageStatsPlugin } from '@/utils/native.js'
 *   const res = await UsageStatsPlugin.checkPermission()
 */

// ========================================================================
// 工具函数：调用原生方法的 Promise 封装
// ========================================================================

/**
 * 封装 uni.requireNativePlugin 调用，支持回调形式
 * @param {string} pluginName 插件名
 * @param {string} method 方法名
 * @param {Array} args 参数数组
 * @param {boolean} hasCallback 是否有回调
 * @returns {Promise<any>}
 */
function callNative(pluginName, method, args = [], hasCallback = true) {
  // #ifdef APP-PLUS
  return new Promise((resolve) => {
    try {
      const plugin = uni.requireNativePlugin(pluginName)
      if (!plugin) {
        console.warn(`[NativePlugin] ${pluginName} 插件未找到，使用模拟数据`)
        resolve(getMockResult(pluginName, method))
        return
      }

      if (typeof plugin[method] !== 'function') {
        console.warn(`[NativePlugin] ${pluginName}.${method} 方法不存在`)
        resolve({ success: false, error: 'method not found' })
        return
      }

      if (hasCallback) {
        // 带回调的方法，最后一个参数是 callback
        const callback = (result) => {
          resolve(result)
        }
        plugin[method](...args, callback)
      } else {
        // 不带回调的方法，直接调用
        const result = plugin[method](...args)
        resolve(result)
      }
    } catch (error) {
      console.error(`[NativePlugin] ${pluginName}.${method} 调用失败:`, error)
      resolve({ success: false, error: error.message })
    }
  })
  // #endif

  // #ifndef APP-PLUS
  return Promise.resolve(getMockResult(pluginName, method))
  // #endif
}

/**
 * 获取模拟数据（H5/开发环境用）
 */
function getMockResult(pluginName, method) {
  switch (pluginName) {
    case 'UsageStats':
      return getUsageStatsMock(method)
    case 'DevicePolicy':
      return getDevicePolicyMock(method)
    case 'ForegroundService':
      return getForegroundServiceMock(method)
    default:
      return { success: false, error: 'plugin not found' }
  }
}

function getUsageStatsMock(method) {
  switch (method) {
    case 'checkPermission':
      return { hasPermission: false, success: true }
    case 'requestPermission':
      return { success: true, message: '已打开权限设置（模拟）' }
    case 'getForegroundApp':
      return { packageName: 'com.tencent.mm', appName: '微信', success: true }
    case 'getAppUsageStats':
      return {
        success: true,
        appList: [
          { packageName: 'com.tencent.mm', appName: '微信', duration: 3600 },
          { packageName: 'com.ss.android.ugc.aweme', appName: '抖音', duration: 2700 },
          { packageName: 'com.tencent.mobileqq', appName: 'QQ', duration: 1800 },
          { packageName: 'com.baidu.searchbox', appName: '百度', duration: 900 }
        ]
      }
    case 'getInstalledApps':
      return {
        success: true,
        appList: [
          { packageName: 'com.tencent.mm', appName: '微信', isSystem: false },
          { packageName: 'com.ss.android.ugc.aweme', appName: '抖音', isSystem: false },
          { packageName: 'com.tencent.mobileqq', appName: 'QQ', isSystem: false },
          { packageName: 'com.tencent.tmgp.sgame', appName: '王者荣耀', isSystem: false }
        ]
      }
    default:
      return { success: false, error: 'unknown method' }
  }
}

function getDevicePolicyMock(method) {
  switch (method) {
    case 'isAdminActive':
      return { isActive: false, success: true }
    case 'enableAdmin':
      return { success: true, message: '已打开管理员设置（模拟）' }
    case 'disableAdmin':
      return { success: true }
    case 'lockScreen':
      uni.showToast({ title: '锁屏（模拟）', icon: 'none' })
      return { success: true, message: '锁屏成功（模拟）' }
    case 'unlockScreen':
      return { success: true, message: '解锁成功（模拟）' }
    case 'openSettingPage':
      return { success: true }
    default:
      return { success: false, error: 'unknown method' }
  }
}

function getForegroundServiceMock(method) {
  switch (method) {
    case 'startService':
      console.log('[ForegroundService] 服务启动（模拟）')
      return { success: true, message: '服务已启动（模拟）' }
    case 'stopService':
      return { success: true, message: '服务已停止（模拟）' }
    case 'updateNotification':
      return { success: true }
    case 'isRunning':
      return { isRunning: false, success: true }
    case 'acquireWakeLock':
      return { success: true }
    case 'releaseWakeLock':
      return { success: true }
    default:
      return { success: false, error: 'unknown method' }
  }
}

// ========================================================================
// UsageStatsPlugin - 应用使用统计
// ========================================================================

const UsageStatsPlugin = {
  /**
   * 检查是否有使用统计权限
   * @returns {Promise<{hasPermission: boolean, success: boolean}>}
   */
  checkPermission() {
    return callNative('UsageStats', 'checkPermission')
  },

  /**
   * 请求使用统计权限
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  requestPermission() {
    return callNative('UsageStats', 'requestPermission')
  },

  /**
   * 获取前台应用
   * @returns {Promise<{packageName: string, appName: string, success: boolean}>}
   */
  getForegroundApp() {
    return callNative('UsageStats', 'getForegroundApp')
  },

  /**
   * 获取应用使用统计
   * @param {number} startTime 开始时间戳（毫秒）
   * @param {number} endTime 结束时间戳（毫秒）
   * @returns {Promise<{appList: Array, success: boolean}>}
   */
  getAppUsageStats(startTime, endTime) {
    return callNative('UsageStats', 'getAppUsageStats', [startTime, endTime])
  },

  /**
   * 获取已安装应用列表
   * @returns {Promise<{appList: Array, success: boolean}>}
   */
  getInstalledApps() {
    return callNative('UsageStats', 'getInstalledApps')
  }
}

// ========================================================================
// DevicePolicyPlugin - 设备策略管理（锁屏）
// ========================================================================

const DevicePolicyPlugin = {
  /**
   * 检查是否是设备管理员
   * @returns {Promise<{isActive: boolean, success: boolean}>}
   */
  isAdminActive() {
    return callNative('DevicePolicy', 'isAdminActive')
  },

  /**
   * 激活设备管理员
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  enableAdmin() {
    return callNative('DevicePolicy', 'enableAdmin')
  },

  /**
   * 移除设备管理员
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  disableAdmin() {
    return callNative('DevicePolicy', 'disableAdmin')
  },

  /**
   * 锁屏
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  lockScreen() {
    return callNative('DevicePolicy', 'lockScreen')
  },

  /**
   * 解锁（发送解锁广播）
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  unlockScreen() {
    return callNative('DevicePolicy', 'unlockScreen')
  },

  /**
   * 打开设置页面
   * @param {'usage'|'device_admin'|'battery'|'overlay'} settingType 设置类型
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  openSettingPage(settingType) {
    return callNative('DevicePolicy', 'openSettingPage', [settingType])
  }
}

// ========================================================================
// ForegroundServicePlugin - 前台服务
// ========================================================================

const ForegroundServicePlugin = {
  /**
   * 启动前台服务
   * @param {string} title 通知标题
   * @param {string} content 通知内容
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  startService(title, content) {
    return callNative('ForegroundService', 'startService', [title, content])
  },

  /**
   * 停止前台服务
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  stopService() {
    return callNative('ForegroundService', 'stopService')
  },

  /**
   * 更新通知
   * @param {string} title 通知标题
   * @param {string} content 通知内容
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  updateNotification(title, content) {
    return callNative('ForegroundService', 'updateNotification', [title, content])
  },

  /**
   * 检查服务是否运行
   * @returns {Promise<{isRunning: boolean, success: boolean}>}
   */
  isRunning() {
    return callNative('ForegroundService', 'isRunning')
  },

  /**
   * 获取 WakeLock（防止CPU休眠）
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  acquireWakeLock() {
    return callNative('ForegroundService', 'acquireWakeLock')
  },

  /**
   * 释放 WakeLock
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  releaseWakeLock() {
    return callNative('ForegroundService', 'releaseWakeLock')
  }
}

// ========================================================================
// 导出
// ========================================================================

export {
  UsageStatsPlugin,
  DevicePolicyPlugin,
  ForegroundServicePlugin
}

export default {
  UsageStatsPlugin,
  DevicePolicyPlugin,
  ForegroundServicePlugin
}
