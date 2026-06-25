/**
 * 亲子守护 - 云函数入口
 *
 * 路由所有云函数调用
 */

'use strict';

exports.main = async (event, context) => {
  const { action, data } = event;

  console.log('云函数调用:', action, data);

  try {
    // 路由到对应的云函数模块
    switch (action) {
      // ========== 认证模块 ==========
      case 'auth.login':
        return require('./auth/login').main(data, context);
      case 'auth.register':
        return require('./auth/register').main(data, context);
      case 'auth.sendCode':
        return require('./auth/sendCode').main(data, context);
      case 'auth.logout':
        return require('./auth/logout').main(data, context);

      // ========== 用户模块 ==========
      case 'user.getProfile':
        return require('./user/getProfile').main(data, context);
      case 'user.updateProfile':
        return require('./user/updateProfile').main(data, context);
      case 'user.setEmergencyPhone':
        return require('./user/setEmergencyPhone').main(data, context);

      // ========== 绑定模块 ==========
      case 'binding.generateCode':
        return require('./binding/generateCode').main(data, context);
      case 'binding.apply':
        return require('./binding/apply').main(data, context);
      case 'binding.confirm':
        return require('./binding/confirm').main(data, context);
      case 'binding.getChildren':
        return require('./binding/getChildren').main(data, context);
      case 'binding.getParent':
        return require('./binding/getParent').main(data, context);
      case 'binding.unbind':
        return require('./binding/unbind').main(data, context);

      // ========== 设备模块 ==========
      case 'device.register':
        return require('./device/register').main(data, context);
      case 'device.heartbeat':
        return require('./device/heartbeat').main(data, context);

      // ========== 使用统计模块 ==========
      case 'usage.report':
        return require('./usage/report').main(data, context);
      case 'usage.daily':
        return require('./usage/daily').main(data, context);
      case 'usage.timeline':
        return require('./usage/timeline').main(data, context);
      case 'usage.ranking':
        return require('./usage/ranking').main(data, context);
      case 'usage.summary':
        return require('./usage/summary').main(data, context);

      // ========== 位置模块 ==========
      case 'location.report':
        return require('./location/report').main(data, context);
      case 'location.current':
        return require('./location/current').main(data, context);
      case 'location.history':
        return require('./location/history').main(data, context);
      case 'location.trajectory':
        return require('./location/trajectory').main(data, context);

      // ========== 指令模块 ==========
      case 'command.lock':
        return require('./command/lock').main(data, context);
      case 'command.unlock':
        return require('./command/unlock').main(data, context);
      case 'command.poll':
        return require('./command/poll').main(data, context);
      case 'command.execute':
        return require('./command/execute').main(data, context);
      case 'command.history':
        return require('./command/history').main(data, context);
      case 'command.setLimit':
        return require('./command/setLimit').main(data, context);

      // ========== 告警模块 ==========
      case 'alert.sos':
        return require('./alert/sos').main(data, context);
      case 'alert.list':
        return require('./alert/list').main(data, context);
      case 'alert.read':
        return require('./alert/read').main(data, context);

      // ========== 围栏模块 ==========
      case 'geofence.create':
        return require('./geofence/create').main(data, context);
      case 'geofence.list':
        return require('./geofence/list').main(data, context);
      case 'geofence.update':
        return require('./geofence/update').main(data, context);
      case 'geofence.delete':
        return require('./geofence/delete').main(data, context);

      default:
        return { success: false, error: 'Unknown action: ' + action };
    }
  } catch (error) {
    console.error('云函数执行错误:', error);
    return { success: false, error: error.message };
  }
};
