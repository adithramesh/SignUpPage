const express = require('express');
const userrouter = express.Router();
const bcrypt = require('bcrypt');
const collection = require('../mongodb');
const session = require('express-session');

userrouter.get("/", (req, res) => {
    if (req.session.isAuth) {
        res.render('templates/main', { user: req.session.user })
        return
    }
    else{
        res.render('templates/login', {
            expressFlash: {
                invaliduser: req.flash('invaliduser'),
                invalidpassword: req.flash('invalidpassword'),
                userSuccess: req.flash('userSuccess')
            }
        })

    }
})

userrouter.get('/signup', (req, res) => {
    if(!req.session.isAuth)
    {
    res.render('templates/signUp', {
        expressFlash: {
            emailerror: req.flash('emailerror'),
            passworderror: req.flash('passworderror')
        }
    })
}else{
    res.redirect('/')
}
})


userrouter.post('/signup', async (req, res) => {
    try {
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
            req.flash('userSuccess', "User Added Successfully")
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

userrouter.post('/login', async (req, res) => {
    try {
        const user = await collection.findOne({ email: req.body.email });

        req.session.id=user._id
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
let check=(req,res,next)=>{
    if(req.session.isAuth){
        next()
    }else{
        res.redirect("/")
    }
}


userrouter.get('/dashboard', check,async(req, res) => {
    
        res.render('templates/main', { user: req.session.user })
    
})


userrouter.get('/logout', (req, res) => {
    req.session.isAuth=false
    res.redirect('/')
})


module.exports = userrouter;