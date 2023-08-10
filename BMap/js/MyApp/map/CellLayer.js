Ext.define('MyApp.map.Cell', {
    extend: 'MyApp.map.Element',
    alternateClassName: 'MyMapCell',
    statics:
    {
        GetImpl: function (hr)
        {
            var t = MyMapBase.GetImplByJTH(hr, this, ['x', 'y', 'offset'/*偏移*/, 'offsetDirection'/*偏移方向角*/, 'polygon']), proto = t.prototype;

            if (!('direction' in proto))
                Object.defineProperty(proto, 'direction', { value: 0 });

            if (!('angle' in proto))
                Object.defineProperty(proto, 'angle', { value: 360 });

            return t;
        }
    },
    GetTip: function ()
    {
        return '<span style="white-space: nowrap"><b>小 区: </b>' + Ext.String.htmlEncode(this.name) + '</span><br/><span style="white-space: nowrap"><b>小区标识: </b>' + Ext.String.htmlEncode(this.id) + '</span>';
    }
});

//////////////////////////////////////////////////////////////////////////
Ext.define('MyApp.map.CellLayer', {
    extend: 'MyApp.map.Layer',
    alias: 'widget.cell_layer',
    zIndex: -666,
    uri: '/web/jss/map.jss?action=map.GetCell',
    minBound: 2000,     // 取最小范围(半径、米)的数据
    maxBound: 50000,    // 取最大范围(半径、米)的数据
    UNIT: Math.pow(2, 20),
    cell_fill: 'rgba(0,128,255,0.5)',
    cell_radius: 1000,
    cell_scale: 1,
    cell_alpha: 0.7/*不透明度*/,
    cell_nokpihide: false/*无指标渲染则隐藏小区、基站*/,
    mcell_fill: 'rgba(255,0,0,0.5)'/*主小区颜色*/,
    mcell_scale: 2/*主小区放大倍数*/,
    ncell_fill: 'rgba(0,255,0,0.5)'/*邻区颜色*/,
    ncell_scale: 2/*邻区放大倍数*/,
    cell_selscale: 2/*图层中元素被选中时，放大的倍数*/,
    cell_selfill: undefined/*图层中元素被选中时，填充颜色*/,
    polygon_stroke: 'rgba(0,128,0,1)',
    polygon_alpha: 0.3/*多边形的不透明度*/,
    sel_linewidth: 3/*图层中元素被选中时，线的宽度*/,
    isoffset: true/*坐标点有重复时，是否进行绕圈的偏移*/,
    coversite: undefined,
    sitepolygons: []/*规划站点覆盖到的多边形索引*/,
    sitecells: []/*规划站点覆盖到的小区索引*/,
    statics: {
        // 五角星模板
        five_pattern: new function ()
        {
            var pts = [];
            for (var i = 0, a; i < 5; i++)
            {
                a = Math.PI * (270 - 72 * i) / 180;
                pts.push(Math.cos(a), Math.sin(a));

                a = Math.PI * (234 - 72 * i) / 180;
                pts.push(0.35 * Math.cos(a), 0.35 * Math.sin(a));
            }

            return pts;
        }
    },
    constructor: function ()
    {
        var __PolygonVisible = true;
        var __ElementVisible = true;
        Object.defineProperties(this, {
            cells: { value: [] /*小区*/ },
            mapSel: { value: {} /*选择集*/ },
            pvx: { value: [] /*多边形x值序列*/ },
            pvy: { value: [] /*多边形y值序列*/ },
            pve: { value: [] /*多边形x,y分组结束索引*/ },
            pbound: { value: [] /*依次记录多边形逻辑位标x, y, w, h, cells*/ },
            PolygonVisible: {
                get: function () { return __PolygonVisible; },
                set: function (v)
                {
                    if (__PolygonVisible != v)
                    {
                        __PolygonVisible = v;
                        this.Invalidate();
                    }
                }
            },
            ElementVisible: {
                get: function () { return __ElementVisible; },
                set: function (v)
                {
                    if (__ElementVisible != v)
                    {
                        __ElementVisible = v;
                        this.Invalidate();
                    }
                }
            }
        });
        this.callParent(arguments);
    },
    OnDestroy: function ()
    {
        this.callParent(arguments);
    },
    OnViewportChanged: function (bFinally, tile)
    {
        if (bFinally)
            this.cell_scale = Math.pow(Ext.isLinux ? 30 : 10, tile.ZoomLevel / 16 - 1);

        this.callParent(arguments);
    },
    OnQuery: function (condition)
    {
        if (!Ext.isEmpty(this.network))
            this.args = Ext.applyIf({ network: this.network }, this.args);

        this.PostLoad();
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
        a = unit * Math.max(Ext.isNumeric(me.cell_radius) ? parseFloat(me.cell_radius) : 1000, 100) / 40075700.0;

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
            pbound.push(x11, y11, x12 - x11, y12 - y11, undefined);
        }

        this.task.Add(this.__split_polygon, this);
        this.task.Add(this.Invalidate, this);
    },
    __split_polygonold: function () // 按小区方向和角度切分多边形
    {
        var pvx = this.pvx, pvy = this.pvy, pve = this.pve, pbound = this.pbound;
        //var Between = function (v, a, b) { return a < b ? v >= a - 0.001 && v <= b + 0.001 : v >= b - 0.001 && v <= a + 0.001; };
        var cells = this.cells, seg = [], pt = new MyApp.util.Point(), pc, it;
        var x11, y11, x12, y12, x21, y21, x22, y22;
        for (var i = 0, j, k, n = cells.length, a, b, c; i < n;)
        {
            c = cells[i];
            if (c.polygon < 0)
            {
                i++;
                continue;
            }

            x21 = c.x; y21 = c.y;
            a = c.direction - c.angle / 2; b = a + c.angle;
            seg.length = 0;
            seg.push({ a: a, b: b, cs: [c] });
            for (i++, k = c.polygon; i < n; i++)
            {
                c = cells[i];
                if (c.polygon != k)
                    break;

                a = c.direction - c.angle / 2; b = a + c.angle;
                for (j = 0; j < seg.length; j++)
                {
                    if (a < seg[j].b)
                        break;
                }

                it = { a: a, b: b, cs: [c] };
                if (j < seg.length)
                {
                    seg.splice(j, 0, it);
                    for (j++; j < seg.length;)
                    {
                        if (it.b > seg[j].a)
                        {
                            it.cs.push.apply(it.cs, seg[j].cs);
                            it.a = Math.min(it.a, seg[j].a);
                            it.b = Math.max(it.b, seg[j].b);
                            seg.splice(j, 1);
                        }
                        else
                            break;
                    }
                }
                else
                    seg.push(it);
            }

            if (seg.length < 2)
            {
                pbound[k * 5 + 4] = seg[0].cs;
                continue;
            }

            var bp = k > 0 ? pve[k - 1] : 0, ep = pve[k] - 1;
            var radius = Math.sqrt(Math.pow(pbound[k * 5 + 2], 2) + Math.pow(pbound[k * 5 + 3], 2));

            b = seg[seg.length - 1].b;

            for (j = 0; j < seg.length; j++)
            {
                it = seg[j];
                a = MyMapBase.AngleNormalize(b + MyMapBase.AngleNormalize(it.a + 360 - b) / 2);
                b = it.b;

                pt.setXY(x21, y21 - radius).Rotate(x21, y21, a);
                x22 = pt.x; y22 = pt.y;

                for (var q = bp; q < ep; q++)
                {
                    x11 = pvx[q]; y11 = pvy[q];
                    x12 = pvx[q + 1]; y12 = pvy[q + 1];
                    pc = MyMapBase.GetLineCrossPoint(x11, y11, x12, y12, x21, y21, x22, y22);
                    if (pc && MyMapBase.Between(pc.x, x11, x12) && MyMapBase.Between(pc.y, y11, y12) && MyMapBase.Between(pc.x, x21, x22) && MyMapBase.Between(pc.y, y21, y22))
                    {
                        it.pc = pc;
                        it.q = q;
                        break;
                    }
                }
            }

            for (j = 0; j < seg.length; j++)
            {
                it = seg[j];
                a = it.q;

                var cs = it.cs;

                pvx.push(x21); pvy.push(y21);
                x11 = x12 = x21; y11 = y12 = y21;

                pvx.push(x = it.pc.x); pvy.push(y = it.pc.y);
                if (x11 > x) x11 = x; else if (x12 < x) x12 = x;
                if (y11 > y) y11 = y; else if (y12 < y) y12 = y;

                it = seg[(j + 1) % seg.length];
                c = it.q - a;
                if (c < 0)
                    c += ep - bp;

                for (a++; c-- > 0; a++)
                {
                    a = bp + (a - bp) % (ep - bp);
                    pvx.push(x = pvx[a]); pvy.push(y = pvy[a]);
                    if (x11 > x) x11 = x; else if (x12 < x) x12 = x;
                    if (y11 > y) y11 = y; else if (y12 < y) y12 = y;
                }

                pvx.push(x = it.pc.x); pvy.push(y = it.pc.y);
                if (x11 > x) x11 = x; else if (x12 < x) x12 = x;
                if (y11 > y) y11 = y; else if (y12 < y) y12 = y;

                pvx.push(x21); pvy.push(y21);

                pve.push(pvx.length);
                pbound.push(x11, y11, x12 - x11, y12 - y11, cs);
            }
        }
    },
    __split_polygon: function () // 按小区方向和角度切分多边形
    {
        var pvx = this.pvx, pvy = this.pvy, pve = this.pve, pbound = this.pbound;
        //var Between = function (v, a, b) { return a < b ? v >= a - 0.001 && v <= b + 0.001 : v >= b - 0.001 && v <= a + 0.001; };
        var cells = this.cells, seg = [], dir = [], pt = new MyApp.util.Point(), pc, it;
        var x11, y11, x12, y12, x21, y21, x22, y22;
        for (var i = 0, j, k, n = cells.length, a, b, c; i < n;)
        {
            c = cells[i];
            if (c.polygon < 0)
            {
                i++;
                continue;
            }

            x21 = c.x; y21 = c.y;
            seg.length = 0;
            dir.length = 0;
            dir.push({ d: MyMapBase.AngleNormalize(c.direction), cs: [c] });
            for (i++, k = c.polygon; i < n; i++)
            {
                c = cells[i];
                if (c.polygon != k)
                    break;

                for (j = 0; j < dir.length; j++)
                {
                    var d = MyMapBase.AngleNormalize(c.direction);
                    if (d < dir[j].d)
                    {
                        dir.splice(j, 0, { d: d, cs: [c] });
                        break;
                    }
                    else if (d == dir[j].d)
                    {
                        dir[j].cs.push(c);
                        break;
                    }
                }

                if (j >= dir.length)
                    dir.push({ d: MyMapBase.AngleNormalize(c.direction), cs: [c] });
            }

            for (j = 0; j < dir.length; j++)
            {
                if (j == 0)
                    a = MyMapBase.AngleNormalize((360 + dir[dir.length - 1].d + dir[j].d) / 2);
                else
                    a = MyMapBase.AngleNormalize((dir[j - 1].d + dir[j].d) / 2);

                if (j == dir.length - 1)
                    b = MyMapBase.AngleNormalize((dir[0].d + dir[j].d) / 2);
                else
                    b = MyMapBase.AngleNormalize((dir[j].d + dir[j + 1].d) / 2);

                seg.push({ a: a, b: b, cs: dir[j].cs });
            }

            if (seg.length < 2)
            {
                pbound[k * 5 + 4] = seg[0].cs;
                continue;
            }

            var bp = k > 0 ? pve[k - 1] : 0, ep = pve[k] - 1;
            var radius = Math.sqrt(Math.pow(pbound[k * 5 + 2], 2) + Math.pow(pbound[k * 5 + 3], 2));

            for (j = 0; j < seg.length; j++)
            {
                it = seg[j];
                a = it.a;
                b = it.b;

                pt.setXY(x21, y21 - radius).Rotate(x21, y21, a);
                x22 = pt.x; y22 = pt.y;

                for (var q = bp; q < ep; q++)
                {
                    x11 = pvx[q]; y11 = pvy[q];
                    x12 = pvx[q + 1]; y12 = pvy[q + 1];
                    pc = MyMapBase.GetLineCrossPoint(x11, y11, x12, y12, x21, y21, x22, y22);
                    if (pc && MyMapBase.Between(pc.x, x11, x12) && MyMapBase.Between(pc.y, y11, y12) && MyMapBase.Between(pc.x, x21, x22) && MyMapBase.Between(pc.y, y21, y22))
                    {
                        it.pc = pc;
                        it.q = q;
                        break;
                    }
                }
            }

            for (j = 0; j < seg.length; j++)
            {
                it = seg[j];
                a = it.q;

                var cs = it.cs;

                pvx.push(x21); pvy.push(y21);
                x11 = x12 = x21; y11 = y12 = y21;

                pvx.push(x = it.pc.x); pvy.push(y = it.pc.y);
                if (x11 > x) x11 = x; else if (x12 < x) x12 = x;
                if (y11 > y) y11 = y; else if (y12 < y) y12 = y;

                it = seg[(j + 1) % seg.length];
                c = it.q - a;
                if (c < 0)
                    c += ep - bp;

                for (a++; c-- > 0; a++)
                {
                    a = bp + (a - bp) % (ep - bp);
                    pvx.push(x = pvx[a]); pvy.push(y = pvy[a]);
                    if (x11 > x) x11 = x; else if (x12 < x) x12 = x;
                    if (y11 > y) y11 = y; else if (y12 < y) y12 = y;
                }

                pvx.push(x = it.pc.x); pvy.push(y = it.pc.y);
                if (x11 > x) x11 = x; else if (x12 < x) x12 = x;
                if (y11 > y) y11 = y; else if (y12 < y) y12 = y;

                pvx.push(x21); pvy.push(y21);

                pve.push(pvx.length);
                pbound.push(x11, y11, x12 - x11, y12 - y11, cs);
            }
        }
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
    RelocateCell: function (cells, ve)
    {
        //var cmp = function (a, b)
        //{
        //    return a.polygon != b.polygon ? a.polygon - b.polygon : a.angle - b.angle;
        //};
        //cells.sort(cmp);

        //var a = 0, b, c, d;
        //for (var i = 0, j, k, n = ve.length, cell, cell2, cell3; i < n; i++, a = b)
        //{
        //    b = ve[i];
        //    cell = cells[a];
        //    for (k = a + 1; k < b; k++)
        //    {
        //        cell2 = cells[k];
        //        if (cell.angle > 180 && cell2.angle > 180)
        //        {
        //            d = k - a - 1 + 8;
        //            c = Math.floor(Math.log(d) / Math.log(2));
        //            cell2.offset = ((c - 3) * 2 + 1) * (cell.radius + 0.5) + cell2.radius;
        //            c = Math.pow(2, c);
        //            cell2.offsetDirection = 360 * (d - c) / Math.min(c, b - a - 1 + 8 - c);
        //        }
        //        else
        //        {
        //            for (j = a; j < k; j++)
        //            {
        //                cell3 = cells[j];
        //                d = Math.abs(cell2.direction - cell3.direction);
        //                if (d > 180)
        //                    d = 360 - d;
        //                if (d < Math.max(cell2.angle, cell3.angle) / 2 && d < 90) // 可能重叠?
        //                    cell2.offset = Math.max(cell2.offset, cell3.offset + cell3.radius);
        //            }
        //        }
        //    }
        //}

        var a = 0, b, indoorc, indoord, d, indoorcount = 0, indoorcircle = {}/*记录室内同一圈的点*/, circlekey, angleoffset = {}/*同一角度偏移的距离*/, offset = 0;
        var arrlast, nlast, seg;
        for (var i = 0, j, k, n = ve.length, cell, cell2, cell3; i < n; i++, a = b)
        {
            b = ve[i];
            cell = cells[a];

            indoorcount = 0;
            angleoffset = {};

            if (cell.angle <= 180 && !Ext.isEmpty(cell.direction))
                angleoffset[cell.direction + ''] = cell.radius;

            indoorcircle = {};
            circlekey = '';

            for (k = a + 1; k < b; k++)
            {
                cell2 = cells[k];
                if (cell2.angle > 180)
                {
                    indoord = indoorcount + 8;
                    indoorc = Math.floor(Math.log(indoord) / Math.log(2));
                    cell2.offset = ((indoorc - 3) * 2 + 1) * (cell.radius + 0.5) + cell2.radius;
                    indoorc = Math.pow(2, indoorc);
                    cell2.offsetDirection = 360 * (indoord - indoorc) / Math.min(indoorc, b - a - 1 + 8 - indoorc);
                    indoorcount++;

                    circlekey = indoorc + '';
                    if (Ext.isEmpty(indoorcircle[circlekey]))
                        indoorcircle[circlekey] = [];
                    indoorcircle[circlekey].push(cell2);
                }
                else
                {
                    offset = 0;
                    if (Ext.isEmpty(angleoffset[cell2.direction + '']))
                        angleoffset[cell2.direction + ''] = 0;
                    else
                        offset = angleoffset[cell2.direction + ''];

                    cell2.offset = offset;
                    angleoffset[cell2.direction + ''] = offset + cell2.radius;
                }
            }

            if (!Ext.isEmpty(circlekey) && !Ext.isEmpty(indoorcircle[circlekey]))
            {
                arrlast = indoorcircle[circlekey];
                nlast = arrlast.length;
                seg = 360 / nlast;
                for (var x = 0; x < nlast; x++)
                {
                    arrlast[x].offsetDirection = x * seg;
                }
            }
        }
    },
    __LoadCell: function (cells)
    {
        var nCell = cells.length;
        if (nCell == 0)
        {
            this.task.Add(this.Invalidate, this);
            return;
        }

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

        cells.sort(cmp);

        var vx = [], vy = [], vi = [], ve = [];
        for (var i = 0, j = 0, a, b; i < nCell; j++)
        {
            a = cells[i];
            a.polygon = j;
            vx.push(a.x); vy.push(a.y); vi.push(j);
            for (i++; i < nCell; i++)
            {
                b = cells[i];
                if (cmp(a, b))
                    break;

                b.polygon = j;
            }

            ve.push(i); // 同经纬度小区的结束索引
        }

        if (this.isoffset)
            this.task.Add(this.RelocateCell, this, cells, ve);

        this.task.Add(this.Invalidate, this);

        if (!this.voronoi)
            return;

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

        this.task.Add(this.__LoadPolygon, this, vx, vy, hull);
    },
    OnLoad: function (result, error)
    {
        if (error)
            throw error;

        delete this.__hot_cell;
        delete this.__hot_pl;
        this.pve.length = 0;
        var table = result.cells, cell_type = MyMapCell.GetImpl(table[0]);
        var cells = this.cells, unit = this.UNIT, nCell = table.length - 1;
        cells.length = nCell;
        for (var i = 0, ci; i < nCell; i++)
        {
            ci = new cell_type(table[i + 1]);
            if (Ext.isEmpty(ci.x))
                MyMapBase.GeographicToLogical(ci);
            ci.x *= unit;
            ci.y *= unit;

            ci.offset = 0;
            ci.offsetDirection = ci.direction;
            ci.polygon = -1;

            cells[i] = ci;
        }

        table = result.polygon;
        if (table)
        {
            var mapCell = {};
            for (var i = nCell, ci; i-- > 0;)
            {
                ci = cells[i];
                mapCell[ci.id] = ci;
            }

            var pvx = this.pvx, pvy = this.pvy, pve = this.pve, pbound = this.pbound;
            pvx.length = pvy.length = pve.length = pbound.length = 0;

            var polygon_type = MyMapBase.GetImplByJTH(table[0]);
            for (var i = 0, n = table.length - 1, pi = new polygon_type(), its; i < n; i++)
            {
                pi.setData(table[i + 1]);
                its = Ext.decode(pi.pts);
                for (var j = 0, m = its.length; j < m;)
                {
                    pvx.push(its[j++] * unit);
                    pvy.push(its[j++] * unit);
                }

                its = Ext.decode(pi.items);
                for (var j = 0, m = its.length; j < m; j++)
                {
                    if (!Ext.isEmpty(mapCell[its[j]]))
                        mapCell[its[j]].polygon = i;
                }

                pve.push(pvx.length);
                pbound.push(pi.left * unit, pi.top * unit, pi.width * unit, pi.height * unit, undefined);
            }

            var cs = cells.filter(function (c) { return c.polygon < 0; });
            if (cs.length > 0)
            {
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

                cs.sort(cmp);
                for (var i = cs.length - 1, j = 0, a, b; i >= 0;)
                {
                    a = cs[i];
                    a.polygon = --j;
                    for (i--; i >= 0; i--)
                    {
                        b = cs[i];
                        if (cmp(a, b))
                            break;

                        b.polygon = j;
                    }
                }
            }

            cells.sort(function (a, b) { return a.polygon - b.polygon; });

            var ve = [];
            for (var i = 0, a, b; i < nCell;)
            {
                a = cells[i];
                for (i++; i < nCell; i++)
                {
                    b = cells[i];
                    if (a.polygon != b.polygon)
                        break;
                }

                ve.push(i);
            }
            this.task.Add(this.RelocateCell, this, cells, ve);
            this.task.Add(this.__split_polygon, this);
            this.task.Add(this.Invalidate, this);
        }
        else
            this.task.Add(this.__LoadCell, this, cells);

        this.task.Add(this.OnSiteCover, this, this.coversite);
    },
    GetCellStyle: function (cell)
    {
        var fill = null, issel = this.IsSelected(cell), scale = issel ? this.cell_selscale : 1;
        if (!Ext.isEmpty(cell))
        {
            var k = this.GetKPI("element_kpi");
            if (!Ext.isEmpty(k))
                fill = k.GetKPIColorRGB(cell);

            fill = (!Ext.isEmpty(fill)) ? MyApp.util.Common.rgba(fill[0], fill[1], fill[2], this.cell_alpha) || undefined :
                (this.cell_nokpihide ? null : ((issel && this.cell_selfill) ? this.cell_selfill : this.cell_fill));
        }
        return { fill: fill, statscale/*小区处不同的状态被整体放大的倍数*/: scale };
    },
    GetPolyStyle: function (cell)
    {
        var fill = null, issel = this.IsSelected(cell), linewidth = issel ? this.sel_linewidth : 1;
        if (!Ext.isEmpty(cell))
        {
            var k = this.GetKPI("polygon_kpi");
            if (!Ext.isEmpty(k) && !Ext.isEmpty(cell))
                fill = k.GetKPIColorRGB(cell);

            fill = (!Ext.isEmpty(fill)) ? MyApp.util.Common.rgba(fill[0], fill[1], fill[2], this.polygon_alpha) : null;
        }
        return { fill: fill, stroke: this.polygon_stroke, linewidth: linewidth };
    },
    GetCellImg: function (cell)
    {
    },
    DrawArc: function (ctx, cell, x, y, radius)
    {
        ctx.beginPath();
        ctx.moveTo(x, y);
        var a = (cell.direction - cell.angle / 2) / 180 * Math.PI;
        ctx.lineTo(x + radius * Math.sin(a), y - radius * Math.cos(a));
        a -= Math.PI / 2;
        ctx.arc(x, y, radius, a, a + cell.angle / 180 * Math.PI, false);
        ctx.closePath();
    },
    DrawFiveStar: function (ctx, cell, x, y, radius)
    {
        radius = radius;
        var pts = MyApp.map.CellLayer.five_pattern;
        ctx.beginPath();
        ctx.moveTo(x + pts[0] * radius, y + pts[1] * radius);
        for (var i = 2, n = pts.length; i < n;)
        {
            ctx.lineTo(x + pts[i++] * radius, y + pts[i++] * radius);
        }
        ctx.closePath();
    },
    DrawCell: function (ctx, cell, x, y, radius, cstyle)
    {
        if (Ext.isEmpty(cstyle) || Ext.isEmpty(cstyle.fill))
        {
            cell.visible = false;
            return;
        }

        cell.visible = true;
        var fill = cstyle.fill, statscale = cstyle.statscale;
        var img = MyMapBase.MakeMaskImg(this.GetCellImg(cell), fill);
        if (img)
        {
            var cell_scale = this.cell_scale * statscale;
            ctx.drawImage(img, x - (img.width * cell_scale) / 2, y - (img.height * cell_scale) / 2, img.width * cell_scale, img.height * cell_scale);
        }
        else
        {
            radius *= statscale;
            if (cell.cover_type == 2 || cell.cover_type == 3) // 室内小区
                this.DrawFiveStar(ctx, cell, x, y, radius);
            else
                this.DrawArc(ctx, cell, x, y, radius);

            ctx.fillStyle = fill;
            ctx.fill();
        }
    },
    PtInArc: function (ptx, pty, cell, x, y, radius)
    {
        var dx = ptx - x, dy = pty - y, a;
        if (dx * dx + dy * dy > radius * radius)
            return false;

        if (dx > 0) // 1, 4
            a = Math.atan(dy / dx) + (dy < 0 ? Math.PI * 2 : 0);
        else if (dx < 0) // 2, 3
            a = Math.PI + Math.atan(dy / dx);
        else if (dy > 0)
            a = Math.PI / 2;
        else if (dy < 0)
            a = Math.PI * 3 / 2;
        else
            return true;

        a = Math.abs(MyMapBase.AngleNormalize(270 + cell.direction) - 180 * a / Math.PI);
        if (a > 180)
            a = 360 - a;
        if (a <= cell.angle / 2)
            return true;

        return false;
    },
    PtInCell: function (ptx, pty, cell, x, y, radius)
    {
        if (!cell.visible)
            return false;

        var img = this.GetCellImg(cell);
        if (img && img.complete && img.width)
            return Math.abs(ptx - x) * 2 <= img.width * this.cell_scale && Math.abs(pty - y) * 2 <= img.height * this.cell_scale;
        else if (cell.cover_type == 2 || cell.cover_type == 3) // 室内小区
        {
            var ctx = this.canvas.canvas.getContext('2d');
            this.DrawFiveStar(ctx, cell, x, y, radius);
            return ctx.isPointInPath(ptx, pty);
        }
        else
            return this.PtInArc(ptx, pty, cell, x, y, radius);
    },
    OnDraw: function (ctx)
    {
        var cells = this.cells, nCell = cells.length;
        if (nCell == 0)
            return;

        var cb = this.canvas.clipBox, l = cb.x, t = cb.y, r = cb.right, b = cb.bottom;
        var tile = this.tile, scale = tile.canvasWidth / tile.ViewportW;
        var dx = scale * tile.ViewportX, dy = scale * tile.ViewportY, x, y;
        scale /= this.UNIT;

        if (this.PolygonVisible)
        {
            var pve = this.pve, n = pve.length;
            if (n > 0)
            {
                var pvx = this.pvx, pvy = this.pvy, pbound = this.pbound;

                var cb2 = new MyApp.util.Rect((l + dx) / scale, (t + dy) / scale, cb.w / scale, cb.h / scale);

                var i = 0, j = 0, k, m = 0, cs, pstyle;
                for (; i < n; i++, j += 5)
                {
                    if (!cb2.IsIntersect(pbound[j], pbound[j + 1], pbound[j + 2], pbound[j + 3]))
                        continue;

                    k = i > 0 ? pve[i - 1] : 0;
                    cs = pbound[j + 4];

                    pstyle = this.GetPolyStyle(cs ? cs[0] : cs);

                    ctx.strokeStyle = pstyle.stroke;
                    ctx.lineWidth = pstyle.linewidth;
                    ctx.beginPath();
                    ctx.moveTo((pvx[k] * scale - dx + 0.5) << 0, (pvy[k] * scale - dy + 0.5) << 0);
                    for (k++, m = pve[i]; k < m; k++)
                    {
                        ctx.lineTo((pvx[k] * scale - dx + 0.5) << 0, (pvy[k] * scale - dy + 0.5) << 0);
                    }

                    if (cs && pstyle.fill)
                    {
                        ctx.fillStyle = pstyle.fill;
                        ctx.fill();
                    }

                    ctx.stroke();
                }

                i = this.__hot_pl;
                if (i >= 0 && i < n)
                {
                    j = i * 5;
                    if (cb2.IsIntersect(pbound[j], pbound[j + 1], pbound[j + 2], pbound[j + 3]))
                    {
                        cs = pbound[j + 4];
                        pstyle = this.GetPolyStyle(cs ? cs[0] : cs);

                        ctx.shadowBlur = 2;
                        ctx.shadowColor = ctx.strokeStyle = MyCommon.mixColor(pstyle.stroke, 'black');

                        k = i > 0 ? pve[i - 1] : 0;

                        ctx.lineWidth = pstyle.linewidth;
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

                // 多边形标签
                var txtx, txty, plidx, polycells, count = this.sitepolygons.length;
                var polygon_kpi = this.GetKPI("polygon_kpi"); // 多边形渲染的指标对象
                if (count > 0 && !Ext.isEmpty(polygon_kpi) && !Ext.isEmpty(polygon_kpi.kpis.kpidata))
                {
                    for (i = 0; i < count; i++)
                    {
                        plidx = this.sitepolygons[i] * 5;
                        txtx = pbound[plidx] + pbound[plidx + 2] / 2;
                        txty = pbound[plidx + 1] + pbound[plidx + 3] / 2;

                        polycells = this.pbound[plidx + 4];
                        if (!Ext.isEmpty(polycells) && polycells.length > 0 && !Ext.isEmpty(polycells[0]))
                        {
                            var val = polygon_kpi.GetKPIVal(polycells[0]);
                            if (Ext.isEmpty(val))
                                continue;

                            ctx.font = "18px bold arial";
                            ctx.fillStyle = "rgba(0,0,0,1)";
                            ctx.fillText(val, (txtx * scale - dx + 0.5) << 0, (txty * scale - dy + 0.5) << 0);
                        }
                    }
                }
            }
        }

        if (this.ElementVisible)
        {
            var ci, radius, cstyle, cell_scale = this.cell_scale, fontx, fonty, a, font_size = Math.floor(12 * cell_scale), font_width = 5;
            for (var i = 0, ci; i < nCell; i++)
            {
                ci = cells[i];
                fontx = x = ci.x * scale - dx;
                fonty = y = ci.y * scale - dy;
                radius = ci.offset * cell_scale;
                a = ci.offsetDirection / 180 * Math.PI;
                x += radius * Math.sin(a);
                y -= radius * Math.cos(a);

                radius = (ci.radius * cell_scale + 0.5) << 0;
                if (x < l - radius || x > r + radius || y < t - radius || y > b + radius)
                    continue;

                cstyle = this.GetCellStyle(ci);
                if (this.IsSelected(ci))
                {
                    ctx.shadowColor = MyCommon.mixColor(cstyle.fill, 'black', 0.2);
                    ctx.shadowBlur = Math.min(3, radius / 2);
                    ctx.shadowOffsetX = ctx.shadowOffsetY = 0;

                    cstyle.fill = MyCommon.mixColor(cstyle.fill, 'black', 0.75);
                    this.DrawCell(ctx, ci, x, y, radius, cstyle);

                    ctx.shadowBlur = 0;
                    ctx.shadowColor = "rgba(0, 0, 0, 0)";
                }
                else
                    this.DrawCell(ctx, ci, x, y, radius, cstyle);

                // 聚合数量标签
                if (!Ext.isEmpty(ci.converges) && ci.converges > 0) //  && (ci.x != cells[i+1].x || ci.y != cells[i+1].y || i == nCell - 1)
                {
                    ctx.font = "12px bold arial";
                    ctx.fillStyle = "rgba(0,0,0,1)";
                    ctx.fillText(ci.converges, (fontx - font_width + 0.5) << 0, (fonty + font_size + 6.5) << 0);
                }
            }

            ci = this.__hot_cell;
            if (ci)
            {
                x = ci.x * scale - dx;
                y = ci.y * scale - dy;
                radius = ci.offset * cell_scale;
                a = ci.offsetDirection / 180 * Math.PI;
                x += radius * Math.sin(a);
                y -= radius * Math.cos(a);

                radius = ci.radius * cell_scale;

                cstyle = this.GetCellStyle(ci);
                cstyle.fill = MyCommon.mixColor(cstyle.fill, 'black', 0.5);

                ctx.shadowBlur = Math.min(6, radius);
                ctx.shadowColor = cstyle.fill;
                ctx.shadowOffsetX = ctx.shadowOffsetY = 0;

                this.DrawCell(ctx, ci, x, y, radius * 1.2, cstyle);

                ctx.shadowBlur = 0;
                ctx.shadowColor = "rgba(0, 0, 0, 0)";
            }
        }
    },
    GetCursor: function (e)
    {
        return this.__hot_cell ? 'pointer' : undefined;
    },
    GetPropertyInfo: function (item)
    {
        if (Ext.isNumber(item) && item > -1)
        {
            var polycells = this.pbound[item * 5 + 4];
            item = polycells && polycells.length > 0 ? polycells[0] : item;
        }

        if (item instanceof MyApp.map.Cell)
        {
            var rs = [];
            if (!Ext.isEmpty(this.network) && this.network.toLowerCase().substring(0, 3) == "lte")
                rs.push(["1、常规", "LTE制式", item.lte_system]);

            rs.push(["1、常规", "名称", item.name]);
            rs.push(["1、常规", "标识", item.id]);
            if (!Ext.isEmpty(item.lac))
                rs.push(["1、常规", "LAC", item.lac]);
            if (!Ext.isEmpty(item.tac))
                rs.push(["1、常规", "TAC", item.tac]);
            rs.push(["1、常规", "CI", item.ci]);
            rs.push(["1、常规", "扰码", item.sc]);
            rs.push(["1、常规", "天线挂高", item.ant_high]);
            rs.push(["1、常规", "电子下倾角", item.ant_electangle]);
            rs.push(["1、常规", "物理下倾角", item.ant_machangle]);
            rs.push(["1、常规", "是否为RRU小区", item.rru_cell_flag == '1' ? '是' : '否']);
            rs.push(["1、常规", "上行频点", item.uarfcn_ul]);
            rs.push(["1、常规", "下行频点", item.uarfcn_dl]);

            rs.push(["2、位置", "经度", item.longitude.toFixed(4) + "°"]);
            rs.push(["2、位置", "纬度", item.latitude.toFixed(4) + "°"]);
            rs.push(["2、位置", "方向角", Math.round(item.antennadirection) + "°"]);

            return { title: '小区信息', data: rs };
        }
    },
    GetKPIInfo: function (item, isshowdim)
    {
        if (item instanceof MyApp.map.Cell)
        {
            var kpi = this.GetKPI("element_kpi");
            return (kpi) ? kpi.kpis.GetKPIInfo(item, isshowdim) : { title: '指标', data: [] };
        }
        else if (Ext.isNumber(item) && item > -1)
        {
            var kpi = this.GetKPI("polygon_kpi");
            var polycells = this.pbound[item * 5 + 4];
            item = polycells.length > 0 ? polycells[0] : item;

            var kpiinfo = (kpi) ? kpi.kpis.GetKPIInfo(item, isshowdim) : null;
            if (isshowdim && (!kpiinfo || Ext.isEmpty(kpiinfo.data)))
                kpiinfo = this.GetPropertyInfo(item);

            return kpiinfo;
        }
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
        if (Ext.isArray(item))
        {
            var i = 0, result = false;
            while (item[i])
            {
                result = item[i] && this.mapSel[item[i].id];
                if (result)
                    return result;
                i++;
            }
        }
        else
            return item && this.mapSel[item.id];
    },
    HitTest: function (cx, cy, e)
    {
        var cells = this.cells, nCell = cells.length;
        if (nCell == 0)
            return;

        var tile = this.tile;
        var scale = tile.canvasWidth / tile.ViewportW, dx = tile.ViewportX * scale, dy = tile.ViewportY * scale;
        scale /= this.UNIT;

        var ci = this.__hot_cell, cell_scale = this.cell_scale, x, y, a, cstyle;
        do
        {
            if (ci instanceof MyMapCell)
            {
                cstyle = this.GetCellStyle(ci);
                x = ci.x * scale - dx;
                y = ci.y * scale - dy;
                if (ci.offset)
                {
                    a = ci.offsetDirection * Math.PI / 180;
                    x += Math.sin(a) * ci.offset * cell_scale;
                    y -= Math.cos(a) * ci.offset * cell_scale;
                }
                if (this.PtInCell(cx, cy, ci, x, y, ci.radius * cell_scale * 1.2 * cstyle.statscale))
                    break;
            }

            for (var i = nCell; i-- > 0;)
            {
                ci = cells[i];
                cstyle = this.GetCellStyle(ci);
                x = ci.x * scale - dx;
                y = ci.y * scale - dy;
                if (ci.offset)
                {
                    a = ci.offsetDirection * Math.PI / 180;
                    x += Math.sin(a) * ci.offset * cell_scale;
                    y -= Math.cos(a) * ci.offset * cell_scale;
                }
                if (this.PtInCell(cx, cy, ci, x, y, ci.radius * cell_scale * cstyle.statscale))
                    break;
            }

            if (i < 0)
                ci = null;

        } while (false);

        if (e)
        {
            if (this.__hot_cell !== ci && this.ElementVisible)
            {
                for (var i = 0, it, l, t, a, ca, sa; i < 2; i++)
                {
                    it = i ? ci : this.__hot_cell;
                    if (!it)
                        continue;

                    cstyle = this.GetCellStyle(it);
                    l = it.x * scale - dx;
                    t = it.y * scale - dy;
                    if (it.offset)
                    {
                        a = it.offsetDirection * Math.PI / 180;
                        ca = Math.cos(a); sa = Math.sin(a);

                        l += sa * it.offset * cell_scale; t -= ca * it.offset * cell_scale;
                    }
                    a = it.radius * cell_scale * 2 * cstyle.statscale;
                    this.InvalidateRect(l - a, t - a, a + a, a + a);
                }

                this.__hot_cell = ci;
            }
            else if (!this.ElementVisible)
                this.__hot_cell = undefined;

            if (this.PolygonVisible)
            {
                var pve = this.pve;
                var pvx = this.pvx, pvy = this.pvy, pbound = this.pbound;
                var i, n = pve.length, px, py, pw, ph;
                x = (cx + dx) / scale;
                y = (cy + dy) / scale;
                do
                {
                    i = this.__hot_pl;
                    if (i >= 0 && i < n)
                    {
                        if (MyMapBase.PtInPolygon(x, y, pvx, pvy, i > 0 ? pve[i - 1] : 0, pve[i], true) && Ext.isEmpty(this.__hot_cell))
                        {
                            ci = this.__hot_pl;
                            break;
                        }

                        i *= 5;
                        px = pbound[i++]; py = pbound[i++]; pw = pbound[i++], ph = pbound[i++];
                        this.InvalidateRect(px * scale - dx - 3, py * scale - dy - 3, pw * scale + 6, ph * scale + 6);
                    }

                    this.__hot_pl = -1;
                    for (i = n; i-- > 0;)
                    {
                        if (MyMapBase.PtInPolygon(x, y, pvx, pvy, i > 0 ? pve[i - 1] : 0, pve[i], true))
                        {
                            this.__hot_pl = i;
                            i *= 5;
                            px = pbound[i++]; py = pbound[i++]; pw = pbound[i++], ph = pbound[i++];
                            this.InvalidateRect(px * scale - dx - 3, py * scale - dy - 3, pw * scale + 6, ph * scale + 6);
                            break;
                        }
                    }
                    if (this.__hot_pl > -1 && Ext.isEmpty(this.__hot_cell))
                        ci = this.__hot_pl;
                } while (false);
            }
        }

        return ci;
    },
    OnSiteCover: function (site)
    {
        this.sitepolygons = [];
        this.sitecells = [];
        this.coversite = site;
        if (Ext.isEmpty(site))
            return;

        var unit = this.UNIT;
        var x = (site.data && site.data.x ? site.data.x : site.x) * unit, y = (site.data && site.data.y ? site.data.y : site.y) * unit;
        var powdis = site.coverradius * site.coverradius * unit * unit;
        if (this.PolygonVisible)
        {
            var pve = this.pve, n = pve.length;
            if (n > 0)
            {
                var pvx = this.pvx, pvy = this.pvy, pbound = this.pbound;

                var i = 0, j = 0, k, m = 0, cs, fill;
                var isincircle = false;
                for (; i < n; i++, j += 5)
                {
                    isincircle = false;
                    // 判断圆心是否在多边形的矩形范围内, 矩形4个顶点在圆范围内，圆心到4条边的距离小于半径
                    var rect = new MyApp.util.Rect(pbound[j], pbound[j + 1], pbound[j + 2], pbound[j + 3]);
                    var powd1 = Math.pow(rect.left - x, 2) + Math.pow(rect.top - y, 2);
                    var powd2 = Math.pow(rect.right - x, 2) + Math.pow(rect.top - y, 2);
                    var powd3 = Math.pow(rect.right - x, 2) + Math.pow(rect.bottom - y, 2);
                    var powd4 = Math.pow(rect.left - x, 2) + Math.pow(rect.bottom - y, 2);
                    if ((x < rect.left || x > rect.right || y < rect.top || y > rect.bottom)
                        && !(powd1 <= powdis || powd2 <= powdis || powd3 <= powdis || powd4 <= powdis
                        || Math.pow(rect.left - x, 2) <= powdis || Math.pow(rect.right - x, 2) <= powdis
                        || Math.pow(rect.top - y, 2) <= powdis || Math.pow(rect.bottom - y, 2) <= powdis))
                        continue;

                    k = i > 0 ? pve[i - 1] : 0;
                    for (m = pve[i]; k < m; k++)
                    {
                        // 判断多边形的顶点是否在圆形范围内
                        powd1 = Math.pow(pvx[k] - x, 2) + Math.pow(pvy[k] - y, 2);
                        if (powd1 <= powdis)
                        {
                            this.sitepolygons.push(i);
                            isincircle = true;
                            break;
                        }
                        else if (k < m - 1)
                        {
                            // 判断多边形的直线是否穿过圆范围，判断圆心到多边形边的距离小于半径
                            powd1 = MyMapBase.GetPtToLineDistance({ x: x, y: y }, { x: pvx[k], y: pvy[k] }, { x: pvx[k + 1], y: pvy[k + 1] });
                            if (Math.pow(powd1, 2) <= powdis)
                            {
                                this.sitepolygons.push(i);
                                isincircle = true;
                                break;
                            }
                        }
                    }

                    // 判断圆心是否在多边形内
                    if (!isincircle)
                    {
                        var bln = MyMapBase.PtInPolygon(x, y, pvx, pvy, i > 0 ? pve[i - 1] : 0, pve[i], true);
                        if (bln)
                            this.sitepolygons.push(i);
                    }
                }
            }
        }

        if (this.ElementVisible)
        {
            var powd;
            var cells = this.cells, nCell = cells.length;
            for (var i = 0, ci; i < nCell; i++)
            {
                ci = cells[i];
                powd = Math.pow(ci.x / unit - site.x, 2) + Math.pow(ci.y / unit - site.y, 2);
                if (powd <= powdis)
                    this.sitecells.push(i);
            }
        }
    }
});

Ext.require('MyApp.map.CellLayer', function ()
{
    // 基站
    Ext.define('MyApp.map.BTSLayer', {
        extend: 'MyApp.map.CellLayer',
        alias: 'widget.bts_layer',
        img_bts: Ext.apply(new Image(), { src: Ext.Loader.getPath('MyApp') + '/images/icon/bts.png' }),
        img_bts_indoor: Ext.apply(new Image(), { src: Ext.Loader.getPath('MyApp') + '/images/icon/bts_indoor.png' }),
        uri: '/web/jss/map.jss?action=map.GetBts',
        network: undefined,
        GetCellImg: function (cell)
        {
            return cell.cover_type == 2 || cell.cover_type == 3 ? this.img_bts_indoor : this.img_bts;
        },
        GetTip: function (item)
        {
            if (item instanceof MyApp.map.Cell)
                return '<span style="white-space: nowrap"><b>基 站: </b>' + Ext.String.htmlEncode(item.name) + '</span>';
        },
        GetPropertyInfo: function (item)
        {
            if (Ext.isNumber(item) && item > -1)
            {
                var polycells = this.pbound[item * 5 + 4];
                item = polycells.length > 0 ? polycells[0] : item;
            }
            if (item instanceof MyApp.map.Cell)
            {
                var rs = [];
                rs.push(["1、常规", "省份", item.province_name]);
                rs.push(["1、常规", "地市", item.city_name]);
                rs.push(["1、常规", "基站标识", item.id]);
                rs.push(["1、常规", "站名", item.name]);
                rs.push(["1、常规", "所属网格ID", item.phygrid_id]);
                rs.push(["1、常规", "所属网格名称", item.phygrid_name]);

                rs.push(["2、位置", "经度", item.longitude.toFixed(4) + "°"]);
                rs.push(["2、位置", "纬度", item.latitude.toFixed(4) + "°"]);

                var kpi = this.GetKPI("element_kpi");
                var kpi_rs = (kpi) ? kpi.kpis.GetKPIInfo(item) : { title: '指标', data: [] };

                return { title: '基站信息', data: rs };
            }
        }
    });

    // 高铁基站
    Ext.define('MyApp.map.RailBTSLayer', {
        extend: 'MyApp.map.BTSLayer',
        alias: 'widget.railbts_layer',
        uri: '/web/jss/map.jss?action=map.GetRailBts',
        network: undefined,
        GetTip: function (item)
        {
            if (item instanceof MyApp.map.Cell)
                return '<span style="white-space: nowrap"><b>高铁基站: </b>' + Ext.String.htmlEncode(item.name) + '</span>';
        },
        GetPropertyInfo: function (item)
        {
            if (Ext.isNumber(item) && item > -1)
            {
                var polycells = this.pbound[item * 5 + 4];
                item = polycells.length > 0 ? polycells[0] : item;
            }
            if (item instanceof MyApp.map.Cell)
            {
                var rs = [];
                rs.push(["1、常规", "省份", item.province_name]);
                rs.push(["1、常规", "地市", item.city_name]);
                rs.push(["1、常规", "标识", item.id]);
                rs.push(["1、常规", "线路", item.railline_name]);
                rs.push(["1、常规", "物理站址", item.phy_site_name]);
                rs.push(["1、常规", "站名", item.name]);
                rs.push(["1、常规", "区域类型", item.region_type]);
                rs.push(["1、常规", "塔高", item.tower_height]);
                rs.push(["1、常规", "天线高度", item.antenna_height]);

                rs.push(["2、位置", "经度", item.longitude.toFixed(4) + "°"]);
                rs.push(["2、位置", "纬度", item.latitude.toFixed(4) + "°"]);

                return { title: '高铁基站', data: rs };
            }
        }
    });

    // 物理站址
    Ext.define('MyApp.map.PhySiteLayer', {
        extend: 'MyApp.map.BTSLayer',
        alias: 'widget.physite_layer',
        img_site: Ext.apply(new Image(), { src: Ext.Loader.getPath('MyApp') + '/images/icon/site.png' }),
        uri: '/web/jss/map.jss?action=map.GetSite',
        GetCellImg: function (cell)
        {
            return this.img_site;
        },
        GetTip: function (item)
        {
            if (item instanceof MyApp.map.Cell)
                return '<span style="white-space: nowrap"><b>站 址: </b>' + Ext.String.htmlEncode(item.name) + '</span>';
        },
        trans_station_type: function (v)
        {
            switch (v)
            {
                case 1:
                    return '天面';
                case 2:
                    return '机房';
                case 3:
                    return '天面&机房';
            }

            return ' 未知(' + v + ')';
        },
        GetPropertyInfo: function (item)
        {
            if (Ext.isNumber(item) && item > -1)
            {
                var polycells = this.pbound[item * 5 + 4];
                item = polycells.length > 0 ? polycells[0] : item;
            }
            if (item instanceof MyApp.map.Cell)
            {
                var rs = [];
                rs.push(["1、常规", "省份", item.province_name]);
                rs.push(["1、常规", "所属城市标识", item.city_id]);
                rs.push(["1、常规", "所属物理站址名称", item.name]);
                rs.push(["1、常规", "所属物理站址编号", item.id]);
                rs.push(["1、常规", "站址类型", this.trans_station_type(item.station_type)]);
                rs.push(["1、常规", "建设方式", item.construction_type]);
                rs.push(["1、常规", "天线支撑方式", item.attenna_support_type]);
                rs.push(["1、常规", "所属县区", item.related_county]);
                rs.push(["1、常规", "所属物理网格名称", item.phygrid_name]);
                rs.push(["1、常规", "所属物理网格编号", item.phygrid_id]);
                rs.push(["1、常规", "第一归属规划场景类型", item.firstscene_type]);
                rs.push(["1、常规", "第一归属规划场景名称", item.firstscene_name]);

                rs.push(["2、位置", "经度", item.longitude.toFixed(4) + "°"]);
                rs.push(["2、位置", "纬度", item.latitude.toFixed(4) + "°"]);

                return { title: '站址信息', data: rs };
            }
        }
    });

    // 楼宇
    Ext.define('MyApp.map.ResidenceLayer', {
        extend: 'MyApp.map.CellLayer',
        alias: 'widget.residence_layer',
        img_residence: Ext.apply(new Image(), { src: Ext.Loader.getPath('MyApp') + '/images/icon/bts_indoor.png' }),
        uri: '/web/jss/map.jss?action=map.GetResidence',
        GetCellImg: function (cell)
        {
            return this.img_residence;
        },
        GetTip: function (item)
        {
            if (item instanceof MyApp.map.Cell)
                return '<span style="white-space: nowrap"><b>楼 宇: </b>' + Ext.String.htmlEncode(item.name) + '</span>';
        },
        GetPropertyInfo: function (item)
        {
            if (Ext.isNumber(item) && item > -1)
            {
                var polycells = this.pbound[item * 5 + 4];
                item = polycells.length > 0 ? polycells[0] : item;
            }
            if (item instanceof MyApp.map.Cell)
            {
                var rs = [];
                rs.push(["1、楼宇基本信息", "楼宇编号", item.id]);
                rs.push(["1、楼宇基本信息", "楼宇名称", item.name]);
                rs.push(["1、楼宇基本信息", "已覆盖网络制式", item.coverd_network]);
                rs.push(["1、楼宇基本信息", "区域类型", item.area_type]);
                rs.push(["1、楼宇基本信息", "区域子类型", item.area_subtype]);
                rs.push(["1、楼宇基本信息", "楼宇类型", item.building_type]);
                rs.push(["1、楼宇基本信息", "楼宇重要性", item.important_of_building]);
                rs.push(["1、楼宇基本信息", "网格类型", item.grid_type]);
                rs.push(["1、楼宇基本信息", "建筑面积(万m2)", item.building_area]);
                rs.push(["1、楼宇基本信息", "最高楼层数", item.max_floorsnum]);
                rs.push(["1、楼宇基本信息", "地下楼层数", item.under_floorsnum]);
                rs.push(["1、楼宇基本信息", "人员流量/员工人数(人)", item.staffs_num]);

                rs.push(["2、无线网络资源现状", "覆盖方式", item.cover_method]);
                rs.push(["2、无线网络资源现状", "需室分覆盖面积(万m2)", item.room_cover_area_needed]);
                rs.push(["2、无线网络资源现状", "室分已覆盖面积(万m2)", item.room_cover_area_already]);
                rs.push(["2、无线网络资源现状", "LTE制式", item.ltetype]);
                rs.push(["2、无线网络资源现状", "LTE信源通道配置", item.ltechcfg]);
                rs.push(["2、无线网络资源现状", "LTE信源设备配置", item.ltedevcfg]);
                rs.push(["2、无线网络资源现状", "3G制式", item.wtype]);
                rs.push(["2、无线网络资源现状", "3G信源设备配置", item.wdevcfg]);

                return { title: '楼宇信息', data: rs };
            }
        }
    });

    // 基础图层的站点
    Ext.define('MyApp.map.BaseSiteLayer', {
        extend: 'MyApp.map.CellLayer',
        alias: 'widget.basesite_layer',
        img_src: '/images/icon/bts_indoor.png',
        uri: '/web/jss/map.jss?action=map.GetCoverBts',
        isbase: true,
        tiptitle: '',
        propertyinfo: { title: '信息', rs: [['1、基本信息', '编号', 'id'], ['1、基本信息', '名称', 'name']] },
        constructor: function (config)
        {
            Ext.apply(this, config);
            Object.defineProperties(this, {
                img_pt: { value: Ext.apply(new Image(), { src: Ext.Loader.getPath('MyApp') + this.img_src }) }
            });
            this.callParent(arguments);
        },
        GetCellImg: function (cell)
        {
            return this.img_pt;
        },
        GetTip: function (item)
        {
            if (item instanceof MyApp.map.Cell)
                return '<span style="white-space: nowrap"><b>' + this.tiptitle + ': </b>' + Ext.String.htmlEncode(item.name) + '</span>';
        },
        GetPropertyInfo: function (item)
        {
            if (Ext.isNumber(item) && item > -1)
            {
                var polycells = this.pbound[item * 5 + 4];
                item = polycells.length > 0 ? polycells[0] : item;
            }
            if (item instanceof MyApp.map.Cell)
            {
                var rs = [], title;

                if (this.propertyinfo)
                {
                    var proprs = this.propertyinfo.rs;
                    for (var i = 0, m = proprs.length; i < m; i++)
                    {
                        rs.push([proprs[i][0], proprs[i][1], item[proprs[i][2]] || '']);
                    }

                    title = this.propertyinfo.title;
                }

                return { title: title, data: rs };
            }
        }
    });

    // 扇区
    Ext.define('MyApp.map.SectorLayer', {
        extend: 'MyApp.map.CellLayer',
        alias: 'widget.sector_layer',
        uri: '/web/jss/map.jss?action=map.GetSector',
        GetTip: function (item)
        {
            if (item instanceof MyApp.map.Cell)
                return '<span style="white-space: nowrap"><b>扇 区: </b>' + Ext.String.htmlEncode(item.name) + '</span>';
        },
        GetPropertyInfo: function (item)
        {
            if (Ext.isNumber(item) && item > -1)
            {
                var polycells = this.pbound[item * 5 + 4];
                item = polycells.length > 0 ? polycells[0] : item;
            }
            if (item instanceof MyApp.map.Cell)
            {
                var rs = [];
                rs.push(["1、常规", "省份", item.province_name]);
                rs.push(["1、常规", "地市", item.city_name]);
                rs.push(["1、常规", "扇区标识", item.sector_id]);
                rs.push(["1、常规", "所属网格ID", item.phygrid_id]);
                rs.push(["1、常规", "所属网格名称", item.phygrid_name]);
                rs.push(["1、常规", "站址", item.phy_location_id]);

                rs.push(["2、位置", "经度", item.longitude.toFixed(4) + "°"]);
                rs.push(["2、位置", "纬度", item.latitude.toFixed(4) + "°"]);
                rs.push(["2、位置", "方向角", Math.round(item.antennadirection) + "°"]);

                var kpi = this.GetKPI("element_kpi");
                var kpi_rs = (kpi) ? kpi.kpis.GetKPIInfo(item) : { title: '指标', data: [] };

                return { title: '扇区信息', data: rs };
            }
        }
    });

    // 天面
    Ext.define('MyApp.map.SurfaceLayer', {
        extend: 'MyApp.map.CellLayer',
        alias: 'widget.surface_layer',
        uri: '/web/jss/map.jss?action=map.GetSurface',
        GetTip: function (item)
        {
            if (item instanceof MyApp.map.Cell)
                return '<span style="white-space: nowrap"><b>天 面: </b>' + Ext.String.htmlEncode(item.name) + '</span>';
        },
        GetPropertyInfo: function (item)
        {
            if (Ext.isNumber(item) && item > -1)
            {
                var polycells = this.pbound[item * 5 + 4];
                item = polycells.length > 0 ? polycells[0] : item;
            }
            if (item instanceof MyApp.map.Cell)
            {
                var rs = [];
                rs.push(["1、常规", "省份", item.province_name]);
                rs.push(["1、常规", "地市", item.city_name]);
                rs.push(["1、常规", "天面标识", item.id]);
                rs.push(["1、常规", "所属站址", item.phy_location_id]);
                rs.push(["1、常规", "所属网格", item.phygrid_id]);
                rs.push(["1、常规", "归属场景", item.firstscene_type]);
                rs.push(["1、常规", "归属场景名单", item.firstscene_name]);

                rs.push(["2、位置", "经度", item.longitude.toFixed(4) + "°"]);
                rs.push(["2、位置", "纬度", item.latitude.toFixed(4) + "°"]);

                return { title: '天面信息', data: rs };
            }
        }
    });

    // 圆点图层
    Ext.define('MyApp.map.DotLayer', {
        extend: 'MyApp.map.CellLayer',
        alias: 'widget.dot_layer',
        radius: 6,
        RelocateCell: function (cells, ve)
        {
        },
        OnLoad: function (result, error)
        {
        },
        OnLoadKpis: function ()
        {
            this.callParent(arguments);
            this.cells.length = 0;
            var element_kpi = this.GetKPI("element_kpi");
            if (!(Ext.isEmpty(element_kpi) || Ext.isEmpty(element_kpi.kpis) || Ext.isEmpty(element_kpi.kpis.kpidata)))
            {
                //var result = { headers: [], data: [] };
                //result.headers = [{ "name": "id", "nameCn": "ID" }, { "name": "longitude", "nameCn": "经度" }, { "name": "latitude", "nameCn": "纬度" }];
                //result.data = [[1, 117.0777, 39.1161], [1, 117.0789, 39.1191]];

                var result = element_kpi.kpis.kpidata;
                delete this.__hot_cell;
                delete this.__hot_pl;
                this.pve.length = 0;
                var table = result.data, cell_type = MyMapCell.GetImpl(result.headers);
                var cells = this.cells, unit = this.UNIT, nCell = Ext.isEmpty(table) ? 0 : table.length;
                cells.length = nCell;

                for (var i = 0, ci; i < nCell; i++)
                {
                    ci = new cell_type(table[i]);
                    MyMapBase.GeographicToLogical(ci);
                    ci.x *= unit;
                    ci.y *= unit;
                    ci.radius = this.radius;
                    ci.offset = 0;
                    ci.offsetDirection = 0;
                    ci.polygon = -1;

                    cells[i] = ci;
                }
            }
            this.task.Add(this.Invalidate, this);
        },
        GetTip: function (item)
        {
        },
        GetPropertyInfo: function (item)
        {
        }
    });

    // 图钉图层
    Ext.define('MyApp.map.PinLayer', {
        extend: 'MyApp.map.DotLayer',
        alias: 'widget.pin_layer',
        pinheight: 14,
        radius: 7,
        OnLoadKpis: function ()
        {
        },
        DrawCell: function (ctx, item, x, y, radius, fillStyle)
        {
            ctx.beginPath();
            ctx.moveTo(x - 1, y);
            ctx.lineTo(x - 1, y - this.pinheight * this.cell_scale);
            ctx.lineTo(x, y - this.pinheight * this.cell_scale);
            ctx.arc(x, y - this.pinheight * this.cell_scale, radius, Math.PI / 2, Math.PI * 2 + Math.PI / 2, false);
            ctx.lineTo(x + 1, y - this.pinheight * this.cell_scale);
            ctx.lineTo(x + 1, y);
            ctx.closePath();
            ctx.fillStyle = fillStyle;
            ctx.fill();
        },
        PtInCell: function (ptx, pty, it, x, y, radius)
        {
            var dx = ptx - x, dy = pty - (y - this.pinheight * this.cell_scale);
            if (dx * dx + dy * dy > radius * radius)
                return false;
            else
                return true;
        },
        GetTip: function (item)
        {
        },
        InvalidateRect: function (l, t, w, h)
        {
            this.Invalidate();
        }
    });
});