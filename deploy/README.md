# Despliegue

Polling: cada minuto revisa `origin/main`. Si no hay commits nuevos, sale.

Se eligió polling y no webhook porque el servidor está detrás de Tailscale,
sin puertos abiertos: GitHub no puede alcanzarlo.

## Instalar (una vez, en el servidor)

```bash
sudo cp /var/www/viernes/deploy/viernes-deploy.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now viernes-deploy.timer
```

## Ver qué está pasando

```bash
systemctl list-timers viernes-deploy.timer     # cuándo corre la próxima
journalctl -u viernes-deploy.service -f        # log en vivo
systemctl start viernes-deploy.service         # correr el ciclo ya
```

Si no hay commits nuevos el script sale sin hacer nada. Para desplegar de
todas formas — instalación inicial, cambio en un `.env`, build a medias:

```bash
sudo FORZAR=1 /var/www/viernes/deploy/deploy.sh
```

## Migraciones

El script respalda la base con `pg_dump` ANTES de migrar. Si el respaldo
falla, aborta y no migra.

Si una migración nueva trae `drop_table` o `drop_column`, **el deploy se
detiene**. Es a propósito: en mayo de 2026 una migración autogenerada borró
`piezas` y las tablas `website_*` en producción. Para aplicarla, revísala a
mano y luego:

```bash
sudo PERMITIR_DROPS=1 /var/www/viernes/deploy/deploy.sh
```

Respaldos en `/var/backups/viernes/`. Conviene borrar los viejos de vez en cuando.
