const asyncHandler = require("express-async-handler");
const Person = require("../models/person.model");
const User = require("../models/user.model");

/////////////////////////getPersons///////////////////////////////////////
// @desc    Gets all persons
// @route   GET /api/persons/
// @access  Private

module.exports.findAll = asyncHandler(async (req, res) => {
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    const allPersons = await Person.aggregate([
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
      res.json(allPersons);
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
/////////////////////////addPerson///////////////////////////////////////
// @desc    Adds  Person
// @route   POST /api/persons/addPerson
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
      const existingPerson = await Person.findOne({ Name });
      if (existingPerson) {
        throw new Error("PersonAllreadyExist");
      } else {
        const addedPerson = new Person({
          Name,
          IsActive,
          CreatedUserId: adminId,
          UpdatedUserId: adminId,
        });

        await addedPerson.save("persons");

        if (await addedPerson) {
          res.status(201);
          res.json(addedPerson);
        } else {
          res.status(502);
          throw new Error("InvalidPerson");
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

/////////////////////////updatePerson///////////////////////////////////////
// @desc    Updates Person
// @route   PUT /api/persons/updatePerson/:personId
// @access  Private
module.exports.update = asyncHandler(async (req, res, next) => {
  const adminId = req.user.id; // gets from middleware
  const { personId } = req.params;
  const { Name, IsActive } = req.body;
  const willUpdatePerson = {
    Name,
    IsActive,
    UpdatedUserId: adminId,
  };

  const adminInfo = await User.findById(adminId);
  if (adminInfo.isAdmin === true) {
    try {
      const updatedPerson = await Person.findByIdAndUpdate(
        personId,
        willUpdatePerson,
        { new: true }
      );

      res.json(updatedPerson);
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

/////////////////////////deletePerson///////////////////////////////////////
// @desc    Deletes Person
// @route   DELETE /api/persons/deletePerson/:personId
// @access  Private
module.exports.delete = asyncHandler(async (req, res, next) => {
  const { personId } = req.params;
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    try {
      const deletedPerson = await Person.findByIdAndRemove(personId);
      res.status(200);
      res.json(deletedPerson);
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
