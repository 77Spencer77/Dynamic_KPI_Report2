import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

const Update = () => {
  const [projectNames, setProjectNames] = useState([]);
  const [teamNames, setTeamNames] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [newTeam, setNewTeam] = useState("");
  const [newProject, setNewProject] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
    console.log(selectedTeam, selectedProject, newTeam, newProject);

    try {
      const response = await axios.post("http://localhost:8080/api/update", {
        selectedTeam,
        selectedProject,
        newTeam,
        newProject,
      });
      if ((response.status = 201)) {
        setErrorMessage("Team Updated Successfully");
        setTimeout(() => {
          setErrorMessage("");
        }, 3000);
      }
    } catch (error) {
      console.error("Error creating team:", error);
      setErrorMessage(error);
      setTimeout(() => {
        setErrorMessage("");
      }, 3000);
    }

    setNewProject("");
    setNewTeam("");
    setSelectedProject("");
    setSelectedTeam("");
  };

  return (
    <div className="custom-container">
      <h3>Update Team Name or Project Name</h3>
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
          <label className="input-label">Project Name :</label>
          <input
            className="select-field"
            type="text"
            value={newProject}
            onChange={(e) => setNewProject(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="input-label">Team Name :</label>
          <input
            className="select-field"
            type="text"
            value={newTeam}
            onChange={(e) => setNewTeam(e.target.value)}
          />
        </div>
        <div>
          <button type="submit" className=" submit-btn">
            Submit
          </button>
        </div>
      </form>
      <Modal show={errorMessage !== ""} onHide={() => setErrorMessage("")}>
        <Modal.Body>{errorMessage && errorMessage.toString()}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setErrorMessage("")}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Update;