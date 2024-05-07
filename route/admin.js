const express = require('express');
const cors = require('cors');
const moment = require('moment');
const db = require('../koneksi');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ status: false, message: "Authorization token is required" });

    jwt.verify(token, 'your_secret_key', (err, user) => {
        if (err) return res.status(403).json({ status: false, message: "Invalid token" });
        req.user = user;
        next();
    });
}


app.post("/auth", (req, res) => {
    const { email, password } = req.body;

    db.query("SELECT * FROM admin WHERE email = ? AND password = ?", [email, password], (error, result) => {
        if (error) {
            res.status(500).json({ status: false, message: error.message });
        } else {
            if (result.length > 0) {
                const token = jwt.sign({ id: result[0].id, name: result[0].name, email: result[0].email }, 'your_secret_key');
                res.status(200).json({ status: true, logged: true, message: "Login Success", token });
            } else {
                res.status(401).json({ status: false, message: "Invalid email or password" });
            }
        }
    });
});



// CREATE
app.post("/", (req,res) => {
    let currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
    let sql = "INSERT INTO admin SET ?";
    let data = {
        name: req.body.nama,
        email: req.body.email,
        password: req.body.password,
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

// READ all admins
app.get("/", authenticateToken, (req,res) => {
    let sql = "SELECT * FROM admin";
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

// READ one admin
app.get("/:id", (req,res) => {
    let sql = "SELECT * FROM admin WHERE id = ?";
    db.query(sql, [req.params.id], (error, result) => {
        if(error){
            res.status(500).json({
                message: error.message
            });
        } else {
            if(result.length === 0){
                res.status(404).json({
                    message: "Admin not found"
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
app.put("/:id", (req,res) => {
    let currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
    let sql = "UPDATE admin SET name=?, email=?, password=?, updatedAt=? WHERE id=?";
    let data = [
        req.body.nama,
        req.body.email,
        req.body.password,
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
                    message: "Admin not found"
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
app.delete("/:id", (req,res) => {
    let sql = "DELETE FROM admin WHERE id=?";
    db.query(sql, [req.params.id], (error, result) => {
        if(error){
            res.status(500).json({
                message: error.message
            });
        } else {
            if(result.affectedRows === 0){
                res.status(404).json({
                    message: "Admin not found"
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
