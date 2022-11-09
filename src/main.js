import { createApp } from 'vue';
import BootstrapVue3 from 'bootstrap-vue-3';
import router from './router';

// import 'bootstrap/dist/css/bootstrap.min.css'
// import 'bootstrap'

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue-3/dist/bootstrap-vue-3.css';

import App from './App.vue';
// import 'bootstrap/scss/bootstrap.scss'

const app = createApp(App);
app.use(router);
app.use(BootstrapVue3);
app.mount('#app');
