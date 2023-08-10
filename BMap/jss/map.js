if (!Math.sinh)
    Math.sinh = function (x) { return (this.exp(x) - this.exp(-x)) / 2.0; };

var map = {
    __map_scene_field: {
        '市区': ['is_related_city', 'city_name'],
        '县城': ['is_related_county', 'county_name'],
        'A类乡镇': ['is_related_countya', 'county_aname'],
        'B类乡镇': ['is_related_countyb', 'county_bname'],
        'C类乡镇': ['is_related_countyc', 'county_cname'],
        '行政村': ['is_related_villages', 'villages_name'],
        '跨省高铁': ['is_related_outhighspeed_rail', 'outhighrail_name'],
        '省内高铁': ['is_related_inhighspeed_rail', 'inhighrail_name'],
        '动车线': ['is_related_motorcar', 'motorcar_name'],
        '机场高速': ['is_related_airhighline', 'airhighline_name'],
        '跨省高速': ['is_related_outhighline', 'outhighline_name'],
        '省内高速': ['is_related_inhighline', 'inhighline_name'],
        '普通铁路': ['is_related_norhighline', 'norhighline_name'],
        '国道': ['is_related_nationalrd', 'nationalrd_name'],
        '省道': ['is_related_provincialrd', 'provincialrd_name'],
        '水运航道': ['is_related_waterway', 'waterway_name'],
        '一类校园': ['is_related_1campus', 'campus1_name'],
        '二类校园': ['is_related_2campus', 'campus2_name'],
        '三类校园': ['is_related_3campus', 'campus3_name'],
        '5A级景区': ['is_related_area_5a', 'area5a_name'],
        '4A级景区': ['is_related_area_4a', 'area4a_name'],
        '3A级景区': ['is_related_area_3a', 'area3a_name'],
        '3A级以下景区': ['is_related_area_3adown', 'area_3adown_name']
    },
    AppendIsSceneCond: function (args, cs)
    {
        var fs = this.__map_scene_field[args.scene_type];
        if (jss.isArray(fs) && !jss.isEmpty(fs[0]))
            cs.push('nvl(' + fs[0] + ', 0) != 0');
    },
    SelectSceneName: function (args, prefix)
    {
        var fs = this.__map_scene_field[args.scene_type];
        return jss.isArray(fs) && !jss.isEmpty(fs[1]) ? ((jss.isDefined(prefix) ? prefix : ', ') + fs[1] + ' scene_name') : '';
    },
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
    __getSearchSql: function (args, layer, cs, vs)
    {
        var orisql = '', tbname, layerdesc;
        switch (layer.datamethod.toLowerCase())
        {
            case 'getcell':
                {
                    var network = (args.network || layer.network).toLowerCase();
                    if (jss.isEmpty(network))
                    {
                        jss.log(layer.title || layer.name + '小区图层未指定网络制式，不能进行搜索!');
                        return orisql;
                    }

                    var tableEx = args.historyData ? "plan_15" : "latest";
                    if (network.toLowerCase().substring(0, 3) == "lte")
                    {
                        tbname = 's_conf_etrancell_' + tableEx;
                        layerdesc = layer.title || '4G网络，小区图层name:' + layer.name;
                        orisql = " select ci id, cell_name name, longitude, latitude, '" + layerdesc + "' layerdesc "
                            + " from " + tbname + " where ci is not null and longitude is not null and latitude is not null ";
                    }
                    else if (network.toLowerCase() == "gsm")
                    {
                        tbname = 's_conf_cell_' + tableEx;
                        layerdesc = layer.title || '2G网络，小区图层name:' + layer.name;
                        orisql = " select cell_id id, cell_name name, longitude, latitude, '" + layerdesc + "' layerdesc "
                            + " from " + tbname + " where cell_id is not null and longitude is not null and latitude is not null ";
                    }
                    else if (network.toLowerCase() == "wcdma")
                    {
                        tbname = 's_conf_utrancell_' + tableEx;
                        layerdesc = layer.title || '3G网络，小区图层name:' + layer.name;
                        orisql = " select cell_id id, cell_name name, longitude, latitude, '" + layerdesc + "' layerdesc "
                            + " from " + tbname + " where cell_id is not null and longitude is not null and latitude is not null ";
                    }
                    // 省份地市条件
                    this.__provcond(args, cs, vs, "province_id", "province_name", "city_id", "city_name", "");

                    var cover_type = args.cover_type || layer.cover_type || '';
                    if (!jss.isEmpty(cover_type) && (cover_type.indexOf('3') == -1 || cover_type.indexOf(3) == -1))
                    {
                        cover_type = jss.isArray(cover_type) ? cover_type.join(',') : cover_type;
                        cs.push(" instr(','||?||',' , ','||nvl(cover_type,'1')||',') > 0 ");
                        vs.push(cover_type);
                    }
                    if (!jss.isEmpty(args.firstscene_type))
                    {
                        cs.push(" instr(','||?||',' , ','||firstscene_type||',') > 0 ");
                        vs.push(args.firstscene_type);
                    }
                    if (!jss.isEmpty(args.firstscene_name))
                    {
                        cs.push(" instr(','||?||',' , ','||firstscene_name||',') > 0 ");
                        vs.push(args.firstscene_name);
                    }
                    if (!jss.isEmpty(args.phygrid_id))
                    {
                        cs.push(" instr(','||?||',' , ','||phygrid_id||',') > 0 ");
                        vs.push(args.phygrid_id);
                    }
                    if (!jss.isEmpty(args.vendor_id) && network.toLowerCase().substring(0, 3) != "lte")
                    {
                        cs.push(" instr(','||?||',' , ','||vendor_id||',') > 0 ");
                        vs.push(args.vendor_id);
                    }
                    else if (!jss.isEmpty(args.vendor_id) && network.toLowerCase().substring(0, 3) == "lte")
                    {
                        cs.push(" instr(','||?||',' , ','||vendor_enb_id||',') > 0 ");
                        vs.push(args.vendor_id);
                    }
                    if (!jss.isEmpty(args.uarfcn_dl))
                    {
                        cs.push(" instr(','||?||',' , ','||uarfcn_dl||',') > 0 ");
                        vs.push(args.uarfcn_dl);
                    }
                    if (!jss.isEmpty(args) && !jss.isEmpty(args.work_state))
                    {
                        cs.push(" instr(','||?||',' , ','||work_state||',') > 0 ");
                        vs.push(args.work_state);
                    }
                    if (!jss.isEmpty(args) && !jss.isEmpty(args.operate_state))
                    {
                        cs.push(" instr(','||?||',' , ','||operate_state||',') > 0 ");
                        vs.push(args.operate_state);
                    }

                    this.AppendIsSceneCond(args, cs);

                    if (!jss.isEmpty(args.bsc_id))
                    {
                        cs.push(" instr(','||?||',' , ','||related_bsc||',') > 0 ");
                        vs.push(args.bsc_id);
                    }
                    if (!jss.isEmpty(args.rnc_id))
                    {
                        cs.push(" instr(','||?||',' , ','||related_rnc||',') > 0 ");
                        vs.push(args.rnc_id);
                    }
                    break;
                }
            case 'getcoverbts':
                {
                    var network = (args.network || layer.network).toLowerCase();
                    if (jss.isEmpty(network))
                    {
                        jss.log(layer.title || layer.name + '基站图层未指定网络制式，不能进行搜索!');
                        return orisql;
                    }

                    if (network.toLowerCase().substring(0, 3) == "lte")
                    {
                        layerdesc = layer.title || '4G网络，基站图层name:' + layer.name;
                        orisql = " select enb_id id, enb_name name, longitude, latitude, '" + layerdesc + "' layerdesc "
                            + " from v_s_conf_enodeb_of_cell where enb_id is not null and longitude is not null and latitude is not null ";
                    }
                    else if (network.toLowerCase() == "gsm")
                    {
                        layerdesc = layer.title || '2G网络，基站图层name:' + layer.name;
                        orisql = " select bts_id id, bts_name name, longitude, latitude, '" + layerdesc + "' layerdesc "
                            + " from v_s_conf_bts_of_cell where bts_id is not null and longitude is not null and latitude is not null ";
                    }
                    else if (network.toLowerCase() == "wcdma")
                    {
                        layerdesc = layer.title || '3G网络，基站图层name:' + layer.name;
                        orisql = " select related_nodeb id, nodeb_name name, longitude, latitude, '" + layerdesc + "' layerdesc "
                            + " from v_s_conf_nodeb_of_cell where related_nodeb is not null and longitude is not null and latitude is not null ";
                    }
                    // 省份地市条件
                    this.__provcond(args, cs, vs, "province_id", "province_name", "city_id", "city_name", "");

                    if (jss.isNumeric(args.project_scheduled_date))
                    {
                        cs.push(Math.abs(args.project_scheduled_date) < 2000 ? 'project_scheduled_date = extract(year from sysdate) + ?' : 'project_scheduled_date = ?');
                        vs.push(args.project_scheduled_date);
                    }

                    var cover_type = args.cover_type || layer.cover_type || '';
                    if (!jss.isEmpty(cover_type) && (cover_type.indexOf('3') == -1 || cover_type.indexOf(3) == -1))
                    {
                        cover_type = jss.isArray(cover_type) ? cover_type.join(',') : cover_type;
                        cs.push(" instr(','||?||',' , ','||nvl(cover_type,'1')||',') > 0 ");
                        vs.push(cover_type);
                    }
                    //if (!jss.isEmpty(args.firstscene_type))
                    //{
                    //    cs.push(" instr(','||?||',' , ','||firstscene_type||',') > 0 ");
                    //    vs.push(args.firstscene_type);
                    //}
                    //if (!jss.isEmpty(args.firstscene_name))
                    //{
                    //    cs.push(" instr(','||?||',' , ','||firstscene_name||',') > 0 ");
                    //    vs.push(args.firstscene_name);
                    //}
                    if (!jss.isEmpty(args.phygrid_id))
                    {
                        cs.push(" instr(','||?||',' , ','||phygrid_id||',') > 0 ");
                        vs.push(args.phygrid_id);
                    }
                    if (!jss.isEmpty(args.vendor_id))
                    {
                        cs.push(" instr(','||?||',' , ','||vendor_id||',') > 0 ");
                        vs.push(args.vendor_id);
                    }
                    if (!jss.isEmpty(args.site_status))
                    {
                        cs.push(" instr(','||?||',' , ','||site_status||',') > 0 ");
                        vs.push(args.site_status);
                    }
                    if (!jss.isEmpty(args.bsc_id))
                    {
                        cs.push(" instr(','||?||',' , ','||related_bsc||',') > 0 ");
                        vs.push(args.bsc_id);
                    }
                    if (!jss.isEmpty(args.rnc_id))
                    {
                        cs.push(" instr(','||?||',' , ','||related_rnc||',') > 0 ");
                        vs.push(args.rnc_id);
                    }
                    break;
                }
            case 'getbts':
                {
                    var network = (args.network || layer.network).toLowerCase();
                    if (jss.isEmpty(network))
                    {
                        jss.log(layer.title || layer.name + '基站图层未指定网络制式，不能进行搜索!');
                        return orisql;
                    }

                    if (network.toLowerCase().substring(0, 3) == "lte")
                    {
                        layerdesc = layer.title || '4G网络，基站图层name:' + layer.name;
                        orisql = " select enb_id id, enb_name name, longitude, latitude, '" + layerdesc + "' layerdesc "
                            + " from s_conf_enodeb_latest where enb_id is not null and longitude is not null and latitude is not null ";
                    }
                    else if (network.toLowerCase() == "gsm")
                    {
                        layerdesc = layer.title || '2G网络，基站图层name:' + layer.name;
                        orisql = " select bts_id id, bts_name name, longitude, latitude, '" + layerdesc + "' layerdesc "
                            + " from s_conf_bts_latest where bts_id is not null and longitude is not null and latitude is not null ";
                    }
                    else if (network.toLowerCase() == "wcdma")
                    {
                        layerdesc = layer.title || '3G网络，基站图层name:' + layer.name;
                        orisql = " select related_nodeb id, nodeb_name name, longitude, latitude, '" + layerdesc + "' layerdesc "
                            + " from s_conf_nodeb_latest where related_nodeb is not null and longitude is not null and latitude is not null ";
                    }
                    // 省份地市条件
                    this.__provcond(args, cs, vs, "province_id", "province_name", "city_id", "city_name", "");

                    if (jss.isNumeric(args.project_scheduled_date))
                    {
                        cs.push(Math.abs(args.project_scheduled_date) < 2000 ? 'project_scheduled_date = extract(year from sysdate) + ?' : 'project_scheduled_date = ?');
                        vs.push(args.project_scheduled_date);
                    }
                    //if (!jss.isEmpty(args.firstscene_type))
                    //{
                    //    cs.push(" instr(','||?||',' , ','||firstscene_type||',') > 0 ");
                    //    vs.push(args.firstscene_type);
                    //}
                    //if (!jss.isEmpty(args.firstscene_name))
                    //{
                    //    cs.push(" instr(','||?||',' , ','||firstscene_name||',') > 0 ");
                    //    vs.push(args.firstscene_name);
                    //}
                    if (!jss.isEmpty(args.phygrid_id))
                    {
                        cs.push(" instr(','||?||',' , ','||phygrid_id||',') > 0 ");
                        vs.push(args.phygrid_id);
                    }
                    if (!jss.isEmpty(args.vendor_id))
                    {
                        cs.push(" instr(','||?||',' , ','||vendor_id||',') > 0 ");
                        vs.push(args.vendor_id);
                    }
                    if (!jss.isEmpty(args.site_status))
                    {
                        cs.push(" instr(','||?||',' , ','||site_status||',') > 0 ");
                        vs.push(args.site_status);
                    }
                    if (!jss.isEmpty(args.bsc_id))
                    {
                        cs.push(" instr(','||?||',' , ','||related_bsc||',') > 0 ");
                        vs.push(args.bsc_id);
                    }
                    if (!jss.isEmpty(args.rnc_id))
                    {
                        cs.push(" instr(','||?||',' , ','||related_rnc||',') > 0 ");
                        vs.push(args.rnc_id);
                    }
                    break;
                }
            case 'getsector':
                {
                    layerdesc = layer.title || '扇区图层name:' + layer.name;
                    orisql = "select platform_sector_defid id, platform_sector_defid name,longitude,latitude, '" + layerdesc + "' layerdesc "
                        + " from s_conf_utransector_latest where longitude is not null and latitude is not null ";
                    // 省份地市条件
                    this.__provcond(args, cs, vs, "province_id", "province_name", "city_id", "city_name", "");

                    if (!jss.isEmpty(args.firstscene_type))
                    {
                        cs.push(" instr(','||?||',' , ','||firstscene_type||',') > 0 ");
                        vs.push(args.firstscene_type);
                    }
                    if (!jss.isEmpty(args.scenetype_name))
                    {
                        cs.push(" instr(','||?||',' , ','||firstscene_type||',') > 0 ");
                        vs.push(args.scenetype_name);
                    }
                    if (!jss.isEmpty(args.scene_name))
                    {
                        cs.push(" instr(','||?||',' , ','||firstscene_name||',') > 0 ");
                        vs.push(args.scene_name);
                    }
                    if (!jss.isEmpty(args.firstscene_name))
                    {
                        cs.push(" instr(','||?||',' , ','||firstscene_name||',') > 0 ");
                        vs.push(args.firstscene_name);
                    }
                    if (!jss.isEmpty(args.phygrid_id))
                    {
                        cs.push(" instr(','||?||',' , ','||phygrid_id||',') > 0 ");
                        vs.push(args.phygrid_id);
                    }

                    this.AppendIsSceneCond(args, cs);
                    break;
                }
            case 'getsurface':
                {
                    layerdesc = layer.title || '天面图层name:' + layer.name;
                    orisql = "select platform_surface_defid id, platform_surface_defid name,longitude,latitude, '" + layerdesc + "' layerdesc "
                        + " from s_conf_surface_latest where longitude is not null and latitude is not null ";
                    // 省份地市条件
                    this.__provcond(args, cs, vs, "province_id", "province_name", "city_id", "city_name", "");

                    if (!jss.isEmpty(args.firstscene_type))
                    {
                        cs.push(" instr(','||?||',' , ','||firstscene_type||',') > 0 ");
                        vs.push(args.firstscene_type);
                    }
                    if (!jss.isEmpty(args.firstscene_name))
                    {
                        cs.push(" instr(','||?||',' , ','||firstscene_name||',') > 0 ");
                        vs.push(args.firstscene_name);
                    }
                    if (!jss.isEmpty(args.phygrid_id))
                    {
                        cs.push(" instr(','||?||',' , ','||phygrid_id||',') > 0 ");
                        vs.push(args.phygrid_id);
                    }

                    this.AppendIsSceneCond(args, cs);
                    break;
                }
            case 'getbuilding':
                {
                    layerdesc = layer.title || '室内建筑图层name:' + layer.name;
                    orisql = "select building_id id, building_name name,longitude,latitude, '" + layerdesc + "' layerdesc "
                        + " from s_conf_indoor_buiding_15 where longitude is not null and latitude is not null ";
                    if (!jss.isEmpty(args.starttime))
                    {
                        cs.push("trunc(timemark,'mm') = to_date('" + args.starttime.substr(0, 7) + "','yyyy-mm') ");
                    }
                    if (!jss.isEmpty(args.province_id))
                    {
                        cs.push("PROVINCE_ID = ?");
                        vs.push(args.province_id);
                    }
                    if (!jss.isEmpty(args.city_id))
                    {
                        cs.push("CITY_ID IN (?)");
                        vs.push(args.city_id);
                    }
                    if (!jss.isEmpty(args.building_category))
                    {
                        var v = args.building_category.split(',');
                        var c = [];
                        for (var i = 0; i < v.length; i++)
                        {
                            c.push('?');
                            vs.push(v[i]);
                        }
                        cs.push("BUILDING_CATEGORY IN (" + c.join(',') + ")");
                    }
                    break;
                }
            case 'getrailbts':
                {
                    var network = (args.nettype || layer.nettype).toLowerCase();
                    if (jss.isEmpty(network))
                    {
                        jss.log(layer.title || layer.name + '高铁基站图层未指定网络制式，不能进行搜索!');
                        return orisql;
                    }

                    tbname = "s_conf_gt_station_14";
                    var netfield;
                    if (!jss.isEmpty(args.builded) && args.builded.toLowerCase() == "new")
                        tbname = "s_conf_gt_station_new_14";

                    if (!jss.isEmpty(args.nettype) && args.nettype.toLowerCase() == "2")
                    {
                        layerdesc = layer.title || '4G网络，高铁基站图层name:' + layer.name;
                        orisql = "select sn id, lte_logical_site_name name,longitude,latitude, '" + layerdesc + "' layerdesc "
                            + " from " + tbname + " where longitude is not null and latitude is not null ";
                    }
                    else if (!jss.isEmpty(args.nettype) && args.nettype.toLowerCase() == "1")
                    {
                        layerdesc = layer.title || '3G网络，高铁基站图层name:' + layer.name;
                        orisql = "select sn id, wcdma_logical_site_name name,longitude,latitude, '" + layerdesc + "' layerdesc "
                            + " from " + tbname + " where longitude is not null and latitude is not null ";
                    }
                    // 省份地市条件
                    this.__provcond(args, cs, vs, "province_id", "province", "city_id", "city", "");
                    break;
                }
            case 'getareagrid':
                {
                    layerdesc = layer.title || '网格图层name:' + layer.name;
                    orisql = "select phygrid_id id,phygrid_name name,longitude,latitude, '" + layerdesc + "' layerdesc "
                        + " from s_conf_gridding_latest where longitude is not null and latitude is not null ";
                    // 省份地市条件
                    this.__provcond(args, cs, vs, "province_id", "province_name", "city_id", "city_name", "");

                    if (!jss.isEmpty(args.firstscene_type))
                    {
                        cs.push(" instr(','||?||',' , ','||maincoverage||',') > 0 ");
                        vs.push(args.firstscene_type);
                    }
                    if (!jss.isEmpty(args.phygrid_id))
                    {
                        cs.push(" instr(','||?||',' , ','||phygrid_id||',') > 0 ");
                        vs.push(args.phygrid_id);
                    }
                    break;
                }
                //case 'getplansite':
                //    {
                //        layerdesc = layer.title || '规划站址图层name:' + layer.name;
                //        orisql = " select to_char(l.site_id) id, l.site_name name, p.longitude longitude, p.latitude latitude, '" + layerdesc + "' layerdesc "
                //            + " from gis_logic_stat_list l inner join gis_phy_stat_list p on l.phy_location_id = p.phy_location_id and l.project_id = p.project_id "
                //            + " where l.site_id is not null and p.longitude is not null and p.latitude is not null ";
                //        if (!jss.isEmpty(args.project_id))
                //        {
                //            cs.push('l.project_id = ?');
                //            vs.push(args.project_id);
                //        }
                //        if (!jss.isEmpty(args.net_type))
                //        {
                //            cs.push('l.net_type = ?');
                //            vs.push(args.net_type);
                //        }
                //    }
        }
        return orisql;
    },
    __getSearchParams: function (args, layer, cs, vs, tbalias)
    {
        if (!jss.isEmpty(args.city_id) || !jss.isEmpty(args.city) || !jss.isEmpty(args.city_code))
        {
            cs.push(jss.isEmpty(tbalias) ? 'city_id = ?' : tbalias + '.city_id = ?');
            !jss.isEmpty(args.city_id) ? vs.push(args.city_id) : (!jss.isEmpty(args.city) ? vs.push(args.city) : vs.push(args.city_code));
        }

        if (!jss.isEmpty(args.province_id) || !jss.isEmpty(args.province) || !jss.isEmpty(args.province_code))
        {
            cs.push(jss.isEmpty(tbalias) ? 'province_id = ?' : tbalias + '.province_id = ?');
            !jss.isEmpty(args.province_id) ? vs.push(args.province_id) : (!jss.isEmpty(args.province) ? vs.push(args.province) : vs.push(args.province_code));
        }

        var cover_type = args.cover_type || layer.cover_type || '';
        if (!jss.isEmpty(cover_type) && (cover_type.indexOf('3') == -1 || cover_type.indexOf(3) == -1))
        {
            cover_type = jss.isArray(cover_type) ? cover_type.join(',') : cover_type;
            cs.push(" instr(','||?||',' , ','||nvl(cover_type,'1')||',') > 0 ");
            vs.push(cover_type);
        }
        if (!jss.isEmpty(args.firstscene_type))
        {
            cs.push(" instr(','||?||',' , ','||firstscene_type||',') > 0 ");
            vs.push(args.firstscene_type);
        }
        if (!jss.isEmpty(args.firstscene_name))
        {
            cs.push(" instr(','||?||',' , ','||firstscene_name||',') > 0 ");
            vs.push(args.firstscene_name);
        }
        if (!jss.isEmpty(args.phygrid_id))
        {
            cs.push(" instr(','||?||',' , ','||phygrid_id||',') > 0 ");
            vs.push(args.phygrid_id);
        }
        if (!jss.isEmpty(args.vendor_id))
        {
            cs.push(" instr(','||?||',' , ','||vendor_id||',') > 0 ");
            vs.push(args.vendor_id);
        }
        if (!jss.isEmpty(args.uarfcn_dl))
        {
            cs.push(" instr(','||?||',' , ','||uarfcn_dl||',') > 0 ");
            vs.push(args.uarfcn_dl);
        }
        if (!jss.isEmpty(args.work_state))
        {
            cs.push(" instr(','||?||',' , ','||work_state||',') > 0 ");
            vs.push(args.work_state);
        }
        if (!jss.isEmpty(args.operate_state))
        {
            cs.push(" instr(','||?||',' , ','||operate_state||',') > 0 ");
            vs.push(args.operate_state);
        }
        if (!jss.isEmpty(args.bsc_id))
        {
            cs.push(" instr(','||?||',' , ','||related_bsc||',') > 0 ");
            vs.push(args.bsc_id);
        }
        if (!jss.isEmpty(args.bsc_id))
        {
            cs.push(" instr(','||?||',' , ','||related_bsc||',') > 0 ");
            vs.push(args.bsc_id);
        }
        if (!jss.isEmpty(args.rnc_id))
        {
            cs.push(" instr(','||?||',' , ','||related_rnc||',') > 0 ");
            vs.push(args.rnc_id);
        }
        if (!jss.isEmpty(args.building_category))
        {
            cs.push(" instr(','||?||',' , ','||building_category||',') > 0 ");
            vs.push(args.building_category);

            if (!jss.isEmpty(args.starttime))
            {
                cs.push("trunc(timemark,'mm') = to_date('?','yyyy-mm') ");
                vs.push(args.starttime.substr(0, 7));
            }
        }
        if (!jss.isEmpty(args.project_id))
        {
            cs.push(jss.isEmpty(tbalias) ? 'project_id = ?' : tbalias + '.project_id = ?');
            vs.push(args.project_id);
        }
        if (!jss.isEmpty(args.net_type))
        {
            cs.push(jss.isEmpty(tbalias) ? 'net_type = ?' : tbalias + '.net_type = ?');
            vs.push(args.net_type);
        }
    },
    SearchCell: function (sc)
    {
        var data = {};

        var sql = " from (select cell_id id, CELL_NAME name, longitude, latitude from s_conf_utrancell_latest where Longitude > 60 and Longitude < 139 and Latitude > 6 and Latitude < 56) T";
        var content = sc.GetString('content'), fs = [], vs = [];
        if (content)
        {
            content = content.split(/\s+/);
            if (content.length > 0)
            {
                for (var i = 0, n = content.length, val; i < n; i++)
                {
                    val = content[i];
                    fs.push("id like ('%' || ? || '%')");
                    vs.push(val);

                    fs.push("upper(name) like upper('%' || ? || '%')");
                    vs.push(val);
                }

                sql += ' where (' + fs.join(' or ') + ')';
            }
        }

        data.total = sc.database.getValue('select count(*)' + sql, vs);
        var start = sc.GetNumber('start');
        vs.push(start, start + sc.GetNumber('limit'));
        var rs = sc.database.query('select id, name, longitude, latitude from (select T.*, rownum - 1 r' + sql + ') T where r>=? and r<?', vs), its = [];
        while (rs.next())
        {
            its.push({
                'id': jss.toString(rs.getObject('id')),
                'name': jss.toString(rs.getObject('name')),
                longitude: jss.toNumber(rs.getObject('longitude')),
                latitude: jss.toNumber(rs.getObject('latitude'))
            });
        }
        data.rs = its;

        return data;
    },
    SearchElement: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var data = {};
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件
        jss.log('***********************************查询图层元素**********************************');
        jss.log(jss.encode(args));

        var cs = [], vs = [];
        var sql = " select * from ( orisql ) ", orisql, unionsql = '', tempsql, objsql;
        if (!jss.isEmpty(args.content))
        {
            // 根据图层组织SQL，组织查询面板中的查询条件，在满足查询条件的基础上再进行搜索
            var layers = args.layers, layer, content = args.content;
            for (var k = 0, m = layers.length; k < m; k++)
            {
                cs = [];
                layer = layers[k];

                orisql = this.__getSearchSql(args, layer, cs, vs);
                if (jss.isEmpty(orisql))
                {
                    jss.log('图层的uri为空或根据图层请求数据的方法未获取到对应的sql，数据方法：' + layer.datamethod + '，图层：' + (layer.title ? layer.title : layer.name));
                    continue;
                }

                orisql += ' and ' + cs.join(' and ');
                tempsql = (k > 0 ? ' union all ' : '') + sql.replace('orisql', orisql);
                tempsql += " where ( upper(id) like upper('%' || ? || '%') or upper(name) like upper('%' || ? || '%') )";
                vs.push(content, content);

                jss.log(tempsql);
                jss.log(jss.encode(cs));
                jss.log(jss.encode(vs));

                unionsql += tempsql;
            }
        }

        if (!jss.isEmpty(unionsql))
        {
            data.total = sc.database.getValue('select count(*) from (' + unionsql + ')', vs);
            if (data.total > 5000)
                throw '查询数量大于5000，请输入更为准确的过滤条件！';

            var startrow = sc.GetNumber('start'), endrow = startrow + sc.GetNumber('limit');
            tempsql = 'select id, name, longitude, latitude, layerdesc from (select utb.*, rownum - 1 r from (' + unionsql + ') utb ) where r>=? and r<?'
                + ' and longitude is not null and latitude is not null ';

            jss.log(tempsql);
            jss.log(jss.encode(vs));

            var rs = sc.database.query(tempsql, vs.concat([startrow, endrow])), its = [];
            var pt = new com.broadtech.unicom.common.Voronoi.Point(), lon, lat;
            while (rs.next())
            {
                lon = jss.toNumber(rs.getObject('longitude'));
                lat = jss.toNumber(rs.getObject('latitude'));
                pt.Reset(lon, lat);
                GpsOffset.GpsToLogical(pt);

                its.push({
                    'id': jss.toString(rs.getObject('id')),
                    'name': jss.toString(rs.getObject('name')),
                    'longitude': lon,
                    'latitude': lat,
                    'x': pt.x,
                    'y': pt.y,
                    'layerdesc': jss.toString(rs.getObject('layerdesc'))
                });
            }
            data.rs = its;
        }

        jss.log('查询图层元素完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
        return data;
    },
    __polygon_type: {
        sector: 120/*扇区*/,
        bts: 121/*2g基站*/,
        nodeb: 122/*3g基站*/,
        enodeb: 123/*4g基站*/,
        surface: 124/*天面*/,
        ecell: 125/*4g小区多边形*/,
        ucell: 126/*3g小区多边形*/,
        cell: 127/*2g小区多边形*/,
        sector_unoffset: 220/*不纠偏扇区*/,
        surface_unoffset: 224/*不纠偏天面*/
    },
    __build_sectorpolygon: function (province_id, isoffset)
    {
        var tm = java.lang.System.currentTimeMillis();
        jss.log('开始省份:' + province_id + ' 扇区泰森多边形计算...');

        var type = this.__polygon_type.sector;
        var tablename = 's_conf_utransector_latest';
        var db;
        try
        {
            db = new Database();
            var selsql, delitemsql, delpolysql;
            var helper = com.broadtech.unicom.common.Voronoi.helper;

            // 扇区
            selsql = "select platform_sector_defid, longitude, latitude from " + tablename + " where platform_sector_defid is not null and longitude is not null and latitude is not null and province_id= '" + province_id + "'";
            jss.log(selsql);
            var lst = helper.load(db.query(selsql), isoffset);

            jss.log('完成多边形计算，用时 ' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');

            tm = java.lang.System.currentTimeMillis();
            jss.log('开始入库');

            delitemsql = "delete from cfg_gis_polygon_items item where exists (select 1 from cfg_gis_polygon poly where poly.id = item.id and type = " + type + " ) "
                + ' and province_id = ? ';
            jss.log(delitemsql);
            db.update(delitemsql, [province_id]);

            delpolysql = 'delete from cfg_gis_polygon t where not exists(select 1 from cfg_gis_polygon_items i where i.id=t.id) and type = ' + type;
            jss.log(delpolysql);
            db.update(delpolysql);

            helper.insert(db, province_id, type, lst);

            db.commit();

            jss.log('省份:' + province_id + ' 完成扇区泰森多边形入库，用时 ' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
        }
        catch (e)
        {
            if (db)
                db.rollback();
            throw e;
        }
        finally
        {
            if (db)
                db.close();
        }
    },
    __build_polygon: function (province_id, type, selsql, isoffset, desc)
    {
        var tm = java.lang.System.currentTimeMillis();
        jss.log('开始省份:' + province_id + ' ' + desc + ' 泰森多边形计算...');

        var db;
        try
        {
            db = new Database();
            var delitemsql, delpolysql;
            var helper = com.broadtech.unicom.common.Voronoi.helper;

            // 获取计算多边形的元素数据
            jss.log(selsql);
            var lst = helper.load(db.query(selsql), isoffset);

            jss.log('完成多边形计算，用时 ' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');

            tm = java.lang.System.currentTimeMillis();
            jss.log('开始入库');

            delitemsql = "delete from cfg_gis_polygon_items item where exists (select 1 from cfg_gis_polygon poly where poly.id = item.id and type = " + type + " ) "
                + ' and province_id = ? ';
            jss.log(delitemsql);
            db.update(delitemsql, [province_id]);

            delpolysql = 'delete from cfg_gis_polygon t where not exists(select 1 from cfg_gis_polygon_items i where i.id=t.id) and type = ' + type;
            jss.log(delpolysql);
            db.update(delpolysql);

            helper.insert(db, province_id, type, lst);

            db.commit();

            jss.log('省份:' + province_id + ' 完成 ' + desc + ' 泰森多边形入库，用时 ' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
        }
        catch (e)
        {
            if (db)
                db.rollback();
            throw e;
        }
        finally
        {
            if (db)
                db.close();
        }
    },
    __nEnterBP: 0,
    BuildPolygon: function (sc)
    {
        try
        {
            if (jss.sync(function () { return this.__nEnterBP++; }, undefined, this))
            {
                jss.log('不允许重复进行多边形计算，一次只能进行一个计算!');
                throw "重入了！";
            }

            var province_id = sc.GetString('province_id');
            var polytype = sc.GetString('polytype');
            if (jss.isEmpty(province_id) || jss.isEmpty(polytype))
            {
                jss.log('未指定省份或计算多边形的元素类型!');
                return;
            }
            jss.log('开始泰森多边形计算....，省份：' + province_id + '  类型：' + polytype);

            province_id = province_id.toLowerCase();
            polytype = polytype.toLowerCase();
            if (province_id == "all")
                province_id = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131];
            else
            {
                province_id = jss.isNumeric(province_id) ? Number(province_id) : undefined;
                province_id = province_id ? [province_id] : [];
            }

            for (var p, i = 0, n = province_id.length; i < n; i++)
            {
                p = province_id[i];
                if (polytype.indexOf('sector') > -1)
                {
                    var selsql = "select platform_sector_defid, longitude, latitude from s_conf_utransector_latest "
                        + " where platform_sector_defid is not null "
                        + " and longitude is not null and longitude < 136 and longitude > 70 "
                        + " and latitude is not null and latitude < 55 and latitude > 0 "
                        + " and province_id= '" + p + "'";

                    if (polytype == 'sector')
                        this.__build_polygon(p, this.__polygon_type.sector, selsql, true, '纠偏扇区');
                    else if (polytype == 'sector_unoffset')
                        this.__build_polygon(p, this.__polygon_type.sector_unoffset, selsql, false, '未纠偏扇区');
                }
                else if (polytype == 'surface')
                {
                    var selsql = " select platform_surface_defid, longitude, latitude from s_conf_surface_latest "
                        + " where platform_surface_defid is not null "
                        + " and longitude is not null and longitude < 136 and longitude > 70 "
                        + " and latitude is not null and latitude < 55 and latitude > 0 "
                        + " and province_id= '" + p + "'";

                    if (polytype == 'surface')
                        this.__build_polygon(p, this.__polygon_type.surface, selsql, true, '纠偏天面');
                    else if (polytype == 'surface_unoffset')
                        this.__build_polygon(p, this.__polygon_type.surface_unoffset, selsql, false, '未纠偏天面');
                }
                else if (polytype == 'ecell')
                {
                    var selsql = "select ci, longitude, latitude from s_conf_etrancell_latest "
                        + " where ci is not null and ant_azimuth is not null and cover_type = '1' "
                        + " and longitude is not null and longitude < 136 and longitude > 70 "
                        + " and latitude is not null and latitude < 55 and latitude > 0 "
                        + " and province_id= '" + p + "'";
                    this.__build_polygon(p, this.__polygon_type.ecell, selsql, true, '4G小区');
                }

            }
        }
        catch (e)
        {
            jss.log('出错啦！' + e.toString());
        }
        finally
        {
            jss.sync(function () { this.__nEnterBP--; }, undefined, this);
        }
    },
    AsyncBuildPolygon: function ()
    {
        if (jss.sync(function () { return this.__nEnterBP; }, undefined, this))
            return '任务正在执行！';

        var ra = __host.getEngine().getInterface({ run: jss.pass(this.BuildPolygon, undefined, this) }, java.lang.Runnable);
        var t = new java.lang.Thread(ra);
        t.start();

        return '计算多边形的任务已开启！';
    },
    test: function ()
    {
        // return com.broadtech.unicom.utils.JsonUtils.toJson(['1', "['1','2']"]);
        //return net.sf.json.JSONArray.fromObject(['{a:1234}', "[\\'1','2']"]).toString();
        var helper = com.broadtech.unicom.common.Voronoi.helper;
        var dis = helper.GetGeoDistance(105.59495, 30.16601, 105.59432, 29.40315);
        jss.log("坐标点距离：" + dis);
        dis = helper.GetGeoOffset(105.59495, 30.16601, 50, 50);
        jss.log("经纬度对应50米的距离差：x:" + dis.x + "   y:" + dis.y);
    },
    GetCityCenter: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();

        jss.log('查询地市中心点！！！！！！！！！！！！！！！');
        var sql = " select province_code code,longitude,latitude from cfg_cityinfo_gis where city_code like '%01' or city_code like '%00' "
            + " union "
            + " select city_code code,longitude,latitude from cfg_cityinfo_gis ";

        jss.log(sql);

        var rs = sc.database.query(sql), centers = {}, it;
        while (rs.next())
        {
            key = jss.toString(rs.getObject('code'));
            it = [jss.toString(rs.getObject('longitude')), jss.toString(rs.getObject('latitude'))];

            centers[key] = it;
        }

        sc.print(jss.encode(centers));

        jss.log('查询地市中心点完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    __getquerycond: function (args)
    {
        if (jss.isEmpty(args) || jss.isEmpty(args.cond) || jss.isEmpty(args.cond.requestConditions))
            return args;

        var arrcond = args.cond.requestConditions || [];
        for (var i = 0, n = arrcond.length; i < n; i++)
        {
            var cond = arrcond[i];
            args[cond.name.toLowerCase()] = cond.value;
        }
        return args;
    },
    __coorwidencond: function (args, cs, vs, tbalias, r)
    {
        // r变量，用于小区或基站多边形经纬度取值和多边形纠偏后的取值不一致的问题
        if (!jss.isEmpty(args.minLon))
        {
            cs.push(jss.isEmpty(tbalias) ? 'longitude >= ?' : tbalias + '.longitude >= ?');
            vs.push(args.minLon - r);
        }
        if (!jss.isEmpty(args.maxLon))
        {
            cs.push(jss.isEmpty(tbalias) ? 'longitude < ?' : tbalias + '.longitude < ?');
            vs.push(args.maxLon + r);
        }

        if (!jss.isEmpty(args.minLat))
        {
            cs.push(jss.isEmpty(tbalias) ? 'latitude >= ?' : tbalias + '.latitude >= ?');
            vs.push(args.minLat - r);
        }
        if (!jss.isEmpty(args.maxLat))
        {
            cs.push(jss.isEmpty(tbalias) ? 'latitude < ?' : tbalias + '.latitude < ?');
            vs.push(args.maxLat + r);
        }
    },
    __coorcond: function (args, cs, vs, tbalias)
    {
        this.__coorwidencond(args, cs, vs, tbalias, 0);
    },
    __coorrectcond: function (args, cs, vs, tbalias)
    {
        if (!jss.isEmpty(args.minLon))
        {
            cs.push(jss.isEmpty(tbalias) ? 'maxlongitude > ?' : tbalias + '.maxlongitude > ?');
            vs.push(args.minLon);
        }
        if (!jss.isEmpty(args.minLat))
        {
            cs.push(jss.isEmpty(tbalias) ? 'maxlatitude > ?' : tbalias + '.maxlatitude > ?');
            vs.push(args.minLat);
        }
        if (!jss.isEmpty(args.maxLon))
        {
            cs.push(jss.isEmpty(tbalias) ? 'minlongitude < ?' : tbalias + '.minlongitude < ?');
            vs.push(args.maxLon);
        }
        if (!jss.isEmpty(args.maxLat))
        {
            cs.push(jss.isEmpty(tbalias) ? 'minlatitude < ?' : tbalias + '.minlatitude < ?');
            vs.push(args.maxLat);
        }
    },
    __logiccoorcond: function (args, cs, vs, tbalias)
    {
        var pt;
        if (!jss.isEmpty(args.minLon) && !jss.isEmpty(args.maxLat))
        {
            pt = this.GeographicToLogical({ longitude: args.minLon, latitude: args.maxLat });
            cs.push(jss.isEmpty(tbalias) ? 'x >= ?' : tbalias + '.x >= ?');
            cs.push(jss.isEmpty(tbalias) ? 'y >= ?' : tbalias + '.y >= ?');
            vs.push(pt.x);
            vs.push(pt.y);
        }
        if (!jss.isEmpty(args.minLon) && !jss.isEmpty(args.maxLat))
        {
            pt = this.GeographicToLogical({ longitude: args.maxLon, latitude: args.minLat });
            cs.push(jss.isEmpty(tbalias) ? 'x < ?' : tbalias + '.x < ?');
            cs.push(jss.isEmpty(tbalias) ? 'y < ?' : tbalias + '.y < ?');
            vs.push(pt.x);
            vs.push(pt.y);
        }
    },
    __provcond: function (args, cs, vs, provid, provname, cityid, cityname, tbalias)
    {
        //if (!jss.isEmpty(args.city_id))
        //{
        //    var field = jss.isNumeric(args.city_id) ? cityid : cityname;
        //    cs.push(jss.isEmpty(tbalias) ? field + ' = ?' : tbalias + '.' + field + ' = ?');
        //    vs.push(args.city_id);
        //}
        //if (!jss.isEmpty(args.city))
        //{
        //    var field = jss.isNumeric(args.city) ? cityid : cityname;
        //    cs.push(jss.isEmpty(tbalias) ? field + ' = ?' : tbalias + '.' + field + ' = ?');
        //    vs.push(args.city);
        //}
        //if (!jss.isEmpty(args.city_code))
        //{
        //    var field = jss.isNumeric(args.city_code) ? cityid : cityname;
        //    cs.push(jss.isEmpty(tbalias) ? field + ' = ?' : tbalias + '.' + field + ' = ?');
        //    vs.push(args.city_code);
        //}
        if (!jss.isEmpty(args.city_id) || !jss.isEmpty(args.city) || !jss.isEmpty(args.city_code))
        {
            var val = !jss.isEmpty(args.city_id) ? args.city_id : (!jss.isEmpty(args.city) ? args.city : args.city_code);
            var arr = jss.toString(val).split(','), isnum = true;
            for (var i = 0, n = arr.length; i < n; i++)
            {
                if (!jss.isNumeric(arr[i]))
                {
                    isnum = false;
                    break;
                }
            }
            var field = isnum ? cityid : cityname;
            field = jss.isEmpty(tbalias) ? field : tbalias + '.' + field;
            cs.push(" instr(','||?||',' , ','||" + field + "||',') > 0 ");
            vs.push(val);
        }

        if (!jss.isEmpty(args.province_id))
        {
            var field = jss.isNumeric(args.province_id) ? provid : provname;
            cs.push(jss.isEmpty(tbalias) ? field + ' = ?' : tbalias + '.' + field + ' = ?');
            vs.push(args.province_id);
        }
        if (!jss.isEmpty(args.province))
        {
            var field = jss.isNumeric(args.province) ? provid : provname;
            cs.push(jss.isEmpty(tbalias) ? field + ' = ?' : tbalias + '.' + field + ' = ?');
            vs.push(args.province);
        }
        if (!jss.isEmpty(args.province_code))
        {
            var field = jss.isNumeric(args.province_code) ? provid : provname;
            cs.push(jss.isEmpty(tbalias) ? field + ' = ?' : tbalias + '.' + field + ' = ?');
            vs.push(args.province_code);
        }
    },
    __map_cell_converge: {
        '6': 20000,
        '7': 15000,
        '8': 12000,
        '9': 10000,
        '10': 8000,
        '11': 6000,
        '12': 4000,
        '13': 2000,
        '14': 1000,
        '15': 500
    },
    GetCell_perf: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件

        var sql, cs = [], vs = [], cscoor = [], vscoor = [];
        jss.log('查询GetCell_perf方法下WCDMA小区！！！！！！！！！！！！！！！');
        sql = "select cell.cell_id id, CELL_NAME name, longitude, latitude, null x, null y" + this.SelectSceneName(args, ', cell.')
            + ", ant_azimuth antennadirection"
            + ", nvl(mod(mod(ant_azimuth, 360) + 360, 360),360) direction"
            + ", case nvl(cover_type,'1') when '1' then 15 when '4' then 15 else 11 end radius"
            + ", case nvl(cover_type,'1') when '1' then 30 when '4' then 30 else 360 end angle"
            + ", cell.LAC, cell.CI, psc SC, ANT_HIGH, uarfcn_ul, uarfcn_dl, ant_electangle, ant_machangle"
            + ", RRUCELL_FLAG RRU_CELL_FLAG,'' DOWN_FREQ,'' UP_FREQ,cell.platform_sector_defid sector_id"
            + ",nvl(cover_type,'1') cover_type, '' lte_system, c.province_name,c.city_name "
            + " from s_conf_utrancell_latest cell, cfg_cityinfo c "
            + " where cell.province_id = c.province_code and cell.city_id = c.city_code "
            + " and cell.longitude is not null and cell.latitude is not null ";

        //sql = "select cell.cell_id id, CELL_NAME name, longitude, latitude "
        //    + ", ant_azimuth antennadirection"
        //    + ",nvl(cover_type,'1') cover_type "
        //    + " from s_conf_utrancell_latest cell, cfg_cityinfo c "
        //    + " where cell.province_id = c.province_code and cell.city_id = c.city_code "
        //    + " and cell.longitude is not null and cell.latitude is not null ";

        //sql = " select cell.* from s_conf_utrancell_latest cell, cfg_cityinfo c "
        //    + " where rownum < 100 and cell.province_id = c.province_code and cell.city_id = c.city_code "
        //    + " and cell.longitude is not null and cell.latitude is not null ";

        // 不用条件直接从表中取指定数量的数据
        //sql = "select cell_id id, cell_name name, longitude, latitude, null x, null y "
        //    + ", ant_azimuth antennadirection"
        //    + ", nvl(mod(mod(ant_azimuth, 360) + 360, 360),360) direction"
        //    + ", case nvl(cover_type,'1') when '1' then 15 when '4' then 15 else 11 end radius"
        //    + ", case nvl(cover_type,'1') when '1' then 30 when '4' then 30 else 360 end angle"
        //    + ", LAC, CI, '' SC, ANT_HIGH, uarfcn_ul, uarfcn_dl, ant_electangle, ant_machangle"
        //    + ", '' RRU_CELL_FLAG,'' DOWN_FREQ,'' UP_FREQ,platform_sector_defid sector_id"
        //    + ",cover_type, '' lte_system, '重庆' province_name, '重庆' city_name "
        //    + " from s_conf_utrancell_latest c "
        //    + " where rownum < 112400 ";

        //sql = "select cell_id id, cell_name name, longitude, latitude "
        //    + ", ant_azimuth antennadirection"
        //    + ",cover_type "
        //    + " from s_conf_utrancell_latest c "
        //    + " where rownum < 112400 ";

        // 关联查询的数据关联到一个表中
        //sql = "select id, name, longitude, latitude, x, y"
        //    + ", antennadirection"
        //    + ", direction"
        //    + ", radius"
        //    + ", angle"
        //    + ", LAC, CI, SC, ANT_HIGH, uarfcn_ul, uarfcn_dl, ant_electangle, ant_machangle"
        //    + ", RRU_CELL_FLAG,DOWN_FREQ,UP_FREQ,sector_id"
        //    + ",cover_type, lte_system, province_name,city_name "
        //    + " from s_conf_utrancell_perfzoush c "
        //    + " where 1 > 0 ";

        // 省份地市条件
        this.__provcond(args, cs, vs, "province_code", "province_name", "city_code", "city_name", "c");
        // 经纬度条件
        this.__coorwidencond(args, cscoor, vscoor, "cell", 0.01);

        if (!jss.isEmpty(args.cover_type) && (args.cover_type.indexOf('3') == -1 || args.cover_type.indexOf(3) == -1))
        {
            args.cover_type = jss.isArray(args.cover_type) ? args.cover_type.join(',') : args.cover_type;
            cs.push(" instr(','||?||',' , ','||nvl(cover_type,'1')||',') > 0 ");
            vs.push(args.cover_type);
        }
        if (!jss.isEmpty(args.firstscene_type))
        {
            cs.push(" instr(','||?||',' , ','||firstscene_type||',') > 0 ");
            vs.push(args.firstscene_type);
        }
        if (!jss.isEmpty(args.firstscene_name))
        {
            cs.push(" instr(','||?||',' , ','||firstscene_name||',') > 0 ");
            vs.push(args.firstscene_name);
        }
        if (!jss.isEmpty(args.phygrid_id))
        {
            cs.push(" instr(','||?||',' , ','||phygrid_id||',') > 0 ");
            vs.push(args.phygrid_id);
        }
        if (!jss.isEmpty(args.vendor_id) && network.toLowerCase().substring(0, 3) != "lte")
        {
            cs.push(" instr(','||?||',' , ','||vendor_id||',') > 0 ");
            vs.push(args.vendor_id);
        }
        else if (!jss.isEmpty(args.vendor_id) && network.toLowerCase().substring(0, 3) == "lte")
        {
            cs.push(" instr(','||?||',' , ','||vendor_enb_id||',') > 0 ");
            vs.push(args.vendor_id);
        }
        if (!jss.isEmpty(args.uarfcn_dl))
        {
            cs.push(" instr(','||?||',' , ','||uarfcn_dl||',') > 0 ");
            vs.push(args.uarfcn_dl);
        }
        if (!jss.isEmpty(args) && !jss.isEmpty(args.work_state))
        {
            cs.push(" instr(','||?||',' , ','||work_state||',') > 0 ");
            vs.push(args.work_state);
        }
        if (!jss.isEmpty(args) && !jss.isEmpty(args.operate_state))
        {
            cs.push(" instr(','||?||',' , ','||operate_state||',') > 0 ");
            vs.push(args.operate_state);
        }
        this.AppendIsSceneCond(args, cs);
        if (!jss.isEmpty(args.bsc_id))
        {
            cs.push(" instr(','||?||',' , ','||related_bsc||',') > 0 ");
            vs.push(args.bsc_id);
        }
        if (!jss.isEmpty(args.rnc_id))
        {
            cs.push(" instr(','||?||',' , ','||related_rnc||',') > 0 ");
            vs.push(args.rnc_id);
        }

        var cond = "", coorcond = "";
        if (cs.length > 0)
            cond = ' and ' + cs.join(' and ');
        if (cscoor.length > 0)
            coorcond = ' and ' + cscoor.join(' and ');

        sql += cond + coorcond;
        vs = vs.concat(vscoor);

        jss.log(sql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs);
        sc.print('{cells: ');
        Database.write_perf(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs));

        sc.println('}');
        jss.log('GetCell_perf查询小区完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    __provcondsqlite: function (args, cs, vs, provid, provname, cityid, cityname, tbalias)
    {
        if (!jss.isEmpty(args.city_id) || !jss.isEmpty(args.city) || !jss.isEmpty(args.city_code))
        {
            var val = !jss.isEmpty(args.city_id) ? args.city_id : (!jss.isEmpty(args.city) ? args.city : args.city_code);
            var arr = jss.toString(val).split(','), isnum = true;
            for (var i = 0, n = arr.length; i < n; i++)
            {
                if (!jss.isNumeric(arr[i]))
                {
                    isnum = false;
                    break;
                }
            }
            var field = isnum ? cityid : cityname;
            field = jss.isEmpty(tbalias) ? field : tbalias + '.' + field;
            cs.push(" instr(','+?+',' , ','+" + field + "+',') > 0 ");
            vs.push(val);
        }

        if (!jss.isEmpty(args.province_id))
        {
            var field = jss.isNumeric(args.province_id) ? provid : provname;
            cs.push(jss.isEmpty(tbalias) ? field + ' = ?' : tbalias + '.' + field + ' = ?');
            vs.push(args.province_id);
        }
        if (!jss.isEmpty(args.province))
        {
            var field = jss.isNumeric(args.province) ? provid : provname;
            cs.push(jss.isEmpty(tbalias) ? field + ' = ?' : tbalias + '.' + field + ' = ?');
            vs.push(args.province);
        }
        if (!jss.isEmpty(args.province_code))
        {
            var field = jss.isNumeric(args.province_code) ? provid : provname;
            cs.push(jss.isEmpty(tbalias) ? field + ' = ?' : tbalias + '.' + field + ' = ?');
            vs.push(args.province_code);
        }
    },
    GetCell_perfsqlite: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件

        var sql, cs = [], vs = [], cscoor = [], vscoor = [];
        jss.log('查询GetCell_perf sqlite 方法下WCDMA小区！！！！！！！！！！！！！！！');
        sql = "select cell.cell_id id, CELL_NAME name, longitude, latitude, null x, null y" + this.SelectSceneName(args, ', cell.')
            + ", ant_azimuth antennadirection"
            + ", ifnull(((ant_azimuth % 360) + 360) % 360,360) direction"
            + ", case ifnull(cover_type,'1') when '1' then 15 when '4' then 15 else 11 end radius"
            + ", case ifnull(cover_type,'1') when '1' then 30 when '4' then 30 else 360 end angle"
            + ", cell.LAC, cell.CI, psc SC, ANT_HIGH, uarfcn_ul, uarfcn_dl, ant_electangle, ant_machangle"
            + ", RRUCELL_FLAG RRU_CELL_FLAG,'' DOWN_FREQ,'' UP_FREQ,cell.platform_sector_defid sector_id"
            + ",ifnull(cover_type,'1') cover_type, '' lte_system, c.province_name,c.city_name "
            + " from s_conf_utrancell_latest cell, cfg_cityinfo c "
            + " where cell.province_id = c.province_code and cell.city_id = c.city_code "
            + " and cell.longitude is not null and cell.latitude is not null ";

        //sql = "select cell.cell_id id, CELL_NAME name, longitude, latitude "
        //    + ", ant_azimuth antennadirection"
        //    + ",nvl(cover_type,'1') cover_type "
        //    + " from s_conf_utrancell_latest cell, cfg_cityinfo c "
        //    + " where cell.province_id = c.province_code and cell.city_id = c.city_code "
        //    + " and cell.longitude is not null and cell.latitude is not null ";

        //sql = " select cell.* from s_conf_utrancell_latest cell, cfg_cityinfo c "
        //    + " where rownum < 100 and cell.province_id = c.province_code and cell.city_id = c.city_code "
        //    + " and cell.longitude is not null and cell.latitude is not null ";

        // 不用条件直接从表中取指定数量的数据
        //sql = "select cell_id id, cell_name name, longitude, latitude, null x, null y "
        //    + ", ant_azimuth antennadirection"
        //    + ", nvl(mod(mod(ant_azimuth, 360) + 360, 360),360) direction"
        //    + ", case nvl(cover_type,'1') when '1' then 15 when '4' then 15 else 11 end radius"
        //    + ", case nvl(cover_type,'1') when '1' then 30 when '4' then 30 else 360 end angle"
        //    + ", LAC, CI, '' SC, ANT_HIGH, uarfcn_ul, uarfcn_dl, ant_electangle, ant_machangle"
        //    + ", '' RRU_CELL_FLAG,'' DOWN_FREQ,'' UP_FREQ,platform_sector_defid sector_id"
        //    + ",cover_type, '' lte_system, '重庆' province_name, '重庆' city_name "
        //    + " from s_conf_utrancell_latest c "
        //    + " where rownum < 112400 ";

        //sql = "select cell_id id, cell_name name, longitude, latitude "
        //    + ", ant_azimuth antennadirection"
        //    + ",cover_type "
        //    + " from s_conf_utrancell_latest c "
        //    + " where rownum < 112400 ";

        // 关联查询的数据关联到一个表中
        //sql = "select id, name, longitude, latitude, x, y"
        //    + ", antennadirection"
        //    + ", direction"
        //    + ", radius"
        //    + ", angle"
        //    + ", LAC, CI, SC, ANT_HIGH, uarfcn_ul, uarfcn_dl, ant_electangle, ant_machangle"
        //    + ", RRU_CELL_FLAG,DOWN_FREQ,UP_FREQ,sector_id"
        //    + ",cover_type, lte_system, province_name,city_name "
        //    + " from s_conf_utrancell_perfzoush c "
        //    + " where 1 > 0 ";

        // 省份地市条件
        this.__provcondsqlite(args, cs, vs, "province_code", "province_name", "city_code", "city_name", "c");
        // 经纬度条件
        this.__coorwidencond(args, cscoor, vscoor, "cell", 0.01);

        if (!jss.isEmpty(args.cover_type) && (args.cover_type.indexOf('3') == -1 + args.cover_type.indexOf(3) == -1))
        {
            args.cover_type = jss.isArray(args.cover_type) ? args.cover_type.join(',') : args.cover_type;
            cs.push(" instr(','+?+',' , ','+ifnull(cover_type,'1')+',') > 0 ");
            vs.push(args.cover_type);
        }
        if (!jss.isEmpty(args.firstscene_type))
        {
            cs.push(" instr(','+?+',' , ','+firstscene_type+',') > 0 ");
            vs.push(args.firstscene_type);
        }
        if (!jss.isEmpty(args.firstscene_name))
        {
            cs.push(" instr(','+?+',' , ','+firstscene_name+',') > 0 ");
            vs.push(args.firstscene_name);
        }
        if (!jss.isEmpty(args.phygrid_id))
        {
            cs.push(" instr(','+?+',' , ','+phygrid_id+',') > 0 ");
            vs.push(args.phygrid_id);
        }
        if (!jss.isEmpty(args.vendor_id) && network.toLowerCase().substring(0, 3) != "lte")
        {
            cs.push(" instr(','+?+',' , ','+vendor_id+',') > 0 ");
            vs.push(args.vendor_id);
        }
        else if (!jss.isEmpty(args.vendor_id) && network.toLowerCase().substring(0, 3) == "lte")
        {
            cs.push(" instr(','+?+',' , ','+vendor_enb_id+',') > 0 ");
            vs.push(args.vendor_id);
        }
        if (!jss.isEmpty(args.uarfcn_dl))
        {
            cs.push(" instr(','+?+',' , ','+uarfcn_dl+',') > 0 ");
            vs.push(args.uarfcn_dl);
        }
        if (!jss.isEmpty(args) && !jss.isEmpty(args.work_state))
        {
            cs.push(" instr(','+?+',' , ','+work_state+',') > 0 ");
            vs.push(args.work_state);
        }
        if (!jss.isEmpty(args) && !jss.isEmpty(args.operate_state))
        {
            cs.push(" instr(','+?+',' , ','+operate_state+',') > 0 ");
            vs.push(args.operate_state);
        }
        this.AppendIsSceneCond(args, cs);
        if (!jss.isEmpty(args.bsc_id))
        {
            cs.push(" instr(','+?+',' , ','+related_bsc+',') > 0 ");
            vs.push(args.bsc_id);
        }
        if (!jss.isEmpty(args.rnc_id))
        {
            cs.push(" instr(','+?+',' , ','+related_rnc+',') > 0 ");
            vs.push(args.rnc_id);
        }

        var cond = "", coorcond = "";
        if (cs.length > 0)
            cond = ' and ' + cs.join(' and ');
        if (cscoor.length > 0)
            coorcond = ' and ' + cscoor.join(' and ');

        sql += cond + coorcond;
        vs = vs.concat(vscoor);

        jss.log(sql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs);
        sc.print('{cells: ');
        Database.write_perf(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs));

        sc.println('}');
        jss.log('GetCell_perf sqlite 查询小区完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    GetCell: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件

        // paln_15为历史数据，latest为最新数据
        var tableEx = args.historyData ? "plan_15" : "latest";

        var sql, polysql = "", cs = [], vs = [], cscoor = [], vscoor = [], csxy = [], vsxy = [], type;
        if (!jss.isEmpty(args.network) && args.network.toLowerCase().substring(0, 3) == "lte")
        {
            jss.log('查询LTE小区！！！！！！！！！！！！！！！');

            type = this.__polygon_type.ecell;
            sql = "select /*+ no_use_merge(c,pi) ,use_nl(c,pi) */ ci id, CELL_NAME name, longitude, latitude, null x, null y" + this.SelectSceneName(args, ', cell.')
                + ", ant_azimuth antennadirection"
                + ", nvl(mod(mod(ant_azimuth, 360) + 360, 360),360) direction"
                + ", case nvl(cover_type,'1') when '1' then 15 when '4' then 15 else 11 end radius"
                + ", case nvl(cover_type,'1') when '1' then 30 when '4' then 30 else 360 end angle"
                + ", tac, CI, '' SC, ANT_HIGH, uarfcn_ul, uarfcn_dl, ant_electangle, ant_machangle "
                + ", RRUCELL_FLAG RRU_CELL_FLAG,'' DOWN_FREQ,'' UP_FREQ,'' sector_id"
                + ",nvl(cover_type,'1') cover_type, lte_system, c.province_name,c.city_name "
                + " from s_conf_etrancell_" + tableEx + " cell, cfg_cityinfo c "//, cfg_gis_polygon p, cfg_gis_polygon_items pi "
                + " where cell.province_id = c.province_code and cell.city_id = c.city_code "
                //+ " and p.id = pi.id and pi.item = cell.cell_id "
                + " and cell.longitude is not null and cell.latitude is not null and ci is not null ";

            polysql = " select p.minX left, p.minY top,(p.maxX - p.minX) width,(p.maxY - p.minY) height, p.pts,pi.items,p.id from cfg_gis_polygon p, "
                + " (select id, '[''' || listagg(item, ''',''') WITHIN GROUP(ORDER BY null) || ''']' items "
                + " from (select /*+ no_use_merge(c,pi), use_nl(c,pi) */ pi.id,pi.item from s_conf_etrancell_" + tableEx + " cell, cfg_gis_polygon_items pi, cfg_cityinfo c "
                + " where pi.item = cell.ci and cell.province_id = c.province_code and cell.city_id = c.city_code ";

            var para = '';
            if (!jss.isEmpty(args.lte_system) && (args.lte_system.toLowerCase().indexOf('tdd') > -1 || args.lte_system.toLowerCase().indexOf('fdd') > -1))
                para = args.lte_system;
            else if (args.network.toLowerCase().indexOf("tdd") > -1)
                para = 'TDD';
            else if (args.network.toLowerCase().indexOf("fdd") > -1)
                para = 'FDD';
            if (!jss.isEmpty(para))
                sql += " and instr(','||'" + para + "'||',' , ','||upper(cell.lte_system)||',') > 0 ";
        }
        else if (!jss.isEmpty(args.network) && args.network.toLowerCase() == "gsm")
        {
            jss.log('查询GSM小区！！！！！！！！！！！！！！！');
            type = this.__polygon_type.cell;
            sql = "select cell_id id, CELL_NAME name, longitude, latitude, null x, null y" + this.SelectSceneName(args, ', cell.')
                + ", ant_azimuth antennadirection"
                + ", nvl(mod(mod(ant_azimuth, 360) + 360, 360),360) direction"
                + ", case nvl(cover_type,'1') when '1' then 15 when '4' then 15 else 11 end radius"
                + ", case nvl(cover_type,'1') when '1' then 30 when '4' then 30 else 360 end angle"
                + ", LAC, CI, '' SC, ANT_HIGH, '' uarfcn_ul, '' uarfcn_dl,ant_electangle, ant_machangle"
                + ", '' RRU_CELL_FLAG,'' DOWN_FREQ,'' UP_FREQ,'' sector_id"
                + ",nvl(cover_type,'1') cover_type,'' lte_system, c.province_name,c.city_name "
                + " from s_conf_cell_" + tableEx + " cell, cfg_cityinfo c "//, cfg_gis_polygon p, cfg_gis_polygon_items pi "
                + " where cell.province_id = c.province_code and cell.city_id = c.city_code "
            //+ " and p.id = pi.id and pi.item = cell.cell_id "
                + " and cell.longitude is not null and cell.latitude is not null ";

            //polysql = " select p.minX left, p.minY top,(p.maxX - p.minX) width,(p.maxY - p.minY) height, p.pts,pi.items,p.id from cfg_gis_polygon p, "
            //    + " (select id, '[''' || listagg(item, ''',''') WITHIN GROUP(ORDER BY null) || ''']' items "
            //    + " from (select /*+ no_use_merge(c,pi), use_nl(c,pi) */ pi.id,pi.item from s_conf_cell_" + tableEx + " cell, cfg_gis_polygon_items pi, cfg_cityinfo c "
            //    + " where pi.item = cell.cell_id and cell.province_id = c.province_code and cell.city_id = c.city_code ";
        }
        else if (!jss.isEmpty(args.network) && args.network.toLowerCase() == "wcdma")
        {
            jss.log('查询WCDMA小区！！！！！！！！！！！！！！！');
            type = this.__polygon_type.ucell;
            sql = "select cell.cell_id id, CELL_NAME name, longitude, latitude, null x, null y" + this.SelectSceneName(args, ', cell.')
                + ", ant_azimuth antennadirection"
                + ", nvl(mod(mod(ant_azimuth, 360) + 360, 360),360) direction"
                + ", case nvl(cover_type,'1') when '1' then 15 when '4' then 15 else 11 end radius"
                + ", case nvl(cover_type,'1') when '1' then 30 when '4' then 30 else 360 end angle"
                + ", cell.LAC, cell.CI, psc SC, ANT_HIGH, uarfcn_ul, uarfcn_dl, ant_electangle, ant_machangle"
                + ", RRUCELL_FLAG RRU_CELL_FLAG,'' DOWN_FREQ,'' UP_FREQ,cell.platform_sector_defid sector_id"
                + ",nvl(cover_type,'1') cover_type, '' lte_system, c.province_name,c.city_name "
                + " from s_conf_utrancell_" + tableEx + " cell, cfg_cityinfo c "//, cfg_gis_polygon p, cfg_gis_polygon_items pi "
                + " where cell.province_id = c.province_code and cell.city_id = c.city_code "
            //+ " and p.id = pi.id and pi.item = cell.cell_id "
                + " and cell.longitude is not null and cell.latitude is not null ";

            polysql = " select p.minX left, p.minY top,(p.maxX - p.minX) width,(p.maxY - p.minY) height, p.pts,pi.items,p.id from cfg_gis_polygon p, "
                + " (select id, '[''' || listagg(item, ''',''') WITHIN GROUP(ORDER BY null) || ''']' items "
                + " from (select /*+ no_use_merge(c,pi), use_nl(c,pi) */ pi.id,pi.item from s_conf_utrancell_" + tableEx + " cell, cfg_gis_polygon_items pi, cfg_cityinfo c "
                + " where pi.item = cell.cell_id and cell.province_id = c.province_code and cell.city_id = c.city_code ";
        }
        else
            jss.log('查询条件的小区网络制式错误，不能确定查询的工参表！');

        if (args.historyData)
        {
            if (!jss.isEmpty(args.starttime))
            {
                sql += " and trunc(timemark,'mm') = to_date('" + args.starttime.substr(0, 7) + "','yyyy-mm') ";
            }
            else if (!jss.isEmpty(args.starttime_in))
            {
                var dtms = args.starttime_in.split(",");
                if (dtms.length > 0)
                {
                    var cond = " and (", arrcond = [];
                    for (var i = 0, n = dtms.length; i < n; i++)
                    {
                        arrcond.push(" trunc(timemark,'mm') = to_date('" + dtms[i].substr(0, 7) + "','yyyy-mm') ");
                    }
                    cond += arrcond.join(" or ") + ")";
                    sql += cond;
                }
            }
        }

        // 省份地市条件
        this.__provcond(args, cs, vs, "province_code", "province_name", "city_code", "city_name", "c");
        // 经纬度条件
        this.__coorwidencond(args, cscoor, vscoor, "cell", 0.01);
        // 逻辑坐标条件
        this.__logiccoorcond(args, csxy, vsxy);

        if (!jss.isEmpty(args.cover_type) && args.cover_type!='0' && (args.cover_type.indexOf('3') == -1 || args.cover_type.indexOf(3) == -1))
        {
            args.cover_type = jss.isArray(args.cover_type) ? args.cover_type.join(',') : args.cover_type;
            cs.push(" instr(','||?||',' , ','||nvl(cover_type,'1')||',') > 0 ");
            vs.push(args.cover_type);
        }
        if (!jss.isEmpty(args.firstscene_type))
        {
            cs.push(" instr(','||?||',' , ','||firstscene_type||',') > 0 ");
            vs.push(args.firstscene_type);
        }
        if (!jss.isEmpty(args.firstscene_name))
        {
            cs.push(" instr(','||?||',' , ','||firstscene_name||',') > 0 ");
            vs.push(args.firstscene_name);
        }
        if (!jss.isEmpty(args.phygrid_id))
        {
            cs.push(" instr(','||?||',' , ','||phygrid_id||',') > 0 ");
            vs.push(args.phygrid_id);
        }
        if (!jss.isEmpty(args.phygrid_name))
        {
            cs.push(" instr(','||?||',' , ','||phygrid_name||',') > 0 ");
            vs.push(args.phygrid_name);
        }
        //if (!jss.isEmpty(args.vendor_id))
        //{
        //    cs.push(" instr(','||?||',' , ','||vendor_id||',') > 0 ");
        //    vs.push(args.vendor_id);
        //}
        if (!jss.isEmpty(args.vendor_id) && network.toLowerCase().substring(0, 3) != "lte")
        {
            cs.push(" instr(','||?||',' , ','||vendor_id||',') > 0 ");
            vs.push(args.vendor_id);
        }
        else if (!jss.isEmpty(args.vendor_id) && network.toLowerCase().substring(0, 3) == "lte")
        {
            cs.push(" instr(','||?||',' , ','||vendor_enb_id||',') > 0 ");
            vs.push(args.vendor_id);
        }
        if (!jss.isEmpty(args.uarfcn_dl))
        {
            cs.push(" instr(','||?||',' , ','||uarfcn_dl||',') > 0 ");
            vs.push(args.uarfcn_dl);
        }
        if (!jss.isEmpty(args) && !jss.isEmpty(args.work_state))
        {
            cs.push(" instr(','||?||',' , ','||work_state||',') > 0 ");
            vs.push(args.work_state);
        }
        if (!jss.isEmpty(args) && !jss.isEmpty(args.operate_state))
        {
            cs.push(" instr(','||?||',' , ','||operate_state||',') > 0 ");
            vs.push(args.operate_state);
        }
        this.AppendIsSceneCond(args, cs);
        if (!jss.isEmpty(args.bsc_id))
        {
            cs.push(" instr(','||?||',' , ','||related_bsc||',') > 0 ");
            vs.push(args.bsc_id);
        }
        if (!jss.isEmpty(args.rnc_id))
        {
            cs.push(" instr(','||?||',' , ','||related_rnc||',') > 0 ");
            vs.push(args.rnc_id);
        }

        var cond = "", coorcond = "", xycond = "", vsxy;
        if (cs.length > 0)
            cond = ' and ' + cs.join(' and ');
        if (cscoor.length > 0)
            coorcond = ' and ' + cscoor.join(' and ');
        if (csxy.length > 0)
            xycond = " and " + csxy.join(' and ');

        if (args.network.toLowerCase().substring(0, 3) == "lte")
        {
            sql += cond + coorcond;
            polysql += cond + " ) group by id) pi "
                + " where p.id = pi.id and pi.items != '[]' "
                + " and type = " + type + xycond;

            vsxy = vs.concat(vsxy);
            vs = vs.concat(vscoor);
        }
        else
        {
            sql += cond + coorcond;
            vs = vs.concat(vscoor);
        }

        if (!jss.isEmpty(args.zoomlevel))
            sql += " order by cell.longitude, cell.latitude ";

        jss.log(sql);
        jss.log(polysql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(vsxy));
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs);
        sc.print('{cells: ');
        // 聚合
        if (!jss.isEmpty(args.zoomlevel))
        {
            var distance = 0, level = args.zoomlevel, converge = this.__map_cell_converge;
            for (var name in converge)
            {
                if (jss.toNumber(level) <= jss.toNumber(name))
                {
                    distance = converge[name];
                    break;
                }
            }
            jss.log('小区聚合距离为：' + distance);
            Database.write(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs), distance);
        }
        else
            Database.write(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs));

        if (args.network.toLowerCase().substring(0, 3) == "lte")
        {
            sc.println(',');
            sc.print('polygon:'); jss.log('开始查询小区多边形数据！');
            sc.database.writeAll(sc.out, polysql, vsxy);
        }

        sc.println('}');
        jss.log('查询小区完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    GetBuildingItem: function (sc, id)
    {
        var sql = "SELECT * FROM S_CONF_INDOOR_BUIDING_15 WHERE BUILDING_ID=?";
        var rs = sc.database.query(sql, id);

        if (rs.next())
        {
            return [
				['常规', '楼宇编号', jss.toString(rs.getObject('building_id'))],
				['常规', '省分', jss.toString(rs.getObject('province_id'))],
				['常规', '地市', jss.toString(rs.getObject('city_id'))],
				['常规', '区/县', jss.toString(rs.getObject('related_county'))],
				['常规', '所属地域类型', jss.toString(rs.getObject('Region'))],
				['常规', '区域名称', jss.toString(rs.getObject('area_name'))],
				['常规', '区域类型', jss.toString(rs.getObject('area_type'))],
				['常规', '区域子类型', jss.toString(rs.getObject('area_subtype'))],
				['常规', '楼宇名称/楼宇号', jss.toString(rs.getObject('building_name'))],
				['常规', '楼宇类型', jss.toString(rs.getObject('building_type'))],
				['常规', '经度', jss.toString(rs.getObject('longitude'))],
				['常规', '纬度', jss.toString(rs.getObject('latitude'))],
				['常规', '建筑面积(万m2)', jss.toString(rs.getObject('building_acreage'))],
				['常规', '覆盖方式', jss.toString(rs.getObject('cover_type'))],
				['常规', '需室分覆盖面积(万m2)', jss.toString(rs.getObject('indoor_cover_acreage'))],
				['常规', '室分已覆盖面积(万m2)', jss.toString(rs.getObject('indoor_alrd_acreage'))],
				['常规', '已覆盖网络制式', jss.toString(rs.getObject('alrd_cver_net'))],
				['常规', '楼宇分类', jss.toString(rs.getObject('building_category'))],
				['常规', '所属网格', jss.toString(rs.getObject('gridding_name'))],
				['常规', '网格类型', jss.toString(rs.getObject('gridding_type'))],
				['常规', '分布系统类型', jss.toString(rs.getObject('distributed_system_type'))],
				['常规', '分布系统资源状态', jss.toString(rs.getObject('dissystem_resouce_status'))],
				['常规', '分布系统建设年份', jss.toString(rs.getObject('dissystem_build_year'))],
				['常规', '分布系统通道数量', jss.toString(rs.getObject('dissystem_channel_num'))],
				['常规', '室分共建共享情况', jss.toString(rs.getObject('indoor_share_situation'))],
				['常规', 'LTE制式', jss.toString(rs.getObject('lte_type'))],
				['常规', '信源通道配置', jss.toString(rs.getObject('signalsrc_channel_config'))],
				['常规', 'LTE信源设备配置', jss.toString(rs.getObject('lte_signalsrc_devconfig'))],
				['常规', 'LTEBBU数量(个)', jss.toString(rs.getObject('lte_bbu_num'))],
				['常规', 'LTERRU数量(个)', jss.toString(rs.getObject('lte_rru_num'))],
				['常规', 'LTE载频数量(个)', jss.toString(rs.getObject('lte_freq_num'))],
				['常规', '3G制式', jss.toString(rs.getObject('type_3g'))],
				['常规', '3G信源设备配置', jss.toString(rs.getObject('signalsrc_devconfig_3g'))],
				['常规', '3GBBU数量(个)', jss.toString(rs.getObject('bbu_num_3g'))],
				['常规', '3GRRU数量(个)', jss.toString(rs.getObject('rru_num_3g'))],
				['常规', '3G载扇数量(个)', jss.toString(rs.getObject('freq_num_3g'))],
				['常规', '2G制式', jss.toString(rs.getObject('type_2g'))],
				['常规', '2G信源设备配置', jss.toString(rs.getObject('signalsrc_devconfig_2g'))],
				['常规', 'BTS数量(个)', jss.toString(rs.getObject('bts_num'))],
				['常规', '2G载频数量(个)', jss.toString(rs.getObject('freq_num_2g'))],
				['常规', '归属综合业务接入区名称', jss.toString(rs.getObject('home_intersrv_accessname'))],
				['常规', '3GBBU集中设置的楼宇编号或宏基站站址ID', jss.toString(rs.getObject('wbbubuildnum_or_stationid'))],
				['常规', '3GBBU集中放置机房是否为综合业务接入点', jss.toString(rs.getObject('is_intersrvacces_wbbroom'))],
				['常规', 'LTEBBU集中设置的楼宇编号或宏基站站址ID', jss.toString(rs.getObject('ltebbubuildnum_or_stationid'))],
				['常规', 'LTEBBU集中放置机房是否为综合业务接入点', jss.toString(rs.getObject('is_intersrvacces_ltebbugbbroom'))]
            ];
        }
    },
    GetBuilding: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args')), sql, cs = [], vs = [];
        args = this.__getquerycond(args); // 获取条件

        jss.log('查询室内建筑！！！！！！！！！！！！！！！');

        sql = "SELECT BUILDING_ID ID,"
        	+ "BUILDING_NAME NAME,"
            + "longitude, latitude, null x, null y, "
            + "TIMEMARK"
            + " FROM S_CONF_INDOOR_BUIDING_15 WHERE 1=1";

        if (!jss.isEmpty(args.starttime))
        {
            cs.push("trunc(timemark,'mm') = to_date('" + args.starttime.substr(0, 7) + "','yyyy-mm') ");
        }
        if (!jss.isEmpty(args.province_id))
        {
            cs.push("PROVINCE_ID = ?");
            vs.push(args.province_id);
        }
        if (!jss.isEmpty(args.city_id))
        {
            cs.push("CITY_ID IN (?)");
            vs.push(args.city_id);
        }
        if (!jss.isEmpty(args.building_category))
        {
            var v = args.building_category.split(',');
            var c = [];
            for (var i = 0; i < v.length; i++)
            {
                c.push('?');
                vs.push(v[i]);
            }
            cs.push("BUILDING_CATEGORY IN (" + c.join(',') + ")");
        }

        this.__coorcond(args, cs, vs, "S_CONF_INDOOR_BUIDING_15");
        cs.push('rownum < 10000');
        if (cs.length > 0)
            sql += ' and ' + cs.join(' and ');

        jss.log(sql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs);
        sc.print('{cells: ');
        Database.write(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs));
        sc.println('}');
        jss.log('查询室内建筑完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    GetPhysicalItem: function (sc, id)
    {
        var sql = "SELECT * FROM S_CONF_OUTPHYSITE_LATEST WHERE PHY_LOCATION_ID=?";
        var rs = sc.database.query(sql, id);

        if (rs.next())
        {
            return [
				['常规', '物理站址编号', jss.toString(rs.getObject('phy_location_id'))],
				['常规', '物理站址名称', jss.toString(rs.getObject('phy_location_name'))],
				['常规', '省分', jss.toString(rs.getObject('province_id'))],
				['常规', '地市', jss.toString(rs.getObject('city_id'))],
				['常规', '区/县', jss.toString(rs.getObject('related_county'))],
				['常规', '站址类型', jss.toString(rs.getObject('station_type'))],
				['常规', '建设方式', jss.toString(rs.getObject('construction_type'))],
				['常规', '天线支撑方式', jss.toString(rs.getObject('attenna_support_type'))],
				['常规', '是否为综合业务接入点', jss.toString(rs.getObject('is_serviceaccesspoint'))],
				['常规', '经度', jss.toString(rs.getObject('longitude'))],
				['常规', '纬度', jss.toString(rs.getObject('latitude'))]
				
            ];
        }
    },
    GetTowerExistItem: function (sc, id)
    {
        var sql = "SELECT * FROM S_CONF_TOWER_EXSIT_LATEST WHERE SITE_NO=?";
        var rs = sc.database.query(sql, id);

        if (rs.next())
        {
            return [
				['常规', '站点编号', jss.toString(rs.getObject('site_no'))],
				['常规', '省分', jss.toString(rs.getObject('province_id'))],
				['常规', '地市', jss.toString(rs.getObject('city_id'))],
				['常规', '区/县', jss.toString(rs.getObject('related_county'))],
				['常规', '站点名称', jss.toString(rs.getObject('site_name'))],
				['常规', '站点地址', jss.toString(rs.getObject('site_address'))],
				['常规', '经度', jss.toString(rs.getObject('longitude'))],
				['常规', '纬度', jss.toString(rs.getObject('latitude'))],
				['常规', '场景划分', jss.toString(rs.getObject('scene_type'))],
				['常规', '铁塔类型', jss.toString(rs.getObject('tower_type'))],
				['常规', '塔身高度（米）', jss.toString(rs.getObject('tower_height'))],
				['常规', '最低平台距地面高度（米）', jss.toString(rs.getObject('height_min'))],
				['常规', '平台或抱杆数（个）', jss.toString(rs.getObject('platform_num'))],
				['常规', '剩余平台数（个）', jss.toString(rs.getObject('platform_left_num'))],
				['常规', '站点属性', jss.toString(rs.getObject('site_type'))]
				
				
            ];
        }
    },
    GetPhysical: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args')), sql, cs = [], vs = [];
        args = this.__getquerycond(args); // 获取条件

        jss.log('物理站址详表！！！！！！！！！！！！！！！');

        sql = "SELECT PHY_LOCATION_ID ID,"
        	+ "PHY_LOCATION_NAME NAME,"
            + "longitude, latitude, null x, null y, "
            + "TIMEMARK"
            + " FROM S_CONF_OUTPHYSITE_LATEST WHERE 1=1";

        if (!jss.isEmpty(args.starttime))
        {
            cs.push("trunc(timemark,'mm') = to_date('" + args.starttime.substr(0, 7) + "','yyyy-mm') ");
        }
        if (!jss.isEmpty(args.province_id))
        {
            cs.push("PROVINCE_ID = ?");
            vs.push(args.province_id);
        }
        if (!jss.isEmpty(args.city_id))
        {
            cs.push("CITY_ID IN (?)");
            vs.push(args.city_id);
        }
        if (!jss.isEmpty(args.station_type))
        {
            var v = args.station_type.split(',');
            var c = [];
            for (var i = 0; i < v.length; i++)
            {
                c.push('?');
                vs.push(v[i]);
            }
            cs.push("station_type IN (" + c.join(',') + ")");
        }

        this.__coorcond(args, cs, vs, "S_CONF_OUTPHYSITE_LATEST");
        cs.push('rownum < 10000');
        if (cs.length > 0)
            sql += ' and ' + cs.join(' and ');

        jss.log(sql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs);
        sc.print('{cells: ');
        Database.write(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs));
        sc.println('}');
        jss.log('查询物理站址完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    GetSector: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件

        var sql, polysql, cs = [], vs = [], csxy = [], vsxy = [];
        jss.log('查询扇区！！！！！！！！！！！！！！！');
        sql = "select /*+ no_use_merge(c,pi) ,use_nl(c,pi) */ platform_sector_defid id, platform_sector_defid name, longitude, latitude, null x, null y" + this.SelectSceneName(args, ', sector.')
            + ", antenna antennadirection, mod(mod(antenna, 360) + 360, 360) direction,15 radius, 60 angle"
            + ", carrier_num, phygrid_id, phygrid_name, phy_location_id"
            + ", firstscene_type,firstscene_name,platform_sector_defid sector_id, c.province_name,c.city_name"
            + " from s_conf_utransector_latest sector, cfg_cityinfo c, cfg_gis_polygon p, cfg_gis_polygon_items pi  "
            + " where sector.province_id = c.province_code and sector.city_id = c.city_code "
            + " and p.id = pi.id and pi.item = sector.platform_sector_defid "
            + " and sector.antenna is not null and sector.longitude is not null and sector.latitude is not null ";

        polysql = " select p.minX left, p.minY top,(p.maxX - p.minX) width,(p.maxY - p.minY) height, p.pts,pi.items,p.id from cfg_gis_polygon p, "
            + " (select id, '[''' || listagg(item, ''',''') WITHIN GROUP(ORDER BY null) || ''']' items "
            + " from (select /*+ use_nl(c,pi) */ pi.id,pi.item from s_conf_utransector_latest sector, cfg_gis_polygon_items pi, cfg_cityinfo c "
            + " where pi.item = sector.platform_sector_defid and sector.province_id = c.province_code and sector.city_id = c.city_code ";

        //if (!jss.isEmpty(args.starttime))
        //{
        //    sql += " and trunc(timemark,'mm') = to_date('" + args.starttime.substr(0, 7) + "','yyyy-mm') ";
        //    polysql += " and trunc(timemark,'mm') = to_date('" + args.starttime.substr(0, 7) + "','yyyy-mm') ";
        //}
        //if (!jss.isEmpty(args.starttime_in))
        //{
        //    var dtms = args.starttime_in.split(",");
        //    if (dtms.length > 0)
        //    {
        //        var cond = " and (", polycond = " and (";
        //        var arrcond = [], arrpolycond = [];
        //        for (var i = 0, n = dtms.length; i < n; i++)
        //        {
        //            arrcond.push(" trunc(timemark,'mm') = to_date('" + dtms[i].substr(0, 7) + "','yyyy-mm') ");
        //            arrpolycond.push(" trunc(timemark,'mm') = to_date('" + dtms[i].substr(0, 7) + "','yyyy-mm') ");
        //        }
        //        cond += arrcond.join(" or ") + ")";
        //        polycond += arrcond.join(" or ") + ")";
        //        sql += cond;
        //        polysql += polycond;
        //    }
        //}

        // 省份地市条件
        this.__provcond(args, cs, vs, "province_code", "province_name", "city_code", "city_name", "c");
        // 逻辑坐标条件
        this.__logiccoorcond(args, csxy, vsxy);

        if (!jss.isEmpty(args.firstscene_type))
        {
            cs.push(" instr(','||?||',' , ','||sector.firstscene_type||',') > 0 ");
            vs.push(args.firstscene_type);
        }
        if (!jss.isEmpty(args.scenetype_name))
        {
            cs.push(" instr(','||?||',' , ','||sector.firstscene_type||',') > 0 ");
            vs.push(args.scenetype_name);
        }
        if (!jss.isEmpty(args.scene_name))
        {
            cs.push(" instr(','||?||',' , ','||sector.firstscene_name||',') > 0 ");
            vs.push(args.scene_name);
        }
        if (!jss.isEmpty(args.firstscene_name))
        {
            cs.push(" instr(','||?||',' , ','||sector.firstscene_name||',') > 0 ");
            vs.push(args.firstscene_name);
        }
        if (!jss.isEmpty(args.phygrid_id))
        {
            cs.push(" instr(','||?||',' , ','||sector.phygrid_id||',') > 0 ");
            vs.push(args.phygrid_id);
        }
        if (!jss.isEmpty(args.phygrid_name))
        {
            cs.push(" instr(','||?||',' , ','||sector.phygrid_name||',') > 0 ");
            vs.push(args.phygrid_name);
        }

        this.AppendIsSceneCond(args, cs);

        var cond = "", xycond = "";
        if (cs.length > 0)
            cond = ' and ' + cs.join(' and ');
        if (csxy.length > 0)
            xycond = " and " + csxy.join(' and ');

        sql += cond + " and p.type = " + this.__polygon_type.sector + xycond;
        polysql += cond + " ) group by id) pi "
            + " where p.id = pi.id and pi.items != '[]' "
            + " and type = " + this.__polygon_type.sector + xycond;

        vs = vs.concat(vsxy);

        jss.log(sql);
        jss.log(polysql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs);
        sc.print('{cells: ');
        Database.write(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs));

        sc.println(',');
        sc.print('polygon:');
        sc.database.writeAll(sc.out, polysql, vs);

        sc.println('}');
        jss.log('查询扇区完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    GetSurface: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件

        var sql, polysql, cs = [], vs = [], csxy = [], vsxy = [];
        jss.log('查询天面！！！！！！！！！！！！！！！');
        sql = "select /*+ use_nl(c,pi) */ sur.province_id,sur.city_id,platform_surface_defid id, platform_surface_defid name" + this.SelectSceneName(args, ', sur.')
            + ", phy_location_id,surface_type, longitude, latitude, null x, null y, phygrid_id,phygrid_name,firstscene_type,firstscene_name,0 direction,5 radius, 360 angle"
            + ", c.province_name,c.city_name"
			+ " from s_conf_surface_latest sur, cfg_cityinfo c, cfg_gis_polygon p, cfg_gis_polygon_items pi "
            + " where sur.province_id = c.province_code and sur.city_id = c.city_code "
            + " and p.id = pi.id and pi.item = sur.platform_surface_defid "
            + " and sur.longitude is not null and sur.latitude is not null and sur.platform_surface_defid is not null ";

        polysql = " select p.minX left, p.minY top,(p.maxX - p.minX) width,(p.maxY - p.minY) height, p.pts,pi.items,p.id from cfg_gis_polygon p, "
            + " (select id, '[''' || listagg(item, ''',''') WITHIN GROUP(ORDER BY null) || ''']' items "
            + " from (select /*+ use_nl(c,pi) */ pi.id,pi.item from s_conf_surface_latest sur, cfg_gis_polygon_items pi, cfg_cityinfo c "
            + " where pi.item = sur.platform_surface_defid and sur.province_id = c.province_code and sur.city_id = c.city_code ";

        //if (!jss.isEmpty(args) && !jss.isEmpty(args.starttime))
        //{
        //    sql += " and trunc(timemark,'mm') = to_date('" + args.starttime.substr(0, 7) + "','yyyy-mm') ";
        //    polysql += " and trunc(timemark,'mm') = to_date('" + args.starttime.substr(0, 7) + "','yyyy-mm') ";
        //}
        //if (!jss.isEmpty(args) && !jss.isEmpty(args.starttime_in))
        //{
        //    var dtms = args.starttime_in.split(",");
        //    if (dtms.length > 0)
        //    {
        //        var cond = " and (", polycond = " and (";
        //        var arrcond = [], arrpolycond = [];
        //        for (var i = 0, n = dtms.length; i < n; i++)
        //        {
        //            arrcond.push(" trunc(timemark,'mm') = to_date('" + dtms[i].substr(0, 7) + "','yyyy-mm') ");
        //            arrpolycond.push(" trunc(timemark,'mm') = to_date('" + dtms[i].substr(0, 7) + "','yyyy-mm') ");
        //        }
        //        cond += arrcond.join(" or ") + ")";
        //        polycond += arrcond.join(" or ") + ")";
        //        sql += cond;
        //        polysql += polycond;
        //    }
        //}

        // 省份地市条件
        this.__provcond(args, cs, vs, "province_code", "province_name", "city_code", "city_name", "c");
        // 逻辑坐标条件
        this.__logiccoorcond(args, csxy, vsxy);

        if (!jss.isEmpty(args.firstscene_type))
        {
            cs.push(" instr(','||?||',' , ','||sur.firstscene_type||',') > 0 ");
            vs.push(args.firstscene_type);
        }
        if (!jss.isEmpty(args.firstscene_name))
        {
            cs.push(" instr(','||?||',' , ','||sur.firstscene_name||',') > 0 ");
            vs.push(args.firstscene_name);
        }
        if (!jss.isEmpty(args.phygrid_id))
        {
            cs.push(" instr(','||?||',' , ','||sur.phygrid_id||',') > 0 ");
            vs.push(args.phygrid_id);
        }
        if (!jss.isEmpty(args.phygrid_name))
        {
            cs.push(" instr(','||?||',' , ','||sur.phygrid_name||',') > 0 ");
            vs.push(args.phygrid_name);
        }

        this.AppendIsSceneCond(args, cs);

        var cond = "", xycond = "";
        if (cs.length > 0)
            cond = ' and ' + cs.join(' and ');
        if (csxy.length > 0)
            xycond = " and " + csxy.join(' and ');

        sql += cond + " and p.type = " + this.__polygon_type.surface + xycond;
        polysql += cond + " ) group by id) pi "
            + " where p.id = pi.id and pi.items != '[]' "
            + " and type = " + this.__polygon_type.surface + xycond;

        vs = vs.concat(vsxy);

        jss.log(sql);
        jss.log(polysql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs);
        sc.print('{cells: ');
        Database.write(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs));

        sc.println(',');
        sc.print('polygon: ');
        sc.database.writeAll(sc.out, polysql, vs);

        sc.println('}');
        jss.log('查询天面完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    GetGrid: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件

        var sql, cs = [], vs = [];
        jss.log('查询工参栅格！！！！！！！！！！！！！！！');

        var tbl = '';
        if (!jss.isEmpty(args.gridsize))
            tbl = args.gridsize;
        else
        {
            jss.log('未指定栅格的大小，不能确定查询的表！！！！！！');
            return;
        }
        sql = " select * from s_conf_square_" + tbl + " grid where 1 > 0 ";

        // 省份地市条件
        if (!jss.isEmpty(args.city_id) || !jss.isEmpty(args.city) || !jss.isEmpty(args.city_code))
        {
            var val = !jss.isEmpty(args.city_id) ? args.city_id : (!jss.isEmpty(args.city) ? args.city : args.city_code);
            cs.push(" city_id = ? ");
            vs.push(val);
        }
        // 经纬度矩形范围条件
        this.__coorrectcond(args, cs, vs, "grid");

        if (cs.length > 0)
            sql += ' and ' + cs.join(' and ');

        jss.log(sql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs);
        sc.print('{cells: ');
        Database.write(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs));

        sc.println('}');
        jss.log('查询栅格工参完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    __map_bts_converge: {
        '6': 20000,
        '7': 15000,
        '8': 12000,
        '9': 10000,
        '10': 8000,
        '11': 6000,
        '12': 4000,
        '13': 2000,
        '14': 1000,
        '15': 500
    },
    __getbts: function (sc, iscover)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件

        var coverbts = {
            ltetbl: iscover ? "v_s_conf_enodeb_of_cell" : "s_conf_enodeb_latest",
            btstbl: iscover ? "v_s_conf_bts_of_cell" : "s_conf_bts_latest",
            wcdmatbl: iscover ? "v_s_conf_nodeb_of_cell" : "s_conf_nodeb_latest"
        };
        var covertype_dft = "''";
        if (iscover)
            covertype_dft = "";

        var sql, polysql, cs = [], vs = [], cscoor = [], vscoor = [], csxy = [], vsxy = [], type;
        if (!jss.isEmpty(args.network) && args.network.toLowerCase() == "lte")
        {
            jss.log('查询LTE基站！！！！！！！！！！！！！！！');
            type = this.__polygon_type.enodeb;
            sql = "select province_id,city_id,enb_id id, enb_name name" + this.SelectSceneName(args, ', bts.')
                + ", site_status, enb_state, lte_system, construct_type, longitude, latitude, null x, null y, phygrid_id,phygrid_name"
                + ", '' firstscene_type,'' firstscene_name,0 direction,12 radius, 360 angle," + covertype_dft + " cover_type, c.province_name,c.city_name"
                + " from " + coverbts.ltetbl + " bts, cfg_cityinfo c "
                + " where bts.province_id = c.province_code and bts.city_id = c.city_code "
                + " and longitude is not null and latitude is not null ";

            polysql = " select p.minX left, p.minY top,(p.maxX - p.minX) width,(p.maxY - p.minY) height, p.pts,pi.items,p.id from cfg_gis_polygon p, "
                + " (select id, '[''' || listagg(item, ''',''') WITHIN GROUP(ORDER BY null) || ''']' items "
                + " from (select pi.id,pi.item from " + coverbts.ltetbl + " bts, cfg_gis_polygon_items pi, cfg_cityinfo c "
                + " where pi.item = bts.enb_id and bts.province_id = c.province_code and bts.city_id = c.city_code ";
        }
        else if (!jss.isEmpty(args.network) && args.network.toLowerCase() == "gsm")
        {
            jss.log('查询GSM基站！！！！！！！！！！！！！！！');
            type = this.__polygon_type.bts;
            sql = "select province_id,city_id,bts_id id, bts_name name" + this.SelectSceneName(args, ', bts.')
                + ", site_status, site_type, site_address, site_state, longitude, latitude, null x, null y, phygrid_id,phygrid_name"
                + ", '' firstscene_type,'' firstscene_name,0 direction,12 radius, 360 angle," + covertype_dft + " cover_type, c.province_name,c.city_name"
                + " from " + coverbts.btstbl + " bts, cfg_cityinfo c "
                + " where bts.province_id = c.province_code and bts.city_id = c.city_code "
                + " and longitude is not null and latitude is not null ";

            polysql = " select p.minX left, p.minY top,(p.maxX - p.minX) width,(p.maxY - p.minY) height, p.pts,pi.items,p.id from cfg_gis_polygon p, "
                + " (select id, '[''' || listagg(item, ''',''') WITHIN GROUP(ORDER BY null) || ''']' items "
                + " from (select pi.id,pi.item from " + coverbts.btstbl + " bts, cfg_gis_polygon_items pi, cfg_cityinfo c "
                + " where pi.item = bts.bts_id and bts.province_id = c.province_code and bts.city_id = c.city_code ";
        }
        else if (!jss.isEmpty(args.network) && args.network.toLowerCase() == "wcdma")
        {
            jss.log('查询WCDMA基站！！！！！！！！！！！！！！！');
            type = this.__polygon_type.nodeb;
            sql = "select province_id,city_id,related_nodeb id, nodeb_name name" + this.SelectSceneName(args, ', bts.')
                + ", site_status, site_type, site_address, site_state, longitude, latitude, null x, null y, phygrid_id,phygrid_name"
                + ", '' firstscene_type,'' firstscene_name,0 direction,12 radius, 360 angle," + covertype_dft + " cover_type, c.province_name,c.city_name"
                + " from " + coverbts.wcdmatbl + " bts, cfg_cityinfo c "
                + " where bts.province_id = c.province_code and bts.city_id = c.city_code "
                + " and longitude is not null and latitude is not null ";

            polysql = " select p.minX left, p.minY top,(p.maxX - p.minX) width,(p.maxY - p.minY) height, p.pts,pi.items,p.id from cfg_gis_polygon p, "
                + " (select id, '[''' || listagg(item, ''',''') WITHIN GROUP(ORDER BY null) || ''']' items "
                + " from (select pi.id,pi.item from " + coverbts.wcdmatbl + " bts, cfg_gis_polygon_items pi, cfg_cityinfo c "
                + " where pi.item = bts.related_nodeb and bts.province_id = c.province_code and bts.city_id = c.city_code ";
        }
        else
            jss.log('查询条件的基站网络制式错误，不能确定查询的工参表！');

        //if (!jss.isEmpty(args) && !jss.isEmpty(args.starttime))
        //{
        //    sql += " and trunc(timemark,'mm') = to_date('" + args.starttime.substr(0, 7) + "','yyyy-mm') ";
        //    polysql += " and trunc(timemark,'mm') = to_date('" + args.starttime.substr(0, 7) + "','yyyy-mm') ";
        //}
        //if (!jss.isEmpty(args) && !jss.isEmpty(args.starttime_in))
        //{
        //    var dtms = args.starttime_in.split(",");
        //    if (dtms.length > 0)
        //    {
        //        var cond = " and (", polycond = " and (";
        //        var arrcond = [], arrpolycond = [];
        //        for (var i = 0, n = dtms.length; i < n; i++)
        //        {
        //            arrcond.push(" trunc(timemark,'mm') = to_date('" + dtms[i].substr(0, 7) + "','yyyy-mm') ");
        //            arrpolycond.push(" trunc(timemark,'mm') = to_date('" + dtms[i].substr(0, 7) + "','yyyy-mm') ");
        //        }
        //        cond += arrcond.join(" or ") + ")";
        //        polycond += arrcond.join(" or ") + ")";
        //        sql += cond;
        //        polysql += polycond;
        //    }
        //}

        this.AppendIsSceneCond(args, cs);

        // 省份地市条件
        this.__provcond(args, cs, vs, "province_code", "province_name", "city_code", "city_name", "c");
        // 经纬度条件
        this.__coorcond(args, cscoor, vscoor, "bts");
        // 逻辑坐标条件
        this.__logiccoorcond(args, csxy, vsxy);

        if (jss.isNumeric(args.project_scheduled_date))
        {
            cs.push(Math.abs(args.project_scheduled_date) < 2000 ? 'project_scheduled_date = extract(year from sysdate) + ?' : 'project_scheduled_date = ?');
            vs.push(args.project_scheduled_date);
        }

        if (!jss.isEmpty(args.cover_type) && iscover && (args.cover_type.indexOf('3') == -1 || args.cover_type.indexOf(3) == -1))
        {
            args.cover_type = jss.isArray(args.cover_type) ? args.cover_type.join(',') : args.cover_type;
            cs.push(" instr(','||?||',' , ','||nvl(cover_type,'1')||',') > 0 ");
            vs.push(args.cover_type);
        }
        //if (!jss.isEmpty(args.firstscene_type))
        //{
        //    cs.push(" instr(','||?||',' , ','||bts.firstscene_type||',') > 0 ");
        //    vs.push(args.firstscene_type);
        //}
        //if (!jss.isEmpty(args.firstscene_name))
        //{
        //    cs.push(" instr(','||?||',' , ','||bts.firstscene_name||',') > 0 ");
        //    vs.push(args.firstscene_name);
        //}
        if (!jss.isEmpty(args.phygrid_id))
        {
            cs.push(" instr(','||?||',' , ','||bts.phygrid_id||',') > 0 ");
            vs.push(args.phygrid_id);
        }
        if (!jss.isEmpty(args.phygrid_name))
        {
            cs.push(" instr(','||?||',' , ','||bts.phygrid_name||',') > 0 ");
            vs.push(args.phygrid_name);
        }
        if (!jss.isEmpty(args.vendor_id))
        {
            cs.push(" instr(','||?||',' , ','||vendor_id||',') > 0 ");
            vs.push(args.vendor_id);
        }
        if (!jss.isEmpty(args.site_status))
        {
            cs.push(" instr(','||?||',' , ','||bts.site_status||',') > 0 ");
            vs.push(args.site_status);
        }
        if (!jss.isEmpty(args.bsc_id))
        {
            cs.push(" instr(','||?||',' , ','||bts.related_bsc||',') > 0 ");
            vs.push(args.bsc_id);
        }
        if (!jss.isEmpty(args.rnc_id))
        {
            cs.push(" instr(','||?||',' , ','||bts.related_rnc||',') > 0 ");
            vs.push(args.rnc_id);
        }

        var cond = "", coorcond = "", xycond = "";
        if (cs.length > 0)
            cond = ' and ' + cs.join(' and ');
        if (cscoor.length > 0)
            coorcond = ' and ' + cscoor.join(' and ');
        if (csxy.length > 0)
            xycond = " and " + csxy.join(' and ');

        sql += cond + coorcond;
        polysql += cond + " ) group by id) pi "
            + " where p.id = pi.id and pi.items != '[]' "
            + " and type = " + type + xycond;

        if (!jss.isEmpty(args.zoomlevel))
            sql += " order by bts.longitude, bts.latitude ";

        jss.log(sql);
        jss.log(polysql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(vscoor));
        jss.log(jss.encode(vsxy));
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs.concat(vscoor));
        sc.print('{cells: ');
        // 聚合
        if (!jss.isEmpty(args.zoomlevel))
        {
            var distance = 0, level = args.zoomlevel, converge = this.__map_bts_converge;
            for (var name in converge)
            {
                if (jss.toNumber(level) <= jss.toNumber(name))
                {
                    distance = converge[name];
                    break;
                }
            }
            jss.log('基站聚合距离为：' + distance);
            Database.write(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs), distance);
        }
        else
            Database.write(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs));

        sc.println(',');
        sc.print('polygon: ');
        sc.database.writeAll(sc.out, polysql, vs.concat(vsxy));

        sc.println('}');
        jss.log('查询基站完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    GetBts: function (sc)
    {
        this.__getbts(sc, false);
    },
    GetCoverBts: function (sc)
    {
        this.__getbts(sc, true);
    },
    GetRailBts: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件

        var sql, cs = [], vs = [], cscoor = [], vscoor = [];
        var table = "s_conf_gt_station_14"; // 根据参数确定查询的是新建、在建
        var netfield;
        if (!jss.isEmpty(args.builded) && args.builded.toLowerCase() == "new")
            table = "s_conf_gt_station_new_14";

        if (!jss.isEmpty(args.nettype) && args.nettype.toLowerCase() == "2")
        {
            jss.log('查询LTE高铁基站！！！！！！！！！！！！！！！');
            netfield = "lte_logical_site_name";
            sql += " and lte_logical_site_name is not null ";
        }
        else if (!jss.isEmpty(args.nettype) && args.nettype.toLowerCase() == "1")
        {
            jss.log('查询WCDMA高铁基站！！！！！！！！！！！！！！！');
            netfield = "wcdma_logical_site_name";
            sql += " and wcdma_logical_site_name is not null ";
        }
        else
            jss.log('查询条件的高铁基站网络制式错误，不能确定查询的工参表！');

        sql = "select province_id,city_id,sn id,railline_name,province province_name, city city_name, phy_site_name," + netfield + " name,"
            + " longitude, latitude, null x, null y, region_type,site_construction_type, room_construction_type,tower_construction_mode,tower_construction_type,tower_height, "
            + " antenna_type,antenna_height,antenna_height_to_rail,ant_azimuth,ant_electangle, 0 direction,12 radius, 360 angle,'' cover_type "
            + " from " + table + " bts "
            + " where longitude is not null and latitude is not null ";

        if (!jss.isEmpty(args.starttime))
        {
            cs.push(" trunc(timemark,'mm') = to_date(?,'yyyy-mm') ");
            vs.push(args.starttime.substr(0, 7));
        }
        //if (!jss.isEmpty(args.starttime_in))
        //{
        //    var dtms = args.starttime_in.split(",");
        //    if (dtms.length > 0)
        //    {
        //        var cond = " and (", polycond = " and (";
        //        var arrcond = [], arrpolycond = [];
        //        for (var i = 0, n = dtms.length; i < n; i++)
        //        {
        //            arrcond.push(" trunc(timemark,'mm') = to_date('" + dtms[i].substr(0, 7) + "','yyyy-mm') ");
        //            arrpolycond.push(" trunc(timemark,'mm') = to_date('" + dtms[i].substr(0, 7) + "','yyyy-mm') ");
        //        }
        //        cond += arrcond.join(" or ") + ")";
        //        polycond += arrcond.join(" or ") + ")";
        //        sql += cond;
        //        polysql += polycond;
        //    }
        //}

        // 省份地市条件
        this.__provcond(args, cs, vs, "province_id", "province", "city_id", "city", "bts");
        // 经纬度条件
        this.__coorcond(args, cs, vs, "bts");

        var cond = "", coorcond = "", xycond = "";
        if (cs.length > 0)
            sql += ' and ' + cs.join(' and ');

        jss.log(sql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs);
        sc.print('{cells: ');
        Database.write(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs));
        sc.println('}');
        jss.log('查询高铁基站完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    GetAreagridold: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args')), cs = [], vs = [];
        args = this.__getquerycond(args); // 获取条件

        // 最新表结构的SQL
        jss.log('查询网格！！！！！！！！！！！！！！！');
        var sql = "select province_id,city_id,phygrid_id id,phygrid_name name, "
            + " phygrid_size,phygrid_type,maincoverage,timemark, "
            + " longitude, latitude, null x, null y, minlongitude,minlatitude,maxlongitude,maxlatitude,points, c.province_name,c.city_name "
            + " from s_conf_gridding_map_latest grid, cfg_cityinfo c "
            + " where grid.province_id = c.province_code and grid.city_id = c.city_code "
            + " and phygrid_id is not null and points is not null and longitude is not null and latitude is not null ";

        //if (!jss.isEmpty(args) && !jss.isEmpty(args.starttime))
        //{
        //    sql += " and trunc(timemark,'mm') = to_date('" + args.starttime.substr(0, 7) + "','yyyy-mm') ";
        //}
        //if (!jss.isEmpty(args) && !jss.isEmpty(args.starttime_in))
        //{
        //    var dtms = args.starttime_in.split(",");
        //    if (dtms.length > 0)
        //    {
        //        var cond = " and (", polycond = " and (";
        //        var arrcond = [];
        //        for (var i = 0, n = dtms.length; i < n; i++)
        //        {
        //            arrcond.push(" trunc(timemark,'mm') = to_date('" + dtms[i].substr(0, 7) + "','yyyy-mm') ");
        //        }
        //        cond += arrcond.join(" or ") + ")";
        //        sql += cond;
        //    }
        //}

        // 省份地市条件
        this.__provcond(args, cs, vs, "province_code", "province_name", "city_code", "city_name", "c");
        // 经纬度矩形范围条件
        this.__coorrectcond(args, cs, vs, "grid");

        if (!jss.isEmpty(args.firstscene_type))
        {
            cs.push(" instr(','||?||',' , ','||grid.maincoverage||',') > 0 ");
            vs.push(args.firstscene_type);
        }
        if (!jss.isEmpty(args.phygrid_id))
        {
            cs.push(" instr(','||?||',' , ','||grid.phygrid_id||',') > 0 ");
            vs.push(args.phygrid_id);
        }

        if (cs.length > 0)
            sql += ' and ' + cs.join(' and ');

        jss.log(sql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs);
        sc.print('{areagrids: ');
        Database.write(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs));

        sc.println('}');
        jss.log('查询网格完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    GetAreagrid: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args')), cs = [], vs = [];
        args = this.__getquerycond(args); // 获取条件

        // 最新表结构的SQL
        jss.log('查询网格！！！！！！！！！！！！！！！');
        var sql = "select province_id,city_id,phygrid_id id,phygrid_name name, "
            + " phygrid_size,phygrid_type,maincoverage,timemark, "
            + " longitude,latitude,minlongitude,minlatitude,maxlongitude,maxlatitude, c.province_name,c.city_name "
            + " from s_conf_gridding_latest grid, cfg_cityinfo c "
            + " where grid.province_id = c.province_code and grid.city_id = c.city_code "
            + " and grid.phygrid_id is not null and longitude is not null and latitude is not null ";
        //+ " and grid.phygrid_id in ('CQ-WL-CQ-JJ-江津中山镇3-003', 'CQ-WL-CQ-JJ-江津白沙镇5-005','CQ-WL-CQ-JJ-江津四面山镇2-002','CQ-WL-CQ-JJ-江津永兴镇4-004') ";

        var pointssql = "select /*+ use_nl(grid,c) use_hash(lst) */ lst.areagridno id, lst.longitude,lst.latitude, nvl(lst.phygrid_id_num,0) phygrid_id_num "
            + " from s_conf_gridding_latest grid,s_conf_gridding_lst lst, cfg_cityinfo c "
            + " where grid.province_id = c.province_code and grid.city_id = c.city_code and lst.province_id = c.province_code "
            + " and grid.phygrid_id = lst.areagridno and grid.phygrid_id_num = lst.phygrid_id_num "
            + " and grid.phygrid_id is not null and grid.longitude is not null and grid.latitude is not null "
            + " and lst.longitude is not null and lst.latitude is not null ";
        //+ " and grid.phygrid_id in ('CQ-WL-CQ-JJ-江津中山镇3-003', 'CQ-WL-CQ-JJ-江津白沙镇5-005','CQ-WL-CQ-JJ-江津四面山镇2-002','CQ-WL-CQ-JJ-江津永兴镇4-004') ";

        //if (!jss.isEmpty(args) && !jss.isEmpty(args.starttime))
        //{
        //    sql += " and trunc(timemark,'mm') = to_date('" + args.starttime.substr(0, 7) + "','yyyy-mm') ";
        //}
        //if (!jss.isEmpty(args) && !jss.isEmpty(args.starttime_in))
        //{
        //    var dtms = args.starttime_in.split(",");
        //    if (dtms.length > 0)
        //    {
        //        var cond = " and (", polycond = " and (";
        //        var arrcond = [];
        //        for (var i = 0, n = dtms.length; i < n; i++)
        //        {
        //            arrcond.push(" trunc(timemark,'mm') = to_date('" + dtms[i].substr(0, 7) + "','yyyy-mm') ");
        //        }
        //        cond += arrcond.join(" or ") + ")";
        //        sql += cond;
        //    }
        //}

        // 省份地市条件
        this.__provcond(args, cs, vs, "province_code", "province_name", "city_code", "city_name", "c");
        // 经纬度矩形范围条件
        this.__coorrectcond(args, cs, vs, "grid");

        if (!jss.isEmpty(args.firstscene_type))
        {
            cs.push(" instr(','||?||',' , ','||grid.maincoverage||',') > 0 ");
            vs.push(args.firstscene_type);
        }
        if (!jss.isEmpty(args.phygrid_id))
        {
            cs.push(" instr(','||?||',' , ','||grid.phygrid_id||',') > 0 ");
            vs.push(args.phygrid_id);
        }
        if (!jss.isEmpty(args.phygrid_name))
        {
            cs.push(" instr(','||?||',' , ','||grid.phygrid_name||',') > 0 ");
            vs.push(args.phygrid_name);
        }
        if (!jss.isEmpty(args.data_tra_pgn))
        {
            cs.push(" instr(','||?||',' , ','||grid.phygrid_name||',') > 0 ");
            vs.push(args.data_tra_pgn);
        }

        if (cs.length > 0)
        {
            sql += ' and ' + cs.join(' and ');
            pointssql += ' and ' + cs.join(' and ');
        }

        jss.log(sql);
        jss.log(pointssql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(args));

        var header = [{ Name: "province_id" }, { Name: "city_id" }, { Name: "id" }, { Name: "name" }, { Name: "phygrid_size" },
            { Name: "phygrid_type" }, { Name: "maincoverage" }, { Name: "longitude" }, { Name: "latitude" }, { Name: "minlongitude" },
            { Name: "minlatitude" }, { Name: "maxlongitude" }, { Name: "maxlatitude" }, { Name: "province_name" }, { Name: "city_name" },
            { Name: "points" }];

        var rs = sc.database.query(sql, vs);
        var its = [], mapIt = {}, it, key, k, pt = {};
        its.push(header);
        while (rs.next())
        {
            key = jss.toString(rs.getObject('id'));
            it = [jss.toString(rs.getObject('province_id')), jss.toString(rs.getObject('city_id')), key,
                jss.toString(rs.getObject('name')), jss.toString(rs.getObject('phygrid_size')), jss.toString(rs.getObject('phygrid_type')),
                jss.toString(rs.getObject('maincoverage')), jss.toString(rs.getObject('longitude')), jss.toString(rs.getObject('latitude')),
                jss.toString(rs.getObject('minlongitude')), jss.toString(rs.getObject('minlatitude')), jss.toString(rs.getObject('maxlongitude')),
                jss.toString(rs.getObject('maxlatitude')), jss.toString(rs.getObject('province_name')), jss.toString(rs.getObject('city_name')), []];

            its.push(it);
            mapIt[key] = it;
        }

        var idx = header.length - 1;
        key = undefined;
        rs = sc.database.query(pointssql + " order by lst.areagridno,lst.phygrid_id_num,lst.coorindex ", vs);

        var pt = new com.broadtech.unicom.common.Voronoi.Point(), logical = args.latlontype != 'app';
        while (rs.next())
        {
            k = jss.toString(rs.getObject('id'));
            if (key != k)
                it = mapIt[key = k];

            pt.Reset(jss.toNumber(rs.getObject('longitude')), jss.toNumber(rs.getObject('latitude')));
            if (logical)
                GpsOffset.GpsToLogical(pt);

            it[idx].push([pt.x, pt.y, jss.toNumber(rs.getObject('phygrid_id_num'))]);
        }

        sc.print('{areagrids: ');
        sc.print(jss.encode(its));
        sc.println('}');

        jss.log('查询网格完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    GetPlanSite: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args')), cs = [], vs = [];
        args = this.__getquerycond(args); // 获取条件

        var sql = " select l.phy_location_id || '_' || l.net_type site_id,l.net_type,"
            + " l.is_mini_station,l.special_flag,"
            + " l.site_purpose_brad,l.site_purpose_perceiv,"
            + " l.site_purpose_market,l.site_purpose_cover,l.market_import,l.device_type,"
            + " l.device_vender,l.device_conf,l.carrier_num,l.carrier_type,l.channel,"
            + " l.device_natrue,l.major_device_cost,l.ant_feeder_cost,l.project_other_cost,l.last_edit_user,l.last_edit_time,"
            + " l.filter_1,l.filter_2,l.filter_3,l.filter_4,l.filter_5,l.cost_payback,l.user_perception,"
            + " l.high_flow_user,l.high_rank_user,l.high_arpu_user,"
            + " l.stat_flag,l.build_year,l.arfcn,l.sub_net_type,l.bbu_location_id,"

            + " p.phystat_name site_name, "

            + " p.project_id,p.project_name,p.phy_location_id,p.phystat_name,p.province_id,p.city_id,"
            + " p.longitude,p.latitude,p.related_county,p.phygrid_name,p.phygrid_type,p.firstscene_type,"
            + " p.firstscene_name,p.secondscene_type,p.secondscene_name,p.thrscene_type,p.thrscene_name,"
            + " p.station_type,p.ant_support_type,p.is_ant_beaty,p.ele_introduce_mode,p.tower_share_statistics,"
            + " p.stat_power_type,p.is_business,p.business_name,p.base_system,p.base_cost,p.power_system,"
            + " p.power_cost,p.net_gsm_new,p.net_wcdma_new,p.net_fdd_new,p.net_tdd_new,p.net_u900_new,p.wcdma_build_year,"
            + " p.fdd_build_year,p.tdd_build_year,p.u900_build_year,p.belong_new,p.gsm_build_year, "
            + " p.department_need,p.person_need,p.department_project,p.person_project, "
            + " null x, null y "
            + " from gis_logic_stat_list l left join gis_phy_stat_list p on l.phy_location_id = p.phy_location_id and l.project_id = p.project_id "
            + " where l.phy_location_id is not null and l.net_type is not null and p.longitude is not null and p.latitude is not null ";

        // 经纬度矩形范围条件，获取规划站点不限制范围
        //this.__coorcond(args, cs, vs);

        if (!jss.isEmpty(args.project_id))
        {
            cs.push('l.project_id = ?');
            vs.push(args.project_id);
        }
        if (!jss.isEmpty(args.project_name))
        {
            cs.push('l.project_name = ?');
            vs.push(args.project_name);
        }
        if (!jss.isEmpty(args.net_type))
        {
            cs.push('l.net_type = ?');
            vs.push(args.net_type);
        }
        if (cs.length > 0)
            sql += ' and ' + cs.join(' and ');

        jss.log(sql);
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs);
        sc.print('{"sites": ');
        Database.write(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs));

        sc.println('}');
        jss.log('查询逻辑站址完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    DelPlanSite: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件
        try
        {
            var r = 0, rs;
            if (jss.isArray(args.phys))
            {
                var phys = args.phys, phy, project_id = args.project_id, net_type = args.net_type;
                if (jss.isEmpty(phys) || jss.isEmpty(project_id) || jss.isEmpty(net_type))
                    throw '缺少删除逻辑站址的必要参数！';

                var physql = " delete from gis_phy_stat_list phy where project_id = ? "
                    + " and phy.phy_location_id = ? "
                    + " and (select count(*) scount from gis_logic_stat_list where project_id = ? and phy_location_id = phy.phy_location_id) <= 1 ";

                var logicsql = " delete from gis_logic_stat_list where project_id = ? and phy_location_id = ? and net_type = ? ";
                for (var i = 0, n = phys.length; i < n; i++)
                {
                    phy = phys[i];
                    if (jss.isEmpty(phy))
                        continue;

                    exeparam = [project_id, phy, project_id];
                    jss.log(physql);
                    jss.log(jss.encode(exeparam));
                    r = sc.database.update(physql, exeparam);
                    jss.log('删除物理站址数量:' + r);

                    exeparam = [project_id, phy, net_type];
                    jss.log(logicsql);
                    jss.log(jss.encode(exeparam));
                    r = sc.database.update(logicsql, exeparam);
                    jss.log('删除逻辑站址数量:' + r);
                }
            }

            var fillsql = " call broad_unicom_GisBase.sp_new_phy_stat_list_Fill1(?, ?) ";
            sc.database.update(fillsql, [args.project_id, args.user_id]);

            sc.database.commit();

            jss.log(jss.encode(args));

            jss.log('删除逻辑站址完成！用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
            sc.print('{success: true, msg: "删除逻辑站址成功！"}');
        }
        catch (e)
        {
            sc.database.rollback();
            sc.print('{success: false, msg: "删除逻辑站址失败:' + jss.encode(e) + '"}');
        }
    },
    GetCoverArgs: function (sc)
    {
        // 天线增益:Ga,天线功率:Tx,站点类型:微站/宏站(已有),下行频段:(界面填写),Rx:WCDMA系统为-90dBm，LTE系统为-110dBm，GSM系统为-80dBm
        // 根据覆盖类型、站点类型和项目名称获取K1、K2、K3、K5、H、HW
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件

        jss.log(jss.encode(args));

        if (!jss.isEmpty(args.project_id) && !jss.isEmpty(args.project_name) && !jss.isEmpty(args.sitecover_type))
        {
            var sql = "select k1,k2,k3,k5,h,hw from cover_modle where project_id = ? and project_name = ? and cover_type = ? ";

            jss.log(sql);
            jss.log(jss.encode(args));

            sc.print('{covers: ');
            sc.database.writeAll(sc.out, sql, [args.project_id, args.project_name, args.sitecover_type]);

            sc.println('}');
        }
        else
            sc.print('{error: "工程或覆盖类型为空不能进行半径计算!"}');
        jss.log('查询覆盖参数完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    LockPlanSite: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件

        var lockcn = !jss.isEmpty(args.lock) ? "锁定" : "解锁";
        try
        {
            var r = 0;
            if (jss.isArray(args.phys))
            {
                var phys = args.phys, phy, project_id = args.project_id, net_type = args.net_type, user_id = args.user_id;
                if (jss.isEmpty(phys) || jss.isEmpty(project_id) || jss.isEmpty(net_type) || jss.isEmpty(user_id))
                    throw '缺少锁定/解锁的必要参数！';

                var exeparam = [args.lock], sql;
                var sql = " update gis_logic_stat_list set stat_flag = ? where project_id = ? and phy_location_id = ? and net_type = ? and (stat_flag is null or stat_flag = ?) ";
                for (var i = 0, n = phys.length; i < n; i++)
                {
                    phy = phys[i];
                    if (jss.isEmpty(phy))
                        continue;

                    exeparam = [args.lock, project_id, phy, net_type, user_id];
                    jss.log(sql);
                    jss.log(jss.encode(exeparam));
                    r = sc.database.update(sql, exeparam);
                    jss.log('更新逻辑站址数量:' + r);
                }
                sc.database.commit();
            }

            jss.log(jss.encode(args));

            jss.log('更新逻辑站址锁定状态完成！用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。   返回值：' + r);
            sc.print('{success: true, msg: "设置逻辑站址为' + lockcn + '状态成功！"}');
        }
        catch (e)
        {
            sc.database.rollback();
            jss.log(jss.encode(e));
            sc.print('{success: false, msg: "设置逻辑站址为' + lockcn + '状态失败:' + jss.encode(e) + '"}');
        }
    },
    SavePlanSiteDemo: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));

        var sql = "update gis_logic_stat_list set logic_site_note1 = ? where site_id = ? ";

        try
        {
            jss.log(sql);
            jss.log(jss.encode(args));

            var r = sc.database.update(sql, [args.demo, args.site_id]);
            sc.database.commit();

            jss.log('保存站点备注信息完成！用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。   返回值：' + r);
            sc.print('保存站点备注信息成功！');
        }
        catch (e)
        {
            sc.database.rollback();
            jss.log(jss.encode(e));
            sc.print(jss.encode(e));
        }
    },
    GetPlanIndoorSite: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件

        var cs = [], vs = [], cscoor = [], vscoor = [];
        jss.log('查询辅助规划室分站点！！！！！！！！！！！！！！！');

        var sql = " select province_id,city_id,related_county,project_id,project_name,"
            + " region_type,area_name,area_type,area_subtype,indoor_id id,indoor_id,building_name,building_name name,building_type,"
            + " building_area,building_class,phygrid_name,cover_method,ds_type,ds_building_type,"
            + " c.province_name,c.city_name, "
            + " longitude,latitude, null x, null y,0 direction,12 radius, 360 angle"
            + " from gis_indoor_stat_list s, cfg_cityinfo c "
            + " where s.province_id = c.province_code and s.city_id = c.city_code "
            + " and longitude is not null and latitude is not null ";
        // 省份地市条件
        this.__provcond(args, cs, vs, "province_code", "province_name", "city_code", "city_name", "c");
        // 经纬度条件
        this.__coorwidencond(args, cscoor, vscoor, "", 0.01);

        if (!jss.isEmpty(args.project_id))
        {
            cs.push('s.project_id = ?');
            vs.push(args.project_id);
        }
        if (!jss.isEmpty(args.project_name))
        {
            cs.push('s.project_name = ?');
            vs.push(args.project_name);
        }

        var cond = "", coorcond = "";
        if (cs.length > 0)
            cond = ' and ' + cs.join(' and ');
        if (cscoor.length > 0)
            coorcond = ' and ' + cscoor.join(' and ');

        sql += cond + coorcond;
        vs = vs.concat(vscoor);

        jss.log(sql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs);
        sc.print('{cells: ');
        Database.write(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs));

        sc.println('}');
        jss.log('查询辅助规划室分站点!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    LockPlanIndoorSite: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件

        var lockcn = !jss.isEmpty(args.lock) ? "锁定" : "解锁";
        try
        {
            var r = 0;
            if (jss.isArray(args.phys))
            {
                var ids = args.ids, id, project_id = args.project_id, user_id = args.user_id;
                if (jss.isEmpty(phys) || jss.isEmpty(project_id) || jss.isEmpty(net_type) || jss.isEmpty(user_id))
                    throw '缺少锁定/解锁的必要参数！';

                var exeparam = [args.lock], sql;
                var sql = " update gis_indoor_stat_list set stat_flag = ? where project_id = ? and indoor_id = ? and (stat_flag is null or stat_flag = ?) ";
                for (var i = 0, n = ids.length; i < n; i++)
                {
                    id = ids[i];
                    if (jss.isEmpty(id))
                        continue;

                    exeparam = [args.lock, project_id, id, user_id];
                    jss.log(sql);
                    jss.log(jss.encode(exeparam));
                    r = sc.database.update(sql, exeparam);
                    jss.log('更新室分站址数量:' + r);
                }
                sc.database.commit();
            }

            jss.log(jss.encode(args));

            jss.log('更新室分站址锁定状态完成！用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。   返回值：' + r);
            sc.print('{success: true, msg: "设置室分站址为' + lockcn + '状态成功！"}');
        }
        catch (e)
        {
            sc.database.rollback();
            jss.log(jss.encode(e));
            sc.print('{success: false, msg: "设置逻辑站址为' + lockcn + '状态失败:' + jss.encode(e) + '"}');
        }
    },
    GetBound: function (sc)
    {
        var ts = [], res = {};
        ts.push('select t.province_id, t2.longitude, t2.latitude from s_conf_scene t, s_conf_scene_lst t2 where t.scene_name_id=t2.scene_name_id');
        ts.push('select province_id, longitude, latitude from s_conf_etrancell_latest where latitude < 90');

        var sql = 'select province_name, min(longitude) minLon, min(latitude) minLat, max(longitude) maxLon, max(latitude) maxLat from  (' + ts.join('\r\n union all \r\n') + ') t, cfg_cityinfo c where t.province_id=c.province_code group by c.province_name';
        var rs = sc.database.query(sql);
        while (rs.next())
        {
            res[jss.toString(rs.getObject(1))] = [jss.toNumber(rs.getObject(2)), jss.toNumber(rs.getObject(3)), jss.toNumber(rs.getObject(4)), jss.toNumber(rs.getObject(5))];
        }

        ts.length = 0;
        ts.push('select t.city_id, t2.longitude, t2.latitude from s_conf_scene t, s_conf_scene_lst t2 where t.scene_name_id=t2.scene_name_id');
        ts.push('select city_id, longitude, latitude from s_conf_etrancell_latest where latitude < 90');

        sql = 'select c.city_name, min(longitude) minLon, min(latitude) minLat, max(longitude) maxLon, max(latitude) maxLat from  (' + ts.join('\r\n union all \r\n') + ') t, cfg_cityinfo c where t.city_id = c.city_code(+) group by c.city_name';
        rs = sc.database.query(sql);
        while (rs.next())
        {
            res[jss.toString(rs.getObject(1))] = [jss.toNumber(rs.getObject(2)), jss.toNumber(rs.getObject(3)), jss.toNumber(rs.getObject(4)), jss.toNumber(rs.getObject(5))];
        }

        return res;
    },
    GetScene: function (sc)
    {
        var table = '(select t.*, (select province_name from cfg_cityinfo where province_code=t.province_id and rownum<2) province_name from s_conf_scene t) t ';
        var args = jss.decode(sc.GetString('args')), cs = [], vs = [];

        // 经纬度矩形范围条件
        this.__coorrectcond(args, cs, vs);

        if (!jss.isEmpty(args.scene_type))
        {
            cs.push('scene_type = ?');
            vs.push(args.scene_type);
        }

        if (!jss.isEmpty(args.city_id))
        {
            cs.push('city_id = ?');
            vs.push(args.city_id);
        }
        else if (!jss.isEmpty(args.city)) // id or name
        {
            cs.push(jss.isNumeric(args.city) ? 'city_id = ?' : 'city_id in(select city_code from cfg_cityinfo where city_name = ?)');
            vs.push(args.city);
        }
        else if (!jss.isEmpty(args.province_id))
        {
            cs.push('province_id = ?');
            vs.push(args.province_id);
        }
        else if (!jss.isEmpty(args.province))
        {
            cs.push(jss.isNumeric(args.province) ? 'province_id = ?' : 'province_name = ?');
            vs.push(args.province);
        }

        cs.push("scene_name != '渝利铁路'");
        cs.push('rownum < 10000');

        var conds = cs.length > 0 ? 'where ' + cs.join(' and ') : '';

        var its = [], mapIt = {}, it, key, k;
        var sql = 'select scene_name, scene_type, global_name, province_id, province_name, city_id, city_name from ' + table + conds;
        var rs = sc.database.query(sql, vs);
        while (rs.next())
        {
            it = {
                name: jss.toString(rs.getObject('scene_name')),
                type: jss.toString(rs.getObject('scene_type')),
                gname: jss.toString(rs.getObject('global_name')),
                province_id: jss.toString(rs.getObject('province_id')),
                province_name: jss.toString(rs.getObject('province_name')),
                city_id: jss.toString(rs.getObject('city_id')),
                city_name: jss.toString(rs.getObject('city_name')),
                pts: []
            };

            its.push(it);
            key = it.city_id + '.' + it.name;
            mapIt[key] = it;
        }

        sql = "select l.city_id || '.' || l.scene_name, l.longitude, l.latitude from s_conf_scene_lst l, (select * from " + table + conds +
        ") r where l.city_id = r.city_id and l.scene_name = r.scene_name order by l.city_id, l.scene_name, l.coorindex";
        rs = sc.database.query(sql, vs);
        var pt = new com.broadtech.unicom.common.Voronoi.Point(), logical = args.latlontype != 'app';
        while (rs.next())
        {
            k = jss.toString(rs.getObject(1));
            if (key != k)
                it = mapIt[key = k];

            pt.Reset(jss.toNumber(rs.getObject(2)), jss.toNumber(rs.getObject(3)));
            if (logical)
                GpsOffset.GpsToLogical(pt);
            it.pts.push(pt.x, pt.y);
        }

        return its.filter(function (it) { return it.pts.length > 0; });
    },
    GetSceneName: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args')), cs = [], vs = [];
        args = this.__getquerycond(args); // 获取条件

        var sql = " select distinct scene_name from s_conf_scene where 1 > 0 ";

        if (!jss.isEmpty(args.city_id))
        {
            cs.push('city_id = ?');
            vs.push(args.city_id);
        }
        if (!jss.isEmpty(args.scene_type))
        {
            cs.push('scene_type = ?');
            vs.push(args.scene_type);
        }
        if (cs.length > 0)
            sql += ' and ' + cs.join(' and ');

        jss.log(sql);
        jss.log(jss.encode(args));

        sc.print('{scenes: ');
        sc.database.writeAll(sc.out, sql, vs);

        sc.println('}');
        jss.log('查询场景名单完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    GetCounty: function (sc)
    {
        var table = '(select t.*, (select province_name from cfg_cityinfo where province_code=t.province_id and rownum<2) province_name, (select city_name from cfg_cityinfo where city_code=t.city_id and rownum<2) city_name from s_conf_county t) t ';
        var args = jss.decode(sc.GetString('args')), cs = [], vs = [];
        if (!jss.isEmpty(args.minLon))
        {
            cs.push('maxlongitude>?');
            vs.push(args.minLon);
        }
        if (!jss.isEmpty(args.minLat))
        {
            cs.push('maxlatitude>?');
            vs.push(args.minLat);
        }
        if (!jss.isEmpty(args.maxLon))
        {
            cs.push('minlongitude<?');
            vs.push(args.maxLon);
        }
        if (!jss.isEmpty(args.maxLat))
        {
            cs.push('minlatitude<?');
            vs.push(args.maxLat);
        }

        if (!jss.isEmpty(args.city_id))
        {
            cs.push('city_id = ?');
            vs.push(args.city_id);
        }
        else if (!jss.isEmpty(args.city)) // id or name
        {
            cs.push(jss.isNumeric(args.city) ? 'city_id = ?' : 'city_id in(select city_code from cfg_cityinfo where city_name = ?)');
            vs.push(args.city);
        }
        else if (!jss.isEmpty(args.province_id))
        {
            cs.push('province_id = ?');
            vs.push(args.province_id);
        }
        else if (!jss.isEmpty(args.province))
        {
            cs.push(jss.isNumeric(args.province) ? 'province_id = ?' : 'province_name = ?');
            vs.push(args.province);
        }

        var conds = cs.length > 0 ? 'where ' + cs.join(' and ') : '';

        var its = [], mapIt = {}, it, key, k;
        var sql = 'select county_name, province_id, province_name, city_id, city_name from ' + table + conds;
        var rs = sc.database.query(sql, vs);
        while (rs.next())
        {
            it = {
                name: jss.toString(rs.getObject('county_name')),
                province_id: jss.toString(rs.getObject('province_id')),
                province_name: jss.toString(rs.getObject('province_name')),
                city_id: jss.toString(rs.getObject('city_id')),
                city_name: jss.toString(rs.getObject('city_name')),
                pts: []
            };

            its.push(it);
            key = it.city_id + '.' + it.name;
            mapIt[key] = it;
        }
        jss.log(sql);
        sql = "select city_id || '.' || county_name, longitude, latitude from s_conf_county_lst l where exists(select * from (select * from " + table + conds +
        ") r where l.city_id = r.city_id and l.county_name = r.county_name) order by city_id, county_name, phygrid_id_num, coorindex";
        jss.log(sql);
        rs = sc.database.query(sql, vs);

        var pt = new com.broadtech.unicom.common.Voronoi.Point(), logical = args.latlontype != 'app';
        while (rs.next())
        {
            k = jss.toString(rs.getObject(1));
            if (key != k)
                it = mapIt[key = k];

            pt.Reset(jss.toNumber(rs.getObject(2)), jss.toNumber(rs.getObject(3)));
            if (logical)
                GpsOffset.GpsToLogical(pt);
            it.pts.push(pt.x, pt.y);
        }

        return its.filter(function (it) { return it.pts.length > 0; });
    },
    GetSite: function (sc)
    {
        jss.log('/**************************查询逻辑站址标记***********************/');
        var table = '(select t.*, (select province_name from cfg_cityinfo where province_code=t.province_id and rownum<2) province_name from v_s_conf_outphysite_cell t) t ';

        var args = jss.decode(sc.GetString('args')), cs = [], vs = [];

        // 经纬度条件
        this.__coorcond(args, cs, vs);

        this.AppendIsSceneCond(args, cs);

        if (!jss.isEmpty(args.city_id))
        {
            cs.push('city_id = ?');
            vs.push(args.city_id);
        }
        else if (!jss.isEmpty(args.city)) // id or name
        {
            cs.push(jss.isNumeric(args.city) ? 'city_id = ?' : 'city_id in(select city_code from cfg_cityinfo where city_name = ?)');
            vs.push(args.city);
        }
        else if (!jss.isEmpty(args.province_id))
        {
            cs.push('province_id = ?');
            vs.push(args.province_id);
        }
        else if (!jss.isEmpty(args.province))
        {
            cs.push(jss.isNumeric(args.province) ? 'province_id = ?' : 'province_name = ?');
            vs.push(args.province);
        }

        if (!jss.isEmpty(args.network))
        {
            var arr = jss.isArray(args.network) ? args.network : [args.network];
            var condstr = arr.map(function (a)
            {
                switch (String.prototype.toLowerCase.apply(a))
                {
                    case 'gsm':
                        return 'is_gsm is not null';
                    case 'wcdma':
                        return 'is_wcdma is not null';
                    case 'lte':
                        return 'is_lte is not null';
                    default:
                        return '1=1';
                }
            }).join(' or ');
            cs.push("(" + condstr + ")");
        }

        jss.log('查询辅助规划逻辑站址！！！！！！！！！！！！！！！');
        var sql = 'select phy_location_id id, phy_location_name name, longitude, latitude, null x, null y,0 direction,12 radius, 360 angle' + this.SelectSceneName(args)
        + ', city_id, city_name, province_id, province_name, phy_location_id, phy_location_name, station_type, construction_type, 0 attenna_support_type'
        + ', related_county, phygrid_name, phygrid_id, firstscene_type, firstscene_name from ' + table;

        if (cs.length > 0)
            sql += ' where ' + cs.join(' and ');

        if (!jss.isEmpty(args.zoomlevel))
            sql += " order by longitude, latitude ";

        jss.log(sql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs);
        sc.print('{cells: ');
        // 聚合
        if (!jss.isEmpty(args.zoomlevel))
        {
            var distance = 0, level = args.zoomlevel, converge = this.__map_bts_converge;
            for (var name in converge)
            {
                if (jss.toNumber(level) <= jss.toNumber(name))
                {
                    distance = converge[name];
                    break;
                }
            }
            jss.log('物理站址聚合距离为：' + distance);
            Database.write(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs), distance);
        }
        else
            Database.write(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs));
        sc.print('}');

        jss.log('查询站址完成！！！！！！！！！！！！！！！');
    },
    map_kpis: function (sc)
    {
        // 生成同一数据源下需要渲染的指标插件对象
        // 获取需要生成指标数据的对象必须drawtype指标要渲染到的图层类型不能为空，panelquerytype面板查询类型不能为空
        var sql = 'select gis.type,lower(gis.name_en) name_en,kpi.name_cn,lower(kpi.aliasname) aliasname,gis.panelquerytype,gis.gisjson '
            + ' from cfg_indicatorsdefine_gis gis, cfg_indicatorsdefine kpi '
            + ' where gis.moduleid = kpi.moduleid and gis.type = kpi.type and lower(gis.name_en) = lower(kpi.name_en) '
            + ' and kpi.columntype in(5, 6) and gis.gisjson is not null and gis.moduleid = ? order by gis.type,kpi.view_seq,gis.gisjson desc';

        var rs = sc.database.query(sql, sc.GetString('moduleId'));
        var plugins = [], kpis, kpi, subject = { ptype: 'subject', name: 'subject', text: '地图指标列表', querymapping: [] }, subjectkpi;
        var type, aliasname, name_en, name_cn, panelquerytype, gisjson;
        var buildedmenu = []; // 用于判断subject的指标列表是否已经生成

        var rowcount = 0;
        jss.log(sql);
        while (rs.next())
        {
            rowcount++;
            type = jss.toString(rs.getObject('type'));
            aliasname = jss.toString(rs.getObject('aliasname'));
            name_en = jss.toString(rs.getObject('name_en'));
            name_cn = jss.toString(rs.getObject('name_cn'));
            panelquerytype = jss.toString(rs.getObject('panelquerytype')); // 当前指标对应查询面板的type
            gisjson = jss.toString(rs.getObject('gisjson')); // 配置指标对应的渲染函数与图例

            // 判断指标是否在同一数据源下，不在则新建数据源kpis
            if (!kpis || kpis.querytype != type)
            {
                kpis = { ptype: 'my_map_kpis', name: 'kpis_' + type, keyfield: {}, querytype: type, items: [] };
                plugins.push(kpis);
            }

            if (jss.isEmpty(gisjson))
            {
                jss.log("未配置指标'" + name_cn + "'的gis属性！");
                continue;
            }
            try
            {
                gisjson = eval("(" + gisjson + ")");
                if (!jss.isEmpty(gisjson.giskey) && gisjson.giskey)
                {
                    // keyfield地图中指标渲染作为key进行判断的字段名，由于各表的名称不统一，所以在aliasname不为空时用此字段，否则用name_en字段
                    var key_en = !jss.isEmpty(aliasname) ? aliasname : (!jss.isEmpty(name_en) ? name_en : "");
                    if (gisjson.keyfield === undefined)
                        kpis.keyfield[key_en.toLowerCase()] = "id"; // 默认映射到图层数据的ID字段
                    else if (jss.isEmpty(gisjson.keyfield) || gisjson.keyfield == '-1')
                        kpis.keyfield[key_en.toLowerCase()] = key_en.toLowerCase();
                    else
                        kpis.keyfield[key_en.toLowerCase()] = gisjson.keyfield.toLowerCase(); // 地图图层
                    continue; // giskey表示是地图用的关键字段，只做指标维度属性，不做指标字段所以返回
                }
                else if (gisjson.gisdim)
                {
                    // [{ field: 'field', title: '应用大类',  autoplay: true}]
                    if (jss.isEmpty(kpis.__kpidims))
                        kpis.__kpidims = [];

                    var key_en = !jss.isEmpty(aliasname) ? aliasname : (!jss.isEmpty(name_en) ? name_en : "");
                    kpis.__kpidims.push({ field: key_en, title: name_cn, autoplay: gisjson.autoplay });
                    continue;
                }
            }
            catch (e)
            {
                jss.log("指标：" + name_en + "的gisjson字段的配置不是正确的json格式！");
                continue;
            }

            kpi = { field: name_en, title: name_cn, defaults: { xtype: 'my_map_kpi' }, thresholds: gisjson.thresholds };
            if (!jss.isEmpty(gisjson.kpitype))
            {
                kpi.defaults = { xtype: gisjson.kpitype }; // kpitype为空则默认为枚举型渲染，否则为数据表中配置的方式渲染
            }

            kpis.items.push(kpi);

            if (jss.isEmpty(panelquerytype))
                continue;
            // 生成需要在菜单列表中加载的指标对象
            subjectkpi = kpis.name + "." + kpi.field;
            panelquerytype = panelquerytype.replace(/ /g, "");

            var query = panelquerytype.split(',');
            var mname = query[0].toString().trim();
            if (buildedmenu.indexOf(mname) == -1)
            {
                var q = { query: [], menuname: "m" + mname };
                q.query = query;
                subject.querymapping.push(q);
                subject["m" + mname] = [];
                subject["m" + mname].push({ text: name_cn, checked: true, kpi: subjectkpi, fn: gisjson.fn, menugroup: gisjson.menugroup });
                buildedmenu.push(mname);
            }
            else
                subject["m" + mname].push({ text: name_cn, kpi: subjectkpi, fn: gisjson.fn, menugroup: gisjson.menugroup });
        }
        plugins.push(subject);

        jss.log(jss.encode(plugins));
        sc.response.setContentType('application/javascript');

        sc.print('var __map_kpis__ = ');
        if (rowcount > 0)
            sc.print(jss.encode(plugins)); // plugins.filter(function (plugin) { return plugin.items.length > 0; })
        else
            sc.print('undefined');
        sc.println(';');
    },
    GetAllOffsetCoor: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));

        var sql, cs = [], vs = [];
        jss.log('查询纠偏坐标！！！！！！！！！！！！！！！');
        sql = " select * from conf_cooroffset where mod(longitude,0.1) = 0 and mod(latitude,0.1) = 0 "
            + " and offsetlon is not null and offsetlat is not null ";
        var rs = sc.database.query(sql);
        var coor = {}, lon, lat, olon, olat;

        var rowcount = 0;
        while (rs.next())
        {
            rowcount++;
            lon = jss.toString(rs.getObject('longitude'));
            lat = jss.toString(rs.getObject('latitude'));
            olon = jss.toString(rs.getObject('offsetlon'));
            olat = jss.toString(rs.getObject('offsetlat'));
            coor[lon + "_" + lat] = [olon, olat];
        }

        sc.response.setContentType('application/javascript');

        sc.print('var CoorOffset = ');
        if (rowcount > 0)
            sc.print(jss.encode(coor));
        else
            sc.print('undefined');
        sc.println(';');
        jss.log('查询纠偏坐标完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    GetOffsetCoor: function (sc)
    {
        // 真实经纬度坐标转为地图上的偏移坐标
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件
        jss.log(jss.encode(args));

        var pt = new com.broadtech.unicom.common.Voronoi.Point();
        pt.Reset(jss.toNumber(args.longitude), jss.toNumber(args.latitude));
        GpsOffset.Adjust(pt);

        sc.print('{longitude: ');
        sc.print(pt.x);
        sc.print(', latitude: ');
        sc.print(pt.y);
        sc.println('}');
        jss.log('计算坐标纠偏完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    GetRealCoor: function (sc)
    {
        // 地图上的坐标转为真实坐标
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件
        jss.log(jss.encode(args));

        var pt = new com.broadtech.unicom.common.Voronoi.Point();
        pt.Reset(jss.toNumber(args.longitude), jss.toNumber(args.latitude));

        jss.log('纠偏前经纬度,longitude:' + pt.x + ',latitude:' + pt.y);
        GpsOffset.Adjust(pt);
        jss.log('纠偏后经纬度,longitude:' + pt.x + ',latitude:' + pt.y);

        var offx = pt.x - args.longitude;
        var offy = pt.y - args.latitude;
        pt.Reset(jss.toNumber(args.longitude - offx), jss.toNumber(args.latitude - offy));
        jss.log('真实经纬度,longitude:' + pt.x + ',latitude:' + pt.y);

        sc.print('{longitude: ');
        sc.print(pt.x);
        sc.print(', latitude: ');
        sc.print(pt.y);
        sc.println('}');
        jss.log('计算地图上坐标的真实坐标完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    GetSceneRadius: function (sc)
    {
        var args = jss.decode(sc.GetString('args')), cs = [], vs = [];
        args = this.__getquerycond(args); // 获取条件

        if (!jss.isEmpty(args.city_id))
        {
            cs.push('city_id = ?');
            vs.push(args.city_id);
        }

        if (!jss.isEmpty(args.project_id))
        {
            cs.push('project_id = ?');
            vs.push(args.project_id);
        }

        //if (!jss.isEmpty(args.net_type))
        //{
        //    cs.push('net_type = ?');
        //    vs.push(args.net_type);
        //}

        jss.log('查询工程对应的场景覆盖半径:****************************************');
        var sql = ' select scene_type, net_type, radius from gis_scene_cover_radius ';

        if (cs.length > 0)
            sql += ' where ' + cs.join(' and ');

        jss.log(sql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs);

        sc.print('{sites: ');
        sc.database.writeAll(sc.out, sql, vs);
        sc.print('}');

        jss.log('查询工程对应的场景覆盖半径完成！！！！！！！！！！！！！！！');
    },
    GetSiteScene: function (sc)
    {
        // 逻辑站址获取所在场景
        jss.log('获取站址的场景类型：-----------------');
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取站址坐标
        jss.log(jss.encode(args));

        var pt = new com.broadtech.unicom.common.Voronoi.Point();

        //var imptScene = new com.broadtech.unicom.common.impt.ImportScenePoint();
        //var scenetype = imptScene.getFirstSceneByLonlat(args.longitude, args.latitude, args.city_id);

        //var app = org.springframework.web.context.support.WebApplicationContextUtils.getRequiredWebApplicationContext(__host.getServletContext());
        //var imptScene = app.getBean(com.broadtech.unicom.common.impt.ImportPlanPorject);

        //jss.log('ImportPlanPorject类：' + imptScene.getClass().getMethods().length);
        //var scenetype = app.getBean(com.broadtech.unicom.common.impt.ImportPlanPorject).getFirstSceneByLonlat(jss.toNumber(args.longitude), jss.toNumber(args.latitude), args.city_id);

        var imptc = new com.broadtech.unicom.common.impt.ImportPublicParamsConf();
        var scenetype = imptc.getScene(jss.toNumber(args.longitude), jss.toNumber(args.latitude), args.city_id);

        sc.print("{scenetype: '");
        sc.print(scenetype);
        sc.println("'}");
        jss.log('获取逻辑站址的所在场景类型!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    GetComboSceneType: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args')), cs = [], vs = [];
        args = this.__getquerycond(args);

        jss.log('查询场景类型下拉数据********************');
        jss.log(jss.encode(args));

        var sql = " select distinct scene_type from s_map_scene where 1 > 0 ";

        if (!jss.isEmpty(args.city_id))
        {
            cs.push('city_id = ?');
            vs.push(args.city_id);
        }
        if (cs.length > 0)
            sql += ' and ' + cs.join(' and ');

        sql += ' order by scene_type ';

        jss.log(sql);
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs), data = {}, its = [], name;
        while (rs.next())
        {
            name = rs.getObject('scene_type');
            its.push({ k: name, v: name });
        }
        data.rs = its;

        jss.log('查询下拉列表的场景类型完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
        return data;
    },
    GetComboScene: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args')), cs = [], vs = [];
        args = this.__getquerycond(args); // 获取条件

        var sql = " select distinct scene_name from s_map_scene where 1 > 0 ";

        if (!jss.isEmpty(args.city_id))
        {
            cs.push('city_id = ?');
            vs.push(args.city_id);
        }
        if (!jss.isEmpty(args.scene_type))
        {
            cs.push('scene_type = ?');
            vs.push(args.scene_type);
        }
        if (cs.length > 0)
            sql += ' and ' + cs.join(' and ');

        jss.log(sql);
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs), data = {}, its = [], name;
        while (rs.next())
        {
            name = rs.getObject('scene_name');
            its.push({ k: name, v: name });
        }
        data.rs = its;

        jss.log('查询下拉列表的场景名单完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
        return data;
    },
    GetComboGrid: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args')), cs = [], vs = [];
        args = this.__getquerycond(args); // 获取条件

        var sql = " select phygrid_id,phygrid_name,phygrid_type from s_map_gridding where 1 > 0 ";

        if (!jss.isEmpty(args.city_id))
        {
            cs.push('city_id = ?');
            vs.push(args.city_id);
        }
        if (!jss.isEmpty(args.phygrid_type))
        {
            cs.push('phygrid_type = ?');
            vs.push(args.phygrid_type);
        }
        if (cs.length > 0)
            sql += ' and ' + cs.join(' and ');

        jss.log(sql);
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs), data = {}, its = [], id, name, type;
        while (rs.next())
        {
            id = rs.getObject('phygrid_id');
            name = rs.getObject('phygrid_name');
            type = rs.getObject('phygrid_type');
            its.push({ k: id, v: name, type: type });
        }
        data.rs = its;

        jss.log('查询下拉列表的网格完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
        return data;
    },
    GetProlem: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args')), cs = [], vs = [];
        args = this.__getquerycond(args); // 获取条件

        // 最新表结构的SQL
        jss.log('查询问题图层！！！！！！！！！！！！！！！');
        var sql = " select problem_id id,problem_source name,problem_id,problem_source,project_id,"
            + " p.province_id,p.city_id,c.province_name,c.city_name,"
            + " scene_type,scene_name,phygrid_id,phygrid_type,"
            + " slove_means,station_need,inoutdoor_cover_need,indoor_ds_need,"
            + " resv_1,resv_2,resv_3,resv_4,resv_5,resv_6,resv_7,resv_8,resv_9,resv_10,"
            + " longitude,latitude,minlongitude,minlatitude,maxlongitude,maxlatitude "
            + " from gis_map_problem p, cfg_cityinfo c where p.province_id = c.province_code and p.city_id = c.city_code "
            + " and problem_id is not null and p.longitude is not null and p.latitude is not null ";

        var ptsql = " select l.problem_id id,l.longitude,l.latitude from gis_map_problem_lst l, gis_map_problem p, cfg_cityinfo c "
            + " where p.province_id = c.province_code and p.city_id = c.city_code "
            + " and l.problem_id = p.problem_id and l.project_id = p.project_id and l.problem_id is not null "
            + " and p.longitude is not null and p.latitude is not null ";

        // 省份地市条件
        //this.__provcond(args, cs, vs, "province_code", "province_name", "city_code", "city_name", "");
        // 经纬度矩形范围条件
        this.__coorrectcond(args, cs, vs, "p");

        if (!jss.isEmpty(args.project_id))
        {
            cs.push('p.project_id = ?');
            vs.push(args.project_id);
        }

        if (cs.length > 0)
        {
            sql += ' and ' + cs.join(' and ');
            ptsql += ' and ' + cs.join(' and ');
        }

        jss.log(sql);
        jss.log(ptsql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(args));

        var header = [{ Name: "id" }, { Name: "name" }, { Name: "problem_id" }, { Name: "problem_source" }, { Name: "project_id" },
            { Name: "province_id" }, { Name: "city_id" },
            { Name: "province_name" }, { Name: "city_name" }, { Name: "scene_type" }, { Name: "scene_name" }, { Name: "phygrid_id" },
            { Name: "phygrid_type" }, { Name: "slove_means" }, { Name: "station_need" }, { Name: "inoutdoor_cover_need" },
            { Name: "indoor_ds_need" },
            { Name: "resv_1" }, { Name: "resv_2" }, { Name: "resv_3" }, { Name: "resv_4" }, { Name: "resv_5" },
            { Name: "resv_6" }, { Name: "resv_7" }, { Name: "resv_8" }, { Name: "resv_9" }, { Name: "resv_10" },
            { Name: "longitude" }, { Name: "latitude" }, { Name: "minlongitude" }, { Name: "minlatitude" },
            { Name: "maxlongitude" }, { Name: "maxlatitude" }, { Name: "pts" }];

        var rs = sc.database.query(sql, vs);
        var its = [], mapIt = {}, it, key, k, pt = {};

        var pt = new com.broadtech.unicom.common.Voronoi.Point();
        var lon, lat, minlon, minlat, maxlon, maxlat;

        its.push(header);
        while (rs.next())
        {
            key = jss.toString(rs.getObject('id'));

            lon = jss.toNumber(rs.getObject('longitude'));
            lat = jss.toNumber(rs.getObject('latitude'));
            pt.Reset(lon, lat);
            GpsOffset.Adjust(pt);
            lon = pt.x; lat = pt.y;

            minlon = jss.toNumber(rs.getObject('minlongitude'));
            minlat = jss.toNumber(rs.getObject('minlatitude'));
            pt.Reset(minlon, minlat);
            GpsOffset.Adjust(pt);
            minlon = pt.x; minlat = pt.y;

            maxlon = jss.toNumber(rs.getObject('maxlongitude'));
            maxlat = jss.toNumber(rs.getObject('maxlatitude'));
            pt.Reset(maxlon, maxlat);
            GpsOffset.Adjust(pt);
            maxlon = pt.x; maxlat = pt.y;

            it = [key, jss.toString(rs.getObject('name')), jss.toString(rs.getObject('problem_id')), jss.toString(rs.getObject('problem_source')),
                jss.toString(rs.getObject('project_id')), jss.toString(rs.getObject('province_id')),
                jss.toString(rs.getObject('city_id')), jss.toString(rs.getObject('province_name')),
                jss.toString(rs.getObject('city_name')), jss.toString(rs.getObject('scene_type')), jss.toString(rs.getObject('scene_name')),
                jss.toString(rs.getObject('phygrid_id')), jss.toString(rs.getObject('phygrid_type')), jss.toString(rs.getObject('slove_means')),
                jss.toString(rs.getObject('station_need')), jss.toString(rs.getObject('inoutdoor_cover_need')),
                jss.toString(rs.getObject('indoor_ds_need')),
                jss.toString(rs.getObject('resv_1')), jss.toString(rs.getObject('resv_2')), jss.toString(rs.getObject('resv_3')),
                jss.toString(rs.getObject('resv_4')), jss.toString(rs.getObject('resv_5')), jss.toString(rs.getObject('resv_6')),
                jss.toString(rs.getObject('resv_7')), jss.toString(rs.getObject('resv_8')), jss.toString(rs.getObject('resv_9')),
                jss.toString(rs.getObject('resv_10')),
                lon, lat, minlon, minlat, maxlon, maxlat, []];

            its.push(it); jss.log('查询问题图层数据******************************|||||||||||||||||||||');
            mapIt[key] = it;
        }

        var ptidx = header.length - 1;
        key = undefined;
        rs = sc.database.query(ptsql + " order by l.problem_id,l.coorindex ", vs);
        while (rs.next())
        {
            k = jss.toString(rs.getObject('id'));
            if (key != k)
                it = mapIt[key = k];

            lon = jss.toNumber(rs.getObject('longitude'));
            lat = jss.toNumber(rs.getObject('latitude'));
            pt.Reset(lon, lat);
            GpsOffset.Adjust(pt);

            it[ptidx].push([pt.x, pt.y, pt.x, pt.y]);
        }

        sc.print('{shetchs: ');
        sc.print(jss.encode(its));
        sc.println('}');

        jss.log('查询问题图层完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    SaveProblem: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件

        jss.log('保存问题信息!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        jss.log(jss.encode(args));

        var problem = args.problem, project_id = args.project_id, province_id = args.province_id, city_id = args.city_id, pts = problem.pts;
        if (jss.isEmpty(problem) || jss.isEmpty(project_id) || jss.isEmpty(province_id) || jss.isEmpty(city_id) || jss.isEmpty(pts))
        {
            sc.print('{success: false, msg: "保存问题数据失败:数据缺少必要字段值！"}');
            return;
        }
        try
        {
            var pinsert = "";
            var pdel = "";
            var lstinsert = "";
            var lstdel = "";
            var pcols = ['problem_id', 'problem_source', 'project_id', 'province_id', 'city_id', 'scene_type', 'scene_name',
                'phygrid_id', 'phygrid_type', 'slove_means', 'station_need', 'inoutdoor_cover_need', 'indoor_ds_need',
                'resv_1', 'resv_2', 'resv_3', 'resv_4', 'resv_5', 'resv_6', 'resv_7', 'resv_8', 'resv_9', 'resv_10',
                'longitude', 'latitude', 'minlongitude', 'minlatitude', 'maxlongitude', 'maxlatitude'];
            var lstcols = ['project_id', 'problem_id', 'coorindex', 'longitude', 'latitude'];

            if (problem.status == 'add')
                problem.id = problem.problem_id = sc.database.getValue(' select seq_gis_problem.nextval from dual ');
            else
            {
                pdel = " delete from gis_map_problem where project_id = ? and problem_id = ? ";
                lstdel = " delete from gis_map_problem_lst where project_id = ? and problem_id = ? ";
                sc.database.update(pdel, [project_id, problem.id]);
                sc.database.update(lstdel, [project_id, problem.id]);
            }

            problem.project_id = project_id;
            problem.province_id = province_id;
            problem.city_id = city_id;

            var realpt = new com.broadtech.unicom.common.Voronoi.Point(), offx, offy;
            var ps = [], vs = [], pt, lon = 0, lat = 0, minlon = 180, minlat = 90, maxlon = -180, maxlat = -90;
            lstinsert = " insert into gis_map_problem_lst (project_id,problem_id,coorindex,longitude,latitude) values (?,?,?,?,?) ";
            for (var i = 0, n = pts.length; i < n; i++)
            {
                pt = pts[i];
                /*********************************************************/
                // 地图的偏移坐标转为真实坐标
                realpt.Reset(pt.longitude, pt.latitude);
                GpsOffset.Adjust(realpt);
                offx = realpt.x - pt.longitude;
                offy = realpt.y - pt.latitude;
                realpt.Reset(pt.longitude - offx, pt.latitude - offy);
                /*********************************************************/
                lon += realpt.x;
                lat += realpt.y;
                minlon = Math.min(minlon, realpt.x);
                minlat = Math.min(minlat, realpt.y);
                maxlon = Math.max(maxlon, realpt.x);
                maxlat = Math.max(maxlat, realpt.y);

                sc.database.update(lstinsert, [project_id, problem.problem_id, jss.toNumber(i) + 1, realpt.x, realpt.y]);
            }


            problem.longitude = lon / pts.length;
            problem.latitude = lat / pts.length;
            problem.minlongitude = minlon;
            problem.minlatitude = minlat;
            problem.maxlongitude = maxlon;
            problem.maxlatitude = maxlat;

            var val;
            ps = [], vs = [];
            for (var i in pcols)
            {
                val = problem[pcols[i]];
                ps.push('?');
                vs.push(val ? val : '');
            }
            pinsert = " insert into gis_map_problem ( " + pcols.join(',') + ") values (" + ps.join(',') + ") ";
            sc.database.update(pinsert, vs);

            sc.database.commit();

            jss.log('保存问题数据完成！用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
            sc.print('{success: true, problem_id: ' + problem.problem_id + ', msg: "保存问题数据成功！"}');
        }
        catch (e)
        {
            sc.database.rollback();
            sc.print('{success: false, msg: "保存问题数据失败:' + jss.encode(e) + '"}');
        }
    },
    DelProblem: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件

        jss.log('删除问题数据！！！！！！！！！！');
        jss.log(jss.encode(args));

        var ids = args.ids, project_id = args.project_id;
        if (jss.isEmpty(ids))
        {
            sc.print('{success: true, msg: "没有问题数据需要删除！"}');
            return;
        }
        if (jss.isEmpty(project_id))
        {
            sc.print('{success: false, msg: "删除问题数据失败:数据缺少必要删除条件！"}');
            return;
        }
        try
        {
            var pdel = " delete from gis_map_problem where project_id = ? and problem_id in ( $para$ ) ";
            var lstdel = " delete from gis_map_problem_lst where project_id = ? and problem_id in ( $para$ ) ";

            var paraids = [project_id], paramark = [];
            for (var i = 0, n = ids.length; i < n; i++)
            {
                paramark.push('?');
                paraids.push(ids[i]);
            }
            pdel = pdel.replace('$para$', paramark.join(','));
            lstdel = lstdel.replace('$para$', paramark.join(','));

            jss.log(pdel);
            jss.log(lstdel);
            jss.log(jss.encode(paraids));

            sc.database.update(pdel, paraids);
            sc.database.update(lstdel, paraids);

            sc.database.commit();

            jss.log('删除问题数据完成！用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
            sc.print('{success: true, msg: "删除问题数据成功！"}');
        }
        catch (e)
        {
            sc.database.rollback();
            sc.print('{success: false, msg: "删除问题数据失败:' + jss.encode(e) + '"}');
        }
    },
    GetResidence: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件

        var sql, cs = [], vs = [], cscoor = [], vscoor = [];
        jss.log('查询楼宇库！！！！！！！！！！！！！！！');
        var tbl = " ( select r.province_id,r.city_id,building_no id,building_no,building_name name,building_name,coverd_network,z.area_type,'' area_subtype,"
            + " building_type,important_of_building,'' grid_type,building_area,max_floorsnum,under_floorsnum,'' staffs_num,"
            + " cover_method,room_cover_area_needed,room_cover_area_already,'' ltetype,'' ltechcfg,'' ltedevcfg,'' wtype,'' wdevcfg,"
            + " c.province_name,c.city_name, "
            + " longitude,latitude, null x, null y,0 direction,12 radius, 360 angle "
            + " from s_conf_residence_latest r, s_conf_residentzone_latest z, cfg_cityinfo c "
            + " where substr(r.building_no,0,12) = z.area_id and r.province_id = c.province_code and r.city_id = c.city_code "
            + " union all "
            + " select r.province_id,r.city_id,building_no id,building_no,building_name name,building_name,coverd_network,z.area_type,area_subtype,"
            + " building_type,important_of_building,'' grid_type,building_area,max_floorsnum,under_floorsnum,to_char(staffs_num) staffs_num,"
            + " cover_method,room_cover_area_needed,room_cover_area_already,'' ltetype,'' ltechcfg,'' ltedevcfg,'' wtype,'' wdevcfg,"
            + " c.province_name,c.city_name, "
            + " longitude,latitude, null x, null y,0 direction,12 radius, 360 angle "
            + " from s_conf_nonresidence_latest r, s_conf_nonresidentzone_latest z, cfg_cityinfo c "
            + " where substr(r.building_no,0,12) = z.area_id and r.province_id = c.province_code and r.city_id = c.city_code ) ";

        sql = " select * from " + tbl + " where longitude is not null and latitude is not null ";
        // 省份地市条件
        this.__provcond(args, cs, vs, "province_id", "province_name", "city_id", "city_name", "");
        // 经纬度条件
        this.__coorwidencond(args, cscoor, vscoor, "", 0.01);

        if (!jss.isEmpty(args.cover_method))
        {
            cs.push(" instr(','||?||',' , ','||cover_method||',') > 0 ");
            vs.push(args.cover_method); // 室外宏站,室内分布系统,室内外一体化覆盖
        }
        if (!jss.isEmpty(args.important_of_building))
        {
            cs.push(" instr(','||?||',' , ','||important_of_building||',') > 0 ");
            vs.push(args.important_of_building); // I类楼宇,II类楼宇,III类楼宇
        }

        var cond = "", coorcond = "";
        if (cs.length > 0)
            cond = ' and ' + cs.join(' and ');
        if (cscoor.length > 0)
            coorcond = ' and ' + cscoor.join(' and ');

        sql += cond + coorcond;
        vs = vs.concat(vscoor);

        jss.log(sql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs);
        sc.print('{cells: ');
        Database.write(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs));

        sc.println('}');
        jss.log('查询楼宇库完成!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    GetOutdoorSite: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件

        var cs = [], vs = [], cscoor = [], vscoor = [];
        jss.log('查询室外宏站！！！！！！！！！！！！！！！');

        var sql = " select province_id,city_id,related_county,location_id id,location_id,location_name name,location_name,phygrid_id,"
            + " phygrid_type,firstscene_type,firstscene_name,tel_condition,is_machine_room,ant_type,tower_share_statistics,"
            + " building_year,is_business,business_name, "
            + " c.province_name,c.city_name, "
            + " longitude,latitude, null x, null y,0 direction,12 radius, 360 angle"
            + " from s_outdoor_site_latest s, cfg_cityinfo c "
            + " where s.province_id = c.province_code and s.city_id = c.city_code "
            + " and longitude is not null and latitude is not null ";
        // 省份地市条件
        this.__provcond(args, cs, vs, "province_code", "province_name", "city_code", "city_name", "c");
        // 经纬度条件
        this.__coorwidencond(args, cscoor, vscoor, "", 0.01);

        /*******************g900,g1800,GSM物理站点************************/
        if (!jss.isEmpty(args.g900_resource_state))
        {
            cs.push(" instr(','||?||',' , ','||g900_resource_state||',') > 0 ");
            vs.push(args.g900_resource_state); // 已建,在建
        }
        if (!jss.isEmpty(args.g1800_resource_state))
        {
            cs.push(" instr(','||?||',' , ','||g1800_resource_state||',') > 0 ");
            vs.push(args.g1800_resource_state);
        }
        // g900_device_conf|g1800_device_conf 非空 & ant_type！= 无
        if (!jss.isEmpty(args.gdevice_conf))
            sql += " and (g900_device_conf is not null or g1800_device_conf is not null ) and ant_type <> '无' ";

        if (!jss.isEmpty(args.gresource_state))
        {
            cs.push(" ( instr(','||?||',' , ','||g900_resource_state||',') > 0 or instr(','||?||',' , ','||g1800_resource_state||',') > 0 ) ");
            vs.push(args.gresource_state);
            vs.push(args.gresource_state);
        }
        /*******************************************/

        /*******************u900,u1800,WCDMA物理站点************************/
        if (!jss.isEmpty(args.u900_resource_state))
        {
            cs.push(" instr(','||?||',' , ','||u900_resource_state||',') > 0 ");
            vs.push(args.u900_resource_state); // 已建,在建
        }
        if (!jss.isEmpty(args.u2100_resource_state))
        {
            cs.push(" instr(','||?||',' , ','||u2100_resource_state||',') > 0 ");
            vs.push(args.u2100_resource_state);
        }
        // u900_device_conf|u2100_device_conf 非空 & ant_type！= 无
        if (!jss.isEmpty(args.wdevice_conf))
            sql += " and (u900_device_conf is not null or u2100_resource_state is not null ) and ant_type <> '无' ";

        if (!jss.isEmpty(args.wresource_state))
        {
            cs.push(" ( instr(','||?||',' , ','||u900_resource_state||',') > 0 or instr(','||?||',' , ','||u2100_resource_state||',') > 0 ) ");
            vs.push(args.wresource_state);
            vs.push(args.wresource_state);
        }
        /*******************************************/

        /*******************TD-LTE,L1800,L2100,LTE物理站点************************/
        if (!jss.isEmpty(args.td_resource_state))
        {
            cs.push(" instr(','||?||',' , ','||td_resource_state||',') > 0 ");
            vs.push(args.td_resource_state); // 已建,在建
        }
        if (!jss.isEmpty(args.fdd1800_resource_state))
        {
            cs.push(" instr(','||?||',' , ','||fdd1800_resource_state||',') > 0 ");
            vs.push(args.fdd1800_resource_state); // 已建,在建
        }
        if (!jss.isEmpty(args.fdd2100_resource_state))
        {
            cs.push(" instr(','||?||',' , ','||fdd2100_resource_state||',') > 0 ");
            vs.push(args.fdd2100_resource_state);
        }
        // td_device_conf|fdd_device_conf|fdd2100_device_conf 非空 & ant_type！= 无
        if (!jss.isEmpty(args.ldevice_conf))
            sql += " and (td_device_conf is not null or fdd_device_conf is not null or fdd2100_device_conf is not null ) and ant_type <> '无' ";

        if (!jss.isEmpty(args.lresource_state))
        {
            cs.push(" ( instr(','||?||',' , ','||td_resource_state||',') > 0 or instr(','||?||',' , ','||fdd1800_resource_state||',') > 0 or instr(','||?||',' , ','||fdd2100_resource_state||',') > 0 ) ");
            vs.push(args.lresource_state);
            vs.push(args.lresource_state);
            vs.push(args.lresource_state);
        }
        /*******************************************/

        /*********************所有物理站址**********************/
        if (!jss.isEmpty(args.resource_state))
        {
            var statcond = " ( instr(','||?||',' , ','||g900_resource_state||',') > 0 "
                + " or instr(','||?||',' , ','||g1800_resource_state||',') > 0";
            vs.push(args.resource_state);
            vs.push(args.resource_state);

            statcond += " or instr(','||?||',' , ','||u900_resource_state||',') > 0 "
                + " or instr(','||?||',' , ','||u2100_resource_state||',') > 0 ";
            vs.push(args.resource_state);
            vs.push(args.resource_state);

            statcond += " or instr(','||?||',' , ','||td_resource_state||',') > 0 "
                + " or instr(','||?||',' , ','||fdd1800_resource_state||',') > 0 "
                + " or instr(','||?||',' , ','||fdd2100_resource_state||',') > 0 ) ";
            cs.push(statcond);
            vs.push(args.resource_state);
            vs.push(args.resource_state);
            vs.push(args.resource_state);
        }
        /*******************************************/

        var cond = "", coorcond = "";
        if (cs.length > 0)
            cond = ' and ' + cs.join(' and ');
        if (cscoor.length > 0)
            coorcond = ' and ' + cscoor.join(' and ');

        sql += cond + coorcond;
        vs = vs.concat(vscoor);

        jss.log(sql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs);
        sc.print('{cells: ');
        Database.write(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs));

        sc.println('}');
        jss.log('查询室外宏站!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    GetTowerExist: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件

        var cs = [], vs = [], cscoor = [], vscoor = [];
        jss.log('查询铁塔存量库！！！！！！！！！！！！！！！');

        var sql = " select province_id,city_id,related_county,site_no id,site_no,site_name name,site_name,site_address,"
            + " scene_type,tower_type,tower_height,height_min,platform_num,room_type,room_acreage,"
            + " c.province_name,c.city_name, "
            + " longitude,latitude, null x, null y,0 direction,12 radius, 360 angle,"
            + "TIMEMARK"
            + " from s_conf_tower_exsit_latest s, cfg_cityinfo c "
            + " where s.province_id = c.province_code and s.city_id = c.city_code "
            + " and longitude is not null and latitude is not null ";
        // 省份地市条件
        this.__provcond(args, cs, vs, "province_code", "province_name", "city_code", "city_name", "c");
        // 经纬度条件
        this.__coorwidencond(args, cscoor, vscoor, "", 0.01);
        if (!jss.isEmpty(args.starttime))
        {
            cs.push("trunc(timemark,'mm') = to_date('" + args.starttime.substr(0, 7) + "','yyyy-mm') ");
        }
        if (!jss.isEmpty(args.scene_type))
        {
            cs.push(" instr(','||?||',' , ','||scene_type||',') > 0 ");
            vs.push(args.scene_type);
        }

        var cond = "", coorcond = "";
        if (cs.length > 0)
            cond = ' and ' + cs.join(' and ');
        if (cscoor.length > 0)
            coorcond = ' and ' + cscoor.join(' and ');

        sql += cond + coorcond;
        vs = vs.concat(vscoor);

        jss.log(sql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs);
        sc.print('{cells: ');
        Database.write(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs));

        sc.println('}');
        jss.log('查询铁塔存量库!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    GetOtherPhySite: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件

        var cs = [], vs = [], cscoor = [], vscoor = [];
        jss.log('查询其他运营商物理站址！！！！！！！！！！！！！！！');

        var sql = " select province_id,city_id,phy_location_id id,phy_location_id,phy_location_id name,phy_location_id,"
            + " firstscene_type,firstscene_name,phygrid_id,phygrid_type,service_prove,is_4gstat,is_3gstat，is_2gstat,"
            + " c.province_name,c.city_name, "
            + " longitude,latitude, null x, null y,0 direction,12 radius, 360 angle"
            + " from s_station_other_latest s, cfg_cityinfo c "
            + " where s.province_id = c.province_code and s.city_id = c.city_code "
            + " and longitude is not null and latitude is not null ";
        // 省份地市条件
        this.__provcond(args, cs, vs, "province_code", "province_name", "city_code", "city_name", "c");
        // 经纬度条件
        this.__coorwidencond(args, cscoor, vscoor, "", 0.01);

        if (!jss.isEmpty(args.firstscene_type))
        {
            cs.push(" instr(','||?||',' , ','||firstscene_type||',') > 0 ");
            vs.push(args.firstscene_type);
        }
        if (!jss.isEmpty(args.firstscene_name))
        {
            cs.push(" instr(','||?||',' , ','||firstscene_name||',') > 0 ");
            vs.push(args.firstscene_name);
        }
        if (!jss.isEmpty(args.phygrid_id))
        {
            cs.push(" instr(','||?||',' , ','||phygrid_id||',') > 0 ");
            vs.push(args.phygrid_id);
        }
        if (!jss.isEmpty(args.service_prove))
        {
            cs.push(" instr(','||?||',' , ','||service_prove||',') > 0 ");
            vs.push(args.service_prove);
        }

        var cond = "", coorcond = "";
        if (cs.length > 0)
            cond = ' and ' + cs.join(' and ');
        if (cscoor.length > 0)
            coorcond = ' and ' + cscoor.join(' and ');

        sql += cond + coorcond;
        vs = vs.concat(vscoor);

        jss.log(sql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs);
        sc.print('{cells: ');
        Database.write(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs));

        sc.println('}');
        jss.log('查询其他运营商物理站址!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    GetOtherNetSite: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件

        var cs = [], vs = [], cscoor = [], vscoor = [];
        jss.log('查询其他运营商各网络站址！！！！！！！！！！！！！！！');

        var sql = " select province_id,city_id,phy_location_id id,phy_location_id,phy_location_id name,phy_location_id,"
            + " firstscene_type,firstscene_name,phygrid_id,phygrid_type,service_prove,net,"
            + " c.province_name,c.city_name, "
            + " longitude,latitude, null x, null y,0 direction,12 radius, 360 angle"
            + " from s_234g_site_other_latest s, cfg_cityinfo c "
            + " where s.province_id = c.province_code and s.city_id = c.city_code "
            + " and longitude is not null and latitude is not null ";
        // 省份地市条件
        this.__provcond(args, cs, vs, "province_code", "province_name", "city_code", "city_name", "c");
        // 经纬度条件
        this.__coorwidencond(args, cscoor, vscoor, "", 0.01);

        if (!jss.isEmpty(args.firstscene_type))
        {
            cs.push(" instr(','||?||',' , ','||firstscene_type||',') > 0 ");
            vs.push(args.firstscene_type);
        }
        if (!jss.isEmpty(args.firstscene_name))
        {
            cs.push(" instr(','||?||',' , ','||firstscene_name||',') > 0 ");
            vs.push(args.firstscene_name);
        }
        if (!jss.isEmpty(args.phygrid_id))
        {
            cs.push(" instr(','||?||',' , ','||phygrid_id||',') > 0 ");
            vs.push(args.phygrid_id);
        }
        if (!jss.isEmpty(args.service_prove))
        {
            cs.push(" instr(','||?||',' , ','||service_prove||',') > 0 ");
            vs.push(args.service_prove);
        }
        if (!jss.isEmpty(args.net))
        {
            cs.push(" instr(','||?||',' , ','||net||',') > 0 ");
            vs.push(args.net);
        }

        var cond = "", coorcond = "";
        if (cs.length > 0)
            cond = ' and ' + cs.join(' and ');
        if (cscoor.length > 0)
            coorcond = ' and ' + cscoor.join(' and ');

        sql += cond + coorcond;
        vs = vs.concat(vscoor);

        jss.log(sql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs);
        sc.print('{cells: ');
        Database.write(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs));

        sc.println('}');
        jss.log('查询其他运营商各网络站址!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    GetIndoorSite: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件

        var cs = [], vs = [], cscoor = [], vscoor = [];
        jss.log('查询室分库！！！！！！！！！！！！！！！');

        var sql = " select province_id,city_id,building_no id,building_no,building_name name,building_name,building_type,"
            + " building_area,coverd_network,building_class,phygrid_id,phygrid_type,building_structure,important_of_building,"
            + " c.province_name,c.city_name, "
            + " longitude,latitude, null x, null y,0 direction,12 radius, 360 angle"
            + " from s_indoor_site_latest s, cfg_cityinfo c "
            + " where s.province_id = c.province_code and s.city_id = c.city_code "
            + " and longitude is not null and latitude is not null ";
        // 省份地市条件
        this.__provcond(args, cs, vs, "province_code", "province_name", "city_code", "city_name", "c");
        // 经纬度条件
        this.__coorwidencond(args, cscoor, vscoor, "", 0.01);

        if (!jss.isEmpty(args.phygrid_id))
        {
            cs.push(" instr(','||?||',' , ','||phygrid_id||',') > 0 ");
            vs.push(args.phygrid_id);
        }
        if (!jss.isEmpty(args.ds_status))
        {
            cs.push(" instr(','||?||',' , ','||ds_status||',') > 0 ");
            vs.push(args.ds_status); // 在用,在建,待建,停用
        }
        if (!jss.isEmpty(args.lte_system))
        {
            cs.push(" instr(','||?||',' , ','||lte_system||',') > 0 ");
            vs.push(args.lte_system); // FDD-LTE,TD-LTE,FDD-LTE+TD-LTE
        }
        if (!jss.isEmpty(args.wcdma_system))
        {
            cs.push(" instr(','||?||',' , ','||wcdma_system||',') > 0 ");
            vs.push(args.wcdma_system); // U2100，U900，U2100+U900
        }
        if (!jss.isEmpty(args.gsm_system))
        {
            cs.push(" instr(','||?||',' , ','||gsm_system||',') > 0 ");
            vs.push(args.gsm_system); // G900，G1800，G900+G1800
        }

        var cond = "", coorcond = "";
        if (cs.length > 0)
            cond = ' and ' + cs.join(' and ');
        if (cscoor.length > 0)
            coorcond = ' and ' + cscoor.join(' and ');

        sql += cond + coorcond;
        vs = vs.concat(vscoor);

        jss.log(sql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs);
        sc.print('{cells: ');
        Database.write(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs));

        sc.println('}');
        jss.log('查询室分库!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    GetPrOutdoorSite: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件

        var cs = [], vs = [], cscoor = [], vscoor = [];
        jss.log('查询室外宏站！！！！！！！！！！！！！！！');

        var sql = " select province_id,city_id,related_county,location_id id,location_id,location_name name,location_name,phygrid_id,"
            + " phygrid_type,firstscene_type,firstscene_name,tel_condition,is_machine_room,ant_type,tower_share_statistics,"
            + " building_year,is_business,business_name, "
            + " c.province_name,c.city_name, "
            + " longitude,latitude, null x, null y,0 direction,12 radius, 360 angle"
            + " from s_outdoor_site_latest s, cfg_cityinfo c "
            + " where s.province_id = c.province_code and s.city_id = c.city_code "
            + " and longitude is not null and latitude is not null ";
        // 省份地市条件
        this.__provcond(args, cs, vs, "province_code", "province_name", "city_code", "city_name", "c");
        // 经纬度条件
        this.__coorwidencond(args, cscoor, vscoor, "", 0.01);

        /*******************g900,g1800,GSM物理站点************************/
        if (!jss.isEmpty(args.g900_resource_state))
        {
            cs.push(" instr(','||?||',' , ','||g900_resource_state||',') > 0 ");
            vs.push(args.g900_resource_state); // 已建,在建
        }
        if (!jss.isEmpty(args.g1800_resource_state))
        {
            cs.push(" instr(','||?||',' , ','||g1800_resource_state||',') > 0 ");
            vs.push(args.g1800_resource_state);
        }
        // g900_device_conf|g1800_device_conf 非空 & ant_type！= 无
        if (!jss.isEmpty(args.gdevice_conf))
            sql += " and (g900_device_conf is not null or g1800_device_conf is not null ) and ant_type <> '无' ";

        if (!jss.isEmpty(args.gresource_state))
        {
            cs.push(" ( instr(','||?||',' , ','||g900_resource_state||',') > 0 or instr(','||?||',' , ','||g1800_resource_state||',') > 0 ) ");
            vs.push(args.gresource_state);
            vs.push(args.gresource_state);
        }
        /*******************************************/

        /*******************u900,u1800,WCDMA物理站点************************/
        if (!jss.isEmpty(args.u900_resource_state))
        {
            cs.push(" instr(','||?||',' , ','||u900_resource_state||',') > 0 ");
            vs.push(args.u900_resource_state); // 已建,在建
        }
        if (!jss.isEmpty(args.u2100_resource_state))
        {
            cs.push(" instr(','||?||',' , ','||u2100_resource_state||',') > 0 ");
            vs.push(args.u2100_resource_state);
        }
        // u900_device_conf|u2100_device_conf 非空 & ant_type！= 无
        if (!jss.isEmpty(args.wdevice_conf))
            sql += " and (u900_device_conf is not null or u2100_resource_state is not null ) and ant_type <> '无' ";

        if (!jss.isEmpty(args.wresource_state))
        {
            cs.push(" ( instr(','||?||',' , ','||u900_resource_state||',') > 0 or instr(','||?||',' , ','||u2100_resource_state||',') > 0 ) ");
            vs.push(args.wresource_state);
            vs.push(args.wresource_state);
        }
        /*******************************************/

        /*******************TD-LTE,L1800,L2100,LTE物理站点************************/
        if (!jss.isEmpty(args.td_resource_state))
        {
            cs.push(" instr(','||?||',' , ','||td_resource_state||',') > 0 ");
            vs.push(args.td_resource_state); // 已建,在建
        }
        if (!jss.isEmpty(args.fdd1800_resource_state))
        {
            cs.push(" instr(','||?||',' , ','||fdd1800_resource_state||',') > 0 ");
            vs.push(args.fdd1800_resource_state); // 已建,在建
        }
        if (!jss.isEmpty(args.fdd2100_resource_state))
        {
            cs.push(" instr(','||?||',' , ','||fdd2100_resource_state||',') > 0 ");
            vs.push(args.fdd2100_resource_state);
        }
        // td_device_conf|fdd_device_conf|fdd2100_device_conf 非空 & ant_type！= 无
        if (!jss.isEmpty(args.ldevice_conf))
            sql += " and (td_device_conf is not null or fdd_device_conf is not null or fdd2100_device_conf is not null ) and ant_type <> '无' ";

        if (!jss.isEmpty(args.lresource_state))
        {
            cs.push(" ( instr(','||?||',' , ','||td_resource_state||',') > 0 or instr(','||?||',' , ','||fdd1800_resource_state||',') > 0 or instr(','||?||',' , ','||fdd2100_resource_state||',') > 0 ) ");
            vs.push(args.lresource_state);
            vs.push(args.lresource_state);
            vs.push(args.lresource_state);
        }
        /*******************************************/
        
        
        /*******************LTE竞合站点************************/
        //td_device_conf|fdd_device_conf|fdd2100_device_conf 非空 & ant_type！= 无 &tel_condition= {独立载波联通竞合电信、独立载波电信竞合联通、共享载波联通竞合电信、共享载波电信竞合联通}
        if (!jss.isEmpty(args.lcdevice_conf))
            sql += " and (td_device_conf is not null or fdd_device_conf is not null or fdd2100_device_conf is not null ) and ant_type <> '无' ";

        if (!jss.isEmpty(args.tel_condition))
        {
            cs.push(" instr(','||?||',' , ','||tel_condition||',') > 0 ");           
            vs.push(args.tel_condition);
        }
        /*******************************************/

        /*********************所有物理站址**********************/
        if (!jss.isEmpty(args.resource_state))
        {
            var statcond = " ( instr(','||?||',' , ','||g900_resource_state||',') > 0 "
                + " or instr(','||?||',' , ','||g1800_resource_state||',') > 0";
            vs.push(args.resource_state);
            vs.push(args.resource_state);

            statcond += " or instr(','||?||',' , ','||u900_resource_state||',') > 0 "
                + " or instr(','||?||',' , ','||u2100_resource_state||',') > 0 ";
            vs.push(args.resource_state);
            vs.push(args.resource_state);

            statcond += " or instr(','||?||',' , ','||td_resource_state||',') > 0 "
                + " or instr(','||?||',' , ','||fdd1800_resource_state||',') > 0 "
                + " or instr(','||?||',' , ','||fdd2100_resource_state||',') > 0 ) ";
            cs.push(statcond);
            vs.push(args.resource_state);
            vs.push(args.resource_state);
            vs.push(args.resource_state);
        }
        /*******************************************/

        var cond = "", coorcond = "";
        if (cs.length > 0)
            cond = ' and ' + cs.join(' and ');
        if (cscoor.length > 0)
            coorcond = ' and ' + cscoor.join(' and ');

        sql += cond + coorcond;
        vs = vs.concat(vscoor);

        jss.log(sql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs);
        sc.print('{cells: ');
        Database.write(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs));

        sc.println('}');
        jss.log('查询规划方案展示室外宏站!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    GetPrIndoorSite: function (sc)
    {
        var tm = java.lang.System.currentTimeMillis();
        var args = jss.decode(sc.GetString('args'));
        args = this.__getquerycond(args); // 获取条件

        var cs = [], vs = [], cscoor = [], vscoor = [];
        jss.log('查询室分库！！！！！！！！！！！！！！！');

        var sql = " select province_id,city_id,building_no id,building_no,building_name name,building_name,building_type,"
            + " building_area,coverd_network,building_class,phygrid_id,phygrid_type,building_structure,important_of_building,"
            + " c.province_name,c.city_name, "
            + " longitude,latitude, null x, null y,0 direction,12 radius, 360 angle"
            + " from s_indoor_site_latest s, cfg_cityinfo c "
            + " where s.province_id = c.province_code and s.city_id = c.city_code "
            + " and longitude is not null and latitude is not null ";
        // 省份地市条件
        this.__provcond(args, cs, vs, "province_code", "province_name", "city_code", "city_name", "c");
        // 经纬度条件
        this.__coorwidencond(args, cscoor, vscoor, "", 0.01);

        if (!jss.isEmpty(args.phygrid_id))
        {
            cs.push(" instr(','||?||',' , ','||phygrid_id||',') > 0 ");
            vs.push(args.phygrid_id);
        }
        if (!jss.isEmpty(args.cover_method))
        {
            cs.push(" instr(','||?||',' , ','||cover_method||',') > 0 ");
            vs.push(args.cover_method); //室内外一体化覆盖
        }
        if (!jss.isEmpty(args.lte_system))
        {
            cs.push(" instr(','||?||',' , ','||lte_system||',') > 0 ");
            vs.push(args.lte_system); // FDD-LTE,TD-LTE,FDD-LTE+TD-LTE
        }
        if (!jss.isEmpty(args.wcdma_system))
        {
            cs.push(" instr(','||?||',' , ','||wcdma_system||',') > 0 ");
            vs.push(args.wcdma_system); // U2100，U900，U2100+U900
        }
        if (!jss.isEmpty(args.gsm_system))
        {
            cs.push(" instr(','||?||',' , ','||gsm_system||',') > 0 ");
            vs.push(args.gsm_system); // G900，G1800，G900+G1800
        }
        if (!jss.isEmpty(args.important_of_building))
        {
            cs.push(" instr(','||?||',' , ','||important_of_building||',') > 0 ");
            vs.push(args.important_of_building); // I类，II类，III类
        }

        var cond = "", coorcond = "";
        if (cs.length > 0)
            cond = ' and ' + cs.join(' and ');
        if (cscoor.length > 0)
            coorcond = ' and ' + cscoor.join(' and ');

        sql += cond + coorcond;
        vs = vs.concat(vscoor);

        jss.log(sql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(args));

        var rs = sc.database.query(sql, vs);
        sc.print('{cells: ');
        Database.write(sc.out, rs, true, -1, GpsOffset.CreateFilter(rs));

        sc.println('}');
        jss.log('查询室分库!用时：' + (java.lang.System.currentTimeMillis() - tm) + ' ms。');
    },
    GetPolygon: function (sc)
    {
        var args = jss.decode(sc.GetString('args'));
        
        var cs = [], vs = [];
        this.__logiccoorcond(args, cs, vs);
        
        sc.print('{cells: ');
        
        var sql = " select id, x, y, 0 antennadirection, 0 direction, 15 radius, 0 angle from cfg_polygon where type=666";
        
        sql += ' and ' + cs.join(' and ');
        
        sc.database.writeAll(sc.out, sql, vs);
        
        sc.println(',');
        
        sc.print('polygon:');
        sql = " select p.minX left, p.minY top,(p.maxX - p.minX) width,(p.maxY - p.minY) height, p.pts, '[' || p.id || ']' items from cfg_polygon p "
            + " where p.type=666";

        

        sql += ' and ' + cs.join(' and ');

        sc.database.writeAll(sc.out, sql, vs);
        jss.log(sql);
        jss.log(jss.encode(vs));
        jss.log(jss.encode(args));
        sc.println('}');
        jss.log('多边形！！！！！！！！！！！！！！！');
    }
};