Ext.define('MyApp.map.plugin.Subject', {
    extend: 'Ext.AbstractPlugin',
    alias: 'plugin.subject',
    text: '',
    constructor: function ()
    {
        var kdim = undefined;
        Object.defineProperties(this, {
            __dimbtns: { value: [] },
            __kpidim: {
                get: function () { return kdim; },
                set: function (v)
                {
                    kdim = v;
                    //kdim = {
                    //    refresh: true,
                    //    dims: [
                    //        {//第一级
                    //            field: 'apptype', text: '应用大类', pfield: '',
                    //            sources: [{ text: '即时通信', value: '1' }, { text: '微博', value: '3' }]
                    //        },
                    //        {//第二级
                    //            field: 'subapptype', text: '应用小类', pfield: 'apptype',
                    //            sources: {
                    //                '1': [{ text: '微信', value: '微信' }, { text: 'QQ', value: 'QQ' }],
                    //                '3': [{ text: '新浪微博', value: '新浪微博' }, { text: '腾讯微博', value: '腾讯微博' }]
                    //            }
                    //        },
                    //        {//独立
                    //            field: 'hour', text: '时间', pfield: '', autoplay: 3000,
                    //            sources: [{ text: '12点', value: '12点' }, { text: '13点', value: '13点' }]
                    //        }
                    //    ]
                    //}; // 样例

                    this.__last_dimitem = {};
                    this.__played_btn = undefined;
                    this.setDimMenu(kdim);

                    if (this.timer)
                        clearInterval(this.timer);

                    // 查找需要定时播放的字段菜单
                    var btns = this.__dimbtns, btn;
                    if (kdim && btns.length > 0)
                    {
                        for (var i = 0, n = btns.length; i < n; i++)
                        {
                            btn = btns[i];
                            if (btn.autoplay)
                            {
                                this.__played_btn = btn;
                                this.timer = setTimeout(setInterval("this.__autoplaydim()", 2000), 3000);
                                break;
                            }
                        }
                    }
                }
            }
        });

        this.callParent(arguments);
    },
    init: function (map)
    {
        var tbar = map.toolbar;
        this.__btn = tbar.add({
            xtype: 'button', text: this.text, menuAlign: 'tl-bl', hidden: true,
            menu: {
                __defaults: { xtype: 'menucheckitem', hideOnClick: true, group: map.getAutoId(), groupCls: '', scope: this, handler: this.onMenuClick },
                defaults: function (config)
                {
                    if (Ext.isObject(config) && !config.xtype)
                        return this.__defaults;
                },
                items: []
            }
        });
    },
    destroy: function ()
    {
        this.callParent(arguments);
    },
    enable: function ()
    {
        this.callParent(arguments);
        if (this.__btn)
            this.__btn.enable();
        if (this.__btndim)
            this.__btndim.enable();
    },
    disable: function ()
    {
        this.callParent(arguments);
        if (this.__btn)
            this.__btn.disable();
        if (this.__btndim)
            this.__btndim.disable();
    },
    show_layers: function (ls)
    {
        var layers = this.cmp.layers, last_layers = this.__layers;
        ls = ls ? (Ext.isArray(ls) ? ls : [ls]) : [];
        for (var i = layers.length, layer; i-- > 0;)
        {
            layer = layers[i];
            if (!layer.name || this.isbase)
                continue;

            if (Ext.Array.indexOf(ls, layer.name) >= 0)
                layer.dummy = false;
            else if (last_layers && Ext.Array.indexOf(last_layers, layer.name) >= 0)
                layer.dummy = true;
        }

        this.__layers = ls;
    },
    __clickMenum: function (item, menu, ischeck)
    {
        var it;
        for (var i = 0, n = menu.items.length; i < n; i++)
        {
            it = menu.items.getAt(i);
            if (!Ext.isEmpty(it.menu))
            {
                this.__clickMenum(item, it.menu, ischeck);
            }
            else if (it !== item)
                it.setChecked(false);
        }
    },
    onMenuClick: function (item, e)
    {
        if (this.__last_item === item)
            return;

        // 取消其他被选中的菜单项
        var btn = this.__btn;
        if (btn)
        {
            this.__clickMenum(item, btn.menu, false);
        }

        if (this.__last_item && this.__last_item.fn)
            this.__last_item.fn(this.cmp, false);

        this.__last_item = item;
        if (!item)
            return;

        if (Ext.isFunction(item.fn))
            item.fn(this.cmp, true);

        this.show_layers(item.layers);
        btn.setText(item.text);
    },
    setMenu: function (its)
    {
        this.show_layers();
        this.onMenuClick();

        var btn = this.__btn;
        if (!btn)
            return;

        btn.setText(this.text);
        btn.menu.removeAll();

        /*******************************************************/
        // 配置的kpi,fn如果为字符串则转为对应名称的函数或对象
        if (Ext.isArray(its))
        {
            var item, submenu = {}, menuit, chkit;
            var menucfg = { xtype: 'menucheckitem', hideOnClick: true, group: this.cmp.getAutoId(), groupCls: '', scope: this, handler: this.onMenuClick };
            for (var i = 0, n = its.length; i < n; i++)
            {
                item = its[i];
                if (!Ext.isEmpty(item.kpi) && Ext.isString(item.kpi))
                    item.kpi = eval("this.cmp." + item.kpi);
                if (!Ext.isFunction(item.fn))
                    item.fn = eval("this.cmp." + item.fn);

                if (!Ext.isEmpty(item.menugroup))
                {
                    /************************************************/
                    var menus = item.menugroup.split('.'), premenu, m = menus.length, premenuname = '';
                    for (var k = 0; k < m; k++)
                    {
                        menuname = !Ext.isEmpty(premenuname) ? premenuname + '.' + menus[k] : menus[k];
                        if (!submenu[menuname])
                        {
                            submenu[menuname] = new Ext.menu.Menu();
                            if (k == 0)
                                btn.menu.add({ xtype: 'menuitem', text: menus[k], menu: submenu[menuname] });
                            else
                                premenu.add({ xtype: 'menuitem', text: menus[k], menu: submenu[menuname] });
                        }
                        premenu = submenu[menuname];
                        premenuname = menuname;
                    }

                    if (m > 0 && premenu)
                    {
                        premenu.add(Ext.applyIf(item, menucfg));
                        menuit = premenu.items.getAt(premenu.items.length - 1);
                        if (menuit.checked)
                            chkit = menuit;
                    }
                    /************************************************/
                    //// 生成2级菜单分组
                    //if (Ext.isEmpty(submenu[item.menugroup]))
                    //{
                    //    submenu[item.menugroup] = new Ext.menu.Menu();
                    //    btn.menu.add({ xtype: 'menuitem', text: item.menugroup, menu: submenu[item.menugroup] });
                    //}
                    //submenu[item.menugroup].add(Ext.applyIf(item, menucfg));
                    //menuit = submenu[item.menugroup].items.getAt(submenu[item.menugroup].items.length - 1);
                    //if (menuit.checked)
                    //    chkit = menuit;
                    /************************************************/
                }
                else
                {
                    //btn.menu.insert(0, Ext.applyIf(item, menucfg));
                    btn.menu.add(Ext.applyIf(item, menucfg));
                    menuit = btn.menu.items.getAt(btn.menu.items.length - 1);
                    if (menuit.checked)
                        chkit = menuit;
                }
            }
            if (chkit)
                this.onMenuClick(chkit);
        }
        /*******************************************************/

        /****************写死处理辅助规划里没有数据的指标的菜单****************/
        //var wmenu = submenu['WCDMA.覆盖'];
        var lacks = {
            'WCDMA.覆盖': ['路测弱覆盖栅格点', '覆盖类投诉点', '扇区覆盖问题汇总'],
            'WCDMA.网络结构': ['软切换比例', '主覆盖比例'],
            'WCDMA.感知': ['扇区语音感知结果', '扇区综合感知结果'],
            'WCDMA.专题': ['网格U900部署建议值'],
            'LTE': ['覆盖', '网络资源', '业务', '感知'],
            'LTE.覆盖': ['MR弱覆盖', '路测弱覆盖栅格点', '覆盖类投诉点', '覆盖问题汇总'],
            'LTE.网络资源': ['系统平均负荷属性', '下行PRB平均利用率属性', 'LTE资源瓶颈综合标签'],
            'LTE.业务': ['上行流量_日均', ',下行流量_日均', '浏览业务流量', '即时通信业务流量', '下载业务流量', '流媒体业务流量'],
            'LTE.感知': ['数据感知结果', '综合感知结果'],
            '用户.区域感知': ['网格语音感知结果', '网格综合感知结果'],

        };

        var lackattr = Object.getOwnPropertyNames(lacks) || [], parmenu, parmenuname, lackmenus;
        for (var k = 0, m = lackattr.length; k < m; k++)
        {
            parmenuname = lackattr[k];
            parmenu = submenu[parmenuname];
            if (parmenu)
            {
                lackmenus = lacks[parmenuname];
                for (var p = 0, n = lackmenus.length; p < n; p++)
                {
                    if (parmenuname.indexOf('.') == -1)
                    {
                        var name = parmenuname + '.' + lackmenus[p];
                        submenu[name] = new Ext.menu.Menu();
                        parmenu.add({ xtype: 'menuitem', text: lackmenus[p], menu: submenu[name] });
                    }
                    else
                        parmenu.add({ xtype: 'menucheckitem', disabled: true, text: lackmenus[p], hideOnClick: true, group: this.cmp.getAutoId(), groupCls: '', scope: this });
                }
            }
        }
        /*******************************************************/

        if (btn.menu.items.length > 0)
            btn.show();
        else
            btn.hide();
    },
    __autoplaydim: function ()
    {
        var btn = this.__played_btn;
        if (!btn)
            return;

        var playcount = 0, firstit, pmenu, menu;
        var btnmenu = btn.menu;
        var it = this.__last_dimitem[btn.field];
        var idx = btnmenu.indexOf(it);
        if (idx < 0 || idx >= btnmenu.items.length - 1)
            it = btnmenu.items.getAt(0);
        else
            it = btnmenu.items.getAt(idx + 1);

        this.onDimMenuClick(it, null);
    },
    __clickDimMenum: function (item, menu, ischeck)
    {
        var it;
        for (var i = 0, n = menu.items.length; i < n; i++)
        {
            it = menu.items.getAt(i);
            if (!Ext.isEmpty(it.menu))
                this.__clickDimMenum(item, it.menu, ischeck);
            else if (it !== item)
                it.setChecked(false);
        }
    },
    onDimMenuClick: function (item, e)
    {
        if (e && this.timer)
            clearInterval(this.timer);

        var curbtn = item ? item.btn : undefined;
        if (this.__last_dimitem && curbtn && this.__last_dimitem[curbtn.field] === item)
            return;

        var dimselover = true;
        var btns = this.__dimbtns, btn;
        // 取消其他被选中的菜单项
        if (curbtn)
        {
            this.__clickDimMenum(item, curbtn.menu, false);
            this.__last_dimitem[curbtn.field] = item;

            for (var i = 0, n = btns.length; i < n; i++)
            {
                btn = btns[i];
                if (!Ext.String.Compare(btn.pfield, curbtn.field, true))
                    this.setDimSubBtnMenu(btn, item.val);

                if (!this.__last_dimitem[btn.field])
                    dimselover = false;
            }
            curbtn.setText(item.text);
        }
        else
            this.__last_dimitem = {};

        if(dimselover)
        {
            var refresh = this.__kpidim ? this.__kpidim.refresh : false;

            // 根据kpi的菜单项，设置当前过滤的维度
            var dim = { refresh: refresh, dims: {} };
            if (!Ext.isEmpty(this.__last_item) && !Ext.isEmpty(this.__last_item.kpi) && !Ext.isEmpty(this.__last_dimitem))
            {
                var selitems = this.__last_dimitem, it;
                for(var f in selitems)
                {
                    it = selitems[f];
                    dim.dims[f] = it.val;
                }
            }

            this.__last_item.kpi.kpidimfilter(dim);
        }
    },
    setDimSubBtnMenu: function(btn, pfieldval)
    {
        if(btn && btn.menu)
            btn.menu.removeAll();

        var sources = btn.sources[pfieldval];
        if (!sources)
            return;

        var btnmenu = btn.menu, filterit, chkmenuit = undefined;
        for (var i = 0, n = sources.length; i < n; i++)
        {
            filterit = sources[i];
            btnmenu.add({ val: filterit.value, text: filterit.text, group: btn.field, btn: btn });
            if (i == 0)
            {
                chkmenuit = btnmenu.items.getAt(0);
                chkmenuit.checked = true;
            }
        }
        if (btnmenu.items.length > 0)
            btn.show();
        else
            btn.hide();

        if (chkmenuit)
            this.onDimMenuClick(chkmenuit);
    },
    setDimMenu: function (dimcfg)
    {
        var btns = this.__dimbtns, map = this.cmp, tbar = map.toolbar, btn;
        if (btns && btns.length)
        {
            for (var i = 0, n = btns.length; i < n; i++)
            {
                btn = btns[i];
                btn.hide();
                btn.menu.removeAll();
                tbar.remove(btn);
                btns.splice(i, 1);
                n--;
                i--;
            }
        }
        if (Ext.isEmpty(dimcfg) || Ext.isEmpty(dimcfg.dims) || dimcfg.dims.length == 0)
        {
            this.onDimMenuClick();
            return;
        }

        var dims = dimcfg.dims;
        if (!Ext.isArray(dims))
            dims = [dims];

        //var menucfg = { xtype: 'menucheckitem', hideOnClick: true, group: this.cmp.getAutoId(), groupCls: '', scope: this, handler: this.onDimMenuClick };
        var btncfg = {
            xtype: 'button', text: this.text, menuAlign: 'tl-bl', hidden: true,
            menu: {
                __defaults: { xtype: 'menucheckitem', hideOnClick: true, groupCls: '', scope: this, handler: this.onDimMenuClick },
                defaults: function (config)
                {
                    if (Ext.isObject(config) && !config.xtype)
                        return this.__defaults;
                },
                items: []
            }
        };

        var item, filterit, btnmenu, chkbtnits = [], chkmenuit = undefined;
        var kpibtnidx = tbar.items.indexOf(this.__btn);
        kpibtnidx = (kpibtnidx == -1) ? tbar.items.length - 1 : kpibtnidx;
        for (var i = 0, n = dims.length; i < n; i++)
        {
            item = dims[i];
            //btncfg.menu.__defaults.group = item.field;
            btn = tbar.insert(kpibtnidx, btncfg);
            kpibtnidx++;
            btn.field = item.field;
            btn.pfield = item.pfield;
            btn.autoplay = item.autoplay;
            btn.sources = item.sources;
            btns.push(btn);
            btn.setText(item.text);

            if (Ext.isEmpty(btn.pfield) && Ext.isArray(btn.sources))
            {
                btnmenu = btn.menu;
                for (var k = 0, m = btn.sources.length; k < m; k++)
                {
                    filterit = btn.sources[k];
                    btnmenu.add({ val: filterit.value, text: filterit.text, group: btn.field, btn: btn });
                    if (k == 0)
                    {
                        chkmenuit = btnmenu.items.getAt(0);
                        chkmenuit.checked = true;
                        chkbtnits.push({ btn: btn, menuit: chkmenuit });
                    }
                }
                if (btnmenu.items.length > 0)
                    btn.show();
                else
                    btn.hide();
            }
        }

        for (var i = 0, n = chkbtnits.length; i < n; i++)
        {
            item = chkbtnits[i];
            this.onDimMenuClick(item.menuit);
        }
    },
    getKey: function (cond)
    {
        if (Ext.isString(cond))
            return cond;

        // 根据查询逻辑与菜单映射关系查找菜单项
        if (Ext.isEmpty(this.querymapping))
            return "";
        for (var i = 0, count = this.querymapping.length; i < count; i++)
        {
            var q = this.querymapping[i];
            if (q.query.indexOf(cond.type.toString()) > -1 || q.query.indexOf(cond.type.toString() + cond.grouptype) > -1)
                return q.menuname;
        }
        return "";
    },
    OnQuery: function (cond)
    {
        this.setMenu(this[this.getKey(cond)]);

        this.__kpidim = cond.dimfilter;
    }
});
