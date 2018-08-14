
/**
 * 格式化时间数字显示
 * @param {} time
 * @return {}
 */
function formatUsetimeHtml(time){
	if(time < 10) time = '0'+time;
	return '<font color="red"><b>'+time+'</b></font>';
}
//验证方法重写，之前判断null空数据时会出错
Ext.form.field.Text.override({
	getErrors: function(value) {
        var me = this,
            errors=[],
            validator = me.validator,
            vtype = me.vtype,
            vtypes = Ext.form.field.VTypes,
            regex = me.regex,
            format = Ext.String.format,
            msg, trimmed, isBlank;

        value = value || me.processRawValue(me.getRawValue());

        if (Ext.isFunction(validator)) {
            msg = validator.call(me, value);
            if (msg !== true) {
                errors.push(msg);
            }
        }
        
        trimmed = me.allowOnlyWhitespace ? value : Ext.String.trim(value);
        if (value===null || (value === me.emptyText && me.valueContainsPlaceholder) || trimmed.length < 1) {
            if (!me.allowBlank) {
                errors.push(me.blankText);
            }
            // If we are not configured to validate blank values, there cannot be any additional errors
            if (!me.validateBlank) {
                return errors;
            }
            isBlank = true;
        }

        // If a blank value has been allowed through, then exempt it dfrom the minLength check.
        // It must be allowed to hit the vtype validation.
        if (!isBlank && value.length < me.minLength) {
            errors.push(format(me.minLengthText, me.minLength));
        }

        if (value.length > me.maxLength) {
            errors.push(format(me.maxLengthText, me.maxLength));
        }

        if (vtype) {
            if (!vtypes[vtype](value, me)) {
                errors.push(me.vtypeText || vtypes[vtype +'Text']);
            }
        }

        if (regex && (typeof regex == "object" ? !regex.test(value) : !new RegExp(regex).test(value))) {
            errors.push(me.regexText || me.invalidText);
        }

        return errors;
    }
});
/**
 * 重写EXTJS组件Ext.dom.Element,实现显示查询已用时间by hh
 */
/*Ext.override(Ext.dom.Element,{
	mask : function(msg, msgCls, elHeight) {
			window.top.slGridDiv && (window.top.slGridDiv.style.zIndex = 1);
            var me            = this;
            var id = 'mask'+new Date().getTime();
             //添加用时html
			if(msgCls && msgCls==='loadUseTime'){
				msg += '<br>已用时 <span id="'+id+'">'+formatUsetimeHtml(0)+' 秒</span>';
            }
            var maskEl = me.callParent(arguments);
            //添加用时html
			if(msgCls && msgCls==='loadUseTime'){
				maskEl.usetimeId = id;
				maskEl.usetimeTotal = 0;
				maskEl.usetimeInterval = setInterval(function() {
					var el = document.getElementById(maskEl.usetimeId);
					if(!el){
						clearInterval(maskEl.usetimeInterval);
					}
					if(typeof maskEl.usetimeTotal == 'undefined'){
						maskEl.usetimeTotal = 0;
					}else{
						maskEl.usetimeTotal++;
					}
					var t = maskEl.usetimeTotal;
					if (t > 3600) {
						el.innerHTML = formatUsetimeHtml(Math.floor(t / 3600)) + ' 时 ' 
							+ formatUsetimeHtml(Math.floor(t % 3600 / 60)) + ' 分 ' + formatUsetimeHtml(t % 60) + ' 秒 ';
					} else if (t >= 60) {
						el.innerHTML = formatUsetimeHtml(Math.floor(t / 60)) + ' 分 ' + formatUsetimeHtml(t % 60) + ' 秒';
					} else {
						el.innerHTML = formatUsetimeHtml(t) + ' 秒';
					}
				}, 1000);
            }
            return maskEl;
        },
        unmask : function() {
        	var me      = this,
                data    = (me.$cache || me.getCache()).data,
                maskEl  = data.maskEl;
        	if(maskEl && maskEl.usetimeInterval){
        		clearInterval(maskEl.usetimeInterval);
        	}
        	me.callParent(arguments);
        }
});*/
/**
 * 重写EXTJS组件Ext.LoadMask,实现显示查询已用时间by hh
 */
/*Ext.override(Ext.LoadMask,{
	onShow: function() {
        var me = this,
        	mask = this,
            msgEl = me.msgEl;

        me.callParent(arguments);
        me.loading = true;

        if (me.useMsg) {
            msgEl.show();
            me.msgTextEl.update(me.msg);
            if(me.usetimeId){
	            mask.usetimeTotal = 0;
				mask.usetimeInterval = setInterval(function() {
					try{
						var el = document.getElementById(me.usetimeId);
						if(typeof mask.usetimeTotal == 'undefined'){
							mask.usetimeTotal = 0;
						}else{
							mask.usetimeTotal++;
						}
						var t = mask.usetimeTotal;
						if (t > 3600) {
							el.innerHTML = formatUsetimeHtml(Math.floor(t / 3600)) + ' 时 ' 
								+ formatUsetimeHtml(Math.floor(t % 3600 / 60)) + ' 分 ' + formatUsetimeHtml(t % 60) + ' 秒 ';
						} else if (t >= 60) {
							el.innerHTML = formatUsetimeHtml(Math.floor(t / 60)) + ' 分 ' + formatUsetimeHtml(t % 60) + ' 秒';
						} else {
							el.innerHTML = formatUsetimeHtml(t) + ' 秒';
						}
					}catch(e){
						console.log(e);
						clearInterval(mask.usetimeInterval);
					}
				}, 1000);
            }
        } else {
            msgEl.parent().hide();
        }
    },
    onHide: function() {
        this.callParent();
        this.getMaskEl().hide();
        if(this.usetimeId) clearInterval(this.usetimeInterval);
    },
	constructor: function(config) {
		var me = this;
        if (arguments.length === 2) {
            config = arguments[1];
        }
		if(config.msgCls && config.msgCls==="noneloadUseTime"){
        	
        }else{
        	var id = 'mask'+new Date().getTime();
        	me.usetimeId = id;
        	if(!config.msg || config.msg.indexOf('Loading')==0){
        		config.msg = "正在加载中......";
        	}
        	config.msg += '<br>已用时 <span id="'+id+'">'+formatUsetimeHtml(0)+' 秒</span>';
        	if (arguments.length === 2){
	        	arguments[1] = config;
	        }
        }
        me.callParent(arguments);
        
    }
});*/
// 修复Bug：锁定列问题
Ext.override(Ext.selection.Model, {
	storeHasSelected	: function(record) {
		var store = this.store, records, len, id, i;

		if (record.hasId() && store.getById(record)) {
			return true;
		} else {
			records = store.data.items;

			// 添加这段代码修复锁定列的bug
			if (records === undefined) {
				return false;
			}

			len = records.length;
			id = record.internalId;

			for (i = 0; i < len; ++i) {
				if (id === records[i].internalId) {
					return true;
				}
			}
		}
		return false;
	}
});
/**
 * 修复Bug：每页显示数据由多转少的时候，在mouseover等事件的时候找不到对应的Record索引,修改为默认为最后一条
 * by hh 2014-01-10
 */
Ext.override(Ext.view.Table, {
	getRecord: function(node) {
        node = this.getNode(node);
        if (node) {
            var recordIndex = node.getAttribute('data-recordIndex');
            if (recordIndex) {
                recordIndex = parseInt(recordIndex, 10);
                if (recordIndex > -1) {
                    if(this.store.data.getCount()<recordIndex+1){
                        recordIndex = this.store.data.getCount()-1;
                        node.setAttribute('data-recordIndex',recordIndex);
                    }
                    // The index is the index in the original Store, not in a GroupStore
                    // The Grouping Feature increments the index to skip over unrendered records in collapsed groups
                    return this.store.data.getAt(recordIndex);
                }
            }
            return this.dataSource.data.get(node.getAttribute('data-recordId'));
        }
    }
});

// 修复Bug：排序问题
Ext.panel.Table.override({
	initComponent	: function() {
		if (!this.viewType) {
			Ext.Error.raise("You must specify a viewType config.");
		}
		if (this.headers) {
			Ext.Error.raise("The headers config is not supported. Please specify columns instead.");
		}

		var me = this, headerCtCfg = me.columns || me.colModel, view, i, len,
		// Look up the configured Store. If none configured, use the fieldless, empty Store defined in Ext.data.Store.
		store = me.store = Ext.data.StoreManager.lookup(me.store || 'ext-empty-store');

		if (me.columnLines) {
			me.addCls(me.colLinesCls);
		}

		if (me.rowLines) {
			me.addCls(me.rowLinesCls);
		}

		if (!headerCtCfg) {
			Ext.Error.raise("A column configuration must be specified");
		}

		// The columns/colModel config may be either a fully instantiated HeaderContainer, or an array of Column
		// definitions, or a config object of a HeaderContainer
		// Either way, we extract a columns property referencing an array of Column definitions.
		if (headerCtCfg instanceof Ext.grid.header.Container) {
			me.headerCt = headerCtCfg;
			me.headerCt.isRootHeader = true;
			me.columns = me.headerCt.items.items;
		} else {
			if (Ext.isArray(headerCtCfg)) {
				headerCtCfg = {
					items	: headerCtCfg
				};
			}
			Ext.apply(headerCtCfg, {
				forceFit			: me.forceFit,
				sortable			: me.sortableColumns,
				enableColumnMove	: me.enableColumnMove,
				enableColumnResize	: me.enableColumnResize,
				sealed				: me.sealedColumns,
				isRootHeader		: true
			});

			if (Ext.isDefined(me.enableColumnHide)) {
				headerCtCfg.enableColumnHide = me.enableColumnHide;
			}

			me.columns = headerCtCfg.items;

			// If any of the Column objects contain a locked property, and are not processed, this is a lockable
			// TablePanel, a
			// special view will be injected by the Ext.grid.locking.Lockable mixin, so no processing of .
			if (me.enableLocking || me.hasLockedColumns(me.columns)) {
				me.self.mixin('lockable', Ext.grid.locking.Lockable);
				me.injectLockable();
			}
		}

		me.scrollTask = new Ext.util.DelayedTask(me.syncHorizontalScroll, me);

		me.addEvents(
				// documented on GridPanel
				'reconfigure',
				/**
				 * @event viewready Fires when the grid view is available (use this for selecting a default row).
				 * @param {Ext.panel.Table}
				 *            this
				 */
				'viewready');

		me.bodyCls = me.bodyCls || '';
		me.bodyCls += (' ' + me.extraBodyCls);

		me.cls = me.cls || '';
		me.cls += (' ' + me.extraBaseCls);

		// autoScroll is not a valid configuration
		delete me.autoScroll;

		// If this TablePanel is lockable (Either configured lockable, or any of the defined columns has a 'locked'
		// property)
		// than a special lockable view containing 2 side-by-side grids will have been injected so we do not need to set
		// up any UI.
		if (!me.hasView) {

			// If we were not configured with a ready-made headerCt (either by direct config with a headerCt property,
			// or by passing
			// a HeaderContainer instance as the 'columns' property, then go ahead and create one from the config object
			// created above.
			if (!me.headerCt) {
				me.headerCt = new Ext.grid.header.Container(headerCtCfg);
			}

			// Extract the array of Column objects
			me.columns = me.headerCt.items.items;

			// 这段代码被我删掉了
			// If the Store is paging blocks of the dataset in, then it can only be sorted remotely.
			// if (store.buffered && !store.remoteSort) {
			// for (i = 0, len = me.columns.length; i < len; i++) {
			// me.columns[i].sortable = false;
			// }
			// }

			if (me.hideHeaders) {
				me.headerCt.height = 0;
				// don't se the hidden property, we still need these to layout
				me.headerCt.hiddenHeaders = true;
				me.headerCt.addCls(me.hiddenHeaderCtCls);
				me.addCls(me.hiddenHeaderCls);
				// IE Quirks Mode fix
				// If hidden configuration option was used, several layout calculations will be bypassed.
				if (Ext.isIEQuirks) {
					me.headerCt.style = {
						display	: 'none'
					};
				}
			}

			me.relayHeaderCtEvents(me.headerCt);
			me.features = me.features || [];
			if (!Ext.isArray(me.features)) {
				me.features = [me.features];
			}
			me.dockedItems = [].concat(me.dockedItems || []);
			me.dockedItems.unshift(me.headerCt);
			me.viewConfig = me.viewConfig || {};

			// AbstractDataView will look up a Store configured as an object
			// getView converts viewConfig into a View instance
			view = me.getView();

			me.items = [view];
			me.hasView = true;

			// Add a listener to synchronize the horizontal scroll position of the headers
			// with the table view's element... Unless we are not showing headers!
			if (!me.hideHeaders) {
				view.on({
					scroll	: {
						fn		: me.onHorizontalScroll,
						element	: 'el',
						scope	: me
					}
				});
			}

			// Attach this Panel to the Store
			me.bindStore(store, true);

			me.mon(view, {
				viewready	: me.onViewReady,
				refresh		: me.onRestoreHorzScroll,
				scope		: me
			});
		}

		// Relay events from the View whether it be a LockingView, or a regular GridView
		me.relayEvents(me.view, ['beforeitemmousedown', 'beforeitemmouseup', 'beforeitemmouseenter', 'beforeitemmouseleave', 'beforeitemclick',
						'beforeitemdblclick', 'beforeitemcontextmenu', 'itemmousedown', 'itemmouseup', 'itemmouseenter', 'itemmouseleave',
						'itemclick', 'itemdblclick', 'itemcontextmenu', 'beforecellclick', 'cellclick', 'beforecelldblclick', 'celldblclick',
						'beforecellcontextmenu', 'cellcontextmenu', 'beforecellmousedown', 'cellmousedown', 'beforecellmouseup', 'cellmouseup',
						'beforecellkeydown', 'cellkeydown', 'beforecontainermousedown', 'beforecontainermouseup', 'beforecontainermouseover',
						'beforecontainermouseout', 'beforecontainerclick', 'beforecontainerdblclick', 'beforecontainercontextmenu',
						'containermouseup', 'containermouseover', 'containermouseout', 'containerclick', 'containerdblclick', 'containercontextmenu',
						'selectionchange', 'beforeselect', 'select', 'beforedeselect', 'deselect']);

		me.callSuper(arguments);
		me.addStateEvents(['columnresize', 'columnmove', 'columnhide', 'columnshow', 'sortchange', 'filterchange']);

		// If lockable, the headerCt is just a collection of Columns, not a Container
		if (!me.lockable && me.headerCt) {
			me.headerCt.on('afterlayout', me.onRestoreHorzScroll, me);
		}
	}
});

// 修复Bug：排序问题
Ext.data.Store.override({
	constructor		: function(config) {
		config = Ext.apply({}, config);

		var me = this, groupers = config.groupers || me.groupers, groupField = config.groupField || me.groupField, proxy, data;

		data = config.data || me.data;

		if (data) {
			me.inlineData = data;
			delete config.data;
		}

		if (!groupers && groupField) {
			groupers = [{
				property	: groupField,
				direction	: config.groupDir || me.groupDir
			}];
		}
		delete config.groupers;

		me.groupers = new Ext.util.MixedCollection(false, Ext.data.Store.grouperIdFn);
		if (groupers !== undefined) {
			me.groupers.addAll(me.decodeGroupers(groupers));
		}

		me.groups = new Ext.util.MixedCollection(false, Ext.data.Store.groupIdFn);

		me.callSuper([config]);

		// 若为缓冲Grid
		if (me.buffered) {
			me.data = new me.PageMap({
				store		: me,
				keyFn		: Ext.data.Store.recordIdFn,
				pageSize	: me.pageSize,
				maxSize		: me.purgePageCount,
				listeners	: {
					clear	: me.onPageMapClear,
					scope	: me
				}
			});
			me.pageRequests = {};

			// 设置remoteSort、remoteGroup、remoteFilter为配置的值
			// 修改这里是因为会影响排序（菜单）的显示
			me.remoteSort = config.remoteSort;
			me.remoteGroup = config.remoteGroup;
			me.remoteFilter = config.remoteFilter;

			me.sortOnLoad = false;
			me.filterOnLoad = false;
		} else {
			me.data = new Ext.util.MixedCollection({
				getKey			: Ext.data.Store.recordIdFn,
				maintainIndices	: true
			});
			me.data.pageSize = me.pageSize;
		}

		if (me.remoteGroup) {
			me.remoteSort = true;
		}

		proxy = me.proxy;
		data = me.inlineData;

		if (!me.buffered && !me.pageSize) {
			me.pageSize = me.defaultPageSize;
		}

		if (data) {
			if (proxy instanceof Ext.data.proxy.Memory) {
				proxy.data = data;
				me.read();
			} else {
				me.add.apply(me, [data]);
			}

			if (!me.remoteSort) {
				me.sort();
			}
			delete me.inlineData;
		} else if (me.autoLoad) {
			Ext.defer(me.load, 1, me, [typeof me.autoLoad === 'object' ? me.autoLoad : undefined]);
		}

		if (me.groupers.items.length && !me.remoteGroup) {
			me.group(null, null, true);
		}
	},
	constructGroups	: function() {
		var me = this, data = this.data.items,
		// 修改这里,获取length错误
		len = data ? data.length : 0, groups = me.groups, groupValue, i, group, rec;

		groups.clear();

		for (i = 0; i < len; ++i) {
			rec = data[i];
			groupValue = me.getGroupString(rec);
			group = groups.get(groupValue);
			if (!group) {
				group = new Ext.data.Group({
					key		: groupValue,
					store	: me
				});
				groups.add(groupValue, group);
			}
			group.add(rec);
		}
	},
	// 排序
	doSort : function(sorterFn) {
		var me = this, range, ln, i;

		if (me.remoteSort) {
			if (me.buffered) {
				me.data.clear();
				me.loadPage(1);
			} else {
				me.load();
			}
		} else {
			if (me.buffered) {
				if (me.data.last != null) {
					Ext.Array.sort(me.data.getPage(me.data.last.key), sorterFn);
				}
			} else {
				me.data.sortBy(sorterFn);
			}
			if (!me.buffered) {
				range = me.getRange();
				ln = range.length;
				for (i = 0; i < ln; i++) {
					range[i].index = i;
				}
			}
			me.fireEvent('datachanged', me);
			me.fireEvent('refresh', me);
		}
	},
	// 解决过滤问题
	filterBy		: function(fn, scope) {
		var me = this;

		me.snapshot = me.snapshot || me.data.clone();
		if (me.buffered) {
			// 若没有数据，则直接返回
			if (!me.data.map['1'] || me.data.map['1'].value.length == 0) {
				return;
			}

			// 调用pageMap的filterBy方法进行过滤
			me.data = me.data.filterBy(fn, scope || me);
			me.data.pageSize = me.pageSize;
			me.snapshot.pageSize = me.pageSize;

			// 设置总记录数
			me.totalCount = me.data.map['1'] ? me.data.map['1'].value.length : 0;
			// me.recordCount = me.totalCount;

			// 设置view的startIndex和endIndex,解决获取数据呈现时的问题
			me.lastRequestStart = 0;
			var lastIndex = Math.max(me.totalCount - 1, 0);
			brd.grid.gridObj.view.lockedView.all.endIndex = lastIndex;
			brd.grid.gridObj.view.normalView.all.endIndex = lastIndex;
			brd.grid.gridObj.view.lockedView.all.startIndex = 0;
			brd.grid.gridObj.view.normalView.all.startIndex = 0;

			// 触发刷新事件
			me.fireEvent('datachanged', me);
			me.fireEvent('refresh', me);

			// 滚动条置顶
			if (me.totalCount > 0) {
				brd.grid.gridObj.view.lockedView.bufferedRenderer.scrollTo(0);
			}
		} else {
			me.data = me.queryBy(fn, scope || me);
			me.fireEvent('datachanged', me);
			me.fireEvent('refresh', me);
		}
	}
});

// //修复Bug：排序问题
Ext.util.Sorter.override({
	constructor	: function(config) {
		var me = this;

		Ext.apply(me, config);

		if (me.property === undefined && me.sorterFn === undefined) {
			// Ext.Error.raise("A Sorter requires either a property or a sorter function");
		}

		me.updateSortFunction();
	}
});

// 修复Bug：排序问题
Ext.AbstractManager.override({
	register	: function(item) {
		var all = this.all, key = all.getKey(item);

		if (all.containsKey(key)) {
			// Ext.Error.raise('Registering duplicate id "' + key + '" with this manager');
			return;
		}
		this.all.add(item);
	}
});

//实现多列排序功能：调整header单击事件与排序的处理顺序
Ext.grid.column.Column.override({
	onElClick: function(e, t) {
        // The grid's docked HeaderContainer.
        var me = this,
            ownerHeaderCt = me.getOwnerHeaderCt();

        if (ownerHeaderCt && !ownerHeaderCt.ddLock) {
            // Firefox doesn't check the current target in a within check.
            // Therefore we check the target directly and then within (ancestors)
            if (me.triggerEl && (e.target === me.triggerEl.dom || t === me.triggerEl.dom || e.within(me.triggerEl))) {
                ownerHeaderCt.onHeaderTriggerClick(me, e, t);
            // if its not on the left hand edge, sort
            } else if (e.getKey() || (!me.isOnLeftEdge(e) && !me.isOnRightEdge(e))) {
            	//多列排序修改事件触发顺序
				var tablePanel = this.up('tablepanel');
		        var store = null;
		        if(tablePanel){
		        	store = tablePanel.store;
		        }
		        if(store && store.mySorterManager){
		        	ownerHeaderCt.onHeaderClick(me, e, t);
		        	//触发单击事件后再触发排序事件
		        	me.toggleSortState();
		        }else{
		        	me.toggleSortState();
		        	ownerHeaderCt.onHeaderClick(me, e, t);
		        }
            }
        }
    }
});


//实现多列排序功能
Ext.grid.column.Column.override({
	doSort: function(state) {
		var me = this,
       		tablePanel = me.up('tablepanel'),
            store = tablePanel.store;

        // If the owning Panel's store is a NodeStore, this means that we are the unlocked side
        // of a locked TreeGrid. We must use the TreeStore's sort method because we cannot
        // reorder the NodeStore - that would break the tree.
        if (tablePanel.ownerLockable && store.isNodeStore) {
            store = tablePanel.ownerLockable.lockedGrid.store;
        }
        
        //多列排序
        if(store.mySorterManager){
        	var st = {property:me.dataIndex, direction: state,caption:me.text};
        	var sm = store.mySorterManager;
        	var sorters = sm.sorters;
        	if(!sm.sorters){
	        	sm.sorters = [];
	        }
	        
        	if(sm.mutipleSort){
				if(sm.sorters.length == 0){
					sm.mutipleSort = false;
					sm.sorters = [st];
        			store.sort(st);
				}else{
					var flag = true;
					for(var i = 0;i<sm.sorters.length;i++){
						if(sm.sorters[i].property == st.property){
							flag = false;
							sm.sorters[i] = st;
							break;
						}
					}
					if(flag){
						sm.sorters.push(st);
					}
	        		store.sort(sm.sorters);
				}
        	}else{
        		sm.sorters = [st];
        		store.sort(st);
        	}
        }else{
	        store.sort({
	            property: this.getSortParam(),
	            direction: state
	        });
        }
    }
});


//实现多列排序功能：清除其他状态
Ext.grid.header.Container.override({
	clearOtherSortStates: function(activeHeader) {
        var headers   = this.getGridColumns(),
            headersLn = headers.length,
            i         = 0;
		var storeCt   = this.up('[store]'),
			store	  = null;
		if(storeCt){
			store = storeCt.store;
		}
		//若使用了我们自己定义的排序
        if(store && store.mySorterManager){
        	if(!store.mySorterManager.mutipleSort){
		        for (; i < headersLn; i++) {
		            if (headers[i] !== activeHeader) {
		            	//headers[i].removeCls([headers[i].ascSortCls, headers[i].descSortCls]);
		            	headers[i].setSortState(null, true);
		            }
		        }
        	}
        }else{
        	for (; i < headersLn; i++) {
	            if (headers[i] !== activeHeader) {
	                // unset the sortstate and dont recurse
	                headers[i].setSortState(null, true);
	            }
	        }
        }
    }
});

// 扩展Ext.data.Store下的PageMap，添加一个filterBy方法
Ext.apply(Ext.data.Store.prototype.PageMap.prototype, {
	filterBy	: function(fn, scope) {
		var me = this, newDatas = new Array(),

		datas = me.map['1'] ? me.map['1'].value : [], length = datas.length, i;
		if (length > 0) {
			for (i = 0; i < length; i++) {
				if (fn.call(scope || me, datas[i], i)) {
					newDatas.push(datas[i]);
				}
			}

			me.map['1'].value = newDatas;
		}
		return me;
	}
});

Ext.grid.plugin.BufferedRenderer.override({
	init				: function(grid) {
		var me = this, view = grid.view, viewListeners = {
			scroll		: {
				fn		: me.onViewScroll,
				element	: 'el',
				scope	: me
			},
			boxready	: me.onViewResize,
			resize		: me.onViewResize,
			refresh		: me.onViewRefresh,
			scope		: me,
			destroyable	: true
		};

		// If we are using default row heights, then do not sync row heights for efficiency
		if (!me.variableRowHeight && grid.ownerLockable) {
			grid.ownerLockable.syncRowHeight = false;
		}

		// If we are going to be handling a NodeStore then it's driven by node addition and removal, *not* refreshing.
		// The view overrides required above change the view's onAdd and onRemove behaviour to call onDataRefresh when
		// necessary.
		if (grid.isTree || grid.ownerLockable && grid.ownerLockable.isTree) {
			view.blockRefresh = false;
			view.loadMask = true;
		}
		if (view.positionBody) {
			viewListeners.refresh = me.onViewRefresh;
		}
		me.grid = grid;
		me.view = view;
		view.bufferedRenderer = me;
		view.preserveScrollOnRefresh = true;

		me.bindStore(view.dataSource);
		view.getViewRange = function() {
			return me.getViewRange();
		};

		me.position = 0;

		me.gridListeners = grid.on('reconfigure', me.onReconfigure, me);
		me.viewListeners = view.on(viewListeners);
	},
	/**
	 * 重写方法,修改有缓存store情况下,翻页时后面页码数据比前面页码数据少时显示为空BUG
	 * by hh 2014-01-08
	 * @return {}
	 */
	getViewRange: function() {
        var me = this,
            rows = me.view.all,
            store = me.store;
        if (store.data.getCount()) {
        	var tmpEnd = rows.startIndex + (me.viewSize || me.store.defaultViewSize) - 1;
        	if(tmpEnd > store.data.getCount()){
        		tmpEnd = store.data.getCount();
        		rows.startIndex = tmpEnd - (me.viewSize || me.store.defaultViewSize);
        		rows.startIndex = Math.max(0, rows.startIndex);
        	}
            return store.getRange(rows.startIndex, tmpEnd);
        } else {
            return [];
        }
    },
	/**
	 * Scrolls to and optionlly selects the specified row index **in the total dataset**.
	 * 
	 * @param {Number}
	 *            recordIdx The zero-based position in the dataset to scroll to.
	 * @param {Boolean}
	 *            doSelect Pass as `true` to select the specified row.
	 * @param {Function}
	 *            callback A function to call when the row has been scrolled to.
	 * @param {Number}
	 *            callback.recordIdx The resulting record index (may have changed if the passed index was outside the
	 *            valid range).
	 * @param {Ext.data.Model}
	 *            callback.record The resulting record from the store.
	 * @param {Object}
	 *            scope The scope (`this` reference) in which to execute the callback. Defaults to this
	 *            BufferedRenderer.
	 * 
	 */
	scrollTo			: function(recordIdx, doSelect, callback, scope) {
		var me = this, view = me.view, viewDom = view.el.dom, store = me.store, total = store.buffered ? store.getTotalCount() : store.getCount(), startIdx, endIdx, targetRec, targetRow, tableTop;

		// Sanitize the requested record
		recordIdx = Math.min(Math.max(recordIdx, 0), total - 1);

		// Calculate view start index
		startIdx = Math.max(Math.min(recordIdx - ((me.leadingBufferZone + me.trailingBufferZone) / 2), total - me.viewSize + 1), 0);
		tableTop = startIdx * me.rowHeight;
		endIdx = Math.min(startIdx + me.viewSize - 1, total - 1);

		store.getRange(startIdx, endIdx, {
			callback	: function(range, start, end) {

				me.renderRange(start, end, true);

				targetRec = store.data.getRange(recordIdx, recordIdx)[0];
				targetRow = view.getNode(targetRec, false);
				view.body.dom.style.top = tableTop + 'px';
				me.position = me.scrollTop = viewDom.scrollTop = tableTop = Math.min(Math.max(0, tableTop - view.body.getOffsetsTo(targetRow)[1]),
						viewDom.scrollHeight - viewDom.clientHeight);

				// https://sencha.jira.com/browse/EXTJSIV-7166 IE 6, 7 and 8 won't scroll all the way down first time
				if (Ext.isIE) {
					viewDom.scrollTop = tableTop;
				}
				if (doSelect) {
					view.selModel.select(targetRec);
				}
				if (callback) {
					callback.call(scope || me, recordIdx, targetRec);
				}
			}
		});
	},

	onViewScroll		: function(e, t) {
		var me = this, vscrollDistance, scrollDirection, scrollTop = me.view.el.dom.scrollTop;
		// Flag set when the scrollTop is programatically set to zero upon cache clear.
		// We must not attempt to process that as a scroll event.
		if (me.ignoreNextScrollEvent) {
			me.ignoreNextScrollEvent = false;
			return;
		}

		// Only check for nearing the edge if we are enabled.
		// If there is no paging to be done (Store's dataset is all in memory) we will be disabled.
		if (!me.disabled) {

			vscrollDistance = scrollTop - me.position;
			scrollDirection = vscrollDistance > 0 ? 1 : -1;
			me.scrollTop = scrollTop;

			// Moved at leat 20 pixels, or cvhanged direction, so test whether the numFromEdge is triggered
			if (Math.abs(vscrollDistance) >= 20 || (scrollDirection !== me.lastScrollDirection)) {
				me.position = scrollTop;
				me.lastScrollDirection = scrollDirection;
				me.handleViewScroll(me.lastScrollDirection);
			}
		}
	},

	handleViewScroll	: function(direction) {
		var me = this, rows = me.view.all, store = me.store, viewSize = me.viewSize, totalCount = (store.buffered ? store.getTotalCount() : store
				.getCount()), requestStart, requestEnd;

		// Only process if the total rows is larger than the visible page size
		if (totalCount >= viewSize) {

			// We're scrolling up
			if (direction == -1) {

				// If table starts at record zero, we have nothing to do
				if (rows.startIndex) {
					if ((me.getFirstVisibleRowIndex() - rows.startIndex) < me.numFromEdge) {
						requestStart = Math.max(0, me.getLastVisibleRowIndex() + me.trailingBufferZone - viewSize);
					}
				}
			}
			// We're scrolling down
			else {

				// If table ends at last record, we have nothing to do
				if (rows.endIndex < totalCount - 1) {
					if ((rows.endIndex - me.getLastVisibleRowIndex()) < me.numFromEdge) {
						requestStart = Math.max(0, me.getFirstVisibleRowIndex() - me.trailingBufferZone);
					}
				}
			}

			// We scrolled close to the edge and the Store needs reloading
			if (requestStart !== undefined) {
				requestEnd = Math.min(requestStart + viewSize - 1, totalCount - 1);

				// If calculated view range has moved, then render it
				if (requestStart !== rows.startIndex || requestEnd !== rows.endIndex) {
					me.renderRange(requestStart, requestEnd);
				}
			}
		}
	},
	onViewResize		: function(view, width, height, oldWidth, oldHeight) {
		// Only process first layout (the boxready event) or height resizes.
		if (!oldHeight || height !== oldHeight) {
			var me = this, newViewSize, scrollRange;

			// View has rows, delete the rowHeight property to trigger a recalculation when scrollRange is calculated
			if (view.all.getCount()) {
				// We need to calculate the table size based upon the new viewport size and current row height
				delete me.rowHeight;
			}
			// If no rows, continue to use the same rowHeight, and the refresh handler will call this again.

			// Calculates scroll range. Also calculates rowHeight if we do not have an own rowHeight property.
			// That will be the case if the view contains some rows.
			scrollRange = me.getScrollHeight();
			newViewSize = 70;
			newViewSize = Math.ceil(height / me.rowHeight) + me.trailingBufferZone + me.leadingBufferZone;
			// 默认viewSize=70
			me.viewSize = me.setViewSize(newViewSize);
			me.stretchView(view, scrollRange);
		}
	},
	renderRange			: function(start, end, forceSynchronous) {
		var me = this, store = me.store;

		// If range is avaliable synchronously, process it now.
		if (store.rangeCached(start, end)) {
			me.cancelLoad();

			if (me.synchronousRender || forceSynchronous) {
				me.onRangeFetched(null, start, end);
			} else {
				if (!me.renderTask) {
					me.renderTask = new Ext.util.DelayedTask(me.onRangeFetched, me, null, false);
				}
				// Render the new range very soon after this scroll event handler exits.
				// If scrolling very quickly, a few more scroll events may fire before
				// the render takes place. Each one will just *update* the arguments with which
				// the pending invocation is called.
				me.renderTask.delay(1, null, null, [null, start, end]);
			}
		}

		// Required range is not in the prefetch buffer. Ask the store to prefetch it.
		else {
			me.attemptLoad(start, end);
		}
	},

	onRangeFetched		: function(range, start, end) {
		var me = this, view = me.view, oldStart, rows = view.all, removeCount, increment = 0, calculatedTop = start * me.rowHeight, top;

		// View may have been destroyed since the DelayedTask was kicked off.
		if (view.isDestroyed) {
			return;
		}

		// If called as a callback from the Store, the range will be passed, if called from renderRange, it won't
		if (!range) {
			range = me.store.getRange(start, end);

			// Store may have been cleared since the DelayedTask was kicked off.
			if (!range) {
				return;
			}
		}

		// No overlapping nodes, we'll need to render the whole range
		if (start > rows.endIndex || end < rows.startIndex) {
			rows.clear(true);
			top = calculatedTop;
		}

		if (!rows.getCount()) {
			view.doAdd(range, start);
		}
		// Moved down the dataset (content moved up): remove rows from top, add to end
		else if (end > rows.endIndex) {
			removeCount = Math.max(start - rows.startIndex, 0);

			// We only have to bump the table down by the height of removed rows if rows are not a standard size
			if (me.variableRowHeight) {
				increment = rows.item(rows.startIndex + removeCount, true).offsetTop;
			}
			rows.scroll(Ext.Array.slice(range, rows.endIndex + 1 - start), 1, removeCount, start, end);

			// We only have to bump the table down by the height of removed rows if rows are not a standard size
			if (me.variableRowHeight) {
				// Bump the table downwards by the height scraped off the top
				top = me.bodyTop + increment;
			} else {
				top = calculatedTop;
			}
		}
		// Moved up the dataset: remove rows from end, add to top
		else {
			removeCount = Math.max(rows.endIndex - end, 0);
			oldStart = rows.startIndex;
			rows.scroll(Ext.Array.slice(range, 0, rows.startIndex - start), -1, removeCount, start, end);

			// We only have to bump the table up by the height of top-added rows if rows are not a standard size
			if (me.variableRowHeight) {
				// Bump the table upwards by the height added to the top
				top = me.bodyTop - rows.item(oldStart, true).offsetTop;
			} else {
				top = calculatedTop;
			}
		}

		// Position the table element. top will be undefined if fixed row height, so table position will
		// be calculated.
		if (view.positionBody) {
			me.setBodyTop(top, calculatedTop);
		}
	}
});

Ext.view.AbstractView.override({
	refresh	: function() {
		var me = this, targetEl, targetParent, oldDisplay, nextSibling, dom, records;

		if (!me.rendered || me.isDestroyed) {
			return;
		}

		if (!me.hasListeners.beforerefresh || me.fireEvent('beforerefresh', me) !== false) {
			targetEl = me.getTargetEl();
			// if(me.store.buffered){
			// var p = me.store.data.map['1'];
			// if(p){
			// records = p.value;
			// }
			// }else{
			// records = me.getViewRange();
			// }
			records = me.getViewRange();
			if (!records) {
				records = [];
			}
			dom = targetEl.dom;

			// Updating is much quicker if done when the targetEl is detached from the document, and not displayed.
			// But this resets the scroll position, so when preserving scroll position, this cannot be done.
			if (!me.preserveScrollOnRefresh) {
				targetParent = dom.parentNode;
				oldDisplay = dom.style.display;
				dom.style.display = 'none';
				nextSibling = dom.nextSibling;
				targetParent.removeChild(dom);
			}

			if (me.refreshCounter) {
				me.clearViewEl();
			} else {
				me.fixedNodes = targetEl.dom.childNodes.length;
				me.refreshCounter = 1;
			}

			// Always attempt to create the required markup after the fixedNodes.
			// Usually, for an empty record set, this would be blank, but when the Template
			// Creates markup outside of the record loop, this must still be honoured even if there are no
			// records.
			me.tpl.append(targetEl, me.collectData(records, me.all.startIndex));

			// The emptyText is now appended to the View's element
			// after any fixedNodes.
			if (records.length < 1) {
				// Process empty text unless the store is being cleared.
				if (!this.store.loading && (!me.deferEmptyText || me.hasFirstRefresh)) {
					Ext.core.DomHelper.insertHtml('beforeEnd', targetEl.dom, me.emptyText);
				}
				me.all.clear();
			} else {
				me.collectNodes(targetEl.dom);
				me.updateIndexes(0);
			}

			// Don't need to do this on the first refresh
			if (me.hasFirstRefresh) {
				// Some subclasses do not need to do this. TableView does not need to do this.
				if (me.refreshSelmodelOnRefresh !== false) {
					me.selModel.refresh();
				} else {
					// However, even if that is not needed, pruning if pruneRemoved is true (the default) still needs
					// doing.
					me.selModel.pruneIf();
				}
			}

			me.hasFirstRefresh = true;

			if (!me.preserveScrollOnRefresh) {
				targetParent.insertBefore(dom, nextSibling);
				dom.style.display = oldDisplay;
			}

			// Ensure layout system knows about new content size
			this.refreshSize();

			me.fireEvent('refresh', me);

			// Upon first refresh, fire the viewready event.
			// Reconfiguring the grid "renews" this event.
			if (!me.viewReady) {
				// Fire an event when deferred content becomes available.
				// This supports grid Panel's deferRowRender capability
				me.viewReady = true;
				me.fireEvent('viewready', me);
			}
		}
	}
});

Ext.tip.QuickTip.override({
	showAt	: function(xy) {
		var me = this, target = me.activeTarget, header = me.header, cls;

		if (target) {
			if (!me.rendered) {
				me.render(Ext.getBody());
				me.activeTarget = target;
			}
			me.suspendLayouts();
			if (target.title) {
				me.setTitle(target.title);
				header.show();
			} else if (header) {
				header.hide();
			}
			me.update(target.text);
			me.autoHide = target.autoHide;
			me.dismissDelay = target.dismissDelay || me.dismissDelay;
			if (target.mouseOffset) {
				xy[0] += target.mouseOffset[0];
				xy[1] += target.mouseOffset[1];
			}

			cls = me.lastCls;
			if (cls) {
				me.removeCls(cls);
				delete me.lastCls;
			}

			cls = target.cls;
			if (cls) {
				me.addCls(cls);
				me.lastCls = cls;
			}

			if(!Ext.isEmpty(target.width)) {
				me.setWidth(target.width);
			} else {
				var tt = target.text.replace(/[^\x00-\xff]/g, "**");
				target.width = tt.length * 3 < me.maxWidth ? tt.length * 3 : me.maxWidth;
			}

			if (me.anchor) {
				me.constrainPosition = false;
			} else if (target.align) { // TODO: this doesn't seem to work consistently
				xy = me.getAlignToXY(target.el, target.align);
				me.constrainPosition = false;
			} else {
				me.constrainPosition = true;
			}
			me.resumeLayouts(true);
		}
		me.callParent([xy]);
	}
});

/**
 * 保留小数（非四舍五入）
 * @param {} n
 * @return {}
 */
Number.prototype.hold=function(n){
	var ntmp = this.toFixed(n);
	if(ntmp > this){
	 	ntmp = Number(this.toString().substring(0,ntmp.toString().length));
	}
	return ntmp;
}
// 计算字符串在html的宽度
// 中文字符宽度设置为12，其他字符宽度设置为7
function getStringWidth(str,configWidth) {
	if (typeof str != 'string') {
		str = String(str);
	}
	var len = str.length;
	width = len * 7 + 15;
	for (var i = 0; i < len; i++) {
		if (str.charCodeAt(i) >= 255) {
			width += 5;
		}
	}
	if (width < 100) {
		width = 100;
	}
	if(configWidth && configWidth>width){
		return configWidth;
	}
	return width;
}