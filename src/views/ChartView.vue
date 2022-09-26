<script>

export default {
  computed: {
    transactions () {
      return this.$store.state.transactions
    }
  }

  // TODO: emit parsed transactions from the component, update state, and redirect here
}
</script>

<template>
  <div>
    {{ transactions }}
  </div>
</template>
