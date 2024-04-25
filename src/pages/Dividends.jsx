import React, { useState, useEffect } from "react";

// TODO: keep looking (in batches) as long as the objective keeps improving
// TODO: have a radio picking a premade objective
const maxMonthly = (a, b) => b.stats.monthly - a.stats.monthly; // DESC, highest first
const minTotal = (a, b) => a.stats.total - b.stats.total; // ASC, lowest first
const maxRatio = (a, b) => b.stats.ratio - a.stats.ratio; // DESC, highest first

function sumProduct(...arrays) {
  const size = arrays[0].length;

  if (!arrays.every((arr) => arr.length === size)) {
    throw new Error("All arrays must be of the same length");
  }

  let sum = 0;
  for (let i = 0; i < size; i++) {
    let product = 1;
    for (let j = 0; j < arrays.length; j++) {
      product *= parseFloat(arrays[j][i]);
    }
    sum += parseFloat(product.toFixed(32));
  }
  return sum;
}

function makeRandomCandidate(mins, maxes) {
  if (mins.length !== maxes.length) {
    throw new Error("Arrays must have the same length");
  }

  // NOTE: includes min and max
  return mins.map((min, index) => {
    const range = maxes[index] - min + 1;
    return Math.floor(Math.random() * range) + min;
  });
}

function mutateCandidate(candidate, jitter) {
  return candidate.map((value) => {
    const direction = Math.random() < 0.5 ? 1 : -1;
    const magnitude = Math.random() * jitter;
    return parseInt(value * (1 + direction * magnitude));
  });
}

function getCandidates({ mins, maxes, getStats, isPass }) {
  const SEARCH_SIZE = 100_000;
  const MUTATE_SIZE = 5;
  const MUTATE_JITTER = 0.1;

  let candidates = [];
  for (let i = 0; i < SEARCH_SIZE; i++) {
    const candidate = makeRandomCandidate(mins, maxes);
    const stats = getStats(candidate);

    // TODO: update progress here
    // console.log(`considering ${i}/${SEARCH_SIZE} candidate`);

    if (isPass(stats)) {
      // do not add the original candidate, mutate it first
      for (let j = 0; j < MUTATE_SIZE; j++) {
        const mutatedCandidate = mutateCandidate(candidate, MUTATE_JITTER);
        const mutatedStats = getStats(mutatedCandidate);
        //console.log([candidate.join(","), mutatedCandidate.join(",")]);

        if (isPass(mutatedStats)) {
          candidates.push({
            candidate: mutatedCandidate,
            stats: mutatedStats,
          });
        }
      }
    }
  }
  return candidates;
}

function evaluateCandidate(candidate, expenses, dividends, prices) {
  const total = sumProduct(candidate, prices);
  const monthly = sumProduct(candidate, dividends);
  const exp = sumProduct(candidate, prices, expenses) / total;
  const roi = (monthly * 12) / total;
  const ratio = roi / exp; // NOTE: this is what we're trying to maximize

  return {
    total: Math.round(total),
    monthly: Math.round(monthly),
    exp: parseFloat((100 * exp).toFixed(2)),
    roi: parseFloat((100 * roi).toFixed(2)),
    ratio: parseFloat(ratio.toFixed(2)),
  };
}

function formatStats({ monthly, total, roi, exp, ratio }) {
  return (
    <>
      <p>{`${monthly.toFixed(0)}/mo @ ${(total / 1000).toFixed(2)}k`}</p>
      <p>{`${roi}/${exp}=${ratio}`}</p>
    </>
  );
}

/*
console.log(
  evaluateCandidate(
    [300, 50, 70, 80, 300, 220, 210, 90, 90, 70],
    [0.45, 0.55, 0.35, 0.68, 0.6, 0.66, 0.61, 0.3, 0.59, 0.6].map(
      (v) => v / 100, // percent to float
    ),
    [0.11, 0.14, 0.44, 0.14, 0.16, 0.17, 0.22, 0.18, 0.13, 0.31],
    [16.93, 37.94, 55.45, 22.58, 17.28, 16.26, 21.05, 43.23, 19.2, 39.74],
  ),
);
*/

// should be 261
/*
console.log(
  sumProduct(
    [0.11, 0.14, 0.44, 0.14, 0.16, 0.17, 0.22, 0.18, 0.13, 0.31],
    [300, 50, 70, 80, 300, 220, 210, 90, 90, 70],
  ),
);
*/

// google sheets solver has been broken for a while, so this is my own evolutionary solver
export default function Dividends() {
  const REQUIRED_COLS = ["EXP", "NEXT", "COST", "PRICE", "NOW", "MIN", "MAX"];

  const [topCandidates, setTopCandidates] = useState([]);
  const [passingCriteria, setPassingCriteria] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  async function parseClipboard() {
    await navigator.clipboard
      .readText()
      .then(parseValues)
      .then(parseColumns)
      .then(getCandidates)
      .then(showTopCandidates);
  }

  async function loadCandidate(candidate) {
    await navigator.clipboard.writeText(candidate.join("\n"));
  }

  const parseValues = (csv) => {
    const cells = csv
      .split(/\r?\n/) // rows
      .map((v) => v.split(/\s/).map((v) => v.replace(/[\$,%]/g, ""))); // columns as bare numbers

    const headers = cells[0];
    const lastRow = cells[cells.length - 1];

    // ignore first and last row, i.e., headers and totals
    const values = cells
      .slice(1, -1)
      .map((row) =>
        Object.fromEntries(
          headers.map((header, index) => [header, row[index]]),
        ),
      );

    const totals = Object.fromEntries(
      headers.map((header, index) => [header, lastRow[index]]),
    );
    // console.log({ values, totals });

    return { values, totals };
  };

  const parseColumns = ({ values, totals }) => {
    const goalTotal = parseFloat(totals["COST"]); // does not matter, that's the column goalTotal
    const goalMonthly = parseFloat(totals["PRICE"]);

    const mins = values.map((v) => parseFloat(v["MIN"]));
    const maxes = values.map((v) => parseFloat(v["MAX"]));
    const expenses = values.map((v) => parseFloat(v["EXP"]) / 100); // expense ratio, percent to float
    const dividends = values.map((v) => parseFloat(v["NEXT"])); // next month's dividend estimate
    const prices = values.map((v) => parseFloat(v["PRICE"]));

    const getStats = (candidate) =>
      evaluateCandidate(candidate, expenses, dividends, prices);

    const current = values.map((v) => parseInt(v["NOW"]));
    const currentStats = getStats(current);
    console.log("currentStats", currentStats);
    console.log("Passing Criteria", {
      goalTotal,
      goalMonthly,
      ratio: currentStats.ratio,
    });

    const isPass = ({ total, monthly, ratio }) =>
      total <= goalTotal &&
      monthly >= goalMonthly &&
      ratio >= currentStats.ratio;

    setPassingCriteria(formatStats(currentStats));
    setIsThinking(true);

    return {
      mins,
      maxes,
      getStats,
      isPass,
    };
  };

  const showTopCandidates = (candidates) => {
    const TOP_SIZE = 9;
    candidates.sort(maxRatio);

    // schedule this for the next render
    const top = candidates.slice(0, TOP_SIZE);

    setTimeout(() => {
      // TODO: build some kind of progress bar here
      setTopCandidates(top);
      setIsThinking(false);
    }, 0);
  };

  // TODO: trigger button/file input should look the same
  return (
    <>
      <div className="text-sm text-gray-400">
        REQUIRED: {REQUIRED_COLS.join(",")}
      </div>

      {topCandidates.length > 0 ? (
        <>
          <h1 className="text-3xl text-gray-600 leading-tight mb-4">
            {passingCriteria}
          </h1>

          <div className="grid grid-cols-3 gap-4 text-sm font-mono">
            {topCandidates.map(({ candidate, stats }, index) => (
              <div
                className="max-w-44 min-w-min select-none bg-gray-100 shadow-md rounded-md py-6 px-2 cursor-pointer hover:bg-gray-200 "
                key={index}
                onClick={() => loadCandidate(candidate)}
              >
                {formatStats(stats)}
              </div>
            ))}
          </div>
        </>
      ) : (
        <button
          className={`text-lg text-white font-bold my-4 p-4 bg-blue-500 hover:bg-blue-700 rounded ${isThinking ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={parseClipboard}
          disabled={isThinking}
        >
          Parse Clipboard
        </button>
      )}
    </>
  );
}
