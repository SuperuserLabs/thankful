import Vue from 'vue';
import VueRouter from 'vue-router';

import DashboardPage from './DashboardPage.vue';
import ActivityPage from './ActivityPage.vue';
import DonationHistoryPage from './DonationHistoryPage.vue';

Vue.use(VueRouter);

var router = new VueRouter({
  routes: [
    { path: '/', component: DashboardPage },
    { path: '/activity', component: ActivityPage },
    { path: '/donations', component: DonationHistoryPage },
  ],
});

export default router;
