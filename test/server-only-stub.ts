/**
 * `server-only` lanza al importarse fuera de un Server Component. En las
 * pruebas eso impediría verificar la capa de datos, que es justo donde vive
 * el aislamiento entre usuarios. Se sustituye por un módulo vacío.
 */
export {};
