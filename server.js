const express=require("express");
const session=require("express-session");
const path=require("node:path")
const nocache=require("nocache")

const app=express();

app.use(nocache())

const PORT = process.env.PORT || 8000;
const detail={
    name:"amrazhameed@gmail.com",
    password:"224816"
}

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.set('view engine','ejs')

app.use('/views',express.static(path.join(__dirname,'views')))

app.use(session({
    secret:"qazxswedcvfrTGBNHYUJM,KI",
    resave:false,
    saveUninitialized:true
}))


app.get("/",(req,res)=>{
    if(req.session.isAuth){
        res.redirect('/dashboard')
        return
    }
    res.render('base',{title:"Login System"})
})

app.post('/login',(req,res)=>{
    if(req.body.email==detail.name&&req.body.password==detail.password){
        req.session.user=req.body.email;
        req.session.isAuth=true
        res.redirect("/dashboard")
    }else{
        
        res.status(404).send('<h1>404 Error</h1>');
    }
});

app.get('/dashboard',(req,res)=>{
    if(req.session.user){
        res.render('dashboard',{user:req.session.user})
    }else{
        res.redirect('/')
    }
})

app.get('/logout',(req,res)=>{
    req.session.destroy((err)=>{
        if(err){
            res.send("Error")
        }else{
            
            res.redirect('/')
        }
    })
})


app.listen(PORT,()=>{
    console.log(`Server running on http://localhost:${PORT}`)
})
