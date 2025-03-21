import sql from '../configurations/db.config.js';
import { imageUpload, imageDelete } from '../../PortfolioWebsiteBackend/utils/uploadHandlers.js';
import fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import axios from 'axios';

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

//will create kitchen along with autheticating it by sending cookie
export const createKitchen = async (req, res) => {
    const image = req.file || null;//image is optional

    const {name, phone, email, address, latitude, longitude, password} = req.body || {};
    let uploadedImage = null;

    //these are compulsory fields
    if(!(name && phone && email && address && latitude && longitude && password)){
        return res.status(400).json({ message: "All fields are required." });
    }

    try{

        axios.get(`https://emailvalidation.abstractapi.com/v1/?api_key=${process.env.ABSTRACT_API_KEY}&email=${email}`)
            .then(response => {
                if (response.data.deliverability === "UNDELIVERABLE" || !response.data.is_mx_found.value)
                    return res.status(400).json({ message: "Invalid email address." });
            })
            .catch(error => {
                throw error("Email validation failed.");
            });

        const hashedPassword = await bcrypt.hash(password, 10);

        if(image){
            uploadedImage = await imageUpload(image.path);
            await fs.unlink(image.path);
        }

        const newKitchen = await sql.query`INSERT INTO kitchens (name, phone, email, password, address, latitude, longitude, profile_image_url, profile_image_id) OUTPUT INSERTED.* 
        VALUES (${name}, ${phone}, ${email}, ${hashedPassword}, ${address}, ${latitude}, ${longitude}, ${uploadedImage?.secure_url || null}, ${uploadedImage?.public_id || null})`;

        const token = jwt.sign({ id: newKitchen.recordset[0].id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.cookie('token', token, { httpOnly: true });
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

export const updateKitchen = async (req, res) => {
    const id = req.params.id;
    const image = req.file || null;//image is optional

    const {name, phone, email, address, latitude, longitude, password} = req.body || {};
    let uploadedImage = null;

    if (!id) {
        return res.status(400).json({ message: "Kitchen ID is required for updating." });
    }

    if (!name && !phone && !email && !address && !latitude && !longitude && !password && !image) {
        return res.status(400).json({ message: "Nothing to update." });
    }

    try{
        const kitchen = await sql.query`SELECT * FROM kitchens WHERE id=${id}`;

        if(kitchen.recordset.length == 0){
            return res.status(404).json({ message: "Kitchen not found!" });
        }

        if(image){
            if(kitchen.recordset[0].profile_image_id){
                await imageDelete(kitchen.recordset[0].profile_image_id);
            }
            uploadedImage = await imageUpload(image.path);
            await fs.unlink(image.path);
        }

        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

        await sql.query`UPDATE kitchens SET name=${name || kitchen.recordset[0].name}, phone=${phone || kitchen.recordset[0].phone}, email=${email || kitchen.recordset[0].email}, address=${address || kitchen.recordset[0].address}, latitude=${latitude || kitchen.recordset[0].latitude}, longitude=${longitude || kitchen.recordset[0].longitude}, profile_image_url=${uploadedImage?.secure_url || kitchen.recordset[0].profile_image_url}, profile_image_id=${uploadedImage?.public_id || kitchen.recordset[0].profile_image_id} WHERE id=${id}`;

        res.status(200).json({ message: "Kitchen updated successfully." });
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while updating the kitchen.",
            error: err.message 
        });
    }
};