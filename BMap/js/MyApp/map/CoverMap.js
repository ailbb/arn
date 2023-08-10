Ext.define('MyApp.map.CoverMap', {
    extend: 'MyApp.map.Map',
    alias: 'widget.CoverMap',
    requires: ['MyApp.map.Legend', 'MyApp.map.SurfaceLayer', 'MyApp.map.ShapeLayer', 'MyApp.map.AreagridLayer', 'MyApp.map.HeatLayer', 'MyApp.map.TrackLayer', 'MyApp.map.SiteLayer', 'MyApp.map.KPILegend'],
    InitLongitude: 117.303,//113.34,
    InitLatitude: 39.718,//22.12062,
    getViewBoundLngLat: function ()
    {
        var tile = this.tile;
        var p1 = MyMapBase.LogicalToGeographic({ x: tile.ViewportX, y: tile.ViewportY });
        var p2 = MyMapBase.LogicalToGeographic({ x: tile.ViewportX + tile.ViewportW, y: tile.ViewportY + tile.ViewportW * tile.canvasHeight / tile.canvasWidth });

        var minLon = Math.min(p1.longitude, p2.longitude);
        var maxLon = Math.max(p1.longitude, p2.longitude);
        var minLat = Math.min(p1.latitude, p2.latitude);
        var maxLat = Math.max(p1.latitude, p2.latitude);

        return [minLon, minLat, maxLon, maxLat];
    },
    onLinkShow: function ()
    {
        var lng = 113.49 + Math.random() * (113.58 - 113.49);
        var lat = 22.21 + Math.random() * (22.28 - 22.21);
        var pt = MyMapBase.GeographicToLogical({ longitude: lng, latitude: lat });
        this.tile.SetViewCenter(pt.x, pt.y);
    },
    transToServerQueryJson: function (querysrcCondition, attachconditions, datasrckey)
    {
        if (Ext.isEmpty(querysrcCondition))
            return {};
        //var datasrcs = [
        //    {
        //        datasrckey: "sectorcover", fields: [{ title: "省分", name: "province_id", id: 2 }, { title: "地市", name: "city_id", id: 3 },
        //            { title: "扇区标识", name: "sector_id", id: 4 },
        //            { title: "扇区经度", name: "longitude", id: 5 }, { title: "扇区纬度", name: "latitude", id:6 },
        //            /*{ title: "覆盖类型", name: "cover_type", id: 7 }, { title: "天线挂高", name: "ant_high", id: 119 },
        //            { title: "方向角", name: "ant_azimuth", id: 120 },
        //            { title: "电子下倾角", name: "ant_electangle", id: 121 }, { title: "机械倾角", name: "ant_machangle", id: 122 },*/
        //            { title: "RSCP[-110,+∞]采样点数", name: "rscp_gen110", id: 15 }, { title: "RSCP[-100,+∞]采样点数", name: "rscp_gen100", id: 16 },
        //            { title: "RSCP[-95,+∞]采样点数", name: "rscp_gen95", id: 17 }, { title: "RSCP[-90,+∞]采样点数", name: "rscp_gen90", id:18 },
        //            { title: "RSCP[-85,+∞]采样点数", name: "rscp_gen85", id: 19 }, { title: "RSCP[-80,+∞]采样点数", name: "rscp_gen80", id: 20 },
        //            { title: "MR弱覆盖", name: "mrfeeble_cover", id: 40 }]
        //    },
        //    {
        //        datasrckey: "areagridcover", fields: [{ title: "省分", name: "province_id", id: 42 }, { title: "地市", name: "city_id", id: 43 },
        //            { title: "覆盖类型", name: "cover_type", id: 44 }, { title: "所属物理网格编号", name: "phygrid_id", id: 45 },
        //            { title: "所属物理网格名称", name: "phygrid_name", id: 46 }, { title: "RSCP[-110,+∞]采样点数", name: "rscp_gen110", id: 49 },
        //            { title: "RSCP[-100,+∞]采样点数", name: "rscp_gen100", id: 50 }, { title: "RSCP[-95,+∞]采样点数", name: "rscp_gen95", id:51 },
        //            { title: "RSCP[-90,+∞]采样点数", name: "rscp_gen90", id:52 },
        //            { title: "RSCP[-85,+∞]采样点数", name: "rscp_gen85", id:53 }, { title: "RSCP[-80,+∞]采样点数", name: "rscp_gen80", id:54 },
        //            { title: "MR弱覆盖", name: "mrfeeble_cover", id: 74 }]
        //    }
        //];

        var queryCondition = Ext.clone(querysrcCondition);
        // 根据配置文件生成指标数据，columntype:5为gis指标，6为gis维度
        var dimetionkpifields = brd.controller.gisAllMeasureDimetion.data;

        // 地图数据不需要进行分页，所以更改分页参数
        queryCondition.page = 1;
        queryCondition.datanum = 5000;

        queryCondition.queryId = sessionId + '_' + queryCondition.moduleid + '_gis_' + new Date().getTime(); // 改为GIS的查询ID
        queryCondition.moduleFrom = 2; // 2表示gis请求数据

        queryCondition.requestIndicators = []; // 查询条件的指标字段集合清空，加入gis的指标字段
        queryCondition.requestDimensions = []; // 查询条件的维度字段集合清空，加入gis的维度字段
        var dimetion = { columnIDs: [], name: "platform_sector_defid", size: "" }; // 组织维度对象
        if (!Ext.isEmpty(dimetionkpifields))
        {
            for (var i = 0, count = dimetionkpifields.length; i < count; i++)
            {
                var dimetionkpifield = dimetionkpifields[i];
                if (Ext.String.Compare(dimetionkpifield.columntype, "5", true) == 0 && Ext.String.Compare(dimetionkpifield.moduleid, queryCondition.moduleid, true) == 0)
                    queryCondition.requestIndicators.push({ name: dimetionkpifield.id }); // 设置数据源需要请求的指标字段
                else if (Ext.String.Compare(dimetionkpifield.columntype, "6", true) == 0 && Ext.String.Compare(dimetionkpifield.moduleid, queryCondition.moduleid, true) == 0)
                    dimetion.columnIDs.push(dimetionkpifield.id); // 设置数据源请求的维度字段
            }
        }
        queryCondition.requestDimensions.push(dimetion);

        // 设置数据源条件
        queryCondition.requestConditions = queryCondition.requestConditions.concat(attachconditions);

        return queryCondition;
    },
    onQuery: function (queryCondition, dimensions, dimensionname, legends)
    {
        //dimensions = [
        //		{
        //		    dimensionname: "areagrid", kpis:
        //            [
        //                { field: "mrcoverjudgrest", title: "MR弱覆盖", datalayers: [{ datasrckey: "areagridcover", datasrc: "", kpilayer: "areagridlayer", displaylayer: "celllayer" }] }
        //            ]
        //		},
        //		{
        //		    dimensionname: "", kpis:
        //            [
        //                { field: "mrcoverjudgrest", title: "MR弱覆盖", datalayers: [{ datasrckey: "sectorcover", datasrc: "", kpilayer: "celllayer", displaylayer: "celllayer" }] }
        //            ]
        //		}
        //];

        this.legends = MyApp.map.KPILegend; // 获取图例集合
        if (Ext.isEmpty(dimensions) || dimensions.length == 0 || Ext.isEmpty(this.legends) || this.legends.length == 0)
            return;

        this.cur_querycondition = Ext.clone(queryCondition);
        dimensionname = "";
        if (!Ext.isEmpty(queryCondition) && queryCondition.requestDimensions.length > 0
            && Ext.String.Compare(queryCondition.requestDimensions[0].name, "phygrid_id", true) == 0)
        {
            dimensionname = "areagrid";
        }
        //dimensionname = "areagrid";//"grid";

        var kpis = [];
        // 查找当前维度KPI对象
        var defaultdimension;
        for (var i = 0, gcount = dimensions.length; i < gcount; i++)
        {
            if (Ext.isEmpty(dimensions[i].dimensionname))
                defaultdimension = dimensions[i]; // 记录默认粒度

            if (Ext.String.Compare(dimensions[i].dimensionname, dimensionname, true) == 0)
            {
                kpis = dimensions[i].kpis;
                break;
            }
            // 未找到指定粒度用默认粒度
            if (i == gcount - 1)
            {
                kpis = defaultdimension.kpis;
            }
        }
        if (kpis.length == 0)
            return;

        var btnmenu = this.createKpis(kpis);
        // 默认点击第一个kpi
        this.cur_kpi = "";
        //this.SelKpi(kpis[0]);
        if (!Ext.isEmpty(btnmenu))
        {
            btnmenu.setText(kpis[0].title); // setText会触发SelKpi(kpis[0])方法
            this.SelKpi(kpis[0]);
        }
    },
    createKpis: function (kpis)
    {
        var its = [];
        var cb = function (it)
        {
            if (!Ext.isEmpty(it.up("button")))
                it.up("button").setText(it.text);
            it.map.SelKpi(it.kpi);
        };
        for (var i = 0, n = kpis.length, it; i < n; i++)
        {
            it = kpis[i];
            its.push({ text: it.title, kpi: it, map: this, handler: cb });
        }

        if (this.toolbar && this.toolbar.items.length)
        {
            // 清除指标选择工具栏
            var items = this.toolbar.items.items;
            for (var i = 0, count = items.length; i < count; i++)
            {
                if (!Ext.isEmpty(items[i].id) && Ext.String.Compare(items[i].id, "kpiselect", true) == 0)
                {
                    this.toolbar.remove(i);
                    break;
                }
            }
        }

        return this.toolbar.add({
            xtype: 'button', text: '指标选择', id: "kpiselect", menuAlign: 'tl-bl', split: true, height: 30,
            menu: {
                defaults: { xtype: 'menucheckitem', hideOnClick: true, group: true, groupCls: '' },
                items: its
            }
        });
    },
    SelKpi: function (kpi)
    {
        if (Ext.isEmpty(kpi))
            return;

        // 判断指标是否更改
        if (!Ext.isEmpty(this.cur_kpi) && Ext.String.Compare(this.cur_kpi.field, kpi.field, true) == 0)
            return; // 指标未更改不做变化

        this.cur_kpi = kpi;

        // 获取当前图例
        this.cur_legend = null;
        for (var i = 0, count = this.legends.length; i < count; i++)
        {
            if (Ext.String.Compare(this.legends[i].field, kpi.field, true) == 0)
            {
                this.cur_legend = this.legends[i];
                break;
            }
        }
        if (Ext.isEmpty(this.cur_legend))
            return

        // 绘制图例面板
        this.showLegend(this.cur_legend);

        if (Ext.isEmpty(this.cur_kpi.datalayers) || this.cur_kpi.datalayers.length == 0)
            return;

        // 指标切换图层的切换显示隐藏
        var arrlayer = this.layers;
        for (var m = 0, datalayercount = this.cur_kpi.datalayers.length; m < datalayercount; m++)
        {
            var datalayer = this.cur_kpi.datalayers[m];
            for (var i = 0, count = arrlayer.length; i < count; i++)
            {
                if (!Ext.isEmpty(arrlayer[i].xtype) && Ext.String.Compare(arrlayer[i].xtype, "measure_layer", true) == 0)
                    continue;

                if (Ext.isEmpty(arrlayer[i].id))
                    arrlayer[i].Visible = false;
                else if (Ext.String.Compare(datalayer.kpilayer, arrlayer[i].id, true) == 0)
                {
                    arrlayer[i].Visible = true;
                    this.cur_datasrckey = (Ext.isEmpty(datalayer.datasrckey)) ? "" : datalayer.datasrckey;
                    if (!Ext.isEmpty(datalayer.drawelement) && Ext.String.Compare(datalayer.drawelement, "cell", true) == 0)
                        arrlayer[i].LoadKpi("", this.cur_legend, "cell"); // 清除业务数据
                    else
                        arrlayer[i].LoadKpi(datalayer.datasrc, this.cur_legend, "draw"); // 绘制业务数据
                }
                else if (datalayer.displaylayer.toLowerCase().indexOf(arrlayer[i].id.toLowerCase()) > -1)
                {
                    arrlayer[i].Visible = true;
                    arrlayer[i].LoadKpi("", this.cur_legend, "clear"); // 清除业务数据
                }
                else
                    arrlayer[i].Visible = false;
            }
        }
    },
    showLegend: function (legend)
    {
        // 构造图例颜色的对象数组
        if (Ext.isEmpty(legend) || Ext.isEmpty(legend.colorranges) || legend.colorranges.length == 0)
            return;

        var rangs = legend.colorranges, legenditems = [], charlength = 5;
        for (var i = 0, count = rangs.length; i < count; i++)
        {
            var legendrow = {};

            var clr = MyApp.util.Common.parseColor(rangs[i].fillcolor);
            legendrow.color = MyApp.util.Common.rgba(clr[0], clr[1], clr[2], 0.6);

            if (Ext.String.Compare(legend.typename, "enum", true) == 0)
            {
                legendrow.text = !Ext.isEmpty(rangs[i].minvalue) ? rangs[i].minvalue : rangs[i].maxvalue;
            }
            else
            {
                legendrow.text = "";
                if (Ext.isEmpty(rangs[i].minvalue) && !Ext.isEmpty(rangs[i].maxvalue))
                    legendrow.text = "≤ " + rangs[i].maxvalue;
                else if (!Ext.isEmpty(rangs[i].minvalue) && Ext.isEmpty(rangs[i].maxvalue))
                    legendrow.text = "≥ " + rangs[i].minvalue;
                else if (!Ext.isEmpty(rangs[i].minvalue) && !Ext.isEmpty(rangs[i].maxvalue))
                    legendrow.text = rangs[i].minvalue + " - " + rangs[i].maxvalue;
            }
            charlength = legendrow.text.length > charlength ? legendrow.text.length : charlength;
            legenditems.push(legendrow);
        }

        if (this["kpiLegend"])
        {
            this.remove(this["kpiLegend"]);
        }
        var x = this.add({
            xtype: 'map_legend', name: 'kpiLegend', title: legend.title, draggable: false, autoShow: true, vertical: true,
            autoAlign: 'br-br', offsets: [-6, -46], opacity: 0.95,
            items: legenditems
        });

        x.removeAll();
        x.add(legenditems);
    },
    getLegendColor: function (legend, v)
    {
        if (Ext.isEmpty(legend) || Ext.isEmpty(v))
            return null;

        var colorranges = legend.colorranges;
        if (legend.typename.toLowerCase() == "enum")
        {
            for (var i = 0, count = colorranges.length; i < count; i++)
            {
                if (Ext.String.Compare(v.toString(), colorranges[i].minvalue.toString(), true) == 0
                    || Ext.String.Compare(v.toString(), colorranges[i].maxvalue.toString(), true) == 0)
                {
                    var color = MyApp.util.Common.parseColor(colorranges[i].fillcolor);
                    return MyApp.util.Common.rgba(color[0], color[1], color[2], 0.9);
                }
            }
        }
        else
        {
            for (var i = 0, count = colorranges.length; i < count; i++)
            {
                if (Ext.isEmpty(colorranges[i].minvalue) && Ext.isEmpty(colorranges[i].maxvalue))
                    continue;
                else if (Ext.isEmpty(colorranges[i].minvalue) && !Ext.isEmpty(colorranges[i].maxvalue)
                    && v < colorranges[i].maxvalue)
                {
                    var color = MyApp.util.Common.parseColor(colorranges[i].fillcolor);
                    return MyApp.util.Common.rgba(color[0], color[1], color[2], 0.9);
                }
                else if (!Ext.isEmpty(colorranges[i].minvalue) && Ext.isEmpty(colorranges[i].maxvalue)
                    && v >= colorranges[i].minvalue)
                {
                    var color = MyApp.util.Common.parseColor(colorranges[i].fillcolor);
                    return MyApp.util.Common.rgba(color[0], color[1], color[2], 0.9);
                }
                else if (v >= colorranges[i].minvalue && v <= colorranges[i].maxvalue)
                {
                    var color = MyApp.util.Common.parseColor(colorranges[i].fillcolor);
                    return MyApp.util.Common.rgba(color[0], color[1], color[2], 0.9);
                }
            }
        }
        return null;
    },
    layers: [
        //{ xtype: 'shape_layer', name: 'cirLayer', shape: 2, rc: 43690 },
        //{ xtype: 'shape_layer', name: 'rectLayer', shape: 0, rc: 1800001, scale: 1 },
        {
            xtype: 'shape_layer', name: 'gridLayer', id: 'gridlayer', shape: 3, rc: 43690, Visible: false,
            LoadKpi: function (src, legend, opertype)
            {
                this.cur_legend = legend;

                if (Ext.String.Compare("clear", opertype.toLowerCase()) == 0)
                {
                    // 栅格数据清除则隐藏图层
                    this.Visible = false;
                }
                else
                {
                    // 地图移动位置
                    this.tile.SetViewCenter(0.8148055555555549, 0.43696787954598765, 16);
                }

                // 根据图例构造颜色
                var rangs = this.cur_legend.colorranges;
                if (!Ext.isEmpty(rangs) && rangs.length > 0)
                {
                    this.__clr = [];

                    var randval = Math.random();
                    var i, count = rangs.length;
                    if (randval > 0.5)
                    {

                        for (i = count - 1; i > -1; i--)
                        {
                            var clr = MyApp.util.Common.parseColor(rangs[i].fillcolor);
                            this.__clr.push(MyApp.util.Common.rgba(clr[0], clr[1], clr[2], 0.6));
                        }
                    }
                    else
                    {
                        for (i = 0; i < count; i++)
                        {
                            var clr = MyApp.util.Common.parseColor(rangs[i].fillcolor);
                            this.__clr.push(MyApp.util.Common.rgba(clr[0], clr[1], clr[2], 0.6));
                        }
                    }
                }

                this.Invalidate();
            }
        },
        {
            xtype: 'shape_layer', name: 'complaintLayer', id: 'complaintlayer', shape: 4, rc: 43690, Visible: false,
            LoadKpi: function (src, legend, opertype)
            {
                this.cur_legend = legend;

                if (Ext.String.Compare("clear", opertype, true) == 0)
                {
                    // 栅格数据清除则隐藏图层
                    this.Visible = false;
                }
                else
                {
                    // 地图移动位置
                    var lng = 113.49 + Math.random() * (113.58 - 113.49);
                    var lat = 22.21 + Math.random() * (22.28 - 22.21);

                    if (!Ext.isEmpty(this.cur_legend) && !Ext.isEmpty(this.cur_legend.field) && this.cur_legend.field.toLowerCase().indexOf("vip") > -1)
                    {
                        var pt = MyMapBase.GeographicToLogical({ longitude: 113.44806896, latitude: 22.38139903 }); // 113.44806896,22.38139903
                        this.tile.SetViewCenter(pt.x, pt.y, 11);
                        // 获取投诉数据
                        this.Request(APPBASE + '/lib/BMap/js/MyApp/map/complaintvips.js', undefined, function (r, e) { this.data = r; this.Invalidate(); });
                    }
                    else
                    {
                        var pt = MyMapBase.GeographicToLogical({ longitude: 113.258059, latitude: 22.28408696 }); // 113.258059,22.28408696
                        this.tile.SetViewCenter(pt.x, pt.y, 11);
                        // 获取投诉数据
                        this.Request(APPBASE + '/lib/BMap/js/MyApp/map/complaints.js', undefined, function (r, e) { this.data = r; this.Invalidate(); });
                    }

                    // 根据图例构造颜色
                    var rangs = this.cur_legend.colorranges;
                    if (!Ext.isEmpty(rangs) && rangs.length > 0)
                    {
                        this.__clr = [];

                        var randval = Math.random();
                        var i, count = rangs.length;
                        if (randval > 0.5)
                        {

                            for (i = count - 1; i > -1; i--)
                            {
                                var clr = MyApp.util.Common.parseColor(rangs[i].fillcolor);
                                this.__clr.push(MyApp.util.Common.rgba(clr[0], clr[1], clr[2], 0.6));
                            }
                        }
                        else
                        {
                            for (i = 0; i < count; i++)
                            {
                                var clr = MyApp.util.Common.parseColor(rangs[i].fillcolor);
                                this.__clr.push(MyApp.util.Common.rgba(clr[0], clr[1], clr[2], 0.6));
                            }
                        }
                    }
                }

                this.Invalidate();
            }
        }, {
            xtype: 'areagrid_layer', name: 'areagridLayer', id: 'areagridlayer', Visible: false,
            OnInitUpdate: function ()
            {
                this.callParent(arguments);

                if (this.Visible)
                {
                    this.OnViewportChanged(true, this.map.tile);
                    //var vb = this.map.getViewBoundLngLat();
                    //this.Load(APPBASE + '/lib/BMap/js/MyApp/map/areagrids.js');
                    //this.Load(APPBASE + "/gis/gisdataController.do?method=QueryAreagrid&minLon=" + vb[0] + "&minLat=" + vb[1] + "&maxLon=" + vb[2] + "&maxLat=" + vb[3] + "&time=" + new Date());
                }
            },
            OnViewportChanged: function (bFinally, tile)
            {
                this.callParent(arguments);

                if (bFinally && this.Visible)
                {
                    // 判断地图经纬度范围是否在数据范围内，如果不在范围内则请求数据
                    var vb = this.map.getViewBoundLngLat();
                    var minLon = vb[0], minLat = vb[1], maxLon = vb[2], maxLat = vb[3];

                    vb = this.__areagrid_bound;
                    if (vb && minLon >= vb[0] && minLat >= vb[1] && maxLon <= vb[2] && maxLat <= vb[3])
                        return;

                    var w = Math.min(Math.max(maxLon - minLon, 0.1), 0.2), h = Math.min(Math.max(maxLat - minLat, 0.1), 0.2);
                    minLon = (minLon + maxLon) / 2 - w;
                    maxLon = (minLon + maxLon) / 2 + w;
                    minLat = (minLat + maxLat) / 2 - h;
                    maxLat = (minLat + maxLat) / 2 + h;

                    if (vb && minLon >= vb[0] && minLat >= vb[1] && maxLon <= vb[2] && maxLat <= vb[3])
                        return;

                    // 保存获取数据的坐标点范围
                    this.__areagrid_bound = [minLon, minLat, maxLon, maxLat];

                    var condition = this.map.transToServerQueryJson(this.map.cur_querycondition,
                        [{ name: "minlongitude", value: minLon }, { name: "minlatitude", value: minLat },
                            { name: "maxlongitude", value: maxLon }, { name: "maxlatitude", value: maxLat }], this.map.cur_datasrckey);

                    this.Load(APPBASE + "/gis/gisdataController.do?method=QueryEParamData&eparamtype=areagrid&time=" + new Date(), { json: Ext.JSON.encode(condition) });

                    if (!Ext.isEmpty(this.cur_legend))
                    {
                        var condition = this.map.transToServerQueryJson(this.map.cur_querycondition,
                        [/*{ name: "minlongitude", value: minLon }, { name: "minlatitude", value: minLat },
                            { name: "maxlongitude", value: maxLon }, { name: "maxlatitude", value: maxLat }*/], this.map.cur_datasrckey);
                        this.LoadAreagridKPI(APPBASE + '/ivquery.do?method=query&moduleId=' + moduleId, { json: Ext.JSON.encode(condition) });
                        //this.LoadAreagridKPI(APPBASE + '/lib/BMap/js/MyApp/map/areagridkpis.js',);
                    }
                    else
                        this.Invalidate();
                }
            },
            LoadKpi: function (src, legend, opertype)
            {
                if (Ext.String.Compare("clear", opertype, true) == 0)
                {
                    // 栅格数据清除则隐藏图层
                    this.Visible = false;
                    this.cur_legend = "";
                }
                else
                {
                    // 地图移动位置113.339153,22.16633402
                    var pt = MyMapBase.GeographicToLogical({ longitude: 117.303, latitude: 39.718 });
                    this.tile.SetViewCenter(pt.x, pt.y);

                    this.cur_legend = legend;
                    this.__areagrid_bound = null;
                    this.OnViewportChanged(true, this.map.tile);
                    //this.LoadAreagridKPI(APPBASE + '/lib/BMap/js/MyApp/map/areagridkpis.js');
                }

                this.Invalidate();
            },
            GetAreagridColor: function (areagrid)
            {
                if (Ext.isEmpty(areagrid) || Ext.isEmpty(this.cur_legend) || Ext.isEmpty(this.cur_legend.field))
                    return null;
                // 在业务数据中查找网格的kpi数据
                var kpiareagrid;
                for (var i = 0, count = this.areagridkpis.length; i < count; i++)
                {
                    if (Ext.String.Compare(areagrid.phygrid_id, this.areagridkpis[i].phygrid_id, true) == 0)
                    {
                        kpiareagrid = this.areagridkpis[i];
                        break;
                    }
                }
                if (Ext.isEmpty(kpiareagrid))
                    return null;
                var val = eval("kpiareagrid." + this.cur_legend.field);//kpiareagrid[this.cur_legend.field];
                if (!Ext.isEmpty(val))
                    return this.map.getLegendColor(this.cur_legend, val);
                else
                    return null;
            }
        }, {
            xtype: 'surface_layer',
            name: 'surfaceLayer',
            id: 'surfacelayer',
            Visible: false,
            OnInitUpdate: function ()
            {
                this.callParent(arguments);
                this.Load(APPBASE + '/lib/BMap/js/MyApp/map/surfaces.js');
            },
            OnViewportChanged: function (bFinally, tile)
            {
                if (bFinally)
                    this.surface_scale = Math.pow(Ext.isLinux ? 30 : 10, tile.ZoomLevel / 16 - 1);

                this.callParent(arguments);
            },
            LoadKpi: function (src, legend, opertype)
            {
                this.cur_legend = legend;

                if (Ext.String.Compare("clear", opertype, true) != 0)
                {
                    // 地图移动位置
                    var pt = MyMapBase.GeographicToLogical({ longitude: 113.296667, latitude: 22.203333 }); // 113.296667, 22.203333
                    this.tile.SetViewCenter(pt.x, pt.y);

                    this.PolygonVisible = true; // 有业务数据时显示多边形

                    // 根据图例构造颜色
                    var rangs = this.cur_legend.colorranges;
                    if (!Ext.isEmpty(rangs) && rangs.length > 0)
                    {
                        this.__clr = [];

                        var randval = Math.random();
                        var i, count = rangs.length;
                        if (randval > 0.5)
                        {

                            for (i = count - 1; i > -1; i--)
                            {
                                var clr = MyApp.util.Common.parseColor(rangs[i].fillcolor);
                                this.__clr.push(MyApp.util.Common.rgba(clr[0], clr[1], clr[2], 0.6));
                            }
                        }
                        else
                        {
                            for (i = 0; i < count; i++)
                            {
                                var clr = MyApp.util.Common.parseColor(rangs[i].fillcolor);
                                this.__clr.push(MyApp.util.Common.rgba(clr[0], clr[1], clr[2], 0.6));
                            }
                        }
                    }
                }
                else
                {
                    this.PolygonVisible = false; // 无业务数据时显示多边形
                }

                this.Invalidate();
            },
            GetPolygonColor: function (index)
            {
                if (Ext.isEmpty(this.__clr))
                    return 'green';
                else
                    return this.__clr[Math.round(index % this.__clr.length)];
            }
        }, {
            xtype: 'track_layer', name: 'trackLayer', id: 'sitelayer', Visible: false,
            LoadKpi: function (src, legend, opertype)
            {
                this.cur_legend = legend;

                if (Ext.String.Compare("clear", opertype, true) == 0)
                {
                    // 栅格数据清除则隐藏图层
                    this.Visible = false;
                }
                else
                {
                    // 地图移动位置
                    var pt = MyMapBase.GeographicToLogical({ longitude: 113.4881, latitude: 22.3025 });
                    this.tile.SetViewCenter(pt.x, pt.y, 13);

                    // 根据图例构造颜色
                    var rangs = this.cur_legend.colorranges;
                    if (!Ext.isEmpty(rangs) && rangs.length > 0)
                    {
                        this.__clr = [];

                        var randval = Math.random();
                        var i, count = rangs.length;
                        if (randval > 0.5)
                        {

                            for (i = count - 1; i > -1; i--)
                            {
                                var clr = MyApp.util.Common.parseColor(rangs[i].fillcolor);
                                this.__clr.push(MyApp.util.Common.rgba(clr[0], clr[1], clr[2], 0.9));
                            }
                        }
                        else
                        {
                            for (i = 0; i < count; i++)
                            {
                                var clr = MyApp.util.Common.parseColor(rangs[i].fillcolor);
                                this.__clr.push(MyApp.util.Common.rgba(clr[0], clr[1], clr[2], 0.9));
                            }
                        }
                    }
                }

                this.Invalidate();
            }
        }, {
            xtype: 'site_layer', name: 'siteLayer', id: 'btssitelayer', Visible: false,
            LoadKpi: function (src, legend, opertype)
            {
                this.cur_legend = legend;

                if (Ext.String.Compare("clear", opertype, true) == 0)
                {
                    // 数据清除则隐藏图层
                    this.Visible = true;
                }
                else
                {
                    this.Visible = false;
                }

                this.Invalidate();
            },
            OnInitUpdate: function (canvas, tile)
            {
                this.callParent(arguments);
                var tbar = this.map.toolbar;
                tbar.add({ xtype: 'button', text: '添加站点', hidden: !this.Visible, scope: this, handler: this.OnAddSite });
            },
            GetButton: function () { return this.map.toolbar.items.findBy(function (it) { return it.text == '添加站点' }); },
            OnAddSite: function ()
            {
                this.GetButton().toggle(this.editMode = this.editMode ? false : true);
            },
            OnVisibleChanged: function ()
            {
                this.callParent(arguments);
                if (this.Visible)
                    this.GetButton().show();
                else
                    this.GetButton().hide();
            },
            OnItemClick: function (item, layer, e)
            {
                this.callParent(arguments);
                if (this.editMode)
                {
                    if (this.__new_site)
                    {
                        delete this.__new_site.tmp;
                        this.__new_site = null;
                    }

                    this.editMode = false;
                    var pt = MyMapBase.LogicalToGeographic(item);
                    cdma_map_win_show(pt.longitude, pt.latitude);
                }
            }
        }, {
            xtype: 'heatLayer',
            name: 'heatLayer',
            id: 'heatlayer',
            Visible: false
        }, {
            xtype: 'cell_layer',
            name: 'cellLayer',
            id: 'celllayer',
            PolygonVisible: false,
            Visible: false,
            kpis: [{ title: 'a', filed: 'mr_over' }, { title: 'b', filed: 'k2' }],
            OnUpdateCell: function (cells) { this.map.OnUpdateCell(cells, this); },
            OnInitUpdate: function ()
            {
                this.callParent(arguments);
                if (this.Visible)
                {
                    this.OnViewportChanged(true, this.map.tile);
                    //var vb = this.map.getViewBoundLngLat();
                    //this.Load(APPBASE + '/lib/BMap/js/MyApp/map/cells.js');
                    //this.Load(APPBASE + "/gis/gisdataController.do?method=QueryCell&minLon="+ vb[0] + "&minLat="+vb[1]+"&maxLon="+vb[2]+"&maxLat="+vb[3]+"&time=" + new Date());
                }
            },
            OnViewportChanged: function (bFinally, tile)
            {
                if (bFinally)
                    this.cell_scale = Math.pow(Ext.isLinux ? 30 : 10, tile.ZoomLevel / 16 - 1);

                if (bFinally && this.Visible)
                {
                    // 判断地图经纬度范围是否在数据范围内，如果不在范围内则请求数据
                    var vb = this.map.getViewBoundLngLat();
                    var minLon = vb[0], minLat = vb[1], maxLon = vb[2], maxLat = vb[3];

                    vb = this.__cell_bound;
                    if (vb && minLon >= vb[0] && minLat >= vb[1] && maxLon <= vb[2] && maxLat <= vb[3])
                        return;

                    var w = Math.min(Math.max(maxLon - minLon, 0.1), 0.2), h = Math.min(Math.max(maxLat - minLat, 0.1), 0.2);
                    minLon = (minLon + maxLon) / 2 - w;
                    maxLon = (minLon + maxLon) / 2 + w;
                    minLat = (minLat + maxLat) / 2 - h;
                    maxLat = (minLat + maxLat) / 2 + h

                    if (vb && minLon >= vb[0] && minLat >= vb[1] && maxLon <= vb[2] && maxLat <= vb[3])
                        return;

                    // 保存获取数据的坐标点范围
                    this.__cell_bound = [minLon, minLat, maxLon, maxLat];

                    var condition = this.map.transToServerQueryJson(this.map.cur_querycondition,
                        [{ name: "minlongitude", value: minLon }, { name: "minlatitude", value: minLat },
                            { name: "maxlongitude", value: maxLon }, { name: "maxlatitude", value: maxLat }], this.map.cur_datasrckey);

                    //this.Load(APPBASE + "/gis/gisdataController.do?method=QueryEleData&type=cell&time=" + new Date(), { json: Ext.JSON.encode(condition) });
                    this.Load(true);

                    if (!Ext.isEmpty(this.cur_legend))
                    {
                        brd.controller.mask.show(brd.cfg.idcfg.gis + '-mask', brd.ext.container.get(brd.cfg.idcfg.gis).getExtPanel()); // 等待面板
                        this.LoadSectorKPI(APPBASE + '/ivquery.do?method=query&moduleId=' + moduleId, { json: Ext.JSON.encode(condition) });
                        //this.LoadSectorKPI(APPBASE + '/lib/BMap/js/MyApp/map/cellkpis.js');
                    }
                }
                else
                    this.Invalidate();
                this.callParent(arguments);
            },
            LoadKpi: function (src, legend, opertype)
            {
                if (Ext.String.Compare("clear", opertype, true) != 0 && Ext.String.Compare("cell", opertype, true) != 0)
                {
                    // 地图移动位置
                    //var lng = 113.51 + Math.random() * (113.58 - 113.51);
                    //var lat = 22.23 + Math.random() * (22.28 - 22.23);
                    var pt = MyMapBase.GeographicToLogical({ longitude: 117.3032, latitude: 39.72 });
                    this.tile.SetViewCenter(pt.x, pt.y);

                    this.cur_legend = legend;
                    this.__cell_bound = null;
                    this.OnViewportChanged(true, this.map.tile);
                    //this.LoadSectorKPI(APPBASE + '/lib/BMap/js/MyApp/map/cellkpis.js');
                    this.PolygonVisible = true; // 有业务数据时显示多边形
                }
                else
                {
                    this.cur_legend = "";
                    this.kpi_data = {};
                    this.PolygonVisible = false; // 无业务数据时显示多边形
                }

                this.Invalidate();
            },
            GetPolygonColor: function (cells)
            {
                if (Ext.isEmpty(cells) || cells.length == 0 || Ext.isEmpty(this.cur_legend) || Ext.isEmpty(this.cur_legend.field))
                    return null;
                // 在业务数据中查找小区所属扇区对应的扇区kpi数据
                var sector;
                for (var i = 0, count = this.cellsectors.length; i < count; i++)
                {
                    if (cells[0].sector_id == this.cellsectors[i].sector_id)
                    {
                        sector = this.cellsectors[i];
                        break;
                    }
                }
                if (Ext.isEmpty(sector))
                    return null;
                var val = eval("sector." + this.cur_legend.field);//sector[this.cur_legend.field];
                if (!Ext.isEmpty(val))
                    return this.map.getLegendColor(this.cur_legend, val);
                else
                    return null;



                return null;
                // 旧的demo代码
                var data = this.kpi_data;
                if (!data)
                    return;

                if (!this.cur_legend)
                    return;
                var k = this.cur_legend;
                if (!k)
                    return;

                var f = "mrcoverjudgrest";//k.field; // 由于所有的指标都随机生成，所以不用动态取不同指标的数据，直接写死

                var v = undefined;

                for (var i = 0, n = cells.length, r; i < n; i++)
                {
                    r = data[cells[i].id];
                    if (!r)
                        continue;

                    if (v === undefined)
                        v = r[f];
                    //else
                    //    v = Math.max(v, r[f]);
                }

                if (Ext.isEmpty(v))
                    return null;//MyApp.util.Common.rgba(0, 0, 0, 0);

                return v;
            },
            GetCellColor: function (cell)
            {
                if (!Ext.isEmpty(this.cur_legend) && Ext.String.Compare(this.cur_legend.field, "cellrru", true) == 0)
                    return this.map.getLegendColor(this.cur_legend, cell.rru_cell_flag);
                else
                    return null;
            }
        }
    ]
});
