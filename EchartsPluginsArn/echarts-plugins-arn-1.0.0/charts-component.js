// 逐行----
define(['eCharts','moment'], function (echarts,moment){
    // 组件的配置


    // 组件的核心功能
    let component =  {
        vm: {},
        myChart: {  },
        getOption(overwrite_option, _chartsData){ return overwrite_option; },
        draw(el, overwrite_option) { // 绘图
            let _this = this;
            if(!this.myChart[el]) {
                this.myChart[el] = echarts.init($(el)[0], 'dark');
                window.onresize = function (){
                    _this.myChart[el].resize();
                }
            }
            this.myChart[el].setOption(this.getOption(overwrite_option)); // 绘图
            this.myChart[el].resize();
            return this;
        },
        resize() { if(!this.myChart) return ; this.myChart.resize(); }, // 响应式插件
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
