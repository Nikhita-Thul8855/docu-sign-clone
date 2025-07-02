import React, { useState } from "react";
import axios from "axios";

const Upload = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [message, setMessage] = useState("");

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setMessage("Please select a PDF file.");
            return;
        }

        const formData = new FormData();
        formData.append("pdf", selectedFile);

        // Get token from localStorage (after login)
        const token = localStorage.getItem("token");
        if (!token) {
            setMessage("No token found. Please login again.");
            return;
        }
        console.log("Token being sent:", token);

        try {
            const res = await axios.post(
                "http://localhost:5003/api/docs/upload",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        // DO NOT manually set Content-Type for FormData with axios!
                    }
                }
            );
            if (res.status === 201) {
                setMessage("✅ File uploaded successfully");
            } else {
                setMessage("❌ Upload failed");
            }
        } catch (err) {
            setMessage("❌ Upload failed: " + (err.response?.data?.message || "Unknown error"));
        }
    };

    return (
        <div>
            <input type="file" accept="application/pdf" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload PDF</button>
            {message && <p>{message}</p>}
        </div>
    );
};

export default Upload;