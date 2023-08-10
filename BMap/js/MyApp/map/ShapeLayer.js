Ext.define('MyApp.map.Areagrid', {
    extend: 'MyApp.map.Element',
    alternateClassName: 'MyMapAreagrid',
    constructor: function (idx)
    {
        this.index = idx;
        this.callParent(arguments);
    },
    GetTip: function ()
    {
    }
});

Ext.define('MyApp.map.ShapeLayer', {
    extend: 'MyApp.map.Layer',
    alias: 'widget.shape_layer',
    zIndex: -555,
    rc: 131072,
    offset: 0,
    shape: 1,
    scale: 0.6,
    OnInitUpdate: function ()
    {
        this.callParent(arguments);
        this.__areagrid = -1;
        this.Load();
    },
    Load: function ()
    {
        var clr = [], b = this.shape == 3;
        for (var i = 0; i < 100; i++)
        {
            //clr[i] = 'rgba(' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + (b ? 1 : Math.round(Math.random() * 10) / 10) + ')';
            clr[i] = 'rgba(' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',' + Math.round(Math.random() * 255) + ',0.8)';
        }
        this.__clr = clr;

        if (b)
        {
            this.Request(APPBASE + '/lib/BMap/js/MyApp/map/grids.js', undefined, function (r, e) { this.data = r; this.Invalidate(); });
        }
        else if (this.shape == 5)
        {
            this.Request(APPBASE + '/lib/BMap/js/MyApp/map/areagrids.js', undefined, function (r, e) { this.data = r; this.Invalidate(); });
        }
    },
    OnDraw: function (ctx)
    {
        var tile = this.tile, scale = tile.canvasWidth / tile.ViewportW;
        var dx = scale * tile.ViewportX, dy = scale * tile.ViewportY;
        var rc = this.rc;

        var x, y, w = (scale / rc) * this.scale, h = (scale / rc) * this.scale;

        //ctx.fillStyle = "rgba(255,0,0,0.5)";
        var cb, clr = this.__clr;
        switch (this.shape)
        {
            case 1:
                cb = function ()
                {
                    ctx.beginPath();
                    ctx.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2, true);
                    ctx.closePath();
                };
                break;
            case 2:
                cb = function ()
                {
                    ctx.beginPath();
                    ctx.moveTo(x, y + h);
                    ctx.lineTo(x + w / 2, y);
                    ctx.lineTo(x + w, y + h);
                    ctx.closePath();
                };
                break;
            case 3:
                {
                    var data = this.data, box = this.canvas.clipBox;
                    for (var i = 0, n = data.length, it; i < n; i++)
                    {
                        it = data[i];
                        x = it[0] * scale - dx;
                        y = it[1] * scale - dy;
                        w = (it[2] - it[0]) * scale;
                        h = (it[3] - it[1]) * scale;

                        if (box.IsIntersect(x, y, w, h))
                        {
                            ctx.fillStyle = clr[Math.round((i + this.offset) % clr.length)];

                            ctx.beginPath();
                            ctx.rect(x, y, w, h);
                            ctx.fill();
                        }
                    }
                }
                return;
            case 4:
                {
                    // 投诉
                    var data = this.data, box = this.canvas.clipBox;
                    for (var i = 0, n = data.length, it; i < n; i++)
                    {
                        it = data[i];
                        var pt = MyMapBase.GeographicToLogical({ longitude: it[0], latitude: it[1] });
                        x = pt.x * scale - dx;
                        y = pt.y * scale - dy;

                        //if (box.IsIntersect(x, y, 12 / scale, 12 / scale))
                        {
                            ctx.fillStyle = clr[Math.round((i + this.offset) % clr.length)];

                            ctx.beginPath();
                            ctx.arc(x, y, 6, 0, Math.PI * 2, true);
                            ctx.closePath();
                            ctx.fill();
                        }
                    }
                }
                return;
            case 5:
                {
                    // 网格
                    var data = this.data, box = this.canvas.clipBox;
                    for (var i = 0, n = data.length, it; i < n; i++)
                    {
                        it = data[i]; // 网格
                        if (it.length == 0)
                            continue;

                        ctx.beginPath();
                        var pt = MyMapBase.GeographicToLogical({ longitude: it[0][0], latitude: it[0][1] });
                        x = pt.x * scale - dx;
                        y = pt.y * scale - dy;
                        ctx.moveTo(x, y);

                        for (var j = 0, count = it.length; j < count; j++)
                        {
                            // 网格内的点
                            var pt = MyMapBase.GeographicToLogical({ longitude: it[j][0], latitude: it[j][1] });
                            x = pt.x * scale - dx;
                            y = pt.y * scale - dy;
                            ctx.lineTo(x, y);
                        }

                        ctx.closePath();
                        ctx.fillStyle = clr[Math.round((i + this.offset) % clr.length)];
                        ctx.fill();
                        ctx.strokeStyle = "rgba(0,0,255,0.5)";
                        ctx.stroke();
                    }
                }
                return;
            default:
                {
                    ctx.textAlign = 'center';
                    cb = function ()
                    {
                        ctx.beginPath();
                        ctx.rect(x, y, w, h);
                        ctx.fill();

                        var s = (r - 811100) + ', ' + (c - 1512400);

                        // var fs = ctx.fillStyle;
                        ctx.fillStyle = 'black';
                        ctx.fillText(s, x + w / 2, y + h * 15 / 32);
                        //s = (x + dx + w) / scale + ', ' + (y + dy + h) / scale;
                        //ctx.fillText(s, x + w / 2, y + h * 17 / 32);
                        //ctx.fillStyle = fs;
                        return true;
                    };
                    if (!this.pr)
                        this.pr = function (r, c)
                        {
                            r += 811100; c += 1512400;
                            return [c / this.rc, r / this.rc, (c + 1) / this.rc, (r + 1) / this.rc];
                            //console.log(Ext.encode());
                        };
                    break;
                }
        }

        var bc = Math.floor(rc * tile.ViewportX), br = Math.floor(rc * tile.ViewportY);
        var ec = Math.round(rc * (tile.ViewportX + tile.ViewportW)), er = Math.round(rc * (tile.ViewportY + tile.ViewportW * tile.canvasHeight / tile.canvasWidth));

        if (ec - bc > 50 || er - br > 50)
            return;

        for (var r = br, i; r <= er; r++)
        {
            y = (r / rc) * scale - dy;
            for (var c = bc; c <= ec; c++)
            {
                i = Math.round(((r * rc) + c + this.offset) % clr.length);
                ctx.fillStyle = clr[i];
                x = (c / rc) * scale - dx;
                if (!cb(r, c))
                    ctx.fill();
            }
        }
    },
    HitTest: function (cx, cy, e)
    {
        switch (this.shape)
        {
            case 5:
                {
                    var data = this.data;
                    if (!data)
                        break;

                    var tile = this.tile, scale = tile.canvasWidth / tile.ViewportW;
                    var dx = scale * tile.ViewportX, dy = scale * tile.ViewportY;

                    var ctx = this.canvas.canvas.getContext('2d'), pt = {};
                    for (var i = data.length, it, j, n; i-- > 0; )
                    {
                        it = data[i];
                        n = it.length;
                        if (n < 3)
                            continue;

                        ctx.beginPath();

                        pt.longitude = it[0][0];
                        pt.latitude = it[0][1];
                        MyMapBase.GeographicToLogical(pt);
                        ctx.moveTo(pt.x * scale - dx, pt.y * scale - dy);

                        for (var j = 1; j < n; j++)
                        {
                            pt.longitude = it[j][0];
                            pt.latitude = it[j][1];

                            MyMapBase.GeographicToLogical(pt);
                            ctx.lineTo(pt.x * scale - dx, pt.y * scale - dy);
                        }
                        ctx.closePath();

                        if (ctx.isPointInPath(cx, cy))
                            return new MyMapAreagrid(i); //'网格.' + i; // 
                    }
                }
        }
    }
});