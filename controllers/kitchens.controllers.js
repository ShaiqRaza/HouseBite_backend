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
        
        const newKitchen = await sql.query`INSERT INTO kitchens (name, phone, email, password, address, latitude, longitude, profile_image_url, profile_image_id) OUTPUT INSERTED.* 
        VALUES (${name}, ${phone}, ${email}, ${password}, ${address}, ${latitude}, ${longitude}, ${uploadedImage?.secure_url || null}, ${uploadedImage?.public_id || null})`;

        res.status(200).json(newKitchen.recordset[0]);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while creating the kitchen.",
            error: err.message 
        });
    }
}

//will optimize this after learning transactions
export const deleteKitchen = async (req, res) => {
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({ message: "Kitchen ID is required for deletion." });
    }

    try{
        const kitchen = await sql.query`SELECT * FROM kitchens WHERE id=${id}`;

        if(kitchen.recordset.length == 0){
            return res.status(404).json({ message: "Kitchen not found!" });
        }

        if(kitchen.recordset[0].profile_image_id){
            await imageDelete(kitchen.recordset[0].profile_image_id);
        }

        await sql.query`DELETE FROM kitchens WHERE id=${id}`;
        res.status(200).json({ message: "Kitchen deleted successfully." });
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while deleting the kitchen.",
            error: err.message 
        });
    }
};