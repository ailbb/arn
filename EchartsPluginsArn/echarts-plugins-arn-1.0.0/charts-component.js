// 逐行----
define(['eCharts','moment'], function (echarts,moment){
    // 组件的配置


    // 组件的核心功能
    let component =  {
        vm: {},
        myChart: {  },
        getOption(overwrite_option){ return overwrite_option; },
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
        getDemoData(){
            var list = {
                colorPicker: ['#d7e5f3','#0c6fc6','#0db765','#e1ba43',
                    '#e14343','#ac43e1','#ffe925','#ff25a8'
                    ,'#25ff7c','#967200','#0d692b','#3b3314'],
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
                    data: ['Sun', 'Mon', 'Tue', 'Wed', 'Thr', 'Fir', 'Sat']
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

            console.info("DemoData-1:\n"+JSON.stringify(list));
            return list;
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
        formatRowData: component.formatRowData,
        getDemoData: component.getDemoData
    };
});
