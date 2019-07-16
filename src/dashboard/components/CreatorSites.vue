<template lang="pug">
span
  span(v-for="site in sites")
    a.title(:href='site.url' target="_blank" style="text-decoration: none !important")
      v-btn.ma-0(icon, style="font-size: inherit")
        font-awesome-icon(:icon="site.icon", :color='site.color')
</template>

<script>
import { isOnDomain } from '~/lib/url.ts';
import { find as _find, sortBy } from 'lodash';

export default {
  props: {
    urls: Array,
  },
  computed: {
    sites() {
      if (!this.urls) {
        console.warn('Passed empty property "urls"');
        return [];
      }

      let platforms = [
        {
          domain: 'getthankful.io',
          icon: ['fas', 'star'],
          color: '#FFCC44',
        },
        {
          domain: 'youtube.com',
          icon: ['fab', 'youtube'],
          color: 'red',
        },
        {
          domain: 'github.com',
          icon: ['fab', 'github'],
          color: 'black',
        },
        {
          domain: 'twitter.com',
          icon: ['fab', 'twitter'],
          color: '#38A1F3',
        },
        {
          domain: 'medium.com',
          icon: ['fab', 'medium'],
          color: 'black',
        },
        {
          domain: 'patreon.com',
          icon: ['fab', 'patreon'],
          color: 'rgb(232, 91, 70)',
        },
      ];

      let fallback = {
        domain: 'fallback',
        icon: ['fas', 'globe'],
        color: '#4AF',
      };

      let sites = this.urls.map(url => {
        let matchedPlatform = _find(platforms, p => isOnDomain(url, p.domain));
        if (matchedPlatform) {
          return Object.assign({ url: url }, matchedPlatform);
        } else {
          return Object.assign({ url: url }, fallback);
        }
      });
      sites = sortBy(sites, ['domain']);
      return sites;
    },
  },
};
</script>
