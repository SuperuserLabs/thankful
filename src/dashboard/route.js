import Vue from 'vue';
import VueRouter from 'vue-router';

import DashboardComponent from './DashboardComponent.vue';
import ActivityPage from './ActivityPage.vue';
import DonationHistoryPage from './DonationHistoryPage.vue';

Vue.use(VueRouter);

var router = new VueRouter({
  routes: [
    { path: '/', component: DashboardComponent },
    { path: '/activity', component: ActivityPage },
    { path: '/donations', component: DonationHistoryPage },
  ],
});

export default router;
