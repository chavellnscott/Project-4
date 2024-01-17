//Use d3 to select the dropdown options
let destinationDropdownMenu = d3.select("#selDestination");
let dateDropdownMenu = d3.select("#selDate");
let airlineDropdownMenu = d3.select("#selAirline");
let dayOfWeekMenu = d3.select("#selDay");
//Time will be an input box
let timeDropdownMenu = d3.select("#selTime");

//Create an empty dictionary for the new flight info to predict
let flightInfo = {}
//Get data from the mongo db to fill dropdown options
d3.json("/get_data").then(data => {
    //Grab keys from X dataframe
    let keys = []
    Object.keys(data).forEach(key => {
        keys.push(key)
    })
    //remove the first two columns
    keys.shift();
    keys.shift();
    //Return 0 for each key as a placeholder
    keys.forEach(key=> {
        flightInfo[key] = 0
    })
    console.log(flightInfo);

    //Create an empty list for the dropdown options
    let destinationDropDownOptions = []
    let dateDropDownOptions = []
    let airlineDropDownOptions = []

    //Append options to the dropdown options list
    Object.keys(flightInfo).forEach(key => {
        if (key.includes('DEST_CITY_NAME_')){
            destinationDropDownOptions.push(key.replace('DEST_CITY_NAME_',''))
        }
        if (key.includes('Date_')){
            dateDropDownOptions.push(key.replace('Date_',''))
        }
        if (key.includes('MKT_UNIQUE_CARRIER_')){
            airlineDropDownOptions.push(key.replace('MKT_UNIQUE_CARRIER_',''))
        }
    })
    //Add options for the dropdown
    destinationDropDownOptions.forEach(option => {
        currentData = destinationDropdownMenu.append('option')
        currentData.text(option)
    })
    dateDropDownOptions.forEach(option => {
        currentData = dateDropdownMenu.append('option')
        currentData.text(option)
    })
    airlineDropDownOptions.forEach(option => {
        currentData = airlineDropdownMenu.append('option')
        currentData.text(option)
    })
    let daysOfWeek = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday', 'Sunday']
    daysOfWeek.forEach(option => {
        currentData = dayOfWeekMenu.append('option')
        currentData.text(option)
    })
      
})
//Use d3 to select the predict button
let submit = d3.select("#submit");
//Use d3 to select the output box
let response = d3.select("#response");
submit.on("click", () => {
    //reset the text to empty
    response.text('')
    //grab the values from each dropdown and input box
    let destination = destinationDropdownMenu.property("value");
    let date = dateDropdownMenu.property("value");
    let time = timeDropdownMenu.property("value");
    let carrier = airlineDropdownMenu.property("value");
    let day = dayOfWeekMenu.property("value");
    //update the flight info we want to predict
    Object.keys(flightInfo).forEach(key => {
        if (key.includes(destination)){
            flightInfo[key] = 1
        }
        if (key.includes(date)){
            flightInfo[key] = 1
        }
        if (key.includes(carrier)){
            flightInfo[key] = 1
        }
        if (key.includes(day)){
            flightInfo[key] = 1
        }
    })
    flightInfo['CRS_DEP_TIME']=parseFloat(time)
    //create an empty list for values
    let readyToPredict = []
    Object.keys(flightInfo).forEach(key => {
        readyToPredict.push(flightInfo[key])
    })
    console.log(readyToPredict)
    //create a payload to give the data to the predict flask
    payload = {data: readyToPredict}
    //use the code from app.py to make a prediction on the payload data
    d3.text("/predict", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "data=" +  JSON.stringify(payload) // add it to the http header as a json string
    }).then(data => {
        //display the data in div 'response'
        response.text(`${data} ${response.text()}`)
        //log the data
        console.log('this is what the response from flask was')
        console.log(data);
    });
})