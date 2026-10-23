import { useEstilosTematicos } from '@/core/tema/contexto-tema';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Idoso } from '@/core/api/cliente-api';
import { art, colors, d as dBase } from '@/components/ui/design-system';

export function SeletorPessoa({
  people,
  selected,
  onSelect,
}: {
  people: Idoso[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const s = useEstilosTematicos(sBase);
  const estilosDaTela = useEstilosTematicos(dBase);

  const person = people.find((item) => item.id === selected);
  return (
    <View style={s.wrap}>
      <View style={s.person}>
        <View style={s.avatar}>
          <Image source={art.elder} style={s.image} resizeMode="contain" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>PESSOA ACOMPANHADA</Text>
          <Text style={estilosDaTela.subheading}>{person?.nome || 'Selecione uma pessoa'}</Text>
          {!!person?.nascimento && (
            <Text style={estilosDaTela.muted}>
              Nascimento: {person.nascimento.split('-').reverse().join('/')}
            </Text>
          )}
        </View>
      </View>
      {people.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.options}
        >
          {people.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              aria-selected={selected === item.id}
              accessibilityState={{ selected: selected === item.id }}
              onPress={() => onSelect(item.id)}
              style={[s.option, selected === item.id && s.selected]}
            >
              <Text style={[s.optionText, selected === item.id && s.selectedText]}>
                {item.nome.split(' ')[0]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const sBase = StyleSheet.create({
  wrap: { gap: 10 },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.purple,
  },
  avatar: {
    width: 53,
    height: 53,
    borderRadius: 27,
    backgroundColor: colors.pale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: 50, height: 50 },
  label: {
    color: colors.purple,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  options: { gap: 8, paddingRight: 5 },
  option: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.line,
  },
  selected: { backgroundColor: colors.purple, borderColor: colors.purple },
  optionText: { color: colors.muted, fontSize: 13 },
  selectedText: { color: 'white', fontWeight: '700' },
});
