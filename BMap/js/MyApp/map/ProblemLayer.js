Ext.define('MyApp.map.ProblemWin', {
    extend: 'Ext.window.Window',
    alias: 'widget.ProblemWin',
    icon: Ext.Loader.getPath('MyApp') + '/images/icon/property.png',
    layout: 'fit',
    frame: true,
    width: 400,
    height: 360,
    minWidth: 250,
    minHeight: 120,
    resizable: false,
    closable: false,
    title: '问题信息',
    border: false,
    modal: true,
    project_id: undefined,
    province_id: undefined,
    city_id: undefined,
    problem: undefined,
    layer: undefined,
    items: [
		{
		    xtype: 'form',
		    layout: 'anchor',
		    id: 'frm',
		    frame: true,
		    autoScroll: true,
		    padding: 5,
		    defaults: {
		        anchor: '100%'
		    },
		    items: [
                {
                    xtype: 'clearablecombobox',
                    fieldLabel: '场景',
                    id: 'scene_type',
                    queryMode: 'local',
                    store: new Ext.data.ArrayStore({
                        id: 0,
                        fields: ['k', 'v'],
                        proxy:
                        {
                            type: 'ajax',
                            url: APPBASE + '/web/jss/map.jss?action=map.GetComboSceneType',
                            reader:
                            {
                                type: 'json',
                                root: 'rs'
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
                        reload: function (args)
                        {
                            this.__args = args;
                            this.load();
                        }
                    }),
                    listeners:
                    {
                        change: function (sender, newval, oldval, opts)
                        {
                            var win = this.findParentByType("window");
                            if (win)
                                this.findParentByType("window").changeScene(newval);
                        }
                    },
                    valueField: 'k',
                    displayField: 'k',
                    emptyText: '选择场景',
                    valueNotFoundText: '选择场景',
                    labelWidth: 120,
                    clearable: true,
                    editable: false,
                    allowBlank: true
                },
                {
                    xtype: 'clearablecombobox',
                    fieldLabel: '子场景名称',
                    id: 'scene_name',
                    queryMode: 'remote',
                    store: new Ext.data.ArrayStore({
                        id: 0,
                        fields: ['k', 'v'],
                        proxy:
                        {
                            type: 'ajax',
                            url: APPBASE + '/web/jss/map.jss?action=map.GetComboScene',
                            reader:
                            {
                                type: 'json',
                                root: 'rs'
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
                        reload: function (args)
                        {
                            this.__args = args;
                            this.load();
                        }
                    }),
                    valueField: 'k',
                    displayField: 'k',
                    emptyText: '选择子场景',
                    valueNotFoundText: '选择子场景',
                    labelWidth: 120,
                    clearable: true,
                    editable: false,
                    allowBlank: true
                },
                {
                    xtype: 'clearablecombobox',
                    fieldLabel: '网格名称',
                    id: 'phygrid_id',
                    queryMode: 'remote',
                    store: new Ext.data.ArrayStore({
                        id: 0,
                        fields: ['k', 'v', 'type'],
                        proxy:
                        {
                            type: 'ajax',
                            url: APPBASE + '/web/jss/map.jss?action=map.GetComboGrid',
                            reader:
                            {
                                type: 'json',
                                root: 'rs'
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
                        reload: function (args)
                        {
                            this.__args = args;
                            this.load();
                        }
                    }),
                    listeners:
                    {
                        change: function (sender, newval, oldval, opts)
                        {
                            var rc = this.findRecordByValue(newval);
                            var type = '';
                            if (rc)
                                type = rc.data.type;

                            var win = this.findParentByType("window");
                            if (win)
                                this.findParentByType("window").changePhygrid(type);
                        }
                    },
                    valueField: 'k',
                    displayField: 'v',
                    emptyText: '选择网格',
                    valueNotFoundText: '选择网格',
                    labelWidth: 120,
                    clearable: true,
                    editable: false,
                    allowBlank: true
                },
                //{
                //    xtype: 'clearablecombobox',
                //    fieldLabel: '网格类型',
                //    id: 'phygrid_type',
                //    queryMode: 'local',
                //    store: new Ext.data.ArrayStore({
                //        id: 0,
                //        fields: ['k', 'v'],
                //        data: [['A类', 'A类'], ['B类', 'B类'], ['C类', 'C类']]
                //    }),
                //    listeners:
                //    {
                //        change: function (sender, newval, oldval, opts)
                //        {
                //            var win = this.findParentByType("window");
                //            if (win)
                //                this.findParentByType("window").changePhygrid(newval);
                //        }
                //    },
                //    valueField: 'k',
                //    displayField: 'k',
                //    labelWidth: 120,
                //    clearable: true,
                //    editable: false,
                //    allowBlank: true
                //},
				{
				    xtype: 'textfield',
				    fieldLabel: '网格类型',
				    id: 'phygrid_type',
				    name: 'phygrid_type',
				    allowBlank: true,
				    labelWidth: 120,
				    readOnly: true,
				    value: ''
				},
				{
				    xtype: 'textfield',
				    fieldLabel: '问题来源',
				    id: 'problem_source',
				    name: 'problem_source',
				    allowBlank: false,
				    labelWidth: 120,
				    value: ''
				},
		        {
		            xtype: 'textfield',
		            fieldLabel: '解决手段',
		            id: 'slove_means',
		            name: 'slove_means',
		            labelWidth: 120,
		            value: ''
		        },
		        {
		            xtype: 'textfield',
		            fieldLabel: '基站需求',
		            id: 'station_need',
		            name: 'station_need',
		            labelWidth: 120,
		            value: ''
		        },
		        {
		            xtype: 'textfield',
		            fieldLabel: '室内外综合覆盖需求',
		            id: 'inoutdoor_cover_need',
		            name: 'inoutdoor_cover_need',
		            labelWidth: 120,
		            value: ''
		        },
		        {
		            xtype: 'textfield',
		            fieldLabel: '室内分布系统需求',
		            id: 'indoor_ds_need',
		            name: 'indoor_ds_need',
		            labelWidth: 120,
		            value: ''
		        },
		        {
		            xtype: 'textfield',
		            fieldLabel: '预留字段1',
		            id: 'resv_1',
		            name: 'resv_1',
		            labelWidth: 120,
		            value: ''
		        },
		        {
		            xtype: 'textfield',
		            fieldLabel: '预留字段2',
		            id: 'resv_2',
		            name: 'resv_2',
		            labelWidth: 120,
		            value: ''
		        },
		        {
		            xtype: 'textfield',
		            fieldLabel: '预留字段3',
		            id: 'resv_3',
		            name: 'resv_3',
		            labelWidth: 120,
		            value: ''
		        },
		        {
		            xtype: 'textfield',
		            fieldLabel: '预留字段4',
		            id: 'resv_4',
		            name: 'resv_4',
		            labelWidth: 120,
		            value: ''
		        },
		        {
		            xtype: 'textfield',
		            fieldLabel: '预留字段5',
		            id: 'resv_5',
		            name: 'resv_5',
		            labelWidth: 120,
		            value: ''
		        },
		        {
		            xtype: 'textfield',
		            fieldLabel: '预留字段6',
		            id: 'resv_6',
		            name: 'resv_6',
		            labelWidth: 120,
		            value: ''
		        },
		        {
		            xtype: 'textfield',
		            fieldLabel: '预留字段7',
		            id: 'resv_7',
		            name: 'resv_7',
		            labelWidth: 120,
		            value: ''
		        },
		        {
		            xtype: 'textfield',
		            fieldLabel: '预留字段8',
		            id: 'resv_8',
		            name: 'resv_8',
		            labelWidth: 120,
		            value: ''
		        },
		        {
		            xtype: 'textfield',
		            fieldLabel: '预留字段9',
		            id: 'resv_9',
		            name: 'resv_9',
		            labelWidth: 120,
		            value: ''
		        },
		        {
		            xtype: 'textfield',
		            fieldLabel: '预留字段10',
		            id: 'resv_10',
		            name: 'resv_10',
		            labelWidth: 120,
		            value: ''
		        }
		    ]
		}
    ],
    buttonAlign: 'center',
    buttons: [
		{
		    text: '确认',
		    handler: function ()
		    {
		        var item = this.up('window').saveData();
		    }
		},
		{
		    text: '关闭',
		    handler: function ()
		    {
		        this.up('window').cancelData();
		    }
		}
    ],
    changeScene: function (newType)
    {
        var cmp = Ext.getCmp('scene_name');
        if (!cmp)
            return;

        if (Ext.isEmpty(newType))
        {
            if (cmp)
            {
                cmp.setValue(null);
                cmp.store.removeAll();
            }

            return;
        }

        cmp.store.reload({ scene_type: newType, province_id: this.province_id, city_id: this.city_id });
    },
    changePhygrid: function (newType)
    {
        var cmp = Ext.getCmp('phygrid_type');
        if (!cmp)
            return;

        cmp.setValue(newType);
    },
    loadData: function ()
    {
        var form = this.items.get(0);
        if (this.problem && form)
        {
            var scene_type = Ext.getCmp('scene_type');
            scene_type.clearValue();
            scene_type.store.reload({ city_id: this.city_id });
            scene_type.setValue(this.problem.scene_type || '');
            var scene_name = Ext.getCmp('scene_name');
            scene_name.clearValue();
            scene_name.setValue(this.problem.scene_name || '');
            var phygrid_id = Ext.getCmp('phygrid_id');
            phygrid_id.clearValue();
            phygrid_id.store.reload({ city_id: this.city_id });
            phygrid_id.setValue(this.problem.phygrid_id || '');
            var phygrid_type = Ext.getCmp('phygrid_type');
            phygrid_type.setValue(this.problem.phygrid_type);

            var problem_source = Ext.getCmp('problem_source');
            problem_source.setValue(this.problem.problem_source);
            var slove_means = Ext.getCmp('slove_means');
            slove_means.setValue(this.problem.slove_means);
            var station_need = Ext.getCmp('station_need');
            station_need.setValue(this.problem.station_need);
            var inoutdoor_cover_need = Ext.getCmp('inoutdoor_cover_need');
            inoutdoor_cover_need.setValue(this.problem.inoutdoor_cover_need);
            var indoor_ds_need = Ext.getCmp('indoor_ds_need');
            indoor_ds_need.setValue(this.problem.indoor_ds_need);


            var resv_1 = Ext.getCmp('resv_1');
            resv_1.setValue(this.problem.resv_1);
            var resv_2 = Ext.getCmp('resv_2');
            resv_2.setValue(this.problem.resv_2);
            var resv_3 = Ext.getCmp('resv_3');
            resv_3.setValue(this.problem.resv_3);
            var resv_4 = Ext.getCmp('resv_4');
            resv_4.setValue(this.problem.resv_4);
            var resv_5 = Ext.getCmp('resv_5');
            resv_5.setValue(this.problem.resv_5);
            var resv_6 = Ext.getCmp('resv_6');
            resv_6.setValue(this.problem.resv_6);
            var resv_7 = Ext.getCmp('resv_7');
            resv_7.setValue(this.problem.resv_7);
            var resv_8 = Ext.getCmp('resv_8');
            resv_8.setValue(this.problem.resv_8);
            var resv_9 = Ext.getCmp('resv_9');
            resv_9.setValue(this.problem.resv_9);
            var resv_10 = Ext.getCmp('resv_10');
            resv_10.setValue(this.problem.resv_10);
        }
    },
    cancelData: function ()
    {
        this.layer.RestoreLocation(this.problem);
        this.hide();
    },
    saveData: function ()
    {
        var form = this.items.get(0);
        if (!form.isValid())
        {
            Ext.Msg.alert('提示', '部分输入信息不满足要求，请确认!');
            return;
        }

        var problem = this.problem;
        var paraproblem = Ext.clone(problem);

        paraproblem.scene_type = Ext.getCmp('scene_type').getValue();
        paraproblem.scene_name = Ext.getCmp('scene_name').getValue();
        paraproblem.phygrid_type = Ext.getCmp('phygrid_type').getValue();
        paraproblem.phygrid_id = Ext.getCmp('phygrid_id').getValue();

        paraproblem.problem_source = Ext.getCmp('problem_source').getValue();
        paraproblem.slove_means = Ext.getCmp('slove_means').getValue();
        paraproblem.station_need = Ext.getCmp('station_need').getValue();
        paraproblem.inoutdoor_cover_need = Ext.getCmp('inoutdoor_cover_need').getValue();
        paraproblem.indoor_ds_need = Ext.getCmp('indoor_ds_need').getValue();

        paraproblem.resv_1 = Ext.getCmp('resv_1').getValue();
        paraproblem.resv_2 = Ext.getCmp('resv_2').getValue();
        paraproblem.resv_3 = Ext.getCmp('resv_3').getValue();
        paraproblem.resv_4 = Ext.getCmp('resv_4').getValue();
        paraproblem.resv_5 = Ext.getCmp('resv_5').getValue();
        paraproblem.resv_6 = Ext.getCmp('resv_6').getValue();
        paraproblem.resv_7 = Ext.getCmp('resv_7').getValue();
        paraproblem.resv_8 = Ext.getCmp('resv_8').getValue();
        paraproblem.resv_9 = Ext.getCmp('resv_9').getValue();
        paraproblem.resv_10 = Ext.getCmp('resv_10').getValue();

        var win = this;
        var uri = '/web/jss/map.jss?action=map.SaveProblem';
        if (!Ext.String.startsWith(uri, APPBASE))
            uri = APPBASE + uri;

        var para = { args: Ext.encode({ problem: paraproblem, project_id: this.project_id, province_id: this.province_id, city_id: this.city_id }) };
        Ext.Ajax.request({
            url: uri,
            params: para,
            method: 'post',
            async: false,
            success: function (resp)
            {
                var result;
                try
                {
                    if (resp.timedout)
                        throw '保存问题数据超时!';

                    result = resp.responseText;
                    if (resp.status != 200)
                        throw '网络异常(' + resp.status + '): ' + resp.statusText;

                    result = Ext.decode(result);
                    if (!result.success)
                        throw result.msg;

                    problem.status = 'load';
                    problem.scene_type = paraproblem.scene_type;
                    problem.scene_name = paraproblem.scene_name;
                    problem.phygrid_type = paraproblem.phygrid_type;
                    problem.phygrid_id = paraproblem.phygrid_id;

                    problem.id = problem.problem_id = result.problem_id;
                    problem.name = problem.problem_source = paraproblem.problem_source;
                    problem.slove_means = paraproblem.slove_means;
                    problem.station_need = paraproblem.station_need;
                    problem.inoutdoor_cover_need = paraproblem.inoutdoor_cover_need;
                    problem.indoor_ds_need = paraproblem.indoor_ds_need;

                    problem.resv_1 = paraproblem.resv_1;
                    problem.resv_2 = paraproblem.resv_2;
                    problem.resv_3 = paraproblem.resv_3;
                    problem.resv_4 = paraproblem.resv_4;
                    problem.resv_5 = paraproblem.resv_5;
                    problem.resv_6 = paraproblem.resv_6;
                    problem.resv_7 = paraproblem.resv_7;
                    problem.resv_8 = paraproblem.resv_8;
                    problem.resv_9 = paraproblem.resv_9;
                    problem.resv_10 = paraproblem.resv_10;

                    win.hide();
                }
                catch (e)
                {
                    throw e;
                }
            },
            failure: function (resp)
            {
                Ext.Msg.alert('保存问题信息失败', resp.responseText);
            }
        });
    }
});

Ext.define('MyApp.map.ProblemLayer', {
    extend: 'MyApp.map.SketchLayer',
    alias: 'widget.problem_layer',
    uri: '/web/jss/map.jss?action=map.GetProlem',
    deluri: '/web/jss/map.jss?action=map.DelProblem',
    saveuri: '/web/jss/map.jss?action=map.SaveProblem',
    minBound: 2000,     // 取最小范围(半径、米)的数据
    maxBound: 50000,    // 取最大范围(半径、米)的数据
    polygon_alpha: 0.3,
    SketchPens: {
        Polygon: {
            text: '多边形', name: 'addpolygon', type: 'Polygon', btntip: '绘制问题图层多边形', icon: Ext.Loader.getPath('MyApp') + '/images/icon/polygon.png',
            disabled: true, drawtip: '双击结束绘制'
        }
    },
    GetAddButton: function () { return this.map.toolbar.items.findBy(function (it) { return it.name == 'addpolygon' }); },
    GetDelButton: function () { return this.map.toolbar.items.findBy(function (it) { return it.name == 'delpolygon' }); },
    constructor: function ()
    {

        this.__problem_win = Ext.create('MyApp.map.ProblemWin');
        Object.defineProperties(this, {
            mapSel: { value: {} /*选择集*/ },
            __project_id: { value: '', writable: true },
            __net_type: { value: '', writable: true },
            __project_name: { value: '', writable: true },
            __province_id: { value: '', writable: true },
            __city_id: { value: '', writable: true },
            __user_id: { value: '', writable: true },
        });
        this.callParent(arguments);
    },
    OnInitUpdate: function (canvas, tile)
    {
        this.callParent(arguments);
        var tbar = this.map.toolbar;

        tbar.add({
            xtype: 'button', name: 'delpolygon', tooltip: '删除问题多边形', icon: Ext.Loader.getPath('MyApp') + '/images/icon/delpolygon.png',
            disabled: true, scope: this, handler: function ()
            {
                this.OnDelProblems(this.mapSel);
            }
        });
    },
    OnDestroy: function ()
    {
        this.task.Stop();
        this.callParent(arguments);
    },
    __setMenuBtn: function (isvisibleupdate, isnoupdate)
    {
        var btnadd = this.GetAddButton(), btndel = this.GetDelButton();
        if (btnadd)
        {
            btnadd.setVisible(isvisibleupdate);
            btnadd.setDisabled(isnoupdate);
        }
        if (btndel)
        {
            btndel.setVisible(isvisibleupdate);
            btndel.setDisabled(isnoupdate);
        }
    },
    OnQuery: function (condition)
    {
        var conds = condition.requestConditions || [], cond;
        for (var i = 0, n = conds.length; i < n; i++)
        {
            cond = conds[i];
            if (Ext.String.Compare(cond.name, "project_id", true) == 0)
                this.__project_id = cond.value;
            else if (Ext.String.Compare(cond.name, "project_name", true) == 0)
                this.__project_name = cond.value;
            else if (Ext.String.Compare(cond.name, "net_type", true) == 0)
                this.__net_type = cond.value;
            else if (Ext.String.Compare(cond.name, "province_id", true) == 0)
                this.__province_id = cond.value;
            else if (Ext.String.Compare(cond.name, "city_id", true) == 0)
                this.__city_id = cond.value;
            else if (Ext.String.Compare(cond.name, "user_id", true) == 0)
                this.__user_id = cond.value;
        }

        // 测试构造数据
        //this.__province_id = '104';
        //this.__city_id = '10401';
        //this.__project_id = '1111';

        this.PostLoad();
    },
    OnLoad: function (result, error)
    {
        if (error)
        {
            this.__setMenuBtn(true, true);
            throw error;
        }

        this.__setMenuBtn(true, false);

        var table = result.shetchs;
        var hr = table[0], tile = this.tile;
        var cls = Ext.ClassManager.getByAlias('widget.SketchPolygon');
        var n = table.length - 1;
        var items = this.items, it, pt, pts;
        this.items.length = n;

        var ptsindex = hr.length;
        while (ptsindex-- > 0)
        {
            if (Ext.String.Compare(table[0][ptsindex].Name, "pts", true) == 0)
                break;
        }

        if (ptsindex < 0)
            throw '问题图层无坐标数据！';

        for (var i = 0; i < n; i++)
        {
            var row = table[i + 1];
            it = new cls(row, hr, [])
            it.type = 'Polygon';
            it.status = 'load';

            pt = MyMapBase.GeographicToLogical({ longitude: it.longitude, latitude: it.latitude });
            it.x = pt.x;
            it.y = pt.y; // 网格中心点坐标
            pt = MyMapBase.GeographicToLogical({ longitude: it.minlongitude, latitude: it.minlatitude });
            it.left = pt.x;
            it.bottom = pt.y;
            pt = MyMapBase.GeographicToLogical({ longitude: it.maxlongitude, latitude: it.maxlatitude });
            it.right = pt.x;
            it.top = pt.y;
            it.width = Math.abs(it.left - it.right);
            it.height = Math.abs(it.top - it.bottom);

            pts = it.pts;
            it.pts = [];
            for (var j = 0, m = pts.length; j < m; j++)
            {
                pt = MyMapBase.GeographicToLogical({ longitude: pts[j][0], latitude: pts[j][1] });
                it.pts.push({ longitude: pts[j][0], latitude: pts[j][1], x: pt.x, y: pt.y });
            }

            items[i] = it;
        }

        this.task.Add(this.Invalidate, this);
    },
    GetPropertyInfo: function (item)
    {
        if (item instanceof MyApp.map.Areagrid)
        {
            var rs = [];
            rs.push(["1、常规", "问题标识", item.id]);
            rs.push(["1、常规", "问题来源", item.name]);
            rs.push(["1、常规", "解决手段", item.slove_means]);
            rs.push(["1、常规", "基站需求", item.station_need]);

            return { title: '问题信息', data: rs };
        }
    },
    GetFillStyle: function (it)
    {
        var kpi = this.GetKPI('element_kpi');
        var color;
        if (!Ext.isEmpty(kpi))
            color = kpi.GetKPIColorRGB(it)
        return (!Ext.isEmpty(color)) ? MyApp.util.Common.rgba(color[0], color[1], color[2], this.polygon_alpha) : null;
    },
    ShowProblemWin: function (item)
    {
        var win = this.__problem_win;
        if (win)
        {
            win.project_id = this.__project_id;
            win.province_id = this.__province_id;
            win.city_id = this.__city_id;
            win.problem = item;
            win.layer = this;
            win.show();
            win.loadData(item);
        }
    },
    OnDblClick: function (e)
    {
        var isfinish = false;
        if (this.__cur_pen)
        {
            if (Ext.isFunction(this.__cur_item.OnDblClick))
            {
                isfinish = this.__cur_item.OnDblClick(); // 判断绘制的对象是否满足要求，如果返回为false则进行删除
                if (!isfinish)
                    this.RemoveItem(this.__cur_item);
            }
            if (isfinish && (this.__cur_item || this.__hot))
            {
                var it = this.__cur_item || this.__hot;
                this.ShowProblemWin(it);
            }
            this.__cur_item = undefined;

            if (this.__cur_pen.state != this.__pen_states.create)
                this.__cur_pen = undefined;
        }
        return true;
    },
    OnMouseUp: function (e)
    {
        if (this.__cur_pen.state == this.__pen_states.move && this.__cur_item)
            this.ShowProblemWin(this.__hot);

        this.callParent(arguments);
    },
    SelectItem: function (item, append, e)
    {
        try
        {
            //append = false; // 当前图层由于要拖动、绘制等，所以只支持选中一个
            var mapSel = this.mapSel, id = item ? item.id : undefined;
            if (append)
            {
                if (Ext.isEmpty(id) || id in mapSel)
                    return;

                mapSel[id] = item;
                this.Invalidate();
            }
            else
            {
                var c = 0;
                for (var i in mapSel)
                {
                    if (i == id)
                        continue;

                    delete mapSel[i];
                    c++;
                }

                if (Ext.isEmpty(id) || id in mapSel)
                {
                    if (!c)
                        return;
                }
                else
                    mapSel[id] = item;

                this.Invalidate();
            }
        }
        catch (e)
        {
            ;
        }
    },
    IsSelected: function (item)
    {
        if (Ext.isArray(item))
        {
            var i = 0, result = false;
            while (item[i])
            {
                result = item[i] && this.mapSel[item[i].id];
                if (result)
                    return result;
                i++;
            }
        }
        else
            return item && !Ext.isEmpty(this.mapSel[item.id]);
    },
    OnDelProblems: function (delsel)
    {
        if (!Ext.isEmpty(delsel) && !$.isEmptyObject(delsel))
        {
            var isok = window.confirm("是否确认删除问题多边形？");
            if (isok)
            {
                var ids = [], it;
                for (var id in delsel)
                {
                    it = delsel[id];
                    if (it && it.status == this.__sketch_states.load)
                        ids.push(id);
                }

                var uri = this.deluri;
                if (!Ext.String.startsWith(uri, APPBASE))
                    uri = APPBASE + uri;
                var fn = this.task.pass(this.__delproblems, this, delsel);
                Ext.Ajax.request({
                    url: uri,
                    method: "POST",
                    params: { args: Ext.encode({ project_id: this.__project_id, ids: ids }) },
                    success: fn,
                    failure: fn
                });
            }
        }
    },
    __delproblems: function (delsel, resp, c)
    {
        var result;
        try
        {
            if (resp.timedout)
                throw '删除选择的问题多边形数据超时!';

            result = resp.responseText;
            if (resp.status != 200)
                throw '网络异常(' + resp.status + '): ' + resp.statusText;

            result = Ext.decode(result);
            if (!result.success)
                throw result.msg;

            for (var id in delsel)
            {
                this.RemoveItem(delsel[id]);
                delete delsel[id];
            }
        }
        catch (e)
        {
            throw e;
        }

        this.Invalidate();
    }
});