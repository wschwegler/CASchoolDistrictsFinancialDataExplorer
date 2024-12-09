from flask import Blueprint, render_template

# Define a blueprint for the home page
home_blueprint = Blueprint('home', __name__)

@home_blueprint.route('/')
def home():
    return render_template('index.html')

@home_blueprint.route('/visualization')
def visualization():
    return render_template('visualization.html')  # Returns the 'visualization.html' template

@home_blueprint.route('/database')
def database():
    return render_template('database.html')

@home_blueprint.route('/userguide')
def userguide():
    return render_template('userguide.html')  
