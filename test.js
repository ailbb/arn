define(['ext'], function (Ext) {
    Ext.onReady(function () {

        /**
         * 下拉框组件
         * Created by sirzh on 2017/7/14.
         */
        Ext.define('Ext.plugins.TextWindow', {
            extend: 'Ext.window.Window',
            xtype: 'textwindow',
            title: '微编辑器',
            alias: 'widget.textwindow',
            alternateClassName: 'Ext.plugins.TextWindow',
            width: '65%',
            height: '70%',
            modal: true,
            maximizable : true,
            layout: 'fit',
            buttonAlign: 'center',
            closeAction: 'hide',
            app: {},
            // 初始化
            initComponent: function() {
                var me = this.initApp(); // 初始化App信息

                Ext.apply(me, {
                    tbar: [{
                        xtype: 'combobox',
                        fieldLabel: '编程语言',
                        blankText: '请选择任务类型',
                        name: 'edittype',
                        // editable: false,
                        width: 180,
                        labelWidth: 70,
                        typeAhead: true,
                        value: 'sql',
                        store: [
                            ['apl','apl'],
                            ['asciiarmor','asciiarmor'],
                            ['asn.1','asn.1'],
                            ['asterisk','asterisk'],
                            ['brainfuck','brainfuck'],
                            ['clike','clike'],
                            ['clojure','clojure'],
                            ['cmake','cmake'],
                            ['cobol','cobol'],
                            ['coffeescript','coffeescript'],
                            ['commonlisp','commonlisp'],
                            ['crystal','crystal'],
                            ['css','css'],
                            ['cypher','cypher'],
                            ['d','d'],
                            ['dart','dart'],
                            ['diff','diff'],
                            ['django','django'],
                            ['dockerfile','dockerfile'],
                            ['dtd','dtd'],
                            ['dylan','dylan'],
                            ['ebnf','ebnf'],
                            ['ecl','ecl'],
                            ['eiffel','eiffel'],
                            ['elm','elm'],
                            ['erlang','erlang'],
                            ['factor','factor'],
                            ['fcl','fcl'],
                            ['forth','forth'],
                            ['fortran','fortran'],
                            ['gas','gas'],
                            ['gfm','gfm'],
                            ['gherkin','gherkin'],
                            ['go','go'],
                            ['groovy','groovy'],
                            ['haml','haml'],
                            ['handlebars','handlebars'],
                            ['haskell','haskell'],
                            ['haskell-literate','haskell-literate'],
                            ['haxe','haxe'],
                            ['htmlembedded','htmlembedded'],
                            ['htmlmixed','htmlmixed'],
                            ['http','http'],
                            ['idl','idl'],
                            ['index.html','index.html'],
                            ['javascript','javascript'],
                            ['jinja2','jinja2'],
                            ['jsx','jsx'],
                            ['julia','julia'],
                            ['livescript','livescript'],
                            ['lua','lua'],
                            ['markdown','markdown'],
                            ['mathematica','mathematica'],
                            ['mbox','mbox'],
                            ['meta.js','meta.js'],
                            ['mirc','mirc'],
                            ['mllike','mllike'],
                            ['modelica','modelica'],
                            ['mscgen','mscgen'],
                            ['mumps','mumps'],
                            ['nginx','nginx'],
                            ['nsis','nsis'],
                            ['ntriples','ntriples'],
                            ['octave','octave'],
                            ['oz','oz'],
                            ['pascal','pascal'],
                            ['pegjs','pegjs'],
                            ['perl','perl'],
                            ['php','php'],
                            ['pig','pig'],
                            ['powershell','powershell'],
                            ['properties','properties'],
                            ['protobuf','protobuf'],
                            ['pug','pug'],
                            ['puppet','puppet'],
                            ['python','python'],
                            ['q','q'],
                            ['r','r'],
                            ['rpm','rpm'],
                            ['rst','rst'],
                            ['ruby','ruby'],
                            ['rust','rust'],
                            ['sas','sas'],
                            ['sass','sass'],
                            ['scheme','scheme'],
                            ['shell','shell'],
                            ['sieve','sieve'],
                            ['slim','slim'],
                            ['smalltalk','smalltalk'],
                            ['smarty','smarty'],
                            ['solr','solr'],
                            ['soy','soy'],
                            ['sparql','sparql'],
                            ['spreadsheet','spreadsheet'],
                            ['sql','sql'],
                            ['stex','stex'],
                            ['stylus','stylus'],
                            ['swift','swift'],
                            ['tcl','tcl'],
                            ['textile','textile'],
                            ['tiddlywiki','tiddlywiki'],
                            ['tiki','tiki'],
                            ['toml','toml'],
                            ['tornado','tornado'],
                            ['troff','troff'],
                            ['ttcn','ttcn'],
                            ['ttcn-cfg','ttcn-cfg'],
                            ['turtle','turtle'],
                            ['twig','twig'],
                            ['vb','vb'],
                            ['vbscript','vbscript'],
                            ['velocity','velocity'],
                            ['verilog','verilog'],
                            ['vhdl','vhdl'],
                            ['vue','vue'],
                            ['webidl','webidl'],
                            ['xml','xml'],
                            ['xquery','xquery'],
                            ['yacas','yacas'],
                            ['yaml','yaml'],
                            ['yaml-frontmatter','yaml-frontmatter'],
                            ['z80','z80']
                        ],
                        listeners: {
                            blur: function( thiz, newValue, oldValue, eOpts ){
                                thiz.up('window').initCodeMirror(thiz.getValue());
                            }
                        }
                    },{
                        text: "格式化JSON",
                        handler: function (){
                            var win = this.up('window');
                            win.setValue(me.events.formatJSON(win.getValue()));
                        }
                    },{
                        text:"逗号(,)换行",
                        handler: function (){
                            var win = this.up('window');
                            win.setValue(win.getValue().replace(/,/g, '\n'));
                        }
                    },{
                        text:"帮助",
                        handler: function (){
                            Ext.create('Ext.window.Window', {
                                width: 800,
                                height: 500,
                                title: '编译器帮助文档',
                                html: '<pre>' +
                                    'Ctrl+backspace：强制删除内容；\r\n' +
                                    'ESC：退出Windows窗口；\r\n' +
                                    'Tab：自动补全代码\r\n' +
                                    '逗号换行：将所有逗号，替换为换行符\r\n' +
                                    '格式化JSON：格式化JSON代码\r\n' +
                                    '</pre>'
                            }).show();
                        }
                    }],
                    bodyStyle: {
                        overflow: 'auto'
                    },
                    items: {
                        xtype: 'textarea',
                        value: me.value || me.text || ""
                    },
                    buttons: [{
                        text: "确定",
                        handler: function (){
                            if(me.callback && !me.callback(this.up('window').down('textarea').getValue())) return;
                            this.up('window').close();
                        }
                    },{
                        text: "关闭",
                        handler: function (){
                            this.up('window').close();
                        }
                    }],
                    listeners: {
                        show: function () {
                            var me = this;

                            setTimeout(function () {
                                me.initCodeMirror();
                            }, 50);
                        }
                    }
                });

                me.callParent();
            },
            close: function () {
                var me = this, value = me.getValue();

                if(value && value.length > 0) {
                    // 如果有文字，则确认是否关闭
                    Ext.MessageBox.confirm('提示：', '您确认要关闭此窗口吗？', function (btn) {
                        if (btn === 'yes') {
                            me.doClose();
                        }
                    });
                } else {
                    me.callParent();
                }
            },
            initCodeMirror: function(mode){
                if(!mode) mode = 'sql'; // 默认为SQL语言

                var me = this;
                var isEditable = !(me.editable === false || (me.textEl && (me.textEl.readOnly || me.textEl.disabled)));
                var textAreaElement = me.getEl( ).query('textarea')[0];

                require([
                    'Codemirror/codemirror-5.50.0/lib/codemirror',
                    'Codemirror/codemirror-5.50.0/mode/'+mode+'/'+mode+'',
                    'Codemirror/codemirror-5.50.0/addon/hint/'+mode+'-hint',
                    'Codemirror/codemirror-5.50.0/addon/hint/show-hint',
                    'Codemirror/codemirror-5.50.0/addon/hint/anyword-hint'
                ], function(CodeMirror) {
                    me.codeMirror = CodeMirror.fromTextArea(textAreaElement, {
                        mode: mode,
                        readOnly: !isEditable,
                        lineNumbers: true,
                        extraKeys: {"ctrl": "autocomplete"},//ctrl可以弹出选择项
                        // keywords: true,
                        smartIndent: true, // 自动缩进是否开启
                        value: "function myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\nfunction myScript(){return 100;}\n"
                    });

                    //不要用change
                    me.codeMirror.on("change", function () {
                        //获取用户当前的编辑器中的编写的代码
                        var words = me.codeMirror.getValue() + "";
                        //利用正则取出用户输入的所有的英文的字母
                        words = words.replace(/[a-z]+[\-|\']+[a-z]+/ig, '').match(/([a-z]+)/ig);
                        //将获取到的用户的单词传入CodeMirror,并在javascript-hint中做匹配
                        CodeMirror.ukeys = words;
                        // 调用显示提示
                        me.codeMirror.showHint({ completeSingle: false});
                    });
                });
            },
            initApp: function () {
                var me = this;
                this.app = Ext.clone(this.app); // 深拷贝，防止多报表时报错
                return me;
            },
            getValue: function(){
                return this.codeMirror.getValue();
            },
            setValue: function(value) {
                this.down('textarea').setValue(value);
                return this;
            },
            events:{
                formatJSON: function (json, options) {
                    var reg = null,
                        formatted = '',
                        pad = 0,
                        PADDING = '    '; // one can also use '\t' or a different number of spaces
                    // optional settings
                    options = options || {};
                    // remove newline where '{' or '[' follows ':'
                    options.newlineAfterColonIfBeforeBraceOrBracket = (options.newlineAfterColonIfBeforeBraceOrBracket === true) ? true : false;
                    // use a space after a colon
                    options.spaceAfterColon = (options.spaceAfterColon === false) ? false : true;

                    // begin formatting...

                    // make sure we start with the JSON as a string
                    if (typeof json !== 'string') {
                        json = JSON.stringify(json);
                    }
                    // parse and stringify in order to remove extra whitespace
                    json = JSON.parse(json);
                    json = JSON.stringify(json);

                    // add newline before and after curly braces
                    reg = /([\{\}])/g;
                    json = json.replace(reg, '\r\n$1\r\n');

                    // add newline before and after square brackets
                    reg = /([\[\]])/g;
                    json = json.replace(reg, '\r\n$1\r\n');

                    // add newline after comma
                    reg = /(\,)/g;
                    json = json.replace(reg, '$1\r\n');

                    // remove multiple newlines
                    reg = /(\r\n\r\n)/g;
                    json = json.replace(reg, '\r\n');

                    // remove newlines before commas
                    reg = /\r\n\,/g;
                    json = json.replace(reg, ',');

                    // optional formatting...
                    if (!options.newlineAfterColonIfBeforeBraceOrBracket) {
                        reg = /\:\r\n\{/g;
                        json = json.replace(reg, ':{');
                        reg = /\:\r\n\[/g;
                        json = json.replace(reg, ':[');
                    }
                    if (options.spaceAfterColon) {
                        reg = /\:/g;
                        json = json.replace(reg, ': ');
                    }

                    $.each(json.split('\r\n'), function(index, node) {
                        var i = 0,
                            indent = 0,
                            padding = '';

                        if (node.match(/\{$/) || node.match(/\[$/)) {
                            indent = 1;
                        } else if (node.match(/\}/) || node.match(/\]/)) {
                            if (pad !== 0) {
                                pad -= 1;
                            }
                        } else {
                            indent = 0;
                        }

                        for (i = 0; i < pad; i++) {
                            padding += PADDING;
                        }
                        formatted += padding + node + '\r\n';
                        pad += indent;
                    });
                    return formatted;
                }
            }
        });

        Ext.create('Ext.plugins.TextWindow').show();
    });
});