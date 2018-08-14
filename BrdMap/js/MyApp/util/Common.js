Ext.define('MyApp.util.Common', {
    alternateClassName: 'MyCommon',
    singleton: true,
    isDevelopment: Ext.isEmpty(window.location.hostname) || window.location.hostname.search(/^localhost$/) >= 0,
    OnResponse: function (fn, scope, resp, c)
    {
        var result, error;
        try
        {
            result = resp.responseText;
            if (resp.status != 200)
                throw '网络异常(' + resp.status + '): ' + resp.statusText;
            result = Ext.decode(result);

            if ('error' in result)
                error = result['error'];
        }
        catch (e)
        {
            error = e;
        }

        try
        {
            if (typeof fn === 'function')
                fn.apply(scope || this, [result, error]);
            else if (error)
                throw error;
        }
        catch (e)
        {
            Ext.Msg.alert(document.title, e);
        }
    },
    Request: function (uri, args, fn, scope, async)
    {
        if (uri.substr(0, APPBASE.length) != APPBASE)
            uri = APPBASE + uri;

        fn = Ext.pass(this.OnResponse, [fn, scope], this);
        return Ext.Ajax.request({ url: uri,
            method: "POST",
            params: args,
            async: async,
            success: fn,
            failure: fn
        });
    },
    __colors: {
        'aqua': [0, 255, 255, 1],
        'azure': [240, 255, 255, 1],
        'beige': [245, 245, 220, 1],
        'black': [0, 0, 0, 1],
        'blue': [0, 0, 255, 1],
        'brown': [165, 42, 42, 1],
        'cyan': [0, 255, 255, 1],
        'darkblue': [0, 0, 139, 1],
        'darkcyan': [0, 139, 139, 1],
        'darkgrey': [169, 169, 169, 1],
        'darkgreen': [0, 100, 0, 1],
        'darkkhaki': [189, 183, 107, 1],
        'darkmagenta': [139, 0, 139, 1],
        'darkolivegreen': [85, 107, 47, 1],
        'darkorange': [255, 140, 0, 1],
        'darkorchid': [153, 50, 204, 1],
        'darkred': [139, 0, 0, 1],
        'darksalmon': [233, 150, 122, 1],
        'darkviolet': [148, 0, 211, 1],
        'fuchsia': [255, 0, 255, 1],
        'gold': [255, 215, 0, 1],
        'green': [0, 128, 0, 1],
        'indigo': [75, 0, 130, 1],
        'khaki': [240, 230, 140, 1],
        'lightblue': [173, 216, 230, 1],
        'lightcyan': [224, 255, 255, 1],
        'lightgreen': [144, 238, 144, 1],
        'lightgrey': [211, 211, 211, 1],
        'lightpink': [255, 182, 193, 1],
        'lightyellow': [255, 255, 224, 1],
        'lime': [0, 255, 0, 1],
        'magenta': [255, 0, 255, 1],
        'maroon': [128, 0, 0, 1],
        'navy': [0, 0, 128, 1],
        'olive': [128, 128, 0, 1],
        'orange': [255, 165, 0, 1],
        'pink': [255, 192, 203, 1],
        'purple': [128, 0, 128, 1],
        'violet': [128, 0, 128, 1],
        'red': [255, 0, 0, 1],
        'silver': [192, 192, 192, 1],
        'white': [255, 255, 255, 1],
        'yellow': [255, 255, 0, 1],
        'transparent': [255, 255, 255, 0]
    },
    __regex_hex_clr24: /#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/,
    __regex_hex_clr16: /#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])/,
    __regex_rgb_clr: /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/i,
    __regex_rgba_clr: /rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9\.]*)\s*\)/i,
    parseColor: function (color)
    {
        var match, clr = color;
        if (match = this.__regex_hex_clr24.exec(clr))
            return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16), 1];
        else if (match = this.__regex_hex_clr16.exec(clr))
            return [parseInt(match[1], 16) * 17, parseInt(match[2], 16) * 17, parseInt(match[3], 16) * 17, 1];
        else if (match = this.__regex_rgb_clr.exec(clr))
            return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3]), 1];
        else if (match = this.__regex_rgba_clr.exec(clr))
            return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10), parseFloat(match[4])];
        else if (clr in this.__colors)
            return this.__colors[clr];
        else if (Ext.isString(clr))
        {
            clr = color.toLowerCase();
            if (clr in this.__colors)
                return this.__colors[clr];
        }

        if (Ext.isNumeric(clr))
        {
            clr = parseInt(clr);
            return [(clr >> 16) & 0xff, (clr >> 8) & 0xff, clr & 0xff, 1];
        }

        return color;
    },
    rgba: function (r, g, b, a) { return 'rgba(' + (r || 0) + ',' + (g || 0) + ',' + (b || 0) + ',' + (a === undefined ? 1 : a) + ')'; },
    mixColor: function (a, b, sa, sb)
    {
        if (Ext.isString(a) || Ext.isNumeric(a))
            a = this.parseColor(a);

        if (b === undefined)
            b = this.__colors['black'];
        else if (Ext.isString(b) || Ext.isNumeric(b))
            b = this.parseColor(b);

        if (!Ext.isArray(a) || a.length < 4 || !Ext.isArray(b) || b.length < 4)
            return a;

        if (sa === undefined) sa = 0.5;
        if (sb === undefined) sb = 1 - sa;

        var t = sa + sb;
        if (t > 1)
        {
            sa /= t;
            sb /= t;
        }

        return this.rgba(Math.round(a[0] * sa + b[0] * sb), Math.round(a[1] * sa + b[1] * sb), Math.round(a[2] * sa + b[2] * sb), a[3] * sa + b[3] * sb);
    },
    BinarySearch: function (first, last, val, cmp, scope)
    {
        var i = 0, c;
        while (first < last)
        {
            i = (first + last) >> 1;
            c = cmp.call(scope, i, val);
            if (c < 0)
                first = ++i;
            else if (c > 0)
                last = i;
            else
                return i;
        }

        return ~i;
    },
    Invoke: function (obj, methodName, args)
    {
        if (!obj)
            return;

        var r;
        if (Ext.isArray(obj))
        {
            r = [];
            for (var i = 0, n = obj.length; i < n; i++)
            {
                r.push(this.Invoke(obj[i], methodName, args));
            }
        }
        else if (obj instanceof Ext.util.AbstractMixedCollection)
        {
            r = [];
            for (var i = 0, n = obj.length; i < n; i++)
            {
                r.push(this.Invoke(obj.getAt(i), methodName, args));
            }
        }
        else
        {
            r = obj[methodName];
            if (typeof r === 'function')
                r = r.apply(obj, args);
        }

        return r;
    },
    LoadConfig: function (url, fn, scope)
    {
        var f = function (resp, options)
        {
            var __result__, __error__;
            try
            {
                if (resp.timedout)
                    throw '超时!';

                if (resp.status != 200)
                    throw '网络异常(' + resp.status + '): ' + resp.statusText;

                __result__ = (function () { eval(arguments[0]); return this; }).apply({}, [resp.responseText].concat(options.args));
            }
            catch (e)
            {
                __error__ = e;
            }

            try
            {
                Ext.onReady(Ext.pass(fn, [__result__, __error__].concat(options.args), scope));
            }
            catch (e)
            {
                console.log('从"' + options.url + '"加载配置失败: ');
                console.log(e);
            }
        };

        Ext.Ajax.request({
            url: Ext.String.startsWith(url, APPBASE) ? url : APPBASE + url,
            method: 'GET',
            success: f,
            failure: f,
            scope: this,
            args: Ext.Array.slice(arguments, 3)
        });
    }
});

Ext.override(Ext, {
    __pass: Ext.pass,
    pass: function (fn, args, scope)
    {
        var r = this.__pass.apply(this, arguments);
        r.displayName = fn.displayName;
        r.$name = fn.$name;
        return r;
    },
    pass_self_prototype: function (name)
    {
        return function () { return this.self.prototype[name].apply(this, arguments); };
    }
});

Object.defineProperties(Ext.Base.prototype, {
    initialConfig: {
        get: function () { return this.__initialConfig; },
        set: function (config)
        {
            if (this.__initialConfig === config)
                return;

            this.__initialConfig = config;

            if (config && typeof config === 'object')
            {
                var name, value;
                for (name in config)
                {
                    value = config[name];

                    if (typeof value !== 'function' || value.$name || value.$previous || value.$className || value === Ext.emptyFn || value === Ext.identityFn)
                        continue;

                    value.$name = name;
                    value.displayName = 'override@initialConfig$' + name;
                    value.$previous = Ext.pass_self_prototype(name);
                }
            }
        }
    }
});

Ext.Base.override({
    OnResponse: MyApp.util.Common.OnResponse,
    Request: MyApp.util.Common.Request
});

Ext.Component.override({
    beforeDestroy: function ()
    {
        try
        {
            if (this.floating && this.floatParent && this.floatParent.getComponent(this))
                this.floatParent.remove(this, false);
        }
        catch (e)
        {
            ;
        }

        this.callParent(arguments);
    }
});

if (Ext.getVersion().gtEq(5))
{
    Ext.Component.prototype.constructPlugin.$privacy = undefined;
    Ext.container.Container.prototype.applyDefaults.$privacy = undefined;
    Ext.container.Container.prototype.repositionFloatingItems.$privacy = undefined;
}

Ext.view.Table.override({
    initComponent: function ()
    {
        this.callParent(arguments);
        this.rowValues = Ext.clone(this.rowValues); // Ext bug
    }
});

Ext.menu.Item.override({
    doExpandMenu: function ()
    {
        var menu = this.menu, pm = this.parentMenu;
        if (this.activated && (!menu.rendered || !menu.isVisible()) && pm)
        {
            menu.shadow = pm.shadow;
            menu.shadowOffset = pm.shadowOffset;
        }

        this.callParent(arguments);
    }
});

Ext.dom.Element.override({
    setXY: function (xy, animate, duration, callback, easing)
    {
        if (animate)
        {
            if (!Ext.isObject(animate))
                animate = {};
            Ext.applyIf(animate, { duration: duration, callback: callback, easing: easing });
        }

        this.callParent(arguments);
    }
});

Ext.picker.Color.override({
    select: function (color, suppressEvent)
    {
        try
        {
            this.callParent(arguments);
        }
        catch (e)
        {
            console.log(e);
        }
    }
});

Ext.Shadow.override({
    show: function (target)
    {
        var ret = this.callParent(arguments), el = this.el;
        if (target && el)
        {
            target = Ext.get(target);
            ['opacity', 'pointer-events'].forEach(function (s) { el.setStyle(s, target.getStyle(s)); });
        }

        return ret;
    }
});

Ext.onReady(function ()
{
    var styleHooks = Ext.Element.prototype.styleHooks;
    styleHooks.pointerEvents = styleHooks['pointer-events'] =
    {
        name: 'pointerEvents',
        afterSet: function (dom, value, el)
        {
            if (el.shadow && el.shadow.el)
                el.shadow.el.setStyle('pointer-events', value);
        }
    };
});

Ext.String.Compare = function (a, b, ignoreCase)
{
    if (a === null)
        return a === b ? 0 : -1;
    else if (b === null)
        return 1;

    if (a === undefined)
        return a === b ? 0 : -1;
    else if (b === undefined)
        return 1;

    a = a.toString();
    b = b.toString();
    if (ignoreCase)
    {
        a = a.toLowerCase();
        b = b.toLowerCase();
    }

    return a.localeCompare(b);
};

if (!Ext.isIE)
    XMLDocument.prototype.__defineGetter__("xml", function () { return new XMLSerializer().serializeToString(this); });

if (!Math.sinh) // ie没这个方法
    Math.sinh = function (x) { return (this.exp(x) - this.exp(-x)) / 2.0; };

Object.defineProperties(Array.prototype, {
    BinarySearch: {
        writable: false,
        enumerable: false,
        value: function (val, cmp, scope)
        {
            var cb;
            if (cmp)
                cb = function (i, v) { return cmp.call(scope, this[i], v); };
            else
                cb = function (i, v) { i = this[i]; return i < v ? -1 : (i > v ? 1 : 0); };

            return MyCommon.BinarySearch(0, this.length, val, cb, this);
        }
    }
});
