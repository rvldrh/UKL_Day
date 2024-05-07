const express = require('express')
const app = express()
const cors = require('cors')
const port = 8000
const bodyParser = require('body-parser')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(cors())

const admin = require('./route/admin')
const coffee = require('./route/coffee')
const order_detail = require('./route/order_detail')
const order_list = require('./route/order_list')

app.use("/admin", admin)
app.use("/coffee", coffee)
app.use("/order_detail", order_detail)
app.use("/order_list", order_list)

app.listen(port, ()=>{
    console.log("Halo "+port)
})

module.exports = app
