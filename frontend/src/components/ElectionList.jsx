// src/components/ElectionList.jsx

import React, { useEffect, useState } from "react";
import { getElections } from "../api";
import { Link } from "react-router-dom";

export default function ElectionList() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchElections() {
      try {
        const data = await getElections();
        setElections(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchElections();
  }, []);

  if (loading) return <p>Loading elections…</p>;
  if (elections.length === 0) return <p>No elections found.</p>;

  return (
    <div>
      <h2>2) All Elections</h2>
      <ul>
        {elections.map((e) => (
          <li key={e.electionId}>
            <Link to={`/elections/${e.electionId}`}>
              [{e.electionId}] {e.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
