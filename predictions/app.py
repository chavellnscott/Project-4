#imports
from bson import json_util
from flask import Flask, render_template, request,json
import pymongo
import json
import pandas as pd
import tensorflow as tf
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
#create flask
app = Flask(__name__)
#connect to mongo db to update dropdown options
serverUrl = "mongodb://localhost:27017"
client = pymongo.MongoClient(serverUrl)
db = client.flight_status_db
X_collection = db.X
y_collection = db.y

#read in csv files to use on model
X = pd.read_csv('Project-4/model/predictions/Resources/X.csv').drop(['Unnamed: 0'],axis=1)
y = pd.read_csv('Project-4/model/predictions/Resources/y.csv').drop(['Unnamed: 0'],axis=1)

#Scale the feature data
scaler = StandardScaler()
scaler.fit(X)
transformed_data = scaler.transform(X)
# Creating a DataFrame with with the scaled data
transformed_data_df = pd.DataFrame(transformed_data)
# Split the data using train_test_split
X_train, X_test, y_train, y_test = train_test_split(transformed_data_df, y, random_state=1)

#load model from saved keras file
model = tf.keras.models.load_model('Project-4/model/predictions/Resources/nn_model.keras')
#predict and evaluate the model
testPredictions = model.predict(X_test)
model_loss, model_accuracy = model.evaluate(X_test,y_test,verbose=2)
#create a new LogisticRegression model
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import balanced_accuracy_score, confusion_matrix, classification_report
lr_model = LogisticRegression(random_state=1)
# Fit the model using training data
lr_model.fit(X_train, y_train)
#model accuracy
lr_model.score(X_train, y_train)
# Make a prediction using the testing data
lr_predictions = lr_model.predict(X_test)

# Print the classification report for the lr_model
tn, fp, fn, tp = confusion_matrix(y_test, lr_predictions).ravel()
accuracy = (tp + tn) / (tp + fp + tn + fn)

print(model_accuracy)
# Print the balanced_accuracy score of the model
print(balanced_accuracy_score(y_test,lr_predictions))
# Generate a confusion matrix for the lr_model
print(confusion_matrix(y_test,lr_predictions))
#home route
@app.route("/")
def default():
    return render_template('index.html')
#get data from mongo db route
@app.route("/get_data")
def get_data():
    data = X_collection.find()

    return json_util.dumps(data[0])
#predict route that will post to the home route
@app.route('/predict', methods=['POST'])
def predict():
    #grab data used in payload in model.js
    if request.method == 'POST':
        data = request.form['data']
        #convert the data to json
        data = json.loads(data)
        #predict both models
        lr_prediction = lr_model.predict([data['data']])
        prediction = model.predict([data['data']])
        print(lr_prediction[0])
        #reset the status
        status = ''
        #update status
        if (lr_prediction[0]>=.5):
            status = 'Delayed'
        else :
            status = 'On Time' 
        return f'Status: {status}, lr_prediction: {lr_prediction[0]}, nn_prediction: {prediction[0]}'

if __name__ == '__main__':
    app.run(debug=True, port=5501)