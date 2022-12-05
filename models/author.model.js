const mongoose = require("mongoose");
const { Schema } = mongoose;
const authorSchema = new Schema(
  {
    Name: { type: String },
    Surname: { type: String },
    IsActive: { type: Boolean, default: true },
    IsDelete: { type: Boolean, default: false },
    CreatedUserId: mongoose.Schema.Types.ObjectId,
    UpdatedUserId: mongoose.Schema.Types.ObjectId,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("authors", authorSchema);
