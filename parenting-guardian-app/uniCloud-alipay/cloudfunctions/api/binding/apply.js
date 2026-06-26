/**
 * 申请绑定（孩子）
 */
const { bindings, users } = require('../database')

module.exports = {
  async main(data, context) {
    const { userId, code, childNickname } = data

    if (!userId || !code) {
      return { success: false, error: '参数不完整' }
    }

    try {
      // 查找有效的绑定码
      const bindingRes = await bindings.where({
        bindingCode: code,
        status: 'pending'
      }).get()

      if (!bindingRes.data || bindingRes.data.length === 0) {
        return { success: false, error: '绑定码无效或已过期' }
      }

      const binding = bindingRes.data[0]

      if (binding.expireTime < Date.now()) {
        await bindings.doc(binding._id).update({ status: 'expired' })
        return { success: false, error: '绑定码已过期' }
      }

      // 更新绑定关系
      await bindings.doc(binding._id).update({
        childId: userId,
        childNickname: childNickname || '',
        status: 'waiting_confirm',
        applyTime: Date.now()
      })

      // 更新用户角色为孩子
      await users.doc(userId).update({
        role: 'child',
        nickname: childNickname || '',
        updateTime: Date.now()
      })

      return {
        success: true,
        data: {
          bindingId: binding._id,
          parentId: binding.parentId
        }
      }
    } catch (e) {
      console.error('申请绑定失败:', e)
      return { success: false, error: e.message }
    }
  }
}
