<template>
  <div class="container" v-resize="onContainerResize">
      <Layout :style="{height: '100%',color:'#fff', textAlign:'left'}">
            <Sider hide-trigger width="300">
              <Tree ref="tree" :data="tree.data" :render="renderContent" class="card-tree"></Tree>
            </Sider>
            <Content :style="{overflow:'hidden', minWidth:'640px', minHeight: '480px'}">
              <Row id="row" :style="{position:'relative',height:'100%'}">
                <Col span="12" class="left-panel">
                  <Form :model="card.form" :label-width="80">
                     <FormItem label="Style">
                      <RadioGroup v-model="card.shape" @on-change="handleStyleChange">
                        <Radio label="single"><span>Single Side</span></Radio>
                        <Radio label="double"><span>Double Sides</span></Radio>
                      </RadioGroup>
                    </FormItem>
                    <FormItem label="Title">
                      <Input v-model="card.form.title" placeholder="Enter card title..." @on-change="handleTitleChange"></Input>
                    </FormItem>
                    <FormItem label="Icon">
                      <Upload 
                        :before-upload="handleUpload"
                        action="/"
                        :format="['jpg','jpeg','png']"
                        :max-size="4096"
                        style="display: inline-block; margin-right: 4px">
                        <Button icon="ios-cloud-upload-outline">Select icon file</Button>
                      </Upload>
                      <Button type="warning" @click="handleClearIcon">Clear</Button>
                      <div class="upload-img">
                        <img id="iconImg" :src="card.form.icon">
                      </div>
                    </FormItem>
                    <FormItem label="Command">
                      <Input v-model="card.form.command" placeholder="Enter card command..." @on-change="handleCommandChange"></Input>
                    </FormItem>
                    <FormItem>
                      <Button type="primary" @click="handleSaveCard">Save</Button>
                    </FormItem>
                  </Form>
                </Col>
                <Col span="12" class="right-panel">
                  <canvas class="card-preview"></canvas>
                </Col>
              </Row>
            </Content>
      </Layout>
      <input type="file" id="trionesfile" style="display: none" @change="loadLocalFile">
  </div>
</template>

<style scoped>
.container {
  overflow: hidden;
  height: 100%;
}

#scene {
  width: 100%;
  height: 100%;
  background-color: #fff;
}

.menu {
  position: absolute;
  top: 0;
  left: 0;
  overflow: visible;
  text-align: left;
  margin-left: 40px;
  margin-top: 10px;
}

.card-tree {
  overflow-x: hidden;
}

.ivu-dropdown {
  margin-left: 10px;
}

.split-pane{
  padding: 10px;
  height: 80%;
  position: relative;
}

.upload-img{
  width: 128px;
  height: 128px;
  text-align: center;
  line-height: 128px;
  border: 1px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
  position: relative;
  box-shadow: 0 1px 1px rgba(0,0,0,.2);
  margin-right: 4px;
}

.upload-img img{
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.left-panel {
  padding: 10px;
  width: 50%;
  display: inline-block;
  height: 100%;
  color: #000;
}

.right-panel {
  padding: 0;
  overflow: hidden;
  height: 100%;
}

.card-preview {
  height: 100%;
  width: 100%;
  min-width: 300px;
}

</style>

<script>
  import resize from 'vue-resize-directive'
  import FileSaver from 'file-saver'
  import LocalForage from 'localforage'
  import QRCode from 'qrcode'
  import Utils from '../utils'

  export default {
    components: {},
    data: function () {
      return {
        size: {
          width: 0,
          height: 0
        },
        split: 0.3,
        card: {
          shape: 'single',
          logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAEeElEQVR4Xu1bgXHUMBBcVQCpAFIBoQKSCoAKgAqACiAVkFQAqSBJBZAKIBWQVEBSgZjVyx+98dt7suQ3868ZZpiJX75b3e3tnf4dtny5LfcfOwB2EbDlCOxSYMsDYEeCuxSYTwr4xwCePdjjrqawbYMR4J8CeAngMP4jAO11A+AXgB8AzgB3VxqUDQAQHP8C4FWGM98AnAKOoBRZEwPgPwH4XMDyEwDHJSJiQgD8VwBvCzjfbMH0eD02GiYCwH+PeV7Q/7AVOeFoDAgTAOAZ8gz9Wosg7OemQ2UA/AGAn7U8T/YlMX7IeU9tAGqFfpevTAWWS9OqCEAod79N1ox7+BJw5tJaEwBr7t9GwUN2pyiiM0+MmOxZuaAmAMx9coCyWNM79IEnCBQ/j5RNALwDHJ+XV00AvGjFAIEFImVuKyCYybASAKGx+SMCIIStp4CikBpaV4BjbyGvWgDQCFaAoSUaLAMq7vdg1qYBMISsV1LqvwNgDfm1A0cWVGyZTf3GpiNArN2ynBYBrZICIU854KAA4v8VaSqGrFdLqlkNFogAT8Jjs2Ni33gGd4Db62dKk6IUKsrq20YAEPKSk50cx1Mr2NNfrAfBM5L4nqElRlMRAILzLHNdc7whQ9t/HyAuOfw/Ao6TItPKiACZkVVDetLAFP7PcwYjRgCCQSSkEicvpIHM/reAo23mZQWgVn+/Jg0822nFMXP9b5AyABDYXpG35lMAcAO4/dUPmlLNXP5yACBTs87XWpzrcRYQl2db+0Z4WXb4c28xAuRmRLB37SNJOQzvY/grXGNWf6kFKgCW8Odkh+WI01rq8hciKokjcvvLrVuRI74tPqYCoI637hekld7heQ4zFBBSAFTpew04derUiUxpADraW/k0IwAm8jOPwNoozBEAlfzuAadwRG9OqACoepx5T0UW2TyQGUunEqbHkTvUUZphmLIeAxUACwkShEaTc6qrOE8Lj2JjpV6jjSK/HB2gjKRsFLzytHOA5+krYS0OUobNESOAG/maQugSAPdXJr8xWuzXYF1wWACwpMEw9KtPMPzpvKL7Rym/zCpglqcWAHj61BnqLfLo0pehBJcAMD/J8MotjQJCFE4BgPfCB4qUvhEABC6wXFX1+UTnDxdDDJn8Run+kRyQfnw0CKnzFm4xDz2HospAgu2tgshhvVda1vTDZ4uRedMvyFOf7KFHHwgjAFjyAk+QXR9Fzzpu4ImzKTr591scniAq+T8wPR466+6/FwBgJTUIBktZU85ImJz29Hx1Re0WKZTKryqb2sy0AhBSjxFDyd33jVHqhWTCNEkE2FxfPK0CEErlabwkUS5ApYoxhwhQhy1WdCXBNAcASJ7nVu+E56WLkhkAENKA+VxKXXJDuV+YCwCl00C+J5wLAGR2Mrr1e4FdmWAalM4EgGI9BgXXgVL+GuRmBEAAgQKKg5Hkt0MC3S0euV6o0eHan+44MwCW8ppDWPKCQow8dcppymzzb4pmCsASCJbIZrCaRgVPu/kx1UWO480b/gILMS5Qwwr0BAAAAABJRU5ErkJggg==',
          form: {
            uid: '',
            title: '',
            icon: '/img/default.jpeg',
            command: '',
          },
          style: {
            borderWidth: 10,
            borderColor: '#ff0000',
            size: 256,
            qrcodeSize: 128,
            qrcodeColor: '#000000',
            logoSize: 32
          }
        },
        tree: {
          current: null,
          nodeIndex: {},
          data:[
          {
            title: 'Root',
            type: 'root',
            expand: true,
            selected: false,
            children: [
            ]
          }]
        },
        buttonProps: {
          type: 'default',
          size: 'small',
        },
        preview: {
          canvas: null,
          qrcode: null,
          logo: null,
          icon: null
        }
      }
    },
    directives: {
      resize,
    },
    computed: {
    },
    methods: {
      onContainerResize() {
        this.size.width = this.$el.clientWidth
        this.size.height = this.$el.clientHeight

        this.$el.querySelector('.card-tree').style.height = this.size.height + 'px'

        let row = this.$el.querySelector('#row')
        this.preview.canvas.width = row.clientWidth / 2
        this.preview.canvas.height = row.clientHeight
        this.previewCard()
      },
      imageTobase64(img, size = 128) {
        if (!img) {
          return null
        }
        // 计算缩放比例
        let zoom = 1.0 / Math.max(img.width / size, img.height / size)
        let canvas = document.createElement("canvas")
        canvas.width = img.width * zoom
        canvas.height = img.height * zoom
        let ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        return canvas.toDataURL("image/png")
      },
      handleUpload (file) {
        // 转换为Base64
        this.card.form.iconBase64 = null
        this.card.form.icon = window.URL.createObjectURL(file)
        this.preview.icon.src = this.card.form.icon
        return false
      },
      handleClearIcon () {
        this.card.form.iconBase64 = null
        this.card.form.icon = '/img/default.jpeg'
        this.previewCard()
      },
      createQr ( text, size = 256 ) {
        if (text === '') {
          return
        }

        QRCode.toDataURL(text, { 
          errorCorrectionLevel: 'H',
          width: size,
          margin: 0 })
        .then(url => {
          this.preview.qrcode.src = url
        })
        .catch(err => {
          console.error(err)
        })
      },
      clearCanvas() {
        let ctx = this.preview.canvas.getContext("2d")
        ctx.clearRect(0, 0, this.preview.canvas.width, this.preview.canvas.height)
      },
      drawRoundRect(ctx, x, y, width, height, radius){
        ctx.beginPath()
        ctx.arc(x + radius, y + radius, radius, Math.PI, Math.PI * 3 / 2)
        ctx.lineTo(width - radius + x, y)
        ctx.arc(width - radius + x, radius + y, radius, Math.PI * 3 / 2, Math.PI * 2)
        ctx.lineTo(width + x, height + y - radius)
        ctx.arc(width - radius + x, height - radius + y, radius, 0, Math.PI * 1 / 2)
        ctx.lineTo(radius + x, height +y)
        ctx.arc(radius + x, height - radius + y, radius, Math.PI * 1 / 2, Math.PI)
        ctx.closePath()
      },   
      previewCard() {
        this.clearCanvas()

        // 居中显示
        let ctx = this.preview.canvas.getContext("2d")
        let offsetx = 0
        let offsety = 0

        if (this.card.shape === 'single') {
          offsetx = (this.preview.canvas.width - this.card.style.size) / 2
          offsety = 20
       
        ctx.lineWidth = this.card.style.borderWidth
        ctx.fillStyle = '#ffffff'
        ctx.strokeStyle = this.card.style.borderColor
        ctx.fillRect(offsetx, offsety, this.card.style.size,  this.card.style.size)
        ctx.strokeRect(offsetx, offsety, this.card.style.size,  this.card.style.size)

        // QrCode
        if (this.preview.qrcode.complete) {
          let qrx = offsetx + (this.card.style.size - this.card.style.qrcodeSize) / 2
          let qry = 40
          ctx.drawImage(this.preview.qrcode, qrx, qry, this.card.style.qrcodeSize, this.card.style.qrcodeSize)

          if (this.preview.logo.complete) {
            let logox = qrx + (this.card.style.qrcodeSize - this.card.style.logoSize) / 2
            let logoy = qry + (this.card.style.qrcodeSize - this.card.style.logoSize) / 2

            this.drawRoundRect(ctx, logox, logoy, this.card.style.logoSize, this.card.style.logoSize, 4)
             // 绘制背景
            ctx.fillStyle = '#ffffff'
            ctx.fill()

            // 绘制logo
            let margin = 2
            ctx.drawImage(this.preview.logo, logox + margin, logoy + margin, this.card.style.logoSize - margin * 2, this.card.style.logoSize - margin * 2)
          }
        }

        // Icon
        if (this.card.form.icon !== '/img/default.jpeg') {
          if (this.preview.icon.complete) {
            // 等比缩放
            let iconH = this.card.style.size / 2 - 40
            let zoom = 1.0 / Math.max(this.preview.icon.width / this.card.style.size, this.preview.icon.height / iconH)

            let qrx = offsetx + (this.card.style.size - this.preview.icon.width * zoom) / 2
            let qry = offsety + this.card.style.size / 2 + 28 + (iconH - this.preview.icon.height * zoom) / 2
            ctx.drawImage(this.preview.icon, qrx, qry, this.preview.icon.width * zoom, this.preview.icon.height * zoom)
          }
        } else {
          // Title
          let title = this.card.form.title
          let fontSize = 48
          let titleWidth = 0
          do {
            // 调整字体大小
            ctx.font = `bold ${fontSize}px Arial`
            titleWidth = ctx.measureText(title).width
            fontSize -= 2 
          } while(titleWidth > (this.card.style.size - 40) )

          ctx.textAlign = 'center'
          ctx.fillStyle = '#000000'
          ctx.fillText(title, offsetx + this.card.style.size / 2, offsety + this.card.style.size * 3.0 / 4 + 20 )
        }

        } else {
          // 绘制正面
          offsetx = (this.preview.canvas.width - this.card.style.size) / 2
          offsety = 20
          // 居中显示
          ctx.lineWidth = this.card.style.borderWidth
          ctx.fillStyle = '#ffffff'
          ctx.strokeStyle = this.card.style.borderColor
          ctx.fillRect(offsetx, offsety, this.card.style.size,  this.card.style.size)
          ctx.strokeRect(offsetx, offsety, this.card.style.size,  this.card.style.size)

          // Icon
          if (this.card.form.icon !== '/img/default.jpeg') {
            if (this.preview.icon.complete) {
            // 等比缩放
            let iconH = this.card.style.size - 40
            let zoom = 1.0 / Math.max(this.preview.icon.width / iconH, this.preview.icon.height / iconH)

            let qrx = offsetx + (this.card.style.size - this.preview.icon.width * zoom) / 2
            let qry = offsety + (this.card.style.size - this.preview.icon.height * zoom) / 2
            ctx.drawImage(this.preview.icon, qrx, qry, this.preview.icon.width * zoom, this.preview.icon.height * zoom)
          }
          } else {
          // Title
          let title = this.card.form.title
          let fontSize = 96
          let titleWidth = 0
          do {
            // 调整字体大小
            ctx.font = `bold ${fontSize}px Arial`
            titleWidth = ctx.measureText(title).width
            fontSize -= 2 
          } while(titleWidth > (this.card.style.size - 40) )

          ctx.textAlign = 'center'
          ctx.fillStyle = '#000000'
          ctx.fillText(title, offsetx + this.card.style.size / 2, offsety + this.card.style.size / 2  + fontSize / 2)
          }

          // 绘制页脚
          ctx.textAlign = 'left'
          ctx.fillStyle = '#666666'
          ctx.font = `normal 12px Arial`
          ctx.fillText(this.card.form.uid, offsetx + 10, offsety + this.card.style.size - 10)

          // 绘制背面
          offsetx = (this.preview.canvas.width - this.card.style.size) / 2
          offsety = 40 + this.card.style.size

          // 居中显示
          ctx.lineWidth = this.card.style.borderWidth
          ctx.fillStyle = '#ffffff'
          ctx.strokeStyle = this.card.style.borderColor
          ctx.fillRect(offsetx, offsety, this.card.style.size,  this.card.style.size)
          ctx.strokeRect(offsetx, offsety, this.card.style.size,  this.card.style.size)

        // QrCode
        if (this.preview.qrcode.complete) {
          let qrx = offsetx + (this.card.style.size - this.card.style.qrcodeSize) / 2
          let qry = offsety + (this.card.style.size - this.card.style.qrcodeSize) / 2
          ctx.drawImage(this.preview.qrcode, qrx, qry, this.card.style.qrcodeSize, this.card.style.qrcodeSize)

          if (this.preview.logo.complete) {
            let logox = qrx + (this.card.style.qrcodeSize - this.card.style.logoSize) / 2
            let logoy = qry + (this.card.style.qrcodeSize - this.card.style.logoSize) / 2

            this.drawRoundRect(ctx, logox, logoy, this.card.style.logoSize, this.card.style.logoSize, 4)
             // 绘制背景
            ctx.fillStyle = '#ffffff'
            ctx.fill()

            // 绘制logo
            let margin = 2
            ctx.drawImage(this.preview.logo, logox + margin, logoy + margin, this.card.style.logoSize - margin * 2, this.card.style.logoSize - margin * 2)
          }
        }

          // 绘制页脚
          ctx.textAlign = 'left'
          ctx.fillStyle = '#666666'
          ctx.font = `normal 12px Arial`
          ctx.fillText(this.card.form.uid, offsetx + 10, offsety + this.card.style.size - 10)


        }

        
      },
      handleTitleChange(evt) {
        this.previewCard()
      },
      handleCommandChange(evt) {
        this.createQr( this.card.form.command)
      },
      handleStyleChange () {
        this.previewCard()
      },
      renameCategory (form) {
        let value = form.title
        this.$Modal.confirm({
          render: (h) => {
            return h('Input', {
              props: {
                value: form.title,
                autofocus: true,
              },
              on: {
                input: (val) => {
                  value = val
                }
              }
            })
          },
          onOk: () => {
            form.title = value
            form.form.title = value
          }              
        })
      },
      renderContent (h, { root, node, data }) { 
        let buttons = []
        if (data.type === 'root') { // 根对象
          buttons.push(
             h('Button',
              {
                props: Object.assign({}, this.buttonProps, {
                  icon: 'ios-add'
                }),
                style: {
                  marginRight: '8px'
                },
                on: {
                  click: () => { // 添加类目
                    this.addCategory(data)
                  }
                }
              })
          )

          buttons.push(
             h('Button',
              {
                props: Object.assign({}, this.buttonProps, {
                  icon: 'ios-folder-open'
                }),
                style: {
                  marginRight: '8px'
                },
                on: {
                  click: () => { // 从文件加载
                    this.loadFromFile()
                  }
                }
              })
          )

          buttons.push(
             h('Button',
              {
                props: Object.assign({}, this.buttonProps, {
                  icon: 'ios-albums'
                }),
                style: {
                  marginRight: '8px'
                },
                on: {
                  click: () => { // 保存到文件
                    this.saveToFile()
                  }
                }
              })
          )
        } else if (data.type === 'category') { // 类目对象
         buttons.push(
             h('Button',
              {
                props: Object.assign({}, this.buttonProps, {
                  icon: 'ios-add'
                }),
                style: {
                  marginRight: '8px'
                },
                on: {
                  click: () => { // 添加卡片
                    let newCard = this.addCard(data)
                    this.selectCard(newCard)
                  }
                }
              })
          )

           buttons.push(
             h('Button',
              {
                props: Object.assign({}, this.buttonProps, {
                  icon: 'ios-brush'
                }),
                style: {
                  marginRight: '8px'
                },
                on: {
                  click: () => { // rename
                    this.renameCategory(data)
                  }
                }
              })
          )

          buttons.push(
             h('Button',
              {
                props: Object.assign({}, this.buttonProps, {
                  icon: 'ios-remove'
                }),
                style: {
                  marginRight: '8px'
                },
                on: {
                  click: () => { // 删除自己
                    this.removeCategory(data.uid)
                  }
                }
              })
          )

        } else if (data.type === 'card') { // 卡片对象
         buttons.push(
             h('Button',
              {
                props: Object.assign({}, this.buttonProps, {
                  icon: 'ios-remove'
                }),
                style: {
                  marginRight: '8px'
                },
                on: {
                  click: () => { // 删除自己
                    this.removeCard(data.uid)
                  }
                }
              })
          )
        }

        return h('span', 
        {
          style: {
            display: 'inline-block',
            width: '100%'
          }
        }, 
        [
          h('span', {
            style: {
              cursor: 'pointer'
            },
            on: {
              click: () => { // 选中
                this.selectCard(data) 
              }
            }
          },
          [
            h('Icon', {
              props: {
                type: 'ios-paper-outline'
              },
              style: {
                marginRight: '8px'
              }
            }),
            h('span', {
              style: {
                background: data.selected ? '#fff' : 'transparent',
                color: data.selected ? '#000' : '#fff',
              }
            },
            data.title)
          ]),
          h('span', {
            style: {
              display: 'inline-block',
              float: 'right',
              marginRight: '32px'
            }
          }, 
          buttons
          )
        ])
      },
      append (data) {
        const children = data.children || [];
        children.push({
          title: 'appended node',
          expand: true
        });
        this.$set(data, 'children', children);
      },
      remove (root, node, data) {
        const parentKey = root.find(el => el === node).parent;
        const parent = root.find(el => el.nodeKey === parentKey).node;
        const index = parent.children.indexOf(data);
        parent.children.splice(index, 1);
      },
      selectCard(data) {
        if (this.tree.current) {
          this.tree.current.selected = false
        }
        if (data) {
          data.selected = true
          this.tree.current = data 

          if (data.type === 'card') {
            this.showCard(data)
          }
        }
      },
      showCard (data){
        this.card.form.uid = data.uid
        this.card.form.title = data.title
        this.card.form.icon = data.form.icon
        this.card.form.command = data.form.command
        this.createQr(this.card.form.command)
        this.previewCard()
      },
      handleSaveCard() {
        let host = this.tree.nodeIndex[this.card.form.uid]
        if (!host) {
          this.$Message.error('Node can not found!')
          return
        }
        
        host.title = this.card.form.title
        host.form.title = this.card.title
        if (this.card.form.icon !== '/img/default.jpeg') {
          host.form.icon = this.card.form.iconBase64
        } else {
          host.form.icon = this.card.form.icon
        }
        host.form.command = this.card.form.command
      },
      addCategory(parent) {
        let value = ''
        this.$Modal.confirm({
          render: (h) => {
            return h('Input', {
              props: {
                value: value,
                autofocus: true,
                placeholder: 'Please enter category...'
              },
              on: {
                input: (val) => {
                  value = val
                }
              }
            })
          },
          onOk: () => {
            if ( value === '') {
              return
            }
            let node = {
              uid: Utils.common.uniqueId(),
              title: value,
              type: 'category',
              expand: true,
              selected: false,
              children: []
            }
            this.tree.nodeIndex[node.uid] = node
            parent.children.push(node)
          }              
        })
      },
      removeCategory(uid) {
        let node = this.tree.nodeIndex[uid]
        if (!node) {
          return
        }

         if (node.type !== 'category') {
          this.$Message.error('Node must be category!')
          return
        }

        if (node.children.length > 0) {
          this.$Message.error('Category must be empty!')
          return
        }

        let index = this.tree.data.children.findIndex((value, index, arr) => {
          return value.uid === uid
        })
        delete this.tree.nodeIndex[uid]
        this.tree.data.children.splice(index,1)
      },
      addCard(parent) {
        let node = {
             uid: Utils.common.uniqueId(),
              title: 'New Card',
              type: 'card',
              selected: false,
              pid: parent.uid,
              form: {
                title: '',
                icon: '/img/default.jpeg',
                command: ''
              }
            }
        this.tree.nodeIndex[node.uid] = node
        parent.children.push(node)
        return node
      },
      removeCard(uid) {
        let node = this.tree.nodeIndex[uid]
        if (!node) {
          return
        }

        if (node.type !== 'card') {
          this.$Message.error('Node must be card!')
          return
        }

        let parent = this.tree.nodeIndex[node.pid]
        if (!parent) {
          this.$Message.error('Parent Node is null!')
          return
        }

        let index = parent.children.findIndex((value, index, arr) => {
          return value.uid === uid
        })
        delete this.tree.nodeIndex[uid]
        parent.children.splice(index,1)
      },
      loadLocalFile() {
        let selectedFile = this.$el.querySelector('#trionesfile').files[0]
        let name = selectedFile.name
        let size = selectedFile.size //读取选中文件的大小
        if (size === 0){
            this.$Message.error({
              content: `File <${name}> is empty`,
              duration: 2
            })
           return
        }
        let reader = new FileReader()   
        reader.onload = (evt) => {
          // 读取js文件
          let json = JSON.parse(evt.target.result)
          this.$store.commit('updateInternalCache', Utils.common.clone(json))

          this.tree.nodeIndex = {}
          // 遍历树结构
          const walk = (node) => {
            if (Utils.common.isArray(node)) {
              for(let n of node) {
                walk(n)
              }
            } else if (Utils.common.isObject(node)){
              node.selected = false
              node.expand = true
              if (node.type === 'category') {
                if (!node.children) {
                  node.children = []
                }
              }
              this.tree.nodeIndex[node.uid] = node
            }
          }
          walk(json)
          this.tree.data[0].children = json
        }
        reader.readAsText(selectedFile)
      },
      loadFromFile() {
        this.$el.querySelector('#trionesfile').click()
      },
      loadFromCache() {
        if (!this.$store.getters.internalCache) {
          return
        }
          // 读取js文件
          let json = Utils.common.clone(this.$store.getters.internalCache)
          this.tree.nodeIndex = {}
          // 遍历树结构
          const walk = (node) => {
            if (Utils.common.isArray(node)) {
              for(let n of node) {
                walk(n)
              }
            } else if (Utils.common.isObject(node)){
              node.selected = false
              node.expand = true
              if (node.type === 'category') {
                if (!node.children) {
                  node.children = []
                }
              }
              this.tree.nodeIndex[node.uid] = node
            }
          }
          walk(json)
          this.tree.data[0].children = json
      },
      saveToFile() {
          let json = []
          // 遍历树结构
          const walk = (node, parent) => {
            if (Utils.common.isArray(node)) {
              for(let n of node) {
                walk(n, parent)
              }
            } else if (Utils.common.isObject(node)){
              let child = {
                uid: node.uid,
                title: node.title,
                type: node.type,
              }
              if (node.type === 'category') {
                child.children = []
                walk(node.children, child.children)
              } else if (node.type === 'card') {
                child.form = Utils.common.clone(node.form)
              }
              parent.push(child)
            }
          }
          walk(this.tree.data[0].children, json)

          // 缓存
          this.$store.commit('updateInternalCache', json)

          let blob = new Blob([JSON.stringify(json)], {type: "text/plain;charset=utf-8"})
          FileSaver.saveAs(blob, 'Triones-' + Utils.common.currentDateString(true) + ".json")
      }
    },
    mounted: function () {
      // 随窗口动态改变大小
      this.size.width = this.$el.clientWidth
      this.size.height = this.$el.clientHeight

      this.$el.querySelector('.card-tree').style.height = this.size.height + 'px'

      this.preview.canvas = this.$el.querySelector('.card-preview')
      let row = this.$el.querySelector('#row')
      this.preview.canvas.width = (this.size.width - 300 ) / 2
      this.preview.canvas.height = this.size.height

      this.preview.qrcode = new Image()
      this.preview.qrcode.addEventListener('load', () => {
        this.previewCard()
      })

      this.preview.icon = new Image()
      this.preview.icon.addEventListener('load', () => {
        this.card.form.iconBase64 = this.imageTobase64(this.preview.icon)
        this.previewCard()
      })

      this.preview.logo = new Image()
      this.preview.logo.src = this.card.logo
      this.previewCard()

      this.loadFromCache()
    }
  }
</script>
