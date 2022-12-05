const asyncHandler = require("express-async-handler");
const Book = require("../models/book.model");
const User = require("../models/user.model");

/////////////////////////getBooks///////////////////////////////////////
// @desc    Gets all books
// @route   GET /api/books
// @access  Private

module.exports.findAll = asyncHandler(async (req, res) => {
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    const allBooks = await Book.aggregate([
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
      {
        $lookup: {
          from: "authors",
          localField: "AuthorId",
          foreignField: "_id",
          as: "Author",
        },
      },
      {
        $lookup: {
          from: "publishers",
          localField: "PublisherId",
          foreignField: "_id",
          as: "Publisher",
        },
      },
      {
        $lookup: {
          from: "booktypes",
          localField: "BookTypeId",
          foreignField: "_id",
          as: "BookType",
        },
      },
      { $unwind: "$createdUser" },
      { $unwind: "$updatedUser" },
      { $unwind: "$Author" },
      { $unwind: "$Publisher" },
      { $unwind: "$BookType" },
      {
        $project: {
          _id: 1,
          Title: 1,
          EditonInfo: 1,
          BookTypeId: 1,
          ISBN: 1,
          EditonNumber: 1,
          EditonYear: 1,
          NumOfVolumes:1,
          IsActive: 1,
          createdAt: 1,
          updatedAt: 1,
          AuthorId: 1, //Kitap güncellerken ihtiyaç duyuyoruz
          PublisherId: 1, //Kitap güncellerken ihtiyaç duyuyoruz

          "createdUser.email": 1,
          "updatedUser.email": 1,
          "Author.Name": 1,
          "Author.Surname": 1,
          "Publisher.Name": 1,
          "BookType.Name": 1,
        },
      },
    ]);
    try {
      res.json(allBooks);
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
/////////////////////////addBook///////////////////////////////////////
// @desc    Adds book
// @route   POST /api/books/addBook
// @access  Private
module.exports.create = asyncHandler(async (req, res, next) => {
  const {
    Title,
    BookTypeId,
    ISBN,
    EditonInfo,
    EditonNumber,
    EditonYear,
    NumOfVolumes,
    AuthorId,
    PublisherId,
    IsActive,
  } = req.body;
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    // if (!Title || !BookTypeId || !ISBN || !EditonInfo || !EditonNumber || !EditonYear || !AuthorId || !PublisherId || !IsActive)
    // {
    //   res.status(500);
    //   throw new Error("Lütfen tüm alanları doldurun!");
    // }
    if (!Title) {
      res.status(500);
      throw new Error("PleaseAddBookName");
    } else {
      const addedBook = new Book({
        Title,
        BookTypeId,
        ISBN,
        EditonInfo,
        EditonNumber,
        EditonYear,
        NumOfVolumes,
        AuthorId,
        PublisherId,
        IsActive,
        CreatedUserId: adminId,
        UpdatedUserId: adminId,
      });
      await addedBook.save("books");

      if (await addedBook) {
        res.status(201);
        res.json(addedBook);
      } else {
        res.status(502);
        throw new Error("InvalidBook");
      }
    }
  } else {
    res.status(500);
    throw new Error(
      "UnauthorizedUser"
    );
  }
});
/////////////////////////updateBook///////////////////////////////////////
// @desc    Updates book
// @route   PUT /api/books/updateBook/:bookId
// @access  Private
module.exports.update = asyncHandler(async (req, res, next) => {
  const adminId = req.user.id; // gets from middleware
  const { bookId } = req.params;
  const {
    Title,
    BookTypeId,
    ISBN,
    EditonInfo,
    EditonNumber,
    EditonYear,
    NumOfVolumes,
    AuthorId,
    PublisherId,
    IsActive,
  } = req.body;
  const willUpdateBook = {
    Title,
    BookTypeId,
    ISBN,
    EditonInfo,
    EditonNumber,
    EditonYear,
    NumOfVolumes,
    AuthorId,
    PublisherId,
    IsActive,
    UpdatedUserId: adminId,
  };

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    try {
      const updatedBook = await Book.findByIdAndUpdate(bookId, willUpdateBook, {
        new: true,
      });

      res.json(updatedBook);
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
/////////////////////////deleteBook///////////////////////////////////////
// @desc    Deletes book
// @route   /api/books/deleteBook/:bookId
// @access  Private
module.exports.delete = asyncHandler(async (req, res, next) => {
  const { bookId } = req.params;

  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    try {
      const deletedBook = await Book.findByIdAndRemove(bookId);

      res.status(200);
      res.json(deletedBook);
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
