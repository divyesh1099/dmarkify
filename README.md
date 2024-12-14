# **Dmarkify: Advanced Image Watermarking Tool**

Dmarkify is a full-featured, open-source watermarking tool designed to handle text and image watermarks with advanced customization options, including gradients, rotations, transparency, and dynamic positioning.

---

## **Features**
1. **Custom Fonts**: Upload your `.ttf` fonts for text watermarks.
2. **Advanced Text Watermark Options**:
   - Font size in pixels or percentage of image width.
   - Color options (solid or gradient).
   - Transparency and rotation.
   - Positioning (`center`, `top-left`, etc.).
3. **Image Watermark Options**:
   - Dynamic resizing based on image width.
   - Transparency and rotation.
   - Positioning (`center`, `bottom-right`, etc.).
4. **Batch Processing**: Upload multiple images and process them in one go.
5. **Automatic Cleanup**: Deletes uploaded files and generated outputs after 5 minutes.
6. **Gradient Text**: Specify gradient colors for text watermarks.
7. **Live Preview**: See text and image watermarks before applying.

---

## **Technologies Used**
### Backend:
- **Django**: REST API for handling watermark logic and file management.
- **Pillow**: For advanced image processing.

### Frontend:
- **React**: Modern and responsive UI for user interactions.
- **Tailwind CSS**: Utility-first CSS framework for styling.

---

## **Installation and Setup**

### Prerequisites
- Python 3.8+ installed.
- Node.js 14+ and npm installed.
- Basic knowledge of Django and React.

---

### Backend Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/dmarkify.git
   cd dmarkify/dmarkify_backend
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run database migrations**:
   ```bash
   python manage.py migrate
   ```

5. **Create required directories**:
   ```bash
   mkdir -p watermark/fonts
   mkdir -p media/output
   ```

6. **Run the server**:
   ```bash
   python manage.py runserver
   ```

The backend will run at `http://127.0.0.1:8000`.

---

### Frontend Setup
1. **Navigate to the frontend directory**:
   ```bash
   cd ../dmarkify_frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

The frontend will run at `http://localhost:3000`.

---

## **Using Dmarkify**
### 1. Upload Fonts
- Use the `Custom Fonts` feature to upload `.ttf` files for text watermarks.

### 2. Upload Images
- Drag and drop or select multiple `.jpg`, `.jpeg`, or `.png` files.

### 3. Customize Watermark
#### Text Watermark:
- Add watermark text and choose:
  - Font, size, transparency, and color (solid or gradient).
  - Rotation angle and position.

#### Image Watermark:
- Upload an image to use as a watermark and adjust:
  - Size, transparency, rotation, and position.

### 4. Preview and Process
- View the live preview.
- Click **Process Files** to generate watermarked images.
- Download the `.zip` file containing processed images.

---

## **API Documentation**

### 1. **List Fonts**
- **Endpoint**: `/watermark/list_fonts/`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "fonts": ["Roboto-Regular", "CustomFont1", "CustomFont2"]
  }
  ```

### 2. **Upload Font**
- **Endpoint**: `/watermark/upload_font/`
- **Method**: `POST`
- **Request Body**: 
  - `font_file` (File): Upload a `.ttf` font file.
- **Response**:
  ```json
  {
    "message": "Font uploaded successfully.",
    "font_name": "CustomFont.ttf"
  }
  ```

### 3. **Process Files**
- **Endpoint**: `/watermark/upload/`
- **Method**: `POST`
- **Request Body (form-data)**:
  - `files` (File): One or more image files.
  - `watermark_text` (String): Optional text watermark.
  - `text_position` (String): Text position (e.g., `center`, `top-left`).
  - `font` (String): Font name (e.g., `"Roboto-Regular"`).
  - `font_size` (Integer): Font size in pixels.
  - `font_size_percent` (Integer): Font size as a percentage of image width.
  - `text_transparency` (Integer): Text transparency (0-100).
  - `text_color` (String): Text color or gradient (e.g., `"#FFFFFF"` or `"gradient(#FFFFFF,#000000)"`).
  - `text_rotation` (Integer): Text rotation angle (0-360 degrees).
  - `watermark_image` (File): Optional watermark image file.
  - `image_position` (String): Image position (e.g., `center`, `bottom-right`).
  - `image_size_percentage` (Integer): Image size as a percentage of the original image.
  - `image_transparency` (Integer): Image transparency (0-100).
- **Response**:
  ```json
  {
    "message": "Files processed successfully",
    "zip_url": "http://127.0.0.1:8000/media/output/watermarked_images.zip"
  }
  ```

### 4. **Download Processed Files**
- **Endpoint**: `/media/output/watermarked_images.zip`
- **Method**: `GET`

---

## **Testing with Postman**
1. **Test Font Upload**:
   - Use `/watermark/upload_font/` to upload `.ttf` fonts.
2. **Test Watermark Processing**:
   - Use `/watermark/upload/` with various combinations of text and image watermark options.
3. **Download Files**:
   - Use the URL in the `zip_url` response to download the watermarked images.

---

## **Future Enhancements**
- Support for video watermarking.
- Drag-and-drop interface for positioning.
- Cloud storage integration (e.g., AWS S3, Google Cloud).

---

## **License**
This project is licensed under the **MIT License**.