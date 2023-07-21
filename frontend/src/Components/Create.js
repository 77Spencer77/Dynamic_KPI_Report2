import React, { useState } from 'react';
import axios from 'axios';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const Create = () => {

    const [teamName, setTeamName] = useState("");
    const [projectName, setProjectName] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log(teamName, projectName);
        //to post data to db
        try {
          const response = await axios.post("http://localhost:8080/api/create", {
            teamName,
            projectName,
          });
    
         if (response.status===201 && response.data.message!=="Team created successfully") {
            // Display error message
            setErrorMessage('Team already exists');
            setTimeout(() => {
              setErrorMessage('');
            }, 3000);
          } 
            else if(response.status===201 && response.data.message==="Team created successfully"){
              setErrorMessage('Team created succesfully');
            setTimeout(() => {
              setErrorMessage('');
            }, 3000);
            } 

        } catch (error) {
          console.error("Error creating team:", error);
          setErrorMessage(error.response.data.message || "An error occurred");
          setTimeout(() => {
            setErrorMessage('');
          }, 3000);
        }
        // Clear form fields
        setTeamName('');
        setProjectName('');
    }

  return (
    <div className='custom-container'>
        <h1>Create a New Team </h1>
        
      <form onSubmit={handleSubmit} className='form-container'>
        <div className="form-group">
            <label className="input-label">
                Project Name : 
            </label>
                <input
                  className="select-field"
                   type='text'
                   value={projectName}
                   onChange={ (e) => setProjectName(e.target.value) }
                />
           
         </div>   
        <div className="form-group">
            <label className="input-label">
                Team Name : 
            </label>
                <input
                className="select-field"
                   type='text'
                   value={teamName}
                   onChange={ (e) => setTeamName(e.target.value) }
                />
          
        </div>
        <div>
            <button type='submit' className=' submit-btn'>Submit</button>
        </div>
      </form>
      <Modal show={errorMessage !== ''} onHide={() => setErrorMessage('')}>
        <Modal.Body>{errorMessage}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setErrorMessage('')}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
     
    </div>
  );
}

export default Create;