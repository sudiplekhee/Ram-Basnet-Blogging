const express=require("express")
const app=express()
const db=require("./config/db")
const bcrypt=require("bcrypt")
app.set("view engine","ejs")
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
app.get("/login", (req, res) => {
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
    res.send("Logged in succesfully")
  }
  else{
    res.send("Invalid credentials")
  }
  }

})
app.get("/addblog",(req,res)=>{
  res.render("pages/addblog")
})
app.post("/addblog",(req,res)=>{
  console.log(req.body)
  const{title,subtitle,description}=req.body
  db.blogs.create({
    title,
    subtitle,
    description
  })
  res.send("Inserted succesfully")
})
app.get("/editblog",(req,res)=>{
  res.render("pages/editblog")
})
app.get("/getblog",(req,res)=>{
  res.render("pages/getblog")
})


app.listen(5555,()=>{
    console.log("The port is connected to server")
})