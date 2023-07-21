// React code
import React, { useEffect, useState } from 'react';

function Jira() {
  const [issueData, setIssueData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/jira/issue/1673381');
        const data = await response.json();
        console.log(data);
        setIssueData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!issueData) {
    return <p>No data available.</p>;
  }

  return (
    <div>
      <h1>Jira Issue</h1>
      <p>Issue Key: {issueData.key}</p>
      {/* Render other relevant fields from the issueData object */}
    </div>
  );
}

export default Jira;
