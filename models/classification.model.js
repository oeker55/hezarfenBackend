const mongoose = require("mongoose");
const { Schema } = mongoose;
const classificationSchema = new Schema(
  {
    BookId: { type: mongoose.Schema.Types.ObjectId },
    Records:[{
      Text:{ type: String},
      PageNo:{ type: String},
      EventId: { type: [mongoose.Schema.Types.ObjectId] },
      SubjectId: { type: [mongoose.Schema.Types.ObjectId] },
      PersonId: { type:[ mongoose.Schema.Types.ObjectId] },
      LocationId: { type: [mongoose.Schema.Types.ObjectId] },
      TimeId: { type: [mongoose.Schema.Types.ObjectId] },
      IsActive: { type: Boolean, default: true },
      IsDelete: { type: Boolean, default: false },
      CreatedUserId: mongoose.Schema.Types.ObjectId,
      UpdatedUserId: mongoose.Schema.Types.ObjectId,
      CreatedTime:{type:Date,default:Date.now()},
      UpdatedTime:{type:Date,default:Date.now()}
      
    }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("classifications", classificationSchema);