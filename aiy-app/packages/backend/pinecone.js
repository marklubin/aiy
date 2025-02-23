// pinecone.js
export class PineconeClient {
    constructor(axiosClient) {
        if (!axiosClient) {
            throw new Error('Axios client is required');
        }
        this.axios = axiosClient;
        this.INDEX_HOST = "https://aiy-integrated-embed-ymyc360.svc.apw5-4e34-81fa.pinecone.io";
        this.PINECONE_API_KEY = process.env.PINECONE_API_KEY;
    }

    async upsertDocumentToPinecone(content, documentId, referenceURL, maxChunkSize = 1500, minChunkSize = 500) {
        if (!this.PINECONE_API_KEY) {
            throw new Error('PINECONE_API_KEY environment variable is not set');
        }

        const pineconeUrl = `${this.INDEX_HOST}/records/namespaces/default/upsert`;
        const chunks = this.chunkTextByMultiParagraphs(content, maxChunkSize, minChunkSize);

        try {
            const batchSize = 100;
            for (let i = 0; i < chunks.length; i += batchSize) {
                const batchChunks = chunks.slice(i, i + batchSize);
                const ndjsonData = batchChunks.map((chunk) => ({
                    _id: `${documentId}`,
                    text: chunk,
                })).map(record => JSON.stringify(record)).join('\n');

                await this.axios.post(pineconeUrl, ndjsonData, {
                    headers: {
                        'Content-Type': 'application/x-ndjson',
                        'Api-Key': this.PINECONE_API_KEY,
                        'X-Pinecone-API-Version': '2025-01'
                    }
                });
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

    chunkTextByMultiParagraphs(text, maxChunkSize = 1500, minChunkSize = 500) {
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

    async queryPinecone(searchText, topK = 3) {
        if (!this.PINECONE_API_KEY) {
            throw new Error('PINECONE_API_KEY environment variable is not set');
        }

        const pineconeUrl = `${this.INDEX_HOST}/records/namespaces/default/search`;
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
            const response = await this.axios.post(pineconeUrl, requestData, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Api-Key': this.PINECONE_API_KEY,
                    'X-Pinecone-API-Version': 'unstable'
                }
            });

            return response.data;
        } catch (error) {
            console.error('Error querying Pinecone:', error.response?.data || error.message);
            throw error;
        }
    }
}