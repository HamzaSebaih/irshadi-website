'''
@app.route('/add', methods=['POST'])
def add_data():
    try:
        # Get data from the request (e.g., JSON payload)
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Add data to Firestore
        db.collection('users').add(data)  # 'users' is the collection name
        return jsonify({"message": "Data added successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
'''
#the above is adding documents with automatically genereated ID

