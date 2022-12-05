const asyncHandler = require("express-async-handler");
const Event = require("../models/event.model");
const User = require("../models/user.model");

/////////////////////////getEvents///////////////////////////////////////
// @desc    Gets all events
// @route   GET /api/events/
// @access  Private

module.exports.findAll = asyncHandler(async (req, res) => {
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    const allEvents = await Event.aggregate([
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
      res.json(allEvents);
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
/////////////////////////addEvent///////////////////////////////////////
// @desc    Adds  Event
// @route   POST /api/events/addEvent
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
      const existingEvent = await Event.findOne({ Name });
      if (existingEvent) {
        throw new Error("EventAllreadyExist");
      } else {
        const addedEvent = new Event({
          Name,
          IsActive,
          CreatedUserId: adminId,
          UpdatedUserId: adminId,
        });

        await addedEvent.save("events");

        if (await addedEvent) {
          res.status(201);
          res.json(addedEvent);
        } else {
          res.status(502);
          throw new Error("InvalidEvent");
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

/////////////////////////updateEvent///////////////////////////////////////
// @desc    Updates Event
// @route   PUT /api/events/updateEvent/:eventId
// @access  Private
module.exports.update = asyncHandler(async (req, res, next) => {
  const adminId = req.user.id; // gets from middleware
  const { eventId } = req.params;
  const { Name, IsActive } = req.body;
  const willUpdateEvent = {
    Name,
    IsActive,
    UpdatedUserId: adminId,
  };

  const adminInfo = await User.findById(adminId);
  if (adminInfo.isAdmin === true) {
    try {
      const updatedEvent = await Event.findByIdAndUpdate(
        eventId,
        willUpdateEvent,
        { new: true }
      );

      res.json(updatedEvent);
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

/////////////////////////deleteEvent///////////////////////////////////////
// @desc    Deletes Event
// @route   DELETE /api/events/deleteEvent/:eventId
// @access  Private
module.exports.delete = asyncHandler(async (req, res, next) => {
  const { eventId } = req.params;
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    try {
      const deletedEvent = await Event.findByIdAndRemove(eventId);
      res.status(200);
      res.json(deletedEvent);
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
