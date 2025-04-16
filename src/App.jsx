import React, { useEffect, useState } from "react";
import "./App.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function App() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [round, setRound] = useState("");
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");
  const [quota, setQuota] = useState("");
  const [rank, setRank] = useState("");
  const [username, setUsername] = useState("");
  const [rounds, setRounds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [genders, setGenders] = useState([]);
  const [quotas, setQuotas] = useState([]);
  const [sortDirection, setSortDirection] = useState("asc");

  useEffect(() => {
    fetch("/csabr1r2.json")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setRounds([...new Set(json.map((d) => d["Round"]))]);
        setCategories([...new Set(json.map((d) => d["Seat Type"]))]);
        setGenders([...new Set(json.map((d) => d["Gender"]))]);
        setQuotas([...new Set(json.map((d) => d["Quota"]))]);
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const results = data.filter((row) => {
      const closingRank = parseInt(row["Closing Rank"]);
      const validRound = row["Round"] === round;
      const validRank = !isNaN(closingRank) && parseInt(rank) <= closingRank;
      const validCategory = row["Seat Type"] === category;
      const validGender = row["Gender"] === gender;
      const validQuota = row["Quota"] === quota;

      return validRound && validRank && validCategory && validGender && validQuota;
    });

    setFiltered(results);
    setSortDirection("asc");
  };

  const handleReset = () => {
    setRound("");
    setCategory("");
    setGender("");
    setQuota("");
    setRank("");
    setUsername("");
    setFiltered([]);
  };

  const sortClosingRank = () => {
    const newDir = sortDirection === "asc" ? "desc" : "asc";
    const sorted = [...filtered].sort((a, b) => {
      const x = parseInt(a["Closing Rank"]);
      const y = parseInt(b["Closing Rank"]);
      return newDir === "asc" ? x - y : y - x;
    });
    setFiltered(sorted);
    setSortDirection(newDir);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(12);
    doc.text(`CSAB Predicted Colleges for ${username}`, 10, 10);

    const userInfo = [
      `Name: ${username}`,
      `Rank: ${rank}`,
      `Category: ${category}`,
      `Gender: ${gender}`,
      `Quota: ${quota}`,
      `Round: ${round}`
    ].join(" | ");

    const wrappedUserInfo = doc.splitTextToSize(userInfo, 190);
    doc.text(wrappedUserInfo, 10, 18);

    const tableBody = filtered.map((row) => [
      row["Institute"],
      row["Academic Program Name"],
      (row["Total Fees"] || "-").replace(/₹/g, "Rs."),
      (row["Average Salary"] || "-").replace(/₹/g, "Rs."),
      (row["Highest Salary"] || "-").replace(/₹/g, "Rs."),
      row["Institute State"] || "-",
      row["Quota"] || "-",
      row["Seat Type"] || "-",
      row["Gender"] || "-",
      row["Closing Rank"] || "-"
    ]);

    autoTable(doc, {
      head: [[
        "Institute", "Program", "Fees", "Avg Salary", "Highest Salary",
        "State", "Quota", "Category", "Gender", "Closing Rank"
      ]],
      body: tableBody,
      startY: 25 + wrappedUserInfo.length * 6,
      styles: { fontSize: 7 },
      tableWidth: "auto"
    });

    doc.save(`CSAB_${username.replace(/\s+/g, "_")}_Predictions.pdf`);
  };

  return (
    <div className="container">
      <h1>CSAB College Predictor 2025</h1>
      <form onSubmit={handleSubmit} className="form">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Your Name"
          required
        />
        <input
          type="number"
          value={rank}
          onChange={(e) => setRank(e.target.value)}
          placeholder="Your JEE Rank"
          required
        />
        <select value={round} onChange={(e) => setRound(e.target.value)} required>
          <option value="">Select Round</option>
          {rounds.map((r, i) => (
            <option key={i} value={r}>{r}</option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} required>
          <option value="">Select Category</option>
          {categories.map((cat, i) => (
            <option key={i} value={cat}>{cat}</option>
          ))}
        </select>
        <select value={gender} onChange={(e) => setGender(e.target.value)} required>
          <option value="">Select Gender</option>
          {genders.map((g, i) => (
            <option key={i} value={g}>{g}</option>
          ))}
        </select>
        <select value={quota} onChange={(e) => setQuota(e.target.value)} required>
          <option value="">Select Quota</option>
          {quotas.map((q, i) => (
            <option key={i} value={q}>{q}</option>
          ))}
        </select>

        <div className="form-buttons">
          <button type="submit">Predict Colleges</button>
          <button type="button" onClick={handleReset} className="reset-btn">Reset</button>
        </div>
      </form>

      {filtered.length > 0 && (
        <>
          <h2>Predicted Colleges for {username}</h2>
          <div className="table-controls">
            <button onClick={downloadPDF}>Download PDF</button>
            <button onClick={sortClosingRank}>
              Sort by Closing Rank {sortDirection === "asc" ? "↑" : "↓"}
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Institute</th>
                <th>Program</th>
                <th>Fees</th>
                <th>Avg Salary</th>
                <th>Highest Salary</th>
                <th>State</th>
                <th>Quota</th>
                <th>Category</th>
                <th>Gender</th>
                <th>Closing Rank</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={i}>
                  <td>{row["Institute"]}</td>
                  <td>{row["Academic Program Name"]}</td>
                  <td>{row["Total Fees"] || "-"}</td>
                  <td>{row["Average Salary"] || "-"}</td>
                  <td>{row["Highest Salary"] || "-"}</td>
                  <td>{row["Institute State"] || "-"}</td>
                  <td>{row["Quota"]}</td>
                  <td>{row["Seat Type"]}</td>
                  <td>{row["Gender"]}</td>
                  <td>{row["Closing Rank"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default App;
