var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
//routes
var indexRouter = require("./routes/index.routes");
var userRoutes = require("./routes/user.routes");
var authorRoutes = require("./routes/author.routes");
var publisherRoutes = require("./routes/publisher.routes");
var bookRoutes = require("./routes/book.routes");
var bookTypeRoutes = require("./routes/bookType.routes");
var eventRoutes = require("./routes/event.routes");
var personRoutes = require("./routes/person.routes");
var subjectRoutes = require("./routes/subject.routes");
var locationRoutes = require("./routes/location.routes");
var timeRoutes = require("./routes/time.routes");
var classificationRoutes = require("./routes/classification.routes");
var logoUploadRoutes = require("./routes/logoUpload.routes")
////swagger
var swaggerUi = require("swagger-ui-express");
swaggerDocument = require("./swagger.json");
////////
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./config/db");
const dotenv = require("dotenv");

/////

var app = express();
dotenv.config();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
///configurations by oeker55
db();
app.use(cors());
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
///

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
///routes
app.use("/uploads", logoUploadRoutes);
app.use("/", indexRouter);
app.use("/users", userRoutes);
app.use("/authors", authorRoutes);
app.use("/publishers", publisherRoutes);
app.use("/books", bookRoutes);
app.use("/bookTypes", bookTypeRoutes);
app.use("/events", eventRoutes);
app.use("/persons", personRoutes);
app.use("/subjects", subjectRoutes);
app.use("/locations", locationRoutes);
app.use("/times", timeRoutes);
app.use("/classifications", classificationRoutes);

///swagger integration
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
//app.use(function(err, req, res, next) {
// set locals, only providing error in development
// res.locals.message = err.message;
// res.locals.error = req.app.get('env') === 'development' ? err : {};

// // render the error page
// res.status(err.status || 500);
// res.json(err.message);

//});
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    status: err.status,
    message: err.message,
    //  stack:err.stack
  });
});
module.exports = app;
