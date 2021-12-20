<template lang="pug">
v-footer(height="auto")
  v-card.text-xs-center.m-0(flat, tile, style="width: 100%; background-color: #EEE")
    v-card-text.pa-2
      v-btn(v-for="link in links" :key="link.text" text :href="link.link" target="_blank" large icon)
        font-awesome-icon(:icon="link.icon")
    v-divider
    v-card-text(py-3 text-xs-center xs12)
      | © MPL-2.0 — <strong>Thankful</strong>
</template>

<script>
export default {
  data: function () {
    return {
      links: [
        {
          text: 'Website',
          icon: ['fas', 'globe'],
          link: 'https://getthankful.io',
        },
        {
          text: 'Twitter',
          icon: ['fab', 'twitter'],
          link: 'https://twitter.com/getthankful',
        },
        {
          text: 'Facebook',
          icon: ['fab', 'facebook-f'],
          link: 'https://www.facebook.com/Thankful-2303002679777110/',
        },
        {
          text: 'GitHub',
          icon: ['fab', 'github'],
          link: 'https://github.com/SuperuserLabs/thankful/',
        },
      ],
    };
  },
};
</script>
