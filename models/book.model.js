// Title (Başlık)
// BookTypeId (Kitap Tipi)
// ISBN
// EditonInfo (Baskı Bilgisi)
// EditonNumber (Baskı No)
// EditonYear (Basım Yılı)
// AuthorId (Yazar Id, Yazar tablosuna buradan bağlanacak)
// PublisherId (Yayınevi Id)
// IsActive (İlgili veri aktif mi?)
// IsDelete (İlgili veri silinmiş mi?)
// CreatedDate (Veri ilk ne zaman oluşturuldu)
// CreatedUserId (Veriyi ilk kim oluşturuldu)
// UpdatedDate (Veri en son ne zaman güncellendi)
// UpdatedUserId (Veriyi en son kim güncelledi)

const mongoose = require("mongoose");
const { Schema } = mongoose;

const bookSchema = new Schema(
  {
    Title: { type: String },
    BookTypeId: mongoose.Schema.Types.ObjectId, //(Kitap türü Id, Kiıtap türü tablosuna buradan bağlanacak)
    ISBN: { type: Number },
    EditonInfo: { type: String },
    EditonNumber: { type: Number },
    EditonYear: { type: Number },
    NumOfVolumes:{type:Number},
    AuthorId: mongoose.Schema.Types.ObjectId, //(Yazar Id, Yazar tablosuna buradan bağlanacak)
    PublisherId: mongoose.Schema.Types.ObjectId, //(Yayınevi Id, yayınevi tablosuna buradan bağlanacak)
    IsActive: { type: Boolean, default: true },
    IsDelete: { type: Boolean, default: false },
    CreatedUserId: mongoose.Schema.Types.ObjectId,
    UpdatedUserId: mongoose.Schema.Types.ObjectId,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("books", bookSchema);
