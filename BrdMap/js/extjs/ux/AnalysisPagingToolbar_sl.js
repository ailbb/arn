Ext.define('Ext.toolbar.AnalysisPagingToolbar', {
	extend					: 'Ext.toolbar.Toolbar',
	alias					: 'widget.AnalysisPagingToolbar',
	alternateClassName		: 'Ext.AnalysisPagingToolbar',
	requires				: ['Ext.toolbar.TextItem', 'Ext.form.field.Number'],
	mixins					: {
		bindable	: 'Ext.util.Bindable'
	},

	maxCache				: 1,

	pagingnum				: 7,

	totalCount				: null,

	displayInfo				: false,

	prependButtons			: false,

	queryid					: null,

	sizeArr					: [],

	beforePageText			: 'Page',

	afterPageText			: 'of {0}',

	firstText				: 'First Page',

	prevText				: '上一页',

	nextText				: '下一页',

	lastText				: 'Last Page',

	refreshText				: 'Refresh',

	inputItemWidth			: 30,

	getPagingItems			: function() {
		var me = this;
		me.orderid = me.id + "_paging";
		return [{
			itemId			: 'prev',
			tooltip			: me.prevText,
			overflowText	: me.prevText,
			iconCls			: Ext.baseCSSPrefix + 'tbar-page-prev',
			disabled		: true,
			handler			: me.movePrevious,
			scope			: me
		}, '-', '<div id="' + me.orderid + '"  class="bbar_paging"><span class="current">1</span><div>', '-', {
			itemId			: 'next',
			tooltip			: me.nextText,
			overflowText	: me.nextText,
			iconCls			: Ext.baseCSSPrefix + 'tbar-page-next',
			disabled		: true,
			handler			: me.moveNext,
			scope			: me
		}];
	},

	initComponent			: function() {
		var me = this, pagingItems = me.getPagingItems(), userItems = me.items || me.buttons || [];
		if (me.prependButtons) {
			me.items = userItems.concat(pagingItems);
		} else {
			me.items = pagingItems.concat(userItems);
		}
		delete me.buttons;

		if (me.displayInfo) {
			me.items.push('->');
			me.items.push({
				xtype	: 'tbtext',
				itemId	: 'displayItem'
			});
		}

		me.callParent();

		me.addEvents('change', 'beforechange');
		me.on('beforerender', me.onLoad, me, {
			single	: true
		});

		// me.bindStore(me.store || 'ext-empty-store', true);
	},
	gridSelectionChanged	: function(appendMsg) {
		var me = this, displayItem = me.child('#displayItem');
		if (displayItem) {
			var rawMsg = displayItem.el.dom.innerHTML;
			if (rawMsg.indexOf('|') != -1) {
				rawMsg = rawMsg.split('|')[1];
			}
			if (Ext.isEmpty(appendMsg)) {
				displayItem.setText(rawMsg);
			} else {
				displayItem.setText(appendMsg + '&nbsp;&nbsp;| ' + rawMsg);
			}
		}
	},
	updateInfo				: function(showMsg) {
		var me = this, displayItem = me.child('#displayItem'), store = me.store, pageData = me.getPageData(), count, msg;

		if (!Ext.isEmpty(showMsg)) {
			displayItem.setText(showMsg);
			return;
		}

		if (displayItem) {
			count = store.getCount();
			if (count === 0) {
				msg = '没有数据显示';
			} else {
				var total = pageData.total;
				if (total != null) {
					msg = '当前显示 ' + pageData.fromRecord + ' - ' + pageData.toRecord + ' 条,共' + total + '条';
				} else {
					msg = '当前显示 ' + pageData.fromRecord + ' - ' + pageData.toRecord + ' 条';
				}
			}
			displayItem.setText(msg);
		}
	},
	onLoad					: function() {
		var me = this, pageData, currPage, pageCount, afterText, count, isEmpty;

		count = me.store.getCount();
		isEmpty = count === 0;
		if (!isEmpty) {
			pageData = me.getPageData();
			currPage = pageData.currentPage;
			pageCount = pageData.pageCount;
			afterText = Ext.String.format(me.afterPageText, isNaN(pageCount) ? 1 : pageCount);
		} else {
			currPage = 0;
			pageCount = 0;
			afterText = Ext.String.format(me.afterPageText, 0);
		}
		Ext.suspendLayouts();
		me.child('#prev').setDisabled(currPage === 1 || isEmpty);
		me.child('#next').setDisabled(currPage >= pageCount || isEmpty);
		me.showPaging(false);
		me.updateInfo();
		Ext.resumeLayouts(true);
		if (me.rendered) {
			me.fireEvent('change', me, pageData);
		}
	},
	getPageData				: function() {
		var store = this.store, totalCount = store.getRecordCount(), toRecord;
		if (totalCount != null) {
			toRecord = Math.min(store.currentPage * store.pageSize, totalCount);
		} else {
			toRecord = Math.min(store.currentPage * store.pageSize, (store.currentPage - 1) * store.pageSize + store.getCount());
		}
		return {
			total		: totalCount,
			currentPage	: store.currentPage,
			pageCount	: this.maxCache,
			fromRecord	: ((store.currentPage - 1) * store.pageSize) + 1,
			toRecord	: toRecord

		};
	},
	onLoadError				: function() {
		if (!this.rendered) {
			return;
		}
	},
	beforeLoad				: function() {
		if (this.rendered && this.refresh) {
			this.refresh.disable();
		}
	},
	movePrevious			: function() {
		var me = this, prev = me.store.currentPage - 1;

		if (prev > 0) {
			me.store.loadPage(prev);
		}
	},
	moveNext				: function() {
		var me = this, total = me.getPageData().pageCount, next = me.store.currentPage + 1;
		if (next <= total) {
			me.store.loadPage(next);
		}
	},
	getStoreListeners		: function() {
		return {
			beforeload		: this.beforeLoad,
			changeMaxCache	: this.changeMaxCache,
			load			: this.onLoad,
			updateInfo		: this.updateInfo,
			exception		: this.onLoadError
		};
	},
	changeMaxCache			: function(maxCache, bol) {
		var me = this;
		if (bol == 1) {
			this.totalCount = maxCache;
		}
		if (bol == 2) {
			this.totalCount = null;
		}
		me.maxCache = maxCache;
		var pageData = me.getPageData();
		var currPage = pageData.currentPage;
		var pageCount = pageData.pageCount;
		me.child('#prev').setDisabled(currPage === 1);
		me.child('#next').setDisabled(currPage >= pageCount);
		me.showPaging(true);
	},
	movePage				: function(obj) {
		var pn = parseInt(Ext.getDom(obj.id).innerHTML);
		this.store.loadPage(pn);
	},
	showPaging				: function(bol) {
		if (Ext.getDom(this.orderid) == null) {
			return;
		}
		var cachenum = parseInt(this.pagingnum / 2);
		var initnum = this.pagingnum + cachenum;
		var arr = new Array();
		this.currentpagenum = this.store.currentPage;
		var currentpagenum = this.currentpagenum;
		var maxcachenum = this.maxCache;
		var html = '';
		if (maxcachenum < initnum) {// 缓存页小于初始预缓存页
			if (this.totalCount == null) {// 未出总数情况
				if (this.pagingnum > currentpagenum) {
					if (this.pagingnum > maxcachenum) {//
						for (var i = 1; i <= maxcachenum; i++) {
							if (i == currentpagenum) {// 选中页状态
								html = html + '<span class="current">' + i + '</span>';
							} else {
								var nodename = this.orderid + '_' + i;
								html = html + '<a id="' + nodename + '" >' + i + '</a>';
								arr.push(nodename);
							}
						}
					} else {
						// 非推数据 或 当前条件第一次更新页面菜单
						if ((!bol) || (maxcachenum == this.pagingnum)) {
							for (var i = 1; i <= this.pagingnum; i++) {
								if (i == currentpagenum) {// 选中页状态
									html = html + '<span class="current">' + i + '</span>';
								} else {
									var nodename = this.orderid + '_' + i;
									html = html + '<a id="' + nodename + '" >' + i + '</a>';
									arr.push(nodename);
								}
							}
						}
					}
				} else {
					if ((!bol) || (this.pagingnum == currentpagenum)) {
						arr.push(this.orderid + '_' + 1);
						html = '<a id="' + this.orderid + '_' + 1 + '" >1</a>...'
						for (var i = currentpagenum - cachenum; i <= currentpagenum; i++) {
							if (i == currentpagenum) {// 选中页状态
								html = html + '<span class="current">' + i + '</span>';
							} else {
								var nodename = this.orderid + '_' + i;
								html = html + '<a id="' + nodename + '" >' + i + '</a>';
								arr.push(nodename);
							}
						}
					}
				}
			} else// 出总页数情况
			{ // 总数小于展示页面数
				if (this.totalCount < this.pagingnum) {
					for (var i = 1; i <= this.totalCount; i++) {
						if (i == currentpagenum) {// 选中页状态
							html = html + '<span class="current">' + i + '</span>';
						} else {
							var nodename = this.orderid + '_' + i;
							html = html + '<a id="' + nodename + '" >' + i + '</a>';
							arr.push(nodename);
						}
					}

				} else// 总数大于展示页面数
				{
					// 当前页码小于展示页面数
					if (currentpagenum < this.pagingnum) {
						for (var i = 1; i <= this.pagingnum; i++) {
							if (i == currentpagenum) {// 选中页状态
								html = html + '<span class="current">' + i + '</span>';
							} else {
								var nodename = this.orderid + '_' + i;
								html = html + '<a id="' + nodename + '" >' + i + '</a>';
								arr.push(nodename);
							}
						}
					} else// 当前页码大于等于展示页码数 展示缓存页码
					{
						arr.push(this.orderid + '_' + 1);
						html = '<a id="' + this.orderid + '_' + 1 + '" >1</a>...'
						for (var i = currentpagenum - cachenum; i <= this.totalCount; i++) {
							if (i == currentpagenum) {// 选中页状态
								html = html + '<span class="current">' + i + '</span>';
							} else {
								var nodename = this.orderid + '_' + i;
								html = html + '<a id="' + nodename + '" >' + i + '</a>';
								arr.push(nodename);
							}
						}
					}
				}
			}
		} else {

			if (currentpagenum < this.pagingnum) {
				if (!bol) {// 触发事件情况
					for (var i = 1; i <= this.pagingnum; i++) {
						if (i == currentpagenum) {// 选中页状态
							html = html + '<span class="current">' + i + '</span>';
						} else {
							var nodename = this.orderid + '_' + i;
							html = html + '<a id="' + nodename + '" >' + i + '</a>';
							arr.push(nodename);
						}
					}
				}
			} else {
				if (this.totalCount == null) {
					if (currentpagenum + cachenum * 2 > maxcachenum) {
						if (!bol) {
							arr.push(this.orderid + '_' + 1);
							html = '<a id="' + this.orderid + '_' + 1 + '" >1</a>...'
							for (var i = currentpagenum - cachenum; i <= currentpagenum; i++) {
								if (i == currentpagenum) {// 选中页状态
									html = html + '<span class="current">' + i + '</span>';
								} else {
									var nodename = this.orderid + '_' + i;
									html = html + '<a id="' + nodename + '" >' + i + '</a>';
									arr.push(nodename);
								}
							}
						}
					} else {
						arr.push(this.orderid + '_' + 1);
						html = '<a id="' + this.orderid + '_' + 1 + '" >1</a>...'
						for (var i = currentpagenum - cachenum; i <= currentpagenum + cachenum; i++) {
							if (i == currentpagenum) {// 选中页状态
								html = html + '<span class="current">' + i + '</span>';
							} else {
								var nodename = this.orderid + '_' + i;
								html = html + '<a id="' + nodename + '" >' + i + '</a>';
								arr.push(nodename);
							}
						}
					}
				} else {
					arr.push(this.orderid + '_' + 1);
					html = '<a id="' + this.orderid + '_' + 1 + '" >1</a>...'
					if (currentpagenum + cachenum >= this.totalCount) {
						for (var i = (this.totalCount - this.pagingnum + 1); i <= this.totalCount; i++) {
							if (i == currentpagenum) {// 选中页状态
								html = html + '<span class="current">' + i + '</span>';
							} else {
								var nodename = this.orderid + '_' + i;
								html = html + '<a id="' + nodename + '" >' + i + '</a>';
								arr.push(nodename);
							}
						}
					} else {
						for (var i = currentpagenum - cachenum; i <= currentpagenum + cachenum; i++) {
							if (i == currentpagenum) {// 选中页状态
								html = html + '<span class="current">' + i + '</span>';
							} else {
								var nodename = this.orderid + '_' + i;
								html = html + '<a id="' + nodename + '" >' + i + '</a>';
								arr.push(nodename);
							}
						}
					}
				}
			}
			if (html.length > 0) {
				var moveMax = this.store.moveMax;
				if (currentpagenum + 6 < moveMax) {
					var nodename = this.orderid + '_' + moveMax;
					html = html + '...<a id="' + nodename + '" >' + moveMax + '</a>';
					arr.push(nodename);
				}
			}
		}
		var bbar = this;
		// 更新页码选项
		if (html.length > 0) {
			Ext.getDom(this.orderid).innerHTML = html;
			if (bol) {
				this.updateLayout();
			}
		}
		if (arr.length > 0) {
			// 绑定单击事件
			for (var i = 0; i < arr.length; i++) {
				var a = Ext.get(arr[i]);
				a.addListener('click', function() {
					bbar.movePage(this);
				})
			}
		}
		this.child('#prev').setDisabled(currentpagenum === 1);
		this.child('#next').setDisabled(currentpagenum >= this.maxCache);
	}

});