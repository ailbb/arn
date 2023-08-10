var jss = new function ()
{
    var me = this;

    // public
    me.isDefined = function (value)
    {
        return typeof value !== 'undefined';
    };
    me.isBoolean = function (value)
    {
        return typeof value === 'boolean';
    };
    me.isNumber = function (value)
    {
        return typeof value === 'number' && isFinite(value);
    };
    me.isNumeric = function (value)
    {
        return !isNaN(parseFloat(value)) && isFinite(value);
    };
    me.isString = function (value)
    {
        return typeof value === 'string';
    };
    me.isObject = function (value)
    {
        return toString.call(value) === '[object Object]';
    };
    me.isDate = function (value)
    {
        return toString.call(value) === '[object Date]';
    };
    me.isArray = ('isArray' in Array) ? Array.isArray : function (value)
    {
        return toString.call(value) === '[object Array]';
    };
    me.isFunction = function (value)
    {
        return typeof (value) === 'function';
    };
    me.isEmpty = function (value, allowEmptyString)
    {
        return (value === null) || (value === undefined) || (!allowEmptyString ? value === '' : false) || (this.isArray(value) && value.length === 0);
    };
    me.toString = function (v)
    {
        return v == null ? null : String(v);
    };
    me.toNumber = function (v)
    {
        return v == null ? null : Number(v);
    };

    me.encode = function (o)
    {
        return JSON.stringify(o);
    };
    me.decode = function (s, throwOnError)
    {
        if (throwOnError)
            return JSON.parse(s);

        try
        {
            return JSON.parse(s);
        }
        catch (e)
        {
            return null;
        }
    };

    me.apply = function (object, config, defaults)
    {
        if (defaults)
            this.apply(object, defaults);

        if (object && config && typeof config === 'object')
        {
            for (var i in config)
            {
                object[i] = config[i];
            }
        }

        return object;
    };
    me.clone = function (item)
    {
        if (item === null || item === undefined)
            return item;

        var type = toString.call(item);
        if (type === '[object Date]')
            return new Date(item.getTime());
        else if (type === '[object Array]')
        {
            var result = [];
            for (var i = item.length; i-- > 0; )
            {
                result[i] = this.clone(item[i]);
            }
            return result;
        }
        else if (type === '[object Object]' && item.constructor === Object)
        {
            var result = {};
            for (var k in item)
            {
                result[k] = this.clone(item[k]);
            }
            return result;
        }

        return item;
    };
    me.pass = function (fn, args, scope)
    {
        var ps = this.isEmpty(args, true) ? [] : [].concat(args);
        return function ()
        {
            var fnArgs = [].concat(ps);
            fnArgs.push.apply(fnArgs, arguments);
            return fn.apply(scope || this, fnArgs);
        };
    };

    me.log = function (s)
    {
        context.errorWriter.println(s);
    };

    var __lock = new java.util.concurrent.locks.ReentrantLock();
    me.sync = function (fn, args, scope)
    {
        __lock.lock();
        try
        {
            return fn.apply(scope, args);
        }
        finally
        {
            __lock.unlock();
        }
    };
};

//////////////////////////////////////////////////////////////////////////
function DAO()
{
    var __session;
    Object.defineProperties(this, {
        session: {
            get: function ()
            {
                if (!__session)
                {
                    var app = org.springframework.web.context.support.WebApplicationContextUtils.getRequiredWebApplicationContext(__host.getServletContext());
                    __session = app.getBean(org.hibernate.SessionFactory).openSession();
                }
                return __session;
            },
            set: function (v)
            {
                if (__session === v)
                    return;

                if (__session)
                    __session.close();

                __session = v instanceof org.hibernate.Session ? v : null;
            }
        }
    });
}
DAO.prototype.close = function ()
{
    this.session = null;
}
DAO.prototype.query = function (hql)
{
    var q = this.session.createQuery(hql);
    for (var i = 1, j = 0, n = arguments.length; i < n; i++)
    {
        q.setParameter(j++, arguments[i]);
    }
    return q;
}
DAO.prototype.list = function (hql)
{
    return this.query.apply(this, arguments).list();
}
DAO.prototype.update = function (hql)
{
    return this.query.apply(this, arguments).executeUpdate();
}
DAO.prototype.get = function (cls, id)
{
    return this.session.get(cls, id);
}
DAO.prototype.save = function (item)
{
    for (var i = 0, n = arguments.length, it; i < n; i++)
    {
        it = arguments[i];
        if (jss.isArray(it))
            this.save.apply(this, it);
        else
            this.session.save(it);
    }
}

//////////////////////////////////////////////////////////////////////////
function ServiceContext(request, response, out)
{
    this.request = request;
    this.response = response;
    this.out = out instanceof java.io.PrintWriter ? out : new java.io.PrintWriter(out);

    var __database, __dao;
    Object.defineProperties(this, {
        database: {
            get: function ()
            {
                if (!__database)
                {
                    this.database = new Database();
                    __database.fetch_size = 2000;
                }

                return __database;
            },
            set: function (v)
            {
                if (__database === v)
                    return;

                if (__database)
                    __database.close();

                __database = v instanceof Database ? v : null;

                var id = this.GetString('query_id');
                if (id)
                {
                    var session = this.request.getSession();
                    if (session)
                    {
                        id = 'database_query_' + id;
                        var db = jss.sync(function ()
                        {
                            var info = session.getAttribute(id), order = this.GetNumber('query_order');
                            if (info && order < info.order)
                                return __database;

                            if (__database)
                                session.setAttribute(id, { order: order, db: __database });
                            else
                                session.removeAttribute(id);

                            return info ? info.db : null;
                        }, undefined, this);

                        if (db)
                            db.cancel();
                    }
                }
            }
        },
        dao: {
            get: function ()
            {
                if (!__dao)
                    __dao = new DAO();
                return __dao;
            },
            set: function (v)
            {
                if (__dao === v)
                    return;

                if (__dao)
                    __dao.close();

                __dao = v instanceof DAO ? v : null;
            }
        }
    });
}
ServiceContext.prototype.close = function ()
{
    this.database = null;
    this.dao = null;

    for (var x in this)
    {
        delete this[x];
    }
}
ServiceContext.prototype.__defineGetter__('user', function ()
{
    var user = this.request.getSession().getAttribute(ConstDefine.SESSION_USER);
    if (user == null)
        throw '未登录或会话已过期！';
    return user;
});
ServiceContext.prototype.GetString = function (name)
{
    var v = this.request.getParameter(name);
    return v == null ? null : String(v);
}
ServiceContext.prototype.GetNumber = function (name)
{
    var v = this.GetString(name);
    return jss.isNumeric(v) ? Number(v) : null;
}
ServiceContext.prototype.print = function (obj, newline)
{
    if (jss.isString(obj))
        this.out.print(obj);
    else if (obj instanceof java.lang.String)
        this.out.print(String(obj));
    else
        this.out.print(String(com.broadtech.unicom.utils.JsonUtils.toJson(obj)));

    if (newline)
        this.out.print("\n");

    this.out.flush();
}
ServiceContext.prototype.println = function (obj)
{
    this.print(obj, true);
}
ServiceContext.prototype.DoAction = function (a)
{
    if (jss.isArray(a))
    {
        var result = [];
        for (var i = 0, n = a.length; i < n; i++)
        {
            result[i] = this.DoAction(a[i]);
        }

        return result;
    }

    var args = [this];
    if (jss.isObject(a))
    {
        if (!jss.isEmpty(a.args))
            args.push.apply(args, jss.isArray(a.args) ? a.args : [a.args]);

        a = a.name;
    }

    if (jss.isEmpty(a) || !jss.isString(a))
        throw '参数错误, 无法确定要执行的动作!';

    var parts = a.split('.');
    var scope = null, fn = context.getAttribute(parts[0], javax.script.ScriptContext.ENGINE_SCOPE);
    for (var i = 1, n = parts.length, name; i < n; i++)
    {
        name = parts[i];
        if (name in fn)
        {
            scope = fn;
            fn = fn[name];
        }
        else
            throw '"' + parts.slice(0, i + 1).join('.') + '"未实现！';
    }

    if (!jss.isFunction(fn))
        throw '"' + a + '"未实现！';

    return fn.apply(scope, args);
}

//////////////////////////////////////////////////////////////////////////
function __service__(request, response, out) // 入口方法
{
    var sc = new ServiceContext(request, response, out);
    try
    {
        var action = sc.GetString('action');
        if (jss.isEmpty(action))
            throw '缺少参数(action)！';

        var result = sc.DoAction(jss.decode(action, false) || action);
        if (result != null && jss.isDefined(result))
            sc.print(result);
    }
    catch (e)
    {
        sc.print({ error: String(e) });
    }
    finally
    {
        ServiceContext.prototype.close.apply(sc);
    }
}