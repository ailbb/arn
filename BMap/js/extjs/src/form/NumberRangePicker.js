/**
 * A Picker field that contains a tree panel on its popup, enabling selection of tree nodes.
 */
Ext.define('Ext.form.NumberRangePicker', {
    extend: 'Ext.form.field.Picker',
    xtype: 'numberrangepicker',
    
    uses: [
        'Ext.tree.Panel'
    ],

    triggerCls: Ext.baseCSSPrefix + 'form-arrow-trigger',

    config: {
    	/**
    	 * 可选择的操作符
    	 * @type 
    	 */
    	checkItems : [
    		{"inputValue":"=", name : 'oper',"boxLabel":"="},
	        {"inputValue":">", name : 'oper',"boxLabel":"&gt;"},
	        {"inputValue":"<", name : 'oper',"boxLabel":"&lt;"},
	        {"inputValue":"≥", name : 'oper',"boxLabel":"≥"},
	        {"inputValue":"≤", name : 'oper',"boxLabel":"≤"},
	        {"inputValue":"min<x<max", name : 'oper',"boxLabel":"min&lt;x&lt;max"},
	        {"inputValue":"min<x≤max", name : 'oper',"boxLabel":"min&lt;x≤max"},
	        {"inputValue":"min≤x<max", name : 'oper',"boxLabel":"min≤x&lt;max"},
	        {"inputValue":"min≤x≤max", name : 'oper',"boxLabel":"min≤x≤max"}
    	],
    	
    	minValue : null,
    	maxValue : null,

        /**
         * @cfg {Number} maxPickerHeight
         * The maximum height of the tree dropdown. Defaults to 300.
         */
        maxPickerHeight: 300,

        /**
         * @cfg {Number} minPickerHeight
         * The minimum height of the tree dropdown. Defaults to 100.
         */
        minPickerHeight: 100
    },
   
    editable: false,

    initComponent: function() {
        var me = this;
        me.callParent(arguments);
    },
    
    onExpand : function(){
    	var me = this,val=me.ownerCt.getValues()[me.name];
    	if(val){
    		
    	}
    	console.log(me.getValue());
    },

    /**
     * Creates and returns the tree panel to be used as this field's picker.
     */
    createPicker: function() {
        var me = this,valNumber,minmaxFc,picker,view;
        var operrg = Ext.create('Ext.form.RadioGroup',{
        	width : 180,
        	columns: 2,
        	vertical: true,
        	listeners : {
        		change : function(ct,newval,oldval){
        			if(newval.oper.indexOf('min')>=0){
        				minmaxFc.show();
        				valNumber.hide();
        			}else{
        				minmaxFc.hide();
        				valNumber.show();
        			}
        		},
        		afterrender : function(ct){
        			for(var i=0;i<me.checkItems.length;i++){
        				if(me.checkItems[i].checked){
        					if(me.checkItems[i].inputValue.indexOf('min')>=0){
        						minmaxFc.show();
        						valNumber.hide();
        					}
        					break;
        				}
        			}        		
        		}
        	},
        	items : me.checkItems
        });
        valNumber = Ext.create('Ext.form.NumberField',{
        	fieldLabel : '值',
        	width : 180,
        	labelWidth : 50,
		    value : 0,
		    name : 'val',
		    hideTrigger : true
        });
        minmaxFc = Ext.create('Ext.form.FieldContainer',{
        	layout : 'hbox',
        	hidden : true,
        	width : 180,
        	items : [
        		{
        			xtype : 'numberfield',
        			fieldLabel : '最小值',
        			labelWidth : 40,
        			width : 90,
        			name : 'min',
        			minValue : me.minValue,
        			maxValue : me.maxValue,
        			hideTrigger : true
        		},
        		{
        			xtype : 'numberfield',
        			fieldLabel : '最大值',
        			minValue : me.minValue,
        			maxValue : me.maxValue,
        			labelWidth : 40,
        			width : 90,
        			name : 'max',
        			hideTrigger : true
        		}
        	]
        });
        var btn = Ext.create('Ext.button.Button',{
        	text : '确定',
        	width : '50%',
        	handler : function(){
        		if(!picker.getForm().isValid()) return;
        		me.value = picker.getValue();
        		me.setRawValue(picker.getRawValue());
        		
//        		me.ownerCt;
        		picker.hide();
        	}
        });
        picker = new Ext.form.Panel({
                floating: true,
                minHeight: me.minPickerHeight,
                maxHeight: me.maxPickerHeight,
                manageHeight: false,
                shadow: false,
                frame : true,
                minWidth : 200,
                height : 170,
                layout : 'anchor',
                viewConfig: {
                    listeners: {
                        scope: me,
                        render: me.onViewRender
                    }
                },
                items : [
                	operrg,valNumber,minmaxFc,btn
                ]
            });
        picker.setValue=function(val){
        	if(val && val.indexOf('x')>=0){
        		var reg=/(\d+\.{0,1}\d{0,})/g;
        		var matches = val.match(reg);
        		if(matches && matches.length==2){
        			minmaxFc.items.getAt(0).setValue(matches[0]);
        			minmaxFc.items.getAt(1).setValue(matches[1]);
        			operrg.setValue({oper:val.replace(matches[0],'min').replace(matches[1],'max')});
        			return;
        		}else{
        			var submatch = val.match(/(\d+\.{0,1}\d{0,})/);
        			if(val.indexOf('∞')>=0){
        				operrg.setValue({oper:val.replace('∞','max')});
        				minmaxFc.items.getAt(1).setValue('∞');
        				if(submatch && submatch.length>0){
        					minmaxFc.items.getAt(0).setValue(submatch[0]);
	        				operrg.setValue({oper:val.replace(submatch[0],'min')});
        				}else{
	        				minmaxFc.items.getAt(0).setValue(0);
	        				operrg.setValue({oper:val.replace(0,'min')});
        				}
        			}else{
        				minmaxFc.items.getAt(0).setValue('');
	        			operrg.setValue({oper:'min'+val});
        				if(submatch && submatch.length>0){
	        				minmaxFc.items.getAt(1).setValue(submatch[0]);
	        				operrg.setValue({oper:val.replace(submatch[0],'max')});
        				}else{
        					minmaxFc.items.getAt(1).setValue('');
	        				operrg.setValue({oper:val+'max'});
        				}
        			}
        			return;
        		}
        	}else if(val){
        		var oper = val.substring(0,1),valnum=val.substring(1);
        		valNumber.setValue(valnum);
        		operrg.setValue({oper:oper});
        		minmaxFc.items.getAt(0).setValue(null);
        		minmaxFc.items.getAt(1).setValue(null);
        		return;
        	}
        	operrg.setValue({oper:null});
    		valNumber.setValue(null);
    		minmaxFc.items.getAt(0).setValue(null);
    		minmaxFc.items.getAt(1).setValue(null);
        };
        if(me.value){
        	picker.setValue(me.value);
        }
        picker.getValue=function(){
        	if(operrg.getChecked().length==0) return null;
        	var oper = operrg.getValue().oper;
        	if(oper.length==1){
        		return oper+valNumber.getValue();
        	}else{
        		var v1=minmaxFc.items.getAt(0).getValue(),
        			v2=minmaxFc.items.getAt(1).getValue();
        		if(!v1&&!v2){
        			return "";
        		}	
        		return oper.replace('min',v1?v1:'0').replace('max',v2?v2:'∞');
        	}
        };
        picker.getRawValue=function(){
        	return picker.getValue();
        };
        return picker;
    },
    onViewRender: function(view){
        view.getEl().on('keypress', this.onPickerKeypress, this);
    },
    onPickerKeypress: function(e, el) {
        var key = e.getKey();
    },

    /**
     * repaints the tree view
     */
    repaintPickerView: function() {
        var style = this.picker.getView().getEl().dom.style;

        // can't use Element.repaint because it contains a setTimeout, which results in a flicker effect
        style.display = style.display;
    },

    /**
     * Aligns the picker to the input element
     */
    alignPicker: function() {
        var me = this,
            picker;

        if (me.isExpanded) {
            picker = me.getPicker();
            if (me.matchFieldWidth) {
                // Auto the height (it will be constrained by max height)
                picker.setWidth(me.bodyEl.getWidth());
            }
            if (picker.isFloating()) {
                me.doAlign();
            }
        }
    },

    /**
     * Sets the specified value into the field
     * @param {Mixed} value
     * @return {Ext.ux.TreePicker} this
     */
    setValue: function(value,frompicker) {
        var me = this,
            record;

        me.value = value;
        if(me.picker){
	        me.picker.setValue(value);
	        me.setRawValue(me.picker.getRawValue());
        }else{
        	if(value && value!="≤x≤∞"){
	        	me.setRawValue(value);
        	}
        	console.log('value='+value);
        }
        return me;
    },
    
    getSubmitValue: function(){
        return this.value;    
    },

    /**
     * Returns the current data value of the field (the idProperty of the record)
     * @return {Number}
     */
    getValue: function() {
        return this.value;
    }

});

