Ext.require('MyApp.map.CellLayer', function ()
{
    Ext.define('MyApp.map.PlanIndoor', {
        extend: 'MyApp.map.Element',
        alternateClassName: 'MyMapPlanIndoor',
        alias: 'widget.PlanIndoor',
        left: 1,
        top: 1,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        status: undefined/*add:图层中绘制增加，load:通过数据库数据生成*/,
        __premovept: undefined/*记录鼠标移动时的前一个鼠标坐标点*/,
        inheritableStatics:
        {
            GetImpl: function (hr, add_fields)
            {
                var t = MyMapBase.GetImplByJTH(hr, this, add_fields);

                return t;
            }
        },
        constructor: function (it, hr, add_fields)
        {
            this.callParent(arguments);

            var nCol = hr.length, name, i, cfg = {};
            for (i = 0; i < nCol; i++)
            {
                name = hr[i];
                if (Ext.isObject(name))
                    name = Ext.isEmpty(name.Name) ? name.name : name.Name;
                name = name.toLowerCase();
                cfg[name] = it[i];
            }

            if (add_fields)
            {
                var n = add_fields.length;
                n += nCol;
                for (; i < n; i++)
                {
                    name = add_fields[i];
                    cfg[name] = it[i];
                }
            }
            Ext.apply(this, cfg);
        }
    });

    // 辅助规划室分
    Ext.define('MyApp.map.PlanIndoorLayer', {
        extend: 'MyApp.map.CellLayer',
        alias: 'widget.planindoor_layer',
        img: Ext.apply(new Image(), { src: Ext.Loader.getPath('MyApp') + '/images/icon/bts_indoor.png' }),
        img_lock: Ext.apply(new Image(), { src: Ext.Loader.getPath('MyApp') + '/images/icon/fdd_indoor.png' }),
        uri: '/web/jss/map.jss?action=map.GetPlanIndoorSite',
        lockuri: '/web/jss/map.jss?action=map.LockPlanIndoorSite',
        sel_fill: 'rgba(255,0,0,1)',
        sel_scale: 1,
        isoffset: false,
        __selectmenu: undefined,
        constructor: function ()
        {
            var __visible = true, __disable = false;
            Object.defineProperties(this, {
                __hot_arr: { value: [] },
                __project_id: { value: '', writable: true },
                __net_type: { value: '', writable: true },
                __project_name: { value: '', writable: true },
                __province_id: { value: '', writable: true },
                __city_id: { value: '', writable: true },
                __user_id: { value: '', writable: true },
                __btn_visible:
                    {
                        set: function (v)
                        {
                            __visible = v;
                            var btnlock = this.GetLockButton(), btnunlock = this.GetUnlockButton();
                            if (btnlock) btnlock.setVisible(__visible);
                            if (btnunlock) btnunlock.setVisible(__visible);
                        },
                        get: function () { return __visible; }
                    },
                __btn_disable:
                    {
                        set: function (v)
                        {
                            __disable = v;
                            var btnlock = this.GetLockButton(), btnunlock = this.GetUnlockButton();
                            if (btnlock) btnlock.setDisabled(__disable);
                            if (btnunlock) btnunlock.setDisabled(__disable);
                        },
                        get: function () { return __disable; }
                    }
            });

            this.__selectmenu = Ext.create('Ext.menu.Menu', {
                shadow: 'drop',
                shadowOffset: 10,
                listeners: { hide: function () { } },
                afterRender: function () { this.self.prototype.afterRender.apply(this, arguments); this.el.enableShadow(); }
            });

            this.callParent(arguments);
        },
        GetLockButton: function () { return this.map.toolbar.items.findBy(function (it) { return it.text == '锁定室分' }); },
        GetUnlockButton: function () { return this.map.toolbar.items.findBy(function (it) { return it.text == '解锁室分' }); },
        OnInitUpdate: function ()
        {
            this.callParent(arguments);

            var tbar = this.map.toolbar;
            tbar.add({
                xtype: 'button', text: '锁定室分', hidden: !this.Visible, disabled: true, scope: this, handler: function ()
                {
                    this.OnLockItems(this.mapSel, this.__user_id);
                }
            });
            tbar.add({
                xtype: 'button', text: '解锁室分', hidden: !this.Visible, disabled: true, scope: this, handler: function ()
                {
                    this.OnLockItems(this.mapSel, '');
                }
            });
        },
        GetCellImg: function (it)
        {
            return (Ext.isEmpty(it.stat_flag)) ? this.img : this.img_lock;
        },
        GetTip: function (it)
        {
            if (it instanceof MyApp.map.Cell)
                return '<span style="white-space: nowrap"><b>室分站点: </b>' + Ext.String.htmlEncode(it.name) + '</span>';
        },
        GetPropertyInfo: function (item)
        {
            if (Ext.isNumber(item) && item > -1)
            {
                var polycells = this.pbound[item * 5 + 4];
                item = polycells.length > 0 ? polycells[0] : item;
            }
            if (item instanceof MyApp.map.Cell)
            {
                var rs = [];
                rs.push(["1、基本信息", "省份", item.province_name]);
                rs.push(["1、基本信息", "地市", item.city_name]);
                rs.push(["1、基本信息", "所属区县", item.related_county]);
                rs.push(["1、基本信息", "工程ID", item.project_id]);
                rs.push(["1、基本信息", "工程名", item.project_name]);
                rs.push(["1、基本信息", "地域类型", item.region_type]);
                rs.push(["1、基本信息", "区域类型", item.area_type]);
                rs.push(["1、基本信息", "区域子类型", item.area_subtype]);
                rs.push(["1、基本信息", "区域名", item.area_name]);
                rs.push(["1、基本信息", "楼宇名", item.building_name]);
                rs.push(["1、基本信息", "类型", item.building_type]);
                rs.push(["1、基本信息", "建筑面积(万m2)", item.building_area]);
                rs.push(["1、基本信息", "楼宇分类", item.building_class]);
                rs.push(["1、基本信息", "所属物理网格", item.phygrid_name]);
                rs.push(["1、基本信息", "覆盖方式", item.cover_method]);
                rs.push(["1、基本信息", "分布系统类型", item.ds_type]);
                rs.push(["1、基本信息", "分布系统建设类别", item.ds_building_type]);

                return { title: '室分站点信息', data: rs };
            }
        },
        OnQuery: function (condition)
        {
            // 记录工程ID、工程名称、网络制式类型
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
            //this.__province_id = '130';
            //this.__city_id = '13001';
            //this.__project_id = '1220';
            //this.__net_type = 'cover_room';
            //this.__user_id = 'zoush';

            if (!Ext.String.Compare(this.__net_type, 'cover_room', true))
                this.__btn_visible = true;
            else
                this.__btn_visible = false;

            this.PostLoad();
        },
        OnLoad: function (result, error)
        {
            if (error)
            {
                this.__btn_disable = true;
                throw error;
            }

            this.__btn_disable = false;

            delete this.__hot_cell;
            delete this.__hot_arr;

            var table = result.cells, hr = table[0];
            var cls = Ext.ClassManager.getByAlias('widget.PlanIndoor'), tile = this.tile;
            var n = table ? table.length - 1 : 0;
            var cells = this.cells, unit = this.UNIT, it;
            cells.length = n;
            for (var i = 0; i < n; i++)
            {
                it = new cls(table[i + 1], table[0], []);
                if (Ext.isEmpty(it.x))
                    MyMapBase.GeographicToLogical(it);

                it.x *= unit;
                it.y *= unit;
                it.offset = 0;
                it.offsetDirection = 0;
                it.polygon = -1;
                cells[i] = it;
            }

            this.task.Add(this.Invalidate, this);
        },
        HitTest: function (cx, cy, e)
        {
            var cells = this.cells, nCell = cells.length;
            if (nCell == 0)
                return;

            var tile = this.tile;
            var scale = tile.canvasWidth / tile.ViewportW, dx = tile.ViewportX * scale, dy = tile.ViewportY * scale;
            scale /= this.UNIT;

            var ci = this.__hot_cell, cell_scale = this.cell_scale, x, y, a, cis = [];
            do
            {
                if (ci instanceof MyMapCell)
                {
                    x = ci.x * scale - dx;
                    y = ci.y * scale - dy;
                    if (ci.offset)
                    {
                        a = ci.offsetDirection * Math.PI / 180;
                        x += Math.sin(a) * ci.offset * cell_scale;
                        y -= Math.cos(a) * ci.offset * cell_scale;
                    }
                    if (this.PtInCell(cx, cy, ci, x, y, ci.radius * cell_scale * 1.2 * (this.IsSelected(ci) ? this.sel_scale : 1)))
                        break;
                }

                ci = null;
                for (var i = nCell, it; i-- > 0;)
                {
                    it = cells[i];
                    x = it.x * scale - dx;
                    y = it.y * scale - dy;
                    if (it.offset)
                    {
                        a = it.offsetDirection * Math.PI / 180;
                        x += Math.sin(a) * it.offset * cell_scale;
                        y -= Math.cos(a) * it.offset * cell_scale;
                    }
                    if (this.PtInCell(cx, cy, it, x, y, it.radius * cell_scale * (this.IsSelected(it) ? this.sel_scale : 1)))
                    {
                        cis.push(it);
                        if (!ci)
                            ci = it;
                    }
                }

            } while (false);

            this.__hot_cell = ci;
            this.__hot_arr = cis;
            this.Invalidate();
            return ci;
        },
        __selectitem: function (item, append)
        {
            try
            {
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
        __selectitem_menu: function (append, e)
        {
            this.__selectmenu.removeAll(true);
            var its = this.__hot_arr, checked, layer = this, isctrlkey = this.map.ctrlKey;

            for (var i = 0, it, n = this.__hot_arr.length; i < n; i++)
            {
                it = its[i];
                checked = this.IsSelected(it);
                this.__selectmenu.add([{
                    xtype: 'menucheckitem',
                    text: it.id + ' (' + it.name + ')',
                    checked: checked,
                    context_item: it,
                    listeners:
                        {
                            click: function ()
                            {
                                layer.__selectitem(this.context_item, append);
                                if (!append)
                                {
                                    var mis = this.parentMenu.items;
                                    for (var k = 0, m = mis.length, mi; k < m; k++)
                                    {
                                        mi = mis.getAt(k);
                                        if (mi !== this)
                                            mi.setChecked(false);
                                    }
                                }
                                this.setChecked(layer.IsSelected(this.context_item));
                            }
                        }
                }]);
            }
            this.__selectmenu.showAt(e.getXY());
        },
        SelectItem: function (item, append, e)
        {
            try
            {
                if (!append)
                    this.__selectitem(undefined, append);

                if (this.__hot_arr.length > 1)
                    this.__selectitem_menu(append, e);
                else
                    this.__selectitem(item, append);
            }
            catch (ex)
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
                return item && this.mapSel[item.id];
        },
        OnItemClick: function (item, layer, e)
        {
            this.callParent(arguments);

            if (layer && this.PropertyWnd && this.PropertyWnd.isVisible())
                this.ShowProperty(this.GetPropertyInfo(item, layer));
        },
        __showProperty: function (item)
        {
            this.map.ShowProperty(this.GetPropertyInfo(item));
        },
        OnItemDblClick: function (item, layer, e)
        {
            var n = this.__hot_arr.length;
            if (n > 1 && this.__selectmenu)
            {
                this.__selectmenu.removeAll(true);
                var its = this.__hot_arr, layer = this;

                for (var i = 0, it; i < n; i++)
                {
                    it = its[i];
                    this.__selectmenu.add([{
                        text: it.id + ' (' + it.name + ')',
                        context_item: it,
                        listeners:
                            {
                                click: function ()
                                {
                                    layer.__showProperty(this.context_item);
                                }
                            }
                    }]);
                }
                this.__selectmenu.showAt(e.getXY());
            }
            else if (item)
                this.__showProperty(item);

            return true;
        },
        OnLockItems: function (items, lockflag)
        {
            if (!Ext.isEmpty(items))
            {
                var lockcn = !Ext.isEmpty(lockflag) ? "锁定" : "解锁";
                var isok = window.confirm("是否确认" + lockcn + "选中的站点？");
                var errlock = [];
                if (isok)
                {
                    // 获取要锁定的id集合
                    var ids = [], it;
                    for (var i in items)
                    {
                        it = items[i];
                        ids.push(it.id);

                        if (!Ext.isEmpty(it.lock) && Ext.String.Compare(this.__user_id, it.stat_flag) != 0)
                            errlock.push(it.id);
                    }

                    var fn = this.task.pass(this.__lockItems, this, items, lockflag, errlock);

                    var uri = this.lockuri;
                    if (!Ext.String.startsWith(uri, APPBASE))
                        uri = APPBASE + uri;

                    Ext.Ajax.request({
                        url: uri,
                        method: "POST",
                        params: { args: Ext.encode({ project_id: this.__project_id, ids: ids, lock: lockflag, user_id: this.__user_id }) },
                        success: fn,
                        failure: fn
                    });
                }
            }
        },
        __lockItems: function (items, lockflag, errlock, resp, c)
        {
            if (resp.timedout)
                throw '设置逻辑站址锁定状态超时!';

            if (resp.status != 200)
                throw '网络异常(' + resp.status + '): ' + resp.statusText;

            var result = Ext.decode(resp.responseText);
            if (!Ext.isEmpty(result.success) && !result.success)
                throw result.msg;
            else if (!Ext.isEmpty(result.error))
                throw result.error;

            var it;
            for (var i in items)
            {
                it = items[i];
                if (it && errlock.indexOf(it.id) == -1)
                    it.stat_flag = lockflag;
            }

            this.Invalidate();

            if (!Ext.isEmpty(lockflag) && !Ext.isEmpty(errlock))
                Ext.Msg.alert('以下室分站点已被其他用户锁定，您不能再进行锁定，室分站点ID：</br>' + errlock);
            else if (Ext.isEmpty(lockflag) && !Ext.isEmpty(errlock))
                Ext.Msg.alert('以下室分站点被其他用户锁定，您不能解锁，室分站点ID：</br>' + errlock);
        }
    });
});