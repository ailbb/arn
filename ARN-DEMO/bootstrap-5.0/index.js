// 逐行----
define(['jQuery', 'bootstrap', $AFPath+'/arn/ARN-DEMO/bootstrap-3.0/index-lib.js'], function ($, bootstrap, lib) {
   $('#myAlert>.info').text(lib.sayOk());

   setTimeout(function (){
      $('#myAlert').hide();
   }, 1000*60);

   $('#myAlert').on('closed.bs.alert', function () {
      alert("警告消息框被关闭。");
   });
});
