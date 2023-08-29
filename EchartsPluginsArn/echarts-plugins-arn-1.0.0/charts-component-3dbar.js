// 逐行----
define(['eCharts','moment'], function (echarts,moment){
    var OPTION_STATIC = {yellowName: [] };

    // 组件的配置
    let option =  {
        backgroundColor: '#FFF00',
        title: {
            text: '单位/GB',
            textStyle:{
                //文字颜色
                color:'#CFE3EA',
                //字体风格,'normal','italic','oblique'
                fontStyle:'normal',
                //字体粗细 'normal','bold','bolder','lighter',100 | 200 | 300 | 400...
                fontWeight:'500',
                //字体系列
                fontFamily:'PingFangSC-Medium, PingFang SC',
                //字体大小
                fontSize:14
            }
        },
        tooltip: {
            trigger: 'item',
            formatter: function (params) {
                return (params.name +"："+ params.data);
            }
        },
        grid: {
            left: '0%',
            right: '0%',
            top: '20%',
            bottom: '7%',
            containLabel: true
        },
        legend: {
            // right: 0,
            data: ['3G语音采集量', '3G数据采集量']
        },
        xAxis: {
            data: [],
            axisTick: {
                show: false
            },
            axisLabel: { //X轴文字样式
                color: '#a9aabc',
                fontSize: 12,
                interval: 0,
                padding: [10, 0, 0, 0]
            },
            axisLine: {
                show: false,
                lineStyle: { //隐藏Y轴
                    opacity: 0.5,
                    color: '#4A90E2'
                }
            },
        },
        yAxis: {
            splitLine: {
                show: false,
            },
            axisTick: {
                show: false
            },
            axisLine: {
                show: false,
                lineStyle: { //隐藏Y轴
                    opacity: 0,
                    color: '#4A90E2'
                }
            },
            axisLabel: {
                textStyle: {
                    color: '#fff',
                    fontSize: 12
                },
            }
        },
        series: [
            {//三个最低下的圆片
                "name": "",
                "type": "pictorialBar",
                "symbolSize": [45, 25],
                "symbolOffset": [0, 10],
                "z": 12,
                itemStyle:{
                    color: function(params){
                        var a = params.name.slice(0,2);
                        var ok = -1 == OPTION_STATIC.yellowName.indexOf(params.name);
                        // 柱子未使用的顶端帽子的渐变色
                        return !ok ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                            offset: 0,
                            color: '#8C321500' // 0% 处的颜色
                        }, {
                            offset: 0.49,
                            color: '#8C321500' // 0% 处的颜色
                        }, {
                            offset: 0.61,
                            color: '#F7B733' // 50% 处的颜色
                        }, {
                            offset: 1,
                            color:  '#F7B733'// 100% 处的颜色
                        }], false) : new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                            offset: 0,
                            color: '#1176C800' // 0% 处的颜色
                        }, {
                            offset: 0.6,
                            color: '#1176C8' // 0% 处的颜色
                        }, {
                            offset: 1,
                            color:  '#1176C8'// 100% 处的颜色
                        }], false);
                    },
                    opacity:0.7,
                },
                "data": [1,1,1,1,1]
            },

            //下半截柱状图
            {
                name: '2020',
                type: 'bar',
                barWidth: 45,
                barGap: '-100%',
                itemStyle: {//lenged文本
                    opacity:.7,
                    color: function(params){
                        var a = params.name.slice(0,2);
                        var ok = -1 == OPTION_STATIC.yellowName.indexOf(params.name);
                        // 柱子已使用的柱子的渐变色
                        return !ok ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                            offset: 0,
                            color: '#FC4A1A' // 0% 处的颜色
                        },{
                            offset: 1,
                            color:  '#F7B733'// 100% 处的颜色
                        }], false) : new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                            offset: 0,
                            color: '#1963C4' // 0% 处的颜色
                        },{
                            offset: 1,
                            color:  '#1176C8'// 100% 处的颜色
                        }], false);
                    }
                },
                data: []
            },
            { // 替代柱状图 默认不显示颜色，是最下方柱图（邮件营销）的value值 - 20
                type: 'bar',
                barWidth: 45,
                barGap: '-100%',
                stack: '广告',
                itemStyle: {
                    color: 'transparent'
                },
                data: []
            },
            {
                "name": "", //头部
                "type": "pictorialBar",
                "symbolSize": [45, 25],
                "symbolOffset": [0, -10],
                "z": 12,
                "symbolPosition": "end",
                itemStyle:{
                    color: function(params){
                        var a = params.name.slice(0,2);
                        var ok = -1 == OPTION_STATIC.yellowName.indexOf(params.name);
                        // 柱子未使用的顶端帽子的渐变色
                        return !ok ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                            offset: 0,
                            color: '#8C3215' // 0% 处的颜色
                        }, {
                            offset: 1,
                            color:  '#DD7B1B'// 100% 处的颜色
                        }], false) : new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                            offset: 0.33,
                            color: '#1173C2' // 0% 处的颜色
                        }, {
                            offset: 0.44,
                            color: '#1C69BF' // 0% 处的颜色
                        }, {
                            offset: 0.45,
                            color: '#1D68BF' // 0% 处的颜色
                        }, {
                            offset: 0.31,
                            color:  '#1176C8'// 100% 处的颜色
                        }], false);
                    },
                    opacity:0.85,
                },
                "data": [],
                label: {
                    show: true, //开启显示
                    position: 'top', //在上方显示
                    textStyle: { //数值样式
                        color: '#00FFC4',
                        fontSize: 16
                    },
                    formatter: (params)=>{
                        // if(params.dataIndex === 0){
                        //     return '{c|'+params.value+'}\n{a|'+params.seriesName+'}';
                        // }else{
                        //     return '';
                        // }
                        return (component.myChart['#chart-bar2'].getOption().series[0].data[params.dataIndex] / params.value *100).toFixed(2) + '%';
                    }
                },
            },
            {
                "name": "",
                "type": "pictorialBar",
                "symbolSize": [45, 25],
                "symbolOffset": [0, -10],
                "z": 12,
                itemStyle:{
                    opacity:1,
                    color: function(params){
                        var a = params.name.slice(0,2);
                        var ok = -1 == OPTION_STATIC.yellowName.indexOf(params.name);
                        // 柱子已使用的顶端帽子的渐变色
                        return !ok ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                            offset: 0,
                            color: '#8C3215' // 0% 处的颜色
                        }, {
                            offset: 1,
                            color:  '#DD7B1B'// 100% 处的颜色
                        }], false) : new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                            offset: 0,
                            color: '#1176C8' // 0% 处的颜色
                        }, {
                            offset: 0.6,
                            color: '#1176C8' // 0% 处的颜色
                        }, {
                            offset: 1,
                            color:  '#1176C8'// 100% 处的颜色
                        }], false);
                    }
                },
                "symbolPosition": "end",
                "data": []
            },
            {
                name: 'x',
                type: 'bar',
                barWidth: 45,
                barGap: '-100%',
                z:0,
                itemStyle: {
                    color: function(params){
                        var a = params.name.slice(0,2);
                        var ok = -1 == OPTION_STATIC.yellowName.indexOf(params.name);
                        // 柱子未使用柱子的渐变色
                        return !ok ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                            offset: 0,
                            color: '#C23E11' // 0% 处的颜色
                        }, {
                            offset: 0.2,
                            color:  '#BF641C'// 100% 处的颜色
                        }, {
                            offset: 0.5,
                            color:  '#BF631D'// 100% 处的颜色
                        }, {
                            offset: 1,
                            color:  '#C86411'// 100% 处的颜色
                        }], false) : new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                            offset: 0.6,
                            color: '#1963C4' // 0% 处的颜色
                        }, {
                            offset: 0.19,
                            color:  '#198ACD'// 100% 处的颜色
                        }, {
                            offset: 0.17,
                            color:  '#198CCD'// 100% 处的颜色
                        }, {
                            offset: 1,
                            color:  '#1176C8'// 100% 处的颜色
                        }], false);


                    },
                    opacity:.3,
                },
                data: []
            }

        ]
    };

    // 组件的核心功能
    let component =  {
        vm: {},
        myChart: {},
        getOption(_chartsData, overwrite_option){
            let _option = this.cloneOption(option);
            _option.legend.data = _chartsData.legendData; // 设置图表的legend

            _option.series[0].data = _chartsData.seriesAvg; // 设置图表的数据
            _option.series[1].data = _chartsData.seriesAvg; // 设置图表的数据
            _option.series[2].data = _chartsData.seriesAvg; // 设置图表的数据
            _option.series[3].data = _chartsData.seriesCfg; // 设置图表的数据
            _option.series[4].data = _chartsData.seriesAvg; // 设置图表的数据
            _option.series[5].data = _chartsData.seriesCfg; // 设置图表的数据

            _option.xAxis.data = _chartsData.xAxisData; // 设置图表的x轴

            _option.title.text = overwrite_option.unit; // 单位信息
            OPTION_STATIC.yellowName = overwrite_option.yellowName; // 单位信息
            return _option;
        },
        cloneOption(_option){ return Object.assign({}, _option); },
        /**
         * 加工结果数据为图表数据
         * @param resultData = [{
							name: '曲线通幽处，禅房花木深1', // 展示的名称
							data: {
								'00:00': 1.2345 // 时间：当前时间的值
							},
						}]
         * @returns {{legend: [], series: [], time: []}}
         {
							legend: [], // 图表的展示数据
							series: [], // 图表的实例数据
							time: [] // x轴的横坐标
						}
         */
        encodeChartData(resultData, filteData, dim, overwrite_option){ // 将当前的结果集数据，转换为图表数据
            if(resultData.xAxisData) return resultData;
            let xAxisData=[], legendData=[], series=[], i=0;
            // overwrite_option = overwrite_option || {};
            // let color = overwrite_option.color || ["#52C41A00","#697DFF00"];
            // let lineColor = overwrite_option.lineColor || ["#53C0EF","#43BC72"];
            // let areaColor = overwrite_option.areaColor || {
            //     0: ["#53C0EF","#010b13"],
            //     1: ["#52C41A00","#52C41A00"]
            // };
            //
            // for(let k in resultData) { // 循环结果数据
            //     let rows = resultData[k];
            //
            //     // if(filteData && -1 == filteData.indexOf(rows.name)) continue;
            //
            //     let serie = {
            //         name: ['已使用', '总量'][k],
            //         type: 'line',
            //         stack: overwrite_option.stack || '',
            //         symbolSize: 20,
            //         data: this.formatRowData(rows.map(r=>r.y)),
            //         areaStyle: {
            //             color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            //                 {
            //                     offset: 0,
            //                     color: areaColor[k][0]
            //                 },
            //                 {
            //                     offset: 0.75,
            //                     color: areaColor[k][1]
            //                 }
            //             ])
            //         },
            //         emphasis: {
            //             focus: 'series'
            //         },
            //         "itemStyle" : {
            //             "normal" : {
            //                 "color": color[k], //改变折线点的颜色
            //                 "lineStyle":{
            //                     "color": lineColor[k], //改变折线颜色
            //                     "width": 2
            //                 }
            //             }
            //         }
            //
            //     };
            //
            //     legendData.push(['已使用','总量'][k]); // push图表的X轴
            //     xAxisData = rows.map(r=>r.x); // time是x轴
            //     //处理时间格式
            //     for(var j=0;j<xAxisData.length;j++){
            //         xAxisData[j]=moment(xAxisData[j]).format(dim < 2 ? "HH:mm" : 'MM/DD')
            //     }
            //     series.push(serie); // 绘图的数据
            // }

            return {xAxisData, legendData, series};
        },
        draw(el, resultData, filteData, dim, overwrite_option) { // 绘图
            let _this = this;
            if(!this.myChart[el]) {
                this.myChart[el] = echarts.init($(el)[0], 'dark');
                window.onresize = function (){
                    _this.myChart[el].resize();
                }
            }
            this.myChart[el].setOption(this.getOption(this.encodeChartData(resultData, filteData, dim, overwrite_option), overwrite_option),true); // 绘图
            return this;
        },
        resize() { if(!this.myChart) return ; this.myChart.resize(); }, // 响应式插件
        formatRowData(data){
            return Object.values(data).map(v=>{
                return parseFloat(component.compress(v).toFixed(2));
            });
        }, // 数据保留2个小数点
        compress(v) {
            let t = v/1024;
            return t > 300 ? arguments.callee(t) : t;
        }
    };

    // 对外暴露组件的方法
    return {
        vm: component.vm,
        myChart: component.myChart,
        getOption: component.getOption,
        cloneOption: component.cloneOption,
        encodeChartData: component.encodeChartData,
        draw: component.draw,
        resize: component.resize,
        formatRowData: component.formatRowData
    };
});
