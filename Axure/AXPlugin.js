
    window.AXPlugin = { fastmockid: ''};

    AXPlugin.Vue = function(option){
        var transOption = function(vo){
            vo.el = $(vo.el).children()[0];
            AXPlugin.fastmockid = vo.fastmockid;
            for(key in vo.data) {
                var parent = $(`[title="${key}"]`);
                console.log(`[title="${key}"]`);
                var el = parent.find('input');
                if(!el.length) {
                    el = parent.find('span');
                    el.attr('v-text', key);
                } else {
                    el.attr('v-model', key);
                }
            }
            return vo;
        };
        new Vue(transOption(option));
    };
    AXPlugin.fastmock = function(url, prop){
        var data = {};
        $.ajax({
            url: `https://www.fastmock.site/mock/${AXPlugin.fastmockid}${url}`,
            async: false,
            type: "GET",
            success: function(_data){ data = _data; }
        });
        return data[prop] || "";
    };


javascript:
    setTimeout(function(){
        new AXPlugin.Vue({
            el: 'body',
            fastmockid: "f7ceb802376fe7cc06e9c96caed1ca8f",
            data: {
                X: 1,
                o: '*',
                Y: 2,
                result: "",
                projecttitle: "",
                projectinfo: ""
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
                    this.projectinfo = AXPlugin.fastmock('/axure-test/project-information', 'info');
                }
            },
            mounted(){
                this.doeval();
            }
        });
    },500);