Ext.require(['MyApp.map.Element', 'MyApp.map.Layer'], function ()
{
    Ext.define('MyApp.map.Sketch', {
        extend: 'MyApp.map.Element',
        alternateClassName: 'MyMapSketch',
        alias: 'widget.Sketch',
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
        },
        OnMouseMove: function (pt, layer)
        {
        },
        OnMouseDown: function (pt, layer)
        {
        },
        Draw: function ()
        {
        },
        PtInSketch: function ()
        {
        },
        GetTip: function ()
        {
            return '<span style="white-space: nowrap"><b>图形ID: </b>' + Ext.String.htmlEncode(this.id) + '</span>';
        }
    });

    Ext.define('MyApp.map.SketchPoint', {
        extend: 'MyApp.map.Sketch',
        alternateClassName: 'MyMapSketchPoint',
        alias: 'widget.SketchPoint',
        point_fill: 'rgba(0,0,255,0.7)',
        point_radius: 6,
        pt: undefined,
        OnMouseMove: function (pt, layer)
        {
        },
        OnMouseDown: function (pt, layer)
        {
            this.pt = pt;

            var style = layer.PointStyle;
            var r = style.point_radius || this.point_radius;
            this.width = this.height = 2 * r;
            return undefined;
        },
        Draw: function (ctx, dx, dy, scale, layer)
        {
            var pt = this.pt;
            if (!pt)
                return;

            var style = layer.PointStyle;
            pt.px = pt.x * scale - dx;
            pt.py = pt.y * scale - dy;
            ctx.fillStyle = style.point_fill || this.point_fill;

            ctx.beginPath();
            ctx.arc(pt.px, pt.py, style.point_radius || this.point_radius, 0, 2 * Math.PI);
            if (this === layer.__hot)
            {
                ctx.shadowColor = layer.ShadowColor;
                ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = layer.ShadowBlur;
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.shadowColor = "rgba(0, 0, 0, 0)";
            }
            else
                ctx.fill();
        },
        PtInSketch: function (cx, cy, scale, dx, dy, layer)
        {
            var pt = this.pt;
            if (pt)
            {
                var px = pt.x * scale - dx;
                var py = pt.y * scale - dy;
                var r = this.width / 2;
                if (cx < px - r || cx > px + r || cy < py - r || cy > py + r)
                    return false;
                else if (Math.pow(cx - px, 2) + Math.pow(cy - py, 2) <= Math.pow(r, 2))
                    return true;
            }
            return false;
        }
    });

    Ext.define('MyApp.map.SketchLine', {
        extend: 'MyApp.map.Sketch',
        alternateClassName: 'MyMapSketchLine',
        alias: 'widget.SketchLine',
        line_width: 1,
        line_stroke: 'rgba(0,0,255,1)',
        point_fill: 'rgba(0,255,255,0.7)',
        point_radius: 3,
        pts: undefined,
        OnMouseMove: function (pt, layer)
        {
            var pts = this.pts;
            if (!Ext.isEmpty(pts) && pts.length > 0)
            {
                var idx = pts.length - 1;
                pts[idx] = pt;
            }
        },
        OnMouseDown: function (pt, layer)
        {
            var pts = this.pts || [];
            if (pts.length == 0)
            {
                pts.push(pt); // 初始点
                pt = Ext.clone(pt);
                pts.push(pt);
            }
            else
            {
                // 增加点,解决双击结束时被增加2个坐标点的问题，对点的坐标进行判断
                var idx = this.pts.length - 1/*onmousemove动态增加的鼠标移动的点*/, preidx = pts.length - 2;
                var prept = pts[preidx];
                if (prept.longitude != pt.longitude && prept.latitude != pt.latitude)
                {
                    pts[idx] = pt;
                    pt = Ext.clone(pt);
                    pts.push(pt);
                }
            }
            this.pts = pts;

            return this;
        },
        Draw: function (ctx, dx, dy, scale, layer)
        {
            var pts = this.pts || [];
            if (pts.length == 0)
                return;

            var style = layer.LineStyle;
            var pt = pts[0];
            pt.px = pt.x * scale - dx;
            pt.py = pt.y * scale - dy;

            ctx.lineWidth = style.line_width || this.line_width;
            ctx.strokeStyle = style.line_stroke || this.line_stroke;

            ctx.beginPath();
            ctx.moveTo(pt.px, pt.py);
            for (var i = 1, len = pts.length; i < len; i++)
            {
                pt = pts[i];
                pt.px = pt.x * scale - dx;
                pt.py = pt.y * scale - dy;
                ctx.lineTo(pt.px, pt.py);
            }
            if (this === layer.__hot)
            {
                ctx.shadowColor = layer.ShadowColor;
                ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = layer.ShadowBlur;
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.shadowColor = "rgba(0, 0, 0, 0)";
            }
            else
                ctx.stroke();

            // 绘制线段点
            //ctx.fillStyle = style.point_fill || this.point_fill;
            //for (var i = 0, len = pts.length; i < len; i++)
            //{
            //    pt = pts[i];
            //    ctx.beginPath();
            //    ctx.arc(pt.px, pt.py, style.point_radius || this.point_radius, 0, 2 * Math.PI);
            //    ctx.fill();
            //}
        },
        PtInSketch: function (cx, cy, scale, dx, dy, layer)
        {
        },
        OnDblClick: function ()
        {
            var pts = this.pts || [];
            var n = pts.length;
            var prept, pt;
            for (var i = 1; i < n; i++)
            {
                prept = pts[i - 1];
                pt = pts[i];
                if (prept.longitude == pt.longitude && prept.latitude == pt.latitude)
                {
                    pts.splice(i, 1);
                    --n;
                }
            }

            if (n < 2)
                return false;

            return true;
        }
    });

    Ext.define('MyApp.map.SketchPolygon', {
        extend: 'MyApp.map.Sketch',
        alternateClassName: 'MyMapSketchPolygon',
        alias: 'widget.SketchPolygon',
        line_width: 1,
        line_stroke: 'rgba(0,0,255,1)',
        point_fill: 'rgba(0,255,255,0.7)',
        point_radius: 3,
        fill: 'rgba(0,0,0,0.2)',
        pts: undefined,
        hittestpt_idx: -1/*记录鼠标所在多边形边上时，此条边的索引*/,
        RestoreLocation: function ()
        {
            var lastpts = this.lastpts;
            if (!Ext.isEmpty(lastpts))
            {
                this.pts = lastpts;
                this.left = this.lastleft;
                this.top = this.lasttop;
                this.right = this.lastright;
                this.bottom = this.lastbottom;
                this.width = this.lastwidth;
                this.height = this.lastheight;
            }
        },
        OnMouseMove: function (pt, layer, pen_state)
        {
            var pts = this.pts;
            if (!Ext.isEmpty(pts) && pts.length > 0)
            {
                if (pt)
                {
                    if (pen_state == layer.__pen_states.create || pen_state == layer.__pen_states.edit)
                    {
                        var idx = pts.length - 2;
                        this.pts[idx] = pt;
                    }
                    else if (this.__premovept && pen_state == layer.__pen_states.move)
                    {
                        var prept = this.__premovept;
                        var movelon = pt.longitude - prept.longitude;
                        var movelat = pt.latitude - prept.latitude;
                        var movex = pt.x - prept.x;
                        var movey = pt.y - prept.y;
                        var cpt;
                        for (var i = 0, n = pts.length; i < n; i++)
                        {
                            cpt = pts[i];
                            cpt.longitude += movelon;
                            cpt.latitude += movelat;
                            cpt.x += movex;
                            cpt.y += movey;

                            this.left = Math.min(this.left, cpt.x);
                            this.top = Math.min(this.top, cpt.y);
                            this.right = Math.max(this.right, cpt.x);
                            this.bottom = Math.max(this.bottom, cpt.y);
                            this.width = Math.abs(this.left - this.right);
                            this.height = Math.abs(this.top - this.bottom);
                        }
                        this.__premovept = pt;
                    }
                }
            }
            return this;
        },
        OnMouseDown: function (pt, layer, pen_state)
        {
            var pts = this.pts || [];
            var ptslen = pts.length;
            if (pen_state == layer.__pen_states.create || pen_state == layer.__pen_states.edit)
            {
                if (ptslen == 0)
                {
                    // 初始点
                    pts.push(pt);
                    pt = Ext.clone(pt);
                    pts.push(pt);
                    pt = Ext.clone(pt);
                    pts.push(pt);
                }
                else
                {
                    if (pen_state == layer.__pen_states.edit)
                    {
                    }
                    // 增加点,解决双击结束时被增加2个坐标点的问题，对点的坐标进行判断
                    var idx = pts.length - 2, preidx = pts.length - 3;
                    var prept = pts[preidx];
                    if (prept.longitude != pt.longitude && prept.latitude != pt.latitude)
                    {
                        pts[idx] = pt;
                        pt = Ext.clone(pt);
                        pts.splice(idx + 1, 0, pt);
                    }
                }
                this.pts = pts;

                this.left = Math.min(this.left, pt.x);
                this.top = Math.min(this.top, pt.y);
                this.right = Math.max(this.right, pt.x);
                this.bottom = Math.max(this.bottom, pt.y);
                this.width = Math.abs(this.left - this.right);
                this.height = Math.abs(this.top - this.bottom);
            }
            else
            {
                if (ptslen > 3)
                {
                    var lastpts = Ext.clone(pts);
                    this.lastpts = lastpts; // 记录多边形在修改前的位置信息
                    this.lastleft = this.left;
                    this.lasttop = this.top;
                    this.lastright = this.right;
                    this.lastbottom = this.bottom;
                    this.lastwidth = this.width;
                    this.lastheight = this.height;
                }
                this.__premovept = pt;

                // 编辑多边形的边，把鼠标所在点的前一个点作为多边形的起始点
                if (this.hittestpt_idx > -1)
                {
                    var midx = this.hittestpt_idx;
                    var newpts = [];
                    for (var i = midx - 1; i >= 0; i--)
                    {
                        newpts.push(pts[i]);
                    }
                    for (var i = ptslen - 2; i >= midx; i--)
                    {
                        newpts.push(pts[i]);
                    }
                    newpts.push(pt);
                    newpts.push(pts[midx - 1]);
                    this.pts = newpts;

                    layer.__cur_pen.state = layer.__pen_states.edit;
                }
            }

            return this;
        },
        Draw: function (ctx, dx, dy, scale, layer)
        {
            var pts = this.pts || [];
            if (pts.length == 0)
                return;

            var issel = layer.IsSelected(this);
            var style = layer.PolygonStyle;
            var pt = pts[0];
            pt.px = pt.x * scale - dx;
            pt.py = pt.y * scale - dy;

            ctx.lineWidth = issel ? style.sel_line_width || style.line_width || this.line_width : style.line_width || this.line_width;
            ctx.fillStyle = issel ? style.sel_fill || style.fill || this.fill : style.fill || this.fill;
            ctx.strokeStyle = issel ? style.sel_line_stroke || style.line_stroke || this.line_stroke : style.line_stroke || this.line_stroke;

            ctx.beginPath();
            ctx.moveTo(pt.px, pt.py);
            for (var i = 1, len = pts.length; i < len; i++)
            {
                pt = pts[i];
                pt.px = pt.x * scale - dx;
                pt.py = pt.y * scale - dy;
                ctx.lineTo(pt.px, pt.py);
            }
            if (this === layer.__hot)
            {
                ctx.shadowColor = layer.ShadowColor;
                ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = layer.ShadowBlur;
                ctx.fill();
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.shadowColor = "rgba(0, 0, 0, 0)";
            }
            else
            {
                ctx.fill();
                ctx.stroke();
            }

            // 绘制多边形的点
            //ctx.fillStyle = style.point_fill || this.point_fill;
            //for (var i = 0, len = pts.length; i < len; i++)
            //{
            //    pt = pts[i];
            //    ctx.beginPath();
            //    ctx.arc(pt.px, pt.py, style.point_radius || this.point_radius, 0, 2 * Math.PI);
            //    ctx.fill();
            //}
        },
        PtInSketch: function (cx, cy, scale, dx, dy, layer)
        {
            var pts = this.pts || [];
            if (pts.length < 4)
                return false;

            var pleft = this.left * scale - dx;
            var pright = this.right * scale - dx;
            var ptop = this.top * scale - dy;
            var pbottom = this.bottom * scale - dy;

            if (cx < pleft || cx > pright || cy < ptop || cy > pbottom)
                return false;

            var ctx = layer.canvas.canvas.getContext('2d');
            var pt = pts[0]; ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(pt.px, pt.py);
            for (var i = 1, len = pts.length; i < len; i++)
            {
                pt = pts[i];
                pt.px = pt.x * scale - dx;
                pt.py = pt.y * scale - dy;
                ctx.lineTo(pt.px, pt.py);
                if (ctx.isPointInStroke(cx, cy))
                {
                    // 判断鼠标点在哪条边上
                    this.hittestpt_idx = i;
                    return true;
                }
            }
            ctx.closePath();

            this.hittestpt_idx = -1;

            if (ctx.isPointInPath(cx, cy))
                return true;

            return false;
        },
        OnDblClick: function ()
        {
            var pts = this.pts || [];
            var n = pts.length;
            var prept, pt;
            for (var i = 1; i < n; i++)
            {
                prept = pts[i - 1];
                pt = pts[i];
                if (prept.longitude == pt.longitude && prept.latitude == pt.latitude)
                {
                    pts.splice(i, 1);
                    --n;
                }
            }

            if (n < 4)
                return false;

            return true;
        }
    });

    Ext.define('MyApp.map.SketchCircle', {
        extend: 'MyApp.map.Sketch',
        alternateClassName: 'MyMapSketchCircle',
        alias: 'widget.SketchCircle',
        line_width: 1,
        line_stroke: 'rgba(0,0,255,1)',
        fill: 'rgba(0,0,0,0.2)',
        pt0: undefined,
        center: undefined,
        radius: undefined,
        OnMouseMove: function (pt, layer)
        {
            var pt0 = this.pt0, ptcenter = this.center;
            if (pt0 && ptcenter)
            {
                ptcenter.x = (pt0.x + pt.x) / 2;
                ptcenter.y = (pt0.y + pt.y) / 2;
                MyMapBase.LogicalToGeographic(ptcenter);
                this.radius = Math.sqrt(Math.pow(pt0.x - pt.x, 2) + Math.pow(pt0.y - pt.y, 2)) / 2;
            }
        },
        OnMouseDown: function (pt, layer)
        {
            // 绘制圆，只是新建时处理鼠标点击下的事件
            if (Ext.isEmpty(this.pt0))
            {
                this.pt0 = pt;
                pt = Ext.clone(pt);
                this.center = pt;
                this.radius = 0;
            }
            return this;
        },
        Draw: function (ctx, dx, dy, scale, layer)
        {
            var pt = this.center;
            if (!pt)
                return;

            var style = layer.CircleStyle;
            pt.px = pt.x * scale - dx;
            pt.py = pt.y * scale - dy;
            ctx.fillStyle = style.fill || this.fill;
            ctx.strokeStyle = style.line_stroke || this.line_stroke;
            ctx.lineWidth = style.line_width || this.line_width;

            ctx.beginPath();
            ctx.arc(pt.px, pt.py, this.radius * scale, 0, 2 * Math.PI);
            if (this === layer.__hot)
            {
                ctx.shadowColor = layer.ShadowColor;
                ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = layer.ShadowBlur;
                ctx.fill();
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.shadowColor = "rgba(0, 0, 0, 0)";
            }
            else
            {
                ctx.fill();
                ctx.stroke();
            }
        },
        PtInSketch: function (cx, cy, scale, dx, dy, layer)
        {
        },
        OnDblClick: function ()
        {
            if (this.radius == 0)
                return false;

            return true;
        }
    });

    Ext.define('MyApp.map.SketchRect', {
        extend: 'MyApp.map.Sketch',
        alternateClassName: 'MyMapSketchRect',
        alias: 'widget.SketchRect',
        line_width: 1,
        line_stroke: 'rgba(0,0,255,1)',
        fill: 'rgba(0,0,0,0.2)',
        pt0: undefined,
        pt1: undefined,
        OnMouseMove: function (pt, layer)
        {
            this.pt1 = pt;
        },
        OnMouseDown: function (pt, layer)
        {
            // 绘制矩形，只是新建时处理鼠标点击下的事件
            if (Ext.isEmpty(this.pt0))
            {
                // 初始点
                this.pt0 = pt;
                pt = Ext.clone(pt);
                this.pt1 = pt;
            }
            return this;
        },
        Draw: function (ctx, dx, dy, scale, layer)
        {
            var pt = {}, pt0 = this.pt0, pt1 = this.pt1;
            if (!pt0 || !pt1)
                return;

            var style = layer.RectStyle;
            pt0.px = pt0.x * scale - dx;
            pt0.py = pt0.y * scale - dy;
            pt1.px = pt1.x * scale - dx;
            pt1.py = pt1.y * scale - dy;

            pt.px = Math.min(pt0.px, pt1.px);
            pt.py = Math.min(pt0.py, pt1.py);
            var w = Math.abs(pt0.px - pt1.px);
            var h = Math.abs(pt0.py - pt1.py);

            ctx.fillStyle = style.fill || this.fill;
            ctx.strokeStyle = style.line_stroke || this.line_stroke;
            ctx.lineWidth = style.line_width || this.line_width;

            ctx.beginPath();
            ctx.rect(pt.px, pt.py, w, h);
            if (this === layer.__hot)
            {
                ctx.shadowColor = layer.ShadowColor;
                ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = layer.ShadowBlur;
                ctx.fill();
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.shadowColor = "rgba(0, 0, 0, 0)";
            }
            else
            {
                ctx.fill();
                ctx.stroke();
            }
        },
        PtInSketch: function (cx, cy, scale, dx, dy, layer)
        {
        },
        OnDblClick: function ()
        {
            var pt0 = this.pt0, pt1 = this.pt1;
            if (pt0.longitude == pt1.longitude && pt0.latitude == pt1.latitude)
                return false;

            return true;
        }
    });

    // 绘画图层
    Ext.define('MyApp.map.SketchLayer', {
        extend: 'MyApp.map.Layer',
        alias: 'widget.sketch_layer',
        zIndex: -300,
        PointStyle: { point_fill: 'rgba(0,0,255,0.7)', point_radius: 6 },
        LineStyle: { point_fill: 'rgba(0,255,255,0.7)', point_radius: 3, line_width: 1, line_stroke: 'rgba(0,0,255,1)' },
        PolygonStyle: {
            point_fill: 'rgba(0,255,255,0.7)', point_radius: 3, line_width: 1, line_stroke: 'rgba(0,0,255,1)', fill: 'rgba(0,0,0,0.1)',
            sel_line_width: 2, sel_line_stroke: 'rgba(255,0,0,1)', sel_fill: 'rgba(255,0,0,0.1)'
        },
        CircleStyle: { line_width: 1, line_stroke: 'rgba(0,0,255,1)', fill: 'rgba(0,0,0,0.2)' },
        RectStyle: { line_width: 1, line_stroke: 'rgba(0,0,255,1)', fill: 'rgba(0,0,0,0.2)' },
        ShadowColor: 'rgba(0,0,0,0.5)',
        ShadowBlur: 5,
        __sketchbtns: undefined/*画板的绘制选项按钮*/,
        SketchPens: {
            Point: { text: '点', name: 'addpoint', type: 'Point', btntip: '点', disabled: false, drawtip: '单击结束绘制' },
            Line: { text: '线', name: 'addline', type: 'Line', btntip: '线', disabled: false, drawtip: '双击结束绘制' },
            Polygon: { text: '多边形', name: 'addpolygon', type: 'Polygon', btntip: '多边形', disabled: false, drawtip: '双击结束绘制' },
            Circle: { text: '圆', name: 'addcircle', type: 'Circle', btntip: '圆', disabled: false, drawtip: '双击结束绘制' },
            Rect: { text: '矩形', name: 'addrect', type: 'Rect', btntip: '矩形', disabled: false, drawtip: '双击结束绘制' }
        },
        __sketch_states: { add: 'add', load: 'load' },
        __pen_states: { none: 0, create: 1, edit: 2, move: 3 },
        constructor: function ()
        {
            var __curpen = undefined;
            Object.defineProperties(this, {
                items: { value: [] },
                __cur_pen: {
                    get: function () { return __curpen; },
                    set: function (v)
                    {
                        if (__curpen == v)
                            return;

                        // 取消正在绘制的对象
                        if (this.__cur_item)
                        {
                            if (this.__cur_pen.state == this.__pen_states.create)
                                this.RemoveItem(this.__cur_item);
                            else
                                this.RestoreLocation(this.__cur_item);

                            this.__cur_item = undefined;
                        }
                        __curpen = v;
                    }
                }
            });

            this.callParent(arguments);
        },
        OnInitUpdate: function (canvas, tile)
        {
            this.callParent(arguments);
            var tbar = this.map.toolbar;

            Ext.QuickTips.init();
            var it;
            for (var i in this.SketchPens)
            {
                it = this.SketchPens[i];
                fn = this.task.pass(this.__togglePen, this, it.type);

                var xtype = { xtype: 'button', name: it.name, disabled: it.disabled, scope: this, tooltip: it.btntip, handler: fn };
                if (it.icon)
                    xtype.icon = it.icon;
                else
                    xtype.text = it.text;

                tbar.add(xtype);
            }
        },
        __togglePen: function (pentype)
        {
            var btn, cfg;
            if (!this.__sketchbtns)
            {
                var sketchbtns = {};
                for (var i in this.SketchPens)
                {
                    cfg = this.SketchPens[i];
                    btn = this.map.toolbar.items.findBy(function (it) { return (it.text == cfg.text || it.name == cfg.name); });
                    if (btn)
                        sketchbtns[cfg.type] = btn;
                }
                this.__sketchbtns = sketchbtns;
            }

            for (var it in this.__sketchbtns)
            {
                if (it == pentype)
                {
                    if (this.__cur_pen && this.__cur_pen.type == pentype)
                    {
                        this.__sketchbtns[pentype].toggle(false);
                        this.__cur_pen = undefined;
                    }
                    else
                    {
                        this.__sketchbtns[pentype].toggle(true);
                        this.__cur_pen = this.SketchPens[pentype];
                        this.__cur_pen.state = this.__pen_states.create;
                    }
                }
                else
                    this.__sketchbtns[it].toggle(false);
            }
        },
        CreateItem: function (it, type, hr, add_field)
        {
            var cls = Ext.ClassManager.getByAlias('widget.Sketch' + type);
            if (cls)
            {
                //var ctype = cls.GetImpl(hr, add_field);
                //if (ctype)
                //    return new ctype(it);
                return new cls(it, hr, add_field);
            }
            else
                return undefined;
        },
        RestoreLocation: function(it)
        {
            if (it && Ext.isFunction(it.RestoreLocation))
            {
                it.RestoreLocation();
                this.Invalidate();
            }
        },
        RemoveItem: function (it)
        {
            var idx = this.items.indexOf(it);
            if (idx < 0)
                return;

            this.items.splice(idx, 1);

            if (this.__hot === it)
                this.__hot = undefined;

            if (this.__cur_item === it)
                this.__cur_item = undefined;

            this.Invalidate();
        },
        __ondraw: function (ctx, it, dx, dy, scale)
        {
            if (it instanceof MyApp.map.Sketch)
                it.Draw(ctx, dx, dy, scale, this);
        },
        OnDraw: function (ctx)
        {
            var clipbox = this.canvas.clipBox;

            var items = this.items, n = items.length;
            if (n)
            {
                var tile = this.tile, scale = tile.canvasWidth / tile.ViewportW;
                var dx = tile.ViewportX * scale, dy = tile.ViewportY * scale;
                for (var i = 0, it; i < n; i++)
                {
                    it = items[i];
                    this.__ondraw(ctx, it, dx, dy, scale);
                }
            }
        },
        GetCursor: function (e)
        {
            if (this.__cur_pen && (this.__cur_pen.state == this.__pen_states.create || this.__cur_pen.state == this.__pen_states.edit))
                return 'crosshair';
            else if (!Ext.isEmpty(this.__hot))
            {
                var idx = this.__hot.hittestpt_idx;
                if(idx && idx > -1)
                    return 'crosshair';
                else
                    return 'pointer';
            }
            else
                return undefined;
        },
        SelectItem: function (item, append, e)
        {
        },
        IsSelected: function (item)
        {
            return false;
        },
        HitTest: function (cx, cy, e)
        {
            if (this.__cur_pen && (this.__cur_pen.state == this.__pen_states.create || this.__cur_pen.state == this.__pen_states.edit))
                return '<b>' + this.__cur_pen.drawtip + '</b><br/>(' + cx + ', ' + cy + ')';
            else if (this.__hot && this.__cur_pen && this.__cur_pen.state == this.__pen_states.move)
                return this.__hot;
            else
            {
                var items = this.items, n = items.length;
                if (n == 0)
                    return;

                var tile = this.tile;
                var scale = tile.canvasWidth / tile.ViewportW, dx = tile.ViewportX * scale, dy = tile.ViewportY * scale;

                var it = this.__hot;
                do
                {
                    if (it instanceof MyApp.map.Sketch && it.PtInSketch(cx, cy, scale, dx, dy, this))
                        break;

                    for (var i = n; i-- > 0;)
                    {
                        it = items[i];
                        if (it.PtInSketch(cx, cy, scale, dx, dy, this))
                            break;
                    }

                    if (i < 0)
                        it = undefined;

                } while (false);

                if (e && this.__hot !== it)
                {
                    this.__hot = it;
                    this.Invalidate();
                }
                return it;
            }
        },
        OnKeyDown: function (e)
        {
            if (this.__cur_pen)
            {
                switch (e.keyCode)
                {
                    case e.ESC:
                        if (this.__cur_pen.state == this.__pen_states.create)
                            this.RemoveItem(this.__cur_item);
                        else
                            this.__cur_pen = undefined;

                        this.__cur_item = undefined;
                        return true;
                }
            }
        },
        OnKeyUp: function (e)
        {
        },
        __getmousept: function (e)
        {
            var tile = this.tile, scale = tile.canvasWidth / tile.ViewportW;
            var pt = e.getXY(), pc = tile.getXY();
            var x = (pt[0] - pc[0]) / scale + tile.ViewportX, y = (pt[1] - pc[1]) / scale + tile.ViewportY;
            pt = MyMapBase.LogicalToGeographic({ x: x, y: y });
            return pt;
        },
        OnMouseMove: function (e)
        {
            if (this.__cur_pen)
            {
                if (this.__hot && (this.map.state == this.map.state_item_down || this.map.state == this.map.state_layer_down))
                {
                    this.__cur_pen.state = this.__pen_states.move;
                    this.__cur_item = this.__hot;
                }
                var item = this.__cur_item;
                if (item)
                {
                    var pt = this.__getmousept(e);
                    item.OnMouseMove(pt, this, this.__cur_pen.state);

                    this.Invalidate();
                }
            }
            return true;
        },
        OnMouseDown: function (e)
        {
            if (e.button === 0)
            {
                if (this.__cur_pen && this.__cur_pen.state != this.__pen_states.none)
                {
                    var pt = this.__getmousept(e);
                    var item = this.__cur_item;
                    if (!item)
                    {
                        item = this.CreateItem([Ext.data.IdGenerator.get('uuid').generate(), this.__cur_pen.type, this.__sketch_states.add],
                            this.__cur_pen.type, [], ['id', 'type', 'status']);
                        this.items.push(item);
                    }
                    this.__cur_item = item.OnMouseDown(pt, this, this.__cur_pen.state);

                    this.Invalidate();
                }
                else if (this.__hot)
                {
                    var pt = this.__getmousept(e);
                    this.__cur_item = undefined;
                    this.__cur_pen = this.SketchPens[this.__hot.type];
                    this.__cur_pen.state = this.__pen_states.none;
                    this.__cur_item = this.__hot;
                    this.__cur_item.OnMouseDown(pt, this, this.__cur_pen.state);
                }
            }
        },
        OnMouseUp: function (e)
        {
            if (this.__cur_pen.state == this.__pen_states.move)
            {
                this.__cur_item = undefined;
                this.__cur_pen = undefined;
            }
        },
        OnContextMenu: function (e)
        {
        },
        OnDblClick: function (e)
        {
            if (this.__cur_pen)
            {
                if (Ext.isFunction(this.__cur_item.OnDblClick))
                {
                    var isfinish = this.__cur_item.OnDblClick(); // 判断绘制的对象是否满足要求，如果返回为false则进行删除
                    if (!isfinish)
                        this.RemoveItem(this.__cur_item);
                }
                this.__cur_item = undefined;

                if (this.__cur_pen.state != this.__pen_states.create)
                    this.__cur_pen = undefined;
            }
            return true;
        }
    });

    // 简单图层
    Ext.define('MyApp.map.SimpleLayer', {
        extend: 'MyApp.map.Layer',
        alias: 'widget.simple_layer',
        zIndex: -300, // 层级
        uri: '/web/jss/map.jss?action=map.GetCell', // 向后台初始化数据
        visible: true, // 设置为可见
        OnDraw: function (ctx) // 重写Draw方法
        {},
        OnQuery: function (condition) // 处理查询条件
        {
            this.PostLoad();
        },
        OnLoad: function (result, error)  // 处理数据方法
        {}
    });
});