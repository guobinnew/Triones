import konva from 'konva'
import uniqid from 'uniqid'
import QRCode from 'qrcode'
var _ = require('lodash')

// A4
// 842 × 595    72
// 794 × 1123   96
// 1487 × 2105  120
// 1240 × 1754  150
// 2480 × 3508  300
const _pageSize = {
  72: [842, 595, 128],
  96: [1123, 794, 160],
  120: [1403, 991, 192],
  150: [1754, 1240, 256],
  300: [3508, 2480, 512]
}

const _getDPI = function () {
  let tmpNode = document.createElement('div')
  tmpNode.style.cssText = 'width:1in;height:1in;position:absolute;left:0px;top:0px;z-index:99;visibility:hidden'
  document.body.appendChild(tmpNode)
  let dpi = []
  dpi[0] = parseInt(tmpNode.offsetWidth)
  dpi[1] = parseInt(tmpNode.offsetHeight)
  tmpNode.parentNode.removeChild(tmpNode)
  return dpi
}

const _createQr = function (text, size, cb) {
  QRCode.toDataURL(text, {
    errorCorrectionLevel: 'H',
    width: size,
    margin: 0 })
    .then(url => {
      cb && cb(url)
    })
    .catch(err => {
      console.error(err)
    })
}

/**
 * 编辑面板
 */
class Stage {
  constructor (options) {
    this.options = {
      draggable: true,
      canZoom: true,
      canWheelZoom: true,
      model: {
        row: 3,
        column: 6
      }
    }
    _.merge(this.options, options)

    this.stage = new konva.Stage(this.options)

    let dpi = _getDPI()
    let size = _pageSize[dpi[0]]
    console.log('ddd', dpi, size)
    this.pageSize = {
      width: size[0] * 2,
      height: size[1] * 2
    }

    this.modelStyle = {
      space: 40,
      borderWidth: 20,
      borderColor: '#ff0000',
      size: size[2] * 2,
      qrcodeColor: '#000000',
      fontSize: 48 * 2
    }

    this.layers = {}
    // 创建图层
    this.modelIndex = {}
    this.layers.model = new konva.Layer()
    this.stage.add(this.layers.model)

    // 辅助层
    this.layers.util = new konva.Layer()
    this.stage.add(this.layers.util)

    // 是否被修改
    this.modified = false

    // 当前鼠标位置
    this.mousePos = {
      x: 0,
      y: 0
    }

    // 是否允许缩放
    this.zoom = 1.0
    this.minZoom = 0.1
    this.maxZoom = 10
    this.zoomFactor = 1.25

    this.page = null
    this.logo = null

    // 鼠标事件
    let stage = this
    this.stage.on('mousedown', (evt) => {
    })

    this.stage.on('mouseup', (evt) => {
    })

    this.stage.on('mousemove', (evt) => {
      stage.mousePos = stage.stage.getPointerPosition()
    })

    this.addPage()
    this.update()
  }

  /**
   * 
   * @param {*} logo 
   */
  setLogo (logo) {
    this.logo = logo
  }

  /**
   * 创建Page对象
   */
  addPage () {
    console.log('add page', this.pageSize)
    // 创建模型
    let group = new konva.Group({
      x: 40,
      y: 60,
      draggable: false,
      name: 'page',
      id: uniqid()
    })

    // 背景图形
    let bg = new konva.Rect({
      x: 0,
      y: 0,
      width: this.pageSize.width,
      height: this.pageSize.height,
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 3,
      name: 'pagebg'
    })
    group.add(bg)

    this.layers.model.add(group)
    this.page = group
    this.layers.model.draw()
    return group
  }

  /**
   * 刷新显示
   */
  update () {
    this.stage.draw()
  }

  /**
   * 查找所在Group对象
   * @param shape
   * @param type 类型
   * @returns {*}
   */
  findGroupParent (shape, type) {
    let parent = null
    // 如果自己满足条件，返回自己
    if (shape instanceof konva.Group) {
      if (!type || (type.length > 0 && shape.hasName(type))) {
        parent = shape
        return
      }
    }

    let groups = this.stage.find('Group')
    for (let i = 0; i < groups.length; i++) {
      if (groups[i] === shape) {
        continue
      }

      if (type.length > 0 && !groups[i].hasName(type) ) {
        continue
      }

      if (groups[i].isAncestorOf(shape)) {
        parent = groups[i]
        break
      }
    }
    return parent
  }

  /**
   * 创建模型
   * @param config
   * {
   *   uid:  模型唯一ID
   *   x: X坐标
   *   y: Y坐标
   *   title: 模型标题
   *   name: 模型ID名
   *   ports: [ 端口列表
   *     {
   *       orientation: in \ out  端口方向
   *       external: true 是否暴露给外部
   *       name: 端口ID
   *       title: 端口标题
   *       dataType: 数据类型
   *     }
   *   ]
   * }
   *
   * @returns {konva.Group}
   */
  addModel (config) {
    const stage = this

    // 创建模型
    let group = new konva.Group({
      x: 0,
      y: 0,
      draggable: false,
      name: 'card',
      id: config.uid
    })

    group.setAttr('carddef', config)

    // 背景图形
    let bg = new konva.Rect({
      x: 0,
      y: 0,
      width: this.modelStyle.size,
      height: this.modelStyle.size,
      fill: '#ffffff',
      stroke: this.modelStyle.borderColor,
      strokeWidth: this.modelStyle.borderWidth,
      name: 'cardbg'
    })
    group.add(bg)

    //qrcode / logo
    if (config.form.command !== '') {
      // 生成QrCode
      let qrgroup = new konva.Group({
        x: this.modelStyle.size / 4,
        y: 20,
        draggable: false,
        name: 'card',
        id: config.uid
      })

      // qrcode
      _createQr(config.form.command, 256, (url) => {
        let qrImage = new Image()
        qrImage.onload = function () {
          // 等比缩放
          let iconSize = stage.modelStyle.size / 2
          let zoom = 1.0 / Math.max(qrImage.width / iconSize, qrImage.height / iconSize)
          let qr = new konva.Image({
            x: 0,
            y: 0,
            image: qrImage,
            width: qrImage.width * zoom,
            height: qrImage.height * zoom
          })
          qrgroup.add(qr)
          qr.moveToBottom()
          stage.update()
        }
        qrImage.src = url
      })

      // logo
      if (this.logo) {
        let logobg = new konva.Rect({
          x: this.modelStyle.size * 3.0 / 16,
          y: this.modelStyle.size * 3.0 / 16,
          width: this.modelStyle.size / 8,
          height: this.modelStyle.size / 8,
          fill: '#ffffff',
          cornerRadius: 4,
          name: 'logobg'
        })
        qrgroup.add(logobg)

        let logo = new konva.Image({
          x: this.modelStyle.size * 3.0 / 16,
          y: this.modelStyle.size * 3.0 / 16,
          image: this.logo,
          width: this.modelStyle.size / 8,
          height: this.modelStyle.size / 8
        })
        qrgroup.add(logo)
      }
      group.add(qrgroup)
    }

    // icon / title
    if (config.form.icon !== '/img/default.jpeg') {
      let imageObj = new Image()
      imageObj.onload = function () {
        // 等比缩放
        let iconSize = stage.modelStyle.size / 2 - 40
        let zoom = 1.0 / Math.max(imageObj.width / iconSize, imageObj.height / iconSize)
   
        let icon = new konva.Image({
          x: (stage.modelStyle.size - imageObj.width * zoom) / 2,
          y: 20 + stage.modelStyle.size / 2 + (iconSize - imageObj.height * zoom) / 2,
          image: imageObj,
          width: imageObj.width * zoom,
          height: imageObj.height * zoom
        })
        group.add(icon)
        stage.update()
      }
      imageObj.src = config.form.icon
    } else {
      // Name
      let fontSize = this.modelStyle.fontSize
      let title = new konva.Text({
        x: 0,
        y: 0,
        text: config.title,
        fontSize: fontSize,
        fontStyle: 'bold',
        fill: '#000',
        verticalAlign: 'middle',
        align: 'center'
      })

      while (title.width() > (this.modelStyle.size - 40)) {
        fontSize -= 2
        title.fontSize(fontSize)
      }
      title.offsetX(title.width() / 2)

      title.y(20 + this.modelStyle.size / 2 + (this.modelStyle.size / 2 - fontSize) / 2)
      title.x(this.modelStyle.size / 2)

      group.add(title)
    }

    stage.page.add(group)
    stage.modelIndex[config.uid] = group
    return group
  }

  /**
   * 删除模型
   * @param mid
   */
  removeModel (mid) {
    if (this.modelIndex[mid]) {
      let m = this.modelIndex[mid]
      delete this.modelIndex[mid]
      // 删除模型
      m.destroy()
    }
  }

  /**
   * 调整模型位置
   */
  adjust () {
    let cards = this.page.getChildren(function (node) {
      return node.hasName('card')
    })

    let offsetx = (this.pageSize.width - this.modelStyle.size * this.options.model.column - this.modelStyle.space * (this.options.model.column - 1)) / 2
    let offsety = (this.pageSize.height - this.modelStyle.size * this.options.model.row - this.modelStyle.space * (this.options.model.row - 1)) / 2

    let row = 0
    let col = 0
    for (let c of cards) {
      c.x(offsetx + col * (this.modelStyle.size + this.modelStyle.space))
      c.y(offsety + row * (this.modelStyle.size + this.modelStyle.space))
      col += 1
      if (col >= this.options.model.column) {
        row += 1
        col = 0
      }
      if (row >= this.options.model.row) {
        break
      }
    }
    this.update()
  }

  /**
   * 改变大小
   * @param w
   * @param h
   */
  resize (w, h) {
    w && this.stage.width(w)
    h && this.stage.height(h)
    this.stage.draw()
  }

  /**
   * 放大
   */
  zoomIn () {
    if (!this.options.canZoom) {
      return
    }
    this.zoom = _.clamp(this.zoom * this.zoomFactor, this.minZoom, this.maxZoom)
    this.stage.scale({
      x: this.zoom,
      y: this.zoom
    })
    this.update()
  }

  zoomOut () {
    if (!this.options.canZoom) {
      return
    }
    this.zoom = _.clamp(this.zoom / this.zoomFactor, this.minZoom, this.maxZoom)
    this.stage.scale({
      x: this.zoom,
      y: this.zoom
    })
    this.update()
  }

  reset () {
    this.zoom = 1.0
    this.stage.scale({
      x: this.zoom,
      y: this.zoom
    })
    this.stage.position({
      x: 0,
      y: 0
    })
    this.update()
  }

  /**
   * 清空编辑器，不能撤销
   * @param cache boolean 是否清除快照缓冲
   */
  clear (cache = true) {
    // 是否被修改
    this.modified = false
    for (let mid of Object.keys(this.modelIndex)) {
      this.removeModel(mid)
    }

    this.modelIndex = {}
    this.update()
  }

  /**
   * 
   */
  toDataURL () {
    let oldZoom = this.zoom
    let oldPosition = this.stage.position()
    this.reset()
    let uri = this.page.toDataURL()
    this.zoom = oldZoom
    this.stage.scale({
      x: this.zoom,
      y: this.zoom
    })
    this.stage.position({
      x: oldPosition.x,
      y: oldPosition.y
    })
    this.update()
    return uri
  }
}

export default Stage
