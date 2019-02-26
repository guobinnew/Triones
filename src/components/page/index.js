import Stage from './stage'

const Page = {
  /**
   * 创建编辑面板
   * @param options
   * {
   *    container: 'scene',    //用来容纳的DOM节点Id（必须有）
   *    width:  // canvas宽度（必须有）
   *    height: // canvas高度（必须有）
   *    draggable: true  // 是否允许内容拖放
   *    canZoom: true,  // 是否允许缩放
   * }
   * @returns {Stage}
   */
  init: function (options) {
    return new Stage(options)
  }
}

export default Page
