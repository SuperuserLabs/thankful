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
const OnboardingPage = () =>
  import(/* webpackChunkName: "onboarding_page" */ './components/OnboardingPage.vue');
const OnboardingWelcome = () =>
  import(/* webpackChunkName: "welcome_page" */ './components/OnboardingWelcome.vue');
const OnboardingDonate = () =>
  import(/* webpackChunkName: "donate_page" */ './components/OnboardingDonate.vue');
const OnboardingMetamask = () =>
  import(/* webpackChunkName: "metamask_page" */ './components/OnboardingMetamask.vue');

const DevPage = () =>
  import(/* webpackChunkName: "dev_page" */ './components/DevPage.vue');

Vue.use(VueRouter);

let routes = [
  { path: '/', component: DashboardPage },
  { path: '/activity', component: ActivityPage },
  { path: '/donations', component: DonationHistoryPage },
  { path: '/creators', component: CreatorList },
  {
    path: '/onboarding',
    component: OnboardingPage,
    children: [
      { path: 'welcome', component: OnboardingWelcome },
      { path: 'donate', component: OnboardingDonate },
      { path: 'metamask', component: OnboardingMetamask },
    ],
  },
];

if (process.env.NODE_ENV === 'development') {
  routes = [...routes, { path: '/dev', component: DevPage }];
}

var router = new VueRouter({
  routes: routes,
});

export default router;
