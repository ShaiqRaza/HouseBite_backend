import sql from '../configurations/db.config.js';
import { imageUpload, imageDelete } from '../../PortfolioWebsiteBackend/utils/uploadHandlers.js';
import fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import axios from 'axios';

export const getAllUsers = async (req, res) =>{
    try{
        const users = await sql.query('SELECT * FROM users');
        res.status(200).json(users.recordset);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while fetching users.",
            error: err.message 
        });
    }
}

export const createUser = async (req, res) => {
    const {name, phone, email, address, latitude, longitude, password} = req.body || {};

    //these are compulsory fields
    if(!(name && phone && email && address && latitude && longitude && password)){
        return res.status(400).json({ message: "All fields are required." });
    }

    try{

        const response = await axios.get(`https://emailvalidation.abstractapi.com/v1/?api_key=${process.env.ABSTRACT_API_KEY}&email=${email}`)
        if (response.data.deliverability === "UNDELIVERABLE" || !response.data.is_mx_found.value)
            return res.status(400).json({ message: "Invalid email address." });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await sql.query`INSERT INTO Users (name, phone, email, password, address, latitude, longitude) OUTPUT INSERTED.* 
        VALUES (${name}, ${phone}, ${email}, ${hashedPassword}, ${address}, ${latitude}, ${longitude})`;

        const token = jwt.sign({ email: newUser.recordset[0].email }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.cookie('token', token, { httpOnly: true });
        res.status(200).json(newUser.recordset[0]);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while creating the User.",
            error: err.message 
        });
    }
}

export const updateUser = async (req, res) => {
    const id = req.params.id;
    const {name, phone, address, latitude, longitude, password} = req.body || {};

    if (!id) {
        return res.status(400).json({ message: "User ID is required for updating." });
    }

    if (!name && !phone && !address && !latitude && !longitude && !password) {
        return res.status(400).json({ message: "Nothing to update." });
    }

    try{
        const kitchen = await sql.query`SELECT * FROM Users WHERE id=${id}`;

        if(kitchen.recordset.length == 0){
            return res.status(404).json({ message: "User ID is incorrect!" });
        }

        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

        let updates = [];
        if(name) updates.push(`name='${name}'`);//here we are building the query manually so have to write value of sting within single quotes because sql sriver will not do this automatically
        if(phone) updates.push(`phone='${phone}'`);   
        if(address) updates.push(`address='${address}'`);
        if(latitude) updates.push(`latitude=${latitude}`);
        if(longitude) updates.push(`longitude=${longitude}`);
        if(hashedPassword) updates.push(`password='${hashedPassword}'`);

        const query = `UPDATE Users SET ${updates.join(", ")} output inserted.* WHERE id = ${id};`;
        const updatedUser = await sql.query(query);

        res.status(200).json(updatedUser.recordset[0]);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while updating the user.",
            error: err.message 
        });
    }
}

export const subscribePlan = async (req, res) => {
    const {user_id, plan_id} = req.params || {};
    if(!user_id)
        return res.status(400).json({message: "User ID is not given."});
    if(!plan_id)
        return res.status(400).json({message: "Plan ID is not given."});

    const {subscription_type, persons} = req.body;
    if(!(subscription_type && persons))
        return res.status(400).json({ message: "All fields are required." });

    try{
        const subscription = await sql.query`exec subscribePlan ${plan_id}, ${user_id}, ${persons}, ${subscription_type}`;
        res.json(subscription.recordset[0]);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while subscribing the plan.",
            error: err.message 
        });
    }
}

export const loginUser = async (req, res) => {
    const {email, password} = req.body || {};

    if(!(email && password)){
        return res.status(400).json({ message: "All fields are required." });
    }

    try{
        const user = await sql.query`SELECT * FROM Users WHERE email=${email}`;
        if(user.recordset.length == 0){
            return res.status(404).json({ message: "Email or password is incorrect!" });
        }

        const isMatch = await bcrypt.compare(password, user.recordset[0].password);
        if(!isMatch){
            return res.status(401).json({ message: "Email or password is incorrect!" });
        }

        const token = jwt.sign({ email: user.recordset[0].email }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.cookie('token', token, { httpOnly: true });
        res.status(200).json(user.recordset[0]);
    }
    catch(err){
        res.status(500).json({ 
            message: "An error occurred while logging in the user.",
            error: err.message 
        });
    }
};