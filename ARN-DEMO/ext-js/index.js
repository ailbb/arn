// 逐行----
define(['ext', $AFPath+'/arn/ARN-DEMO/ext-js/index-lib.js'], function (Ext, lib) {

   // 框架配置
   function _ExtConfig(){
      return {
         enabled : true,
         scriptCharset : 'utf-8',
         disableCaching : false,
         paths : { ExPlugins: $AFPath + "/arn/Sencha/ext-6.0.0/ex-plugins/", ARNEXT: $AFPath + "/arn/ARN-DEMO/ext-js" }
      };
   };

   // 视图配置
   function _ViewConfig(){
      return {
         layout: 'border',

         bodyBorder: false,

         defaults: {
            collapsible: true,
            split: true,
            bodyPadding: 10
         },

         items: [
            {
               title: 'Footer',
               region: 'south',
               height: 100,
               minHeight: 75,
               maxHeight: 150,
               html: '<p>Footer content</p>'
            },
            {
               title: 'Navigation',
               region: 'west',
               floatable: false,
               margin: '5 0 0 0',
               width: 125,
               minWidth: 100,
               maxWidth: 250,
               html: '<p>Secondary content like navigation links could go here</p>'
            },
            Ext.create('ARNEXT.ARNEXT-View',{
               // xtype: 'arnext-view',
               title: 'Main Content',
               collapsible: false,
               region: 'center',
               margin: '5 0 0 0',
            })
         ],

         width: '100%',
         height: '100%',

         listeners: {
            boxready: function () {
               Ext.Msg.alert("提示","Ext加载完成！<br>" +  lib.sayOk());
            }
         }
      };
   };


   // 初始化时候，重置Ext的基础属性
   Ext.Loader.setConfig(_ExtConfig());

   // 加载完成后，创建页面视图
   Ext.onReady(_=>Ext.create('Ext.container.Viewport', _ViewConfig()));

});
