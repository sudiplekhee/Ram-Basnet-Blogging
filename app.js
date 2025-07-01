const express = require("express")
const app = express()
const db = require("./config/db")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const islogged = require("./middleware/islogged")
const path = require('path')
const fs = require('fs')
const multer = require("multer")

// Ensure 'image' directory exists
const imageDir = path.join(__dirname, "image")
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir)
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'image')
  },
  filename: (req, file, cb) => {
    console.log(file)
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/
    const mimetype = filetypes.test(file.mimetype)
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
    
    if (mimetype && extname) {
      return cb(null, true)
    }
    cb(new Error('Only image files are allowed!'))
  }
})

app.set("view engine", "ejs")
const cookieparser = require("cookie-parser")
app.use(cookieparser())
app.use(express.urlencoded({ extended: true }))

// Serve images statically
app.use('/image', express.static(path.join(__dirname, 'image')))

// Routes
app.get("/", (req, res) => {
  res.render("home")
})

app.get("/navbar", (req, res) => {
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
  const { name, email, message } = req.body
  res.send("Thank you for contacting us!")
})

app.post("/register", (req, res) => {
  const { name, email, password } = req.body
  db.users.create({
    name,
    email,
    password: bcrypt.hashSync(password, 10)
  })
  res.render("authentication/login")
})

app.get("/login", (req, res) => {
  res.render("authentication/login")
})

app.post("/login", async (req, res) => {
  const { email, password } = req.body
  const users = await db.users.findAll({
    where: {
      email: email
    }
  })
  if (users.length == 0) {
    res.send("Not registered email")
  } else {
    const ispasswordmatch = bcrypt.compareSync(password, users[0].password)
    if (ispasswordmatch) {
      const token = jwt.sign({ id: users[0].id }, "haha", {
        expiresIn: "10d"
      })
      res.cookie("token", token)
      res.redirect("/addblog")
    } else {
      res.send("Invalid credentials")
    }
  }
})

// Blog Routes with Image Handling
app.get("/addblog", islogged, (req, res) => {
  res.render("pages/addblog")
})

app.post("/addblog", islogged, upload.single('image'), async (req, res) => {
  try {
    const userId = req.userId
    const { title, subtitle, description } = req.body
    
    // Get the image path if uploaded
    const image = req.file ? req.file.filename : null

    await db.blogs.create({
      title,
      subtitle,
      description,
      image,
      userId
    })
    
    res.redirect("/getblog")
  } catch (error) {
    console.error(error)
    res.status(500).send("Error creating blog post")
  }
})

app.get("/getblog", async (req, res) => {
  try {
    const blogs = await db.blogs.findAll({
      order: [['createdAt', 'DESC']] // Newest first
    })
    res.render("pages/getblog", { blogs })
  } catch (error) {
    console.error(error)
    res.status(500).send("Error fetching blogs")
  }
})

app.get("/edit/:id", islogged, async (req, res) => {
  try {
    const id = req.params.id
    const blog = await db.blogs.findOne({ where: { id } })
    if (!blog) {
      return res.status(404).send("Blog not found")
    }
    res.render("pages/editblog", { blog })
  } catch (error) {
    console.error(error)
    res.status(500).send("Internal Server Error")
  }
})

app.post("/edit/:id", islogged, upload.single('image'), async (req, res) => {
  try {
    const id = req.params.id
    const { title, subtitle, description } = req.body

    const blog = await db.blogs.findOne({ where: { id } })
    if (!blog) return res.status(404).send("Blog not found")

    // Prepare update data
    const updateData = { title, subtitle, description }
    
    // If new image uploaded
    if (req.file) {
      // Delete old image if exists
      if (blog.image) {
        const oldImagePath = path.join(__dirname, 'image', blog.image)
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath)
        }
      }
      updateData.image = req.file.filename
    }

    await db.blogs.update(updateData, { where: { id } })
    res.redirect("/getblog")
  } catch (error) {
    console.error(error)
    res.status(500).send("Internal Server Error")
  }
})

app.post("/delete/:id", islogged, async (req, res) => {
  try {
    const id = req.params.id;
    
    // 1. Find the blog first
    const blog = await db.blogs.findOne({ where: { id } });
    
    if (!blog) {
      return res.status(404).render('error', { message: "Blog not found" });
    }

    // 2. Handle image deletion if exists
    if (blog.image) {
      try {
        const imagePath = path.join(__dirname, 'image', blog.image);
        
        // Check if file exists before trying to delete
        if (fs.existsSync(imagePath)) {
          fs.unlink(imagePath, (err) => {
            if (err) {
              console.error("Error deleting image file:", err);
              // Don't fail the entire operation if image deletion fails
            }
          });
        } else {
          console.warn(`Image file not found at: ${imagePath}`);
        }
      } catch (fileError) {
        console.error("Error handling image deletion:", fileError);
        // Continue with blog deletion even if image deletion fails
      }
    }

    // 3. Delete the blog record
    const result = await db.blogs.destroy({ 
      where: { id },
      returning: true
    });

    if (result === 0) {
      return res.status(404).render('error', { message: "Blog not found or already deleted" });
    }
    
    res.redirect("/getblog");
  } catch (error) {
    console.error("Error deleting blog:", error);
    
    // More specific error handling
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).render('error', { 
        message: "Cannot delete blog due to existing references" 
      });
    }
    
    res.status(500).render('error', { 
      message: "Error deleting blog",
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

app.listen(5555, () => {
  console.log("Server running on port 5555")
})