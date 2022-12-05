const asyncHandler = require("express-async-handler");
const Subject = require("../models/subject.model");
const User = require("../models/user.model");

/////////////////////////getSubjects///////////////////////////////////////
// @desc    Gets all subjects
// @route   GET /api/subjects/
// @access  Private

module.exports.findAll = asyncHandler(async (req, res) => {
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    const allSubjects = await Subject.aggregate([
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
      res.json(allSubjects);
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
/////////////////////////addSubject///////////////////////////////////////
// @desc    Adds  Subject
// @route   POST /api/subjects/addSubject
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
      const existingSubject = await Subject.findOne({ Name });
      if (existingSubject) {
        throw new Error("SubjectAllreadyExist");
      } else {
        const addedSubject = new Subject({
          Name,
          IsActive,
          CreatedUserId: adminId,
          UpdatedUserId: adminId,
        });

        await addedSubject.save("subjects");

        if (await addedSubject) {
          res.status(201);
          res.json(addedSubject);
        } else {
          res.status(502);
          throw new Error("InvalidSubject");
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

/////////////////////////updateSubject///////////////////////////////////////
// @desc    Updates Subject
// @route   PUT /api/subjects/updateSubject/:subjectId
// @access  Private
module.exports.update = asyncHandler(async (req, res, next) => {
  const adminId = req.user.id; // gets from middleware
  const { subjectId } = req.params;
  const { Name, IsActive } = req.body;
  const willUpdateSubject = {
    Name,
    IsActive,
    UpdatedUserId: adminId,
  };

  const adminInfo = await User.findById(adminId);
  if (adminInfo.isAdmin === true) {
    try {
      const updatedSubject = await Subject.findByIdAndUpdate(
        subjectId,
        willUpdateSubject,
        { new: true }
      );

      res.json(updatedSubject);
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

/////////////////////////deleteSubject///////////////////////////////////////
// @desc    Deletes Subject
// @route   DELETE /api/subjects/deleteSubject/:subjectId
// @access  Private
module.exports.delete = asyncHandler(async (req, res, next) => {
  const { subjectId } = req.params;
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    try {
      const deletedSubject = await Subject.findByIdAndRemove(subjectId);
      res.status(200);
      res.json(deletedSubject);
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
