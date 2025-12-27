import * as functions from "firebase-functions";
import * as path from "path";
import * as fs from "fs";

const Afip = require("@afipsdk/afip.js");

export const testAfip = functions.https.onRequest(async (req, res) => {
    const versionApp = "1.1.0 - RI STATUS"; 
    
    try {
        const certPath = path.join(__dirname, "../certs/certificado.crt");
        const keyPath = path.join(__dirname, "../certs/privada.key");
        
        const certContent = fs.readFileSync(certPath, "utf8");
        const keyContent = fs.readFileSync(keyPath, "utf8");

        const afip = new Afip({
            CUIT: 20308002870,
            cert: certContent,
            key: keyContent,
            production: true, // Siempre TRUE para tu certificado
            ta_folder: "/tmp/" 
        });

        /**
         * Intentamos pedir el número de la última FACTURA B (Tipo 6) 
         * para el Punto de Venta 2.
         * Si esto responde un número, ¡EL SISTEMA YA PUEDE FACTURAR!
         */
        const lastVoucher = await afip.ElectronicBilling.getLastVoucher(2, 6); 
        
        res.status(200).send({
            status: "¡CONECTADO CON ÉXITO!",
            version: versionApp,
            contribuyente: "SERASSIO MAURICIO (RI)",
            punto_de_venta: 2,
            ultima_factura_b: lastVoucher,
            mensaje: "El motor de facturación está listo para emitir comprobantes reales."
        });

    } catch (error: any) {
        res.status(500).send({
            status: "ERROR_DE_AUTORIZACION",
            version: versionApp,
            detalle: error.message || String(error),
            nota: "Si el error es 401, por favor espera 30 min a que ARCA procese la delegación de hoy."
        });
    }
});