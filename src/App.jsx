import React, { useEffect, useState } from "react";
import "./App.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function App() {
  const [round, setRound] = useState("");
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");
  const [homeState, setHomeState] = useState("");
  const [rank, setRank] = useState("");
  const [username, setUsername] = useState("");
  const [categories, setCategories] = useState([]);
  const [genders, setGenders] = useState([]);
  const [states, setStates] = useState([]);
  const [sortDirection, setSortDirection] = useState("asc");
  const [resultProgramFilter, setResultProgramFilter] = useState("");
  const [resultInstituteFilter, setResultInstituteFilter] = useState([]);

  useEffect(() => {
    fetch("/csaballr1r2.json")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setCategories([...new Set(json.map((d) => d["Seat Type"]))]);
        setGenders([...new Set(json.map((d) => d["Gender"]))]);
        setStates([...new Set(json.map((d) => d["Institute State"]))].sort());
      })
      .catch((err) => {
        console.error("Error loading JSON file:", err);
        alert("Failed to load CSAB data.");
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const lowerHome = homeState.toLowerCase();
    const inputRank = parseInt(rank);

    const results = data.filter((row) => {
      if (round && row["Round"] !== round) return false;

      const closingRank = parseInt(row["Closing Rank"]);
      const seat = row["Seat Type"];
      const genderRow = row["Gender"];
      const instState = row["Institute State"]?.toLowerCase();
      const quota = row["Quota"];

      const validRank = !isNaN(closingRank) && inputRank <= closingRank;
      const validCategory = seat === category;
      const validGender = genderRow === gender;
      const isHomeState = quota === "HS" && instState === lowerHome;
      const isOtherState = quota === "OS" && instState !== lowerHome;
      const isAllIndia = quota === "AI";

      return validRank && validCategory && validGender && (isHomeState || isOtherState || isAllIndia);
    });

    setFiltered(results);
    setSortDirection("asc");
    setResultProgramFilter("");
    setResultInstituteFilter("");
  };

  const handleReset = () => {
    setRound("");
    setCategory("");
    setGender("");
    setHomeState("");
    setRank("");
    setUsername("");
    setFiltered([]);
    setResultProgramFilter("");
    setResultInstituteFilter("");
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
    doc.text(`CSAB Predicted Colleges for ${username}`, 10, 10);
    doc.text(`Rank: ${rank} | Category: ${category} | State: ${homeState} | Round: ${round}`, 10, 18);

    const tableBody = displayedResults.map((row) => [
      row["Institute"],
      row["Academic Program Name"],
      row["Total Fees"] || "-",
      row["Average Salary"] || "-",
      row["Highest Salary"] || "-",
      row["Institute State"] || "-",
      row["Quota"] || "-",
      row["Seat Type"] || "-",
      row["Gender"] || "-",
      row["Closing Rank"] || "-",
    ]);

    autoTable(doc, {
      head: [[
        "Institute", "Program", "Total Fees", "Avg Salary",
        "High Salary", "State", "Quota", "Seat Type", "Gender", "Closing Rank"
      ]],
      body: tableBody,
      startY: 25,
      styles: { fontSize: 7 },
      tableWidth: "auto",
    });

    doc.save(`CSAB_${username.replace(/\s+/g, "_")}_Predictions.pdf`);
  };

  const displayedResults = filtered.filter(row => {
    const programMatch = resultProgramFilter ? row["Academic Program Name"] === resultProgramFilter : true;
    const instituteMatch = resultInstituteFilter ? row["Institute"] === resultInstituteFilter : true;
    return programMatch && instituteMatch;
  });

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
          <option value="">Select CSAB Round</option>
          <option value="Round 1">Round 1</option>
          <option value="Round 2">Round 2</option>
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
        <select value={homeState} onChange={(e) => setHomeState(e.target.value)} required>
          <option value="">Select Home State</option>
          {states.map((s, i) => (
            <option key={i} value={s}>{s}</option>
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
            <div className="button-row">
              <button onClick={downloadPDF}>Download PDF</button>
              <button onClick={sortClosingRank}>
                Sort by Closing Rank {sortDirection === "asc" ? "↑" : "↓"}
              </button>
            </div>

            <div className="program-filter">
              <label>Filter by Program:</label>
              <select
                value={resultProgramFilter}
                onChange={(e) => setResultProgramFilter(e.target.value)}
              >
                <option value="">All Programs</option>
                {[...new Set(filtered.map(row => row["Academic Program Name"]))].sort().map((p, i) => (
                  <option key={i} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="institute-filter">
              <label>Filter by Institute:</label>
              <select
                value={resultInstituteFilter}
                onChange={(e) => setResultInstituteFilter(e.target.value)}
              >
                <option value="">All Institutes</option>
                {[...new Set(filtered.map(row => row["Institute"]))].sort().map((iName, i) => (
                  <option key={i} value={iName}>{iName}</option>
                ))}
              </select>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Institute</th>
                <th>Program</th>
                <th>Total Fees</th>
                <th>Avg Salary</th>
                <th>High Salary</th>
                <th>State</th>
                <th>Quota</th>
                <th>Seat Type</th>
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
                  <td>{row["Quota"] || "-"}</td>
                  <td>{row["Seat Type"] || "-"}</td>
                  <td>{row["Gender"] || "-"}</td>
                  <td>{row["Closing Rank"] || "-"}</td>
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
