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