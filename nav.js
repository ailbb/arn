/**
 * Created by ailbb on 3/14/2016.
 * 本功能用于requirejs按需导入内容需要的lib包
 */

;~(function () {
    // 如果dom没有初始化完成,则进行等待
    if (document.readyState != "complete") {
        return window.addEventListener('load', arguments.callee);
    }

    /**
     * 接收参数：
     * @navScript:'' 动态库的nav文件
     * @baseURL:'' 动态库根路径
     * @reqLibraries:[] 需要请求的动态库
     * @reqPlugins:[] 需要请求的插件
     *
     * @queryString: 获取链接参数
     * @baseURL: 动态库库根路径
     * @isDebug: debug标志
     * @versions: 动态库文件版本号
     * @getVersion: 获取版本信息
     * @getBaseUrl: 获取动态库库根路径
     */
    var wd = window,
        config = (function (o1, o2) {
            for (var o in o2) o1[o] = o2[o];
            return o1;
        })({
            AppBase: wd.AppBase || "",
            navScript: wd.navScript,
            baseURL: wd.baseURL,
            reqLibraries: wd.reqLibraries,
            reqPlugins: wd.reqPlugins,
            reqExtends: wd.reqExtends || [],
            version: wd.versions || {},
            versionURL: wd.versionURL,
            useMask: typeof wd.useMask == 'undefined' ? false : wd.useMask,
            style: {
                ext: wd.extStyle || 'crisp' // aria/classic/crisp/gray/neptune/triton
            },
            loadInit: wd.loadInit,
            defaultLoadInit: wd.defaultLoadInit
        }, wd.requireConfig || {}),
        me = {
            queryString: wd.location.search,
            baseURL: '',
            versionURL: config.versionURL,
            isDebug: false,
            library: {},
            versions: {
                requireCss: config.version.requireCss || '0.1.9',
                jQuery: config.version.jQuery || '2.1.1',
                jQuerySlide: config.version.jQuerySlide || '0.6.2',
                vue: config.version.vue || '2.6.10',
                bootstrap: config.version.bootstrap || '3.3.5',
                ext: config.version.ext || '6.0.0',
                d3: config.version.d3 || '3.5.14',
                eCharts: config.version.eCharts || '3.1.2',
                highCharts: config.version.highCharts || '4.1.5',
                moment: config.version.moment || '2.13.0',
                codemirror: config.version.codemirror || '5.50.0'
            },
            style: {
                ext: config.style ? config.style.ext || 'triton' : 'triton'
            },
            /**
             * 原生实现内容加载
             */
            loadMask: function () {
                var head = document.getElementsByTagName('head')[0];
                var link = document.createElement('link');
                link.href = this.baseURL + 'Mask/css/mask.css';
                link.rel = 'stylesheet';
                link.type = 'text/css';
                head.appendChild(link);

                var mask = document.createElement('div');
                var maskSun = document.createElement('div');
                mask.id = "mask";
                mask.setAttribute('class', 'mask');
                maskSun.setAttribute('class', 'masksun');
                mask.appendChild(maskSun);
                document.body.appendChild(mask);
                return true;
            },
            unMask: function () {
                $('.mask').fadeOut(500).remove();
            },
            getVersion: function (name, split) {
                var versions = this.versions,
                    version = versions[name];
                return version ? (split || '') + version : versions;
            },

            getResourcePath: function (li, file){
                var list=[];
                for(var i in li) {
                    list.push(li[i] + file);
                }
                return list;
            },

            getBaseUrl: function (script) {
                var thiz = this,
                    scripts = document.getElementsByTagName('script'),
                    navScript = script || config.navScript || 'nav.min',
                    scriptRegexNoDebug = new RegExp(navScript.replace(/\.js$/, '') + '\.js$'),
                    scriptRegexDebug = new RegExp(navScript.replace(/(\.min\.js$)|(\.min$)|(\.js$)/g, '') + '\.js$');
                for (var i = scripts.length; i--;) {
                    var scriptSrc = scripts[i].src,
                        match = scriptSrc.match(scriptRegexNoDebug) || scriptSrc.match(scriptRegexDebug);
                    if (match) return scriptSrc.substring(0, scriptSrc.length - match[0].length);
                }
                return script || '';
            },
            getXmlHttpRequest: function () {
                if (wd.ActiveXObject) {
                    return new ActiveXObject("Microsoft.XMLHTTP");
                } else if (wd.XMLHttpRequest) {
                    return new XMLHttpRequest();
                }
            },
            ajaxReadState: function (xmlHttp) {
                if (xmlHttp.readyState == 4) {
                    if (xmlHttp.status == 200) {
                        try {
                            var da = JSON.parse(xmlHttp.responseText);
                            return "v=" + da.version;
                        } catch (e) {
                            return xmlHttp.responseText;
                        }
                    } else {
                        return '';
                    }
                }
            },
            ajaxGet: function (url, bol) {
                var _this = this;
                var xmlHttp = this.getXmlHttpRequest();
                xmlHttp.open("GET", url + "?t=" + new Date().getTime(), bol);
                xmlHttp.send();
                if (bol) {
                    xmlHttp.onreadystatechange = _this.ajaxReadState;
                } else {
                    while (true) {
                        return _this.ajaxReadState(xmlHttp);
                    }
                }
            },
            getAppVersion: function () {
                var _this = this;
                return _this.ajaxGet((_this.versionURL || _this.baseURL + "version.json") + "?" + new Date().getTime(), false) || "";
            }
        };

    me.isDebug = me.queryString.match('(\\?|&)debug') !== null ? true : false; // 获取debug信息
    me.baseURL = config.baseURL || me.getBaseUrl(); // 获取动态库基础路径
    if (config.useMask) me.loadMask();
    me.loadInit = config.loadInit || function (lib) {};
    me.defaultLoadInit = config.defaultLoadInit || function (lib) {
        /**
         * body禁用右键菜单
         */
        $(document.body).on('contextmenu', function (e) {
            e.preventDefault();
        });

        me.loadInit(lib);
    };

    /**
     * 加载配置
     * @baseUrl: 根路径
     * @paths: 需要加载包的路径（相对于根路径）
     * @map: 告诉RequireJS在任何模块之前，都先载入这个模块，这样别的模块依赖于css!../style/1.css这样的模块都知道怎么处理了
     * @shim : { // 依赖引用配置
     *  *: { // 引用对象
     *      deps: [''], // 所需要的依赖（css!path 表示调用require-css插件加载css文件）
     *      exports: '' // 需要返回的模块对象
     *    }
     * }
     */
    require.config({
        baseUrl: me.baseURL,
        urlArgs: me.getAppVersion(),
        paths: {
            requireCss: me.getResourcePath(['RequireJS/require-css-', 'https://s1.pstatp.com/cdn/expire-1-M/require-css/', 'https://cdn.bootcdn.net/ajax/libs/require-css/', ],
                me.getVersion('requireCss') + '/css' + (me.isDebug ? '' : '.min')),

            jQuery: me.getResourcePath(['https://s3.pstatp.com/cdn/expire-1-M/jquery/','https://cdn.bootcdn.net/ajax/libs/jquery/','JQuery/jquery-'],
                me.getVersion('jQuery') + '/jquery' + (me.isDebug ? '' : '.min')),

            jQuerySlide: me.getResourcePath(['https://s2.pstatp.com/cdn/expire-1-M/superslides/','https://cdn.bootcdn.net/ajax/libs/superslides/','jQuerySlide/'],
                me.getVersion('jQuerySlide') + '/jquery.superslides' + (me.isDebug ? '' : '.min')),

            moment: me.getResourcePath(['https://s1.pstatp.com/cdn/expire-1-M/moment.js/','https://cdn.bootcdn.net/ajax/libs/moment.js/','Moment/moment-'],
                me.getVersion('moment') + '/moment' + (me.isDebug ? '' : '.min')),

            bootstrap: me.getResourcePath(['https://s0.pstatp.com/cdn/expire-1-M/twitter-bootstrap/', 'https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/','Bootstrap/bootstrap-'],
                me.getVersion('bootstrap') + '/js/bootstrap' + (me.isDebug ? '' : '.min')),

            vue: me.getResourcePath(['https://s3.pstatp.com/cdn/expire-1-M/vue/','https://cdn.bootcdn.net/ajax/libs/vue/','Vue/vue-'],
                me.getVersion('vue') + '/vue' + (me.isDebug ? '' : '.min')),

            ext: me.getResourcePath(['https://s2.pstatp.com/cdn/expire-1-M/extjs/', 'https://cdn.bootcdn.net/ajax/libs/extjs/', 'Sencha/ext-'],
                me.getVersion('ext') + '/ext-all' + (me.isDebug ? '-debug' : '')),

            extLocal: me.getResourcePath(['https://s2.pstatp.com/cdn/expire-1-M/extjs/', 'https://cdn.bootcdn.net/ajax/libs/extjs/', 'Sencha/ext-'],
                me.getVersion('ext') + '/classic/locale/locale-zh_CN' + (me.isDebug ? '-debug' : '')),

            d3: me.getResourcePath(['https://s2.pstatp.com/cdn/expire-1-M/d3/', 'https://cdn.bootcdn.net/ajax/libs/d3/', 'D3/d3-'],
                me.getVersion('d3') + '/d3' + (me.isDebug ? '' : '.min')),

            eCharts: me.getResourcePath(['https://s2.pstatp.com/cdn/expire-1-M/echarts/', 'https://cdn.bootcdn.net/ajax/libs/echarts/', 'Echarts/echarts-'],
                me.getVersion('eCharts') + '/echarts' + (me.isDebug ? '' : '.min')),

            highCharts: me.getResourcePath(['https://s3.pstatp.com/cdn/expire-1-M/highcharts/', 'https://cdn.bootcdn.net/ajax/libs/highcharts/', 'Highcharts/highcharts-'],
                me.getVersion('highCharts') + '/highcharts' + (me.isDebug ? '.src' : '')),

            highCharts3d: me.getResourcePath(['https://s3.pstatp.com/cdn/expire-1-M/highcharts/', 'https://cdn.bootcdn.net/ajax/libs/highcharts/', 'Highcharts/highcharts-'],
                me.getVersion('highCharts') + '/highcharts-3d' + (me.isDebug ? '.src' : '')),

            codemirror: me.getResourcePath(['https://cdn.bootcdn.net/ajax/libs/codemirror/', 'https://s2.pstatp.com/cdn/expire-1-M/codemirror/', 'Codemirror/codemirror-'],
                me.getVersion('codemirror') + '/codemirror' + (me.isDebug ? '' : '.min')), // 编码插件

            navfn: ['nav.fn' + (me.isDebug ? '' : '.min')] // 拓展插件
        },
        waitSeconds: 600,
        map: {
            '*': {
                'css': 'requireCss'
            }
        },
        shim: {
            jQuery: {
                exports: '$',
                init: function init(e) {}
            },
            jQuerySlide: {
                deps: ['jQuery']
            },
            bootstrap: {
                deps: ['jQuery'].concat(me.getResourcePath(['css!https://s0.pstatp.com/cdn/expire-1-M/twitter-bootstrap/', 'css!https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/','css!Bootstrap/bootstrap-'],
                    me.getVersion('bootstrap') + '/css/bootstrap' + (me.isDebug ? '' : '.min')))
            },
            ext: {
                deps: me.getResourcePath(['css!https://s2.pstatp.com/cdn/expire-1-M/extjs/', 'css!https://cdn.bootcdn.net/ajax/libs/extjs/', 'css!Sencha/ext-'],
                    me.getVersion('ext') + '/classic/theme-' + me.style.ext + '/resources/theme-' + me.style.ext + '-all' + (me.isDebug ? '-debug' : '')),

                exports: 'Ext'
            },
            extLocal: {
                deps: ['ext']
            },
            d3: { exports: 'd3' },
            eCharts: { exports: 'echarts' },
            highCharts: {
                deps: ['jQuery'],
                exports: 'Highcharts'
            },
            highCharts3d: {
                deps: ['highCharts']
            },
            codemirror: {
                deps: me.getResourcePath(['css!https://cdn.bootcdn.net/ajax/libs/codemirror/', 'css!https://s2.pstatp.com/cdn/expire-1-M/codemirror/', 'css!Codemirror/codemirror-'],
                    me.getVersion('codemirror') + '/codemirror' + (me.isDebug ? '' : '.min')) // 编码插件
            }
        }
    });

    /**
     * 加载动态库
     */
    require(config.reqLibraries || ['jQuery', 'ext', 'd3', 'eCharts', 'highCharts', 'moment', 'vue', 'codemirror'], function ($, Ext, d3, echarts, Highcharts, moment, vue, codemirror) {
        me.library.jQuery = me.library.$ = $;
        me.library.Ext = Ext;
        me.library.d3 = d3;
        me.library.echarts = echarts;
        me.library.Highcharts = Highcharts;
        me.library.moment = moment;
        me.library.vue = vue;
        me.library.vue = vue;
        me.library.codemirror = codemirror;

        if (config.useMask) me.unMask();

        me.defaultLoadInit(me.library);

        console.info('加载动态库完成 (load library done.)');
        console.info(arguments);
    });

    /**
     * 加载插件库 ['bootstrap', 'extLocal', 'highCharts3d', 'jQuerySlide']
     */
    require(config.reqPlugins || ['extLocal'], function () {
        console.info('加载插件库完成 (load plugin done.)');
    });

    /**
     * 加载扩展库
     */
    require(['navfn'].concat(config.reqExtends), function () {
        console.info('加载扩展库完成 (load fn done.)');
    });

    console.info(wd.ailbb = me);
})();