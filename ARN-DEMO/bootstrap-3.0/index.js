// 逐行----
define(['jQuery', 'bootstrap', $AFPath+'/arn/ARN-DEMO/bootstrap-3.0/index-lib.js'], function ($, bootstrap, lib) {
   $('#myAlert>.info').text(lib.sayOk());

   $("#myAlert").alert();

   setTimeout(function (){
      $("#myAlert").alert('close');
   }, 1000*60);

   $("#myAlert").bind('closed.bs.alert', function () {
      alert("警告消息框被关闭。");
   });
});
