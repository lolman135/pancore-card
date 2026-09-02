/* Версія env.js для compose: nginx роздає статику і проксує /api/ на бекенд,
   тому origin спільний і адресу вказувати не треба.
   Підмонтовується поверх js/env.js у сервісі nginx (див. compose.yaml).
   Для запуску без Docker використовується згенерований js/env.js. */
export const API_BASE = '';
