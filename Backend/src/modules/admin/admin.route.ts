import express from "express";
import { registerAdmin, loginAdmin } from "./admin.service";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const result = await registerAdmin(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    console.error("Register Error:", err); 
    res.status(400).json({ success: false, error: err.message });
  }
});


router.post("/login", async (req, res) => {
  try {
    const result = await loginAdmin(req.body);
    res.status(200).json(result);
  } catch (err: any) {
    res.status(401).json({ success: false, error: err.message });
  }
});

module.exports = router;
