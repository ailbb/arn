/**
 * copy for https://github.com/lukehaas/css-loaders
 */
(function (){
    var wd = window,
        arn = wd.arn || {},
        currentPath = document.currentScript.src.substr(0, document.currentScript.src.lastIndexOf('/'));
    arn.arnCfg = wd.arnCfg || wd.requireConfig || arn.arnCfg || {};
    arn.arnCfg.mask = arn.arnCfg.mask || {}; // 获取配置项

    var arnMask = arn.mask || {
        maskType: 'css', // css和gif两种方式
        maskLoading: false,
        autoClose: false,
        maskCls: 'arn',
        // 主题色系：深蓝 rgb(30,96,145) + 黄绿 rgb(167,200,68)
        maskBgColorTheme: '#ffffff00',
        maskLdColorTheme: 'rgb(30, 96, 145)',     // 主色 - 深蓝
        maskLdColorTheme2: 'rgb(167, 200, 68)',   // 辅助色 - 黄绿
        maskFadeTimeOut: 240,                      // 淡出时长 ms
        maskMinDisplayTime: 200,                   // 最短显示时间，避免短任务闪烁
        _maskShownAt: 0,
        onResize: function (){ arnMask.maskType == "css" ? arnMask.css.onResize() : arnMask.gif.onResize(); },
        loadMask: function (option){ arnMask.maskType == "css" ? arnMask.css.loadMask(option) : arnMask.gif.loadMask(option); return this; },
        unMask: function (){ arnMask.maskType == "css" ? arnMask.css.unMask() : arnMask.gif.unMask(); return (window.onresize = null, this); },
        getMaskElement: function (){ return document.querySelector('.arn-loader'); },
        getBaseUrl: function(){ return currentPath; },
        getCls: function (maskCls, maskLdColorTheme){
            if(maskCls == 'arn') {
                var c2 = arnMask.maskLdColorTheme2 || maskLdColorTheme;
                return `<style>
                .${maskCls} .loader > i:nth-child(1),
                .${maskCls} .loader > i:nth-child(3){ background: ${maskLdColorTheme}; }
                .${maskCls} .loader > i:nth-child(2),
                .${maskCls} .loader > i:nth-child(4){ background: ${c2}; }
                </style>`;
            }
            if(maskCls == 'load1') {
                var c2 = arnMask.maskLdColorTheme2 || maskLdColorTheme;
                return `<style>
                .${maskCls} .loader, .${maskCls} .loader:after{ background: ${maskLdColorTheme}!important; }
                .${maskCls} .loader:before{ background: ${c2}!important; }
                </style>`;
            }
            return '';
        },
        // 返回 loader 内部子元素 HTML（arn 需要 4 个 <i>；其他 loader 留空，靠伪元素）
        getLoaderInnerHTML: function (maskCls){
            if(maskCls == 'arn') return '<i></i><i></i><i></i><i></i>';
            return '';
        },
        // 用 CSS transition 替代 setInterval，GPU 加速更顺滑、更短
        fadeOut: function (maskElement, t){
            if(arnMask._maskFading) return;
            if(typeof maskElement == 'number') t = maskElement;
            if(!maskElement || t == maskElement) maskElement = this.getMaskElement();
            if(!maskElement) return ;

            // 最短显示时间保护：避免极短任务造成的闪现
            var elapsed = Date.now() - (arnMask._maskShownAt || 0);
            var minTime = arnMask.maskMinDisplayTime || 0;
            if(elapsed < minTime) {
                setTimeout(function(){ arnMask.fadeOut(maskElement, t); }, minTime - elapsed);
                return;
            }

            arnMask._maskFading = true;
            var duration = t || arnMask.maskFadeTimeOut || 240;
            // 一次性 transition，结束就移除 DOM
            maskElement.style.transition = 'opacity ' + duration + 'ms cubic-bezier(0.22, 0.61, 0.36, 1)';
            void maskElement.offsetWidth; // 强制 reflow，确保 transition 生效
            maskElement.style.opacity = '0';

            setTimeout(function (){
                if(maskElement.parentNode) maskElement.remove();
                arnMask.maskLoading = false;
                arnMask._maskFading = false;
            }, duration);
        },
        domIsReady: () => document.readyState == "complete",
        checkNav: function (){
            // window load 后兜底检查，800ms 内 arn.nav 没起来就主动撤掉遮罩
            // （FrameHeader 路径下会在 Vue 挂载后主动 unMask，正常不会走到这里）
            var fire = function (){
                setTimeout(function (){
                    if(arnMask.maskLoading && (!arn.nav || Object.keys(arn.nav).length == 0)) arnMask.unMask();
                }, 800);
            };
            if(document.readyState == 'complete') fire();
            else window.addEventListener('load', fire);
        },
        css: {
            onResize: function (option){
                option = Object.assign({}, arnMask, option||{});

                var maskElement = document.querySelector('.arn-loader');

                if(!maskElement) return ;

                var boxHeight = 240, boxMarginTop=50, loaderPaddingTop=window.innerHeight/2-boxHeight/2;
                maskElement.style.width = window.innerWidth + 'px';
                maskElement.style.height = window.innerHeight + 'px';
                maskElement.style.backgroundColor = option.maskBgColorTheme;
                maskElement.style.position = 'fixed';
                maskElement.style.top = 0;
                maskElement.style.left = 0;
                maskElement.style.zIndex = 77777;
                maskElement.style.paddingTop = loaderPaddingTop + 'px';
            },
            loadMask: function (option){
                if(arnMask.maskLoading) return ;

                option = Object.assign({}, arnMask, option||{});

                var head = document.getElementsByTagName('head')[0],
                    linkHref = `${option.getBaseUrl()}/css-loading/${option.maskCls}.css`,
                    linkElement = `<link href="${linkHref}" rel=stylesheet type="text/css" />`,
                    maskElement = `<div id="loading-Boxer-Unity" class="${option.maskCls} arn-loader"><div class="loader">${arnMask.getLoaderInnerHTML(option.maskCls)}</div></div>`,
                    styleElement = arnMask.getCls(option.maskCls, option.maskLdColorTheme),
                    _this = this
                ;
                if(arnMask.domIsReady() || document.body) {
                    var linkzzzzzz = document.createElement('link');
                    linkzzzzzz.href = linkHref;
                    linkzzzzzz.type = 'text/css';
                    linkzzzzzz.rel = 'stylesheet';
                    head.appendChild(linkzzzzzz);
                    var maskEl = document.createElement('div');
                    maskEl.className = option.maskCls + " arn-loader";

                    var maskChildEl = document.createElement('div');
                    maskChildEl.className = "loader";
                    if(option.maskCls == "arn") {
                        // Win10 风格：loader 内塞 4 个 <i>，布局和动画交给 arn.css
                        for(var k = 0; k < 4; k++) maskChildEl.appendChild(document.createElement('i'));
                    }
                    // maskChildEl.style.color = option.maskLdColorTheme;
                    // 解决遮罩动画缺少伪元素下半截的问题
                    var styleEl = document.createElement('style');
                    if(option.maskCls == "arn"){
                        // 对角线同色：1/3 主色，2/4 辅色，符合 Win10 logo 视觉
                        var _c2w = option.maskLdColorTheme2 || option.maskLdColorTheme;
                        styleEl.textContent = `
                             .${option.maskCls}{will-change:opacity;}
                             .${option.maskCls} .loader > i:nth-child(1),
                             .${option.maskCls} .loader > i:nth-child(3){ background: ${option.maskLdColorTheme}; }
                             .${option.maskCls} .loader > i:nth-child(2),
                             .${option.maskCls} .loader > i:nth-child(4){ background: ${_c2w}; }
                        `;
                    }else if(option.maskCls == "load1"){
                        // 三段跳动块采用 蓝-绿-蓝 渐变：中间 loader 主色、左伪元素辅色、右伪元素主色
                        var _c2 = option.maskLdColorTheme2 || option.maskLdColorTheme;
                        styleEl.textContent = `
                             .${option.maskCls} .loader, .${option.maskCls} .loader:after{background: ${option.maskLdColorTheme}!important;}
                             .${option.maskCls} .loader:before{background: ${_c2}!important;}
                             .${option.maskCls} .loader{color:${option.maskLdColorTheme}!important;}
                             .${option.maskCls}{will-change:opacity;}
                        `;
                    }else if(option.maskCls == "load2"){
                        styleEl.textContent = `
                             .${option.maskCls} .loader, .${option.maskCls} .loader:before, .${option.maskCls} .loader:after{background:  ${option.maskBgColorTheme}!important;}
                             .${option.maskCls} .loader{color:${option.maskLdColorTheme}!important;}
                        `;
                    }else if(option.maskCls == "load3"){
                        styleEl.textContent = `
                             .${option.maskCls} .loader:before, .${option.maskCls} .loader:after{background: ${option.maskBgColorTheme}!important;}
                             .${option.maskCls} .loader{background:linear-gradient(to right, ${option.maskLdColorTheme} 10%, rgba(255, 255, 255, 0) 42%)!important;}
                        `;
                    }else if(option.maskCls == "load8"){
                        styleEl.textContent = `
                            .${option.maskCls} .loader{border-left:1.1em solid ${option.maskLdColorTheme}!important;}

                        `;
                    }else{
                        styleEl.textContent = `
                            .${option.maskCls} .loader{color:${option.maskLdColorTheme}!important;}

                        `;
                    }


                    maskEl.appendChild(maskChildEl);
                    head.appendChild(styleEl);
                    document.body.appendChild(maskEl);
                    // if 分支也注册兜底，防止外部忘了调用 unMask 导致 mask 卡死
                    arnMask.checkNav();
                } else {
                    document.write(linkElement);
                    document.write(styleElement);
                    document.write(maskElement);
                    if(option.autoClose) arnMask.fadeOut(document.querySelector('.arn-loader'));
                    arnMask.checkNav();
                }

                window.onresize = function (){ _this.onResize(option); };

                _this.onResize(option);

                arnMask._maskShownAt = Date.now();
                arnMask.maskLoading = true;
            },
            unMask: function (){
                if(!arnMask.maskLoading) return ;

                var maskElement = document.querySelector('.arn-loader');

                // 走 fadeOut 让关闭也有自然过渡，而不是瞬间消失
                if(maskElement) arnMask.fadeOut(maskElement);

                window.onresize = null;
            }
        },
        gif: {
            loadMask: function (option) {
                if(arnMask.maskLoading) return ;

                option = Object.assign({}, option||{}, arnMask);

                var head = document.getElementsByTagName('head')[0];
                var link = document.createElement('link');
                link.href = arnMask.getBaseUrl() + '/css/mask.css';
                link.rel = 'stylesheet';
                link.type = 'text/css';
                head.appendChild(link);

                var mask = document.createElement('div');
                var maskSun = document.createElement('div');
                mask.setAttribute('class', 'mask arn-loader');
                maskSun.setAttribute('class', 'masksun');
                mask.appendChild(maskSun);

                if(arnMask.domIsReady()) {
                    document.body.appendChild(mask);
                } else {
                    document.write(mask.outerHTML);
                    document.querySelector('.masksun').style.backgroundImage = `url(${arnMask.getBaseUrl()}/resource/gif/${option.maskCls}.gif)`;
                    if(option.autoClose) arnMask.fadeOut(document.querySelector('.arn-loader'));
                }
                arnMask.maskLoading = true;
                return true;
            },
            unMask: function () {
                if(!arnMask.maskLoading) return ;

                var maskElement = document.querySelector('.arn-loader');

                if(maskElement) maskElement.remove();

                window.onresize = null;

                arnMask.maskLoading = false;
            },
        }
    };

    for(var am in arn.arnCfg.mask) arnMask[am] = arn.arnCfg.mask[am]; // 将mask的配置赋值到arnmask

    if(arn.arnCfg.useMask || typeof arn.arnCfg.useMask == 'undefined') {
        arnMask.loadMask({ maskBgColorTheme: arn.arnCfg.mask.maskBgColorTheme || '#ffffff' });
    }

    arn.loadMask = arnMask.loadMask;
    arn.unMask = arnMask.unMask;

    return (arn.mask = arnMask, wd.arn = arn); // 加载遮罩
})();