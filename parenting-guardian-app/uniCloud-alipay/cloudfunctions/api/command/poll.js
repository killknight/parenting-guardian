/**
 * 指令模块 - 轮询指令（孩子端）
 *
 * 孩子端定期轮询获取待执行的指令
 */
'use strict';




const db = uniCloud.database();

exports.main = async (event, context) => {
  const { userId, deviceId, lastCommandId } = event;

  try {
    // 1. 验证参数
    if (!userId) {
      return { success: false, error: '缺少用户ID' };
    }

    // 2. 更新设备心跳
    if (deviceId) {
      await db.collection('devices')
        .where({ deviceId })
        .update({
          data: {
            isOnline: true,
            lastOnline: new Date()
          }
        });
    }

    // 3. 查询待执行的指令
    let cmdQuery = {
      childId: userId,
      status: 'PENDING',
      'cmdData.expireTime': db.command.gt(Date.now()) // 未过期的指令
    };

    if (lastCommandId) {
      cmdQuery._id = db.command.neq(lastCommandId);
    }

    const commandsRes = await db.collection('commands')
      .where(cmdQuery)
      .orderBy('createTime', 'asc')
      .limit(10)
      .get();

    const commands = commandsRes.data || [];

    // 4. 查询未读的告警
    const alertsRes = await db.collection('alerts')
      .where({
        childId: userId,
        isRead: false
      })
      .orderBy('createTime', 'desc')
      .limit(10)
      .get();

    const alerts = alertsRes.data || [];

    // 5. 更新心跳时间到用户表
    await db.collection('users').doc(userId).update({
      data: {
        lastHeartbeat: new Date()
      }
    });

    // 6. 返回结果
    return {
      success: true,
      data: {
        commands,
        alerts,
        serverTime: Date.now()
      }
    };

  } catch (error) {
    console.error('轮询指令错误:', error);
    return { success: false, error: '服务器错误' };
  }
};
