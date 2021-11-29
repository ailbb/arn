Ext.define('ARNEXT.ARNEXT-Controller', {
   extend: 'Ext.app.ViewController',
   alias: 'controller.arnext-controller',

   onCellclick: function( _this, td, cellIndex, record, tr, rowIndex, e, eOpts ) {
      Ext.alert("Row Has been click!");
   }
});
