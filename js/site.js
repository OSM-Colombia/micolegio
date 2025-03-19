/*
Este archivo JavaScript permite modificar la apareciencia de la página HTML,
mostrando y ocultando elementos.
También permite hacer algunas pocas validaciones sobre los datos datos.
Igualmente, maneja el mapa por medio de LeafLet.

Version 2025-03-19
*/

/**
 * Crea un objeto de tipo mapa con la librería Leaflet.
 */
var findme_map = L.map('findme-map')
    .setView([4, -72.7], 6),
    osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    osmAttrib = '© Contribuidores de OpenStreetMap. <a href="http://www.openstreetmap.org/copyright">Licencia</a>',
    osm = L.tileLayer(osmUrl, { minZoom: 6, maxZoom: 20, attribution: osmAttrib }).addTo(findme_map),
    category_data = [];

var findme_marker = L.marker([0, 0], { draggable: true }).addTo(findme_map);
findme_marker.setOpacity(1);

if (location.hash) location.hash = '';

/**
 * Hace zoom al punto definido y muestra una chincheta.
 * @param {*} chosen_place Ubicación deseada.
 * @param {*} map Mapa donde se debe mostrar.
 * @param {*} marker Chincheta.
 */
function zoom_to_point(chosen_place, map, marker) {
    // Imprime en consola el lugar escogido.
    console.log(chosen_place);

    marker.setOpacity(1);
    marker.setLatLng([chosen_place.lat, chosen_place.lon]);

    map.setView(chosen_place, 13, { animate: true });
}

/**
 * Procesa la ubicación gracias al mecanismo de ubicación del teléfono (GPS).
 */
$("#use_my_location").click(function (e) {
    $("#couldnt-find").hide();
    $("#success").hide();
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var point = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
            }

            zoom_to_point(point, findme_map, findme_marker);

            $('#success').html("<strong>¡Encontrado!</strong> Mueve la chincheta hasta que esté <strong>ubicada exactamente sobre tu colegio o escuela</strong>, preferiblemente en la mitad del establecimiento educativo.<br /><br />Te recomendamos que hagas bastante zoom para ubicar la chincheta correctamente.<br />Cuando la hayas ubicada bien, puedes pasar a la siguiente sección:<br /> <a href='javascript:check_coordinates()'><strong>Paso 2:</strong> Agregar información del establecimiento educativo</a>.");
            $('#success').show();
            window.scrollTo(0, $('#addressToFind').position().top - 30);
            $('.step-2 a').attr('href', '#details');
        }, function (error) {
            $("#couldnt-find").show();
        });
    } else {
        $("#couldnt-find").show();
    }
});

/**
 * Procesa una dirección para obtener su ubicación.
 */
$("#find").submit(function (e) {
    e.preventDefault();
    $("#couldnt-find").hide();
    $("#invalid-location").hide();
    $("#success").hide();
    var address_to_find = $("#addressToFind").val();
    if (address_to_find.length === 0) return;
    var qwarg = {
        format: 'json',
        q: address_to_find
    };
    var url = "https://nominatim.openstreetmap.org/search?" + $.param(qwarg);
    $("#findme h4").text('Buscando...');
    $("#findme").addClass("loading");
    $.getJSON(url, function (data) {
        if (data.length > 0) {
            zoom_to_point(data[0], findme_map, findme_marker);

            $('#success').html("<strong>¡Encontrado!</strong> Mueve la chincheta hasta que esté <strong>ubicada exactamente sobre tu colegio o escuela</strong>, preferiblemente en el centro del establecimiento educativo.<br /><br />Te recomendamos que hagas bastante zoom para ubicar la chincheta correctamente.<br />Cuando la hayas ubicada bien, puedes pasar a la siguiente sección:<br /> <a href='javascript:check_coordinates()'><strong>Paso 2:</strong> Agregar información del establecimiento educativo</a>.");
            $('#success').show();
            window.scrollTo(0, $('#addressToFind').position().top - 30);
            $('.step-2 a').attr('href', '#details');
        } else {
            $("#couldnt-find").show();
        }
        $("#findme").removeClass("loading");
    });
});

/**
 * Hace los cambios de la página de acuerdo al paso en el que se esté.
 * Lo reliza ocultando partes y activando otras.
 */
$(window).on('hashchange', function () {
    // Paso para dar los detalles de la institución (intermedio).
    if (location.hash == '#details') {
        $('#address-step').addClass('hide');
        $('#collect-data-step').removeClass('hide');
        $('#confirm-step').addClass('hide');
        $('.steps').addClass('on-2');
        $('.steps').removeClass('on-3');
    } else
        // Para para crear la nota (final).
        if (location.hash == '#done') {
            $('#address-step').addClass('hide');
            $('#collect-data-step').addClass('hide');
            $('#confirm-step').removeClass('hide');
            $('.steps').addClass('on-3');
        } else
        // Pasa definir la ubicaicón (inicial).
        {
            $('#address-step').removeClass('hide');
            $('#collect-data-step').addClass('hide');
            $('#confirm-step').addClass('hide');
            $('.steps').removeClass('on-2');
            $('.steps').removeClass('on-3');
        }
    findme_map.invalidateSize();
});

/**
 * Toma los datos del formulario y genera una URL para crear una nota anónima
 * en OSM. Comienza validando los datos del formulario, asegurándose que los
 * datos obligatorios están diligenciados.
 */
$("#collect-data-done").click(function () {
    // Basic form validation
    if ($("#institutionName").val().length < 5) {
        $("#form-invalid").text('Error: Ingresa el nombre completo del establecimiento (mínimo 5 caracateres).');
        return false;
    } else if ($("#institutionAddress").val().length < 10) {
        $("#form-invalid").text('Error: Ingresa una dirección válida (mínimo 10 caracteres).');
        return false;
    } else {
        $("#form-invalid").text("");
    }

    location.hash = '#done';

    var note_body =
        "Datos de la institución educativa: \n" +
        "amenity=school\n" +
        "name=" + $("#institutionName").val() + "\n" +
        "address=" + $("#institutionAddress").val() + "\n";

    if ($("#institutionPhone").val() != "") {
        var note_body = note_body +
            "phone=" + $("#institutionPhone").val() + "\n";
    }
    if ($("#website").val() != "") {
        var note_body = note_body +
            "website=" + $("#website").val() + "\n";
    }
    if ($("#institutionEmail").val() != "") {
        var note_body = note_body +
            "email= " + $("#institutionEmail").val() + "\n";
    }

    var operator_type = $("input[name='operator_type']:radio:checked").val();
    if (operator_type != null && operator_type != "unknown") {
        var note_body = note_body +
            "operator:type=" + operator_type + "\n";
    }
    if ($("#operator").val() != "") {
        var note_body = note_body +
            "operator=" + $("#operator").val() + "\n";
    }
    if ($("#min_age").val() != "") {
        var note_body = note_body +
            "min_age=" + $("#min_age").val() + "\n";
    }
    if ($("#max_age").val() != "") {
        var note_body = note_body +
            "max_age=" + $("#max_age").val() + "\n";
    }
    var calendario = $("input[name='service_times:ref:CO']:checked").val();
    if (calendario != null && calendario != "unknown") {
        var note_body = note_body +
            "service_times:ref:CO=" + calendario + "\n";
    }
    if ($("#religion").val() != "") {
        var note_body = note_body +
            "religion=" + $("#religion").val() + "\n";
    }

    var min_level = -1;
    var max_level = 7;
    var level0 =$("input[name='isced:level-0']:checked").val();
    var level1 =$("input[name='isced:level-1']:checked").val();
    var level2 =$("input[name='isced:level-2']:checked").val();
    var level3 =$("input[name='isced:level-3']:checked").val();
    var level4 =$("input[name='isced:level-4']:checked").val();
    if (level0) {
        if (min_level == -1) {
            var min_level = 0;
        }
        max_level = 0;
    }
    if (level1) {
        if (min_level == -1) {
            var min_level = 1;
        }
        max_level = 1;
    }
    if (level2) {
        if (min_level == -1) {
            var min_level = 2;
        }
        max_level = 2;
    }
    if (level3) {
        if (min_level == -1) {
            var min_level = 3;
        }
        max_level = 3;
    }
    if (level4) {
        if (min_level == -1) {
            var min_level = 4;
        }
        max_level = 4;
    }
    if (min_level != -1 && max_level != 7) {
        var note_body = note_body +
            "isced:level=" + min_level + "-" + max_level;
    }
    if ($("#female").is(":checked")) {
        var note_body = note_body +
            "female=yes\n";
    }
    if ($("#male").is(":checked")) {
        var note_body = note_body +
            "male=yes\n";
    }
    if ($("#fee").is(":checked")) {
        var note_body = note_body +
            "fee=yes\n";
    }
    if ($("#language").val() != "") {
        var note_body = note_body +
            "language=" + $("#language").val() + "\n";
    }
    if ($("#wikipedia").val() != "") {
        var note_body = note_body +
            "wikipedia=" + $("#wikipedia").val() + "\n";
    }
    if ($("#wikidata").val() != "") {
        var note_body = note_body +
            "wikidata=" + $("#wikidata").val() + "\n";
    }
    var note_body = note_body + "\n";
    if ($("#notes").val() != "") {
        var note_body = note_body +
            "Notas: " + $("#notes").val() + "\n";
    }
    var note_body = note_body +
        "\n" +
        "Revisar school=*.\n" +
        "Adaptar grades=*.\n" +
        "En el caso de religión, adaptar denomination=*.\n" +
        "\n" +
        "#CO #OSM-Colombia #AC3 https://osm-colombia.github.io/micolegio/\n",
        latlon = findme_marker.getLatLng(),
        note_data = {
            lat: latlon.lat,
            lon: latlon.lng,
            text: note_body
        };

    // Imprime en consola el contenido de la nota.
    // console.log(note_body);


    // Crea la nota por medio de un la generación de la URL.
    $.post(
        'https://api.openstreetmap.org/api/0.6/notes.json',
        note_data,
        function (result) {
            var id = result.properties.id;
            $("#linkcoords").append(
                '<a href="https://osm.org/note/' + id + '">https://osm.org/note/' + id + '</a>'
            );
        }
    );
});

/**
 * Restablece los campos para insertar otro colegio. Limpia los campos que se
 * habían diligenciado anteriormente.
 */
function clearFields() {
    $("#institutionName").val('');
    $("#institutionPhone").val('');
    $("#website").val('');
    $("#operator_type").val('');
    $("#operator").val('');
    $("#min_age").val('');
    $("#max_age").val('');
    $("#service_times:ref:CO").val('');
    $("#religion").val('');

    $("#institutionAddress").val('');
    $("#institutionEmail").val('');
    $("#isced:level").val('');
    $("#female").val('');
    $("#male").val('');
    $("#fee").val('');
    $("#language").val('');
    $("#wikipedia").val('');
    $("#wikidata").val('');

    $("#notes").val('');
    $("#linkcoords").empty();
}

/**
 * Chequea las coordenadas antes de pasar el siguiente paso. Si están bien,
 * activa la sección de detalles; si está mal, muestra un mensaje de error.
 */
function check_coordinates() {
    var latlon = findme_marker.getLatLng();

    if ((latlon.lat != 0) || (latlon.lng != 0)) {
        location.hash = '#details';
    } else {
        $("#invalid-location").show();
    }
}
