/* global process */
import Vue from 'vue';
import VueRouter from 'vue-router';

const DashboardPage = () =>
  import(/* webpackChunkName: "dashboard_page" */ './components/DashboardPage.vue');
const ActivityPage = () =>
  import(/* webpackChunkName: "activity_page" */ './components/ActivityPage.vue');
const DonationHistoryPage = () =>
  import(/* webpackChunkName: "donation_history_page" */ './components/DonationHistoryPage.vue');
const CreatorList = () =>
  import(/* webpackChunkName: "creator_list_page" */ './components/CreatorList.vue');

const DevPage = () =>
  import(/* webpackChunkName: "dev_page" */ './components/DevPage.vue');

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
