const express=require("express")
const app=express()
const db=require("./config/db")
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const islogged=require("./middleware/islogged")
app.set("view engine","ejs")
const cookieparser=require("cookie-parser")
app.use(cookieparser())
app.use(express.urlencoded({extended:true}))

app.get("/",(req,res)=>{
    res.render("home")
})
app.get("/navbar",(req,res)=>{
    res.render("partials/navbar")
})
app.get("/register", (req, res) => {
  res.render("authentication/register")
})
app.get("/about", (req, res) => {
  res.render("about")
})
app.get("/contact", (req, res) => {
  res.render("contact")
})

app.post("/contact", (req, res) => {
  const { name, email, message } = req.body;
  // Process or save the contact message
  // For now, just send back a success message
  res.send("Thank you for contacting us!");
});

app.post("/register",(req,res)=>{
  // console.log(req.body)
  const{name,email,password}=req.body
  db.users.create({
    name,
    email,
    password:bcrypt.hashSync(password,10)
  })
  res.render("authentication/login")
  
})
app.get("/login",(req,res) => {
  res.render("authentication/login")
})
app.post("/login",async(req,res)=>{
  const{email,password}=req.body
  const users=await db.users.findAll({
    where:{
      email:email
    }
  })
  if(users.length==0){
    res.send("Not registered email")
  }
  else{
  const ispasswordmatch= bcrypt.compareSync(password,users[0].password)
  if(ispasswordmatch){
    const token=jwt.sign({id:users[0].id},"haha",{
      expiresIn:"10d"
    })
    res.cookie("token",token)
    res.send(token)
    // res.send("Logged in succesfully")
  }
  else{
    res.send("Invalid credentials")
  }
  }

})
app.get("/addblog",islogged,(req,res)=>{
  res.render("pages/addblog")
})
app.post("/addblog",islogged,(req,res)=>{
  console.log(req.body)
  const{title,subtitle,description}=req.body
  db.blogs.create({
    title,
    subtitle,
    description
  })
  res.redirect("/getblog")
})
app.get("/editblog",(req,res)=>{
  res.render("pages/editblog")
})
app.get("/getblog",async(req,res)=>{
  const userId=request.userId
const blogs=await db.blogs.findAll()
console.log(blogs)
    res.render("pages/getblog",{blogs})
})
app.get("/addblog",islogged,async(req,res)=>{
  const userId=req.userId
  const datas=await db.blogs.findAll({
    where:{
      userId:userId
    }
  })
  res.render("pages/getblog",{blogs:datas})
})


app.listen(5555,()=>{
    console.log("The port is connected to server")
})