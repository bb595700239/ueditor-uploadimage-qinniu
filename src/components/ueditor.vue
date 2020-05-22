<template>
    <script :id=id type="text/plain"></script>
</template>
<script>
  import './../../static/ueditor/ueditor.config.js'
  import './../../static/ueditor/ueditor.all.js'
  import './../../static/ueditor/lang/zh-cn/zh-cn.js'
  import './../../static/ueditor/xiumi-ue-dialog-v5.js'
  import './../../static/ueditor/template/template.js'
  import { upload, getExtranetUrl,uploadBase64 } from '../config/oss-sdk'
  import axios from 'axios'
  export default {
    name: 'UE',
    data () {
      return {
        editor: null
      }
    },
    props: {
      config: {
        type: Object
      },
      id: {
        type: String
      },
    },
    mounted() {
      

    },
    methods:{
      init(){
       let config = () => axios.get('/back/systemOss/systemOssByUrl?url=http://test-media-back.test176.cn');
        config().then(res=>{
          let clientConfig = {
            accessKeyId: res.data.data.AccessKeyId,// 通过阿里云控制台创建的access key
            accessKeySecret: res.data.data.AccessKeySecret,// 通过阿里云控制台创建的access secret。
            stsToken: res.data.data.SecurityToken,// 使用临时授权方式。
            bucket: res.data.data.SystemOssBucket,// 通过控制台创建的bucket。
            endpoint: res.data.data.SystemOssEndpoint,// OSS域名。
            cname: true, // 是否支持上传自定义域名，默认false。如果cname为true，endpoint传入自定义域名时，自定义域名需要先同bucket进行绑定。
            region: 'oss-cn-hangzhou', // bucket 所在的区域，默认 oss-cn-hangzhou（是根据当前所在区域自动确认的）。
          };
          const config = {
            isNotNeedRequest: true,// 默认为false，即需要请求接口获取配置信息，不需要时，请设置为true。
            clientRequest: clientConfig,// 当isNotNeedRequest为true时必填项，配置项详情请查看OSS上传的配置项文档。https://help.aliyun.com/
          }; // 配置项
          UE.Editor.prototype.ossUpload = upload
          UE.Editor.prototype.getExtranetUrl = getExtranetUrl
          UE.Editor.prototype.ossConfig = config
          UE.Editor.prototype.uploadBase64 = uploadBase64
        })


        
        
        if(UE.Editor.prototype._bkGetActionUrl === undefined){
          
          UE.Editor.prototype._bkGetActionUrl = UE.Editor.prototype.getActionUrl;
          UE.Editor.prototype.getActionUrl = function(act) {
            //判断路径   这里是config.json 中设置执行上传的action名称
            if (act == 'uploadimage' || act == 'uploadvideo' || act == 'uploadscrawl' || act == 'uploadfile' || act == 'listimage' || act == 'listfile'|| act == 'catchimage') {
               
              return ``;
            } else {
              return this._bkGetActionUrl.call(this, act);
            }
          }
        }
        this.editor = UE.getEditor(this.id, this.config);
        this.editor.addListener("ready", ()=>{
          this.editor.setContent(this.config.initialContent); // 确保UE加载完成后，放入内容。
        });
      }
    },
    destroyed() {
      this.editor.destroy();
    },
    watch:{
      config:{
        handler:function(val,oldval){
          this.init()
        },
        mmediate: true,
        deep:true
      }
    }
  }
</script>
<style lang="scss">
  @import '../../static/ueditor/xiumi-ue-v5.css';
  @import '../../static/ueditor/template/template.css';
</style>
