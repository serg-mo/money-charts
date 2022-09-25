<script>
export default {
  // https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js
  // https://cdnjs.cloudflare.com/ajax/libs/jmespath/0.15.0/jmespath.min.js
  // https://cdn.jsdelivr.net/npm/chart.js@2.8.0

  methods: {
    increment() {
      this.$store.commit('increment')
      console.log(this.$store.state.count)
    }
  }
}
</script>

<template>
  <main class="ui">
    HOME {{ $store.state.count }}

    <button @click="increment">incrment</button>
  </main>
</template>
