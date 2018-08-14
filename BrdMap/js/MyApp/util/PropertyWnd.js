Ext.define('MyApp.util.PropertyWnd', {
    extend: 'Ext.window.Window',
    alias: 'widget.MyPropertyWnd',
    icon: Ext.Loader.getPath('MyApp') + '/images/icon/property.png',
    title: '属性 - ' + document.title,
    layout: { type: "fit", columns: 1, align: "stretch", pack: "start" },
    bodyPadding: -1,
    width: 260,
    height: 390,
    minWidth: 160,
    minHeight: 160,
    ShowGroup: function (bGroup)
    {
        var me = this;
        me.query("[tooltip^=分组]")[0].toggle(bGroup);
        me.query("[tooltip^=排序]")[0].toggle(!bGroup);

        grid = me.down("grid");
        if (bGroup)
        {
            grid.view.getFeature("group").enable();
            var group = Ext.getVersion().gtEq(5) ? grid.store.getGrouper() : grid.store.groupers.get("group");
            if (group && group.direction != "ASC")
                group.toggle();

            if (Ext.getVersion().gtEq(5))
                grid.store.sort([function (a, b) { return a.internalId - b.internalId; } ]);
            else
                grid.store.sort([function (a, b) { return parseInt(a.internalId.match(/[0-9]+$/)) - parseInt(b.internalId.match(/[0-9]+$/)); } ]);
        }
        else
        {
            grid.view.getFeature("group").disable();
            grid.store.sort([{ property: 'name', direction: 'ASC'}]);
        }
    },
    initComponent: function ()
    {
        Ext.apply(this, {
            tbar: { defaults: { tooltipType: 'title' },
                items: [{ xtype: "button", tooltip: "分组显示", icon: Ext.Loader.getPath('MyApp') + '/images/icon/tb_group.png', handler: function () { this.up("window").ShowGroup(true); } },
                    { xtype: "button", tooltip: "排序显示", icon: Ext.Loader.getPath('MyApp') + '/images/icon/tb_sort.png', handler: function () { this.up("window").ShowGroup(false); } },
                    { xtype: "tbseparator" },
                    { xtype: "button", text: "关闭", handler: function () { this.up("window").close(); } }]
            },
            items: {
                xtype: 'grid',
                border: false,
                header: false,
                hideHeaders: true,
                columnLines: true,
                features: {
                    ftype: "grouping",
                    id: "group",
                    groupCls: "",
                    groupHeaderTpl: Ext.create("Ext.XTemplate", "<div>{name:this.formatName}</div>", {
                        formatName: function (name)
                        {
                            return Ext.isEmpty(name) ? "常规" : name.replace(/^[0-9]+\、/, "");
                        }
                    })
                },
                store: { fields: ["group", "name", "value"],
                    groupField: "group",
                    proxy: { type: "ajax", reader: "array" },
                    autoLoad: false, sorters: ["group", "name"]
                },
                columns: [{ header: "分组", hidden: true, dataIndex: "group" },
                            { header: "名称", sortable: true, resizable: true, dataIndex: "name", flex: 2 },
                            { header: "值", sortable: true, resizable: true, dataIndex: "value", flex: 3}],
                listeners: {
                    cellcontextmenu: function (view, td, cellIndex, record, tr, rowIndex, e, eOpts)
                    {
                        e.preventDefault();
                        if (record && 'ZeroClipboard' in window)
                        {
                            var clip = new ZeroClipboard.Client();
                            clip.setText(record.get('name') + '\t' + (record.get('value') || ''));
                            Ext.widget({ xtype: 'menu',
                                items: [{ text: '复制',
                                    listeners: {
                                        afterrender: function (o, eOpts) { console.log(this.id); clip.glue(this.id); },
                                        boxready: function () { clip.reposition(); }
                                    }
                                }]
                            }).showAt(e.getX(), e.getY());
                        }
                    }
                },
                Load: function (data)
                {
                    if (Ext.isArray(data))
                        this.store.loadData(data);
                    else if (data && 'url' in data)
                        this.store.load(data);
                }
            }
        });

        this.callParent(arguments);
        this.ShowGroup(true);
    },
    setData: function (data) { this.down("grid").Load(data); }
},
function ()
{
    if (!('ZeroClipboard' in window))
    {
        Ext.Loader.loadScript({
            url: Ext.Loader.getPath('MyApp') + '/../extjs/ux/clipboard/ZeroClipboard.js',
            onLoad: function () { if (window.ZeroClipboard) ZeroClipboard.setMoviePath(Ext.Loader.getPath('MyApp') + '/../extjs/ux/clipboard/ZeroClipboard.swf'); },
            onError: function (e) { console.log(Ext.isString(e) ? e : 'Failed loading "' + e.url + '", please verify that the file exists!'); }
        });
    }
});
