# Reglas del proyecto

## Alertas y confirmaciones

- Nunca utilizar los diálogos nativos del navegador: `window.alert`, `window.confirm` o `window.prompt`.
- Para mensajes informativos, errores y éxitos, utilizar `ToastContext` y los componentes de notificación existentes.
- Para confirmar acciones importantes o destructivas, utilizar siempre `src/components/ui/ConfirmDialog.tsx`.
- Las confirmaciones deben indicar claramente la acción, sus consecuencias y ofrecer botones visibles para confirmar o cancelar.

## Fechas y horas

- Todas las fechas y horas visibles para el usuario deben estar formateadas en español y ser entendibles; nunca mostrar fechas numéricas ambiguas como `1/9/26`.
- Usar el formato largo localizado, por ejemplo: `1 de septiembre de 2026, 11:34 p. m.`, respetando la zona horaria configurada por la aplicación.
