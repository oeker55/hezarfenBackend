const mongoose = require("mongoose");

const publisherSchema = mongoose.Schema(
  {
    Name: { type: String },
    Address: { type: String },
    IsActive: { type: Boolean, default: true },
    IsDelete: { type: Boolean, default: false },
    CreatedUserId: mongoose.Schema.Types.ObjectId,
    UpdatedUserId: mongoose.Schema.Types.ObjectId,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("publishers", publisherSchema);
