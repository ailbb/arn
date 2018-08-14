/**
 * Created by Wz on 2017/6/26.
 */
define(['jQuery'], function ($) {

    /**
     * 重载load方法
     * @param url
     * @param params
     * @param callback
     * @returns {*}
     */
    $.fn.loadHtml = function( url, params, callback ) {
        if ( typeof url !== "string" && _load ) {
            return _load.apply( this, arguments );
        }

        var selector, type, response,
            self = this,
            off = url.indexOf(" ");

        if ( off >= 0 ) {
            selector = jQuery.trim( url.slice( off ) );
            url = url.slice( 0, off );
        }

        // If it's a function
        if ( jQuery.isFunction( params ) ) {

            // We assume that it's the callback
            callback = params;
            params = undefined;

            // Otherwise, build a param string
        } else if ( params && typeof params === "object" ) {
            type = "POST";
        }

        // If we have elements to modify, make the request
        if ( self.length > 0 ) {
            $.ajax({
                url: url,

                // if "type" variable is undefined, then "GET" method will be used
                type: type,
                dataType: "html",
                data: params
            }).done(function( responseText ) {

                // Save response for use in complete callback
                response = arguments;
                self.html( selector ?

                    // If a selector was specified, locate the right elements in a dummy div
                    // Exclude scripts to avoid IE 'Permission Denied' errors
                    jQuery("<div>").append( jQuery.parseHTML( responseText ) ).find( selector ) :

                    // Otherwise use the full result
                    $.initHtml().purifyHtml(responseText));
            }).complete( callback && function( jqXHR, status ) {
                    self.each( callback, response || [ jqXHR.responseText, status, jqXHR ] );
                });
        }

        return this;
    };

    /**
     * 扩展form取值方法
     * @returns {{}}
     */
    $.fn.serializeObject = function () {
        var list = this.serializeArray(), obj = {};
        for(var li in list) obj[list[li].name] = list[li].value;
        return obj;
    };

    /**
     * 添加hover样式
     * @param e
     * @returns {*|jQuery}
     */
    $.fn.hoverIn = function (e) {
        return $(this).addClass("hover");
    };

    /**
     * 移除hover样式
     * @param e
     * @returns {*|jQuery}
     */
    $.fn.hoverOut = function (e) {
        return $(this).removeClass("hover");
    };

    /**
     * 向上移动几个节点
     * @param e
     * @returns {*|jQuery}
     */
    $.fn.prevTo = function (v) {
        var _this = $(this);
        for(var i=parseInt(v); i--;) {
            if(0 == _this.prev().length) break;
            _this = _this.prev();
        }
        return _this;
    };

    /**
     * 向下移动几个节点
     * @param e
     * @returns {*|jQuery}
     */
    $.fn.nextTo = function (v) {
        var _this = $(this);
        for(var i=parseInt(v); i--;) {
            if(0 == _this.next().length) break;
            _this = _this.next();
        }
        return _this;
    };

    /**
     * 扩展form取值方法
     * @returns {{}}
     */
    $.extend({
        searchObject: function (str) {
            var list = (str || location.search).replace("?", "").split("&"), obj = {};
            for(var li in list) {
                var s = list[li].split("=");
                if(s.length) {
                    obj[s[0]] = s.length > 1 ? s[1] : "";
                }
            }
            return obj;
        },
        initHtml: function () {
            $('base').remove();
            $('[rel="icon"]').remove();
            $('body').html('');
            return $;
        },
        // 净化html内容
        purifyHtml: function (responseText) {
            return responseText.replace(/<(link|script).*(ext|bootstrap).*>/g, "");
        },
        assign: function (o1, o2) {
            for (var o in o2) o1[o] = o2[o];
            return o1;
        },
      //增加全局调用后台日志方法
        addLogs:function(moduleId,operation,params){
    		$.post(AppBase+"/ShareControl/addlog",{
    			moduleId:moduleId,
    			operation:operation,
    			params:params
    		},function(){});
    	}
    });

});