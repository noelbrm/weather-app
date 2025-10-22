// Docs on request and context https://docs.netlify.com/functions/build/#code-your-function-2

import axios from "axios";

export async function handler(event, context) {
    try {
        const {q} = event.queryStringParameters || {};

        if (!q) {
            return {
                statusCode: 400,
                body: JSON.stringify({error: "Missing query parameter q"}),
            };
        }

        const API_WEATHER = process.env.API_WEATHER;
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(q)}&appid=${API_WEATHER}&units=metric`;

        const {data} = await axios.get(url);

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