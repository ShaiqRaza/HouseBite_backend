import sql from '../configurations/db.config.js'; 
import jwt from 'jsonwebtoken';

export const requireKitchenLogin = async (req, res, next) => {
    const token = req.cookies.token || null;
    if(!token){
        return res.status(401).json({ message: "Kitchen is not logged in." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(decoded?.email === undefined){
            return res.status(401).json({ message: "Kitchen is not logged in." });
        }
        
        const kitchen = await sql.query`SELECT * FROM kitchens WHERE email = ${decoded}`;

        if(kitchen.recordset.length === 0){
            return res.status(401).json({ message: "Unauthorized Access." });
        }

        req.kitchen = kitchen.recordset[0];
        next();
    } catch (error) {
        return res.status(401).json({ message: "Something went wrong in authorization." });
    }
}