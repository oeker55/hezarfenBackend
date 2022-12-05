const asyncHandler = require("express-async-handler");
const Author = require("../models/author.model");
const User = require("../models/user.model");

/////////////////////////getAuthors///////////////////////////////////////
// @desc    Gets all authors
// @route   GET /api/authors/
// @access  Private

module.exports.findAll = asyncHandler(async (req, res) => {
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    const allAuthors = await Author.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "CreatedUserId",
          foreignField: "_id",
          as: "createdUser",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "UpdatedUserId",
          foreignField: "_id",
          as: "updatedUser",
        },
      },
      { $unwind: "$createdUser" },
      { $unwind: "$updatedUser" },
      {
        $project: {
          _id: 1,
          Name: 1,
          Surname: 1,
          IsActive: 1,
          createdAt: 1,
          updatedAt: 1,
          CreatedUserId: 1,

          "createdUser.email": 1,
          "updatedUser.email": 1,
        },
      },
    ]);

    try {
      res.json(allAuthors);
    } catch (error) {
      res.json(error);
    }
  } else {
    res.status(500);
    throw new Error(
      "UnauthorizedUser"
    );
  }
});
/////////////////////////addAuthor///////////////////////////////////////
// @desc    Adds  Author
// @route   POST /api/authors/addAuthor
// @access  Private
module.exports.create = asyncHandler(async (req, res, next) => {
  const { Name, Surname, IsActive } = req.body;
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    if (!Name || !Surname) {
      res.status(500);
      throw new Error("PleaseAddAllFields");
    } else {
      const addedAuthor = new Author({
        Name,
        Surname,
        IsActive,
        CreatedUserId: adminId,
        UpdatedUserId: adminId,
      });
      await addedAuthor.save("authors");

      if (await addedAuthor) {
        res.status(201);
        res.json(addedAuthor);
      } else {
        res.status(502);
        throw new Error("InvalidAuthor");
      }
    }
  } else {
    res.status(500);
    throw new Error(
      "UnauthorizedUser"
    );
  }
});

/////////////////////////updateAuthor///////////////////////////////////////
// @desc    Updates Author
// @route   PUT /api/authors/updateAuthor/:authorId
// @access  Private
module.exports.update = asyncHandler(async (req, res, next) => {
  const adminId = req.user.id; // gets from middleware
  const { authorId } = req.params;
  const { Name, Surname, IsActive } = req.body;
  const willUpdateAuthor = {
    Name,
    Surname,
    IsActive,
    UpdatedUserId: adminId,
  };
  const adminInfo = await User.findById(adminId);
  if (adminInfo.isAdmin === true) {
    try {
      const updatedAuthor = await Author.findByIdAndUpdate(
        authorId,
        willUpdateAuthor,
        { new: true }
      );

      res.json(updatedAuthor);
    } catch (error) {
      res.json(error);
    }
  } else {
    res.status(500);
    throw new Error(
      "UnauthorizedUser"
    );
  }
});

/////////////////////////deleteAuthor///////////////////////////////////////
// @desc    Deletes Author
// @route   DELETE /api/authors/deleteAuthor/:authorId
// @access  Private
module.exports.delete = asyncHandler(async (req, res, next) => {
  const { authorId } = req.params;
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    try {
      const deletedAuthor = await Author.findByIdAndRemove(authorId);

      res.status(200);
      res.json(deletedAuthor);
    } catch (error) {
      res.json(error);
    }
  } else {
    res.status(501);
    next({
      message:
        "UnauthorizedUser",
    });
  }
});
