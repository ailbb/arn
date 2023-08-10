/**
 * A GridPanel class with live search support.
 * @author Nicolas Ferrero
 */
Ext.define('Ext.ux.BroadtechGridPanel', {
    extend: 'Ext.grid.Panel',
//    requires: [
//        'Ext.toolbar.TextItem',
//        'Ext.form.field.Checkbox',
//        'Ext.form.field.Text',
//        'Ext.ux.statusbar.StatusBar'
//    ],
    searchField : null,
    searchFieldCfg : {
    	searchValue : null, //关键词
    	searchType : 2, //高亮/过滤，默认高亮
    	isAddStatusBar : false,
    	
    	/**
	     * @private
	     * The row indexes where matching strings are found. (used by previous and next buttons)
	     */
    	indexes: [],
    	
    	/**
	     * @private
	     * The row index of the first search, it could change if next or previous buttons are used.
	     */
	    currentIndex: null,
	    
	    /**
	     * @private
	     * The generated regular expression used for searching.
	     */
	    searchRegExp: null,
	    
	    /**
	     * @private
	     * Case sensitive mode.
	     */
	    caseSensitive: false,
	    
        /**
	     * @private
	     * Regular expression mode.
	     */
	    regExpMode: false,
    	
	    /**
	     * @cfg {String} matchCls
	     * The matched string css classe.
	     */
	    matchCls: 'x-livesearch-match',
	    
	    defaultStatusText: ''
	    	
    },
    
    // Component initialization override: adds the top and bottom toolbars and setup headers renderer.
    initComponent: function() {
        var me = this;
        
        var searchBar = ['过滤：',{
             xtype: 'textfield',
             name: 'searchField',
             hideLabel: true,
             width: 200,
             listeners: {
                 change: {
                     fn: me.onSearchFieldChange,
                     scope: this,
                     buffer: 150
                 }
             }
        },{
            text : '设置',
		    menu: new Ext.menu.Menu({
		        items: [{
		        	text  : '过滤显示模式',
		        	group : 'serachType',
		        	showCheckbox:false,
		        	checked : (me.searchFieldCfg.searchType == 1),
                    checkHandler : function(item,checked){
		        		if(checked){
		        			me.searchFieldCfg.searchType = 1; //过滤
		        			me.onSearchFieldChange();
		        		}
		        	}
		        },{
		        	text  : '高亮显示模式',
		        	group : 'serachType',
		        	showCheckbox:false,
		        	checked : (me.searchFieldCfg.searchType == 2),
		        	checkHandler : function(item,checked){
		        		if(checked){
		        			me.searchFieldCfg.searchType = 2; //高亮
		        			me.onSearchFieldChange();
		        		}
		        	}
				},'-', {
	                text  : '正则表达式',
	                checked : false,
	                checkHandler: function(item, checked) {
				        me.searchFieldCfg.caseSensitive = checked;
				        me.onSearchFieldChange();
				    }
	            },'-',{
	            	text  : '区分大小写',
	                checked : false,
	                checkHandler: function(item, checked) {
				        me.searchFieldCfg.caseSensitive = checked;
				        me.onSearchFieldChange();
				    }
	            }]
		    })
        }
//        {
//            xtype: 'button',
//            text: '&lt;',
//            tooltip: '前一项',
//            handler: me.onPreviousClick,
//            scope: me
//        },{
//            xtype: 'button',
//            text: '&gt;',
//            tooltip: '后一项',
//            handler: me.onNextClick,
//            scope: me
//        }
        ];
        
        if(me.tbar){
        	//若已存在tbar，则加到配置的tbar后面
        	me.tbar = me.tbar.concat(searchBar);
        	//me.tbar.items.add(searchBar);
        }else{
        	me.tbar = searchBar;
        }
        
        if(me.searchFieldCfg.isAddStatusBar){
	        me.bbar = Ext.create('Ext.ux.StatusBar', {
	            defaultText: me.defaultStatusText,
	            name: 'searchStatusBar'
	        });
        }
        
        me.callParent(arguments);
    },
    
    // afterRender override: it adds textfield and statusbar reference and start monitoring keydown events in textfield input 
    afterRender: function() {
        var me = this;
        me.callParent(arguments);
        me.searchField = me.down('textfield[name=searchField]');
        if(me.searchFieldCfg.searchValue != null){
        	me.searchField.setValue(me.searchFieldCfg.searchValue);
        }
        if(me.searchFieldCfg.isAddStatusBar){
        	me.statusBar = me.down('statusbar[name=searchStatusBar]');
        }
    },
    // detects html tag
    tagsRe: /<[^>]*>/gm,
    
    // DEL ASCII code
    tagsProtect: '\x0f',
    
    // detects regexp reserved word
    regExpProtect: /\\|\/|\+|\\|\.|\[|\]|\{|\}|\?|\$|\*|\^|\|/gm,
    
    /**
     * In normal mode it returns the value with protected regexp characters.
     * In regular expression mode it returns the raw value except if the regexp is invalid.
     * @return {String} The value to process or null if the textfield value is blank or invalid.
     * @private
     */
    getSearchFieldValue: function() {
        var me = this,
            value = me.searchField.getValue();
            
        if (value === '') {
            return null;
        }
        if (!me.searchFieldCfg.regExpMode) {
            value = value.replace(me.regExpProtect, function(m) {
                return '\\' + m;
            });
        } else {
            try {
                new RegExp(value);
            } catch (error) {
            	if(me.searchFieldCfg.isAddStatusBar){
	                me.statusBar.setStatus({
	                    text: error.message,
	                    iconCls: 'x-status-error'
	                });
            	}
                return null;
            }
            // this is stupid
            if (value === '^' || value === '$') {
                return null;
            }
        }

        return value;
    },
    
    /**
     * Finds all strings that matches the searched value in each grid cells.
     * @private
     */
     onSearchFieldChange: function() {
         var me = this;

		 me.view.refresh();

		 if (me.columnFilterHeaderMenu) {
			// me.columnFilterHeaderMenu.cfm.removeAllFilter();
			me.store.clearFilter();
		 } else {
			me.store.clearFilter();
		 }

		 if (me.searchFieldCfg.isAddStatusBar) {
			// reset the statusbar
			me.statusBar.setStatus({
				text : me.searchFieldCfg.defaultStatusText,
				iconCls : ''
			});
		 }

         me.searchFieldCfg.searchValue = me.getSearchFieldValue();
         me.searchFieldCfg.indexes = [];
         me.searchFieldCfg.currentIndex = null;

         if (me.searchFieldCfg.searchValue !== null) {
         	
         	if (me.searchFieldCfg.searchType == 2) {//高亮模式
				var count = 0;
				me.searchFieldCfg.searchRegExp = new RegExp(me.searchFieldCfg.searchValue, 'g' + (me.searchFieldCfg.caseSensitive ? '' : 'i'));

				me.store.each(function(record, idx) {
					var td = Ext.fly(me.view.getNode(idx)).down('td'), 
						cell, matches, cellHTML;
					while (td) {
						cell = td.down('.x-grid-cell-inner');
						matches = cell.dom.innerHTML.match(me.tagsRe);
						cellHTML = cell.dom.innerHTML.replace(me.tagsRe, me.tagsProtect);

						// populate indexes array, set currentIndex, and replace
						// wrap matched string in a span
						cellHTML = cellHTML.replace(
							me.searchFieldCfg.searchRegExp, function(m) {
								count += 1;
								if (Ext.Array.indexOf(me.searchFieldCfg.indexes, idx) === -1) {
									me.searchFieldCfg.indexes.push(idx);
								}
								if (me.searchFieldCfg.currentIndex === null) {
									me.searchFieldCfg.currentIndex = idx;
								}
								return '<span class="' + me.searchFieldCfg.matchCls + '">' + m + '</span>';
							});
						// restore protected tags
						Ext.each(matches, function(match) {
							cellHTML = cellHTML.replace(me.tagsProtect, match);
						});
						// update cell html
						cell.dom.innerHTML = cellHTML;
						td = td.next();
					}
				}, me);

				// results found
				if (me.searchFieldCfg.currentIndex !== null) {
					me.getSelectionModel().select(me.searchFieldCfg.currentIndex);
					if(me.searchFieldCfg.isAddStatusBar){
						me.statusBar.setStatus({
							// text: count + ' matche(s) found.',
							text : '找到 ' + count + ' 条符合条件的数据',
							iconCls : 'x-status-valid'
						});
					}
				}
			}else{//过滤模式
				me.store.filterBy(function(record,idx){
					var td = Ext.fly(me.view.getNode(record)).down('td'), 
						cell, cellHTML;
					while (td) {
						cell = td.down('.x-grid-cell-inner');
						cellHTML = cell.dom.innerHTML.replace(me.tagsRe, me.tagsProtect);
						if(me.searchFieldCfg.caseSensitive){//区分大小写
							if(cellHTML.indexOf(me.searchFieldCfg.searchValue) != -1){
								return true;
							}
						}else{
							cellHTML = Ext.util.Format.uppercase(cellHTML);
							if(cellHTML.indexOf(Ext.util.Format.uppercase(me.searchFieldCfg.searchValue)) != -1){
								return true;
							}
						}

						td = td.next();
					}
					return false;
				});
			}
         }

         // no results found
         if (me.searchFieldCfg.currentIndex === null) {
             me.getSelectionModel().deselectAll();
         }

         // force textfield focus
         me.searchField.focus();
     }
    
// /**
// * Selects the previous row containing a match.
// * @private
// */
// onPreviousClick: function() {
// var me = this,
// idx;
//            
// if ((idx = Ext.Array.indexOf(me.indexes, me.currentIndex)) !== -1) {
//            me.currentIndex = me.indexes[idx - 1] || me.indexes[me.indexes.length - 1];
//            me.getSelectionModel().select(me.currentIndex);
//         }
//    },
//    
//    /**
//     * Selects the next row containing a match.
//     * @private
//     */    
//    onNextClick: function() {
//         var me = this,
//             idx;
//             
//         if ((idx = Ext.Array.indexOf(me.indexes, me.currentIndex)) !== -1) {
//            me.currentIndex = me.indexes[idx + 1] || me.indexes[0];
//            me.getSelectionModel().select(me.currentIndex);
//         }
//    },
});