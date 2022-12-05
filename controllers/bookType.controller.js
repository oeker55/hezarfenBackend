const asyncHandler = require("express-async-handler");
const BookType = require("../models/bookType.model");
const User = require("../models/user.model");
const Book = require("../models/book.model");

/////////////////////////getBookTypes///////////////////////////////////////
// @desc    Gets all bookTypes
// @route   GET /api/bookTypes/
// @access  Private

module.exports.findAll = asyncHandler(async (req, res) => {
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    const allBookTypes = await BookType.aggregate([
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
      res.json(allBookTypes);
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
/////////////////////////addBookType///////////////////////////////////////
// @desc    Adds  BookType
// @route   POST /api/bookTypes/addBookType
// @access  Private
module.exports.create = asyncHandler(async (req, res, next) => {
  const { Name, IsActive } = req.body;
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    if (!Name) {
      res.status(500);
      throw new Error("PleaseAddAllFields");
    } else {
      const existingBookType = await BookType.findOne({ Name });
      if (existingBookType) {
        throw new Error("BookTypeAllreadyExist");
      } else {
        const addedBookType = new BookType({
          Name,
          IsActive,
          CreatedUserId: adminId,
          UpdatedUserId: adminId,
        });

        await addedBookType.save("bookTypes");

        if (await addedBookType) {
          res.status(201);
          res.json(addedBookType);
        } else {
          res.status(502);
          throw new Error("InvalidBookType");
        }
      }
    }
  } else {
    res.status(500);
    throw new Error(
      "UnauthorizedUser"
    );
  }
});

/////////////////////////updateBookType///////////////////////////////////////
// @desc    Updates BookType
// @route   PUT /api/bookTypes/updateBookType/:bookTypeId
// @access  Private
module.exports.update = asyncHandler(async (req, res, next) => {
  const adminId = req.user.id; // gets from middleware
  const { bookTypeId } = req.params;
  const { Name, IsActive } = req.body;
  const willUpdateBookType = {
    Name,
    IsActive,
    UpdatedUserId: adminId,
  };

  const adminInfo = await User.findById(adminId);
  if (adminInfo.isAdmin === true) {
    try {
      const updatedBookType = await BookType.findByIdAndUpdate(
        bookTypeId,
        willUpdateBookType,
        { new: true }
      );

      res.json(updatedBookType);
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

/////////////////////////deleteBookType///////////////////////////////////////
// @desc    Deletes BookType
// @route   DELETE /api/bookTypes/deleteBookType/:bookTypeId
// @access  Private
module.exports.delete = asyncHandler(async (req, res, next) => {
  const { bookTypeId } = req.params;
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    try {
      // const bookType = await BookType.findById(bookTypeId)
      const bookCountForBookType = await Book.countDocuments({
        BookTypeId: bookTypeId,
      });

      if (bookCountForBookType === 0) {
        const deletedBookType = await BookType.findByIdAndRemove(bookTypeId);
        res.status(200);
        res.json(deletedBookType);
      } else {
        next({
          message: `${bookCountForBookType}`,
        });
      }
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
module.exports.changeBookTypeAndDelete = asyncHandler(
  async (req, res, next) => {
    const { oldBookTypeId } = req.params;
    const { newBookTypeId } = req.body;
    const adminId = req.user.id; // gets from middleware

    const adminInfo = await User.findById(adminId);

    if (adminInfo.isAdmin === true) {
      try {
        const bookCountForOldBookType = await Book.countDocuments({
          BookTypeId: oldBookTypeId,
        });

        if (bookCountForOldBookType === 0) {
          const deletedBookType = await BookType.findByIdAndRemove(
            oldBookTypeId
          );
          res.status(200);
          res.json(deletedBookType);
        } else {
          const existingBookType = await BookType.findById(newBookTypeId);
          if (existingBookType) {
            const willUpdateBooks = await Book.find({
              BookTypeId: oldBookTypeId,
            });

            willUpdateBooks.map(async (book) => {
              await Book.findByIdAndUpdate(book.id, {
                BookTypeId: newBookTypeId,
              });
            });

            const deletedBookType = await BookType.findByIdAndDelete(
              oldBookTypeId
            );

            res.json({
              newBookTypeName: existingBookType.Name,
              deletedBookType,
              message: "success",
            });
          } else {
            next({ message: "BookTypeDoesntExist" });
          }
        }
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
  }
);
