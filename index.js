const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const morgan = require("morgan");
const app = express();
const port = 8000;
const passport = require("passport");
const session = require("express-session");
const passportConfig = require("./passport");
const dotenv = require("dotenv");
dotenv.config();

app.use(bodyParser.urlencoded({ extended: true }));

const db = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER, 
  password: process.env.PASSWORD, 
  database: process.env.DATABASE,
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("Connected to database");
});
global.db = db;
passportConfig();
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(__dirname + "/public"));

app.set("views", __dirname + "/views");

app.set("view engine", "ejs");

app.engine("html", ejs.renderFile);
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
      httpOnly: true,
      secure: false,
    },
  })
);

const indexRouter = require("./routes/main");
const authRouter = require("./routes/auth");
app.use(passport.initialize());
app.use(passport.session());

app.use("/", indexRouter);
app.use("/", authRouter);

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.render("error");
});

app.listen(port, () =>
  console.log(`Server listening on http://localhost:${port}!`)
);
