// 逐行----
define(['eCharts','moment'], function (echarts,moment){
    // 组件的配置
    let option = {
        backgroundColor: '',
        title: {
            text: '数量/个',
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
        xAxis: {
            show: true,
            type: 'category',
            data: ['Mon', 'Tue', 'Wed']
        },
        yAxis: {
            show: true
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
                data: [120, 200, 150, 80, 70, 110, 130],
                name: '',
                type: 'bar', //设置类型为象形柱状图
                // symbol: 'roundRect', //图形类型，带圆角的矩形
                // barWidth: 40, //柱图宽度
                // barMaxWidth: '30%', //最大宽度
                // symbolMargin: '1', //图形垂直间隔

                itemStyle: {
                    normal: {
                        color: '#ff0000'
                    }
                },
                // lineStyle: {
                //     color: '#007eeb'
                // },
                // label: {
                //     show: true, //开启显示
                //     position: 'top', //在上方显示
                //     textStyle: { //数值样式
                //         color: '#00FFC4',
                //         fontSize: 16
                //     }
                // },
                z: 1,
                // symbolRepeat: true, //图形是否重复
                // symbolSize: [40, 6], //图形元素的尺寸
                // animationEasing: 'elasticOut' //动画效果
            }
        ]
    };

    // 组件的核心功能
    let component =  {
        vm: {},
        myChart: {},
        getOption(_chartsData, overwrite_option){
            let _option = this.cloneOption(option);
            _option.series[0].data = _chartsData.series; // 设置图表的数据
            _option.xAxis.data = _chartsData.xAxisData; // 设置图表的x轴
            return _option;
        },
        cloneOption(_option){ return Object.assign({}, _option); },
        encodeChartData(resultData, filteData, dim, overwrite_option){ // 将当前的结果集数据，转换为图表数据
            if(resultData.xAxisData) return resultData;

            let xAxisData=[], legendData=[], series=[], i=0;

            return {xAxisData, legendData, series};
        },
        draw(el, resultData, filteData, dim, overwrite_option) { // 绘图
            let _this = this;4

            function autoZoom(){
                var zoom = parseFloat(getComputedStyle(document.querySelector('.auto-zoom')).getPropertyValue('zoom')), _el = $(el)[0], canvas = $(el)[0].childNodes[0].childNodes[0];
                $(canvas).width(parseInt(1/zoom*_el.clientWidth) + 'px')
                $(canvas).height(parseInt(1/zoom*_el.clientHeight)+ 'px');
                $(canvas).css('transformOrigin', '0 0');
                $(canvas).css('transform', `scale(${zoom})`);
            }

            if(!this.myChart[el]) {
                this.myChart[el] = echarts.init($(el)[0], 'dark');
                window.addEventListener('resize', function (){
                    autoZoom();
                    _this.myChart[el].resize();
                });
            }
            this.myChart[el].setOption(this.getOption(this.encodeChartData(resultData, filteData, dim, overwrite_option), overwrite_option),true); // 绘图
            autoZoom();
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
