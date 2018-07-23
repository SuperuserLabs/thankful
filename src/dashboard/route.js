/* global process */
import Vue from 'vue';
import VueRouter from 'vue-router';

const DashboardPage = () => import('./components/DashboardPage.vue');
const ActivityPage = () => import('./components/ActivityPage.vue');
const DonationHistoryPage = () =>
  import('./components/DonationHistoryPage.vue');
const CreatorList = () => import('./components/CreatorList.vue');

const DevPage = () => import('./components/DevPage.vue');

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
