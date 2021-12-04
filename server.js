var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var ObjectId = require("mongodb").ObjectId;

var formidable = require("formidable");
var fs = require("fs");
var session = require("express-session");
var server = app.listen(3000, function () {
	console.log("connected");
});
var http = require("http").createServer(app);
var io = require("socket.io")(server);
app.use(
	session({
		key: "admin",
		secret: "any random string",
		resave: true,
		saveUninitialized: true,
	})
);
app.use("/assets", express.static(__dirname + "/assets"));
app.set("view engine", "ejs");

app.use(express.json());
app.use(
	express.urlencoded({
		extended: true,
	})
);

// var MongoClient = require("mongodb").MongoClient;

const mongoose = require("mongoose");

const url = `mongodb+srv://bram:4everswastika@cluster0.nbwuj.mongodb.net/blog?retryWrites=true&w=majority`;

const connectionParams = {
	useNewUrlParser: true,
	//   useCreateIndex: true,
	useUnifiedTopology: true,
};
mongoose
	.connect(url, connectionParams)
	.then(function (error, client) {
		var Schema_post = new mongoose.Schema(
			{
				title: "string",
				content: "string",
				username: "string",
				email: "string",
				comments: "array",
				replies: "array",
				reply: "string",
				name: "string",
				comment: "string",
				image: "string",
				size: "string",
			},
			{ versionKey: false }
		);

		var Schema_admin = new mongoose.Schema(
			{
				email: "string",
				password: "string",
			},
			{ versionKey: false }
		);
		var Post = mongoose.model("Posts", Schema_post);
		var Admin = mongoose.model("Admins", Schema_admin);
		console.log("db connected");

		app.post("/do-delete", function (req, res) {
			fs.unlink(req.body.image.replace("/", ""), function (error) {
				Post.remove(
					{
						_id: ObjectId(req.body._id),
					},
					function (error, document) {
						res.send("deleted");
					}
				);
			});
			// if (req.session.admin) {
			// 	res.render("admin/dashboard");
			// } else {
			// 	res.redirect("/admin");
			// }
		});

		app.get("/", function (req, res) {
			Post.find({}).exec(function (error, posts) {
				posts = posts.reverse();
				res.render("user/home", { posts: posts });
			});
		});

		app.get("/admin/dashboard", function (req, res) {
			if (req.session.admin) {
				res.render("admin/dashboard");
			} else {
				res.redirect("/admin");
			}
		});

		app.get("/admin/posts", function (req, res) {
			if (req.session.admin) {
				Post.find({}).exec(function (error, posts) {
					res.render("admin/posts", { posts: posts });
				});
			} else {
				res.redirect("/admin");
			}
		});

		app.get("/admin", function (req, res) {
			res.render("admin/login");
		});

		app.get("/do-logout", function (req, res) {
			req.session.destroy();
			res.redirect("/admin");
		});

		app.post("/do-admin-login", function (req, res) {
			Admin.findOne({
				email: req.body.email,
				password: req.body.password,
			}).exec(function (error, admin) {
				if (admin != "") {
					req.session.admin = admin;
				}
				res.send(admin);
			});
		});

		app.post("/do-post", function (req, res) {
			Post.create(
				[
					{
						title: req.body.title,
						content: req.body.content,
						image: req.body.image,
					},
				],
				function (err, doc) {
					res.send({
						text: "posted success",
						_id: doc.insertedId,
					});
				}
			);
		});

		app.post("/do-upload-image", function (req, res) {
			var formData = new formidable.IncomingForm();
			formData.parse(req, function (error, fields, files) {
				var oldPath = files.file.filepath;
				var newPath = "assets/images/" + files.file.originalFilename;
				fs.rename(oldPath, newPath, function (err) {
					res.send("/" + newPath);
				});
			});
		});

		app.post("/do-update-image", function (req, res) {
			var formData = new formidable.IncomingForm();
			formData.parse(req, function (error, fields, files) {
				fs.unlink(fields.image.replace("/", ""), function (error) {
					var oldPath = files.file.filepath;
					var newPath =
						"assets/images/" + files.file.originalFilename;
					fs.rename(oldPath, newPath, function (err) {
						res.send("/" + newPath);
					});
				});
			});
		});

		app.post("/do-comment", function (req, res) {
			var comment_id = ObjectId();
			Post.findOneAndUpdate(
				{ _id: ObjectId(req.body.post_id) },
				{
					$push: {
						comments: {
							_id: comment_id,
							username: req.body.username,
							comment: req.body.comment,
							email: req.body.email,
						},
					},
				},
				function (error, success) {
					if (error) {
						res.send(error);
					} else {
						res.send({
							text: "Comment success",
							_id: success.insertedId,
						});
					}
				}
			);
		});

		app.post("/do-reply", function (req, res) {
			var reply_id = ObjectId();
			Post.updateOne(
				{
					_id: ObjectId(req.body.post_id),
					"comments._id": req.body.comment_id,
				},
				{
					$push: {
						"comments.$.replies": {
							_id: reply_id,
							name: req.body.name,
							reply: req.body.reply,
						},
					},
				},
				function (error, success) {
					res.send("Text replied");
				}
			);
		});

		app.get("/posts/:id", function (req, res) {
			Post.findOne({ _id: ObjectId(req.params.id) }).exec(function (
				error,
				post
			) {
				res.render("user/post", { post: post });
			});
		});

		app.get("/posts/edit/:id", function (req, res) {
			if (req.session.admin) {
				Post.findOne({ _id: ObjectId(req.params.id) }).exec(function (
					error,
					post
				) {
					res.render("admin/edit_post", { post: post });
				});
			} else {
				res.redirect("/admin");
			}
		});

		app.post("/do-edit-post", function (req, res) {
			Post.findOneAndUpdate(
				{ _id: ObjectId(req.body._id) },
				{
					$set: {
						title: req.body.title,
						content: req.body.content,
						image: req.body.image,
					},
				},
				function (error, success) {
					if (error) {
						res.send(error);
					} else {
						res.send("Update success");
					}
				}
			);
			// console.log(req.body);
		});

		io.on("connection", function (socket) {
			console.log("user connected");
			socket.on("new_post", function (formData) {
				console.log(formData);
				socket.broadcast.emit("new_post", formData);
			});

			socket.on("new_comment", function (comment) {
				io.emit("new_comment", comment);
			});
		});
	})
	.catch((err) => {
		console.error(`Error connecting to the database. \n${err}`);
	});
