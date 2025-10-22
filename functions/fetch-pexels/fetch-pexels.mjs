// Docs on request and context https://docs.netlify.com/functions/build/#code-your-function-2

import axios from "axios";

export async function handler(event, context) {
    try {
        const {query} = event.queryStringParameters || {};

        if (!query) {
            return {
                statusCode: 400,
                body: JSON.stringify({error: "Missing query parameter query"}),
            };
        }

        const API_PEXELS = process.env.API_PEXELS;
        console.log(query);
        const url = `https://api.pexels.com/v1/search`;

        const {data} = await axios.get(url, {
            params: {
                query: query,
                orientation: "landscape",
                per_page: 1
            },
            headers: {
                Authorization: API_PEXELS
            }
        });

        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (error) {
        const resp = error.response;
        const status = resp.status;
        const payload = {
            message: error.message,
            responseData: resp.data,
            responseHeaders: resp.headers
        };

        return {
            statusCode: status,
            body: JSON.stringify(payload),
        };
    }
}