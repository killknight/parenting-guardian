/**
 * 确认指令执行
 */
const { commands } = require('../database')

module.exports = {
  async main(data, context) {
    const { commandId, status, executeTime } = data

    if (!commandId) {
      return { success: false, error: '指令ID不能为空' }
    }

    try {
      await commands.doc(commandId).update({
        status: status || 'executed',
        executeTime: executeTime || Date.now()
      })

      return { success: true }
    } catch (e) {
      console.error('确认指令执行失败:', e)
      return { success: false, error: e.message }
    }
  }
}
