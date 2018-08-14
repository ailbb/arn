Ext.define('MyApp.map.Panel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.map_panel',
    requires: ['MyApp.util.Task', 'MyApp.map.TileLayer', 'MyApp.map.Layer'],
    layout: 'fit',
    InitLongitude: 113.31444,
    InitLatitude: 23.12062,
    InitZoomLevel: 16,
    openhand_cur: 'url(' + Ext.Loader.getPath('MyApp') + '/images/cur/openhand.cur)' + (Ext.isIE ? '' : ' 6 0') + ', default',
    closedhand_cur: 'url(' + Ext.Loader.getPath('MyApp') + '/images/cur/closedhand.cur)' + (Ext.isIE ? '' : '6 0') + ', move',
    tile: {},
    tile_defaults: {
        xtype: 'TileLayer', name: 'tile', zIndex: -999, style: { position: 'absolute', 'background-color': 'rgb(243,240,232)' },
        OnViewportChanged: function (bFinally)
        {
            this.self.prototype.OnViewportChanged.apply(this, arguments);
            this.up('map_panel').OnViewportChanged(bFinally, this);
        }
    },
    canvas: {
        xtype: 'canvas', name: 'canvas', zIndex: -666, style: { position: 'absolute' },
        onResize: function (width, height, oldWidth, oldHeight)
        {
            this.self.prototype.onResize.apply(this, arguments);
            this.up('map_panel').OnSize(width, height, this);
        },
        OnDraw: function (ctx)
        {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            this.up('map_panel').OnDraw(ctx, this);
        }
    },
    __bound_changed: 0,
    layer_defaults: { xtype: 'mapbase_layer', __bound_changed: 0 },
    layers: [],
    mouse_site: {
        xtype: 'box', name: 'mouse_site', zIndex: -333, style: { position: 'absolute' },
        SetCursor: function (v) { this.el.dom.style.cursor = v; },
        getFocusEl: function () { return this.el; },
        afterRender: function ()
        {
            this.self.prototype.afterRender.apply(this, arguments);

            if (Ext.isIE)
                this.el.dom.innerHTML = '<img src="' + Ext.Loader.getPath('MyApp') + '/images/blank.gif" style="left: 0px; top: 0px; width: 100%; height: 100%; -ms-user-select: none" draggable="false" />';

            this.addCls(Ext.baseCSSPrefix + 'unselectable');
            var cursor = this.cursor;
            Object.defineProperties(this, {
                cursor: {
                    get: function () { return this.el.dom.style.cursor; },
                    set: function (v) { if (this.cursor !== v) setTimeout(Ext.pass(this.SetCursor, [v], this), 0); }
                }
            });
            this.cursor = cursor;
        }
    },
    tip: { xtype: 'tooltip', autoHide: false, shadow: 'drop', shadowOffset: 16, afterRender: function () { this.self.prototype.afterRender.apply(this, arguments); this.el.enableShadow(); } },
    floater_defaults: { /*autoAlign: undefined, defaultAlign: undefined, */offsets: [0, 0], opacity: 0.85, shadow: 'drop', shadowOffset: 16, endDrag: Ext.emptyFn },
    AddLayer: function (cfg)
    {
        var layer;
        if (Ext.isArray(cfg))
        {
            layer = [];
            for (var i = 0, n = cfg.length; i < n; i++)
            {
                layer.push(this.AddLayer(cfg[i]));
            }
        }
        else
        {
            if (cfg instanceof MyApp.map.Layer)
                layer = cfg;
            else if (Ext.isObject(cfg))
                layer = Ext.widget(Ext.applyIf(cfg, this.layer_defaults));

            if (!layer)
                return layer;

            this.layers.push(layer);
            if (!Ext.isEmpty(layer.name) && (!(layer.name in this) || this[layer.name] === cfg))
                this[layer.name] = layer;

            this.initLayer(layer);
            this.SortLayer();
        }

        return layer;
    },
    initLayer: function (layer)
    {
        layer.OnInitUpdate(this.canvas, this.tile);
    },
    constructPlugin: function (plugin)
    {
        plugin = this.callParent(arguments);
        if (!plugin)
            return plugin;

        if (plugin.name && !(plugin.name in this))
            this[plugin.name] = plugin;

        return plugin;
    },
    initComponent: function ()
    {
        var items = Array.prototype.concat(Ext.applyIf(this.tile, this.tile_defaults), this.canvas, this.mouse_site, this.items).filter(function (v) { return Ext.isObject(v); });
        items.sort(function (a, b) { return (a.zIndex || 0) - (b.zIndex || 0); });
        this.items = items;

        this.callParent(arguments);

        var __state = 0, __ctrlKey = false;
        var ps = {
            task: { value: new MyApp.util.Task() },
            tip: { value: Ext.widget(this.tip), configurable: true },
            layers: { value: [] },
            SelBox: { value: {} },
            state_none: { value: 0 },
            state_menu: { value: 1 },
            state_down: { value: 2 },
            state_pan: { value: 3 },
            state_sel: { value: 4 },
            state_layer_down: { value: 5 },
            state_item_down: { value: 6 },
            state: {
                get: function () { return __state; },
                set: function (v) { __state = v; }
            },
            ctrlKey: {
                get: function () { return __ctrlKey; },
                set: function (v) { __ctrlKey = v; }
            }
        };

        items = this.items;
        for (var i = 0, n = items.length, it; i < n; i++)
        {
            it = items.getAt(i);
            if (!Ext.isEmpty(it.name))
                ps[it.name] = { value: it };
        }

        items = this.floatingItems;
        for (var i = 0, n = items.length, it; i < n; i++)
        {
            it = items.getAt(i);
            if (!Ext.isEmpty(it.name))
                ps[it.name] = { value: it };
        }

        var layers = this.layers;
        Object.defineProperties(this, ps);
        this.AddLayer(layers);
    },
    applyDefaults: function (config)
    {
        config = this.callParent(arguments);
        if (config)
        {
            if (config.floating)
                Ext.applyIf(config, this.floater_defaults);
            else if (!('floating' in config) && !config.isComponent)
            {
                var t = Ext.ClassManager.get(Ext.ClassManager.getNameByAlias('widget.' + config.xtype));
                if (t && t.prototype.floating)
                    Ext.applyIf(config, this.floater_defaults);
            }
        }

        return config;
    },
    OnAddItem: function (me, item)
    {
        if (!Ext.isEmpty(item.name))
            this[item.name] = item;

        if (item.floating)
        {
            Ext.override(item, {
                onDestroy: function ()
                {
                    this.mun(this.el, this.__floater_hot_listeners);
                    delete this.__floater_hot_listeners;

                    if (this.__dd_listeners)
                    {
                        this.mun(this.dd.handle, this.__dd_listeners);
                        delete this.__dd_listeners;
                    }

                    this.callParent(arguments);
                },
                afterRender: function ()
                {
                    this.callParent(arguments);

                    this.el.setOpacity(this.opacity);
                    this.__floater_hot_listeners = {
                        scope: this,
                        mouseenter: function () { this.el.setOpacity(1, true); },
                        mouseleave: function () { this.el.setOpacity(this.opacity, true); }
                    };
                    this.mon(this.el, this.__floater_hot_listeners);
                },
                afterFirstLayout: function (width, height)
                {
                    this.callParent(arguments);

                    var align = this.autoAlign || this.defaultAlign;
                    if (align)
                        this.alignTo(this.floatParent, align, this.offsets);
                },
                initDraggable: function ()
                {
                    this.callParent(arguments);

                    if (this.dd && this.dd.handle)
                    {
                        this.__dd_listeners = {
                            scope: this,
                            delegate: this.dd.delegate,
                            dblclick: function ()
                            {
                                if (!this.maximizable)
                                {
                                    var align = this.autoAlign || this.defaultAlign;
                                    if (align)
                                        this.alignTo(this.floatParent, align, this.offsets, true);
                                }
                            }
                        };

                        this.mon(this.dd.handle, this.__dd_listeners);
                    }
                },
                setXY: function (xy, animate)
                {
                    this.callParent(arguments);

                    if (this.floatParent)
                    {
                        var pos = this.floatParent.getTargetEl().getViewRegion();
                        this.x = xy[0] - pos.x;
                        this.y = xy[1] - pos.y;
                    }

                    this.syncShadow();
                },
                beforeSetPosition: function (x, y, animate)
                {
                    if (!animate && this.floatParent)
                    {
                        var pos = this.floatParent.getTargetEl().getViewRegion();
                        if (this.internal)
                        {
                            x = Math.max(Math.min(x, pos.right - pos.left - this.getWidth()), 0);
                            y = Math.max(Math.min(y, pos.bottom - pos.top - this.getHeight()), 0);
                        }
                        else
                        {
                            x = Math.max(Math.min(x, Ext.Element.getViewportWidth() - pos.left - this.getWidth()), -pos.left);
                            y = Math.max(Math.min(y, Ext.Element.getViewportHeight() - pos.top - this.getHeight()), -pos.top);
                        }

                        var align = this.autoAlign || this.defaultAlign;
                        if (align)
                        {
                            var xy = this.getAlignToXY(this.floatParent, align, this.offsets);
                            xy[0] -= pos.left; xy[1] -= pos.top;
                            if (Math.abs(x - xy[0]) < 16) x = xy[0];
                            if (Math.abs(y - xy[1]) < 16) y = xy[1];
                        }
                    }

                    return this.callParent(arguments);
                },
                afterSetPosition: function (ax, ay)
                {
                    this.callParent(arguments);
                    this.syncShadow();
                },
                endDrag: function ()
                {
                    this.callParent(arguments);
                    if (this.autoAlign)
                        this.alignTo(this.floatParent, this.autoAlign, this.offsets, true);

                    this.syncShadow();
                }
            });

            if (this.rendered && !item.rendered && item.autoShow)
                item.show();
        }
    },
    add: function ()
    {
        this.on('add', this.OnAddItem, this);
        try
        {
            return this.callParent(arguments);
        }
        finally
        {
            this.un('add', this.OnAddItem, this);
        }
    },
    mask: function (msg)
    {
        var mask = this.__loadmask;
        if (mask)
            mask.msg = msg || mask.msg;
        else
            mask = this.__loadmask = new Ext.LoadMask({ target: this, msg: msg || '正在加载...', useMsg: true, __locked: 0 });

        mask.__locked++;
        mask.show();
    },
    unmask: function ()
    {
        var mask = this.__loadmask;
        if (mask && mask.__locked)
        {
            mask.__locked--;
            if (!mask.__locked)
                mask.hide();
        }
    },
    afterRender: function ()
    {
        this.callParent(arguments);

        this.__mouse_site_listeners = {
            scope: this,
            keydown: this.OnKeyDown,
            keyup: this.OnKeyUp,
            mousewheel: this.OnMouseWheel,
            mouseenter: this.OnMouseEnter,
            mouseleave: this.OnMouseLeave,
            mousemove: this.OnMouseMove,
            mousedown: this.OnMouseDown,
            mouseup: this.OnMouseUp,
            contextmenu: this.OnContextMenu,
            dblclick: this.OnDblClick,
            pinchstart: function (e)
            {
                var tile = this.tile;
                this.__tw = tile.TargetW;
                this.__px = tile.TargetX + (e.getX() - tile.getX()) * tile.TargetW / tile.canvasWidth;
                this.__py = tile.TargetY + (e.getY() - tile.getY()) * tile.TargetW / tile.canvasWidth;
            },
            pinch: function (e)
            {
                if (!e.scale || !Ext.isNumber(this.__px) || !Ext.isNumber(this.__py))
                    return;

                var tile = this.tile, w = this.__tw / e.scale, x = e.getX() - tile.getX(), y = e.getY() - tile.getY();
                if (!Ext.isNumber(x) || !Ext.isNumber(y))
                    return;

                this.__px = tile.TargetX + (e.getX() - tile.getX()) * tile.TargetW / tile.canvasWidth;
                this.__py = tile.TargetY + (e.getY() - tile.getY()) * tile.TargetW / tile.canvasWidth;

                tile.TargetX = this.__px - x * w / tile.canvasWidth;
                tile.TargetY = this.__py - y * w / tile.canvasWidth;
                tile.TargetW = w;
            },
            pinchend: function (e)
            {
                if (!e.scale)
                    return;
            }
        };
        this.mon(this.mouse_site.el, this.__mouse_site_listeners);

        if (window.captureEvents)
        {
            this.__doc_events = {
                scope: this,
                dragstart: this.StopSelect,
                selectstart: this.StopSelect,
                mousemove: this.OnDocMouseMove,
                mouseup: this.OnDocMouseUp
            };
            Ext.getDoc().on(this.__doc_events);
        }

        this.task.Add(this.UpdateViewCenter, this);
        this.UpdateCursor();
    },
    repositionFloatingItems: function ()
    {
        var floaters = this.floatingItems.items, floater;
        for (var i = 0, n = floaters.length; i < n; i++)
        {
            floater = floaters[i];
            if (floater.el && !floater.hidden)
            {
                if (floater.autoAlign)
                    floater.alignTo(this, floater.autoAlign, floater.offsets, false);
                else
                    floater.setPosition(floater.x, floater.y);
            }
        }
    },
    onDestroy: function ()
    {
        Ext.getDoc().un(this.__doc_events);
        delete this.__doc_events;

        this.mun(this.mouse_site.el, this.__mouse_site_listeners);
        delete this.__mouse_site_listeners;

        this.clearListeners();

        if (this.__loadmask)
        {
            this.__loadmask.destroy();
            delete this.__loadmask;
        }

        var plugins = this.plugins;
        if (plugins)
        {
            for (var i = plugins.length, it; i-- > 0; )
            {
                it = plugins[i];
                if (it.name && this[it.name] === it)
                    delete this[it.name];
            }
        }

        var layers = this.layers;
        for (var i = layers.length; i-- > 0; )
        {
            layers[i].OnDestroy();
        }
        layers.length = 0;

        if (this.tip)
        {
            this.tip.destroy();
            delete this.tip;
        }

        if (this.menu)
        {
            if (this.menu.isComponent && !this.menu.isDestroyed)
                this.menu.destroy();

            delete this.menu;
        }

        this.callParent(arguments);
    },
    DoSortLayer: function ()
    {
        this.__order_changed = 0;
        this.layers.sort(function (a, b) { return a.zIndex - b.zIndex; });
        this.canvas.Invalidate();
    },
    SortLayer: function ()
    {
        if (this.__order_changed)
            this.__order_changed++;
        else
        {
            this.__order_changed = 1;
            this.task.Add(this.DoSortLayer, this);
        }
    },
    InvalidateLayer: function ()
    {
        this.canvas.Invalidate();
    },
    OnUpdateBound: function ()
    {
        var layers = this.layers, layer, bc = this.__bound_changed, tile = this.tile;
        var pt = MyMapBase.LogicalToGeographic({ x: tile.ViewportX, y: tile.ViewportY });
        var minLon = pt.longitude, maxLat = pt.latitude;
        pt.x += tile.ViewportW; pt.y += tile.ViewportW * tile.canvasHeight / tile.canvasWidth;
        MyMapBase.LogicalToGeographic(pt);
        var maxLon = pt.longitude, minLat = pt.latitude;

        for (var i = 0, n = layers.length; i < n; i++)
        {
            layer = layers[i];
            if (layer.__bound_changed == bc)
                continue;

            layer.__bound_changed = bc;
            if (layer.Visible && !layer.dummy)
                layer.OnUpdateBound(minLon, minLat, maxLon, maxLat);
        }
    },
    PostUpdateBound: function ()
    {
        if (this.__post_update_bound)
            return;

        var me = this;
        me.__post_update_bound = true;
        setTimeout(function ()
        {
            me.__post_update_bound = false;
            if (me.rendered)
                me.OnUpdateBound();
        }, 66);
    },
    OnViewportChanged: function (bFinally, tile)
    {
        var layers = this.layers, layer;
        for (var i = 0, n = layers.length; i < n; i++)
        {
            try
            {
                layer = layers[i];
                layer.OnViewportChanged.apply(layer, arguments);
            }
            catch (e)
            {
                console.log(e.toString());
            }
        }

        if (bFinally)
        {
            this.__bound_changed++;
            this.PostUpdateBound();
        }

        this.canvas.Invalidate();
    },
    OnLayerVisibleChanged: function (layer)
    {
        if (layer.Visible && !layer.dummy)
        {
            layer.__bound_changed--;
            this.PostUpdateBound();
        }
    },
    OnSize: function (width, height, canvas)
    {
        var layers = this.layers, layer;
        for (var i = 0, n = layers.length; i < n; i++)
        {
            layer = layers[i];
            layer.OnSize(width, height);
        }
    },
    OnDraw: function (ctx, canvas)
    {
        var layers = this.layers, layer;
        for (var i = 0, n = layers.length; i < n; i++)
        {
            layer = layers[i];
            if (layer.Visible && !layer.dummy)
            {
                ctx.save();
                try
                {
                    if (!Ext.isEmpty(layer.opacity))
                    {
                        if (layer.opacity)
                            ctx.globalAlpha = layer.opacity;
                        else
                            continue;
                    }

                    layer.OnDraw(ctx);
                }
                finally
                {
                    ctx.restore();
                }
            }
        }

        if (this.state == this.state_sel)
        {
            var sb = this.SelBox, tile = this.tile, size = tile.TotalSize;
            var x = (Math.min(sb.x, sb.x2) - tile.ViewportX) * size, y = (Math.min(sb.y, sb.y2) - tile.ViewportY) * size;
            var w = Math.abs(sb.x - sb.x2) * size, h = Math.abs(sb.y - sb.y2) * size;

            ctx.shadowColor = "black";
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = ctx.shadowOffsetY = 6;

            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(0,0,192,0.75)";
            ctx.strokeRect(x, y, w, h);
        }
    },
    UpdateViewCenter: function ()
    {
        var pt = MyMapBase.GeographicToLogical({ longitude: this.InitLongitude, latitude: this.InitLatitude });
        this.tile.SetViewCenter(pt.x, pt.y, this.InitZoomLevel);
    },
    Pan: function (deltaX, deltaY)
    {
        this.tile.Pan(deltaX, deltaY);
    },
    ZoomIn: function ()
    {
        this.tile.ZoomIn();
    },
    ZoomOut: function ()
    {
        this.tile.ZoomOut();
    },
    FillViewport: function (x, y, x2, y2)
    {
        var w = Math.abs(x - x2), h = Math.abs(y - y2);
        if (w > 0 && h > 0)
        {
            var tile = this.tile, s = tile.canvasHeight / tile.canvasWidth;
            w = Math.max(w, h / s);
            tile.TargetLevel = Math.floor(Math.log(tile.canvasWidth / tile.TileSize / w) / Math.log(2));
            w = tile.TargetW;
            tile.TargetX = (x + x2 - w) / 2;
            tile.TargetY = (y + y2 - w * s) / 2;
        }
    },
    GetCursor: function (e)
    {
        switch (this.state)
        {
            case this.state_menu:
                return 'default';
            case this.state_down:
            case this.state_pan:
                return this.closedhand_cur;
            case this.state_sel:
                return 'crosshair';
            default:
                if (this.__hit_layer)
                {
                    var cur = this.__hit_layer.GetCursor(e);
                    if (!Ext.isEmpty(cur))
                        return cur;
                }
                return this.ctrlKey ? 'crosshair' : this.openhand_cur;
        }
        return 'auto';
    },
    GetTip: function (item, layer)
    {
        if (layer instanceof MyApp.map.Layer)
            return layer.GetTip(item);
        else if (item instanceof MyApp.map.Element)
            return item.GetTip();
        else if (Ext.isObject(item))
        {
            var fn = item['GetTip'];
            if (Ext.isFunction(fn))
                return fn.apply(item);
        }

        return item;
    },
    SelectItem: function (item, layer, append, e)
    {
        if (append)
        {
            if (layer)
                layer.SelectItem(item, append, e);
        }
        else
        {
            var layers = this.layers;
            for (var i = 0, n = layers.length; i < n; i++)
            {
                layers[i].SelectItem(layers[i] === layer ? item : null, append, e);
            }
        }
    },
    IsSelected: function (item)
    {
        var layers = this.layers;
        for (var i = 0, n = layers.length; i < n; i++)
        {
            if (layers[i].IsSelected(item))
                return true;
        }
    },
    OnItemClick: function (item, layer, e)
    {
        this.SelectItem(item, layer, this.ctrlKey, e);
        if (layer)
            layer.OnItemClick.apply(layer, arguments);
    },
    OnItemDblClick: function (item, layer, e)
    {
        this.SelectItem(item, layer, this.ctrlKey, e);
        if (layer)
            layer.OnItemDblClick.apply(layer, arguments);
    },
    OnItemContextMenu: function (mis, item, layer, e)
    {
        this.SelectItem(item, layer, this.ctrlKey, e);
        if (layer)
            layer.OnItemContextMenu.apply(layer, arguments);
    },
    UpdateCursor: function (e)
    {
        this.mouse_site.cursor = this.GetCursor(e);
    },
    ShowTip: function (item, layer, trackMouse)
    {
        if (this.__tip_item === item)
        {
            if (trackMouse)
                this.tip.setPagePosition(this.tip.getTargetXY());

            return;
        }

        this.__tip_item = item;
        var t = this.GetTip.apply(this, arguments);
        if (Ext.isEmpty(t))
            this.tip.hide();
        else
        {
            this.tip.update(t);
            this.tip.show();
        }
    },
    OnKeyDown: function (e)
    {
        var layers = this.layers, layer;
        for (var i = layers.length; i-- > 0; )
        {
            layer = layers[i];
            if (layer.Visible && !layer.dummy && layer.OnKeyDown(e))
                return;
        }

        switch (e.keyCode)
        {
            case e.CTRL:
                this.ctrlKey = true;
                this.UpdateCursor(e);
                break;
            case e.RETURN:
            case e.ESC:
                break;
            case e.LEFT:
                this.Pan(-0.5, 0);
                break;
            case e.RIGHT:
                this.Pan(0.5, 0);
                break;
            case e.UP:
                if (e.ctrlKey)
                    this.ZoomIn();
                else
                    this.Pan(0, -0.5);
                break;
            case e.DOWN:
                if (e.ctrlKey)
                    this.ZoomOut();
                else
                    this.Pan(0, 0.5);
                break;
            case e.HOME:
                this.UpdateViewCenter();
                break;
            case e.PAGE_UP:
                this.Pan(0, -1);
                break;
            case e.PAGE_DOWN:
                this.Pan(0, 1);
                break;
        }
    },
    OnKeyUp: function (e)
    {
        var layers = this.layers, layer;
        for (var i = layers.length; i-- > 0; )
        {
            layer = layers[i];
            if (layer.Visible && !layer.dummy && layer.OnKeyUp(e))
                return;
        }

        if (e.keyCode == e.CTRL)
        {
            this.ctrlKey = false;
            this.UpdateCursor(e);
        }
    },
    focus: function (selectText, delay, callback, scope)
    {
        return this.mouse_site.focus.apply(this.mouse_site, arguments);
    },
    OnMouseWheel: function (e)
    {
        var tile = this.tile;
        if (tile)
            tile.ZoomOnPixelPoint(e.getX() - tile.getX(), e.getY() - tile.getY(), tile.TargetLevel + e.getWheelDelta());
    },
    SetCapture: function ()
    {
        if (this.__capture)
            return;

        this.__capture = true;
        if (window.captureEvents)
            window.captureEvents(Event.MOUSEMOVE | Event.MOUSEUP);
        else if (this.mouse_site.el.dom.setCapture)
            this.mouse_site.el.dom.setCapture();
    },
    ReleaseCapture: function ()
    {
        if (!this.__capture)
            return;

        this.__capture = false;
        if (window.releaseEvents)
            window.releaseEvents(Event.MOUSEMOVE | Event.MOUSEUP);
        else if (this.mouse_site.el.dom.releaseCapture)
            this.mouse_site.el.dom.releaseCapture();
    },
    HitTest: function (cx, cy, e)
    {
        var layers = this.layers, layer;
        for (var i = layers.length, it; i-- > 0; )
        {
            layer = layers[i];
            if (layer.Visible && !layer.dummy && (Ext.isEmpty(layer.opacity) || layer.opacity))
            {
                it = layer.HitTest(cx, cy, e);
                if (it)
                {
                    var result = [it, layer];
                    if (e)
                    {
                        while (i-- > 0)
                        {
                            layer = layers[i];
                            if (layer.Visible && !layer.dummy)
                                layer.HitTest(-1073741824, -1073741824, e);
                        }
                    }

                    return result;
                }
            }
        }
    },
    OnHitTest: function (item, layer)
    {
        this.__hit_item = item;
        this.__hit_layer = layer;
    },
    StopSelect: function (e)
    {
        if (this.__capture)
        {
            e.stopEvent();
            return false;
        }
    },
    OnDocMouseMove: function (e)
    {
        if (this.__capture)
            this.OnMouseMove(e);
    },
    OnDocMouseUp: function (e)
    {
        if (this.__capture)
            this.OnMouseUp(e);
    },
    OnMouseEnter: function (e)
    {
    },
    OnMouseLeave: function (e)
    {
        if (this.__capture || this.state === this.state_menu)
            return;

        this.ShowTip();
        this.OnHitTest.apply(this, this.HitTest(-1073741824, -1073741824, e));
    },
    OnMouseMove: function (e)
    {
        this.ctrlKey = e.ctrlKey;

        var tile = this.tile, pc = tile.getXY(), pt = e.getXY(), x = pt[0] - pc[0], y = pt[1] - pc[1];
        this.tip.targetXY = pt;

        switch (this.state)
        {
            case this.state_menu:
                break;
            case this.state_down:
                if (Math.round((this.__down_x - tile.ViewportX) * tile.TotalSize) == x && Math.round((this.__down_y - tile.ViewportY) * tile.TotalSize) == y)
                    break;
                this.state = this.state_pan;
            case this.state_pan:
                tile.TargetX = this.__down_x - x / tile.TotalSize;
                tile.TargetY = this.__down_y - y / tile.TotalSize;
                break;
            case this.state_sel:
                var size = tile.TotalSize, sb = this.SelBox;
                sb.x2 = tile.ViewportX + x / size;
                sb.y2 = tile.ViewportY + y / size;
                this.ShowTip(Math.round(Math.abs(sb.x2 - sb.x) * size) + ' × ' + Math.round(Math.abs(sb.y2 - sb.y) * size), undefined, true);
                this.canvas.Invalidate();
                break;
            case this.state_layer_down:
                if (this.__hit_layer)
                    this.__hit_layer.OnMouseMove.apply(this.__hit_layer, arguments);

                break;
            case this.state_item_down:
                if (this.__hit_layer)
                {
                    var its = this.HitTest(x, y);
                    if (its && this.__hit_item === its[0])
                    {
                        this.__hit_layer.OnMouseMove.apply(this.__hit_layer, arguments);
                        break;
                    }
                }

                if (this.ctrlKey)
                {
                    var sb = this.SelBox;
                    sb.x = sb.x2 = this.__down_x;
                    sb.y = sb.y2 = this.__down_y;
                    this.state = this.state_sel;
                }
                else
                    this.state = this.state_pan;

                break;
            default:
                {
                    this.OnHitTest.apply(this, this.HitTest(x, y, e));
                    if (this.__hit_layer && this.__hit_layer.OnMouseMove.apply(this.__hit_layer, arguments))
                        break;

                    this.ShowTip(this.__hit_item, this.__hit_layer);
                    break;
                }
        }

        this.UpdateCursor(e);
    },
    OnMouseDown: function (e)
    {
        this.ctrlKey = e.ctrlKey;

        this.ShowTip();
        this.mouse_site.focus(undefined, 1);

        var tile = this.tile;
        var pt = e.getXY(), pc = tile.getXY();
        var cx = pt[0] - pc[0], cy = pt[1] - pc[1];

        if (e.button == 0)
        {
            this.SetCapture();

            this.OnHitTest.apply(this, this.HitTest(cx, cy, e));
            if (this.__hit_layer && this.__hit_layer.OnMouseDown.apply(this.__hit_layer, arguments))
                this.state = this.state_layer_down;
            else
            {
                var size = tile.TotalSize;
                this.__down_x = tile.ViewportX + cx / size;
                this.__down_y = tile.ViewportY + cy / size;

                if (this.__hit_item)
                    this.state = this.state_item_down;
                else if (this.ctrlKey)
                {
                    var sb = this.SelBox;
                    sb.x = sb.x2 = this.__down_x;
                    sb.y = sb.y2 = this.__down_y;
                    this.state = this.state_sel;
                }
                else
                    this.state = this.state_down;
            }
        }
        else
        {
            this.state = this.state_none;
            this.OnHitTest.apply(this, this.HitTest(cx, cy, e));
            if (this.__hit_layer)
                this.__hit_layer.OnMouseDown.apply(this.__hit_layer, arguments);
        }

        this.UpdateCursor(e);
    },
    OnMouseUp: function (e)
    {
        this.ctrlKey = e.ctrlKey;
        this.ReleaseCapture();

        var state = this.state;
        this.state = this.state_none;

        switch (state)
        {
            case this.state_down:
                this.task.Add(this.OnItemClick, this, null, null, e);
                break;
            case this.state_pan:
                break;
            case this.state_sel:
                {
                    var sb = this.SelBox;
                    this.FillViewport(sb.x, sb.y, sb.x2, sb.y2);
                    this.canvas.Invalidate();
                    break;
                }
            case this.state_layer_down:
                if (this.__hit_layer)
                    this.__hit_layer.OnMouseUp(e);
                break;
            case this.state_item_down:
                if (this.__hit_layer && this.__hit_layer.OnMouseUp.apply(this.__hit_layer, arguments))
                    break;

                this.task.Add(this.OnItemClick, this, this.__hit_item, this.__hit_layer, e);
                break;
        }

        this.UpdateCursor(e);
    },
    PreShowMenu: function (mis)
    {
        if (Ext.isEmpty(mis))
            return;

        for (var i = mis.length, it, b = true; i-- > 0; )
        {
            it = mis[i];
            if (it == '-')
            {
                if (b)
                    mis.splice(i, 1);
                else
                    b = true;
            }
            else
            {
                b = false;
                if (Ext.isObject(it))
                    this.PreShowMenu(it.menu);
            }
        }

        if (mis[0] == '-')
            mis.splice(0, 1);
    },
    ShowMenu: function (mis, x, y)
    {
        this.PreShowMenu(mis);
        if (Ext.isEmpty(mis))
            return;

        var me = this;
        me.state = me.state_menu;
        me.ShowTip();
        this.UpdateCursor();

        var menu = this.menu;
        if (menu && menu.isComponent && !menu.isDestroyed)
        {
            menu.removeAll();
            menu.add(mis);
        }
        else
        {
            menu = this.menu = Ext.create('Ext.menu.Menu', {
                shadow: 'drop',
                shadowOffset: 26,
                items: mis,
                listeners: { hide: function () { if (me.state === me.state_menu) me.state = me.state_none; } },
                afterRender: function () { this.self.prototype.afterRender.apply(this, arguments); this.el.enableShadow(); }
            });
        }

        menu.showAt(x, y);
    },
    OnContextMenu: function (e)
    {
        e.preventDefault();

        this.state = this.state_none;
        var pt = e.getXY(), pc = this.canvas.getXY();
        this.OnHitTest.apply(this, this.HitTest(pt[0] - pc[0], pt[1] - pc[1], e));
        if (this.__hit_layer && this.__hit_layer.OnContextMenu.apply(this.__hit_layer, arguments))
            return;

        var mis = [];
        this.OnItemContextMenu(mis, this.__hit_item, this.__hit_layer, e);
        this.ShowMenu(mis, pt[0], pt[1]);
    },
    OnDblClick: function (e)
    {
        this.state = this.state_none;
        var pt = e.getXY(), pc = this.canvas.getXY();
        this.OnHitTest.apply(this, this.HitTest(pt[0] - pc[0], pt[1] - pc[1], e));
        if (!this.__hit_layer || !this.__hit_layer.OnDblClick.apply(this.__hit_layer, arguments))
            this.task.Add(this.OnItemDblClick, this, this.__hit_item, this.__hit_layer, e);
        this.UpdateCursor(e);
    }
});
