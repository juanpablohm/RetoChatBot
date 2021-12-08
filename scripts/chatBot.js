window.addEventListener("dfMessengerLoaded", function(event){

    //Configuraciones del chatbot dialogflow
    $r1 = document.querySelector("df-messenger");
    $r2 = $r1.shadowRoot.querySelector("df-messenger-chat");
    $r3 = $r2.shadowRoot.querySelector("df-messenger-user-input"); //for other mods
    var sheet = new CSSStyleSheet;
    // manage box height from here
    sheet.replaceSync( `div.chat-wrapper[opened="true"] { height: 380px }`);
    $r2.shadowRoot.adoptedStyleSheets = [ sheet ];
    

    var dataUser = null;
    const dfMessenger = document.querySelector('df-messenger');
    
    dfMessenger.addEventListener('df-response-received', function (event) {
        //console.log(event);
        if (event.detail.response){

            data = event.detail.response;

            if(data.queryResult.fulfillmentText == "Espera un momento valido tu registro..."){
                  
                id = data.queryResult.parameters.id; 
                
                fetch("http://127.0.0.1:3000/getUser/" + id ,{
                    method:"GET",
                    headers: {"Content-Type" : "application/json"}
                }).then(res => res.json())
                .then(res => {  
                    setTimeout(function(){  
                        if(res != null){
                            document.querySelector('df-messenger').renderCustomText("Usted ya se encuentra registrado, su codigo de tramites es: " + res.codigoTramites);
                        }
                        else{       
                            
                            fetch('http://127.0.0.1:3000/newUser',{
                            method: 'POST', // or 'PUT'
                            body:  JSON.stringify(data.queryResult.parameters), // data can be `string` or {object}!
                            headers:{ 'Content-Type': 'application/json'}
                            }).then(res => res.json())
                            .catch(error => console.error('Error:'))
                            .then(function(res){
                                document.querySelector('df-messenger').renderCustomText("¡Perfecto " + res.nombre + "! has sido registrado exitosamente. Codigo para consulta de tramites " + res.codigoTramites + ". Hasta pronto.");            
                            });
                        }
                    }, 1200);          
            });   
          }else if(data.queryResult.fulfillmentText == "Espera un momento consulto el estado de tu cita..."){
                
            codCita = data.queryResult.parameters.codigoCita; 
            
            fetch("http://127.0.0.1:3000/consultarCita/" + codCita ,{
                    method:"GET",
                    headers: {"Content-Type" : "application/json"}
            }).then(res => res.json())
            .then(function(res){
                setTimeout(function(){ 
                    if(res != null){
                        if(res.estado == "tramite"){
                            document.querySelector('df-messenger').renderCustomText( res.nombre + " tu cita se encuentra en tramite, vuelve a consultar mas tarde.");
                        }else{
                            document.querySelector('df-messenger').renderCustomText( res.nombre + " tu cita ya fue asignada:" + "\n" + "Nombre especialista: " + res.especialista +" \n Fecha: " + res.fecha+ " \n Hora: " +  res.hora + "\n" + "Te esperamos pronto.");
                        }
                    }else{
                        document.querySelector('df-messenger').renderCustomText( "El codigo de cita ingresado no es valido, comprueba tus datos");
                    }
                }, 1200);
            });
          }else if(data.queryResult.fulfillmentText == "Espera un momento valido tu código..."){
                
                codTramite = data.queryResult.parameters.codigoTramites; 

                fetch("http://127.0.0.1:3000/codigoTramite/" + codTramite ,{
                    method:"GET",
                    headers: {"Content-Type" : "application/json"}
                }).then(res => res.json())
                .then(function(res){
                    setTimeout(() => {
                        if(res){
                            document.querySelector('df-messenger').renderCustomText('¡Perfecto! ¿En qué te puedo ayudar?');

                            payload = [ {
                                    "type": "chips",
                                    "options": [{ "text": "Solicitar cita"}, {"text": "Consultar estado cita"}]
                            } ]              
                            document.querySelector('df-messenger').renderCustomCard(payload);
                        }else{
                            document.querySelector('df-messenger').renderCustomText('Lo siento, el código de tramites ingresado no es valido, compruebe los datos.');
                        }
                    }, 1200);
                });
          }else if(data.queryResult.fulfillmentText.includes("¡Muy bien ! Estos son los datos que ingresaste")){

            //console.log(data.queryResult.parameters);
            dataUser = data.queryResult.parameters

         }else if(data.queryResult.fulfillmentText == "Espera un momento envío tú solicitud..."){

            //console.log(dataUser);

            fetch('http://127.0.0.1:3000/newCita',{
                method: 'POST', // or 'PUT'
                body:  JSON.stringify(dataUser), // data can be `string` or {object}!
                headers:{ 'Content-Type': 'application/json'}
                }).then(res => res.json())
                .catch(error => console.error('Error:'))
                .then(function(res){
                   //console.log(res);    
                   if(res != null){
                        refrescarCitas();
                        document.querySelector('df-messenger').renderCustomText("¡Perfecto " + res.nombre + "! La solicitud de cita ha sido enviada. El código para consulta el estado de tu cita es: " + res.codigoCita + ". Hasta pronto.");            
                   }else{
                        document.querySelector('df-messenger').renderCustomText("Ha ocurrido un error, intentalo más tarde");
                   }
            });

          }

        }
    });

    refrescarCitas();
});

function atenderCita(e){

    var data = document.getElementsByClassName(e.id);
    
    fecha = data[1].value.split(" ");

    send = {
        "codigo": e.id,
        "especialista" : data[0].value,
        "fecha": fecha[0],
        "hora" : fecha[1] + fecha[2]
    }

    if(fecha.length != 3){
        alert("Debe asignarle una fecha a la cita")
    }else{

        fetch('http://127.0.0.1:3000/changeState',{
            method: 'POST', // or 'PUT'
            body:  JSON.stringify(send), // data can be `string` or {object}!
            headers:{ 'Content-Type': 'application/json'}
            }).then(res => res.json())
            .catch(error => console.error('Error:'))
            .then(function(res){

                if(res)
                    refrescarCitas();
            });
    } 
}

function changePicker(e){  
    $("#"+e.id).datetimepicker();
}

function refrescarCitas(){

    fetch("http://127.0.0.1:3000/citas",{
        method:"GET",
        headers: {"Content-Type" : "application/json"}
    }).then(res => res.json())
    .then(function(res){

        var asignadas = "";
        var solicitud = "";

        res.forEach(cita => {

            if(cita.estado == "asignada"){
                asignadas += '<tr>' +
                '<td>' + cita.nombre + " " + cita.apellido + '</td>' +
                '<td>' + cita.id + '</td>' +
                '<td>' + cita.EPS + '</td>' +
                '<td>' + cita.URL + '</td>' +
                '<td>' + cita.especialista + '</td>' +
                '<td>' + cita.fecha + '-' + cita.hora +  '</td>' +
                '<td>' + cita.codigoCita + '</td>' +
                '</tr>' + "\n";
                
            }else{

                solicitud +=  '<tr>'+
                '<th>' + cita.nombre + " " + cita.apellido +'</th>'+
                '<th>'+ cita.id + '</th>'+
                '<th>'+ cita.EPS +'</th>'+
                '<th>'+ cita.URL +'</th>'+
                '<th>'+ cita.codigoCita +'</th>'+
                '<th> <select class="form-control '+cita.codigoCita+'"> <option>Dr. Carlos Matiz</option>  <option>Dr. Rafael Enrique Conde Camacho</option> <option>Dr. Juan Pablo Rodríguez Gallego</option></select></th>' +
                '<th> <div class="form-group"><div class="input-group date" onclick="changePicker(this)" id="'+cita.codigoCita+'"><input type="text" class="form-control  '+cita.codigoCita+'" /><span class="input-group-addon"><span class="glyphicon glyphicon-calendar"></span> </span></div></div></th>  ' +
                '<th> <button class="btn btn-success" id="'+cita.codigoCita+'" onclick="atenderCita(this)"><i class="fa fa-check-square"></i></button></th> ' + "\n";
                         
            }
        });

        document.getElementById('bodyCitas').innerHTML = asignadas;
        document.getElementById('bodySolicitudes').innerHTML = solicitud;
    })


};