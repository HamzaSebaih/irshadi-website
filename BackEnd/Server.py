#this is the server program.

from flask import Flask, jsonify, request
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Flask app
app = Flask(__name__)


# Initialize Firestore
cred = credentials.Certificate("BackEnd/OtherFiles/testing-582ce-firebase-adminsdk-fbsvc-1f8cf2adaa.json")  # this is the credentials that will be used to connect with the firestore
firebase_admin.initialize_app(cred) #here we make a connection with firebase using our credentials, 
db = firestore.client()  # This is your Firestore database object, here we create a connection to our firestore database, 

# Test route
@app.route('/')
def home():
    return "Welcome to Flask with Firestore!"


@app.route('/add', methods=['POST'])
def add_data():
    #route for adding  a user document to the users collections by using the id given 
    try:
        # Get data from the request (e.g., JSON payload)
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        customid = data.get("id") #extracts the id key value
        # Add data to Firestore
        db.collection('users').document(customid).set(data)  # goes to the collection - make reference to a document with the name of the id - then set its data to the json body received, note: is there is no document it will create one.
        return jsonify({"message": "Data added successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500




@app.route('/get/<user_id>', methods=['GET'])
def get_data(user_id):
    #route for retrieving a user document  from the users collections
    try:
        # Get a document by ID
        user_ref = db.collection('users').document(user_id) #this createse a pointer to the document with the specificed user_id
        user = user_ref.get() #here we fetch the document 
        if user.exists:
            return jsonify(user.to_dict()), 200
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/update/<user_id>', methods=['PUT'])
def update_data(user_id):
    #route for updating a user document  from the users collections
    try:
        # Get updated data from the request
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Update the document
        user_ref = db.collection('users').document(user_id)
        user_ref.update(data)
        return jsonify({"message": "Data updated successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/delete/<user_id>', methods=['DELETE'])
def delete_data(user_id):
     #route for deleting a user document  from the users collections
    try:
        # Delete the document
        db.collection('users').document(user_id).delete()
        return jsonify({"message": "Data deleted successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__': #this starts the flask application
    app.run(debug=True)

