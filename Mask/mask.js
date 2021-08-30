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
        maskCls: 'load1',
        // maskBgColorTheme: '#0dc5c1', // 默认加载背景颜色
        // maskLdColorTheme: '#FFFFFF', // 默认加载前面logo颜色
        maskBgColorTheme: '#ffffff00',
        maskLdColorTheme: 'rgb(221 75 57)',
        onResize: function (){ arnMask.maskType == "css" ? arnMask.css.onResize() : arnMask.gif.onResize(); },
        loadMask: function (option){ arnMask.maskType == "css" ? arnMask.css.loadMask(option) : arnMask.gif.loadMask(option); return this; },
        unMask: function (){ arnMask.maskType == "css" ? arnMask.css.unMask() : arnMask.gif.unMask(); return (window.onresize = null, this); },
        getMaskElement: function (){ return document.querySelector('.arn-loader'); },
        getBaseUrl: function(){ return currentPath; },
        getCls: function (maskCls, maskLdColorTheme){
            if(maskCls == 'load1') return `<style>
                .${maskCls} .loader, .${maskCls} .loader:before, .${maskCls} .loader:after{
                    background: ${maskLdColorTheme}!important;
                }

                .loader:after{
                    background: ${maskLdColorTheme}!important;
                }
            </style>`;

            return '';
        },
        fadeOut: function (maskElement, t){

            if(typeof maskElement == 'number') t = maskElement;

            if(!maskElement || t == maskElement) maskElement = this.getMaskElement();

            if(!maskElement) return ;

            var i = 1, domMaskCheck = setInterval(function (){
                if(document.readyState != "complete") return ;

                if((i -= 0.1) <= 0) {
                    window.clearInterval(domMaskCheck);
                    maskElement.remove();
                    arnMask.maskLoading = false;
                }
                maskElement.style.opacity = i;
            },t ? t/10 : 30);
        },
        domIsReady: () => document.readyState == "complete",
        checkNav: function (){
            window.addEventListener('load', function (){
                setTimeout(function (){
                    // 延迟1500s检查arn.nav框架是否正常加载，不正常加载则自动取消遮罩
                    if(!arn.nav || Object.keys(arn.nav).length == 0) arnMask.unMask();
                }, 1500);
            });
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
                    maskElement = `<div id="loading-Boxer-Unity" class="${option.maskCls} arn-loader"><div class="loader" ></div></div>`,
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
                    // maskChildEl.style.color = option.maskLdColorTheme;
                    // 解决遮罩动画缺少伪元素下半截的问题
                    var styleEl = document.createElement('style');
                    if(option.maskCls == "load1"){
                        styleEl.textContent = ` 
                             .${option.maskCls} .loader, .${option.maskCls} .loader:before, .${option.maskCls} .loader:after{background: ${option.maskLdColorTheme}!important;}
                             .${option.maskCls} .loader{color:${option.maskLdColorTheme}!important;}
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
                } else {
                    document.write(linkElement);
                    document.write(styleElement);
                    document.write(maskElement);
                    if(option.autoClose) arnMask.fadeOut(document.querySelector('.arn-loader'));
                    arnMask.checkNav();
                }

                window.onresize = function (){ _this.onResize(option); };

                _this.onResize(option);

                arnMask.maskLoading = true;
            },
            unMask: function (){
                if(!arnMask.maskLoading) return ;

                var maskElement = document.querySelector('.arn-loader');

                if(maskElement) maskElement.remove();

                window.onresize = null;

                arnMask.maskLoading = false;
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