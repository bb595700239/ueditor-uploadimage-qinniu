const OSS = require('ali-oss');
let files = [];
let client = '', fileName = '';
let isNotNeedRequest = false;
let notNeedClientRequest = '';
window.Promise = Promise;

//获取OSS上传必须的秘钥及其他设置信息 （注意：如果拥有上传必备的秘钥以及其他配置信息，可以跳过本操作）
function multipartUploadWithSts(storeAs, file, uploadConfig) {//参数说明：文件名；文件；配置对象
  let action = uploadConfig.action;//请求地址
  if (uploadConfig.isNotNeedRequest && uploadConfig.clientRequest) {
    try {
      client = new OSS(uploadConfig.clientRequest);//初始化OSS对象
      multitest(client, storeAs, file, uploadConfig);//使用OSS上传文件
    } catch (e) {
      uploadConfig.reject({ err: e, storeAs: storeAs });
    }
    return
  } else if (!action) {
    uploadConfig.reject({
      uploadCode: 0,
      message: `如果要请求获取配置接口，请给定接口地址！`,
      storeAs: storeAs
    });
  }
  OSS.urllib.request(action, {
    method: 'GET',
  }, (err, response) => {
    let result, errmsg;
    if (err) {
      uploadConfig.reject({ err: err, storeAs: storeAs });
      return console.error(err);
    }
    try {
      result = JSON.parse(response);
    } catch (e) {
      errmsg = 'parse sts response info error: ' + e.message;
      uploadConfig.reject({ err: e, storeAs: storeAs });
      return console.error(errmsg);
    }
    let clientRequest = {
      accessKeyId: result.AccessKeyId,//通过阿里云控制台创建的access key
      accessKeySecret: result.AccessKeySecret,//通过阿里云控制台创建的access secret。
      stsToken: result.SecurityToken,//使用临时授权方式。
      bucket: 'park-static',// 通过控制台创建的bucket。
      endpoint: 'oss.zhihuipk.com',//OSS域名。
      cname: true,
      region: 'oss-cn-hangzhou',
    };
    //上传前的准备
    try {
      client = new OSS(clientRequest);//初始化OSS对象
      multitest(client, storeAs, file, uploadConfig);//使用OSS上传文件
    } catch (e) {
      uploadConfig.reject({ err: e, storeAs: storeAs });
    }
  });
}

function uploadBase64(storeAs, base64url,config){
  function dataURLtoBlob(dataurl) {
    var arr = dataurl.split(',');
    //注意base64的最后面中括号和引号是不转译的   
    var _arr = arr[1].substring(0, arr[1].length - 2);
    var mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(_arr),
      n = bstr.length,
      u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {
      type: mime
    });
  }
  let file = dataURLtoBlob(base64url)
  files = config.fileList ? config.fileList : [];//当前文件列表
  let fileNumber = config.fileNumber,//文件限制数量
    action = config.action,//请求地址
    template = config.template,//文件添加时的其他默认值
    cb = config.cb;//文件上传时的回调函数
  isNotNeedRequest = !!config.isNotNeedRequest;//默认为false，即需要请求接口获取配置信息，不需要时，请设置为true。
  let fileTemplate = (template && template.constructor === Object) ? template : {},
    progressCb = (cb && cb.constructor === Function) ? cb : '';
  return new Promise((resolve, reject) => {
    //上传配置项
    const uploadConfig = {
      action: action,//请求地址
      resolve: resolve,//Promise(成功的返回)
      reject: reject,// Promise(失败的返回)
      progressCb: progressCb,//上传进度回调函数
    };
    Object.assign(uploadConfig, config)
    try {
      client = new OSS(uploadConfig.clientRequest);//初始化OSS对象
      multitest(client, storeAs, file, uploadConfig);//使用OSS上传文件
    } catch (e) {
      uploadConfig.reject({ err: e, storeAs: storeAs });
    }
  })
}

//使用OSS上传文件
function multitest(ossClient, storeAs, file, multitestConfig) {//参数说明：oss对象；文件名；文件；配置对象
  let checkpoint_temp,//当前节点（重新上传时需要）
    cpt = multitestConfig.cpt,//上一个节点（重新上传时需要）
    progressCb = multitestConfig.progressCb;//上传进度回调函数
  if (cpt) {
    //如果有断点则继续上一个节点上传该文件
    console.log("multitest with cpt", cpt);
    ossClient.multipartUpload(storeAs, file, {
      parallel: 2,
      checkpoint: cpt,
      //进度回调函数
      progress: async function (percent, storeAs, cpt) {//参数说明：当前上传进度的；当前上传的文件名；当前上传节点（进行重新上传时使用）
        progressCb && progressCb(percent, storeAs, cpt);
        checkpoint_temp = cpt;
      }
    }).then((result) => {//成功的返回
      multitestConfig.resolve({
        data: result,
        fileList: files,
      });
    }).catch((err) => {//失败的返回
      let errObj = { err: err, storeAs: storeAs };
      (checkpoint_temp !== undefined && checkpoint_temp !== null) && (errObj.cpt = checkpoint_temp);
      multitestConfig.reject(errObj);//将当前节点返回，使其可以重新从该节点继续上传文件
    });
  } else {
    console.log("multitest without cpt");
    ossClient.multipartUpload(storeAs, file instanceof Blob?file:new Blob([file]), {
      parallel: 2,
      //进度回调函数
      progress: async function (percent, cpt) {//参数说明：当前上传进度的；当前上传的文件名；当前上传节点（进行重新上传时使用）
        progressCb && progressCb(percent, storeAs, cpt);
        checkpoint_temp = cpt;
      }
    }).then((result) => {//成功的返回
      multitestConfig.resolve({
        data: result,
        fileList: files,
      });
    }).catch((err) => {//失败的返回
      let errObj = { err: err, storeAs: storeAs };
      (checkpoint_temp !== undefined && checkpoint_temp !== null) && (errObj.cpt = checkpoint_temp);
      multitestConfig.reject(errObj);//将当前节点返回，使其可以重新从该节点继续上传文件
    });

    
  }
}

//获取选中的文件
function upload(e, config, type) {
  // type === 1 代表传进来的 是e.target.files[0]
  files = config.fileList ? config.fileList : [];//当前文件列表
  let fileNumber = config.fileNumber,//文件限制数量
    action = config.action,//请求地址
    template = config.template,//文件添加时的其他默认值
    cb = config.cb;//文件上传时的回调函数
  isNotNeedRequest = !!config.isNotNeedRequest;//默认为false，即需要请求接口获取配置信息，不需要时，请设置为true。
  let fileTemplate = (template && template.constructor === Object) ? template : {},
    progressCb = (cb && cb.constructor === Function) ? cb : '';
  return new Promise((resolve, reject) => {

    let file, target
    if (type) {
      file = e
    } else {
      target = e.target.files || e.dataTransfer.files;
      file = target[0];//文件
    }


    let storeAs = file.name;//文件名 new Date().getTime() +
    fileName = storeAs;//文件名
    let fileType = ['image/png', 'image/jpeg ', 'image/jpg', 'image/gif'].indexOf(file.type) > -1;//获取文件类型
    let hasFile = files.filter((item) => {
      return item.name === storeAs
    });//查找该文件
    if (isNotNeedRequest) {
      notNeedClientRequest = config.clientRequest;//获取OSS上传配置项
      if (!notNeedClientRequest) {
        reject({
          uploadCode: 0,
          message: `如果不需要请求获取配置接口，请给定规范的配置对象！详情请查看OSS文档`,
        });
        return
      }
    }
    if (fileNumber && fileNumber <= files.length) {//文件限制数量
      reject({
        uploadCode: 0,
        message: `最大上传${fileNumber}个文件！`,
      });
      return
    }
    if (hasFile.length) {//如果本次已经上传了该文件则提示
      reject({
        uploadCode: 0,
        message: '该文件已经上传过了',
      });
      console.warning('该文件已经上传过了');
    } else {
      //上传配置项
      const uploadConfig = {
        action: action,//请求地址
        resolve: resolve,//Promise(成功的返回)
        reject: reject,// Promise(失败的返回)
        progressCb: progressCb,//上传进度回调函数
      };
      if (fileType) {//如果该文件是图片格式，则使先转换成base64
        /*target*/
        getImgUrl(file).then(res => {
          if (fileNumber === 1) {
            config.fileList ? config.fileList = [] : files = [];
          }
          files.push(Object.assign(fileTemplate, {

            // target: target[0],//文件
            target: file, //文件

            name: storeAs,//文件名
            type: 1,//文件格式为图片
            fileUrl: res,//该文件的图片base64
            address: '',//该文件的OSS地址
          }));
          //是否请求接口获取配置信息
          if (isNotNeedRequest) {
            try {
              client = new OSS(notNeedClientRequest);//初始化OSS对象
              multitest(client, storeAs, file, uploadConfig);//使用OSS上传文件
            } catch (e) {
              uploadConfig.reject({ err: e, storeAs: storeAs });
            }
          } else {
            multipartUploadWithSts(storeAs, file, uploadConfig);//获取OSS上传必须的秘钥及其他设置信息
          }
        });
      } else {
        if (fileNumber === 1) {
          config.fileList ? config.fileList = [] : files = [];
        }
        files.push(Object.assign(fileTemplate, {

          // target: target[0],//文件
          target: file, //文件

          name: storeAs,//文件名
          type: 0,//文件格式为其他类型的文件
          address: '',//该文件的OSS地址
        }));
        //是否请求接口获取配置信息
        if (isNotNeedRequest) {
          try {
            client = new OSS(notNeedClientRequest);//初始化OSS对象
            multitest(client, storeAs, file, uploadConfig);//使用OSS上传文件
          } catch (e) {
            uploadConfig.reject({ err: e, storeAs: storeAs });
          }
        } else {
          multipartUploadWithSts(storeAs, file, uploadConfig);//获取OSS上传必须的秘钥及其他设置信息
        }
      }
    }
  });
}

//获取图片base64
function getImgUrl(files) {
  return new Promise((res, err) => {
    /*const len = files.length;
    for (let i = 0; i < len; i++) {
      let reader = new FileReader();
      reader.readAsDataURL(files[i]);
      reader.onload = function (e) {
        let image = new Image();
        image.src = this.result;
        res(this.result);
      };
    }*/
    let reader = new FileReader();
    reader.readAsDataURL(files);
    reader.onload = function (e) {
      let image = new Image();
      image.src = this.result;
      res(this.result);
    };

  })
}

/**获取图片外网访问地址
 * 如果图片的读写权限为私有
 * client.signatureUrl("你的图片地址/名字")
 例如我的图片(名字为testImg)在根目录
 client.signatureUrl("testImg");//返回的就是带加密签名的图片路径，复制这个路径到浏览器上，便可以在浏览器上访问

 * 如果图片的读写权限为公共
 client.getObjectUrl("你的图片名字");//返回的就是不带签名的图片路径，复制路径也可以在浏览器上访问.
 */
function getExtranetUrl(name, type) {
  if (client) {
    return type === 1 ? client.signatureUrl(name) : client.getObjectUrl(name);//1 为私有
  }
}

//删除OSS服务器上的文件
function deleteFile(name, index) {
  return new Promise((resolve, reject) => {
    (client && client.delete) ? client.delete(name).then((res) => {
      resolve(res)
    }).catch((err) => {
      reject(err);
    }) : (reject({ errCode: 999, errContent: 'client is null , Please upload the file before deleting it !' }));
  })
}

export {
  upload, getExtranetUrl, multipartUploadWithSts, multitest, deleteFile, uploadBase64
}
