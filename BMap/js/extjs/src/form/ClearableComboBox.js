/**
 * 带清空选项的combox组件 如在不必选的环境下 建议使用此项
 * 
 * @class Ext.form.field.ClearableComboBox
 * @extends Ext.form.field.ComboBox
 */
Ext.define('Ext.form.field.ClearableComboBox', {
	extend					: 'Ext.form.field.ComboBox',
	requires				: ['Ext.util.DelayedTask', 'Ext.EventObject', 'Ext.view.BoundList',
			'Ext.view.BoundListKeyNav', 'Ext.data.StoreManager', 'Ext.layout.component.field.ComboBox'],
	alternateClassName		: 'Ext.form.ClearableComboBox',
	alias					: ['widget.clearablecombobox', 'widget.clearablecombo'],
	xtype				: 'clear-able-combobox',
	mixins					: {
		bindable	: 'Ext.util.Bindable'
	},
	listConfig				: {
		resizable		: true,
		resizeHandles	: 'se'
	},
	initTrigger				: function() {
		var me = this, triggerWrap = me.triggerWrap, triggerEl = me.triggerEl, disableCheck = me.disableCheck, els, eLen, el, e, idx;
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
	getTriggerMarkup		: function() {
		var me = this, hideTrigger = (me.readOnly || me.hideTrigger), triggerBaseCls = me.triggerBaseCls, triggerConfigs = [], unselectableCls = Ext.dom.Element.unselectableCls, style = 'width:'
				+ me.triggerWidth + 'px;' + (hideTrigger ? 'display:none;' : '');
		triggerConfigs.push({
			tag		: 'td',
			valign	: 'top',
			cls		: Ext.baseCSSPrefix + 'trigger-cell ' + unselectableCls,
			style	: style,
			cn		: {
				cls		: [Ext.baseCSSPrefix + 'trigger-index-0', triggerBaseCls,
						Ext.baseCSSPrefix + 'form-clear-trigger'].join(' '),
				role	: 'button'
			}
		});
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
	onListSelectionChange	: function(list, selectedRecords) {
		var me = this, isMulti = me.multiSelect, triggerEl = me.triggerEl, hasRecords = selectedRecords.length > 0, els, eLen, el;
		if (!me.ignoreSelection && me.isExpanded) {
			if (!isMulti) {
				Ext.defer(me.collapse, 1, me);
			}
			if (isMulti || hasRecords) {
				me.setValue(selectedRecords, false);
			}
			if (hasRecords) {
				me.fireEvent('select', me, selectedRecords);
			}
			me.inputEl.focus();
		}
		els = triggerEl.elements;
		eLen = els.length;
		for (e = 0; e < eLen; e++) {
			el = els[e];
			if (el.dom.className.indexOf('x-form-clear-trigger') != -1) {
				if (me.getValue() && me.getValue() !== '') {
					if(me.clearable){
						el.dom.parentElement.style.display = '';
					}
					break;
				} else {
					el.dom.parentElement.style.display = 'none';
					break;
				}
			}
		}
	},
	onTrigger1Click			: function() {
		var me = this, triggerEl = me.triggerEl, els, eLen, el;
		if(me.requiredValues){
			me.setValue(me.requiredValues.split(","));
		}else{
			me.clearValue();
		}
		els = triggerEl.elements;
		eLen = els.length;
		for (e = 0; e < eLen; e++) {
			el = els[e];
			if (el.dom.className.indexOf('x-form-clear-trigger') != -1) {
				el.dom.parentElement.style.display = 'none';
				break;
			}
		}
		if(me.onclear){
			me.onclear();
		}
	},
	getValue				: function() {
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
		return value === null ? '' : value;
	},
	showOrHideClearTrigger : function(show){
		var me = this,els = me.triggerEl.elements;
		var eLen = els.length;
		for (e = 0; e < eLen; e++) {
			el = els[e];
			if (el.dom.className.indexOf('x-form-clear-trigger') != -1) {
				if(show){
					el.dom.parentElement.style.display = '';
				}else{
					el.dom.parentElement.style.display = 'none';
				}
					break;
			}
		}
	},
	selectAll		: function(){
		var me = this,records = [];
		me.store.each(function(record) {
			records.push(record.get(me.valueField));
		});
		me.setValue(records);
		me.showOrHideClearTrigger(true);
	},
	onExpand: function() {
        var me = this,
            keyNav = me.listKeyNav,
            selectOnTab = me.selectOnTab,
            picker = me.getPicker();

        // Handle BoundList navigation from the input field. Insert a tab listener specially to enable selectOnTab.
        if (keyNav) {
            keyNav.enable();
        } else {
            keyNav = me.listKeyNav = new Ext.view.BoundListKeyNav(this.inputEl, {
                boundList: picker,
                forceKeyDown: true,
                tab: function(e) {
                    if (selectOnTab) {
                        this.selectHighlighted(e);
                        me.triggerBlur();
                    }
                    // Tab key event is allowed to propagate to field
                    return true;
                },
                enter: function(e){
                    var selModel = picker.getSelectionModel(),
                        count = selModel.getCount();
                        
                    this.selectHighlighted(e);
                    
                    // Handle the case where the highlighted item is already selected
                    // In this case, the change event won't fire, so just collapse
                    if (!me.multiSelect && count === selModel.getCount()) {
                        me.collapse();
                    }
                }
            });
        }

        // While list is expanded, stop tab monitoring from Ext.form.field.Trigger so it doesn't short-circuit selectOnTab
        if (selectOnTab) {
            me.ignoreMonitorTab = true;
        }

        Ext.defer(keyNav.enable, 1, keyNav); //wait a bit so it doesn't react to the down arrow opening the picker
        me.inputEl.focus();
    }
});