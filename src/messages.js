
const _messages = {
  common: {
    appTitle: { zh: '编程卡片制作', en: 'Triones' },
    copyright: { zh: '©2019 Unqiue 版权所有', en: '©️2019 Unique All rights reserved.' }
  },
  nav: {
    editor: { zh: '编辑器', en: 'Editor' },
    print: { zh: '打印', en: 'Print' }
  }
}

const messages = {
  zh: {},
  en: {}
}
for (let [key, value] of Object.entries(_messages)) {
  for (let [name, defs] of Object.entries(value)) {
    for (let [lang, text] of Object.entries(defs)) {
      let obj = messages[lang]
      if (!obj) {
        obj = {}
        messages[lang] = obj
      }
      let prop = obj[key]
      if (!prop) {
        prop = {}
        obj[key] = prop
      }
      prop[name] = text
    }
  }
}

export default  messages