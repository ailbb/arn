// 逐行----
Ext.define('ARNEXT.ARNEXT-View', {
   extend: 'Ext.grid.Panel',
   xtype: 'arnext-grid',
   requires: [
      'ARNEXT.ARNEXT-Controller',
      // 'ARNEXT.ARNEXT-Store'
   ],

   title: 'Basic Grid',
   width: '100%',
   height: '100%',

   controller: 'arnext-controller',

   store: Ext.create('ARNEXT.ARNEXT-Store', {}),
   // store: null,
   // store: 'arnext-store',

   columns: [
      { text: 'Name',  dataIndex: 'name', width: 200 },
      { text: 'Email', dataIndex: 'email', width: 250 },
      { text: 'Phone', dataIndex: 'phone', width: 120 }
   ],


   listeners: {
      cellclick: 'onCellclick'
   }
});
