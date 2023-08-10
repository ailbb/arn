Ext.define("MyApp.blank", {
    extend: 'Ext.Viewport',
    border: false,
    layout: {
        type: 'border',
        padding: 0
    },
    items: { xtype: "panel", title: "此功能正在开发...", region: "center" }
});