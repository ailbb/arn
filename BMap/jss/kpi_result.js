var kpi_result = {
    GetColumnIndex: function (headers)
    {
        var ci = {};
        for (var i = headers.size(); i-- > 0; )
        {
            ci[headers.get(i).getName()] = i;
        }

        return ci;
    },
    AddCol: function (headers, name)
    {
        var col = new com.broadtech.unicom.service.bo.ResponseHeader();
        col.setName(name);
        headers.add(col);
        return col;
    },
    AddXY: function (result)
    {
        var headers = result.get('headers'), data = result.get('data'), ci = this.GetColumnIndex(headers);

        if (!('longitude' in ci && 'latitude' in ci))
            return;

        this.AddCol(headers, 'x');
        this.AddCol(headers, 'y');

        var pt = new com.broadtech.unicom.common.Voronoi.Point();
        for (var i = data.size(), row, x, y; i-- > 0; )
        {
            row = data.get(i);
            pt.Reset(row.get(ci.longitude), row.get(ci.latitude));
            GpsOffset.GpsToLogical(pt);
            row.add(pt.x);
            row.add(pt.y);
        }
    },
    AdjustGrid: function (result)
    {
        var headers = result.get('headers'), data = result.get('data'), ci = this.GetColumnIndex(headers);

        this.AddCol(headers, 'minx');
        this.AddCol(headers, 'miny');
        this.AddCol(headers, 'maxx');
        this.AddCol(headers, 'maxy');

        var pt = new com.broadtech.unicom.common.Voronoi.Point();
        for (var i = data.size(), row, x, y; i-- > 0; )
        {
            row = data.get(i);
            pt.Reset(row.get(ci.minlongitude), row.get(ci.minlatitude));
            GpsOffset.GpsToLogical(pt);
            x = pt.x; y = pt.y;
            pt.Reset(row.get(ci.maxlongitude), row.get(ci.maxlatitude));
            GpsOffset.GpsToLogical(pt);

            row.add(Math.min(x, pt.x));
            row.add(Math.min(y, pt.y));
            row.add(Math.max(x, pt.x));
            row.add(Math.max(y, pt.y));
        }
    },
    query: function (sc)
    {
        try
        {
            var result = com.broadtech.unicom.service.ServiceHandlerTemplateFactory.getDefaultServiceHandlerTemplate().serviceHandler(sc.GetString('json'));
            if (!result)
                throw '业务处理失败！';

            var filters = sc.GetString('filters');
            if (jss.isEmpty(filters))
                return result;

            filters = jss.decode(filters);
            if (!filters)
                return result;

            var tm = java.lang.System.currentTimeMillis();
            for (var i in filters)
            {
                if (!filters[i])
                    continue;

                var fn = this[i];
                if (jss.isFunction(fn))
                    fn.apply(this, [result]);
            }

            jss.log('指标转换用时: ' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');

            return result;
        }
        catch (e)
        {
            return { success: false, msg: e.toString() };
        }
    }
};