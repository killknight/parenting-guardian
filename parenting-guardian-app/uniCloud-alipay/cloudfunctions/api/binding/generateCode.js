/**
 * 生成绑定码（家长）
 */
const { bindings, users } = require('../database')

module.exports = {
  async main(data, context) {
    const { userId } = data

    if (!userId) {
      return { success: false, error: '用户ID不能为空' }
    }

    try {
      // 生成6位数字绑定码
      const bindingCode = Math.random().toString().slice(2, 8).padStart(6, '0')
      const expireTime = Date.now() + 30 * 60 * 1000 // 30分钟后过期

      // 检查是否有未过期的绑定码
      const existRes = await bindings.where({
        parentId: userId,
        status: 'pending',
        expireTime: bindings.command.gt(Date.now())
      }).get()

      if (existRes.data && existRes.data.length > 0) {
        // 返回已有的绑定码
        const existing = existRes.data[0]
        return {
          success: true,
          data: {
            code: existing.bindingCode,
            expireTime: existing.expireTime
          }
        }
      }

      // 创建新的绑定码
      await bindings.add({
        parentId: userId,
        bindingCode,
        status: 'pending',
        expireTime,
        createTime: Date.now()
      })

      return {
        success: true,
        data: {
          code: bindingCode,
          expireTime
        }
      }
    } catch (e) {
      console.error('生成绑定码失败:', e)
      return { success: false, error: e.message }
    }
  }
}
