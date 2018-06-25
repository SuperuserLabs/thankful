<template lang="pug">
div.container#content
  div.row
    div.col.mt-4
      b-navbar
        b-navbar-brand(to="/")
          | Thankful Dashboard
    div.col
      b-alert(show).mt-2.mb-0.p-2
        h5 We're in alpha!
        div
          | Things are not all they could be and will break, but we're working on it.
  div.row
    div.col
      hr

  router-view
</template>
<script>
export default {
  components: {},
  data: function() {
    return {};
  },
};
</script>
