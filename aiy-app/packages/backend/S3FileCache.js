import AWS from 'aws-sdk';
import dotenv from 'dotenv';
dotenv.config();

const awsCredentials = process.env.AWS_PROFILE;

const s3 = new AWS.S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    credentials: new AWS.SharedIniFileCredentials(awsCredentials)
});

class S3FileCache {
    constructor(bucketName, cacheDuration = 3600) {
        if (!bucketName) throw new Error("❌ S3 bucket name is required.");
        this.bucket = bucketName;
        this.cacheDuration = cacheDuration;
        this.cache = new Map(); // Simple in-memory cache
    }

    async fetchFile(filePath) {
        try {
            console.log(`📂 Attempting to fetch file from S3: ${filePath}`);

            // ✅ Check cache first
            if (this.cache.has(filePath)) {
                const cached = this.cache.get(filePath);
                if (Date.now() - cached.timestamp < this.cacheDuration * 1000) {
                    console.log(`✅ Returning cached version of: ${filePath}`);
                    return cached.data;
                }
            }

            // ✅ Fetch from S3
            const data = await s3.getObject({
                Bucket: this.bucket,
                Key: filePath
            }).promise();

            const content = data.Body.toString('utf-8');

            // ✅ Store in cache
            this.cache.set(filePath, { data: content, timestamp: Date.now() });

            console.log(`✅ Successfully loaded ${filePath} from S3.`);
            return content;
        } catch (error) {
            console.error(`❌ Error fetching file from S3 (${filePath}):`, error);
            return null;
        }
    }
}

export default S3FileCache;