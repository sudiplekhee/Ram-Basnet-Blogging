require("dotenv").config()
const{ Sequelize,DataTypes}=require("sequelize")
const sequelize=new Sequelize({
    database:process.env.db_name,
    username:process.env.db_username,
    password:process.env.db_password,
    port:process.env.db_port,
    host:process.env.db_host,
    dialect:"mysql"

})
const db={}
db.users=require("../models/user")(sequelize,DataTypes)
db.blogs=require("../models/blog")(sequelize,DataTypes)


sequelize.sync({alter:true})
.then(()=>{
    console.log("Table has created succesfully")
})
sequelize.authenticate()
.then(()=>{
    console.log("Connected Succesfully")
})
.catch((err)=>{
    console.log("Not connnected",err)
})
module.exports=sequelize
module.exports=db