import Vue from 'vue';
import BootstrapVue from 'bootstrap-vue';

Vue.use(BootstrapVue);

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

import DashboardComponent from './DashboardComponent.vue';
new Vue({
  el: '#dashboard',
  render: h => h(DashboardComponent),
});
