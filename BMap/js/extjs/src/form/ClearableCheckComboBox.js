/**
 * 带清空选项的多选combox组件 如在不必选的环境下 建议使用此项
 * 
 * @class Ext.form.field.ClearableCheckComboBox
 * @extends Ext.form.field.ClearableComboBox
 */
Ext.define('Ext.form.field.ClearableCheckComboBox', {
	extend				: 'Ext.form.field.ClearableComboBox',
	requires			: ['Ext.util.DelayedTask', 'Ext.EventObject', 'Ext.view.BoundList', 'Ext.view.BoundListKeyNav',
			'Ext.data.StoreManager', 'Ext.layout.component.field.ComboBox'],
	alternateClassName	: 'Ext.form.ClearableCheckComboBox',
	alias				: ['widget.clearablecheckcombobox', 'widget.clearablecheckcombo'],
	xtype				: 'clear-able-checkComboBox',
	mixins				: {
		bindable	: 'Ext.util.Bindable'
	},
	addAllSelector		: true,
	valueSeparator	: ',',
	allSelector			: false,
	createPicker		: function() {
		var me = this, picker, pickerCfg = Ext.apply({
			xtype			: 'boundlist',
			componentLayout	: 'checkboundlist',
			pickerField		: me,
			selModel		: {
				mode	: me.multiSelect ? 'SIMPLE' : 'SINGLE'
			},
			floating		: true,
			hidden			: true,
			store			: me.store,
			displayField	: me.displayField,
			focusOnToFront	: false,
			pageSize		: me.pageSize,
			tpl				: new Ext.XTemplate('<ul class="' + Ext.plainListCls + '"><tpl for=".">',
					'<li role="option" unselectable="on" class="' + Ext.baseCSSPrefix
							+ 'boundlist-item"><span class="x-combo-checker">&nbsp;</span>{' + me.displayField
							+ '}</li>', '</tpl></ul>')
		}, me.listConfig, me.defaultListConfig);

		picker = me.picker = Ext.widget(pickerCfg);
		if (me.pageSize) {
			picker.pagingToolbar.on('beforechange', me.onPageChange, me);
		}

		me.mon(picker, {
			itemclick	: me.onItemClick,
			refresh		: me.onListRefresh,
			scope		: me
		});

		me.mon(picker.getSelectionModel(), {
			beforeselect	: me.onBeforeSelect,
			beforedeselect	: me.onBeforeDeselect,
			selectionchange	: me.onListSelectionChange,
			scope			: me
		});
		return picker;
	},
	getValue			: function() {
		var me = this, picker = me.picker, rawValue = me.getRawValue(), value = me.value;

		if (me.getDisplayValue() !== rawValue) {
			value = rawValue;
			me.value = me.displayTplData = me.valueModels = null;
			if (picker) {
				me.ignoreSelection++;
				picker.getSelectionModel().deselectAll();
				me.ignoreSelection--;
			}
		}
//		if(Ext.isArray(value)){
//			return value.join(me.valueSeparator);
//		}
		return value === null ? '' : value;
	},
	expand				: function() {
		var me = this, bodyEl, picker, collapseIf;

		if (me.rendered && !me.isExpanded && !me.isDestroyed) {
			bodyEl = me.bodyEl;
			picker = me.getPicker();
			collapseIf = me.collapseIf;

			// 显示
			picker.show();
			me.isExpanded = true;
			me.alignPicker();
			bodyEl.addCls(me.openCls);

			// 监听
			me.mon(Ext.getDoc(), {
				mousewheel	: collapseIf,
				mousedown	: collapseIf,
				scope		: me
			});
			Ext.EventManager.onWindowResize(me.alignPicker, me);
			me.fireEvent('expand', me);
			me.onExpand();
		}
	}
});
