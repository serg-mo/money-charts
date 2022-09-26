<script>
export default {
  methods: {
    handleFileChange(event) {
      let reader = new FileReader();
      reader.onload = this.handleFileLoad;
      reader.readAsText(event.target.files[0]);
    },
    handleFileLoad(event) {
      let parse = this.$papa.parse(event.target.result, { header: true })
      let transactions = parse.data.map(this.parseTransaction)
      
      // spending only, not balance payments
      transactions = transactions.filter(t => t["amount"] > 0)

      // chronological order
      transactions.sort((a, b) => {
        return (new Date(a["date"]) - new Date(b["date"]))
      }) 

      this.$store.commit('setTransactions', transactions)
      this.$router.push({ name: 'chart' })
    },
    parseTransaction(t)
    {
      // Account, Address, Amount, Appears On Your Statement As, Card Member
      // Category, City/State, Country, Date, Description, Extended Details
      // Reference, Zip Code

      let datetime = new Date(t["Date"]);

      let monday   = new Date(datetime);
      monday.setDate(datetime.getDate() - datetime.getDay() + 1);

      return {
        date:   this.formatDate(datetime, "date"),
        week:   this.formatDate(monday, "week"),
        month:  this.formatDate(datetime, "month"),

        amount:      parseFloat(t["Amount"]),
        category:    t["Category"],
        description: t["Description"], // raw description
      }
    },
    formatDate(date, format = "date") {
      let month = ("0" + (date.getMonth() + 1)).slice(-2); // zero-based month
      let day   = ("0" + date.getDate()).slice(-2); // zero-padded
      let year  = date.getFullYear();

      if (format == "date") {
        return [year, month, day].join("-");
      } else if (format == "week") {
        return [year, month, day].join("-"); // date of monday
      } else if (format == "month") {
        return [year, month].join("-"); // no date
      }
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
