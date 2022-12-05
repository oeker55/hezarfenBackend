const asyncHandler = require("express-async-handler");
const Time = require("../models/time.model");
const User = require("../models/user.model");

/////////////////////////getTimes///////////////////////////////////////
// @desc    Gets all times
// @route   GET /api/times/
// @access  Private

module.exports.findAll = asyncHandler(async (req, res) => {
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    const allTimes = await Time.aggregate([
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
      res.json(allTimes);
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
/////////////////////////addTime///////////////////////////////////////
// @desc    Adds  Time
// @route   POST /api/times/addTime
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
      const existingTime = await Time.findOne({ Name });
      if (existingTime) {
        throw new Error("TimeAllreadyExist");
      } else {
        const addedTime = new Time({
          Name,
          IsActive,
          CreatedUserId: adminId,
          UpdatedUserId: adminId,
        });

        await addedTime.save("times");

        if (await addedTime) {
          res.status(201);
          res.json(addedTime);
        } else {
          res.status(502);
          throw new Error("InvalidTime");
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

/////////////////////////updateTime///////////////////////////////////////
// @desc    Updates Time
// @route   PUT /api/times/updateTime/:timeId
// @access  Private
module.exports.update = asyncHandler(async (req, res, next) => {
  const adminId = req.user.id; // gets from middleware
  const { timeId } = req.params;
  const { Name, IsActive } = req.body;
  const willUpdateTime = {
    Name,
    IsActive,
    UpdatedUserId: adminId,
  };

  const adminInfo = await User.findById(adminId);
  if (adminInfo.isAdmin === true) {
    try {
      const updatedTime = await Time.findByIdAndUpdate(timeId, willUpdateTime, {
        new: true,
      });

      res.json(updatedTime);
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

/////////////////////////deleteTime///////////////////////////////////////
// @desc    Deletes Time
// @route   DELETE /api/times/deleteTime/:timeId
// @access  Private
module.exports.delete = asyncHandler(async (req, res, next) => {
  const { timeId } = req.params;
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    try {
      const deletedTime = await Time.findByIdAndRemove(timeId);
      res.status(200);
      res.json(deletedTime);
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
