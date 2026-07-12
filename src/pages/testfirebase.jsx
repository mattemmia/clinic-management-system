import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { collection, getDocs } from "firebase/firestore";

export default function TestFirebase() {
  const [data, setData] = useState([]);
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    const getData = async () => {
      try {
        console.log("Fetching from collection: medicines"); // add this log
        const snapshot = await getDocs(collection(db, "medicines")); // <-- MUST be "medicines"
        const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Got data:", results); // add this log
        setData(results);
        setStatus(`✅ SUCCESS! Found ${results.length} medicines`);
      } catch (error) {
        setStatus(`❌ FAILED: ${error.code} - ${error.message}`);
        console.error(error);
      }
    };
    getData();
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">{status}</h1>
      <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}