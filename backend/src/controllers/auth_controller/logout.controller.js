export default function Logout(req, res) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
}