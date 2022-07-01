// Vue 3.0 + ElementPlus
define(['vue', 'ELEMENT'], function (Vue, ElementUI) {
    document.querySelector('body').innerHTML = `
        <div id="Vue2_ElementUI" style="width: 500px; height: 300px;">
    
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

    // Vue.use(ELEMENT); // 第一种方式加载ElementUI
    // ELEMENT.install(Vue); // 第二种方式加载ElementUI
    Vue.use(ElementUI);

    var vm = new Vue({
        el: '#Vue2_ElementUI',
        data: function () {
            return {
                btnText: "vue-btn"
            }
        },
        mounted() {
            alert("Vue2 & ElementUI load end！");
        },
        watch: {},
        methods: {}
    })
});