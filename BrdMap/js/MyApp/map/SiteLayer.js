Ext.define('MyApp.map.SiteDemoWin', {
    extend: 'Ext.window.Window',
    alias: 'widget.MyMapSiteDemoWin',
    icon: Ext.Loader.getPath('MyApp') + '/images/icon/property.png',
    layout: 'fit',
    frame: true,
    width: 300,
    height: 130,
    minWidth: 250,
    minHeight: 120,
    closable: false,
    title: '备注信息',
    border: false,
    modal: true,
    site: undefined,
    layer: undefined,
    items: [
		{
		    xtype: 'form',
		    layout: 'anchor',
		    frame: true,
		    padding: 5,
		    defaults: {
		        anchor: '100%'
		    },
		    items: [
				{
				    fieldLabel: '备注',
				    id: 'site_demo',
				    name: 'site_demo',
				    allowBlank: true,
				    labelWidth: 80,
				    xtype: 'textfield',
				    value: '',
				    readOnly: false
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
		        this.up('window').hide();
		    }
		}
    ],
    loadData: function ()
    {
        var form = this.items.get(0);
        if (this.site && form)
        {
            var demo = Ext.getCmp('site_demo');
            demo.setValue(this.site.data.logic_site_note1);
        }
    },
    saveData: function ()
    {
        var demo = Ext.getCmp('site_demo');
        var val = demo ? demo.getValue() : '';
        var site = this.site;
        var site_id = !Ext.isEmpty(this.site) ? this.site.site_id : '-1';
        var win = this;
        var uri = '/web/jss/map.jss?action=map.SavePlanSiteDemo';
        if (!Ext.String.startsWith(uri, APPBASE))
            uri = APPBASE + uri;

        var para = { site_id: site_id, demo: val };
        Ext.Ajax.request({
            url: uri,
            params:
            {
                args: Ext.encode(para)
            },
            method: 'post',
            async: false,
            success: function (resp)
            {
                site.data.logic_site_note1 = val;
                win.hide();
            },
            failure: function (resp)
            {
                Ext.Msg.alert('保存站点备注信息失败', resp.responseText);
            }
        });
    }
});

Ext.define('MyApp.map.Site', {
    extend: 'MyApp.map.Element',
    alternateClassName: 'MyMapSite',
    statics:
    {
        GetImpl: function (hr)
        {
            return MyMapBase.GetImplByJTH(hr, this, ['coverradius', 'issel']);
        }
    },
    constructor: function (id, project_id, project_name, net_type, x, y, radius)
    {
        this.site_id = id;
        this.project_id = project_id;
        this.project_name = project_name;
        this.net_type = net_type,
        this.longitude = 0;
        this.latitude = 0;
        this.x = x;
        this.y = y;
        this.tmp = true;
        this.coverradius = radius;
        this.issel = false;
        this.isnew = true;
        this.data = { site_id: id, project_id: project_id, project_name: project_name, longitude: this.longitude, latitude: this.latitude, net_type: net_type, x: x, y: y, isnew: true };
        this.callParent(arguments);
    },
    GetTip: function ()
    {
        if (this.phy_location_id && this.site_name)
            return '<span style="white-space: nowrap"><b>站址: </b>' + Ext.String.htmlEncode(this.data ? this.data.phy_location_id || '' : this.phy_location_id || '') + '</span><br/><span style="white-space: nowrap"><b>基站: </b>' + Ext.String.htmlEncode(this.data ? this.data.site_name || '' : this.site_name || '') + '</span>';
        else
            return '';
    }
});

Ext.define('MyApp.map.SiteLayer', {
    extend: 'MyApp.map.Layer',
    alias: 'widget.site_layer',
    zIndex: -555,
    uri: '/web/jss/map.jss?action=map.GetPlanSite',
    deluri: '/web/jss/map.jss?action=map.DelPlanSite',
    lockuri: '/web/jss/map.jss?action=map.LockPlanSite',
    realcooruri: '/web/jss/map.jss?action=map.GetRealCoor',
    sitesceneuri: '/web/jss/map.jss?action=map.GetSiteScene',
    sceneradiusuri: '/web/jss/map.jss?action=map.GetSceneRadius',
    minBound: 500000,    // 取最小范围(半径、米)的数据
    maxBound: 500000,    // 取最大范围(半径、米)的数据
    img_bts: Ext.apply(new Image(), { src: Ext.Loader.getPath('MyApp') + '/images/icon/bts.png' }),
    img_bts_sel: Ext.apply(new Image(), { src: Ext.Loader.getPath('MyApp') + '/images/icon/bts_sel.png' }),
    img_bts_lock: Ext.apply(new Image(), { src: Ext.Loader.getPath('MyApp') + '/images/icon/bts_lock.png' }),
    img_bts_sel_lock: Ext.apply(new Image(), { src: Ext.Loader.getPath('MyApp') + '/images/icon/bts_sel_lock.png' }),
    __coversite: undefined,/*记录被选中的覆盖站址*/
    __coverradius: 300/*默认覆盖半径*/,
    __scene_radius: {}/*不同场景对应的半径*/,
    selsites: [],/*记录被选中的站址*/
    ismouseselected: false/*是否进行了鼠标选中改变*/,
    __isdrag: false,
    __isdown: false,
    __city_id: undefined,
    __project_id: undefined,
    __project_name: undefined,
    __net_type: undefined,
    __user_id: '',
    __building: 0/*building:辅助建站*/,
    __adjust: 1/*adjust:规模调整*/,
    __siteDemoWin: undefined,
    __mousept: [0, 0]/*记录鼠标在地图中点下的位置，用以判断移动距离*/,
    __selectmenu: undefined,
    __lasttime: new Date(),
    __timeoutid: undefined,
    BuildStatus: undefined,
    siteCoverWin: undefined,
    constructor: function ()
    {
        this.__siteDemoWin = Ext.create('MyApp.map.SiteDemoWin');
        var __editMode = false, zIndex = this.zIndex;

        var __visible = true, __disable = false;
        Object.defineProperties(this, {
            sites: { value: [] },
            __hot: { value: null, writable: true },
            __hot_arr: { value: [] },
            mapSearch: { value: {} /*查找面板中查找集*/ },
            editMode: {
                get: function () { return __editMode; },
                set: function (v)
                {
                    if (__editMode === v)
                        return;

                    __editMode = v;
                    if (__editMode)
                    {
                        zIndex = this.zIndex;
                        var layers = this.map.layers, z = zIndex;
                        for (var i = layers.length; i-- > 0;)
                        {
                            z = Math.max(z, layers[i].zIndex);
                        }
                        this.zIndex = z;
                    }
                    else
                    {
                        this.zIndex = zIndex;

                        if (this.__new_site)
                        {
                            if (this.__new_site.tmp)
                            {
                                var i = this.sites.lastIndexOf(this.__new_site);
                                if (i >= 0)
                                    this.sites.splice(i, 1);
                            }

                            this.__new_site = null;
                        }
                    }
                }
            },
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
                        var btnadd = this.GetAddButton(), btndel = this.GetDelButton(), btnlock = this.GetLockButton(), btnunlock = this.GetUnlockButton();
                        if (btnadd) btnadd.setVisible(__visible);
                        if (btndel) btndel.setVisible(__visible);
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
                        var btnadd = this.GetAddButton(), btndel = this.GetDelButton(), btnlock = this.GetLockButton(), btnunlock = this.GetUnlockButton();
                        if (btnadd) btnadd.setDisabled(__disable);
                        if (btndel) btndel.setDisabled(__disable);
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
    OnInitUpdate: function (canvas, tile)
    {
        this.callParent(arguments);
        var tbar = this.map.toolbar;

        this.BuildStatus = this.BuildStatus || this.__building;
        switch (this.BuildStatus)
        {
            case this.__adjust:
                {
                    tbar.add({
                        xtype: 'button', text: '锁定', hidden: !this.Visible, disabled: true, scope: this, handler: function ()
                        {
                            this.OnLockSites(this.selsites, this.__user_id);
                        }
                    });
                    tbar.add({
                        xtype: 'button', text: '解锁', hidden: !this.Visible, disabled: true, scope: this, handler: function ()
                        {
                            this.OnLockSites(this.selsites, '');
                        }
                    });
                    break;
                }
            default:
                {
                    tbar.add({ xtype: 'button', text: '添加站点', hidden: !this.Visible, disabled: true, scope: this, handler: this.OnAddSite });
                    tbar.add({
                        xtype: 'button', text: '删除站点', hidden: !this.Visible, disabled: true, scope: this, handler: function ()
                        {
                            this.OnDelSites(this.selsites);
                        }
                    });
                    break;
                }
        }
    },
    GetAddButton: function () { return this.map.toolbar.items.findBy(function (it) { return it.text == '添加站点' }); },
    GetDelButton: function () { return this.map.toolbar.items.findBy(function (it) { return it.text == '删除站点' }); },
    GetLockButton: function () { return this.map.toolbar.items.findBy(function (it) { return it.text == '锁定' }); },
    GetUnlockButton: function () { return this.map.toolbar.items.findBy(function (it) { return it.text == '解锁' }); },
    OnAddSite: function ()
    {
        this.GetAddButton().toggle(this.editMode = this.editMode ? false : true);
    },
    OnDelSites: function (delsites)
    {
        if (!Ext.isEmpty(delsites) && delsites.length > 0)
        {
            var n = delsites.length;
            if (n > 0)
            {
                var isok = window.confirm("是否确认删除站点？");
                if (isok)
                {
                    // 获取要删除站点的id集合
                    var ids = [], phys = [], s;
                    for (var i = 0; i < n; i++)
                    {
                        s = delsites[i];
                        ids.push(s.data && s.data.site_id ? s.data.site_id + '' : s.site_id + '');
                        phys.push(s.data && s.data.phy_location_id ? s.data.phy_location_id + '' : (s.phy_location_id ? s.phy_location_id : '') + '');
                    }

                    var uri = this.deluri;
                    if (!Ext.String.startsWith(uri, APPBASE))
                        uri = APPBASE + uri;
                    var fn = this.task.pass(this.__delSites, this, delsites);
                    Ext.Ajax.request({
                        url: uri,
                        method: "POST",
                        params: { args: Ext.encode({ project_id: this.__project_id, net_type: this.__net_type, ids: ids, phys: phys, user_id: this.__user_id }) },
                        success: fn,
                        failure: fn
                    });
                }
            }
        }
    },
    __delSites: function (delsites, resp, c)
    {
        if (resp.timedout)
            throw '删除选择的逻辑站址数据超时!';

        if (resp.status != 200)
            throw '网络异常(' + resp.status + '): ' + resp.statusText;

        var result = Ext.decode(resp.responseText);
        if (!Ext.isEmpty(result.success) && !result.success)
            throw result.msg;
        else if (!Ext.isEmpty(result.error))
            throw result.error;

        var sites = this.sites, it;
        for (var i = 0, m = sites.length; i < m; i++)
        {
            it = sites[i];
            if (it && it.issel)
            {
                sites.splice(i, 1);
                --m;
                --i;
            }
        }
        var coverchange = delsites.indexOf(this.__coversite) == -1;
        delsites.splice(0, delsites.length);

        this.OnCoverChange(this.__coversite, coverchange ? "" : "cancel");

        this.Invalidate();
    },
    OnLockSites: function (locksites, lockflag)
    {
        if (!Ext.isEmpty(locksites) && locksites.length > 0)
        {
            var n = locksites.length;
            if (n > 0)
            {
                var lockcn = !Ext.isEmpty(lockflag) ? "锁定" : "解锁";
                var isok = window.confirm("是否确认" + lockcn + "选中的站点？");
                var errlock = [];
                if (isok)
                {
                    // 获取要锁定站点的id集合
                    var ids = [], phys = [], s;
                    for (var i = 0; i < n; i++)
                    {
                        s = locksites[i];
                        ids.push(s.data && s.data.site_id ? s.data.site_id + '' : s.site_id + '');
                        phys.push(s.data && s.data.phy_location_id ? s.data.phy_location_id + '' : (s.phy_location_id ? s.phy_location_id : '') + '');

                        if (!Ext.isEmpty(s.lock) && Ext.String.Compare(this.__user_id, s.lock) != 0)
                            errlock.push(s.site_id);
                    }

                    var uri = this.lockuri;
                    if (!Ext.String.startsWith(uri, APPBASE))
                        uri = APPBASE + uri;
                    var fn = this.task.pass(this.__lockSites, this, locksites, lockflag, errlock);
                    Ext.Ajax.request({
                        url: uri,
                        method: "POST",
                        params: { args: Ext.encode({ project_id: this.__project_id, net_type: this.__net_type, ids: ids, phys: phys, lock: lockflag, user_id: this.__user_id }) },
                        success: fn,
                        failure: fn
                    });
                }
            }
        }
    },
    __lockSites: function (locksites, lockflag, errlock, resp, c)
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
        for (var i = 0, m = locksites.length; i < m; i++)
        {
            it = locksites[i];
            if (it && errlock.indexOf(it.site_id) == -1)
                it.lock = lockflag;
        }

        this.Invalidate();

        if (!Ext.isEmpty(lockflag) && !Ext.isEmpty(errlock))
            Ext.Msg.alert('以下逻辑站点已被其他用户锁定，您不能再进行锁定，逻辑站点ID：</br>' + errlock);
        else if (Ext.isEmpty(lockflag) && !Ext.isEmpty(errlock))
            Ext.Msg.alert('以下逻辑站点被其他用户锁定，您不能解锁，逻辑站点ID：</br>' + errlock);
    },
    GetRealCoor: function (pt)
    {
        if (!Ext.isEmpty(pt) && !Ext.isEmpty(pt.longitude) && !Ext.isEmpty(pt.longitude))
        {
            // 同步方式提交服务器删除请求
            var uri = this.realcooruri;
            if (!Ext.String.startsWith(uri, APPBASE))
                uri = APPBASE + uri;
            var fn = this.task.pass(this.__getRealCoor, this, pt);
            Ext.Ajax.request({
                async: false,
                url: uri,
                method: "POST",
                params: { args: Ext.encode({ longitude: pt.longitude, latitude: pt.latitude }) },
                success: function (resp)
                {
                    var result = Ext.decode(resp.responseText);
                    if (!Ext.isEmpty(result.success) && !result.success)
                        throw result.msg;

                    pt.longitude = result.longitude;
                    pt.latitude = result.latitude;
                },
                failure: function (resp)
                {
                    if (resp.timedout)
                        throw '设置逻辑站址锁定状态超时!';

                    if (resp.status != 200)
                        throw '网络异常(' + resp.status + '): ' + resp.statusText;

                    throw Ext.decode(resp.responseText);
                }
            });
        }
    },
    OnCoverChange: function (item, changetype)
    {
        // changetype值为no或空:表示不对覆盖站点做任何的更改处理代码中不做判断，
        // common：表示对item做覆盖站点做设置/取消，cancel：如果item是覆盖站点取消item作为覆盖站点，always：始终把item设置为覆盖站点
        if (Ext.String.Compare(changetype, "common", true) == 0)
        {
            if (!Ext.isEmpty(this.__coversite) && Ext.String.Compare(this.__coversite.site_id, item.site_id) == 0)
                this.__coversite = undefined;
            else
                this.__coversite = item;
        }
        else if (Ext.String.Compare(changetype, "cancel", true) == 0)
        {
            if (!Ext.isEmpty(this.__coversite) && Ext.String.Compare(this.__coversite.site_id, item.site_id) == 0)
                this.__coversite = undefined;
        }
        else if (Ext.String.Compare(changetype, "always", true) == 0)
            this.__coversite = item;

        // 由于半径的设置都通过自动化计算，所以注释掉部分后进行修改
        /***************************************************************************/
        // 天线增益:Ga,天线功率:Tx,站点类型:微站/宏站(已有),下行频段:(界面填写),Rx:WCDMA系统为-90dBm，LTE系统为-110dBm，GSM系统为-80dBm
        // 根据覆盖类型、站点类型和项目名称获取K1、K2、K3、K5、H、HW 距离计算D = 10 ^ ((Tx + Ga - Rx - K1 - K3 * Log(H) + 34.5 - 10 * Log(F)) / (K2 + K5 * Log(H)))
        // 同步方式提交服务器删除请求
        if (Ext.isEmpty(item)) // || Ext.isEmpty(item.sitecover_type)
        {
            this.map.SetLayerSiteCovered(this.__coversite);
            this.Invalidate();
        }
        else if (this.__coversite)
        {
            var uri = this.sitesceneuri;
            if (!Ext.String.startsWith(uri, APPBASE))
                uri = APPBASE + uri;

            MyMapBase.LogicalToGeographic(item);
            var fn = this.task.pass(this.getCoverRadius, this, item);
            Ext.Ajax.request({
                async: false,
                url: uri,
                method: "POST",
                params: { args: Ext.encode({ cond: this.map.cur_querycondition, longitude: item.longitude, latitude: item.latitude }) },
                success: fn,
                failure: fn
            });
        }
        /***************************************************************************/
    },
    getCoverRadius: function (item, resp, c)
    {
        // 从服务器中获取站址所在场景的类型，计算出覆盖半径
        if (resp.timedout)
            throw '从"' + c.url + '"取数据超时!';

        result = resp.responseText;
        if (resp.status != 200)
            throw '网络异常(' + resp.status + '): ' + resp.statusText;
        result = Ext.decode(result);

        if ('error' in result)
            throw result['error'];

        // 获取参数值
        var scenetype = result.scenetype;
        var coverdis = this.__coverradius;
        if (scenetype)
        {
            var dis = this.__scene_radius[scenetype + "_" + this.__net_type];
            if (dis)
                coverdis = dis;
        }
        var ld = MyMapBase.LogicalOffsetVal(item.x, item.y, coverdis, coverdis);
        item.coverradius = ld[0];

        this.map.SetLayerSiteCovered(this.__coversite);
        this.Invalidate();
    },
    OnVisibleChanged: function ()
    {
        this.callParent(arguments);
        var btnadd = this.GetAddButton(), btndel = this.GetDelButton(), btnlock = this.GetLockButton(), btnunlock = this.GetUnlockButton();
        if (this.Visible)
        {
            if (btnadd) btnadd.show();
            if (btndel) btndel.show();
            if (btnlock) btnlock.show();
            if (btnunlock) btnunlock.show();
        }
        else
        {
            if (btnadd) btnadd.hide();
            if (btndel) btndel.hide();
            if (btnlock) btnlock.hide();
            if (btnunlock) btnunlock.hide();
        }
    },
    __onQuerySiteRadius: function (resp)
    {
        var result = resp.responseText;
        if (resp.status != 200)
        {
            this.__btn_disable = true;
            throw '网络异常(' + resp.status + '): ' + resp.statusText;
        }

        this.__btn_disable = false;
        result = Ext.decode(result);
        var table = result.sites, hr = table[0];
        var n = table ? table.length - 1 : 0;

        this.__scene_radius = {};
        var sceneradius = this.__scene_radius;
        var scene_type, radius, net_type;
        for (var i = 1; i <= n; i++)
        {
            // scene_type, radius
            scene_type = '';
            net_type = '';
            radius = 0;
            for (var j = 0; j < hr.length; j++)
            {
                if (Ext.String.Compare(hr[j].Name, 'scene_type', true) == 0)
                    scene_type = table[i][j];
                else if (Ext.String.Compare(hr[j].Name, 'net_type', true) == 0)
                    net_type = table[i][j];
                else if (Ext.String.Compare(hr[j].Name, 'radius', true) == 0)
                    radius = table[i][j];
            }
            if (!Ext.isEmpty(scene_type) && !Ext.isEmpty(net_type))
                sceneradius[scene_type + "_" + net_type] = radius;
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

        if (!Ext.String.Compare(this.__net_type, 'cover_room', true))
            this.__btn_visible = false;
        else
            this.__btn_visible = true;

        var uri = this.sceneradiusuri;
        if (!Ext.String.startsWith(uri, APPBASE))
            uri = APPBASE + uri;

        var fn = this.task.pass(this.__onQuerySiteRadius, this);

        Ext.Ajax.request({
            async: true,
            url: uri,
            method: "POST",
            params: { args: Ext.encode({ cond: this.map.cur_querycondition }) },
            success: fn,
            failure: function (resp)
            {
                this.__btn_disable = true;
                if (resp.timedout)
                    throw '获取工程对应的场景覆盖半径超时!';

                if (resp.status != 200)
                    throw '网络异常(' + resp.status + '): ' + resp.statusText;

                throw Ext.decode(resp.responseText);
            }
        });


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

        delete this.__hot;
        delete this.__hot_arr;
        this.__isdrag = false;
        this.__isdown = false;
        this.__coversite = undefined;
        this.selsites = [];

        var table = result.sites, hr = table[0];
        var site_type = MyMapSite.GetImpl(hr), tile = this.tile;
        var n = table ? table.length - 1 : 0;
        var sites = this.sites, ci, ld;
        sites.length = n;
        for (var i = 0; i < n; i++)
        {
            ci = new site_type(table[i + 1]);
            //MyMapBase.GeographicToLogical(ci);

            ld = MyMapBase.LogicalOffsetVal(ci.x, ci.y, this.__coverradius, this.__coverradius);
            ci.coverradius = ld[0];
            ci.lock = ci.stat_flag;
            ci.isnew = false;
            ci.data = { isnew: false };

            // 循环列头为纯json对象赋值
            var name;
            for (var j = 0, m = table[0].length; j < m; j++)
            {
                name = hr[j];
                if (Ext.isObject(name))
                    name = name.Name;
                name = name.toLowerCase();
                ci.data[name] = ci[name];
            }
            sites[i] = ci;
        }

        this.OnCoverChange(this.__coversite, "cancel");
        this.task.Add(this.Invalidate, this);
    },
    __clearSelected: function (selsites)
    {
        var s;
        for (var i = 0, n = selsites.length; i < n; i++)
        {
            s = selsites[i];
            s.issel = false;
            selsites.splice(i, 1);
            --n;
            --i;
        }
    },
    ClearSelected: function ()
    {
        this.__clearSelected(this.selsites);
        this.__sitesSort();
        this.Invalidate();
    },
    SelectSites: function (item)
    {
        this.__clearSelected(this.selsites);
        var it, sites = this.sites;
        if (Ext.isArray(item))
        {
            var arr = item || [];
            for (var i = 0, it, m = sites.length; i < m; i++)
            {
                it = sites[i];
                if (arr.indexOf(it.data.site_id) > -1 || arr.indexOf(it.site_id) > -1)
                {
                    it.issel = true;
                    this.selsites.push(it);
                }
            }
        }
        else if (Ext.isObject(item))
        {
            for (var i = 0, it, m = sites.length; i < m; i++)
            {
                it = sites[i];
                if (!Ext.isEmpty(item.firstscene_type) && Ext.String.Compare(it.firstscene_type, item.firstscene_type, true) != 0)
                    continue;
                if (!Ext.isEmpty(item.firstscene_name) && Ext.String.Compare(it.firstscene_name, item.firstscene_name, true) != 0)
                    continue;
                if (!Ext.isEmpty(item.phygrid_type) && Ext.String.Compare(it.phygrid_type, item.phygrid_type, true) != 0)
                    continue; // 网格类型
                if (!Ext.isEmpty(item.is_used) && Ext.String.Compare(it.is_used, item.is_used, true) != 0)
                    continue; // 是否利旧
                if (!Ext.isEmpty(item.manage_attribute) && Ext.String.Compare(it.manage_attribute, item.manage_attribute, true) != 0)
                    continue; // 管理属性
                if (!Ext.isEmpty(item.site_purpose_brad) && Ext.String.Compare(it.site_purpose_brad, item.site_purpose_brad, true) != 0)
                    continue;
                if (!Ext.isEmpty(item.site_purpose_perceiv) && Ext.String.Compare(it.site_purpose_perceiv, item.site_purpose_perceiv, true) != 0)
                    continue;
                if (!Ext.isEmpty(item.site_purpose_market) && Ext.String.Compare(it.site_purpose_market, item.site_purpose_market, true) != 0)
                    continue;
                if (!Ext.isEmpty(item.site_purpose_cover) && Ext.String.Compare(it.site_purpose_cover, item.site_purpose_cover, true) != 0)
                    continue;
                if (!Ext.isEmpty(item.market_import) && Ext.String.Compare(it.market_import, item.market_import, true) != 0)
                    continue; // 市场等级

                it.issel = true;
                this.selsites.push(it);
            }
        }
        this.__sitesSort();
        this.Invalidate();
    },
    SelectSite: function (item, isctrlkey)
    {
        var i = this.selsites.indexOf(item);
        if (i > -1)
        {
            item.issel = false;
            if (isctrlkey)
                this.selsites.splice(i, 1);
            else
                this.__clearSelected(this.selsites);
        }
        else
        {
            if (!isctrlkey)
                this.__clearSelected(this.selsites);
            item.issel = true;
            this.selsites.push(item);
        }
        this.__sitesSort();
        this.Invalidate();
    },
    __sitesSort: function ()
    {
        var cmp = function (a, b)
        {
            return a.issel && !b.issel ? 1 : (!a.issel && b.issel ? -1 : Ext.String.Compare(a.lock, b.lock));
        };
        this.sites.sort(cmp);
    },
    ShowSelectSites: function (item)
    {
        brd.getSiteFilterWindow(item);
    },
    GetSelectSiteIds: function ()
    {
        var ids = [];
        if (!Ext.isEmpty(this.selsites))
        {
            var sites = this.selsites;
            for (var i = 0, it, n = sites.length; i < n; i++)
            {
                it = sites[i];
                ids.push(it.site_id);
            }
        }
        return ids;
    },
    ShowSiteDemo: function (item)
    {
        var win = this.__siteDemoWin;
        if (win)
        {
            win.site = item;
            win.layer = this;
            win.show();
            win.loadData(item);
        }
    },
    GetPropertyInfo: function (item)
    {
        if (item instanceof MyApp.map.Site)
        {
            var rs = [];
            rs.push(["1、常规", "物理站址ID", item.phy_location_id]);
            rs.push(["1、常规", "物理站址名称", item.phystat_name]);
            rs.push(["1、常规", "网络制式", item.net_type]);
            //rs.push(["1、常规", "所属网格名称", item.phygrid_name]);
            //rs.push(["1、常规", "所属网格类型", item.phygrid_type]);
            //rs.push(["1、常规", "场景", item.firstscene_type]);
            //rs.push(["1、常规", "子场景", item.firstscene_name]);
            //rs.push(["1、常规", "是否利旧", item.is_used]);
            //rs.push(["1、常规", "基础配套归属制式", item.base_system]);
            //rs.push(["1、常规", "电源配套归属制式", item.power_system]);
            //rs.push(["1、常规", "投资总额(万元)", item.Invest_amount]);
            //rs.push(["1、常规", "基站类别", item.basestation_type]);
            //rs.push(["1、常规", "是否为微基站", item.is_mini_station]);
            //rs.push(["1、常规", "专项标识", item.special_flag]);
            //rs.push(["1、常规", "管理属性", item.manage_attribute]);
            //rs.push(["1、常规", "高铁覆盖类别", item.highrailway_covertype]);
            //rs.push(["1、常规", "刚性标识", item.rigid_identify]);
            //rs.push(["1、常规", "需求类别", item.demand_type]);
            //rs.push(["1、常规", "市场重要性", item.market_import]);
            //rs.push(["1、常规", "设备厂家", item.device_vender]);
            //rs.push(["1、常规", "设备配置", item.device_conf]);
            //rs.push(["1、常规", "总分", item.total_score]);
            //rs.push(["1、常规", "策略规则编号", item.tactic_no]);
            //rs.push(["1、常规", "推荐建设年份", item.project_time]);
            //rs.push(["1、常规", "站点锁定", Ext.isEmpty(item.lock) ? '未锁定' : item.lock]);
            //rs.push(["1、常规", "最后编辑用户名", item.last_edit_user]);
            //rs.push(["1、常规", "最后编辑时间", item.last_edit_time]);
            //rs.push(["1、常规", "编辑用户预留字段", item.resv]);

            //rs.push(["1、常规", "逻辑站ID", item.site_id]);
            //rs.push(["1、常规", "逻辑站名称", item.site_name]);

            rs.push(["2、位置", "经度", item.longitude.toFixed(4) + "°"]);
            rs.push(["2、位置", "纬度", item.latitude.toFixed(4) + "°"]);

            return { title: '逻辑站点信息', data: rs };
        }
    },
    ShowSiteInfo: function (item, e)
    {
        switch (this.BuildStatus)
        {
            case this.__building:
                {
                    if (e)
                    {
                        var tile = this.map.tile, scale = tile.canvasWidth / tile.ViewportW;
                        var pt = e.getXY(), pc = tile.getXY();
                        var x = (pt[0] - pc[0]) / scale + tile.ViewportX, y = (pt[1] - pc[1]) / scale + tile.ViewportY;
                        pt = MyMapBase.LogicalToGeographic({ x: x, y: y });
                        this.GetRealCoor(pt); // 获取真实经纬度
                        item.longitude = pt.longitude;
                        item.latitude = pt.latitude;
                        item.data.longitude = pt.longitude;
                        item.data.latitude = pt.latitude;
                        item.x = item.data.x = x;
                        item.y = item.data.y = y;

                        item.data.arfcn = item.arfcn;
                        item.data.market_import = item.market_import;
                        item.data.phystat_name = item.phystat_name;
                        item.data.bbu_location_id = item.bbu_location_id;
                        item.data.department_need = item.department_need;
                        item.data.person_need = item.person_need;
                        item.data.department_project = item.department_project;
                        item.data.person_project = item.person_project;
                    }

                    var win = createNewConfigWindow(item, undefined, this);
                    if (win) win.show();
                    break;
                }
            case this.__adjust:
                {
                    if (this.map.PropertyWnd)
                        this.map.ShowProperty(this.map.GetPropertyInfo(item, this));
                    break;
                }
        }
    },
    RestoreLocation: function (item, changetype)
    {
        if (!Ext.isEmpty(item.lastx) && !Ext.isEmpty(item.lasty))
        {
            item.x = item.data.x = item.lastx;
            item.y = item.data.y = item.lasty;
        }
        this.OnCoverChange(item, changetype);
    },
    GetKPIInfo: function (item, isshowdim)
    {
    },
    GetSiteImg: function (it, img, img_sel, img_lock, img_sel_lock)
    {
        if (it.issel && !Ext.isEmpty(it.lock) && img_sel_lock)
            return img_sel_lock;
        else if (!it.issel && !Ext.isEmpty(it.lock) && img_lock)
            return img_lock;
        else if (it.issel && img_sel)
            return img_sel;
        else if (img)
            return img;
        else
            return undefined;
    },
    OnDraw: function (ctx)
    {
        var sites = this.sites, n = sites.length;
        if (n == 0)
            return;

        var cb = this.canvas.clipBox, l = cb.x - 22, t = cb.y - 22, r = cb.right + 22, b = cb.bottom + 22;
        var tile = this.tile, scale = tile.canvasWidth / tile.ViewportW;
        var dx = scale * tile.ViewportX, dy = scale * tile.ViewportY, x, y;

        if (this.editMode)
        {
            ctx.fillStyle = 'rgba(136,136,255,0.1)';
            ctx.fillRect(cb.x, cb.y, cb.w, cb.h);
        }

        var img = this.img_bts, img_sel = this.img_bts_sel, img_lock = this.img_bts_lock, img_sel_lock = this.img_bts_sel_lock, drawimg, searchscale;
        if (img && (!img.complete || !img.width))
            img = undefined;
        else if (img)
            img = MyMapBase.MakeMaskImg(img, 'rgba(255,140,0,1)');

        if (img_lock && (!img_lock.complete || !img_lock.width))
            img_lock = undefined;
        else if (img_lock)
            img_lock = MyMapBase.MakeMaskImg(img_lock, 'rgba(255,165,0,1)');

        for (var i = 0, it; i < n; i++)
        {
            it = sites[i];
            x = (it.data && it.data.x ? it.data.x : it.x) * scale - dx;
            y = (it.data && it.data.y ? it.data.y : it.y) * scale - dy;

            if (!Ext.isEmpty(this.__coversite) && it.coverradius && it.coverradius > 0
                && Ext.String.Compare(this.__coversite.site_id, it.site_id) == 0)
            {
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.beginPath();
                ctx.arc(x, y - img.height / 2 + 1, scale * it.coverradius, 0, Math.PI * 2, false); // 绘制覆盖范围  40075016.685579
                ctx.closePath();
                ctx.fill();
            }

            if (x < l || x > r || y < t || y > b)
                continue;

            searchscale = this.IsSearched(it) ? 2 : 1;
            drawimg = this.GetSiteImg(it, img, img_sel, img_lock, img_sel_lock);
            ctx.drawImage(drawimg, x - drawimg.width * searchscale / 2, y - drawimg.height * searchscale + 2, drawimg.width * searchscale, drawimg.height * searchscale);
        }
    },
    GetCursor: function (e)
    {
        return this.editMode ? 'default' : (this.__hot ? 'pointer' : undefined);
    },
    PtInSite: function (x, y, ci, img, scale)
    {
        var x2 = ci.x * scale, y2 = ci.y * scale, dx = 0, dy = 0;

        var xcenter = x2 - img.width / 2;
        var ycenter = y2 - img.height + 2;
        if (x >= xcenter - img.width / 2 && x <= xcenter + img.width / 2
            && y >= ycenter - img.height && y <= ycenter)
            return true;
        else
            return false;
    },
    HitTest: function (cx, cy, e)
    {
        if (this.__isdown || this.__isdrag)
            return;
        else if (this.editMode)
        {
            var tile = this.tile, it = this.__new_site;
            if (e)
            {
                var x = tile.ViewportX + cx * tile.ViewportW / tile.canvasWidth;
                var y = tile.ViewportY + cy * tile.ViewportW / tile.canvasWidth;
                if (!it)
                {
                    var ld = MyMapBase.LogicalOffsetVal(x, y, this.__coverradius, this.__coverradius);
                    it = this.__new_site = new MyMapSite(Ext.data.IdGenerator.get('uuid').generate(), this.__project_id, this.__project_name,
                        this.__net_type, x, y, ld[0]);
                    this.__coversite = it;
                    this.sites.push(it);
                }

                var pt = MyMapBase.LogicalToGeographic({ x: x, y: y });
                it.longitude = it.data.longitude = pt.longitude;
                it.latitude = it.data.latitude = pt.latitude;
                it.x = it.data.x = x;
                it.y = it.data.y = y;

                this.Invalidate();

                return it;
            }
            else if (it)
            {
                var scale = tile.canvasWidth / tile.ViewportW;

                var realx = it.data && it.data.x ? it.data.x : it.x;
                var realy = it.data && it.data.y ? it.data.y : it.y;

                if (Math.abs(cx - (realx - tile.ViewportX) * scale) > 12)
                    return null;

                var dy = cy - (realy - tile.ViewportY) * scale;
                if (dy > 2 || dy < -22)
                    return null;
            }

            return it;
        }
        else
        {
            var sites = this.sites, nsite = sites.length;
            if (nsite == 0)
                return;

            var tile = this.tile;
            var scale = tile.canvasWidth / tile.ViewportW, dx = tile.ViewportX * scale, dy = tile.ViewportY * scale;
            var x = cx + dx, y = cy + dy;

            /***************************旧点击测试方法*****************************/
            //var ci = this.__hot;
            //var img = this.img_bts
            //do
            //{
            //    if (ci instanceof MyMapSite)
            //    {
            //        var dy = cy - (ci.y - tile.ViewportY) * scale;
            //        if (Math.abs(cx - (ci.x - tile.ViewportX) * scale) <= 12
            //            && (dy <= 2 && dy >= -22))
            //            break;
            //    }

            //    var i = nsite - 1;
            //    for (; i >= 0; i--)
            //    {
            //        ci = sites[i];

            //        var dy = cy - (ci.y - tile.ViewportY) * scale;
            //        if (Math.abs(cx - (ci.x - tile.ViewportX) * scale) <= 12
            //            && (dy <= 2 && dy >= -22))
            //            break;
            //    }

            //    if (i < 0)
            //        ci = null;

            //} while (false);
            //this.__hot = ci;
            //return ci;

            /*************************新多个站点在同一位置点击测试方法************************/
            var ci = this.__hot;
            var cis = this.__hot_arr;
            var img = this.img_bts;
            var realx, realy;
            do
            {
                if (ci instanceof MyMapSite)
                {
                    realx = ci.data && ci.data.x ? ci.data.x : ci.x;
                    realy = ci.data && ci.data.y ? ci.data.y : ci.y;

                    var dy = cy - (realy - tile.ViewportY) * scale;
                    if (Math.abs(cx - (realx - tile.ViewportX) * scale) <= 12 && (dy <= 2 && dy >= -22))
                        break;
                }

                var i = nsite - 1;
                ci = null;
                cis = [];
                for (var site; i >= 0; i--)
                {
                    site = sites[i];
                    realx = site.data && site.data.x ? site.data.x : site.x;
                    realy = site.data && site.data.y ? site.data.y : site.y;

                    var dy = cy - (realy - tile.ViewportY) * scale;
                    if (Math.abs(cx - (realx - tile.ViewportX) * scale) <= 12 && (dy <= 2 && dy >= -22))
                    {
                        cis.push(site);
                        if (!ci)
                            ci = site;
                    }
                }

            } while (false);
            this.__hot = ci;
            this.__hot_arr = cis;
            return ci;
            /********************************************************/
        }
    },
    OnItemDblClick: function (item, e)
    {
        //if (item)
        //    this.ShowSiteInfo(item);
    },
    OnDblClick: function (e)
    {
        // 选中菜单
        if (!this.__hot_arr) return;
        var n = this.__hot_arr.length;
        if (n > 1 && this.__selectmenu)
        {
            this.__selectmenu.removeAll(true);
            var sites = this.__hot_arr, layer = this;

            for (var i = 0, site; i < n; i++)
            {
                site = sites[i];
                this.__selectmenu.add([{
                    text: site.phy_location_id + ' (' + site.site_name + ')',
                    itemsite: site,
                    listeners:
                        {
                            click: function ()
                            {
                                if (this.itemsite)
                                    layer.ShowSiteInfo(this.itemsite);
                            }
                        }
                }]);
            }
            this.__selectmenu.showAt(e.getXY());
        }
        else if (this.__hot)
            this.ShowSiteInfo(this.__hot);

        return true;
    },
    OnMouseMove: function (e)
    {
        if (this.__isdown && this.__hot)
        {
            var it = this.__hot;
            var tile = this.map.tile, scale = tile.canvasWidth / tile.ViewportW;

            var lastx = this.__mousept[0];
            var lasty = this.__mousept[1];
            var pt = e.getXY();

            if ((Math.abs(pt[0] - lastx) > 4 || Math.abs(pt[1] - lasty) > 4) || this.__isdrag)
            {
                var pc = tile.getXY();
                this.__isdrag = true;
                var x = (pt[0] - pc[0]) / scale + tile.ViewportX, y = (pt[1] - pc[1]) / scale + tile.ViewportY;
                it.x = it.data.x = x;
                it.y = it.data.y = y;
                //var ld = MyMapBase.LogicalOffsetVal(it.data.x, it.data.y, this.__coverradius, this.__coverradius);
                //it.coverradius = ld[0]; // 只要拖动则覆盖半径默认为this.__coverradius，拖动时半径采用旧的半径所以注释掉

                if (this.__coversite)
                    this.map.SetLayerSiteCovered(this.__coversite);

                this.Invalidate();
            }
        }
        else if (this.__new_site && this.__coversite)
            this.map.SetLayerSiteCovered(this.__coversite);
    },
    OnMouseDown: function (e)
    {
        switch (this.BuildStatus)
        {
            case this.__building:
                {
                    if (Ext.isEmpty(this.__new_site) && this.__hot && e.button == 0)
                    {
                        this.__isdown = true;
                        this.__mousept = e.getXY();
                        this.__hot.lastx = this.__hot.data && this.__hot.data.x ? this.__hot.data.x : this.__hot.x;
                        this.__hot.lasty = this.__hot.data && this.__hot.data.y ? this.__hot.data.y : this.__hot.y;
                        return true;
                    }
                    break;
                }
        }
    },
    __mouseupselect: function (e)
    {
        // 选中菜单
        var n = this.__hot_arr.length;
        if (n > 1 && this.__selectmenu)
        {
            this.__selectmenu.removeAll(true);
            var sites = this.__hot_arr, checked, layer = this, isctrlkey = this.map.ctrlKey;

            for (var i = 0, site; i < n; i++)
            {
                site = sites[i];
                checked = this.selsites.indexOf(site) > -1;
                this.__selectmenu.add([{
                    xtype: 'menucheckitem',
                    text: site.phy_location_id + ' (' + site.site_name + ')',
                    checked: checked,
                    itemsite: site,
                    listeners:
                        {
                            click: function ()
                            {
                                layer.SelectSite(this.itemsite, isctrlkey);
                                if (!isctrlkey)
                                {
                                    var mis = this.parentMenu.items;
                                    for (var k = 0, m = mis.length, mi; k < m; k++)
                                    {
                                        mi = mis.getAt(k);
                                        if (mi !== this)
                                            mi.setChecked(false);
                                    }
                                }
                                this.setChecked(layer.selsites.indexOf(this.itemsite) > -1);
                            }
                        }
                }]);
            }
            this.__selectmenu.showAt(e.getXY());
        }
        else
        {
            // 选中
            this.ismouseselected = true;
            if (this.__hot)
                this.SelectSite(this.__hot, this.map.ctrlKey);
        }
    },
    OnMouseUp: function (e)
    {
        if (this.editMode)
        {
            // 新建
            if (this.__new_site && this.BuildStatus == this.__building)
            {
                this.__hot = this.__new_site;
                delete this.__new_site.tmp;
                this.__new_site = null;
            }
            this.editMode = false;
        }
        else if (!this.__isdrag && Ext.isEmpty(this.__new_site) && this.__hot)
        {
            var curtime = new Date();
            if (curtime.getTime() - this.__lasttime.getTime() > 250)
            {
                var me = this;
                this.__timeoutid = setTimeout(function ()
                {
                    me.__mouseupselect(e);
                }, 250);
            }
            else if (this.__timeoutid)
                clearTimeout(this.__timeoutid);

            this.__lasttime = curtime;
        }
        else if (this.__isdrag && Ext.isEmpty(this.__new_site) && this.__hot && this.BuildStatus == this.__building)
        {
            var tile = this.map.tile, scale = tile.canvasWidth / tile.ViewportW;
            var pt = e.getXY(), pc = tile.getXY();
            var x = (pt[0] - pc[0]) / scale + tile.ViewportX, y = (pt[1] - pc[1]) / scale + tile.ViewportY;
            pt = MyMapBase.LogicalToGeographic({ x: x, y: y });
            this.GetRealCoor(pt); // 获取真实经纬度
            var item = this.__hot;
            item.longitude = item.data.longitude = pt.longitude;
            item.latitude = item.data.latitude = pt.latitude;
            item.x = item.data.x = x;
            item.y = item.data.y = y;
        }
        this.OnCoverChange(this.__hot, null);

        this.__isdrag = false;
        this.__isdown = false;
        return true;
    },
    SelectItem: function (item, append, e)
    {
        try
        {
            var mapSearch = this.mapSearch, id = item ? item.id : undefined;
            if (append)
            {
                if (Ext.isEmpty(id) || id in mapSearch)
                    return;

                mapSearch[id] = true;
                this.Invalidate();
            }
            else
            {
                var c = 0;
                for (var i in mapSearch)
                {
                    if (i == id)
                        continue;

                    delete mapSearch[i];
                    c++;
                }

                if (Ext.isEmpty(id) || id in mapSearch)
                {
                    if (!c)
                        return;
                }
                else
                    mapSearch[id] = true;

                this.Invalidate();
            }
        }
        catch (e)
        {
            ;
        }
    },
    IsSearched: function (item)
    {
        return item && (this.mapSearch[item.site_id] || this.mapSearch[item.data.site_id]);
    },
    OnItemContextMenu: function (mis, item, e)
    {
        if (item instanceof MyApp.map.Site)
        {
            switch (this.BuildStatus)
            {
                case this.__building:
                    {
                        mis.push({ text: '覆盖范围', handler: Ext.pass(this.OnCoverChange, [item, "common"], this) });
                        break;
                    }
            }
        }

        switch (this.BuildStatus)
        {
            case this.__adjust:
                {
                    mis.push({ text: '编辑备注', handler: Ext.pass(this.ShowSiteDemo, [item], this) });
                    mis.push({ text: '选择同类站点', handler: Ext.pass(this.ShowSelectSites, [item], this) });
                    break;
                }
        }
        this.callParent(arguments);
    }
});
