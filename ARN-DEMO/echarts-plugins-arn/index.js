// 逐行----
define(['jQuery', 'vue', 'moment', 'eCharts', 'echartsPluginsArn'], function ($, Vue, moment,echarts, epa) {

   var app = Vue.createApp({
      data: function () {
         return {
            charts: Array.from({length: 30}, (v, k) => {
               return { title: "组件图表", id: k };
            })
         }
      },
      mounted() {
         this.drawCharts(this.charts);
      },
      methods: {
         drawCharts(chartObjs){
            chartObjs.forEach(r=>{
               let i = Math.round(Math.random()*5);

               switch(i){
                  case 0:
                     epa.draw("#chart-id-"+r.id, epa.chartCommon.getDemoData(), null, 1, {}, false);
                     break;
                  case 1:
                     epa.drawBar("#chart-id-"+r.id, epa.chartBar.getDemoData(), null, 1, {}, false);
                     break;
                  case 2:
                     epa.drawLine("#chart-id-"+r.id, epa.chartLine.getDemoData(), null, 1, {}, false);
                     break;
                  case 3:
                     epa.drawLineTotal("#chart-id-"+r.id, epa.chartLineTotal.getDemoData(), null, 1, {}, false);
                     break;
                  case 4:
                     epa.drawPie("#chart-id-"+r.id, epa.chartPie.getDemoData(), null, 1, {}, false);
                     break;
                  case 5:
                     epa.draw3dBar("#chart-id-"+r.id, epa.chart3dBar.getDemoData(), null, 1, {}, false);
                     break;
               }
            });
         }
      }
   });
   app.mount('.container');
});
