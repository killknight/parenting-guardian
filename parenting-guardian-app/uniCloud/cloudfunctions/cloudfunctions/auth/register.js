/**
 * 认证模块 - 注册
 */
'use strict';


const bcrypt = require('bcryptjs');


const db = uniCloud.database();

exports.main = async (event, context) => {
  const { phone, password, code, role, nickname } = event;

  try {
    // 1. 验证参数
    if (!phone || !password || !role) {
      return { success: false, error: '缺少必要参数' };
    }

    if (!['PARENT', 'CHILD'].includes(role)) {
      return { success: false, error: '角色必须是 PARENT 或 CHILD' };
    }

    if (password.length < 6) {
      return { success: false, error: '密码至少6位' };
    }

    // 2. 验证验证码（简化版，实际应连接短信服务验证）
    // 这里简化处理，验证码为 "123456" 或 "000000" 表示验证通过
    if (!code || (code !== '123456' && code !== '000000')) {
      return { success: false, error: '验证码错误' };
    }

    // 3. 检查手机号是否已注册
    const existRes = await db.collection('users')
      .where({ phone })
      .count();

    if (existRes.total > 0) {
      return { success: false, error: '该手机号已注册' };
    }

    // 4. 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. 创建用户
    const userData = {
      phone,
      password: hashedPassword,
      role,
      nickname: nickname || (role === 'PARENT' ? '家长用户' : '孩子用户'),
      avatar: '',
      emergencyPhone: '',
      pushToken: '',
      status: 'ACTIVE',
      createTime: new Date(),
      updateTime: new Date(),
      lastLoginTime: new Date()
    };

    const userRes = await db.collection('users').add({
      data: userData
    });

    // 6. 生成 JWT Token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'parenting_guardian_secret_2024';
    const token = jwt.sign(
      {
        userId: userRes.id,
        role: role,
        phone: phone
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 7. 返回结果
    return {
      success: true,
      data: {
        token,
        userId: userRes.id,
        role,
        nickname: userData.nickname,
        avatar: '',
        phone
      }
    };

  } catch (error) {
    console.error('注册错误:', error);
    return { success: false, error: '服务器错误' };
  }
};
