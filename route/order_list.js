const express = require('express');
const cors = require('cors');
const moment = require('moment');
const db = require('../koneksi');
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// CREATE
app.post("/", (req, res) => {
    let currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
    let sql = "INSERT INTO order_list SET ?";
    let data = {
        customer_name: req.body.customer_name,
        order_type: req.body.order_type,
        order_date: currentDate,
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

// READ all order lists
app.get("/", (req, res) => {
    let sql = "SELECT * FROM order_list";
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

// READ one order list
app.get("/:id", (req, res) => {
    let sql = "SELECT * FROM order_list WHERE id = ?";
    db.query(sql, [req.params.id], (error, result) => {
        if(error){
            res.status(500).json({
                message: error.message
            });
        } else {
            if(result.length === 0){
                res.status(404).json({
                    message: "Order list not found"
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
    let sql = "UPDATE order_list SET customer_name=?, order_type=?, updatedAt=? WHERE id=?";
    let data = [
        req.body.customer_name,
        req.body.order_type,
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
                    message: "Order list not found"
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
    let sql = "DELETE FROM order_list WHERE id=?";
    db.query(sql, [req.params.id], (error, result) => {
        if(error){
            res.status(500).json({
                message: error.message
            });
        } else {
            if(result.affectedRows === 0){
                res.status(404).json({
                    message: "Order list not found"
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
