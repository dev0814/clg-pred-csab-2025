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
  const [programFilter, setProgramFilter] = useState("");
  const [instituteFilter, setInstituteFilter] = useState("");

  useEffect(() => {
    fetch("/csaballr1r2.json")
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
    const userRank = parseInt(rank);
    if (isNaN(userRank)) return;

    const results = data.filter((row) => {
      const closingRank = parseInt(row["Closing Rank"]);
      const openingRank = parseInt(row["Opening Rank"]);
      const validRound = row["Round"] === round;
      const validQuota = row["Quota"] === quota;
      const validCategory = row["Seat Type"] === category;

      const validGender =
        gender === "Female-only (including Supernumerary)"
          ? row["Gender"].includes("Female")
          : row["Gender"] === "Gender-Neutral";

      const isRankWithinBounds =
        !isNaN(closingRank) &&
        !isNaN(openingRank) &&
        userRank >= openingRank &&
        userRank <= closingRank;

      return (
        validRound &&
        validQuota &&
        validCategory &&
        validGender &&
        isRankWithinBounds
      );
    });

    setFiltered(results);
    setProgramFilter("");
    setInstituteFilter("");
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
    setProgramFilter("");
    setInstituteFilter("");
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

    const tableBody = displayedResults.map((row) => [
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

  const displayedResults = filtered.filter((row) => {
    const matchProgram = programFilter ? row["Academic Program Name"] === programFilter : true;
    const matchInstitute = instituteFilter ? row["Institute"] === instituteFilter : true;
    return matchProgram && matchInstitute;
  });

  return (
    <div className="container">
      <h1>CSAB College Predictor 2025</h1>
      <form onSubmit={handleSubmit} className="form">
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your Name" required />
        <input type="number" min="1" value={rank} onChange={(e) => setRank(e.target.value)} placeholder="Your JEE Rank" required />
        <select value={round} onChange={(e) => setRound(e.target.value)} required>
          <option value="">Select Round</option>
          {rounds.sort().map((r, i) => <option key={i} value={r}>{r}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} required>
          <option value="">Select Category</option>
          {categories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
        </select>
        <select value={gender} onChange={(e) => setGender(e.target.value)} required>
          <option value="">Select Gender</option>
          {genders.map((g, i) => <option key={i} value={g}>{g}</option>)}
        </select>
        <select value={quota} onChange={(e) => setQuota(e.target.value)} required>
          <option value="">Select Quota</option>
          {quotas.map((q, i) => <option key={i} value={q}>{q}</option>)}
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
            <div className="button-row">
              <button onClick={downloadPDF}>Download PDF</button>
              <button onClick={sortClosingRank}>
                Sort by Closing Rank {sortDirection === "asc" ? "↑" : "↓"}
              </button>
            </div>

            <div className="filter-row">
              <div className="filter-block">
                <label>Filter by Program:</label>
                <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)}>
                  <option value="">All Programs</option>
                  {[...new Set(filtered.map(row => row["Academic Program Name"]))].sort().map((p, i) => (
                    <option key={i} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="filter-block">
                <label>Filter by Institute:</label>
                <select value={instituteFilter} onChange={(e) => setInstituteFilter(e.target.value)}>
                  <option value="">All Institutes</option>
                  {[...new Set(filtered.map(row => row["Institute"]))].sort().map((inst, i) => (
                    <option key={i} value={inst}>{inst}</option>
                  ))}
                </select>
              </div>
            </div>
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
              {displayedResults.map((row, i) => (
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
