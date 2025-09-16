export default function Refresh(req, res) {
  res.status(200).json({ message: "Token refreshed successfully" });
}