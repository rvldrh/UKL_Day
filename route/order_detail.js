const express = require('express');
const cors = require('cors');
const moment = require('moment');
const db = require('../koneksi');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// CREATE
app.post("/", (req, res) => {
    let currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
    let sql = "INSERT INTO order_detail SET ?";
    let data = {
        coffee: req.body.coffee,
        quantity: req.body.quantity,
        price: req.body.price,
        createdAt: currentDate,
        updatedAt: currentDate
    };
    db.query(sql, data, (error, result) => {
        if(error){
            res.status(500).json({
                message: error.message
            });
        } else {
            res.status(201).json({
                message: "Data inserted"
            });
        }
    });
});

// READ all order details
app.get("/", (req, res) => {
    let sql = "SELECT * FROM order_detail";
    db.query(sql, (error, result) => {
        if(error){
            res.status(500).json({
                message: error.message
            });
        } else {
            res.status(200).json({
                count: result.length,
                data: result
            });
        }
    });
});

// READ one order detail
app.get("/:id", (req, res) => {
    let sql = "SELECT * FROM order_detail WHERE id = ?";
    db.query(sql, [req.params.id], (error, result) => {
        if(error){
            res.status(500).json({
                message: error.message
            });
        } else {
            if(result.length === 0){
                res.status(404).json({
                    message: "Order detail not found"
                });
            } else {
                res.status(200).json({
                    data: result[0]
                });
            }
        }
    });
});

// UPDATE
app.put("/:id", (req, res) => {
    let currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
    let sql = "UPDATE order_detail SET coffee=?, quantity=?, price=?, updatedAt=? WHERE id=?";
    let data = [
        req.body.coffee,
        req.body.quantity,
        req.body.price,
        currentDate,
        req.params.id
    ];
    db.query(sql, data, (error, result) => {
        if(error){
            res.status(500).json({
                message: error.message
            });
        } else {
            if(result.affectedRows === 0){
                res.status(404).json({
                    message: "Order detail not found"
                });
            } else {
                res.status(200).json({
                    message: "Data updated"
                });
            }
        }
    });
});

// DELETE
app.delete("/:id", (req, res) => {
    let sql = "DELETE FROM order_detail WHERE id=?";
    db.query(sql, [req.params.id], (error, result) => {
        if(error){
            res.status(500).json({
                message: error.message
            });
        } else {
            if(result.affectedRows === 0){
                res.status(404).json({
                    message: "Order detail not found"
                });
            } else {
                res.status(200).json({
                    message: "Data deleted"
                });
            }
        }
    });
});

module.exports = app;
