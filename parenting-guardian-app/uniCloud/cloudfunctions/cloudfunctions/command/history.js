/**
 * 获取指令历史
 */
const { commands } = require('../database')

module.exports = {
  async main(data, context) {
    const { userId, childId } = data

    if (!userId) {
      return { success: false, error: '用户ID不能为空' }
    }

    try {
      const targetChildId = childId || userId

      const commandRes = await commands
        .where({
          childId: targetChildId
        })
        .orderBy('createTime', 'desc')
        .limit(50)
        .get()

      return {
        success: true,
        data: commandRes.data || []
      }
    } catch (e) {
      console.error('获取指令历史失败:', e)
      return { success: false, error: e.message }
    }
  }
}
