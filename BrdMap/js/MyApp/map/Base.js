Ext.define('MyApp.map.Base', {
    alternateClassName: 'MyMapBase',
    statics: {
        ZERO: 0.000000000001,
        EARTH_RADIUS: 6378137.0,
        LogicalToGeographic: function (pt)
        {
            pt.longitude = (pt.x - 0.5) * (180 / Math.PI) / 0.159154943091895;
            pt.latitude = Math.atan(Math.sinh((pt.y - 0.5) / (-0.159154943091895))) * (180 / Math.PI);
            return pt;
        },
        GeographicToLogical: function (pt)
        {
            var d = Math.sin(pt.latitude * (Math.PI / 180));
            pt.x = (pt.longitude * (Math.PI / 180) * 0.159154943091895) + 0.5;
            pt.y = (0.5 * Math.log((1.0 + d) / (1.0 - d)) * (-0.159154943091895)) + 0.5;
            return pt;
        },
        LogicalOffsetVal: function (x, y, dxMeter, dyMeter)
        {
            //            var geopt = this.LogicalToGeographic({ x: x, y: y });
            //            var offsetpt = this.GeoOffset(geopt.longitude, geopt.latitude, dxMeter, dyMeter);
            //            offsetpt = this.GeographicToLogical({ longitude: offsetpt[0], latitude: offsetpt[1] });
            var offsetpt = this.LogicalOffset(x, y, dxMeter, dyMeter);
            return [offsetpt[0] - x, offsetpt[1] - y];
        },
        LogicalOffset: function (x, y, dxMeter, dyMeter)
        {
            var geopt = this.LogicalToGeographic({ x: x, y: y });
            var offsetpt = this.GeoOffset(geopt.longitude, geopt.latitude, dxMeter, dyMeter);
            offsetpt = this.GeographicToLogical({ longitude: offsetpt[0], latitude: offsetpt[1] });
            return [offsetpt.x, offsetpt.y];
        },
        GeoOffsetVal: function (lon, lat, dxMeter, dyMeter)
        {
            var c = 180.0 / Math.PI / this.EARTH_RADIUS;
            var dLat = dyMeter * c;
            var dLon = dxMeter * c / Math.cos((lat + dLat / 2) * Math.PI / 180.0);

            return [dLon, dLat];
        },
        GeoOffset: function (lon, lat, dxMeter, dyMeter)
        {
            var offset = this.GeoOffsetVal(lon, lat, dxMeter, dyMeter);
            return [lon + offset[0], lat + offset[1]];
        },
        getGeoDistance: function (lon1, lat1, lon2, lat2)
        {
            var radLat1 = lat1 * Math.PI / 180.0, radLat2 = lat2 * Math.PI / 180.0;
            var dLat = radLat2 - radLat1, dLon = (lon2 - lon1) * Math.PI / 180.0;

            return this.EARTH_RADIUS * 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(dLat / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(dLon / 2), 2)));
        },
        GetPtToLineDistance: function (pt, pt1, pt2)
        {
            //点到线段的最短距离，如果点不在与线段垂直的矩形范围内，则点到线段2个端点的最小距离做为最小距离    	
            if (this.isPointOnLine(pt, pt1, pt2))
                return 0;
            // d12²≤|d2²-d1²|若不等式成立，则点不在与线段垂直的矩形范围内，否则求点到线段的垂直距离
            var powd1 = Math.pow(pt1.x - pt.x, 2) + Math.pow(pt1.y - pt.y, 2);
            var d1 = Math.sqrt(powd1);

            var powd2 = Math.pow(pt2.x - pt.x, 2) + Math.pow(pt2.y - pt.y, 2);
            var d2 = Math.sqrt(powd2);

            var powd12 = Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2);
            var d12 = Math.sqrt(powd12);

            if (powd12 <= Math.abs(powd1 - powd2))
                return Math.min(d1, d2); // 钝角三角形
            else
            {
                // 海伦公式计算得到面积，除以底边d12则为三角形的高 S=√p(p-a)(p-b)(p-c)， p=(a+b+c)/2
                var p = (d1 + d2 + d12) / 2;
                var s = Math.sqrt(p * (p - d1) * (p - d2) * (p - d12));
                return s / d12 * 2;
            }
        },
        isPointOnLine: function (point, linePoint1, linePoint2)
        {
            var result = false;
            // 满足叉积的结构条件来判断点是否在线段上
            if ((Math.abs(this.CrossMul(point.x, point.y, linePoint1.x, linePoint1.y, linePoint2.x, linePoint2.y)) < this.ZERO)
                && ((point.x - linePoint1.x) * (point.x - linePoint2.x) <= 0)
                && ((point.y - linePoint1.y) * (point.y - linePoint2.y) <= 0))
            {
                result = true;
            }
            return result;
        },
        isLinesIntersect: function (line1Point1, line1Point2, line2Point1, line2Point2)
        {
            var result = false;
            // 得到2个线段间的斜率差
            var d = (line1Point2.x - line1Point1.x) * (line2Point2.y - line2Point1.y) - (line1Point2.y - line1Point1.y) * (line2Point2.x - line2Point1.x);
            if (d != 0)
            {
                var r = ((line1Point1.y - line2Point1.y) * (line2Point2.x - line2Point1.x) - (line1Point1.x - line2Point1.x) * (line2Point2.y - line2Point1.y)) / d;
                var s = ((line1Point1.y - line2Point1.y) * (line1Point2.x - line1Point1.x) - (line1Point1.x - line2Point1.x) * (line1Point2.y - line1Point1.y)) / d;
                if ((r >= 0) && (r <= 1) && (s >= 0) && (s <= 1))
                {
                    result = true;
                }
            }
            return result;
        },
        CrossMul: function (x0, y0, x1, y1, x2, y2)
        {
            return (y1 - y0) * (x2 - x0) - (y2 - y0) * (x1 - x0);
        },
        Between: function (v, a, b) // 验证值是否位于[a, b]表示的闭区间, 不要求a<b
        {
            return a < b ? v >= a - this.ZERO && v <= b + this.ZERO : v >= b - this.ZERO && v <= a + this.ZERO;
        },
        GetLineCrossPoint: function (x11, y11, x12, y12, x21, y21, x22, y22) // 未验证交点是否在线段上
        {
            var x0 = (x11 + x12 + x21 + x22) / 4, y0 = (y11 + y12 + y21 + y22) / 4;
            x11 -= x0; x12 -= x0; x21 -= x0; x22 -= x0;
            y11 -= y0; y12 -= y0; y21 -= y0; y22 -= y0;

            var a1 = y11 - y12, b1 = x12 - x11;
            var a2 = y21 - y22, b2 = x22 - x21;
            var d = a1 * b2 - a2 * b1;
            if (Math.abs(d) <= this.ZERO)
                return;

            var c1 = x11 * y12 - y11 * x12, c2 = x21 * y22 - y21 * x22;
            return { x: x0 + (b1 * c2 - b2 * c1) / d, y: y0 + (c1 * a2 - c2 * a1) / d };
        },
        GetCrossPoint: function (vx, vy, x21, y21, x22, y22)
        {
            var pts = [], n = vx.length;
            if (n < 2)
                return pts;

            var x11 = vx[0], y11 = vy[0], x12, y12, pc;
            for (var i = 0; i < n; x11 = x12, y11 = y12, i++)
            {
                x12 = vx[i]; y12 = vy[i];
                pc = this.GetLineCrossPoint(x11, y11, x12, y12, x21, y21, x22, y22);
                if (pc && this.Between(pc.x, x11, x12) && this.Between(pc.y, y11, y12) && this.Between(pc.x, x21, x22) && this.Between(pc.y, y21, y22))
                    pts.push(pc);
            }

            return pts;
        },
        // 判断一个坐标点是否在多边形内，通过点的水平射线与多边形的交点个数来判断
        PtInAnyPolygon: function (listPolyline, point)
        {
            if (Ext.isEmpty(listPolyline))
                return false;
            var n = listPolyline.length;
            if (n < 3)
                return false;

            // 记录点是否在多边形中的结果
            var result = false;

            var count = 0; // 记录点的水平射线与多边形各边线的交点个数
            // point为水平射线的起点坐标，射线设置为点到1000000000的水平射线
            var radialPoint = { x: 10000000000, y: point.y };
            var pt, nextpt;
            // 循环多变形的所有点，构成多边形的边线
            for (var i = 0; i < n - 1; i++)
            {
                pt = { x: listPolyline[i][0], y: listPolyline[i][1] };
                nextpt = { x: listPolyline[i + 1][0], y: listPolyline[i + 1][1] };
                // 如果传入的点在多边形上则直接返回true表示点在多边形内
                if (this.isPointOnLine(point, pt, nextpt))
                {
                    return true;
                }
                // 如果多边形的边是水平的，则不作为点是否在多边形内的判断
                if (Math.abs(nextpt.y - pt.y) < this.ZERO)
                {
                    continue;
                }
                // 判断多边形的点是否在点的水平射线上
                if (this.isPointOnLine(pt, point, radialPoint))
                {
                    // 如果多边形的1端点在水平射线上，并且1端点是在边线的上方，则交点个数加1
                    if (pt.y > nextpt.y)
                        count++;
                }
                else if (this.isPointOnLine(nextpt, point, radialPoint))
                {
                    // 如果多边形的2端点在水平射线上，并且2端点是在边线的上方，则交点个数加1
                    if (nextpt.y > pt.y)
                        count++;
                }
                else if (this.isLinesIntersect(pt, nextpt, point, radialPoint))
                {
                    // 判断水平射线与多边形边线有交点，则交点个数加1
                    count++;
                }
            }
            // 根据交点个数的奇偶判断点是否在多边形内部
            if (count % 2 == 1)
            {
                // 奇数个交点则表示点在多边形内部
                result = true;
            }
            return result;
        },
        PtInPolygon: function (x, y, vx, vy, first, last, clockwise)
        {
            if (first === undefined)
                first = 0;
            if (last === undefined)
                last = Math.min(vx.length, vy.length);

            var n = last - first;
            if (n < 2)
                return false;

            var i = first, x0, y0, x1, y1;
            if (clockwise === undefined)
            {
                if (n < 3)
                    return false;

                var d, x2, y2;
                x0 = vx[i]; y0 = vy[i++];
                x1 = vx[i]; y1 = vy[i++];
                for (; i < last; i++, x0 = x1, y0 = y1, x1 = x2, y1 = y2)
                {
                    x2 = vx[i]; y2 = vy[i];
                    d = this.CrossMul(x0, y0, x1, y1, x2, y2);
                    if (d < -this.ZERO)
                    {
                        clockwise = true;
                        break;
                    }
                    else if (d > this.ZERO)
                    {
                        clockwise = false;
                        break;
                    }
                }

                if (i == last)
                    return false;

                i = first;
            }

            x0 = vx[i]; y0 = vy[i];
            if (clockwise)
            {
                for (i++; i < last; i++, x0 = x1, y0 = y1)
                {
                    x1 = vx[i]; y1 = vy[i];
                    if (this.CrossMul(x0, y0, x1, y1, x, y) > this.ZERO)
                        return false;
                }
            }
            else
            {
                for (i++; i < last; i++, x0 = x1, y0 = y1)
                {
                    x1 = vx[i]; y1 = vy[i];
                    if (this.CrossMul(x1, y1, x0, y0, x, y) > this.ZERO)
                        return false;
                }
            }

            return true;
        },
        GetRadian: function (x0, y0, x1, y1)
        {
            var dx = x1 - x0, dy = y1 - y0;
            if (dx > 0) // 1, 4
                return Math.atan(dy / dx) + (dy < 0 ? Math.PI * 2 : 0);
            else if (dx < 0) // 2, 3
                return Math.PI + Math.atan(dy / dx);
            else if (dy > 0)
                return Math.PI / 2;
            else if (dy < 0)
                return Math.PI * 3 / 2;

            throw "同一点无法确定角度";
        },
        HullPointCmp: function (x0, y0, x1, y1, x2, y2)
        {
            var d = this.GetRadian(x0, y0, x1, y1) - this.GetRadian(x0, y0, x2, y2);
            if (d < 0)
                return -1;
            else if (d > 0)
                return 1;

            d = (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0) - (x2 - x0) * (x2 - x0) - (y2 - y0) * (y2 - y0);

            if (d < 0)
                return -1;
            else if (d > 0)
                return 1;

            return 0;
        },
        GetCircumcenter: function (x0, y0, x1, y1, x2, y2)
        {
            var x, y;
            var dx1 = x1 - x0, dy1 = y1 - y0;
            var dx2 = x2 - x1, dy2 = y2 - y1;

            var mx1 = (x0 + x1) / 2, my1 = (y0 + y1) / 2;
            var mx2 = (x1 + x2) / 2, my2 = (y1 + y2) / 2;

            if (dy1 == 0)
            {
                if (dy2 == 0)
                    return;

                x = mx1;
                y = -dx2 / dy2 * (x - mx2) + my2;
            }
            else if (dy2 == 0)
            {
                x = mx2;
                y = -dx1 / dy1 * (x - mx1) + my1;
            }
            else
            {
                var k1 = -dx1 / dy1, k2 = -dx2 / dy2;
                if (Math.abs(k1 - k2) < this.ZERO)
                    return;

                x = (k1 * mx1 - k2 * mx2 + my2 - my1) / (k1 - k2);
                y = k1 * (x - mx1) + my1;
            }

            return { x: x, y: y };
        },
        AngleNormalize: function (a)
        {
            if (a)
            {
                a %= 360;
                return a < 0 ? a + 360 : a;
            }
            return 0;
        },
        __CreateAccessor: function (iCol, r, w)
        {
            var a = {};
            if (r)
                a.get = function () { return this.__data[iCol]; };
            if (w)
                a.set = function (v) { this.__data[iCol] = v; };
            return a;
        },
        GetImplByJTH/*JsonTableHead*/: function (hr, superclass, add_fields)
        {
            var superName = (superclass || Ext.Base).$className;

            var nCol = hr.length, tid = superName + '_', name, mapCol = {}, ps = {};
            for (var i = 0; i < nCol; i++)
            {
                name = hr[i];
                if (Ext.isObject(name))
                    name = Ext.isEmpty(name.Name) ? name.name : name.Name;
                name = name.toLowerCase();
                tid += name + i;
                mapCol[name] = i;

                ps[name] = this.__CreateAccessor(i, true, false);
            }

            var types = this.types, type;
            if (types)
            {
                for (var i = types.length; i-- > 0; )
                {
                    type = types[i];
                    if (type.tid == tid)
                        return type;
                }
            }
            else
                this.types = types = [];

            type = Ext.define(superName + 'Impl' + types.length, {
                extend: superName,
                statics: { tid: tid },
                constructor: function (data)
                {
                    this.__data = data;
                    this.callParent(arguments);
                },
                setData: function (data)
                {
                    this.__data = data;
                }
            });

            if (add_fields)
            {
                for (var i = 0, n = add_fields.length; i < n; i++)
                {
                    name = add_fields[i];
                    ps[name] = this.__CreateAccessor(name in mapCol ? mapCol[name] : nCol++, true, true);
                }
            }

            Object.defineProperties(type.prototype, ps);
            types.push(type);

            return type;
        },
        MakeMaskImg: function (img, clr)
        {
            if (!(img && img.complete && img.width))
                return;

            var rgba = MyCommon.parseColor(clr);
            if (!Ext.isArray(rgba) || rgba.length != 4)
                return img;

            var key = '__img_' + rgba.join('_');
            var canvas = img[key];
            if (canvas)
                return canvas;

            var r = rgba[0], g = rgba[1], b = rgba[2], a = rgba[3];
            var w = img.width, h = img.height;

            canvas = document.createElement('canvas');
            img[key] = canvas;
            canvas.width = w; canvas.height = h;

            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(img, 0, 0);

            var iData = ctx.getImageData(0, 0, w, h), data = iData.data, n = data.length, gray = 0, i, s;
            for (i = 0; i < n; i += 4)
            {
                if (data[i + 3] && (data[i] != data[i + 1] || data[i] != data[i + 2]))
                    gray = Math.max(gray, data[i] = (0.30 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2]) * data[i + 3] / 255);
            }
            for (i = 0; i < n; i += 4)
            {
                if (!data[i + 3] || (data[i] == data[i + 1] && data[i] == data[i + 2]))
                    continue;

                s = gray ? data[i] / gray : 1;
                data[i] = r * s;
                data[i + 1] = g * s;
                data[i + 2] = b * s;
                data[i + 3] *= a;
            }

            ctx.clearRect(0, 0, w, h);
            ctx.putImageData(iData, 0, 0);

            return canvas;
        }
    }
});
