var commons = {
  getFileData(file) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = function() {
        let result = this.result
        resolve(result)
      }
      reader.onerror = function() {
        let result = this.result
        reject(result)
      }
    })
  },
  async creatImg(file) {
    const img = document.createElement('img')
    img.src = await this.getFileData(file)
    return img
  }
}