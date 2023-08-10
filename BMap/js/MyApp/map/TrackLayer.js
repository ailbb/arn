var tracks_lnglat = [[113.496, 22.3622], [113.4911, 22.3548], [113.4908, 22.3532], [113.4948, 22.3505], [113.4951, 22.3451], [113.4913, 22.3428], [113.4899, 22.339], [113.4858, 22.3347], [113.4805, 22.3281], [113.48, 22.3222], [113.4815, 22.3146], [113.4731, 22.3135], [113.48, 22.3095], [113.4869, 22.3078], [113.4881, 22.3025], [113.4848, 22.2995], [113.4873, 22.2966], [113.4918, 22.296], [113.4927, 22.2929], [113.4928, 22.2891], [113.5011, 22.2894], [113.5026, 22.2831], [113.5064, 22.2827], [113.5087, 22.2825], [113.51, 22.2824], [113.5112, 22.2814], [113.5146, 22.2837], [113.5131, 22.2823], [113.5108, 22.2831], [113.5145, 22.2828]];

Ext.define('MyApp.map.Track', {
    extend: 'MyApp.map.Element',
    alternateClassName: 'MyMapTrack',
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
    }
});

Ext.define('MyApp.map.TrackLayer', {
    extend: 'MyApp.map.Layer',
    alias: 'widget.track_layer',
    zIndex: -666,
    track_scale: 1,
    constructor: function ()
    {
        for (var i = 0, count = tracks_lnglat.length; i < count; i++)
        {
            var lnglat = tracks_lnglat[i];
            var pt = MyMapBase.GeographicToLogical({ longitude: lnglat[0], latitude: lnglat[1] });
            var track = new MyMapTrack(pt);
            this.tracks.push(track);
        }

        /**********************************************************/
        // 获取颜色集合
        var clr = [];
        for (var i = 0; i < 100; i++)
        {
            clr[i] = 'rgba(' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',0.8)';
        }
        this.__clr = clr;
        /**********************************************************/

        this.callParent(arguments);
    },
    OnLoadKpis: function ()
    {
        this.callParent(arguments);
        var element_kpi = this.GetKPI("element_kpi");
        if (Ext.isEmpty(element_kpi) || Ext.isEmpty(element_kpi.kpis) || Ext.isEmpty(element_kpi.kpis.kpidata))
            return;

        this.LoadTrack(kpis.kpidata);
    },
    LoadTrack: function (objdata)
    {
        // 清除已有数据
        this.tracks = [];
        delete this.__hot_track;

        if (!Ext.isEmpty(objdata.headers))
        {
            var table = objdata.data;
            if (!Ext.isEmpty(table) && table.length > 0)
            {
                var track_type = MyMapTrack.GetImpl(objdata.headers), tile = this.tile;
                var n = table.length - 1;
                var tracks = this.tracks, ci, fill = 'rgb(0,255,0)';
                tracks.length = n;
                for (var i = 0; i < n; i++)
                {
                    ci = new track_type(table[i]);
                    var pt = MyMapBase.GeographicToLogical({ longitude: ci.longitude, latitude: ci.latitude });
                    ci.x = pt.x;
                    ci.y = pt.y;
                    ci.fill = fill;

                    tracks[i] = ci;
                }
            }
        }
        this.task.Add(this.Invalidate, this);
    },
    OnDraw: function (ctx)
    {
        var tracks = this.tracks, n = tracks.length;
        if (n == 0)
            return;

        var cb = this.canvas.clipBox, l = cb.x - 20, t = cb.y - 20, r = cb.right + 20, b = cb.bottom + 20;
        var tile = this.tile, scale = tile.canvasWidth / tile.ViewportW;
        var dx = scale * tile.ViewportX, dy = scale * tile.ViewportY, x, y;

        for (var i = 0, it; i < n; i++)
        {
            it = tracks[i];
            x = it.x * scale - dx;
            y = it.y * scale - dy;
            if (x < l || x > r || y < t || y > b)
                continue;

            var kpifill = element_kpi.GetKPIColor(it);
            ctx.fillStyle = kpifill || it.fill;

            ctx.beginPath();
            ctx.moveTo(x - 1, y);
            ctx.lineTo(x - 1, y - 16);
            ctx.lineTo(x, y - 16);
            ctx.arc(x, y - 16, 6, Math.PI / 2, Math.PI * 2 + Math.PI / 2, false);
            ctx.lineTo(x + 1, y - 16);
            ctx.lineTo(x + 1, y);
            ctx.closePath();
            ctx.fill();
        }

        // 鼠标点击测试点
        var ci = this.__hot_track;
        if (ci)
        {
            var radius = 6;

            ctx.shadowBlur = Math.min(6, radius);
            ctx.shadowColor = MyCommon.mixColor(fill, 'black', 0.2);
            ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
            ctx.fillStyle = MyCommon.mixColor(fill, 'Black', 0.5);

            var it = ci;
            var x = it.x * scale - dx;
            var y = it.y * scale - dy;

            ctx.beginPath();
            ctx.moveTo(x - 1, y);
            ctx.lineTo(x - 1, y - 16);
            ctx.lineTo(x, y - 16);
            ctx.arc(x, y - 16, radius * 1.2, Math.PI / 2, Math.PI * 2 + Math.PI / 2, false);
            ctx.lineTo(x + 1, y - 16);
            ctx.lineTo(x + 1, y);
            ctx.closePath();
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.shadowColor = "rgba(0, 0, 0, 0)";
        }
    },
    GetCursor: function (e)
    {
        return this.__hot_track ? 'pointer' : undefined;
    },
    PtInTrack: function (x, y, ci, r, scale)
    {
        var x2 = ci.x * scale, y2 = ci.y * scale, dx = 0, dy = 0;

        dx = x - x2;
        dy = y - (y2 - 16);
        if (dx * dx + dy * dy > r * r)
            return false;
        else
            return true;
    },
    HitTest: function (cx, cy, e)
    {
        var tracks = this.tracks, ntrack = tracks.length;
        if (ntrack == 0)
            return;

        var tile = this.tile;
        var scale = tile.canvasWidth / tile.ViewportW, dx = tile.ViewportX * scale, dy = tile.ViewportY * scale;
        var x = cx + dx, y = cy + dy;

        var ci = this.__hot_track, track_scale = this.track_scale;
        do
        {
            if (ci instanceof MyMapTrack)
            {
                if (this.PtInTrack(x, y, ci, 6 * 1.2 * track_scale, scale))
                {
                    break;
                }
            }

            var i = 0;
            for (; i < ntrack; i++)
            {
                ci = tracks[i];

                if (this.PtInTrack(x, y, ci, 6 * 1.2 * track_scale, scale))
                    break;
            }

            if (i == ntrack)
                ci = null;

        } while (false);

        /***************************************************/
        if (!Ext.isEmpty(ci))
        {
            var element_kpi = this.GetKPI("element_kpi");
            if (!Ext.isEmpty(element_kpi) && !Ext.isEmpty(element_kpi.kpis.kpidata))
            {
                var val = element_kpi.GetKPIVal(ci);
                var header = element_kpi.GetKPIColHeader();
                var row = element_kpi.GetKPIRow(ci);
                return {
                    infotype: "kpiinfo", headers: element_kpi.kpis.kpidata.headers,
                    value: Ext.isEmpty(row) ? element_kpi.CreateKPIRow(ci) : row,
                    tip: Ext.isEmpty(header) ? "" : header.nameCn + ":" + Ext.isEmpty(val) ? "" : val
                };
            }
            else
                return null;
        }
        //this.__hot_track = ci;
        /***************************************************/
        return ci;
        
        //if (e)
        //{
        //    if (this.__hot_track !== ci)
        //    {
        //        for (var i = 0, it, l, t, a, ca, sa; i < 2; i++)
        //        {
        //            it = i ? ci : this.__hot_track;
        //            if (!it)
        //                continue;

        //            l = it.x * scale - dx;
        //            t = it.y * scale - dy;
        //            if (it.offset)
        //            {
        //                a = it.offsetDirection * Math.PI / 180;
        //                ca = Math.cos(a); sa = Math.sin(a);

        //                l += sa * it.offset * track_scale; t -= ca * it.offset * track_scale;
        //            }
        //            a = 6 * track_scale * 2;
        //            this.InvalidateRect(l - a, t - a, a + a, a + a);
        //        }

        //        this.__hot_track = ci;
        //    }
        //}
    }
});
