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
    var wd = window;
    wd.arn = wd.arn || {};
    arn.arnCfg = wd.arnCfg || wd.requireConfig || arn.arnCfg || {};
    arn.arnCfg.mask = arn.arnCfg.mask || {};  // 获取配置项
    arn.nav = arn.nav || {}; // 根据此对象判断require是否正常加载

    var config = arn.arnCfg = (function (o1, o2) {
            for (var o in o2) o1[o] = o2[o];
            return o1;
        })({
            AppBase: wd.AppBase || "",
            navScript: wd.navScript,
            baseURL: wd.baseURL,
            reqLibraries: wd.reqLibraries,
            reqPlugins: wd.reqPlugins,
            reqExtends: wd.reqExtends || [],
            navfn: typeof wd.navfn == 'undefined' ? true : wd.navfn,
            version: wd.versions || {},
            versionURL: wd.versionURL,
            useMask: typeof wd.useMask == 'undefined' ? false : wd.useMask,
            style: {
                ext: wd.extStyle || 'crisp' // aria/classic/crisp/gray/neptune/triton
            },
            loadInit: wd.loadInit,
            defaultLoadInit: wd.defaultLoadInit
        }, arn.arnCfg),
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
                ELEMENT: config.version.elementUI ||  config.version.ELEMENT || '2.15.0',
                bootstrapIcons: config.version.bootstrapIcons || '1.5.0',
                ext: config.version.ext || '6.0.0',
                d3: config.version.d3 || '3.5.14',
                eCharts: config.version.eCharts || '3.1.2',
                highCharts: config.version.highCharts || '4.1.5',
                moment: config.version.moment || '2.13.0',
                codemirror: config.version.codemirror || '5.50.0',
                pdfobject: config.version.pdfobject || '2.2.4',
            },
            style: {
                ext: config.style ? config.style.ext || 'triton' : 'triton'
            },
            loader: (wd.arn || {}).mask,
            getLoader: function (){
                var _this = this, rs = {};

                if(!_this.loader) {
                    // 加载loader插件
                    var head = document.getElementsByTagName('head')[0];
                    var script = document.createElement('script');
                    script.src = this.baseURL + 'Mask/mask.js';
                    head.appendChild(script);
                    script.onload = function (){
                        _this.loader = arn.mask;
                    }
                }

                rs.then = function (fuc){
                    var intFlag = setInterval(function (){
                        if(_this.loader) {
                            window.clearInterval(intFlag);
                            fuc(_this.loader);
                        }
                    }, 10);
                };

                return rs;
            },
            /**
             * 原生实现内容加载
             */
            loadMask: function (option) {
                this.getLoader().then((loader)=>loader.loadMask(option || { maskBgColorTheme: config.maskBgColorTheme || config.mask.maskBgColorTheme || '#ffffff' }));

                return true;
            },
            unMask: function () {
                this.getLoader().then((loader)=>loader.fadeOut(config.maskFadeTimeOut || config.mask.maskFadeTimeOut || 300));
            },
            getVersion: function (name, split) {
                for(var k in pathObj) {
                    if(pathObj[k].alias.indexOf(name) != -1) name = k;
                }

                var version =  this.versions[name];

                return version ? (split || '') + version : '1.1.1';
            },

            getResourcePath: function (li, file){
                var list=[];
                for(var i in li) {
                    list.push(li[i] + file);
                }

                console.log(list);
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
                    if (match)
                        return scriptSrc.substring(0, scriptSrc.length - match[0].length);
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
    if (config.useMask) me.loadMask(arn.arnCfg.mask)
    me.loadInit = config.loadInit || function (lib) {};
    me.defaultLoadInit = config.defaultLoadInit || function (lib) {
        /**
         * body禁用右键菜单
         */
        document.body.oncontextmenu = function (e) {
            e.preventDefault();
        };

        me.loadInit(lib);
    };

    // 如果现有已经注册了，则用已有的js，防止require和已有js冲突
    var pathObj = {
        "jQuery": { // path变量
            globalName: 'jQuery', // window的全局变量
            alias: ["jquery", "jQuery"] // path的别名
        },
        "moment": {
            globalName: 'Moment',
            alias: ["moment", "Moment"]},
        "vue": {
            globalName: 'Vue',
            alias: ["Vue", "vue"]},
        "ext": {
            globalName: 'Ext',
            alias: ["ext", "Ext"]},
        "d3": {
            globalName: 'D3',
            alias: ["d3","D3"]},
        "eCharts": {
            globalName: 'echarts',
            alias: ["eCharts", "echarts"]},
        "highCharts": {
            globalName: 'Highcharts',
            alias: ["highCharts","Highcharts"]},
        "codemirror": {
            globalName: 'Codemirror',
            alias: ["codemirror", "Codemirror"]},
        "pdfobject": {
            globalName: 'PDFObject',
            alias: ["pdfobject", "PDFObject"]},
        "ELEMENT": {
            globalName: 'ELEMENT',
            alias: ["elementUI", "ElementUI", "ELEMENT"]}
    };

    var paths = {
        requireCss: me.getResourcePath(['RequireJS/require-css-', 'https://s1.pstatp.com/cdn/expire-1-M/require-css/', 'https://cdn.bootcdn.net/ajax/libs/require-css/', ],
            me.getVersion('requireCss') + '/css' + (me.isDebug ? '' : '.min')),

        jQuery: me.getResourcePath(['https://s3.pstatp.com/cdn/expire-1-M/jquery/','https://cdn.bootcdn.net/ajax/libs/jquery/','JQuery/jquery-'],
            me.getVersion('jQuery') + '/jquery' + (me.isDebug ? '' : '.min')),

        jQuerySlide: me.getResourcePath(['https://s2.pstatp.com/cdn/expire-1-M/superslides/','https://cdn.bootcdn.net/ajax/libs/superslides/','jQuerySlide/'],
            me.getVersion('jQuerySlide') + '/jquery.superslides' + (me.isDebug ? '' : '.min')),

        moment: me.getResourcePath(['https://s1.pstatp.com/cdn/expire-1-M/moment.js/','https://cdn.bootcdn.net/ajax/libs/moment.js/','Moment/moment-'],
            me.getVersion('moment') + '/moment' + (me.isDebug ? '' : '.min')),

        bootstrap: me.getResourcePath(['https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/','Bootstrap/bootstrap-'],
            me.getVersion('bootstrap') + '/js/bootstrap' + (/^5/.test(me.getVersion('bootstrap')) ? '.bundle' : '') + (me.isDebug ? '' : '.min')),

        ELEMENT: me.getResourcePath(['https://s0.pstatp.com/cdn/expire-1-M/element-ui/', 'https://cdn.bootcdn.net/ajax/libs/element-ui/','ElementUI/element-ui-'],
            me.getVersion('ELEMENT') + '/index' + (me.isDebug ? '' : '.min')),

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

        pdfobject: me.getResourcePath(['https://cdn.bootcdn.net/ajax/libs/pdfobject/', 'https://s2.pstatp.com/cdn/expire-1-M/pdfobject/', 'PDFobject/pdfobject-'],
            me.getVersion('pdfobject') + '/pdfobject' + (me.isDebug ? '' : '.min')), // 编码插件

        navfn: ['nav.fn' + (me.isDebug ? '' : '.min')], // 拓展插件
        arn: me.baseURL // arn库的根路径
    };

    (function (pathObj) {
        for(var key in pathObj) {
            let cfg = pathObj[key], o = window[cfg.globalName];
            for(var i in cfg.alias) {
                paths[cfg.alias[i]] = paths[key]; // 增加别名
                if(o) define(cfg.alias[i], [], function() { return o; }); // 如果有全局变量，则拿缓存
            }
        }
    })(pathObj);

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
        paths: paths,
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
            ELEMENT: {
                deps: ['vue'].concat(
                    me.getResourcePath(
                        [
                            'css!https://s0.pstatp.com/cdn/expire-1-M/element-ui/',
                            'css!https://cdn.bootcdn.net/ajax/libs/element-ui/',
                            'css!/arn/ElementUI/element-ui-'
                        ], me.getVersion('ELEMENT') + '/theme-chalk/index' + (me.isDebug ? '' : '.min')
                    )
                )
            },
            bootstrap: {
                deps: ['jQuery'].concat(
                    me.getResourcePath([
                        'css!https://cdn.bootcdn.net/ajax/libs/twitter-bootstrap/',
                        'css!/arn/Bootstrap/bootstrap-'
                    ], me.getVersion('bootstrap') + '/css/bootstrap' + (me.isDebug ? '' : '.min')
                    ).concat(
                        /^5/.test(me.getVersion('bootstrap')) ?
                            me.getResourcePath([
                                'css!https://cdn.bootcdn.net/ajax/libs/bootstrap-icons/',
                                'css!/arn/Bootstrap-icons/'
                            ], me.getVersion('bootstrapIcons') + '/font/bootstrap-icons' + (me.isDebug ? '' : '')) :
                            []
                    )
                )
            },
            ext: {
                deps: me.getResourcePath(['css!https://s2.pstatp.com/cdn/expire-1-M/extjs/', 'css!https://cdn.bootcdn.net/ajax/libs/extjs/', 'css!/arn/Sencha/ext-'],
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
                exports: 'Codemirror',
                deps: me.getResourcePath(['css!https://s2.pstatp.com/cdn/expire-1-M/codemirror/', 'css!/arn/Codemirror/codemirror-'],
                    me.getVersion('codemirror') + '/codemirror' + (me.isDebug ? '' : '.min')) // 编码插件
            }
        }
    });

    /**
     * 加载动态库
     * 'jQuery', 'ext', 'd3', 'eCharts', 'highCharts', 'moment', 'vue', 'codemirror'
     */
    require(config.reqLibraries || [], function () {
        for(var i in config.reqLibraries) {
            me.library[config.reqLibraries[i]] = arguments[i];
        }

        if (config.useMask && !config.notAllowClose) me.unMask();

        me.defaultLoadInit(me.library);

        console.info('加载动态库完成 (load library done.)');
        console.info(arguments);
    });

    /**
     * 加载插件库 ['bootstrap', 'extLocal', 'highCharts3d', 'jQuerySlide']
     */
    require(config.reqPlugins || [], function () {
        console.info('加载插件库完成 (load plugin done.)');
    });

    /**
     * 加载扩展库
     */
    if(config.navfn) config.reqExtends.push('navfn');

    require(config.reqExtends, function () {
        console.info('加载扩展库完成 (load fn done.)');
    });

    console.info(wd.arn.nav = me, wd.ailbb = wd.arn);
})();
