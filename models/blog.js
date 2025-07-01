const makeblogTable = (sequelize, DataTypes) => {
    const blog = sequelize.define("blog", {
        title: {
            type: DataTypes.STRING
        },
        subtitle: {
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.STRING
        },
        image: {
            type: DataTypes.BLOB('long'), // For storing binary image data
            allowNull: true
        },
        imageType: {
            type: DataTypes.STRING, // To store MIME type like 'image/jpeg'
            allowNull: true
        }
    })
    return blog
}
module.exports = makeblogTable