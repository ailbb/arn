Ext.define('ARNEXT.ARNEXT-Store', {
   extend: 'Ext.data.Store',
   alias: 'store.arnext-store',
   requires: [],

   model: Ext.create('ARNEXT.ARNEXT-Model', {}),

   proxy: {
      type: 'ajax',
      url: $AFPath + '/arn/ARN-DEMO/ext-js/ARNEXT-Data.json',

      reader: {
         type: 'json',
         rootProperty: 'data'
      }
   },
   autoLoad: true
});
