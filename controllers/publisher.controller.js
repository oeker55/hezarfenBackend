const asyncHandler = require("express-async-handler");
const Publisher = require("../models/publisher.model");
const User = require("../models/user.model");

/////////////////////////getPublishers///////////////////////////////////////
// @desc    Gets publishers
// @route   GET /api/publishers
// @access  Private

module.exports.findAll = asyncHandler(async (req, res) => {
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    const allPublishers = await Publisher.aggregate([
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
          Address: 1,
          createdAt: 1,
          updatedAt: 1,
          IsActive: 1,

          "createdUser.email": 1,
          "updatedUser.email": 1,
        },
      },
    ]);
    try {
      res.json(allPublishers);
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
/////////////////////////addPublisher///////////////////////////////////////
// @desc    Adds  publisher
// @route   POST /api/publishers/addPublisher
// @access  Private
module.exports.create = asyncHandler(async (req, res, next) => {
  const { Name, Address, IsActive } = req.body;
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    if (!Name || !Address) {
      res.status(500);
      throw new Error("PleaseAddAllFields");
    } else {
      const addedPublisher = new Publisher({
        Name,
        Address,
        IsActive,
        CreatedUserId: adminId,
        UpdatedUserId: adminId,
      });
      await addedPublisher.save("authors");

      if (await addedPublisher) {
        res.status(201);
        res.json(addedPublisher);
      } else {
        res.status(502);
        throw new Error("InvalidPublisher");
      }
    }
  } else {
    res.status(500);
    throw new Error(
      "UnauthorizedUser"
    );
  }
});
/////////////////////////updatePublisher///////////////////////////////////////
// @desc    Updates publisher
// @route   PUT /api/publishers/updatePublisher/:publisherId
// @access  Private
module.exports.update = asyncHandler(async (req, res, next) => {
  const adminId = req.user.id; // gets from middleware
  const { publisherId } = req.params;
  const { Name, Address, IsActive } = req.body;
  const willUpdatePublisher = {
    Name,
    Address,
    IsActive,
    UpdatedUserId: adminId,
  };
  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    try {
      const updatedPublisher = await Publisher.findByIdAndUpdate(
        publisherId,
        willUpdatePublisher,
        { new: true }
      );

      res.json(updatedPublisher);
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
/////////////////////////deletePublisher///////////////////////////////////////
// @desc    Updates publisher
// @route   DELETE /api/publishers/deletePublisher/:publisherId
// @access  Private
module.exports.delete = asyncHandler(async (req, res, next) => {
  const { publisherId } = req.params;
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    try {
      const deletedPublisher = await Publisher.findByIdAndRemove(publisherId);

      res.status(200);
      res.json(deletedPublisher);
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
