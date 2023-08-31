// 逐行----
define(['eCharts','moment'], function (echarts,moment){
    // 组件的配置
    let option = {
        colorPicker: ['#d7e5f3','#0c6fc6','#0db765','#e1ba43',
            '#e14343','#ac43e1','#ffe925','#ff25a8'
            ,'#25ff7c','#967200','#0d692b','#3b3314'],
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
            _option.series[0].name = overwrite_option.title || _option.series[0].name; // 设置图表的legend

            if(typeof _chartsData == "number") {
                _option.series[0].data[1].value = ((_chartsData+0)*100).toFixed(2)+0; // 设置图表的x轴
                _option.series[0].data[0].value = ((1 - _chartsData)*100).toFixed(2)+0; // 设置图表的x轴
                if(_option.series[0].data[1].value > 30) _option.series[0].data[1].itemStyle.color = '#0db765';
                if(_option.series[0].data[1].value > 70) _option.series[0].data[1].itemStyle.color = '#e1ba43';
            } else {
                let surplus = 100;
                _option.series[0].data = _chartsData.map((r,i)=>{
                    surplus -= r.value;
                    return i!=_chartsData.length-1 ?
                        { value: r.value, name: r.name, itemStyle: { color: _option.colorPicker[i+1] }} :
                        { value: surplus, name: "其他", itemStyle: { color: _option.colorPicker[0] }};
                })
            }

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
        formatRowData(data){ return Object.values(data).map(v=>parseFloat(v.toFixed(2))); }, // 数据保留2个小数点
        getDemoData(){
            var list = [], max=90;
            for(var i=0;i<10;i++) { // 2个图例
                var r = Math.random()*max;
                list.push({
                    name: "图例"+(i+1),
                    value: (max -= r,r)
                });
            }
            console.info("DemoData-1:\n"+JSON.stringify(list));

            console.info("DemoData-2:\n0.5");
            // return 0.5; // 百分比

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
