from flask import Flask, Blueprint, render_template, request, send_file
import pandas as pd
import os
import shutil
import difflib


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
        df3 = pd.read_csv(saved_files[0])
        df4 = pd.read_csv(saved_files[1])

        columns_to_keep = ['leaid', 'year', 'lea_name', 'phone', 'urban_centric_locale', 'number_of_schools', 'enrollment',
                       'teachers_total_fte', 'race', 'rev_total', 'rev_fed_total', 'rev_state_total', 'rev_local_total',
                       'exp_total', 'exp_current_instruction_total', 'outlay_capital_total', 'payments_charter_schools',
                       'salaries_instruction', 'benefits_employee_total', 'debt_interest', 
                       'debt_longterm_outstand_end_fy', 'debt_shortterm_outstand_end_fy', 'est_population_5_17_poverty_pct']
    
        #df3 = df3[df3['state_mailing'].str.contains('CA', na=False)]
        df3.columns = df3.columns.str.lower()
        df3 = df3.filter(columns_to_keep)
        df3['leaid'] = df3['leaid'].astype(str)

        df4.columns = df4.columns.str.lower()
        df4 = df4.filter(columns_to_keep)
        df4['leaid'] = df4['leaid'].astype(str)

        counter = 0 
        # Merge df3 and df4 based on best matches
        merged_df2 = pd.DataFrame(columns=df3.columns.tolist() + df4.columns.tolist())
        for _, row in df3.iterrows():
            target = row['leaid']
            target_year = row['year']
            candidates = df4[df4['year'] == target_year]
            best_match = None
            best_ratio = 0
            for _, candidate in candidates.iterrows():
                ratio = difflib.SequenceMatcher(None, target, candidate['leaid']).ratio()
                if ratio > best_ratio and ratio >= 0.92:
                    counter += 1
                    print(counter)
                    best_ratio = ratio
                    best_match = candidate
            if best_match is not None:
                new_row = pd.concat([row, best_match]).to_frame().T
                merged_df2 = pd.concat([merged_df2, new_row], ignore_index=True)

        # Save df1 as a downloadable file in the MERGED_FOLDER
        df1_filepath = os.path.join(MERGED_FOLDER, 'processed_df1.csv')
        merged_df2.to_csv(df1_filepath, index=False)
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
