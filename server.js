const express = require("express");
const session = require("express-session");
const path = require("node:path")
const nocache = require("nocache")
const bcrypt = require('bcrypt')
const flash = require('express-flash');
const collection = require('./mongodb')
const app = express();
app.use(nocache())


const PORT = process.env.PORT || 8000;

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.set('view engine', 'ejs')

app.use('/views', express.static(path.join(__dirname, 'views')))

app.use(flash());
app.use(session({
    secret: "qazxswedcvfrTGBNHYUJM,KI",
    resave: false,
    saveUninitialized: true
}))

app.get("/", (req, res) => {
    if (req.session.isAuth) {
        res.render('dashboard', { user: req.session.user })
        return
     }
    res.render('base',{
        expressFlash: {
        invaliduser: req.flash('invaliduser'),
        invalidpassword: req.flash('invalidpassword')
    }
    })
})

app.get('/signup', (req, res) => {
    if(!req.session.user)
    {
    res.render('signUp', {
        expressFlash: {
            emailerror: req.flash('emailerror'),
            passworderror: req.flash('passworderror')
        }
    })
}else{
    res.redirect('/')
}
})

app.post('/signup', async (req, res) => {
    try{
    const user = await collection.findOne({ email: req.body.email })
    if (!user) {
        if (req.body.password !== req.body.confirmPassword) {
            req.flash('passworderror', "Passwords do not match. Please try again.")
            return res.redirect('/signup')
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const data = {
            name: req.body.username,
            password: hashedPassword,
            email: req.body.email
        }

        await collection.insertMany([data])
        res.redirect('/')
    } else {
        req.flash('emailerror', "User alredy exist")
        res.redirect('/signup')
    }
    
    }
    
    catch (error) {
        console.error("Error during signup:", error);
        req.flash('emailerror', "An error occurred during signup");
        res.redirect('/signup');
    }
})

app.post('/login', async (req, res) => {
    try {
        const user = await collection.findOne({ email: req.body.email });
        if (user && await bcrypt.compare(req.body.password, user.password)) {
            req.session.user = req.body.email;
            req.session.isAuth = true;
            res.redirect('/dashboard');
        } else {
            req.flash('invalidpassword', "Invalid Email or Password");
            res.redirect('/');
        }
    } catch {
        req.flash('invaliduser', "An unexpected error occurred");
        res.redirect('/');
    }
});

app.get('/dashboard', (req, res) => {
    if (req.session.user) {
        res.render('dashboard', { user: req.session.user })
    } else {
        res.redirect('/')
    }
})

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.send("Error")
        } else {

            res.redirect('/')
        }
    })
})


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})