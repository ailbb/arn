define(['ext'], function (Ext) {
    Ext.Loader.setConfig({
        enabled : true,
        scriptCharset : 'utf-8',
        disableCaching : false,
        paths : { ExPlugins: "Sencha/ext-6.0.0/ex-plugins/" }
    });

    Ext.onReady(function () {
        Ext.create('ExPlugins.textwindow.TextWindow').show();
    });
});