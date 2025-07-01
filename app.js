const express = require("express")
const app = express()
const db = require("./config/db")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const islogged = require("./middleware/islogged")
const path = require('path')
const fs = require('fs') // ✅ added to check/create folder
const multer = require("multer")

// ✅ Ensure 'image' directory exists
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

const upload = multer({ storage: storage })

app.set("view engine", "ejs")
const cookieparser = require("cookie-parser")
app.use(cookieparser())
app.use(express.urlencoded({ extended: true }))

// ✅ Serve images statically
app.use('/image', express.static(path.join(__dirname, 'image')))

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

app.get("/addblog", islogged, (req, res) => {
  res.render("pages/addblog")
})

app.post("/addblog", islogged, (req, res) => {
  const userId = req.userId
  console.log(req.body)
  const { title, subtitle, description } = req.body
  db.blogs.create({
    title,
    subtitle,
    description,
    userId
  })
  res.redirect("/getblog")
})

app.get("/editblog", (req, res) => {
  res.render("pages/editblog")
})

app.get("/getblog", async (req, res) => {
  const userId = req.userId
  const blogs = await db.blogs.findAll()
  console.log(blogs)
  res.render("pages/getblog", { blogs })
})

app.get("/addblog", islogged, async (req, res) => {
  const userId = req.userId
  const datas = await db.blogs.findAll({
    where: {
      userId: userId
    }
  })
  res.render("pages/getblog", { blogs: datas })
})
app.post("/delete/:id", islogged, async (req, res) => {
  const id = req.params.id
  await db.blogs.destroy({
    where: {
      id: id
    }
  })
  res.redirect("/getblog")
})
//edit page
app.get("/edit/:id", islogged, async (req, res) => {
  const id = req.params.id;
  const blog = await db.blogs.findOne({ where: { id } });
  if (!blog) {
    return res.status(404).send("Blog not found");
  }
  res.render("pages/edit", { blog });
});

//edit page receive 
app.post("/edit/:id", islogged, async (req, res) => {
  const id = req.params.id;
  const { title, subtitle, description } = req.body;

  try {
    // Check if blog exists
    const blog = await db.blogs.findOne({ where: { id } });
    if (!blog) {
      return res.status(404).send("Blog not found");
    }

    // Update blog with new values
    await db.blogs.update(
      { title, subtitle, description },
      { where: { id } }
    );

    // Redirect to blog list or wherever appropriate
    res.redirect("/getblog");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});



app.get("/upload", (req, res) => {
  res.render("upload")
})

app.post("/upload", upload.single('image'), (req, res) => {
  res.send("Image uploaded")
})

app.listen(5555, () => {
  console.log("The port is connected to server")
})
