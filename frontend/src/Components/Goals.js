import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

const Goals = () => {
  const [projectNames, setProjectNames] = useState([]);
  const [teamNames, setTeamNames] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [goalCustomer, setGoalCustomer] = useState("");
  const [goalInternal, setGoalInternal] = useState("");
  const [message, setMessage] = useState("");

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(selectedTeam, selectedProject, goalCustomer, goalInternal);
  
    try {
      const response = await axios.post("http://localhost:8080/api/goals", {
        selectedTeam,
        selectedProject,
        goalCustomer,
        goalInternal,
      });
      if (response.status === 200) {
        setMessage("Team Updated Successfully");
      }
    } catch (error) {
        console.error("Error updating team:", error);
        setMessage(error.message);
    }

    setTimeout(() => {
        setMessage("");
      }, 3000);
  
  
    setGoalCustomer("");
    setGoalInternal("");
    setSelectedProject("");
    setSelectedTeam("");
  };
  

  return (
    <div className="custom-container">
      <h3>Update Goals for a team</h3>
      <form onSubmit={handleSubmit} className="form-container">
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

        <div className="form-group">
          <label className="input-label">Customer Goal :</label>
          <input
            className="select-field"
            type="text"
            value={goalCustomer}
            onChange={(e) => setGoalCustomer(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="input-label">Internal Goal:</label>
          <input
            className="select-field"
            type="text"
            value={goalInternal}
            onChange={(e) => setGoalInternal(e.target.value)}
          />
        </div>
        <div>
          <button type="submit" className=" submit-btn">
            Submit
          </button>
        </div>
      </form>
      <Modal show={message !== ""} onHide={() => setMessage("")}>
        <Modal.Body>{message}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setMessage("")}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Goals;
