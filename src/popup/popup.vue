<template lang="pug">
div(style="width: 300px")
  h1 Test

  hr

  p
  | Here some text

  hr

  button(type="button", v-on:click="openDashboard()") Open dashboard
</template>


<script>
import browser from 'webextension-polyfill';

export default {
  methods: {
    openDashboard() {
      console.log('Opening dashboard');
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
