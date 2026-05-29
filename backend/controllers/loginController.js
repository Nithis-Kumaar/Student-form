class LoginController {
  async login(req, res, userRepository) {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const user = await userRepository.findByUsername(username);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    res.json({ name: user.name, message: "Login successful!" });
  }
}

module.exports = new LoginController();