import User from "../models/admin.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

/* ── Register ── */
export async function registerAdmin(req, res) {
    const { Name, email, password, role } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashedPassword = bcrypt.hashSync(password, 10);
        const newUser = new User({
            Name,
            email,
            password: hashedPassword,
            role: role || "admin",   // ← save role from request
        });
        await newUser.save();
        res.status(201).json({
            message: "Admin registered successfully",
            user: { Name: newUser.Name, email: newUser.email, role: newUser.role }
        });
    } catch (error) {
        res.status(500).json({ message: "Error registering admin", error: error.message });
    }
}

/* ── Login ── */
export async function loginadmin(req, res) {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const isPasswordCorrect = bcrypt.compareSync(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(403).json({ message: "Incorrect password" });
        }
        const token = jwt.sign(
            { email: user.email, Name: user.Name, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        res.json({
            token,
            message: "Login successful",
            user: { Name: user.Name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: "Login error", error: error.message });
    }
}

/* ── Get all users ── */
export async function getUsers(req, res) {
    try {
        const users = await User.find({}, { password: 0 }); // exclude password
        res.json({ users });
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error: error.message });
    }
}

/* ── Update user ── */
export async function updateUser(req, res) {
    const { id } = req.params;
    const { Name, email, password, role } = req.body;
    try {
        const updateData = { Name, email, role };
        // only update password if provided
        if (password && password.trim() !== "") {
            updateData.password = bcrypt.hashSync(password, 10);
        }
        const updated = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, select: "-password" }
        );
        if (!updated) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "User updated successfully", user: updated });
    } catch (error) {
        res.status(500).json({ message: "Error updating user", error: error.message });
    }
}