//////////////////////////////////////////////////////////////////////////
Ext.define('MyApp.util.Point', {
    constructor: function (x, y)
    {
        this.x = x || 0;
        this.y = y || 0;
    },
    setXY: function (x, y)
    {
        this.x = x;
        this.y = y;
        return this;
    },
    Offset: function (dx, dy)
    {
        this.x += dx;
        this.y += dy;
        return this;
    },
    Rotate: function (x, y, a)
    {
        a *= Math.PI / 180;
        var ca = Math.cos(a), sa = Math.sin(a);
        var dx = this.x - x, dy = this.y - y;
        this.x = x + ca * dx - sa * dy;
        this.y = y + ca * dy + sa * dx;
        return this;
    }
});

//////////////////////////////////////////////////////////////////////////
Ext.define('MyApp.util.Rect', {
    constructor: function (x, y, w, h)
    {
        this.Reset(x, y, w, h);
    },
    Reset: function (x, y, w, h)
    {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        return this;
    },
    Contains: function ()
    {
        if (arguments.length < 1)
            return false;

        var x = arguments[0];
        if (x instanceof this.self)
            return this.Contains(x.x, x.y) && this.Contains(x.right, x.bottom);
        else if (x instanceof MyApp.util.Point)
            return this.Contains(x.x, x.y);
        else if (arguments.length < 2)
            return false;

        var y = arguments[1];
        if (arguments.length > 3)
            return this.Contains(x, y) && this.Contains(x + arguments[2], y + arguments[3]);

        return x >= this.x && x < this.right && y >= this.y && y < this.bottom;
    },
    IsIntersect: function (x, y, w, h)
    {
        return Math.min(this.right, x + w) - Math.max(this.x, x) > 0 && Math.min(this.bottom, y + h) - Math.max(this.y, y) > 0;
    },
    Intersect: function ()
    {
        if (arguments.length < 1)
            return;

        var x = arguments[0];
        if (x instanceof this.self)
            return this.Intersect(x.x, x.y, x.w, x.h);

        var y = arguments[1], r = Math.min(this.right, x + arguments[2]), b = Math.min(this.bottom, y + arguments[3]);

        this.x = Math.max(this.x, x);
        this.y = Math.max(this.y, y);
        this.w = r - this.x;
        this.h = b - this.y;
        return this;
    },
    Union: function ()
    {
        if (arguments.length < 1)
            return;

        var x = arguments[0];
        if (x instanceof this.self)
            return this.Union(x.x, x.y, x.w, x.h);

        var y = arguments[1], w = arguments[2] || 0, h = arguments[3] || 0;
        if (this.isEmpty)
        {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
        }
        else
        {
            w = Math.max(this.right, x + w);
            h = Math.max(this.bottom, y + h);

            this.x = Math.min(this.x, x);
            this.y = Math.min(this.y, y);
            this.w = w - this.x;
            this.h = h - this.y;
        }
        return this;
    }
},
function ()
{
    Object.defineProperties(this.prototype, {
        left: { get: function () { return this.x; } },
        top: { get: function () { return this.y; } },
        right: { get: function () { return this.x + this.w; } },
        bottom: { get: function () { return this.y + this.h; } },
        isEmpty: { get: function () { return !(this.w > 0 && this.h > 0); } }
    });
});

//////////////////////////////////////////////////////////////////////////
Ext.define('MyApp.util.Canvas', {
    extend: 'Ext.Component',
    alias: 'widget.canvas',
    onRender: function ()
    {
        this.callParent(arguments);

        var el = document.createElement('canvas');
        this.el.appendChild(el);
        Object.defineProperties(this, {
            canvas: { value: el, writable: false, configurable: true },
            canvasWidth: { get: function () { return this.canvas.width; } },
            canvasHeight: { get: function () { return this.canvas.height; } },
            clipBox: { value: new MyApp.util.Rect(), writable: false }
        });
    },
    onDestroy: function ()
    {
        if (this.canvas)
        {
            Ext.removeNode(this.canvas);
            delete this.canvas;
        }

        this.callParent(arguments);
    },
    onResize: function (width, height, oldWidth, oldHeight)
    {
        this.callParent(arguments);

        this.canvas.width = width;
        this.canvas.height = height;
        this.InvalidateRect(0, 0, width, height);
    },
    OnDraw: function (ctx)
    {
    },
    UpdateCanvas: function ()
    {
        if (this.__drawing)
            return;

        var cb = this.clipBox;
        if (cb.isEmpty)
            return;

        var x = Math.floor(cb.x), y = Math.floor(cb.y);
        cb.Reset(x, y, Math.ceil(cb.right) - x, Math.ceil(cb.bottom) - y).Intersect(0, 0, this.canvasWidth, this.canvasHeight);
        if (cb.isEmpty)
            return;

        this.__drawing = true;
        var ctx = this.canvas.getContext('2d');
        try
        {
            ctx.save();
            ctx.beginPath();
            ctx.rect(cb.x, cb.y, cb.w, cb.h);
            ctx.clip();

            ctx.clearRect(cb.x, cb.y, cb.w, cb.h);
            this.OnDraw(ctx);
        }
        catch (e)
        {
            console.log(e.toString());
        }
        finally
        {
            cb.w = 0;
            ctx.restore();
            this.__drawing = false;
        }
    },
    InvalidateRect: function ()
    {
        var cb = this.clipBox;
        if (cb)
        {
            var b = cb.isEmpty;
            cb.Union.apply(cb, arguments);
            if (b && !cb.isEmpty)
                setTimeout(Ext.pass(this.UpdateCanvas, undefined, this), 16);
        }
    },
    Invalidate: function ()
    {
        this.InvalidateRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
});
