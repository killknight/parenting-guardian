/**
 * 认证模块 - 登录
 */
'use strict';

const cloud = require('wx-server-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const JWT_SECRET = process.env.JWT_SECRET || 'parenting_guardian_secret_2024';
const JWT_EXPIRES_IN = '7d'; // 7天过期

exports.main = async (event, context) => {
  const { phone, password, pushToken } = event;

  try {
    // 1. 验证参数
    if (!phone || !password) {
      return { success: false, error: '请输入手机号和密码' };
    }

    // 2. 查找用户
    const userRes = await db.collection('users')
      .where({ phone })
      .get();

    if (userRes.data.length === 0) {
      return { success: false, error: '用户不存在' };
    }

    const user = userRes.data[0];

    // 3. 验证密码
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return { success: false, error: '密码错误' };
    }

    // 4. 检查用户状态
    if (user.status === 'BANNED') {
      return { success: false, error: '账号已被禁用' };
    }

    // 5. 生成 JWT Token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        phone: user.phone
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 6. 更新推送Token和最后登录时间
    const updateData = {
      lastLoginTime: new Date(),
      lastLoginIp: context.CLIENTIP || ''
    };
    if (pushToken) {
      updateData.pushToken = pushToken;
    }

    await db.collection('users').doc(user._id).update({
      data: updateData
    });

    // 7. 返回结果
    return {
      success: true,
      data: {
        token,
        userId: user._id,
        role: user.role,
        nickname: user.nickname,
        avatar: user.avatar || '',
        phone: user.phone,
        emergencyPhone: user.emergencyPhone || ''
      }
    };

  } catch (error) {
    console.error('登录错误:', error);
    return { success: false, error: '服务器错误' };
  }
};
