/**
 * 解除绑定
 */
const { bindings } = require('../database')

module.exports = {
  async main(data, context) {
    const { userId, bindingId } = data

    if (!userId || !bindingId) {
      return { success: false, error: '参数不完整' }
    }

    try {
      const bindingRes = await bindings.doc(bindingId).get()

      if (!bindingRes.data) {
        return { success: false, error: '绑定记录不存在' }
      }

      const binding = bindingRes.data

      // 检查权限（家长或孩子都可以解除绑定）
      if (binding.parentId !== userId && binding.childId !== userId) {
        return { success: false, error: '无权操作此绑定' }
      }

      // 更新绑定状态
      await bindings.doc(bindingId).update({
        status: 'unbound',
        unbindTime: Date.now()
      })

      return { success: true }
    } catch (e) {
      console.error('解除绑定失败:', e)
      return { success: false, error: e.message }
    }
  }
}
