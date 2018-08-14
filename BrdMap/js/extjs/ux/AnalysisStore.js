Ext.define('Ext.data.AnalysisStore', {
	extend : 'Ext.data.Store',
	alternateClassName : 'Ext.AnalysisStore',
	queryid : '',
	oldQuery : '',
	triggerQueryBtnType : '',// 触发查询的按钮类型,query(查询按钮) or page(翻页按钮)
	totalProperty : 'recordCount',
	moveMax : 1,
	maxCache : 1,
	isEnd : false,
	recordCount : 0,
	// 页面中pageSize控件的值，当改变combo的时候，此值会改变
	comboPagesizeValue : null,
	countRequest:null,
	// 动态列
	dynamicColumns : [],
	constructor : function(config) {
		this.callParent([config]);
		this.changeMaxCache = function(page, bol) {
			this.maxCache = page;
			this.isEnd = bol;
			var b = 0;
			if (bol) {
				b = 1;
			}
			this.fireEvent('changeMaxCache', page, b);
		}
		this.updateInfo = function() {
			this.fireEvent('updateInfo');
		}
		this.addEvents({
					changeMaxCache : true,
					updateInfo : true
				});

	},
	load : function(options) {
		if (this.buffered&&brd.grid.gridObj) {
			brd.grid.gridObj.getSelectionModel().deselectAll();
		}
		this.callParent([options]);
	},
	loadPage : function(page, options) {
		var me = this;

		me.triggerQueryBtnType = 'page';
		me.currentPage = page;
		me.snapshot = null;
		if (me.moveMax < page) {
			me.moveMax = page;
		}
		// 触发工具栏按钮状态管理的开始查询事件
		if (brd.grid.toolbuttonStateManage) {
			brd.grid.toolbuttonStateManage.beginQuery(brd.grid.gridObj, me);
		}

		if (me.queryid != null && me.queryid.length > 0) {
			me.load({
						params : {
							queryid : me.queryid,
							currentPage : me.currentPage,
							pageSize:me.pageSize
						}
					});
		} else {
			options = Ext.apply({
						page : page,
						start : (page - 1) * me.pageSize,
						limit : me.pageSize,
						addRecords : !me.clearOnPageLoad
					}, options);

			if (me.buffered) {
				options.limit = me.viewSize || me.defaultViewSize;
				return me.loadToPrefetch(options);
			}
			me.read(options);
		}
	},
	loadToPrefetch : function(options) {
		var me = this, i, records, dataSetSize, prefetchOptions = options, startIdx = options.start, endIdx = options.start
				+ options.limit - 1, loadEndIdx = Math.min(endIdx,
				options.start + (me.viewSize || options.limit) - 1), startPage = me
				.getPageFromRecordIndex(Math.max(startIdx
								- me.trailingBufferZone, 0)), endPage = me
				.getPageFromRecordIndex(endIdx + me.leadingBufferZone),

		waitForRequestedRange = function() {
			if (me.rangeCached(startIdx, loadEndIdx)) {
				me.loading = false;
				records = me.data.getRange(startIdx, loadEndIdx);
				me.data.un('pageAdded', waitForRequestedRange);

				if (me.hasListeners.guaranteedrange) {
					me.guaranteeRange(startIdx, loadEndIdx, options.callback,
							options.scope);
				}
				if (options.callback) {
					options.callback.call(options.scope || me, records,
							startIdx, endIdx, options);
				}
				me.fireEvent('datachanged', me);
				me.fireEvent('refresh', me);
				me.fireEvent('load', me, records, true);
				if (options.groupChange) {
					me.fireGroupChange();
				}
			}
		};

		if (me.fireEvent('beforeload', me, options) !== false) {

			delete me.totalCount;

			me.loading = true;

			if (options.callback) {
				prefetchOptions = Ext.apply({}, options);
				delete options.callback;
			}

			me.on('prefetch', function(records, successful, operation) {

						if (successful) {

							if (dataSetSize = me.getTotalCount()) {

								me.data.on('pageAdded', waitForRequestedRange);

								loadEndIdx = Math.min(loadEndIdx, dataSetSize
												- 1);
								endPage = me.getPageFromRecordIndex(loadEndIdx);

								for (i = startPage + 1; i <= endPage; ++i) {
									me.prefetchPage(i, prefetchOptions);
								}
							} else {
								me.fireEvent('datachanged', me);
								me.fireEvent('refresh', me);
								me.fireEvent('load', me, records, true);
							}
						}

						else {
							me.fireEvent('load', me, records, false);
						}
					}, null, {
						single : true
					});

			me.prefetchPage(startPage, prefetchOptions);
		}
	},
	clean : function() {
		var me = this;
		me.recordCount = null;
		me.currentPage = 1;
		me.maxCache = 1;
		me.moveMax = 1;
		this.fireEvent('changeMaxCache', 1, 2);
		// me.changeMaxCache(1,2);
		me.updateInfo();
	},

	startLoad : function(queryid, pushThreadKey, iframeid, callBackFun) {
		var me = this;
		me.triggerQueryBtnType = 'query';
		me.queryid = queryid;
		var oldQueryId = me.oldQuery;
		me.cleanOldQuery(oldQueryId);
		me.oldQuery = queryid;
		me.snapshot = null;
		
		try{
			//清理列filter
			brd.grid.gridObj.columnFilterHeaderMenu.cfm.filters = {};
		}catch(ex){}
		
		me.clean();

		// 触发工具栏按钮状态管理的开始查询事件
		if (brd.grid.toolbuttonStateManage) {
			brd.grid.toolbuttonStateManage.beginQuery(brd.grid.gridObj, me);
		}

		if (me.comboPagesizeValue) {
			me.pageSize = Number(me.comboPagesizeValue);
			me.data.pageSize = Number(me.comboPagesizeValue);
			me.lastPageSize = Number(me.comboPagesizeValue);
		}

		me.load({
			scope : this,
			params : {
				queryid : queryid,
				currentPage : 1,
				iframeid : iframeid,
				pageSize : me.pageSize
			},
			callback : function(records, operation, success) {
				// 清理上次请求
				if (success) {
					var haveCount = false;
					eval("haveCount = typeof  me.proxy.reader.jsonData."
							+ me.totalProperty + "!='undefined'");
					if (haveCount) {
						var recordCount;
						eval("var recordCount =me.proxy.reader.jsonData."
								+ me.totalProperty);
						me.recordCount = parseInt(recordCount);
						me.updateInfo();
					} else {
						if (me.getTotalCount() > 0
								&& me.getTotalCount() >= me.pageSize
								&& (!me.isEnd || me.maxCache > 1)) {
								if(!Ext.isEmpty(me.isCountRows) && me.isCountRows=='0'){
									me.recordCount = me.statTotalSum;
									me.updateInfo();
								}else{
									me.countRequest = Ext.Ajax.request({
										url : APPBASE
												+ '/analysisController.do?method=count',
										method : 'POST',
										params : {
											queryid : queryid
										},
										success : function(response, option) {
											if(option.params.queryid==me.queryid){
												var recordCount = parseInt(Ext
													.decode(response.responseText).RecordCount);
											me.recordCount = recordCount;
											me.updateInfo();										
											}
										}
									});
								}
						} else {
							me.recordCount = me.getTotalCount();
							me.updateInfo();
						}
					}
				} else {
					me.clearData(true);
					// if(me.getProxy().xhr.isAborted){
					// Ext.Msg.alert('提示', '查询已终止!');
					// }else{
					// Ext.Msg.alert('提示', '数据查询出错!');
					// }
				}
				// 自定义回调函数
				if (callBackFun) {
					callBackFun(records, operation, success);
				}
			}
		});
	},
	// 清理上次查询
	cleanOldQuery : function(oldQueryId) {
		var me = this;
		// 如果未传递oldQueryId,则使用store存储的oldQueryid
		if (oldQueryId === undefined) {
			oldQueryId = me.oldQuery;
		}
		if(me.countRequest){
			Ext.Ajax.abort(me.countRequest);
		}
		if (oldQueryId != null && oldQueryId.length > 0) {
			Ext.Ajax.request({
				url : APPBASE + '/analysisController.do?method=clean',
				method : 'POST',
				params : {
					queryid : oldQueryId
				}
					// ,success : function(response, option) {}
				});
		}
	},
	onProxyPrefetch : function(operation) {
		var me = this, resultSet = operation.getResultSet(), records = operation
				.getRecords(), successful = operation.wasSuccessful(), page = operation.page;

		// Only cache the data if the operation was invoked for the current
		// generation of the page map.
		// If the generation has changed since the request was fired off, it
		// will have been cancelled.
		if (operation.generation === me.data.generation) {

			if (resultSet) {
				me.totalCount = resultSet.total;
				me.fireEvent('totalcountchange', me.totalCount);
			}

			// Remove the loaded page from the outstanding pages hash
			if (page !== undefined) {
				delete me.pageRequests[page];
			}

			// Prefetch is broadcast before the page is cached
			me.loading = false;
			me.fireEvent('prefetch', me, records, successful, operation);

			// Add the page into the page map.
			// pageAdded event may trigger the onGuaranteedRange
			if (successful) {
				// me.cachePage(records, operation.page);
				me.cachePage(records, 1);
			}

			// this is a callback that would have been passed to the 'read'
			// function and is optional
			Ext.callback(operation.callback, operation.scope || me, [records,
							operation, successful]);
			// 触发工具栏按钮状态管理的结束查询事件
			if (brd.grid.toolbuttonStateManage) {
				brd.grid.toolbuttonStateManage.endQuery(brd.grid.gridObj, me);
			}
		}
	},
	getRecordCount : function() {
		return this.recordCount;
	},
	setRecordCount : function(count) {
		if (this.getCount() <= count) {
			this.recordCount = count;
			this.updateInfo();
		}
	}
		// ,callParent : function(args, level) {
		// // NOTE: this code is deliberately as few expressions (and no
		// function
		// // calls)
		// // as possible so that a debugger can skip over this noise with the
		// // minimum number
		// // of steps. Basically, just hit Step Into until you are where you
		// // really wanted
		// // to be.
		// if (typeof level == 'undefined') {
		// level = 1;
		// }
		// var superclassstr = "superclass";
		// for (var i = 1; i < level; i++) {
		// superclassstr += ".superclass";
		// }
		// var method, superMethod;
		// eval(" superMethod = (method = this.callParent.caller)&&
		// (method.$previous || ((method = method.$owner? method :
		// method.caller) && method.$owner."
		// + superclassstr + "[method.$name]))");
		//
		// if (!superMethod) {
		// method = this.callParent.caller;
		// var parentClass, methodName;
		//
		// if (!method.$owner) {
		// if (!method.caller) {
		// throw new Error("Attempting to call a protected method from the
		// public scope, which is not allowed");
		// }
		//
		// method = method.caller;
		// }
		//
		// parentClass = method.$owner.superclass;
		// methodName = method.$name;
		//
		// if (!(methodName in parentClass)) {
		// throw new Error("this.callParent() was called but there's no such
		// method (" + methodName +
		// ") found in the parent class (" + (Ext.getClassName(parentClass) ||
		// 'Object') + ")");
		// }
		// }
		// //</debug>
		//
		// return superMethod.apply(this, args || noArgs);
		// }
});