Ext.define('MyApp.map.Map', {
    extend: 'MyApp.map.Panel',
    alias: 'widget.MyMap',
    requires: ['MyApp.map.GridLayer', 'MyApp.map.CellLayer', 'MyApp.map.HeatLayer', 'MyApp.map.AreagridLayer', 'MyApp.map.SiteLayer', 'MyApp.map.PlanIndoorLayer', 'MyApp.map.ProblemLayer', 'MyApp.map.GridRectLayer', 'MyApp.map.MeasureLayer', 'MyApp.util.PropertyWnd', 'MyApp.map.SearchWnd'],
    measureLayer: { xtype: 'measure_layer', name: 'measureLayer', title: '测距' },
    toolbar: {
        xtype: 'toolbar', name: 'toolbar', title: '工具栏', floating: true, autoShow: true, draggable: true, internal: true, enableOverflow: true,
        offsets: [2, 2], defaultAlign: 'tl-tl',
        style: { 'border-radius': '5px', padding: '2px 5px 2px 7px' },
        defaults: { tooltipType: 'title', style: { padding: '3px' } },
        items: [{ xtype: 'button', icon: Ext.Loader.getPath('MyApp') + '/images/icon/zoom_in.png', tooltip: '放大地图', handler: function () { this.up('map_panel').ZoomIn(); } },
                { xtype: 'button', icon: Ext.Loader.getPath('MyApp') + '/images/icon/zoom_out.png', tooltip: '缩小地图', handler: function () { this.up('map_panel').ZoomOut(); } },
                { xtype: 'tbseparator' },
                { xtype: 'button', icon: Ext.Loader.getPath('MyApp') + '/images/icon/measure.png', tooltip: '测量距离', handler: function () { var md = this.up('map_panel').measureLayer; md.measure = !md.measure; } },
                { xtype: 'tbseparator' },
                { xtype: 'button', icon: Ext.Loader.getPath('MyApp') + '/images/icon/find.png', tooltip: '查找', handler: function () { this.up('map_panel').OnSearch(undefined); } },
                { xtype: 'tbseparator' }
                /*{
                    xtype: 'combobox', hideLabel: true, queryMode: 'local', selectOnFocus: true, width: 118, emptyText: "查找 Ctrl + D", enableKeyEvents: true,
                    displayField: 'txt', store: { autoDestroy: true, fields: ['txt'], proxy: { type: "memory", reader: "array" } },
                    listeners: {
                        keydown: function (it, e)
                        {
                            switch (e.keyCode)
                            {
                                case e.RETURN:
                                    if (!this.listKeyNav || this.listKeyNav.disabled || !this.listKeyNav.boundList.highlightedItem)
                                        this.OnFind();
                                    break;
                                case e.ESC:
                                    if (!this.listKeyNav || this.listKeyNav.disabled || !this.listKeyNav.boundList.highlightedItem)
                                        this.up('map_panel').focus();
                                    break;
                                case e.D:
                                    if (e.ctrlKey)
                                    {
                                        this.focus(true, 100);
                                        e.stopEvent();
                                    }
                                    break;
                            }
                        },
                        select: function () { this.OnFind(); this.focus(true, 100); }
                    },
                    OnFind: function ()
                    {
                        var t = this.getValue();
                        t = t == null ? '' : t.replace(/\s+/g, " ").trim();
                        if (Ext.isEmpty(this.data))
                            this.data = [{ txt: t }];
                        else
                        {
                            for (var i = 0, n = this.data.length; i < n; i++)
                            {
                                if (this.data[i].txt == t)
                                {
                                    this.data.splice(i, 1);
                                    break;
                                }
                            }
                            this.data.unshift({ txt: t });
                        }

                        this.store.loadData(this.data);
                        var map = this.up('map_panel');
                        map.Find(t);
                    }
                }*/],
        applyDefaults: function (config)
        {
            if (config)
            {
                if (config.style)
                {
                    if (config.xtype != 'tbseparator')
                        Ext.applyIf(config.style, this.defaults.style);
                }
                else if (config.xtype == 'tbseparator')
                    config.style = null;
            }

            return this.callParent(arguments);
        },
        initDraggable: function ()
        {
            var dom = this.el.dom, t = document.createElement('table');
            $(t).addClass(Ext.baseCSSPrefix + 'unselectable').attr({ cellspacing: 0, cellpadding: 0 }).css({ cursor: 'move', position: 'absolute', margin: '0px', padding: '0px' });
            var clr = $(dom).css('border-left-color');
            t.innerHTML = '<tr><td style="width:6px;background:' + clr + '">&nbsp;</td><td>&nbsp;</td><td style="width:6px;background:' + clr + '">&nbsp;</td></tr>';
            dom.insertBefore(t, dom.children[0]);

            this.draggable = { el: this.getDragEl(), delegate: Ext.get(t) };
            this.callParent(arguments);
        },
        afterLayout: function (layout)
        {
            this.callParent(arguments);

            if (this.dd && this.dd.handle)
                this.dd.handle.setBox(this.getBox());
        },
        beforeSetPosition: function (x, y, animate)
        {
            if (!animate && this.floatParent)
            {
                var pos = this.floatParent.getTargetEl().getViewRegion(), w = pos.right - pos.left - 4;
                if (this.maxWidth != w)
                {
                    this.maxWidth = w;
                    this.updateLayout();
                }
            }

            return this.callParent(arguments);
        }
    },
    coordPanel: {
        xtype: 'toolbar', name: 'coordPanel', title: '坐标栏', floating: true, autoShow: true, draggable: true,
        offsets: [-6, -6], autoAlign: 'br-br', shadow: 'frame', shadowOffset: 16, opacity: 0.6,
        baseCls: undefined, itemCls: Ext.baseCSSPrefix + 'unselectable',
        style: { 'border-radius': '6px', background: '#2B2B2B', 'background-color': '#2B2B2B', border: 0, padding: '6px 6px 6px 6px' },
        defaults: { style: { padding: '2px', cursor: 'default', textAlign: 'left', color: 'white', 'font-size': '9pt' } },
        items: [{ xtype: 'tbtext', text: '&nbsp;', width: 30, align: 'right' },
        { xtype: 'tbtext', text: '&nbsp;', width: 58 },
        { xtype: 'tbtext', text: '&nbsp;', width: 58 }],
        menu: {
            xtype: 'menu', style: { 'border-radius': '6px', background: '#2B2B2B', 'background-color': '#2B2B2B', border: 0, padding: '6px' },
            defaults: { style: { padding: '2px', cursor: 'default', textAlign: 'left', 'background-color': '#2B2B2B' } },
            bodyStyle: { border: 0, padding: '0px' },
            shadow: 'frame', shadowOffset: 26, opacity: 0.75,
            showSeparator: false, plain: true, enableKeyNav: false,
            setActiveItem: function (item) { },
            items: {
                xtype: 'container',
                canActivate: true,
                disabled: false,
                layout: { type: 'vbox', align: 'stretch', pack: 'start' },
                defaults: { labelWidth: 32, labelAlign: 'right', selectOnFocus: true },
                items: [{ xtype: 'textfield', fieldLabel: '经度', name: 'longitude', value: 0 },
                            { xtype: 'textfield', fieldLabel: '纬度', name: 'latitude', value: 0 },
                            {
                                xtype: 'container', layout: { type: 'hbox', align: 'bottom', pack: 'end' },
                                items: {
                                    xtype: 'button', style: { 'border-radius': '3px', padding: '6px', margin: '0px 0px 6px 0px' },
                                    text: 'GO', handler: function () { this.up('menu').onGo(); }
                                }
                            }]
            },
            onGo: function ()
            {
                var t = this.query("[fieldLabel^=经度]")[0], lon = t.getValue();
                if (!Ext.isNumeric(lon))
                {
                    t.focus(true, true);
                    return;
                }
                t = this.query("[fieldLabel^=纬度]")[0];
                var lat = t.getValue();
                if (!Ext.isNumeric(lat))
                {
                    t.focus(true, true);
                    return;
                }

                var pt = MyMapBase.GeographicToLogical({ longitude: lon, latitude: lat });
                this.tile.SetViewCenter(pt.x, pt.y);
                this.hide();
            },
            afterRender: function ()
            {
                this.callParent(arguments);
                this.el.enableShadow();
                $(this.el.dom).find('label').css('color', 'white');

                this.__menu_hot_listeners = {
                    scope: this,
                    mouseenter: function () { this.el.setOpacity(1, true); },
                    mouseleave: function () { this.el.setOpacity(this.opacity, true); }
                };
                this.mon(this, this.__menu_hot_listeners);

                this.keyNav = Ext.create('Ext.util.KeyNav', this.el, {
                    scope: this,
                    enter: function () { this.down('button').handler(); },
                    tab: function (e)
                    {
                        e.preventDefault();

                        var t = this.down('textfield');
                        (t.hasFocus ? t.nextSibling() : t).focus(true, true);
                    }
                });

                var tile = this.tile;
                var pt = MyMapBase.LogicalToGeographic({ x: tile.ViewportX + tile.ViewportW / 2, y: tile.ViewportY + tile.ViewportW / 2 * tile.canvasHeight / tile.canvasWidth });
                this.query("[fieldLabel^=经度]")[0].setValue(pt.longitude);
                this.query("[fieldLabel^=纬度]")[0].setValue(pt.latitude);
            },
            onDestroy: function ()
            {
                delete this.keyNav;

                this.mun(this, this.__menu_hot_listeners);
                delete this.__menu_hot_listeners;

                this.callParent(arguments);
            }
        },
        onDestroy: function ()
        {
            this.mun(this.el, this.__show_menu_listeners);
            delete this.__show_menu_listeners;

            if (this.menu)
            {
                if (this.menu.isComponent && !this.menu.isDestroyed)
                    this.menu.destroy();

                delete this.menu;
            }

            this.callParent(arguments);
        },
        afterRender: function ()
        {
            this.callParent(arguments);

            this.__show_menu_listeners = {
                scope: this,
                click: this.OnContextMenu,
                dblclick: this.OnContextMenu,
                contextmenu: this.OnContextMenu
            };
            this.mon(this.el, this.__show_menu_listeners);
        },
        OnContextMenu: function (e)
        {
            e.preventDefault();

            var xy = this.getAlignToXY(this.floatParent, this.autoAlign || this.defaultAlign, this.offsets);
            if (xy[0] != this.getX() || xy[1] != this.getY())
            {
                this.setXY(xy, true);
                return;
            }

            var menu = this.menu;
            if (!menu.isComponent)
            {
                menu.width = this.getWidth();
                menu.offsets = [0, 0];
                menu = this.menu = Ext.widget(menu);
                menu.tile = this.up('map_panel').tile;
            }
            menu.showBy(this, 'br-tr', [0, -1]);
            menu.el.setOpacity(0); menu.el.setOpacity(menu.opacity, true);
            menu.down('textfield').focus(true, true);
        },
        SetLevel: function (level)
        {
            this.getComponent(0).setText(Math.round(level * 10) / 10 + 1);
        },
        SetCoord: function (lon, lat)
        {
            this.lon = lon;
            this.lat = lat;
            this.getComponent(1).setText(Math.round(lon * 10000) / 10000);
            this.getComponent(2).setText(Math.round(lat * 10000) / 10000);
        }
    },
    ctrls: [{
        xtype: 'box', name: 'switchBtn', title: '地图切换按钮', icon: 'url(' + Ext.Loader.getPath('MyApp') + '/images/mapctrls2d0.gif) 0px -176px no-repeat transparent',
        floating: true, autoShow: true, offsets: [-6, 56], autoAlign: 'tr-tr', draggable: true, shadow: 'drop', shadowOffset: 16, opacity: 0.8,
        width: 49, height: 51, overCls: 'over',
        childEls: ['btnInnerEl', 'btnIconEl'],
        renderTpl: ['<span id="{id}-btnWrap" unselectable="on" >',
                        '<span id="{id}-btnEl">',
                            '<span role="img" id="{id}-btnIconEl" data-ref="btnIconEl" class="{baseCls}-icon" unselectable="on" style="margin:2px; position: absolute; top: 0px;left: 0px; width:43px; height:45px;',
                                '<tpl if="icon">background:{icon};</tpl>">&#160;',
                            '</span>',
                            '<span id="{id}-btnInnerEl" data-ref="btnInnerEl" class="{baseCls}-inner" style="margin: 3px; position: absolute; top: 27px; width: 41px; color: white; text-align: center; line-height: 16px;" unselectable="on">',
                                '{text}',
                            '</span>',
                        '</span>',
                    '</span>'],
        initRenderData: function ()
        {
            return Ext.apply(this.callParent(arguments), { icon: this.icon, text: this.text || '' });
        },
        baseCls: function (id)
        {
            if (document.getElementById(id))
                return id;

            var cssText = '.' + id + '{border: 1px solid rgb(128, 128, 128); background: rgb(255, 255, 255);cursor: pointer;}';

            cssText += '.' + id + '-icon {border:1px solid rgb(128, 128, 128);}';
            cssText += '.' + id + '-inner {background: rgba(128, 128, 128,0.5);}';

            cssText += '.' + id + '-icon-over {border:1px solid rgb(131, 161, 255);}';
            cssText += '.' + id + '-inner-over {background: rgb(131, 161, 255);}';


            cssText += '.' + id + '-icon-pressed {border:1px solid rgb(96, 128, 192);}';
            cssText += '.' + id + '-inner-pressed {background: rgb(96, 128, 192);}';

            Ext.util.CSS.createStyleSheet(cssText, id);

            return id;
        }('__map_switch_btn_cls'),
        addClsWithUI: function (classes, skip)
        {
            if (typeof classes === "string")
                classes = (classes.indexOf(' ') < 0) ? [classes] : Ext.String.splitWords(classes);

            for (var i = 0, n = classes.length, cls; i < n; i++)
            {
                cls = classes[i];
                if (this.btnIconEl)
                    this.btnIconEl.addCls(this.baseCls + '-icon-' + cls);
                if (this.btnInnerEl)
                    this.btnInnerEl.addCls(this.baseCls + '-inner-' + cls);
            }

            return this.callParent(arguments);
        },
        removeClsWithUI: function (classes, skip)
        {
            if (typeof classes === "string")
                classes = (classes.indexOf(' ') < 0) ? [classes] : Ext.String.splitWords(classes);

            for (var i = 0, n = classes.length, cls; i < n; i++)
            {
                cls = classes[i];
                if (this.btnIconEl)
                    this.btnIconEl.removeCls(this.baseCls + '-icon-' + cls);
                if (this.btnInnerEl)
                    this.btnInnerEl.removeCls(this.baseCls + '-inner-' + cls);
            }

            return this.callParent(arguments);
        },
        addOverCls: function () { this.addClsWithUI(this.overCls); },
        removeOverCls: function () { this.removeClsWithUI(this.overCls); },
        onDestroy: function ()
        {
            this.mun(this, this.btnListeners);
            delete this.btnListeners;

            this.callParent(arguments);
        },
        afterRender: function ()
        {
            this.callParent(arguments);
            this.setTile(0);

            this.btnListeners = {
                scope: this,
                mousedown: function (e) { this.addClsWithUI('pressed'); },
                mouseup: function (e) { this.removeClsWithUI('pressed'); },
                click: this.handler
            };
            this.mon(this.el, this.btnListeners);
        },
        endDrag: function () { this.removeClsWithUI('pressed'); },
        GetTileURL: function (level, x, y)
        {
            //if (!this.img)
            //{
            //    this.img = new Image();
            //    this.img.src = "http://www.google.cn/maps/vt?gl=cn&x=1&y=1&z=1&" + (+new Date());
            //}
            //if (this.img.complete && this.img.width > 0)
            //    return Ext.String.format('http://www.google.cn/maps/vt?gl=cn&x={1}&y={2}&z={0}', level, x, y);
            //else
            //return APPBASE + '/gisimgController.do?method=getMap&service=db&type=street&zoom=' + this.Format(level + 1, 2) + '&name=' + (y + 1) + this.Format(x + 1, 8);
        	//return APPBASE + '/gisimgcontroller.do?type=street&zoom=' + this.Format(level + 1, 2) + '&name=' + (y + 1) + this.Format(x + 1, 8);
        	return Ext.String.format('http://www.google.cn/maps/vt?gl=cn&x={1}&y={2}&z={0}', level, x, y);
        },
        SetTileSource: function (source, next_name, next_tip, next_icon)
        {
            this.up('map_panel').tile.SetTileSource(source);
            this.btnInnerEl.update(next_name);
            this.el.dom.setAttribute('title', next_tip);
            this.btnIconEl.setStyle('background', next_icon);
        },
        setTile: function (i)
        {
            switch (this.__tile = i % 3)
            {
                case 0:
                    //return this.SetTileSource('http://www.google.cn/maps/vt?gl=cn&x={1}&y={2}&z={0}', '卫星', '显示卫星地图', 'url(' + Ext.Loader.getPath('MyApp') + '/images/mapctrls2d0.gif) 0px -176px no-repeat transparent');
                    return this.SetTileSource(this.GetTileURL, '卫星', '显示卫星地图', 'url(' + Ext.Loader.getPath('MyApp') + '/images/mapctrls2d0.gif) 0px -176px no-repeat transparent');
                case 1:
                    return this.SetTileSource('http://www.google.cn/maps/vt?gl=cn&x={1}&y={2}&z={0}&lyrs=y', '本地', '显示普通本地地图', 'url(' + Ext.Loader.getPath('MyApp') + '/images/mapctrls2d0.gif) 0px -131px no-repeat transparent');
                case 2:
                    return this.SetTileSource(this.GetTileURL, '地图', '显示普通地图', 'url(' + Ext.Loader.getPath('MyApp') + '/images/mapctrls2d0.gif) 0px -221px no-repeat transparent');
            }
        },
        handler: function ()
        {
            var xy = this.getAlignToXY(this.floatParent, this.autoAlign || this.defaultAlign, this.offsets);
            if (xy[0] != this.getX() || xy[1] != this.getY())
                this.setXY(xy, true);
            else
                this.setTile(this.__tile ? this.__tile + 1 : 1);
        }
    }],
    PropertyWnd: {
        xtype: 'MyPropertyWnd', name: 'PropertyWnd', title: '小区信息 - ' + document.title, closeAction: 'hide',
        defaultAlign: 'r-r', offsets: [-6, 0], shadow: 'drop', shadowOffset: 39, width: 260, height: 390, minWidth: 160, minHeight: 160
    },
    SearchWnd: {
        xtype: 'map_SearchWnd', name: 'SearchWnd', closeAction: 'hide', defaultAlign: 'r-r', offsets: [-6, 0], shadow: 'drop', shadowOffset: 39, configurable: false,
        args: undefined/*增加查询时的参数*/,
        onSel: function (id, lon, lat, x, y)
        {
            var map = this.up('map_panel');
            for (var ci = map.Find(id) ; ci; ci = map.Find(id))
            {
                if (ci.id == id)
                    return;
            }

            if (!x || !y)
            {
                var pt = MyMapBase.GeographicToLogical({ longitude: lon, latitude: lat });
                x = pt.x;
                y = pt.y;
            }
            map.tile.SetViewCenter(x, y, Math.max(map.tile.TargetLevel, 15));
            MyCommon.Invoke(map.layers, 'SelectItem', [{ id: id }, false, null]);
        },
        DoSearch: function ()
        {
            /****************************************************/
            // 组织图层的配置条件
            var map = this.up('map_panel');
            if (!map)
                return;

            var layer, layers = map.layers;
            var findlayer, findlayers = [], idx, datamethod;
            for (var i = 0, n = layers.length; i < n; i++)
            {
                layer = layers[i];
                if (layer.Visible && !layer.dummy && !(layer instanceof MyApp.map.MeasureLayer) && !Ext.isEmpty(layer.uri))
                {
                    idx = layer.uri.lastIndexOf('.');
                    if (idx == -1)
                        continue;
                    datamethod = layer.uri.substr(idx + 1);
                    findlayer = Ext.apply({ type: layer.xtype, name: layer.name, title: layer.title, network: layer.network, cover_type: layer.cover_type, datamethod: datamethod }, layer.args);
                    findlayers.push(findlayer);
                }
            }
            if (findlayers.length == 0)
            {
                Ext.Msg.alert('当前没有任何图层数据显示，不能进行查找！');
                return;
            }
            this.args = { cond: map.cur_querycondition, layers: findlayers };
            /****************************************************/

            this.callParent(arguments);
        }
    },
    LegendWnd: { xtype: 'map_legend_editor', name: 'LegendWnd', title: '图例编辑', closeAction: 'hide', defaultAlign: 'r-r', offsets: [-6, 0], shadow: 'drop', shadowOffset: 39, configurable: false },
    BookmarkWnd: {
        xtype: 'window', name: 'BookmarkWnd', closeAction: "hide", defaultAlign: 'c-c',
        title: "书签 - " + document.title,
        icon: Ext.Loader.getPath('MyApp') + '/images/icon/bookmark.png',
        layout: { type: "fit", columns: 1, align: "stretch", pack: "start" },
        shadow: 'drop', shadowOffset: 39, bodyPadding: 9, minWidth: 260, minHeight: 100,
        bookmarks: function (a, b) { return a[b] || (a[b] = ((Ext.isEmpty(window.location.hostname) || window.location.hostname.search(/^localhost$/) >= 0) ? [{ name: '财富中心', args: [0.7958690840004279, 0.4138249284499758, 16] }] : [])); }(window.top, '__map_bookmarks'),
        items: {
            xtype: 'textfield', emptyText: "在这里输入书签名称", fieldLabel: "书签", labelWidth: 35, enableKeyEvents: true,
            listeners: { keydown: function (it, e) { if (e.keyCode == 13) this.up('window').OnOK(); } }
        },
        buttons: [{ xtype: "button", text: "确定", handler: function () { this.up('window').OnOK(); } },
        { xtype: "button", text: "关闭", handler: function () { this.up('window').close(); } }],
        focus: function () { this.down('textfield').focus(true, true); return this; },
        OnOK: function ()
        {
            var ta = this.items.getAt(0), name = ta.getValue().trim();
            if (Ext.isEmpty(name) || name.length > 16)
            {
                Ext.Msg.alert(this.title, '请输入1-16个字符!', ta.focus, ta);
                return;
            }

            var bookmarks = this.bookmarks, tile = this.up('map_panel').tile;
            for (var i = bookmarks.length; i-- > 0;)
            {
                if (bookmarks[i].name == name)
                {
                    bookmarks.splice(i, 1);
                    break;
                }
            }

            bookmarks.push({ name: name, args: [tile.TargetX + tile.TargetW / 2, tile.TargetY + tile.TargetW / 2 * tile.canvasHeight / tile.canvasWidth, tile.TargetLevel] });
            if (bookmarks.length > 9)
                bookmarks.splice(0, bookmarks.length - 9);
            this.close();
        }
    },
    initComponent: function ()
    {
        var grid_defaults = this.gridLayer_defaults, cell_defaults = this.cellLayer_defaults;
        $(this.gridLayer).each(function () { Ext.applyIf(this, grid_defaults); });
        $(this.cellLayer).each(function () { Ext.applyIf(this, cell_defaults); });

        var tbar = this.tbar;
        this.tbar = null;

        this.layers = Array.prototype.concat(this.layers, this.gridLayer, this.cellLayer, this.measureLayer);
        this.items = Array.prototype.concat(this.items, this.toolbar, this.coordPanel, this.ctrls, this.PropertyWnd, this.SearchWnd, this.LegendWnd, this.BookmarkWnd);

        this.callParent(arguments);

        if (!Ext.isEmpty(tbar))
        {
            this.toolbar.add({ xtype: 'tbseparator' });
            this.toolbar.add(tbar);
        }
    },
    __priorField:
    {
        city: ['city_id', 'city', 'city_code'],
        province: ['province_id', 'province', 'province_code']
    },
    __getQueryCenter: function (condition)
    {
        if (Ext.isEmpty(brd.cityCenter))
            return null;

        //根据查询条件得到需要进行中心点定位的经纬度后设置中心点后再执行查询操作
        var conds = condition.requestConditions || [], cond;
        var fieldattr = Object.getOwnPropertyNames(this.__priorField) || [], fields, bound, pt, vals;
        for (var k = 0, m = fieldattr.length; k < m; k++)
        {
            fields = this.__priorField[fieldattr[k]];
            for (var i = 0, n = conds.length; i < n; i++)
            {
                cond = conds[i];
                if (fields.indexOf(cond.name.toLowerCase()) > -1 && !Ext.isEmpty(cond.value))
                {
                    vals = (cond.value + '').split(',');
                    bound = brd.cityCenter[vals[0]];
                    if (bound)
                        return { longitude: bound[0], latitude: bound[1] };
                }
            }
        }
        return null;
    },
    OnQuery: function (condition)
    {
        this.cur_querycondition = condition;
        var pt = this.__getQueryCenter(condition);
        if (pt)
        {
            MyMapBase.GeographicToLogical(pt);
            this.tile.SetViewCenter(pt.x, pt.y);
        }
        MyCommon.Invoke([this.layers, this.plugins], 'OnQuery', arguments);
    },
    OnViewportChanged: function (bFinally, tile)
    {
        this.callParent(arguments);
        if (this.coordPanel)
            this.coordPanel.SetLevel(tile.ZoomLevel);
    },
    HitTest: function (cx, cy, e)
    {
        if (e && this.coordPanel)
        {
            var tile = this.tile, size = this.tile.TotalSize;
            var pt = MyMapBase.LogicalToGeographic({ x: tile.ViewportX + cx / size, y: tile.ViewportY + cy / size });
            if (pt.x > 0 && pt.y > 0)
                this.coordPanel.SetCoord(pt.longitude, pt.latitude);
        }

        return this.callParent(arguments);
    },
    OnKeyDown: function (e)
    {
        switch (e.keyCode)
        {
            case e.D:
                if (e.ctrlKey && this.toolbar)
                {
                    var cb = this.toolbar.down('combobox');
                    if (cb)
                    {
                        cb.focus(true, 100);
                        e.stopEvent();
                    }
                    return;
                }
                break;
            case e.F:
                if (e.ctrlKey)
                {
                    e.stopEvent();
                    this.OnSearch();
                    return;
                }
                break;
            case e.F2:
                if (this.BookmarkWnd)
                {
                    e.stopEvent();
                    this.OnAddBookmark();
                    return;
                }
                break;
            case e.F3:
                e.stopEvent();
                this.OnSearch();
                return;
        }

        this.callParent(arguments);
    },
    CreateFilterReg: function (s)
    {
        if (Ext.isEmpty(s))
            return null;

        s = s.replace(/\s+/g, " ").trim();
        if (Ext.isEmpty(s))
            return null;

        var ss = s.split(/\s+/), r = /(?!([a-z]|[0-9]|$))/gi;
        for (var i = 0, n = ss.length; i < n; i++)
        {
            ss[i] = ss[i].replace(r, '\\$&');
        }

        return new RegExp(ss.join('|'), 'gi');
    },
    Find: function (s)
    {
        var info = this.__findInfo;
        if (!info)
            info = this.__findInfo = {};

        if (info.txt != s)
        {
            info.txt = s;
            info.reg = this.CreateFilterReg(s);
            info.iLayer = 0;
            info.iCell = -1;
        }

        var reg = info.reg;
        if (reg)
        {
            var layers = this.layers, layer, cells, cell;
            for (var i = 0, j = info.iCell + 1, k = info.iLayer, n = layers.length, m; i < n; i++, j = 0)
            {
                layer = layers[(i + k) % n];
                if (!(layer instanceof MyApp.map.CellLayer))
                    continue;

                cells = layer.cells;
                if (Ext.isEmpty(cells))
                    continue;

                for (m = cells.length; j < m; j++)
                {
                    cell = cells[j];
                    if (reg.test(cell.id) || reg.test(cell.name))
                    {
                        info.iLayer = (i + k) % n;
                        info.iCell = j;
                        this.SelectItem(cell, layer, false, null);

                        if (this.PropertyWnd && this.PropertyWnd.isVisible())
                            this.ShowProperty(this.GetPropertyInfo(cell, layer));

                        this.tile.SetViewCenter(cell.x / layer.UNIT, cell.y / layer.UNIT, Math.max(16, this.tile.TargetLevel));

                        return cell;
                    }
                }
            }
        }

        info.iLayer = 0;
        info.iCell = -1;
        this.SelectItem(null, null, false, null);
    },
    GetPropertyInfo: function (item, layer)
    {
        var info = layer.GetPropertyInfo(item);

        if (info)
        {
            if (Ext.isArray(info.data))
            {
                var kpiinfo = layer.GetKPIInfo(item, false);
                if (kpiinfo && kpiinfo.data)
                    info.data = info.data.concat(kpiinfo.data);
            }
            return info;
        }
        return layer.GetKPIInfo(item, true);
    },
    ShowProperty: function (info, menuitem, e)
    {
        if (!info)
            return;

        var wnd = this.PropertyWnd;
        if (wnd && !Ext.isEmpty(info.data))
        {
            wnd.setData(info.data);
            if (!wnd.isVisible())
                wnd.show(menuitem);

            wnd.setTitle((info.title || '属性') + ' - ' + document.title);
        }
    },
    OnSearch: function (menuitem, e)
    {
        if (this.SearchWnd)
            this.SearchWnd.show(menuitem);
    },
    ShowLegendWnd: function(map, layer, kpi, kpiname/*kpi对象在图层中的映射名，不是kpi的字段名*/)
    {
        if (this.LegendWnd)
        {
            this.LegendWnd.setData(map, layer, kpi, kpiname);
            this.LegendWnd.show();
        }
    },
    OnMeasure: function ()
    {
        if (this.measureLayer instanceof MyApp.map.MeasureLayer)
        {
            this.measureLayer.Visible = true;
            this.measureLayer.measure = true;
        }
    },
    OnAddBookmark: function (menuitem, e)
    {
        this.BookmarkWnd.show(menuitem);
    },
    GetTip: function (item, layer)
    {
        if (Ext.isObject(item) && !Ext.isEmpty(item.infotype) && Ext.String.Compare(item.infotype, "kpiinfo", true) == 0)
        {
            if (!Ext.isEmpty(item.tip))
                return item.tip;
            else
                return null;
        }

        return this.callParent(arguments);
    },
    OnItemClick: function (item, layer, e)
    {
        this.callParent(arguments);

        if (layer && this.PropertyWnd && this.PropertyWnd.isVisible())
            this.ShowProperty(this.GetPropertyInfo(item, layer));
    },
    OnItemDblClick: function (item, layer, e)
    {
        this.callParent(arguments);

        if (layer && this.PropertyWnd)
            this.ShowProperty(this.GetPropertyInfo(item, layer));
    },
    __layermenu_group: function (parmenus, groupmenus, layer)
    {
        if (!Ext.isEmpty(layer.menugroup))
        {
            /************************************************/
            var gptxts = layer.menugroup.split('.'), premenu, pretxt = '';
            for (var k = 0, m = gptxts.length; k < m; k++)
            {
                menuname = !Ext.isEmpty(pretxt) ? pretxt + '.' + gptxts[k] : gptxts[k];
                if (!groupmenus[menuname])
                {
                    groupmenus[menuname] = new Ext.menu.Menu();
                    if (k == 0)
                        parmenus.push({ xtype: 'menuitem', text: gptxts[k], menu: groupmenus[menuname] });
                    else
                        premenu.add({ xtype: 'menuitem', text: gptxts[k], menu: groupmenus[menuname] });
                }
                premenu = groupmenus[menuname];
                pretxt = menuname;
            }

            if (m > 0 && premenu)
                premenu.add({ text: layer.title, checked: layer.Visible, handler: Ext.pass(function () { this.Visible = !this.Visible; }, undefined, layer) });
        }
        else
            parmenus.push({ text: layer.title, checked: layer.Visible, handler: Ext.pass(function () { this.Visible = !this.Visible; }, undefined, layer) });
    },
    OnItemContextMenu: function (mis, item, layer, e)
    {
        this.callParent(arguments);

        var root = Ext.Loader.getPath('MyApp');
        if (layer)
        {
            var info = this.GetPropertyInfo(item, layer);
            if (info)
                mis.push({ text: '<b>' + Ext.String.htmlEncode(info.title) + '</b>', icon: root + '/images/icon/property.png', handler: Ext.pass(this.ShowProperty, [info], this) });
        }

        if (this.measureLayer instanceof MyApp.map.MeasureLayer)
            mis.push({ text: '测距', icon: root + '/images/icon/measure.png', handler: Ext.pass(this.OnMeasure, undefined, this) });

        if (this.SearchWnd)
            mis.push({ text: '查找', icon: root + '/images/icon/find.png', handler: Ext.pass(this.OnSearch, undefined, this) });

        if (this.BookmarkWnd)
        {
            var sm = [], bookmarks = this.BookmarkWnd.bookmarks;

            mis.push({ text: '书签', hideOnClick: false, menu: sm });
            sm.push({ text: '添加书签...', icon: root + '/images/icon/bookmark.png', handler: Ext.pass(this.OnAddBookmark, undefined, this) });
            sm.push('-');
            sm.push({ text: '初始位置', icon: root + '/images/icon/start_here.png', handler: Ext.pass(this.UpdateViewCenter, undefined, this) });

            if (bookmarks)
            {
                for (var i = bookmarks.length, mark, tile = this.tile; i-- > 0;)
                {
                    mark = bookmarks[i];
                    sm.push({ text: mark.name, handler: Ext.pass(tile.SetViewCenter, mark.args, tile) });
                }
            }
        }
        mis.push('-');

        // 图例编辑菜单
        for (var i = 0, n = this.layers.length, layer, pv; i < n; i++)
        {
            layer = this.layers[i];
            if (layer.dummy)
                continue;

            var kpis = layer.__kpis;
            if (kpis)
            {
                for (var name in kpis)
                {
                    if (kpis[name])
                    {
                        mis.push({ text: '编辑图例', handler: Ext.pass(this.ShowLegendWnd, [this, layer, kpis[name], name], this) });
                        break;
                    }
                }
                break;
            }
        }

        var smtile = [];
        /***********************************************/
        // 直接通过tilelayer的visible属性隐藏地理图层
        if (this.tile)
        {
            smtile.push({
                text: '地理图层', checked: this.tile.isVisible(), handler: Ext.pass(function ()
                {
                    var bln = !this.isVisible();
                    this.setVisible(bln);

                    var sw = this.up('map_panel').switchBtn;
                    if (sw)
                        sw.setVisible(bln);
                }, undefined, this.tile)
            });
        }
        /***********************************************/

        var sm = [], layers = this.layers;
        // 记录多级菜单的父菜单以及所有的分组菜单
        var parmenus = [], groupmenus = {};

        for (var i = 0, n = layers.length, layer, pv; i < n; i++)
        {
            layer = layers[i];
            if (layer.dummy)
                continue;
            // idmp不需要切分边界菜单，所以注释
            //if (pv === undefined && layer instanceof MyApp.map.CellLayer && !Ext.isEmpty(layer.pve))
            //{
            //    pv = layer.PolygonVisible;
            //    mis.push({ text: '切分边界', hideOnClick: true, checked: pv, handler: Ext.pass(layers.forEach, [Ext.pass(function (v, layer) { if (layer instanceof MyApp.map.CellLayer) layer.PolygonVisible = v; }, !pv)], layers) });
            //}

            if (!Ext.isEmpty(layer.title) && !(layer instanceof MyApp.map.MeasureLayer) && !layer.isbase)
                sm.push({ text: layer.title, checked: layer.Visible, handler: Ext.pass(function () { this.Visible = !this.Visible; }, undefined, layer) });
            else if (layer.isbase)
                this.__layermenu_group(parmenus, groupmenus, layer);
                //smbase.push({ text: layer.title, checked: layer.Visible, handler: Ext.pass(function () { this.Visible = !this.Visible; }, undefined, layer) });
        }
        sm.push('-');
        sm = sm.concat(smtile).concat(parmenus);
        var fnActivate = function ()
        {
            this.callParent(arguments);

            if (this.checked && 'opacity' in this.tag)
            {
                var v = this.tag.opacity, a = { duration: 100 };
                this.tag.el.setOpacity(0, a).setOpacity(0, a).setOpacity(v, a).setOpacity(v, a).
                                setOpacity(0, a).setOpacity(0, a).setOpacity(v, a).setOpacity(v, a);
            }
        };
        var fnDeactivate = function ()
        {
            this.callParent(arguments);

            if (this.checked && 'opacity' in this.tag)
            {
                this.tag.el.stopAnimation();
                this.tag.el.setOpacity(this.tag.opacity);
            }
        };
        for (var i = 0, n = this.items.length, it; i < n; i++)
        {
            it = this.items.getAt(i);
            if (!Ext.isEmpty(it.title) && it.configurable != false)
                sm.push({
                    text: it.title, checked: it.isVisible(), tag: it, activate: fnActivate, deactivate: fnDeactivate,
                    handler: Ext.pass(function () { this.isVisible() ? this.hide() : this.show(); }, undefined, it)
                });
        }
        // idmp不需要其他浮动窗口图层菜单，暂时注释
        //for (var i = 0, n = this.floatingItems.length, it; i < n; i++)
        //{
        //    it = this.floatingItems.getAt(i);
        //    if (!Ext.isEmpty(it.title) && it.configurable != false)
        //        sm.push({
        //            text: it.title, checked: it.isVisible(), tag: it, activate: fnActivate, deactivate: fnDeactivate,
        //            handler: Ext.pass(function (mi) { this.isVisible() ? this.hide(mi) : this.show(mi); }, undefined, it)
        //        });
        //}
        if (sm.length)
            mis.push({ text: '图层', icon: root + '/images/icon/layers.png', hideOnClick: false, menu: sm });
    },
    SetLayerSiteCovered: function (site)
    {
        var layers = this.layers, layer;
        for (var i = 0, n = layers.length; i < n; i++)
        {
            layer = layers[i];
            if (layer.Visible && !layer.dummy && Ext.isFunction(layer.OnSiteCover))
                layer.OnSiteCover.apply(layer, arguments);
        }
    }
});
