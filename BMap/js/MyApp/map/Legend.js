///<reference path="../extjs/ext-all-debug.js" />
Ext.define('MyApp.map.LegendItem', {
    extend: 'Ext.Component',
    requires: ['Ext.XTemplate'],
    alias: 'widget.map_legend_item',
    color: 'white',
    text: '',
    count: '',
    childEls: ['colorEl', 'textEl', 'countEl'],
    padding: '2px',
    renderTpl: ['<span id="{id}-btnWrap" unselectable="on" style="cursor: default; color: black;" >',
                    '<div id="{id}-colorEl" data-ref="colorEl" class="{baseCls}-icon" unselectable="on" ',
                        'style="display: inline-block; vertical-align: middle; width: 12px; height: 12px; <tpl if="color">background: {color};</tpl>">',
                    '</div>&nbsp;',
                    '<span id="{id}-textEl" data-ref="textEl" class="{baseCls}-inner" unselectable="on">',
                        '{text}',
                    '</span>&nbsp;',
                    '<span id="{id}-countEl" data-ref="countEl" class="{baseCls}-inner" unselectable="on">',
                        '{count}',
                    '</span>',
                '</span>'],
    initRenderData: function ()
    {
        return Ext.apply(this.callParent(arguments), { color: this.color, text: this.text || '', count: this.count || ''});
    },
    enable: Ext.emptyFn,
    disable: Ext.emptyFn,
    focus: Ext.emptyFn,
    initComponent: function ()
    {
        this.addCls(Ext.baseCSSPrefix + 'unselectable');

        this.callParent(arguments);
    }
});

Ext.define('MyApp.map.Legend', {
    extend: 'Ext.toolbar.Toolbar',
    alias: 'widget.map_legend',
    autoShow: true,
    vertical: true,
    floating: true,
    internal: true,
    opacity: 1,
    shadow: 'drop',
    shadowOffset: 6,
    padding: '3px',
    itemCls: undefined,
    style: {
        borderColor: 'rgba(128,128,128,0.75)',
        borderStyle: 'solid',
        background: 'rgba(255,255,255,0.75)',
        'border-radius': '1px',
        'pointer-events': 'none'
    },
    defaults: { xtype: 'map_legend_item' },
    afterRender: function ()
    {
        this.callParent(arguments);

        this.el.setStyle('pointer-events', this.draggable ? '' : 'none');
    }
});

Ext.define('MyApp.map.LegendEditor', {
    extend: 'Ext.window.Window',
    alias: 'widget.map_legend_editor',
    icon: Ext.Loader.getPath('MyApp') + '/images/icon/property.png',
    title: '编辑图例 - ' + document.title,
    bodyPadding: 6,
    width: 390,
    height: 280,
    minWidth: 260,
    minHeight: 100,
    defaultAlign: 'c-c',
    layout: { type: "vbox", pack: "start", align: "stretch" },
    data: [{ color: 'red', threshold: 25 }, { color: 'green', threshold: 50 }, { color: 'blue', threshold: 100 }],
    initComponent: function ()
    {
        var rowEditing = Ext.create('Ext.grid.plugin.RowEditing', {
            autoCancel: false,
            initEditorConfig: function ()
            {
                return Ext.apply(this.self.prototype.initEditorConfig.apply(this, arguments), { saveBtnText: '确定', cancelBtnText: '取消' });
            },
            completeEdit: function ()
            {
                this.self.prototype.completeEdit.apply(this, arguments)

                if (this.editing)
                    return;

                var store = this.context.store;
                store.sync();
                //store.sort();
                if (!this.cmp.up('window').kpienum)
                    store.sort();

                this.grid.view.refresh();
                r = store.getAt(store.getCount() - 1);
                if (Ext.isNumber(parseFloat(r.get('threshold'))) && !this.cmp.up('window').kpienum)
                    store.loadData([{ color: r.get('color'), threshold: '', title: '' }], true);

                this.grid.selModel.select(this.context.record);
            }
        });
        rowEditing.on('beforeedit', function (editor, e, eOpts)
        {
            var col = Ext.getCmp('txtthreshold');
            if (!col)
                return true;

            var f = col.field;
            if (!f)
                return true;

            if (!this.cmp.up('window').kpienum)
            {
                Ext.getCmp('txtthreshold').field.invalidText = '请输入数字';
                Ext.getCmp('txtthreshold').field.regex = new RegExp("^[0-9]*$");
            }
            else
            {
                f.invalidText = undefined;
                f.regex = undefined;
            }

            return true;
        });
        rowEditing.on('validateedit', function (editor, e, eOpts)
        {
            if (!this.cmp.up('window').kpienum && !Ext.isNumber(parseFloat(e.newValues.threshold)))
            {
                Ext.Msg.alert('提示', '请输入数字！');
                return false;
            }
            return true;
        });

        Ext.apply(this, {
            items: [{ xtype: 'textfield', emptyText: "在这里输入图例名称", hidden: true, fieldLabel: "图例", labelWidth: 35 },
                    {
                        xtype: 'grid',
                        flex: 1,
                        frame: false,
                        columnLines: true,
                        sortableColumns: false,
                        enableColumnHide: false,
                        tbar: [{ xtype: 'tbfill' },
                               { xtype: 'button', text: '重置', scope: this, handler: this.OnReset }, '-',
                               { xtype: 'button', text: '添加', scope: this, handler: this.OnAddClick },
                               { xtype: 'button', text: '删除', disabled: true, scope: this, handler: this.OnDeleteClick }],
                        columns: [{
                            header: '范围', sortable: false, flex: 1,
                            renderer: function (fieldValue, cellValues, record, recordIndex, columnIndex, dataSource)
                            {
                                var kpienum = this.up('window').kpienum;
                                if (kpienum)
                                {
                                    var a = record.get('threshold');
                                    return a;
                                }
                                else
                                {
                                    var a = recordIndex > 0 ? dataSource.getAt(recordIndex - 1).get('threshold') : undefined, b = record.get('threshold');
                                    return Ext.isEmpty(a) ? (Ext.isEmpty(b) ? '' : '< ' + b) : (Ext.isEmpty(b) ? '> ' + a : '[' + a + ', ' + b + ')');
                                }
                            }
                        },
                                  {
                                      header: '颜色', dataIndex: 'color', sortable: false, flex: 1,
                                      field: {
                                          xtype: 'pickerfield', matchFieldWidth: false, selectOnFocus: true, allowReselect: true,
                                          createPicker: function ()
                                          {
                                              var me = this;
                                              var picker = Ext.create('Ext.menu.ColorPicker', {
                                                  hidePickerOnSelect: function (picker, selColor)
                                                  {
                                                      this.callParent(arguments);
                                                      me.setValue('#' + selColor);
                                                  }
                                              });
                                              return picker;
                                          },
                                          setValue: function (v)
                                          {
                                              this.callParent(arguments);
                                              if (this.inputEl)
                                              {
                                                  this.inputEl.setStyle('background', v);
                                                  var c = MyCommon.parseColor(v);
                                                  if (Ext.isArray(c))
                                                      c = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
                                                  this.inputEl.setStyle('color', c < 128 ? 'white' : 'black');
                                              }
                                          },
                                          onExpand: function ()
                                          {
                                              this.picker.picker.select(this.value, true);
                                          }
                                      },
                                      renderer: function (value, p, record)
                                      {
                                          return '<div style="background:' + value + ';">&nbsp;</div>';
                                      }
                                  },
                                  {
                                      header: '阀值', dataIndex: 'threshold', id: 'txtthreshold', sortable: false, flex: 1, field:
                                            { xtype: 'textfield', selectOnFocus: true, hideTrigger: true }
                                  },
                                  { header: '标题', dataIndex: 'title', sortable: false, flex: 1, allowBlank: true, field: { xtype: 'textfield', selectOnFocus: true, emptyText: '默认' } }],
                        store: {
                            autoLoad: false,
                            fields: ['id', 'color', 'threshold', 'title'],
                            proxy: { type: 'memory', reader: 'json' },
                            sorters: [{
                                sorterFn: function (a, b)
                                {
                                    a = parseFloat(a.get('threshold'));
                                    b = parseFloat(b.get('threshold'));
                                    if (Ext.isNumber(a))
                                        return Ext.isNumber(b) ? a - b : -1;

                                    return Ext.isNumber(b) ? 1 : 0;
                                }
                            }]
                        },
                        plugins: [rowEditing],
                        listeners: {
                            selectionchange: function (selModel, selections)
                            {
                                this.up('window').down('[text=删除]').setDisabled(selections.length === 0);
                            }
                        }
                    }],
            buttons: [/*{ xtype: "button", text: "应用", scope: this, handler: this.OnApply },*/
                      { xtype: "button", text: "确定", scope: this, handler: this.OnOK },
                      { xtype: "button", text: "关闭", scope: this, handler: this.close }]
        });

        this.callParent(arguments);
    },
    afterRender: function ()
    {
        this.callParent(arguments);
        this.OnReset();
    },
    OnReset: function ()
    {
        var data = Ext.clone(this.data), store = this.down('grid').store;
        store.loadData(Ext.clone(this.data));
        var n = store.getCount();
        if (n > 0 && !this.kpienum)
        {
            var r = store.getAt(n - 1);
            if (Ext.isNumber(r.get('threshold')))
                store.loadData([{ color: r.get('color'), threshold: '', title: '' }], true);
        }
    },
    OnAddClick: function ()
    {
        var grid = this.down("grid"), store = grid.store, r = grid.getSelectionModel().getSelection()[0];
        if (grid.editingPlugin.editing)
        {
            grid.editingPlugin.completeEdit();
            if (grid.editingPlugin.editing)
                return;
        }

        if (!r)
            r = store.getAt(store.getCount() - 1);

        store.loadData([r ? { color: r.get('color'), threshold: r.get('threshold'), title: r.get('title') || '' } : { color: 'red', threshold: '', title: '' }], true);
        grid.view.refresh();
        grid.editingPlugin.startEdit(r ? r : store.getCount() - 1, 1);
    },
    OnDeleteClick: function ()
    {
        var grid = this.down("grid"), selModel = grid.getSelectionModel(), r = selModel.getSelection()[0];
        if (r)
        {
            if (!selModel.selectNext())
                selModel.selectPrevious();

            grid.store.remove(r);
            grid.view.refresh();
        }
    },
    setData: function (map, layer, kpi, kpiname)
    {
        this.map = map;
        this.layer = layer;
        this.kpi = kpi;
        this.kpiname = kpiname;
        this.data = kpi.thresholds;

        var txt 

        this.kpienum = true;
        if (kpi instanceof MyApp.map.kpicmp)
            this.kpienum = false;

        if (this.rendered)
            this.OnReset();
    },
    OnCommit: function (name, data)
    {
        //if (name)
        //    throw Ext.encode({ name: name, data: data });

        if (data && this.kpi && Ext.isFunction(this.kpi.showlegend))
        {
            this.kpi.thresholds = data;
            //this.kpi.showlegend(data);
            this.kpi.LoadKpiStat(true);
            this.layer.SetKPI(this.kpiname, this.kpi);
            this.map.InvalidateLayer();
        }
    },
    OnApply: function ()
    {
        try
        {
            var grid = this.down("grid"), store = grid.store, data = [];
            if (grid.editingPlugin.editing)
            {
                grid.editingPlugin.completeEdit();
                if (grid.editingPlugin.editing)
                    return;
            }

            for (var i = 0, n = store.getCount(), r; i < n; i++)
            {
                r = store.getAt(i);
                data.push({ color: r.get('color'), threshold: r.get('threshold'), title: r.get('title') });
            }

            this.OnCommit(this.down('textfield').getValue(), data);

            return true;
        }
        catch (e)
        {
            Ext.Msg.alert(this.title, e);
        }
    },
    OnOK: function ()
    {
        if (this.OnApply())
            this.close();
    }
});