const mongoose = require("mongoose");

//local db
// mongoose.connect("mongodb://localhost:27017/admin",{
//     useNewUrlParser:true,
//     useUnifiedTopology:true,
// }).then(()=>{
//     console.log("Connected Boss");
// }).catch((error)=>{
// console.log("Connecting problem boss",error);
// });

//for dynamic db
const db = process.env.DATABASE
mongoose.connect(db,{
    useNewUrlParser:true,
    useUnifiedTopology:true,
    useCreateIndex:true
}).then(()=>{
    console.log("Dynamic Connection Connected");
}).catch((err)=>{
    console.log("Not Connected");
})