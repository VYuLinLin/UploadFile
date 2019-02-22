/*
 * 
 * pluginUploadFile
 * 
 * Version: 1.0.0 
 * Date (d/m/y): 21/02/19
 * Update (d/m/y): 21/02/19
 * Original author: VYuLinLin 
 */
;(function(win, doc) {
  // 全局配置
  var configs = {
    isMultiple: false, // 是否多选
    filesMaxNo: 1, // 单次上传的最大张数
    compressLimitSize: 1024, // 压缩触发界限
    compressMaxSize: 500, // 图片最大压缩值
    errTip: {
      0: '节点插入错误',
      1: '取消选择',
      2: '单次最多上传$1张图片，您已选择$2张图片',
    }
  }
  var uploadFileApi = {
    /**
     * 初始化配置 (例如是否支持多选，图片大于多少才压缩等)
     * @param {Object} newConfig 配置参数
     * @param {Boolean} isCover 是否覆盖全局配置
    */
    init(newConfig = {}, isCover = false) {
      if (!newConfig) return
      configs = isCover ? newConfig : Object.assign(configs, newConfig)
    },
    /**
     * 压缩图片实现类
     * @param path
     * @param obj
     * @param callback
     * @param maxSize
     */
    canvasDataURL(path, obj = {}, callback, maxSize) {
      return new Promise((resolve, reject) => {
        let img = new Image()
        img.onabort = () => {
          reject(new Error('加载图片终止'))
        }
        img.onerror = () => {
          reject(new Error('加载图片错误'))
        }
        img.onload = function() {
          let that = this
          // 默认按比例压缩
          let w = that.width
          let h = that.height
          let scale = w / h
          w = obj.width || w
          h = obj.height || (w / scale)
          let quality = 0.7 // 默认图片质量为0.7
          // 生成canvas
          let canvas = document.createElement('canvas')
          let ctx = canvas.getContext('2d')
          // 创建属性节点
          let anw = document.createAttribute('width')
          anw.nodeValue = w
          let anh = document.createAttribute('height')
          anh.nodeValue = h
          canvas.setAttributeNode(anw)
          canvas.setAttributeNode(anh)
          ctx.drawImage(that, 0, 0, w, h)
          // 图像质量
          if (obj.quality && obj.quality <= 1 && obj.quality > 0) {
            quality = obj.quality
          }
          // quality值越小，所绘制出的图像越模糊
          let base64 = canvas.toDataURL('image/jpeg', quality)
          // 回调函数返回base64的值
          // ************************* 做一个控制，直到图片压缩成需要的大小
          for (let i = 0; i < 10; i++) {
            let size = base64.length / 1024
            if (size <= maxSize) {
              break
            }
            quality = (quality - 0.1)
            base64 = canvas.toDataURL('image/jpeg', quality)
          }
          callback && callback(base64)
          resolve(base64)
        }
        img.src = path
      })
    },
    /**
     * 文件照片压缩
     * @param file
     * @param w
     * @param objDiv
     * @param maxSize
     */
    photoCompress(file, w, objDiv, maxSize) {
      return new Promise((resolve, reject) => {
        let ready = new FileReader()
        /* 开始读取指定的Blob对象或File对象中的内容. 当读取操作完成时,
          readyState属性的值会成为DONE,如果设置了onloadend事件处理程序,
          则调用之.同时,result属性中将包含一个data: URL格式的字符串以表示所读取文件的内容. */
        ready.readAsDataURL(file)
        let self = this
        ready.onload = function() {
          let re = this.result
          self.canvasDataURL(re, w, objDiv, maxSize).then(base64Codes => {
            resolve(base64Codes)
          }).catch(err => {
            reject(err)
          })
        }
      })
    },
    /**
     * 将以base64的图片url数据转换为Blob
     * @param urlData
     * @returns {*}
     */
    convertBase64UrlToBlob(urlData) {
      let arr = urlData.split(',')
      let mime = arr[0].match(/:(.*?);/)[1]
      let bstr = atob(arr[1])
      let n = bstr.length
      let u8arr = new Uint8Array(n)
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }
      return new Blob([u8arr], {type: mime})
    },
    // 发起请求
    httpPost({url, form, load, error} = {}) {
      const xhr = new XMLHttpRequest()
      xhr.open('post', url, true) // post方式，url为服务器请求地址，true 该参数规定请求是否异步处理。
      xhr.onload = load
      xhr.onerror = error
      xhr.send(form)
    },
    /**
     * 选择图片
     * 支持自定义配置，单选或多选
     * @param id
     */
    selectFiles(params = {}) {
      const {isMultiple, filesMaxNo, errTip} = Object.assign(configs, params)
      return new Promise((resolve, reject) => {
        const input = doc.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.style.display = 'none'
        ;(isMultiple || filesMaxNo > 1) && (input.multiple = 'multiple')
        input.addEventListener('change', e => {
          if (!e || !e.target || !e.target.files) return reject({
            code: 0,
            message: errTip[0]
          })
          const files = e.target.files
          if (!files.length) return reject({
            code: 1,
            message: errTip[1]
          })
          if (files.length > filesMaxNo) {
            reject({
              code: 2,
              message: errTip[2] && errTip[2].replace(/\$1/g, filesMaxNo).replace(/\$2/g, files.length)
            })
            return
          }
          resolve(files)
          doc.body.removeChild(input)
        })
        input.click() // click方法必须在插入节点之前
        doc.body.appendChild(input)
      })
    },
    /**
     * 上传图片
     * @param {string} url 请求的地址
     * @param {Object} params 接口的入参
     * @param {Object} config 局部配置，不传默认使用全局配置
     * @return {Promise}
     */
    uploadFile(url = '', params = {}, config = {}) {
      if (!url) return
      return new Promise((resolve, reject) => {
        this.selectFiles(config).then(fileList => {
          // 大于指定大小的文件进行压缩
          const [compress, noCompress] = [[], []]
          for (let i = 0, l = fileList.length; i < l; i++) {
            const file = fileList[i]
            file.size / 1024 > limitSize
              ? compress.push(this.photoCompress(file, {}, null, maxSize))
              : noCompress.push(file)
          }
          const form = new FormData() // FormData 对象
          // 接口参数
          for (const key in params) {
            if (params.hasOwnProperty(key)) {
              form.append(key, params[key])
            }
          }
          // 未压缩文件
          noCompress.map(file => {
            form.append('file', file)
          })
          // 压缩文件
          Promise.all(compress).then(files => {
            files.map(base64Codes => {
              form.append('file', this.convertBase64UrlToBlob(base64Codes), 'file_' + Date.parse(new Date()) + '.jpg')
            })
            store.commit('SHOW_LOADING', '2')
            this.httpPost({
              url,
              form,
              load(evt) {
                store.commit('HIDE_LOADING')
                const data = evt.target.responseText ? JSON.parse(evt.target.responseText) : {}
                resolve(data)
              },
              error(evt) {
                store.commit('HIDE_LOADING')
                const data = evt.target.responseText ? JSON.parse(evt.target.responseText) : {}
                reject(data)
              }
            })
          }).catch(() => {
            this.httpPost({
              url,
              form,
              load(evt) {
                const data = evt.target.responseText ? JSON.parse(evt.target.responseText) : {}
                resolve(data)
              },
              error(evt) {
                const data = evt.target.responseText ? JSON.parse(evt.target.responseText) : {}
                reject(data)
              }
            })
          })
        }).catch(err => {
          alert(err)
        })
      })
    }
  }
  /** 导出 */
  if (typeof module !== "undefined" && module.exports) {
    module.exports = uploadFileApi;
  } else if (typeof define === "function" && define.amd) {
    define(function(){return uploadFileApi;});
  } else {
    !('pluginUploadFile' in win) && (win.pluginUploadFile = uploadFileApi);
  }
})(window, document)
