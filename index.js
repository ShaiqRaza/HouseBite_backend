import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cookieParser from "cookie-parser";
const app = express();
import sql from './configurations/db.config.js'
import cors from 'cors';

//middlewares
app.use(cors({credentials: true, origin: process.env.CLIENT_URL}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//routing imports
import kitchensRoutes from './routes/kitchens.routes.js';
import userRoutes from './routes/users.routes.js';
import subscriptionRoutes from './routes/subscriptions.routes.js';
import planRoutes from './routes/plans.routes.js';
import reviewRoutes from './routes/reviews.routes.js';
import reportRoutes from './routes/reports.routes.js';

app.use('/kitchens', kitchensRoutes);
app.use('/users', userRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/plans', planRoutes);
app.use('/reviews', reviewRoutes);
app.use('/reports', reportRoutes);

//updating subscriptions statuses
setInterval(async () => {
    try {
        await sql.query`exec updateSubscriptionStatus`;
    } catch (err) {
        console.error('Error executing the query:', err);
    }
}, 86400000); // Every 24 hours

app.get("/", (req, res) => {
    res.send("Hello World!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});