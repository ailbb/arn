// 逐行----
define(['eCharts','moment'], function (echarts,moment){
    // 组件的配置
    let option = {
        tooltip: {
            trigger: 'item'
        },
        legend: {
            show: false,
            top: '5%',
            left: 'center'
        },
        backgroundColor:'',
        // backgroundColor: '#FFF00',
        series: [
            {
                name: '通用图形库',
                type: 'pie',
                radius: ['60%', '85%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 0,
                    borderColor: '#fff00',
                    borderWidth: 0
                },
                label: {
                    show: false,
                    position: 'center'
                },
                emphasis: {
                    label: {
                        show: false,
                        fontSize: '40',
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: false
                },
                data: [
                    { value: 60, name: '未使用',  itemStyle: { color: '#d7e5f3' } },
                    { value: 40, name: '已使用',  itemStyle: { color: '#0c6fc6' } }
                ]
            }
        ]
    };

    // 组件的核心功能
    let component =  {
        vm: {},
        myChart: {  },
        getOption(overwrite_option, _chartsData){
            let _option = this.cloneOption(option);
            _option.series[0].name = overwrite_option.title; // 设置图表的legend
            _option.series[0].data[1].value = ((_chartsData+0)*100).toFixed(2)+0; // 设置图表的x轴
            _option.series[0].data[0].value = ((1 - _chartsData)*100).toFixed(2)+0; // 设置图表的x轴
            if(_option.series[0].data[1].value > 30) _option.series[0].data[1].itemStyle.color = '#0db765';
            if(_option.series[0].data[1].value > 70) _option.series[0].data[1].itemStyle.color = '#e1ba43';
            return _option;
        },
        cloneOption(_option){ return Object.assign({}, _option); },
        encodeChartData(resultData, filteData){ // 将当前的结果集数据，转换为图表数据
            return resultData;
        },
        draw(el, resultData, filteData, overwrite_option) { // 绘图
            let _this = this;
            if(!this.myChart[el]) {
                this.myChart[el] = echarts.init($(el)[0], 'dark');
                window.onresize = function (){
                    _this.myChart[el].resize();
                }
            }
            this.myChart[el].setOption(this.getOption(overwrite_option, this.encodeChartData(resultData, filteData)),true); // 绘图
            return this;
        },
        resize() { if(!this.myChart) return ; this.myChart.resize(); }, // 响应式插件
        formatRowData(data){ return Object.values(data).map(v=>parseFloat(v.toFixed(2))); } // 数据保留2个小数点
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
