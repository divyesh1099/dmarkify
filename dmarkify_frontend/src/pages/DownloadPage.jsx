import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const DownloadPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const zipUrl = location.state?.zipUrl;

  return (
    <div>
      <h1>Download Your Files</h1>
      {zipUrl ? (
        <div>
          <p>Your watermarked files are ready:</p>
          <a href={zipUrl} download>
            Download Zip
          </a>
        </div>
      ) : (
        <p>No file to download. Please upload and process files first.</p>
      )}
      <button onClick={() => navigate("/")}>Go Back</button>
    </div>
  );
};

export default DownloadPage;
