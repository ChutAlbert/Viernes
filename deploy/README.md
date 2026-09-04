# Despliegue

Polling: cada minuto revisa `origin/main`. Si no hay commits nuevos, sale.

Se eligió polling y no webhook porque el servidor está detrás de Tailscale,
sin puertos abiertos: GitHub no puede alcanzarlo.

## Instalar (una vez, en el servidor)

El script corre como el dueño del repo (`jesus`), **no como root**: la llave
SSH de GitHub es suya. Root solo hace falta para reiniciar el backend, y eso
se concede con una regla de sudoers acotada a ese único comando.

```bash
# 1. Carpeta de respaldos, propiedad del usuario
sudo mkdir -p /var/backups/viernes && sudo chown jesus:jesus /var/backups/viernes

# 2. Permitir solo el restart, sin contraseña
#    Verifica antes la ruta real:  which systemctl
echo 'jesus ALL=(root) NOPASSWD: /usr/bin/systemctl restart viernes-backend'   | sudo tee /etc/sudoers.d/viernes-deploy
sudo chmod 440 /etc/sudoers.d/viernes-deploy

# 3. Unidades de systemd
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
FORZAR=1 /var/www/viernes/deploy/deploy.sh
```

## Migraciones

El script respalda la base con `pg_dump` ANTES de migrar. Si el respaldo
falla, aborta y no migra.

Si una migración nueva trae `drop_table` o `drop_column`, **el deploy se
detiene**. Es a propósito: en mayo de 2026 una migración autogenerada borró
`piezas` y las tablas `website_*` en producción. Para aplicarla, revísala a
mano y luego:

```bash
PERMITIR_DROPS=1 /var/www/viernes/deploy/deploy.sh
```

Respaldos en `/var/backups/viernes/`. Conviene borrar los viejos de vez en cuando.
