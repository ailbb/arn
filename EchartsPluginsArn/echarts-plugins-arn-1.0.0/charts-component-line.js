// 逐行----
define(['eCharts','moment'], function (echarts,moment){
    // 组件的配置
    let option =  {
        isCompress: false,
        backgroundColor: '',
        title: {
            text: '单位/gbps',
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
            trigger: 'axis',
        },
        legend: {
            show: false,
            type: 'scroll',
            orient: 'horizontal',
            // left: 30,
            // right: 0,
            padding: [5, 80],
            data: []
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00'],
            axisLine: {
                show: true,
                lineStyle: { //隐藏Y轴
                    opacity: 0.5,
                    color: '#4A90E2'
                }
            },
            axisTick: {
                show: false,
            }
        },
        yAxis: {
            type: 'value',
            axisLine: {
                show: false,
                lineStyle: { //隐藏Y轴
                    opacity: 0
                }
            },
            axisTick: {
                show: false
            },
            splitLine: {
                lineStyle: {
                    type:'dashed',//虚线
                    color: '#033B6C'
                }
            }
        },
        grid: {
            left: '2%',
            right: '3%',
            top: '20%',
            bottom: '5%',
            containLabel: true
        },
        series: [
            {
                name: '3G语音采集量',
                data: [150, 230, 224, 218, 135, 147, 260],
                type: 'line',
                lineStyle: {
                    color: '#007eeb'
                }
            },
            {
                name: '3G数据采集量',
                data: [120, 240, 254, 208, 105, 137, 210],
                type: 'line',
                lineStyle: {
                    color: '#04dbe4'
                }
            }
        ]
    };

    // 组件的核心功能
    let component =  {
        vm: {},
        myChart: {},
        getOption(_chartsData, overwrite_option){
            let _option = this.cloneOption(option);
            _option.yAxis.max = overwrite_option.max;
            _option.legend.data = _chartsData.legendData; // 设置图表的legend
            _option.series = _chartsData.series; // 设置图表的数据
            _option.xAxis.data = _chartsData.xAxisData; // 设置图表的x轴
            _option.title.text = overwrite_option.unit; // 单位信息
            return _option;
        },
        cloneOption(_option){ return Object.assign({}, _option); },
        /**
         * 加工结果数据为图表数据
         * @param resultData = [{
							name: '曲线通幽处，禅房花木深1', // 展示的名称
							data: {
								'00:00': 1.2345 // 时间：的值
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
            let xAxisData=[], legendData=[], series=[], i=0;

            let color = overwrite_option.color || ["#52C41A00","#697DFF00"];
            let lineColor = overwrite_option.lineColor || ["#53C0EF","#43BC72"];
            let areaColor = overwrite_option.areaColor || {
                0: ["#53C0EF","#010b13"],
                1: ["#52C41A00","#52C41A00"]
            };

            if(overwrite_option.serieName) option.legend.show = true;
            if(legendData.length == 1) option.legend.show = false;

            for(let k in resultData) { // 循环结果数据
                let rows = resultData[k];
                if(rows.length == 0) continue;

                // if(filteData && -1 == filteData.indexOf(rows.name)) continue;

                let serie = {
                    name: (overwrite_option.serieName || ['采集量', '剩余量'])[k],
                    type: 'line',
                    stack: overwrite_option.stack || '',
                    symbolSize: 1,
                    data: this.formatRowData(rows.map(r=>r.y)),
                    areaStyle: overwrite_option.noAreaStyle ? null : {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            {
                                offset: 0,
                                color: areaColor[k][0]
                            },
                            {
                                offset: 0.75,
                                color: areaColor[k][1]
                            }
                        ])
                    },
                    emphasis: {
                        focus: 'series'
                    },
                    "itemStyle" : {
                        "normal" : {
                            "color": color[k], //改变折线点的颜色
                            "lineStyle":{
                                "color": lineColor[k], //改变折线颜色
                                "width": 2
                            }
                        }
                    }

                };

                legendData.push({
                    name: (overwrite_option.serieName || ['已使用','剩余量'])[k]+"",
                    // 强制设置图形为圆。
                    icon: 'rect',
                    // icon: 'circle',
                    itemStyle: {
                        color: lineColor[k]
                        // color: "red"
                    }
                }); // push图表的X轴


                xAxisData = rows.map(r=>r.x); // time是x轴
                //处理时间格式
                for(var j=0;j<xAxisData.length;j++){
                    xAxisData[j]=moment(xAxisData[j]).format(dim < 2 ? "MM/DD HH时" : 'MM/DD')
                }
                series.push(serie); // 绘图的数据
            }

            return {xAxisData, legendData, series};
        },
        draw(el, resultData, filteData, dim, overwrite_option, isCompress) { // 绘图
            let _this = this;

            option.isCompress = isCompress;

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
            if(!option.isCompress) return v || 0;
            let t = v/1024;
            return t > 1000 ? arguments.callee(t) : t;
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
