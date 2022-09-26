// jQuery for the win, http://youmightnotneedjquery.com
//TODO: make the file input take up the full screen

var pie_one;
var pie_two;
var stack;
var line;
var bar;

var app;

$(() => {
  app = new Vue({
    el: "#app",
    watch: {
      category_resolution: (val) => { section_one_wrapper(); },
      category: (val)            => { section_one_wrapper(); },
      subcategory: (val)         => { 
        stack.options.title.text = `${app.category}: ${app.subcategory}`;
        stack.data.datasets.forEach((dataset, i) => {
          // if available, hide things other than the active one, show all by default
          dataset.hidden = app.subcategory ? (dataset.label != app.subcategory) : false;
        });
        stack.update();
      },

      time_after: (val)          => { section_one_wrapper(); },
      time_before: (val)         => { section_one_wrapper(); },
      time_resolution: (val)     => {
        app.time_after  = pick_cutoff(val);
        app.time_before = format_date(new Date());

        section_one_wrapper();
      },
    },
  })

  $("body").on("keydown", key_handler);
});

function section_one_setup() {
  // TODO: refactor all of this as plugins, https://www.chartjs.org/docs/latest/developers/plugins.html
  // TODO: add two sets of percentages to the pie legend, total and currently visible

  let pie_one_canvas = document.createElement("canvas");
  let pie_two_canvas = document.createElement("canvas");
  let line_canvas    = document.createElement("canvas");
  let stack_canvas   = document.createElement("canvas");

  $("#pie_one").append(pie_one_canvas);
  $("#pie_two").append(pie_two_canvas);
  $("#line").append(line_canvas);
  $("#stack").append(stack_canvas);

  // globally visible vars
  pie_one = make_pie(pie_one_canvas);
  pie_two = make_pie(pie_two_canvas);
  //line    = make_line(line_canvas);
  stack   = make_stack(stack_canvas);

  app.charts = [pie_one, pie_two, stack];

  // TODO: clicking a slice should add a dataset to the stack
  pie_one.options.events = ["click", "hover"];
  pie_one.options.onClick = (event, items) => {
    if (items.length) {
      app.category_resolution = "subcategory";
      app.category            = items[0]._chart.data.labels[items[0]._index];
      app.subcategory         = null;
    } else {
      app.category_resolution = "category";
      app.category            = null;
      app.subcategory         = null;

      // this fires when I click on the labels in the legend
    }
  };

  let pie_one_existing_handler = pie_one.options.legend.onClick;
  pie_one.options.legend.onClick = (event, item) => {
    pie_one_existing_handler.call(pie_one, event, item)

    // TODO: check if this is safe to do first
    stack.data.datasets[item.index].hidden = !item.hidden; // it's about to be flipped
    stack.update();
  }


  // TODO: hovering, i.e., scrolling, through the stack should animate pie_two as a cross-section of the stack
  // hover fires too frequently when I'm over a slice, consider keeping the previous value
  // this will also help with time scroll keeping the same datasets visible

  // pie_two can do dataset toggle AND whitespace reset, I love it
  // this is because clicking nothing syncs hidden datasets and shows them all
  pie_two.options.events = ["click", "hover"];
  pie_two.options.onClick = (event, items) => {
    if (items.length) {
      //app.category_resolution = "subcategory";
      app.subcategory = items[0]._chart.data.labels[items[0]._index];
    } else {
      app.subcategory = null;

      stack.data.datasets[item.index].hidden = false;
      stack.update();
    }
  }


  let pie_two_existing_handler = pie_two.options.legend.onClick;
  pie_two.options.legend.onClick = (event, item) => {
    pie_two_existing_handler.call(pie_two, event, item);

    // TODO: check if this is safe to do first
    stack.data.datasets[item.index].hidden = !item.hidden;
    stack.update();
  }

  pie_two.options.tooltips.callbacks.footer = footer_callback_avg;

  // TODO: clicking or hovering over the stack should *slowly* update the charti, i.e., animate the relative change
  stack.options.events = ["click", "hover"];
  stack.options.onClick = (event, items) => {
    if (items.length) {
      pick_time_slice(items[0]._index);
    }
  }

  let stack_existing_handler = stack.options.legend.onClick;
  stack.options.legend.onClick = (event, item) => {
    if (typeof item == 'object') {
      let {datasetIndex, hidden} = item; // text is the label

      if (app.category) {
        meta = pie_two.getDatasetMeta(0);
        meta.data[datasetIndex].hidden = !hidden; // it's about to be flipped
        pie_two.update();
      } else {
        meta = pie_one.getDatasetMeta(0);
        meta.data[datasetIndex].hidden = !hidden; // it's about to be flipped
        pie_one.update();
      }
    } else {
      console.log("Items are empty on stack lengend click")
    }

    stack_existing_handler.call(stack, event, item)
  }

  // TODO: onHover is more picky than tooltips.callbacks.title

  stack.options.tooltips.itemSort = (a, b) => { return b.yLabel - a.yLabel; };
  stack.options.tooltips.filter   = (v) => { return v.yLabel > 0; };
}

function get_palette(base_color, length) {
  let rgba    = base_color.match(/\d+/g);
  let palette = [];

  for (let i = 0; i < length; i++) {
    rgba[rgba.length - 1] = Math.round(100 * (length - i) / length) / 100; // alpha 1 .. 0
    palette.push(`rgba(${rgba.join(',')})`);
  }
  return palette;
}



function key_handler(event) {
  const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  const key  = event.key;

  // TODO: up/down scale/shrink the interval, left/right move it (infer time resolution)
  if (keys.includes(key)) {
    event.preventDefault();

    if (key == "ArrowUp" || key == "ArrowDown") {
      let delta       = (key == "ArrowUp") ? 1 : -1;
      let current     = app.TIME_RESOLUTIONS.indexOf(app.time_resolution);
      let next        = Math.max(Math.min(current + delta, app.TIME_RESOLUTIONS.length - 1), 0);
      
      app.time_resolution = app.TIME_RESOLUTIONS[next];
    } else if (key == "ArrowLeft" || key == "ArrowRight") {
      let delta  = (key == "ArrowLeft") ? -1 : 1;
      let after  = parse_date(app.time_after);
      let before = parse_date(app.time_before);

      if (app.time_resolution == "month") {
        after.setMonth(after.getMonth() + delta, after.getDate()); // month [date]
        before.setMonth(before.getMonth() + delta + 1, 0); // last day of the month
      } else if (app.time_resolution == "week") {
        after.setDate(after.getDate() + (7 * delta));
        before.setDate(before.getDate() + (7 * delta));
      } else if (app.time_resolution == "date") {
        after.setDate(after.getDate() + delta);
        before.setDate(before.getDate() + delta);
      }

      app.time_after  = format_date(after);
      app.time_before = format_date(before);
    }

    /*
    document.querySelector("#time_resolution").selectedIndex = app.TIME_RESOLUTIONS.indexOf(time_resolution);
    document.querySelector("#time_after").value              = time_after;
    document.querySelector("#time_before").value             = time_before;
    */
  }
}

function pick_time_slice(index) {
  let label           = stack.data.labels[index]; // slice name
  let labels          = []; // stack datasets become pie labels
  let data            = []; 
  let backgroundColor = [];

  // clicking a stack, loads that slice into the comparison
  // for each dataset, extract the indexed slice
  stack.data.datasets.forEach((dataset) => {
    labels.push(dataset.label);
    backgroundColor.push(dataset.backgroundColor); // same colors on both graphs
    data.push(dataset.data[index]);
  });
  //console.log("Datasets", datasets);


  // reset datasets if the only existing dataset has a label that is a category
  //if (pie_one.data.labels.includes(pie_two.data.datasets[0].label)) {
  //if (!stack.data.labels.includes(pie_two.data.datasets[0].label) || pie_two.data.datasets.length > 1) {
  if (true) {
    pie_two.data.labels = labels;

    // add to the top of the stack and chop it down
    pie_two.data.datasets.unshift({label, data, backgroundColor});
    pie_two.data.datasets = pie_two.data.datasets.slice(0, 2); // [start, stop index)

    pie_two.update({
      "duration": 1000
    });
  }
}

function pick_cutoff(type) {
  //TODO: add shortcuts for YTD and 1yr
  let date = new Date();
  if (type == "month") {
    date.setMonth(date.getMonth() - 12); // same month last year
    date.setDate(1); // first of the month
  } else if (type == "week") {
    date.setDate(date.getDate() + ( - date.getDay() + 1) - (12 * 7)); // Monday, ~3 months ago
  } else {
    date.setMonth(date.getMonth() - 1); // same date last month
  }

  return format_date(date);
}

function make_comparisons(datetime) {
  //let query = `[?${app.time_resolution} == '${label}'].{${app.time_resolution}: ${app.time_resolution}, category: category, subcategory: subcategory, amount: amount}`;
  //make_table($("#table"), filter_transactions(query));

  // TODO  sync_dataset_property(pie_two.data, stack.data, 'hidden');
  // TODO: highlight_row_in_legend(dataset_index);

  // TODO: I have the time_resolution and the date range, compare that date range to others like it
  // TODO: there is a bar chart for every time_resolution, set it onclick

  // TODO: do a separate chart comparing this month/week/day to the same month/week/day last year/month/week
  // unit   ...comparisons
  // day    same day last week, same date last month, same date last year
  // week   same week last month, same week last year
  // month  last month, same month last year

  /*
  let yesterday = new Date();
  yesterday.setDate(yesterday.getDate()- 1);

  let thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay()); // most recent Sunday
  thisWeek.setDate(thisWeek.getDate() + 6); // last week's Saturday

  let lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - lastWeek.getDay() - 7); // last week's Sunday
  lastWeek.setDate(lastWeek.getDate() + 6); // last week's Saturday

  let lastDayOfThisMonth = new Date();
  let nextMonth = lastDayOfThisMonth.getMonth() + 1; // next month
  lastDayOfThisMonth.setMonth(nextMonth);
  lastDayOfThisMonth.setDate(); // last day of the previous month (this month)
  lastDayOfThisMonth.setDate(1);

  let lastDayOfLastMonth = new Date(); // now
  lastDayOfLastMonth.setDate(); // last day of last month
  lastDayOfLastMonth.setDate(1); // set the end date first

  let thisYear = lastDayOfLastYear.getFullYear();
  lastDayOfLastYear.setFullYear(thisYear - 1, 11, 31); // last year, december 31st (0 based month)
  lastDayOfLastYear.setMonth(); // January
  lastDayOfLastYear.setDate(1); // 1st

  let lastDayOfLastYear = new Date();
  let thisYear = lastDayOfLastYear.getFullYear();
  lastDayOfLastYear.setFullYear(thisYear - 1, 11, 31); // last year, december 31st (0 based month)
  lastDayOfLastYear.setMonth(); // January
  lastDayOfLastYear.setDate(1); // 1st
  */

  datetime = new Date(datetime.replace(" ", "T")); // important
  datetime = format_date(datetime);

  // TODO: refactor this into an array that becomes an object
  let comparisons;



  // TODO: this is essentially a custom stack, except not as a line but as datasets - categories
  // TODO: do a separate chart comparing this month/week/day to the same month/week/day last year/month/week

  if (app.time_resolution == "day") {
    let same_day_last_week  = new Date(datetime);
    same_day_last_week.setDate(same_day_last_week.getDate() - 7);
    same_day_last_week = format_date(same_day_last_week);

    let same_date_last_month = new Date(datetime);
    same_date_last_month.setMonth(same_date_last_month.getMonth() - 1);
    same_date_last_month = format_date(same_date_last_month);

    let same_day_last_year  = new Date(datetime);
    same_day_last_year.setDate(same_day_last_year.getDate() - 7 * 52); // a year worth of weeks (?)
    same_day_last_year = format_date(same_day_last_year);

    let same_date_last_year = new Date(datetime);
    same_date_last_year.setYear(same_date_last_year.getFullYear() - 1);
    same_date_last_year = format_date(same_date_last_year);


    comparisons = {
      datetime:             "[?date == '" + datetime + "']",
      same_day_last_week:   "[?date == '" + same_day_last_week + "']",
      same_date_last_month: "[?date == '" + same_date_last_month + "']",
      same_day_last_year:   "[?date == '" + same_day_last_year + "']",
      same_date_last_year:  "[?date == '" + same_date_last_year + "']",
    };
  } else if (app.time_resolution == "month") {
    let same_month_last_year = new Date(datetime);
    same_month_last_year.setYear(same_month_last_year.getFullYear() - 1);

    let last_month = new Date(datetime);
    last_month.setMonth(last_month.getMonth() - 1);

    comparisons = {
      datetime:             "[?month == '" + datetime + "']",
      same_month_last_year: "[?month == '" + same_month_last_year + "']",
      same_month_last_year: "[?month == '" + last_month + "']",
    };
  }

  // set the colors as shades, of black, where the older ones faint away
  // for example, I want to see the current week day by day compared to n previous weeks (total or selected category)


  // TODO: split based on time_resolution
  //"same_week_last_month"
  //"same_week_last_year"
  // "same_month_last_year": "[?month == '" + format_date(same_date_last_year).slice(0, -3) + "']",


  // TODO: bring back time_after update changing the stack width
  // pie_one.onClick = () => { sync_dataset_property(stack.data, pie_one.data, 'hidden'); };

  // bar.options.title.text = category;
  // bar.data = make_data(y_summary, category);
  // bar.data.datasets.map((v) => { v.backgroundColor = colors[0]; }); // TODO: this is redundant
  // add_average(bar.data.datasets);
  // bar.update();

  console.table(comparisons);
  let canvas = $("#bar_one canvas");

  // TODO: this should be a map
  let datasets = [];
  for (var i in comparisons) {
    let query = `${comparisons[i]}.{category: category, amount: amount}`;
    comparisons[i] = filter_transactions(query).reduce(single_reducer("category"), {});
  }
  console.log(comparisons);

  // TODO: have chart labels synched by asigning one to another
  return make_bar(canvas, comparisons, pie_two.data.labels); // clever
}
