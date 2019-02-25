import Vue from 'vue'
import Router from 'vue-router'
import Editor from './views/Editor.vue'
import Print from './views/Print.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'editor',
      component: Editor
    },
    {
      path: '/print',
      name: 'print',
      component: Print
    }
  ]
})
