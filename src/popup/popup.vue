<template lang="pug">
div(style="width: 300px")
  h1 Thankful

  hr

  p Thanks for trying Thankful!

  hr

  button(type="button", v-on:click="thank()") Thank this page 💛

  hr

  button(type="button", v-on:click="openDashboard()") Open dashboard
</template>


<script>
import browser from 'webextension-polyfill';

export default {
  methods: {
    thank() {
      console.log('Thanking the current page');
    },
    openDashboard() {
      let dashboard_url = browser.runtime.getURL('dashboard/index.html');
      browser.tabs
        .query({ currentWindow: true, url: dashboard_url })
        .then(e => {
          if (e.length < 1) {
            browser.tabs.create({
              url: dashboard_url,
            });
          } else {
            browser.tabs.update(e[0].id, { active: true });
          }
        });
    },
  },
};
</script>
