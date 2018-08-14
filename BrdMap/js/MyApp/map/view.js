Ext.define('MyApp.map.view', {
    extend: 'Ext.Viewport',
    requires: ['MyApp.map.Map', 'MyApp.map.Legend', 'MyApp.map.HeatLayer', 'MyApp.map.plugin.Subject', 'MyApp.map.kpi', 'MyApp.map.AreagridLayer','MyApp.map.SiteLayer'],
    layout: {
        type: 'border',
        padding: 0
    },
    initComponent: function ()
    {
        // 模块级地图配置
        var config = {
            layers: [{ xtype: 'cell_layer', name: 'cellLayer' }, { xtype: 'heatLayer', name: 'heatLayer' },
            { xtype: 'surface_layer', name: 'surfaceLayer' }, { xtype: 'areagrid_layer', name: 'areagridLayer' },
            {xtype: 'site_layer', name: 'siteLayer', Visible: false}],
            kpis: [{
                name: 'cover_kpi',
                items: [{
                    title: '覆盖',
                    field: 'cover',
                    keyfield: 'sector_id',
                    thresholds: [{ threshold: 25, color: 'red' }, { threshold: 50, color: 'green' }, { threshold: 75, color: 'blue' }, { color: 'rgb(0,255,255)' }]
                }, {
                    title: 'aaa',
                    field: 'ff'
                }]
            }, {
                name: 'test_kpi',
                items: [{
                    title: '测试',
                    field: 'tf'
                }]
            }],
            plugins: [{
                ptype: 'my_map_kpis', name: 'mykpi', querytype: "11", dimfield: "platform_sector_defid", uri: "/ivquery.do?method=query",
                items: [{
                    title: '覆盖',
                    field: 'cover',
                    keyfield: 'sector_id',
                    thresholds: [{ threshold: 25, color: 'red' }, { threshold: 50, color: 'green' }, { threshold: 75, color: 'blue' }, { color: 'rgb(0,255,255)' }]
                }, {
                    title: 'aaa',
                    field: 'ff'
                }, {
                    title: 'aaa',
                    field: 'ff'
                }]
            }, {
                ptype: 'subject', name: 'subject', text: '覆盖分析',querymapping:[{query:[11],menuname:"m1"}],
                m1: [{
                    text: '小区', 
                    fn: function (map, b) { map.cellLayer.SetKPI('polygon_kpi', b ? map.mykpi.cover : undefined); map.cellLayer.Visible = b; }
                }, {
                    text: '小区',
                    fn: function (map, b) { map.cellLayer.SetKPI('polygon_kpi', b ? map.mykpi.cover : undefined); map.cellLayer.Visible = b; }
                }, {
                    text: '热力图', checked: true,
                    fn: function (map, b) { map.heatLayer.Visible = b; }
                }, {
                    xtype: 'menuseparator'
                }, {
                    text: '所有',
                    fn: function (map, b) { map.cellLayer.Visible = b; map.heatLayer.Visible = b; }
                }],
                m2: [{ text: 'abc', layers: 'cellLayer' }, { text: 'xyz', layers: 'heatLayer' }]
            }]
        };


        // 模块级代码对配置作通用处理，以达到简化配置的目的
        $(config.layers).each(function () { Ext.applyIf(this, { Visible: false }) });
        var kpis = config.kpis;
        if (kpis)
        {
            $(kpis).each(function () { Ext.applyIf(this, { ptype: 'my_map_kpis' }) });
            config.plugins = Array.prototype.concat(kpis, config.plugins).filter(function (v) { return Ext.isObject(v); });
        }

        // 此类(如专题分析)地图的配置, 用来简化每个模块的配置
        var defaults = {
            xtype: 'MyMap',
            InitLongitude: 117.076/*113.33*/,
            InitLatitude: 39.117/*22.12062*/,
            OnQuery: function (cond) // 查询事件接口，是否通用? 如果通用可移至类中作为成员
            {
                var plugins = this.plugins;
                for (var i = 0, n = plugins.length, p; i < n; i++)
                {
                    p = plugins[i];
                    if (Ext.isFunction(p.OnQuery))
                        p.OnQuery.apply(p, arguments);
                }
            }
        };

        var map = Ext.applyIf(config, defaults);

        this.items = [{ xtype: 'panel', region: 'west', width: '15%', collapsible: true, split: true },
        { xtype: "panel", frame: false, region: "center", layout: 'fit', items: map }];

        this.callParent(arguments);
    },
    afterRender: function ()
    {
        this.callParent(arguments);
        window.top.map = this.down('map_panel');
    }
});