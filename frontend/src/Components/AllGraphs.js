import React, { useState, useEffect } from "react";
import axios from "axios";
import Chart from "react-apexcharts";
import { Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { css } from '@emotion/react';
import ClipLoader from 'react-spinners/ClipLoader';

const AllGraphs = () => {
  const [allGraphsData, setAllGraphsData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [teamData, setTeamData] = useState({});



  useEffect(() => {
    fetchAllGraphsData(); 
  }, []);


  const fetchAllGraphsData = async () => {
    try {
     
      setIsLoading(true);
      const response = await axios.post("http://localhost:8080/api/AllGraphs");
      setAllGraphsData(response.data);  
      try {
        const response = await axios.get('/teams.txt');
        const parsedData = await parseTextFile(response.data);
        await setTeamData(parsedData);
      } catch (error) {
        console.error('Error fetching team data:', error);
      } 
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching all graphs data:", error);
      setIsLoading(false);
    }
  };

  const parseTextFile = async (text) => {
    const lines = text.split('\n');
    const teamData = {};

    lines.forEach((line) => {
      const match = line.match(/\((.*?)\)\[(.*?)\]: TL=(.*?), SM=(.*?), QPA=(.*?);/);
      if (match) {
        const projectName = match[1];
        const teamName = match[2];
        const teamLead = match[3];
        const scrumMaster = match[4];
        const qpa = match[5];

        if (!teamData[projectName]) {
          teamData[projectName] = {};
        }

        teamData[projectName][teamName] = {
          teamLead,
          scrumMaster,
          qpa,
        };
      }
    });

    return teamData;
  };


const override = css`

display: block;

margin: 0 auto;

border-color: red;

`;

  return (
    <div>
      <button type="submit" className="submit-btn" style = {{marginTop:"1%"}} onClick={fetchAllGraphsData}>
        Refresh Data
      </button>
      {isLoading ? (

<div className="spinner-container">

  <ClipLoader color={'#F0AB03'} loading={isLoading} css={override} size={50} />

</div> ) : 

      allGraphsData.map((graph, index) => (
        <div key={index} style={{ width: "90%", marginLeft: "5%", padding: "50px" }}>
         
          {graph.dataGraph.length > 0 ? (
            <Chart
              options={{
                chart: {
                  id: `${graph.teamName}-${graph.projectName}`,
                },
                xaxis:  {
                    // categories: graph.dataGraph
                    // .sort((a, b) => a.weekNumber - b.weekNumber)
                    // .map((d) => `Week ${d.weekNumber}`),
                    categories: graph.dataGraph
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
                yaxis:  {
                    seriesName: "Customer Goals",
                    opposite: true,
                  },
                  title: {
                    text: `${graph.dataGraph.length > 0 ? graph.dataGraph[0].teamName : ""} ( ${
                      graph.dataGraph.length > 0 ? graph.dataGraph[0].projectName : ""
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
                    text: teamData[graph.projectName] && teamData[graph.projectName][graph.teamName]
                      ? `TL= ${teamData[graph.projectName][graph.teamName].teamLead}, SM= ${
                          teamData[graph.projectName][graph.teamName].scrumMaster
                        }, QPA= ${teamData[graph.projectName][graph.teamName].qpa}`
                      : "",
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
                    // curve: "straight",
                    dashArray: [0, 5, 0, 5],
                  },
                  dataLabels: {
                    enabled: true, // Enable data labels
                    offsetY: -5, // Adjust the label offset
                    style: {
                      colors: ["#ED2B2A",  "#F7C04A", "#1A5D1A", "#11009E", ], // Set label colors
                      fontSize: "12px",
                    },
                  },
              }}
              series={[
                {
                    name: "Customer Goals",
                    data: graph.dataGraph.map((d) => ({
                      x: `CW${d.weekNumber}`,
                      y: d.customerIssuesGoals,
                    })),
                    color: "#ED2B2A",
                  
                  },
                  {
                    name: "Customer Actual",
                    data: graph.dataGraph.map((d) => ({
                      x: `CW${d.weekNumber}`,
                      y: d.customerIssues,
                    })),
                    color : "#F7C04A",
                    
                  },
                  {
                    name: "Internal Goals",
                    data: graph.dataGraph.map((d) => ({
                      x: `CW${d.weekNumber}`,
                      y: d.internalIssuesGoals,
                    })),
                    color: "#1A5D1A",
                   
                  },
                  {
                    name: "Internal Actual",
                    data: graph.dataGraph.map((d) => ({
                      x: `CW${d.weekNumber}`,
                      y: d.internalIssues,
                    })),
                    color: "#11009E",
                    
                  },
                  
              ]}
              type="line"
              height={500}
            />
          ) : (
            <p>No data available for this team and project.</p>
          )}
        </div>
      ))}
       <Button className="back-to-top submit-btn"  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        Top
      </Button>
    </div>
  );
};

export default AllGraphs;

