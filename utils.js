var commons = {
  getFileDataToBase64(file) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = function() {
        resolve(this.result)
      }
      reader.onerror = function() {
        reject(this.result)
      }
    })
  },
  async creatImg(file) {
    const img = document.createElement('img')
    img.src = await this.getFileDataToBase64(file)
    return img
  }
}