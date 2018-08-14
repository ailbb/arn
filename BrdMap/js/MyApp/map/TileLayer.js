Ext.define('MyApp.map.TileLayer', {
    extend: 'MyApp.util.Canvas',
    alias: 'widget.TileLayer',
    TileSize: 256,
    MinZoomLevel: 11,
    MaxZoomLevel: 17,
    ZoomLevel: 12,
    ViewportX: 0.814478132459852,
    ViewportY: 0.433805008540921,
    ViewportW: 1 / Math.pow(2, 12),
    UseSprings: false,
    onDestroy: function ()
    {
        this.callParent(arguments);
        this.tiles = null;
        delete this.__ja;
    },
    initComponent: function ()
    {
        this.callParent(arguments);

        var __vx = Number(this.ViewportX), __vy = Number(this.ViewportY), __vw = Number(this.ViewportW), level = Number(this.ZoomLevel);
        var __tx = __vx, __ty = __vy, __tw = __vw, __bound = new MyApp.util.Rect(), __dirty = false;
        Object.defineProperties(this, {
            tiles: { value: [], writable: true },
            ViewportX: {
                get: function () { return __vx; },
                set: function (v)
                {
                    if (__vx != v)
                    {
                        __vx = v;
                        this.DoViewportChanged();
                    }
                }
            },
            ViewportY: {
                get: function () { return __vy; },
                set: function (v)
                {
                    if (__vy != v)
                    {
                        __vy = v;
                        this.DoViewportChanged();
                    }
                }
            },
            ViewportW: {
                get: function () { return __vw; },
                set: function (v)
                {
                    if (__vw != v)
                    {
                        __vw = v;
                        this.DoViewportChanged();
                    }
                }
            },
            TargetX: {
                get: function () { return __tx; },
                set: function (v)
                {
                    if (__tx != v)
                    {
                        __tx = v;
                        this.dirty = true;
                    }
                }
            },
            TargetY: {
                get: function () { return __ty; },
                set: function (v)
                {
                    if (__ty != v)
                    {
                        __ty = v;
                        this.dirty = true;
                    }
                }
            },
            TargetW: {
                get: function () { return __tw; },
                set: function (v)
                {
                    if (__tw != v)
                    {
                        __tw = v;
                        this.dirty = true;
                    }
                }
            },
            MotionFinished: { get: function () { return __vx == __tx && __vy == __ty && __vw == __tw; } },
            Bound: { get: function () { return __bound; } },
            dirty: {
                get: function () { return __dirty; },
                set: function (v)
                {
                    if (__dirty == v)
                        return;

                    __dirty = v;

                    if (__dirty)
                        this.DelayAdjustViewport();
                    else
                    {
                        if (__tw < 1)
                            __tx = Math.max(Math.min(__tx, 1 - __tw + __tw / 2), -__tw / 2);
                        else
                            __tx = Math.min(Math.max(__tx, 1 - __tw - 0.5), 0.5);

                        var h = __tw * this.canvasHeight / this.canvasWidth;
                        if (h < 1)
                            __ty = Math.max(Math.min(__ty, 1 - h + h / 2), -h / 2);
                        else
                            __ty = Math.min(Math.max(__ty, 1 - h - 0.5), 0.5);

                        if (!__bound.isEmpty)
                        {
                            var bw = Math.max(__bound.w, __bound.h * this.canvasWidth / this.canvasHeight);
                            if (__tw > bw)
                            {
                                bw = Math.floor(Math.log(this.canvasWidth / this.TileSize / bw) / Math.log(2));
                                bw = Math.min(Math.max(bw, this.MinZoomLevel), this.MaxZoomLevel);
                                __tw = bw = this.canvasWidth / this.TileSize / Math.pow(2, bw);
                                h = __tw * this.canvasHeight / this.canvasWidth;
                            }

                            var x = __bound.x + __bound.w / 2 - bw / 2;
                            if (__tx < x)
                                __tx = x;
                            else
                            {
                                x += bw - __tw;
                                if (__tx > x)
                                    __tx = x;
                            }

                            var bh = bw * this.canvasHeight / this.canvasWidth;
                            var y = __bound.y + __bound.h / 2 - bh / 2;
                            if (__ty < y)
                                __ty = y;
                            else
                            {
                                y += bh - h;
                                if (__ty > y)
                                    __ty = y;
                            }
                        }

                        if (this.UseSprings || __vw != __tw)
                        {
                            if (this.__ja)
                                this.__ja.stop(true, false);
                            else
                                this.__ja = $(this);

                            this.__ja.animate({ ViewportX: __tx, ViewportY: __ty, ViewportW: __tw }, 'fast', __vw == __tw ? 'linear' : 'swing');
                        }
                        else
                        {
                            __vx = __tx;
                            __vy = __ty;
                            __vw = __tw;
                            this.DoViewportChanged();
                        }
                    }
                }
            },
            TotalSize: { get: function () { return this.canvasWidth / this.ViewportW; } },
            ZoomLevel: {
                get: function () { return Math.log(this.canvasWidth / this.ViewportW / this.TileSize) / Math.log(2); },
                set: function (v)
                {
                    v = Math.min(Math.max(v, this.MinZoomLevel), this.MaxZoomLevel);
                    if (this.ZoomLevel == v)
                        return;

                    var w = this.canvasWidth / this.TileSize / Math.pow(2, v), dx = (this.ViewportW - w) / 2;
                    this.ViewportX += dx;
                    this.ViewportY += dx * this.canvasHeight / this.canvasWidth;
                    this.ViewportW = w;
                }
            },
            TargetLevel: {
                get: function () { return Math.log(this.canvasWidth / this.TargetW / this.TileSize) / Math.log(2); },
                set: function (v) { this.ZoomOnPixelPoint(this.canvasWidth / 2, this.canvasHeight / 2, v); }
            }
        });

        if (Ext.isNumber(level))
            this.ZoomLevel = level;
    },
    onResize: function (width, height, oldWidth, oldHeight)
    {
        var level = this.TargetLevel;
        var x = this.TargetX + this.TargetW / 2, y = this.TargetY + this.TargetW / 2 * this.canvasHeight / this.canvasWidth;

        this.callParent(arguments);

        if (level >= this.MinZoomLevel && level <= this.MaxZoomLevel)
            this.SetViewCenter(x, y, level);
    },
    AdjustViewport: function ()
    {
        this.dirty = false;
    },
    DelayAdjustViewport: function ()
    {
        setTimeout(Ext.pass(this.AdjustViewport, undefined, this), 0);
    },
    DoViewportChanged: function ()
    {
        if (this.__vChanged)
            return;

        this.__vChanged = true;
        setTimeout(Ext.pass(this.FireViewportChanged, undefined, this), 0);
    },
    FireViewportChanged: function ()
    {
        this.__vChanged = false;
        this.OnViewportChanged(this.MotionFinished);
    },
    CreateTile: function ()
    {
        var img = new Image();
        var tile = { img: img };
        img.onload = Ext.pass(this.tile_load, [tile], this);
        img.onerror = Ext.pass(this.tile_error, [tile], this);
        return tile;
    },
    tile_load: function (tile)
    {
        if (tile.z < 0)
            return;

        tile.loaded = true;
        tile.rc = Math.pow(2, tile.z - tile.k); // 行列数
        tile.lx = (tile.x >> tile.k) / tile.rc; // 逻辑x
        tile.ly = (tile.y >> tile.k) / tile.rc; // 逻辑y

        var size = this.canvasWidth / this.ViewportW, wh = size / tile.rc;
        this.InvalidateRect((tile.lx - this.ViewportX) * size, (tile.ly - this.ViewportY) * size, wh, wh);
    },
    tile_error: function (tile, e)
    {
        if (tile.z > tile.k)
        {
            tile.k++;
            tile.img.src = this.GetTileURL(tile.z - tile.k, tile.x >> tile.k, tile.y >> tile.k);
        }
    },
    Format: function (v, n)
    {
        var s = v.toString(), o = '00000000';
        return o.substr(0, n - s.length) + s;
    },
    GetTileURL: function (level, x, y)
    {
        return 'http://www.google.cn/maps/vt?gl=cn&x=' + x + '&y=' + y + '&z=' + level; // + '&lyrs=s@167'
        // return 'http://192.168.6.27:8080/lte_v1/mapController.do?method=getMap&service=db&type=street&zoom=' + this.Format(level + 1, 2) + '&name=' + this.Format(y + 1, 8) + this.Format(x + 1, 8);
    },
    SetTileSource: function (src)
    {
        var fn;
        if (typeof src === 'string')
            fn = function (level, x, y) { return Ext.String.format(src, level, x, y) };
        else if (typeof src === 'function')
            fn = src;

        if (fn)
            this.GetTileURL = fn;

        if (this.tiles)
        {
            this.tiles.length = 0;
            this.__last_vp = undefined;
            this.FireViewportChanged();
        }
    },
    GetUsableTile: function (cx, cy, cw, ch)
    {
        var size = this.canvasWidth / this.ViewportW, dx = size * this.ViewportX, dy = size * this.ViewportY;
        var level = Math.min(Math.max(Math.round(Math.log(size / this.TileSize) / Math.log(2)), this.MinZoomLevel), this.MaxZoomLevel);
        var rc = Math.pow(2, level); // 行(列)数

        var tiles = this.tiles, tile, arTile = [];
        for (var i = tiles.length; i-- > 0; )
        {
            tile = tiles[i];
            if (!tile.loaded)
                continue;

            tile.ox = size * tile.lx - dx;
            tile.oy = size * tile.ly - dy;
            tile.size = size / tile.rc;

            tile.px = Math.max(tile.ox, cx);
            tile.py = Math.max(tile.oy, cy);
            tile.pw = Math.min(tile.ox + tile.size, cx + cw) - tile.px;
            tile.ph = Math.min(tile.oy + tile.size, cy + ch) - tile.py;

            if (tile.pw > 0.1 && tile.ph > 0.1)
            {
                tile.area = tile.pw * tile.ph;
                arTile.push(tile);
            }
        }

        arTile.sort(function (a, b) { return a.rc - b.rc; });

        for (var i = arTile.length, j, t, w, h; i-- > 0; )
        {
            tile = arTile[i];
            if (tile.area <= 0.01)
            {
                arTile.splice(i, 1);
                continue;
            }

            for (j = i; j-- > 0; )
            {
                t = arTile[j];
                if (t.area <= 0.1)
                    continue;

                w = Math.min(tile.px + tile.pw, t.px + t.pw) - Math.max(tile.px, t.px);
                if (w <= 0.1)
                    continue;
                h = Math.min(tile.py + tile.ph, t.py + t.ph) - Math.max(tile.py, t.py);
                if (h <= 0.1)
                    continue;

                if (t.rc >= rc)
                {
                    arTile.splice(i, 1);
                    break;
                }
                else if (rc - t.rc < tile.rc - rc)
                {
                    arTile.splice(i, 1);
                    break;
                }
                else
                    t.area -= w * h;
            }
        }

        return arTile;
    },
    OnViewportChanged: function (bFinally)
    {
        if (bFinally)
        {
            var cw = this.canvasWidth, ch = this.canvasHeight, size = cw / this.ViewportW, dx = size * this.ViewportX, dy = size * this.ViewportY;
            var level = Math.min(Math.max(Math.round(Math.log(size / this.TileSize) / Math.log(2)), this.MinZoomLevel), this.MaxZoomLevel);

            var rc = Math.pow(2, level); // 行(列)数
            var bx = Math.min(Math.max(Math.floor(rc * dx / size), 0), rc), ex = Math.min(Math.max(Math.ceil(rc * (dx + cw) / size), 0), rc); // 视口映射到的开始结束列
            var by = Math.min(Math.max(Math.floor(rc * dy / size), 0), rc), ey = Math.min(Math.max(Math.ceil(rc * (dy + ch) / size), 0), rc); // 视口映射到的开始结束行

            var nc = ex - bx, vp = ((bx * rc + by) * 16 + nc) * 16 + (ey - by);
            if (this.__last_vp != vp)
            {
                this.__last_vp = vp;

                var arTile = this.GetUsableTile(0, 0, cw, ch);
                for (var i = arTile.length; i-- > 0; )
                {
                    arTile[i].ref = true;
                }
                arTile.length = 0; // 清空，以下用于行列tile映射

                var tiles = this.tiles, tile, freeTile;
                for (var i = tiles.length; i-- > 0; )
                {
                    tile = tiles[i];

                    if (tile.z == level && tile.x >= bx && tile.x < ex && tile.y >= by && tile.y < ey)
                    {
                        arTile[(tile.y - by) * nc + (tile.x - bx)] = tile;
                        tile.ref = false; // 还原
                        continue;
                    }

                    if (tile.ref)
                    {
                        tile.ref = false; // 还原
                        continue;
                    }

                    tile.next = freeTile;
                    freeTile = tile;
                    tiles[i] = tiles[tiles.length - 1];
                    tiles.length--;
                }

                for (var x, y = by, i = 0; y < ey; y++)
                {
                    for (x = bx; x < ex; x++)
                    {
                        tile = arTile[i++];
                        if (tile)
                            continue;

                        if (freeTile)
                        {
                            tile = freeTile;
                            freeTile = tile.next;
                            delete tile.next;
                        }
                        else
                            tile = this.CreateTile();

                        tiles.push(tile);

                        tile.k = 0;
                        tile.x = x;
                        tile.y = y;
                        tile.z = level;
                        tile.loaded = false;
                        tile.img.src = this.GetTileURL(level, x, y);
                    }
                }
            }
        }

        this.Invalidate();
    },
    OnDraw: function (ctx)
    {
        var cb = this.clipBox;
        ctx.clearRect(cb.x, cb.y, cb.w, cb.h);

        var arTile = this.GetUsableTile(cb.x, cb.y, cb.w, cb.h);
        for (var i = 0, n = arTile.length, tile, TileSize = this.TileSize, x, y, w, h, size; i < n; i++)
        {
            tile = arTile[i];
            x = Math.floor(tile.px); y = Math.floor(tile.py); w = Math.ceil(tile.pw); h = Math.ceil(tile.ph); size = tile.size;
            ctx.clearRect(x, y, w, h);
            ctx.drawImage(tile.img, TileSize * (tile.px - tile.ox) / size, TileSize * (tile.py - tile.oy) / size,
                TileSize * tile.pw / size, TileSize * tile.ph / size, x, y, w, h);
        }
    },
    Pan: function (deltaX, deltaY)
    {
        this.TargetX += deltaX * this.TargetW;
        this.TargetY += deltaY * this.TargetW * this.canvasHeight / this.canvasWidth;
    },
    ZoomIn: function ()
    {
        this.TargetLevel = this.TargetLevel + 1;
    },
    ZoomOut: function ()
    {
        this.TargetLevel = this.TargetLevel - 1;
    },
    ZoomOnPixelPoint: function (x, y, z)
    {
        z = Math.min(Math.max(z, this.MinZoomLevel), this.MaxZoomLevel);
        if (this.TargetLevel == z)
            return;

        var w = this.canvasWidth / this.TileSize / Math.pow(2, z);
        this.TargetX += this.TargetW * x / this.canvasWidth - w * x / this.canvasWidth;
        this.TargetY += this.TargetW * y / this.canvasWidth - w * y / this.canvasWidth;
        this.TargetW = w;
    },
    GetViewCenter: function ()
    {
        return [this.TargetX + this.TargetW / 2, this.TargetY + this.TargetW / 2 * this.canvasHeight / this.canvasWidth, this.TargetLevel];
    },
    SetViewCenter: function (x, y, level)
    {
        level = level ? Math.min(Math.max(level, this.MinZoomLevel), this.MaxZoomLevel) : this.TargetLevel;
        var w = this.canvasWidth / this.TileSize / Math.pow(2.0, level);
        this.TargetX = x - w / 2;
        this.TargetY = y - w * this.canvasHeight / this.canvasWidth / 2;
        this.TargetW = w;
    }
});
