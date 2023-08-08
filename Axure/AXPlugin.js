window.AXPlugin = { el: '#axplugin', elv: '', fastmockId: '', prod: false, prodUrl: '', fastmockUrl: `https://www.fastmock.site/mock/`};

AXPlugin.Vue = function(option){
    var transOption = function(vo){
        let pel = $(vo.el || AXPlugin.el);

        vo.el = pel.children()[0];

        AXPlugin.fastmockId = vo.fastmockId;
        AXPlugin.prod = vo.prod; // 生产环境配置
        AXPlugin.prodUrl = vo.prodUrl; // 生产环境URL
        AXPlugin.fastmockUrl = vo.fastmockUrl ? vo.fastmockUrl : AXPlugin.fastmockUrl; // fastmock环境URL

        for(key in vo.data) {
            var parent = AXPlugin.fid(key);
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
    AXPlugin.elv = new Vue(transOption(option));
};

AXPlugin.fid = function (key){ return $(`[title="${key}"]`); }

AXPlugin.fastmock = function(url, key){
    var data = {};
    $.ajax({
        url: `${AXPlugin.prod ? AXPlugin.prodUrl : AXPlugin.fastmockUrl}${AXPlugin.fastmockId}${url}`,
        async: false,
        type: "GET",
        success: function(_data){ data = _data; }
    });
    return data[key] || "";
};
