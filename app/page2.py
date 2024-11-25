from flask import Blueprint, render_template

# Define the blueprint for page2
page2_blueprint = Blueprint('page2', __name__)

# Define the route for page2
@page2_blueprint.route('/')
def page2():
    return render_template('page2.html')
