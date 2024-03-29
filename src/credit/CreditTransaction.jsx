import React from "react";
import {
  CATEGORIES,
  COLORS,
  formatAmount,
  formatConfidence,
  getOpacity,
} from "../utils";
import moment from "moment";
import CategoryPicker from "../components/CategoryPicker";

// TODO: maybe show categories vertically + animate their appearance disappearance
export default function Transaction({ onClick, ...t }) {
  const confidence = t["confidences"][t["category"]] ?? 0;

  const title = Object.entries(t["confidences"])
    .map(([key, value]) => `${key}: ${formatConfidence(value)}`)
    .join("\n");

  // TODO: set the transparancy of the category to the confidence
  return (
    <tr className="group border border-slate-600">
      <td className="px-2 py-4 align-middle" title={t["name"]}>
        {t["normalizedName"]}
      </td>
      <td className="px-2 text-center">
        <div className="block group-hover:hidden">{t["location"]}</div>
        <div className="hidden group-hover:block">
          {onClick && <CategoryPicker transaction={t} onClick={onClick} />}
        </div>
      </td>
      <td className="px-2 py-4 text-center">
        {moment(t["date"]).format("YYYY-MM-DD")}
      </td>
      <td className="px-2 py-4 text-center">${formatAmount(t["amount"])}</td>
      <td className={`p-2 text-center ${getOpacity(confidence)}`} title={title}>
        {t["category"]} ({formatConfidence(confidence)})
      </td>
    </tr>
  );
}
