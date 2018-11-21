<template>
  <div>
    <v-editor :config=config id="ue1" ref="ueditor" v-model="config.initialContent"></v-editor>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        config: {
          autoHeightEnabled: false,
          autoFloatEnabled: true,　　//是否工具栏可浮动
          initialContent: '234',   //初始化编辑器的内容,也可以通过textarea/script给值，看官网例子
          autoClearinitialContent: false, //是否自动清除编辑器初始内容，注意：如果focus属性设置为true,这个也为真，那么编辑器一上来就会触发导致初始化的内容看不到了
          initialFrameWidth: null,
          initialFrameHeight: 900,
          BaseUrl: '',
          //UEDITOR_HOME_URL: '/static/ueditor/',
        },
      };
    },
    mounted(){
      this.config.initialContent = '';
    },
    methods: {

    }
  }

</script>

<style lang="scss" scoped>
  @import '../assets/css/mixin';

</style>
