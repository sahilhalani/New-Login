const jwt = require("jsonwebtoken");
const MyCollection = require("../models/register");

const auth = async (req,res,next)=>{
try {
  const token = req.cookies.jwt;
  const verify = jwt.verify(token,process.env.jsonkey);
  
  const user = await MyCollection.findOne({_id:verify._id})

  var IsLogin = false;

  if(user){
      user.tokens.forEach(e=>{
          if (token === e.token) {
              IsLogin=true;
          }
      });

      req.token = token;
      req.user=user;

      if (!IsLogin) {
          res.redirect("login");
          return
      } else {
          return next();
      }

  }
} catch (error) {
    res.redirect("login");
}
};

module.exports = auth;