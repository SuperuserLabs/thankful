<template lang="pug">
div
  v-card
    v-card-title
      h1 Thank you for using Thankful! #[v-icon(large) favorite]
    v-card-text
      p The extension will keep track of your favorite creators using your browser activity (nothing is sent to our servers). We will then get back to you at the end of the month when it's time to send out your donations.
      p But first, we need to go through a few short steps and set things up.
      router-link(to="/onboarding/donate")
        v-btn(color="primary") Get started
</template>

<script></script>
