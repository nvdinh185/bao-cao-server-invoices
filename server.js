const express = require('express');
const app = express();

main = (isHttp) => {
    //CORS handle
    const cors = require('./handlers/cors-handler');
    app.use(cors.CorsHandler.cors);

    app.use('/report', require('./routes/report-route'));
    if (isHttp) {
        const httpServer = require('http').createServer(app);
        const portHttp = process.env.PORT || isHttp;
        httpServer.listen(portHttp, () => {
            console.log("Server HTTP is started with PORT: " + portHttp);
        });
    }
}

const isHttp = 8080;

main(isHttp);