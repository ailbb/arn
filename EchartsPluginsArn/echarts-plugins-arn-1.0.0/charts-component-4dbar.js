// 逐行----
define(['eCharts','moment'], function (echarts,moment){
    // x方格
    var hours = ['12a', '1a', '2a', '3a', '4a', '5a', '6a',
        '7a', '8a', '9a', '10a', '11a',
        '12p', '1p', '2p', '3p', '4p', '5p',
        '6p', '7p', '8p', '9p', '10p', '11p'];
    // z方格
    var days = ['Saturday', 'Friday', 'Thursday',
        'Wednesday', 'Tuesday', 'Monday', 'Sunday'];
    // 数据 z\x\y
    var data = [
        [0, 0, 5], [0, 1, 1]
    ];

    // 组件的配置
    let option = {
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
        tooltip: {},
        visualMap: {
            max: 20,
            inRange: {
                color: [
                    '#313695',
                    '#4575b4',
                    '#74add1',
                    '#abd9e9',
                    '#e0f3f8',
                    '#ffffbf',
                    '#fee090',
                    '#fdae61',
                    '#f46d43',
                    '#d73027',
                    '#a50026'
                ]
            }
        },
        xAxis3D: {
            type: 'category',
            data: hours,
            axisLabel: { //X轴文字样式
                color: '#a9aabc',
                fontSize: 12,
                interval: 0,
                padding: [10, 0, 0, 0]
            },
            axisLine: {
                show: true
            },
        },
        yAxis3D: {
            type: 'category',
            data: days,
            axisLabel: { //X轴文字样式
                color: '#a9aabc',
                fontSize: 12,
                interval: 0,
                padding: [10, 0, 0, 0]
            },
        },
        zAxis3D: {
            type: 'value',
            axisLabel: { //X轴文字样式
                color: '#a9aabc',
                fontSize: 12,
                interval: 0,
                padding: [10, 0, 0, 0]
            },
        },
        grid3D: {
            boxWidth: 200,
            boxDepth: 80,
            light: {
                main: {
                    intensity: 1.2
                },
                ambient: {
                    intensity: 0.3
                }
            }
        },
        series: [
            {
                type: 'bar3D',
                data: [[0,1,1]],
                shading: 'color',
                label: {
                    show: false,
                    fontSize: 16,
                    borderWidth: 1
                },
                itemStyle: {
                    opacity: 0.4
                },
                emphasis: {
                    label: {
                        fontSize: 20,
                        color: '#900'
                    },
                    itemStyle: {
                        color: '#900'
                    }
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
            _option.series[0].data = _chartsData.series || _chartsData.seriesAvg ; // 设置图表的数据
            _option.title.text = overwrite_option.unit; // 单位信息
            return _option;
        },
        cloneOption(_option){ return Object.assign({}, _option); },
        encodeChartData(resultData, filteData, dim, overwrite_option){ // 将当前的结果集数据，转换为图表数据
            // if(resultData.xAxisData) return resultData;
            let xAxisData=[], legendData=[], series=[], x = 1, z = 1;
            resultData.seriesAvg.map(value => {
                series.push([z++, x++, value]);
            });

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
