import express from 'express';
import { registerAdmin, loginadmin, getUsers, updateUser } from '../controllers/adminController.js';

const adminRouter = express.Router();

// Public routes
adminRouter.post("/login",    loginadmin);
adminRouter.post("/register", registerAdmin);

// Protected routes (require token — handled by middleware in index.js)
adminRouter.get("/users",          getUsers);
adminRouter.put("/users/:id",      updateUser);

export default adminRouter;