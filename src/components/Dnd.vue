<script>
export default {
  methods: {
    handleFileChange(event) {
      let reader = new FileReader();
      reader.onload = this.handleFileLoad;
      reader.readAsText(event.target.files[0]);
    },
    handleFileLoad(event) {
      let transactions = this.$papa.parse(event.target.result, { header: true })
      console.log(transactions.data)

      // TODO: set transactions state in vuex
      /*
      app.transactions = transactions.map(this.parse_transaction);
      app.transactions = jmespath.search(app.transactions, "[?category != 'Income']"); // spending only
      app.transactions.sort((a, b) => { return (parse_date(a["date"]) - parse_date(b["date"])); }); // chronological order
      */
    },
    parse_transaction(t)
    {
      // Account #
      // Address
      // Amount
      // Appears On Your Statement As
      // Card Member
      // Category
      // City/State
      // Country
      // Date
      // Description
      // Extended Details
      // Reference
      // Zip Code

      // source: "UTC", destination: "America/Los_Angeles"
      let str      = t["times"]["when_recorded_local"].slice(0, 10).replace(" ", "T"); // yyyy-mm-dd
      let datetime = new Date(t["times"]["when_recorded_local"]);

      let monday   = new Date(datetime);
      monday.setDate(datetime.getDate() - datetime.getDay() + 1);

      return {
        date:         format_date(datetime, "date"),
        week:         format_date(monday, "week"),
        month:        format_date(datetime, "month"),
        amount:       t["amounts"]["amount"] / 10000,
        category:     t["categories"][0]["folder"],
        subcategory:  t["categories"][0]["name"],
        description:  t["description"], // raw description
      };
    }
  }
}
</script>
<template>
  <div class="w-screen h-screen">
    <div class="object-none object-center text-xl font-semibold">
      Drag and Drop<br />
      Transactions
    </div>
    <input type="file" @change="handleFileChange" class="absolute inset-0 opacity-0" />
  </div>
</template>
<style>
</style>