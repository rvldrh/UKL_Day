const mysql = require('mysql')

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "coffee_order"
})

db.connect(error => {
    if(error){
        console.log(error.message)
    }
    else{
        "connect"
    }
})

module.exports = db 