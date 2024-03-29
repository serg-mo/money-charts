import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  defaults,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

defaults.font.family = "Monaco";

export default function IncomeChart({ transactions }) {
  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "Dividends & Returns",
      },
    },
    scales: {
      x: { stacked: true },
      y: { stacked: true },
    },
  };

  const data = {
    labels: transactions.map((fields) => fields["Month"]),
    datasets: [
      {
        label: "Market Change Minus Fees",
        data: transactions.map((fields) => fields["Market Change Minus Fees"]),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(23,130,171,1)",
      },
      {
        label: "Dividends & Interest",
        data: transactions.map((fields) => fields["Dividends & Interest"]),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(19,100,134,1)",
      },
    ],
  };

  return <Bar options={options} data={data} />;
}
