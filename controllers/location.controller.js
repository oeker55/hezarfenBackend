const asyncHandler = require("express-async-handler");
const Location = require("../models/location.model");
const User = require("../models/user.model");

/////////////////////////getLocations///////////////////////////////////////
// @desc    Gets all locations
// @route   GET /api/locations/
// @access  Private

module.exports.findAll = asyncHandler(async (req, res) => {
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    const allLocations = await Location.aggregate([
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
      res.json(allLocations);
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
/////////////////////////addLocation///////////////////////////////////////
// @desc    Adds  Location
// @route   POST /api/locations/addLocation
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
      const existingLocation = await Location.findOne({ Name });
      if (existingLocation) {
        throw new Error("LocationAllreadyExist");
      } else {
        const addedLocation = new Location({
          Name,
          IsActive,
          CreatedUserId: adminId,
          UpdatedUserId: adminId,
        });

        await addedLocation.save("locations");

        if (await addedLocation) {
          res.status(201);
          res.json(addedLocation);
        } else {
          res.status(502);
          throw new Error("InvalidLocation");
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

/////////////////////////updateLocation///////////////////////////////////////
// @desc    Updates Location
// @route   PUT /api/locations/updateLocation/:locationId
// @access  Private
module.exports.update = asyncHandler(async (req, res, next) => {
  const adminId = req.user.id; // gets from middleware
  const { locationId } = req.params;
  const { Name, IsActive } = req.body;
  const willUpdateLocation = {
    Name,
    IsActive,
    UpdatedUserId: adminId,
  };

  const adminInfo = await User.findById(adminId);
  if (adminInfo.isAdmin === true) {
    try {
      const updatedLocation = await Location.findByIdAndUpdate(
        locationId,
        willUpdateLocation,
        { new: true }
      );

      res.json(updatedLocation);
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

/////////////////////////deleteLocation///////////////////////////////////////
// @desc    Deletes Location
// @route   DELETE /api/locations/deleteLocation/:locationId
// @access  Private
module.exports.delete = asyncHandler(async (req, res, next) => {
  const { locationId } = req.params;
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    try {
      const deletedLocation = await Location.findByIdAndRemove(locationId);
      res.status(200);
      res.json(deletedLocation);
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
