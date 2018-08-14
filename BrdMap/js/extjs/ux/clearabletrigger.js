/**
 * 带清空选项的Trigger组件 如在不必选的环境下 建议使用此项
 * 
 * @class Ext.form.field.ClearableTrigger
 * @extends Ext.form.field.Trigger
 */
Ext.define('Ext.form.field.ClearableTrigger', {
	extend				: 'Ext.form.field.Trigger',
	alias				: ['widget.clearabletrigger'],
	// @private 初始化Trigger按钮
	initTrigger			: function() {
		var me = this, triggerWrap = me.triggerWrap, triggerEl = me.triggerEl, disableCheck = me.disableCheck, els, eLen, el, e, idx;

		/*
		 * 初始化trigger对象
		 */
		if (me.repeatTriggerClick) {
			me.triggerRepeater = new Ext.util.ClickRepeater(triggerWrap, {
				preventDefault	: true,
				handler			: me.onTriggerWrapClick,
				listeners		: {
					mouseup	: me.onTriggerWrapMouseup,
					scope	: me
				},
				scope			: me
			});
		} else {
			me.mon(triggerWrap, {
				click	: me.onTriggerWrapClick,
				mouseup	: me.onTriggerWrapMouseup,
				scope	: me
			});
		}

		triggerEl.setVisibilityMode(Ext.Element.DISPLAY);
		triggerEl.addClsOnOver(me.triggerBaseCls + '-over', disableCheck, me);

		els = triggerEl.elements;
		eLen = els.length;

		/*
		 * 控制清除按钮是否显示代码
		 */
		for (e = 0; e < eLen; e++) {
			el = els[e];
			idx = e + 1;
			el.addClsOnOver(me['trigger' + (idx) + 'Cls'] + '-over', disableCheck, me);
			el.addClsOnClick(me['trigger' + (idx) + 'Cls'] + '-click', disableCheck, me);
			if (el.dom.className.indexOf('x-form-clear-trigger') != -1) {
				el.dom.parentElement.style.display = 'none';
			}
		}

		triggerEl.addClsOnClick(me.triggerBaseCls + '-click', disableCheck, me);

	},
	// 添加取消按钮
	getTriggerMarkup	: function() {
		var me = this, hideTrigger = (me.readOnly || me.hideTrigger), triggerBaseCls = me.triggerBaseCls, triggerConfigs = [], unselectableCls = Ext.dom.Element.unselectableCls, style = 'width:'
				+ me.triggerWidth + 'px;' + (hideTrigger ? 'display:none;' : '');
		/*
		 * 清除按钮
		 */
		triggerConfigs.push({
			tag		: 'td',
			valign	: 'top',
			cls		: Ext.baseCSSPrefix + 'trigger-cell ' + unselectableCls,
			style	: style,
			cn		: {
				cls		: [Ext.baseCSSPrefix + 'trigger-index-0', triggerBaseCls, Ext.baseCSSPrefix + 'form-clear-trigger'].join(' '),
				role	: 'button'
			}
		});
		/*
		 * 点击选择按钮
		 */
		triggerConfigs.push({
			tag		: 'td',
			valign	: 'top',
			cls		: Ext.baseCSSPrefix + 'trigger-cell ' + unselectableCls,
			style	: style,
			cn		: {
				cls		: [Ext.baseCSSPrefix + 'trigger-index-1', triggerBaseCls, me.triggerCls].join(' '),
				role	: 'button'
			}
		});
		triggerConfigs[triggerConfigs.length - 1].cn.cls += ' ' + triggerBaseCls + '-last';
		return Ext.DomHelper.markup(triggerConfigs);
	},
	// 取消按钮点击时触发该事件
	onTrigger1Click		: function() {
		var me = this, triggerEl = me.triggerEl, els, eLen, el;
		/*
		 * 清除值
		 */
		me.clearValue();
		els = triggerEl.elements;
		eLen = els.length;
		/*
		 * 控制清除按钮是否显示代码
		 */
		for (e = 0; e < eLen; e++) {
			el = els[e];
			if (el.dom.className.indexOf('x-form-clear-trigger') != -1) {
				el.dom.parentElement.style.display = 'none';
				break;
			}
		}
	},
	/**
	 * Sets a data value into the field and runs the change detection and validation. Also applies any configured
	 * {@link #emptyText} for text fields. To set the value directly without these inspections see {@link #setRawValue}.
	 * 
	 * @param {Object}
	 *            value The value to set
	 * @return {Ext.form.field.Text} this
	 */
	setValue			: function(value,record/*扩展,可选*/) {
		var me = this, inputEl = me.inputEl, displays = [], values = [], triggerEl = me.triggerEl, els, eLen, el;
		if(record!=undefined){
			me.rowRecord=record;
		}
		/*
		 * 设值
		 */
		if (value && Ext.isArray(value) && value.length > 0) {// 值存在时
			for (var i = 0; i < value.length; i++) {
				displays.push(value[i].display);
				values.push(value[i].value);
			}
			me.value = values.join(',');
			if (inputEl) {
				inputEl.dom.value = displays.join(',');
				inputEl.dom.focus();
			}
		} else if(!Ext.isEmpty(value)) {//修改非数组值时控件不支持BUG
			me.value = value+'';
			if (inputEl) {
				inputEl.dom.value = value+'';
				inputEl.dom.focus();
			}
		} else {
			me.value = '';
			if (inputEl) {
				inputEl.dom.value = '';
				inputEl.dom.focus();
			}
		}

		/*
		 * 控制清除按钮是否显示代码
		 */
		if (triggerEl) {
			els = triggerEl.elements;
			eLen = els.length;
			for (e = 0; e < eLen; e++) {
				el = els[e];
				if (el.dom.className.indexOf('x-form-clear-trigger') != -1) {
					if (me.getValue() && me.getValue() !== '' && me.readOnly == false) {
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
	getValue			: function() {
		var me = this;
		return me.value ? me.value : '';
	},
	// 清除值
	clearValue			: function() {
		var me = this;
		me.setValue([]);
	}
});