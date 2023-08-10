/**
 * 带清空选项的多选combox组件 如在不必选的环境下 建议使用此项
 * 
 * @class Ext.layout.component.CheckBoundList
 * @extends Ext.layout.component.BoundList
 */
Ext.define('Ext.layout.component.CheckBoundList', {
	extend				: 'Ext.layout.component.BoundList',
	alias				: 'layout.checkboundlist',
	publishInnerHeight	: function(ownerContext, height) {
		var toolbar = ownerContext.toolbarContext, toolbarHeight = 0;

		if (toolbar) {
			toolbarHeight = toolbar.getProp('height');
		}

		if (toolbarHeight === undefined) {
			this.done = false;
		} else {
			ownerContext.listContext.setHeight(height - 28 - ownerContext.getFrameInfo().height - toolbarHeight);
		}
	}
});