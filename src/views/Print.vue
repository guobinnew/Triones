<template>
   <div class="container" v-resize="onContainerResize">
      <Layout :style="{height: '100%',color:'#fff', textAlign:'left'}">
            <Sider hide-trigger width="300">
              <Tree ref="tree" :data="tree.data" class="card-tree" show-checkbox @on-check-change="handleCheckCard"></Tree>
            </Sider>
            <Content :style="{position: 'relative', overflow:'hidden', minWidth:'640px', minHeight: '480px'}">
              <div id="scene" class="card-preview"></div>
              <Row class="menu">
                  <ButtonGroup>
                    <Button type="primary" icon="md-add-circle" @click="zoomIn"></Button>
                    <Button type="primary" icon="md-remove-circle" @click="zoomOut"></Button>
                    <Button type="primary" icon="md-refresh-circle" @click="reset"></Button>
                    <Button type="primary" icon="md-image" @click="print"></Button>
                    <Dropdown @on-click="handleStyleCommand">
                      <Button type="error" icon="ios-cube">
                        <Icon type="ios-arrow-down"></Icon>
                      </Button>
                      <DropdownMenu slot="list">
                        <DropdownItem name="single">Single Side</DropdownItem>
                        <DropdownItem name="double">Double Sides</DropdownItem>
                      </DropdownMenu>
                    </Dropdown>>
                     <Select v-model="card.times" style="width:80px" @on-change="handleTimesChange">
                       <Option v-for="item in card.validTimes" :value="item" :key="item.value">{{ item + '个' }}</Option>
                     </Select>
                  </ButtonGroup>
              </Row>
              <Row class="pager">                 
                <Page :current="currentPage" :total="selectedTotal" show-total :page-size="pageSize" @on-change="handleChangePage"/>
              </Row>
            </Content>
      </Layout>
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
  top: 10px;
  left: 20px;
  overflow: visible;
  text-align: left;
}

.pager {
  position: absolute;
  bottom: 10px;
  right: 20px;
  overflow: visible;
  color: '#000';
}

.card-tree {
  overflow-x: hidden;
  background: #f5f7f9;
}

.ivu-dropdown {
  margin-left: 10px;
  margin-right: 10px;
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

.card-preview {
  height: 100%;
  width: 100%;
  background-color: #fff;
}

</style>

<script>
  import resize from 'vue-resize-directive'
  import FileSaver from 'file-saver'
  import LocalForage from 'localforage'
  import Utils from '../utils'
  import Page from '../components/page/index'

  export default {
    components: {},
    data: function () {
      return {
        size: {
          width: 0,
          height: 0
        },
        card: {
          logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAEeElEQVR4Xu1bgXHUMBBcVQCpAFIBoQKSCoAKgAqACiAVkFQAqSBJBZAKIBWQVEBSgZjVyx+98dt7suQ3868ZZpiJX75b3e3tnf4dtny5LfcfOwB2EbDlCOxSYMsDYEeCuxSYTwr4xwCePdjjrqawbYMR4J8CeAngMP4jAO11A+AXgB8AzgB3VxqUDQAQHP8C4FWGM98AnAKOoBRZEwPgPwH4XMDyEwDHJSJiQgD8VwBvCzjfbMH0eD02GiYCwH+PeV7Q/7AVOeFoDAgTAOAZ8gz9Wosg7OemQ2UA/AGAn7U8T/YlMX7IeU9tAGqFfpevTAWWS9OqCEAod79N1ox7+BJw5tJaEwBr7t9GwUN2pyiiM0+MmOxZuaAmAMx9coCyWNM79IEnCBQ/j5RNALwDHJ+XV00AvGjFAIEFImVuKyCYybASAKGx+SMCIIStp4CikBpaV4BjbyGvWgDQCFaAoSUaLAMq7vdg1qYBMISsV1LqvwNgDfm1A0cWVGyZTf3GpiNArN2ynBYBrZICIU854KAA4v8VaSqGrFdLqlkNFogAT8Jjs2Ni33gGd4Db62dKk6IUKsrq20YAEPKSk50cx1Mr2NNfrAfBM5L4nqElRlMRAILzLHNdc7whQ9t/HyAuOfw/Ao6TItPKiACZkVVDetLAFP7PcwYjRgCCQSSkEicvpIHM/reAo23mZQWgVn+/Jg0822nFMXP9b5AyABDYXpG35lMAcAO4/dUPmlLNXP5yACBTs87XWpzrcRYQl2db+0Z4WXb4c28xAuRmRLB37SNJOQzvY/grXGNWf6kFKgCW8Odkh+WI01rq8hciKokjcvvLrVuRI74tPqYCoI637hekld7heQ4zFBBSAFTpew04derUiUxpADraW/k0IwAm8jOPwNoozBEAlfzuAadwRG9OqACoepx5T0UW2TyQGUunEqbHkTvUUZphmLIeAxUACwkShEaTc6qrOE8Lj2JjpV6jjSK/HB2gjKRsFLzytHOA5+krYS0OUobNESOAG/maQugSAPdXJr8xWuzXYF1wWACwpMEw9KtPMPzpvKL7Rym/zCpglqcWAHj61BnqLfLo0pehBJcAMD/J8MotjQJCFE4BgPfCB4qUvhEABC6wXFX1+UTnDxdDDJn8Run+kRyQfnw0CKnzFm4xDz2HospAgu2tgshhvVda1vTDZ4uRedMvyFOf7KFHHwgjAFjyAk+QXR9Fzzpu4ImzKTr591scniAq+T8wPR466+6/FwBgJTUIBktZU85ImJz29Hx1Re0WKZTKryqb2sy0AhBSjxFDyd33jVHqhWTCNEkE2FxfPK0CEErlabwkUS5ApYoxhwhQhy1WdCXBNAcASJ7nVu+E56WLkhkAENKA+VxKXXJDuV+YCwCl00C+J5wLAGR2Mrr1e4FdmWAalM4EgGI9BgXXgVL+GuRmBEAAgQKKg5Hkt0MC3S0euV6o0eHan+44MwCW8ppDWPKCQow8dcppymzzb4pmCsASCJbIZrCaRgVPu/kx1UWO480b/gILMS5Qwwr0BAAAAABJRU5ErkJggg==',
          shape: 1,
          times: 1,
          validTimes: [1,2,3,6,9,18],
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
        currentPage: 1,
        pageSize: 18,
        tree: {
          current: null,
          nodeIndex: {},
          nodeSelected: [],
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
        scene: {
          stage: null,
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
      selectedTotal: function() {
        return this.tree.nodeSelected.length * this.card.times * this.card.shape 
      }
    },
    methods: {
      onContainerResize() {
        this.size.width = this.$el.clientWidth
        this.size.height = this.$el.clientHeight
        this.$el.querySelector('.card-tree').style.height = this.size.height + 'px'
        this.scene.stage.resize(this.size.width - 300, this.size.height)
      },
      handleStyleCommand(command) {
        let oldShape =  this.card.shape
        this.card.shape = (command === 'single' ? 1 : 2)
        if (oldShape > this.card.shape) {
          this.currentPage = Math.floor(total / 2) + 1
        }
        // 刷新显示
        this.showPage(this.currentPage)
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
      zoomIn() {
        this.scene.stage.zoomIn()
      },
      zoomOut() {
        this.scene.stage.zoomOut()
      },
      reset() {
        this.scene.stage.reset()
      },
      downloadURI(uri, name) {
        let link = document.createElement('a')
        link.download = name
        link.href = uri
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      },
      print() {
        // 将当前页保存为图片
        let uri = this.scene.stage.toDataURL()
        this.downloadURI(uri, 'Triones-' + Utils.common.currentDateString(true) + '.png')
      },
      handleCheckCard(checked, current) {
        let arr = []
        for (let n of checked) {
          if (n.type === 'card') {
            arr.push(n)
          }
        }
        this.tree.nodeSelected = arr

        // 调整当前页码
        while (this.currentPage * this.pageSize > arr.length) {
          this.currentPage--
        }

        if (this.currentPage === 0) {
          this.currentPage = 1
        }

        // 刷新显示
        this.showPage(this.currentPage)
      },
      showPage(pid) {
        // 根据页码提取Card
        let nodes = []
        let mpage = this.pageSize / (this.card.shape * this.card.times)
        let start = Math.floor((pid - 1) * mpage)
        let end = Math.floor(pid * mpage)
        for (let i = start; i < end; i++) {
          if (i >= this.tree.nodeSelected.length) {
            break;
          }
          nodes.push(this.tree.nodeSelected[i])
        }

        // 绘制页面
        this.scene.stage.clear()
        for (let n of nodes) {
          this.scene.stage.addModel({...n, 
          times: this.card.times,
          shape: this.card.shape})
        }
        this.scene.stage.adjust()
      },
      handleChangePage(page) {
        this.currentPage = page
        this.showPage(this.currentPage)
      },
      handleTimesChange(value) {
        console.log('aaa', this.card.times, value)
        this.currentPage = 1
        this.handleChangePage(this.currentPage)
      }
    },
    mounted: function () {
      // 随窗口动态改变大小
      this.size.width = this.$el.clientWidth
      this.size.height = this.$el.clientHeight

      this.$el.querySelector('.card-tree').style.height = this.size.height + 'px'
      this.loadFromCache()

      this.scene.stage = Page.init({
        container: 'scene',    //container 用来容纳舞台的容器
        width: this.size.width - 300,
        height: this.size.height
      })

      this.preview.logo = new Image()
      this.preview.logo.addEventListener('load', () => {
        this.scene.stage.setLogo(this.preview.logo)
      })
      this.preview.logo.src = this.card.logo

    }
  }
</script>
