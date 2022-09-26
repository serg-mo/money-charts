<script>
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

export default {
  name: 'BarChart',
  components: { Bar },
  props: {
    chartId: {
      type: String,
      default: 'bar-chart'
    },
    datasetIdKey: {
      type: String,
      default: 'label'
    },
    width: {
      type: Number,
      default: 400
    },
    height: {
      type: Number,
      default: 400
    },
    cssClasses: {
      default: '',
      type: String
    },
    styles: {
      type: Object,
      default: () => {}
    },
    plugins: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      CATEGORY_RESOLUTIONS: ["category", "merchant"],
      TIME_RESOLUTIONS:     ["date", "week", "month"],

      category_resolution:  "category",
      category:             null,
      subcategory:          null,
      time_resolution:      "month",

      // time_after:           pick_cutoff("month"),
      // time_before:          format_date(new Date),

      query:                "",
      transactions:         [],
      filtered:             [],
      data:                 [],
      x:                    {},
      y:                    {},
      xy:                   {},

      charts:               [],

      chartData: {
        labels: [ 'January', 'February', 'March' ],
        datasets: [ { data: [40, 20, 12] } ]
      },
      chartOptions: {
        responsive: true
      }
    }
  },
  computed: {
    transactions () {
      return this.$store.state.transactions
    }
  },
  methods: {
    initialLoad() {
      /*
      this.query = this.getQuery();
      this.data  = jmespath.search(this.transactions, this.query); // this can't be a local variable

      [filter, select] = this.getQuery(true).split('.');
      this.filtered = jmespath.search(this.transactions, filter);
      */

      // [this.x, this.y, this.xy] = three_summaries(this.data, this.category_resolution, this.time_resolution);
      [this.x, this.y, this.xy] = this.three_summaries(this.transactions, this.category_resolution, this.time_resolution);
    },
    section_one_update(duration = 0) {
      /*
      if (!this.data.length)
        return;

      // TODO: same as below, except with subcategory filter, make this configurable

      // TODO: I can slice this function by chart
      let x_data  = make_data(this.x, "default");
      let y_data  = make_data(this.y, "default");
      let xy_data = make_data(this.xy, Object.keys(this.y)); // labels

      // TODO: consider making data as a set of points
      // add_average(xy_data.datasets); // this is useful for label
      //console.log(xy_data);

      if (this.category_resolution == "category") {
        pie_one.options.title.text = "";
        pie_one.data = x_data;

        //line.options.title.text = this.category || this.category_resolution;
        //line.data = y_data;
      }

      pie_two.options.title.text = this.category || this.category_resolution;
      pie_two.data = x_data;

      // TODO: just set the query here and have the chart figure out the rest
      //sync_dataset_property(stack.data, xy_data, "data"); // keep hidden datasets hidden
      stack.options.title.text = this.category + (this.subcategory ? `: ${this.subcategory}` : "");
      stack.data = xy_data;

      if (this.category_resolution == "subcategory" && this.category) {
        let base_color = colors[this.category] || colors['default'];
        let rgba       = base_color.match(/\d+/g);
        let palette    = get_palette(base_color, stack.data.datasets.length)

        pie_two.data.datasets[0].backgroundColor = palette;

        stack.data.datasets.forEach((dataset, index) => {
          dataset.backgroundColor = palette[index];
        });
      }

      this.charts.forEach((c) => { c.update() });
      */
    },
    getQuery(include_subcategory = false) {
      /*
      // TODO: consider setting default columns here
      let fields = [app.category_resolution, app.time_resolution, "amount"]; // category first, amount last
      let select = fields.reduce((carry, value) => { carry[value] = value; return carry; }, {}); // array -> object

      let filter = `date >= '${app.time_after}'`
      if (app.time_before) {
        filter += ` && date <= '${app.time_before}'`;
      }

      // prefer subcategory over category
      if (app.category_resolution == "subcategory" && app.category) {
        filter += ` && category == '${app.category}'`

        // subcategory just keeps track of which datasets to show
        if (include_subcategory && app.subcategory) {
          filter += ` && subcategory == '${app.subcategory}'`
        }
      }

      return `[?${filter}].` + JSON.stringify(select);
      */
    },
  }
}
</script>

<template>
  <Bar
    :chart-options="chartOptions"
    :chart-data="chartData"
    :chart-id="chartId"
    :dataset-id-key="datasetIdKey"
    :plugins="plugins"
    :css-classes="cssClasses"
    :styles="styles"
    :width="width"
    :height="height"
  />
</template>
