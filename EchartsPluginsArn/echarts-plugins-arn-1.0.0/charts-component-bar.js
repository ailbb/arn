// 逐行----
define(['eCharts','moment'], function (echarts,moment){
    // 组件的配置
    let option = {
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
            let _this = this, _option = this.cloneOption(option);
            if(_chartsData.constructor == Object) {
                _option.series[0].name = _chartsData.name || ""; // 设置图表的数据

                if(typeof _chartsData.series[0] == "number")
                    _option.series[0].data = _chartsData.seriesData || _chartsData.series; // 设置图表的数据
                else
                    _option.series = _chartsData.series;

                _option.xAxis.data = _chartsData.xAxisData; // 设置图表的x轴
            } else {
                _option.xAxis.data = _chartsData[0].xAxisData;
                _option.series = _chartsData.map((r,i)=>{
                    return r.series && (typeof r.series[0] == "number") ? {
                        data: r.series,
                        name: r.name,
                        type: 'bar',
                        itemStyle: {
                            normal: {
                                color: _option.colorPicker[i]
                            }
                        }
                    }: r.series;
                })
            }
            return _option;
        },
        cloneOption(_option){ return Object.assign({}, _option); },
        encodeChartData(resultData, filteData, dim, overwrite_option){ // 将当前的结果集数据，转换为图表数据
            if(resultData.xAxisData) return resultData;

            return resultData.map(r=> {
                    return {
                        name: r.name || "",
                        xAxisData: r.xAxisData || r.seriesData.map(c=>c.x),
                        series: r.series || r.seriesData.map(c=>c.y),
                    }
                });
        },
        draw(el, resultData, filteData, dim, overwrite_option) { // 绘图
            let _this = this;4

            function autoZoom(){
                var zoom = 1, _el = $(el)[0], canvas = $(el)[0].childNodes[0].childNodes[0];
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
        },
        getDemoData(){
            var list = [];
            for(var j=0;j<4;j++) { // 2个图例
                list.push({
                    name: "图例"+(j+1),
                    seriesData: [],
                });
                for(var i=7;i--;) {
                    list[j].seriesData.push({
                        x: moment().subtract(i, 'day').format('MM/DD'),
                        y: Math.round(Math.random()*100)
                    });
                }
            }

            let d1 = {
                legendData: ["图例1","图例2","图例3","图例4","图例5","图例6","图例7"],
                xAxisData: ["8/21","8/22","8/23","8/24","8/25","8/26","8/27",],
                series:  [120, 200, 150, 80, 70, 110, 130],
            };
            console.info("DemoData-1:\n"+JSON.stringify(d1));
            // return d1;

            console.info("DemoData-2:\n"+JSON.stringify(list));
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
