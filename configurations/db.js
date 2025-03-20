import sql from 'mssql';
import dotenv from 'dotenv';
dotenv.config();

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    trustServerCertificate: true,
  },
};

(async ()=>{
    try {
        await sql.connect(config);
        console.log("Connected to SQL Server");
    }
    catch(err){
        console.error("Database connection failed:", err);
    }
})();

export default sql;