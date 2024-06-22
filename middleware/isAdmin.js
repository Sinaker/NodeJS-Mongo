const isAdmin = (req, res, next) => {
  //Exporting a middleware to check whether we are logged in or not
  if (!req.session.isAdmin) {
    req.flash("Error", "You have to be logged in to acces this route!");
    return res.redirect("/login");
  }
  next(); //Else pass control to the next middleware
};

module.exports = isAdmin;
