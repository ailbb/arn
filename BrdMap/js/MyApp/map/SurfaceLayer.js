Ext.define('MyApp.map.SurfacePolygon', {
    extend: 'MyApp.map.Element',
    alternateClassName: 'MyMapSurfacePolygon',
    statics: {
        CreateAccessor: function (iCol, r, w)
        {
        },
        GetImpl: function (hr)
        {
        }
    },
    constructor: function (polyindex)
    {
        this.polyindex = polyindex;
        this.callParent(arguments);
    },
    GetTip: function ()
    {
    }
});

Ext.define('MyApp.map.Surface', {
    extend: 'MyApp.map.Element',
    alternateClassName: 'MyMapSurface',
    statics: {
        GetImpl: function (hr)
        {
            var t = MyMapBase.GetImplByJTH(hr, this, ['x', 'y', 'offset'/*偏移*/, 'offsetDirection'/*偏移方向角*/, 'polygon', 'rownum', 'zIndex', 'fill', 'scale']), proto = t.prototype;

            if (!('direction' in proto))
                Object.defineProperty(proto, 'direction', { value: 0 });

            if (!('angle' in proto))
                Object.defineProperty(proto, 'angle', { value: 360 });

            return t;
        }
    },
    GetTip: function ()
    {
        return Ext.String.htmlEncode(this.surfacename);
    }
});

//////////////////////////////////////////////////////////////////////////
Ext.define('MyApp.map.SurfaceLayer_old', {
    extend: 'MyApp.map.Layer',
    alias: 'widget.surface_layer_old',
    //requires: ['MyApp.util.Task'],
    zIndex: -666,
    uri: '/web/jss/map.jss?action=map.GetSurface',
    minBound: 2000,     // 取最小范围(半径、米)的数据
    maxBound: 40000,    // 取最大范围(半径、米)的数据
    UNIT: Math.pow(2, 20),
    surface_fill: 'rgba(0,128,255,1)',
    surface_scale: 1,
    polygon_stroke: 'rgba(0,128,0,1)',
    constructor: function ()
    {
        var __PolygonVisible = true;
        Object.defineProperties(this, {
            //task: { value: new MyApp.util.Task() },
            surfaces: { value: [] /*天面*/ },
            surfaces_by_order: { value: [] /*天面显示顺序*/ },
            pvx: { value: [] /*多边形x值序列*/ },
            pvy: { value: [] /*多边形y值序列*/ },
            pve: { value: [] /*多边形x,y分组结束索引*/ },
            pbound: { value: [] /*依次记录多边形逻辑位标x, y, w, h*/ },
            PolygonVisible: {
                get: function () { return __PolygonVisible },
                set: function (v)
                {
                    if (__PolygonVisible != v)
                    {
                        __PolygonVisible = v;
                        this.Invalidate();
                    }
                }
            }
        });

        /**********************************************************/
        // 获取颜色集合
        this.__clr = ['rgba(255,0,0,0.6)', 'rgba(249,158,36,0.6)', 'rgba(255,255,0,0.6)', 'rgba(0,255,0,0.6)'];
        /**********************************************************/

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

        delete this.__hot_surface;
        delete this.__hot_pl;

        var table = result.cells;
        var surface_type = MyMapSurface.GetImpl(table[0]), tile = this.tile;
        var unit = this.UNIT, n = table ? table.length - 1 : 0;
        var surfaces = this.surfaces, surfaces_by_order = this.surfaces_by_order, ci, fill = this.surface_fill
        surfaces.length = surfaces_by_order.length = n;
        for (var i = 0; i < n; i++)
        {
            ci = new surface_type(table[i + 1]);
            if (Ext.isEmpty(ci.x))
                MyMapBase.GeographicToLogical(ci);
            ci.x *= unit;
            ci.y *= unit;

            ci.offset = 0;
            ci.direction = ci.offsetDirection = MyMapBase.AngleNormalize(ci.direction);

            ci.rownum = i;
            ci.zIndex = 0;
            ci.fill = fill;
            ci.scale = 1;

            surfaces[i] = ci;
            surfaces_by_order[i] = ci;
        }

        table = result.polygon;
        if (table)
        {
            var mapSurface = {};
            for (var i = n, ci; i-- > 0;)
            {
                ci = surfaces[i];
                mapSurface[ci.id] = ci;
            }

            var pvx = this.pvx, pvy = this.pvy, pve = this.pve, pbound = this.pbound;
            pvx.length = pvy.length = pve.length = pbound.length = 0;

            var polygon_type = MyMapBase.GetImplByJTH(table[0]);
            for (var i = 0, n = table.length - 1, pi = new polygon_type(), its; i < n; i++)
            {
                pi.setData(table[i + 1]);
                its = Ext.isArray(pi.pts) ? pi.pts : Ext.decode(pi.pts);
                for (var j = 0, m = its.length; j < m;)
                {
                    pvx.push(its[j++] * unit);
                    pvy.push(its[j++] * unit);
                }

                its = Ext.isArray(pi.items) ? pi.items : Ext.decode(pi.items);
                for (var j = 0, m = its.length; j < m; j++)
                {
                    mapSurface[its[j]].polygon = i;
                }

                pve.push(pvx.length);
                pbound.push(pi.left * unit, pi.top * unit, pi.width * unit, pi.height * unit);
            }

            var cmp = function (a, b) { return a.polygon - b.polygon; };
            surfaces.sort(cmp);

            var ve = [];
            for (var i = 0, a, b; i < n;)
            {
                a = surfaces[i];
                for (i++; i < n; i++)
                {
                    b = surfaces[i];
                    if (a.polygon != b.polygon)
                        break;
                }

                ve.push(i);
            }
            this.task.Add(this.Invalidate, this);
        }
        else
            this.task.Add(this.__LoadSurface, this, surfaces);

        this.task.Add(this.DoUpdateSurface, this);
    },
    SameSide: function (a1, b1, a2, b2)
    {
        return (a1 == a2 && b1 == b2) || (a1 == b2 && b1 == a2);
    },
    InsertPointToTriangle: function (vx, vy, triangles, index)
    {
        var a, b, c, dx, dy, rr, ii = index, pc, lst = [];
        for (var i = triangles.length - 3, j, k; i >= 0; i -= 3)
        {
            a = triangles[i];
            b = triangles[i + 1];
            c = triangles[i + 2];

            pc = MyMapBase.GetCircumcenter(vx[a], vy[a], vx[b], vy[b], vx[c], vy[c]);
            if (!pc)
                throw ('这个异常不应该出现，出现表示前面的计算有问题！');

            dx = pc.x - vx[a];
            dy = pc.y - vy[a];
            rr = dx * dx + dy * dy;

            dx = pc.x - vx[ii];
            dy = pc.y - vy[ii];
            if (dx * dx + dy * dy > rr)
                continue;

            for (j = 0; j < 3; j++) // 遍历三条边
            {
                a = triangles[i + j];
                b = triangles[i + (j + 1) % 3];
                for (k = lst.length - 2; k >= 0; k -= 2)
                {
                    if (this.SameSide(a, b, lst[k], lst[k + 1]))
                    {
                        lst[k] = lst[lst.length - 2];
                        lst[k + 1] = lst[lst.length - 1];
                        lst.splice(lst.length - 2, 2);
                        break;
                    }
                }

                if (k < 0) // 偱环完了才退出表示未找到公共边
                    lst.push(a, b);
            }

            k = triangles.length - 3;
            triangles[i] = triangles[k++];
            triangles[i + 1] = triangles[k++];
            triangles[i + 2] = triangles[k];
            triangles.length -= 3;
        }

        a = index;
        for (i = lst.length - 2; i >= 0; i -= 2)
        {
            b = lst[i]; c = lst[i + 1];
            j = b; k = c;
            if (MyMapBase.GetCircumcenter(vx[ii], vy[ii], vx[j], vy[j], vx[k], vy[k]))
                triangles.push(a, b, c);
        }
    },
    __BuildPolygon: function (vx, vy, hull, triangles)
    {
        var me = this, unit = me.UNIT;

        var pvx = me.pvx, pvy = me.pvy, pve = me.pve, pbound = me.pbound;
        pvx.length = pvy.length = pve.length = pbound.length = 0;

        var nv = vx.length, nh = hull.length;
        var i, j, k, a, b, c, x, y, dx, dy, n, pps = [], pt, ZERO = MyMapBase.ZERO;
        for (i = nv; i-- > 0;)
        {
            pps[i] = [];
        }

        for (i = 0, n = triangles.length; i < n;)
        {
            a = triangles[i++];
            b = triangles[i++];
            c = triangles[i++];

            pt = MyMapBase.GetCircumcenter(vx[a], vy[a], vx[b], vy[b], vx[c], vy[c]);
            if (!pt)
                throw "这个异常不应该出现，出现表示前面的计算有问题！";

            pps[a].push(pt);
            pps[b].push(pt);
            pps[c].push(pt);
        }

        for (i = 0, a = hull[nh - 1], x = 0, y = 0; i < nh; i++, a = b)
        {
            b = hull[i];
            x += vx[b]; y += vy[b];

            pt = { x: (vx[a] + vx[b]) / 2, y: (vy[a] + vy[b]) / 2 };
            dx = vx[b] - vx[a]; dy = vy[b] - vy[a];
            if (dx > 0)
            {
                pt.x += pt.y * dy / dx;
                pt.y = 0;
            }
            else if (dx < 0)
            {
                pt.x -= (unit - pt.y) * dy / dx;
                pt.y = unit;
            }
            else if (dy < 0)
                pt.x = 0;
            else
                pt.x = unit;

            pps[a].push(pt); pps[b].push(pt);
        }

        x /= nh; y /= nh;
        a = unit * Math.max(Ext.isNumeric(me.surface_radius) ? parseFloat(me.surface_radius) : 1000, 100) / 40075700.0;

        var hvx = [], hvy = [], tvx = [], tvy = [];
        for (i = 0; i < nh; i++)
        {
            j = hull[i];
            dx = vx[j] - x; dy = vy[j] - y;
            c = Math.sqrt(dx * dx + dy * dy); c = (c + a) / c;
            hvx[i] = x + dx * c;
            hvy[i] = y + dy * c;
        }
        hvx.push(hvx[0]); hvy.push(hvy[0]);

        var pts = [], lst = [];

        var x11, y11, x12, y12, x21, y21, x22, y22;

        var cmp = function (a, b) { return MyMapBase.HullPointCmp(x, y, a.x, a.y, b.x, b.y); };
        for (i = 0; i < nv; i++)
        {
            x = vx[i]; y = vy[i]; // cmp中引用，以下需保持不变
            pts = pps[i];
            for (j = 0, n = pts.length, lst.length = 0; j < n; j++)
            {
                pt = pts[j];
                if (MyMapBase.PtInPolygon(pt.x, pt.y, hvx, hvy, 0, nh + 1, true))
                    lst.push(pt);
            }
            if (lst.length < n)
            {
                pts.sort(cmp);
                tvx.length = tvy.length = n + 1;
                for (j = 0; j < n; j++)
                {
                    pt = pts[j];
                    tvx[j] = pt.x; tvy[j] = pt.y;
                }
                tvx[n] = tvx[0]; tvy[n] = tvy[0];

                for (j = 0; j < nh;)
                {
                    x11 = hvx[j]; y11 = hvy[j];
                    if (MyMapBase.PtInPolygon(x11, y11, tvx, tvy, 0, n + 1, true))
                        lst.push({ x: x11, y: y11 });

                    x12 = hvx[++j]; y12 = hvy[j];
                    for (k = 0; k < n;)
                    {
                        x21 = tvx[k]; y21 = tvy[k];
                        x22 = tvx[++k]; y22 = tvy[k];

                        pt = MyMapBase.GetLineCrossPoint(x11, y11, x12, y12, x21, y21, x22, y22);
                        if (pt && MyMapBase.Between(pt.x, x11, x12) && MyMapBase.Between(pt.y, y11, y12)
                            && MyMapBase.Between(pt.x, x21, x22) && MyMapBase.Between(pt.y, y21, y22))
                            lst.push(pt);
                    }
                }
            }

            lst.sort(cmp);

            pt = lst[0];
            pvx.push(pt.x); pvy.push(pt.y);
            x11 = x12 = x22 = pt.x;
            y11 = y12 = y22 = pt.y;
            for (j = 1, n = lst.length; j < n; j++)
            {
                pt = lst[j];
                pvx.push(pt.x); pvy.push(pt.y);
                if (x11 > pt.x) x11 = pt.x; else if (x12 < pt.x) x12 = pt.x;
                if (y11 > pt.y) y11 = pt.y; else if (y12 < pt.y) y12 = pt.y;
            }
            pvx.push(x22); pvy.push(y22);

            pve.push(pvx.length);
            pbound.push(x11, y11, x12 - x11, y12 - y11);
        }

        me.task.Add(me.Invalidate, me);
    },
    __LoadPolygon: function (vx, vy, hull)
    {
        if (hull.length < 3)
            return;

        var lst = [], triangles = [];
        lst.push.apply(lst, hull);

        var i, j, k, a, b, c, d, dx, dy, r, pc = {};
        do
        {
            a = lst[0];
            b = lst[1];
            d = -1;
            for (i = lst.length; i-- > 0;)
            {
                c = b; b = a; a = lst[i];
                pc = MyMapBase.GetCircumcenter(vx[a], vy[a], vx[b], vy[b], vx[c], vy[c]);
                if (!pc) // 外心失败, 不能组成三角形
                    continue;

                dx = vx[a] - pc.x;
                dy = vy[a] - pc.y;
                r = dx * dx + dy * dy;

                for (j = lst.length - 1; j > 2; j--)
                {
                    k = lst[(i + j) % lst.length];
                    dx = vx[k] - pc.x;
                    dy = vy[k] - pc.y;
                    if (dx * dx + dy * dy <= r)
                        break;
                }
                d = i + 1 < lst.length ? i + 1 : 0;
                if (j == 2) // 没有点落在三角形的外接圆内
                {
                    triangles.push(a, b, c);
                    lst.splice(d, 1);
                    break;
                }
            }

            if (i < 0) // 本次循环未生成三角形
            {
                if (d < 0) // 没有哪个组合成功求得外心，表示共线了
                {
                    if (triangles.length == 0) // 未切得任何三角形，所有点都共线？
                        return;

                    for (j = lst.length; j-- > 0;)
                    {
                        x = lst[j];
                        for (k = triangles.length - 3; k >= 0; k -= 3)
                        {
                            if (triangles[k] == x || triangles[k + 1] == x || triangles[k + 2] == x)
                            {
                                lst.splice(j, 1);
                                break;
                            }
                        }
                    }

                    for (j = lst.length; j-- > 0;)
                    {
                        this.InsertPointToTriangle(vx, vy, triangles, lst[j]);
                    }

                    break;
                }
                else
                {
                    triangles.push(a, b, c);
                    lst.splice(d, 1);
                }
            }
        } while (lst.length >= 3);

        var BatchInsertPoint = function (b, e)
        {
            for (; b < e; b++)
            {
                if (hull.indexOf(b) < 0)
                    this.InsertPointToTriangle(vx, vy, triangles, b);
            }
        };
        BatchInsertPoint.displayName = this.self.$className + '#BatchInsertPoint';

        for (i = 0, n = vx.length; i < n; i = j)
        {
            j = Math.min(i + 60, n);
            this.task.Add(BatchInsertPoint, this, i, j);
        }

        this.task.Add(this.__BuildPolygon, this, vx, vy, hull, triangles);
    },
    __RelocateSurface: function (surfaces, ve)
    {
        //var a = 0, b, c, d;
        //for (var i = 0, j, k, n = ve.length, surface, surface2, surface3; i < n; i++, a = b)
        //{
        //    b = ve[i];
        //    surface = surfaces[a];
        //    for (k = a + 1; k < b; k++)
        //    {
        //        surface2 = surfaces[k];
        //        if (surface.angle > 180 && surface2.angle > 180)
        //        {
        //            d = k - a - 1 + 8;
        //            c = Math.floor(Math.log(d) / Math.log(2));
        //            surface2.offset = ((c - 3) * 2 + 1) * (surface.radius + 0.5) + surface2.radius;
        //            c = Math.pow(2, c);
        //            surface2.offsetDirection = 360 * (d - c) / Math.min(c, b - a - 1 + 8 - c);
        //        }
        //        else
        //        {
        //            for (j = a; j < k; j++)
        //            {
        //                surface3 = surfaces[j];
        //                d = Math.abs(surface2.direction - surface3.direction);
        //                if (d > 180)
        //                    d = 360 - d;
        //                if (d < Math.max(surface2.angle, surface3.angle) / 2 && d < 90) // 可能重叠?
        //                    surface2.offset = Math.max(surface2.offset, surface3.offset + surface3.radius);
        //            }
        //        }
        //    }
        //}
    },
    __LoadSurface: function (surfaces)
    {
        var me = this;
        var nSurface = surfaces.length;
        if (nSurface == 0)
            return;

        var ZERO = MyMapBase.ZERO;
        var cmp = function (a, b)
        {
            var d = a.y - b.y;
            if (d < 0)
                return -1;
            else if (d > 0)
                return 1;

            d = a.x - b.x;
            if (d < 0)
                return -1;
            else if (d > 0)
                return 1;

            return 0;
        };

        surfaces.sort(cmp);

        var vx = [], vy = [], vi = [], ve = [];
        for (var i = 0, j = 0, a, b; i < nSurface; j++)
        {
            a = surfaces[i];
            a.polygon = j;
            vx.push(a.x); vy.push(a.y); vi.push(j);
            for (i++; i < nSurface; i++)
            {
                b = surfaces[i];
                if (cmp(a, b))
                    break;

                b.polygon = j;
            }

            ve.push(i);
        }

        //me.task.Add(me.__RelocateSurface, me, surfaces, ve);

        vi.sort(function (a, b) { return a && b ? MyMapBase.HullPointCmp(vx[0], vy[0], vx[a], vy[a], vx[b], vy[b]) : a - b; });

        for (var i = vi.length - 2; i > 0; i--)
        {
            if (Math.abs(MyMapBase.CrossMul(vx[vi[0]], vy[vi[0]], vx[vi[i]], vy[vi[i]], vx[vi[i + 1]], vy[vi[i + 1]])) < ZERO)
                vi.push.apply(vi, vi.splice(i, 1));
            else
                break;
        }

        var hull = []; // 凸顶点
        for (var i = 0, j, n = vi.length, a, b, c; i < n; i++)
        {
            c = vi[i];
            for (j = hull.length; j > 2; j--)
            {
                a = hull[j - 2];
                b = hull[j - 1];
                if (MyMapBase.CrossMul(vx[a], vy[a], vx[b], vy[b], vx[c], vy[c]) <= ZERO)
                    break;
            }
            if (hull.length > j)
                hull.length = j;

            hull.push(c);
        }

        me.task.Add(me.__LoadPolygon, me, vx, vy, hull);
    },
    OnUpdateSurface: function (surfaces)
    {
    },
    SortSurfaces: function ()
    {
        this.surfaces_by_order.sort(function (a, b) { return a.zIndex == b.zIndex ? a.rownum - b.rownum : a.zIndex - b.zIndex; });
    },
    DoUpdateSurface: function ()
    {
        this.__update_surfaces = 0;

        this.task.Add(this.OnUpdateSurface, this, this.surfaces_by_order);
        this.task.Add(this.SortSurfaces, this);
        this.task.Add(this.Invalidate, this);
    },
    UpdateSurface: function ()
    {
        if (this.__update_surfaces)
            this.__update_surfaces++;
        else
        {
            this.__update_surfaces = 1;
            this.task.Add(this.DoUpdateSurface, this);
        }
    },
    OnDraw: function (ctx)
    {
        var surfaces = this.surfaces_by_order, nSurface = surfaces.length;
        if (nSurface == 0)
            return;

        var cb = this.canvas.clipBox, l = cb.x, t = cb.y, r = cb.right, b = cb.bottom;
        var tile = this.tile, scale = tile.canvasWidth / tile.ViewportW;
        var dx = scale * tile.ViewportX, dy = scale * tile.ViewportY, x, y, w, h;
        scale /= this.UNIT;

        if (this.PolygonVisible)
        {
            var pve = this.pve, n = pve.length;
            if (n > 0)
            {
                var pvx = this.pvx, pvy = this.pvy, pbound = this.pbound;

                var cb2 = new MyApp.util.Rect((l + dx) / scale, (t + dy) / scale, cb.w / scale, cb.h / scale);

                var polygon_kpi = this.GetKPI("polygon_kpi"); // 多边形渲染的指标对象
                var i = 0, j = 0, k, m = 0, cs, fill;
                for (; i < n; i++, j += 4)
                {
                    if (!cb2.IsIntersect(pbound[j], pbound[j + 1], pbound[j + 2], pbound[j + 3]))
                        continue;

                    ctx.lineWidth = 2;
                    ctx.strokeStyle = this.polygon_stroke;
                    ctx.beginPath();
                    k = i > 0 ? pve[i - 1] : 0;
                    ctx.moveTo((pvx[k] * scale - dx + 0.5) << 0, (pvy[k] * scale - dy + 0.5) << 0);
                    for (k++, m = pve[i]; k < m; k++)
                    {
                        ctx.lineTo((pvx[k] * scale - dx + 0.5) << 0, (pvy[k] * scale - dy + 0.5) << 0);
                    }

                    if (this.surfaces[i])
                    {
                        fill = (!Ext.isEmpty(polygon_kpi)) ? polygon_kpi.GetKPIColor(this.surfaces[i]) : null;
                        if (fill)
                        {
                            ctx.fillStyle = fill;
                            ctx.fill();
                        }
                    }

                    ctx.stroke();
                }

                i = this.__hot_pl;
                if (i >= 0 && i < n)
                {
                    j = i * 4;
                    if (cb2.IsIntersect(pbound[j], pbound[j + 1], pbound[j + 2], pbound[j + 3]))
                    {
                        ctx.shadowBlur = 3;
                        ctx.shadowColor = ctx.strokeStyle = MyCommon.mixColor(this.polygon_stroke, 'black');

                        k = i > 0 ? pve[i - 1] : 0;
                        ctx.beginPath();
                        ctx.moveTo((pvx[k] * scale - dx + 0.5) << 0, (pvy[k] * scale - dy + 0.5) << 0);
                        for (k++, m = pve[i]; k < m; k++)
                        {
                            ctx.lineTo((pvx[k] * scale - dx + 0.5) << 0, (pvy[k] * scale - dy + 0.5) << 0);
                        }
                        ctx.stroke();

                        ctx.shadowBlur = 0;
                        ctx.shadowColor = "rgba(0, 0, 0, 0)";
                    }
                }
            }
        }

        var pt = new MyApp.util.Point(), ci, radius, fill = this.surface_fill, surface_scale = this.surface_scale;
        for (var i = 0, ci; i < nSurface; i++)
        {
            ci = surfaces[i];
            x = ci.x * scale - dx;
            y = ci.y * scale - dy;
            pt.setXY(x, y - ci.offset * surface_scale).Rotate(x, y, ci.offsetDirection);
            x = (pt.x + 0.5) << 0; y = (pt.y + 0.5) << 0;
            radius = (ci.radius * ci.scale * surface_scale + 0.5) << 0;
            if (x < l - radius || x > r + radius || y < t - radius || y > b + radius)
                continue;
            fill = ci.fill || fill;

            ctx.shadowBlur = Math.min(6, radius);
            ctx.shadowColor = MyCommon.mixColor(fill, 'black', 0.2);
            ctx.shadowOffsetX = ctx.shadowOffsetY = 0;

            ctx.fillStyle = MyCommon.mixColor(fill, 'Black', 0.5);
            x = ci.x * scale - dx;
            y = ci.y * scale - dy;
            pt.setXY(x, y - ci.offset * surface_scale).Rotate(x, y, ci.offsetDirection);
            x = pt.x; y = pt.y;

            ctx.beginPath();
            ctx.arc(x, y, radius * 1.2, 0, Math.PI * 2, true); //Math.PI*2是JS计算方法，是圆
            ctx.closePath();
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.shadowColor = "rgba(0, 0, 0, 0)";
        }

        ci = this.__hot_surface;
        if (ci)
        {
            radius = ci.radius * ci.scale * surface_scale;
            fill = ci.fill || fill;

            ctx.shadowBlur = Math.min(6, radius);
            ctx.shadowColor = MyCommon.mixColor(fill, 'black', 0.2);
            ctx.shadowOffsetX = ctx.shadowOffsetY = 0;

            ctx.fillStyle = MyCommon.mixColor(fill, 'Black', 0.5);
            x = ci.x * scale - dx;
            y = ci.y * scale - dy;
            pt.setXY(x, y - ci.offset * surface_scale).Rotate(x, y, ci.offsetDirection);
            x = pt.x; y = pt.y;

            ctx.beginPath();
            ctx.arc(x, y, radius * 1.2, 0, Math.PI * 2, true); //Math.PI*2是JS计算方法，是圆
            ctx.closePath();
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.shadowColor = "rgba(0, 0, 0, 0)";
        }
    },
    GetCursor: function (e)
    {
        return this.__hot_surface ? 'pointer' : undefined;
    },
    PtInSurface: function (x, y, ci, r, scale)
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
        var surfaces = this.surfaces_by_order, nSurface = surfaces.length;
        if (nSurface == 0)
            return;

        var tile = this.tile;
        var scale = tile.canvasWidth / tile.ViewportW, dx = tile.ViewportX * scale, dy = tile.ViewportY * scale;
        var x = cx + dx, y = cy + dy;
        scale /= this.UNIT;

        var ci = this.__hot_surface, surface_scale = this.surface_scale;
        do
        {
            if (ci instanceof MyMapSurface)
            {
                if (this.PtInSurface(x, y, ci, ci.radius * ci.scale * surface_scale * 1.2, scale))
                    break;
            }

            for (var i = nSurface; i-- > 0;)
            {
                ci = surfaces[i];
                if (this.PtInSurface(x, y, ci, ci.radius * ci.scale * surface_scale, scale))
                    break;
            }

            if (i < 0)
                ci = null;

        } while (false);

        if (e)
        {
            if (this.__hot_surface !== ci)
            {
                for (var i = 0, it, l, t, a, ca, sa; i < 2; i++)
                {
                    it = i ? ci : this.__hot_surface;
                    if (!it)
                        continue;

                    l = it.x * scale - dx;
                    t = it.y * scale - dy;
                    if (it.offset)
                    {
                        a = it.offsetDirection * Math.PI / 180;
                        ca = Math.cos(a); sa = Math.sin(a);

                        l += sa * it.offset * surface_scale; t -= ca * it.offset * surface_scale;
                    }
                    a = it.radius * it.scale * surface_scale * 2;
                    this.InvalidateRect(l - a, t - a, a + a, a + a);
                }

                this.__hot_surface = ci;
            }

            if (this.PolygonVisible)
            {
                var pve = this.pve;
                var pvx = this.pvx, pvy = this.pvy, pbound = this.pbound;
                var i, n = pve.length, px, py, pw, ph;
                x /= scale; y /= scale;
                do
                {
                    i = this.__hot_pl;
                    if (i >= 0 && i < n)
                    {
                        if (MyMapBase.PtInPolygon(x, y, pvx, pvy, i > 0 ? pve[i - 1] : 0, pve[i], true))
                        {
                            /********************************************************/
                            // 判断点击的是多边形
                            if (Ext.isEmpty(this.__hot_surface) && this.__hot_pl > -1)
                            {
                                var polysurface = this.surfaces[i];
                                if (!Ext.isEmpty(polysurface))
                                {
                                    var polygon_kpi = this.GetKPI("polygon_kpi"); // 多边形渲染的指标对象
                                    if (!Ext.isEmpty(polygon_kpi) && !Ext.isEmpty(polygon_kpi.kpis.kpidata))
                                    {
                                        var val = polygon_kpi.GetKPIVal(polysurface);
                                        var header = polygon_kpi.GetKPIColHeader();
                                        var row = polygon_kpi.GetKPIRow(polysurface);
                                        ci = {
                                            infotype: "kpiinfo", headers: polygon_kpi.kpis.kpidata.headers,
                                            value: Ext.isEmpty(row) ? polygon_kpi.CreateKPIRow(polysurface) : row,
                                            tip: Ext.isEmpty(header) ? "" : header.nameCn + ":" + Ext.isEmpty(val) ? "" : val
                                        };
                                    }
                                    else
                                        ci = null;
                                }
                            }
                            /********************************************************/
                            break;
                        }

                        i *= 4;
                        px = pbound[i++]; py = pbound[i++]; pw = pbound[i++], ph = pbound[i++];
                        this.InvalidateRect(px * scale - dx - 3, py * scale - dy - 3, pw * scale + 6, ph * scale + 6);
                    }

                    this.__hot_pl = -1;
                    for (i = n; i-- > 0;)
                    {
                        if (MyMapBase.PtInPolygon(x, y, pvx, pvy, i > 0 ? pve[i - 1] : 0, pve[i], true))
                        {
                            this.__hot_pl = i;
                            i *= 4;
                            px = pbound[i++]; py = pbound[i++]; pw = pbound[i++], ph = pbound[i++];
                            this.InvalidateRect(px * scale - dx - 3, py * scale - dy - 3, pw * scale + 6, ph * scale + 6);
                            break;
                        }
                    }
                } while (false);
            }
        }

        return ci;
    }
});
