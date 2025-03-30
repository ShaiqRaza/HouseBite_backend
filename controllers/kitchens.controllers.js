import sql from '../configurations/db.config.js';
import { imageUpload, imageDelete } from '../utils/media.utils.js';
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
//will add email verification later
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

        const token = jwt.sign({ email: newKitchen.recordset[0].email }, process.env.JWT_SECRET, { expiresIn: '1d' });
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

        const runningSubscriptions = await sql.query`exec GetRunningSubscriptions ${id}`;
        if(runningSubscriptions.recordset.length > 0){
            return res.status(400).json({ message: "Cannot delete kitchen with active subscriptions." });
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

//all the things updation except image and email
export const updateKitchenDetails = async (req, res) => {
    const id = req.params.id;
    const {name, phone, address, latitude, longitude, password} = req.body || {};

    if (!id) {
        return res.status(400).json({ message: "Kitchen ID is required for updating." });
    }

    if (!name && !phone && !address && !latitude && !longitude && !password) {
        return res.status(400).json({ message: "Nothing to update." });
    }

    try{
        const kitchen = await sql.query`SELECT * FROM kitchens WHERE id=${id}`;

        if(kitchen.recordset.length == 0){
            return res.status(404).json({ message: "Kitchen not found!" });
        }

        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

        let updates = [];
        if(name) updates.push(`name='${name}'`);//here we are building the query mnually so have to write value of sting within single quotes because sql sriver will not do this automatically
        if(phone) updates.push(`phone='${phone}'`);   
        if(address) updates.push(`address='${address}'`);
        if(latitude) updates.push(`latitude=${latitude}`);
        if(longitude) updates.push(`longitude=${longitude}`);
        if(hashedPassword) updates.push(`password='${hashedPassword}'`);

        const query = `UPDATE kitchens SET ${updates.join(", ")} output inserted.* WHERE id = ${id};`;
        const updatedKitchen = await sql.query(query);

        res.status(200).json(updatedKitchen.recordset[0]);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while updating the kitchen.",
            error: err.message 
        });
    }
};

//will optimize this after learning transactions
export const updateKitchenImage = async (req, res) => {
    const id = req.params.id;
    const image = req.file;
    let uploadedImage = null;

    if (!id) {
        return res.status(400).json({ message: "Kitchen ID is required for updating." });
    }

    if (!image) {
        return res.status(400).json({ message: "Image is required for updating." });
    }

    try{
        const kitchen = await sql.query`SELECT * FROM kitchens WHERE id=${id}`;

        if(kitchen.recordset.length == 0){
            return res.status(404).json({ message: "ID is incorrect!" });
        }

        uploadedImage = await imageUpload(image.path);
        await fs.unlink(image.path);

        const updatedKitchen = await sql.query`UPDATE kitchens SET profile_image_url=${uploadedImage.secure_url}, profile_image_id=${uploadedImage.public_id} output inserted.* WHERE id = ${id};`;
        
       try{
        if(kitchen.recordset[0].profile_image_id)
            await imageDelete(kitchen.recordset[0].profile_image_id);
       }
        catch(err){
            console.warn("Error while deleting previous image", err.message);
        }

        res.status(200).json(updatedKitchen.recordset[0]);
    }
    catch(err){
        if (uploadedImage) 
            await imageDelete(uploadedImage.public_id);
        res.status(500).json({ 
            message: "An error occurred while updating the kitchen.",
            error: err.message 
        });
    }
};

export const changeStatus = async (req, res) => {
    const id = req.params.id;
    const {status} = req.body || {};

    if (!id) {
        return res.status(400).json({ message: "Kitchen ID is required for updating." });
    }

    if (status == null) {
        return res.status(400).json({ message: "Status is required for updating." });
    }

    try{
        const updatedKitchen = await sql.query`exec changeStatus ${status}, ${id}`;
        res.status(200).json(updatedKitchen.recordset[0]);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while updating the kitchen.",
            error: err.message 
        });
    }
}