import sql from '../configurations/db.config.js';
import { imageUpload, imageDelete } from '../../PortfolioWebsiteBackend/utils/uploadHandlers.js';
import fs from 'fs/promises';

export const getAllkitchens = async (req, res) => {
    try{
        const kitchens = await sql.query('SELECT * FROM kitchens');
        res.status(200).json(kitchens.recordset);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while fetching kitchens.",
            error: err.message 
        });
    }
}

export const createKitchen = async (req, res) => {
    const image = req.file || null;//image is optional

    const {name, phone, email, address, latitude, longitude, password} = req.body || {};
    let uploadedImage = null;

    //these are compulsory fields
    if(!(name && phone && email && address && latitude && longitude && password)){
        return res.status(400).json({ message: "All fields are required." });
    }

    try{
        if(image){
            uploadedImage = await imageUpload(image.path);
            await fs.unlink(image.path);
        }
        
        const newKitchen = await sql.query`INSERT INTO kitchens (name, phone, email, password, address, latitude, longitude, profile_image_url, profile_image_id) VALUES 
        (${name}, ${phone}, ${email}, ${password}, ${address}, ${latitude}, ${longitude}, ${uploadedImage?.secure_url || null}, ${uploadedImage?.public_id || null})`;

        res.status(200).json(newKitchen);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while creating the kitchen.",
            error: err.message 
        });
    }
}