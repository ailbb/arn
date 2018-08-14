Ext.define('MyApp.map.Layer', {
    //extend: 'MyApp.map.Base',
    alias: 'widget.mapbase_layer',
    requires: ['MyApp.util.Task', 'MyApp.map.kpi'],
    Visible: true,
    zIndex: 0,
    uri: undefined,     // 与图层关联数据的URI
    args: undefined,    // 加载数据预定义参数
    minBound: 2000,     // 取最小范围(半径、米)的数据
    maxBound: 10000,    // 取最大范围(半径、米)的数据
    constructor: function (config)
    {
        this.initialConfig = config || {};
        Ext.apply(this, config);

        this.callParent(arguments);
    },
    OnDestroy: function ()
    {
        if (this.task)
            this.task.Stop();

        delete this.tile;
        delete this.map;
        delete this.canvas;
    },
    OnInitUpdate: function (canvas, tile)
    {
        var __dummy = !!this.dummy, __Visible = this.Visible, __zIndex = this.zIndex;
        Object.defineProperties(this, {
            canvas: { value: canvas, configurable: true },
            map: { get: function () { return this.canvas.up('map_panel'); } },
            tile: { value: tile, configurable: true },
            task: { value: new MyApp.util.Task() },
            dummy: {
                get: function () { return __dummy; },
                set: function (v)
                {
                    if (__dummy == v)
                        return;

                    __dummy = v;
                    if (!__Visible)
                        return;

                    this.OnVisibleChanged();
                    this.map.OnLayerVisibleChanged(this);
                }
            },
            Visible: {
                get: function () { return __Visible; },
                set: function (v)
                {
                    if (__Visible == v)
                        return;

                    __Visible = v;
                    if (__dummy)
                        return;

                    this.OnVisibleChanged();
                    this.map.OnLayerVisibleChanged(this);
                }
            },
            zIndex: {
                get: function () { return __zIndex; },
                set: function (v)
                {
                    if (__zIndex == v)
                        return;

                    __zIndex = v;
                    this.map.SortLayer();
                }
            }
        });

        this.OnSize(canvas.canvasWidth, canvas.canvasHeight);
    },
    PostLoad: function ()
    {
        if (this.__post_load || Ext.isEmpty(this.uri) || !(this.minLon < this.maxLon) || this.dummy)
            return;

        this.__post_load = true;
        this.task.Clear();
        this.task.Add(this.Load, this);
    },
    Load: function ()
    {
        this.__post_load = false;

        if (this.__request)
        {
            try
            {
                Ext.Ajax.abort(this.__request);
            }
            catch (e)
            {
                console.log(e.message); // 有时取消请求有取消不掉的异常
            }
            this.__request = undefined;
        }

        this.task.Clear();

        var uri = this.uri;
        if (!Ext.String.startsWith(uri, APPBASE))
            uri = APPBASE + uri;

        if (!this.query_id)
            this.query_id = top.AUTO_ID = (top.AUTO_ID || 0) + 1;

        var ops = {
            url: uri,
            method: "POST",
            params: { query_id: this.query_id, query_order: ++top.AUTO_ID, args: Ext.applyIf({ cond: this.map.cur_querycondition, minLon: this.minLon, minLat: this.minLat, maxLon: this.maxLon, maxLat: this.maxLat }, this.args) }
        };

        this.OnBeforeLoad(ops);
        for (var i in ops.params)
        {
            var v = ops.params[i];
            if (Ext.isObject(v) || Ext.isArray(v))
                ops.params[i] = Ext.encode(v);
        }

        ops.success = ops.failure = this.task.pass(this.OnResponseLoad, this);

        return this.__request = Ext.Ajax.request(ops);
    },
    OnBeforeLoad: function (options)
    {
    },
    OnResponseLoad: function (resp, c)
    {
        this.__request = undefined;

        var result, error;
        try
        {
            this.minLon += 10000;
            if (resp.timedout)
                throw '从"' + c.url + '"取数据超时!';

            result = resp.responseText;
            if (resp.status != 200)
                throw '网络异常(' + resp.status + '): ' + resp.statusText;
            result = Ext.decode(result);

            if ('error' in result)
                error = result['error'];

            this.minLon -= 10000;
        }
        catch (e)
        {
            error = e;
        }

        this.task.Add(this.OnLoad, this, result, error);
    },
    OnLoad: function (result, error)
    {
        if (error)
            throw error;
    },
    OnLoadKpis: function (kpis)
    {
    },
    GetKPI: function (name)
    {
        if (this.__kpis)
            return this.__kpis[name];
    },
    GetKPIFilter: function (name)
    {
    },
    SetKPI: function (name, kpi)
    {
        var kpis = this.__kpis;
        if (!kpis)
            kpis = this.__kpis = {};

        var k = kpis[name];
        if (kpi === k)
            return;

        var filter = this.GetKPIFilter(name);
        if (k)
        {
            k.unlock();
            k.kpis.RemoveFilter(filter);
        }

        kpis[name] = kpi;
        if (kpi)
        {
            kpi.lock();
            kpi.kpis.AddFilter(filter);
            kpi.UpdateBound(this.minLon, this.minLat, this.maxLon, this.maxLat);
            kpi.LoadKpiStat(false);
        }
    },
    OnUpdateBound: function (minLon, minLat, maxLon, maxLat)
    {
        if (minLon >= this.minLon && maxLon <= this.maxLon && minLat >= this.minLat && maxLat <= this.maxLat)
            return;

        var lon = (minLon + maxLon) / 2, lat = (minLat + maxLat) / 2;

        var pos = MyMapBase.GeoOffset(lon, lat, this.minBound, this.minBound);
        var minLonBound = pos[0] - lon, minLatBound = pos[1] - lat;
        pos = MyMapBase.GeoOffset(lon, lat, this.maxBound, this.maxBound);
        var maxLonBound = pos[0] - lon, maxLatBound = pos[1] - lat;

        var dLon = Math.min(Math.max(maxLon - minLon, minLonBound), maxLonBound);
        var dLat = Math.min(Math.max(maxLat - minLat, minLatBound), maxLatBound);

        minLon = lon - dLon;
        minLat = lat - dLat;
        maxLon = lon + dLon;
        maxLat = lat + dLat;

        if (minLon >= this.minLon && maxLon <= this.maxLon && minLat >= this.minLat && maxLat <= this.maxLat)
            return;

        this.minLon = minLon;
        this.minLat = minLat;
        this.maxLon = maxLon;
        this.maxLat = maxLat;

        this.PostLoad();

        var kpis = this.__kpis, kpi;
        for (var i in kpis)
        {
            kpi = kpis[i];
            if (kpi)
                kpi.UpdateBound(this.minLon, this.minLat, this.maxLon, this.maxLat);
        }
    },
    OnViewportChanged: function (bFinally, tile)
    {
    },
    OnVisibleChanged: function ()
    {
        this.Invalidate();
    },
    InvalidateRect: function ()
    {
        if (this.canvas) this.canvas.InvalidateRect.apply(this.canvas, arguments);
    },
    Invalidate: function ()
    {
        if (this.canvas) this.canvas.Invalidate.apply(this.canvas, arguments);
    },
    OnSize: function (width, height)
    {
    },
    OnDraw: function (ctx)
    {
    },
    GetCursor: function (e)
    {
    },
    GetTip: function (item)
    {
        return item instanceof MyApp.map.Element ? item.GetTip() : item;
    },
    GetPropertyInfo: function (item)
    {
    },
    GetKPIInfo: function (item, isshowdim)
    {
        var curkpi;
        if (this.__kpis)
        {
            for (var name in this.__kpis)
            {
                var kpi = this.__kpis[name];
                if (!kpi)
                    continue;

                var r = kpi.kpis.GetKPIInfo(item, isshowdim);
                if (r && r.data && r.data.length > 0)
                    return r;
            }
        }
        return { title: '指标信息', data: [] };
    },
    SelectItem: function (item, append, e)
    {
    },
    IsSelected: function (item)
    {
        return false;
    },
    OnItemClick: function (item, e)
    {
    },
    OnItemDblClick: function (item, e)
    {
    },
    OnItemContextMenu: function (mis, item, e)
    {
    },
    HitTest: function (cx, cy, e)
    {
    },
    OnKeyDown: function (e)
    {
    },
    OnKeyUp: function (e)
    {
    },
    OnMouseMove: function (e)
    {
    },
    OnMouseDown: function (e)
    {
    },
    OnMouseUp: function (e)
    {
    },
    OnContextMenu: function (e)
    {
    },
    OnDblClick: function (e)
    {
    }
});