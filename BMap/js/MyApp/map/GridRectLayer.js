Ext.define('MyApp.map.GridRect', {
    extend: 'MyApp.map.Element',
    alternateClassName: 'MyMapGridRect',
    statics:
    {
        GetImpl: function (hr)
        {
            return MyMapBase.GetImplByJTH(hr, this, []);
        }
    },
    GetTip: function ()
    {
    }
});

Ext.define('MyApp.map.GridRectLayer', {
    extend: 'MyApp.map.Layer',
    alias: 'widget.gridrect_layer',
    zIndex: -666,
    grid_stroke: 'rgba(0,128,0,1)',
    grid_alpha: 0.3,
    constructor: function ()
    {
        Object.defineProperties(this, {
            grids: { value: [] }
        });
        this.callParent(arguments);
    },
    OnDestroy: function ()
    {
        this.callParent(arguments);
    },
    GetKPIFilter: function (name)
    {
        if (name == 'element_kpi')
            return 'AdjustGrid';
    },
    OnLoadKpis: function ()
    {
        this.callParent(arguments);
        this.grids.length = 0;
        var element_kpi = this.GetKPI("element_kpi");
        if (!(Ext.isEmpty(element_kpi) || Ext.isEmpty(element_kpi.kpis) || Ext.isEmpty(element_kpi.kpis.kpidata)))
        {
            //var result = { headers: [], data: [] };
            //result.headers = [{ "name": "id", "nameCn": "ID" }, { "name": "minlongitude", "nameCn": "最小经度" }, { "name": "minlatitude", "nameCn": "最小纬度" },
            //    { "name": "maxlongitude", "nameCn": "最大经度" }, { "name": "maxlatitude", "nameCn": "最大纬度" }];
            //result.data = [[1, 117.0777, 39.1161, 117.0787, 39.1171], [2, 117.0789, 39.1181, 117.0799, 39.1191]];

            var result = element_kpi.kpis.kpidata;
            delete this.__hot_grid;
            var table = result.data;
            var grid_type = MyMapGridRect.GetImpl(result.headers);
            var n = Ext.isEmpty(table) ? 0 : table.length;
            var grids = this.grids, it;
            grids.length = n;
            for (var i = 0; i < n; i++)
            {
                it = new grid_type(table[i]);
                grids[i] = it;

                if (Ext.isEmpty(it.minx))
                {
                    var pt = MyMapBase.GeographicToLogical({ longitude: it.minlongitude, latitude: it.maxlatitude });
                    it.minx = pt.x;
                    it.miny = pt.y;
                    pt = MyMapBase.GeographicToLogical({ longitude: it.maxlongitude, latitude: it.minlatitude });
                    it.maxx = pt.x;
                    it.maxy = pt.y;
                }
            }
        }
        this.task.Add(this.Invalidate, this);
    },
    GetFillStyle: function (item)
    {
        var k = this.GetKPI("element_kpi");
        var color;
        if (!Ext.isEmpty(k))
            color = k.GetKPIColorRGB(item)
        return (!Ext.isEmpty(color)) ? MyApp.util.Common.rgba(color[0], color[1], color[2], this.grid_alpha) : null;
    },
    DrawGrid: function (ctx, item, x, y, w, h, fillStyle)
    {
        if (fillStyle)
        {
            ctx.beginPath();
            ctx.rect(x, y, w, h);
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }
    },
    OnDraw: function (ctx)
    {
        var grids = this.grids, n = grids.length;
        if (n == 0)
            return;

        var tile = this.tile, scale = tile.canvasWidth / tile.ViewportW;
        var dx = scale * tile.ViewportX, dy = scale * tile.ViewportY;
        var x, y, it, fill, box = this.canvas.clipBox;

        for (var i = 0; i < n; i++)
        {
            it = grids[i];
            x = it.minx * scale - dx;
            y = it.miny * scale - dy;
            w = (it.maxx - it.minx) * scale;
            h = (it.maxy - it.miny) * scale;
            if (!box.IsIntersect(x, y, w, h))
                continue;

            fill = this.GetFillStyle(it);
            this.DrawGrid(ctx, it, x, y, w, h, fill);
        }

        it = this.__hot_grid;
        if (it)
        {
            x = it.minx * scale - dx;
            y = it.miny * scale - dy;
            w = (it.maxx - it.minx) * scale;
            h = (it.maxy - it.miny) * scale;

            fill = this.GetFillStyle(it);

            ctx.shadowBlur = 10;
            ctx.shadowColor = MyCommon.mixColor(fill, 'black', 0.2);
            ctx.shadowOffsetX = ctx.shadowOffsetY = 0;

            this.DrawGrid(ctx, it, x, y, w, h, MyCommon.mixColor(fill, 'black', 0.5));

            ctx.shadowBlur = 0;
            ctx.shadowColor = "rgba(0, 0, 0, 0)";
        }
    },
    GetCursor: function (e)
    {
        return this.__hot_grid ? 'pointer' : undefined;
    },
    PtInGrid: function (ptx, pty, it, x0, y0, x1, y1)
    {
        if (ptx < x0 || ptx > x1 || pty < y0 || pty > y1)
            return false;
        else
            return true;
    },
    HitTest: function (cx, cy, e)
    {
        var grids = this.grids, ndata = grids.length;
        if (ndata == 0)
            return null;

        var tile = this.tile;
        var scale = tile.canvasWidth / tile.ViewportW, dx = tile.ViewportX * scale, dy = tile.ViewportY * scale;

        var it = this.__hot_grid, radius = this.grid_radius;
        do
        {
            var x0, y0, x1, y1;
            if (it instanceof MyMapGridRect)
            {
                x0 = it.minx * scale - dx;
                y0 = it.miny * scale - dy;
                x1 = it.maxx * scale - dx;
                y1 = it.maxy * scale - dy;
                if (this.PtInGrid(cx, cy, it, x0, y0, x1, y1))
                    break;
            }

            var i = 0;
            for (; i < ndata; i++)
            {
                it = grids[i];
                x0 = it.minx * scale - dx;
                y0 = it.miny * scale - dy;
                x1 = it.maxx * scale - dx;
                y1 = it.maxy * scale - dy;

                if (this.PtInGrid(cx, cy, it, x0, y0, x1, y1))
                    break;
            }

            if (i == ndata)
                it = null;

        } while (false);

        if (e)
        {
            if (this.__hot_grid !== it)
            {
                this.__hot_grid = it;
                this.Invalidate();
            }
        }
        return it;
    }
});

Ext.require('MyApp.map.GridRectLayer', function ()
{
    // 工参栅格图层
    Ext.define('MyApp.map.GridRectParaLayer', {
        extend: 'MyApp.map.GridRectLayer',
        alias: 'widget.gridrectpara_layer',
        uri: '/web/jss/map.jss?action=map.GetGrid',
        OnQuery: function (condition)
        {
            if (!Ext.isEmpty(this.gridsize))
                this.args = Ext.applyIf({ gridsize: this.gridsize }, this.gridsize);

            this.PostLoad();
        },
        OnLoad: function (result, error)
        {
            if (error)
                throw error;

            delete this.__hot_grid;
            var table = result.cells, grid_type = MyMapGridRect.GetImpl(table[0]);
            var grids = this.grids, ngrid = table.length - 1;
            grids.length = ngrid;
            for (var i = 0, it, pt; i < ngrid; i++)
            {
                it = new grid_type(table[i + 1]);
                grids[i] = it;
                pt = MyMapBase.GeographicToLogical({ longitude: it.minlongitude, latitude: it.maxlatitude });
                it.minx = pt.x;
                it.miny = pt.y;
                pt = MyMapBase.GeographicToLogical({ longitude: it.maxlongitude, latitude: it.minlatitude });
                it.maxx = pt.x;
                it.maxy = pt.y;
            }

            this.task.Add(this.Invalidate, this);
        },
        OnLoadKpis: function ()
        {
        },
        GetPropertyInfo: function (item)
        {
            if (item instanceof MyApp.map.GridRect)
            {
                var rs = [];
                rs.push(["1、常规", "ID", item.id]);
                rs.push(["1、常规", "地市编码", item.city_id]);

                rs.push(["2、位置", "经度", item.longitude.toFixed(4) + "°"]);
                rs.push(["2、位置", "纬度", item.latitude.toFixed(4) + "°"]);
                rs.push(["2、位置", "最小经度", item.longitude.toFixed(4) + "°"]);
                rs.push(["2、位置", "最小纬度", item.latitude.toFixed(4) + "°"]);
                rs.push(["2、位置", "最大经度", item.longitude.toFixed(4) + "°"]);
                rs.push(["2、位置", "最大纬度", item.latitude.toFixed(4) + "°"]);

                return { title: '栅格工参信息', data: rs };
            }
        }
    });

    // 栅格gridx，gridy坐标绘制栅格图层
    Ext.define('MyApp.map.GridXYRectLayer', {
        extend: 'MyApp.map.GridRectLayer',
        alias: 'widget.gridxyrect_layer',
        OnLoadKpis: function ()
        {
            this.callParent(arguments);
            this.grids.length = 0;
            var element_kpi = this.GetKPI("element_kpi");
            if (!(Ext.isEmpty(element_kpi) || Ext.isEmpty(element_kpi.kpis) || Ext.isEmpty(element_kpi.kpis.kpidata)))
            {
                var result = element_kpi.kpis.kpidata;
                delete this.__hot_grid;
                var table = result.data;
                var grid_type = MyMapGridRect.GetImpl(result.headers);
                var n = Ext.isEmpty(table) ? 0 : table.length;
                this.grids = [];
                var grids = this.grids, it;
                var gx, gy, row, xidx = element_kpi.kpis.xidx, yidx = element_kpi.kpis.yidx;
                for (var i = 0; i < n;)
                {
                    row = table[i];
                    it = new grid_type(row);
                    grids.push(it);

                    gx = row[xidx];
                    gy = row[yidx];
                    it.begin = i;
                    for (i++; i < n; i++)
                    {
                        row = table[i];
                        if (row[xidx] != gx || row[yidx] != gy)
                            break;
                    }
                    it.end = i;

                    if (Ext.isEmpty(it.minx))
                    {
                        var rect = this.map.getLogicalByGridXY(gx, gy);
                        it.minx = rect[0];
                        it.miny = rect[1];
                        it.w = Math.abs(rect[2]);
                        it.h = Math.abs(rect[3]);
                    }
                }
            }
            this.task.Add(this.Invalidate, this);
        }
    });
});