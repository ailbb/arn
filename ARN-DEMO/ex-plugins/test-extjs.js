define(['ext'], function (Ext) {
    Ext.Loader.setConfig({
        enabled : true,
        scriptCharset : 'utf-8',
        disableCaching : false,
        paths : { ExPlugins: "/arn/Sencha/ext-6.2.0/ex-plugins/" }
    });

    Ext.onReady(function () {
        Ext.create('ExPlugins.textwindow.TextWindow').show();
    });
});