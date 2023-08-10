/**
 * 带清空选项的指标选择组件 如在不必选的环境下 建议使用此项
 * 
 * @class Ext.form.field.ClearableIndexTrigger
 * @extends Ext.form.field.ClearableTrigger
 */
Ext.define('Ext.form.field.ClearableIndexTrigger', {
	extend		: 'Ext.form.field.ClearableTrigger',
	alias		: ['widget.clearableindextrigger'],
	/**
	 * Sets a data value into the field and runs the change detection and validation. Also applies any configured
	 * {@link #emptyText} for text fields. To set the value directly without these inspections see {@link #setRawValue}.
	 * 
	 * @param {Object}
	 *            value The value to set
	 * @return {Ext.form.field.Text} this
	 */
	setValue	: function(value) {
		var me = this, inputEl = me.inputEl, displays = [], triggerEl = me.triggerEl, els, eLen, el;
		var display;
		/*
		 * 针对指标显示值和取值的特殊性，对控件setValue()方法进行重写
		 * 
		 */
		if (value && Ext.isArray(value) && value.length > 0) {
			for (var i = 0; i < value.length; i++) {
				if (value[i].logic == 'between') {// 对单个值和多个值进行判断
					display = value[i].display + '[介于' + value[i].rangeValue.replace(/\|/g, '~') + ']';
				} else if (!Ext.isEmpty(value[i].logic)) {
					display = value[i].display + '[' + value[i].logic + value[i].rangeValue + ']';
				} else {
					display = value[i].display;
				}

				if (!Ext.isEmpty(value[i].sort)) {// 对是否排序，topN进行判断
					display += ' 排序方向:' + (value[i].sort == 'ASC' ? '升序' : '降序') + ' topN:' + (Ext.isEmpty(value[i].topn) ? 0 : value[i].topn);
					value[i].topn = Ext.isEmpty(value[i].topn) ? 0 : value[i].topn;
				}
				displays.push(display);
			}
			me.value = value;
			if (inputEl) {
				inputEl.dom.value = displays.join(',');
			}
		} else {
			me.value = '';
			if (inputEl) {
				inputEl.dom.value = '';
			}
		}

		if (triggerEl) {// 控制取消按钮的显示状态
			els = triggerEl.elements;
			eLen = els.length;
			for (e = 0; e < eLen; e++) {
				el = els[e];
				if (el.dom.className.indexOf('x-form-clear-trigger') != -1) {
					if (me.getValue() && me.getValue() !== '') {
						el.dom.parentElement.style.display = '';
						break;
					} else {
						el.dom.parentElement.style.display = 'none';
						break;
					}
				}
			}
		}
		// 设值后调用方法，触发change事件
		me.checkChange();
	},
	/**
	 * Returns the current data value of the field. The type of value returned is particular to the type of the
	 * particular field (e.g. a Date object for {@link Ext.form.field.Date}), as the result of calling
	 * {@link #rawToValue} on the field's {@link #processRawValue processed} String value. To return the raw String
	 * value, see {@link #getRawValue}.
	 * 
	 * @return {Object} value The field value
	 */
	getValue	: function() {
		var me = this;
		return !Ext.isEmpty(me.value) ? me.value : '';
	},
	// 清除值
	clearValue	: function() {
		var me = this;
		me.setValue([]);
	}
});