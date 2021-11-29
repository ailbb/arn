// 逐行----
define(['vue', 'ELEMENT', 'jQuery', $AFPath+'/arn/ARN-DEMO/element-ui/index-lib.js'], function (Vue, ELEMENT, $, lib) {

   Vue.use(ELEMENT); // 第一种方式加载ElementUI
   // ELEMENT.install(Vue); // 第二种方式加载ElementUI

   return new Vue({
      el: '.container',
      data: {
         myValue: 0,
         visible: false,
         tableData: Array(20).fill({
            date: '2016-05-02',
            name: '王小虎',
            address: '上海市普陀区金沙江路 1518 弄'
         })
      },
      mounted: function (){
         this.$message(lib.sayOk());
      }
   });

});
