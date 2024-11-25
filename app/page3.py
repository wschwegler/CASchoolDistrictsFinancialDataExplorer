from flask import Blueprint, render_template

# Define a blueprint for Page 3
page3_blueprint = Blueprint('page3', __name__)

@page3_blueprint.route('/page3')
def page3():
    return render_template('page3.html')
