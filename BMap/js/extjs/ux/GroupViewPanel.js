/**
 * 自定义GroupViewPanel对象
 * 
 * @class Ext.ux.view.GroupViewPanel  collapsible
 * @extends Ext.view.View x-grid-group-hd-collapsed
 */ 
windowEventKey = 0; 
function selectTemplate(evt,el){
	var dd = Ext.get(el);
	//console.log('click='+windowEventKey);
	//普通点击
	if(windowEventKey == 0){
		if(dd.getAttribute("selected")=="true"){
			this.selectTemplate(dd,false);
			this.lastSelectTemplate = null;
		}else{
			this.selectTemplate(dd,true);
			if(this.lastSelectTemplate){
				this.selectTemplate(this.lastSelectTemplate,false);
			}
			this.lastSelectTemplate = dd;
		}
	}else if(windowEventKey == 1 || windowEventKey == 2){
		//ctrl+点击
		if(dd.getAttribute("selected")=="true"){
			this.selectTemplate(dd,false);
			if(this.selectedModel.length>0){
				this.lastSelectTemplate = Ext.get(this.selectedModel[this.selectedModel.length-1]);
			}else{
				this.lastSelectTemplate = null;
			}
		}else{
			this.selectTemplate(dd,true);
			this.lastSelectTemplate = dd;
		}
	}else if(windowEventKey == 2){//暂时未做,同ctrl+点击处理
	}
}
function openTemplate(evt,el){
	var moduleId = 2553;
	if(isKtemplate){
		moduleId = 2555;
	}
	var dd = Ext.get(el);
	var title = dd.down('h4').getHTML();
	var url = "/analysisConfigController.do?method=begin&anykpi=1&moduleId="+moduleId+"&tempId="
		+dd.getAttribute('tempId')+"&iframeTitle="+title;
	if(isKtemplate){
		url += '&k=1';
	}	
	if(window.top.CreateDiv){
		window.top.CreateDiv(moduleId , url, title);
	}else{
		window.open(url);
	}
}
Ext.define('Ext.ux.view.GroupViewPanel', {
	extend				: 'Ext.view.View',
	alias				: 'widget.groupviewpanel',
	frame				: true,
	itemSelector		: 'dl',
	tpl                 : Ext.create('Ext.XTemplate',
				            '<div id="sample-ct">',
				                '<tpl for=".">',
				                    '<div style="clear:left" class="x-grid-group-hd-collapsible">',
				                        '<h2><div class="x-grid-group-title">{templateTypeName}</div></h2>',
				                        '<dl>',
				                            '<tpl for="cfgAnykpiTemplateMags">',
				                                '<dd class="templateDd" tempId="{tempId}">',
				                                	'<img src="' + APPBASE + '/web/images/template/template.png"/>',
				                                    '<div><h4>{tempName}</h4></div>',
				                                '</dd>',
				                            '</tpl>',
				                        '</dl>',
				                    '</div>',
				                '</tpl>',
				            '</div>'
	),
	//被选中的模板
	selectedModel	: [],
	//上次被选中的模板
	lastSelectTemplate : null,
	//1:ctrl或者2:shift事件
	selectKey	: 0,
	// 重写初始化方法，添加viewready事件
	initComponent		: function() {
		this.on("viewready", function() {
			this.initHover();
			this.initClick(this.selectedModel);
		}, this);
		this.on("afterlayout", function() {
			console.log($('.x-grid-group-hd-collapsible'));
			$('.x-grid-group-hd-collapsible').on('click',function(){
				console.log($('.x-grid-group-hd-collapsible'));
				$(this).toggleClass("x-grid-group-hd-collapsed");
			});
		}, this);
		this.callParent();
	},

	// 点击面板容器事件
	onContainerClick	: function(e) {
		var group = e.getTarget('h2', 3, true);
		if (group) {
			group.up('div').toggleCls('collapsed');
			group.up('div').toggleCls('x-grid-group-hd-collapsed');
		}
	},
	//初始化鼠标点击事件
	initClick	: function(selectedModel){
		//监听键盘事件
		$(document).keydown(function(event){
		  switch(event.keyCode) {
		    case 17 : windowEventKey = 1;break;//Ctrl
		    case 16 : windowEventKey = 2;break;//Shift
		    default : break;
		  }
		}).keyup(function(event){
			windowEventKey = 0;
		});
		if(!rights.canAdd && !rights.canModify && !rights.canDelete){
			//鼠标单击事件
			this.getEl().on("click", openTemplate, this, {
				delegate	: "dd"
			});
		}else{
			//鼠标单击事件
			this.getEl().on("click", selectTemplate, this, {
				delegate	: "dd"
			});
			//鼠标双击事件
			this.getEl().on("dblclick", openTemplate, this, {
				delegate	: "dd"
			});
		}
	},
	/**
	*	选择或取消选择模板
	*/
	selectTemplate : function(dd,select){
		if(select){
			this.selectedModel.push(dd.getAttribute('tempId'));
			dd.addCls("selected");
			dd.set({selected : 'true'});
		}else{
			dd.removeCls("selected");
			dd.set({selected : 'false'});
			for(var i in this.selectedModel){
				if(this.selectedModel[i]==dd.getAttribute('tempId')){
					this.selectedModel.splice(i,1);
					break;
				}
			}
		}
	},
	/**
	*	获取已选中数据	
	*/
	getSelectModel : function(){
		return this.selectedModel;
	},
	// 初始化鼠标移上，移开事件
	initHover			: function() {
		this.getEl().on("mouseover", function(c, d) {
			Ext.get(d).addCls("over")
		}, this, {
			delegate	: "dd"
		});
		this.getEl().on("mouseout", function(c, d) {
			Ext.get(d).removeCls("over")
		}, this, {
			delegate	: "dd"
		})
	}
});