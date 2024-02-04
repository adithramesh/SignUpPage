const express = require("express");
const collection = require('../mongodb');
const bcrypt = require("bcrypt");
const adminrouter = express.Router();

adminrouter.get("/", (req, res) => {
    if (req.session.isAdAuth) {
        res.redirect('/admin/main')
    } else {
        res.render('templates/adminlogin', {
            expressFlash: {
                invaliduser: req.flash('invaliduser'),
                invalidpassword: req.flash('invalidpassword')
            }
        })
    }
})

adminrouter.post('/adminlogin', async (req, res) => {
    try {
        const user = await collection.findOne({ email: req.body.email, isAdmin: true });
        if (user && await bcrypt.compare(req.body.password, user.password)) {
            req.session.admin = req.body.email;
            req.session.isAdAuth = true;
            res.redirect('/admin/main');
        } else {
            req.flash('invalidpassword', "You are not an Admin");
            res.redirect('/admin');
        }
    } catch {
        req.flash('invaliduser', "An unexpected error occurred");
        res.redirect('/admin');
    }
});

adminrouter.get('/main', async (req, res) => {
    const userSuccess = req.flash('userSuccess') || [];
    const userDeleted = req.flash('userDeleted') || [];

    try {
        if (req.session.admin) {
            const users = await collection.find().exec();
            res.render('templates/adminMain', { userSuccess, userDeleted, users });
        } else {
            res.redirect('/admin');
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        res.redirect('/admin');
    }
});

adminrouter.post('/main', async (req, res) => {
    if (req.session.isAdAuth) {
        const name = req.body.search;
        const data = await collection.find({ name: { $regex: new RegExp(name, "i") } });
        if (data.length === 0) {
            req.flash('userDeleted', 'No users found with the specified criteria');
        } else {
            req.flash('userSuccess', 'Search results retrieved successfully');
        }
        res.render('templates/adminMain', {
            users: data,
            userSuccess: req.flash('userSuccess'),
            userDeleted: req.flash('userDeleted')
        });
    } else {
        res.redirect('/admin');
    }
});

adminrouter.get('/addUser', (req, res) => {
    if (req.session.isAdAuth) {
        res.render('templates/adminAddUser', {
            expressFlash: {
                emailerror: req.flash('emailerror'),
                passworderror: req.flash('passworderror')
            }
        })
    } else {
        res.redirect('/admin')
    }
})

adminrouter.post('/addUserSubmit', async (req, res) => {
    try {

        const user = await collection.findOne({ email: req.body.email })
        if (!user) {
            if (req.body.password !== req.body.confirmPassword) {
                console.log("kayari");
                req.flash('passworderror', "Passwords do not match. Please try again.")
                return res.redirect('/admin/addUser')
            }

            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            const data = {
                name: req.body.username,
                password: hashedPassword,
                email: req.body.email
            }

            await collection.insertMany([data])
            req.flash('userSuccess', "User Added Successfully")
            res.redirect('/admin/main')
        } else {
            req.flash('emailerror', "User alredy exist")
            res.redirect('/admin/addUser')
        }

    }

    catch (error) {
        console.error("Error during signup:", error);
        req.flash('emailerror', "An error occurred during signup");
        res.redirect('/admin/addUser');
    }
})

adminrouter.get('/logoutAdmin', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.send("Error")
        } else {

            res.redirect('/admin')
        }
    })
})

adminrouter.get('/update/:id', async (req, res) => {
    if (req.session.isAdAuth) {
        try {
            let id = req.params.id;
            const user = await collection.findOne({ _id: id });

            if (user) {
                res.render('templates/updateUser', {
                    user,
                    expressFlash: {
                        emailerror: req.flash('emailerror'),
                        passworderror: req.flash('passworderror')
                    }
                });
            } else {
                res.redirect('/admin/main');
            }
        } catch (error) {
            console.error("Error while fetching user data:", error);
            res.redirect('/admin/main');
        }
    } else {
        res.redirect('/admin')
    }
});

adminrouter.post('/update/:id', async (req, res) => {
    if (req.session.isAdAuth) {
        try {
            let id = req.params.id;
            const updatedUser = await collection.findOneAndUpdate(
                { _id: id },
                {
                    $set: {
                        name: req.body.name,
                        email: req.body.email,
                        isAdmin: req.body.isAdmin === 'true',
                    },
                },
                { new: true }
            );

            if (updatedUser) {
                req.flash('userSuccess', 'User updated successfully');
                res.redirect('/admin/main');
            } else {
                res.redirect('/admin/main');
            }
        } catch (error) {
            console.error("Error during user update:", error);
            res.redirect('/admin/main');
        }
    } else {
        res.redirect('/admin')
    }
});

adminrouter.get('/delete/:id', async (req, res) => {
    if (req.session.isAdAuth) {
        try {
            let id = req.params.id;
            const deletedUser = await collection.findOneAndDelete({ _id: id });
            if (deletedUser) {
                req.flash('userDeleted', 'User deleted successfully');
            }
            res.redirect('/admin/main');
        } catch (error) {
            console.error("Error during user deletion:", error);
            res.redirect('/admin/main');
        }
    } else {
        res.redirect('/admin')
    }
});

module.exports = adminrouter;