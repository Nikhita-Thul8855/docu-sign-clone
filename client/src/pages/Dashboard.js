import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

const Dashboard = () => {
    const [file, setFile] = useState(null);
    const [message, setMessage] = useState("");
    const [docs, setDocs] = useState([]);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [pdfError, setPdfError] = useState("");
    const [signatures, setSignatures] = useState([]);
    const [placing, setPlacing] = useState(false);
    const [currentDoc, setCurrentDoc] = useState(null);
    const [pageDimensions, setPageDimensions] = useState({ width: 1, height: 1 });
    const [filter, setFilter] = useState("all");
    const pdfWrapperRef = useRef();

    useEffect(() => {
        const fetchDocs = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/docs`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setDocs(res.data);
            } catch (err) {
                setMessage("Failed to load documents");
            }
        };
        fetchDocs();
    }, [message]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return alert("Please select a PDF file.");
        const formData = new FormData();
        formData.append("pdf", file);
        const token = localStorage.getItem("token");
        if (!token) {
            setMessage("No token found. Please login again.");
            return;
        }
        try {
            const res = await axios.post(
                `${process.env.REACT_APP_API_BASE_URL}/api/docs/upload`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                }
            );
            if (res.status === 201) {
                setMessage("✅ PDF uploaded successfully");
                setFile(null);
            } else {
                setMessage("❌ Upload failed");
            }
        } catch (err) {
            setMessage("❌ Upload failed: " + (err.response?.data?.message || "Unknown error"));
        }
    };

    // Fetch signatures when previewing a document
    const handlePreview = async (doc) => {
        setPdfError("");
        setPreviewUrl(`https://docu-sign-backend.onrender.com/uploads/${doc.filename}`);
        setCurrentDoc(doc);
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/signatures/by-file/${doc._id}`);
            if (Array.isArray(res.data)) {
                setSignatures(res.data);
            } else if (Array.isArray(res.data.signatures)) {
                setSignatures(res.data.signatures);
            } else {
                setSignatures([]);
            }
        } catch (err) {
            setSignatures([]);
        }
    };

    // Handle placing signature
    const handlePdfClick = async (e) => {
        if (!placing || !pdfWrapperRef.current || !currentDoc) return;

        const rect = pdfWrapperRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate scale between wrapper and actual PDF page
        const scaleX = pageDimensions.width / rect.width;
        const scaleY = pageDimensions.height / rect.height;

        // Save coordinates relative to PDF page
        const pdfX = x * scaleX;
        const pdfY = y * scaleY;

        const signer = prompt("Enter signer name:");
        if (!signer) {
            setPlacing(false);
            return;
        }

        try {
            await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/signatures/positions`, {
                fileId: currentDoc._id,
                positions: [
                    { x: pdfX, y: pdfY, signer }
                ]
            });
            setMessage("Signature field placed!");
            const sigRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/signatures/by-file/${currentDoc._id}`);
            if (Array.isArray(sigRes.data)) {
                setSignatures(sigRes.data);
            } else if (Array.isArray(sigRes.data.signatures)) {
                setSignatures(sigRes.data.signatures);
            } else {
                setSignatures([]);
            }
        } catch (err) {
            setMessage("Failed to save signature field.");
        }
        setPlacing(false);
    };

    // --- NEW: Update signature status (accept/reject) ---
    const updateSignatureStatus = async (signatureId, status) => {
        let rejectionReason = "";
        if (status === "rejected") {
            rejectionReason = prompt("Enter rejection reason:");
            if (!rejectionReason) return;
        }
        try {
            await axios.put(`${process.env.REACT_APP_API_BASE_URL}/api/signatures/status/${signatureId}`, {
                status,
                rejectionReason,
            });
            // Refresh signatures after update
            const sigRes = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/signatures/by-file/${currentDoc._id}`);
            if (Array.isArray(sigRes.data)) {
                setSignatures(sigRes.data);
            } else if (Array.isArray(sigRes.data.signatures)) {
                setSignatures(sigRes.data.signatures);
            } else {
                setSignatures([]);
            }
        } catch (err) {
            alert("Failed to update signature status.");
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-green-100 px-2 sm:px-4">
            <h1 className="text-3xl font-bold mb-6">Welcome to the Dashboard</h1>

            <form
                onSubmit={handleUpload}
                className="bg-white p-6 rounded-lg shadow-md w-full max-w-md"
            >
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="mb-4 w-full"
                />
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                    Upload PDF
                </button>
            </form>

            {message && (
                <p className="mt-4 text-center font-medium text-gray-800">{message}</p>
            )}

            <div className="w-full max-w-2xl mt-8">
                <h2 className="text-xl font-semibold mb-4">Your Documents</h2>
                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <button
                        className={`px-3 py-1 rounded ${filter === "all" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                        onClick={() => setFilter("all")}
                    >
                        All
                    </button>
                    <button
                        className={`px-3 py-1 rounded ${filter === "pending" ? "bg-yellow-500 text-white" : "bg-gray-200"}`}
                        onClick={() => setFilter("pending")}
                    >
                        Pending
                    </button>
                    <button
                        className={`px-3 py-1 rounded ${filter === "signed" ? "bg-green-600 text-white" : "bg-gray-200"}`}
                        onClick={() => setFilter("signed")}
                    >
                        Signed
                    </button>
                    <button
                        className={`px-3 py-1 rounded ${filter === "rejected" ? "bg-red-600 text-white" : "bg-gray-200"}`}
                        onClick={() => setFilter("rejected")}
                    >
                        Rejected
                    </button>
                </div>
                {docs.length === 0 && <p>No documents uploaded yet.</p>}
                <ul>
                    {docs
                        .filter(doc => {
                            if (filter === "all") return true;
                            const sigs = signatures.filter(sig => sig.fileId === doc._id);
                            if (filter === "pending") return sigs.some(sig => sig.status === "pending");
                            if (filter === "signed") return sigs.some(sig => sig.status === "signed");
                            if (filter === "rejected") return sigs.some(sig => sig.status === "rejected");
                            return true;
                        })
                        .map((doc) => (
                            <li key={doc._id} className="mb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-3 rounded shadow">
                                <span className="mb-2 sm:mb-0">{doc.filename}</span>
                                <div className="flex gap-2">
                                    <button
                                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-700"
                                        onClick={() => handlePreview(doc)}
                                    >
                                        Preview
                                    </button>
                                    <a
                                        href={`https://docu-sign-backend.onrender.com/uploads/${doc.filename}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-700"
                                    >
                                        Download
                                    </a>
                                </div>
                            </li>
                        ))}
                </ul>
            </div>

            {/* PDF Preview Modal */}
            {previewUrl && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-2 sm:p-4 rounded shadow-lg max-w-3xl w-full relative">
                        <button
                            className="absolute top-2 right-2 text-red-600 text-xl"
                            onClick={() => setPreviewUrl(null)}
                        >
                            &times;
                        </button>
                        {pdfError && (
                            <div className="text-red-600 mb-2">{pdfError}</div>
                        )}
                        {/* Place Signature Field button always visible at the top of the modal */}
                        <button
                            className="bg-yellow-500 text-white px-4 py-2 rounded mb-4"
                            style={{ position: "relative", zIndex: 1000 }}
                            onClick={() => setPlacing(true)}
                        >
                            Place Signature Field
                        </button>
                        <div
                            style={{ position: "relative", cursor: placing ? "crosshair" : "default" }}
                            ref={pdfWrapperRef}
                            onClick={handlePdfClick}
                        >
                            <Document
                                file={previewUrl}
                                onLoadError={err => {
                                    setPdfError("Failed to load PDF file. Please check the file and try again.");
                                    console.error(err);
                                }}
                                error="Failed to load PDF file. Please check the file and try again."
                            >
                                <Page
                                    pageNumber={1}
                                    onRenderSuccess={page => {
                                        setPageDimensions({ width: page.width, height: page.height });
                                    }}
                                />
                                {/* Signature placeholders */}
                                {(Array.isArray(signatures) ? signatures : []).map((sig, idx) => {
                                    // Convert PDF coordinates to wrapper coordinates
                                    const rect = pdfWrapperRef.current?.getBoundingClientRect() || { width: 1, height: 1 };
                                    const scaleX = rect.width / pageDimensions.width;
                                    const scaleY = rect.height / pageDimensions.height;
                                    const left = sig.coordinates.x * scaleX;
                                    const top = sig.coordinates.y * scaleY;

                                    return (
                                        <div
                                            key={idx}
                                            style={{
                                                position: "absolute",
                                                left: `${left}px`,
                                                top: `${top}px`,
                                                background: "rgba(255,255,0,0.7)",
                                                padding: "2px 8px",
                                                borderRadius: "4px",
                                                zIndex: 10,
                                            }}
                                        >
                                            {sig.signer}{" "}
                                            {sig.status === "signed"
                                                ? "✔️"
                                                : sig.status === "rejected"
                                                    ? "❌"
                                                    : "✍️"}
                                            {/* Accept/Reject buttons for pending signatures */}
                                            {sig.status === "pending" && (
                                                <>
                                                    <button
                                                        style={{ marginLeft: 8, color: "green" }}
                                                        onClick={() =>
                                                            updateSignatureStatus(sig._id, "signed")
                                                        }
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        style={{ marginLeft: 4, color: "red" }}
                                                        onClick={() =>
                                                            updateSignatureStatus(sig._id, "rejected")
                                                        }
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {/* Show rejection reason if rejected */}
                                            {sig.status === "rejected" && sig.rejectionReason && (
                                                <div style={{ color: "red", fontSize: 12 }}>
                                                    Reason: {sig.rejectionReason}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </Document>
                            {placing && (
                                <div className="absolute bottom-4 left-4 text-yellow-700 font-bold" style={{ zIndex: 1000 }}>
                                    Click on the PDF to place a signature field
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;