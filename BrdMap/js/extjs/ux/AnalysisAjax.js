Ext.define('Ext.data.proxy.AnalysisAjax', {
	extend : 'Ext.data.proxy.Ajax',
	alternateClassName : 'Ext.AnalysisAjax',
	processResponse: function(success, operation, request, response, callback, scope) {
        var me = this,
            reader,
            result;

        if (success === true) {
            reader = me.getReader();
			if(me.responseCallBack){
				me.responseCallBack(response);
			}
            // Apply defaults to incoming data only for read operations.
            // For create and update, there will already be a client-side record
            // to match with which will contain any defaulted in values.
            reader.applyDefaults = operation.action === 'read';

            result = reader.read(me.extractResponseData(response));

            if (result.success !== false) {
                //see comment in buildRequest for why we include the response object here
                Ext.apply(operation, {
                    response: response,
                    resultSet: result
                });

                operation.commitRecords(result.records);
                operation.setCompleted();
                operation.setSuccessful();
            } else {
            	try{
	            	var res = Ext.decode(response.responseText);
	            	if(res && res.iserror){
	            		Ext.Msg.alert("出错提示",res.msg);
	            	}
            	}catch(ex){}
                operation.setException(result.message);
                me.fireEvent('exception', this, response, operation);
            }
        } else {
        	try{
            	var res = Ext.decode(response.responseText);
            	if(res && !res.success && res.iserror){
            		Ext.Msg.alert("出错提示",res.msg);
            	}
        	}catch(ex){}
            me.setException(operation, response);
            me.fireEvent('exception', this, response, operation);
        }

        //this callback is the one that was passed to the 'read' or 'write' function above
        if (typeof callback == 'function') {
            callback.call(scope || me, operation);
        }

        me.afterRequest(request, success);
    },
	doRequest: function(operation, callback, scope) {
        var writer  = this.getWriter(),
            request = this.buildRequest(operation);
            
        if (operation.allowWrite()) {
            request = writer.write(request);
        }
        
        Ext.apply(request, {
            binary        : this.binary,
            headers       : this.headers,
            timeout       : this.timeout,
            scope         : this,
            callback      : this.createRequestCallback(request, operation, callback, scope),
            method        : this.getMethod(request),
            disableCaching: false // explicitly set it to false, ServerProxy handles caching
        });
        
       var ajaxRequest = Ext.Ajax.request(request);
       //��д����ajax�������
        if(typeof ajaxRequest !='undefined'&&typeof ajaxRequest.xhr!='undefined'){
        	this.xhr = ajaxRequest.xhr;
        }
        return request;
    }
    ,abort: function(){//�����ֹ����
       this.xhr.abort();
    }
});