const jwt= require("jsonwebtoken")
const islogged=(req,res,next)=>{
    const token=req.cookies.token
    if(!token){
res.redirect("/login")
    }
    else{
        jwt.verify(token,"haha",(error,result)=>{
            if(error){
             res.redirect("/login")
            }
            else{
                req.userId=result.id
                next()
                // res.send("valid token,verified")
            }
        })
    }
    // console.log("Trigger out the function")
}
module.exports=islogged