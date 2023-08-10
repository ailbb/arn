// 扩展分页控件
Ext.define('Ext.toolbar.ExpandPagingbar', {
			extend : 'Ext.PagingToolbar',
			expandItems : [],//扩展项目
			getPagingItems : function() {
				var me = this;
				var items = [{//pagingbar自身项目
							itemId : 'first',
							tooltip : me.firstText,
							overflowText : me.firstText,
							iconCls : Ext.baseCSSPrefix + 'tbar-page-first',
							disabled : true,
							handler : me.moveFirst,
							scope : me
						}, {
							itemId : 'prev',
							tooltip : me.prevText,
							overflowText : me.prevText,
							iconCls : Ext.baseCSSPrefix + 'tbar-page-prev',
							disabled : true,
							handler : me.movePrevious,
							scope : me
						}, '-', me.beforePageText, {
							xtype : 'numberfield',
							itemId : 'inputItem',
							name : 'inputItem',
							cls : Ext.baseCSSPrefix + 'tbar-page-number',
							allowDecimals : false,
							minValue : 1,
							hideTrigger : true,
							enableKeyEvents : true,
							keyNavEnabled : false,
							selectOnFocus : true,
							submitValue : false,
							// mark it as not a field so the form will not catch
							// it when getting fields
							isFormField : false,
							width : me.inputItemWidth,
							margins : '-1 2 3 2',
							listeners : {
								scope : me,
								keydown : me.onPagingKeyDown,
								blur : me.onPagingBlur
							}
						}, {
							xtype : 'tbtext',
							itemId : 'afterTextItem',
							text : Ext.String.format(me.afterPageText, 1)
						}, '-', {
							itemId : 'next',
							tooltip : me.nextText,
							overflowText : me.nextText,
							iconCls : Ext.baseCSSPrefix + 'tbar-page-next',
							disabled : true,
							handler : me.moveNext,
							scope : me
						}, {
							itemId : 'last',
							tooltip : me.lastText,
							overflowText : me.lastText,
							iconCls : Ext.baseCSSPrefix + 'tbar-page-last',
							disabled : true,
							handler : me.moveLast,
							scope : me
						}, '-', {
							itemId : 'refresh',
							tooltip : me.refreshText,
							overflowText : me.refreshText,
							iconCls : Ext.baseCSSPrefix + 'tbar-loading',
							handler : me.doRefresh,
							scope : me
						}];
				if (me.expandItems && me.expandItems.length > 0) {
					Ext.Array.insert(items, 0, me.expandItems);//扩展项目重头开始插入
				}
				return items;
			}
		});