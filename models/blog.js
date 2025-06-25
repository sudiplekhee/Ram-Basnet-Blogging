const makeblogTable=(sequelize,DataTypes)=>{
    const blog=sequelize.define("blog",{
        title:{
            type:DataTypes.STRING
        },
          subtitle:{
            type:DataTypes.STRING
        },
          description:{
            type:DataTypes.STRING
        }
    })
    return blog
}
module.exports=makeblogTable