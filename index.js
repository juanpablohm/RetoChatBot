//Módulos necesarios
const express = require('express');
const path = require('path');
const bodyParser = require("body-parser");
const fs = require('fs');

//Configuración general servidor
const app = express();
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname)));
app.use(bodyParser.json({limit: '150mb'}));
app.use(bodyParser.urlencoded({limit: '150mb', extended: true}));

//Endpoints de la app
require("./routes.js")(app);

//Escuchar por el purto 3000
app.listen(3000, () => {
  console.log(`Servidor iniciado en el puerto: ${3000}`);
});