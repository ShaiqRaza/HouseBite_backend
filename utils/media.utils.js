import cloudinary from "../configurations/cloudinary.config.js";

export const imageUpload = async (filePath) => {
    try {
        if(!filePath) 
            throw error("No file provided to upload!");
        return await cloudinary.uploader.upload(filePath);
    } catch (error) {
        throw error("An error occurred while uploading image to cloudinary:", error);
    }
};

export const imageDelete = async (public_id) => {
    try {
        if(!public_id) 
            throw error("No public_id provided to delete image!");
        return await cloudinary.uploader.destroy(public_id);
    } catch (error) {
        throw error("An error occurred while deleting image from cloudinary:", error);
    }
};