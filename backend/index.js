import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import cors from "cors";
import compression from "compression";
import mongoose from "mongoose";
import cron from "node-cron";
import { MongoClient, ObjectId } from "mongodb";

import dotenv from 'dotenv';
dotenv.config();


const app = express();
app.use(cors());
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Hello from the backend server!');
});

const port = process.env.PORT || 8080;
const token = process.env.TOKEN;





//connect to a mongodb server
// # TOKEN=Basic STU4ODE3MzpTeWhiZ3Zmamlsb0A2ODQy
// Set up the MongoDB connection
// mongoose.connect(
//   "mongodb+srv://shreya_admin:iDlkJLivmF6bhnca@jira1.2echfv7.mongodb.net/weeklyCharts?retryWrites=true&w=majority",
//   {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   }
// );
//TOKEN="Bearer MzExMjAyNzQ4MTcxOpbIyijBk/QvUOMokEMQG+gT0YWX"
// mongoose.connect(
//   "mongodb+srv://krishnamoorthysathyamoorthy:oWilhpmUGA2HFVg5@cluster0.0jnracn.mongodb.net/weeklyCharts?retryWrites=true&w=majority",
//   {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   }
// );

const mongodbUrl = process.env.MONGODB_URL;

mongoose.connect(mongodbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error);
  });






//create schema for teamNames
const teamNameSchema = new mongoose.Schema({
  teamName : String,
  projectName  : String,
});

const TeamNames = mongoose.model("TeamNames", teamNameSchema);

//create schema for data 
const dataschema = new mongoose.Schema({
  weekNumber : Number,
  year : Number,
  teamName : String,
  projectName : String,
  customerIssues : Number,
  customerIssuesGoals : Number,
  internalIssues : Number,
  internalIssuesGoals : Number,
});

const Data = mongoose.model("Data", dataschema);







//function to get global current week number
function getCurrentWeekNumber() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfWeek = new Date(startOfYear.setDate(startOfYear.getDate() - startOfYear.getDay() + 1));
  const millisecondsPerWeek = 604800000; // Number of milliseconds in a week
  const millisecondsSinceStartOfWeek = now - startOfWeek;
  const weekNumber = Math.ceil(millisecondsSinceStartOfWeek / millisecondsPerWeek);

  return weekNumber;
}







// Fetch data for all teams' graphs
app.post("/api/AllGraphs", async (req, res) => {
  try {
    const teamNames = await TeamNames.find({});
    const allGraphsData = [];

    // Create an array of promises for fetching data for each team
    const promises = teamNames.map(async (team) => {
      const { teamName, projectName } = team;

      const dataGraph = await Data.find({ teamName, projectName });

      // Fetch live data for the current week
      const currentWeekData = await fetchLiveData(teamName, projectName);

      if (currentWeekData) {
        // Replace data in dataGraph with current week data
        dataGraph.forEach((data) => {
          if (data.weekNumber === getCurrentWeekNumber()) {
            data.customerIssues = currentWeekData.dataCustomer.total !== undefined ?currentWeekData.dataCustomer.total :0;
            data.internalIssues = currentWeekData.dataInternal.total !== undefined ?currentWeekData.dataInternal.total :0;
            data.customerIssuesGoals = currentWeekData.goalCustomer;
            data.internalIssuesGoals = currentWeekData.goalInternal;
          }
        });
      }

      return {
        teamName,
        projectName,
        dataGraph,
      };
    });

    // Execute all promises in parallel
    const results = await Promise.all(promises);
    allGraphsData.push(...results);

    console.log(allGraphsData);
    res.status(200).json(allGraphsData);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});















// Fetch data for graphs
// Fetch data for graphs
app.post("/api/graphs", async (req, res) => {
  const { selectedTeam, selectedProject } = req.body;
  console.log(selectedProject, selectedTeam);

  try {
    let dataGraph = await Data.find({
      teamName: selectedTeam,
      projectName: selectedProject,
    });

    // Fetch live data for the current week
    const currentWeekData = await fetchLiveData(selectedTeam, selectedProject);

    if (currentWeekData) {
      // Replace data in dataGraph with current week data
      dataGraph = dataGraph.map((data) => {
        if (data.weekNumber === getCurrentWeekNumber()) {
          // return currentWeekData; data1.total !== undefined ? data1.total : 0
          data.customerIssues = currentWeekData.dataCustomer.total !== undefined ?currentWeekData.dataCustomer.total :0 ;
          data.internalIssues = currentWeekData.dataInternal.total !== undefined ?currentWeekData.dataInternal.total :0;
          data.customerIssuesGoals = currentWeekData.goalCustomer;
          data.internalIssuesGoals = currentWeekData.goalInternal;
      
        }
        return data;
      });
    }

    console.log(dataGraph);
    res.status(200).json(dataGraph);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});


// Function to fetch live data for the current week
const fetchLiveData = async (selectedTeam, selectedProject) => {
  try {
  let jqlQuery1;
  let jqlQuery2;

  if(selectedTeam === "SS - Overall"){
    jqlQuery2 = `project in (${selectedProject}) AND issuetype = Defect AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3)`;
    jqlQuery1 = `project in (${selectedProject}) AND issuetype = "Customer Issue" AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3) AND "Initial Engineering Triage Date" is NOT EMPTY`;
  }
  else{
    if (selectedTeam) {
      // Include label name in the query if it exists
      if (!selectedProject.includes(",")) {
        jqlQuery2 = `project = ${selectedProject} AND issuetype = Defect AND resolution = Unresolved AND labels in (${selectedTeam}) AND "Defect Priority" in (P1, P2, P3)`;
        jqlQuery1 = `project = ${selectedProject} AND issuetype = "Customer Issue" AND resolution = Unresolved AND labels in (${selectedTeam}) AND "Defect Priority" in (P1, P2, P3) AND "Initial Engineering Triage Date" is NOT EMPTY`;
      } else {
        jqlQuery2 = `project in (${selectedProject}) AND issuetype = Defect AND resolution = Unresolved AND labels in (${selectedTeam}) AND "Defect Priority" in (P1, P2, P3)`;
        jqlQuery1 = `project in (${selectedProject}) AND issuetype = "Customer Issue" AND resolution = Unresolved AND labels in (${selectedTeam}) AND "Defect Priority" in (P1, P2, P3) AND "Initial Engineering Triage Date" is NOT EMPTY`;
      }
    } else {
      // Query only with the project name
      if (!selectedProject.includes(",")) {
        jqlQuery2 = `project = ${selectedProject} AND issuetype = Defect AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3)`;
        jqlQuery1 = `project = ${selectedProject} AND issuetype = "Customer Issue" AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3) AND "Initial Engineering Triage Date" is NOT EMPTY`;
      } else {
        jqlQuery2 = `project in (${selectedProject}) AND issuetype = Defect AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3)`;
        jqlQuery1 = `project in (${selectedProject}) AND issuetype = "Customer Issue" AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3) AND "Initial Engineering Triage Date" is NOT EMPTY`;
      }
    }
  }
  
    const jqlQuery_cust = encodeURIComponent(jqlQuery1);
    const response1 = await fetch(
      `https://product-jira.ariba.com/rest/api/2/search?jql=${jqlQuery_cust}&fields=total`,
      {
        headers: {
          Authorization: `${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    const dataCustomer = await response1.json();

    const jqlQuery_def = encodeURIComponent(jqlQuery2);
    const response2 = await fetch(
      `https://product-jira.ariba.com/rest/api/2/search?jql=${jqlQuery_def}&fields=total`,
      {
        headers: {
          Authorization: `${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    const dataInternal = await response2.json();

    const weekNumber = getCurrentWeekNumber();
    const existing = await Data.findOne({
      weekNumber: weekNumber,
      teamName: selectedTeam,
      projectName: selectedProject,
    });

    let goalCustomer = '';
    let goalInternal = '';
   

    if (existing) {
      goalCustomer = existing.customerIssuesGoals;
      goalInternal = existing.internalIssuesGoals;
     
    }
 

    return {
      dataCustomer,
      dataInternal,
      goalCustomer,
      goalInternal,
    
    };
  } catch (error) {
    console.error("Error fetching live data:", error);
    return null;
  }
};









// Request for Create page

//fetch names from create.js and add it to the db
app.post("/api/create", async (req, res) => {
  const {teamName, projectName} = req.body;

  try {

    // Check if the team already exists in the teamNames schema
    const existingTeam = await TeamNames.findOne({
      teamName: teamName,
      projectName: projectName,
    });

    if (existingTeam) {
      // If the team already exists, return a popup message
      console.log("exists");
      return res.status(201).json({ message: "Team already exists" });

    }


    // const newData = new Data({
    //   weekNumber : getCurrentWeekNumber(),
    //   year : new Date().getFullYear(),
    //   teamName,
    //   projectName,
    //   customerIssues : 0,
    //   customerIssuesGoals : 0,
    //   internalIssues : 0,
    //   internalIssuesGoals :0,
    // });
    // await newData.save();

    console.log(teamName, projectName);
  

    let jqlQuery1;
    let jqlQuery2;

    if(teamName ==="SS - Overall"){
      jqlQuery2 = `project in (${projectName}) AND issuetype = Defect AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3)`;
      jqlQuery1 = `project in (${projectName}) AND issuetype = "Customer Issue" AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3) AND "Initial Engineering Triage Date" is NOT EMPTY`;
    }
    else{
      if (teamName) {
        // Include label name in the query if it exists
        if (!projectName.includes(",")) {
          jqlQuery2 = `project = ${projectName} AND issuetype = Defect AND resolution = Unresolved AND labels in (${teamName}) AND "Defect Priority" in (P1, P2, P3)`;
          jqlQuery1 = `project = ${projectName} AND issuetype = "Customer Issue" AND resolution = Unresolved AND labels in (${teamName}) AND "Defect Priority" in (P1, P2, P3) AND "Initial Engineering Triage Date" is NOT EMPTY`;
        } else {
          jqlQuery2 = `project in (${projectName}) AND issuetype = Defect AND resolution = Unresolved AND labels in (${teamName}) AND "Defect Priority" in (P1, P2, P3)`;
          jqlQuery1 = `project in (${projectName}) AND issuetype = "Customer Issue" AND resolution = Unresolved AND labels in (${teamName}) AND "Defect Priority" in (P1, P2, P3) AND "Initial Engineering Triage Date" is NOT EMPTY`;
        }
      } else {
        // Query only with the project name
        if (!projectName.includes(",")) {
          jqlQuery2 = `project = ${projectName} AND issuetype = Defect AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3)`;
          jqlQuery1 = `project = ${projectName} AND issuetype = "Customer Issue" AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3) AND "Initial Engineering Triage Date" is NOT EMPTY`;
        } else {
          jqlQuery2 = `project in (${projectName}) AND issuetype = Defect AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3)`;
          jqlQuery1 = `project in (${projectName}) AND issuetype = "Customer Issue" AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3) AND "Initial Engineering Triage Date" is NOT EMPTY`;
        }
      }
    }

    
    // console.log(jqlQuery1);
    // console.log(jqlQuery2);

    const jqlQuery_cust = encodeURIComponent(jqlQuery1);
    const response1 = await fetch(
      `https://product-jira.ariba.com/rest/api/2/search?jql=${jqlQuery_cust}&fields=total`,
      {
        headers: {
          Authorization: `${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    const data1 = await response1.json();

    const jqlQuery_def = encodeURIComponent(jqlQuery2);
    const response2 = await fetch(
      `https://product-jira.ariba.com/rest/api/2/search?jql=${jqlQuery_def}&fields=total`,
      {
        headers: {
          Authorization: `${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    const data2 = await response2.json();

  
    const weekNumber = getCurrentWeekNumber();
    const existing = await Data.findOne({weekNumber, teamName, projectName});
    const currentYear =new Date().getFullYear();

    if(existing){
      existing.customerIssues = data1.total !== undefined ? data1.total : 0;
      existing.internalIssues = data2.total !== undefined ? data2.total : 0;
      await existing.save();
      console.log("Data updated successfully");
    }
    else{
      const newData = new Data({
        weekNumber,
        year : currentYear,
        teamName,
        projectName,
        customerIssues : data1.total !== undefined ? data1.total : 0,
        customerIssuesGoals : 0,
        internalIssues :data2.total !== undefined ? data2.total : 0,
        internalIssuesGoals : 0,
      });
      await newData.save();
      console.log("New data saved successfully");
    }
    try{
          const newName = new TeamNames({
            teamName,
            projectName,
          });
          await newName.save();
         // res.status(201).json({message: "temaName added to db"});
        }
        catch (error){
          res.status(500).json({error: "failed to post teamName"});
        }
    res.status(201).json({ message: "Team created successfully" });
  }
  catch (error){
    res.status(500).json({error: "failed to create team"});
  }

}); 









// Request for Search page
// Fetch all project names and team names from the database
app.get("/api/search", async (req, res) => {
  try {
    const teamNames = await TeamNames.find({}, { projectName: 1, teamName: 1, _id: 0 });
    res.json(teamNames);
  } catch (error) {
    console.error("Error fetching project names:", error);
    res.status(500).json({ error: "Failed to fetch project names" });
  }
});

app.post("/api/fetchLiveData", async (req,res) => {
  const {selectedTeam, selectedProject} = req.body;
  console.log(selectedTeam,selectedProject);
  let jqlQuery1;
  let jqlQuery2;

  if(selectedTeam === "SS - Overall"){
    jqlQuery2 = `project in (${selectedProject}) AND issuetype = Defect AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3)`;
    jqlQuery1 = `project in (${selectedProject}) AND issuetype = "Customer Issue" AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3) AND "Initial Engineering Triage Date" is NOT EMPTY`;
  }
  else{
    if (selectedTeam) {
      // Include label name in the query if it exists
      if (!selectedProject.includes(",")) {
        jqlQuery2 = `project = ${selectedProject} AND issuetype = Defect AND resolution = Unresolved AND labels in (${selectedTeam}) AND "Defect Priority" in (P1, P2, P3)`;
        jqlQuery1 = `project = ${selectedProject} AND issuetype = "Customer Issue" AND resolution = Unresolved AND labels in (${selectedTeam}) AND "Defect Priority" in (P1, P2, P3) AND "Initial Engineering Triage Date" is NOT EMPTY`;
      } else {
        jqlQuery2 = `project in (${selectedProject}) AND issuetype = Defect AND resolution = Unresolved AND labels in (${selectedTeam}) AND "Defect Priority" in (P1, P2, P3)`;
        jqlQuery1 = `project in (${selectedProject}) AND issuetype = "Customer Issue" AND resolution = Unresolved AND labels in (${selectedTeam}) AND "Defect Priority" in (P1, P2, P3) AND "Initial Engineering Triage Date" is NOT EMPTY`;
      }
    } else {
      // Query only with the project name
      if (!selectedProject.includes(",")) {
        jqlQuery2 = `project = ${selectedProject} AND issuetype = Defect AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3)`;
        jqlQuery1 = `project = ${selectedProject} AND issuetype = "Customer Issue" AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3) AND "Initial Engineering Triage Date" is NOT EMPTY`;
      } else {
        jqlQuery2 = `project in (${selectedProject}) AND issuetype = Defect AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3)`;
        jqlQuery1 = `project in (${selectedProject}) AND issuetype = "Customer Issue" AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3) AND "Initial Engineering Triage Date" is NOT EMPTY`;
      }
    }
  }
  

  const jqlQuery_cust = encodeURIComponent(jqlQuery1);
  const response1 = await fetch(
    `https://product-jira.ariba.com/rest/api/2/search?jql=${jqlQuery_cust}&fields=total`,
    {
      headers: {
        Authorization: `${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );
  const dataCustomer = await response1.json();
 
  console.log(token);

  const jqlQuery_def = encodeURIComponent(jqlQuery2);
  const response2 = await fetch(
    `https://product-jira.ariba.com/rest/api/2/search?jql=${jqlQuery_def}&fields=total`,
    {
      headers: {
        Authorization: `${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    }
  );

  const dataInternal = await response2.json();

  const weekNumber = getCurrentWeekNumber();
  // const weekNumber = getCurrentWeekNumber();
  const existing = await Data.findOne({
    weekNumber: weekNumber,
    teamName: selectedTeam,
    projectName: selectedProject,
  });
  

  let goalCustomer = '';
  let goalInternal = '';

  if (existing) {
    goalCustomer = existing.customerIssuesGoals;
    goalInternal = existing.internalIssuesGoals;
  
  }
  // console.log(dataCustomer.total, dataInternal.total, goalCustomer, goalInternal);
 
  res.json({ dataCustomer, dataInternal, goalCustomer, goalInternal});

});












// Request to update Goals page
app.post("/api/goals", async (req, res) => {
  const { selectedTeam, selectedProject, goalCustomer, goalInternal } = req.body;

  try {
    const weekNumber = getCurrentWeekNumber();
    const existing = await Data.findOne({
      weekNumber: weekNumber,
      teamName: selectedTeam,
      projectName: selectedProject,
    });

    if (existing) {
      existing.customerIssuesGoals = goalCustomer;
      existing.internalIssuesGoals = goalInternal;
      await existing.save();
    }

    res.status(200).json({ message: "Goal updated successfully" }); // Added parentheses for json method
  } catch (error) {
    res.status(500).json({ error: "failed to update" });
  }
});











//request to update a teamName or project Name update page
app.post("/api/update", async (req,res)=>{
  const {selectedTeam, selectedProject, newTeam, newProject,} = req.body;

  try{

    const updateResult1 = await TeamNames.updateMany(
      {
        teamName: selectedTeam,
        projectName: selectedProject,
      },
      {
        $set: {
          teamName: newTeam,
          projectName: newProject,
        },
      }
    );

    const updateResult2 = await Data.updateMany(
      {
        teamName: selectedTeam,
        projectName: selectedProject,
      },
      {
        $set: {
          teamName: newTeam,
          projectName: newProject,
        },
      }
    );

    console.log(updateResult1);
    console.log(updateResult2);


    res.status(201).json({ message: "Team created successfully" });
  }
  catch(error){
    res.status(500).json({error: "failed to update team"});
  }
});













// Function to fetch data for all team names and project names every week
const fetchData = async () => {
  const teamNames = await TeamNames.find({}, { teamName: 1, projectName: 1, _id: 0 });

  for (const { teamName, projectName } of teamNames) {
    let jqlQuery1;
    let jqlQuery2;

    // Build the JQL queries based on the team name and project name
    if(teamName === "SS - Overall"){
      jqlQuery2 = `project in (${projectName}) AND issuetype = Defect AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3)`;
      jqlQuery1 = `project in (${projectName}) AND issuetype = "Customer Issue" AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3) AND "Initial Engineering Triage Date" is NOT EMPTY`;
    }
    else{
      if (teamName) {
        if (!projectName.includes(",")) {
          jqlQuery2 = `project = ${projectName} AND issuetype = Defect AND resolution = Unresolved AND labels in (${teamName}) AND "Defect Priority" in (P1, P2, P3)`;
          jqlQuery1 = `project = ${projectName} AND issuetype = "Customer Issue" AND resolution = Unresolved AND labels in (${teamName}) AND "Defect Priority" in (P1, P2, P3) AND "Initial Engineering Triage Date" is NOT EMPTY`;
        } else {
          jqlQuery2 = `project in (${projectName}) AND issuetype = Defect AND resolution = Unresolved AND labels in (${teamName}) AND "Defect Priority" in (P1, P2, P3)`;
          jqlQuery1 = `project in (${projectName}) AND issuetype = "Customer Issue" AND resolution = Unresolved AND labels in (${teamName}) AND "Defect Priority" in (P1, P2, P3) AND "Initial Engineering Triage Date" is NOT EMPTY`;
        }
      } else {
        if (!projectName.includes(",")) {
          jqlQuery2 = `project = ${projectName} AND issuetype = Defect AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3)`;
          jqlQuery1 = `project = ${projectName} AND issuetype = "Customer Issue" AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3) AND "Initial Engineering Triage Date" is NOT EMPTY`;
        } else {
          jqlQuery2 = `project in (${projectName}) AND issuetype = Defect AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3)`;
          jqlQuery1 = `project in (${projectName}) AND issuetype = "Customer Issue" AND resolution = Unresolved AND "Defect Priority" in (P1, P2, P3) AND "Initial Engineering Triage Date" is NOT EMPTY`;
        }
      }
    }
    

    const jqlQuery_cust = encodeURIComponent(jqlQuery1);
    const response1 = await fetch(
      `https://product-jira.ariba.com/rest/api/2/search?jql=${jqlQuery_cust}&fields=total`,
      {
        headers: {
          Authorization: `${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    const data1 = await response1.json();

    const jqlQuery_def = encodeURIComponent(jqlQuery2);
    const response2 = await fetch(
      `https://product-jira.ariba.com/rest/api/2/search?jql=${jqlQuery_def}&fields=total`,
      {
        headers: {
          Authorization: `${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    const data2 = await response2.json();

    const weekNumber = getCurrentWeekNumber();
    const existing = await Data.findOne({ weekNumber, teamName, projectName });

    let customerIssuesGoal = 0;
    let internalIssuesGoal = 0;
  
    if(weekNumber==1){
      const existingGoals = await Data.findOne({ weekNumber: 52 , teamName, projectName});
      if (existingGoals ) {
        customerIssuesGoal = existingGoals.customerIssuesGoals;
        internalIssuesGoal = existingGoals.internalIssuesGoals;
      }
    }
    else{
      const existingGoals = await Data.findOne({ weekNumber: weekNumber-1 , teamName, projectName});
      if (existingGoals ) {
        customerIssuesGoal = existingGoals.customerIssuesGoals;
        internalIssuesGoal = existingGoals.internalIssuesGoals;
      }
    }
   
   
    // let timestamp ='';

// const objectId = new ObjectId(existing._id.toString());
// timestamp = objectId.getTimestamp();

const currentYear = new Date().getFullYear();
console.log(currentYear);


    if (existing) {
      const lastYear = existing.year;
      console.log(lastYear);
      if(lastYear!==currentYear){
        existing.year = currentYear;
        existing.customerIssues = data1.total !== undefined ? data1.total : 0;;
        existing.internalIssues = data2.total !== undefined ? data2.total : 0;;
        existing.customerIssuesGoals = customerIssuesGoal;
        existing.internalIssuesGoals = internalIssuesGoal;
        await existing.save();
      console.log("New Data added successfully");
      }
      else{
        existing.customerIssues = data1.total !== undefined ? data1.total : 0;
        existing.internalIssues = data2.total !== undefined ? data2.total : 0;
      
        await existing.save();
        console.log("Data updated successfully");
      }
      
    } else {
      const newData = new Data({
        weekNumber,
        year : currentYear,
        teamName,
        projectName,
        customerIssues: data1.total !== undefined ? data1.total : 0,
        customerIssuesGoals: customerIssuesGoal,
        internalIssues: data2.total !== undefined ? data2.total : 0,
        internalIssuesGoals: internalIssuesGoal,
      });
      await newData.save();
      console.log("New data saved successfully");
    }
   
  }
  console.log("completed fetch");
};


// Schedule the job to run every Saturday night at 10 PM and Sunday midnight at 12:30 AM
cron.schedule("0 22 * * 6", () => {
  console.log('Running fetchData on Saturday at 10 PM');
  fetchData();
});

cron.schedule("0 22 * * 0", () => {
  console.log('Running fetchData on Sunday at 10 PM');
  fetchData();
});


// const vari = setInterval(() => {
//   console.log('Running fetchData on Saturday at 10 PM');
//   // fetchData();
// }, 60*1000);


// // // Function to update entries with year
// async function updateEntriesWithYear() {
//   try {
//     // Fetch all the entries from the Data model
//     let selectedTeam = "change";
//   let selectedProject = "test";
//     const entries = await Data.find({
//       teamName : selectedTeam,
//     projectName : selectedProject,
//     });
//     let count =1;
    


//     // Iterate through each entry and update the year field
//     for (const entry of entries) {
//       entry.customerIssues = 10;
//       entry.internalIssues =15;
//       await entry.save();
//       console.log(count);
//       count++;
//     }

//     console.log('All entries have been updated successfully.');
//     mongoose.disconnect();
//   } catch (error) {
//     console.error('Error occurred while updating entries:', error);
//     mongoose.disconnect();
//   }
// }


// // Function to fetch data for all team names and project names every week
// const fetchYear = async () => {
//   console.log("running");
//   let selectedTeam = "test2";
//   let selectedProject = "test";
//   const teamNames = await TeamNames.find({
//     teamName : selectedTeam,
//     projectName : selectedProject,
//   });
  

//   for (const { teamName, projectName } of teamNames) {
   

//     const weekNumber = 28;
//     const existing = await Data.findOne({ weekNumber, teamName, projectName });

//     let customerIssuesGoal = 10;
//     let internalIssuesGoal = 150;
  
//     if(weekNumber==1){
//       const existingGoals = await Data.findOne({ weekNumber: 52 , teamName, projectName});
//       if (existingGoals ) {
//         customerIssuesGoal = existingGoals.customerIssuesGoals;
//         internalIssuesGoal = existingGoals.internalIssuesGoals;
//       }
//     }
//     else{
//       const existingGoals = await Data.findOne({ weekNumber: weekNumber-1 , teamName, projectName});
//       if (existingGoals ) {
//         customerIssuesGoal = existingGoals.customerIssuesGoals;
//         internalIssuesGoal = existingGoals.internalIssuesGoals;
//       }
//     }
   

// const currentYear = 2024;
// console.log(currentYear);


      
  

//     if (existing) {
//       const lastYear = existing.year;
//       console.log(lastYear);

//       if(lastYear!==currentYear){
//         existing.year = currentYear;
//         existing.customerIssues = 12;
//         existing.internalIssues = 21;
//         existing.customerIssuesGoals = customerIssuesGoal;
//         existing.internalIssuesGoals = internalIssuesGoal;
//         await existing.save();
//       console.log("New Data added successfully");
//       }
//       else{
//         existing.customerIssues = 500;
//         existing.internalIssues = 600;
      
//         await existing.save();
//         console.log("Data updated successfully");
//       }
      
//     } else {
//       const newData = new Data({
//         weekNumber,
//         year : currentYear,
//         teamName,
//         projectName,
//         customerIssues: 450,
//         customerIssuesGoals: customerIssuesGoal,
//         internalIssues: 150,
//         internalIssuesGoals: internalIssuesGoal,
//       });
//       await newData.save();
//       console.log("New data saved successfully");
//     }
   
//   }
//   console.log("completed fetch");
// };


// cron.schedule("19 15 * * 3", () => {
//   console.log('Running data');
//   fetchYear();
//   // updateEntriesWithYear();
// });




app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});