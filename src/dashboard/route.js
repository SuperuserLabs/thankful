/* global process */
import Vue from 'vue';
import VueRouter from 'vue-router';

const DashboardPage = () =>
  import(/* webpackChunkName: "dashboard_page" */ './pages/DashboardPage.vue');
const ActivityPage = () =>
  import(/* webpackChunkName: "activity_page" */ './pages/ActivityPage.vue');
const DonationHistoryPage = () =>
  import(/* webpackChunkName: "donation_history_page" */ './pages/DonationHistoryPage.vue');
const CreatorsPage = () =>
  import(/* webpackChunkName: "creators_page" */ './pages/CreatorsPage.vue');
const SettingsPage = () =>
  import(/* webpackChunkName: "settings_page" */ './pages/SettingsPage.vue');

const OnboardingPage = () =>
  import(/* webpackChunkName: "onboarding_page" */ './pages/onboarding/OnboardingPage.vue');
const OnboardingWelcome = () =>
  import(/* webpackChunkName: "onboarding_page" */ './pages/onboarding/OnboardingWelcome.vue');
const OnboardingDonate = () =>
  import(/* webpackChunkName: "onboarding_page" */ './pages/onboarding/OnboardingDonate.vue');
const OnboardingMetamask = () =>
  import(/* webpackChunkName: "onboarding_page" */ './pages/onboarding/OnboardingMetamask.vue');

const DevPage = () =>
  import(/* webpackChunkName: "dev_page" */ './pages/DevPage.vue');

const CheckoutPage = () =>
  import(/* webpackChunkName: "checkout_page" */ './pages/CheckoutPage.vue');

Vue.use(VueRouter);

let routes = [
  { path: '/', component: DashboardPage },
  { path: '/activity', component: ActivityPage },
  { path: '/donations', component: DonationHistoryPage },
  { path: '/creators', component: CreatorsPage },
  { path: '/settings', component: SettingsPage },
  { path: '/checkout', component: CheckoutPage },
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
