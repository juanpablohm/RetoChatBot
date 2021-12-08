const path = require('path');
const bodyParser = require("body-parser");
const fs = require('fs');


module.exports = function(app){

//Archivo JSON con los usuarios
const json_usuarios = fs.readFileSync('./data/Usuarios.json');
let usuarios = JSON.parse(json_usuarios);

//Archivo JSON con las citas
const json_citas = fs.readFileSync('./data/Citas.json');
let citas = JSON.parse(json_citas);

//Main page
app.get('/', function(req, res){
    res.sendFile(__dirname + '/views/index.html');
});
  
//Función validar existencia de codigo de tramites
app.get("/codigoTramite/:codeSearch", (req,res)=>{
    res.setHeader("Content-Type", "application/json");
  
    const codeSearch = req.params.codeSearch; 

    for(var i = 0; i < usuarios.length; i++) {
        if(usuarios[i].codigoTramites.toLowerCase()  == codeSearch.toLowerCase() )
            return res.json(true);
    }  
    return res.json(false);
});


//Función para consultar estado de cita
app.get("/consultarCita/:idCita", (req,res)=>{
  res.setHeader("Content-Type", "application/json");

  const codeSearch = req.params.idCita;   

  for(var i = 0; i < citas.length; i++) {
      if(citas[i].codigoCita.toLowerCase()  == codeSearch.toLowerCase() )
          return res.json(citas[i]);
  }  
  return res.json(null);
});


//Función buscar usuario por id
app.get("/getUser/:idSearch", (req,res)=>{
    res.setHeader("Content-Type", "application/json");
  
    const idSearch = req.params.idSearch;
    
    for(var i = 0; i < usuarios.length; i++) {
        if(usuarios[i].id == parseInt(idSearch))
            return res.json(usuarios[i]);
    }  
    return res.json(null);
  });


 //Obtener todas la citas
app.get("/citas", (req,res)=>{
  res.setHeader("Content-Type", "application/json");
  return res.json(citas);
});
  
//Volver PascalCase un string
function pascalize(str) {
  return str.replace(/(\w)(\w*)/g,function(g0,g1,g2){return g1.toUpperCase() + g2.toLowerCase();});
}

//Añadir nuevo usuario
app.post('/newUser', function(req, res, next) {
      // Establecer el tipo MIME de la respuesta
      res.setHeader("Content-Type", "application/json");
  
      codigoTramites = "CT" + (100 + usuarios.length);
      
      var newUser = { "nombre": pascalize(req.body.nombre), "apellido": pascalize(req.body.apellido), "id": req.body.id, "codigoTramites": codigoTramites };

      usuarios.push(newUser);
  
      fs.writeFileSync("./data/Usuarios.json", JSON.stringify(usuarios ,null, "\t"), function(err) {
        if (err) throw err;
          console.log('complete');
        }
      );
      return res.json(newUser);
});

//Añadir nuevo usuario
app.post('/changeState', function(req, res, next) {
  // Establecer el tipo MIME de la respuesta
  res.setHeader("Content-Type", "application/json");

  for(var i = 0; i < citas.length; i++) {
    if(citas[i].codigoCita.toLowerCase()  == req.body.codigo.toLowerCase() ){
      citas[i].especialista = req.body.especialista;
      citas[i].fecha = req.body.fecha;
      citas[i].hora = req.body.hora;
      citas[i].estado = "asignada";
    }        
  }  

  fs.writeFileSync("./data/Citas.json", JSON.stringify(citas ,null, "\t"), function(err) {
    if (err) throw err;
      console.log('complete');
    }
  );
  
  return res.json(true);
});
  
//Añadir nueva cita
app.post('/newCita', function(req, res, next) {
  // Establecer el tipo MIME de la respuesta
  res.setHeader("Content-Type", "application/json");

  codigoCita = "CC" + (100 + citas.length);

  var newCita = { "nombre": pascalize(req.body.nombre), 
                  "apellido": pascalize(req.body.apellido), 
                  "id": req.body.id, 
                  "EPS": req.body.eps,
                  "URL": req.body.url,
                  "estado": "tramite",
                  "especialista": null ,
                  "hora": null,
                  "fecha": null,
                  "codigoCita": codigoCita
                 };

  citas.push(newCita);

  fs.writeFileSync("./data/Citas.json", JSON.stringify(citas ,null, "\t"), function(err) {
    if (err) throw err;
      console.log('complete');
    }
  );
  return res.json(newCita);
});


}