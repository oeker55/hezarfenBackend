const mongoose  = require("mongoose");

module.exports = ()=>{
    mongoose.connect(process.env.CONNECTION_URL,{
        useNewUrlParser:true,
        useUnifiedTopology:true
    })
    mongoose.connection.on("open",()=>{
        console.log("MongoDB Connected !")

    })
    mongoose.connection.on("error",(err)=>{
        console.log(err)
    })
}