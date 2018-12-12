# 介绍

利用百度的`ueditor`改造成可直接上传图片到七牛云的组件，省去每次后端人员配置的烦恼（经常配错，无法上传图片的情况）。这里除了图片在线管理及附件在线管理用到了自己写的node服务（主要解决原七牛rsf.qbox.me无法跨域问题，利用自己写的服务请求七牛的接口做转发）其它都是纯前端。


# 使用

``` bash
# install dependencies
npm install 

# serve with hot reload at localhost:8185
npm run dev

# build for production with minification
npm run build

```

放到自己的项目前 先修改src=>config=>qiniuToken.js
- `action`   // 提交地址
- `bucketName`   //空间名
- `AK`   //AccessKey
- `SK`   //SecretKey
- `domain`   //空间绑定的域名

这样图片就会上传到自己的七牛上去了
