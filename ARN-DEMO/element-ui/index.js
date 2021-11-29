// 逐行----
define(['vue', 'ELEMENT', 'jQuery', $AFPath+'/module/test/index-lib.js'], function (Vue, ELEMENT, $, lib) {

   Vue.use(ELEMENT); // 第一种方式加载ElementUI
   // ELEMENT.install(Vue); // 第二种方式加载ElementUI

   return new Vue({
      el: '.container',
      data: {
         myValue: 0,
         visible: false
      },
      mounted: function (){
         lib.sayOk();
      }
   });
});
