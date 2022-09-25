<script>
import Dnd from '@/components/Dnd.vue'

export default {
  components: { Dnd },

  // https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js
  // https://cdnjs.cloudflare.com/ajax/libs/jmespath/0.15.0/jmespath.min.js
  // https://cdn.jsdelivr.net/npm/chart.js@2.8.0

  //    HOME {{ $store.state.count }}
  //  <button @click="increment">incrment</button>

  methods: {
    increment() {
      this.$store.commit('increment')
      console.log(this.$store.state.count)
    }
  }
}
</script>

<template>
  <div>
    <Dnd />
  </div>
</template>
