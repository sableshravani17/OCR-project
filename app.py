from flask import Flask, render_template, request
from PIL import Image
import pytesseract
import re
import os

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Set the path to your Tesseract-OCR executable if on Windows
# For Linux/macOS, Tesseract should be in your PATH
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"  # Change if needed

def extract_details(text, doc_type):
    # Aadhaar regex: 4 digits + space + 4 digits + space + 4 digits
    aadhaar = re.findall(r'\b\d{4}\s\d{4}\s\d{4}\b', text)
    # PAN regex: 5 uppercase letters + 4 digits + 1 uppercase letter
    pan = re.findall(r'\b[A-Z]{5}[0-9]{4}[A-Z]\b', text)
    # Date of Birth regex (common format dd/mm/yyyy)
    dob = re.findall(r'\b\d{2}/\d{2}/\d{4}\b', text)

    result = {"raw_text": text}

    # Validate based on doc type
    if doc_type == 'aadhaar':
        if not aadhaar:
            result["error"] = "You selected Aadhaar but no Aadhaar number was detected. Please upload a valid Aadhaar card image."
        else:
            result["aadhaar_number"] = aadhaar[0]
    elif doc_type == 'pan':
        if not pan:
            result["error"] = "You selected PAN but no PAN number was detected. Please upload a valid PAN card image."
        else:
            result["pan_number"] = pan[0]

    if dob:
        result["date_of_birth"] = dob[0]
    else:
        result["date_of_birth"] = "Not found"

    return result

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        doc_type = request.form.get('document_type')
        image = request.files.get('image')

        if not doc_type:
            return render_template('index.html', error="Please select a document type.")

        if not image:
            return render_template('index.html', error="Please upload an image.", doc_type=doc_type)

        # Save the image
        filepath = os.path.join(UPLOAD_FOLDER, image.filename)
        image.save(filepath)

        # Run OCR
        try:
            text = pytesseract.image_to_string(Image.open(filepath))
        except Exception as e:
            return render_template('index.html', error=f"Failed to process image: {e}", doc_type=doc_type)

        extracted = extract_details(text, doc_type)

        # Remove file after processing (optional)
        if os.path.exists(filepath):
            os.remove(filepath)

        # If error in extraction, show error
        if "error" in extracted:
            return render_template('index.html', error=extracted["error"], doc_type=doc_type)

        return render_template('index.html', extracted=extracted, doc_type=doc_type)

    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
