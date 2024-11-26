from flask import Flask, Blueprint, render_template, request, send_file
import pandas as pd
import os
import shutil

# Define the blueprint for page2
page2_blueprint = Blueprint('page2', __name__)

UPLOAD_FOLDER = 'uploads'
MERGED_FOLDER = 'merged_files'
ALLOWED_EXTENSIONS = {'csv'}

# Create directories if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(MERGED_FOLDER, exist_ok=True)

def clear_folders():
    """Clear the contents of the uploads and merged_files folders."""
    for folder in [UPLOAD_FOLDER, MERGED_FOLDER]:
        for filename in os.listdir(folder):
            file_path = os.path.join(folder, filename)
            try:
                if os.path.isfile(file_path):
                    os.remove(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                print(f"Error clearing {file_path}: {e}")

def allowed_file(filename):
    """Check if the uploaded file has a valid extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Define the route for page2
@page2_blueprint.route('/')
def page2():
    """Clear the folders and render the upload page."""
    clear_folders()  # Clear the folders when the page is accessed
    return render_template('page2.html')

@page2_blueprint.route('/upload', methods=['POST'])
def upload_files():
    """Handle file uploads and process them."""
    if 'files[]' not in request.files:
        return 'No files part in request'
    files = request.files.getlist('files[]')  # Retrieve the list of uploaded files

    if len(files) != 2:
        return 'You must upload exactly 2 files.'

    # Save uploaded files to the `uploads` folder
    saved_files = []
    for file in files:
        if file and allowed_file(file.filename):
            filepath = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(filepath)
            saved_files.append(filepath)  # Save the full file path for processing
        else:
            return f"Invalid file format for {file.filename}."

    try:
        # Load the first CSV into a DataFrame as an example
        df1 = pd.read_csv(saved_files[0])

        # Save df1 as a downloadable file in the MERGED_FOLDER
        df1_filepath = os.path.join(MERGED_FOLDER, 'processed_df1.csv')
        df1.to_csv(df1_filepath, index=False)
    except Exception as e:
        return f"Error processing files: {str(e)}"

    # Render the result.html page with the download link
    return render_template('result.html', download_file='processed_df1.csv')


@page2_blueprint.route('/download/<filename>')
def download_file(filename):
    """Serve the requested file for download."""
    filepath = os.path.join(MERGED_FOLDER, filename)
    if not os.path.exists(filepath):
        return 'File not found.', 404
    return send_file(filepath, as_attachment=True)

# Initialize the Flask app
app = Flask(__name__)
app.register_blueprint(page2_blueprint, url_prefix='/page2')

if __name__ == '__main__':
    app.run(debug=True)
