import { useState, useRef, useEffect } from "react";
import { View, TextInput, TouchableOpacity, Animated, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = "Buscar tiendas, comida, súper...",
  onFilterPress,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E2E8F0", "#6C4CF1"],
  });

  const backgroundColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#F8FAFC", "#FFFFFF"],
  });

  return (
    <View className="flex-row items-center space-x-3 w-full">
      {/* Search Input Container */}
      <Animated.View
        className="flex-1 flex-row items-center rounded-2xl px-4"
        style={{
          borderWidth: 1.5,
          borderColor,
          backgroundColor,
          height: 48,
          ...Platform.select({
            web: {
              boxShadow: isFocused
                ? "0 4px 12px rgba(108, 76, 241, 0.08)"
                : "0 1px 2px rgba(0, 0, 0, 0.02)",
              transition: "all 0.2s ease",
            },
            default: {
              shadowColor: isFocused ? "#6C4CF1" : "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isFocused ? 0.08 : 0.02,
              shadowRadius: 6,
              elevation: isFocused ? 2 : 0,
            },
          }),
        }}
      >
        <Feather
          name="search"
          size={18}
          color={isFocused ? "#6C4CF1" : "#94A3B8"}
          style={{ marginRight: 8 }}
        />
        <TextInput
          ref={inputRef}
          className="flex-1 text-slate-800 text-sm font-medium"
          style={{
            height: "100%",
            paddingVertical: 0,
            ...Platform.select({
              web: { outlineStyle: "none" },
            }),
          } as any}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => onChangeText("")}
            className="w-6 h-6 rounded-full bg-slate-200/60 items-center justify-center active:bg-slate-350"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Feather name="x" size={13} color="#475569" />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Filter Button (Pill/Square Accent) */}
      <TouchableOpacity
        onPress={onFilterPress}
        className="w-12 h-12 bg-brand-50 border border-brand-100/40 rounded-2xl items-center justify-center active:scale-95"
        activeOpacity={0.7}
        style={{
          ...Platform.select({
            web: {
              boxShadow: "0 2px 8px rgba(108, 76, 241, 0.06)",
            },
            default: {
              shadowColor: "#6C4CF1",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 1,
            },
          }),
        }}
      >
        <Feather name="sliders" size={18} color="#6C4CF1" />
      </TouchableOpacity>
    </View>
  );
}
