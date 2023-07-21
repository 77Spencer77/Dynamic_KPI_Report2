import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { css } from '@emotion/react';
import ClipLoader from 'react-spinners/ClipLoader';

const Search = () => {
  const [projectNames, setProjectNames] = useState([]);
  const [teamNames, setTeamNames] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [team, setTeam] = useState('');
  const [project, setProject] = useState('');
  const [customerData , setCustomerData] = useState('');
  const [internalData, setInternalData] = useState('');
  const [customerGoal, setCustomerGoal] = useState('');
  const [internalGoal, setInternalGoal] = useState('');
  const [Data , setData] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchProjectNames();
  }, []);
  const fetchProjectNames = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/search');
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
      console.error('Error fetching project names:', error);
    }
  };


  const handleSearch = async (e) => {
    e.preventDefault();
    console.log(selectedTeam,selectedProject);
    setTeam(selectedTeam);
    setProject(selectedProject);
    setIsLoading(true);
    try {
      const response = await axios.post("http://localhost:8080/api/fetchLiveData", {
        selectedTeam,
        selectedProject,
      });
      const { dataCustomer, dataInternal, goalCustomer, goalInternal } = response.data;
     setData(response.data);

  setCustomerData(dataCustomer.total );
  setInternalData(dataInternal.total );
  setCustomerGoal(goalCustomer || '');
  setInternalGoal(goalInternal || '');
      console.log(response.data);
      setIsLoading(false); 

    } catch (error) {
      console.error("Error creating team:", error);
      setIsLoading(false); 
    }

    //clearfields
    setSelectedProject("");
    setSelectedTeam("");
    // Perform the search or further processing based on the selectedProject and selectedTeam values
    // ...
  };
  const override = css`

  display: block;

  margin: 0 auto;

  border-color: red;

`;

  return (
    <div className='custom-container'>
      <h1>Search Page</h1>

      <div className="form-group">
        <label className="input-label">
          Select Project:
          </label>
          <select className="select-field" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
            <option value="">-- Select Project --</option>
            {projectNames.map((projectName, index) => (
              <option key={index} value={projectName}>
                {projectName}
              </option>
            ))}
          </select>
    
      </div>

      <div className="form-group">
        <label className="input-label">
          Select Team:
          </label>
          <select className="select-field" value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
            <option value="">-- Select Team Name --</option>
            {teamNames.map((teamName, index) => (
              <option key={index} value={teamName}>
                {teamName}
              </option>
            ))}
          </select>
        
      </div>

      <button className=' submit-btn' onClick={handleSearch}>Search</button>

      {isLoading ? (

<div className="spinner-container">

  <ClipLoader color={'#F0AB03'} loading={isLoading} css={override} size={50} />

</div>

) : (
 Data && <div>
       <h3>( {project} ) {team}</h3>
       <h5> { <div>customer Data = {customerData!==undefined?customerData:"undefined"}</div>} </h5>
       <h5>{ <div>Customer Goals = {customerGoal!==undefined?customerGoal:"undefined"}</div>}</h5>
       <h5>{   <div>Internal Data = {internalData!==undefined?internalData:"undefined"}</div> }</h5>
       <h5>{ <div>Internal Goals = {internalGoal!==undefined?internalGoal:"undefined"}</div>}</h5>
      
      </div>
      
)}       
    </div>

  );
};

export default Search;