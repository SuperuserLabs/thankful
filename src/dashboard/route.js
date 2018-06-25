import Vue from 'vue';
import VueRouter from 'vue-router';

import DashboardComponent from './DashboardComponent.vue';
import ActivityComponent from './ActivityComponent.vue';

Vue.use(VueRouter);

var router = new VueRouter({
  routes: [
    { path: '/', component: DashboardComponent },
    { path: '/activity', component: ActivityComponent },
  ],
});

export default router;
