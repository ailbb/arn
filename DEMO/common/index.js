// 逐行----
define(['vue', 'jQuery', $AFPath+'/module/test/index-lib.js'], function (Vue, $, lib) {

   new Vue({
      el: '.container',
      data: {
         myValue: 0
      },
      mounted: function (){
         lib.sayOk();
      }
   });

});
