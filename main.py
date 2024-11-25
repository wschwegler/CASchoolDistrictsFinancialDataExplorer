from flask import Flask, render_template, redirect, url_for
from app.home import home_blueprint
from app.page2 import page2_blueprint
from app.page3 import page3_blueprint


app = Flask(__name__)

# Load configurations
app.config.from_object('config.Config')

# Register Blueprints
app.register_blueprint(home_blueprint)
app.register_blueprint(page2_blueprint, url_prefix='/page2')  # Added URL prefix for page2
app.register_blueprint(page3_blueprint)

@app.route('/')
def upload_form():
    return render_template('index.html')



if __name__ == '__main__':
    app.run(debug=True)