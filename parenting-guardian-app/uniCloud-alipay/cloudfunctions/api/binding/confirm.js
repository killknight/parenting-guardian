/**
 * 确认绑定（家长）
 */
const { bindings, users } = require('../database')

module.exports = {
  async main(data, context) {
    const { userId, bindingId, relationship } = data

    if (!userId || !bindingId) {
      return { success: false, error: '参数不完整' }
    }

    try {
      const bindingRes = await bindings.doc(bindingId).get()

      if (!bindingRes.data) {
        return { success: false, error: '绑定记录不存在' }
      }

      const binding = bindingRes.data

      if (binding.parentId !== userId) {
        return { success: false, error: '无权操作此绑定' }
      }

      // 更新绑定状态
      await bindings.doc(bindingId).update({
        status: 'active',
        confirmTime: Date.now(),
        relationship: relationship || '父子/父女/母子/母女'
      })

      return { success: true }
    } catch (e) {
      console.error('确认绑定失败:', e)
      return { success: false, error: e.message }
    }
  }
}
