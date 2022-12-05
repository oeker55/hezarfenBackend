const asyncHandler = require("express-async-handler");
const Classification = require("../models/classification.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");
/////////////////////////getRecords///////////////////////////////////////
// @desc    Gets all records
// @route   GET /api/classifications/
// @access  Private

module.exports.findAll = asyncHandler(async (req, res) => {
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    const allRecords = await Classification.aggregate([
      { $project: { _id: 0, BookId: 1, Records: 1 } },

      { $unwind: "$Records" },

      {
        $lookup: {
          from: "users",
          localField: "Records.CreatedUserId",
          foreignField: "_id",
          as: "createdUser",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "Records.UpdatedUserId",
          foreignField: "_id",
          as: "updatedUser",
        },
      },

      {
        $lookup: {
          from: "books",
          localField: "BookId",
          foreignField: "_id",
          as: "book",
        },
      },
      {
        $lookup: {
          from: "subjects",
          localField: "Records.SubjectId",
          foreignField: "_id",
          as: "subject",
        },
      },
      {
        $lookup: {
          from: "events",
          localField: "Records.EventId",
          foreignField: "_id",
          as: "event",
        },
      },
      {
        $lookup: {
          from: "persons",
          localField: "Records.PersonId",
          foreignField: "_id",
          as: "person",
        },
      },
      {
        $lookup: {
          from: "locations",
          localField: "Records.LocationId",
          foreignField: "_id",
          as: "location",
        },
      },
      {
        $lookup: {
          from: "times",
          localField: "Records.TimeId",
          foreignField: "_id",
          as: "time",
        },
      },   {
        $lookup: {
          from: "authors",
          localField: "book.AuthorId",
          foreignField: "_id",
          as: "Author",
        },
      },

      { $unwind: "$createdUser" },
      { $unwind: "$updatedUser" },

      { $unwind: "$book" },
      { $unwind: "$Author" },
      // { $unwind: "$event" },
      // { $unwind: "$subject" },
      // { $unwind: "$person" },
      // { $unwind: "$location" },
      // { $unwind: "$time" },
   
      {
        $project: {
          "book.Title": 1,
          "book.EditonInfo": 1,
          "book.EditonNumber": 1,
          "Author.Name":1,
          "Author.Surname":1,
          "subject.Name": 1,
          "event.Name": 1,
          "person.Name": 1,
          "location.Name": 1,
          "time.Name": 1,
          "Records._id": 1,
          "Records.Text": 1,
          "Records.PageNo": 1,
          "Records.SubjectId": 1,
          "Records.EventId": 1,
          "Records.PersonId": 1,
          "Records.TimeId": 1,
          "Records.LocationId": 1,
          "Records.IsActive": 1,
          "Records.CreatedTime": 1,
          "Records.UpdatedTime": 1,
          "Records.IsActive": 1,
          "createdUser.email": 1,
          "updatedUser.email": 1,
          // createdAt: 1,
          // updatedAt: 1,

          BookId: 1,
        },
      },
    ]);

    try {
      res.json(allRecords);
    } catch (error) {
      res.json(error);
    }
  } else {
    res.status(500);
    throw new Error("UnauthorizedUser");
  }
});
/////////////////////////addRecord///////////////////////////////////////
// @desc    Adds new Record
// @route   POST /api/classification/addRecord
// @access  Private
module.exports.create = asyncHandler(async (req, res, next) => {
  const {
    BookId,
    PageNo,
    Text,
    SubjectId,
    EventId,
    PersonId,
    LocationId,
    TimeId,
    IsActive,
  } = req.body;

  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    try {
      const savedClassification = await Classification.findOneAndUpdate(
        { BookId: BookId },
        {
          $push: {
            Records: {
              Text,
              PageNo,
              SubjectId,
              EventId,
              PersonId,
              LocationId,
              TimeId,
              CreatedUserId: adminId,
              UpdatedUserId: adminId,
              CreatedTime:Date.now(),
              UpdatedTime:Date.now(),
              IsActive,
            },
          },
        },
        { new: true, upsert: true }
      );
      res.json(savedClassification);
    } catch (error) {
      res.json(error);
    }
  } else {
    res.status(500);
    throw new Error("UnauthorizedUser");
  }
});

/////////////////////////updateEvent///////////////////////////////////////
// @desc    Updates Event
// @route   PUT /api/events/updateEvent/:eventId
// @access  Private
module.exports.update = asyncHandler(async (req, res, next) => {
  const { classificationId } = req.params;
  const adminId = req.user.id; // gets from middleware
  const {
    BookId,
    PageNo,
    Text,
    SubjectId,
    EventId,
    PersonId,
    LocationId,
    TimeId,
    IsActive,
  } = req.body;
  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    try {
      const updatedClassificationBook = await Classification.findOneAndUpdate(
        { "Records._id": classificationId },
        {
          $set: {
            "Records.$.Text": Text,
            "Records.$.PageNo": PageNo,
            "Records.$.SubjectId": SubjectId,
            "Records.$.EventId": EventId,
            "Records.$.PersonId": PersonId,
            "Records.$.LocationId": LocationId,
            "Records.$.TimeId": TimeId,
            "Records.$.UpdatedUserId": adminId,
            "Records.$.IsActive": IsActive,
            "Records.$.UpdatedTime": Date.now(),
          },
        }
      );

      res.json(updatedClassificationBook);
    } catch (error) {
      res.json(error);
    }
  } else {
    res.status(501);
    next({
      message: "UnauthorizedUser",
    });
  }
});

/////////////////////////deleteEvent///////////////////////////////////////
// @desc    Deletes Event
// @route   DELETE /api/events/deleteEvent/:eventId
// @access  Private
module.exports.delete = asyncHandler(async (req, res, next) => {
  const { bookId,classificationId } = req.params;
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    try {
      const deletedClssificationRow = await Classification.findOneAndUpdate(
        { BookId: bookId },
        {
          $pull: {
            Records: { _id: classificationId },
          },
        },
        { new: true, upsert: true }
      );
      res.json(deletedClssificationRow);
    } catch (error) {
      res.json(error);
    }
  } else {
    res.status(501);
    next({
      message: "UnauthorizedUser",
    });
  }
});
module.exports.findOne = asyncHandler(async (req, res, next) => {
  const { bookId } = req.params;
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    bookIdForFilter = mongoose.Types.ObjectId(bookId);
    try {
      if (bookId) {
        const RecordsForBook = await Classification.aggregate([
          { $project: { _id: 0, BookId: 1, Records: 1 } },

          { $unwind: "$Records" },
          {
            $match: {
              BookId: {
                $in: [bookIdForFilter],
              },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "Records.CreatedUserId",
              foreignField: "_id",
              as: "createdUser",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "Records.UpdatedUserId",
              foreignField: "_id",
              as: "updatedUser",
            },
          },

          {
            $lookup: {
              from: "books",
              localField: "BookId",
              foreignField: "_id",
              as: "book",
            },
          },
          {
            $lookup: {
              from: "subjects",
              localField: "Records.SubjectId",
              foreignField: "_id",
              as: "subject",
            },
          },
          {
            $lookup: {
              from: "events",
              localField: "Records.EventId",
              foreignField: "_id",
              as: "event",
            },
          },
          {
            $lookup: {
              from: "persons",
              localField: "Records.PersonId",
              foreignField: "_id",
              as: "person",
            },
          },
          {
            $lookup: {
              from: "locations",
              localField: "Records.LocationId",
              foreignField: "_id",
              as: "location",
            },
          },
          {
            $lookup: {
              from: "times",
              localField: "Records.TimeId",
              foreignField: "_id",
              as: "time",
            },
           },

          { $unwind: "$createdUser" },
          { $unwind: "$updatedUser" },
          { $unwind: "$book" },
          // { $unwind: "$event" },
          // { $unwind: "$subject" },
          // { $unwind: "$person" },
          // { $unwind: "$location" },
          // { $unwind: "$time" },

       


          {
            $project: {
               "book.Title": 1,
               "subject.Name": 1,
              "event.Name": 1,
              "person.Name": 1,
              "location.Name": 1,
              "time.Name": 1,
              "Records._id": 1,
              "Records.Text": 1,
              "Records.PageNo": 1,
              "Records.SubjectId": 1,
              "Records.EventId": 1,
              "Records.PersonId": 1,
              "Records.TimeId": 1,
              "Records.LocationId": 1,
              "Records.IsActive": 1,
              "createdUser.email": 1,
              "updatedUser.email": 1,
              createdAt: 1,
              updatedAt: 1,

              BookId: 1,
            },
          },
        ]);
        res.status(200);
        res.json(RecordsForBook);
      } else {
        next({ message: "BookIdDoesntExist" });
      }
    } catch (error) {
      res.json(error);
    }
  } else {
    res.status(501);
    next({
      message: "UnauthorizedUser",
    });
  }
});
