Ext.define('MyApp.map.kpi', {
    extend: 'MyApp.map.Base',
    alias: 'widget.my_map_kpi',
    requires: ['MyApp.map.Legend'],
    statics: {
        //threshold_cmp: function (a, b) { return Ext.isNumber(a) ? (Ext.isNumber(b) ? a - b : -1) : (Ext.isNumber(b) ? 1 : 0); }
    },
    title: 'RSRQ(dB)',
    field: 'RSRQ',
    thresholds: undefined,//[{ threshold: 25, color: 'red' }, { threshold: 50, color: 'green' }, { threshold: 75, color: 'blue' }, { color: 'rgb(0,255,255)' }],
    constructor: function (config)
    {
        this.initialConfig = config || {};
        Ext.apply(this, config);

        this.callParent(arguments);

        if (!this.name)
            this.name = this.field;

        if (this.thresholds)
        {
            if (!Ext.isArray(this.thresholds))
                this.thresholds = [this.thresholds];
        }
        else
            this.thresholds = [];

        if (this.threshold_cmp)
        {
            this.thresholds.sort(Ext.pass(function (a, b)
            {
                return this.threshold_cmp(a.threshold, b.threshold);
            }, undefined, this.self));
        }
    },
    init: function (kpis)
    {
        this.init = Ext.emptyFn;
        this.kpis = kpis;
    },
    destroy: function ()
    {
        delete this.kpis;
    },
    lock: function (layer)
    {
        this.kpis.lock();
        // 图例处理
        this.showlegend(this.thresholds);
    },
    kpidimfilter: function (dim) { this.kpis.kpidimfilter(dim); },
    unlock: function () { this.kpis.unlock(); },
    UpdateBound: function (minLon, minLat, maxLon, maxLat)
    {
        if (this.kpis)
            this.kpis.UpdateBound(minLon, minLat, maxLon, maxLat);
    },
    LoadKpiStat: function (isreload)
    {
        if (this.kpis)
            this.kpis.LoadKpiStat(this, isreload);
    },
    showlegend: function (legend)
    {
        if (this.kpis.cmp["kpiLegend"])
            this.kpis.cmp.remove(this.kpis.cmp["kpiLegend"]);

        // 构造图例颜色的对象数组
        if (Ext.isEmpty(legend) || legend.length == 0)
            return;

        var rangs = legend, legenditems = [];
        for (var i = 0, count = rangs.length; i < count; i++)
        {
            var legendrow = {};

            var clr = MyApp.util.Common.parseColor(rangs[i].color);
            legendrow.color = MyApp.util.Common.rgba(clr[0], clr[1], clr[2], 0.6);
            legendrow.text = !Ext.isEmpty(rangs[i].title) ? rangs[i].title : (!Ext.isEmpty(rangs[i].threshold) ? rangs[i].threshold : "");

            if (rangs[i].count)
                legendrow.count = '(' + rangs[i].count + ')';

            legenditems.push(legendrow);
        }

        var x = this.kpis.cmp.add({
            xtype: 'map_legend', name: 'kpiLegend', title: legend.title, draggable: false, autoShow: true, vertical: true,
            autoAlign: 'br-br', offsets: [-6, -46], opacity: 0.95,
            items: legenditems
        });

        x.removeAll();
        x.add(legenditems);
    },
    GetKPIRow: function (item)
    {
        return this.kpis.GetRow(item);
    },
    CreateKPIRow: function (item)
    {
        return this.kpis.CreateRow(item);
    },
    GetKPIColHeader: function ()
    {
        return this.kpis.GetKPIHeader(this.field);
    },
    GetKPIVal: function (item)
    {
        return this.kpis.GetKPIVal(item, this.field);
    },
    GetKPIColor: function (item)
    {
        var val = this.GetKPIVal(item);
        // 根据值获取颜色
        var color = this.GetLegendColor(val);
        return color ? MyApp.util.Common.rgba(color[0], color[1], color[2], 0.3) : null;
    },
    GetKPIColorRGB: function (item)
    {
        var val = this.GetKPIVal(item);
        // 根据值获取颜色
        return this.GetLegendColor(val);
    },
    GetLegendColor: function (val)
    {
        if (Ext.isEmpty(val))
            return null;

        for (var i = 0, count = this.thresholds.length; i < count; i++)
        {
            var t = this.thresholds[i];
            if (val == t.threshold)
            {
                var color = MyApp.util.Common.parseColor(t.color);
                return color; //MyApp.util.Common.rgba(color[0], color[1], color[2], Ext.isEmpty(color[3]) ? 0.3 : color[3] / 255);
            }
        }

        return null;
    }
});

Ext.define('MyApp.map.kpicmp', {
    extend: 'MyApp.map.kpi',
    alias: 'widget.my_map_kpicmp',
    statics: {
        threshold_cmp: function (a, b) { return Ext.isNumber(a) ? (Ext.isNumber(b) ? a - b : -1) : (Ext.isNumber(b) ? 1 : 0); }
    },
    showlegend: function (legend)
    {
        if (this.kpis.cmp["kpiLegend"])
            this.kpis.cmp.remove(this.kpis.cmp["kpiLegend"]);

        if (Ext.isEmpty(legend) || legend.length == 0)
            return;

        var rangs = legend, legenditems = [];
        for (var i = 0, count = rangs.length; i < count; i++)
        {
            var legendrow = {};

            var clr = MyApp.util.Common.parseColor(rangs[i].color);
            legendrow.color = MyApp.util.Common.rgba(clr[0], clr[1], clr[2], 0.6);

            legendrow.text = "";
            if (i == 0)
            {
                legendrow.text = "≤ " + (!Ext.isEmpty(rangs[i].title) ? rangs[i].title : (!Ext.isEmpty(rangs[i].threshold) ? rangs[i].threshold : ""));
                if (count == 1)
                    legendrow.text = "〉" + (!Ext.isEmpty(rangs[i].title) ? rangs[i].title : (!Ext.isEmpty(rangs[i].threshold) ? rangs[i].threshold : ""));
            }
            else if (i == count - 1)
                legendrow.text = "〉" + (!Ext.isEmpty(rangs[i - 1].title) ? rangs[i - 1].title : (!Ext.isEmpty(rangs[i - 1].threshold) ? rangs[i - 1].threshold : ""));
            else
                legendrow.text = (!Ext.isEmpty(rangs[i - 1].title) ? rangs[i - 1].title : (!Ext.isEmpty(rangs[i - 1].threshold) ? rangs[i - 1].threshold : ""))
                    + " ~ " + (!Ext.isEmpty(rangs[i].title) ? rangs[i].title : (!Ext.isEmpty(rangs[i].threshold) ? rangs[i].threshold : ""));

            if (rangs[i].count)
                legendrow.count = '(' + rangs[i].count + ')';
            //if (i == 0 && !Ext.isEmpty(rangs[i].threshold))
            //    continue;
            //else if (i == 0 && count > 1 && Ext.isEmpty(rangs[i].threshold))
            //{
            //    legendrow.text = "≤ " + (!Ext.isEmpty(rangs[i + 1].title) ? rangs[i + 1].title : (!Ext.isEmpty(rangs[i + 1].threshold) ? rangs[i + 1].threshold : ""));
            //}
            //else if (i == count - 1 && count > 1 && Ext.isEmpty(rangs[i].threshold))
            //    legendrow.text = "≥ " + (!Ext.isEmpty(rangs[i - 1].title) ? rangs[i - 1].title : (!Ext.isEmpty(rangs[i - 1].threshold) ? rangs[i - 1].threshold : ""));
            //else if (count > 1)
            //    legendrow.text = (!Ext.isEmpty(rangs[i - 1].title) ? rangs[i - 1].title : (!Ext.isEmpty(rangs[i - 1].threshold) ? rangs[i - 1].threshold : ""))
            //        + " - " + (!Ext.isEmpty(rangs[i].title) ? rangs[i].title : (!Ext.isEmpty(rangs[i].threshold) ? rangs[i].threshold : ""));

            legenditems.push(legendrow);
        }

        var x = this.kpis.cmp.add({
            xtype: 'map_legend', name: 'kpiLegend', title: legend.title, draggable: false, autoShow: true, vertical: true,
            autoAlign: 'br-br', offsets: [-6, -46], opacity: 0.95,
            items: legenditems
        });

        x.removeAll();
        x.add(legenditems);
    },
    GetLegendColor: function (val)
    {
        if (Ext.isEmpty(val))
            return null;

        for (var i = 0, count = this.thresholds.length; i < count; i++)
        {
            var t = this.thresholds[i];
            if (!Ext.isEmpty(t.threshold) && val < t.threshold)
            {
                var color = MyApp.util.Common.parseColor(t.color);
                return color;
            }
            else if (i > 0 && Ext.isEmpty(t.threshold) && val >= this.thresholds[i - 1].threshold)
            {
                var color = MyApp.util.Common.parseColor(this.thresholds[i].color);
                return color;
            }
        }

        return null;
    }
});

Ext.define('MyApp.map.kpigradient', {
    extend: 'MyApp.map.kpi',
    alias: 'widget.my_map_kpigradient',
    __palette: undefined/*渐变图片数据*/,
    max_value: 50/*指标的最大值，用于计算类似热度图的比值*/,
    statics: {
        threshold_cmp: function (a, b) { return Ext.isNumber(a) ? (Ext.isNumber(b) ? a - b : -1) : (Ext.isNumber(b) ? 1 : 0); }
    },
    __createGradient: function()
    {
        var thds = this.thresholds;
        if (Ext.isEmpty(thds))
        {
            this.__palette = undefined;
            return;
        }

        var canvas = Ext.apply(document.createElement('canvas'), { width: 256, height: 1 });
        var ctx = canvas.getContext('2d'), grd = ctx.createLinearGradient(0, 0, 256, 1);
        var it, color;
        for (var i = 0, n = thds.length; i < n; i++)
        {
            it = thds[i];
            color = MyApp.util.Common.parseColor(it.color);
            grd.addColorStop(it.threshold, MyApp.util.Common.rgba(color[0], color[1], color[2]));
        }

        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, 256, 1);
        this.__palette = ctx.getImageData(0, 0, 256, 1).data;
    },
    GetLegendColor: function (val)
    {
        val = Number.parseFloat(val);
        if (Ext.isEmpty(val) || window.isNaN(val) || !window.isFinite(val))
            return null;

        if (Ext.isEmpty(this.__palette))
            this.__createGradient();

        var p = this.__palette;
        if (Ext.isEmpty(p))
            return null;

        var ratio = val / this.max_value;
        ratio = ratio > 1 ? 1 : ((ratio < 0) ? 0 : ratio);
        var pidx = Math.floor(ratio * 256);
        pidx = (pidx == 256) ? 255 : pidx;
        pidx = pidx * 4;

        return [p[pidx], p[pidx + 1], p[pidx + 2], 1];
    }
});

Ext.define('MyApp.map.kpis', {
    extend: 'Ext.AbstractPlugin',
    alias: ['widget.my_map_kpis', 'plugin.my_map_kpis'],
    requires: ['MyApp.util.Task'],
    defaults: { xtype: 'my_map_kpi' },
    __lock: 0,
    lon_bound: 0,
    lat_bound: 0,
    uri: '/web/jss/kpi_result.jss?action=kpi_result.query',
    staturi: '/ivquery.do?method=query',
    __last_dimcon: undefined,
    __last_kpidim: {},
    keyfield: undefined/*kpi数据中的key字段与工参字段的对应关系，例如：{cell_id:'id'}即为指标数据中的cell_id对应工参的id字段*/,
    kpikeyidxs: []/*指标数据的key字段在指标数据中的索引*/,
    elekeys: []/*指标数据中指标对应的工参数据中key字段的字段名称，此数组顺序与kpikeyidxs的顺序一致*/,
    colidx: undefined/*数据列索引*/,
    infogroup: '3、指标',
    __last_kpistat: undefined,
    statics:
        {
            GetKey: function (item, ele_keys, kpidimval)
            {
                var n = ele_keys.length, k;
                if (n > 0)
                {
                    k = item[ele_keys[0]];
                    for (var i = 1; i < n; i++)
                    {
                        k += '_' + item[ele_keys[i]];
                    }
                }
                if (!Ext.isEmpty(kpidimval))
                    k += '_' + (Ext.isEmpty(kpidimval) ? '' : kpidimval);

                return k;
            }
        },
    constructor: function (config)
    {
        this.callParent(arguments);

        if (Ext.isEmpty(this.keyfield))
            console.error("GIS指标数据集合未配置数据关键字！");
        else if (Ext.isString(this.keyfield))
        {
            var field = this.keyfield;
            this.keyfield = {};
            this.keyfield[field.toLowerCase()] = 'id'; // 默认未配置映射关系的都映射到id字段
        }

        var items = this.items;
        this.items = [];
        if (items)
        {
            if (!Ext.isArray(items))
                items = [items];

            var defaults = this.defaults;
            var self_defaults = this.self.prototype.defaults;
            if (defaults !== self_defaults)
                defaults = Ext.applyIf(defaults, self_defaults);

            for (var i = 0, n = items.length, it; i < n; i++)
            {
                it = items[i];
                if (!it)
                    continue;

                it = Ext.widget(Ext.applyIf(it, (Ext.isEmpty(it.defaults) ? defaults : it.defaults)));
                this.items.push(it);

                if (it.name && !(it.name in this))
                    this[it.name] = it;
            }
        }

        this.__loadTask = new MyApp.util.Task();
    },
    init: function (map)
    {
        this.callParent(arguments);

        var items = this.items;
        if (items)
        {
            for (var i = 0, n = items.length; i < n; i++)
            {
                items[i].init(this);
            }
        }
    },
    destroy: function ()
    {
        this.__loadTask.Stop();

        var items = this.items;
        if (items)
        {
            for (var i = items.length, it; i-- > 0; )
            {
                it = items[i];
                it.destroy();
                if (it.name && this[it.name] === it)
                    delete this[it.name];
            }

            delete this.items;
        }

        this.callParent(arguments);
    },
    lock: function () { this.__lock++; },
    unlock: function ()
    {
        if (!this.__lock)
            throw 'lock、unlock未配对调用!';

        if (--this.__lock)
            return;

        setTimeout(Ext.pass(function () { if (!this.__lock) this.Release(); }, undefined, this), 1);
    },
    kpidimfilter: function (dim)
    {
        this.__last_kpidim = dim;
        // 根据多个维度的顺序，把值串为一个维度值
        var dimval = [];
        var dims = dim.dims;
        for (var f in dims)
        {
            dimval.push(dims[f]);
        }
        dim.dimval = dimval.join('_');

        // 删除维度条件
        var map = this.cmp;
        var cons = map.cur_querycondition;
        this.__last_dimcon = undefined;
        /*************已有的条件*************/
        if (dim.refresh)
        {
            // 维度条件
            if (cons)
            {
                cons = Ext.clone(cons);
                var reqcons = cons.requestConditions;
                for (var i = 0, n = reqcons.length; i < n; i++)
                {
                    if (dims[reqcons[i].name])
                    {
                        reqcons.splice(i, 1);
                        i--;
                        n--;
                    }
                }

                for (var f in dims)
                {
                    reqcons.push({ name: f, value: dims[f] });
                }
                this.__last_dimcon = cons;
                this.Load();
            }
        }
        /**************************************/
        else
        {
            var layers = this.cmp.layers, layer;
            for (var i = 0, n = layers.length; i < n; i++)
            {
                layer = layers[i];
                if (layer.Visible && !layer.dummy && Ext.isFunction(layer.OnLoadKpis))
                    layer.OnLoadKpis.apply(layer, [this]);
            }
        }
    },
    AddFilter: function (name)
    {
        if (Ext.isEmpty(name))
            return;

        if (!this.__filters)
            this.__filters = {};

        this.__filters[name] = (this.__filters[name] || 0) + 1;
    },
    RemoveFilter: function (name)
    {
        if (!Ext.isEmpty(name) && this.__filters && this.__filters[name])
            this.__filters[name]--;
    },
    Release: function ()
    {
        this.lon_bound = this.lat_bound = 0;
        this.minLon = this.maxLon = 0;
    },
    LoadKpiStat: function (curkpi, isreload)
    {
        // isreload为false且__last_kpistat已有数据则不需要请求统计数据
        if (!isreload && this.__last_kpistat)
            return;

        var cond = this.TransQuery(this.cmp.cur_querycondition);
        // 组织各指标图例条件
        var items = this.items;
        if (!items || !items.length)
            return;

        var constat = cond.kpistat = {};
        var kpi, kpistat, ths;
        for (var i = 0, n = items.length; i < n; i++)
        {
            kpi = items[i];
            kpistat = constat[kpi.field] = [];
            ths = kpi.thresholds;

            if (kpi instanceof MyApp.map.kpicmp)
            {
                var th, thstat;
                for (var j = 0, m = ths.length; j < m; j++)
                {
                    th = ths[j];
                    thstat = {};
                    if (j == 0 && !Ext.isEmpty(th.threshold))
                    {
                        thstat['min'] = '';
                        thstat['max'] = th.threshold.toString();
                    }
                    else if (j > 0 && !Ext.isEmpty(th.threshold))
                    {
                        thstat['min'] = ths[j - 1].threshold.toString();
                        thstat['max'] = ths[j].threshold.toString();
                    }
                    else if (j > 0 && !Ext.isEmpty(ths[j - 1].threshold))
                    {
                        thstat['min'] = ths[j - 1].threshold.toString();
                        thstat['max'] = '';
                    }
                    kpistat.push(thstat);
                }
            }
            else
            {
                for (var j = 0, m = ths.length; j < m; j++)
                {
                    kpistat.push({ equal: ths[j].threshold.toString() });
                }
            }
        }

        var uri = this.staturi;
        if (!Ext.String.startsWith(uri, APPBASE))
            uri = APPBASE + uri;
        uri += "&moduleId=" + this.cmp.cur_querycondition.moduleid;

        var fn = this.__loadTask.pass(this.__LoadKpiStat, this, curkpi);
        var args = { json: Ext.JSON.encode(cond) };

        Ext.Ajax.request({
            url: uri,
            method: "POST",
            params: args,
            success: fn,
            failure: fn
        });
    },
    __LoadKpiStat: function (curkpi, resp, c)
    {
        if (resp.timedout)
            throw '从"' + c.url + '"取数据超时!';

        if (resp.status != 200)
            throw '网络异常(' + resp.status + '): ' + resp.statusText;

        var kpistat = this.__last_kpistat = Ext.decode(resp.responseText);
        kpistat = { effic3g_kpi_1: [{ min: '', max: '60', count: 3 }, { min: '60', max: '', count: 7 }], field2: [{ equal: '弱覆盖', count: 9 }, { equal: '强覆盖', count: 9 }] }
        
        // 组织各指标图例条件
        var items = this.items;
        if (!items || !items.length)
            return;

        var kpi, stats, ths;
        for (var i = 0, n = items.length; i < n; i++)
        {
            kpi = items[i];
            ths = kpi.thresholds;
            stats = kpistat[kpi.field];
            if (!stats)
                continue;

            var th, stat;
            if (kpi instanceof MyApp.map.kpicmp)
            {
                for (var j = 0, m = ths.length; j < m; j++)
                {
                    th = ths[j];
                    for (var k = 0, s = stats.length; k < s; k++)
                    {
                        stat = stats[k];
                        if ((!Ext.isEmpty(th.threshold) && th.threshold == stat.max)
                            || Ext.isEmpty(th.threshold) && Ext.isEmpty(stat.max))
                        {
                            th.count = stat.count;
                            break;
                        }
                    }
                }
            }
            else
            {
                for (var j = 0, m = ths.length; j < m; j++)
                {
                    th = ths[j];
                    for (var k = 0, s = stats.length; k < s; k++)
                    {
                        stat = stats[k];
                        if ((!Ext.isEmpty(th.threshold) && th.threshold == stat.equal))
                        {
                            th.count = stat.count;
                            break;
                        }
                    }
                }
            }

            if (curkpi)
                curkpi.showlegend(curkpi.thresholds);
        }
    },
    UpdateBound: function (minLon, minLat, maxLon, maxLat)
    {
        this.lon_bound = Math.max(Number.isNaN(this.lon_bound) ? 0 : this.lon_bound, maxLon - minLon);
        minLon = (minLon + maxLon - this.lon_bound) / 2;
        maxLon = minLon + this.lon_bound;

        this.lat_bound = Math.max(Number.isNaN(this.lat_bound) ? 0 : this.lat_bound, maxLat - minLat);
        minLat = (minLat + maxLat - this.lat_bound) / 2;
        maxLat = minLat + this.lat_bound;

        if (minLon >= this.minLon && maxLon <= this.maxLon && minLat >= this.minLat && maxLat <= this.maxLat)
            return;

        this.minLon = minLon;
        this.maxLon = maxLon;
        this.minLat = minLat;
        this.maxLat = maxLat;

        this.PostLoad();
    },
    OnQuery: function (condition)
    {
        this.__last_kpistat = undefined; // 每次查询都需要重新统计指标的各图例统计数量
        if (this.__lock)
            this.PostLoad();
    },
    PostLoad: function ()
    {
        if (this.__post_load || Ext.isEmpty(this.uri) || Number.isNaN(this.minLon) || Number.isNaN(this.maxLon)
            || Number.isNaN(this.minLat) || Number.isNaN(this.maxLat) || !(this.minLon < this.maxLon))
            return;

        this.__post_load = true;

        this.__loadTask.Clear();
        this.__loadTask.Add(this.Load, this);
    },
    TransQuery: function (querysrcCondition)
    {
        if (Ext.isEmpty(querysrcCondition))
            return {};

        var queryCondition = Ext.clone(querysrcCondition);
        // 根据配置文件生成指标数据，columntype:5为gis指标，6为gis维度
        var dimetionkpifields = brd.controller.gisAllMeasureDimetion.data;

        // 地图数据不需要进行分页，所以更改分页参数
        queryCondition.page = 1;
        queryCondition.datanum = 150000;

        var curmoduleid = queryCondition.moduleid;
        queryCondition.queryId = sessionId + '_' + curmoduleid + '_gis_' + new Date().getTime() + Math.random() * Math.random(); // 改为GIS的查询ID
        queryCondition.moduleFrom = 2; // 2表示gis请求数据
        var panelquerytype = queryCondition.type; // 记录查询面板的type
        queryCondition.type = (!Ext.isEmpty(this.querytype)) ? this.querytype : ""; // 根据界面查询的逻辑类型请求数据

        // 此处配置写死，在模块ID为66676时不进行维度和指标转换，采用查询面板的维度指标信息
        if (Ext.String.Compare(curmoduleid, 66676) != 0)
        {
            var tmp = queryCondition.requestDimensions.slice();
            var timedimention = null;
            for(var i=0;i<tmp.length;i++){
                if(tmp[i].name=="time"){
                    timedimention = tmp[i];
                }
            }
            queryCondition.requestIndicators = []; // 查询条件的指标字段集合清空，加入gis的指标字段
            queryCondition.requestDimensions = []; // 查询条件的维度字段集合清空，加入gis的维度字段
            var dimetion = { columnIDs: [], name: this.querytype, size: "" }; // 组织维度对象
            if (!Ext.isEmpty(dimetionkpifields))
            {
                for (var i = 0, count = dimetionkpifields.length; i < count; i++)
                {
                    var dimetionkpifield = dimetionkpifields[i];
                    if (Ext.String.Compare(dimetionkpifield.moduleid, curmoduleid, true) == 0 && Ext.String.Compare(dimetionkpifield.type, this.querytype, true) == 0)
                    {
                        if (Ext.String.Compare(dimetionkpifield.columntype, "5", true) == 0)
                            queryCondition.requestIndicators.push({ name: dimetionkpifield.id }); // 设置数据源需要请求的指标字段
                        else if (Ext.String.Compare(dimetionkpifield.columntype, "6", true) == 0)
                            dimetion.columnIDs.push(dimetionkpifield.id); // 设置数据源请求的维度字段
                    }
                }
            }
            if (Ext.String.Compare(curmoduleid, 55555)==0 || Ext.String.Compare(curmoduleid, 55556)==0 || Ext.String.Compare(curmoduleid, 55557)==0){
                queryCondition.requestDimensions.push(timedimention);
            }
            queryCondition.requestDimensions.push(dimetion);
        }
        else
        {
            queryCondition.requestIndicators = []; // 查询条件的指标字段集合清空，加入gis的指标字段
            queryCondition.requestDimensions = []; // 查询条件的维度字段集合清空，加入gis的维度字段
            var dimetion = { columnIDs: [], name: this.querytype, size: "" }; // 组织维度对象
            if (!Ext.isEmpty(dimetionkpifields))
            {
                for (var i = 0, count = dimetionkpifields.length; i < count; i++)
                {
                    var dimetionkpifield = dimetionkpifields[i];
                    if (Ext.String.Compare(dimetionkpifield.moduleid, curmoduleid, true) == 0
                        && Ext.String.Compare(dimetionkpifield.type, this.querytype, true) == 0)
                    {
                        if (Ext.String.Compare(dimetionkpifield.columntype, "5", true) == 0
                            && Ext.String.Compare(dimetionkpifield.dimeName, queryCondition.grouptype, true) == 0)
                            queryCondition.requestIndicators.push({ name: dimetionkpifield.id }); // 设置数据源需要请求的指标字段
                        else if (Ext.String.Compare(dimetionkpifield.columntype, "6", true) == 0)
                            dimetion.columnIDs.push(dimetionkpifield.id); // 设置数据源请求的维度字段
                    }
                }
            }
            queryCondition.requestDimensions.push(dimetion);
            queryCondition.grouptype = panelquerytype + queryCondition.grouptype;
        }

        // 设置数据源条件  curmoduleid:66670,66673,66674  TYPE:为指定type值  过滤掉场景字段firstscene_type,firstscene_name的条件
        // curmoduleid:66510   过滤掉规划站点的工程字段project_id,project_name的条件
        if (Ext.String.Compare(curmoduleid, 66801) == 0)
        {
            var conds = queryCondition.requestConditions, cond;
            for (var i = 0, n = conds.length; i < n; i++)
            {
                cond = conds[i];
                if (Ext.String.Compare(cond.name, "project_id", true) == 0 || Ext.String.Compare(cond.name, "project_name", true) == 0
                    || Ext.String.Compare(cond.name, "net_type", true) == 0 || Ext.String.Compare(cond.name, "user_id", true) == 0)
                {
                    conds.splice(i, 1);
                    n = conds.length;
                    --i;
                }
            }
        }
        else if ((Ext.String.Compare(curmoduleid, 66670) == 0
            && ["3521", "3511", "3611", "3621", "1521", "1511", "1611", "1621", "2511", "2521", "2611", "2621"].indexOf(panelquerytype) > -1)
            || (Ext.String.Compare(curmoduleid, 66673) == 0 && ["10", "20", "30"].indexOf(panelquerytype) > -1)
            || (Ext.String.Compare(curmoduleid, 66674) == 0 && ["10", "20"].indexOf(panelquerytype) > -1)
            || (Ext.String.Compare(curmoduleid, 66695) == 0 && ["121", "122", "123", "124", "125", "126", "151", "152", "153", "154", "125", "126"].indexOf(this.querytype) > -1))
        {
            var conds = queryCondition.requestConditions, cond;
            for (var i = 0, n = conds.length; i < n; i++)
            {
                cond = conds[i];
                if (Ext.String.Compare(cond.name, "firstscene_type", true) == 0 || Ext.String.Compare(cond.name, "firstscene_name", true) == 0
                    || Ext.String.Compare(cond.name, "firstscenetpye", true) == 0 || Ext.String.Compare(cond.name, "scenetype_name", true) == 0
                    || Ext.String.Compare(cond.name, "scene_name", true) == 0)
                {
                    conds.splice(i, 1);
                    n = conds.length;
                    --i;
                }
            }
        }
        else if (Ext.String.Compare(curmoduleid, 66800) == 0 && ["31", "41"].indexOf(this.querytype) > -1)
        {
            var conds = queryCondition.requestConditions, cond;
            for (var i = 0, n = conds.length; i < n; i++)
            {
                cond = conds[i];
                if (Ext.String.Compare(cond.name, "cover_type", true) == 0)
                {
                    conds.splice(i, 1);
                    n = conds.length;
                    --i;
                }
            }
        }

        return queryCondition;
    },
    Load: function ()
    {
        this.__post_load = false;

        if (this.__request)
        {
            try
            {
                Ext.Ajax.abort(this.__request);
            }
            catch (e)
            {
                console.log(e.message); // 有时取消请求有取消不掉的异常
            }
            this.__request = undefined;
        }

        this.__loadTask.Clear();

        var uri = this.uri;
        if (!Ext.String.startsWith(uri, APPBASE))
            uri = APPBASE + uri;
        uri += "&moduleId=" + this.cmp.cur_querycondition.moduleid;

        var fn = this.__loadTask.pass(this.__Loaded, this);

        var cond = this.TransQuery(this.__last_dimcon || this.cmp.cur_querycondition);

        // 由于工参请求到了数据而指标没请求到范围数据，所以把指标的请求范围略扩大一公里
        if ((Ext.String.Compare(cond.moduleid, 66666) == 0 && ["61", "62"].indexOf(cond.type) > -1)
            || (Ext.String.Compare(cond.moduleid, 66668) == 0 && ["51", "52"].indexOf(cond.type) > -1))
        {
            cond.requestConditions = cond.requestConditions.concat([{ name: "minlongitude_0", value: this.minLon - 0.1 },
                { name: "minlatitude_0", value: this.minLat - 0.1 },
                { name: "maxlongitude_0", value: this.maxLon + 0.1 }, { name: "maxlatitude_0", value: this.maxLat + 0.1 }]);
        }else if (Ext.String.Compare(cond.moduleid, 66770) == 0)
        {
        	 var minpt = MyMapBase.GeographicToLogical({ longitude: this.minLon - 0.01, latitude: this.maxLat + 0.01 });
        	 var maxpt = MyMapBase.GeographicToLogical({ longitude: this.maxLon + 0.01, latitude: this.minLat - 0.01 });
        	 
            cond.requestConditions = cond.requestConditions.concat([{ name: "minx", value: minpt.x },
                { name: "miny", value: minpt.y },
                { name: "maxx", value: maxpt.x }, { name: "maxy", value: maxpt.y }]);
        }
        else
            cond.requestConditions = cond.requestConditions.concat([{ name: "minlongitude", value: this.minLon - 0.1 },
                { name: "minlatitude", value: this.minLat - 0.1 },
                { name: "maxlongitude", value: this.maxLon + 0.1 }, { name: "maxlatitude", value: this.maxLat + 0.1 }]);

        var args = { json: Ext.JSON.encode(cond) };

        if (this.__filters)
            args.filters = Ext.encode(this.__filters);

        return this.__request = Ext.Ajax.request({
            url: uri,
            method: "POST",
            params: args,
            success: fn,
            failure: fn
        });
    },
    __Loaded: function (resp, c)
    {
        this.__request = undefined;

        this.minLon += 10000;

        if (resp.timedout)
            throw '从"' + c.url + '"取数据超时!';

        if (resp.status != 200)
            throw '网络异常(' + resp.status + '): ' + resp.statusText;

        var result = Ext.decode(resp.responseText);
        if (!Ext.isEmpty(result.success) && !result.success)
            throw result.msg;

        this.minLon -= 10000;

        this.kpidata = result;
        this.dicdimdata = undefined;
        this.dictdata = {};
        var headers = this.kpidata.headers;
        var data = this.kpidata.data || [];
        var keyfield = this.keyfield;
        var colidx = this.colidx = {};
        this.kpikeyidxs = [];
        this.elekeys = [];

        for (var i = 0, count = headers.length; i < count; i++)
        {
            if (!Ext.isEmpty(headers[i].aliasname))
                colidx[headers[i].aliasname.toLowerCase()] = i;
            else
                colidx[headers[i].name.toLowerCase()] = i;
        }

        for (var attr in keyfield)
        {
            var idx = colidx[attr];
            if (!Ext.isEmpty(idx))
            {
                this.kpikeyidxs.push(idx);
                this.elekeys.push(keyfield[attr]);
            }
        }
        if (Object.getOwnPropertyNames(keyfield).length != this.kpikeyidxs.length)
            return;

        for (var i = 0, j, count = data.length; i < count; i++)
        {
            var row = data[i];
            this.dictdata[MyApp.map.kpis.GetKey(row, this.kpikeyidxs)] = row;
        }

        var layers = this.cmp.layers, layer;
        for (var i = 0, n = layers.length; i < n; i++)
        {
            layer = layers[i];
            if (layer.Visible && !layer.dummy && Ext.isFunction(layer.OnLoadKpis))
                layer.OnLoadKpis.apply(layer, [this]);
        }

        this.cmp.InvalidateLayer();
    },
    GetRow: function (item)
    {
        if (Ext.isEmpty(this.colidx) || Ext.isEmpty(this.kpidata) || Ext.isEmpty(this.kpidata.data))
            return null;

        var keyval = MyApp.map.kpis.GetKey(item, this.elekeys, this.__last_kpidim.dimval);
        if (Ext.isEmpty(keyval))
            return null;

        if (!Ext.isEmpty(this.__last_kpidim.dimval))
        {
            if (Ext.isEmpty(this.dicdimdata))
            {
                var arridx = [], idx;
                var dims = this.__last_kpidim.dims;
                for(var f in dims)
                {
                    idx = this.colidx[f.toLowerCase()];
                    if (idx < 0)
                        return null;

                    arridx.push(idx);
                }
                if (arridx.length == 0)
                    return null;
                
                var data = this.kpidata.data || [], row, dimval;
                this.dicdimdata = {};
                for (var i = 0, count = data.length; i < count; i++)
                {
                    row = data[i];
                    dimval = '';
                    for (var j = 0, m = arridx.length; j < m; j++)
                    {
                        dimval += row[arridx[j]] + '_';
                    }
                    dimval = dimval.substr(0, dimval.length - 1);
                    this.dicdimdata[MyApp.map.kpis.GetKey(row, this.kpikeyidxs, dimval)] = row;
                }
            }
            return this.dicdimdata[keyval];
        }
        else
            return this.dictdata[keyval];
    },
    CreateRow: function (item)
    {
        if (Ext.isEmpty(this.kpidata) || Ext.isEmpty(this.kpidata.headers) || Ext.isEmpty(item))
            return null;

        var headers = this.kpidata.headers;
        var keyfield = this.keyfield;
        var row = [];
        for (var i = 0, hname, n = headers.length; i < n; i++)
        {
            hname = headers[i].name.toLowerCase()
            if (hname in keyfield)
                row.push(item[keyfield[hname]]);
            else
                row.push(undefined);
        }
        return row;
    },
    GetKPIHeader: function (field)
    {
        var colidx = this.colidx[field.toLowerCase()];
        if (!Ext.isEmpty(colidx) && colidx > -1)
            return this.kpidata.headers[colidx];
        else
            return null;
    },
    GetKPIVal: function (item, field)
    {
        var row = this.GetRow(item);
        if (Ext.isEmpty(row))
            return null;

        var colidx = this.colidx[field.toLowerCase()];
        if (Ext.isEmpty(colidx) || colidx == -1)
            return null;

        return row[colidx];
    },
    GetKPIInfo: function (item, isshowdim)
    {
        var rs = [];
        var kpirow = this.GetRow(item);
        var headers = this.kpidata ? this.kpidata.headers : [], row = Ext.isNumber(item) ? null : (kpirow ? kpirow : this.CreateRow(item));
        var data = {};
        for (var i = 0, count = headers.length; i < count; i++)
        {
            var header = headers[i];
            data[header.name.toLowerCase()] = (Ext.isEmpty(row) || Ext.isEmpty(row[i]) || row.length == 0) ? "" : row[i];
        }

        for (var i = 0, count = headers.length; i < count; i++)
        {
            var header = headers[i];
            if (Ext.String.Compare(header.name.substring(header.name.length - "_trans".length), "_trans", true) == 0
                || Ext.isEmpty(header.nameCn) || (!isshowdim && (header.columnType == 1 || header.columnType == 6)))
                continue;

            if (!Ext.isEmpty(header.translateType))
                rs.push([this.infogroup, header.nameCn, data[header.name + "_trans"]]); // "_trans"字段是对应字段的翻译字段
            else
                rs.push([this.infogroup, header.nameCn, data[header.name]]);
        }
        return { title: '指标信息', data: rs };
    }
});
