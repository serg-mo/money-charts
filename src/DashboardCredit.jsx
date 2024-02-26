import React, { useState, useEffect } from "react";
import CreditChart from "./credit/CreditChart";
import RecurringCharges from "./credit/RecurringCharges";

const parseCSV = (str) =>
  str.split('","').map((one) => one.replace(/^"|"$/g, ""));

function parseTransactions(lines, headers) {
  return lines.map(parseCSV).map((fields) => {
    return headers.reduce((obj, header, index) => {
      const value =
        header === "Amount" ? parseFloat(fields[index]) : fields[index]; // Amount as a number

      return { ...obj, [header]: value };
    }, {});
  });
}

function parseFile(lines) {
  const headers = parseCSV(lines[0]); // "Date","Transaction","Name","Memo","Amount"
  const tail = lines.slice(1, lines.length - 1);

  return parseTransactions(tail, headers);
}

// TODO: add arrow key handlers to zoom in/out and shift left/right
export default function DashboardCredit({ file }) {
  const [transactions, setTransactions] = useState([]);

  // TODO: combine the two files
  if (!transactions.length) {
    let reader = new FileReader();
    reader.onload = (e) => {
      const lines = e.target.result.split(/\r?\n/); // FileReader
      setTransactions(parseFile(lines));
    };
    reader.readAsText(file);
  }

  if (!transactions.length) {
    return;
  }

  const filteredTransactions = transactions.filter(
    (row) => row["Transaction"] === "DEBIT",
  );

  return (
    <div>
      <CreditChart transactions={filteredTransactions} />
      <RecurringCharges transactions={filteredTransactions} />
    </div>
  );
}
