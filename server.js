const express = require("express");
const session = require("express-session");
const path = require("node:path")
const nocache = require("nocache")
const bcrypt = require('bcrypt')
const flash = require('express-flash');
const userRouter = require('./route/userRouter')
const adminRouter= require('./route/adminRouter')
const collection = require('./mongodb');

const app = express();
app.use(nocache())


const PORT = process.env.PORT || 8000;

app.use('/static', express.static(path.join(__dirname, 'views','static')))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.set('view engine', 'ejs')


app.use(flash());
app.use(session({
    secret: "qazxswedcvfrTGBNHYUJM,KI",
    resave: false,
    saveUninitialized: true
}))

app.use('/',userRouter)
app.use('/admin',adminRouter)

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})