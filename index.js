import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cookieParser from "cookie-parser";

const app = express();

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//routing imports
import kitchensRoutes from './routes/kitchens.routes.js';
import userRoutes from './routes/users.routes.js';
import subscriptionRoutes from './routes/subscriptions.routes.js';
import planRoutes from './routes/plans.routes.js';

app.use('/kitchens', kitchensRoutes);
app.use('/users', userRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/plans', planRoutes);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});