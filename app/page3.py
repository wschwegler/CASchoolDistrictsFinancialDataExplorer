from flask import Flask, Blueprint, render_template, request, send_file
import pandas as pd
import os
import shutil
import difflib

# Define a blueprint for Page 3
page3_blueprint = Blueprint('page3', __name__)


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
@page3_blueprint.route('/')
def page3():
    """Clear the folders and render the upload page."""
    clear_folders()  # Clear the folders when the page is accessed
    return render_template('page3.html')

@page3_blueprint.route('/upload', methods=['POST'])
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

        df7 = pd.read_csv(saved_files[0])
        df8 = pd.read_csv(saved_files[1])
        df7.columns = df7.columns.str.lower()
        df8.columns = df8.columns.str.lower()

        columns_to_keep2 = ['fiscal year', 'name of school district', 'secured_net taxable value', 'unsecured_net taxable value']
        df8 = df8.filter(columns_to_keep2)




        columns = df7.columns.tolist() + df8.columns.tolist()
        merged_df_final = pd.DataFrame(columns=columns)
        ignore_words = ["unified"]
        counter2 = 0
        for i in range(0, len(df7)):
            target = df7.iloc[i]['lea_name'].lower()
            target = target.lower()
            target_y = df7.iloc[i]['year']
            for word in ignore_words:
                target = target.replace(word, "").strip()
            new_df = df8[df8['fiscal year'] == int(target_y)]

            best_match = None
            best_ratio = 0

            for k in range(0, len(new_df)):
                df8_name = new_df.iloc[k]['name of school district'].lower()
                for word in ignore_words:
                    df8_name = df8_name.replace(word, "").strip()
                diff = difflib.SequenceMatcher(None, target, df8_name)
                ratio = diff.ratio()
                if (ratio >= 0.92):
                    counter2 += 1
                    print(counter2)
                    if ratio > best_ratio:
                        best_ratio = ratio
                        best_match = new_df.iloc[k].copy()
            if best_match is not None:
                new_row = pd.concat([df7.iloc[[i]].reset_index(drop=True),
                                    best_match.to_frame().T.reset_index(drop=True)], axis=1)
                merged_df_final = pd.concat([merged_df_final, new_row], ignore_index=True)



        # Save df1 as a downloadable file in the MERGED_FOLDER
        df1_filepath = os.path.join(MERGED_FOLDER, 'merged_df_final.csv')
        merged_df_final.to_csv(df1_filepath, index=False)
    except Exception as e:
        return f"Error processing files: {str(e)}"

    # Render the result.html page with the download link
    return render_template('result2.html', download_file='merged_df_final.csv')


@page3_blueprint.route('/download/<filename>')
def download_file(filename):
    """Serve the requested file for download."""
    filepath = os.path.join(MERGED_FOLDER, filename)
    if not os.path.exists(filepath):
        return 'File not found.', 404
    return send_file(filepath, as_attachment=True)

# Initialize the Flask app
app = Flask(__name__)
app.register_blueprint(page3_blueprint, url_prefix='/page3')

if __name__ == '__main__':
    app.run(debug=True)
