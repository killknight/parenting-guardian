/**
 * 告警模块 - SOS求助
 */
'use strict';

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { userId, latitude, longitude, address } = event;

  try {
    // 1. 验证参数
    if (!userId) {
      return { success: false, error: '缺少用户ID' };
    }

    // 2. 获取孩子的绑定信息
    const bindingRes = await db.collection('bindings')
      .where({
        childId: userId,
        status: 'ACTIVE'
      })
      .get();

    if (bindingRes.data.length === 0) {
      return { success: false, error: '未绑定家长，无法发送求助' };
    }

    const binding = bindingRes.data[0];
    const parentId = binding.parentId;
    const createTime = new Date();

    // 3. 创建SOS告警记录
    const alertRes = await db.collection('alerts').add({
      data: {
        parentId,
        childId: userId,
        alertType: 'SOS',
        title: '紧急求助！',
        content: `孩子于${formatTime(createTime)}发起紧急求助`,
        latitude: latitude || 0,
        longitude: longitude || 0,
        address: address || '未知位置',
        isRead: false,
        createTime
      }
    });

    // 4. 获取孩子信息用于推送
    const childRes = await db.collection('users').doc(userId).get();
    const child = childRes.data;

    // 5. 获取家长信息用于推送
    const parentRes = await db.collection('users').doc(parentId).get();
    const parent = parentRes.data;

    // 6. 推送通知给家长
    if (parent && parent.pushToken) {
      await cloud.openapi.push({
        token: parent.pushToken,
        title: '🚨 紧急求助！',
        content: `${child?.nickname || '孩子'}发起紧急求助，请立即查看！`,
        payload: {
          alertType: 'SOS',
          alertId: alertRes.id,
          latitude,
          longitude,
          childName: child?.nickname
        }
      });
    }

    // 7. 返回结果
    return {
      success: true,
      data: {
        alertId: alertRes.id,
        parentId,
        createTime
      }
    };

  } catch (error) {
    console.error('SOS告警错误:', error);
    return { success: false, error: '服务器错误' };
  }
};

/**
 * 格式化时间
 */
function formatTime(date) {
  const d = new Date(date);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}
