import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { Screen } from '../../components/Screen';
import * as bio from '../../lib/biometria';
import { useTheme, useStyles, typography, spacing, radius } from '../../lib/theme';

function Fila({ titulo, detalle, valor, onCambio, deshabilitado }) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  return (
    <View style={[styles.fila, deshabilitado && { opacity: 0.5 }]}>
      <View style={{ flex: 1, paddingRight: spacing.md }}>
        <Text style={styles.filaTitulo}>{titulo}</Text>
        {detalle ? <Text style={styles.filaDetalle}>{detalle}</Text> : null}
      </View>
      <Switch
        value={valor}
        onValueChange={onCambio}
        disabled={deshabilitado}
        trackColor={{ true: colors.accent }}
      />
    </View>
  );
}

export default function AjustesScreen() {
  const styles = useStyles(makeStyles);
  const [hayLector, setHayLector] = useState(false);
  const [huella, setHuella] = useState(false);

  const cargar = useCallback(async () => {
    setHayLector(await bio.disponible());
    setHuella(await bio.activada());
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarHuella = async (on) => {
    if (!on) {
      await bio.desactivar();
      setHuella(false);
      return;
    }
    // Pedimos la huella antes de activarla: si no la reconoce, no serviría
    if (await bio.pedir('Confirma tu huella para activarla')) {
      await bio.activar();
      setHuella(true);
    }
  };


  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.lista}>
        <Text style={styles.seccion}>Seguridad</Text>
        <View style={styles.card}>
          <Fila
            titulo="Entrar con huella"
            detalle={hayLector
              ? 'Pide tu huella al abrir la app. No guarda tu contraseña.'
              : 'Este teléfono no tiene lector o no hay huellas registradas.'}
            valor={huella}
            onCambio={cambiarHuella}
            deshabilitado={!hayLector}
          />
        </View>

      </ScrollView>
    </Screen>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  lista: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 60 },
  seccion: {
    color: colors.text4, fontSize: typography.xs, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: spacing.md, marginBottom: 2,
  },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, gap: spacing.sm,
  },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filaTitulo: { color: colors.text, fontSize: typography.base, fontWeight: '600' },
  filaDetalle: { color: colors.text4, fontSize: typography.xs, marginTop: 2, lineHeight: 16 },
});
