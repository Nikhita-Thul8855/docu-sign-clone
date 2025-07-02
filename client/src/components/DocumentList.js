import React from "react";

const DocumentList = ({ docs, signatures, filter, handlePreview }) => (
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
);

export default DocumentList;