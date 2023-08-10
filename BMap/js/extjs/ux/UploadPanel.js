
/**

 * 多文件上传组件 
 * for extjs4.0
 * @author caizhiping
 * @since 2012-11-15
 */
//var uploadPanel;
Ext.define('Ext.ux.uploadPanel.UploadPanel',{
	extend : 'Ext.grid.Panel',
	alias : 'widget.uploadpanel',
	id:'gridPanel',
	width : 700,
	height : 300,
	uploadCount : 0,
	modulePath : 'web/page/upload/',
	//selModel: Ext.create('Ext.selection.CheckboxModel',{mode:"SIMPLE"}),	
	columns : [
        {xtype: 'rownumberer'},
		{text: '文件名', width: 100,dataIndex: 'name'},
		{text: '自定义文件名', width: 110,dataIndex: 'fileName',editor: {xtype: 'textfield'}},
        {text: '类型', width: 70,dataIndex: 'type'},
        {text: '大小', width: 70,dataIndex: 'size',renderer:function(v){
        	return Ext.util.Format.fileSize(v);
        }},
        {text: '进度', width: 130,dataIndex: 'percent',renderer:function(v){        	
			var stml =
				'<div>'+
					'<div style="border:1px solid #008000;height:10px;width:115px;margin:2px 0px 1px 0px;float:left;">'+		
						'<div style="float:left;background:#FFCC66;width:'+v+'%;height:8px;"><div></div></div>'+
					'</div>'+
				//'<div style="text-align:center;float:right;width:40px;margin:3px 0px 1px 0px;height:10px;font-size:12px;">{3}%</div>'+			
			'</div>';
			return stml;
        }},
        {text: '状态', width: 80,dataIndex: 'status',renderer:function(v){
			var status;
			if(v==-1){
				status = "等待上传";
			}else if(v==-2){
				status =  "上传中...";
			}else if(v==-3){
				status =  "<div style='color:red;'>上传失败</div>";
			}else if(v==-4){
				status =  "上传成功";
			}else if(v==-5){
				status =  "停止上传";
			}		
			return status;
		}},
        {
            xtype:'actioncolumn',
            width:50,
            items: [{
                icon: APPBASE+'/web/page/upload/'+'icons/delete.gif',
                tooltip: 'Remove',
                handler: function(grid, rowIndex, colIndex) {
                	var id = grid.store.getAt(rowIndex).get('id');
                    grid.store.remove(grid.store.getAt(rowIndex));
                    var panel = this.up('uploadpanel');
                    panel.swfupload.cancelUpload(id,false);			
                    panel.swfupload.uploadStopped = false;
                    panel.uploadCount--;
                }
            }]
        }
    ],
    plugins: [
        Ext.create('Ext.grid.plugin.CellEditing', {
            clicksToEdit: 1
        })
    ],    
    store : Ext.create('Ext.data.JsonStore',{
    	autoLoad : false,
    	fields : ['id','name','type','size','percent','status','fileName']
    }),
	addFileBtnText : '新增',
	uploadBtnText : '上传',
	removeBtnText : '删除所有',
	cancelBtnText : '停止',
	debug : false,
	selectedType : '8',
	file_size_limit : 100,//MB
	file_types : '*.*',
	file_types_description : 'All Files',
	file_upload_limit : 50,
	file_queue_limit : 0,
	fileQueued : 2,
	post_params : {},
	upload_url : 'test.do',
	flash_url : APPBASE+'/web/page/upload/'+"swfupload/swfupload.swf",
	flash9_url : APPBASE+'/web/page/upload/'+"swfupload/swfupload_fp9.swf",
	initComponent : function(){		
		this.dockedItems = [{
		    xtype: 'toolbar',
		    dock: 'top',
		    items: [
		        { 
		        	xtype : 'combo',
			        itemId: 'provinceCombo',
			        id : 'provinceCombo',
			        fieldLabel : '省份',
			        labelWidth : 30,
			        width : 120,
			        displayField: 'provinceName',
			        valueField: 'provinceCode',
			        store : Ext.create('Ext.data.Store', {
						fields: ['provinceName','provinceCode'],
						proxy: {
					         type: 'ajax',
					         url : APPBASE+'/kvquery.do?method=province',
					         reader: {
					             type: 'json',
					             root: 'data'
					         }
					    },
					    autoLoad : true
					}),
					value : userRegionId,
					editable : false,
			        validateOnChange	: false,
					queryMode	:	'remote',
			        listeners : {
			        	change : function(c,v){
			        		Ext.getCmp('cityCombo').getStore().proxy.url=APPBASE+'/kvquery.do?method=city&provinceCode='+v;
			        		Ext.getCmp('cityCombo').getStore().load();
			        	}
			        }
		        },{ 
		        	xtype : 'combo',
			        itemId: 'cityCombo',
			        id : 'cityCombo',
			        fieldLabel : '地市',
			        labelWidth : 30,
			        width : 120,
			        displayField: 'cityName',
			        valueField: 'cityCode',
			        store : Ext.create('Ext.data.Store', {
						fields: ['cityName','cityCode'],
						proxy: {
					         type: 'ajax',
					         url: APPBASE+'/kvquery.do?method=city&provinceCode='+userRegionId,
					         reader: {
					             type: 'json',
					             root: 'data'
					         }
					    },
					    listeners : {
					    	load : function(s,rcds){
					    		if(rcds && rcds.length>0){
						    		Ext.getCmp('cityCombo').setValue(rcds[0].get('cityCode'));
					    		}
					    	}
					    },
					    autoLoad : true
					}),
					editable : false,
			        validateOnChange	: false,
					queryMode	:	'remote'
		        },{ 
		        	xtype : 'combo',
			        itemId: 'typeCombo',
			        id : 'typeCombo',
			        fieldLabel : '类型',
			        labelWidth : 30,
			        width : 120,
			        displayField: 'typeName',
			        valueField: 'typeValue',
			        store : Ext.create('Ext.data.Store', {
						fields: ['typeName','typeValue'],
					    data : [{'typeName' : '4G基础信息表','typeValue' : '8'},
					             {'typeName' : '铁塔数据','typeValue' : '10'},
					             {'typeName' : '电信','typeValue' : '11'},
					             {'typeName' : '移动','typeValue' : '12'},
					             {'typeName' : '资源现状','typeValue' : '13'},
					             {'typeName' : '楼宇库','typeValue' : '14'}]
					    
					}),
					editable : false,
					queryMode	:	'local',
					value : '8',
					listeners : {
						change : function(o,v){
							this.up('panel').selectedType = v;
							this.up('panel').onRemove();
						}
					}
		        },{ 
			        xtype:'button',
			        itemId: 'addFileBtn',
			        iconCls : 'add',
			        id : '_btn_for_swf_',
			        text : this.addFileBtnText
		        },{ xtype: 'tbseparator' },{
		        	xtype : 'button',
		        	itemId : 'uploadBtn',
		        	iconCls : 'up',
		        	text : this.uploadBtnText,
		        	scope : this,
		        	handler : this.onUpload
		        },{ xtype: 'tbseparator' },{
		        	xtype : 'button',
		        	id : 'removeBtn',
		        	itemId : 'removeBtn',
		        	iconCls : 'trash',
		        	text : this.removeBtnText,
		        	scope : this,
		        	handler : this.onRemove
		        },{ xtype: 'tbseparator' },{
		        	xtype : 'button',
		        	itemId : 'cancelBtn',
		        	iconCls : 'cancel',
		        	disabled : true,
		        	text : this.cancelBtnText,
		        	scope : this,
		        	handler : this.onCancelUpload
		        }
		    ]
		}];
		
		this.callParent();
		this.down('button[itemId=addFileBtn]').on({			
			afterrender : function(btn){
				var config = this.getSWFConfig(btn);		
				this.swfupload = new SWFUpload(config);
				Ext.get(this.swfupload.movieName).setStyle({
					position : 'absolute',
					top : 0,
					left : -2
				});	
			},
			scope : this,
			buffer:300
		});
	},
	getSWFConfig : function(btn){
		var me = this;
		var placeHolderId = Ext.id();
		var em = btn.getEl().child('em');
		if(em==null){
			em = Ext.get(btn.getId()+'-btnWrap');
		}		
		em.setStyle({
			position : 'relative',
			display : 'block'
		});
		em.createChild({
			tag : 'div',
			id : placeHolderId
		});
		return {
			debug: me.debug,
			flash_url : me.flash_url,
			flash9_url : me.flash9_url,	
			//upload_url: me.upload_url,
			upload_url: APPBASE+'/publicParamImport.do?method=upload&timestamp='+me.timestamp,
			post_params: me.post_params||{savePath:'upload\\'},
			file_size_limit : (me.file_size_limit*1024),
			file_types : me.file_types,
			file_types_description : me.file_types_description,
			file_upload_limit : me.file_upload_limit,
			file_queue_limit : me.file_queue_limit,
			button_width: em.getWidth(),
			button_height: em.getHeight(),
			button_window_mode: SWFUpload.WINDOW_MODE.TRANSPARENT,
			button_cursor: SWFUpload.CURSOR.HAND,
			button_placeholder_id: placeHolderId,
			custom_settings : {
				scope_handler : me
			},
			swfupload_preload_handler : me.swfupload_preload_handler,
			file_queue_error_handler : me.file_queue_error_handler,
			swfupload_load_failed_handler : me.swfupload_load_failed_handler,
			upload_start_handler : me.upload_start_handler,
			upload_progress_handler : me.upload_progress_handler,
			upload_error_handler : me.upload_error_handler,
			upload_success_handler : me.upload_success_handler,
			upload_complete_handler : me.upload_complete_handler,
			file_queued_handler : me.file_queued_handler/*,
			file_dialog_complete_handler : me.file_dialog_complete_handler*/
		};
	},
	swfupload_preload_handler : function(){
		if (!this.support.loading) {
			Ext.Msg.show({
				title : '提示',
				msg : '浏览器Flash Player版本太低,不能使用该上传功能！',
				width : 250,
				icon : Ext.Msg.ERROR,
				buttons :Ext.Msg.OK
			});
			return false;
		}
	},
	file_queue_error_handler : function(file, errorCode, message){
		switch(errorCode){
			case SWFUpload.QUEUE_ERROR.QUEUE_LIMIT_EXCEEDED : msg('上传文件列表数量超限,不能选择！');
			break;
			case SWFUpload.QUEUE_ERROR.FILE_EXCEEDS_SIZE_LIMIT : msg('文件大小超过限制, 不能选择！');
			break;
			case SWFUpload.QUEUE_ERROR.ZERO_BYTE_FILE : msg('该文件大小为0,不能选择！');
			break;
			case SWFUpload.QUEUE_ERROR.INVALID_FILETYPE : msg('该文件类型不允许上传！');
			break;
		}
		function msg(info){
			Ext.Msg.show({
				title : '提示',
				msg : info,
				width : 250,
				icon : Ext.Msg.WARNING,
				buttons :Ext.Msg.OK
			});
		}
	},
	swfupload_load_failed_handler : function(){
		Ext.Msg.show({
			title : '提示',
			msg : 'SWFUpload加载失败！',
			width : 180,
			icon : Ext.Msg.ERROR,
			buttons :Ext.Msg.OK
		});
	},
	upload_start_handler : function(file){
		var me = this.settings.custom_settings.scope_handler;
		me.down('#cancelBtn').setDisabled(false);	
		var rec = me.store.getById(file.id);
		this.setFilePostName(rec.get('fileName'));
	},
	upload_progress_handler : function(file, bytesLoaded, bytesTotal){
		var me = this.settings.custom_settings.scope_handler;		
		var percent = Math.ceil((bytesLoaded / bytesTotal) * 100);
		percent = percent == 100? 99 : percent;
       	var rec = me.store.getById(file.id);
       	rec.set('percent', percent);
		rec.set('status', file.filestatus);
		rec.commit();
	},
	upload_error_handler : function(file, errorCode, message){
		Ext.Msg.alert("网络错误", "与服务器网络连接失败，请刷新页面重试！");
		var me = this.settings.custom_settings.scope_handler;		
		var rec = me.store.getById(file.id);
       	rec.set('percent', 0);
		rec.set('status', file.filestatus);
		rec.commit();
		me.onCancelUpload.call(me);
	},
	upload_success_handler : function(file, serverData, responseReceived){
		var me = this.settings.custom_settings.scope_handler;		
		var rec = me.store.getById(file.id);
	    rec.set('percent', 100);
		rec.set('status', file.filestatus);			
	
		rec.commit();
		if (this.getStats().files_queued > 0 && this.uploadStopped == false) {
			this.startUpload();
		}else{
			me.showBtn(me,true);
		}
	},
	upload_complete_handler : function(file){
		var me = this.settings.custom_settings.scope_handler;
		me.uploadCount++;
		if (me.store.getCount() == me.uploadCount){
			Ext.get('importmsg').setHTML("开始导入");
			me.getMask().show();
			me.doImport();
			/*
			if(flag)
			{
				if(Ext.get('importmsg').getHTML().length > 0)
					Ext.get('importmsg').setHTML(Ext.get('importmsg').getHTML() + "</br>" + "上传文件归档成功!");
				else 
					Ext.get('importmsg').setHTML("上传文件归档成功!");
			}else
			{
				if(Ext.get('importmsg').getHTML().length > 0)
					Ext.get('importmsg').setHTML(Ext.get('importmsg').getHTML() + "</br>" + "上传文件归档失败!");
				else 
					Ext.get('importmsg').setHTML("上传文件归档失败!");
			}*/
		}
	},
	file_queued_handler : function(file){
		var me = this.settings.custom_settings.scope_handler;
		me.store.add({
			id : file.id,
			name : file.name,
			fileName : file.name,
			size : file.size,
			type : file.type,
			status : file.filestatus,
			percent : 0
		});
	},
	doZip:function(){
		var me = this;
	 	var province_id = Ext.getCmp('provinceCombo').getValue();
		var city_id = Ext.getCmp('cityCombo').getValue();
		var type_id = Ext.getCmp('typeCombo').getValue();
		var grid = Ext.getCmp('gridPanel');
		var returnValue = false;
		var qList = [11,12,13,14];
		
		if(qList.indexOf(type_id) != -1) type_id = 10;
		
		Ext.Ajax.request({
                url: APPBASE + "/publicParamImport.do?method=zipFile&timestamp="+me.timestamp,
                params: { 
                			provinceId: province_id, 
                			cityId: city_id,
                			typeId:type_id
                		},
                method: 'POST',
                async :  false,
                success: function (response, options) {
                    if('1' == response.responseText)   //ZIP压缩成功
                    {
                    	returnValue = true;
                    } 
                    
                },
                failure: function (response, options) {
                   console.log('失败', '请求超时或网络故障,错误编号：' + response.status);
                }
            });
            
            return returnValue;
	},
	onUpload : function(){
		var checkArr = [];
		var mustFileName = ['CONF_EUTRANCELL','CONF_ENODEB', 'CONF_SCENE_PRIORITY'];
		var otherFileName = ['CONF_TRANS_LINE.xlsx','CONF_INDOOR_BUIDING.xlsx','CONF_INDOOR_SUBWAYTUNNEL.xlsx'];
//		var pylonFileName = ['CONF_TOWER_DEMAND_LATEST.xlsx','CONF_TOWER_EXSIT_LATEST.xlsx'];
		var fileNameEnd = ['.xlsx'];
		var flagEnd;
		var len = 0;
		
		for(var i = 0; i < this.store.getCount(); i++){
			var record = this.store.getAt(i);
			if(record.get("status") == -1 || record.get("status")==-5){
				var type = record.get('type');
				if(fileNameEnd.indexOf(type) == -1){
					Ext.Msg.alert("提示",type + "不合符上传文件类型标准");
					return;
				}
				if(!flagEnd){
					flagEnd = type;
				}
				if(flagEnd){
					if(flagEnd != type){
						Ext.Msg.alert("提示","批量上传的文件类型必须一致");
						return;
					}
				}
				var fileName = record.get('fileName');
				if(".xlsx" == flagEnd){
					if(this.selectedType == '8'){
						for(var s in mustFileName) {
							if(fileName.indexOf(mustFileName[s]) != -1) {
								sbol = true;
								break;
							}
						}

						if(!sbol) {
							Ext.Msg.alert("提示",fileName + "不合符上传文件名称标准");
							return;
						}
					}else if(this.selectedType == '9'){
						if(otherFileName.indexOf(fileName) == -1){
							Ext.Msg.alert("提示",fileName + "不合符上传文件名称标准");
							return;
						}
					}else if(this.selectedType == '10'){
						var selectName = ['规划需求收集','存量库模板'];
						var sbol = false;
						for(var s in selectName) {
							if(fileName.indexOf(selectName[s]) != -1) {
								sbol = true;
								break;
							}	
						}
						
						if(!sbol) {
							Ext.Msg.alert("提示",fileName + "不合符上传文件名称标准");
							return;
						}
						
					}else if(this.selectedType == '11'){
						var selectName = ['电信'];
						var sbol = false;
						for(var s in selectName) {
							if(fileName.indexOf(selectName[s]) != -1) {
								sbol = true;
								break;
							}	
						}
						
						if(!sbol) {
							Ext.Msg.alert("提示",fileName + "不合符上传文件名称标准");
							return;
						}
						
					}else if(this.selectedType == '12'){
						var selectName = ['移动'];
						var sbol = false;
						for(var s in selectName) {
							if(fileName.indexOf(selectName[s]) != -1) {
								sbol = true;
								break;
							}	
						}
						
						if(!sbol) {
							Ext.Msg.alert("提示",fileName + "不合符上传文件名称标准");
							return;
						}
						
					}else if(this.selectedType == '13'){
						var selectName = ['现状表单','基站固定资源','室分固定资源','室分楼宇与运行小区映射表','物理站址映射表'];
						var sbol = false;
						for(var s in selectName) {
							if(fileName.indexOf(selectName[s]) != -1) {
								sbol = true;
								break;
							}	
						}
						
						if(!sbol) {
							Ext.Msg.alert("提示",fileName + "不合符上传文件名称标准");
							return;
						}
						
					}else if(this.selectedType == '14'){ // 现状库
						var selectName = ['楼宇基础信息'];
						var sbol = false;
						for(var s in selectName) {
							if(fileName.indexOf(selectName[s]) != -1) {
								sbol = true;
								break;
							}	
						}
						
						if(!sbol) {
							Ext.Msg.alert("提示",fileName + "不合符上传文件名称标准");
							return;
						}
						
					}else{
						Ext.Msg.alert("提示","请选择一个上传类型");
						return;
					}
				}
				if(checkArr.indexOf(fileName) != -1){
					Ext.Msg.alert("提示",fileName + "重复上传");
					return;
				}
				checkArr.push(fileName);
				len++;
			}
		}
		if(this.selectedType == '8'){
			if(checkArr.length != mustFileName.length){
				Ext.Msg.alert("提示","上传文件个数错误：" + mustFileName.length);
				return;
			}
		}else if(this.selectedType == '9'){
			if(checkArr.length != 3){
				Ext.Msg.alert("提示","上传文件个数错误3");
				return;
			}
		}else if(this.selectedType == '10'){
			var selectName = ['规划需求收集','存量库模板'];
			if(checkArr.length != selectName.length){
				Ext.Msg.alert("提示","上传文件个数错误："+selectName.length);
				return;
			}
		}else if(this.selectedType == '11'){
			var selectName = ['电信'];
			if(checkArr.length != selectName.length){
				Ext.Msg.alert("提示","上传文件个数错误："+selectName.length);
				return;
			}
		}else if(this.selectedType == '12'){
			var selectName = ['移动'];
			if(checkArr.length != selectName.length){
				Ext.Msg.alert("提示","上传文件个数错误："+selectName.length);
				return;
			}
		}else if(this.selectedType == '13'){ // 现状资源
			var selectName = ['现状表单','基站固定资源','室分固定资源','物理站址映射表'];
			for(var st in selectName){
				var bol = false;
				for(ca in checkArr) {
					if(checkArr[ca].indexOf(selectName[st]) != -1) bol = true;
				} 
				if(!bol) {
					Ext.Msg.alert("提示","上传文件错误！缺少必须文件："+selectName[st]);
					return;
				}
			}
			if(checkArr.length < 4){
				Ext.Msg.alert("提示","上传文件个数错误："+selectName.length);
				return;
			}
		}else if(this.selectedType == '14'){ // 现状库
			var selectName = ['楼宇基础信息'];
			if(checkArr.length != selectName.length){
				Ext.Msg.alert("提示","上传文件个数错误："+selectName.length);
				return;
			}
		}else{
			Ext.Msg.alert("提示","请选择一个上传类型");
			return;
		}
//		var sm=this.getSelectionModel();		
//		var rc=sm.getSelection();		
//		if (rc.length == 0) {
//			alert("请选择文件");
//			return;
//		}
		
//		this.showBtn(this,false);
//		this.swfupload.uploadStopped = false;	
//		for(var i=0;i<rc.length;i++){
//			var record = rc[i];
//			if(record.get("status") == -1 || record.get("status")==-5){
//					this.swfupload.startUpload(record.get("id"));
//			}
//			
//		}
		if (this.swfupload&&this.store.getCount()>0) {
			this.showBtn(this,false);
			this.swfupload.uploadStopped = false;	
			for(var i=0;i< this.store.getCount();i++){
				var record = this.store.getAt(i);
				if(record.get("status") == -1 || record.get("status")==-5){
					this.swfupload.startUpload(record.get("id"));
				}
			}
		}
		
	},
	showBtn : function(me,bl){
		me.down('#addFileBtn').setDisabled(!bl);
		me.down('#uploadBtn').setDisabled(!bl);
		me.down('#removeBtn').setDisabled(!bl);
		me.down('#cancelBtn').setDisabled(bl);
		if(bl){
			me.down('actioncolumn').show();
		}else{
			me.down('actioncolumn').hide();
		}		
	},
	onRemove : function(){
		var ds = this.store;
		for(var i=0;i<ds.getCount();i++){
			var record =ds.getAt(i);
			var file_id = record.get('id');
			this.swfupload.cancelUpload(file_id,false);			
		}
		ds.removeAll();
		this.swfupload.uploadStopped = false;
		this.uploadCount = 0;
	},
	onCancelUpload : function(){
		if (this.swfupload) {
			this.swfupload.uploadStopped = true;
			this.swfupload.stopUpload();
			this.showBtn(this,true);
		}
	},
	getRootPath : function(){
	    //获取当前网址，如： http://localhost:8083/uimcardprj/share/meun.jsp
	    var curWwwPath=window.document.location.href;
	    //获取主机地址之后的目录，如： uimcardprj/share/meun.jsp
	    var pathName=window.document.location.pathname;
	    var pos=curWwwPath.indexOf(pathName);
	    //获取主机地址，如： http://localhost:8083
	    var localhostPaht=curWwwPath.substring(0,pos);
	    //获取带"/"的项目名，如：/uimcardprj
	    var projectName=pathName.substring(0,pathName.substr(1).indexOf('/')+1);
	    return(localhostPaht+projectName);
	},
	getMask : function(){
		var _mask = new Ext.LoadMask(Ext.getBody(),{
			msg : '上传成功，正在导入，请稍候...'
		});
		return _mask;
	},
	doImport : function(){
		var me = this;
		Ext.get('importmsg').setHTML("");

		var type_id = Ext.getCmp('typeCombo').getValue();

		var qList = [11,12,13,14];
		if(qList.indexOf(type_id) != -1) type_id = 10;
		
		Ext.Ajax.request({
			timeout : 1 * 60 * 60 * 1000,

	        url: APPBASE + "/publicParamImport.do?method=import&timestamp="+me.timestamp,	
			 params : {
			 	province_id : Ext.getCmp('provinceCombo').getValue(),
			 	city_id : Ext.getCmp('cityCombo').getValue(),
			 	importType: type_id
			 },
		     method: 'post',
		     async :  true,
		     success:function(response){
		    	me.getMask().hide();
		        var result = Ext.JSON.decode(response.responseText,true);
		        if(result != null){
		        	if(result.success){
						//压缩excel
						var flag = me.doZip();
	        			var _rootPath = me.getRootPath();
		        		var innelHtml = Ext.get('importmsg').getHTML() + "</br>" + "导入成功!";
		        		if(result.download) {
		        			var url = _rootPath + "/filedown.do?method=down&path=" + result.download;
		        			innelHtml += "</br><a target='_blank' href='" + url + "'>下载结果表</a>"
			        		window.open(url);
		        		}
		        		Ext.get('importmsg').setHTML(innelHtml);
		        	}else{
		        		if(result.data!=null){
			        		var _data = result.data;
			        		if(_data){
			        			var _rootPath = me.getRootPath();
			        			var _path = _rootPath + _data;
			        			if(_path){
			        				var _html = "<a target='_blank' href='" + _rootPath + "/filedown.do?method=down&path=" + _data + "'>查看更多</a>";
			        				if(result.msg){
			        					Ext.get('importmsg').setHTML(result.msg + _html);
			        				}
			        			}
			        		}
			        	} else {
	        				if(result.msg){
	        					Ext.get('importmsg').setHTML(result.msg);
	        				}
		        		}
		        	}
		        }else{
		        	Ext.Msg.alert('提示',"导入失败");
		        }

				 // 更改动态ip
				 me.timestamp = new Date().getTime();
				 me.swfupload.setUploadURL(APPBASE + '/uploadlayer.do?timestamp='+ me.timestamp + '&timescode=' + me.timestamp);
			 },
		     
		     failure:function(){
				// 更改动态ip 
				me.timestamp = new Date().getTime();
				me.swfupload.setUploadURL(APPBASE + '/uploadlayer.do?timestamp='+ me.timestamp + '&timescode=' + me.timestamp);
				
		    	me.getMask().hide();
		     	Ext.Msg.alert('提示',"导入失败.");
		     }
		}); 
	}
		
});