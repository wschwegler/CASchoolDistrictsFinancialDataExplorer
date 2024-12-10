from flask import Flask, render_template, redirect, url_for, request, jsonify
from app.home import home_blueprint
from app.page2 import page2_blueprint
from app.page3 import page3_blueprint
from app.page4 import page4_blueprint
from app.uploadCsv import updateCsv_blueprint
import os

app = Flask(__name__)

# Load configurations
app.config.from_object('config.Config')

# Register Blueprints
app.register_blueprint(home_blueprint, url_prefix='/home')
app.register_blueprint(page2_blueprint, url_prefix='/page2')  # Added URL prefix for page2
app.register_blueprint(page3_blueprint, url_prefix='/page3')
app.register_blueprint(page4_blueprint, url_prefix='/page4')
app.register_blueprint(updateCsv_blueprint, url_prefix='/updateCsv')

@app.route('/')
def upload_form():
    return render_template('index.html')

@app.route('/update-csv', methods=['POST'])
def update_csv():
    try:
        # Ensure the static folder exists
        static_folder = os.path.join(app.root_path, 'static')
        if not os.path.exists(static_folder):
            os.makedirs(static_folder)

        # Save the uploaded CSV to the static folder, replacing the old one
        uploaded_file = request.files['file']
        if uploaded_file.filename != '':
            file_path = os.path.join(static_folder, 'Data.csv')  # Change 'Data.csv' as needed
            uploaded_file.save(file_path)
            return jsonify({"message": "CSV file successfully updated!"}), 200
        else:
            return jsonify({"message": "No file uploaded!"}), 400

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"message": "Error updating CSV file"}), 500

if __name__ == '__main__':
    app.run(debug=True)
