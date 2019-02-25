# UploadFile
纯JavaScript选择图片并上传的方法

## 实现逻辑
  1. 创建input``` type='file' ```
  2. 选择图片 ``` input.click() ```
  3. 超过大小的图片进行压缩<br>
    - 利用FileReader对象提供的api获取图片url ```new FileReader().readAsDataURL(file) ```<br>
    - 创建canvas节点，并在其上绘制图像 ``` canvas.drawImage(that, 0, 0, w, h) ```<br>
    - 压缩图片 ``` canvas.toDataURL('image/jpeg', quality) ```<br>
  4. 合并参数（请求参数/压缩/未压缩的图片，并把压缩的图片转成Blob对象）
  5. 发起请求

## 例子
<img  width="375" height="670" src="https://raw.githubusercontent.com/VYuLinLin/UploadFile/master/example.png">
