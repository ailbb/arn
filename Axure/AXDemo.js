// javascript:
$axure.utils.loadJS("https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/jquery/3.6.0/jquery.min.js");
$axure.utils.loadJS("https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-M/vue/2.6.14/vue.min.js");
$axure.utils.loadJS("https://raw.githubusercontent.com/ailbb/arn/master/Axure/AXPlugin.js");


// javascript:
setTimeout(function(){
    new AXPlugin.Vue({
        el: 'body',
        prodUrl: 'http://192.168.5.128:8081/',
        fastmockId: "2fcd232ee87a6fa0d5a37888fd5f7e6e",
        data: {
            X: 1,
            o: '*',
            Y: 2,
            result: "",
            projecttitle: "",
        },
        watch: {
            X() { this.doeval(); },
            o() { this.doeval(); },
            Y() { this.doeval(); }
        },
        methods: {
            doeval(){
                this.result = eval(this.X+this.o+this.Y);
                this.projecttitle = AXPlugin.fastmock('/brd-cloud/ecs/getInstances', 'data');
                console.log(this.projecttitle);
            }
        },
        mounted(){
            this.doeval();
        }
    });
},500);