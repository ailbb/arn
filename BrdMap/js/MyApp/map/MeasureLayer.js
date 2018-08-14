// 测量图层
Ext.define('MyApp.map.MeasureLayer', {
    extend: 'MyApp.map.Layer',
    alias: 'widget.measure_layer',
    zIndex: -333,
    img_close: Ext.apply(new Image(), { src: Ext.Loader.getPath('MyApp') + '/images/icon/del10.png' }),
    constructor: function ()
    {
        var __measure = false;
        Object.defineProperties(this, {
            items: { value: [] },
            measure: {
                get: function () { return __measure; },
                set: function (v)
                {
                    if (__measure == v)
                        return;

                    if (this.__cur_item)
                    {
                        var pts = this.__cur_item.pts, pt;
                        for (var i = pts.length - 1; i > 0; )
                        {
                            pt = pts[i--];
                            if (this.GetDistance(pts[i], pt) > 0.1)
                            {
                                pt.distance = this.GetDistance(pts[0], pt);
                                break;
                            }

                            pts.splice(i, 1);
                        }

                        if (pts.length < 2)
                            this.RemoveItem(this.__cur_item);

                        this.__cur_item = undefined;
                    }
                    __measure = v;
                    this.Invalidate();
                }
            }
        });

        this.callParent(arguments);
    },
    OnUpdateBound: function () { },
    OnDraw: function (ctx)
    {
        var cb = this.canvas.clipBox;
        if (this.measure)
        {
            ctx.fillStyle = 'rgba(136,136,255,0.09)';
            ctx.fillRect(cb.x, cb.y, cb.w, cb.h);
        }

        ctx.textAlign = 'center';
        var tile = this.tile, scale = tile.canvasWidth / tile.ViewportW;
        var items = this.items, n = items.length;
        if (n)
        {
            var img = this.img_close;
            if (img && (!img.complete || !img.width))
                img = undefined;

            var x, y, dx = tile.ViewportX * scale, dy = tile.ViewportY * scale;
            ctx.font = "10px arial";
            for (var i = 0, j, m, it, pts, pt; i < n; i++)
            {
                it = items[i];
                pts = it.pts;
                m = pts.length;
                if (!m)
                    continue;

                ctx.shadowColor = "rgba(0,0,0,0.75)";
                ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = 6;

                ctx.lineWidth = 3;
                ctx.strokeStyle = "rgba(255,0,0,0.75)";
                pt = pts[0];
                pt.px = pt.x * scale - dx; pt.py = pt.y * scale - dy;
                ctx.beginPath();
                ctx.moveTo(pt.px, pt.py);
                for (j = 1; j < m; j++)
                {
                    pt = pts[j];
                    pt.px = pt.x * scale - dx; pt.py = pt.y * scale - dy;
                    ctx.lineTo(pt.px, pt.py);
                }
                ctx.stroke();

                ctx.lineWidth = 1;
                ctx.fillStyle = ctx.strokeStyle;
                ctx.strokeStyle = "rgba(255,0,255,0.75)";
                for (j = 0; j < m; j++)
                {
                    pt = pts[j];
                    ctx.beginPath();
                    ctx.arc(pt.px, pt.py, 5, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();
                }

                for (j = 0; j < m; j++)
                {
                    pt = pts[j];
                    if (j)
                    {
                        if (pt.distance < 1000)
                            pt.lable = '共 ' + Math.round(pt.distance * 100) / 100 + ' 米';
                        else
                            pt.lable = '共 ' + Math.round(pt.distance) / 1000 + ' 公里';
                    }
                    else
                        pt.lable = '起点';

                    pt.lbw = ctx.measureText(pt.lable).width + 6;
                    pt.lbh = 16 + 6;
                    pt.lbx = Math.floor(pt.px - pt.lbw / 2) + 0.5;
                    pt.lby = Math.floor(pt.py - pt.lbh - 6) + 0.5;

                    if (j == m - 1 && it != this.__cur_item)
                    {
                        it.btn_x = pt.lbx + pt.lbw;
                        it.btn_y = pt.lby + 3;
                        it.btn_w = it.btn_h = pt.lbh - 6;
                        pt.lbw = it.btn_x + it.btn_w + 3 - pt.lbx;
                    }

                    if (!cb.IsIntersect(pt.lbx, pt.lby, pt.lbw + 6, pt.lbh + 6))
                        continue;

                    ctx.beginPath();
                    ctx.rect(pt.lbx, pt.lby, pt.lbw, pt.lbh);

                    ctx.shadowColor = "rgba(0,0,0,0.75)";
                    ctx.fillStyle = "rgba(255,255,225,0.5)";
                    ctx.fill();

                    ctx.shadowColor = "rgba(0, 0, 0, 0)";
                    ctx.fillStyle = "rgba(255,255,225,0.75)";
                    ctx.fill();

                    ctx.strokeStyle = "rgba(0,0,0,0.65)";
                    ctx.stroke();

                    ctx.fillStyle = "rgba(128,0,0,1)";
                    ctx.fillText(pt.lable, pt.px, pt.lby + pt.lbh - 6);
                }

                if (img && it != this.__cur_item)
                {
                    x = it.btn_x + (it.btn_w - this.img_close.width) / 2;
                    y = it.btn_y + (it.btn_h - this.img_close.height) / 2;

                    if (this.__hot === it && !it.press)
                    {
                        x -= 2;
                        y -= 2;
                        ctx.shadowColor = "rgba(0,0,0,0.75)";
                        ctx.shadowOffsetX = ctx.shadowOffsetY = 2;
                    }
                    else
                        ctx.shadowColor = "rgba(0, 0, 0, 0)";

                    ctx.shadowBlur = 0;
                    ctx.drawImage(img, x, y);
                }
            }
        }

        var x = tile.ViewportX + tile.ViewportW / 2, y = tile.ViewportY + tile.ViewportW * tile.canvasHeight / tile.canvasWidth / 2;
        var pc = MyMapBase.LogicalToGeographic({ x: x, y: y }), pt = MyMapBase.LogicalToGeographic({ x: x + tile.ViewportW * (80 - tile.ZoomLevel * 2) / tile.canvasWidth, y: y });
        var d = MyMapBase.getGeoDistance(pc.longitude, pc.latitude, pt.longitude, pt.latitude);
        var s = Math.pow(10, Math.floor(Math.log(d) / Math.log(10)));
        d /= s;
        if (d < 1.5)
            d = 1;
        else if (d < 3.5)
            d = 2;
        else if (d < 7.5)
            d = 5;
        else
            d = 10;

        d *= s;
        pt.longitude = MyMapBase.GeoOffset(pc.longitude, pc.latitude, d, 0)[0];
        MyMapBase.GeographicToLogical(pt);
        var dx = Math.round((pt.x - x) * scale);

        x = 9; y = tile.canvasHeight - 19;
        ctx.shadowBlur = 6; ctx.shadowOffsetX = ctx.shadowOffsetY = 6; ctx.shadowColor = "rgba(0, 0, 0, 1)";

        ctx.font = "13px arial";
        ctx.fillStyle = "rgba(0,0,0,1)";
        s = d < 1000 ? (d + '米') : (d / 1000 + '公里');
        ctx.fillText(s, x + dx / 2, y);

        ctx.lineCap = 'butt';
        ctx.lineWidth = 2; ctx.strokeStyle = "rgba(0,0,0,1)";
        ctx.beginPath(); ctx.moveTo(x, y + 5); ctx.lineTo(x + dx, y + 5); ctx.stroke();

        ctx.lineWidth = 1; x += 0.5; y += 0.5;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 6); ctx.stroke();
        x += dx;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 6); ctx.stroke();

        ctx.shadowColor = "rgba(0, 0, 0, 0)";
    },
    GetCursor: function (e)
    {
        return this.measure ? 'default' : (this.__hot ? 'pointer' : undefined);
    },
    GetTip: function (item)
    {
        return this.__hot && this.__hot === item ? '删除' : item;
    },
    HitTest: function (cx, cy, e)
    {
        if (this.measure)
            return '<b>单击左键继续，双击结束。</b><br/>(' + cx + ', ' + cy + ')';
        else
        {
            var items = this.items, it;
            for (var i = items.length; i-- > 0; )
            {
                it = items[i];
                if (cx >= it.btn_x && cx < it.btn_x + it.btn_w && cy >= it.btn_y && cy < it.btn_y + it.btn_h)
                    break;
            }

            if (i < 0)
                it = undefined;

            if (e)
            {
                if (this.__hot === it)
                {
                    if (this.__hot && this.__hot.press)
                    {
                        this.__hot.press = false;
                        this.InvalidateRect(this.__hot.btn_x, this.__hot.btn_y, this.__hot.btn_w, this.__hot.btn_h);
                    }
                }
                else
                {
                    if (this.__hot)
                    {
                        this.__hot.press = false;
                        this.InvalidateRect(this.__hot.btn_x, this.__hot.btn_y, this.__hot.btn_w, this.__hot.btn_h);
                    }

                    this.__hot = it;
                    if (it)
                        this.InvalidateRect(it.btn_x, it.btn_y, it.btn_w, it.btn_h);
                }
            }

            return it;
        }
    },
    OnKeyDown: function (e)
    {
        if (this.measure)
        {
            switch (e.keyCode)
            {
                case e.CTRL:
                    break;
                case e.RETURN:
                    this.measure = false;
                    return true;
                case e.ESC:
                    this.RemoveItem(this.__cur_item);
                    this.measure = false;
                    return true;
            }
        }
    },
    GetDistance: function (p1, p2)
    {
        return MyMapBase.getGeoDistance(p1.longitude, p1.latitude, p2.longitude, p2.latitude);
    },
    OnMouseMove: function (e)
    {
        if (this.measure)
        {
            var item = this.__cur_item;
            if (item)
            {
                var tile = this.tile, scale = tile.canvasWidth / tile.ViewportW;
                var pt = e.getXY(), pc = tile.getXY();
                var x = (pt[0] - pc[0]) / scale + tile.ViewportX, y = (pt[1] - pc[1]) / scale + tile.ViewportY;

                var pts = item.pts, i = item.pts.length - 1;
                pt = item.pts[i];
                pt.x = x; pt.y = y;
                MyMapBase.LogicalToGeographic(pt);
                pt.distance = this.GetDistance(pts[0], pt);

                this.Invalidate();
            }
        }
    },
    OnMouseDown: function (e)
    {
        if (this.measure)
        {
            if (e.button === 0)
            {
                var tile = this.tile, scale = tile.canvasWidth / tile.ViewportW;
                var pt = e.getXY(), pc = tile.getXY();
                var x = (pt[0] - pc[0]) / scale + tile.ViewportX, y = (pt[1] - pc[1]) / scale + tile.ViewportY;

                var item = this.__cur_item;
                if (item)
                {
                    var pts = item.pts, i = item.pts.length - 1;
                    pt = item.pts[i];
                    pt.x = x; pt.y = y;
                    MyMapBase.LogicalToGeographic(pt);

                    if (this.GetDistance(pts[i - 1], pt) > 0.1)
                    {
                        pt.distance = this.GetDistance(pts[0], pt);
                        pt = Ext.clone(pt);
                        pts.push(pt);
                    }
                }
                else
                {
                    pt = MyMapBase.LogicalToGeographic({ x: x, y: y });
                    item = { pts: [pt] };
                    this.__cur_item = item;
                    this.items.push(item);

                    pt = Ext.clone(pt);
                    pt.distance = 0;
                    item.pts.push(pt);
                }

                this.Invalidate();
            }

            return true;
        }
        else if (this.__hot)
        {
            if (e.button === 0)
            {
                this.__hot.press = true;
                this.InvalidateRect(this.__hot.btn_x, this.__hot.btn_y, this.__hot.btn_w, this.__hot.btn_h);
            }
        }
    },
    RemoveItem: function (it)
    {
        var i = this.items.indexOf(it);
        if (i < 0)
            return;

        this.items.splice(i, 1);
        if (this.__hot === it)
            this.__hot = undefined;

        if (this.__cur_item === it)
            this.__cur_item = undefined;

        this.Invalidate();
    },
    OnMouseUp: function (e)
    {
        if (!this.measure && e.button === 0 && this.__hot)
        {
            this.RemoveItem(this.__hot);
            return true;
        }
    },
    OnContextMenu: function (e)
    {
        if (this.measure)
        {
            this.RemoveItem(this.__cur_item);
            this.measure = false;
        }
        else if (this.__hot)
        {
            var mis = [{ text: '<b>删除</b>', icon: Ext.Loader.getPath('MyApp') + '/images/icon/del.png', handler: Ext.pass(this.RemoveItem, [this.__hot], this)}];
            this.map.ShowMenu(mis, e.getX(), e.getY());
        }

        return true;
    },
    OnDblClick: function (e)
    {
        if (this.measure)
        {
            this.measure = false;
            return true;
        }
    }
});
