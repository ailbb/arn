/**
 * 统计分析报表汇总行
 */
Ext.define('SummaryRow', {
	// 表格对象
	grid : null,
	// 是否可锁定
	lockable : true,
	// 汇总行对象
	summaryRow : null,
	// 锁定部分的汇总行
	lockedSummaryRow : null,
	// 平常grid部分的汇总行
	normalSummaryRow : null,

	/**
	 * 初始化
	 * 
	 * @param {表格对象}
	 *            grid
	 */
	init : function(grid) {
		var me = this;
		me.grid = grid;
		me.lockable = grid.lockable;
		// 绑定grid事件
		grid.on({
			beforerender : function() {
				if (this.lockable) {
					// 锁定表格部分的汇总行
					me.lockedSummaryRow = this.lockedGrid.addDocked({
								childEls : ['innerCt'],
								renderTpl : ['<div id="{id}-innerCt">',
										'</div>'],
								// autoScroll : true,
								style : 'overflow:hidden;background-color:#F2F0E0;',
								// width :
								// this.lockedGrid.view.el.dom.scrollWidth,
								itemId : 'locked-summarybar',
								hidden : true,
								xtype : 'component',
								dock : 'bottom',
								weight : 10000000
							})[0];

					// 平常表格部分的汇总行
					me.normalSummaryRow = this.normalGrid.addDocked({
								childEls : ['innerCt'],
								renderTpl : ['<div id="{id}-innerCt">',
										'</div>'],
								// autoScroll : true,
								style : 'overflow:hidden;background-color:#F2F0E0;',
								// width :
								// this.normalGrid.view.el.dom.scrollWidth,
								itemId : 'normal-summarybar',
								hidden : true,
								xtype : 'component',
								dock : 'bottom',
								weight : 10000000
							})[0];
				} else {
					me.summaryRow = this.addDocked({
								childEls : ['innerCt'],
								renderTpl : ['<div id="{id}-innerCt">',
										'</div>'],
								// autoScroll : true,
								style : 'overflow:hidden;background-color:#F2F0E0;',
								// width :
								// this.normalGrid.view.el.dom.scrollWidth,
								itemId : 'summarybar',
								hidden : true,
								xtype : 'component',
								dock : 'bottom',
								weight : 10000000
							})[0];
				}
			},
			afterrender : function() {
				if (this.lockable) {
					this.lockedGrid.body.dom.style.borderBottomWidth = '0';
					this.lockedGrid.view.mon(this.lockedGrid.view.el, {
								scroll : function() {
									me.lockedSummaryRow.el.dom.style.left = (-this
											.getScrollLeft())
											+ "px";
								}
							});
					this.normalGrid.body.dom.style.borderBottomWidth = '0';
					this.normalGrid.view.mon(this.normalGrid.view.el, {
								scroll : function() {
									// console.log('normalGridscroll');
									// me.normalSummaryRow.el.dom.scrollLeft =
									// this.getScrollLeft();
									me.normalSummaryRow.el.dom.style.left = (-this
											.getScrollLeft())
											+ "px";
								}
							});
					// me.normalSummaryRow.el.dom.scrollWidth =
					// this.view.el.dom.scrollWidth;
				} else {
					this.view.mon(this.view.el, {
								scroll : function() {
									me.summaryRow.el.dom.style.left = (-this
											.getScrollLeft())
											+ "px";
								}
							});
				}
				me.onStoreUpdate();
			},
			single : true
		});

		// 列变化事件
		grid.on({
					columnschanged : function() {
						me.onStoreUpdate();
					}
				});

		// 表头重新排版事件
		grid.headerCt.on({
					afterlayout : function() {
						me.onStoreUpdate();
					}
				});
	},

	/**
	 * 数据更新
	 */
	onStoreUpdate : function() {
		var me = this, grid = this.grid;
		if (!grid) {
			return;
		}
		var records = null;
		// 若是缓存store，则获取records的时候只取第一页的数据
		if (grid.store.buffered) {
			records = grid.store.data.map['1']
					? grid.store.data.map['1'].value
					: null;
		} else {
			records = grid.store.data.items;
		}

		if (null == grid.store.getRecordCount() || records == null) {
			return;
		}
		if (0 == grid.store.getRecordCount()) {
			records = [];
		}
		if (me.lockable) {
			// 锁定列视图
			var lockView = grid.lockedGrid.view;
			if (lockView && lockView.rendered) {
				var columns = grid.lockedGrid.headerCt.getVisibleGridColumns();
				var valueMap = {};
				var expressionColumns = [];
				// 汇总统计
				for (var i = 0; i < columns.length; i++) {
					if (columns[i].summaryType == 'expression') {
						expressionColumns.push(columns[i]);
					} else {
						if (!Ext.isEmpty(columns[i].dataIndex)) {
							valueMap[columns[i].dataIndex] = me
									.getSummaryValue(columns[i], records);
						}
					}
				}
				// 计算表达式列
				for (var i = 0; i < expressionColumns.length; i++) {
					me.calcExpressionValue(expressionColumns[i], valueMap,
							records);
				}

				var str = '<table cellspacing="0" cellpadding="0" style="table-layout: fixed;border-collapse: separate;border:0px;height:22px;" class="normal-summary-table"><tbody><tr>';
				var w;
				for (var i = 0; i < columns.length; i++) {
					w = columns[i].width;
					if (!w) {
						w = columns[i].minWidth;
					}
					// w = w-1;
					str = str
							.concat('<td style="width:')
							.concat(w
									+ 'px;height:22px;overflow:hidden;"><div class="x-grid-cell-inner" style="width:')
							.concat(w
									+ 'px;padding:0px;margin:0px;border:0px;text-indent:6px;">')
							.concat(me.getMapValue(columns[i].dataIndex,
									valueMap)
									+ '</div></td>');
				}
				str = str.concat('</tr></tbody></table>');
				me.lockedSummaryRow.innerCt.el.dom.innerHTML = str;
				// me.lockedSummaryRow.el.dom.scrollWidth =
				// lockView.el.dom.scrollWidth;
				me.lockedSummaryRow.el.dom.style.width = lockView.el.dom.scrollWidth
						+ "px";
				me.lockedSummaryRow.el.dom.style.left = (-lockView.el
						.getScrollLeft())
						+ "px";
			}

			// 平常列视图
			var normalView = grid.normalGrid.view;
			if (normalView && normalView.rendered) {
				var columns = grid.normalGrid.headerCt.getVisibleGridColumns();
				var expressionColumns = [];
				var valueMap = {};
				// 汇总统计
				for (var i = 0; i < columns.length; i++) {
					if (columns[i].summaryType == 'expression') {
						expressionColumns.push(columns[i]);
					} else {
						if (!Ext.isEmpty(columns[i].dataIndex)) {
							valueMap[columns[i].dataIndex] = me
									.getSummaryValue(columns[i], records);
						}
					}
				}
				// 计算表达式列
				for (var i = 0; i < expressionColumns.length; i++) {
					me.calcExpressionValue(expressionColumns[i], valueMap,
							records);
				}
				var str = '<table cellspacing="0" cellpadding="0" style="table-layout: fixed;border-collapse: separate;border:0px;height:22px;" class="normal-summary-table"><tbody><tr>';
				var w;
				for (var i = 0; i < columns.length; i++) {
					w = columns[i].width;
					if (!w) {
						w = columns[i].minWidth;
					}
					// w = w-1;
					str = str
							.concat('<td style="width:')
							.concat(w
									+ 'px;height:22px;overflow:hidden;"><div class="x-grid-cell-inner" style="width:')
							.concat(w
									+ 'px;padding:0px;margin:0px;text-indent:6px;">')
							.concat(me.getMapValue(columns[i].dataIndex,
									valueMap)
									+ '</div></td>');
				}
				str = str.concat('</tr></tbody></table>');
				me.normalSummaryRow.innerCt.el.dom.innerHTML = str;
				// me.normalSummaryRow.el.dom.scrollWidth =
				// normalView.el.dom.scrollWidth;
				me.normalSummaryRow.el.dom.style.width = normalView.el.dom.scrollWidth
						+ "px";
				me.normalSummaryRow.el.dom.style.left = (-normalView.el
						.getScrollLeft())
						+ "px";
			}
		} else {
			var view = grid.view;
			if (view && view.rendered) {
				var columns = grid.headerCt.getVisibleGridColumns();
				var expressionColumns = [];
				var valueMap = {};
				// 汇总统计
				for (var i = 0; i < columns.length; i++) {
					if (columns[i].summaryType == 'expression') {
						expressionColumns.push(columns[i]);
					} else {
						if (!Ext.isEmpty(columns[i].dataIndex)) {
							valueMap[columns[i].dataIndex] = me
									.getSummaryValue(columns[i], records);
						}
					}
				}
				// 计算表达式列
				for (var i = 0; i < expressionColumns.length; i++) {
					me.calcExpressionValue(expressionColumns[i], valueMap,
							records);
				}
				var str = '<table cellspacing="0" cellpadding="0" style="table-layout: fixed;border-collapse: separate;border:0px;height:22px;" class="normal-summary-table"><tbody><tr>';
				var w;
				for (var i = 0; i < columns.length; i++) {
					w = columns[i].width;
					if (!w) {
						w = columns[i].minWidth;
					}
					// w = w-1;
					str = str
							.concat('<td style="width:')
							.concat(w
									+ 'px;height:22px;overflow:hidden;"><div class="x-grid-cell-inner" style="width:')
							.concat(w
									+ 'px;padding:0px;margin:0px;text-indent:6px;">')
							.concat(me.getMapValue(columns[i].dataIndex,
									valueMap)
									+ '</div></td>');
				}
				str = str.concat('</tr></tbody></table>');
				me.summaryRow.innerCt.el.dom.innerHTML = str;
				me.summaryRow.el.dom.style.width = view.el.dom.scrollWidth
						+ "px";
				me.summaryRow.el.dom.style.left = (-view.el.getScrollLeft())
						+ "px";
			}
		}
	},
	// 获取valueMap的值
	getMapValue : function(key, valueMap) {
		if (valueMap[key] != undefined) {
			if (valueMap[key] == Infinity) {
				return 0;
			}
			return valueMap[key];
		}
		return '';
	},
	// 获取汇总值
	getSummaryValue : function(column, records) {
		if (Ext.isEmpty(column.summaryType)) {
			return '';
		}
		var type = column.summaryType.toLowerCase();
		var v = 0;
		switch (type) {
			// 求和
			case 'sum' :
				v = this.getSum(records, column.dataIndex);
				break;
			case 'sum2' :
				v = this.getSum2(records, column.dataIndex);
				break;
			// 求平均
			case 'avg' :
				v = this.getAverage(records, column.dataIndex);
				break;
			// 求平均排除0
			case 'avg2' :
				v = this.getAverageExcludeZero(records, column.dataIndex);
				break;
			// 求最大值
			case 'max' :
				v = this.getMax(records, column.dataIndex);
				break;
			// 求最小值
			case 'min' :
				v = this.getMin(records, column.dataIndex);
				break;
		}
		if (isNaN(v) || v == '' || v == Infinity) {
			v = 0;
		}
		// 负数处理
		if (Number(v) < 0) {
			return '';
		}
		if (column.decimal) {
			return parseInt(Number(v));
		}
		if (column.decimalPlace) {
			return Number(v).toFixed(parseInt(column.decimalPlace));
		}
		if (column.round) {
			return Number(v).toFixed(2);
		}
		if (column.fieldType && column.fieldType == 'float') {
			return Number(v).toFixed(2);
		}
		return v;
	},

	/**
	 * 求平均值
	 * 
	 * @param {数据}
	 *            records
	 * @param {字段}
	 *            field
	 * @return {平均值}
	 */
	getAverage : function(records, field) {
		var i = 0, len = records.length, sum = 0, avg = 0;

		if (records.length > 0) {
			for (; i < len; ++i) {
				sum += Number(records[i].get(field));
			}
			avg = sum / len;
			return this.isDecimal(avg) ? Number(avg).toFixed(2) : avg;
		}
		return 0;
	},

	/**
	 * 求平均值排除0
	 * 
	 * @param {数据}
	 *            records
	 * @param {字段}
	 *            field
	 * @return {平均值}
	 */
	getAverageExcludeZero : function(records, field) {
		var i = 0, len = records.length, dataLen = len, sum = 0, num = 0, avg = 0;

		if (records.length > 0) {
			for (; i < len; ++i) {
				num = Number(records[i].get(field));
				if (num == 0) {
					dataLen--;
					continue;
				}
				sum += num;
			}
			avg = sum / dataLen;

			return this.isDecimal(avg) ? Number(avg).toFixed(2) : avg;
		}
		return 0;
	},

	/**
	 * 求最大值
	 * 
	 * @param {数据}
	 *            records
	 * @param {字段}
	 *            field
	 * @return {最大值}
	 */
	getMax : function(records, field) {
		var i = 1, len = records.length, value, max;

		if (len > 0) {
			max = Number(records[0].get(field));
		}

		for (; i < len; ++i) {
			value = Number(records[i].get(field));
			if (value > max) {
				max = value;
			}
		}
		return this.isDecimal(max) ? Number(max).toFixed(2) : max;
	},

	/**
	 * 求最小值
	 * 
	 * @param {数据}
	 *            records
	 * @param {字段}
	 *            field
	 * @return {最小值}
	 */
	getMin : function(records, field) {
		var i = 1, len = records.length, value, min;

		if (len > 0) {
			min = Number(records[0].get(field));
		}

		for (; i < len; ++i) {
			value = Number(records[i].get(field));
			if (value < min) {
				min = value;
			}
		}
		return this.isDecimal(min) ? Number(min).toFixed(2) : min;
	},
	/**
	 * 求和
	 * 
	 * @param {数据}
	 *            records
	 * @param {字段}
	 *            field
	 * @return 总和
	 */
	getSum : function(records, field) {
		var total = 0, v = 0, i = 0, len = records.length;

		for (; i < len; ++i) {
			// v = records[i].get(field);
			// 用原始值计算
			v = records[i].raw[field];
			if (!isNaN(v)) {
				if(this.isDecimal(v)){
					total += Number(v);
				}else{
					total += parseInt(Number(v));
				}
			}
		}

		return this.isDecimal(total) ? Number(total).toFixed(2) : total;
	},
	/**
	 * 求和(源数据)
	 * 
	 * @param {数据}
	 *            records
	 * @param {字段}
	 *            field
	 * @return 总和
	 */
	getSum2 : function(records, field) {
		var total = 0, v = 0, i = 0, len = records.length;

		for (; i < len; ++i) {
			// v = records[i].get(field);
			// 用原始值计算
			v = records[i].raw[field];
			if (!isNaN(v)) {
				total += Number(v);
			}
		}

		return this.isDecimal(total) ? Number(total).toFixed(2) : total;
	},

	/**
	 * 是否为小数
	 * 
	 * @param {数字}
	 *            v
	 * @return {若为小数，返回true，否则返回false}
	 */
	isDecimal : function(v) {
		return /^[\d]+[\.][\d]*$/.test(v);
	},

	/**
	 * 计算表达式的值
	 * 
	 * @param {列对象}
	 *            column
	 * @param {汇总行数据}
	 *            summaryValueMap
	 * @param {表格数据}
	 *            records
	 * 
	 * @return 返回表达式的值
	 */
	calcExpressionValue : function(column, summaryValueMap, records) {
		// 表达式
		var expression = column.summaryExpression;
		// 需要进行表达式计算的字段key
		var key = column.dataIndex;
		var v = 0;

		var newExpression = expression;
		var patt = new RegExp("#[_a-zA-Z0-9^#]*#", "g");
		var field, count = 0;

		// 需要再计算的字段
		var needCalcFields = [];
		while ((field = patt.exec(expression)) != null) {
			field = String(field).replace(/#/g, '');

			// 没找到汇总值，此字段需要计算
			if (summaryValueMap[field] == undefined) {
				needCalcFields.push(field);
				continue;
			}

			// 替换模板值
			newExpression = newExpression.replace(new RegExp("#" + field + "#",
							"g"), (summaryValueMap[field] == ''
							? 0
							: summaryValueMap[field]));

			count++;
		}

		if (needCalcFields.length) {
			if (records.length) {
				var tmpKey = null;
				for (var i = 0; i < needCalcFields.length; i++) {
					tmpKey = '@' + needCalcFields[i];
					if (records[0].raw[tmpKey] == undefined) {
						if (records[0].raw[needCalcFields[i]] == undefined) {
							tmpKey = null;
						} else {
							tmpKey = needCalcFields[i];
						}
					}
					if (tmpKey) {
						var sum = this.getSum(records, tmpKey);
						newExpression = newExpression.replace(
								new RegExp("#" + needCalcFields[i] + "#", "g"),
								(sum ? sum : 0));
					} else {
						newExpression = newExpression.replace(
								new RegExp("#" + needCalcFields[i] + "#", "g"),
								'0');
					}
				}
			}
		}

		// 计算表达式
		try {
			if (count == 0 && needCalcFields.length == 0) {
				v = eval(expression);
			} else {
				v = eval(newExpression);
			}
		} catch (ex3) {
			// 计算错误置为0
			v = 0;
		}

		// 若结果为错误值，则置为0
		if (isNaN(v) || v == '' || v == Infinity) {
			v = 0;
		}

		// 负数处理
		if (Number(v) < 0) {
			v = '';
		} else {
			// 若设置了小数位或者是float类型，则进行格式化
			if (column.decimal) {
				v = parseInt(Number(v));
			}
			if (column.decimalPlace) {
				v = Number(v).toFixed(parseInt(column.decimalPlace));
			}
			if (column.round) {
				v = Number(v).toFixed(2);
			}
			if (column.fieldType && column.fieldType == 'float') {
				v = Number(v).toFixed(2);
			}
		}

		// 存储到map里
		summaryValueMap[key] = v;

		return v;
	},

	// 显示或隐藏汇总行
	showOrHideSummaryRow : function() {
		if (this.lockable) {
			if (this.lockedSummaryRow) {
				if (this.lockedSummaryRow.isHidden()) {
					this.showSummaryRow();
				} else {
					this.hideSummaryRow();
				}
			}
		} else {
			if (this.summaryRow) {
				if (this.summaryRow.isHidden()) {
					this.showSummaryRow();
				} else {
					this.hideSummaryRow();
				}
			}
		}
	},

	// 隐藏汇总行
	hideSummaryRow : function() {
		if (this.lockable) {
			this.lockedSummaryRow.hide();
			this.normalSummaryRow.hide();
		} else {
			this.summaryRow.hide();
		}
	},
	clear : function() {
		this.lockedSummaryRow.innerCt.el.dom.innerHTML = ''; 
		this.normalSummaryRow.innerCt.el.dom.innerHTML ='';
	},

	// 显示汇总行
	showSummaryRow : function() {
		if (this.lockable) {
			this.lockedSummaryRow.show();
			this.normalSummaryRow.show();
		} else {
			this.summaryRow.show();
		}
	}
});