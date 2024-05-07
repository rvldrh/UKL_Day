    const express = require('express');
    const cors = require('cors');
    const moment = require('moment');
    const db = require('../koneksi');
    const jwt = require('jsonwebtoken');
const multer = require('multer')
const path = require('path')

    const app = express();

    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({extended: true}));


    
        const storage = multer.diskStorage({
            destination: function (req, file, cb) {
            cb(null, 'uploads/', req.body.image, '.jpg') // Direktori penyimpanan file, pastikan folder uploads tersedia
            },
            filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname) // Nama file yang diunggah
            }
        });
        
        const upload = multer({ storage: storage });
    
      



    function authenticateToken(req, res, next) {
        const token = req.headers['authorization'];
        if (!token) return res.status(401).json({ status: false, message: "Authorization token is required" });

        jwt.verify(token, 'your_secret_key', (err, user) => {
            if (err) return res.status(403).json({ status: false, message: "Invalid token" });
            req.user = user;
            next();
        });
    }

    app.get("/:search", (req, res) => {
        const search = req.params.search;
        db.query("SELECT * FROM coffee WHERE name LIKE ?", [`%${search}%`], (error, result) => {
            if (error) {
                res.status(500).json({ status: false, message: error.message });
            } else {
                res.status(200).json({ status: true, data: result, message: "Coffee has retrieved" });
            }
        });
    });
    
    

    app.get('/order/:id', authenticateToken ,async (req, res) => {
        try {
            const userId = req.params.id;
    
            // Query untuk mendapatkan data pemesanan
            const orders = await new Promise((resolve, reject) => {
                db.query('SELECT * FROM order_list WHERE id = ?', userId, (err, orders) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(orders);
                    }
                });
            }); 
    
            if (orders.length === 0) {
                return res.status(404).json({ status: false, message: 'No orders found' });
            }
    
            const ordersResult = [];
    
            // Mendapatkan detail setiap pemesanan
            for (const order of orders) {
                const orderDetails = await new Promise((resolve, reject) => {
                    db.query('SELECT * FROM order_detail WHERE order_id = ?', order.id, (err, orderDetails) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(orderDetails);
                        }
                    });
                });
    
                // Menyusun data pemesanan dengan detail
                const orderData = {
                    id: order.id,
                    customer_name: order.customer_name,
                    order_type: order.order_type,
                    order_date: order.order_date,
                    createdAt: order.createdAt,
                    updatedAt: order.updatedAt,
                    order_detail: orderDetails
                };
    
                ordersResult.push(orderData);
            }
    
            return res.status(200).json({ status: true, data: ordersResult, message: 'Order list has been retrieved' });
        } catch (err) {
            return res.status(500).json({ status: false, message: err.message });
        }
    });
    


    app.post("/order", authenticateToken , (req, res) => {
        const { customer_name, order_type, order_date} = req.body;
        const order_detail = JSON.parse(req.body.order_detail);
        let currentDate = moment().format('YYYY-MM-DD HH:mm:ss');
        console.log(req.body);
         
        db.beginTransaction((err) => {
            if (err) {
                return res.status(500).json({ status: false, message: err.message });
            } 
    
            db.query("INSERT INTO order_list (customer_name, order_type, order_date, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)", [customer_name, order_type, currentDate, currentDate, currentDate], (error, result) => {
                if (error) {
                    db.rollback(() => {
                        res.status(500).json({ status: false, message: error.message });
                    });
                } else {
                    const orderId = result.insertId;
                    
                    if (order_detail.length === 0) {
                        return res.status(400).json({ status: false, message: "Order detail must be a non-empty array" });
                    }
    
                    let insertedCount = 0;
    
                    // Iterasi setiap item pesanan untuk memasukkannya ke dalam database
                    order_detail.forEach(item => {
                        const { coffee_id, price, quantity } = item;
                        const total = price * quantity; // Hitung total harga
                        const status = 'unpaid'; 
                    
                        // Ambil harga kopi dari tabel coffee
                        db.query("SELECT price FROM coffee WHERE id = ?", [coffee_id], (error, coffeeResult) => {
                            if (error) {
                                db.rollback(() => {
                                    res.status(500).json({ status: false, message: error.message });
                                });
                            } else {
                                // Periksa apakah harga yang diberikan sesuai dengan harga kopi yang sebenarnya
                                if (coffeeResult.length === 0 || coffeeResult[0].price !== price) {
                                    db.rollback(() => {
                                        res.status(400).json({ status: false, message: `Invalid price for coffee with ID ${coffee_id}` });
                                    });
                                } else {
                                    // Jika harga sesuai, lanjutkan dengan memasukkan detail pesanan ke dalam database
                                    db.query("INSERT INTO order_detail (order_id, coffee_id, price, quantity, total, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                                        [orderId, coffee_id, price, quantity, total, status, currentDate, currentDate], (err, result) => {
                                            if (err) {
                                                db.rollback(() => {
                                                    res.status(500).json({ status: false, message: err.message });
                                                });
                                            } else {
                                                insertedCount++;
                                                if (insertedCount === order_detail.length) {
                                                    db.commit((err) => {
                                                        if (err) {
                                                            db.rollback(() => {
                                                                res.status(500).json({ status: false, message: err.message });
                                                            });
                                                        } else {
                                                            res.status(201).json({ status: true, data: { id: orderId, customer_name, order_type, order_date, createdAt: currentDate, updatedAt: currentDate }, message: "Order list has created" });
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                }
                            }
                        });
                    });
                    
                }
            });
        });
    });
    
    app.put("/status/:orderId", authenticateToken, (req, res) => {
        const orderId = req.params.orderId;
        const { status } = req.body;
    
        // Periksa apakah status yang diberikan valid
        if (status !== 'paid' && status !== 'unpaid') {
            return res.status(400).json({ status: false, message: "Invalid status. Status must be 'paid' or 'unpaid'" });
        }
    
        db.query("UPDATE order_detail SET status = ? WHERE order_id = ?", [status, orderId], (error, result) => {
            if (error) {
                res.status(500).json({ status: false, message: error.message });
            } else {
                if (result.affectedRows === 0) {
                    res.status(404).json({ status: false, message: "Order not found" });
                } else {
                    res.status(200).json({ status: true, message: `Status of order ${orderId} has been updated to ${status}` });
                }
            }
        });
    });
    

    // CREATE
    app.post("/", authenticateToken, upload.single('image'), (req, res) => {
        const { name, size, price } = req.body;
        const image = req.file.filename; // Nama file gambar yang diunggah
        const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format tanggal dan waktu seperti yang diminta (YYYY-MM-DD HH:mm:ss)
        
        db.query("INSERT INTO coffee (name, size, price, image, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)", [name, size, price, image, currentDate, currentDate], (error, result) => {
            if (error) {
                res.status(500).json({ status: false, message: error.message });
            } else {
                res.status(201).json({ status: true, data: { id: result.insertId, name, size, price, image, createdAt: currentDate, updatedAt: currentDate }, message: "Coffee has created" });
            }
        });
    });
    
    // READ all coffees 
        app.get("/", (req,res) => { 
            let sql = "SELECT * FROM coffee";
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

    // READ one coffee
    app.get("/:id", (req,res) => {
        let sql = "SELECT * FROM coffee WHERE id = ?";
        db.query(sql, [req.params.id], (error, result) => {
            if(error){
                res.status(500).json({
                    message: error.message
                });
            } else {
                if(result.length === 0){
                    res.status(404).json({
                        message: "Coffee not found"
                    });
                } else {
                    res.status(200).json({
                        data: result[0]
                    });
                }
            }
        });
    });

    // // UPDATE
    app.put("/:id", authenticateToken, upload.single('image'), (req, res) => {
        const { name, size, price} = req.body;
        const image = req.file.filename;
        const updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');

        db.query("UPDATE coffee SET name=?, size=?, price=?, image=?, updatedAt=? WHERE id=?", [name, size, price, image, updatedAt, req.params.id], (error, result) => {
            if (error) {
                res.status(500).json({ status: false, message: error.message });
            } else {
                const updatedCoffee = { id: req.params.id, name, size, price, image, updatedAt };
                res.status(200).json({ status: true, data: updatedCoffee, message: "Coffee has updated" });
            }
        });
    });
 

    // // DELETE 
    app.delete("/:id", authenticateToken, (req, res) => {
        db.query("DELETE FROM coffee WHERE id=?", [req.params.id], (error, result) => {
            if (error) {
                res.status(500).json({ status: false, message: error.message });
            } else {
                res.status(200).json({ status: true, data: { id: req.params.id }, message: "Coffee has deleted" });
            }
        });
    });


    module.exports = app;
