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
        }

        var dataType="html";

        if(~url.indexOf("?")) {
            dataType = url.substring(0, url.indexOf("?"));
            dataType = dataType.substring(dataType.lastIndexOf(".") + 1, dataType.length);
        } else {
            dataType = url.substring(url.lastIndexOf(".") + 1, url.length);
        }

        // If we have elements to modify, make the request
        if ( self.length > 0 ) {
            if( dataType.toLowerCase() == "js" ) {
                require([url], function (js) {
                    if(typeof js == 'function') js(params);
                    if(typeof js == 'object' && js.init) js.init(params);
                });
            } else {
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
                        $.initHtml().purifyHtml(responseText)
                    );
                }).complete( callback && function( jqXHR, status ) {
                    self.each( callback, response || [ jqXHR.responseText, status, jqXHR ] );
                });
            }
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
        parse: function (str) {
            return typeof str == 'string' ? JSON.parse(str) : str;
        },
        trans1024: function (value) { // 值为Byte
            var v = parseFloat(value || "0");

            if(v === 0) {
                v = '-';
            } else if (!v) {
                v = '-';
            } else if(v > 1024*1024*1024*1024) {
                v = parseFloat((v/1024/1024/1024/1024).toFixed(2)) + " TB";
            } else if(v > 1024*1024*1024) {
                v = parseFloat((v/1024/1024/1024).toFixed(2)) + " GB";
            } else if(v > 1024*1024) {
                v = parseFloat((v/1024/1024).toFixed(2)) + " MB";
            } else if(v > 1*1024) {
                v = parseFloat((v/1024).toFixed(2)) + " KB";
            } else if(v > 1) {
                v = parseFloat((v).toFixed(2)) + " Byte";
            }

            return v;
        },
        trans1024MB: function (value) { // 值为MB
            var v = parseFloat(value || "0");

            if(v === 0) {
                v = '-';
            } else if (!v) {
                v = '-';
            } else if(v > 1024*1024) {
                v = parseFloat((v/1024/1024).toFixed(2)) + " TB";
            } else if(v > 1024) {
                v = parseFloat((v/1024).toFixed(2)) + " GB";
            } else if(v > 1) {
                v = parseFloat((v).toFixed(2)) + " MB";
            } else {
                v = parseFloat((v*1024).toFixed(2)) + " KB";
            }

            return v;
        },
        trans1000: function (value) { //
            var v = parseFloat(value || "0");

            if(v === 0) {
                v = '-';
            } else if (!v) {
                v = '-';
            } else if(v > 1000*1000*1000) {
                v = parseFloat((v/1000/1000/1000).toFixed(2)) + " 亿VCore";
            } else if(v > 1000*1000) {
                v = parseFloat((v/1000/1000).toFixed(2)) + " 十万VCore";
            } else if(v > 1000) {
                v = parseFloat((v/1000).toFixed(2)) + " 千VCore";
            } else if(v > 1) {
                v = parseFloat((v).toFixed(2)) + " VCore";
            }

            return v;
        },
        transferRatio: function(value) {
            if(!value) return '0 %';
            return (value * 100).toFixed(2) + ' %';
        }
    });

});