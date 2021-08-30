const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const mySchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    confirmpassword:{
        type: String
    },
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }]
})

//Generating token

mySchema.methods.generateAuthToken = async function () {
    try {
        const sahil = jwt.sign({ _id:this._id.toString() }, process.env.jsonkey);
        this.tokens = this.tokens.concat({token:sahil})
        await this.save();
        return sahil;
    } catch (error) {
        console.log("The error is  " + error);
    }
};




//Hashing password
mySchema.pre("save", async function(next){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password,10);
        this.confirmpassword = undefined
    }
    next();
});
const myCollection = mongoose.model("user",mySchema);
module.exports=myCollection;