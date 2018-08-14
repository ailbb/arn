Ext.define('Ext.data.reader.AnalysisJsonReader', {
    extend:  Ext.data.reader.Json ,
    alternateClassName: 'Ext.data.AnalysisJsonReader',
    alias : 'reader.analysisJson',
    //动态列处理逻辑
	dynamicColumnHandler : null,
	
	readRecords: function(data) {
        var me = this;
        if(me.dynamicColumnHandler != null){
        	me.dynamicColumnHandler.call(me,(data.dynamicColumns || null),(data.titles || null));
        }
        return me.callParent([data]);
    }
});