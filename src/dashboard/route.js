import Vue from 'vue';
import VueRouter from 'vue-router';

import DashboardPage from './components/DashboardPage.vue';
import ActivityPage from './components/ActivityPage.vue';
import DonationHistoryPage from './components/DonationHistoryPage.vue';
import CreatorList from './components/CreatorList.vue';

Vue.use(VueRouter);

var router = new VueRouter({
  routes: [
    { path: '/', component: DashboardPage },
    { path: '/activity', component: ActivityPage },
    { path: '/donations', component: DonationHistoryPage },
    { path: '/creators', component: CreatorList },
  ],
});

export default router;
