const makeuserTable=(sequelize,DataTypes)=>{
    const user=sequelize.define("user",{
        name:{
            type:DataTypes.STRING
        },
          email:{
            type:DataTypes.STRING
        },
           password:{
            type:DataTypes.STRING
        },
    })
    return user
}
module.exports=makeuserTable