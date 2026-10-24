import { useRef, useState } from 'react';
import { Animated, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ingredientImage, useDishImage } from '../lib/images';
import { Meal, MEALS } from '../lib/model';
import { Recipe } from '../lib/recipes';
import { useStore } from '../lib/store';
import { useTheme } from '../theme';
import { haptic, PressScale, useToast } from './motion';
import { Button, Muted } from './ui';

/** A photo that fades in once loaded and falls back to a tinted tile with a letter. */
function Photo({ uri, label, size, radius = 12, tint }: { uri: string | null; label: string; size: { width: number | `${number}%`; height: number }; radius?: number; tint?: string }) {
  const t = useTheme();
  const [failed, setFailed] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  return (
    <View style={{ ...size, borderRadius: radius, overflow: 'hidden', backgroundColor: tint ?? t.chip, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: t.muted, fontWeight: '800', fontSize: Math.min(28, size.height / 3) }}>{label.slice(0, 1).toUpperCase()}</Text>
      {uri && !failed ? (
        <Animated.Image
          source={{ uri }}
          onLoad={() => Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: Platform.OS !== 'web' }).start()}
          onError={() => setFailed(true)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: fade }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : null}
    </View>
  );
}

export function FoodThumb({ img, name, size = 40 }: { img?: string; name: string; size?: number }) {
  const t = useTheme();
  return <Photo uri={img ? ingredientImage(img) : null} label={name} size={{ width: size, height: size }} radius={size / 2} tint={t.surface} />;
}

export function RecipePhoto({ recipe, height, radius = 12 }: { recipe: Recipe; height: number; radius?: number }) {
  const uri = useDishImage(recipe.imageQuery, recipe.mainIngredient, recipe.title);
  return <Photo uri={uri} label={recipe.title} size={{ width: '100%', height }} radius={radius} />;
}

export function RecipeCard({ recipe, onPress, width = 200 }: { recipe: Recipe; onPress: () => void; width?: number }) {
  const t = useTheme();
  return (
    <PressScale onPress={onPress} accessibilityRole="button" accessibilityLabel={`${recipe.title}, ${recipe.kcal} calories`} style={{ width, backgroundColor: t.surface, borderRadius: 14, borderWidth: 1, borderColor: t.line, overflow: 'hidden' }}>
      <RecipePhoto recipe={recipe} height={width * 0.62} radius={0} />
      <View style={{ padding: 10, gap: 3 }}>
        <Text numberOfLines={2} style={{ color: t.ink, fontWeight: '700', fontSize: 14 }}>{recipe.title}</Text>
        <Text style={{ color: t.muted, fontSize: 12 }}>
          <Text style={{ color: t.accent, fontWeight: '700' }}>{recipe.kcal} kcal</Text> · {recipe.p} g protein · {recipe.minutes} min
        </Text>
      </View>
    </PressScale>
  );
}

/** Full recipe in a bottom sheet, with one-tap logging and saving. */
export function RecipeSheet({ recipe, onClose }: { recipe: Recipe | null; onClose: () => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { addEntry, saved, toggleSaved } = useStore();
  const [meal, setMeal] = useState<Meal | null>(null);
  if (!recipe) return null;
  const chosen = meal ?? recipe.meal;
  const isSaved = saved.some((r) => r.title === recipe.title);

  const log = () => {
    addEntry({ name: recipe.title, kcal: recipe.kcal, p: recipe.p, c: recipe.c, f: recipe.f, meal: chosen, img: recipe.mainIngredient });
    haptic.success();
    toast(`Logged ${recipe.title} to ${chosen}`);
    setMeal(null);
    onClose();
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: '#0008' }} onPress={onClose} accessibilityLabel="Close recipe" />
      <View style={{ maxHeight: '88%', backgroundColor: t.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden' }}>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
          <RecipePhoto recipe={recipe} height={220} radius={0} />
          <View style={{ padding: 18, gap: 14 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ color: t.ink, fontSize: 22, fontWeight: '800' }}>{recipe.title}</Text>
              <Muted>{recipe.meal} · {recipe.minutes} min · per serving</Muted>
              {recipe.why ? <Text style={{ color: t.ink, marginTop: 4 }}>{recipe.why}</Text> : null}
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                [String(recipe.kcal), 'kcal', t.accent],
                [`${recipe.p} g`, 'protein', t.protein],
                [`${recipe.c} g`, 'carbs', t.carbs],
                [`${recipe.f} g`, 'fat', t.fat],
              ].map(([v, l, c]) => (
                <View key={l} style={{ flex: 1, backgroundColor: t.surface, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: t.line }}>
                  <Text style={{ color: c, fontWeight: '800', fontSize: 17 }}>{v}</Text>
                  <Muted style={{ fontSize: 11 }}>{l}</Muted>
                </View>
              ))}
            </View>

            <View style={{ gap: 6 }}>
              <Text style={{ color: t.ink, fontWeight: '800', letterSpacing: 1 }}>INGREDIENTS</Text>
              {recipe.ingredients.map((x, i) => (
                <Text key={i} style={{ color: t.ink }}>•  {x}</Text>
              ))}
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ color: t.ink, fontWeight: '800', letterSpacing: 1 }}>STEPS</Text>
              {recipe.steps.map((x, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                  <Text style={{ color: t.accent, fontWeight: '800', width: 18 }}>{i + 1}</Text>
                  <Text style={{ color: t.ink, flex: 1, lineHeight: 20 }}>{x}</Text>
                </View>
              ))}
            </View>

            <View style={{ gap: 8 }}>
              <Muted>Log it as</Muted>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {MEALS.map((m) => (
                  <Pressable
                    key={m} onPress={() => { haptic.tap(); setMeal(m); }} accessibilityState={{ selected: m === chosen }}
                    style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: m === chosen ? t.accent : t.line, backgroundColor: m === chosen ? t.accent : 'transparent' }}
                  >
                    <Text style={{ color: m === chosen ? t.accentInk : t.ink, fontWeight: '600', fontSize: 13 }}>{m}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 2 }}><Button label={`Log to ${chosen}`} onPress={log} /></View>
              <View style={{ flex: 1 }}>
                <Button ghost label={isSaved ? 'Saved ✓' : 'Save'} onPress={() => { haptic.tap(); toggleSaved(recipe); toast(isSaved ? 'Removed from saved' : 'Saved to Recipes'); }} />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
