const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const connectDB = require('./config/db')
const router = require('./routes')
const Path = require("path")

const app = express();

app.use(cors({
    origin: process.env.FROENTEND_URL,
    credentials: true
}));
app.use(express.json());

app.use(express.json())
app.use(cookieParser())
// app.use(express.static("./public"))
// app.use("/public", express.static("./public"))
// app.use(express.static(Path.join(__dirname, 'build')))

app.use("/api", router)
//app.use("*", express.static(Path.join(__dirname, 'build')))

const PORT = 5000 || process.env.PORT
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log('connected to db')
        console.log('server is running successfully');
    })
})





