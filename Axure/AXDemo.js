// javascript:
$axure.utils.loadJS("https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/jquery/3.6.0/jquery.min.js");
$axure.utils.loadJS("https://lf6-cdn-tos.bytecdntp.com/cdn/expire-1-M/vue/2.6.14/vue.min.js");
$axure.utils.loadJS("https://raw.githubusercontent.com/ailbb/arn/master/Axure/AXPlugin.js");


setTimeout(function(){
    new AXPlugin.Vue({
        el: 'body',
        prodUrl: '',
        fastmockId: "f7ceb802376fe7cc06e9c96caed1ca8f",
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
                this.projecttitle = AXPlugin.fastmock('/axure-test/project-information', 'title');
            }
        },
        mounted(){
            this.doeval();
        }
    });
},500);