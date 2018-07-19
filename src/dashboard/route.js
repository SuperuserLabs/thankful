/* global process */
import Vue from 'vue';
import VueRouter from 'vue-router';

import DashboardPage from './components/DashboardPage.vue';
import ActivityPage from './components/ActivityPage.vue';
import DonationHistoryPage from './components/DonationHistoryPage.vue';
import CreatorList from './components/CreatorList.vue';

import DevPage from './components/DevPage.vue';

Vue.use(VueRouter);

let routes = [
  { path: '/', component: DashboardPage },
  { path: '/activity', component: ActivityPage },
  { path: '/donations', component: DonationHistoryPage },
  { path: '/creators', component: CreatorList },
];

if (process.env.NODE_ENV === 'development') {
  routes = [...routes, { path: '/dev', component: DevPage }];
}

var router = new VueRouter({
  routes: routes,
});

export default router;
