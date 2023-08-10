Ext.define('Ext.form.field.ComboboxTree',{
	extend					: 'Ext.form.field.Picker',
	requires : ["Ext.tree.Panel"],
	alternateClassName		: 'Ext.form.ComboboxTree',
	alias					: ['widget.comboboxtree'],
	xtype				: 'combobox-tree',
	_value	: null,
	initTrigger				: function() {
		var me = this, triggerWrap = me.triggerWrap, triggerEl = me.triggerEl, disableCheck = me.disableCheck, els, eLen, el, e, idx;
		//me.setValue(null);
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
    setRawValue: function(value) {
        var me = this;
        value = Ext.value(me.transformRawValue(value), value);
        me.rawValue = value;
        if (me.inputEl) {
            me.inputEl.dom.value = value;
            me.inputEl.dom.setAttribute('title',value);
        }
        return value;
    },
    processRawValue : function(value){
    	return this._value;
    },
    setValue : function(value){
    	this._value = value;
        return value;
    },
    getValue : function(){
        return this._value;
    },
    getStore : function(){
    	return this.picker.getStore();
    },
    onTrigger1Click			: function() {
		var me = this, triggerEl = me.triggerEl, els, eLen, el;
		me.setValue(null);
		me.setRawValue(null);
		me.picker.clearAllValues();
		els = triggerEl.elements;
		eLen = els.length;
		for (e = 0; e < eLen; e++) {
			el = els[e];
			if (el.dom.className.indexOf('x-form-clear-trigger') != -1) {
				el.dom.parentElement.style.display = 'none';
				break;
			}
		}
	},
    showClearTrigger : function(){
    	var me=this,els = me.triggerEl.elements;
    	for (e = 0; e < els.length; e++) {
    		var el = els[e];
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
    },
	initComponent : function(){
		this.callParent();
		var me = this,
            picker,
            pickerCfg = {
            	floating: true,
                hidden: true,
                store: me.store,
                focusOnToFront: true,
                rootVisible: me.rootVisible || false,
                ownerCt : this.ownerCt,
                resizable:true,
                autoScroll : true, 
                clearAllValues:function(){
                	var records = picker.getSelectionModel().getSelection();
                	for(var i=0;i<records.length;i++){
                		records[i].set('checked',false);
                	}
                	picker.getSelectionModel().deselectAll();
                },
                maxHeight : me.maxHeight || 200,
                maxWidth : me.maxWidth || 200,
                //renderTo : Ext.getBody(),
                selModel : {
                	 mode: me.multiSelect ? 'SIMPLE' : 'SINGLE'
                }
            };
        picker = Ext.create('Ext.tree.Panel', pickerCfg);
        picker.on('itemclick',function(view,record){
        	if(me.multiSelect && record.get('checked')!=undefined){
        		record.set('checked',!record.get('checked'));
        	}
        });
        picker.on('select',function(view,record){
        	if(me.multiSelect && record.get('checked')==undefined){
        		picker.getSelectionModel().deselect(record);
        	}
        });
        picker.on('selectionchange',function(view,selected){
        	if(selected.length>0){
        		var rawvlues = [],values = [];
        		for(var i=0;i<selected.length;i++){
        			values.push(selected[i].get(me.valueField));
        			rawvlues.push(selected[i].get(me.displayField));
        		}
        		me.setValue(values);
        		me.setRawValue(rawvlues);
        		if(me.multiSelect==false)me.collapse();
        	}else{
        		me.setRawValue(null);
        		me.setValue(null);
        	}
        	if(me.clearable)me.showClearTrigger();
        });
		this.picker = picker;
	}
});