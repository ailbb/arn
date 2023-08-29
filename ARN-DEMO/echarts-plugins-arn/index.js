// 逐行----
define(['jQuery', 'vue', 'moment', 'eCharts', 'echartsPluginsArn'], function ($, Vue, moment,echarts, epa) {

   var app = Vue.createApp({
      data: function () {
         return {
            charts: [
               { title: "组件图表", id: '1' },
               { title: "组件图表", id: '2' },
               { title: "组件图表", id: '3' },
               { title: "组件图表", id: '4' },
               { title: "组件图表", id: '5' },
               { title: "组件图表", id: '6' },
               { title: "组件图表", id: '7' },
               { title: "组件图表", id: '8' },
               { title: "组件图表", id: '9' },
               { title: "组件图表", id: '10' },
               { title: "组件图表", id: '11' },
               { title: "组件图表", id: '12' },
               { title: "组件图表", id: '13' },
               { title: "组件图表", id: '14' }
            ]
         }
      },
      mounted() {
         this.drawCharts(this.charts);
      },
      methods: {
         drawCharts(chartObjs){
            for(var key in chartObjs){
               var list = []; for(var i=48;i--;) list.push({x: new Date((new Date().getTime() - i*60*60*1000)), y: Math.random()*100});
               epa.drawLine("#chart-id-"+chartObjs[key].id, [list], null, 1, {}, false);
            }
         }
      }
   });
   app.mount('.container');
});
