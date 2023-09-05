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
    arn.$AFPath = wd.$AFPath = wd.$AFPath || arn.$AFPath ||
        ((r, ds) => {
            for(var p of ds) if(r.exec(p)) return p.substring(0, r.exec(p).index - 1);
            return "";
        }) (
            /public|arn|views|module/, (() => {
                var li = [(document.currentScript || {}).src || location.href];
                for(ds of document.scripts) { li.push(ds.src); };
                return li;
            })()
        ) || "";

    var config = arn.arnCfg = (function (o1, o2) {
            for (var o in o2) o1[o] = o2[o];
            return o1;
        })({
            $AFPath: arn.$AFPath,
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
            // cfg - 1
            versions: {
                // Update Time 2023-09-04
                requireCss: config.version.requireCss || '0.1.10',
                jQuery: config.version.jQuery || '3.7.1',
                jQuerySlide: config.version.jQuerySlide || '0.6.2',
                vue: ~arn.arnCfg.reqLibraries.indexOf('ELEMENTPLUS') ?
                    ( (!config.version.vue || /^2/.test(config.version.vue)) ? '3.2.47' : config.version.vue) :
                    ( (!config.version.vue) ?  '3.2.47' : config.version.vue),
                bootstrap: config.version.bootstrap || '5.3.1',
                ELEMENT: config.version.elementUI ||  config.version.ELEMENT || '2.15.13',
                ELEMENTPLUS: config.version.elementPlus ||  config.version.ELEMENTPLUS || '2.3.3',
                bootstrapIcons: config.version.bootstrapIcons || '1.10.0',
                mdbUiKit: config.version.mdbUiKit || '6.4.1',
                fontAwesome: config.version.fontAwesome || '6.4.0',
                ext: config.version.ext || '6.2.0',
                d3: config.version.d3 || '7.8.4',
                eCharts: config.version.eCharts || '5.4.2',
                highCharts: config.version.highCharts || '10.3.3',
                echartsPluginsArn: config.version.echartsPluginsArn || '1.0.0',
                moment: config.version.moment || '2.29.4',
                codemirror: config.version.codemirror || '6.65.7',
                pdfobject: config.version.pdfobject || '2.2.8'
            },
            // cfg - 2
            RequestLink: {
                CDN: {
                    requireCss: ['https://s1.pstatp.com/cdn/expire-1-M/require-css/', 'https://cdn.bootcdn.net/ajax/libs/require-css/'],
                    jQuery: ['https://s3.pstatp.com/cdn/expire-1-M/jquery/','https://cdn.bootcdn.net/ajax/libs/jquery/'],
                    jQuerySlide: ['https://s2.pstatp.com/cdn/expire-1-M/superslides/','https://cdn.bootcdn.net/ajax/libs/superslides/'],
                    moment: ['https://s1.pstatp.com/cdn/expire-1-M/moment.js/','https://cdn.bootcdn.net/ajax/libs/moment.js/'],
                    bootstrap: ['https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/twitter-bootstrap/'],
                    ELEMENT: ['https://s0.pstatp.com/cdn/expire-1-M/element-ui/', 'https://cdn.bootcdn.net/ajax/libs/element-ui/'],
                    ELEMENTPLUS: ['https://s0.pstatp.com/cdn/expire-1-M/element-plus/', 'https://cdn.bootcdn.net/ajax/libs/element-plus/'],
                    vueSource: ['https://s3.pstatp.com/cdn/expire-1-M/vue/','https://cdn.bootcdn.net/ajax/libs/vue/'],
                    ext: ['https://s2.pstatp.com/cdn/expire-1-M/extjs/', 'https://cdn.bootcdn.net/ajax/libs/extjs/'],
                    extLocal: ['https://s2.pstatp.com/cdn/expire-1-M/extjs/', 'https://cdn.bootcdn.net/ajax/libs/extjs/'],
                    d3: ['https://s2.pstatp.com/cdn/expire-1-M/d3/', 'https://cdn.bootcdn.net/ajax/libs/d3/'],
                    eCharts: ['https://s2.pstatp.com/cdn/expire-1-M/echarts/', 'https://cdn.bootcdn.net/ajax/libs/echarts/'],
                    highCharts: ['https://s3.pstatp.com/cdn/expire-1-M/highcharts/', 'https://cdn.bootcdn.net/ajax/libs/highcharts/'],
                    highCharts3d: ['https://s3.pstatp.com/cdn/expire-1-M/highcharts/', 'https://cdn.bootcdn.net/ajax/libs/highcharts/'],
                    codemirror: ['https://cdn.bootcdn.net/ajax/libs/codemirror/', 'https://s2.pstatp.com/cdn/expire-1-M/codemirror/'],
                    pdfobject: ['https://cdn.bootcdn.net/ajax/libs/pdfobject/', 'https://s2.pstatp.com/cdn/expire-1-M/pdfobject/'],
                    bootstrapIcons: ['https://cdn.bootcdn.net/ajax/libs/bootstrap-icons/'],
                    mdbUiKit: ['https://cdn.bootcdn.net/ajax/libs/mdb-ui-kit/'],
                    fontAwesome: ['https://cdn.bootcdn.net/ajax/libs/font-awesome/']
                },
                LAN: {
                    requireCss: ['/arn/RequireJS/require-css-'],
                    jQuery: ['/arn/JQuery/jquery-'],
                    jQuerySlide: ['/arn/jQuerySlide/'],
                    moment: ['/arn/Moment/moment-'],
                    bootstrap: ['/arn/Bootstrap/bootstrap-'],
                    ELEMENT: ['/arn/ElementUI/element-ui-'],
                    ELEMENTPLUS: ['/arn/ElementPlus/element-plus-'],
                    vueSource: ['/arn/Vue/vue-'],
                    ext: ['/arn/Sencha/ext-'],
                    extLocal: ['/arn/Sencha/ext-'],
                    d3: ['/arn/D3/d3-'],
                    eCharts: ['/arn/Echarts/echarts-'],
                    highCharts: ['/arn/Highcharts/highcharts-'],
                    highCharts3d: ['/arn/Highcharts/highcharts-'],
                    codemirror: ['/arn/Codemirror/codemirror-'],
                    pdfobject: ['/arn/PDFobject/pdfobject-'],
                    bootstrapIcons: ['/arn/Bootstrap-icons/'],
                    mdbUiKit: ['/arn/mdbUiKit/mdbuikit-'],
                    fontAwesome: ['/arn/FontAwesome/font-awesome-'],
                    echartsPluginsArn: ['/arn/echartsPluginsArn/echarts-plugins-arn-']
                }
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

            getRequestLinks: function(name, type){
                var li = [], CDNList = [], LANList = this.RequestLink.LAN[name];

                if(me.CDN && !me.LAN) { // 如果是cdn模式，且不是局域网模式，则开启CDN
                    CDNList = this.RequestLink.CDN[name];
                }

                return CDNList.concat(LANList.map(r => arn.arnCfg.$AFPath + r)).map(r=> (type || '') + r);
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

    // config.reqLibraries = config.reqLibraries.map(n=> (!n.endsWith(".js") || n.includes("/")) ? n : (location.href.substring(0, location.href.lastIndexOf("/")+1)+n));

    // 后读取链接
    me.CDN = me.queryString.match('(\\?|&)cdn') !== null || arn.arnCfg.CDN;
    me.LAN = !me.CDN;

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

    // cfg - 3
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
            alias: ["elementUI", "ElementUI", "ELEMENT"]},
        "ELEMENTPLUS": {
            globalName: 'ELEMENTPLUS',
            alias: ["elementPlus", "ElementPlus", "ELEMENTPLUS"]}
    };

    // cfg - 4
    // 封装请求路径
    var paths = {
        requireCss: me.getResourcePath(me.getRequestLinks('requireCss'), me.getVersion('requireCss') + '/css' + (me.isDebug ? '' : '.min')),
        jQuery: me.getResourcePath(me.getRequestLinks('jQuery'), me.getVersion('jQuery') + '/jquery' + (me.isDebug ? '' : '.min')),
        jQuerySlide: me.getResourcePath(me.getRequestLinks('jQuerySlide'), me.getVersion('jQuerySlide') + '/jquery.superslides' + (me.isDebug ? '' : '.min')),
        moment: me.getResourcePath(me.getRequestLinks('moment'), me.getVersion('moment') + '/moment' + (me.isDebug ? '' : '.min')),
        bootstrap: me.getResourcePath(me.getRequestLinks('bootstrap'), me.getVersion('bootstrap') + '/js/bootstrap' + (/^5/.test(me.getVersion('bootstrap')) ? '.bundle' : '') + (me.isDebug ? '' : '.min')),
        mdbUiKit: me.getResourcePath(me.getRequestLinks('mdbUiKit'), me.getVersion('mdbUiKit') + '/js/mdb' + (me.isDebug ? '' : '.min')),
        fontAwesome: me.getResourcePath(me.getRequestLinks('fontAwesome'), me.getVersion('fontAwesome') + '/js/all' + (me.isDebug ? '' : '.min')),
        echartsPluginsArn: me.getResourcePath(me.getRequestLinks('echartsPluginsArn'), me.getVersion('echartsPluginsArn') + '/all' + (me.isDebug ? '' : '.min')),
        ELEMENT: me.getResourcePath(me.getRequestLinks('ELEMENT'),  me.getVersion('ELEMENT') + '/index' + (me.isDebug ? '' : '.min')),
        ELEMENTPLUS: me.getResourcePath(me.getRequestLinks('ELEMENTPLUS'), me.getVersion('ELEMENTPLUS') + '/index.full' + (me.isDebug ? '' : '.min')),
        vueSource: me.getResourcePath(me.getRequestLinks('vueSource'), me.getVersion('vue') + '/vue' +  (/^3/.test(me.getVersion('vue')) ? '.global' : '')  + (me.isDebug ? '' : '.min')),
        ext: me.getResourcePath(me.getRequestLinks('ext'), me.getVersion('ext') + '/ext-all' + (me.isDebug ? '-debug' : '')),
        extLocal: me.getResourcePath(me.getRequestLinks('extLocal'),  me.getVersion('ext') + '/classic/locale/locale-zh_CN' + (me.isDebug ? '-debug' : '')),
        d3: me.getResourcePath(me.getRequestLinks('d3'), me.getVersion('d3') + '/d3' + (me.isDebug ? '' : '.min')),
        eCharts: me.getResourcePath(me.getRequestLinks('eCharts'),  me.getVersion('eCharts') + '/echarts' + (me.isDebug ? '' : '.min')),
        highCharts: me.getResourcePath(me.getRequestLinks('highCharts'), me.getVersion('highCharts') + '/highcharts' + (me.isDebug ? '.src' : '')),
        highCharts3d: me.getResourcePath(me.getRequestLinks('highCharts3d'), me.getVersion('highCharts') + '/highcharts-3d' + (me.isDebug ? '.src' : '')),
        codemirror: me.getResourcePath(me.getRequestLinks('codemirror'), me.getVersion('codemirror') + '/codemirror' + (me.isDebug ? '' : '.min')), // 编码插件
        pdfobject: me.getResourcePath(me.getRequestLinks('pdfobject'),  me.getVersion('pdfobject') + '/pdfobject' + (me.isDebug ? '' : '.min')), // 编码插件
        vue:  'Vue/vue-transfer',
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


    // cfg - 5
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
        waitSeconds: 30,
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
                        me.getRequestLinks('ELEMENT', 'css!'),
                        me.getVersion('ELEMENT') + '/theme-chalk/index' + (me.isDebug ? '' : '.min')
                    )
                )
            },
            ELEMENTPLUS: {
                deps: ['vue'].concat(
                    me.getResourcePath(
                        me.getRequestLinks('ELEMENTPLUS', 'css!'),
                        me.getVersion('ELEMENTPLUS') + '/index' + (me.isDebug ? '' : '.min')
                    )
                )
            },
            bootstrap: {
                deps: ['jQuery'].concat(
                    me.getResourcePath(
                        me.getRequestLinks('bootstrap', 'css!'),
                        me.getVersion('bootstrap') + '/css/bootstrap' + (me.isDebug ? '' : '.min')
                    ).concat(
                        /^5/.test(me.getVersion('bootstrap')) ?
                            me.getResourcePath(
                                me.getRequestLinks('bootstrapIcons', 'css!'),
                                me.getVersion('bootstrapIcons') + '/font/bootstrap-icons' + (me.isDebug ? '' : '')) :
                            []
                    )
                )
            },
            mdbUiKit: {
                deps: ['fontAwesome'].concat(
                    me.getResourcePath(
                        me.getRequestLinks('mdbUiKit', 'css!'),
                        me.getVersion('mdbUiKit') + '/css/mdb' + (me.isDebug ? '' : '.min')
                    )
                )
            },
            fontAwesome: {
                deps: me.getResourcePath(
                    me.getRequestLinks('fontAwesome', 'css!'),
                    me.getVersion('fontAwesome') + '/css/all' + (me.isDebug ? '' : '.min')
                )
            },
            echartsPluginsArn: {
                deps: ['eCharts'],
                exports: 'epa'
            },
            ext: {
                deps: me.getResourcePath(
                    me.getRequestLinks('ext', 'css!'),
                    me.getVersion('ext') + '/classic/theme-' + me.style.ext + '/resources/theme-' + me.style.ext + '-all' + (me.isDebug ? '-debug' : '')),

                exports: 'Ext'
            },
            extLocal: {
                deps: ['ext']
            },
            d3: { exports: 'd3' },
            eCharts: { exports: 'echarts' },
            highCharts: {
                deps: ['jQuery'].concat(
                    me.getResourcePath(
                        me.getRequestLinks('highCharts', 'css!'),
                        me.getVersion('highCharts') + '/highcharts' + (me.isDebug ? '' : '.min'))
                ), // 编码插件
                exports: 'Highcharts'
            },
            highCharts3d: {
                deps: ['highCharts']
            },
            codemirror: {
                exports: 'Codemirror',
                deps: me.getResourcePath(
                    me.getRequestLinks('codemirror', 'css!'),
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
