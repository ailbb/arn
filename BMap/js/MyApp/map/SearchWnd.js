Ext.define('MyApp.map.SearchWnd', {
    extend: 'Ext.window.Window',
    alias: 'widget.map_SearchWnd',
    icon: Ext.Loader.getPath('MyApp') + '/images/icon/find.png',
    title: '搜索 - ' + document.title,
    layout: { type: "vbox", columns: 1, align: "stretch", pack: "start" },
    bodyPadding: 6,
    width: 500,
    height: 350,
    minWidth: 250,
    minHeight: 180,
    url: APPBASE + '/web/jss/map.jss?action=map.SearchElement',
    defaults: { style: { background: 'transparent' } },
    initComponent: function ()
    {
        this.items = [{
            xtype: 'container',
            height: 62,
            layout: 'border',
            items: [{
                xtype: 'textareafield',
                name: 'content',
                region: 'center',
                emptyText: "在这里输入图层元素的名称或标识ID",
                fieldLabel: "搜索内容",
                labelWidth: 56,
                height: 60
            }, {
                xtype: 'container',
                region: 'east',
                width: 60,
                layout: { type: 'vbox', pack: 'start', align: 'right' },
                items: [{ xtype: 'button', text: '搜 索', width: 50, handler: function () { this.findParentByType("window").DoSearch() } },
                { xtype: 'tbspacer', height: 6 },
                { xtype: "button", text: " 关 闭 ", width: 50, handler: function () { this.findParentByType("window").hide() } }]
            }]
        },
        { xtype: 'tbspacer', height: 6 },
        {
            xtype: 'grid',
            border: true,
            header: false,
            columnLines: true,
            flex: 1,
            columns: [{ header: "标识ID", sortable: true, resizable: true, dataIndex: "id", flex: 3 },
                    { header: "名称", sortable: true, resizable: true, dataIndex: "name", flex: 4 },
                    { header: "经度", sortable: true, resizable: true, dataIndex: "longitude", flex: 2 },
                    { header: "纬度", sortable: true, resizable: true, dataIndex: "latitude", flex: 2 },
                    { header: "x", hidden: true, resizable: true, dataIndex: "x", flex: 2 },
                    { header: "y", hidden: true, resizable: true, dataIndex: "y", flex: 2 },
                    { header: "图层描述", sortable: true, resizable: true, dataIndex: "layerdesc", flex: 4 }],
            store: {
                autoLoad: false,
                fields: ['id', 'name', 'longitude', 'latitude', 'x', 'y', 'layerdesc'],
                pageSize: 100,
                proxy: {
                    type: 'ajax',
                    url: this.url,
                    reader: {
                        type: 'json', root: 'rs', totalProperty: 'total',
                        readRecords: function (data)
                        {
                            if ('error' in data)
                                Ext.Msg.alert('搜索', data.error);

                            return this.self.prototype.readRecords.apply(this, arguments);
                        }
                    },
                    getMethod: function () { return 'POST'; }
                },
                listeners:
                {
                    beforeload: function (me, op)
                    {
                        var ps = { args: Ext.encode(this.__args) };
                        op.params = op.params ? Ext.apply(op.params, ps) : ps;
                    }
                },
                Search: function (args)
                {
                    this.currentPage = 1;
                    this.__args = args;
                    this.load();
                }
            },
            bbar: {
                xtype: 'pagingtoolbar',
                emptyMsg: '无数据',
                displayInfo: true,
                displayMsg: '第 {0} - {1} 条, 共 {2} 条',
                listeners: {
                    boxready: function () { this.bindStore(this.findParentByType("grid").store); }
                }
            },
            listeners: {
                selectionchange: function (view, sels, options)
                {
                    if (sels && sels.length > 0)
                    {
                        var r = sels[0];
                        this.up('window').onSel(r.get('id'), r.get('longitude'), r.get('latitude'), r.get('x'), r.get('y'))
                    }
                }
            }
        }];

        this.callParent(arguments);
    },
    afterRender: function ()
    {
        this.callParent(arguments);

        var view = this.down('grid').view;
        if (view.loadMask)
        {
            view.loadMask.on({
                scope: this,
                beforeshow: this.OnMaskBeforeShow,
                hide: this.OnMaskHide
            });
        }
    },
    OnMaskBeforeShow: function ()
    {
        this.down('[name^=content]').disable();
        this.down('[text^=搜 索]').disable();
    },
    OnMaskHide: function ()
    {
        this.down('[name^=content]').enable();
        this.down('[text^=搜 索]').enable();
    },
    DoSearch: function ()
    {
        var ta = this.down('[name^=content]');
        var content = ta.getValue().replace(/\s+/g, " ").trim();
        if (Ext.isEmpty(content))
        {
            ta.focus(true);
            return;
        }

        Ext.apply(this.args, { content: content });
        this.down('grid').store.Search(this.args);
    },
    afterShow: function ()
    {
        this.callParent(arguments);
        this.down('[name^=content]').focus(true, 100);
    },
    onSel: function (id, lon, lat, x, y)
    {
        alert(id);
    }
});