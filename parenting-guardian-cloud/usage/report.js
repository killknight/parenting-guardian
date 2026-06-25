/**
 * 使用统计模块 - 批量上报使用数据
 */
'use strict';

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { userId, deviceId, appList } = event;

  try {
    // 1. 验证参数
    if (!userId || !appList || !Array.isArray(appList)) {
      return { success: false, error: '缺少必要参数' };
    }

    const now = new Date();
    const date = formatDate(now);

    // 2. 批量保存使用记录
    const tasks = [];
    for (const app of appList) {
      tasks.push(
        db.collection('app_usage').add({
          data: {
            deviceId: deviceId || '',
            userId,
            packageName: app.packageName,
            appName: app.appName,
            category: app.category || 'OTHER',
            startTime: new Date(app.startTime),
            endTime: new Date(app.endTime),
            duration: app.duration || 0,
            date,
            createTime: now
          }
        })
      );
    }

    await Promise.all(tasks);

    // 3. 返回结果
    return {
      success: true,
      data: {
        count: appList.length,
        date
      }
    };

  } catch (error) {
    console.error('使用数据上报错误:', error);
    return { success: false, error: '服务器错误' };
  }
};

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
