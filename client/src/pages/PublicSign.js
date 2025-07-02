import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const PublicSign = () => {
    const { token } = useParams();
    const [doc, setDoc] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDoc = async () => {
            try {
                const res = await axios.get(`https://docu-sign-backend.onrender.com/api/signatures/public/${token}`);
                setDoc(res.data.doc);
            } catch (err) {
                setError("Invalid or expired link.");
            }
        };
        fetchDoc();
    }, [token]);

    if (error) return <div className="p-8 text-red-600">{error}</div>;
    if (!doc) return <div className="p-8">Loading document...</div>;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
            <h1 className="text-2xl font-bold mb-4">Sign Document</h1>
            <div className="bg-white p-4 rounded shadow max-w-xl w-full">
                <p className="mb-2 font-semibold">Document: {doc.filename}</p>
                <a
                    href={`https://docu-sign-backend.onrender.com/uploads/${doc.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                >
                    View PDF
                </a>
                {/* Add your signature UI here */}
                <div className="mt-4">
                    <button className="bg-green-600 text-white px-4 py-2 rounded">Sign</button>
                </div>
            </div>
        </div>
    );
};

export default PublicSign;