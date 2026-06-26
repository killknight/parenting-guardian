/**
 * 获取绑定的家长（孩子）
 */
const { bindings, users } = require('../database')

module.exports = {
  async main(data, context) {
    const { userId } = data

    if (!userId) {
      return { success: false, error: '用户ID不能为空' }
    }

    try {
      const bindingRes = await bindings.where({
        childId: userId,
        status: 'active'
      }).get()

      if (!bindingRes.data || bindingRes.data.length === 0) {
        return { success: true, data: null }
      }

      const binding = bindingRes.data[0]

      // 获取家长详细信息
      const parentRes = await users.doc(binding.parentId).get()

      if (!parentRes.data) {
        return { success: true, data: null }
      }

      return {
        success: true,
        data: {
          bindingId: binding._id,
          parentId: binding.parentId,
          nickname: parentRes.data.nickname || '',
          phone: parentRes.data.phone,
          relationship: binding.relationship,
          bindTime: binding.confirmTime
        }
      }
    } catch (e) {
      console.error('获取家长信息失败:', e)
      return { success: false, error: e.message }
    }
  }
}
