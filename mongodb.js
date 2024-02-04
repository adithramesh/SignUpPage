const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/signUp')
    .then(() => {
        console.log('mongodb connected')
    }).catch(() => {
        console.log('fail to connect')
    })

const signUpSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    isAdmin:{
        type:Boolean,
        required:true,
        default:false
    }
});

const collection = new mongoose.model('userInfo', signUpSchema)

module.exports = collection