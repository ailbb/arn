Ext.define('MyApp.map.HeatLayer', {
    extend: 'MyApp.map.Layer',
    alias: 'widget.heatLayer',
    zIndex: -666,
    minBound: 2000,     // 取最小范围(半径、米)的数据
    maxBound: 50000,    // 取最大范围(半径、米)的数据
    radius: 50,
    gradient: { 0.3: "rgb(0,0,255)", 0.6: "rgb(0,255,0)", 0.8: "yellow", 1.0: "rgb(255,0,0)" },
    constructor: function ()
    {
        this.callParent(arguments);

        var canvas = Ext.apply(document.createElement('canvas'), { width: 256, height: 1 });
        var ctx = canvas.getContext('2d'), grd = ctx.createLinearGradient(0, 0, 256, 1);
        for (var i in this.gradient)
        {
            grd.addColorStop(i, this.gradient[i]);
        }

        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, 256, 1);
        this.__palette = ctx.getImageData(0, 0, 256, 1).data;
        this.__lineargrd = grd;
        this.__linearctx = ctx;

        this.__renderTask = new MyApp.util.Task();
        this.__renderTask.defer = 66;
    },
    OnDestroy: function ()
    {
        this.__renderTask.Stop();
        this.callParent(arguments);
    },
    GetKPIFilter: function (name)
    {
        if (name == 'heat_kpi')
            return 'AddXY';
    },
    OnLoadKpis: function (kpis)
    {
        this.callParent(arguments);

        var k = this.GetKPI("heat_kpi");
        if (!k || k.kpis != kpis)
            return;

        this.data = this.__img = null;
        if (!kpis.kpidata)
            return;

        this.data = kpis.kpidata.data;
        var T = MyMapBase.GetImplByJTH(kpis.kpidata.headers);
        this.__pat_item = new T();
        this.kpi_field = k.field;

        this.Render();
    },
    onRender: function ()
    {
        this.__defer_render = false;

        var data = this.data;
        if (!data || this.gradient.length == 0)
            return;

        var tile = this.tile, scale = tile.canvasWidth / tile.ViewportW;
        var dx = scale * tile.ViewportX, dy = scale * tile.ViewportY;
        var w = tile.canvasWidth, h = tile.canvasHeight;
        var canvas = Ext.apply(document.createElement('canvas'), { width: w, height: h, vx: tile.ViewportX, vy: tile.ViewportY, vw: tile.ViewportW });

        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);

        var i = 0, len = data.length, rs = this.radius; //rs = 500 * scale / 16777216; // 热力图覆盖半径设置为像素
        var draw;
        draw = function ()
        {
            if (i < len)
            {
                var x, y, r = 1 * rs, grd, it = this.__pat_item, kpi_field = this.kpi_field;
                for (var n = Math.min(i + 500, len); i < n; i++)
                {
                    it.setData(data[i]);
                    x = Math.round(it.x * scale - dx);
                    if (x < -r || x > w + r)
                        continue;

                    y = Math.round(it.y * scale - dy);
                    if (y < -r || y > h + r)
                        continue;

                    ctx.globalAlpha = it[kpi_field];

                    grd = ctx.createRadialGradient(x, y, r * 0.15, x, y, r);
                    grd.addColorStop(0, 'rgba(0,0,0,1)');
                    grd.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = grd;

                    ctx.fillRect(x - r, y - r, r + r, r + r);
                }

                this.__renderTask.Add(arguments.callee, this);
            }
            else
            {
                var img = ctx.getImageData(0, 0, w, h), imgData = img.data, palette = this.__palette;
                for (var j = 0, n = imgData.length, a; j < n; j += 4)
                {
                    a = imgData[j + 3];
                    if (!a)
                        continue;

                    a *= 4;

                    imgData[j] = palette[a];
                    imgData[j + 1] = palette[a + 1];
                    imgData[j + 2] = palette[a + 2];
                }

                ctx.putImageData(img, 0, 0);
                this.__img = canvas;
                this.Invalidate();
            }
        };

        this.__renderTask.Add(draw, this);
    },
    Render: function ()
    {
        if (this.__defer_render)
            return;

        this.__defer_render = true;
        this.__renderTask.Clear();
        this.__renderTask.Add(this.onRender, this);
    },
    OnViewportChanged: function (bFinally, tile)
    {
        this.callParent(arguments);

        if (bFinally)
            this.Render();
    },
    SetKPI: function (name, kpi)
    {
        this.callParent(arguments);
        // 更改渐变色
        if (Ext.isEmpty(kpi))
            return;
        this.kpi_field = kpi.field;
        this.gradient = kpi.thresholds;
        if (this.gradient.length > 0)
            this.__lineargrd = this.__linearctx.createLinearGradient(0, 0, 256, 1);
        for (var i = 0, count = this.gradient.length; i < count; i++)
        {
            var it = this.gradient[i];
            var color = MyApp.util.Common.parseColor(it.color);
            this.__lineargrd.addColorStop(it.threshold, MyApp.util.Common.rgba(color[0], color[1], color[2]));
        }
        this.__linearctx.fillStyle = this.__lineargrd;
        this.__linearctx.fillRect(0, 0, 256, 1);
        this.__palette = this.__linearctx.getImageData(0, 0, 256, 1).data;
        this.Render();
    },
    OnDraw: function (ctx)
    {
        var img = this.__img;
        if (!img)
            return;

        var iw = img.width, ih = img.height;

        var tile = this.tile, scale = tile.canvasWidth / tile.ViewportW;
        var dx = scale * tile.ViewportX, dy = scale * tile.ViewportY;
        ctx.globalAlpha = 0.5;

        var x = img.vx * scale - dx, y = img.vy * scale - dy, w = img.vw * scale, h = ih * img.vw / iw * scale;
        var rc = new MyApp.util.Rect(x, y, w, h);
        if (!rc.Intersect(this.canvas.clipBox).isEmpty)
            ctx.drawImage(this.__img, iw * (rc.x - x) / w, ih * (rc.y - y) / h, iw * rc.w / w, ih * rc.h / h, rc.x, rc.y, rc.w, rc.h);
    }
});
