import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

const isLocal = process.env.AWS_PROFILE ? true : false;

// ✅ Encapsulated AWS Credentials Logic
const awsConfig = {
    region: process.env.AWS_REGION || "us-west-2",
    credentials: isLocal
        ? new AWS.SharedIniFileCredentials({ profile: process.env.AWS_PROFILE || "apiana-local" })
        : null
};

export default awsConfig;