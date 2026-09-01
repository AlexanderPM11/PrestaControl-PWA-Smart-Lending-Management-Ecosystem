# Reglas del proyecto

## Alertas y confirmaciones

- Nunca utilizar los diálogos nativos del navegador: `window.alert`, `window.confirm` o `window.prompt`.
- Para mensajes informativos, errores y éxitos, utilizar `ToastContext` y los componentes de notificación existentes.
- Para confirmar acciones importantes o destructivas, utilizar siempre `src/components/ui/ConfirmDialog.tsx`.
- Las confirmaciones deben indicar claramente la acción, sus consecuencias y ofrecer botones visibles para confirmar o cancelar.
