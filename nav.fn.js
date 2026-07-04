/**
 * Created by Wz on 2026/05/15.
 * Automated Dependency Injector & Super Fingerprint Matrix
 */

(function () {
    // Config paths for your environment dependencies
    const JQ_PATH = '/arn/JQuery/jquery-4.0.0/jquery.min.js';
    const FP_PATH = '/arn/Fingerprintjs/fingerprintjs-3.4.2/dist/fp.min.js';

    /**
     * Utility helper to dynamically inject a script tag if AMD is missing
     */
    function loadScriptFallback(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = url;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Script fallback failed: ${url}`));
            document.head.appendChild(script);
        });
    }

    /**
     * Orchestrates dependency resolution for jQuery and FingerprintJS
     */
    async function resolveDependencies() {
        const hasAMD = typeof window.define === 'function' && window.define.amd;
        const hasRequire = typeof window.require === 'function';

        // 1. Resolve jQuery
        if (!window.jQuery && !window.$) {
            if (hasAMD || hasRequire) {
                try {
                    window.$ = window.jQuery = await new Promise((res, rej) => {
                        window.require([JQ_PATH], (loadedJq) => loadedJq ? res(loadedJq) : rej());
                    });
                } catch (e) {
                    await loadScriptFallback(JQ_PATH);
                }
            } else {
                await loadScriptFallback(JQ_PATH);
            }
        }

        // 2. Resolve FingerprintJS
        if (!window.FingerprintJS) {
            if (hasAMD || hasRequire) {
                try {
                    window.FingerprintJS = await new Promise((res, rej) => {
                        window.require([FP_PATH], (loadedFp) => loadedFp ? res(loadedFp) : rej());
                    });
                } catch (e) {
                    await loadScriptFallback(FP_PATH);
                }
            } else {
                await loadScriptFallback(FP_PATH);
            }
        }

        return window.jQuery || window.$;
    }

    // Initialize bootstrapping pipeline
    resolveDependencies().then(($) => {
        if (!$) {
            console.error("Critical dependency failure: jQuery could not be initialized.");
            return;
        }

        // Expose safe custom definition macro if AMD framework hasn't allocated it
        if (!window.define) {
            window.define = function (args, fn) {
                if (typeof fn === 'function') fn($);
            };
        }

        define(['jQuery'], function ($) {

            /**
             * Advanced Device Fingerprint Gatherer (FingerprintJS + Deep Native Heuristics)
             */
            $.fn.getSuperFingerprint = async function () {
                let fpId = 'unknown';
                let fpComponents = {};

                try {
                    const FPJS = window.FingerprintJS;
                    if (FPJS && typeof FPJS.load === 'function') {
                        const fp = await FPJS.load();
                        const result = await fp.get();
                        fpId = result.visitorId;
                        fpComponents = result.components;
                    }
                } catch (e) {
                    console.warn("FingerprintJS pipeline validation dropped. Reverting to native fallback.", e);
                }

                const superData = {
                    fpjsId: fpId,
                    fpjsComponents: fpComponents,
                    network: {},
                    hardware: {},
                    media: {},
                    securityAndBot: {},
                    clientHints: {}
                };

                // Network Layer Analytics
                try {
                    superData.network.timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
                } catch (e) {
                    superData.network.timezoneName = 'unknown';
                }
                superData.network.timezoneOffset = new Date().getTimezoneOffset();

                if (navigator.connection) {
                    superData.network.connectionType = navigator.connection.effectiveType || 'unknown';
                    superData.network.downlink = navigator.connection.downlink || 0;
                    superData.network.rtt = navigator.connection.rtt || 0;
                }

                // Architecture Topology
                superData.hardware.memory = navigator.deviceMemory || 'unknown';
                superData.hardware.cores = navigator.hardwareConcurrency || 'unknown';
                superData.hardware.maxTouchPoints = navigator.maxTouchPoints || 0;

                const canvas = document.createElement('canvas');
                const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
                if (gl) {
                    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                    if (debugInfo) {
                        superData.hardware.gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                        superData.hardware.gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    }
                }

                // Peripherals Audit
                if (navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === 'function') {
                    try {
                        const devices = await navigator.mediaDevices.enumerateDevices();
                        superData.media.audioInCount = devices.filter(d => d.kind === 'audioinput').length;
                        superData.media.audioOutCount = devices.filter(d => d.kind === 'audiooutput').length;
                        superData.media.videoInCount = devices.filter(d => d.kind === 'videoinput').length;
                        superData.media.devicesHash = devices.map(d => d.kind + d.groupId).sort().join(',');
                    } catch (mediaError) {
                        superData.media.error = "Context restrictions / Security block";
                    }
                }

                // Automation Checkpoints
                superData.securityAndBot.isWebdriver = navigator.webdriver || false;
                superData.securityAndBot.pluginsLength = navigator.plugins ? navigator.plugins.length : 0;
                superData.securityAndBot.chromeWindow = !!window.chrome;

                // User-Agent High Entropy Extraction
                if (navigator.userAgentData && typeof navigator.userAgentData.getHighEntropyValues === 'function') {
                    try {
                        superData.clientHints = await navigator.userAgentData.getHighEntropyValues([
                            'architecture', 'model', 'platformVersion', 'fullVersionList', 'bitness'
                        ]);
                    } catch (chError) {
                        superData.clientHints.error = "Entropy context blocked";
                    }
                }
                const stableFeatures = {
                    fpjsId: superData.fpjsId,

                    timezoneName: superData.network.timezoneName,
                    timezoneOffset: superData.network.timezoneOffset,

                    memory: superData.hardware.memory,
                    cores: superData.hardware.cores,
                    maxTouchPoints: superData.hardware.maxTouchPoints,
                    gpuVendor: superData.hardware.gpuVendor,
                    gpuRenderer: superData.hardware.gpuRenderer,

                    audioInCount: superData.media.audioInCount || 0,
                    audioOutCount: superData.media.audioOutCount || 0,
                    videoInCount: superData.media.videoInCount || 0,

                    chromeWindow: superData.securityAndBot.chromeWindow,

                    architecture: superData.clientHints?.architecture || '',
                    bitness: superData.clientHints?.bitness || '',
                    model: superData.clientHints?.model || ''
                };

                const superString = JSON.stringify(stableFeatures);
                const superId = $.cyrb128Hash(superString);

                const userFinger = {
                    superId: superId,
                    details: superData
                };
                const userFingerStr = JSON.stringify(userFinger);

// Synchronize the current verified matrix into the session domain
                sessionStorage.setItem('UserFinger', userFingerStr);

// Retrieve historical persistence matrix
                const cachedFingerStr = localStorage.getItem('UserFinger');

                if (!cachedFingerStr) {
                    // console.log("Device Context Status: New Device Initialized");
                    localStorage.setItem('UserFingerDanger', "0");
                    sessionStorage.setItem('UserFingerDanger', "0");
                } else if (JSON.parse(cachedFingerStr).superId !== userFinger.superId) {
                    // MISMATCH: The hardware fingerprint or execution layout has mutated.
                    // console.warn("Device Context Status: Context Mutation Detected!");
                    localStorage.setItem('UserFingerDanger', "1");
                    sessionStorage.setItem('UserFingerDanger', "1");
                } else {
                    localStorage.setItem('UserFingerDanger', "0");
                    sessionStorage.setItem('UserFingerDanger', "0");
                    // IDEMPOTENT: Consistent hardware mapping verified successfully.
                    // console.log("Device Context Status: Verification Standard OK");
                }

                localStorage.setItem('UserFinger', userFingerStr);

                return userFinger;
            };

            /**
             * Overrides and polyfills standard html rendering injection pipelines
             */
            $.fn.loadHtml = function (url, params, callback) {
                if (typeof url !== "string") return this;

                let selector;
                let response;
                const self = this;
                const off = url.indexOf(" ");

                if (off >= 0) {
                    selector = url.slice(off).trim();
                    url = url.slice(0, off);
                }

                if (typeof params === "function") {
                    callback = params;
                    params = undefined;
                }

                let dataType = "html";
                if (~url.indexOf("?")) {
                    dataType = url.substring(0, url.indexOf("?"));
                    dataType = dataType.substring(dataType.lastIndexOf(".") + 1);
                } else {
                    dataType = url.substring(url.lastIndexOf(".") + 1);
                }

                if (self.length > 0) {
                    if (dataType.toLowerCase() === "js") {
                        if (typeof require !== 'undefined') {
                            require([url], function (js) {
                                if (typeof js === 'function') js(params);
                                if (typeof js === 'object' && js.init) js.init(params);
                            });
                        }
                    } else {
                        $.ajax({
                            url: url,
                            type: "GET",
                            dataType: "html",
                            data: params
                        }).done(function (responseText) {
                            response = arguments;
                            self.html(selector ?
                                $("<div>").append($.parseHTML(responseText)).find(selector) :
                                $.initHtml().purifyHtml(responseText)
                            );
                        }).always(function () {
                            if (typeof callback === "function") {
                                const jqXHR = response ? response[0] : null;
                                const status = response ? response[1] : "error";
                                self.each(callback, response || [jqXHR, status]);
                            }
                        });
                    }
                }
                return this;
            };

            /**
             * Form Serialization Component Matrix Mapping
             */
            $.fn.serializeObject = function () {
                const list = this.serializeArray();
                const obj = {};
                for (const item of list) {
                    obj[item.name] = item.value;
                }
                return obj;
            };

            $.fn.hoverIn = function () {
                return this.addClass("hover");
            };

            $.fn.hoverOut = function () {
                return this.removeClass("hover");
            };

            $.fn.prevTo = function (v) {
                let _this = this;
                let iterations = parseInt(v, 10) || 0;
                while (iterations-- > 0) {
                    if (_this.prev().length === 0) break;
                    _this = _this.prev();
                }
                return _this;
            };

            $.fn.nextTo = function (v) {
                let _this = this;
                let iterations = parseInt(v, 10) || 0;
                while (iterations-- > 0) {
                    if (_this.next().length === 0) break;
                    _this = _this.next();
                }
                return _this;
            };

            /**
             * Deep Extensions Sandbox Core
             */
            $.extend({
                searchObject: function (str) {
                    const cleanStr = (str || location.search).replace("?", "");
                    if (!cleanStr) return {};

                    const list = cleanStr.split("&");
                    const obj = {};

                    for (const item of list) {
                        const pair = item.split("=");
                        if (pair.length && pair[0]) {
                            obj[pair[0]] = pair.length > 1 ? decodeURIComponent(pair[1]) : "";
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

                purifyHtml: function (responseText) {
                    if (!responseText) return "";
                    return responseText.replace(/<(link|script).*(ext|bootstrap).*>/gi, "");
                },

                assign: function (o1, o2) {
                    return Object.assign(o1 || {}, o2 || {});
                },

                parse: function (str) {
                    return typeof str === 'string' ? JSON.parse(str) : str;
                },

                trans1024: function (value) {
                    let v = parseFloat(value || "0");
                    if (!v || v === 0) return '-';
                    const tb = 1024 * 1024 * 1024 * 1024;
                    const gb = 1024 * 1024 * 1024;
                    const mb = 1024 * 1024;
                    const kb = 1024;
                    if (v > tb) return parseFloat((v / tb).toFixed(2)) + " TB";
                    if (v > gb) return parseFloat((v / gb).toFixed(2)) + " GB";
                    if (v > mb) return parseFloat((v / mb).toFixed(2)) + " MB";
                    if (v > kb) return parseFloat((v / kb).toFixed(2)) + " KB";
                    return parseFloat(v.toFixed(2)) + " Byte";
                },

                trans1024MB: function (value) {
                    let v = parseFloat(value || "0");
                    if (!v || v === 0) return '-';
                    const tb = 1024 * 1024;
                    const gb = 1024;
                    if (v > tb) return parseFloat((v / tb).toFixed(2)) + " TB";
                    if (v > gb) return parseFloat((v / gb).toFixed(2)) + " GB";
                    if (v > 1) return parseFloat(v.toFixed(2)) + " MB";
                    return parseFloat((v * 1024).toFixed(2)) + " KB";
                },

                trans1000: function (value) {
                    let v = parseFloat(value || "0");
                    if (!v || v === 0) return '-';
                    const billion = 1000 * 1000 * 1000;
                    const hundredK = 1000 * 1000;
                    const thousand = 1000;
                    if (v > billion) return parseFloat((v / billion).toFixed(2)) + " B VCore";
                    if (v > hundredK) return parseFloat((v / hundredK).toFixed(2)) + " 100K VCore";
                    if (v > thousand) return parseFloat((v / thousand).toFixed(2)) + " K VCore";
                    return parseFloat(v.toFixed(2)) + " VCore";
                },

                transferRatio: function (value) {
                    if (!value) return '0.00 %';
                    return (parseFloat(value) * 100).toFixed(2) + ' %';
                },

                cyrb128Hash: function (str) {
                    let h = 2166136261;
                    for (let i = 0; i < str.length; i++) {
                        h ^= str.charCodeAt(i);
                        h = Math.imul(h, 16777619);
                    }
                    return (h >>> 0).toString(16);
                }
            });

            $.fn.getSuperFingerprint();
        });
    });
})();