import './App.css';
import { BrowserRouter as Router, Route,Routes } from 'react-router-dom';

import Search from './Components/Search';
import Create from './Components/Create';
import Navbar from './Navbar';
import Update from './Components/Update';
import Goals from './Components/Goals';
import Graphs from './Components/Graphs';
import AllGraphs from './Components/AllGraphs';
// import Graph from './Sample';

function App() {
  return (
    <div className="App">
      <Router>
      <Navbar />      
      <Routes>
        <Route path="/" element={<Search/>}/>     
        {/* <Route path="/sample" element={<Graph/>}></Route> */}
        <Route path="/AllGraphs" element={<AllGraphs/>} />
        <Route exact path="/Graphs" element={<Graphs />} />
        <Route exact path="/Create" element={<Create />} />
        <Route exact path="/Update" element={<Update />} />
        <Route exact path="/Goals" element={<Goals />} />
      </Routes>
    </Router>
      
    </div>
  );
}

export default App;