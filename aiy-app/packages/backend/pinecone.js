// pinecone.js
import axios from 'axios';

const INDEX_HOST = "https://aiy-integrated-embed-ymyc360.svc.apw5-4e34-81fa.pinecone.io";
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;


async function upsertDocumentToPinecone(
    content,
    documentId,
    referenceURL,
    maxChunkSize = 1500,
    minChunkSize = 500
) {
    if (!PINECONE_API_KEY) {
        throw new Error('PINECONE_API_KEY environment variable is not set');
    }

    const pineconeUrl = `${INDEX_HOST}/records/namespaces/default/upsert`;

    // Chunk the content
    const chunks = chunkTextByMultiParagraphs(content, maxChunkSize, minChunkSize);

    // Batch the upsert operations
    const batchSize = 100;
    try {
        for (let i = 0; i < chunks.length; i += batchSize) {
            const batchChunks = chunks.slice(i, i + batchSize);
            
            // Create NDJSON format
            const ndjsonData = batchChunks.map((chunk) => ({
                _id: `${documentId}`,
                text: chunk,
            })).map(record => JSON.stringify(record)).join('\n');

            await axios.post(pineconeUrl, ndjsonData, {
                headers: {
                    'Content-Type': 'application/x-ndjson',
                    'Api-Key': PINECONE_API_KEY,
                    'X-Pinecone-API-Version': '2025-01'
                }
            });

            console.log(`Upserted batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(chunks.length / batchSize)}`);
        }

        return {
            success: true,
            chunksProcessed: chunks.length
        };
    } catch (error) {
        console.error('Error upserting to Pinecone:', error);
        throw error;
    }
}

function chunkTextByMultiParagraphs(
    text,
    maxChunkSize = 1500,
    minChunkSize = 500
) {
    const chunks = [];
    let currentChunk = "";
    let startIndex = 0;

    while (startIndex < text.length) {
        let endIndex = startIndex + maxChunkSize;
        if (endIndex >= text.length) {
            endIndex = text.length;
        } else {
            const paragraphBoundary = text.indexOf("\n\n", endIndex);
            if (paragraphBoundary !== -1) {
                endIndex = paragraphBoundary;
            }
        }

        const chunk = text.slice(startIndex, endIndex).trim();
        if (chunk.length >= minChunkSize) {
            chunks.push(chunk);
            currentChunk = "";
        } else {
            currentChunk += chunk + "\n\n";
        }

        startIndex = endIndex + 1;
    }

    if (currentChunk.length >= minChunkSize) {
        chunks.push(currentChunk.trim());
    } else if (chunks.length > 0) {
        chunks[chunks.length - 1] += "\n\n" + currentChunk.trim();
    } else {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

async function queryPinecone(searchText, topK = 3) {
    if (!PINECONE_API_KEY) {
        throw new Error('PINECONE_API_KEY environment variable is not set');
    }

    const pineconeUrl = `${INDEX_HOST}/records/namespaces/default/search`;
    
    const requestData = {
        query: {
            inputs: {
                text: searchText
            },
            top_k: topK
        },
        fields: ["text"] 
    };

    try {
        console.log('Sending request to Pinecone:', JSON.stringify(requestData, null, 2));
        const response = await axios.post(pineconeUrl, requestData, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Api-Key': PINECONE_API_KEY,
                'X-Pinecone-API-Version': 'unstable'
            }
        });

        console.log('Pinecone search response:', JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.error('Error querying Pinecone:', error.response?.data || error.message);
        throw error;
    }
}

export { queryPinecone, upsertDocumentToPinecone };