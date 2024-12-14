// Frontend (HomePage.js)
import React, { useState, useEffect } from "react";
import axios from "axios";

const HomePage = () => {
  const [files, setFiles] = useState([]);
  const [watermarkOptions, setWatermarkOptions] = useState([]);
  const [watermarkText, setWatermarkText] = useState("Dmarkify");
  const [fonts, setFonts] = useState([]);
  const [font, setFont] = useState("Roboto-Regular");
  const [fontSize, setFontSize] = useState(20);
  const [fontSizePercent, setFontSizePercent] = useState("");
  const [textTransparency, setTextTransparency] = useState(50);
  const [textPosition, setTextPosition] = useState("center");
  const [imagePosition, setImagePosition] = useState("center");
  const [watermarkImage, setWatermarkImage] = useState(null);
  const [imageTransparency, setImageTransparency] = useState(50);
  const [imageSizePercentage, setImageSizePercentage] = useState(20);
  const [textRotation, setTextRotation] = useState(0);
  const [fontFile, setFontFile] = useState(null);
  const [zipUrl, setZipUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [textColor, setTextColor] = useState("#000000");
  const [dynamicFontUrl, setDynamicFontUrl] = useState("");
  const [imageDimensions, setImageDimensions] = useState([]);

  const previewWidth = 256;
  const previewHeight = 256;
  const API_BASE_URL = "https://dmarkify.pythonanywhere.com"

  useEffect(() => {
    const fetchFonts = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/watermark/list_fonts/`);
        setFonts(response.data.fonts);
      } catch (error) {
        console.error("Error fetching fonts:", error);
      }
    };
    fetchFonts();
  }, []);

  useEffect(() => {
    if (font) {
      setDynamicFontUrl(`${API_BASE_URL}/static/fonts/${font}.ttf`);
    }
  }, [font]);

  const handleFontUpload = async () => {
    if (!fontFile) {
      alert("Please select a font file.");
      return;
    }
    const formData = new FormData();
    formData.append("font_file", fontFile);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/watermark/upload_font/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      alert(`Font uploaded successfully: ${response.data.font_name}`);
      setFontFile(null);
      const updatedFonts = await axios.get(`${API_BASE_URL}/watermark/list_fonts/`);
      setFonts(updatedFonts.data.fonts);
      setFont(response.data.font_name.split('.')[0]);
      setDynamicFontUrl(`${API_BASE_URL}/static/fonts/${response.data.font_name}`);
    } catch (error) {
      console.error("Error uploading font:", error);
      alert("Failed to upload font. Please try again.");
    }
  };

  const readImageDimensions = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter((file) =>
      ["image/jpeg", "image/png", "image/jpg"].includes(file.type)
    );
    if (validFiles.length !== selectedFiles.length) {
      alert("Only JPG, JPEG, and PNG formats are allowed.");
    }
    setFiles(validFiles);

    const dims = [];
    for (const f of validFiles) {
      const d = await readImageDimensions(f);
      dims.push(d);
    }
    setImageDimensions(dims);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      alert("Please upload at least one valid image.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    if (watermarkOptions.includes("text")) {
      formData.append("watermark_text", watermarkText);
      formData.append("font", font);
      if (fontSize > 0) {
        formData.append("font_size", fontSize);
      }
      if (fontSizePercent && Number(fontSizePercent) > 0) {
        formData.append("font_size_percent", fontSizePercent);
      }
      formData.append("text_transparency", textTransparency);
      formData.append("text_color", textColor);
      formData.append("text_rotation", textRotation);
      formData.append("text_position", textPosition);
    } else {
      formData.append("text_position", textPosition);
    }

    if (watermarkOptions.includes("image") && watermarkImage) {
      formData.append("watermark_image", watermarkImage);
      formData.append("image_transparency", imageTransparency);
      formData.append("image_size_percentage", imageSizePercentage);
      formData.append("image_position", imagePosition);
    } else {
      formData.append("image_position", imagePosition);
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/watermark/upload/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setZipUrl(response.data.zip_url);
    } catch (error) {
      console.error("Error processing files:", error);
      alert("Failed to process files. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const calcScaledFontSize = (w, fsPercent) => {
    let fs = fontSize;
    if (fsPercent && Number(fsPercent) > 0) {
      fs = (w * Number(fsPercent)) / 100;
    }
    return fs;
  };

  const getScaleFactor = (imgW, imgH) => {
    return Math.min(previewWidth / imgW, previewHeight / imgH);
  };

  const getPositions = (pos, w, h, elementW, elementH) => {
    let x, y;
    if (pos === 'center') {
      x = (w - elementW) / 2;
      y = (h - elementH) / 2;
    } else if (pos === 'top-left') {
      x = 10; y = 10;
    } else if (pos === 'top-right') {
      x = w - elementW - 10; y = 10;
    } else if (pos === 'bottom-left') {
      x = 10; y = h - elementH - 10;
    } else if (pos === 'bottom-right') {
      x = w - elementW - 10; y = h - elementH - 10;
    }
    return {x, y};
  };

  const previewTextStyle = (dim) => {
    if(!dim) return {};
    const { width: imgW, height: imgH } = dim;
    const scale = getScaleFactor(imgW, imgH);
    const fs = calcScaledFontSize(imgW, fontSizePercent);
    const scaledFs = fs * scale;
    const transformStr = textPosition === "center" 
      ? `translate(-50%, -50%) rotate(${textRotation}deg)` 
      : `rotate(${textRotation}deg)`;

    const textMetricsCanvas = document.createElement('canvas');
    const ctx = textMetricsCanvas.getContext('2d');
    ctx.font = `${scaledFs}px sans-serif`;
    const textWidth = ctx.measureText(watermarkText).width;
    const textHeight = scaledFs;

    const positions = getPositions(textPosition, previewWidth, previewHeight, textWidth, textHeight);

    return {
      position: "absolute",
      color: textColor,
      fontFamily: `"${font}", sans-serif`,
      fontSize: `${Math.max(scaledFs, 1)}px`,
      top: textPosition === 'center' ? '50%' : `${positions.y}px`,
      left: textPosition === 'center' ? '50%' : `${positions.x}px`,
      transform: transformStr,
      textAlign: "center",
      opacity: textTransparency / 100,
      whiteSpace: "nowrap",
      pointerEvents: "none"
    };
  };

  const previewImageStyle = (dim) => {
    if(!dim) return {};
    const { width: imgW, height: imgH } = dim;
    const scale = getScaleFactor(imgW, imgH);
    const scaledWidth = 100 * scale;
    const scaledHeight = 100 * scale;

    const positions = getPositions(imagePosition, previewWidth, previewHeight, scaledWidth, scaledHeight);
    const transformStr = imagePosition === "center" ? `translate(-50%, -50%)` : `none`;

    return {
      position: "absolute",
      opacity: imageTransparency / 100,
      width: `${scaledWidth}px`,
      height: `${scaledHeight}px`,
      top: imagePosition === 'center' ? '50%' : `${positions.y}px`,
      left: imagePosition === 'center' ? '50%' : `${positions.x}px`,
      transform: transformStr,
      pointerEvents: "none"
    };
  };

  const sortedDimensions = [...imageDimensions].sort((a,b) => (a.width - b.width));
  const smallest = sortedDimensions.length > 0 ? sortedDimensions[0] : null;
  const largest = sortedDimensions.length > 1 ? sortedDimensions[sortedDimensions.length-1] : null;

  return (
    <div className="min-h-screen flex flex-col">
      {dynamicFontUrl && (
        <style>
          {`
            @font-face {
              font-family: "${font}";
              src: url("${dynamicFontUrl}") format("truetype");
              font-weight: normal;
              font-style: normal;
            }
          `}
        </style>
      )}
      <nav className="bg-blue-500 p-4 text-center">
        <h1 className="text-white text-2xl font-bold">Dmarkify</h1>
      </nav>

      <div className="flex-grow p-4 flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
        <div className="w-full md:w-1/2 md:overflow-auto space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <h2 className="text-xl font-semibold">Watermark Your Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Upload Images</label>
                <input
                  type="file"
                  multiple
                  accept=".jpg, .jpeg, .png"
                  onChange={handleFileChange}
                  className="mt-1 w-full px-2 py-1 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Watermark Type</label>
                <div className="flex space-x-4 mt-1">
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      value="text"
                      checked={watermarkOptions.includes("text")}
                      onChange={(e) => {
                        const value = e.target.value;
                        setWatermarkOptions((prev) =>
                          prev.includes(value)
                            ? prev.filter((item) => item !== value)
                            : [...prev, value]
                        );
                      }}
                      className="mr-1"
                    />
                    Text
                  </label>
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      value="image"
                      checked={watermarkOptions.includes("image")}
                      onChange={(e) => {
                        const value = e.target.value;
                        setWatermarkOptions((prev) =>
                          prev.includes(value)
                            ? prev.filter((item) => item !== value)
                            : [...prev, value]
                        );
                      }}
                      className="mr-1"
                    />
                    Image
                  </label>
                </div>
              </div>

              {watermarkOptions.includes("text") && (
                <>
                  <div>
                    <label className="block text-sm font-medium">Watermark Text</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="mt-1 w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium">Font</label>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-1">
                      <select
                        value={font}
                        onChange={(e) => setFont(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm flex-1"
                      >
                        {fonts.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                      <input
                        type="file"
                        onChange={(e) => setFontFile(e.target.files[0])}
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-full sm:w-auto"
                      />
                      <button
                        type="button"
                        onClick={handleFontUpload}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 w-full sm:w-auto"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Font Size (px)</label>
                    <input
                      type="number"
                      value={fontSize}
                      onChange={(e) => setFontSize(Math.max(1, Number(e.target.value)))}
                      className="mt-1 w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Font Size (% of Image Width)</label>
                    <input
                      type="number"
                      value={fontSizePercent}
                      onChange={(e) => setFontSizePercent(e.target.value)}
                      className="mt-1 w-full px-2 py-1 border border-gray-300 rounded"
                      placeholder="Leave empty if not used"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Text Transparency (%)</label>
                    <input
                      type="number"
                      value={textTransparency}
                      onChange={(e) => setTextTransparency(Number(e.target.value))}
                      min="0"
                      max="100"
                      className="mt-1 w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium">Text Color</label>
                    <input
                      type="text"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="mt-1 w-full px-2 py-1 border border-gray-300 rounded"
                      placeholder="e.g. #000000, rgb(255,0,0), gradient(#000,#fff)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Text Rotation (deg)</label>
                    <input
                      type="number"
                      value={textRotation}
                      onChange={(e) => setTextRotation(Number(e.target.value))}
                      className="mt-1 w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Text Position</label>
                    <select
                      value={textPosition}
                      onChange={(e) => setTextPosition(e.target.value)}
                      className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="center">Center</option>
                      <option value="top-left">Top Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-right">Bottom Right</option>
                    </select>
                  </div>
                </>
              )}

              {watermarkOptions.includes("image") && (
                <>
                  <div>
                    <label className="block text-sm font-medium">Watermark Image</label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file && ["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
                          setWatermarkImage(file);
                        } else {
                          alert("Only one image (jpg/jpeg/png) allowed.");
                          e.target.value = "";
                          setWatermarkImage(null);
                        }
                      }}
                      className="mt-1 w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Image Transparency (%)</label>
                    <input
                      type="number"
                      value={imageTransparency}
                      onChange={(e) => setImageTransparency(Number(e.target.value))}
                      min="0"
                      max="100"
                      className="mt-1 w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Image Size (% of Image Width)</label>
                    <input
                      type="number"
                      value={imageSizePercentage}
                      onChange={(e) => setImageSizePercentage(Number(e.target.value))}
                      min="1"
                      max="100"
                      className="mt-1 w-full px-2 py-1 border border-gray-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Image Position</label>
                    <select
                      value={imagePosition}
                      onChange={(e) => setImagePosition(e.target.value)}
                      className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="center">Center</option>
                      <option value="top-left">Top Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-right">Bottom Right</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            <button
              type="submit"
              className={`w-full py-2 mt-4 text-white font-medium rounded ${(loading || files.length === 0) ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"}`}
              disabled={loading || files.length === 0}
            >
              {loading ? "Processing..." : "Process Files"}
            </button>
          </form>
        </div>

        <div className="w-full md:w-1/2 flex flex-col items-center space-y-4">
          {sortedDimensions.length === 1 && (
            <>
              <h3 className="text-lg font-semibold text-center">Live Preview (~{sortedDimensions[0].width}x{sortedDimensions[0].height}px)</h3>
              <div className="relative mx-auto" style={{width: `${previewWidth}px`, height: `${previewHeight}px`, backgroundColor: '#e2e2e2', border: '1px solid #ccc', overflow:'hidden', fontFamily: `"${font}", sans-serif`}}>
                {watermarkOptions.includes("text") && (
                  <div style={previewTextStyle(sortedDimensions[0])}>{watermarkText}</div>
                )}
                {watermarkOptions.includes("image") && watermarkImage && (
                  <img
                    src={URL.createObjectURL(watermarkImage)}
                    alt="Watermark Preview"
                    style={previewImageStyle(sortedDimensions[0])}
                  />
                )}
              </div>
            </>
          )}
          {sortedDimensions.length > 1 && (
            <>
              <h3 className="text-lg font-semibold text-center">Live Preview Smallest (~{sortedDimensions[0].width}x{sortedDimensions[0].height}px)</h3>
              <div className="relative mx-auto" style={{width: `${previewWidth}px`, height: `${previewHeight}px`, backgroundColor: '#e2e2e2', border: '1px solid #ccc', overflow:'hidden', fontFamily: `"${font}", sans-serif`}}>
                {watermarkOptions.includes("text") && (
                  <div style={previewTextStyle(sortedDimensions[0])}>{watermarkText}</div>
                )}
                {watermarkOptions.includes("image") && watermarkImage && (
                  <img
                    src={URL.createObjectURL(watermarkImage)}
                    alt="Watermark Preview"
                    style={previewImageStyle(sortedDimensions[0])}
                  />
                )}
              </div>
              <h3 className="text-lg font-semibold text-center">Live Preview Largest (~{sortedDimensions[sortedDimensions.length-1].width}x{sortedDimensions[sortedDimensions.length-1].height}px)</h3>
              <div className="relative mx-auto" style={{width: `${previewWidth}px`, height: `${previewHeight}px`, backgroundColor: '#e2e2e2', border: '1px solid #ccc', overflow:'hidden', fontFamily: `"${font}", sans-serif`}}>
                {watermarkOptions.includes("text") && (
                  <div style={previewTextStyle(sortedDimensions[sortedDimensions.length-1])}>{watermarkText}</div>
                )}
                {watermarkOptions.includes("image") && watermarkImage && (
                  <img
                    src={URL.createObjectURL(watermarkImage)}
                    alt="Watermark Preview"
                    style={previewImageStyle(sortedDimensions[sortedDimensions.length-1])}
                  />
                )}
              </div>
            </>
          )}
          <div className="mt-2 text-sm text-center" style={{fontFamily: `"${font}", sans-serif`}}>
            Font Preview: {font}
          </div>
        </div>
      </div>

      {zipUrl && (
        <div className="text-center mt-4 px-4">
            <p className="mb-2">Files processed successfully!</p>
            <p className="text-sm text-gray-600">Your uploaded images and fonts have been deleted to ensure your data's security.</p>
            <a href={zipUrl} download className="text-blue-500 underline font-medium block mt-2">
            Download Files
            </a>
        </div>
      )}

      <footer className="bg-gray-100 text-center py-4 mt-4">
        <p className="text-sm text-gray-500">© 2024 Dmarkify by <a href="www.linkedin.com/in/motidivya">Divyesh Vishwakarma</a>. All rights reserved. (❤️Moti)</p>
      </footer>
    </div>
  );
};

export default HomePage;
