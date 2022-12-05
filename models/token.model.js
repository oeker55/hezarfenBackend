const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tokenSchema = Schema(
  {
    token: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    tokenType: {
      type: String,
      enum: ["login", "resetPassword"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("tokens", tokenSchema);
