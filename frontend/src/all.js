


import React, { useState, useEffect } from "react";

import axios from "axios";

import Chart from "react-apexcharts";





const Graphs = () => {

  const [projectNames, setProjectNames] = useState([]);

  const [teamNames, setTeamNames] = useState([]);

  const [selectedProject, setSelectedProject] = useState("");

  const [selectedTeam, setSelectedTeam] = useState("");

  const [dataGraph, setDataGraph] = useState([]);




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




  const handleSearch = async (e) => {

    e.preventDefault();

    console.log(selectedTeam, selectedProject);




    try {

      const response = await axios.post("http://localhost:8080/api/graphs", {

        selectedTeam,

        selectedProject,

      });

      setDataGraph(response.data);

    } catch (error) {

      console.error("Error creating team:", error);

    }




    // Clear fields

    setSelectedProject("");

    setSelectedTeam("");

  };




  const chartOptions = {

    xaxis: {

              categories: dataGraph.map((d) => `Week ${d.weekNumber}`),

             

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

      text: `${dataGraph.length > 0 ? dataGraph[0].teamName : ""} - ${

        dataGraph.length > 0 ? dataGraph[0].projectName : ""

      }`,

      offsetY: 10,

      align: "center",

      style: {

        fontSize: "18px",

        fontWeight: 600,

        fontFamily: "Arial, sans-serif",

      },

    },

    // subtitle: {

    //   text: "Team Name & project Name",

    //   offsetY: 40,

    //   align: "center",

    //   style: {

    //     fontSize: "14px",

    //     fontWeight: 400,

    //     fontFamily: "Arial, sans-serif",

    //   },

    // },

    stroke: {

      width: [3, 3, 3, 3],

      curve: "straight",

      dashArray: [0, 5, 5, 0],

    },

    markers: {

      size: 4,

      strokeWidth: 0,

      hover: {

        size: 5,

      },

      discrete: dataGraph.map((d) => ({

        seriesIndex: 0,

        dataPointIndex: d.weekNumber - 1,

        fillColor: "#ED2B2A",

        strokeColor: "#ED2B2A",

        size: 5,

      })),

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

      name: "Internal Actual",

      data: dataGraph.map((d) => ({

        x: `CW${d.weekNumber}`,

        y: d.internalIssues,

      })),

      color: "#11009E",

     

    },

    {

      name: "Customer Actual",

      data: dataGraph.map((d) => ({

        x: `CW${d.weekNumber}`,

        y: d.customerIssues,

      })),

      color : "#F7C04A",

     

    },

    {

      name: "Internal Goals",

      data: dataGraph.map((d) => ({

        x: `CW${d.weekNumber}`,

        y: d.internalIssuesGoals,

      })),

      color: "#1A5D1A",

     

    },

  ];

 





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





      {/* <div

        className="chart-info"

        style={{ textAlign: "center", marginBottom: "20px", marginTop: "20px", padding:"10px" }}

      >

        {dataGraph.length > 0 && (

          <p>

            Team: <strong>{dataGraph[0].teamName}</strong>, Project:{" "}

            <strong>{dataGraph[0].projectName}</strong>

          </p>

        )}

      </div>

       */}

   

    {dataGraph.length > 0 ? (

        <div

          className="chart-container"

          style={{ width: "70%", marginLeft: "15%", padding: "50px" }}

        >

          <Chart

            options={chartOptions}

            series={chartSeries}

            type="line"

            height={400}

          />

        </div>

      ) : null}




    {/* <div

        className="chart-container"

        style={{ width: "50%", marginLeft: "25%", padding: "50px"  }}

      >

   

        <Chart

          options={chartOptions}

          series={chartSeries}

          type="line"

          height={400}

        />

      </div> */}

   

     

    </div>

  );

};




export default Graphs;


