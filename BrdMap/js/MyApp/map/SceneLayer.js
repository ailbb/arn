Ext.require('MyApp.map.Element', function ()
{
    Ext.define('MyApp.map.Scene', {
        extend: 'MyApp.map.Element',
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        lineWidth: 1,
        constructor: function (config)
        {
            this.initialConfig = config;
            Ext.apply(this, config);

            var pts = this.pts;
            if (pts)
            {
                var l = 1, t = 1, r = 0, b = 0;
                for (var i = pts.length; i-- > 0; )
                {
                    t = Math.min(t, pts[i]);
                    b = Math.max(b, pts[i]);

                    l = Math.min(l, pts[--i]);
                    r = Math.max(r, pts[i]);
                }

                this.left = l; this.top = t;
                this.width = r - l; this.height = b - t;
            }

            this.callParent(arguments);
        },
        DrawPath: function (ctx, scale, offsetX, offsetY)
        {
            var pts = this.pts;
            if (!pts)
                return 0;

            var n = pts.length;
            if (n < 4)
                return 0;

            ctx.beginPath();
            ctx.moveTo(pts[0] * scale + offsetX, pts[1] * scale + offsetY);
            for (var i = 2; i < n; i += 2)
            {
                ctx.lineTo(pts[i] * scale + offsetX, pts[i + 1] * scale + offsetY);
            }

            return n >> 2;
        },
        Draw: function (ctx, clipBox, scale, offsetX, offsetY, layer) { },
        PtInScene: function (x, y, scale, offsetX, offsetY, layer) { },
        GetTip: function () { return this.name || ''; }
    },
    function ()
    {
        Object.defineProperties(this.prototype, {
            right: { get: function () { return this.left + this.width; },
                set: function (v) { this.width = v - this.left; }
            },
            bottom: { get: function () { return this.top + this.height; },
                set: function (v) { this.height = v - this.top; }
            }
        });
    });

    Ext.define('MyApp.map.LineScene', {
        extend: 'MyApp.map.Scene',
        alias: ['scene.机场高速', 'scene.跨省高速', 'scene.省内高速', 'scene.国道', 'scene.省道', 'scene.水运航道'],
        lineWidth: 5,
        Draw: function (ctx, clipBox, scale, offsetX, offsetY, layer)
        {
            if (this.DrawPath(ctx, scale, offsetX, offsetY) > 1)
            {
                ctx.lineWidth = this.lineWidth;
                ctx.strokeStyle = layer.GetItemColor(this, this.strokeStyle || layer.strokeStyle || 'red');

                if (layer.IsSelected(this))
                {
                    ctx.lineWidth += 3;
                    ctx.strokeStyle = MyCommon.mixColor(ctx.strokeStyle, 'black', 0.6);
                }

                if (this === layer.__hot)
                {
                    ctx.shadowBlur = 3;
                    ctx.shadowColor = ctx.strokeStyle = MyCommon.mixColor(ctx.strokeStyle, 'black');
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                    ctx.shadowColor = "rgba(0, 0, 0, 0)";
                }
                else
                    ctx.stroke();
            }
        },
        PtInScene: function (x, y, scale, offsetX, offsetY, layer)
        {
            var pts = this.pts;
            if (!pts)
                return;

            var n = pts.length;
            if (n < 4)
                return;

            var x1 = pts[0] * scale + offsetX, y1 = pts[1] * scale + offsetY, x2, y2;
            var lw = this.lineWidth + (layer.IsSelected(this) ? 3 : 0);
            lw = Math.max(3, Math.ceil(lw / 2));
            var a, b, c;
            for (var i = 2; i < n; x1 = x2, y1 = y2)
            {
                x2 = pts[i++] * scale + offsetX;
                y2 = pts[i++] * scale + offsetY;

                if (x < Math.min(x1, x2) - lw || x > Math.max(x1, x2) + lw || y < Math.min(y1, y2) - lw || y > Math.max(y1, y2) + lw)
                    continue;

                a = y1 - y2; b = x2 - x1; c = x1 * y2 - x2 * y1;
                if (Math.abs((a * x + b * y + c) / Math.sqrt(a * a + b * b)) <= lw)
                    return true;
            }
        }
    });

    Ext.define('MyApp.map.AreaScene', {
        extend: 'MyApp.map.Scene',
        alias: ['scene.一类校园', 'scene.二类校园', 'scene.三类校园', 'scene.5A级景区', 'scene.4A级景区', 'scene.3A级景区', 'scene.3A级以下景区',
    'scene.市区', 'scene.县城', 'scene.A类乡镇', 'scene.B类乡镇', 'scene.C类乡镇', 'scene.行政村'],
        Draw: function (ctx, clipBox, scale, offsetX, offsetY, layer)
        {
            if (this.DrawPath(ctx, scale, offsetX, offsetY) > 2)
            {
                ctx.closePath();
                ctx.fillStyle = layer.GetItemColor(this, this.fillStyle || layer.fillStyle || 'blue');

                if (layer.IsSelected(this))
                    ctx.fillStyle = MyCommon.mixColor(ctx.fillStyle, 'black', 0.6);

                if (this === layer.__hot)
                {
                    ctx.shadowBlur = 3;
                    ctx.shadowColor = ctx.fillStyle = MyCommon.mixColor(ctx.fillStyle, 'black');
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    ctx.shadowColor = "rgba(0, 0, 0, 0)";
                }
                else
                    ctx.fill();
            }
        },
        PtInScene: function (x, y, scale, offsetX, offsetY, layer)
        {
            var ctx = layer.canvas.canvas.getContext('2d');
            if (this.DrawPath(ctx, scale, offsetX, offsetY) > 2)
            {
                ctx.closePath();
                return ctx.isPointInPath(x, y);
            }
        }
    });

    Ext.define('MyApp.map.Railway', {
        extend: 'MyApp.map.LineScene',
        alias: ['scene.跨省高铁', 'scene.省内高铁', 'scene.动车线', 'scene.普通铁路'],
        lineWidth: 5,
        Draw: function (ctx, clipBox, scale, offsetX, offsetY, layer)
        {
            var pts = this.pts;
            if (!pts)
                return;

            var n = pts.length;
            if (n < 6)
                return;

            ctx.lineCap = 'square';
            // ctx.lineJoin = 'square';

            if (this === layer.__hot)
            {
                ctx.shadowColor = "rgba(0,0,0,0.25)";
                ctx.shadowBlur = ctx.shadowOffsetX = ctx.shadowOffsetY = 5;
                offsetX -= 1;
                offsetY -= 1;
            }

            ctx.beginPath();
            ctx.moveTo(pts[0] * scale + offsetX, pts[1] * scale + offsetY);
            for (var i = 2; i < n; i += 2)
            {
                ctx.lineTo(pts[i] * scale + offsetX, pts[i + 1] * scale + offsetY);
            }
            ctx.lineWidth = this.lineWidth;
            ctx.strokeStyle = layer.GetItemColor(this, this.strokeStyle || layer.strokeStyle || 'gray');
            if (layer.IsSelected(this))
            {
                ctx.lineWidth += 3;
                ctx.strokeStyle = MyCommon.mixColor(ctx.strokeStyle, 'black', 0.6);
            }
            ctx.stroke();

            if (this === layer.__hot)
            {
                ctx.shadowBlur = 0;
                ctx.shadowColor = "rgba(0, 0, 0, 0)";
            }

            var lw = this.lineWidth - 1, left = clipBox.left - lw, top = clipBox.top - lw, right = clipBox.right + lw, bottom = clipBox.bottom + lw;

            ctx.lineWidth = lw;
            ctx.strokeStyle = 'rgb(243,240,232)';

            var x1 = pts[0] * scale + offsetX, y1 = pts[1] * scale + offsetY, x2, y2, dx, dy, dl, len = 0;
            var x3, y3, x4, y4, x5, y5, x6, y6, dotLen = this.lineWidth * 2, repLen = (dotLen + lw) * 2;
            for (var i = 2, j, k, a, b; i < n; x1 = x2, y1 = y2)
            {
                x2 = pts[i++] * scale + offsetX;
                y2 = pts[i++] * scale + offsetY;
                if (x1 == x2 && y1 == y2)
                    continue;

                dx = x2 - x1; dy = y2 - y1;
                dl = Math.sqrt(dx * dx + dy * dy);
                len += dl;

                j = 0;
                x3 = x1; y3 = y1;
                x4 = x2; y4 = y2;
                do
                {
                    x6 = x3; y6 = y3;
                    if (x3 < left)
                    {
                        if (x4 < left)
                            break;

                        y6 = (left - x3) * dy / dx + y3;
                        if (y6 < top)
                        {
                            x6 = (top - y3) * dx / dy + x3;
                            if (x6 < left || x6 > right)
                                break;
                            y6 = top;
                        }
                        else if (y6 > bottom)
                        {
                            x6 = (bottom - y3) * dx / dy + x3;
                            if (x6 < left || x6 > right)
                                break;
                            y6 = bottom;
                        }
                        else
                            x6 = left;

                        if (x6 < x3 || x6 > x4)
                            break;
                    }
                    else if (x3 > right)
                    {
                        if (x4 > right)
                            break;

                        y6 = (right - x3) * dy / dx + y3;
                        if (y6 < top)
                        {
                            x6 = (top - y3) * dx / dy + x3;
                            if (x6 < left || x6 > right)
                                break;
                            y6 = top;
                        }
                        else if (y6 > bottom)
                        {
                            x6 = (bottom - y3) * dx / dy + x3;
                            if (x6 < left || x6 > right)
                                break;
                            y6 = bottom;
                        }
                        else
                            x6 = right;

                        if (x6 < x4 || x6 > x3)
                            break;
                    }
                    else if (y3 < top)
                    {
                        if (y4 < top)
                            break;

                        x6 = (top - y3) * dx / dy + x3;
                        if (x6 < left)
                        {
                            y6 = (left - x3) * dy / dx + y3;
                            if (y6 < top || y6 > bottom)
                                break;
                            x6 = left;
                        }
                        else if (x6 > right)
                        {
                            y6 = (right - x3) * dy / dx + y3;
                            if (y6 < top || y6 > bottom)
                                break;
                            x6 = right;
                        }
                        else
                            y6 = top;
                        if (y6 < y3 || y6 > y4)
                            break;
                    }
                    else if (y3 > bottom)
                    {
                        if (y4 > bottom)
                            break;

                        x6 = (bottom - y3) * dx / dy + x3;
                        if (x6 < left)
                        {
                            y6 = (left - x3) * dy / dx + y3;
                            if (y6 < top || y6 > bottom)
                                break;
                            x6 = left;
                        }
                        else if (x6 > right)
                        {
                            y6 = (right - x3) * dy / dx + y3;
                            if (y6 < top || y6 > bottom)
                                break;
                            x6 = right;
                        }
                        else
                            y6 = bottom;
                        if (y6 < y4 || y6 > y3)
                            break;
                    }

                    if (++j > 1)
                        break;

                    x3 = x2; y3 = y2;
                    x4 = x1; y4 = y1;
                    x5 = x6; y5 = y6;
                } while (true);

                if (j < 2)
                    continue;

                a = len - Math.sqrt((x5 - x2) * (x5 - x2) + (y5 - y2) * (y5 - y2));
                b = len - Math.sqrt((x6 - x2) * (x6 - x2) + (y6 - y2) * (y6 - y2));

                j = Math.floor(a / repLen) * repLen;
                k = j + dotLen;
                if (k < a)
                {
                    k += repLen;
                    j += repLen;
                }
                else if (j < a)
                    j = a;

                while (k < b)
                {
                    x3 = x5 + dx * (j - a) / dl; y3 = y5 + dy * (j - a) / dl;
                    x4 = x5 + dx * (k - a) / dl; y4 = y5 + dy * (k - a) / dl;

                    ctx.beginPath();
                    ctx.moveTo(x3, y3);
                    ctx.lineTo(x4, y4);
                    ctx.stroke();

                    k += repLen;
                    j = k - dotLen;
                }

                if (j < b)
                {
                    k = b;
                    x3 = x5 + dx * (j - a) / dl; y3 = y5 + dy * (j - a) / dl;
                    x4 = x5 + dx * (k - a) / dl; y4 = y5 + dy * (k - a) / dl;

                    ctx.beginPath();
                    ctx.moveTo(x3, y3);
                    ctx.lineTo(x4, y4);
                    ctx.stroke();
                }
            }
        }
    });
});

Ext.define('MyApp.map.SceneLayer', {
    extend: 'MyApp.map.Layer',
    alias: 'widget.SceneLayer',
    zIndex: -1000,
    uri: '/web/jss/map.jss?action=map.GetScene',
    constructor: function ()
    {
        Object.defineProperties(this, {
            items: { value: [] }
        });

        this.callParent(arguments);
    },
    OnDestroy: function ()
    {
        this.items.length = 0;
        this.callParent(arguments);
    },
    OnBeforeLoad: function (options)
    {
        this.callParent(arguments);
        if (options.params)
            options.params.args = Ext.applyIf(options.params.args, { tile_level: this.tile.TargetLeve });
    },
    CreateItem: function (item)
    {
        var T = Ext.ClassManager.getByAlias('scene.' + item.type);
        if (T)
            return new T(item);
        else
            Ext.log('不支持的场景：' + item.type);
    },
    OnLoad: function (result, error)
    {
        if (error)
            throw error;

        this.__hot = undefined;

        var items = this.items;
        items.length = 0;

        for (var i = 0, n = result.length, it, T; i < n; i++)
        {
            it = this.CreateItem(result[i]);
            if (it)
                items.push(it);
        }

        this.Invalidate();
    },
    GetItemColor: function (item, defClr)
    {
        var k = this.kpi;
        return k instanceof MyApp.map.kpi ? (k.GetKPIColor(item) || defClr) : defClr;
    },
    IsSceneVisible: function (item)
    {
        return !!item;
    },
    DrawScene: function (ctx, item, clipBox, scale, offsetX, offsetY)
    {
        if (this.IsSceneVisible(item))
            item.Draw(ctx, clipBox, scale, offsetX, offsetY, this);
    },
    OnDraw: function (ctx)
    {
        var items = this.items, n = items.length;
        if (!n)
            return;

        var clipBox = this.canvas.clipBox;
        var tile = this.tile, scale = tile.canvasWidth / tile.ViewportW;
        var offsetX = -scale * tile.ViewportX, offsetY = -scale * tile.ViewportY;

        for (var i = 0, it, border; i < n; i++)
        {
            it = items[i];

            border = Math.ceil((it.lineWidth || 1) / 2 + 0.5);
            if (clipBox.IsIntersect(it.left * scale + offsetX - border, it.top * scale + offsetY - border, it.width * scale + border + border, it.height * scale + border + border))
                this.DrawScene(ctx, it, clipBox, scale, offsetX, offsetY);
        }
    },
    PtInScene: function (it, cx, cy, scale, offsetX, offsetY)
    {
        var border = Math.ceil((it.lineWidth || 1) / 2 + 0.5);
        if (cx < it.left * scale + offsetX - border || cx > it.right * scale + offsetX + border || cy < it.top * scale + offsetY - border || cy > it.bottom * scale + offsetY + border)
            return false;

        return this.IsSceneVisible(it) && it.PtInScene(cx, cy, scale, offsetX, offsetY, this);
    },
    HitTest: function (cx, cy, e)
    {
        var tile = this.tile, scale = tile.canvasWidth / tile.ViewportW;
        var offsetX = -scale * tile.ViewportX, offsetY = -scale * tile.ViewportY;

        var it = this.__hot;
        do
        {
            if (it && this.PtInScene(it, cx, cy, scale, offsetX, offsetY))
                break;

            var items = this.items, i = items.length;
            while (i-- > 0)
            {
                it = items[i];
                if (this.PtInScene(it, cx, cy, scale, offsetX, offsetY))
                    break;
            }

            if (i < 0)
                it = undefined;
        } while (false);

        if (e)
        {
            if (this.__hot !== it)
            {
                this.__hot = it;
                this.Invalidate();
            }
        }

        return it;
    },
    GetCursor: function (e)
    {
        return this.__hot ? 'pointer' : undefined;
    },
    SelectItem: function (item, append, e)
    {
        var sel;
        if (item instanceof MyApp.map.Scene)
        {
            if (item instanceof MyApp.map.Railway && !this.IsSelected(item) && item.gname)
                sel = item.gname;
            else
                sel = item.name;
        }
        if (this.__sel == sel)
            return;

        this.__sel = sel;
        this.Invalidate();
    },
    IsSelected: function (item)
    {
        return item && (item.name == this.__sel || (item.gname && item.gname == this.__sel));
    }
});