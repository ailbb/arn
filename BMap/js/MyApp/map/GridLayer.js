Ext.define('MyApp.map.GridElement', {
    extend: 'MyApp.map.Element',
    alternateClassName: 'MyMapGrid',
    statics: {
        //   t 2 _____________ 3
        //      /            /|
        //     /            / |
        //  1 /__________0 /  |
        //   |            |   |
        //   |            |   | 4
        // m |            |  /
        //   |            | /
        // 6 |____________|/ 5

        pattern: new function ()
        {
            var x0, x1, x2, x3, y0, y1, y2, y3, vx = [], vy = [];

            this.SetPos = function (x, y, w, h, th)
            {
                x0 = Math.floor(x - 0.5 * th * w) + 0.5;
                x1 = Math.floor(x) + 0.5;
                x2 = Math.floor(x + (1 - 0.5 * th) * w) + 0.5;
                x3 = Math.floor(x + w) + 0.5;

                y0 = Math.floor(y) + 0.5;
                y1 = Math.floor(y + (0.5 * th) * h) + 0.5;
                y2 = Math.floor(y + h) + 0.5;
                y3 = Math.floor(y + (1 + 0.5 * th) * h) + 0.5;
            };
            this.GetBound = function () { return [Math.floor(x0), Math.floor(y0), Math.round(x3 - Math.floor(x0)), Math.round(y3 - Math.floor(y0))] };
            this.Draw = function (ctx)
            {
                if (x0 < x1)
                {
                    ctx.beginPath();
                    ctx.moveTo(x2, y1); ctx.lineTo(x0, y1); ctx.lineTo(x1, y0); ctx.lineTo(x3, y0);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(x2, y1); ctx.lineTo(x3, y0); ctx.lineTo(x3, y2); ctx.lineTo(x2, y3);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }

                ctx.beginPath();
                ctx.moveTo(x2, y1); ctx.lineTo(x2, y3); ctx.lineTo(x0, y3); ctx.lineTo(x0, y1);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            };
            this.PtInGrid = function (x, y)
            {
                if (x0 < x1)
                {
                    vx[0] = x1; vy[0] = y0; // 2
                    vx[1] = x3; vy[1] = y0; // 3
                    vx[2] = x3; vy[2] = y2; // 4
                    vx[3] = x2; vy[3] = y3; // 5
                    vx[4] = x0; vy[4] = y3; // 6
                    vx[5] = x0; vy[5] = y1; // 1
                    vx[6] = x1; vy[6] = y0; // 2

                    return MyMapBase.PtInPolygon(x, y, vx, vy, 0, 7, true);
                }

                return x >= x1 && x < x3 && y >= y0 && y < y2;
            }

            return this;
        }
    },
    constructor: function (x, y)
    {
        this.x = x;
        this.y = y;
    },
    GetTip: function ()
    {
        return this.x + ',' + this.y;
    }
});

//////////////////////////////////////////////////////////////////////////
Ext.define('MyApp.map.GridLayer', {
    extend: 'MyApp.map.Layer',
    alias: 'widget.grid_layer',
    requires: ['MyApp.util.Task'],
    zIndex: -999,
    longitude: 113.31444,
    latitude: 23.12062,
    GridWidth: 100,
    GridHeight: 100,
    Fill: 'rgba(255,0,255,0.5)',
    Stroke: 'rgba(128,0,128,0.6)',
    constructor: function ()
    {
        var __data;
        Object.defineProperties(this, {
            task: { value: new MyApp.util.Task() },
            ViewBound: {
                get: function ()
                {
                    var tile = this.tile;
                    var p1 = MyMapBase.LogicalToGeographic({ x: tile.ViewportX, y: tile.ViewportY });
                    var p2 = MyMapBase.LogicalToGeographic({ x: tile.ViewportX + tile.ViewportW, y: tile.ViewportY + tile.ViewportW * tile.canvasHeight / tile.canvasWidth });

                    var d = MyMapBase.getGeoDistance(this.longitude, p1.latitude, p1.longitude, p1.latitude);
                    var minX = Math.floor((p1.longitude < this.longitude ? -d : d) / this.GridWidth);

                    d = MyMapBase.getGeoDistance(p2.longitude, this.latitude, p2.longitude, p2.latitude);
                    var minY = Math.floor((p2.latitude < this.latitude ? -d : d) / this.GridHeight);

                    d = MyMapBase.getGeoDistance(this.longitude, p2.latitude, p2.longitude, p2.latitude);
                    var maxX = Math.ceil((p2.longitude < this.longitude ? -d : d) / this.GridWidth);

                    d = MyMapBase.getGeoDistance(p1.longitude, this.latitude, p1.longitude, p1.latitude);
                    var maxY = Math.ceil((p1.latitude < this.latitude ? -d : d) / this.GridHeight);

                    return [minX, minY, maxX, maxY];
                }
            },
            data: {
                get: function () { return __data; },
                set: function (v)
                {
                    if (__data === v)
                        return;

                    __data = v;
                    this.grid.length = 0;
                    this.SetModify();
                }
            },
            grid: { value: [], configurable: true },
            HIDE_CELL_DATA: { value: 0x80000000 },
            mapCellFlags: { value: {} }
        });

        this.callParent(arguments);
    },
    OnDestroy: function ()
    {
        this.task.Stop();

        delete this.grid;

        this.callParent(arguments);
    },
    Load: function (uri, args)
    {
        if (uri.substr(0, APPBASE.length) != APPBASE)
            uri = APPBASE + uri;

        this.task.Clear();
        this.task.Add(this.__Load, this, uri, args);
    },
    __Load: function (uri, args)
    {
        this.__load_count = (this.__load_count || 0) + 1;
        var fn = this.task.pass(this.OnResponseGrid, this, this.__load_count);
        Ext.Ajax.request({ url: uri,
            method: "POST",
            params: args,
            success: fn,
            failure: fn
        });
    },
    OnResponseGrid: function (lc, resp, c)
    {
        if (this.__load_count != lc)
            return;

        if (resp.status != 200)
            throw '网络异常(' + resp.status + '): ' + resp.statusText;

        var data = Ext.decode(resp.responseText);
        if ('error' in data)
            throw data.error;

        this.data = data;
    },
    __BuildGrid: function ()
    {
        var grid = this.grid, mapCol = this.__mapCol, data = this.data;
        grid.length = 0;
        if (mapCol)
        {
            for (var i in mapCol)
            {
                delete mapCol[i];
            }
        }
        else
            this.__mapCol = mapCol = {};

        if (Ext.isEmpty(data))
            return;

        var hr = data[0];
        for (var i = hr.length, it; i-- > 0; )
        {
            it = hr[i];
            if (Ext.isObject(it))
                it = it.Name;

            if (Ext.isString(it))
                mapCol[it.toLowerCase()] = i;
        }

        var ix = mapCol['gridx'];
        if (ix == undefined)
            return;
        var iy = mapCol['gridy'];
        if (iy === undefined)
            return;

        data.sort(function (a, b)
        {
            if (a === hr)
                return b === hr ? 0 : -1;
            else if (b === hr)
                return 1;

            return (a[ix] - b[ix]) || (a[iy] - b[iy]);
        });

        var n = data.length;
        for (var i = 1, r, x, y, g; i < n; )
        {
            r = data[i];
            x = r[ix]; y = r[iy];
            g = new MyMapGrid(x, y);
            g.first = i;
            for (i++; i < n; i++)
            {
                r = data[i];
                if (r[ix] != x || r[iy] != y)
                    break;
            }
            g.last = i;
            grid.push(g);
        }
    },
    DoModify: function ()
    {
        if (!this.__modify)
            return;

        this.__modify = 0;

        if (Ext.isEmpty(this.data))
            return;

        if (!this.grid.length)
            this.task.Add(this.__BuildGrid, this);

        this.task.Add(this.Invalidate, this);
    },
    SetModify: function (b)
    {
        if (b == false)
            this.__modify = 0;
        else
        {
            if (this.__modify)
                this.__modify++;
            else
            {
                this.__modify = 1;
                this.task.Add(this.DoModify, this);
            }
        }
    },
    OnCellChanged: function (cgi)
    {
    },
    IsShowCell: function (cgi) { return this.mapCellFlags[cgi] & this.HIDE_CELL_DATA == 0; },
    ShowCell: function (cgi, bShow)
    {
        var flags = this.mapCellFlags[cgi];
        if (bShow)
        {
            if (flags & this.HIDE_CELL_DATA == 0)
                return;

            flags &= ~this.HIDE_CELL_DATA;
            if (flags == 0)
                this.OnCellChanged(cgi);

            this.mapCellFlags[cgi] = flags;
        }
        else if (flags & this.HIDE_CELL_DATA == 0)
        {
            if (flags)
                this.mapCellFlags[cgi] = flags | this.HIDE_CELL_DATA;
            else
            {
                this.mapCellFlags[cgi] = this.HIDE_CELL_DATA;
                this.OnCellChanged(cgi);
            }
        }
    },
    IsShowNCell: function (cgi) { return !this.mapCellFlags['N_' + cgi]; },
    ShowNCell: function (cgi, bShow)
    {
        var k = 'N_' + cgi;
        if (bShow)
        {
            if (!(k in this.mapCellFlags))
                return;

            delete this.mapCellFlags[k];
        }
        else
        {
            if (k in this.mapCellFlags)
                return;

            this.mapCellFlags[k] = true;
        }

        // if (__jtNCell == null)
        // {
        //     object t = Map.FireEvent("GetTable", Map.GetConfig("邻区表", "cfg_ncell"));
        //     if (!JsonTable.TryParse(t, out __jtNCell))
        //         return;
        // }
        // 
        // int iCell = __jtNCell.FindCol("CGI");
        // if (iCell < 0)
        //     return;
        // 
        // int iNCell = __jtNCell.FindCol("NCGI");
        // if (iNCell < 0)
        //     return;
        // 
        // int ir = __jtNCell.FindRow("CGI", cgi);
        // if (ir < 0)
        //     return;
        // 
        // for (i = ir; i-- > 0; )
        // {
        //     if (util.ChangeType(__jtNCell.GetValue(i, iCell), string.Empty) != cgi)
        //         break;
        // }
        // 
        // int n = __jtNCell.RowCount;
        // String ncgi;
        // uint flags;
        // for (i++; i <= ir || (i < n && util.ChangeType(__jtNCell.GetValue(i, iCell), string.Empty) == cgi); i++)
        // {
        //     ncgi = util.ChangeType(__jtNCell.GetValue(i, iNCell), string.Empty);
        //     if (bShow)
        //     {
        //         if (!__dicCellFlags.TryGetValue(ncgi, out flags))
        //             continue;
        // 
        //         if ((--flags) == 0)
        //         {
        //             __dicCellFlags.Remove(ncgi);
        //             AddChangedCell(ncgi);
        //         }
        //         else
        //             __dicCellFlags[ncgi] = flags;
        //     }
        //     else
        //     {
        //         if (__dicCellFlags.TryGetValue(ncgi, out flags))
        //             __dicCellFlags[ncgi] = flags + 1;
        //         else
        //         {
        //             __dicCellFlags.Add(ncgi, 1);
        //             AddChangedCell(ncgi);
        //         }
        //     }
        // }
    },
    OnDraw: function (ctx)
    {
        var grid = this.grid, n = grid.length;
        if (!n)
            return;

        var tile = this.tile;
        var scale = tile.canvasWidth / tile.ViewportW, dx = tile.ViewportX * scale, dy = tile.ViewportY * scale;

        var pt = MyMapBase.GeographicToLogical({ longitude: this.longitude, latitude: this.latitude });

        this.__offset_x = dx = pt.x * scale - dx;
        this.__offset_y = dy = pt.y * scale - dy;

        var a = MyMapBase.GeoOffset(this.longitude, this.latitude, this.GridWidth, this.GridHeight);
        var pt2 = MyMapBase.GeographicToLogical({ longitude: a[0], latitude: a[1] });
        var x, y, w = Math.abs(pt2.x - pt.x) * scale, h = Math.abs(pt2.y - pt.y) * scale;

        this.__grid_width = w;
        this.__grid_height = h;

        var cb = this.canvas.clipBox;

        var pat = MyMapGrid.pattern;
        ctx.fillStyle = this.Fill;
        ctx.strokeStyle = this.Stroke;
        for (var i = 0, it; i < n; i++)
        {
            it = grid[i];
            x = dx + it.x * w;
            y = dy - it.y * h;

            pat.SetPos(x, y, w, h, 1);
            if (cb.IsIntersect.apply(cb, pat.GetBound()))
                pat.Draw(ctx);
        }

        if (this.__hot)
        {
            ctx.fillStyle = MyCommon.mixColor(this.Fill, 'black');
            ctx.strokeStyle = MyCommon.mixColor(this.Stroke, 'black');

            x = dx + this.__hot.x * w;
            y = dy - this.__hot.y * h;
            pat.SetPos(x - 2, y - 2, w + 4, h + 4, 1);
            if (cb.IsIntersect.apply(cb, pat.GetBound()))
                pat.Draw(ctx);
        }
    },
    GetCursor: function (e)
    {
        return this.__hot ? 'pointer' : undefined;
    },
    HitTest: function (cx, cy, e)
    {
        var grid = this.grid, n = grid.length;
        if (!n)
            return;

        var x, y, dx = this.__offset_x, dy = this.__offset_y, w = this.__grid_width, h = this.__grid_height;
        var pat = MyMapGrid.pattern, hot = this.__hot;
        if (hot)
        {
            x = dx + hot.x * w;
            y = dy - hot.y * h;
            pat.SetPos(x - 2, y - 2, w + 4, h + 4, 1);
            if (pat.PtInGrid(cx, cy))
                return hot;
        }
        hot = null;
        for (var i = n, it; i-- > 0; )
        {
            it = grid[i];
            x = dx + it.x * w;
            y = dy - it.y * h;
            pat.SetPos(x, y, w, h, 1);
            if (pat.PtInGrid(cx, cy))
            {
                hot = it;
                if (e)
                {
                    pat.SetPos(x - 2, y - 2, w + 4, h + 4, 1);
                    this.InvalidateRect.apply(this, pat.GetBound());
                }
                break;
            }
        }

        if (e && this.__hot !== hot)
        {
            if (this.__hot)
            {
                x = dx + this.__hot.x * w;
                y = dy - this.__hot.y * h;
                pat.SetPos(x - 2, y - 2, w + 4, h + 4, 1);
                this.InvalidateRect.apply(this, pat.GetBound());
            }
            this.__hot = hot;
        }

        return hot;
    }
});
