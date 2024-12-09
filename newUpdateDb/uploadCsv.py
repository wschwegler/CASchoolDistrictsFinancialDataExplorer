import os

from flask import Flask, request, render_template, redirect, url_for, send_from_directory
from werkzeug.utils import secure_filename
from datetime import datetime
#from script import process_csv

ALLOWED_EXTENSIONS = set(['csv'])

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_app():
    app = Flask(__name__)

    @app.route('/upload', methods=['GET', 'POST'])
    def upload():
        if request.method == 'POST':
            file = request.files['file']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                new_filename = 'Data.csv'
                static_folder_path = os.path.abspath(os.path.join(os.getcwd(), '..', 'static'))
                save_location = os.path.join(static_folder_path, new_filename)
                # save_location = os.path.join('static', new_filename)
                file.save(save_location)

                #output_file = process_csv(save_location)
                #return send_from_directory('output', output_file)
                #return redirect(url_for('download'))

        return render_template('index.html')

    # @app.route('/download')
    # def download():
    #     return render_template('index.html', files=os.listdir('output'))

    # @app.route('/download/<filename>')
    # def download_file(filename):
    #     return send_from_directory('output', filename)

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)