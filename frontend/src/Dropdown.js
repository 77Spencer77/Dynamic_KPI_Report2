import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Graph from './Links';

const Dropdown = () => {
  const [jiraTeamNames, setJiraTeamNames] = useState([]);
  const [selectedTeamName, setSelectedTeamName] = useState('');
  const [error, setError] = useState('');
  const [teamData, setTeamData] = useState([]);

  useEffect(() => {
    const fetchJiraTeamNames = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/jiraTeamNames');
        setJiraTeamNames(response.data);
      } catch (error) {
        console.error('Error fetching Jira team names:', error);
        setError('Error fetching Jira team names. Please try again later.');
      }
    };

    fetchJiraTeamNames();
  }, []);

  const handleTeamNameSelect = async (teamName) => {
    setSelectedTeamName(teamName);
    try {
      const response = await axios.get(`http://localhost:5000/api/teamData?teamName=${encodeURIComponent(teamName)}`);
      setTeamData(response.data);
    } catch (error) {
      console.error('Error fetching team data:', error);
      setError('Error fetching team data. Please try again later.');
    }
  };

  return (
    <div>
      {error && <p>{error}</p>}
      <select value={selectedTeamName} onChange={(e) => handleTeamNameSelect(e.target.value)}>
        <option value="">Select a team</option>
        {jiraTeamNames.map((teamName) => (
          <option key={teamName} value={teamName}>
            {teamName}
          </option>
        ))}
      </select>
      {teamData.length > 0 && (
        <Graph data={teamData} />
      )}
    </div>
  );
};

export default Dropdown;
