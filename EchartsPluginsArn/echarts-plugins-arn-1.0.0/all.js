// 逐行----
var baseSrc = document.currentScript.src.substring(0, document.currentScript.src.indexOf("all."));
define(['eCharts','moment',
    baseSrc+"charts-component.js",
    baseSrc+"charts-component-3dbar.js",
    baseSrc+"charts-component-4dbar.js",
    baseSrc+"charts-component-bar.js",
    baseSrc+"charts-component-line.js",
    baseSrc+"charts-component-line-total.js",
    baseSrc+"charts-component-pie.js"
], function (echarts,moment,
             chartCommon,
             chart3dBar,
             chart4dBar,
             chartBar,
             chartLine,
             chartLineTotal,
             chartPie
){
    // 组件的配置


    // 组件的核心功能
    let component =  {
        chartCommon: chartCommon,
        chart3dBar: chart3dBar,
        chart4dBar: chart4dBar,
        chartBar: chartBar,
        chartLine: chartLine,
        chartLineTotal: chartLineTotal,
        chartPie: chartPie,

        vm: {},
        myChart: {  },
        getOption(overwrite_option, _chartsData){ return overwrite_option; },
        draw(el, overwrite_option) { // 绘图
            var c = this.chartCommon.draw(...arguments);
            this.vm = c.vm || this.vm;
            this.myChart = c.myChart || this.myChart;
            this.getOption = c.getOption || this.getOption;
            this.resize = c.resize || this.resize;
            return c;
        },
        draw3dBar(el, overwrite_option) { // 绘图
            var c = this.chart3dBar.draw(...arguments);
            this.vm = c.vm || this.vm;
            this.myChart = c.myChart || this.myChart;
            this.getOption = c.getOption || this.getOption;
            this.resize = c.resize || this.resize;
            return c;
        },
        draw4dBar(el, overwrite_option) { // 绘图
            var c = this.chart4dBar.draw(...arguments);
            this.vm = c.vm || this.vm;
            this.myChart = c.myChart || this.myChart;
            this.getOption = c.getOption || this.getOption;
            this.resize = c.resize || this.resize;
            return c;
        },
        drawBar(el, overwrite_option) { // 绘图
            var c = this.chartBar.draw(...arguments);
            this.vm = c.vm || this.vm;
            this.myChart = c.myChart || this.myChart;
            this.getOption = c.getOption || this.getOption;
            this.resize = c.resize || this.resize;
            return c;
        },
        drawLine(el, overwrite_option) { // 绘图
            var c = this.chartLine.draw(...arguments);
            this.vm = c.vm || this.vm;
            this.myChart = c.myChart || this.myChart;
            this.getOption = c.getOption || this.getOption;
            this.resize = c.resize || this.resize;
            return c;
        },
        drawLineTotal(el, overwrite_option) { // 绘图
            var c = this.chartLineTotal.draw(...arguments);
            this.vm = c.vm || this.vm;
            this.myChart = c.myChart || this.myChart;
            this.getOption = c.getOption || this.getOption;
            this.resize = c.resize || this.resize;
            return c;
        },
        drawPie(el, overwrite_option) { // 绘图
            var c = this.chartPie.draw(...arguments);
            this.vm = c.vm || this.vm;
            this.myChart = c.myChart || this.myChart;
            this.getOption = c.getOption || this.getOption;
            this.resize = c.resize || this.resize;
            return c;
        },
        resize() { if(!this.myChart) return ; this.myChart.resize(); }, // 响应式插件
    };

    // 对外暴露组件的方法
    return component;
});
