Ext.define('MyApp.map.Complaint', {
    extend: 'MyApp.map.Element',
    alternateClassName: 'MyMapComplaint',
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

Ext.define('MyApp.map.ComplaintLayer', {
    extend: 'MyApp.map.Layer',
    alias: 'widget.complaint_layer',
    zIndex: -555,
    complaint_scale: 1,
    constructor: function ()
    {
        var __PolygonVisible = true;
        Object.defineProperties(this, {
            task: { value: new MyApp.util.Task() },
            complaints: { value: [] }
        });
        this.callParent(arguments);
    },
    OnInitUpdate: function ()
    {
        this.callParent(arguments);
    },
    OnDestroy: function ()
    {
        this.task.Stop();
        this.callParent(arguments);
    },
    GetKPIFilter: function (name)
    {
        if (name == 'element_kpi')
            return 'AddXY';
    },
    OnLoadKpis: function ()
    {
        this.callParent(arguments);
        var element_kpi = this.GetKPI("element_kpi");
        if (Ext.isEmpty(element_kpi) || Ext.isEmpty(element_kpi.kpis) || Ext.isEmpty(element_kpi.kpis.kpidata))
            return;

        this.LoadComplaint(kpis.kpidata);
    },
    LoadComplaint: function (objdata)
    {
        // 清除已有数据
        this.complaints.length = 0;
        delete this.__hot_complaint;

        if (!Ext.isEmpty(objdata.headers))
        {
            var table = objdata.data;
            if (!Ext.isEmpty(table) && table.length > 0)
            {
                var complaint_type = MyMapComplaint.GetImpl(objdata.headers), tile = this.tile;
                var n = table.length;
                var complaints = this.complaints, ci, fill = 'rgb(0,0,0)';
                complaints.length = n;
                for (var i = 0; i < n; i++)
                {
                    ci = new complaint_type(table[i]);
                    if (Ext.isEmpty(ci.x))
                    {
                        var pt = MyMapBase.GeographicToLogical({ longitude: ci.longitude, latitude: ci.latitude });
                        ci.x = pt.x;
                        ci.y = pt.y;
                    }
                    ci.fill = fill;

                    complaints[i] = ci;
                }
            }
        }
        this.task.Add(this.Invalidate, this);
    },
    OnDraw: function (ctx)
    {
        var data = this.complaints, n = data.length;
        if (n == 0)
            return;

        var tile = this.tile, scale = tile.canvasWidth / tile.ViewportW;
        var dx = scale * tile.ViewportX, dy = scale * tile.ViewportY;
        var rc = this.rc;
        var x, y, w = (scale / rc) * this.scale, h = (scale / rc) * this.scale;
        var cb, clr = this.__clr;

        var box = this.canvas.clipBox;
        for (var i = 0, n = data.length, it; i < n; i++)
        {
            it = data[i];
            x = it.x * scale - dx;
            y = it.y * scale - dy;

            var kpifill = element_kpi.GetKPIColor(it);
            ctx.fillStyle = kpifill || it.fill;

            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.fill();
        }
    },
    GetCursor: function (e)
    {
        return this.__hot_complaint ? 'pointer' : undefined;
    },
    PtInComplaint: function (x, y, ci, r, scale)
    {
        var x2 = ci.x * scale, y2 = ci.y * scale, dx = 0, dy = 0;

        dx = x - x2;
        dy = y - y2;
        if (dx * dx + dy * dy > r * r)
            return false;
        else
            return true;
    },
    HitTest: function (cx, cy, e)
    {
        var complaints = this.complaints, ncomplaint = complaints.length;
        if (ncomplaint == 0)
            return null;

        var tile = this.tile;
        var scale = tile.canvasWidth / tile.ViewportW, dx = tile.ViewportX * scale, dy = tile.ViewportY * scale;
        var x = cx + dx, y = cy + dy;

        var ci = this.__hot_complaint, complaint_scale = this.complaint_scale;
        do
        {
            if (ci instanceof MyMapComplaint)
            {
                if (this.PtInComplaint(x, y, ci, 6 * 1.2 * complaint_scale, scale))
                {
                    break;
                }
            }

            var i = 0;
            for (; i < ncomplaint; i++)
            {
                ci = complaints[i];

                if (this.PtInComplaint(x, y, ci, 6 * 1.2 * complaint_scale, scale))
                    break;
            }

            if (i == ncomplaint)
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
        //this.__hot_complaint = ci;
        /***************************************************/
        return ci;
    }
});