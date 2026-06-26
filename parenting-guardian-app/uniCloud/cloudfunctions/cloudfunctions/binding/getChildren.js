/**
 * 获取绑定的孩子列表（家长）
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
        parentId: userId,
        status: 'active'
      }).get()

      if (!bindingRes.data || bindingRes.data.length === 0) {
        return { success: true, data: [] }
      }

      // 获取每个孩子的详细信息
      const children = []
      for (const binding of bindingRes.data) {
        if (binding.childId) {
          const childRes = await users.doc(binding.childId).get()
          if (childRes.data) {
            children.push({
              bindingId: binding._id,
              childId: binding.childId,
              nickname: childRes.data.nickname || '',
              relationship: binding.relationship,
              bindTime: binding.confirmTime
            })
          }
        }
      }

      return { success: true, data: children }
    } catch (e) {
      console.error('获取孩子列表失败:', e)
      return { success: false, error: e.message }
    }
  }
}
