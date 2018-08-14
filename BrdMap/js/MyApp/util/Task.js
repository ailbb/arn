Ext.define('MyApp.util.Task', {
    defer: 1,
    constructor: function ()
    {
        var __stopped = false;
        Object.defineProperties(this, {
            task: { value: [] },
            stopped: {
                get: function () { return __stopped; },
                set: function (v)
                {
                    v = !!v;
                    if (__stopped == v)
                        return;
                    __stopped = v;
                    if (__stopped)
                        this.Clear();
                }
            }
        });
        this.callParent(arguments);
    },
    OnError: function (e)
    {
        this.task.length = 0;
        console.log(e);
//        Ext.Msg.alert(document.title, e);
    },
    DispatchTask: function ()
    {
        try
        {
            var t = this.task.shift(), n = this.task.length;
            if (t)
            {
                if (MyCommon.isDevelopment)
                {
                    var dt = new Date();
                    t();
                    console.log((t.displayName || t.$name) + ': ' + (new Date() - dt));
                }
                else
                    t();
            }
            if (n > 0)
                this.PostTask();
        }
        catch (e)
        {
            this.OnError(e);
        }
    },
    PostTask: function ()
    {
        setTimeout(Ext.pass(this.DispatchTask, undefined, this), this.defer);
    },
    Add: function (fn, scope/*, ...*/)
    {
        if (this.stopped)
            return;

        switch (arguments.length)
        {
            case 0:
                return;
            case 1:
                break;
            case 2:
                fn = Ext.pass(fn, undefined, scope);
                break;
            default:
                {
                    var args = [];
                    args.push.apply(args, arguments);
                    args.splice(0, 2);
                    fn = Ext.pass(fn, args, scope);
                    break;
                }
        }

        if (this.task.push(fn) == 1)
            this.PostTask();

        return fn;
    },
    Clear: function ()
    {
        this.task.length = 0;
    },
    Stop: function ()
    {
        this.stopped = true;
    },
    pass: function (fn, scope/*, ...*/)
    {
        return Ext.pass(this.Add, arguments, this);
    }
});