const port= 3000;
const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const ruta_json = path.join(__dirname, 'tickets.json');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

function leerTickets() {
    const tickets = JSON.parse(fs.readFileSync(ruta_json, 'utf8'));
    let siguienteId = 1;

    for (let i = 0; i < tickets.length; i++) {
        if (tickets[i].id >= siguienteId) {
            siguienteId = tickets[i].id + 1;
        }
    }

    let actualizados = false;

    for (let i = 0; i < tickets.length; i++) {
        if (!tickets[i].id) {
            tickets[i].id = siguienteId;
            siguienteId++;
            actualizados = true;
        }
    }

    if (actualizados) {
        fs.writeFileSync(ruta_json, JSON.stringify(tickets));
    }

    return tickets;
}

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.render('inicio', { titulo: 'Inicio' });
});

app.get('/reportar', (req, res) => {
    res.render('reportar', { message: null, titulo: 'Reportar Problema' });
});
    
app.post('/reportar', (req, res) => {
    const {titulo, nombre, correo, descripcion } = req.body;
    try {
        const tickets = leerTickets();
        let siguienteId = 1;
        for (let i = 0; i < tickets.length; i++) {
            if (tickets[i].id >= siguienteId) {
                siguienteId = tickets[i].id + 1;
            }
        }
        const nuevoTicket = { id: siguienteId, titulo, nombre, correo, descripcion };
        tickets.push(nuevoTicket);
        fs.writeFileSync(ruta_json, JSON.stringify(tickets));

    } catch (error) {
        console.error('Error al guardar el ticket:', error);
        res.status(500).send('Error al guardar el ticket');
        return;
    }

    // Redirigir a la página de éxito o mostrar un mensaje de confirmación
    res.render('exito', { nombre, titulo, correo, descripcion, message: '¡Reporte enviado con éxito!' });
});

app.get('/panel', (req, res) => {
    const reportes = leerTickets();
    res.render('panel', { reportes, titulo: 'Panel de Reportes' });
});

app.get('/resolver', (req, res) => {
    const reportes = leerTickets().filter((reporte) => !reporte.solucion);
    res.render('resolver', { reportes, reporte: null, titulo: 'Resolver Reporte' });
});

app.get('/resolver/:id', (req, res) => {
    const reporte = leerTickets().find((ticket) => ticket.id === Number(req.params.id));
    if (!reporte) {
        res.status(404).send('No se encontró el reporte solicitado');
        return;
    }
    res.render('resolver', { reporte, titulo: 'Resolver Reporte' });
});
app.post('/resolver/:id', (req, res) => {
    const { solucion } = req.body;
    const reportes = leerTickets();
    const reporte = reportes.find((ticket) => ticket.id === Number(req.params.id));
    if (!reporte) {
        res.status(404).send('No se encontró el reporte solicitado');
        return;
    }
    reporte.solucion = solucion;

    fs.writeFileSync(ruta_json, JSON.stringify(reportes));

    res.render('exito', { nombre: reporte.nombre, titulo: reporte.titulo, correo: reporte.correo, descripcion: reporte.descripcion, message: '¡Reporte resuelto con éxito!' });
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
