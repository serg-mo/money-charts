import React, { useContext } from "react";
import {
  DividendContext
} from "../../utils/dividends";

export default function CardStats({ cards }) {
  const { names, dividends } = useContext(DividendContext);

  return (
    <>
      <table className="border-collapse border-gray-900 table-auto  m-auto">
        <thead>
          <tr>
            <th></th>
            {Object.keys(cards.current.stats).map((key) => (
              <th key={key} className="border">{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(cards).map(([name, card]) => (
            <tr key={name}>
              <td className="border">{name}</td>
              {Object.values(card.stats).map((value) =>
                <td key={value} className="border">{value > 0 ? value : ""}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <table className="border-collapse border-gray-900 table-auto m-auto">
        <thead>
          <tr>
            <th>Name</th>
            <th>Next Dividend</th>
          </tr>
        </thead>
        <tbody>
          {names.map((name, index) => (
            <tr key={index}>
              <td className="border">{name}</td>
              <td className="border">${dividends[index]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}