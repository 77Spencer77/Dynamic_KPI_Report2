import React from 'react';

import {Link} from 'react-router-dom';

import './Navbar.css';

const Navbar = () => {

  return (

    <nav>

      <div className="logo">Dashboard</div>

      <ul className="nav-items">

        <li><Link to="/">Home</Link></li>

        <li><Link to="/AllGraphs">All Graphs</Link></li>

        <li><Link to="/Graphs">Graphs</Link></li>

        <li><Link to="/Create">Create Team</Link></li>

        <li><Link to="/Update">Update Team</Link></li>

        <li><Link to="/Goals">Goals Update</Link></li>

      </ul>

    </nav>

  );

};




export default Navbar;