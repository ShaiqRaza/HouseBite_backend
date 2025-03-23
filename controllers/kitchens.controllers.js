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
//will add emeail verification later
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

export const getRunningSubscriptions = async (req, res) => {
    const id = req.params.id || null;
    if (!id) {
        return res.status(400).json({ message: "Kitchen ID is required for updating." });
    }

    try{
        const kitchen = await sql.query`SELECT * FROM kitchens WHERE id=${id}`;

        if(kitchen.recordset.length == 0){
            return res.status(404).json({ message: "Kitchen not found!" });
        }

        const subscriptions = await sql.query`exec GetRunningSubscriptions ${id}`;
        res.status(200).json(subscriptions.recordset);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while fetching the subscriptions of your kitchen.",
            error: err.message 
        });
    }
};

export const getAllPlans = async (req, res) => {
    const id = req.params.id || null;
    if (!id) {
        return res.status(400).json({ message: "Kitchen ID is required." });
    }
    try{
        const plans = await sql.query(`SELECT * FROM plans where kitchen_id=${id}`);
        const DetailedPlans = await Promise.all 
        (
            plans.recordset.map(async (plan) => {
            const schedule = await sql.query`exec getPlanSchedule ${plan.id}`;
            plan.schedule = schedule.recordset;
            return plan;
            })
        );
        res.status(200).json(DetailedPlans);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while fetching plans.",
            error: err.message 
        });
    }
};

export const createplan = async (req, res) => {
    const id = req.params.id;
    if (!id) 
        return res.status(400).json({ message: "Kitchen ID is required." });
    
    const { plan_name, plan_description, meals } = req.body;

    if(!plan_name || meals.length === 0)
        return res.status(400).json({ message: "All fields are required." });

    let newPlan = null;

    //calculating the price of the plan
    let plan_price = 0;
    meals.forEach(meal => {
        plan_price = plan_price + (meal.price * (meal.meal_days?.length || 1));
    });

    try{
        newPlan = await sql.query`INSERT INTO plans (name, description, price, kitchen_id) output inserted.id VALUES (${plan_name}, ${plan_description || null}, ${plan_price}, ${id})`;
        const plan_id = newPlan.recordset[0].id;
        await Promise.all(
            meals.map(async meal => {
                const new_meal = await sql.query`INSERT INTO meals (plan_id, name, price) output inserted.id VALUES (${plan_id}, ${meal.name}, ${meal.price})`;
                const meal_id = new_meal.recordset[0].id;

                await Promise.all(
                    meal.meal_days?.map(async meal_day => {
                        await sql.query`INSERT INTO meal_days (meal_id, day, timing) VALUES (${meal_id}, ${meal_day.day}, ${meal_day.timing})`;
                    })
                );
            })
        );
        res.status(201).json({ message: "Plan created successfully." });
    }
    catch(err){
        if(newPlan) 
            await sql.query`DELETE FROM plans WHERE id=${newPlan.recordset[0].id}`;
        res.status(500).json({ 
            message: "An error occurred while creating the plan.",
            error: err.message 
        });
    }
}