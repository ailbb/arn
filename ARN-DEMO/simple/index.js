// 逐行----
define(['vue', 'ELEMENTPLUS', 'jQuery', $AFPath+'/arn/ARN-DEMO/simple/index-lib.js'], function (Vue, ElementPlus, $, lib) {
   var app = Vue.createApp({
      data: function () {
         return {
            myValue: 0
         }
      },
      mounted: function (){
         lib.sayOk();
      }
   });

   app.use(ElementPlus);
   app.mount('.container');
});
