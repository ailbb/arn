Ext.define('MyApp.map.Areagrid', {
    extend: 'MyApp.map.Element',
    alternateClassName: 'MyMapAreagrid',
    statics: {
        CreateAccessor: function (iCol, r, w)
        {
            var a = {};
            if (r)
                a.get = function ()
                {
                    return this.__data[iCol];
                };
            if (w)
                a.set = function (v) { this.__data[iCol] = v; };
            return a;
        },
        GetImpl: function (hr)
        {
            var nCol = hr.length, tid = '', ps = {};
            for (var i = 0, name; i < nCol; i++)
            {
                name = hr[i];
                if (Ext.isObject(name))
                    name = name.Name;
                name = name.toLowerCase();

                ps[name] = this.CreateAccessor(i, true, false);
            }

            var type = Ext.define(this.$className + 'Impl', {
                extend: this.$className,
                constructor: function (data)
                {
                    this.__data = data;
                    this.callParent(arguments);
                }
            });

            Object.defineProperties(type.prototype, ps);

            return type;
        }
    },
    GetTip: function ()
    {
        return '<span style="white-space: nowrap"><b>网格标识: </b>' + Ext.String.htmlEncode(this.id) + '</span>';
    }
});

Ext.define('MyApp.map.AreagridLayer', {
    extend: 'MyApp.map.Layer',
    alias: 'widget.areagrid_layer',
    zIndex: -666,
    uri: '/web/jss/map.jss?action=map.GetAreagrid',
    minBound: 2000,     // 取最小范围(半径、米)的数据
    maxBound: 30000,    // 取最大范围(半径、米)的数据
    coversite: undefined,
    sitegrds: [],
    areagrid_alpha: 0.3,
    constructor: function ()
    {
        var __PolygonVisible = true;
        Object.defineProperties(this, {
            areagrids: { value: [] },
            mapSel: { value: {} /*选择集*/ }
        });
        this.callParent(arguments);
    },
    OnDestroy: function ()
    {
        this.task.Stop();
        this.callParent(arguments);
    },
    OnQuery: function (condition)
    {
        this.PostLoad();
    },
    OnLoad: function (result, error)
    {
        if (error)
            throw error;

        var table = result.areagrids;
        var areagrid_type = MyMapAreagrid.GetImpl(table[0]), tile = this.tile;
        var n = table.length - 1;
        var areagrids = this.areagrids, ci;
        this.areagrids.length = n;

        var ptsindex = table[0].length;
        while (ptsindex-- > 0)
        {
            if (Ext.String.Compare(table[0][ptsindex].Name, "points", true) == 0)
                break;
        }

        if (ptsindex < 0)
            throw '网格无坐标数据！';

        for (var i = 0; i < n; i++)
        {
            var row = table[i + 1];
            ci = new areagrid_type(row);

            var pt = MyMapBase.GeographicToLogical({ longitude: ci.longitude, latitude: ci.latitude });
            ci.x = pt.x;
            ci.y = pt.y; // 网格中心点坐标
            pt = MyMapBase.GeographicToLogical({ longitude: ci.minlongitude, latitude: ci.minlatitude });
            ci.minx = pt.x;
            ci.miny = pt.y;
            pt = MyMapBase.GeographicToLogical({ longitude: ci.maxlongitude, latitude: ci.maxlatitude });
            ci.maxx = pt.x;
            ci.maxy = pt.y;

            areagrids[i] = ci;
        }

        this.task.Add(this.OnSiteCover, this, this.coversite);
        this.task.Add(this.Invalidate, this);
    },
    GetPropertyInfo: function (item)
    {
        if (item instanceof MyApp.map.Areagrid)
        {
            var rs = [];
            rs.push(["1、常规", "省份", item.province_name]);
            rs.push(["1、常规", "地市", item.city_name]);
            rs.push(["1、常规", "网格标识", item.id]);
            rs.push(["1、常规", "名称", item.name]);

            rs.push(["2、位置", "经度", item.longitude + "°"]);
            rs.push(["2、位置", "纬度", item.latitude + "°"]);

            return { title: '网格信息', data: rs };
        }
    },
    GetFillStyle: function (it)
    {
        var kpi = this.GetKPI('element_kpi');
        var color;
        if (!Ext.isEmpty(kpi))
            color = kpi.GetKPIColorRGB(it)
        return (!Ext.isEmpty(color)) ? MyApp.util.Common.rgba(color[0], color[1], color[2], this.areagrid_alpha) : null;
    },
    OnDraw: function (ctx)
    {
        var tile = this.tile, scale = tile.canvasWidth / tile.ViewportW;
        var dx = scale * tile.ViewportX, dy = scale * tile.ViewportY;
        var rc = this.rc;

        var x, y, w = (scale / rc) * this.scale, h = (scale / rc) * this.scale;

        var cb, clr = this.__clr;

        var element_kpi = this.GetKPI("element_kpi"); // 多边形渲染的指标对象
        // 网格
        var data = this.areagrids, box = this.canvas.clipBox;
        var fill, it, phygrid_id_num, pt;
        for (var i = 0, n = data.length, it; i < n; i++)
        {
            it = data[i]; // 网格
            if (it.points.length == 0)
                continue;

            ctx.lineWidth = this.IsSelected(it) ? 3 : 1;

            /***************多个多边形****************/
            ctx.beginPath();
            phygrid_id_num = -1;
            for (var j = 0, count = it.points.length; j < count; j++)
            {
                x = it.points[j][0] * scale - dx;
                y = it.points[j][1] * scale - dy;
                if (phygrid_id_num != it.points[j][2])
                    ctx.moveTo(x, y); // 网格包含的新的一个多边形
                else
                    ctx.lineTo(x, y);

                phygrid_id_num = it.points[j][2];

                if(j == count - 1 || phygrid_id_num != it.points[j + 1][2])
                    ctx.closePath();
            }
            /********************************************************************/

            fill = this.GetFillStyle(it);
            if (fill)
            {
                ctx.fillStyle = fill;
                ctx.fill();
            }
            ctx.strokeStyle = "rgba(0,0,255,1)";
            ctx.stroke();
        }

        it = this.__hot_areagrid;
        if (it && it.points.length > 0)
        {
            ctx.lineWidth = this.IsSelected(it) ? 3 : 1;
            ctx.shadowBlur = 2;
            ctx.shadowColor = ctx.strokeStyle = MyCommon.mixColor('rgba(0,0,255,1)', 'black');
            
            /***************多个多边形****************/
            ctx.beginPath();
            phygrid_id_num = -1;
            for (var j = 0, count = it.points.length; j < count; j++)
            {
                x = it.points[j][0] * scale - dx;
                y = it.points[j][1] * scale - dy;
                if (phygrid_id_num != it.points[j][2])
                    ctx.moveTo(x, y); // 网格包含的新的一个多边形
                else
                    ctx.lineTo(x, y);

                phygrid_id_num = it.points[j][2];

                if (j == count - 1 || phygrid_id_num != it.points[j + 1][2])
                    ctx.closePath();
            }
            /********************************************************************/
            ctx.stroke();

            ctx.shadowBlur = 0;
            ctx.shadowColor = "rgba(0, 0, 0, 0)";
        }

        // 网格标签
        var idx, it, count = this.sitegrds.length;
        if (count > 0 && !Ext.isEmpty(element_kpi) && !Ext.isEmpty(element_kpi.kpis.kpidata))
        {
            for (var i = 0; i < count; i++)
            {
                idx = this.sitegrds[i];
                it = data[idx];
                var val = element_kpi.GetKPIVal(it);
                if (Ext.isEmpty(val))
                    continue;

                ctx.font = "18px bold arial";
                ctx.fillStyle = "rgba(0,0,0,1)";
                ctx.fillText(val, it.x * scale - dx, it.y * scale - dy);
            }
        }
    },
    HitTest: function (cx, cy, e)
    {
        var data = this.areagrids;
        if (!data)
            return null;

        var tile = this.tile, scale = tile.canvasWidth / tile.ViewportW;
        var dx = scale * tile.ViewportX, dy = scale * tile.ViewportY;

        var ctx = this.canvas.canvas.getContext('2d'), pt = {};
        var minx, miny, maxx, maxy, x, y, phygrid_id_num;


        it = this.__hot_areagrid;
        if(it)
        {
            minx = miny = x = it.points[0][0] * scale - dx;
            maxx = maxy = y = it.points[0][1] * scale - dy;
            /***************多个多边形****************/
            ctx.beginPath();
            phygrid_id_num = -1;
            for (var j = 0, count = it.points.length; j < count; j++)
            {
                x = it.points[j][0] * scale - dx;
                y = it.points[j][1] * scale - dy;
                if (phygrid_id_num != it.points[j][2])
                    ctx.moveTo(x, y); // 网格包含的新的一个多边形
                else
                    ctx.lineTo(x, y);

                phygrid_id_num = it.points[j][2];

                if (j == count - 1 || phygrid_id_num != it.points[j + 1][2])
                    ctx.closePath();

                minx = x < minx ? x : minx;
                miny = y < miny ? y : miny;
                maxx = x > maxx ? x : maxx;
                maxy = y > maxy ? y : maxy;
            }
            /********************************************************************/

            if (ctx.isPointInPath(cx, cy))
                return it;
            else
                this.InvalidateRect(minx - 3, miny - 3, maxx - minx + 6, maxy - miny + 6);
        }

        for (var i = data.length, it, j, n; i-- > 0; )
        {
            it = data[i];            
            n = it.points.length;
            if (n < 3)
                continue;

            minx = miny = x = it.points[0][0] * scale - dx;
            maxx = maxy = y = it.points[0][1] * scale - dy;
            
            /***************多个多边形****************/
            ctx.beginPath();
            phygrid_id_num = -1;
            for (var j = 0, count = it.points.length; j < count; j++)
            {
                x = it.points[j][0] * scale - dx;
                y = it.points[j][1] * scale - dy;
                if (phygrid_id_num != it.points[j][2])
                    ctx.moveTo(x, y); // 网格包含的新的一个多边形
                else
                    ctx.lineTo(x, y);

                phygrid_id_num = it.points[j][2];

                if (j == count - 1 || phygrid_id_num != it.points[j + 1][2])
                    ctx.closePath();

                minx = x < minx ? x : minx;
                miny = y < miny ? y : miny;
                maxx = x > maxx ? x : maxx;
                maxy = y > maxy ? y : maxy;
            }
            /********************************************************************/
            
            if (ctx.isPointInPath(cx, cy) && it)
            {
                if(this.__hot_areagrid !== it)
                    this.InvalidateRect(minx - 3, miny - 3, maxx - minx + 6, maxy - miny + 6);
                this.__hot_areagrid = it;
                return it;
            }
        }
        this.__hot_areagrid = null;
    },
    SelectItem: function (item, append, e)
    {
        try
        {
            var mapSel = this.mapSel, id = item ? item.id : undefined;
            if (append)
            {
                if (Ext.isEmpty(id) || id in mapSel)
                    return;

                mapSel[id] = true;
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
                    mapSel[id] = true;

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
        return item && this.mapSel[item.id];
    },
    OnSiteCover: function (site)
    {
        this.sitegrds = [];
        this.coversite = site;
        if (Ext.isEmpty(site))
        {
            this.task.Add(this.Invalidate, this);
            return;
        }

        var unit = 1048576;
        var x = (site.data && site.data.x ? site.data.x : site.x) * unit, y = (site.data && site.data.y ? site.data.y : site.y) * unit, ptx, pty;
        var powdis = site.coverradius * site.coverradius * unit * unit;
        var areagrids = this.areagrids, n = areagrids.length;
        var isincircle = false;
        for (var i = 0, it; i < n; i++)
        {
            isincircle = false;
            it = areagrids[i];
            // 判断圆心是否在多边形的矩形范围内, 矩形4个顶点在圆范围内，圆心到4条边的距离小于半径
            var powd1 = Math.pow(it.minx * unit - x, 2) + Math.pow(it.miny * unit - y, 2);
            var powd2 = Math.pow(it.minx * unit - x, 2) + Math.pow(it.maxy * unit - y, 2);
            var powd3 = Math.pow(it.maxx * unit - x, 2) + Math.pow(it.miny * unit - y, 2);
            var powd4 = Math.pow(it.maxx * unit - x, 2) + Math.pow(it.maxy * unit - y, 2);
            if ((x < it.minx || x > it.minx || y < it.miny || y > it.maxy)
                && !(powd1 <= powdis || powd2 <= powdis || powd3 <= powdis || powd4 <= powdis
                || Math.pow(it.minx * unit - x, 2) <= powdis || Math.pow(it.minx * unit - x, 2) <= powdis
                || Math.pow(it.miny * unit - y, 2) <= powdis || Math.pow(it.maxy * unit - y, 2) <= powdis))
                continue;

            for (var j = 0, count = it.points.length, x, y; j < count; j++)
            {
                ptx = it.points[j][0] * unit;
                pty = it.points[j][1] * unit;
                // 判断网格点是否在圆范围内
                powd1 = Math.pow(ptx - x, 2) + Math.pow(pty - y, 2);
                if (powd1 <= powdis)
                {
                    this.sitegrds.push(i);
                    isincircle = true;
                    break;
                }
                else if (j < count - 1)
                {
                    // 判断网格的边是否穿过圆范围，判断圆心到多边形边的距离小于半径
                    powd1 = MyMapBase.GetPtToLineDistance({ x: x, y: y }, { x: ptx, y: pty }, { x: it.points[j + 1][0] * unit, y: it.points[j + 1][1] * unit });
                    if (Math.pow(powd1, 2) <= powdis)
                    {
                        this.sitegrds.push(i);
                        isincircle = true;
                        break;
                    }
                }
            }

            // 判断圆心是否在网格内
            if (!isincircle)
            {
                var bln = MyMapBase.PtInAnyPolygon(it.points, { x: x / unit, y: y / unit });
                if (bln)
                    this.sitegrds.push(i);
            }
        }
    }
});