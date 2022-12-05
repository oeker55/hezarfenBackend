const User = require("../models/user.model");
const Token = require("../models/token.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
var path = require("path");
const asyncHandler = require("express-async-handler");
// const { API_URL } = require("../constants");

//reset password

// const { resetPassword } = require("../utils/emailTemplates");
// const { sendEmail } = require("../utils/sendEmail");
const axios = require("axios");

//google login

const { google } = require("googleapis");

const { OAuth2 } = google.auth;
const client = new OAuth2(process.env.GOOGLE_CLIENT_ID);

// ////////////////////////////generateToken//////////////////////////////////////
const generateToken = (id, isAdmin) => {
  return jwt.sign({ id, isAdmin }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

/////////////////////////register///////////////////////////////////////
// @desc    Register user
// @route   POST /api/users/register
// @access  Public
module.exports.registerUser = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    res.status(500);
    throw new Error("PleaseAddAllFields");
  } else {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(501);
      throw new Error("UserAllreadyExist");
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const registeredUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
      });
      await registeredUser.save("users");

      if (await registeredUser) {
        res.status(201);
        res.json(registeredUser);
      } else {
        res.status(502);
        throw new Error("InvalidUser");
      }
    }
  }
});

/////////////////////////login///////////////////////////////////////
// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Private
module.exports.login = asyncHandler(async (req, res, next) => {
  const { email, password, recaptchaToken } = req.body;
  /// recaptcha
  //sends secret key and response token to google
  // const response = await axios.post(
  //   `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.REACT_APP_SECRET_KEY}&response=${recaptchaToken}`
  // );

  //check response status and send back to the client-side
  // if (response.data.success === true) {
  if (!email || !password) {
    res.status(500);
    throw new Error("PleaseAddAllFields");
  }
  //check for email
  const user = await User.findOne({ email });
  //check for password
  if (user) {
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (isValidPassword) {
      if (user.isActive) {
        const token = generateToken(user._id, user.isAdmin);

        await Token.findOneAndUpdate(
          { userId: user._id, tokenType: "login" },
          { token: token },
          { new: true, upsert: true }
        );
        const profile = await User.findOneAndUpdate(
          { email },
          { loginType: "email" },
          { new: true, upsert: true }
        );
        res.status(200);
        res.json({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          profilePic: profile.profilePic,
          loginType: profile.loginType,
          token: token,
        });
      } else {
        res.status(501);

        throw new Error("InactiveAccount");
      }
    } else {
      res.status(502);

      throw new Error("WrongPassword");
    }
  } else {
    res.status(503);
    throw new Error("InvalidEmail");
  }
  // } else {
  //   throw new Error("Robot 🤖");
  // }
});
/////////////////////////getUsers///////////////////////////////////////
// @desc    Authenticate a user
// @route   GET /api/users/login
// @access  Public

module.exports.getUsers = asyncHandler(async (req, res) => {
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    try {
      const allUsers = await User.find();
      res.json(allUsers);
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
/////////////////////////google-login///////////////////////////////////////
// @desc    Login With Google
// @route   POST /api/users/google-login
// @access  Public
module.exports.googleLogin = async (req, res, next) => {
  try {
    const { tokenId, name, profilePic } = req.body;
    const verify = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email_verified, email } = verify.payload;

    const password = email + process.env.PASSWORD_GENERATOR_SECRET;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (!email_verified)
      return res.status(400).json({ message: "InvalidEmail" });

    const user = await User.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "WrongPassword" });
      } else {
        if (user.isActive) {
          const token = generateToken(user._id, user.isAdmin);

          await Token.findOneAndUpdate(
            { userId: user._id, tokenType: "login" },
            { token: token },
            { new: true, upsert: true }
          );
          const profile = await User.findOneAndUpdate(
            { email },
            { loginType: "google" },
            { new: true, upsert: true }
          );
          res.status(200);
          res.json({
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            profilePic: profile.profilePic,
            loginType: profile.loginType,

            token: token,
          });
        } else {
          res.status(501);

          next({ message: "InactiveAccount" });
        }
      }
    } else {
      const nameArray = name.split(" ");

      let firstName;
      let lastName;
      if (nameArray.length === 3) {
        firstName = `${nameArray[0]}  ${nameArray[1]}`;
        lastName = nameArray[2];
      } else if (nameArray.length === 2) {
        firstName = nameArray[0];
        lastName = nameArray[1];
      } else {
        firstName = name;
        lastName = " ";
      }
      const newUser = new User({
        firstName: firstName,
        lastName: lastName,
        profilePic: profilePic,
        email: email,
        password: passwordHash,
        loginType: "google",
      });

      await newUser.save();
      const profile = await User.findOne({ email });
      if (profile.isActive) {
        const token = generateToken(profile._id, profile.isAdmin);

        await Token.findOneAndUpdate(
          { userId: profile._id, tokenType: "login" },
          { token: token },
          { new: true, upsert: true }
        );
        res.status(200);
        res.json({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          profilePic: profile.profilePic,
          loginType: profile.loginType,

          token: token,
        });
      } else {
        res.status(501);

        next({ message: "InactiveAccount" });
      }
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
/////////////////////////facebook-login///////////////////////////////////////
// @desc    Authenticate a user
// @route   POST /api/users/facebook-login
// @access  Public
module.exports.facebookLogin = async (req, res, next) => {
  const { userId, accessToken, firstName, lastName } = req.body;

  const URL = `https://graph.facebook.com/v2.9/${userId}/?fields=id,name,email,picture&access_token=${accessToken}`;
  const { data } = await axios.get(URL);

  const email = data.email;
  const profilePic = data.picture.data.url;
  if (!email) 
    return res.status(400).json({ message: "InvalidEmail"});
  try {
    const password = email + process.env.PASSWORD_GENERATOR_SECRET;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "WrongPassword" });
      } else {
        if (user.isActive) {
          const token = generateToken(user._id, user.isAdmin);

          await Token.findOneAndUpdate(
            { userId: user._id, tokenType: "login" },
            { token: token },
            { new: true, upsert: true }
          );
          const profile = await User.findOneAndUpdate(
            { email },
            { loginType: "facebook" },
            { new: true, upsert: true }
          );
          res.status(200);
          res.json({
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            profilePic: profile.profilePic,
            loginType: profile.loginType,

            token: token,
          });
        } else {
          res.status(501);

          next({ message: "InactiveAccount" });
        }
      }
    } else {
      const newUser = new User({
        firstName: firstName,
        lastName: lastName,
        profilePic: profilePic,
        email: email,
        password: passwordHash,
        loginType: "facebook",
      });

      await newUser.save();
      const profile = await User.findOne({ email });
      if (profile.isActive) {
        const token = generateToken(profile._id, profile.isAdmin);

        await Token.findOneAndUpdate(
          { userId: profile._id, tokenType: "login" },
          { token: token },
          { new: true, upsert: true }
        );
        res.status(200);
        res.json({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          profilePic: profile.profilePic,
          loginType: profile.loginType,

          token: token,
        });
      } else {
        res.status(501);

        next({ message: "InactiveAccount" });
      }
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
/////////////////////////github-login///////////////////////////////////////
// @desc    Authenticate a user
// @route   POST /api/users/github-login
// @access  Public

module.exports.githubLogin = async (req, res, next) => {
  const { accessToken, email } = req.body;
  const config = {
    headers: {
      Authorization: `token ${accessToken}`,
    },
  };

  const URL = `https://api.github.com/user`;
  const { data } = await axios.get(URL, config);

  const profilePic = data?.avatar_url;
  const firstName = data?.name;
  const lastName = "github";

  if (!firstName)
    return res.status(400).json({ message: "InvalidEmail" });
  try {
    const password = email + process.env.PASSWORD_GENERATOR_SECRET;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.findOne({ email });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "WrongPassword" });
      } else {
        if (user.isActive) {
          const token = generateToken(user._id, user.isAdmin);

          await Token.findOneAndUpdate(
            { userId: user._id, tokenType: "login" },
            { token: token },
            { new: true, upsert: true }
          );
          const profile = await User.findOneAndUpdate(
            { email },
            { loginType: "github" },
            { new: true, upsert: true }
          );
          res.status(200);
          res.json({
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            profilePic: profile.profilePic,
            loginType: profile.loginType,

            token: token,
          });
        } else {
          res.status(501);

          next({ message: "InactiveAccount" });
        }
      }
    } else {
      const newUser = new User({
        firstName: firstName,
        lastName: lastName,
        profilePic: profilePic,
        email: email,
        password: passwordHash,
        loginType: "github",
      });

      await newUser.save();
      const profile = await User.findOne({ email });
      if (profile.isActive) {
        const token = generateToken(profile._id, profile.isAdmin);

        await Token.findOneAndUpdate(
          { userId: profile._id, tokenType: "login" },
          { token: token },
          { new: true, upsert: true }
        );
        res.status(200);
        res.json({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          profilePic: profile.profilePic,
          loginType: profile.loginType,

          token: token,
        });
      } else {
        res.status(501);

        next({ message: "InactiveAccount" });
      }
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
/////////////////////////logout///////////////////////////////////////
// @desc    Register user
// @route   GET /api/users/logout
// @access  Private

module.exports.logout = (req, res) => {
  Token.findOneAndDelete(
    { userId: req.user.id, tokenType: "login" },
    (err, doc) => {
      if (err)
        return res.status(401).json({
          status: false,
          message: "ServerError",
        });
      return res.status(200).json({
        status: true,
        message: "SuccessfullyLogout",
      });
    }
  );
};
module.exports.expiredTokenLogout = asyncHandler(async (req, res) => {
  let token;

  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // console.log(decoded)
      res.json(decoded);
    } else {
      res.status(401);
      throw new Error("TokenDoesntExist");
    }
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      const payload = jwt.verify(token, process.env.JWT_SECRET, {
        ignoreExpiration: true,
      });

      Token.findOneAndDelete(
        { userId: payload.id, tokenType: "login" },
        (err, doc) => {
          if (err)
            return res.status(401).json({
              status: false,
              message: "ServerError",
            });
          return res.status(200).json({
            status: true,
            message: "TokenExpired",
          });
        }
      );
    } else {
      res.json(error);
    }
  }
});
/////////////////////////addUser///////////////////////////////////////
// @desc    Add User
// @route   POST /api/users/addUser
// @access  Private

module.exports.addUser = async (req, res, next) => {
  const user = req.body;
  const { firstName, lastName, password, email } = req.body;

  const adminId = req.user.id;

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const adminInfo = await User.findById(adminId);
  if (!firstName || !lastName || !email || !password) {
    res.status(500);
    next({ message: "PleaseAddAllFields" });
  } else {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(501);
      next({ message: "UserAllreadyExist" });
    } else {
      if (adminInfo.isAdmin === true) {
        try {
          const newUser = new User({
            ...user,
            password: hashedPassword,
          });
          await newUser.save("users");
          res.json(newUser);
        } catch (error) {
          res.json(error);
        }
      } else {
        res.status(500);
        next({
          message:
            "UnauthorizedUser",
        });
      }
    }
  }
};
/////////////////////////updateUser///////////////////////////////////////
// @desc    Updates User
// @route   PUT /api/users/updateUser/:userId
// @access  Private
module.exports.updateUser = async (req, res, next) => {
  const adminId = req.user.id; // gets from middleware
  const { userId } = req.params;
  const { firstName, lastName, isActive, isAdmin, approvedAccount } = req.body;

  const willUpdateUser = {
    firstName,
    lastName,
    isActive,
    isAdmin,
    approvedAccount,
  };

  const adminInfo = await User.findById(adminId);
  if (adminInfo.isAdmin === true) {
    try {
      const updatedUser = await User.findByIdAndUpdate(userId, willUpdateUser, {
        new: true,
      });

      res.json(updatedUser);
    } catch (error) {
      res.json(error);
    }
  } else {
    next({
      message:
        "UnauthorizedUser",
    });
  }
};
/////////////////////////deleteUser///////////////////////////////////////
// @desc    Deletes User
// @route   DELETE /api/users/deleteUser/:userId
// @access  Private
module.exports.deleteUser = async (req, res, next) => {
  const { userId } = req.params;
  const adminId = req.user.id; // gets from middleware

  const adminInfo = await User.findById(adminId);

  if (adminInfo.isAdmin === true) {
    if (adminId === userId) {
      res.status(500);
      next({ message: "CannotDeleteYourself" });
    } else {
      try {
        const deletedUser = await User.findByIdAndRemove(userId);

        res.status(200);
        res.json(deletedUser);
      } catch (error) {
        res.json(error);
      }
    }
  } else {
    res.status(501);
    next({
      message:
        "UnauthorizedUser",
    });
  }
};

// ////////////////////////////registerUser//////////////////////////////////////
// // @desc    Register new user
// // @route   POST /api/users
// // @access  Public

// /////////////////////////loginUser///////////////////////////////////////
// // @desc    Authenticate a user
// // @route   POST /api/users/login
// // @access  Public
// module.exports.loginUser = asyncHandler(async (req, res, next) => {
//   const { email, password, recaptchaToken } = req.body;
//   /// recaptcha
//   //sends secret key and response token to google
//   // const response = await axios.post(
//   //   `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.REACT_APP_SECRET_KEY}&response=${recaptchaToken}`
//   // );

//   //check response status and send back to the client-side
//   if (response.data.success === true) {
//     if (!email || !password) {
//       res.status(500);
//       throw new Error("PleaseAddAllFields");
//     }
//     //check for email
//     const user = await User.findOne({ email });
//     //check for password
//     if (user) {
//       const isValidPassword = await bcrypt.compare(password, user.password);

//       if (isValidPassword) {
//         if (user.isActive) {
//           const token = generateToken(user._id, user.isAdmin);

//           // await Token.findOneAndUpdate(
//           //   { userId: user._id, tokenType: "login" },
//           //   { token: token },
//           //   { new: true, upsert: true }
//           // );
//        const profile =  await User.findOneAndUpdate(
//             { email},
//             { loginType:"email"},
//             { new: true, upsert: true }
//           );
//           res.status(200);
//           res.json({
//             firstName: profile.firstName,
//             lastName: profile.lastName,
//             email: profile.email,
//             profilePic:profile.profilePic,
//             loginType:profile.loginType,

//             token: token,
//           });
//         } else {
//           res.status(501);

//           throw new Error("InactiveAccount");
//         }
//       } else {
//         res.status(502);

//         throw new Error("Hatalı Şifre!");
//       }
//     } else {
//       res.status(503);
//       throw new Error("InvalidEmail");
//     }
//   } else {
//     throw new Error("Robot 🤖");
//   }
// });

// module.exports.microsoftLogin = async (req, res, next) => {
//   const {accessToken, profilePic, email } = req.body;
//   const config = {
//     headers: {
//       Authorization: `Bearer ${accessToken}`,
//     },
//   }
//   const URL = `https://graph.microsoft.com/v1.0/me`
//   const {data}= await axios.get(URL,config);
//   const firstName = data.givenName
//   const lastName = data.surname

//   if (!firstName)
//       return res.status(400).json({ message: "Email verification failed." });
//       try {

//     const password = email + process.env.PASS_GEN_SECRET;
//     const salt = await bcrypt.genSalt(10);
//     const passwordHash = await bcrypt.hash(password, salt);

//     const user = await User.findOne({ email });
//     if (user) {
//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//         return res.status(400).json({ message: "Password is incorrect." });
//       } else {
//         if (user.isActive) {
//           const token = generateToken(user._id, user.isAdmin);

//           await Token.findOneAndUpdate(
//             { userId: user._id, tokenType: "login" },
//             { token: token },
//             { new: true, upsert: true }

//             );
//             const profile =  await User.findOneAndUpdate(
//               { email},
//               { loginType:"microsoft"},
//               { new: true, upsert: true }
//             );
//             res.status(200);
//             res.json({
//             firstName: profile.firstName,
//             lastName: profile.lastName,
//             email: profile.email,
//             profilePic: profile.profilePic,
//             loginType:profile.loginType,

//             token: token,
//           });
//         } else {
//           res.status(501);

//           next({ message: "InactiveAccount" });
//         }
//       }
//     } else {

//       const newUser = new User({
//         firstName: firstName,
//         lastName: lastName,
//         profilePic: profilePic,
//         email: email,
//         password: passwordHash,
//         loginType:"microsoft"
//       });

//       await newUser.save();
//       const profile = await User.findOne({ email });
//       if (profile.isActive) {
//         const token = generateToken(profile._id, profile.isAdmin);

//         await Token.findOneAndUpdate(
//           { userId: profile._id, tokenType: "login" },
//           { token: token },
//           { new: true, upsert: true }
//           );
//           res.status(200);
//           res.json({
//           firstName: profile.firstName,
//           lastName: profile.lastName,
//           email: profile.email,
//           profilePic: profile.profilePic,
//           loginType: profile.loginType,

//           token: token,
//         });
//       } else {
//         res.status(501);

//         next({ message: "InactiveAccount" });
//       }
//     }
//   } catch (err) {
//     return res.status(500).json({ message: err.message });
//   }
// };

// ///////////////////////////getMe///////////////////////////////////////
// module.exports.getMe = asyncHandler(async (req, res) => {

//   const userId = req.user.id
//   const {firstName, lastName, email, profilePic} = await User.findById(userId);

//   try {

//     res.json({firstName, lastName, email, profilePic});
//   } catch (error) {
//     res.json(err)

//   }
// });
// ///////////////updateMe
// module.exports.updateMe = async (req, res, next) => {
//   const userId = req.user.id;

//   const { firstName, lastName, profilePic,oldProfilePhoto} = req.body;

//   const updatedUser = {

//     firstName:firstName,
//     lastName:lastName,
//     profilePic :profilePic
//   };
//   const userInfo = await User.findById(userId);
//   if (userInfo.isActive=== true) {
//     const oldPhotoAdresss = oldProfilePhoto.split("/").splice(0,3).join("/")

//      const oldProfilePhotoName = oldProfilePhoto.split("/")[3]
//      const profilePicName = profilePic.split("/")[3]

//        if(oldPhotoAdresss === API_URL && oldProfilePhotoName !== profilePicName){

//          const oldProfilePhotoTarget = path.join(__dirname,"../public/images/"+oldProfilePhotoName)

//          fs.unlinkSync(oldProfilePhotoTarget)
//        }

//     try {
//       await User.findByIdAndUpdate(userId, updatedUser, { new: true });
//       res.json(updatedUser);
//     } catch (error) {
//       res.json(error);
//     }
//   } else {
//     next({
//       message:
//         "InactiveAccount",
//     });
//   }
// };

// module.exports.forgotPassword = asyncHandler(async (req, res) => {
//   const { email, recaptchaToken } = req.body;
//   if (email === "") {
//     return res.status(400).json({
//       status: false,
//       message: "Lütfen Email Alanını Doldurunuz!" || err,
//       data: undefined,
//     });
//   }
//   const response = await axios.post(
//     `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.REACT_APP_SECRET_KEY}&response=${recaptchaToken}`
//     );

//     //check response status and send back to the client-side
//     if (response.data.success === true) {
//       User.findOne({ email }, (err, user) => {
//       if (err || !user) {
//         return res.status(400).json({
//           status: false,
//           message: "Bu Email Adresi  Kayıtlı Değil !" || err,
//           data: undefined,
//         });
//       }
//       const token = jwt.sign(
//         {
//           email: user.email,
//           userId: user._id,
//         },
//         process.env.JWT_RESET_PW_KEY,
//         {
//           expiresIn: "5m",
//         }
//         );
//       Token.findOneAndUpdate(
//         { userId: user._id, tokenType: "resetPassword" },
//         { token: token },
//         { new: true, upsert: true },
//         (err, doc) => {
//           if (doc) {
//             const emailTemplate = resetPassword(email, token);
//             sendEmail(emailTemplate);
//             res.status(200).json({
//               status: true,
//               message: "Email for reset password has been sent",
//               email: email,
//             });
//           } else {
//             return res.status(401).json({
//               status: false,
//               message: "Server error",
//               data: undefined,
//             });
//           }
//         }
//       );
//     });
//   } else {
//     throw new Error("Robot 🤖");
//   }
// });
// module.exports.resetPassword = async (req, res) => {
//   const token = req.params.token;
//   const { newPassword, recaptchaToken } = req.body;

//   const response = await axios.post(
//     `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.REACT_APP_SECRET_KEY}&response=${recaptchaToken}`
//   );

//   //check response status and send back to the client-side
//   if (response.data.success === true) {
//     try {
//       const decoded = jwt.verify(token, process.env.JWT_RESET_PW_KEY);
//       Token.findOne(
//         { userId: decoded.userId, token: token, tokenType: "resetPassword" },
//         async (err, doc) => {
//           if (err) {
//             console.log(err);
//             return res.status(500).json({
//               status: false,
//               message: "Invalid token",
//               data: err,
//             });
//           }
//           if (doc) {
//             const user = await User.findOne({ email: decoded.email });
//             const salt = await bcrypt.genSalt(10);
//             bcrypt.hash(newPassword, salt, (err, hashedPassword) => {
//               if (err) {
//                 console.log(err);
//                 return res.status(500).json({
//                   status: false,
//                   message: "Error, cannot encrypt password",
//                   data: err,
//                 });
//               }
//               user.password = hashedPassword;
//               user
//                 .save("users")
//                 .then(async (result) => {
//                   await Token.findOneAndDelete({
//                     userId: user.id,
//                     tokenType: "resetPassword",
//                   });
//                   res.status(200).json({
//                     status: true,
//                     message: "Şifreniz Başarılı Bir Şekilde Sıfırlandı!",
//                   });
//                 })
//                 .catch((err) => {
//                   res.status(400).json({
//                     status: false,
//                     message: "server error",
//                     data: err,
//                   });
//                 });
//             });
//           } else {
//             res.status(400).json({
//               status: false,
//               message: "Yeni bir Sıfırlama Bağlantısı Alınız!",
//             });
//           }
//         }
//       );
//     } catch (error) {
//       res.status(500).json({
//         status: false,
//         message: "Server error",
//         data: error,
//       });
//     }
//   } else {
//     throw new Error("Robot 🤖");
//   }
// };
// //////////////////////////////////7
// module.exports.changePassword = async (req, res, next) => {
//   const { oldPassword, newPassword } = req.body;
//   const userId = req.user.id;
//   const user = await User.findById(userId);

//   if (user) {
//     bcrypt.compare(oldPassword, user.password, async (err, isMatch) => {
//       if (err) {
//         return res.status(500).json({
//           status: false,
//           message: "Server error",
//           error: err,
//         });
//       } else if (isMatch) {
//         const salt = await bcrypt.genSalt(10);
//         bcrypt.hash(newPassword, salt, async (err, hash) => {
//           if (err) {
//             next({ message: "Error, cannot encrypt password" });
//           }
//           user.password = hash;
//           user.save("users").then((updatedUser) => {
//             return res.status(200).json({
//               status: true,
//               message: "Şifreniz Başarılı Bir Şekilde Değiştirildi!",
//               data: updatedUser,
//             });
//           });
//         });
//       } else {
//         next({ message: "Eski Şifrenizi Yanlış Girdiniz!" });
//       }
//     });
//   }
// };
