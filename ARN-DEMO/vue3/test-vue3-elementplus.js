// Vue 3.0 + ElementPlus
define(['vue', 'ELEMENTPLUS'], function (Vue, ElementPlus) {
    document.querySelector('body').innerHTML = `
        <div id="Vue3_ElementPlus" style="width: 500px; height: 300px;">
    
            <el-row class="mb-4">
                <el-button>Default</el-button>
                <el-button type="primary">Primary</el-button>
                <el-button type="success">Success</el-button>
                <el-button type="info">Info</el-button>
                <el-button type="warning">Warning</el-button>
                <el-button type="danger">Danger</el-button>
                <el-button>{{ btnText }}</el-button>
            </el-row>
        </div>
    `;

    var app = Vue.createApp({
        data: function () {
            return {
                btnText: "vue-btn"
            }
        },
        mounted() {
            alert("Vue3 & ElementPlus load end！");
        },
        watch: {},
        methods: {}
    });
    app.use(ElementPlus);
    app.mount('#Vue3_ElementPlus');
});