import React, { useState, useEffect } from "react";
import axios from "axios";
import Chart from "react-apexcharts";
import { css } from "@emotion/react";
import ClipLoader from "react-spinners/ClipLoader";

const Graphs = () => {
  const [projectNames, setProjectNames] = useState([]);
  const [teamNames, setTeamNames] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [dataGraph, setDataGraph] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [teamData, setTeamData] = useState({});

  useEffect(() => {
    fetchProjectNames();
  }, []);

  const fetchProjectNames = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/search");
      const filteredProjectNames = response.data.reduce((acc, project) => {
        if (project.projectName && !acc.includes(project.projectName)) {
          acc.push(project.projectName);
        }
        return acc;
      }, []);
      setProjectNames(filteredProjectNames);
      const filteredTeamNames = response.data.reduce((acc, team) => {
        if (team.teamName && !acc.includes(team.teamName)) {
          acc.push(team.teamName);
        }
        return acc;
      }, []);
      setTeamNames(filteredTeamNames);
    } catch (error) {
      console.error("Error fetching project names:", error);
    }
  };

  const parseTextFile = async (text, selectedTeam, selectedProject) => {
    const lines = text.split("\n");
    const teamData = {};

    lines.forEach((line) => {
      const match = line.match(
        /\((.*?)\)\[(.*?)\]: TL=(.*?), SM=(.*?), QPA=(.*?);/
      );
      if (match) {
        const projectName = match[1];
        const teamName = match[2];
        const teamLead = match[3];
        const scrumMaster = match[4];
        const qpa = match[5];

        if (projectName === selectedProject && teamName === selectedTeam) {
          if (!teamData[selectedProject]) {
            teamData[selectedProject] = {};
          }

          teamData[selectedProject][selectedTeam] = {
            teamLead,
            scrumMaster,
            qpa,
          };
        }
      }
    });

    return teamData;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    console.log(selectedTeam, selectedProject);
    setIsLoading(true);
    try {
      const response = await axios.post("http://localhost:8080/api/graphs", {
        selectedTeam,
        selectedProject,
      });
      setDataGraph(response.data);
      setIsLoading(false);
      try {
        const response2 = await axios.get("/teams.txt");
        const parsedData = await parseTextFile(
          response2.data,
          selectedTeam,
          selectedProject
        );
        console.log(parsedData); // Verify if parsedData is correct
        await setTeamData(parsedData);
        console.log(teamData);
      } catch (error) {
        console.error("Error fetching team data:", error);
      }
    } catch (error) {
      console.error("Error creating team:", error);
      setIsLoading(false);
    }

    // // Clear fields
    // setSelectedProject("");
    // setSelectedTeam("");
  };
  const getSubtitleText = (project, team) => {
    if (teamData && teamData[project] && teamData[project][team]) {
      const { teamLead, scrumMaster, qpa } = teamData[project][team];
      console.log(
        "Subtitle Text:",
        `TL: ${teamLead}, SM: ${scrumMaster}, QPA: ${qpa}`
      );
      return `TL: ${teamLead}, SM: ${scrumMaster}, QPA: ${qpa}`;
    }
    return "";
  };

  const chartOptions = {
    xaxis: {
      // categories : dataGraph
      // .sort((a,b)=> a.weekNumber - b.weekNumber)
      // .map((d) => `Week ${d.weekNumber}`),
      categories: dataGraph
        .sort((a, b) => {
          // Sort by year first
          if (a.year !== b.year) {
            return a.year - b.year;
          }
          // If years are the same, sort by weekNumber
          return a.weekNumber - b.weekNumber;
        })
        .map((d) => `Week ${d.weekNumber}`),
      labels: {
        formatter: function (value) {
          return value;
        },
      },
      offsetX: 10, // Adjust the label offset
    },
    yaxis: [
      {
        seriesName: "Customer Goals",
        opposite: true,
      },
    ],
    title: {
      text: `${dataGraph.length > 0 ? dataGraph[0].teamName : ""} ( ${
        dataGraph.length > 0 ? dataGraph[0].projectName : ""
      } )`,
      offsetY: 10,
      align: "center",
      style: {
        fontSize: "18px",
        fontWeight: 600,
        fontFamily: "Arial, sans-serif",
      },
    },
    subtitle: {
      text: `${getSubtitleText(selectedProject, selectedTeam)}`,
      offsetY: 40,
      align: "center",
      style: {
        fontSize: "14px",
        fontWeight: 400,
        fontFamily: "Arial, sans-serif",
      },
    },

    stroke: {
      width: [3, 3, 3, 3],
      curve: "straight",
      dashArray: [0, 5, 0, 5],
    },

    dataLabels: {
      enabled: true, // Enable data labels
      offsetY: -5, // Adjust the label offset
      style: {
        colors: ["#ED2B2A", "#F7C04A", "#1A5D1A", "#11009E"], // Set label colors
        fontSize: "12px",
      },
    },
  };

  const chartSeries = [
    {
      name: "Customer Goals",
      data: dataGraph.map((d) => ({
        x: `CW${d.weekNumber}`,
        y: d.customerIssuesGoals,
      })),
      color: "#ED2B2A",
    },
    {
      name: "Customer Actual",
      data: dataGraph.map((d) => ({
        x: `CW${d.weekNumber}`,
        y: d.customerIssues,
      })),
      color: "#F7C04A",
    },
    {
      name: "Internal Goals",
      data: dataGraph.map((d) => ({
        x: `CW${d.weekNumber}`,
        y: d.internalIssuesGoals,
      })),
      color: "#1A5D1A",
    },
    {
      name: "Internal Actual",
      data: dataGraph.map((d) => ({
        x: `CW${d.weekNumber}`,
        y: d.internalIssues,
      })),
      color: "#11009E",
    },
  ];

  const override = css`
    display: block;

    margin: 0 auto;

    border-color: red;
  `;

  return (
    <div className="custom-container">
      <h1>Graphs Page</h1>
      <div className="form-group">
        <label className="input-label">Select Project:</label>
        <select
          className="select-field"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          <option value="">-- Select Project --</option>
          {projectNames.map((projectName, index) => (
            <option key={index} value={projectName}>
              {projectName}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="input-label">Select Team:</label>
        <select
          className="select-field"
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
        >
          <option value="">-- Select Team Name --</option>
          {teamNames.map((teamName, index) => (
            <option key={index} value={teamName}>
              {teamName}
            </option>
          ))}
        </select>
      </div>
      <button className="submit-btn" onClick={handleSearch}>
        Search
      </button>

      {isLoading ? (
        <div className="spinner-container">
          <ClipLoader
            color={"#F0AB03"}
            loading={isLoading}
            css={override}
            size={50}
          />
        </div>
      ) : dataGraph.length > 0 ? (
        <div
          className="chart-container"
          style={{ width: "90%", marginLeft: "5%", padding: "50px" }}
        >
          <Chart
            options={chartOptions}
            series={chartSeries}
            type="line"
            height={500}
          />
        </div>
      ) : null}
    </div>
  );
};

export default Graphs;